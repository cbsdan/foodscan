from flask import Blueprint, request
from controllers.auth_controller import AuthController
from utils.jwt_utils import token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    return AuthController.register(request.get_json())

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    return AuthController.login(request.get_json())

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get current user profile"""
    return AuthController.get_profile()

@auth_bp.route('/profile', methods=['PUT', 'PATCH'])
@token_required
def update_profile():
    """Update current user profile"""
    return AuthController.update_profile(request.get_json())

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password"""
    return AuthController.change_password(request.get_json())

@auth_bp.route('/avatar', methods=['POST'])
@token_required
def update_avatar():
    """Update user avatar"""
    from flask import request
    file = request.files.get('avatar')
    return AuthController.update_avatar(file)

@auth_bp.route('/avatar', methods=['DELETE'])
@token_required
def delete_avatar():
    """Delete user avatar"""
    return AuthController.delete_avatar()

@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify_token():
    """Verify if token is valid"""
    return AuthController.verify_token()

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout user"""
    from flask import jsonify
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200
