package com.hackathon.coldchain.service;

import com.hackathon.coldchain.entity.Shipment;
import com.hackathon.coldchain.entity.ExcursionAlert;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendAlertEmail(Shipment shipment, ExcursionAlert alert, double currentTemp) {
        String logisticsEmail = shipment.getLogisticsManager() != null ? shipment.getLogisticsManager().getEmail() : "admin@coldchain.com";
        String driverEmail = shipment.getDriver() != null ? shipment.getDriver().getEmail() : null;

        String subject = "CRITICAL: Temperature Alert - Shipment " + shipment.getShipmentNumber();
        String text = String.format(
            "Hello,\n\n" +
            "A temperature excursion has been detected for Shipment: %s\n" +
            "Product Type: %s\n" +
            "Current Temperature: %.2f°C\n" +
            "Alert Type: %s\n" +
            "Alert Severity: %s\n" +
            "Please check the cooling unit immediately.\n\n" +
            "Best regards,\n" +
            "ColdChain Sync Monitoring System",
            shipment.getShipmentNumber(),
            shipment.getProductType(),
            currentTemp,
            alert.getAlertType() == com.hackathon.coldchain.entity.AlertType.HIGH_TEMP ? "High Temp" : "Low Temp",
            alert.getSeverity()
        );

        try {
            // Sending to Logistics Manager
            send(logisticsEmail, subject, text);
            
            // Sending to Driver if available
            if (driverEmail != null) {
                send(driverEmail, subject, text);
            }
            
            System.out.println("Email alerts sent successfully for shipment: " + shipment.getShipmentNumber());
        } catch (Exception e) {
            System.err.println("FAILED TO SEND EMAIL: " + e.getMessage());
            System.out.println("Check application.properties SMTP settings.");
        }
    }

    private void send(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("monitoring@coldchainsync.com");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
    
        mailSender.send(message);
        System.out.println("SMTP Sent email to: " + to);
    }
}
