package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.ExcursionAlert;
import com.hackathon.coldchain.entity.ResolutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface ExcursionAlertRepository extends JpaRepository<ExcursionAlert, Long> {
    List<ExcursionAlert> findByShipmentId(Long shipmentId);
    List<ExcursionAlert> findByResolutionStatus(ResolutionStatus status);

    // Aggregate Query: Alerts count per severity per month
    @Query("SELECT e.severity, MONTH(e.triggeredAt), COUNT(e) FROM ExcursionAlert e GROUP BY e.severity, MONTH(e.triggeredAt)")
    List<Object[]> findAlertsCountPerSeverityPerMonth();
}
