package com.hackathon.coldchain.controller;

import com.hackathon.coldchain.entity.User;
import com.hackathon.coldchain.entity.UserRole;
import com.hackathon.coldchain.entity.Shipment;
import com.hackathon.coldchain.entity.ShipmentStatus;
import com.hackathon.coldchain.repository.ShipmentRepository;
import com.hackathon.coldchain.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;

    public UserController(UserRepository userRepository, ShipmentRepository shipmentRepository) {
        this.userRepository = userRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable UserRole role) {
        return ResponseEntity.ok(userRepository.findByRole(role));
    }

    @GetMapping("/role/{role}/available")
    public ResponseEntity<List<User>> getAvailableUsersByRole(@PathVariable UserRole role) {
        List<User> allRoleUsers = userRepository.findByRole(role);
        
        List<Long> busyUserIds = shipmentRepository.findAll().stream()
                .filter(s -> s.getStatus() == ShipmentStatus.ASSIGNED || 
                             s.getStatus() == ShipmentStatus.IN_TRANSIT || 
                             s.getStatus() == ShipmentStatus.ARRIVED || 
                             s.getStatus() == ShipmentStatus.EXCURSION)
                .filter(s -> s.getDriver() != null)
                .map(s -> s.getDriver().getId())
                .collect(Collectors.toList());

        List<User> availableUsers = allRoleUsers.stream()
                .filter(u -> !busyUserIds.contains(u.getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(availableUsers);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
        }
        return ResponseEntity.ok(userRepository.save(user));
    }
}
