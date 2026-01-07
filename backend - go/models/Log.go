package models

import (
	"gorm.io/gorm"
)

type Log struct {
	gorm.Model
	Method         string  `gorm:"not null;index"` // HTTP method (GET, POST, etc.)
	Path           string  `gorm:"not null;index"` // Request path
	StatusCode     int     `gorm:"not null;index"` // HTTP status code
	IPAddress      string  `gorm:"index"`          // Client IP address
	UserAgent      string  `gorm:"type:text"`      // User agent string
	RequestBody    string  `gorm:"type:text"`      // Request body (for POST/PUT)
	ResponseBody   string  `gorm:"type:text"`      // Response body
	ErrorMessage   string  `gorm:"type:text"`      // Error message if any
	Duration       float64 `gorm:"not null"`       // Request duration in milliseconds
	RequestHeaders string  `gorm:"type:text"`      // Request headers as JSON
	QueryParams    string  `gorm:"type:text"`      // Query parameters
	PDFID          *uint   `gorm:"index"`          // Related PDF ID if applicable
	SummaryID      *uint   `gorm:"index"`          // Related Summary ID if applicable
}
