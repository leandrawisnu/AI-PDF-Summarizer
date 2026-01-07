package utils

import (
	"backend-go/models"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// LoggingConfig holds configuration for request logging
type LoggingConfig struct {
	DB                *gorm.DB
	EnableDBLogging   bool
	LogRequestBody    bool
	LogResponseBody   bool
	MaxBodySize       int
	SensitivePatterns []string
}

// NewLoggingMiddleware creates a new logging middleware with database support
func NewLoggingMiddleware(config LoggingConfig) fiber.Handler {
	if config.MaxBodySize == 0 {
		config.MaxBodySize = 10000 // Default 10KB
	}

	// Compile sensitive data patterns
	sensitiveRegexes := make([]*regexp.Regexp, 0)
	for _, pattern := range config.SensitivePatterns {
		if re, err := regexp.Compile(pattern); err == nil {
			sensitiveRegexes = append(sensitiveRegexes, re)
		}
	}

	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Capture request body if needed
		var requestBody string
		if config.LogRequestBody && (c.Method() == "POST" || c.Method() == "PUT" || c.Method() == "PATCH") {
			body := c.Body()
			if len(body) > 0 && len(body) <= config.MaxBodySize {
				requestBody = sanitizeData(string(body), sensitiveRegexes)
			} else if len(body) > config.MaxBodySize {
				requestBody = "[Body too large to log]"
			}
		}

		// Capture request headers
		requestHeaders := make(map[string]string)
		c.Request().Header.VisitAll(func(key, value []byte) {
			headerKey := string(key)
			if !isSensitiveHeader(headerKey) {
				requestHeaders[headerKey] = string(value)
			}
		})
		headersJSON, _ := json.Marshal(requestHeaders)

		// Capture query params
		queryParams := string(c.Request().URI().QueryArgs().QueryString())

		// Process request
		err := c.Next()

		// Calculate duration
		duration := time.Since(start).Milliseconds()
		status := c.Response().StatusCode()

		// Capture response body if needed
		var responseBody string
		if config.LogResponseBody {
			respBody := c.Response().Body()
			if len(respBody) > 0 && len(respBody) <= config.MaxBodySize {
				responseBody = sanitizeData(string(respBody), sensitiveRegexes)
			} else if len(respBody) > config.MaxBodySize {
				responseBody = "[Response too large to log]"
			}
		}

		// Console logging
		logLevel := getLogLevel(status)
		fmt.Printf("[%s] [%s] %s %s - %d (%dms)\n", logLevel, c.Method(), c.Path(), c.IP(), status, duration)

		// Database logging
		if config.EnableDBLogging && config.DB != nil {
			// Capture all data BEFORE goroutine to avoid race conditions
			method := c.Method()
			path := c.Path()
			ipAddress := c.IP()
			userAgent := c.Get("User-Agent")

			go func() {
				// Recover from any panics in the goroutine
				defer func() {
					if r := recover(); r != nil {
						fmt.Printf("Recovered from panic in logging goroutine: %v\n", r)
					}
				}()

				// Double check DB is not nil
				if config.DB == nil {
					fmt.Println("Database is nil in logging goroutine")
					return
				}

				// Extract IDs from path if present
				var pdfID, summaryID *uint
				if strings.Contains(path, "/pdf/") {
					if id := extractIDFromPath(path, "pdf"); id > 0 {
						pdfID = &id
					}
				}
				if strings.Contains(path, "/summaries/") {
					if id := extractIDFromPath(path, "summaries"); id > 0 {
						summaryID = &id
					}
				}

				// Get error message if any
				errorMessage := ""
				if err != nil {
					errorMessage = err.Error()
				}

				log := models.Log{
					Method:         method,
					Path:           path,
					StatusCode:     status,
					IPAddress:      ipAddress,
					UserAgent:      userAgent,
					RequestBody:    requestBody,
					ResponseBody:   responseBody,
					ErrorMessage:   errorMessage,
					Duration:       float64(duration),
					RequestHeaders: string(headersJSON),
					QueryParams:    queryParams,
					PDFID:          pdfID,
					SummaryID:      summaryID,
				}

				if err := config.DB.Create(&log).Error; err != nil {
					fmt.Printf("Failed to save log to database: %v\n", err)
				} else {
					fmt.Printf("Log saved successfully: %s %s\n", method, path)
				}
			}()
		}

		return err
	}
}

// Helper functions

func getLogLevel(status int) string {
	switch {
	case status >= 500:
		return "ERROR"
	case status >= 400:
		return "WARN"
	case status >= 300:
		return "INFO"
	default:
		return "INFO"
	}
}

func isSensitiveHeader(header string) bool {
	sensitiveHeaders := []string{
		"authorization",
		"cookie",
		"set-cookie",
		"x-api-key",
		"x-auth-token",
	}

	headerLower := strings.ToLower(header)
	for _, sensitive := range sensitiveHeaders {
		if headerLower == sensitive {
			return true
		}
	}
	return false
}

func sanitizeData(data string, patterns []*regexp.Regexp) string {
	result := data
	for _, pattern := range patterns {
		result = pattern.ReplaceAllString(result, "[REDACTED]")
	}
	return result
}

func extractIDFromPath(path, resource string) uint {
	// Extract ID from path like /pdf/123 or /summaries/456
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if part == resource && i+1 < len(parts) {
			if id, err := strconv.ParseUint(parts[i+1], 10, 32); err == nil {
				return uint(id)
			}
		}
	}
	return 0
}
