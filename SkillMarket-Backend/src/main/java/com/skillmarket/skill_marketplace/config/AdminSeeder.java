package com.skillmarket.skill_marketplace.config;

import com.skillmarket.skill_marketplace.entity.Role;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        String adminEmail = "admin@gmail.com";

        if (userRepository.findByEmail(adminEmail).isEmpty()) {

            User admin = User.builder()
                    .name("Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .isActive(true)
                    .isVerified(true)
                    .isProviderVerified(true)
                    .build();

            userRepository.save(admin);

            System.out.println("====================================");
            System.out.println("✅ Admin account created successfully");
            System.out.println("Email    : admin@gmail.com");
            System.out.println("Password : admin123");
            System.out.println("====================================");
        } else {
            System.out.println("✅ Admin account already exists.");
        }
    }
}
