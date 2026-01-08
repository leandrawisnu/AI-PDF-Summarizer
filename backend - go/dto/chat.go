package dto

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Message string        `json:"message" binding:"required"`
	History []ChatMessage `json:"history"`
	PDFIDs  []uint        `json:"pdf_ids"` // Array of PDF IDs for context
}

type ChatResponse struct {
	Reply          string  `json:"reply"`
	ProcessingTime float64 `json:"processing_time"`
	Status         string  `json:"status"`
}
