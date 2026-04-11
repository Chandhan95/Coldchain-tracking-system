package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.HandoverLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HandoverLogRepository extends JpaRepository<HandoverLog, Long> {
    List<HandoverLog> findByShipmentId(Long shipmentId);
}
