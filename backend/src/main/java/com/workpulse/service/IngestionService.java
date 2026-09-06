package com.workpulse.service;

import com.workpulse.dto.HeartbeatDto;
import com.workpulse.dto.IngestActivityDto;
import com.workpulse.model.Activity;
import com.workpulse.model.Category;
import com.workpulse.repository.ActivityRepository;
import com.workpulse.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class IngestionService {

    private final ActivityRepository activityRepository;
    private final CategoryRepository categoryRepository;
    private final AtomicReference<HeartbeatDto> latestHeartbeat = new AtomicReference<>(new HeartbeatDto());

    public IngestionService(ActivityRepository activityRepository, CategoryRepository categoryRepository) {
        this.activityRepository = activityRepository;
        this.categoryRepository = categoryRepository;
        initDefaultCategories();
    }

    private void initDefaultCategories() {
        if (categoryRepository.count() == 0) {
            categoryRepository.saveAll(List.of(
                new Category("cat-dev", "Development", "#3B82F6", "code,idea,pycharm,eclipse,studio,terminal,cmd,powershell", true, 1.0),
                new Category("cat-comm", "Communication", "#10B981", "slack,teams,discord,outlook,thunderbird,zoom", true, 0.8),
                new Category("cat-doc", "Productivity & Docs", "#8B5CF6", "word,excel,powerpoint,notion,obsidian,acrobat", true, 0.9),
                new Category("cat-browse", "Web Browsing", "#F59E0B", "chrome,firefox,edge,brave,opera,safari", true, 0.6),
                new Category("cat-media", "Entertainment & Media", "#EF4444", "spotify,netflix,youtube,vlc,steam,game", false, 0.1)
            ));
        }
    }

    public Activity ingestActivity(IngestActivityDto dto) {
        String category = resolveCategory(dto.getAppName(), dto.getWindowTitle());
        Activity activity = new Activity(
            UUID.randomUUID().toString(),
            dto.getAppName() != null ? dto.getAppName() : "Unknown",
            dto.getWindowTitle() != null ? dto.getWindowTitle() : "Unknown",
            dto.getProcessId(),
            dto.getExecutablePath(),
            dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now(),
            dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now(),
            dto.getActiveTime() != null ? dto.getActiveTime() : 0.0,
            dto.getIdleTime() != null ? dto.getIdleTime() : 0.0,
            category
        );
        return activityRepository.save(activity);
    }

    public void updateHeartbeat(HeartbeatDto dto) {
        if (dto.getTimestamp() == null) {
            dto.setTimestamp(LocalDateTime.now());
        }
        latestHeartbeat.set(dto);
    }

    public HeartbeatDto getLatestHeartbeat() {
        return latestHeartbeat.get();
    }

    private String resolveCategory(String appName, String title) {
        String search = ((appName != null ? appName : "") + " " + (title != null ? title : "")).toLowerCase();
        List<Category> categories = categoryRepository.findAll();
        for (Category cat : categories) {
            if (cat.getMatchPattern() != null) {
                for (String p : cat.getMatchPattern().split(",")) {
                    if (!p.trim().isEmpty() && search.contains(p.trim().toLowerCase())) {
                        return cat.getName();
                    }
                }
            }
        }
        return "Uncategorized";
    }
}