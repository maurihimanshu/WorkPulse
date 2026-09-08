package com.workpulse.controller;

import com.workpulse.dto.UpdateInfoDto;
import com.workpulse.service.UpdateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/update")
@CrossOrigin(origins = "*")
public class UpdateController {

    private final UpdateService updateService;

    public UpdateController(UpdateService updateService) {
        this.updateService = updateService;
    }

    @GetMapping("/check")
    public ResponseEntity<UpdateInfoDto> checkUpdate(@RequestParam(value = "force", defaultValue = "false") boolean force) {
        UpdateInfoDto updateInfo = updateService.checkForUpdate(force);
        return ResponseEntity.ok(updateInfo);
    }
}
