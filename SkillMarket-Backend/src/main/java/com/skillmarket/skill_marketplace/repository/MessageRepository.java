package com.skillmarket.skill_marketplace.repository;

import com.skillmarket.skill_marketplace.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    // Mark all messages in a booking as read, except ones sent by the current user
    // (i.e. mark the OTHER person's messages as read when I open the chat)
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true " +
            "WHERE m.bookingId = :bookingId AND m.sender.id != :currentUserId AND m.isRead = false")
    void markAsRead(@Param("bookingId") Long bookingId, @Param("currentUserId") Long currentUserId);

    // Unread count for a single booking, excluding messages the current user sent themselves
    @Query("SELECT COUNT(m) FROM Message m " +
            "WHERE m.bookingId = :bookingId AND m.sender.id != :currentUserId AND m.isRead = false")
    Long countUnreadByBooking(@Param("bookingId") Long bookingId, @Param("currentUserId") Long currentUserId);

    // Total unread messages across a set of booking IDs, excluding messages sent by the current user
    @Query("SELECT COUNT(m) FROM Message m " +
            "WHERE m.bookingId IN :bookingIds AND m.sender.id != :currentUserId AND m.isRead = false")
    Long countUnreadAcrossBookings(@Param("bookingIds") List<Long> bookingIds, @Param("currentUserId") Long currentUserId);
}