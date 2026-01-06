package utils

import (
	"backend-go/dto"
	"backend-go/models"
)

// ConvertPDFToResponse converts PDF model to PDFResponse DTO
func ConvertPDFToResponse(pdf models.PDF) dto.PDFResponse {
	response := dto.PDFResponse{
		ID:        pdf.ID,
		Filename:  pdf.Filename,
		FileSize:  pdf.FileSize,
		Title:     pdf.Title,
		PageCount: pdf.PageCount,
		CreatedAt: pdf.CreatedAt,
		UpdatedAt: pdf.UpdatedAt,
		Summaries: ConvertSummariesToResponse(pdf.Summaries),
	}

	// Use fields directly from PDF model
	response.SummaryVersion = pdf.SummaryVersion
	response.Summary = pdf.Summary
	response.Style = pdf.Style
	response.Language = pdf.Language
	response.SummaryTime = pdf.SummaryTime

	return response
}

// ConvertPDFsToResponse converts slice of PDF models to slice of PDFResponse DTOs
func ConvertPDFsToResponse(pdfs []models.PDF) []dto.PDFResponse {
	responses := make([]dto.PDFResponse, len(pdfs))
	for i, pdf := range pdfs {
		responses[i] = ConvertPDFToResponse(pdf)
	}
	return responses
}

// ConvertSummaryToResponse converts Summary model to SummaryResponse DTO
func ConvertSummaryToResponse(summary models.Summaries) dto.SummaryResponse {
	response := dto.SummaryResponse{
		ID:          summary.ID,
		Style:       summary.Style,
		Content:     summary.Content,
		PDFID:       summary.PDFID,
		Language:    summary.Language,
		SummaryTime: summary.SummaryTime,
		CreatedAt:   summary.CreatedAt,
		UpdatedAt:   summary.UpdatedAt,
	}

	// Include PDF basic info if available
	if summary.PDF.ID != 0 {
		response.PDF = &dto.PDFBasicInfo{
			ID:        summary.PDF.ID,
			Title:     summary.PDF.Title,
			Filename:  summary.PDF.Filename,
			FileSize:  summary.PDF.FileSize,
			PageCount: summary.PDF.PageCount,
		}
	}

	return response
}

func ConvertSummariesToResponse(summaries []models.Summaries) []dto.SummaryResponse {
	responses := make([]dto.SummaryResponse, len(summaries))
	for i, summary := range summaries {
		responses[i] = ConvertSummaryToResponse(summary)
	}
	return responses
}
