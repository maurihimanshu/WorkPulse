package com.workpulse.repository;

import com.workpulse.model.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, String> {

    List<Activity> findByStartTimeBetweenOrderByStartTimeDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Activity a WHERE a.startTime >= :start AND a.startTime <= :end " +
           "AND (:search IS NULL OR LOWER(a.appName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.windowTitle) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.startTime DESC")
    Page<Activity> findActivitiesPaged(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT a.appName, SUM(a.activeTime), SUM(a.idleTime), COUNT(a) " +
           "FROM Activity a WHERE a.startTime >= :start AND a.startTime <= :end " +
           "GROUP BY a.appName ORDER BY SUM(a.activeTime) DESC")
    List<Object[]> findTopApplications(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT a.category, SUM(a.activeTime) " +
           "FROM Activity a WHERE a.startTime >= :start AND a.startTime <= :end " +
           "GROUP BY a.category ORDER BY SUM(a.activeTime) DESC")
    List<Object[]> findCategoryBreakdown(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('strftime', '%H', a.startTime), SUM(a.activeTime), SUM(a.idleTime) " +
           "FROM Activity a WHERE a.startTime >= :start AND a.startTime <= :end " +
           "GROUP BY FUNCTION('strftime', '%H', a.startTime) ORDER BY FUNCTION('strftime', '%H', a.startTime) ASC")
    List<Object[]> findHourlyDistribution(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}