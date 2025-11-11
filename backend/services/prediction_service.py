import logging
from services.gemini_service import get_gemini_service
from services.ml_service import get_ml_service

class PredictionService:
    """
    Unified prediction service that combines Gemini AI and ML model predictions
    """
    
    @staticmethod
    def predict_food(image_data, topk=5):
        """
        Predict food using both Gemini AI and ML model
        
        Args:
            image_data: Binary image data
            topk: Number of top predictions for ML classification
            
        Returns:
            dict: Combined predictions from both services
        """
        result = {
            'success': False,
            'gemini_prediction': None,
            'ml_prediction': None,
            'gemini_available': False,
            'ml_available': False,
            'errors': []
        }
        
        # Try Gemini AI prediction
        try:
            gemini_service = get_gemini_service()
            if gemini_service and gemini_service.is_ready():
                result['gemini_available'] = True
                logging.info("Starting Gemini AI prediction...")
                gemini_result = gemini_service.analyze_food_image(image_data)
                
                if gemini_result.get('success'):
                    result['gemini_prediction'] = {
                        'meal_name': gemini_result.get('meal_name'),
                        'serving_size': gemini_result.get('serving_size', ''),
                        'nutrients': gemini_result.get('nutrients', {}),
                        'confidence_percentage': gemini_result.get('confidence_percentage', 0)
                    }
                    logging.info(f"Gemini prediction successful: {gemini_result.get('meal_name')}")
                else:
                    result['errors'].append({
                        'service': 'gemini',
                        'error': gemini_result.get('error', 'Unknown error'),
                        'message': gemini_result.get('message', '')
                    })
                    logging.warning("Gemini could not detect food in image")
            else:
                result['errors'].append({
                    'service': 'gemini',
                    'error': 'Gemini service not available'
                })
                logging.warning("Gemini service not available")
        except Exception as e:
            result['errors'].append({
                'service': 'gemini',
                'error': str(e)
            })
            logging.error(f"Gemini prediction error: {str(e)}")
        
        # Try ML model prediction
        try:
            ml_service = get_ml_service()
            if ml_service:
                result['ml_available'] = True
                logging.info("Starting ML model prediction...")
                
                # Food classification
                ml_classification = None
                if ml_service.food_classifier_model:
                    ml_classification = ml_service.classify_food(image_data, topk=topk)
                    logging.info(f"ML classification successful: is_food={ml_classification.get('is_food')}")
                
                # Nutrient prediction
                ml_nutrients = None
                if ml_service.nutrient_model:
                    ml_nutrients = ml_service.predict_nutrients(image_data)
                    logging.info("ML nutrient prediction successful")
                
                result['ml_prediction'] = {
                    'classification': ml_classification if ml_classification and ml_classification.get('success') else None,
                    'nutrients': ml_nutrients.get('nutrients') if ml_nutrients and ml_nutrients.get('success') else None
                }
                
                if not ml_classification or not ml_classification.get('success'):
                    result['errors'].append({
                        'service': 'ml_classification',
                        'error': ml_classification.get('error', 'Classification failed') if ml_classification else 'Model not available'
                    })
                
                if not ml_nutrients or not ml_nutrients.get('success'):
                    result['errors'].append({
                        'service': 'ml_nutrients',
                        'error': ml_nutrients.get('error', 'Nutrient prediction failed') if ml_nutrients else 'Model not available'
                    })
            else:
                result['errors'].append({
                    'service': 'ml',
                    'error': 'ML service not available'
                })
                logging.warning("ML service not available")
        except Exception as e:
            result['errors'].append({
                'service': 'ml',
                'error': str(e)
            })
            logging.error(f"ML prediction error: {str(e)}")
        
        # Determine overall success
        result['success'] = (
            result['gemini_prediction'] is not None or 
            (result['ml_prediction'] and 
             (result['ml_prediction']['classification'] is not None or 
              result['ml_prediction']['nutrients'] is not None))
        )
        
        return result

def get_prediction_service():
    """Get the prediction service instance"""
    return PredictionService()
