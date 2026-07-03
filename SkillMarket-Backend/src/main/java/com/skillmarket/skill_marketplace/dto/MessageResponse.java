package com.skillmarket.skill_marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private Long bookingId;
    private Long senderId;
    private String senderName;
    private String content;
    private Boolean isRead;
    private String createdAt;
}