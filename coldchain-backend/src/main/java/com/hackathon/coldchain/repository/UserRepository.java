package com.hackathon.coldchain.repository;

import com.hackathon.coldchain.entity.User;
import com.hackathon.coldchain.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByRole(UserRole role);
    Optional<User> findByUsername(String username);
}
