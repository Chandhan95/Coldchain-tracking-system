package com.hackathon.coldchain.service;

import com.hackathon.coldchain.entity.*;
import com.hackathon.coldchain.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class AlertService {
    
    private final ExcursionAlertRepository alertRepository;
    private final UserRepository userRepository;

    public AlertService(ExcursionAlertRepository alertRepository, UserRepository userRepository) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
    }

    public List<ExcursionAlert> getOpenAlerts() {
        return alertRepository.findByResolutionStatus(ResolutionStatus.OPEN);
    }

    public ExcursionAlert acknowledgeAlert(Long alertId, Long userId) {
        ExcursionAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
                
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (alert.getResolutionStatus() != ResolutionStatus.OPEN) {
            throw new RuntimeException("Alert is already acknowledged or resolved.");
        }

        // Rule Check: Acknowledge within 15 mins (Logic for display or warning)
        if (LocalDateTime.now().minusMinutes(15).isAfter(alert.getTriggeredAt())) {
            // In a real system, we would escalate here. For hackathon, just log or mark.
            System.out.println("ESCALATION: Alert " + alertId + " was not acknowledged within 15 minutes!");
        }

        alert.setResolutionStatus(ResolutionStatus.ACKNOWLEDGED);
        alert.setAcknowledgedBy(user);
        alert.setAcknowledgedAt(LocalDateTime.now());
        
        return alertRepository.save(alert);
    }

    public ExcursionAlert resolveAlert(Long alertId) {
        ExcursionAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        alert.setResolutionStatus(ResolutionStatus.RESOLVED);
        return alertRepository.save(alert);
    }
}
