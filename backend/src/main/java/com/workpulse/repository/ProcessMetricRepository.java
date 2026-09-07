package com.workpulse.repository;

import com.workpulse.model.ProcessMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProcessMetricRepository extends JpaRepository<ProcessMetric, String> {

    List<ProcessMetric> findByTimestampAfter(LocalDateTime timestamp);

    @Modifying
    @Transactional
    @Query("DELETE FROM ProcessMetric p WHERE p.timestamp < :cutoff")
    void deleteByTimestampBefore(@Param("cutoff") LocalDateTime cutoff);
}