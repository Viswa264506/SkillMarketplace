package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.dto.ChatRequest;
import com.skillmarket.skill_marketplace.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {
        try {
            String reply = chatService.chat(request.getMessages());
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Chat failed: " + e.getMessage()));
        }
    }
}