package utils

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var minioClient *minio.Client

// InitMinIO initializes the MinIO client
func InitMinIO() error {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	useSSL := os.Getenv("MINIO_USE_SSL") == "true"
	bucketName := os.Getenv("MINIO_BUCKET")

	// Default values
	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	if accessKey == "" {
		accessKey = "minioadmin"
	}
	if secretKey == "" {
		secretKey = "minioadmin"
	}
	if bucketName == "" {
		bucketName = "pdf-uploads"
	}

	// Initialize MinIO client
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return fmt.Errorf("failed to create MinIO client: %w", err)
	}

	minioClient = client

	// Create bucket if it doesn't exist
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		err = client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
		fmt.Printf("Bucket '%s' created successfully\n", bucketName)
	} else {
		fmt.Printf("Bucket '%s' already exists\n", bucketName)
	}

	return nil
}

// GetMinIOClient returns the MinIO client instance
func GetMinIOClient() *minio.Client {
	return minioClient
}

// UploadToMinIO uploads a file to MinIO
func UploadToMinIO(filename string, reader io.Reader, size int64, contentType string) error {
	if minioClient == nil {
		return fmt.Errorf("MinIO client not initialized")
	}

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" {
		bucketName = "pdf-uploads"
	}

	ctx := context.Background()
	_, err := minioClient.PutObject(ctx, bucketName, filename, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to upload to MinIO: %w", err)
	}

	return nil
}

// DownloadFromMinIO downloads a file from MinIO
func DownloadFromMinIO(filename string) (*minio.Object, error) {
	if minioClient == nil {
		return nil, fmt.Errorf("MinIO client not initialized")
	}

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" {
		bucketName = "pdf-uploads"
	}

	ctx := context.Background()
	object, err := minioClient.GetObject(ctx, bucketName, filename, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to download from MinIO: %w", err)
	}

	return object, nil
}

// DeleteFromMinIO deletes a file from MinIO
func DeleteFromMinIO(filename string) error {
	if minioClient == nil {
		return fmt.Errorf("MinIO client not initialized")
	}

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" {
		bucketName = "pdf-uploads"
	}

	ctx := context.Background()
	err := minioClient.RemoveObject(ctx, bucketName, filename, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete from MinIO: %w", err)
	}

	return nil
}

// GetPresignedURL generates a presigned URL for temporary access
func GetPresignedURL(filename string, expiry time.Duration) (string, error) {
	if minioClient == nil {
		return "", fmt.Errorf("MinIO client not initialized")
	}

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" {
		bucketName = "pdf-uploads"
	}

	ctx := context.Background()
	url, err := minioClient.PresignedGetObject(ctx, bucketName, filename, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return url.String(), nil
}

// FileExistsInMinIO checks if a file exists in MinIO
func FileExistsInMinIO(filename string) (bool, error) {
	if minioClient == nil {
		return false, fmt.Errorf("MinIO client not initialized")
	}

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" {
		bucketName = "pdf-uploads"
	}

	ctx := context.Background()
	_, err := minioClient.StatObject(ctx, bucketName, filename, minio.StatObjectOptions{})
	if err != nil {
		errResponse := minio.ToErrorResponse(err)
		if errResponse.Code == "NoSuchKey" {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// IsMinIOAvailable checks if MinIO is initialized and available
func IsMinIOAvailable() bool {
	return minioClient != nil
}
