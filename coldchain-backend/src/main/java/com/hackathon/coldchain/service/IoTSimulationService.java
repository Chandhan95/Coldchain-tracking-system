package com.hackathon.coldchain.service;

import com.hackathon.coldchain.entity.*;
import com.hackathon.coldchain.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
@Transactional
public class IoTSimulationService {

    private final ShipmentRepository shipmentRepository;
    private final TemperatureReadingRepository readingRepository;
    private final ExcursionAlertRepository alertRepository;
    private final EmailService emailService;
    private final Random random = new Random();

    public IoTSimulationService(ShipmentRepository shipmentRepository,
                                TemperatureReadingRepository readingRepository,
                                ExcursionAlertRepository alertRepository,
                                EmailService emailService) {
        this.shipmentRepository = shipmentRepository;
        this.readingRepository = readingRepository;
        this.alertRepository = alertRepository;
        this.emailService = emailService;
    }
    @Scheduled(fixedRate = 30000)
    public void simulateIotData() {
        List<Shipment> activeShipments = shipmentRepository.findAll()
                .stream().filter(s -> s.getStatus() == ShipmentStatus.IN_TRANSIT || s.getStatus() == ShipmentStatus.EXCURSION)
                .toList();

        for (Shipment shipment : activeShipments) {
            double minTemp = shipment.getRequiredMinTemp();
            double maxTemp = shipment.getRequiredMaxTemp();
            
            double baseTemp = (minTemp + maxTemp) / 2.0;
            double spread = (random.nextDouble() * 20) - 10; 
            double currentTemp = baseTemp + spread;
            currentTemp = Math.round(currentTemp * 10.0) / 10.0;

            boolean isCompliant = currentTemp >= minTemp && currentTemp <= maxTemp;

            TemperatureReading reading = new TemperatureReading();
            reading.setShipment(shipment);
            reading.setTemperature(currentTemp);
            reading.setIsCompliant(isCompliant);
            reading.setLatitude(12.97 + (random.nextDouble() * 5)); // shifting 5km randomly approx
            reading.setLongitude(77.59 + (random.nextDouble() * 5)); 
            
            readingRepository.save(reading);

            if (!isCompliant) {
                handleNonCompliance(shipment, currentTemp, minTemp, maxTemp);
            } else {
                handleCompliance(shipment);
            }
        }
    }

    private void handleNonCompliance(Shipment shipment, double temp, double min, double max) {
        // Find existing open alert
        List<ExcursionAlert> openAlerts = alertRepository.findByShipmentId(shipment.getId())
                .stream().filter(a -> a.getResolutionStatus() == ResolutionStatus.OPEN || a.getResolutionStatus() == ResolutionStatus.ACKNOWLEDGED)
                .toList();

        if (openAlerts.isEmpty()) {
            // Severity logic
            AlertSeverity severity = calculateSeverity(temp, min, max);
            
            ExcursionAlert newAlert = new ExcursionAlert();
            newAlert.setShipment(shipment);
            newAlert.setAlertType(temp > max ? AlertType.HIGH_TEMP : AlertType.LOW_TEMP);
            newAlert.setSeverity(severity);
            newAlert.setDurationMinutes(5); // Simulated first tick
            
            alertRepository.save(newAlert);
            
            // Trigger Email Notification
            emailService.sendAlertEmail(shipment, newAlert, temp);
        } else {
            ExcursionAlert existingAlert = openAlerts.get(0);
            existingAlert.setDurationMinutes(existingAlert.getDurationMinutes() + 5);
            alertRepository.save(existingAlert);

            // Check if deviation > 30 mins
            if (existingAlert.getDurationMinutes() > 30 && shipment.getStatus() != ShipmentStatus.EXCURSION) {
                shipment.setStatus(ShipmentStatus.EXCURSION);
                shipmentRepository.save(shipment);
            }
        }
    }

    private void handleCompliance(Shipment shipment) {
        // "Auto-resolve when temperature returns to normal"
        List<ExcursionAlert> openAlerts = alertRepository.findByShipmentId(shipment.getId())
                .stream().filter(a -> a.getResolutionStatus() != ResolutionStatus.RESOLVED)
                .toList();

        for (ExcursionAlert alert : openAlerts) {
            alert.setResolutionStatus(ResolutionStatus.RESOLVED);
            alertRepository.save(alert);
            System.out.println("Auto-resolved alert " + alert.getId() + " because temperature normalized.");
        }
    }

    private AlertSeverity calculateSeverity(double temp, double min, double max) {
        double diff = temp > max ? temp - max : min - temp;
        if (diff < 2.0) return AlertSeverity.WARNING;
        if (diff >= 2.0 && diff <= 5.0) return AlertSeverity.CRITICAL;
        return AlertSeverity.SEVERE;
    }
}
