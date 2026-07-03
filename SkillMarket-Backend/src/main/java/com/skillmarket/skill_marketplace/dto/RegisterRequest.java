package com.skillmarket.skill_marketplace.dto;

import com.skillmarket.skill_marketplace.entity.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Role role;
    private String phoneNumber;
}