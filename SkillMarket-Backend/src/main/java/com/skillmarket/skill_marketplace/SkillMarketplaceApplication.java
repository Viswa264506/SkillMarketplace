package com.skillmarket.skill_marketplace;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class SkillMarketplaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillMarketplaceApplication.class, args);
    }

    @Bean
    CommandLineRunner generateHash() {
        return args -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            System.out.println("=================================");
            System.out.println("Password: admin123");
            System.out.println("Hash: " + encoder.encode("admin123"));
            System.out.println("=================================");
        };
    }
}
