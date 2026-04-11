package com.hackathon.coldchain.service;

import com.hackathon.coldchain.entity.*;
import com.hackathon.coldchain.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ColdChainAssetRepository assetRepository;
    private final HandoverLogRepository handoverLogRepository;
    private final ProductTemperatureRuleRepository ruleRepository;
    private final UserRepository userRepository;
    private final TemperatureReadingRepository readingRepository;
    private final ExcursionAlertRepository alertRepository;

    public ShipmentService(ShipmentRepository shipmentRepository, 
                           ColdChainAssetRepository assetRepository,
                           HandoverLogRepository handoverLogRepository,
                           ProductTemperatureRuleRepository ruleRepository,
                           UserRepository userRepository,
                           TemperatureReadingRepository readingRepository,
                           ExcursionAlertRepository alertRepository) {
        this.shipmentRepository = shipmentRepository;
        this.assetRepository = assetRepository;
        this.handoverLogRepository = handoverLogRepository;
        this.ruleRepository = ruleRepository;
        this.userRepository = userRepository;
        this.readingRepository = readingRepository;
        this.alertRepository = alertRepository;
    }

    public Shipment createShipment(Shipment shipment, Long creatorId) {
        ProductTemperatureRule rule = ruleRepository.findByProductType(shipment.getProductType())
                .orElseThrow(() -> new RuntimeException("Rule not found for product type"));
                
        shipment.setRequiredMinTemp(rule.getMinTemp());
        shipment.setRequiredMaxTemp(rule.getMaxTemp());
        shipment.setStatus(ShipmentStatus.CREATED);

        if (creatorId != null) {
            userRepository.findById(creatorId).ifPresent(shipment::setLogisticsManager);
        }
        
        return shipmentRepository.save(shipment);
    }

    public Shipment assignAsset(Long shipmentId, Long assetId, Long driverId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
                
        if (shipment.getStatus() != ShipmentStatus.CREATED) {
            throw new RuntimeException("Shipment must be in CREATED state to assign an asset.");
        }

        ColdChainAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new RuntimeException("Asset must be AVAILABLE to assign.");
        }

        if (driverId != null) {
            User driver = userRepository.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            shipment.setDriver(driver);
        }

        asset.setStatus(AssetStatus.IN_TRANSIT);
        assetRepository.save(asset);

        shipment.setAssignedAsset(asset); // Link the asset to shipment
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        return shipmentRepository.save(shipment);
    }

    public Shipment markArrived(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        if (shipment.getStatus() != ShipmentStatus.IN_TRANSIT && shipment.getStatus() != ShipmentStatus.EXCURSION) {
            throw new RuntimeException("Only IN_TRANSIT shipments can be marked as ARRIVED.");
        }

        shipment.setStatus(ShipmentStatus.ARRIVED);
        return shipmentRepository.save(shipment);
    }

    public void logHandover(HandoverLog log) {
        handoverLogRepository.save(log);
    }

    public Shipment deliverShipment(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            throw new RuntimeException("Shipment is already DELIVERED.");
        }

        if (shipment.getStatus() != ShipmentStatus.ARRIVED) {
            throw new RuntimeException("Shipment must be marked as ARRIVED before delivery.");
        }

        if (shipment.getStatus() == ShipmentStatus.EXCURSION) {
            throw new RuntimeException("Cannot deliver shipment with active EXCURSION.");
        }

        List<HandoverLog> logs = handoverLogRepository.findByShipmentId(shipmentId);
        if (logs.isEmpty()) {
            throw new RuntimeException("Cannot deliver. Missing Handover log.");
        }

        shipment.setStatus(ShipmentStatus.DELIVERED);
        shipment.setActualDeliveryDate(java.time.LocalDateTime.now());
        
        // Safety: Release the asset back to AVAILABLE pool
        if (shipment.getAssignedAsset() != null) {
            ColdChainAsset asset = shipment.getAssignedAsset();
            asset.setStatus(AssetStatus.AVAILABLE);
            assetRepository.save(asset);
            
            // We keep the reference in delivered shipments for history, 
            // but the asset is now free for others.
        }
        
        return shipmentRepository.save(shipment);
    }

    public void deleteShipment(Long id) {
        shipmentRepository.findById(id).ifPresent(shipment -> {
            // 1. Delete associated children to avoid foreign key constraints
            readingRepository.deleteAll(readingRepository.findByShipmentIdOrderByTimestampDesc(id));
            alertRepository.deleteAll(alertRepository.findByShipmentId(id));
            handoverLogRepository.deleteAll(handoverLogRepository.findByShipmentId(id));

            // 2. RELEASE the asset
            if (shipment.getAssignedAsset() != null) {
                ColdChainAsset asset = shipment.getAssignedAsset();
                asset.setStatus(AssetStatus.AVAILABLE);
                assetRepository.save(asset);
                
                // DETACH the asset from the shipment to prevent any Cascade deletion problem
                shipment.setAssignedAsset(null);
                shipmentRepository.saveAndFlush(shipment);
            }
            
            // 3. Finally delete the shipment
            shipmentRepository.delete(shipment);
        });
    }

    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }
    
    public Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id).orElse(null);
    }
}
