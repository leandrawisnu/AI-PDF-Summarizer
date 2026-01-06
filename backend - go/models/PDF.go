package models

import (
	"gorm.io/gorm"
)

type PDF struct {
	gorm.Model
	Filename       string `gorm:"not null"`
	FileSize       int64  `gorm:"not null"`
	Title          string `gorm:"not null"`
	PageCount      int    `gorm:"not null"`
	Summary        string
	Style          string
	Language       string
	SummaryTime    float64
	SummaryVersion int
	Summaries      []Summaries `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}
