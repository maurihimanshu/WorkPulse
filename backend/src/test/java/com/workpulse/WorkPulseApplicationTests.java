package com.workpulse;

import com.workpulse.dto.IngestActivityDto;
import com.workpulse.dto.StatsSummaryDto;
import com.workpulse.model.Activity;
import com.workpulse.model.UserProfile;
import com.workpulse.service.ActivityService;
import com.workpulse.service.IngestionService;
import com.workpulse.service.ProfileService;
import com.workpulse.service.StatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class WorkPulseApplicationTests {

    @Autowired
    private IngestionService ingestionService;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private StatsService statsService;

    @Autowired
    private ProfileService profileService;

    @Test
    void contextLoads() {
        assertNotNull(ingestionService);
        assertNotNull(activityService);
        assertNotNull(statsService);
        assertNotNull(profileService);
    }

    @Test
    void testIngestAndRetrieveActivity() {
        IngestActivityDto dto = new IngestActivityDto();
        dto.setAppName("code.exe");
        dto.setWindowTitle("WorkPulse - Visual Studio Code");
        dto.setProcessId(1234);
        dto.setExecutablePath("C:\\Program Files\\VSCode\\Code.exe");
        dto.setStartTime(LocalDateTime.now().minusMinutes(10));
        dto.setEndTime(LocalDateTime.now());
        dto.setActiveTime(500.0);
        dto.setIdleTime(100.0);

        Activity saved = ingestionService.ingestActivity(dto);
        assertNotNull(saved);
        assertNotNull(saved.getId());
        assertEquals("code.exe", saved.getAppName());
        assertEquals("Development", saved.getCategory());

        StatsSummaryDto summary = statsService.getSummary(LocalDate.now(), LocalDate.now());
        assertNotNull(summary);
        assertTrue(summary.getTotalActiveSeconds() > 0);
    }

    @Test
    void testUserProfile() {
        UserProfile profile = profileService.getProfile();
        assertNotNull(profile);
        profile.setName("Himanshu");
        UserProfile updated = profileService.updateProfile(profile);
        assertEquals("Himanshu", updated.getName());
    }
}