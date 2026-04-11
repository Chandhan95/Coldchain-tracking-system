package com.hackathon.coldchain.controller;

import com.hackathon.coldchain.entity.TemperatureReading;
import com.hackathon.coldchain.repository.TemperatureReadingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/temperature-readings")
@CrossOrigin(origins = "*")
public class TemperatureReadingController {
    
    private final TemperatureReadingRepository repository;

    public TemperatureReadingController(TemperatureReadingRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<TemperatureReading>> getByShipmentId(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(repository.findByShipmentIdOrderByTimestampDesc(shipmentId));
    }
}
