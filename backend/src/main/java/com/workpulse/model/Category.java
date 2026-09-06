package com.workpulse.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    private String id;
    private String name;
    private String color;
    private String matchPattern;
    private Boolean productive = true;
    private Double weight = 1.0;

    public Category() {}

    public Category(String id, String name, String color, String matchPattern, Boolean productive, Double weight) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.matchPattern = matchPattern;
        this.productive = productive;
        this.weight = weight;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getMatchPattern() { return matchPattern; }
    public void setMatchPattern(String matchPattern) { this.matchPattern = matchPattern; }

    public Boolean getProductive() { return productive; }
    public void setProductive(Boolean productive) { this.productive = productive; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
}