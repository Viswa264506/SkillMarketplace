package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.dto.MessageResponse;
import com.skillmarket.skill_marketplace.dto.UnreadBookingResponse;
import com.skillmarket.skill_marketplace.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageService messageService;

    // Fetch chat history for a booking — also auto-marks the other person's messages as read
    @GetMapping("/{bookingId:\\d+}")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long bookingId) {
        return ResponseEntity.ok(messageService.getMessages(bookingId));
    }

    // Send a message in a booking's chat
    @PostMapping("/{bookingId:\\d+}")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(messageService.sendMessage(bookingId, body.get("content")));
        } catch (Exception e) {
            e.printStackTrace(); // TEMP: full trace in backend console
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getClass().getName(),
                    "message", String.valueOf(e.getMessage())
            ));
        }
    }

    // Total unread message count across all of the current user's bookings — for the navbar bell badge
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("unreadCount", messageService.getUnreadCount()));
    }

    // Per-booking unread breakdown — for the bell dropdown
    @GetMapping("/unread-by-booking")
    public ResponseEntity<List<UnreadBookingResponse>> getUnreadByBooking() {
        return ResponseEntity.ok(messageService.getUnreadByBooking());
    }
}