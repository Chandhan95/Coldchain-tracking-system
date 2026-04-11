package com.hackathon.coldchain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ColdchainBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ColdchainBackendApplication.class, args);
    }

}
