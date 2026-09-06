package com.workpulse.service;

import com.workpulse.model.Activity;
import com.workpulse.repository.ActivityRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;

    public ActivityService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public Page<Activity> getActivities(LocalDate startDate, LocalDate endDate, String search, int page, int size) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);
        String term = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return activityRepository.findActivitiesPaged(start, end, term, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startTime")));
    }

    public void deleteActivity(String id) {
        activityRepository.deleteById(id);
    }

    public void clearAllActivities() {
        activityRepository.deleteAll();
    }
}