from flask import Blueprint, jsonify
from controllers.prediction_controller import PredictionController

prediction_bp = Blueprint('prediction', __name__, url_prefix='/api/prediction')

@prediction_bp.route('/predict', methods=['POST'])
def predict_food():
    """
    POST /api/prediction/predict
    
    Unified food prediction using both Gemini AI and ML models
    
    Request:
    - Content-Type: multipart/form-data
    - Body: 
      - image: file (required)
      - topk: int (optional, default=5) - number of top predictions for ML
    
    Response:
    {
        "success": true,
        "message": "Food prediction completed successfully",
        "data": {
            "filename": "food.jpg",
            "temp_image_url": "https://res.cloudinary.com/...",
            "temp_image_public_id": "temp_meals/temp_12345",
            "predictions": {
                "gemini": {
                    "meal_name": "Grilled Chicken Salad",
                    "serving_size": "1 bowl (300g)",
                    "nutrients": {
                        "Calories": 350.5,
                        "Carbs (g)": 25.0,
                        "Protein (g)": 35.0,
                        "Fat (g)": 12.5
                    },
                    "confidence_percentage": 95.0
                },
                "ml": {
                    "classification": {
                        "is_food": true,
                        "food_confidence": 0.9523,
                        "predictions": [
                            {
                                "class_name": "chicken_wings",
                                "confidence": 0.8234
                            },
                            {
                                "class_name": "grilled_salmon",
                                "confidence": 0.0543
                            }
                        ]
                    },
                    "nutrients": {
                        "Calories": 345.25,
                        "Protein (g)": 33.50,
                        "Carbs (g)": 23.75,
                        "Fat (g)": 14.30
                    }
                }
            },
            "services_status": {
                "gemini_available": true,
                "ml_available": true
            },
            "valid_food_types": ["breakfast", "lunch", "dinner", "snacks", "drinks", "dessert", "unlabeled", "other"]
        }
    }
    
    Response when both services fail:
    {
        "success": false,
        "error": "Could not analyze the image",
        "message": "Both Gemini AI and ML models failed to analyze the image",
        "errors": [
            {
                "service": "gemini",
                "error": "Cannot detect food in the image"
            },
            {
                "service": "ml",
                "error": "Classification failed"
            }
        ],
        "services_available": {
            "gemini": true,
            "ml": true
        }
    }
    """
    return PredictionController.predict_food()

@prediction_bp.route('/save-meal', methods=['POST'])
def save_predicted_meal():
    """
    POST /api/prediction/save-meal
    
    Save meal after user has selected which prediction to use (Gemini or ML)
    
    Request:
    - Content-Type: application/json
    - Body: {
        "selected_prediction": "gemini" | "ml" | "manual",  // REQUIRED - which prediction user chose
        "meal_name": "Grilled Chicken Salad",              // REQUIRED
        "nutrients": {                                      // REQUIRED
            "Calories": 350.5,
            "Carbs (g)": 25.0,
            "Protein (g)": 35.0,
            "Fat (g)": 12.5
        },
        "food_type": "lunch",                              // REQUIRED
        "notes": "Healthy and delicious",                  // Optional
        "temp_image_public_id": "temp_meals/temp_12345",   // Optional
        "serving_size": "1 bowl (300g)",                   // Optional
        "confidence_rate": 95.0,                           // Optional
        "ml_food_class": "chicken_wings",                  // Optional - if ML selected, which class
        "user_edited": false                                // Optional - if user manually edited values
      }
    - Requires Firebase authentication (Bearer token in Authorization header)
    
    Response:
    {
        "success": true,
        "message": "Meal saved successfully",
        "data": {
            "meal_id": "507f1f77bcf86cd799439011",
            "meal_name": "Grilled Chicken Salad",
            "nutrients": {...},
            "image_url": "https://res.cloudinary.com/...",
            "food_type": "lunch",
            "notes": "Healthy and delicious",
            "serving_size": "1 bowl (300g)",
            "confidence_rate": 95.0,
            "prediction_source": "gemini",
            "ml_food_class": null,
            "user_edited": false,
            "created_at": "2025-11-11T22:30:00"
        }
    }
    """
    return PredictionController.save_predicted_meal()

@prediction_bp.route('/status', methods=['GET'])
def get_prediction_status():
    """
    GET /api/prediction/status
    
    Get the status of both Gemini AI and ML prediction services
    
    Response:
    {
        "success": true,
        "message": "Prediction services status",
        "data": {
            "gemini": {
                "available": true,
                "status": "ready"
            },
            "ml": {
                "available": true,
                "food_classifier_ready": true,
                "nutrient_predictor_ready": true,
                "device": "cuda",
                "num_food_classes": 101
            },
            "overall_status": "ready"
        }
    }
    """
    return PredictionController.get_prediction_status()

@prediction_bp.route('/info', methods=['GET'])
def get_prediction_info():
    """
    GET /api/prediction/info
    
    Get information about the unified prediction service
    """
    return jsonify({
        'success': True,
        'message': 'Unified food prediction service information',
        'data': {
            'description': 'Combines Gemini AI and ML models for comprehensive food analysis',
            'services': {
                'gemini_ai': {
                    'name': 'Google Gemini AI',
                    'model': 'gemini-1.5-flash',
                    'capabilities': [
                        'Food identification',
                        'Nutritional estimation',
                        'Serving size detection',
                        'Confidence scoring'
                    ],
                    'nutrients': ['Calories', 'Carbs (g)', 'Protein (g)', 'Fat (g)']
                },
                'ml_models': {
                    'food_classifier': {
                        'name': 'MultiTask ResNet-18',
                        'description': 'Binary classifier (food vs not-food) + Multi-class food identifier',
                        'backbone': 'ResNet-18',
                        'classes': '101 food classes from Food-101 dataset'
                    },
                    'nutrient_predictor': {
                        'name': 'Nutrient Predictor',
                        'description': 'Predicts nutritional values from food images',
                        'backbone': 'ResNet-50',
                        'outputs': ['Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)']
                    }
                }
            },
            'features': [
                'Dual prediction system for accuracy',
                'Automatic fallback if one service fails',
                'Combined results from both AI systems',
                'Confidence scoring from both models',
                'Food type classification',
                'Detailed nutritional analysis'
            ],
            'supported_formats': ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'],
            'max_file_size': '10MB'
        }
    }), 200

@prediction_bp.route('/meals', methods=['GET'])
def get_user_meals():
    """
    GET /api/prediction/meals
    
    Get user's meal history
    
    Query Parameters:
    - limit: int (default=50) - Number of meals to return
    - offset: int (default=0) - Number of meals to skip
    - start_date: ISO date string (optional) - Filter meals from this date
    - end_date: ISO date string (optional) - Filter meals until this date
    
    Requires authentication (Bearer token)
    
    Response:
    {
        "success": true,
        "message": "Meals retrieved successfully",
        "data": {
            "meals": [...],
            "count": 10,
            "limit": 50,
            "offset": 0
        }
    }
    """
    return PredictionController.get_user_meals()

@prediction_bp.route('/meals/<meal_id>', methods=['GET'])
def get_meal_by_id(meal_id):
    """
    GET /api/prediction/meals/<meal_id>
    
    Get specific meal by ID
    
    Requires authentication (Bearer token)
    
    Response:
    {
        "success": true,
        "message": "Meal retrieved successfully",
        "data": {
            "meal_id": "...",
            "meal_name": "...",
            ...
        }
    }
    """
    return PredictionController.get_meal_by_id(meal_id)

@prediction_bp.route('/meals/<meal_id>', methods=['PUT'])
def update_meal(meal_id):
    """
    PUT /api/prediction/meals/<meal_id>
    
    Update meal
    
    Request:
    - Content-Type: application/json
    - Body: {
        "meal_name": "...",
        "nutrients": {...},
        "food_type": "...",
        "notes": "...",
        ...
      }
    
    Requires authentication (Bearer token)
    
    Response:
    {
        "success": true,
        "message": "Meal updated successfully",
        "data": {...}
    }
    """
    return PredictionController.update_meal(meal_id)

@prediction_bp.route('/meals/<meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    """
    DELETE /api/prediction/meals/<meal_id>
    
    Delete meal
    
    Requires authentication (Bearer token)
    
    Response:
    {
        "success": true,
        "message": "Meal deleted successfully"
    }
    """
    return PredictionController.delete_meal(meal_id)

@prediction_bp.route('/nutrition-summary', methods=['GET'])
def get_nutrition_summary():
    """
    GET /api/prediction/nutrition-summary
    
    Get nutrition summary for the authenticated user
    
    Query Parameters:
    - start_date: ISO format datetime (optional)
    - end_date: ISO format datetime (optional)
    
    Requires authentication (Bearer token)
    
    Response:
    {
        "success": true,
        "message": "Nutrition summary retrieved successfully",
        "data": {
            "total_nutrients": {
                "calories": 2500.5,
                "protein": 120.0,
                "carbs": 300.0,
                "fat": 80.0
            },
            "average_nutrients": {
                "calories": 625.0,
                "protein": 30.0,
                "carbs": 75.0,
                "fat": 20.0
            },
            "meal_count": 4
        }
    }
    """
    return PredictionController.get_nutrition_summary()
