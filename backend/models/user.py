from pymongo import ASCENDING
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson.objectid import ObjectId
import re

class User:
    """User model for authentication and user management"""
    
    def __init__(self, db):
        self.collection = db.users
        self._ensure_indexes()
    
    def _ensure_indexes(self):
        """Create indexes for better query performance"""
        self.collection.create_index([("email", ASCENDING)], unique=True)
        self.collection.create_index([("username", ASCENDING)], unique=True)
    
    def create_user(self, email, username, password, first_name=None, last_name=None):
        """Create a new user"""
        if not self._is_valid_email(email):
            raise ValueError("Invalid email format")
        
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        
        if self.collection.find_one({"email": email.lower()}):
            raise ValueError("Email already registered")
        
        if self.collection.find_one({"username": username.lower()}):
            raise ValueError("Username already taken")
        
        user_data = {
            "email": email.lower(),
            "username": username.lower(),
            "password": generate_password_hash(password),
            "first_name": first_name,
            "last_name": last_name,
            "is_verified": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "profile_image": None,
            "profile_image_public_id": None,
            "role": "user"
        }
        
        result = self.collection.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return self._serialize_user(user_data)
    
    def find_by_email(self, email):
        """Find user by email"""
        user = self.collection.find_one({"email": email.lower()})
        return self._serialize_user(user) if user else None
    
    def find_by_id(self, user_id):
        """Find user by ID"""
        try:
            user = self.collection.find_one({"_id": ObjectId(user_id)})
            return self._serialize_user(user) if user else None
        except:
            return None
    
    def find_by_username(self, username):
        """Find user by username"""
        user = self.collection.find_one({"username": username.lower()})
        return self._serialize_user(user) if user else None
    
    def verify_password(self, user, password):
        """Verify user password"""
        if not user or 'password' not in user:
            return False
        return check_password_hash(user['password'], password)
    
    def update_user(self, user_id, update_data):
        """Update user information"""
        update_data['updated_at'] = datetime.utcnow()
        update_data.pop('_id', None)
        update_data.pop('email', None)
        update_data.pop('password', None)
        update_data.pop('created_at', None)
        
        result = self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return self.find_by_id(user_id)
        return None
    
    def change_password(self, user_id, old_password, new_password):
        """Change user password"""
        user = self.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        if not self.verify_password(user, old_password):
            raise ValueError("Current password is incorrect")
        
        if len(new_password) < 6:
            raise ValueError("New password must be at least 6 characters long")
        
        result = self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password": generate_password_hash(new_password),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def _is_valid_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def _serialize_user(user):
        """Convert user document to JSON-serializable format"""
        if not user:
            return None
        
        user['_id'] = str(user['_id'])
        user.pop('password', None)
        return user
