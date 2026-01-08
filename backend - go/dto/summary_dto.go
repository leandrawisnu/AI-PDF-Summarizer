package dto

import (
	"time"
)

type SummarizeRequest struct {
	Style    string `json:"style" binding:"required"`
	Language string `json:"language" binding:"required"`
}

type SummaryCreateRequest struct {
	Style       string  `json:"style" binding:"required"`
	Content     string  `json:"content" binding:"required"`
	PDFID       uint    `json:"pdf_id" binding:"required"`
	Language    string  `json:"language" binding:"required"`
	SummaryTime float64 `json:"summary_time"`
}

type SummaryResponse struct {
	ID          uint          `json:"id"`
	Style       string        `json:"style"`
	Content     string        `json:"content"`
	PDFID       uint          `json:"pdf_id"`
	Language    string        `json:"language"`
	SummaryTime float64       `json:"summary_time"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	PDF         *PDFBasicInfo `json:"pdf,omitempty"`
}

type PDFBasicInfo struct {
	ID        uint   `json:"id"`
	Title     string `json:"title"`
	Filename  string `json:"filename"`
	FileSize  int64  `json:"file_size"`
	PageCount int    `json:"page_count"`
}

type SummaryListResponse struct {
	Data         []SummaryResponse `json:"data"`
	Page         int               `json:"page"`
	ItemsPerPage int               `json:"itemsPerPage"`
	TotalPages   int               `json:"totalPages"`
	TotalItems   int64             `json:"totalItems"`
}

type PythonSummaryResponse struct {
	Title       string                 `json:"title"`
	Summary     SummaryDetails         `json:"summary"`
	Embedding   []float32              `json:"embedding"`
	Language    string                 `json:"language"`
	Style       string                 `json:"style"`
	FileInfo    FileInfo               `json:"file_info"`
	TextStats   map[string]interface{} `json:"text_statistics"`
	ProcessInfo ProcessingInfo         `json:"processing_info"`
	Status      string                 `json:"status"`
}

type SummaryDetails struct {
	MainSummary string `json:"main_summary"`
	WordCount   int    `json:"word_count"`
	ReadingTime string `json:"reading_time"`
}

type FileInfo struct {
	OriginalFilename string  `json:"original_filename"`
	FileSize         int     `json:"file_size"`
	FileSizeMB       float64 `json:"file_size_mb"`
}

type ProcessingInfo struct {
	ChunksProcessed       int     `json:"chunks_processed"`
	ChunkingUsed          bool    `json:"chunking_used"`
	ProcessingTimeSeconds float64 `json:"processing_time_seconds"`
	EmbeddingDimensions   int     `json:"embedding_dimensions"`
}

type BulkDeleteRequest struct {
	IDs []uint `json:"ids" binding:"required"`
}

type BulkDeleteResponse struct {
	Message      string `json:"message"`
	DeletedCount int64  `json:"deleted_count"`
}

type SummaryStatsResponse struct {
	TotalSummaries int64            `json:"total_summaries"`
	ByStyle        map[string]int64 `json:"by_style"`
	ByLanguage     map[string]int64 `json:"by_language"`
	AvgSummaryTime float64          `json:"avg_summary_time"`
	TotalPDFs      int64            `json:"total_pdfs"`
}
