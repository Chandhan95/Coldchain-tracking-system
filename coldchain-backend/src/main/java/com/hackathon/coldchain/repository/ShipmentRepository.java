package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    // JOIN Query Requirement for Hackathon
    // Fetches shipment with its latest active excursion alert (if any)
    @Query("SELECT s FROM Shipment s LEFT JOIN FETCH ExcursionAlert e ON e.shipment = s WHERE s.id = :id AND (e IS NULL OR e.resolutionStatus = 'OPEN')")
    Optional<Shipment> findShipmentWithActiveAlerts(@Param("id") Long id);
}
