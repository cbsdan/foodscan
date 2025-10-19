from flask import request, jsonify, g
from models.user import User
from utils.jwt_utils import generate_token, get_current_user_id
from config.database import get_db
import logging

class AuthController:
    
    @staticmethod
    def send_registration_otp(request_data):
        """Send OTP to email for registration verification"""
        try:
            email = request_data.get('email')
            
            if not email:
                return jsonify({
                    'success': False,
                    'message': 'Email is required'
                }), 400
            
            # Check if email already exists
            db = get_db()
            user_model = User(db)
            if user_model.find_by_email(email):
                return jsonify({
                    'success': False,
                    'message': 'Email already registered'
                }), 400
            
            # Send OTP
            from services.email_service import OTPService
            success, message = OTPService.send_otp_email(email, purpose="registration")
            
            if success:
                logging.info(f"Registration OTP sent to: {email}")
                return jsonify({
                    'success': True,
                    'message': 'OTP sent to your email. Please verify to complete registration.'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 500
                
        except Exception as e:
            logging.error(f"Send OTP error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while sending OTP'
            }), 500
    
    @staticmethod
    def register(request_data):
        """Register a new user with OTP verification"""
        try:
            email = request_data.get('email')
            username = request_data.get('username')
            password = request_data.get('password')
            first_name = request_data.get('first_name')
            last_name = request_data.get('last_name')
            otp = request_data.get('otp')
            
            if not email or not username or not password:
                return jsonify({
                    'success': False,
                    'message': 'Email, username, and password are required'
                }), 400
            
            if not otp:
                return jsonify({
                    'success': False,
                    'message': 'OTP is required. Please request OTP first.'
                }), 400
            
            # Verify OTP
            from services.email_service import OTPService
            is_valid, message = OTPService.verify_otp(email, otp)
            
            if not is_valid:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400
            
            # Log for debugging (remove in production)
            logging.info(f"Creating user with email: {email}, username: {username}, password length: {len(password)}")
            
            # Create user after OTP verification
            db = get_db()
            user_model = User(db)
            user = user_model.create_user(
                email=email,
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Mark user as verified
            user_model.update_user(user['_id'], {'is_verified': True})
            user = user_model.find_by_id(user['_id'])
            
            token = generate_token(user['_id'])
            
            # Send welcome email
            try:
                OTPService.send_welcome_email(email, first_name or username)
            except:
                pass  # Don't fail registration if welcome email fails
            
            logging.info(f"User registered successfully: {email}")
            
            return jsonify({
                'success': True,
                'message': 'User registered successfully',
                'data': {
                    'user': user,
                    'token': token
                }
            }), 201
            
        except ValueError as e:
            logging.warning(f"Registration validation error: {str(e)}")
            return jsonify({
                'success': False,
                'message': str(e)
            }), 400
            
        except Exception as e:
            logging.error(f"Registration error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred during registration'
            }), 500
    
    @staticmethod
    def login(request_data):
        """Login user"""
        try:
            login_identifier = request_data.get('email') or request_data.get('username')
            password = request_data.get('password')
            
            if not login_identifier or not password:
                return jsonify({
                    'success': False,
                    'message': 'Email/username and password are required'
                }), 400
            
            # Log for debugging (remove in production)
            logging.info(f"Login attempt for: {login_identifier}, password length: {len(password)}")
            
            db = get_db()
            user_model = User(db)
            
            # Get user with password for authentication
            if '@' in login_identifier:
                user = user_model.find_by_email_with_password(login_identifier)
            else:
                user = user_model.find_by_username_with_password(login_identifier)
            
            # Debug logging
            if user:
                logging.info(f"User found: {user.get('email')}, has password: {'password' in user}")
            else:
                logging.info(f"User not found for: {login_identifier}")
            
            if not user or not user_model.verify_password(user, password):
                logging.warning(f"Failed login attempt for: {login_identifier}")
                return jsonify({
                    'success': False,
                    'message': 'Invalid credentials'
                }), 401
            
            if not user.get('is_active', True):
                return jsonify({
                    'success': False,
                    'message': 'Account is deactivated'
                }), 403
            
            token = generate_token(user['_id'])
            
            # Remove password before sending response
            user.pop('password', None)
            
            logging.info(f"User logged in successfully: {login_identifier}")
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'data': {
                    'user': user,
                    'token': token
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Login error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred during login'
            }), 500
    
    @staticmethod
    def get_profile():
        """Get current user profile"""
        try:
            user_id = get_current_user_id()
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'User not authenticated'
                }), 401
            
            db = get_db()
            user_model = User(db)
            user = user_model.find_by_id(user_id)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            return jsonify({
                'success': True,
                'data': {
                    'user': user
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Get profile error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while fetching profile'
            }), 500
    
    @staticmethod
    def update_profile(request_data):
        """Update current user profile"""
        try:
            user_id = get_current_user_id()
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'User not authenticated'
                }), 401
            
            db = get_db()
            user_model = User(db)
            
            update_data = {}
            if 'first_name' in request_data:
                update_data['first_name'] = request_data['first_name']
            if 'last_name' in request_data:
                update_data['last_name'] = request_data['last_name']
            if 'profile_image' in request_data:
                update_data['profile_image'] = request_data['profile_image']
            
            if not update_data:
                return jsonify({
                    'success': False,
                    'message': 'No update data provided'
                }), 400
            
            user = user_model.update_user(user_id, update_data)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found or update failed'
                }), 404
            
            logging.info(f"User profile updated: {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'data': {
                    'user': user
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Update profile error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while updating profile'
            }), 500
    
    @staticmethod
    def change_password(request_data):
        """Change user password"""
        try:
            user_id = get_current_user_id()
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'User not authenticated'
                }), 401
            
            old_password = request_data.get('old_password')
            new_password = request_data.get('new_password')
            
            if not old_password or not new_password:
                return jsonify({
                    'success': False,
                    'message': 'Old password and new password are required'
                }), 400
            
            db = get_db()
            user_model = User(db)
            success = user_model.change_password(user_id, old_password, new_password)
            
            if not success:
                return jsonify({
                    'success': False,
                    'message': 'Failed to change password'
                }), 400
            
            logging.info(f"Password changed for user: {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Password changed successfully'
            }), 200
            
        except ValueError as e:
            logging.warning(f"Change password validation error: {str(e)}")
            return jsonify({
                'success': False,
                'message': str(e)
            }), 400
            
        except Exception as e:
            logging.error(f"Change password error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while changing password'
            }), 500
    
    @staticmethod
    def send_forgot_password_otp(request_data):
        """Send OTP to email for password reset"""
        try:
            email = request_data.get('email')
            
            if not email:
                return jsonify({
                    'success': False,
                    'message': 'Email is required'
                }), 400
            
            # Check if email exists
            db = get_db()
            user_model = User(db)
            user = user_model.find_by_email(email)
            
            if not user:
                # For security, don't reveal if email exists or not
                return jsonify({
                    'success': True,
                    'message': 'If the email exists, an OTP has been sent.'
                }), 200
            
            # Send OTP
            from services.email_service import OTPService
            success, message = OTPService.send_otp_email(email, purpose="password reset")
            
            if success:
                logging.info(f"Password reset OTP sent to: {email}")
                return jsonify({
                    'success': True,
                    'message': 'OTP sent to your email. Please verify to reset your password.'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to send OTP. Please try again.'
                }), 500
                
        except Exception as e:
            logging.error(f"Send forgot password OTP error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while sending OTP'
            }), 500
    
    @staticmethod
    def verify_forgot_password_otp(request_data):
        """Verify OTP for password reset"""
        try:
            email = request_data.get('email')
            otp = request_data.get('otp')
            
            if not email or not otp:
                return jsonify({
                    'success': False,
                    'message': 'Email and OTP are required'
                }), 400
            
            # Verify OTP
            from services.email_service import OTPService
            is_valid, message = OTPService.verify_otp(email, otp)
            
            if not is_valid:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400
            
            # Generate a temporary token for password reset (valid for 15 minutes)
            from services.email_service import generate_otp
            reset_token = generate_otp(length=32)
            
            # Store reset token temporarily (in production, use Redis)
            from services.email_service import otp_store
            from datetime import datetime
            otp_store[f"reset_{email}"] = {
                'token': reset_token,
                'expires_at': datetime.now().timestamp() + (15 * 60)
            }
            
            logging.info(f"OTP verified for password reset: {email}")
            
            return jsonify({
                'success': True,
                'message': 'OTP verified successfully',
                'data': {
                    'reset_token': reset_token
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Verify forgot password OTP error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while verifying OTP'
            }), 500
    
    @staticmethod
    def reset_password(request_data):
        """Reset password after OTP verification"""
        try:
            email = request_data.get('email')
            reset_token = request_data.get('reset_token')
            new_password = request_data.get('new_password')
            
            if not email or not reset_token or not new_password:
                return jsonify({
                    'success': False,
                    'message': 'Email, reset token, and new password are required'
                }), 400
            
            # Verify reset token
            from services.email_service import otp_store
            from datetime import datetime
            
            stored_data = otp_store.get(f"reset_{email}")
            
            if not stored_data:
                return jsonify({
                    'success': False,
                    'message': 'Invalid or expired reset token'
                }), 400
            
            if datetime.now().timestamp() > stored_data['expires_at']:
                del otp_store[f"reset_{email}"]
                return jsonify({
                    'success': False,
                    'message': 'Reset token has expired'
                }), 400
            
            if stored_data['token'] != reset_token:
                return jsonify({
                    'success': False,
                    'message': 'Invalid reset token'
                }), 400
            
            # Reset password
            db = get_db()
            user_model = User(db)
            user = user_model.find_by_email(email)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Validate new password
            if len(new_password) < 6:
                return jsonify({
                    'success': False,
                    'message': 'Password must be at least 6 characters long'
                }), 400
            
            # Update password directly in MongoDB (bypass update_user which strips password field)
            from werkzeug.security import generate_password_hash
            from bson.objectid import ObjectId
            hashed_password = generate_password_hash(new_password)
            
            result = user_model.collection.update_one(
                {"_id": ObjectId(user['_id'])},
                {
                    "$set": {
                        "password": hashed_password,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count == 0:
                return jsonify({
                    'success': False,
                    'message': 'Failed to update password'
                }), 500
            
            # Clean up reset token
            del otp_store[f"reset_{email}"]
            
            logging.info(f"Password reset successfully for: {email}")
            
            return jsonify({
                'success': True,
                'message': 'Password reset successfully. You can now login with your new password.'
            }), 200
            
        except ValueError as e:
            logging.warning(f"Reset password validation error: {str(e)}")
            return jsonify({
                'success': False,
                'message': str(e)
            }), 400
            
        except Exception as e:
            logging.error(f"Reset password error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while resetting password'
            }), 500
    
    @staticmethod
    def update_avatar(file):
        """Update user avatar/profile image"""
        try:
            user_id = get_current_user_id()
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'User not authenticated'
                }), 401
            
            if not file:
                return jsonify({
                    'success': False,
                    'message': 'No file provided'
                }), 400
            
            # Validate file type
            allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
            filename = file.filename.lower()
            if not any(filename.endswith(f'.{ext}') for ext in allowed_extensions):
                return jsonify({
                    'success': False,
                    'message': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'
                }), 400
            
            db = get_db()
            user_model = User(db)
            user = user_model.find_by_id(user_id)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Get old public_id if exists
            old_public_id = None
            if user.get('profile_image_public_id'):
                old_public_id = user['profile_image_public_id']
            
            # Upload to Cloudinary
            from services.cloudinary_service import CloudinaryService
            import tempfile
            
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{filename.split(".")[-1]}') as tmp:
                file.save(tmp.name)
                tmp_path = tmp.name
            
            try:
                # Upload avatar
                result = CloudinaryService.upload_avatar(tmp_path, user_id, old_public_id)
                
                # Update user profile
                updated_user = user_model.update_user(user_id, {
                    'profile_image': result['url'],
                    'profile_image_public_id': result['public_id']
                })
                
                # Clean up temp file
                import os
                os.unlink(tmp_path)
                
                logging.info(f"Avatar updated for user: {user_id}")
                
                return jsonify({
                    'success': True,
                    'message': 'Avatar updated successfully',
                    'data': {
                        'user': updated_user
                    }
                }), 200
                
            except Exception as upload_error:
                # Clean up temp file on error
                import os
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                raise upload_error
            
        except Exception as e:
            logging.error(f"Update avatar error: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'An error occurred while updating avatar: {str(e)}'
            }), 500
    
    @staticmethod
    def delete_avatar():
        """Delete user avatar/profile image"""
        try:
            user_id = get_current_user_id()
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'User not authenticated'
                }), 401
            
            db = get_db()
            user_model = User(db)
            user = user_model.find_by_id(user_id)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Delete from Cloudinary if exists
            if user.get('profile_image_public_id'):
                from services.cloudinary_service import CloudinaryService
                CloudinaryService.delete_image(user['profile_image_public_id'])
            
            # Update user profile
            updated_user = user_model.update_user(user_id, {
                'profile_image': None,
                'profile_image_public_id': None
            })
            
            logging.info(f"Avatar deleted for user: {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Avatar deleted successfully',
                'data': {
                    'user': updated_user
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Delete avatar error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while deleting avatar'
            }), 500
    
    @staticmethod
    def verify_token():
        """Verify if the provided token is valid"""
        try:
            user_id = get_current_user_id()
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'Invalid token'
                }), 401
            
            db = get_db()
            user_model = User(db)
            user = user_model.find_by_id(user_id)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'Token is valid',
                'data': {
                    'user': user
                }
            }), 200
            
        except Exception as e:
            logging.error(f"Verify token error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An error occurred while verifying token'
            }), 500
