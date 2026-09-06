package com.workpulse.service;

import com.workpulse.model.Setting;
import com.workpulse.repository.SettingRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SettingsService {
    private final SettingRepository repo;

    public SettingsService(SettingRepository repo) {
        this.repo = repo;
        initDefaults();
    }

    private void initDefaults() {
        if (repo.count() == 0) {
            repo.save(new Setting("idleThresholdSeconds", "60"));
            repo.save(new Setting("pollIntervalSeconds", "1.0"));
            repo.save(new Setting("autoStartMonitoring", "true"));
            repo.save(new Setting("retentionDays", "90"));
        }
    }

    public Map<String, String> getAll() {
        Map<String, String> map = new HashMap<>();
        repo.findAll().forEach(s -> map.put(s.getConfigKey(), s.getConfigValue()));
        return map;
    }

    public void update(String key, String value) {
        repo.save(new Setting(key, value));
    }
}