package main

import (
	"backend-go/models"
	"os"

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
	if err := db.Exec(`
	CREATE OR REPLACE FUNCTION update_latest_summary()
	RETURNS TRIGGER AS $$
	BEGIN
		UPDATE pdfs
		SET
			summary = NEW.content,
			style = NEW.style,
			language = NEW.language,
			summary_time = NEW.summary_time,
			summary_version = COALESCE(summary_version, 0) + 1,
			updated_at = NOW()
		WHERE id = NEW.pdf_id;

		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;`).Error; err != nil {
		println("Warning: Could not create update_latest_summary function: " + err.Error())
	}

	// Read and execute the trigger from SQL file (drop first if exists)
	if err := db.Exec(`DROP TRIGGER IF EXISTS trg_update_latest_summary ON summaries;`).Error; err != nil {
		println("Warning: Could not drop existing trigger: " + err.Error())
	}

	if err := db.Exec(`
	CREATE TRIGGER trg_update_latest_summary
	AFTER INSERT ON summaries
	FOR EACH ROW
	EXECUTE FUNCTION update_latest_summary();`).Error; err != nil {
		println("Warning: Could not create trigger trg_update_latest_summary: " + err.Error())
	}

	println("Migration completed successfully!")
}
