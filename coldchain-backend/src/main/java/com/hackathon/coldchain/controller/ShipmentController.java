package com.hackathon.coldchain.controller;

import com.hackathon.coldchain.entity.Shipment;
import com.hackathon.coldchain.entity.HandoverLog;
import com.hackathon.coldchain.service.ShipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@CrossOrigin(origins = "*")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @PostMapping
    public ResponseEntity<Shipment> createShipment(@RequestBody Shipment shipment, @RequestParam(required = false) Long creatorId) {
        return ResponseEntity.ok(shipmentService.createShipment(shipment, creatorId));
    }

    @GetMapping
    public ResponseEntity<List<Shipment>> getAllShipments() {
        return ResponseEntity.ok(shipmentService.getAllShipments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getShipment(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getShipmentById(id));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Shipment> assignAsset(@PathVariable Long id, @RequestParam Long assetId, @RequestParam(required = false) Long driverId) {
        return ResponseEntity.ok(shipmentService.assignAsset(id, assetId, driverId));
    }

    @PutMapping("/{id}/arrive")
    public ResponseEntity<Shipment> markArrived(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.markArrived(id));
    }

    @PostMapping("/{id}/handover")
    public ResponseEntity<String> recordHandover(@PathVariable Long id, @RequestBody HandoverLog log) {
        Shipment shipment = shipmentService.getShipmentById(id);
        if (shipment == null) return ResponseEntity.notFound().build();
        
        log.setShipment(shipment);
        shipmentService.logHandover(log);
        return ResponseEntity.ok("Handover recorded successfully.");
    }

    @PutMapping("/{id}/deliver")
    public ResponseEntity<Shipment> deliverShipment(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.deliverShipment(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShipment(@PathVariable Long id) {
        shipmentService.deleteShipment(id);
        return ResponseEntity.ok().build();
    }
}
