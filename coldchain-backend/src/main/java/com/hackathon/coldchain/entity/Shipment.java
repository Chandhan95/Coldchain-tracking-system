package com.hackathon.coldchain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "shipments")
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String shipmentNumber;

    @Enumerated(EnumType.STRING)
    private ProductType productType;

    private Double requiredMinTemp;
    private Double requiredMaxTemp;
    private Integer quantity;

    private String originWarehouse;
    private String destinationWarehouse;

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;

    @ManyToOne
    @JoinColumn(name = "logistics_manager_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User logisticsManager;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User driver;

    @ManyToOne
    @JoinColumn(name = "asset_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ColdChainAsset assignedAsset;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expectedDeliveryDate;
    private LocalDateTime actualDeliveryDate;
}

