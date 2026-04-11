package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.ColdChainAsset;
import com.hackathon.coldchain.entity.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ColdChainAssetRepository extends JpaRepository<ColdChainAsset, Long> {
    List<ColdChainAsset> findByStatus(AssetStatus status);
}
