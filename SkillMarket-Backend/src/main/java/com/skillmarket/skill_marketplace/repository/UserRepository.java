package com.skillmarket.skill_marketplace.repository;

import com.skillmarket.skill_marketplace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByRefreshToken(String refreshToken);

    @Query(value = """
        SELECT * FROM users u
        WHERE u.role = 'PROVIDER'
        AND u.is_provider_verified = true
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
        AND (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(u.latitude)) *
                cos(radians(u.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(u.latitude))
            )
        ) <= :radiusKm
        ORDER BY (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(u.latitude)) *
                cos(radians(u.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(u.latitude))
            )
        ) ASC
        """, nativeQuery = true)
    List<User> findNearbyProviders(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm
    );
}