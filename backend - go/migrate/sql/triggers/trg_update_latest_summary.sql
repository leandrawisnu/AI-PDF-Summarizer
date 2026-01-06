CREATE TRIGGER trg_update_latest_summary
AFTER INSERT ON summaries
FOR EACH ROW
EXECUTE FUNCTION update_latest_summary();