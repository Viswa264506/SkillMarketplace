package com.skillmarket.skill_marketplace.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "dzytf5quc",
                "api_key", "262972544948873",
                "api_secret", "tzcjVB3sfpHzLOg7odEC4Lc-aWE"
        ));
    }
}