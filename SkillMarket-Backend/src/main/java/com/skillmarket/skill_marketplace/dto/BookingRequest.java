package com.skillmarket.skill_marketplace.dto;

import lombok.Data;

@Data
public class BookingRequest {
    private Long serviceId;
    private String bookingDate;
    private String notes;
}