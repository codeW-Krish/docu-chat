"""
Run script for the Python AI Server
"""

import os
import sys
import logging



# Add the app directory to Python path
sys.path.append(os.path.dirname(__file__))

from app.app import app

# Ensure logs and uploads directories exist
os.makedirs('logs', exist_ok=True)
os.makedirs('uploads', exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log', encoding='utf-8'),  # Ensure log file supports UTF-8
        logging.StreamHandler()  # Standard output (console)
    ]
)

logger = logging.getLogger(__name__)
logger.info("Starting Chat with PDF AI Server")

# Port and Debug mode from environment variables
port = int(os.getenv('FLASK_PORT', 5000))
debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

# Run the Flask app
app.run(host='0.0.0.0', port=port, debug=debug)