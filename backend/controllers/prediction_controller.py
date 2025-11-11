from flask import request, jsonify
import logging
from datetime import datetime
from services.prediction_service import get_prediction_service
from services.cloudinary_service import CloudinaryService
from models.user_meal import UserMeal
from utils.jwt_utils import token_required, get_current_user_id

class PredictionController:
    @staticmethod
    def predict_food():
        """
        Unified food prediction endpoint using both Gemini AI and ML models
        
        Expected request:
        - Multipart form data with 'image' file
        - Optional: topk parameter for ML classification (default=5)
        
        Returns:
        - JSON response with predictions from both Gemini and ML
        """
        try:
            # Check if image file is present
            if 'image' not in request.files:
                logging.warning("No image file in request")
                return jsonify({
                    'success': False,
                    'error': 'No image file provided'
                }), 400
            
            image_file = request.files['image']
            
            if image_file.filename == '':
                logging.warning("Empty filename in request")
                return jsonify({
                    'success': False,
                    'error': 'Empty filename'
                }), 400
            
            # Validate file type
            allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
            if not image_file.filename.lower().split('.')[-1] in allowed_extensions:
                logging.warning(f"Invalid file type: {image_file.filename}")
                return jsonify({
                    'success': False,
                    'error': 'Invalid file type. Supported: png, jpg, jpeg, gif, bmp, webp'
                }), 400
            
            # Read image data
            image_data = image_file.read()
            max_size = 10 * 1024 * 1024  # 10MB
            if len(image_data) > max_size:
                logging.warning(f"File too large: {len(image_data)} bytes")
                return jsonify({
                    'success': False,
                    'error': 'File too large. Maximum size is 10MB'
                }), 413
            
            # Get topk parameter for ML classification
            topk = int(request.form.get('topk', 5))
            
            # Get predictions from both services
            prediction_service = get_prediction_service()
            result = prediction_service.predict_food(image_data, topk=topk)
            
            if not result['success']:
                return jsonify({
                    'success': False,
                    'error': 'Could not analyze the image',
                    'message': 'Both Gemini AI and ML models failed to analyze the image',
                    'errors': result['errors'],
                    'services_available': {
                        'gemini': result['gemini_available'],
                        'ml': result['ml_available']
                    }
                }), 503
            
            # Upload image to Cloudinary (temp folder)
            image_url = None
            image_public_id = None
            
            try:
                cloudinary_service = CloudinaryService()
                upload_result = cloudinary_service.upload_image(
                    image_data,
                    folder='temp_meals',
                    public_id=f"temp_{image_file.filename.split('.')[0]}_{int(datetime.now().timestamp())}"
                )
                
                if upload_result.get('success'):
                    image_url = upload_result['url']
                    image_public_id = upload_result['public_id']
                    logging.info(f"Image uploaded to Cloudinary: {image_public_id}")
            except Exception as upload_error:
                logging.warning(f"Failed to upload image to Cloudinary: {str(upload_error)}")
            
            # Build response
            response_data = {
                'success': True,
                'message': 'Food prediction completed successfully',
                'data': {
                    'filename': image_file.filename,
                    'temp_image_url': image_url,
                    'temp_image_public_id': image_public_id,
                    'predictions': {
                        'gemini': result['gemini_prediction'],
                        'ml': result['ml_prediction']
                    },
                    'services_status': {
                        'gemini_available': result['gemini_available'],
                        'ml_available': result['ml_available']
                    },
                    'valid_food_types': UserMeal.VALID_MEAL_TYPES
                }
            }
            
            # Add errors if any
            if result['errors']:
                response_data['data']['errors'] = result['errors']
            
            logging.info("Unified food prediction completed successfully")
            return jsonify(response_data), 200
            
        except Exception as e:
            logging.error(f"Error in unified prediction endpoint: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Internal server error',
                'details': str(e)
            }), 500
    
    @staticmethod
    @token_required
    def save_predicted_meal():
        """
        Save meal after user has reviewed and edited predictions
        
        Expected request:
        - JSON body with:
          - selected_prediction: 'gemini' or 'ml' (required) - Which prediction user chose
          - meal_name: Meal name (optional - will use from selected prediction if not provided)
          - nutrients: Dict with nutrient values (optional - will use from selected prediction if not provided)
          - food_type: User-selected food type (required)
          - notes: Optional notes
          - temp_image_public_id: Temporary image ID from prediction step
          - serving_size: Optional serving size
          - ml_food_class: Optional - specific ML food class if user chose ML
          - allow_edits: boolean - if true, allows manual override of prediction values
        
        Returns:
        - JSON response with saved meal details
        """
        try:
            user_id = get_current_user_id()
            data = request.get_json()
            
            if not data:
                logging.warning("No JSON data in request")
                return jsonify({
                    'success': False,
                    'error': 'No data provided'
                }), 400
            
            # Required: which prediction did user select?
            selected_prediction = data.get('selected_prediction')
            if not selected_prediction or selected_prediction not in ['gemini', 'ml', 'manual']:
                logging.warning(f"Invalid or missing selected_prediction: {selected_prediction}")
                return jsonify({
                    'success': False,
                    'error': 'selected_prediction is required and must be "gemini", "ml", or "manual"'
                }), 400
            
            # Required: food type
            food_type = data.get('food_type')
            if not food_type:
                logging.warning("Missing food_type in request")
                return jsonify({
                    'success': False,
                    'error': 'Food type is required'
                }), 400
            
            # Get meal data - either from user edits or from selected prediction
            meal_name = data.get('meal_name')
            nutrients = data.get('nutrients')
            serving_size = data.get('serving_size')
            confidence_rate = data.get('confidence_rate')
            ml_food_class = data.get('ml_food_class')  # If user selected ML, which specific class
            
            # Validate that we have meal_name and nutrients
            if not meal_name:
                logging.warning("Missing meal_name in request")
                return jsonify({
                    'success': False,
                    'error': 'Meal name is required'
                }), 400
            
            if not nutrients:
                logging.warning("Missing nutrients in request")
                return jsonify({
                    'success': False,
                    'error': 'Nutrients are required'
                }), 400
            
            # Optional fields
            notes = data.get('notes', '')
            temp_image_public_id = data.get('temp_image_public_id')
            user_edited = data.get('user_edited', False)  # Track if user manually edited values
            
            # Debug logging
            logging.info(f"Save meal request - temp_image_public_id: {temp_image_public_id}")
            
            # Move image from temp folder to permanent folder (if exists)
            image_url = None
            image_public_id = None
            
            if temp_image_public_id:
                try:
                    cloudinary_service = CloudinaryService()
                    
                    # Move from temp to permanent folder
                    new_public_id = f"meals/{user_id}/{int(datetime.now().timestamp())}"
                    move_result = cloudinary_service.move_image(
                        temp_image_public_id,
                        new_public_id
                    )
                    
                    if move_result.get('success'):
                        image_url = move_result['url']
                        image_public_id = move_result['public_id']
                        logging.info(f"Image moved to permanent storage: {image_public_id}")
                    else:
                        logging.warning("Failed to move image, using temp URL")
                        # Get the temp image URL
                        image_url = cloudinary_service.get_image_url(temp_image_public_id)
                        image_public_id = temp_image_public_id
                        
                except Exception as move_error:
                    logging.error(f"Error moving image: {str(move_error)}")
            
            # Save meal record to database
            try:
                result = UserMeal.create_meal(
                    user_id=user_id,
                    nutrients=nutrients,
                    image_url=image_url,
                    image_public_id=image_public_id,
                    meal_name=meal_name,
                    notes=notes,
                    food_type=food_type,
                    serving_size=serving_size,
                    confidence_rate=confidence_rate,
                    prediction_source=selected_prediction,
                    ml_food_class=ml_food_class,
                    user_edited=user_edited
                )
                
                if not result.get('success'):
                    return jsonify({
                        'success': False,
                        'error': 'Failed to save meal to database',
                        'details': result.get('error')
                    }), 500
                
                meal = result.get('meal')
                
                if not meal:
                    return jsonify({
                        'success': False,
                        'error': 'Failed to save meal to database'
                    }), 500
                
                logging.info(f"Meal saved successfully: {meal_name} (ID: {str(meal['_id'])}) - Source: {selected_prediction}")
                
                return jsonify({
                    'success': True,
                    'message': 'Meal saved successfully',
                    'data': {
                        'meal_id': str(meal['_id']),
                        'meal_name': meal_name,
                        'nutrients': nutrients,
                        'image_url': image_url,
                        'food_type': food_type,
                        'notes': notes,
                        'serving_size': serving_size,
                        'confidence_rate': confidence_rate,
                        'prediction_source': selected_prediction,
                        'ml_food_class': ml_food_class,
                        'user_edited': user_edited,
                        'created_at': meal['created_at'].isoformat()
                    }
                }), 201
                    
            except Exception as db_error:
                logging.error(f"Database error: {str(db_error)}")
                return jsonify({
                    'success': False,
                    'error': 'Failed to save meal',
                    'details': str(db_error)
                }), 500
            
        except Exception as e:
            logging.error(f"Error in save predicted meal endpoint: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Internal server error',
                'details': str(e)
            }), 500
    
    @staticmethod
    def get_prediction_status():
        """
        Get the status of both prediction services
        
        Returns:
        - JSON response with service status
        """
        try:
            from services.gemini_service import get_gemini_service
            from services.ml_service import get_ml_service
            
            gemini_service = get_gemini_service()
            ml_service = get_ml_service()
            
            gemini_ready = gemini_service and gemini_service.is_ready()
            ml_ready = ml_service and ml_service.is_model_ready()
            
            return jsonify({
                'success': True,
                'message': 'Prediction services status',
                'data': {
                    'gemini': {
                        'available': gemini_ready,
                        'status': 'ready' if gemini_ready else 'unavailable'
                    },
                    'ml': {
                        'available': ml_ready,
                        'food_classifier_ready': ml_service.food_classifier_model is not None if ml_service else False,
                        'nutrient_predictor_ready': ml_service.nutrient_model is not None if ml_service else False,
                        'device': str(ml_service.device) if ml_service else None,
                        'num_food_classes': len(ml_service.food_classes) if ml_service and ml_service.food_classes else 0
                    },
                    'overall_status': 'ready' if (gemini_ready or ml_ready) else 'unavailable'
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Error checking prediction status: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @staticmethod
    @token_required
    def get_user_meals():
        """Get user's meal history"""
        try:
            user_id = get_current_user_id()
            
            # Get query parameters
            limit = int(request.args.get('limit', 50))
            offset = int(request.args.get('offset', 0))
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            # Parse dates if provided
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if start_date else None
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if end_date else None
            
            result = UserMeal.get_user_meals(user_id, limit, offset, start_date_obj, end_date_obj)
            
            # Debug: Log the result structure
            logging.info(f"Result from get_user_meals: {result}")
            logging.info(f"Result type: {type(result)}")
            
            # Extract meals array from the result
            if isinstance(result, dict) and 'meals' in result:
                meals = result['meals']
                logging.info(f"Extracted meals array, length: {len(meals)}")
            else:
                meals = result if isinstance(result, list) else []
                logging.info(f"Using result directly as meals")
            
            return jsonify({
                'success': True,
                'message': 'Meals retrieved successfully',
                'data': {
                    'data': meals,
                    'count': len(meals),
                    'limit': limit,
                    'offset': offset
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Error getting meals: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @staticmethod
    @token_required
    def get_meal_by_id(meal_id):
        """Get specific meal by ID"""
        try:
            user_id = get_current_user_id()
            meal = UserMeal.get_meal_by_id(meal_id, user_id)
            
            if not meal:
                return jsonify({
                    'success': False,
                    'error': 'Meal not found'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'Meal retrieved successfully',
                'data': meal
            }), 200
            
        except Exception as e:
            logging.error(f"Error getting meal: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @staticmethod
    @token_required
    def update_meal(meal_id):
        """Update meal"""
        try:
            user_id = get_current_user_id()
            data = request.get_json()
            
            result = UserMeal.update_meal(meal_id, user_id, data)
            
            if not result.get('success'):
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Failed to update meal')
                }), 400
            
            return jsonify({
                'success': True,
                'message': 'Meal updated successfully',
                'data': result.get('meal')
            }), 200
            
        except Exception as e:
            logging.error(f"Error updating meal: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @staticmethod
    @token_required
    def delete_meal(meal_id):
        """Delete meal"""
        try:
            user_id = get_current_user_id()
            result = UserMeal.delete_meal(meal_id, user_id)
            
            if not result.get('success'):
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Failed to delete meal')
                }), 400
            
            return jsonify({
                'success': True,
                'message': 'Meal deleted successfully'
            }), 200
            
        except Exception as e:
            logging.error(f"Error deleting meal: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @staticmethod
    @token_required
    def get_nutrition_summary():
        """Get nutrition summary for the current user"""
        try:
            user_id = get_current_user_id()
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            result = UserMeal.get_nutrition_summary(user_id, start_date, end_date)
            
            if not result.get('success'):
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Failed to get nutrition summary')
                }), 400
            
            return jsonify({
                'success': True,
                'message': 'Nutrition summary retrieved successfully',
                'data': result.get('summary')
            }), 200
            
        except Exception as e:
            logging.error(f"Error getting nutrition summary: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
