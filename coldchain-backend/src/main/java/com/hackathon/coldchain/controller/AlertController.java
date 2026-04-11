package com.hackathon.coldchain.controller;

import com.hackathon.coldchain.entity.ExcursionAlert;
import com.hackathon.coldchain.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping("/open")
    public ResponseEntity<List<ExcursionAlert>> getOpenAlerts() {
        return ResponseEntity.ok(alertService.getOpenAlerts());
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<ExcursionAlert> acknowledgeAlert(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(alertService.acknowledgeAlert(id, userId));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ExcursionAlert> resolveAlert(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.resolveAlert(id));
    }
}
