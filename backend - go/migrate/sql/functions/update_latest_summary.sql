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
$$ LANGUAGE plpgsql;