package com.hackathon.coldchain.controller;

import com.hackathon.coldchain.entity.ComplianceReport;
import com.hackathon.coldchain.service.ComplianceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compliance")
@CrossOrigin(origins = "*")
public class ComplianceController {

    private final ComplianceService complianceService;

    public ComplianceController(ComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    @PostMapping("/report")
    public ResponseEntity<ComplianceReport> generateReport(@RequestParam Long shipmentId, @RequestParam Long adminId) {
        return ResponseEntity.ok(complianceService.generateReport(shipmentId, adminId));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ComplianceReport>> getAllReports() {
        return ResponseEntity.ok(complianceService.getAllReports());
    }
}
