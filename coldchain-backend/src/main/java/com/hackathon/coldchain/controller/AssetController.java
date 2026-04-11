package com.hackathon.coldchain.controller;

import com.hackathon.coldchain.entity.ColdChainAsset;
import com.hackathon.coldchain.entity.AssetStatus;
import com.hackathon.coldchain.repository.ColdChainAssetRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    private final ColdChainAssetRepository assetRepository;

    public AssetController(ColdChainAssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    @GetMapping
    public ResponseEntity<List<ColdChainAsset>> getAllAssets() {
        return ResponseEntity.ok(assetRepository.findAll());
    }

    @GetMapping("/available")
    public ResponseEntity<List<ColdChainAsset>> getAvailableAssets() {
        return ResponseEntity.ok(assetRepository.findByStatus(AssetStatus.AVAILABLE));
    }

    @PostMapping
    public ResponseEntity<ColdChainAsset> createAsset(@RequestBody ColdChainAsset asset) {
        asset.setStatus(AssetStatus.AVAILABLE);
        return ResponseEntity.ok(assetRepository.save(asset));
    }
}
