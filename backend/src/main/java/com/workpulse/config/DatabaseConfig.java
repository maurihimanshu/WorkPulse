package com.workpulse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.io.File;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:jdbc:sqlite:data/workpulse.db}")
    private String dbUrl;

    @Bean
    public DataSource dataSource() {
        if (dbUrl != null && dbUrl.startsWith("jdbc:sqlite:")) {
            String filePath = dbUrl.substring("jdbc:sqlite:".length());
            File dbFile = new File(filePath);
            File parentDir = dbFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }
        }

        return DataSourceBuilder.create()
                .driverClassName("org.sqlite.JDBC")
                .url(dbUrl)
                .build();
    }
}