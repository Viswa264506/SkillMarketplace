package com.skillmarket.skill_marketplace.dto;

import java.util.List;

public class ChatRequest {
    private List<ChatMessage> messages;

    public List<ChatMessage> getMessages() { return messages; }
    public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
}