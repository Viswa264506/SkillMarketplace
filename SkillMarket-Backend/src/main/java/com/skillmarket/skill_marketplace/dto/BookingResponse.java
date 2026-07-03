package com.skillmarket.skill_marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private String serviceName;
    private String clientName;
    private String clientEmail;
    private String providerName;
    private String status;
    private String bookingDate;
    private String notes;

    // Phase F — live tracking fields
    private Double providerLat;
    private Double providerLng;
    private String locationUpdatedAt;
}