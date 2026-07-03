package com.skillmarket.skill_marketplace.config;

import com.skillmarket.skill_marketplace.entity.Role;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import com.skillmarket.skill_marketplace.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        Optional<User> existing = userRepository.findByEmail(email);

        User user;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            // Register new OAuth user as CLIENT by default
            user = User.builder()
                    .name(name)
                    .email(email)
                    .password("OAUTH_USER_" + UUID.randomUUID())
                    .role(Role.CLIENT)
                    .profileImageUrl(picture)
                    .isActive(true)
                    .isVerified(true)
                    .build();
            userRepository.save(user);
        }

        String refreshToken = UUID.randomUUID().toString();
        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
        userRepository.save(user);

        String token = jwtService.generateToken(user);

        // Redirect to frontend with token
       String baseUrl = frontendUrl.endsWith("/")
        ? frontendUrl.substring(0, frontendUrl.length() - 1)
        : frontendUrl;

String redirectUrl = baseUrl + "/oauth/callback?token=" + token
        + "&refreshToken=" + refreshToken
        + "&name=" + java.net.URLEncoder.encode(name, "UTF-8")
        + "&email=" + java.net.URLEncoder.encode(email, "UTF-8")
        + "&role=" + user.getRole().name();

        response.sendRedirect(redirectUrl);
    }
}
