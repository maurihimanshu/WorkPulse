package com.workpulse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workpulse.dto.UpdateInfoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class UpdateService {

    private static final Logger log = LoggerFactory.getLogger(UpdateService.class);
    private static final long CACHE_TTL_MILLIS = 3600_000L; // 1 hour

    @Value("${workpulse.version:0.2.1}")
    private String currentVersion;

    @Value("${workpulse.update.github-repo:maurihimanshu/WorkPulse}")
    private String githubRepo;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    private volatile UpdateInfoDto cachedUpdateInfo = null;
    private volatile long lastCheckTimeMillis = 0;

    public UpdateService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public UpdateInfoDto checkForUpdate(boolean force) {
        long now = System.currentTimeMillis();
        if (!force && cachedUpdateInfo != null && (now - lastCheckTimeMillis < CACHE_TTL_MILLIS)) {
            return cachedUpdateInfo;
        }

        synchronized (this) {
            if (!force && cachedUpdateInfo != null && (System.currentTimeMillis() - lastCheckTimeMillis < CACHE_TTL_MILLIS)) {
                return cachedUpdateInfo;
            }

            String url = "https://api.github.com/repos/" + githubRepo + "/releases/latest";
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("User-Agent", "WorkPulse-App/" + currentVersion)
                        .header("Accept", "application/vnd.github.v3+json")
                        .timeout(Duration.ofSeconds(6))
                        .GET()
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    String rawTag = root.path("tag_name").asText("");
                    String latestVer = rawTag.startsWith("v") || rawTag.startsWith("V") ? rawTag.substring(1) : rawTag;
                    String releaseName = root.path("name").asText("Release " + rawTag);
                    String releaseNotes = root.path("body").asText("");
                    String publishedAt = root.path("published_at").asText("");
                    String htmlUrl = root.path("html_url").asText("https://github.com/" + githubRepo + "/releases");

                    // Select best installer asset (prioritize Windows installer .exe)
                    String downloadUrl = htmlUrl;
                    String assetName = "";
                    long assetSize = 0L;

                    JsonNode assets = root.path("assets");
                    if (assets.isArray()) {
                        JsonNode chosenAsset = null;
                        for (JsonNode asset : assets) {
                            String aName = asset.path("name").asText("").toLowerCase();
                            if (aName.contains("setup") && aName.endsWith(".exe")) {
                                chosenAsset = asset;
                                break;
                            } else if (aName.contains("windows") && aName.endsWith(".exe") && chosenAsset == null) {
                                chosenAsset = asset;
                            } else if (aName.endsWith(".exe") && chosenAsset == null) {
                                chosenAsset = asset;
                            } else if (aName.contains("windows") && aName.endsWith(".zip") && chosenAsset == null) {
                                chosenAsset = asset;
                            }
                        }

                        if (chosenAsset != null) {
                            downloadUrl = chosenAsset.path("browser_download_url").asText(htmlUrl);
                            assetName = chosenAsset.path("name").asText("");
                            assetSize = chosenAsset.path("size").asLong(0L);
                        }
                    }

                    boolean hasUpdate = isHigherVersion(currentVersion, latestVer);

                    UpdateInfoDto dto = new UpdateInfoDto(
                            currentVersion,
                            latestVer,
                            hasUpdate,
                            releaseName,
                            releaseNotes,
                            publishedAt,
                            htmlUrl,
                            downloadUrl,
                            assetName,
                            assetSize,
                            Instant.now().toString()
                    );

                    this.cachedUpdateInfo = dto;
                    this.lastCheckTimeMillis = System.currentTimeMillis();
                    return dto;
                } else {
                    log.warn("GitHub release check returned status {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Failed to check for software updates from GitHub: {}", e.getMessage());
            }

            if (cachedUpdateInfo != null) {
                return cachedUpdateInfo;
            }

            // Fallback when offline or unable to connect
            return new UpdateInfoDto(
                    currentVersion,
                    currentVersion,
                    false,
                    "Current Version: v" + currentVersion,
                    "Unable to check for updates at this time. Please check your internet connection.",
                    "",
                    "https://github.com/" + githubRepo + "/releases",
                    "https://github.com/" + githubRepo + "/releases",
                    "",
                    0L,
                    Instant.now().toString()
            );
        }
    }

    /**
     * Determines whether the latest version string represents a higher version than current.
     * Handles formats like "0.2.1", "v0.2.2", "0.2.10", "1.0.0-rc1".
     */
    public static boolean isHigherVersion(String current, String latest) {
        if (latest == null || latest.isBlank()) {
            return false;
        }
        if (current == null || current.isBlank()) {
            return true;
        }

        List<Integer> currParts = parseVersionNumbers(current);
        List<Integer> latestParts = parseVersionNumbers(latest);

        int maxLen = Math.max(currParts.size(), latestParts.size());
        for (int i = 0; i < maxLen; i++) {
            int c = i < currParts.size() ? currParts.get(i) : 0;
            int l = i < latestParts.size() ? latestParts.get(i) : 0;
            if (l > c) {
                return true;
            } else if (l < c) {
                return false;
            }
        }
        return false;
    }

    private static List<Integer> parseVersionNumbers(String raw) {
        List<Integer> parts = new ArrayList<>();
        String cleaned = raw.trim();
        if (cleaned.startsWith("v") || cleaned.startsWith("V")) {
            cleaned = cleaned.substring(1);
        }
        // Discard any suffix after '-' or '+' (e.g. -beta, +build)
        int dashIdx = cleaned.indexOf('-');
        if (dashIdx > 0) cleaned = cleaned.substring(0, dashIdx);
        int plusIdx = cleaned.indexOf('+');
        if (plusIdx > 0) cleaned = cleaned.substring(0, plusIdx);

        String[] tokens = cleaned.split("\\.");
        for (String t : tokens) {
            try {
                // Extract leading consecutive digits
                StringBuilder numStr = new StringBuilder();
                for (char ch : t.toCharArray()) {
                    if (Character.isDigit(ch)) {
                        numStr.append(ch);
                    } else {
                        break;
                    }
                }
                if (!numStr.isEmpty()) {
                    parts.add(Integer.parseInt(numStr.toString()));
                } else {
                    parts.add(0);
                }
            } catch (NumberFormatException e) {
                parts.add(0);
            }
        }
        return parts;
    }

    public void setCurrentVersion(String currentVersion) {
        this.currentVersion = currentVersion;
    }

    public void setGithubRepo(String githubRepo) {
        this.githubRepo = githubRepo;
    }
}
