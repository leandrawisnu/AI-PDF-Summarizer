package main

import (
	"backend-go/models"
	"os"
	"path/filepath"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=ai_pdf_management port=5432 sslmode=disable TimeZone=Asia/Shanghai"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	println("Connected to database successfully!")
	println("Running AutoMigrate...")

	// Migrate models in correct order (parent first, then child)
	if err := db.AutoMigrate(
		&models.PDF{},
		&models.Summaries{},
	); err != nil {
		panic("Migration failed: " + err.Error())
	}

	// Ensure foreign key constraint is properly created
	if err := db.Exec(`
		ALTER TABLE summaries 
		DROP CONSTRAINT IF EXISTS fk_pdfs_summaries;
		
		ALTER TABLE summaries 
		DROP CONSTRAINT IF EXISTS fk_summaries_pdf;
		
		ALTER TABLE summaries 
		ADD CONSTRAINT fk_summaries_pdf 
		FOREIGN KEY (pdf_id) REFERENCES pdfs(id) 
		ON UPDATE CASCADE ON DELETE CASCADE;
	`).Error; err != nil {
		println("Warning: Could not create/update foreign key constraint: " + err.Error())
	} else {
		println("Foreign key constraint created successfully!")
	}

	// Read and execute the update_latest_summary function from SQL file
	functionSQL, err := os.ReadFile(filepath.Join("sql", "functions", "update_latest_summary.sql"))
	if err != nil {
		println("Warning: Could not read function SQL file: " + err.Error())
	} else if err := db.Exec(string(functionSQL)).Error; err != nil {
		println("Warning: Could not create update_latest_summary function: " + err.Error())
	} else {
		println("Function update_latest_summary created successfully!")
	}

	// Read and execute the trigger from SQL file (drop first if exists)
	if err := db.Exec(`DROP TRIGGER IF EXISTS trg_update_latest_summary ON summaries;`).Error; err != nil {
		println("Warning: Could not drop existing trigger: " + err.Error())
	}

	triggerSQL, err := os.ReadFile(filepath.Join("sql", "triggers", "trg_update_latest_summary.sql"))
	if err != nil {
		println("Warning: Could not read trigger SQL file: " + err.Error())
	} else if err := db.Exec(string(triggerSQL)).Error; err != nil {
		println("Warning: Could not create trigger trg_update_latest_summary: " + err.Error())
	} else {
		println("Trigger trg_update_latest_summary created successfully!")
	}

	println("Migration completed successfully!")
}
