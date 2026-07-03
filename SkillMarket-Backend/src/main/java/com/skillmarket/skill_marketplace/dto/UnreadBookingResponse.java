package com.skillmarket.skill_marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnreadBookingResponse {
    private Long bookingId;
    private String otherPersonName;
    private String serviceName;
    private Long unreadCount;
}