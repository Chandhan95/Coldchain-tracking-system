package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.TemperatureReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TemperatureReadingRepository extends JpaRepository<TemperatureReading, Long> {
    List<TemperatureReading> findByShipmentIdOrderByTimestampDesc(Long shipmentId);

    // Aggregate query requirement for Hackathon:
    // Find count of non-compliant readings grouped by asset ID (Total excursions per asset)
    @Query("SELECT t.asset.id, COUNT(t) FROM TemperatureReading t WHERE t.isCompliant = false GROUP BY t.asset.id")
    List<Object[]> findTotalExcursionsPerAsset();
}
