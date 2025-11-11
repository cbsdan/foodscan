import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import torch.nn.functional as F
import logging
import os
import io

class NutrientPredictor(nn.Module):
    def __init__(self, num_nutrients=4):
        super(NutrientPredictor, self).__init__()
        # Load a pre-trained ResNet model
        resnet = models.resnet50(pretrained=True)
        # Remove the original fully connected layer
        self.features = nn.Sequential(*list(resnet.children())[:-1])
        # Add a new fully connected layer for nutrient prediction
        self.regressor = nn.Linear(resnet.fc.in_features, num_nutrients)
    
    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, 1)
        x = self.regressor(x)
        return x

class MultiTaskResNet(nn.Module):
    """Multi-task model for food classification"""
    def __init__(self, num_multi_classes, pretrained=True):
        super().__init__()
        self.backbone = models.resnet18(pretrained=pretrained)
        in_feat = self.backbone.fc.in_features
        self.backbone.fc = nn.Identity()
        self.multi_head = nn.Linear(in_feat, num_multi_classes)
        self.binary_head = nn.Linear(in_feat, 1)

    def forward(self, x):
        feat = self.backbone(x)
        multi_logits = self.multi_head(feat)
        binary_logit = self.binary_head(feat).squeeze(1)
        return multi_logits, binary_logit

class MLModelService:
    def __init__(self):
        self.nutrient_model = None
        self.food_classifier_model = None
        self.device = None
        self.transform = None
        self.nutrient_names = ['Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)']
        self.food_classes = []
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize both ML models"""
        try:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            logging.info(f"Using device: {self.device}")
            
            # Initialize nutrient prediction model
            self._initialize_nutrient_model()
            
            # Initialize food classification model
            self._initialize_food_classifier()
            
            # Initialize image preprocessing transforms
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
        except Exception as e:
            logging.error(f"Failed to initialize ML models: {str(e)}")
            raise e
    
    def _initialize_nutrient_model(self):
        """Initialize nutrient prediction model"""
        try:
            self.nutrient_model = NutrientPredictor()
            model_path = os.path.join(os.path.dirname(__file__), '..', 'nutrient_predictor_model.pth')
            
            if os.path.exists(model_path):
                self.nutrient_model.load_state_dict(torch.load(model_path, map_location=self.device))
                self.nutrient_model.to(self.device)
                self.nutrient_model.eval()
                logging.info("✅ Nutrient prediction model loaded successfully")
            else:
                logging.warning(f"Nutrient model file not found at: {model_path}")
                self.nutrient_model = None
                
        except Exception as e:
            logging.error(f"Failed to initialize nutrient model: {str(e)}")
            self.nutrient_model = None
    
    def _initialize_food_classifier(self):
        """Initialize food classification model"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), '..', 'food_notfood_multitask_resnet18.pth')
            
            if os.path.exists(model_path):
                checkpoint = torch.load(model_path, map_location=self.device)
                self.food_classes = checkpoint.get('food_classes', [])
                num_multi_classes = checkpoint.get('num_multi_classes', len(self.food_classes) + 1)
                
                self.food_classifier_model = MultiTaskResNet(num_multi_classes, pretrained=False)
                self.food_classifier_model.load_state_dict(checkpoint['model_state'])
                self.food_classifier_model.to(self.device)
                self.food_classifier_model.eval()
                logging.info(f"✅ Food classifier model loaded successfully with {len(self.food_classes)} food classes")
            else:
                logging.warning(f"Food classifier model file not found at: {model_path}")
                self.food_classifier_model = None
                
        except Exception as e:
            logging.error(f"Failed to initialize food classifier: {str(e)}")
            self.food_classifier_model = None
    
    def preprocess_image(self, image_data):
        """
        Preprocess image data for model inference
        
        Args:
            image_data: Raw image data (bytes)
            
        Returns:
            Preprocessed image tensor
        """
        try:
            # Convert bytes to PIL Image
            if isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image = image_data
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply transformations
            processed_img = self.transform(image)
            
            # Add batch dimension
            processed_img = processed_img.unsqueeze(0)
            
            # Move to device
            processed_img = processed_img.to(self.device)
            
            return processed_img
            
        except Exception as e:
            logging.error(f"Error preprocessing image: {str(e)}")
            raise e
    
    def predict_nutrients(self, image_data):
        """
        Predict nutrient values from image data
        
        Args:
            image_data: Raw image data (bytes or PIL Image)
            
        Returns:
            Dictionary containing predicted nutrient values
        """
        try:
            if self.nutrient_model is None:
                raise RuntimeError("Nutrient model not initialized")
            
            # Preprocess the image
            processed_img = self.preprocess_image(image_data)
            
            # Get predictions from the model
            with torch.no_grad():
                predictions = self.nutrient_model(processed_img)
            
            # Convert predictions to numpy array
            predictions_np = predictions.squeeze().cpu().numpy()
            
            # Create result dictionary
            result = {
                'success': True,
                'nutrients': {}
            }
            
            # Map predictions to nutrient names
            for name, value in zip(self.nutrient_names, predictions_np):
                # Ensure non-negative values and round to 2 decimal places
                result['nutrients'][name] = max(0, round(float(value), 2))
            
            logging.info(f"✅ Nutrient prediction completed: {result['nutrients']}")
            return result
            
        except Exception as e:
            logging.error(f"Error during nutrient prediction: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'nutrients': {}
            }
    
    def classify_food(self, image_data, topk=5):
        """
        Classify food image and detect if it's food or not
        
        Args:
            image_data: Raw image data (bytes or PIL Image)
            topk: Number of top predictions to return
        
        Returns:
            dict: {
                'success': bool,
                'is_food': bool,
                'food_confidence': float (0-1),
                'predictions': [
                    {'class_name': str, 'confidence': float},
                    ...
                ]
            }
        """
        try:
            if self.food_classifier_model is None:
                raise RuntimeError("Food classifier model not initialized")
            
            processed_img = self.preprocess_image(image_data)
            
            with torch.no_grad():
                multi_logits, bin_logit = self.food_classifier_model(processed_img)
                
                # Binary classification (food vs not-food)
                bin_prob = torch.sigmoid(bin_logit).item()
                is_food = bin_prob > 0.5
                
                # Multi-class classification
                multi_probs = F.softmax(multi_logits, dim=1).cpu().numpy().squeeze()
                topk_idx = multi_probs.argsort()[::-1][:topk]
                
                # Map indices to class names
                class_names = ["not_food"] + self.food_classes
                predictions = []
                
                for idx in topk_idx:
                    class_name = class_names[idx] if idx < len(class_names) else f"unknown_{idx}"
                    confidence = float(multi_probs[idx])
                    predictions.append({
                        'class_name': class_name,
                        'confidence': confidence
                    })
            
            result = {
                'success': True,
                'is_food': is_food,
                'food_confidence': round(bin_prob, 4),
                'predictions': predictions
            }
            
            logging.info(f"✅ Food classification completed: is_food={is_food}, confidence={bin_prob:.2%}")
            return result
            
        except Exception as e:
            logging.error(f"Error during food classification: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'is_food': False,
                'food_confidence': 0.0,
                'predictions': []
            }
    
    def is_model_ready(self):
        """Check if models are ready for predictions"""
        return self.nutrient_model is not None or self.food_classifier_model is not None

# Global instance
ml_service = None

def init_ml_service():
    """Initialize the ML service"""
    global ml_service
    try:
        ml_service = MLModelService()
        logging.info("ML Service initialized successfully")
        return True
    except Exception as e:
        logging.error(f"Failed to initialize ML Service: {str(e)}")
        return False

def get_ml_service():
    """Get the global ML service instance"""
    global ml_service
    if ml_service is None:
        if not init_ml_service():
            raise RuntimeError("ML Service not available")
    return ml_service
