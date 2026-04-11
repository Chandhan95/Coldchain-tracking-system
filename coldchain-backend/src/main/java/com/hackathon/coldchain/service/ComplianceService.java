package com.hackathon.coldchain.service;

import com.hackathon.coldchain.entity.*;
import com.hackathon.coldchain.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ComplianceService {

    private final ComplianceReportRepository reportRepository;
    private final TemperatureReadingRepository readingRepository;
    private final ShipmentRepository shipmentRepository;
    private final ExcursionAlertRepository alertRepository;
    private final UserRepository userRepository;

    public ComplianceService(ComplianceReportRepository reportRepository,
                             TemperatureReadingRepository readingRepository,
                             ShipmentRepository shipmentRepository,
                             ExcursionAlertRepository alertRepository,
                             UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.readingRepository = readingRepository;
        this.shipmentRepository = shipmentRepository;
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
    }

    public ComplianceReport generateReport(Long shipmentId, Long adminId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        List<TemperatureReading> readings = readingRepository.findByShipmentIdOrderByTimestampDesc(shipmentId);
        int total = readings.size();

        if (total == 0) {
            throw new RuntimeException("Cannot generate report. No temperature data available.");
        }

        int compliant = (int) readings.stream().filter(TemperatureReading::getIsCompliant).count();
        int nonCompliant = total - compliant;
        double percentage = ((double) compliant / total) * 100.0;
        percentage = Math.round(percentage * 100.0) / 100.0; // scale to 2 digits

        List<ExcursionAlert> alerts = alertRepository.findByShipmentId(shipmentId);

        ComplianceReport report = new ComplianceReport();
        report.setShipment(shipment);
        report.setTotalReadings(total);
        report.setCompliantReadings(compliant);
        report.setNonCompliantReadings(nonCompliant);
        report.setExcursionCount(alerts.size());
        report.setCompliancePercentage(percentage);
        report.setGeneratedBy(admin);

        return reportRepository.save(report);
    }

    // Required aggregate query call
    public List<Object[]> getAverageComplianceByProduct() {
        return reportRepository.findAverageCompliancePerProductType();
    }
    
    public List<ComplianceReport> getAllReports() {
        return reportRepository.findAll();
    }
}
