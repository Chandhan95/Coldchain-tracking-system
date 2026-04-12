package com.hackathon.coldchain.config;
import com.hackathon.coldchain.entity.User;
import com.hackathon.coldchain.entity.UserRole;
import com.hackathon.coldchain.entity.ProductTemperatureRule;
import com.hackathon.coldchain.entity.ProductType;
import com.hackathon.coldchain.repository.UserRepository;
import com.hackathon.coldchain.repository.ProductTemperatureRuleRepository;
import com.hackathon.coldchain.repository.ColdChainAssetRepository;
import com.hackathon.coldchain.entity.ColdChainAsset;
import com.hackathon.coldchain.entity.AssetType;
import com.hackathon.coldchain.entity.AssetStatus;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.List;
@Configuration
public class DatabaseInitializer {

    private final BCryptPasswordEncoder passwordEncoder;

    public DatabaseInitializer(BCryptPasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }
    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, ProductTemperatureRuleRepository ruleRepository, ColdChainAssetRepository assetRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setName("Super Admin");
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(UserRole.ADMIN);
                admin.setEmail("saichandhan_ganji@srmap.edu.in");
                userRepository.save(admin);
                System.out.println("No users found. Created default ADMIN user: admin / admin123");
            } else {
                List<User> existingUsers = userRepository.findAll();
                for (User u : existingUsers) {
                    if (u.getPassword() != null && !u.getPassword().startsWith("$2a$")) {
                        u.setPassword(passwordEncoder.encode(u.getPassword()));
                        userRepository.save(u);
                        System.out.println("Migrated password to BCrypt for user: " + u.getUsername());
                    }
                }
            }
            if (ruleRepository.count() == 0) {
                System.out.println("Initializing Product Temperature Rules...");
                createRule(ruleRepository, ProductType.VACCINE, 2.0, 8.0);
                createRule(ruleRepository, ProductType.FRESH_FOOD, 0.0, 4.0);
                createRule(ruleRepository, ProductType.FROZEN_FOOD, -18.0, -15.0);
                createRule(ruleRepository, ProductType.CHEMICAL, 15.0, 25.0);
                createRule(ruleRepository, ProductType.BLOOD_PRODUCT, 1.0, 6.0);
            }
            if (assetRepository.count() == 0) {
                System.out.println("Initializing Cold Chain Assets...");
                createAsset(assetRepository, "TRUCK-001", AssetType.REFRIGERATED_VAN, 4.0);
                createAsset(assetRepository, "COOLER-002", AssetType.PORTABLE_COOLER, -18.0);
                createAsset(assetRepository, "TRUCK-003", AssetType.REFRIGERATED_VAN, 2.0);
            }
        };
    }

    private void createRule(ProductTemperatureRuleRepository repo, ProductType type, Double min, Double max) {
        ProductTemperatureRule rule = new ProductTemperatureRule();
        rule.setProductType(type);
        rule.setMinTemp(min);
        rule.setMaxTemp(max);
        repo.save(rule);
    }

    private void createAsset(ColdChainAssetRepository repo, String code, AssetType type, Double setpoint) {
        ColdChainAsset asset = new ColdChainAsset();
        asset.setAssetCode(code);
        asset.setAssetType(type);
        asset.setTemperatureSetpoint(setpoint);
        asset.setStatus(AssetStatus.AVAILABLE);
        asset.setCurrentLocation("Central Hub");
        repo.save(asset);
    }
}
