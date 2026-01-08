package models

import (
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type Summaries struct {
	gorm.Model
	Style       string          `gorm:"not null"`
	Content     string          `gorm:"not null"`
	PDFID       uint            `gorm:"not null;index"`
	Language    string          `gorm:"not null"`
	SummaryTime float64         `gorm:"not null"`
	Embedding   pgvector.Vector `gorm:"type:vector(1024)"`
	PDF         PDF             `gorm:"foreignKey:PDFID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}
