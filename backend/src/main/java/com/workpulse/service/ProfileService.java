package com.workpulse.service;

import com.workpulse.model.Setting;
import com.workpulse.model.UserProfile;
import com.workpulse.repository.SettingRepository;
import com.workpulse.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ProfileService {
    private final UserProfileRepository repo;

    public ProfileService(UserProfileRepository repo) {
        this.repo = repo;
    }

    public UserProfile getProfile() {
        return repo.findById("default").orElseGet(() -> repo.save(new UserProfile()));
    }

    public UserProfile updateProfile(UserProfile updated) {
        updated.setId("default");
        return repo.save(updated);
    }
}