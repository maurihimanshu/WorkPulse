package com.workpulse.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workpulse.dto.UpdateInfoDto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UpdateServiceTest {

    @Test
    void testIsHigherVersion() {
        // Patch bump
        assertTrue(UpdateService.isHigherVersion("0.2.1", "0.2.2"));
        assertTrue(UpdateService.isHigherVersion("0.2.1", "v0.2.2"));

        // Minor and Major bump
        assertTrue(UpdateService.isHigherVersion("0.2.1", "0.3.0"));
        assertTrue(UpdateService.isHigherVersion("0.2.1", "1.0.0"));

        // Multi-digit version numbers
        assertTrue(UpdateService.isHigherVersion("0.2.1", "0.2.10"));
        assertFalse(UpdateService.isHigherVersion("0.2.10", "0.2.2"));

        // Same version
        assertFalse(UpdateService.isHigherVersion("0.2.1", "0.2.1"));
        assertFalse(UpdateService.isHigherVersion("0.2.1", "v0.2.1"));

        // Lower version
        assertFalse(UpdateService.isHigherVersion("0.2.1", "0.2.0"));
        assertFalse(UpdateService.isHigherVersion("1.0.0", "0.9.9"));

        // Null and blank handling
        assertFalse(UpdateService.isHigherVersion("0.2.1", null));
        assertFalse(UpdateService.isHigherVersion("0.2.1", ""));
        assertTrue(UpdateService.isHigherVersion(null, "0.2.1"));
    }

    @Test
    void testCheckForUpdateFallback() {
        UpdateService updateService = new UpdateService(new ObjectMapper());
        updateService.setCurrentVersion("0.2.1");
        updateService.setGithubRepo("maurihimanshu/WorkPulse-NonExistent-Repo-Testing");

        // Should not throw, should gracefully return offline fallback DTO
        UpdateInfoDto info = updateService.checkForUpdate(true);
        assertNotNull(info);
        assertEquals("0.2.1", info.getCurrentVersion());
        assertFalse(info.isHasUpdate());
    }
}
