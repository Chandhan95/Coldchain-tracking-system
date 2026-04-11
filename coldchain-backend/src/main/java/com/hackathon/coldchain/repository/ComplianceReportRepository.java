package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.ComplianceReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ComplianceReportRepository extends JpaRepository<ComplianceReport, Long> {
    
    // Aggregate Query: Average compliance per product type
    @Query("SELECT c.shipment.productType, AVG(c.compliancePercentage) FROM ComplianceReport c GROUP BY c.shipment.productType")
    List<Object[]> findAverageCompliancePerProductType();
}
