package com.hackathon.coldchain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "compliance_reports")
public class ComplianceReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shipment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Shipment shipment;

    private Integer totalReadings;
    private Integer compliantReadings;
    private Integer nonCompliantReadings;
    private Integer excursionCount;
    private Double compliancePercentage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "generated_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User generatedBy;

    private LocalDateTime generatedAt = LocalDateTime.now();
}
