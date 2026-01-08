FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git and ca-certificates for go mod download
RUN apk add --no-cache git ca-certificates

# Copy go mod files
COPY go.mod ./

# Download dependencies with verbose output for debugging
RUN go mod download -x

# Copy source code
COPY . .

# Tidy modules to ensure consistency
RUN go mod tidy

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Build the migration tool
WORKDIR /app/migrate
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o migrate ./auto.go
WORKDIR /app

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests and netcat for database health check
RUN apk --no-cache add ca-certificates netcat-openbsd

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .
COPY --from=builder /app/migrate/migrate .

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["./entrypoint.sh"]