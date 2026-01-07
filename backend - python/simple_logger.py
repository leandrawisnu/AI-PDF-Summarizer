import time
import json
from datetime import datetime
from typing import Optional

class SimpleLogger:
    """Simple request logger that prints to console"""
    
    @staticmethod
    def log_request(
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        ip_address: str = "unknown",
        error: Optional[str] = None
    ):
        """Log a request to console"""
        level = SimpleLogger._get_log_level(status_code)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_message = f"[{timestamp}] [{level}] [{method}] {path} {ip_address} - {status_code} ({duration_ms:.2f}ms)"
        
        if error:
            log_message += f" | Error: {error}"
        
        print(log_message)
    
    @staticmethod
    def _get_log_level(status_code: int) -> str:
        """Determine log level based on status code"""
        if status_code >= 500:
            return "ERROR"
        elif status_code >= 400:
            return "WARN"
        elif status_code >= 300:
            return "INFO"
        else:
            return "INFO"
