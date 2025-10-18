import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app, g
import logging

def generate_token(user_id, expires_delta=None):
    """Generate a JWT token for a user"""
    if expires_delta is None:
        expires_delta = current_app.config.get('JWT_EXPIRES_TIME', timedelta(days=7))
    
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + expires_delta,
        'iat': datetime.utcnow()
    }
    
    secret = current_app.config.get('JWT_SECRET')
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token

def decode_token(token):
    """Decode and verify a JWT token"""
    try:
        secret = current_app.config.get('JWT_SECRET')
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        logging.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logging.warning(f"Invalid token: {str(e)}")
        return None

def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else auth_header
            except IndexError:
                return jsonify({'success': False, 'message': 'Token format is invalid'}), 401
        
        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is missing'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'success': False, 'message': 'Token is invalid or expired'}), 401
        
        g.user_id = payload.get('user_id')
        return f(*args, **kwargs)
    
    return decorated

def get_current_user_id():
    """Get the current authenticated user's ID"""
    return getattr(g, 'user_id', None)
