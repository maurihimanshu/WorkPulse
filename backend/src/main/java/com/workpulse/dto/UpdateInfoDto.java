package com.workpulse.dto;

public class UpdateInfoDto {
    private String currentVersion;
    private String latestVersion;
    private boolean hasUpdate;
    private String releaseName;
    private String releaseNotes;
    private String publishedAt;
    private String releaseUrl;
    private String downloadUrl;
    private String assetName;
    private long assetSize;
    private String checkedAt;

    public UpdateInfoDto() {}

    public UpdateInfoDto(String currentVersion, String latestVersion, boolean hasUpdate,
                         String releaseName, String releaseNotes, String publishedAt,
                         String releaseUrl, String downloadUrl, String assetName,
                         long assetSize, String checkedAt) {
        this.currentVersion = currentVersion;
        this.latestVersion = latestVersion;
        this.hasUpdate = hasUpdate;
        this.releaseName = releaseName;
        this.releaseNotes = releaseNotes;
        this.publishedAt = publishedAt;
        this.releaseUrl = releaseUrl;
        this.downloadUrl = downloadUrl;
        this.assetName = assetName;
        this.assetSize = assetSize;
        this.checkedAt = checkedAt;
    }

    public String getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(String currentVersion) { this.currentVersion = currentVersion; }

    public String getLatestVersion() { return latestVersion; }
    public void setLatestVersion(String latestVersion) { this.latestVersion = latestVersion; }

    public boolean isHasUpdate() { return hasUpdate; }
    public void setHasUpdate(boolean hasUpdate) { this.hasUpdate = hasUpdate; }

    public String getReleaseName() { return releaseName; }
    public void setReleaseName(String releaseName) { this.releaseName = releaseName; }

    public String getReleaseNotes() { return releaseNotes; }
    public void setReleaseNotes(String releaseNotes) { this.releaseNotes = releaseNotes; }

    public String getPublishedAt() { return publishedAt; }
    public void setPublishedAt(String publishedAt) { this.publishedAt = publishedAt; }

    public String getReleaseUrl() { return releaseUrl; }
    public void setReleaseUrl(String releaseUrl) { this.releaseUrl = releaseUrl; }

    public String getDownloadUrl() { return downloadUrl; }
    public void setDownloadUrl(String downloadUrl) { this.downloadUrl = downloadUrl; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public long getAssetSize() { return assetSize; }
    public void setAssetSize(long assetSize) { this.assetSize = assetSize; }

    public String getCheckedAt() { return checkedAt; }
    public void setCheckedAt(String checkedAt) { this.checkedAt = checkedAt; }
}
