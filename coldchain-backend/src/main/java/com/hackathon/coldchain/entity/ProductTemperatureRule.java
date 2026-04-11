package com.hackathon.coldchain.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "product_temperature_rules")
public class ProductTemperatureRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ProductType productType;

    private Double minTemp;
    private Double maxTemp;
}
