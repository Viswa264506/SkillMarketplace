package com.skillmarket.skill_marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ServiceResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Double price;
    private String imageUrl;
    private Boolean isAvailable;
    private String providerName;
    private String providerEmail;
    private Long providerId;

    private Double providerLatitude;
    private Double providerLongitude;
    private String providerAddress;

    public Double getProviderLatitude() { return providerLatitude; }
    public void setProviderLatitude(Double providerLatitude) { this.providerLatitude = providerLatitude; }
    public Double getProviderLongitude() { return providerLongitude; }
    public void setProviderLongitude(Double providerLongitude) { this.providerLongitude = providerLongitude; }
}