package com.hackathon.coldchain.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "cold_chain_assets")
public class ColdChainAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String assetCode;

    @Enumerated(EnumType.STRING)
    private AssetType assetType;

    private String currentLocation;
    private Double temperatureSetpoint;

    @Enumerated(EnumType.STRING)
    private AssetStatus status;
}
