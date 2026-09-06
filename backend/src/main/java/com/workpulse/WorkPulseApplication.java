package com.workpulse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class WorkPulseApplication {

    public static void main(String[] args) {
        // Ensure data directory exists for SQLite
        File dataDir = new File("data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }

        SpringApplication.run(WorkPulseApplication.class, args);
    }
}