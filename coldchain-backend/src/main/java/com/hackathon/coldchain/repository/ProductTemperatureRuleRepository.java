package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.ProductTemperatureRule;
import com.hackathon.coldchain.entity.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProductTemperatureRuleRepository extends JpaRepository<ProductTemperatureRule, Long> {
    Optional<ProductTemperatureRule> findByProductType(ProductType productType);
}
