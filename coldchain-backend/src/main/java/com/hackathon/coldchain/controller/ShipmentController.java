package com.hackathon.coldchain.controller;

import com.hackathon.coldchain.entity.Shipment;
import com.hackathon.coldchain.entity.HandoverLog;
import com.hackathon.coldchain.service.ShipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipments")
@CrossOrigin(origins = "*")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @PostMapping
    public ResponseEntity<?> createShipment(@RequestBody Shipment shipment, @RequestParam(required = false) Long creatorId) {
        try {
            return ResponseEntity.ok(shipmentService.createShipment(shipment, creatorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getDeliveredRevenue() {
        List<Shipment> delivered = shipmentService.getDeliveredShipments();
        BigDecimal total = delivered.stream()
                .filter(s -> s.getPrice() != null)
                .map(Shipment::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", total);
        response.put("deliveredShipments", delivered);
        response.put("deliveredCount", delivered.size());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelShipment(@PathVariable Long id) {
        try {
            shipmentService.cancelShipment(id);
            return ResponseEntity.ok("Shipment cancelled successfully.");
        } catch (Exception e) {
            System.err.println("[CANCEL ERROR] shipment " + id + ": " + e.getClass().getSimpleName() + " - " + e.getMessage());
            String msg = e.getMessage();
            if (msg == null || msg.contains("org.") || msg.contains("com.")) msg = "Cancel failed. Please try again.";
            return ResponseEntity.badRequest().body(msg);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShipment(@PathVariable Long id) {
        shipmentService.deleteShipment(id);
        return ResponseEntity.ok().build();
    }
}
