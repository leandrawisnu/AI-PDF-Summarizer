package main

import (
	"backend-go/dto"
	"backend-go/models"
	"backend-go/utils"
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/extemporalgenome/npdfpages"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=ai_pdf_management port=5432 sslmode=disable TimeZone=Asia/Shanghai"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		panic("failed to connect database")
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: utils.ErrorHandler,
	})

	// Apply middleware
	app.Use(utils.CORSMiddleware())
	app.Use(utils.LoggingMiddleware())
	app.Use(utils.RateLimitMiddleware())

	// Allow origin from localhost:3000
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept",
		AllowCredentials: true,
	}))

	app.Get("/ping", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "pong",
		})
	})

	// Enhanced health check
	app.Get("/health", func(c *fiber.Ctx) error {
		// Check database connection
		sqlDB, err := db.DB()
		if err != nil {
			return c.Status(503).JSON(fiber.Map{
				"status":   "unhealthy",
				"database": "disconnected",
				"error":    err.Error(),
			})
		}

		if err := sqlDB.Ping(); err != nil {
			return c.Status(503).JSON(fiber.Map{
				"status":   "unhealthy",
				"database": "unreachable",
				"error":    err.Error(),
			})
		}

		// Get basic stats
		var pdfCount, summaryCount int64
		db.Model(&models.PDF{}).Count(&pdfCount)
		db.Model(&models.Summaries{}).Count(&summaryCount)

		return c.JSON(fiber.Map{
			"status":          "healthy",
			"database":        "connected",
			"total_pdfs":      pdfCount,
			"total_summaries": summaryCount,
			"version":         "1.0.0",
		})
	})

	app.Get("/pdf", func(c *fiber.Ctx) error {
		var pdfs []models.PDF

		// Pagination parameters with validation
		page := c.QueryInt("page", 1)
		itemsPerPage := c.QueryInt("itemsperpage", 10)

		if page < 1 {
			page = 1
		}
		if itemsPerPage < 1 || itemsPerPage > 100 {
			itemsPerPage = 10
		}

		// Calculate offset from page and itemsPerPage
		offset := (page - 1) * itemsPerPage
		limit := itemsPerPage

		// Other query parameters
		sortBy := c.Query("sort", "created_at")
		order := c.Query("order", "desc")
		search := c.Query("search", "")

		// Validate sort parameters
		validSortFields := map[string]bool{
			"created_at": true,
			"updated_at": true,
			"title":      true,
			"file_size":  true,
			"page_count": true,
		}
		if !validSortFields[sortBy] {
			sortBy = "created_at"
		}
		if order != "asc" && order != "desc" {
			order = "desc"
		}

		query := db.Model(&models.PDF{})

		if search != "" {
			query = query.Where("title ILIKE ? OR filename ILIKE ?", "%"+search+"%", "%"+search+"%")
		}

		// Get total count for pagination
		var totalCount int64
		if err := query.Count(&totalCount).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to count PDFs",
				"details": err.Error(),
			})
		}

		// Calculate total pages
		totalPages := int((totalCount + int64(itemsPerPage) - 1) / int64(itemsPerPage))

		if err := query.Preload("Summaries").Order(fmt.Sprintf("%s %s", sortBy, order)).Limit(limit).Offset(offset).Find(&pdfs).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to fetch PDFs",
				"details": err.Error(),
			})
		}

		response := dto.PDFListResponse{
			Data:         utils.ConvertPDFsToResponse(pdfs),
			Page:         page,
			ItemsPerPage: itemsPerPage,
			TotalPages:   totalPages,
			TotalItems:   totalCount,
		}

		return c.Status(200).JSON(response)
	})

	app.Get("/pdf/count", func(c *fiber.Ctx) error {
		var count int64

		if err := db.Model(&models.PDF{}).Count(&count).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"message": "Failed to count PDFs: " + err.Error(),
			})
		}

		response := dto.PDFCountResponse{
			Count: count,
		}

		return c.Status(200).JSON(response)
	})

	app.Post("/pdf", func(c *fiber.Ctx) error {
		var req dto.PDFCreateRequest

		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"message": "Invalid request body: " + err.Error(),
			})
		}

		// Convert DTO to model
		pdf := models.PDF{
			Filename:  req.Filename,
			FileSize:  req.FileSize,
			Title:     req.Title,
			PageCount: req.PageCount,
		}

		if err := db.Create(&pdf).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"message": "Failed to create PDF record: " + err.Error(),
			})
		}

		// Convert model to response DTO
		response := utils.ConvertPDFToResponse(pdf)
		return c.Status(201).JSON(response)
	})

	app.Get("/pdf/:id", func(c *fiber.Ctx) error {
		var pdf models.PDF

		if err := db.Preload("Summaries").First(&pdf, c.Params("id")).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"message": "PDF not found",
			})
		}

		response := utils.ConvertPDFToResponse(pdf)
		return c.Status(200).JSON(response)
	})

	app.Get("/pdf/:id/download", func(c *fiber.Ctx) error {
		var pdf models.PDF

		if err := db.First(&pdf, c.Params("id")).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error":   "not_found",
				"message": "PDF not found",
			})
		}

		filePath := filepath.Join("uploads", pdf.Filename)

		// Check if file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			return c.Status(404).JSON(fiber.Map{
				"error":   "file_not_found",
				"message": "PDF file not found on server",
			})
		}

		// Set appropriate headers for file download
		c.Set("Content-Type", "application/pdf")
		c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", pdf.Title+".pdf"))

		return c.SendFile(filePath)
	})

	app.Delete("/pdf/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		var pdf models.PDF

		db.First(&pdf, id)

		if pdf.ID == 0 {
			return c.Status(404).JSON(fiber.Map{
				"message": "PDF not found",
			})
		}

		filePath := filepath.Join("uploads", pdf.Filename)
		if _, err := os.Stat(filePath); err == nil {
			if err := os.Remove(filePath); err != nil {
				return c.Status(500).JSON(fiber.Map{
					"message": "Failed to delete file",
				})
			}
		} else if !os.IsNotExist(err) {
			return c.Status(500).JSON(fiber.Map{
				"message": "Failed to check file existence",
			})
		}

		db.Delete(&pdf)

		return c.Status(200).JSON(fiber.Map{
			"message": "PDF deleted successfully",
		})
	})

	app.Post("/pdf/upload", func(c *fiber.Ctx) error {
		file, err := c.FormFile("file")
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_request",
				"message": "File is required",
			})
		}

		// Validate file extension
		if err := utils.ValidateFileExtension(file.Filename); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_file",
				"message": err.Error(),
			})
		}

		// Validate file size
		if err := utils.ValidateFileSize(file.Size); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_file",
				"message": err.Error(),
			})
		}

		// Get title from form data, fallback to filename without extension
		title := c.FormValue("title")
		if title == "" {
			ext := filepath.Ext(file.Filename)
			title = strings.TrimSuffix(file.Filename, ext)
		}

		// Validate title
		if err := utils.ValidateTitle(title); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_title",
				"message": err.Error(),
			})
		}

		if err := os.MkdirAll("./uploads", os.ModePerm); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "server_error",
				"message": "Failed to create upload directory",
				"details": err.Error(),
			})
		}

		ext := filepath.Ext(file.Filename)
		filename := uuid.New().String() + ext

		if err := c.SaveFile(file, "./uploads/"+filename); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "server_error",
				"message": "Failed to save file",
				"details": err.Error(),
			})
		}

		// Get page count
		pageCount := npdfpages.PagesAtPath(filepath.Join("uploads", filename))
		if pageCount <= 0 {
			// Clean up the uploaded file if it's invalid
			os.Remove(filepath.Join("uploads", filename))
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_file",
				"message": "Invalid PDF file or unable to read page count",
			})
		}

		pdf := models.PDF{
			Filename:  filename,
			FileSize:  file.Size,
			Title:     title,
			PageCount: pageCount,
		}

		if err := db.Create(&pdf).Error; err != nil {
			// Clean up the uploaded file if database save fails
			os.Remove(filepath.Join("uploads", filename))
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to create PDF record",
				"details": err.Error(),
			})
		}

		response := utils.ConvertPDFToResponse(pdf)
		return c.Status(201).JSON(response)
	})

	app.Post("/pdf/:id/summarize", func(c *fiber.Ctx) error {
		var req dto.SummarizeRequest

		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_request",
				"message": "Invalid request body",
				"details": err.Error(),
			})
		}

		// Validate style and language
		if err := utils.ValidateSummaryStyle(req.Style); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_style",
				"message": err.Error(),
			})
		}

		if err := utils.ValidateLanguage(req.Language); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_language",
				"message": err.Error(),
			})
		}

		id := c.Params("id")
		var pdf models.PDF

		if err := db.First(&pdf, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(404).JSON(fiber.Map{
					"error":   "not_found",
					"message": "PDF not found",
				})
			}
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to find PDF",
				"details": err.Error(),
			})
		}

		filePath := filepath.Join("uploads", pdf.Filename)
		file, err := os.Open(filePath)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "file_error",
				"message": "Failed to open PDF file",
				"details": err.Error(),
			})
		}
		defer file.Close()

		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		filePart, err := writer.CreateFormFile("file", pdf.Filename)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "server_error",
				"message": "Failed to create form file",
				"details": err.Error(),
			})
		}
		io.Copy(filePart, file)

		writer.WriteField("style", req.Style)
		writer.WriteField("language", req.Language)
		writer.Close()

		httpReq, _ := http.NewRequest(
			"POST",
			"http://127.0.0.1:8000/summarize",
			body,
		)
		httpReq.Header.Set("Content-Type", writer.FormDataContentType())

		client := &http.Client{}
		resp, err := client.Do(httpReq)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "backend_error",
				"message": "Failed to connect to Python backend",
				"details": err.Error(),
			})
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			bodyBytes, _ := io.ReadAll(resp.Body)
			return c.Status(resp.StatusCode).JSON(fiber.Map{
				"error":   "backend_error",
				"message": "Python backend error",
				"details": string(bodyBytes),
			})
		}

		// Parse response into PythonSummaryResponse struct
		var pythonResponse dto.PythonSummaryResponse
		if err := json.NewDecoder(resp.Body).Decode(&pythonResponse); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "parse_error",
				"message": "Failed to parse response",
				"details": err.Error(),
			})
		}

		// Save summary to database
		summary := models.Summaries{
			Style:       pythonResponse.Style,
			Content:     pythonResponse.Summary.MainSummary,
			PDFID:       pdf.ID,
			Language:    pythonResponse.Language,
			SummaryTime: pythonResponse.ProcessInfo.ProcessingTimeSeconds,
		}

		if err := db.Create(&summary).Error; err != nil {
			fmt.Printf("Failed to save summary: %v\n", err)
			// Don't return error here as the summary was generated successfully
		}

		return c.Status(200).JSON(pythonResponse)
	})

	app.Get("/summaries", func(c *fiber.Ctx) error {
		var summaries []models.Summaries

		// Pagination parameters
		page := c.QueryInt("page", 1)
		itemsPerPage := c.QueryInt("itemsperpage", 10)

		// Validate pagination parameters
		if page < 1 {
			page = 1
		}
		if itemsPerPage < 1 || itemsPerPage > 100 {
			itemsPerPage = 10
		}

		// Calculate offset from page and itemsPerPage
		offset := (page - 1) * itemsPerPage
		limit := itemsPerPage

		// Other query parameters
		sortBy := c.Query("sort", "created_at")
		order := c.Query("order", "desc")
		search := c.Query("search", "")
		pdfId := c.QueryInt("pdf", 0)
		style := c.Query("style", "")
		language := c.Query("language", "")

		// Validate sort parameters
		validSortFields := map[string]bool{
			"created_at":   true,
			"updated_at":   true,
			"style":        true,
			"language":     true,
			"summary_time": true,
		}
		if !validSortFields[sortBy] {
			sortBy = "created_at"
		}
		if order != "asc" && order != "desc" {
			order = "desc"
		}

		query := db.Model(&models.Summaries{})

		// Apply filters
		if search != "" {
			query = query.Where("content ILIKE ? OR style ILIKE ?", "%"+search+"%", "%"+search+"%")
		}

		if pdfId != 0 {
			query = query.Where("pdf_id = ?", pdfId)
		}

		if style != "" {
			query = query.Where("style ILIKE ?", "%"+style+"%")
		}

		if language != "" {
			query = query.Where("language ILIKE ?", "%"+language+"%")
		}

		// Get total count for pagination
		var totalCount int64
		if err := query.Count(&totalCount).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to count summaries",
				"details": err.Error(),
			})
		}

		// Calculate total pages
		totalPages := int((totalCount + int64(itemsPerPage) - 1) / int64(itemsPerPage))

		// Preload PDF data as recommended in compatibility fixes
		if err := query.Preload("PDF").Order(fmt.Sprintf("%s %s", sortBy, order)).Limit(limit).Offset(offset).Find(&summaries).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to fetch summaries",
				"details": err.Error(),
			})
		}

		response := dto.SummaryListResponse{
			Data:         utils.ConvertSummariesToResponse(summaries),
			Page:         page,
			ItemsPerPage: itemsPerPage,
			TotalPages:   totalPages,
			TotalItems:   totalCount,
		}

		return c.Status(200).JSON(response)
	})

	app.Get("/summaries/count", func(c *fiber.Ctx) error {
		var count int64

		if err := db.Model(&models.Summaries{}).Count(&count).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"message": "Failed to count summaries: " + err.Error(),
			})
		}

		response := dto.SummaryCountResponse{
			Count: count,
		}

		return c.Status(200).JSON(response)
	})

	app.Get("/summaries/:id", func(c *fiber.Ctx) error {
		var summary models.Summaries

		if err := db.Preload("PDF").First(&summary, c.Params("id")).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"message": "Summary not found",
			})
		}

		response := utils.ConvertSummaryToResponse(summary)
		return c.Status(200).JSON(response)
	})

	app.Delete("/summaries/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		var summary models.Summaries

		if err := db.First(&summary, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(404).JSON(fiber.Map{
					"error":   "not_found",
					"message": "Summary not found",
				})
			}
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to find summary",
				"details": err.Error(),
			})
		}

		if err := db.Delete(&summary).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to delete summary",
				"details": err.Error(),
			})
		}

		return c.Status(200).JSON(fiber.Map{
			"message": "Summary deleted successfully",
		})
	})

	// Bulk delete summaries
	app.Delete("/summaries/bulk", func(c *fiber.Ctx) error {
		var req struct {
			IDs []uint `json:"ids" binding:"required"`
		}

		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_request",
				"message": "Invalid request body",
				"details": err.Error(),
			})
		}

		if len(req.IDs) == 0 {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_request",
				"message": "No IDs provided",
			})
		}

		if len(req.IDs) > 100 {
			return c.Status(400).JSON(fiber.Map{
				"error":   "invalid_request",
				"message": "Too many IDs provided (max 100)",
			})
		}

		result := db.Where("id IN ?", req.IDs).Delete(&models.Summaries{})
		if result.Error != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to delete summaries",
				"details": result.Error.Error(),
			})
		}

		return c.Status(200).JSON(fiber.Map{
			"message":       fmt.Sprintf("Successfully deleted %d summaries", result.RowsAffected),
			"deleted_count": result.RowsAffected,
		})
	})

	// Get summary statistics
	app.Get("/summaries/stats", func(c *fiber.Ctx) error {
		var stats struct {
			TotalSummaries int64            `json:"total_summaries"`
			ByStyle        map[string]int64 `json:"by_style"`
			ByLanguage     map[string]int64 `json:"by_language"`
			AvgSummaryTime float64          `json:"avg_summary_time"`
			TotalPDFs      int64            `json:"total_pdfs"`
		}

		// Get total summaries
		if err := db.Model(&models.Summaries{}).Count(&stats.TotalSummaries).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to get summary statistics",
				"details": err.Error(),
			})
		}

		// Get summaries by style
		var styleStats []struct {
			Style string `json:"style"`
			Count int64  `json:"count"`
		}
		if err := db.Model(&models.Summaries{}).Select("style, COUNT(*) as count").Group("style").Find(&styleStats).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to get style statistics",
				"details": err.Error(),
			})
		}

		stats.ByStyle = make(map[string]int64)
		for _, stat := range styleStats {
			stats.ByStyle[stat.Style] = stat.Count
		}

		// Get summaries by language
		var languageStats []struct {
			Language string `json:"language"`
			Count    int64  `json:"count"`
		}
		if err := db.Model(&models.Summaries{}).Select("language, COUNT(*) as count").Group("language").Find(&languageStats).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to get language statistics",
				"details": err.Error(),
			})
		}

		stats.ByLanguage = make(map[string]int64)
		for _, stat := range languageStats {
			stats.ByLanguage[stat.Language] = stat.Count
		}

		// Get average summary time
		var avgTime sql.NullFloat64
		if err := db.Model(&models.Summaries{}).Select("AVG(summary_time)").Scan(&avgTime).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to get average summary time",
				"details": err.Error(),
			})
		}
		if avgTime.Valid {
			stats.AvgSummaryTime = avgTime.Float64
		}

		// Get total PDFs
		if err := db.Model(&models.PDF{}).Count(&stats.TotalPDFs).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "database_error",
				"message": "Failed to get PDF count",
				"details": err.Error(),
			})
		}

		return c.Status(200).JSON(stats)
	})

	app.Listen("0.0.0.0:8080")
}
