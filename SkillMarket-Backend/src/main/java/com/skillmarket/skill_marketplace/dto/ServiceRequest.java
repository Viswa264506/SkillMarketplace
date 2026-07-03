package com.skillmarket.skill_marketplace.dto;

import lombok.Data;

@Data
public class ServiceRequest {
    private String title;
    private String description;
    private String category;
    private Double price;
    private String imageUrl;
}