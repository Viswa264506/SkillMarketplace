package com.skillmarket.skill_marketplace.service;

import com.skillmarket.skill_marketplace.dto.MessageResponse;
import com.skillmarket.skill_marketplace.dto.UnreadBookingResponse;
import com.skillmarket.skill_marketplace.entity.Booking;
import com.skillmarket.skill_marketplace.entity.Message;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.BookingRepository;
import com.skillmarket.skill_marketplace.repository.MessageRepository;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private MessageResponse toResponse(Message m) {
        return new MessageResponse(
                m.getId(),
                m.getBookingId(),
                m.getSender().getId(),
                m.getSender().getName(),
                m.getContent(),
                m.getIsRead(),
                m.getCreatedAt().toString()
        );
    }

    private Booking getBookingOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    private void assertParticipant(Booking booking, User user) {
        boolean isClient = booking.getClient().getId().equals(user.getId());
        boolean isProvider = booking.getService().getProvider().getId().equals(user.getId());
        if (!isClient && !isProvider) {
            throw new RuntimeException("Unauthorized");
        }
    }

    // GET /api/messages/{bookingId} — fetch chat history, auto-marks the other person's messages as read
    public List<MessageResponse> getMessages(Long bookingId) {
        User currentUser = getCurrentUser();
        Booking booking = getBookingOrThrow(bookingId);
        assertParticipant(booking, currentUser);

        List<Message> messages = messageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);

        // Auto-mark as read: any message in this booking not sent by me is now read
        messageRepository.markAsRead(bookingId, currentUser.getId());

        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // POST /api/messages/{bookingId} — send a message
    public MessageResponse sendMessage(Long bookingId, String content) {
        User currentUser = getCurrentUser();
        Booking booking = getBookingOrThrow(bookingId);
        assertParticipant(booking, currentUser);

        Message message = Message.builder()
                .bookingId(bookingId)
                .sender(currentUser)
                .content(content)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    // Bookings (as client or provider) for the current user
    private List<Booking> getMyBookings(User user) {
        List<Booking> result = new ArrayList<>();
        result.addAll(bookingRepository.findByClientId(user.getId()));
        result.addAll(bookingRepository.findByServiceProviderId(user.getId()));
        return result;
    }

    // GET /api/messages/unread-count — total unread across all of my bookings
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        List<Long> bookingIds = getMyBookings(currentUser).stream()
                .map(Booking::getId)
                .collect(Collectors.toList());

        if (bookingIds.isEmpty()) return 0;

        Long count = messageRepository.countUnreadAcrossBookings(bookingIds, currentUser.getId());
        return count != null ? count : 0;
    }

    // GET /api/messages/unread-by-booking — per-booking breakdown for the notification dropdown
    public List<UnreadBookingResponse> getUnreadByBooking() {
        User currentUser = getCurrentUser();
        List<Booking> myBookings = getMyBookings(currentUser);

        List<UnreadBookingResponse> result = new ArrayList<>();
        for (Booking booking : myBookings) {
            Long unread = messageRepository.countUnreadByBooking(booking.getId(), currentUser.getId());
            if (unread != null && unread > 0) {
                boolean isClient = booking.getClient().getId().equals(currentUser.getId());
                String otherPersonName = isClient
                        ? booking.getService().getProvider().getName()
                        : booking.getClient().getName();

                result.add(new UnreadBookingResponse(
                        booking.getId(),
                        otherPersonName,
                        booking.getService().getTitle(),
                        unread
                ));
            }
        }
        return result;
    }
}