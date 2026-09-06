package com.workpulse.controller;

import com.workpulse.model.Category;
import com.workpulse.repository.CategoryRepository;
import com.workpulse.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    private final SettingsService settingsService;
    private final CategoryRepository categoryRepository;

    public SettingsController(SettingsService settingsService, CategoryRepository categoryRepository) {
        this.settingsService = settingsService;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getSettings() {
        return ResponseEntity.ok(settingsService.getAll());
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> updates) {
        updates.forEach(settingsService::update);
        return ResponseEntity.ok(settingsService.getAll());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> saveCategory(@RequestBody Category category) {
        if (category.getId() == null || category.getId().trim().isEmpty()) {
            category.setId("cat-" + System.currentTimeMillis());
        }
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable String id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}