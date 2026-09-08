package com.workpulse.service;

import com.workpulse.model.Setting;
import com.workpulse.repository.ActivityRepository;
import com.workpulse.repository.SettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class SettingsService {
    private static final Logger logger = LoggerFactory.getLogger(SettingsService.class);

    private final SettingRepository repo;
    private final ActivityRepository activityRepository;

    public SettingsService(SettingRepository repo, ActivityRepository activityRepository) {
        this.repo = repo;
        this.activityRepository = activityRepository;
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

    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOldActivities() {
        try {
            int retentionDays = 90;
            Setting s = repo.findById("retentionDays").orElse(null);
            if (s != null && s.getConfigValue() != null) {
                try {
                    retentionDays = Integer.parseInt(s.getConfigValue().trim());
                } catch (NumberFormatException ignored) {}
            }
            if (retentionDays > 0) {
                LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
                activityRepository.deleteByStartTimeBefore(cutoff);
                logger.info("Automatic retention cleanup executed. Purged activities prior to {}", cutoff);
            }
        } catch (Exception e) {
            logger.warn("Retention cleanup failed: {}", e.getMessage());
        }
    }
}