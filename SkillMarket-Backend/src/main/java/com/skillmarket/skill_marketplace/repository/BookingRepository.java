package com.skillmarket.skill_marketplace.repository;

import com.skillmarket.skill_marketplace.entity.Booking;
import com.skillmarket.skill_marketplace.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByClientEmail(String email);

    List<Booking> findByServiceProviderEmail(String email);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByClientId(Long clientId);

    List<Booking> findByServiceProviderId(Long providerId);
}