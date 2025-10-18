from flask import Flask, request, jsonify, g
from flask_cors import CORS
from waitress import serve
import os
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Import custom modules
from config.database import init_db
from middleware.logging_middleware import setup_logging, log_request
from services.cloudinary_service import init_cloudinary
from services.email_service import init_mail
from services.ml_service import init_ml_service

#Routes
from routes.auth_routes import auth_bp

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'jwt-secret-change-this')
    app.config['JWT_EXPIRES_TIME'] = timedelta(days=7)  # Changed to 7 days like your .env
    app.config['DB_URI'] = os.getenv('DB_URI', 'mongodb://localhost:27017/foodscan')
    
    # File upload configuration
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size
    app.config['UPLOAD_FOLDER'] = 'uploads'
    
    # CORS Configuration - Allow your mobile app and any localhost for development
    CORS(app, origins=[
        "exp://192.168.*.*:*",  # Expo development
        "http://localhost:*",   # Local development
        "https://localhost:*",  # Local HTTPS
        "capacitor://localhost", # Capacitor apps
        "ionic://localhost",    # Ionic apps
        "http://192.168.*.*:*", # Local network
        "https://192.168.*.*:*" # Local network HTTPS
    ], supports_credentials=True)
    
    
    # Setup logging
    setup_logging()
    
    # Initialize database
    init_db(app)
    
    # Initialize email service
    try:
        init_mail(app)
        logging.info("Email service initialized successfully")
    except Exception as e:
        logging.error(f"Failed to initialize email service: {str(e)}")
    
    # Initialize Cloudinary
    try:
        init_cloudinary()
        logging.info("Cloudinary service initialized successfully")
    except Exception as e:
        logging.error(f"Failed to initialize Cloudinary: {str(e)}")
    
    # Initialize ML Service
    try:
        init_ml_service()
        logging.info("ML Service initialized successfully")
    except Exception as e:
        logging.error(f"Failed to initialize ML Service: {str(e)}")
        logging.warning("ML features will be disabled")

    # Middleware for request logging
    @app.before_request
    def before_request():
        log_request()
    
    @app.after_request
    def after_request(response):
        # Log response details
        logging.info(f"Response Status: {response.status_code}")
        if response.status_code >= 400:
            logging.error(f"Error Response: {response.get_data(as_text=True)}")
        return response
    

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        logging.warning(f"404 Error: {request.url} not found")
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logging.error(f"500 Error: {str(error)}")
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(413)
    def too_large(error):
        logging.warning("413 Error: File too large")
        return jsonify({'error': 'File too large'}), 413
    

    app.register_blueprint(auth_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logging.info(f"Starting FoodScan Backend on port {port}")
    logging.info(f"Debug mode: {debug}")

    serve(app, host='0.0.0.0', port=port)
    #app.run(host='0.0.0.0', port=port, debug=debug)
