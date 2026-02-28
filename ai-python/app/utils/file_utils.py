import os
import logging

logger = logging.getLogger(__name__)

def ensure_directory_exists(directory_path):
    """Ensure a directory exists, create if it doesn't"""
    try:
        os.makedirs(directory_path, exist_ok=True)
        return True
    except Exception as e:
        logger.error(f"Failed to create directory {directory_path}: {str(e)}")
        return False

def safe_delete_file(file_path):
    """Safely delete a file if it exists"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete file {file_path}: {str(e)}")
        return False