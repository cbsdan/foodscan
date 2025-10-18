from flask_mail import Mail, Message
from flask import current_app
import os
import logging
from datetime import datetime
import random

# Global mail instance
mail = None

def init_mail(app):
    """Initialize Flask-Mail with the app"""
    global mail
    
    # Configure Flask-Mail
    app.config['MAIL_SERVER'] = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('SMTP_PORT', 465))
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USERNAME'] = os.getenv('SMTP_EMAIL')
    app.config['MAIL_PASSWORD'] = os.getenv('SMTP_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = (
        os.getenv('SMTP_FROM_NAME', 'FoodScan'),
        os.getenv('SMTP_FROM_EMAIL', os.getenv('SMTP_EMAIL'))
    )
    
    mail = Mail(app)
    logging.info("Flask-Mail initialized successfully")

def send_email(to_email, subject, html_content, text_content=None):
    """Send email using Flask-Mail"""
    try:
        if not mail:
            raise Exception("Mail service not initialized")
        
        msg = Message(
            subject=subject,
            recipients=[to_email],
            html=html_content,
            body=text_content
        )
        
        mail.send(msg)
        logging.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        raise e

def generate_otp(length=5):
    """Generate OTP of specified length"""
    return str(random.randint(10**(length-1), 10**length - 1))

from datetime import datetime

def create_otp_email_template(otp, purpose="verification"):
    """Create HTML email template for OTP — FoodScan branding"""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #FF6B35; margin: 0; font-size: 28px;">FoodScan</h1>
            <p style="color: #6b6b6b; margin: 6px 0 0 0; font-size: 14px;">Instant nutrient estimates from food photos</p>
            <div style="height: 4px; background: linear-gradient(to right, #FF6B35, #2E7D32); margin: 12px auto; width: 100px; border-radius: 2px;"></div>
        </div>

        <div style="background-color: #fbfbfb; padding: 22px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2E7D32; margin: 0 0 12px 0; text-align: center;">Email {purpose.title()}</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 18px 0;">
                Use the One-Time Password below to complete your {purpose}.
            </p>

            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 34px; font-weight: 700; letter-spacing: 6px; padding: 18px 26px; background-color: #ffffff; border: 2px solid #FF6B35; border-radius: 8px; color: #FF6B35; display: inline-block;">
                    {otp}
                </div>
                <p style="color: #888; font-size: 13px; margin-top: 12px;">This code expires in 10 minutes.</p>
            </div>
        </div>

        <div style="padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; background-color: #f7fff7;">
            <p style="color: #333; font-size: 13px; margin: 0;">
                Why FoodScan? Fast nutrient estimates. Photo-based portion sizing. Actionable nutrition info.
            </p>
        </div>

        <div style="text-align: center; padding: 16px 0; border-top: 1px solid #eee; color: #999; font-size: 13px;">
            <p style="margin: 0 0 8px 0;">If you did not request this, ignore this message.</p>
            <p style="margin: 0;">Support: support@foodscan.example</p>
            <p style="margin: 12px 0 0 0; font-weight: 600;">&copy; {datetime.now().year} FoodScan</p>
        </div>
    </div>
    """

def create_welcome_email_template(user_name):
    """Create welcome email template — FoodScan branding"""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #FF6B35; margin: 0; font-size: 28px;">Welcome to FoodScan</h1>
            <p style="color: #6b6b6b; margin: 6px 0 0 0; font-size: 14px;">Smart nutrition from photos</p>
            <div style="height: 4px; background: linear-gradient(to right, #FF6B35, #2E7D32); margin: 12px auto; width: 150px; border-radius: 2px;"></div>
        </div>

        <div style="margin-bottom: 20px;">
            <h2 style="color: #2E7D32; margin: 0 0 12px 0;">Hello {user_name},</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                Your FoodScan account is ready. You can now estimate calories and nutrients by taking photos of your meals.
            </p>
        </div>

        <div style="background-color: #fbfbfb; padding: 20px; border-radius: 8px; margin-bottom: 18px;">
            <h3 style="color: #FF6B35; margin: 0 0 12px 0;">Get started</h3>
            <ul style="color: #444; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
                <li>Complete your profile</li>
                <li>Take a photo of a meal to estimate nutrients</li>
                <li>Save favorites and track intake</li>
                <li>Export or share reports</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 18px 0;">
            <a href="#" style="background-color: #2E7D32; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block;">
                Open FoodScan
            </a>
        </div>

        <div style="text-align: center; padding: 14px 0; border-top: 1px solid #eee; color: #999; font-size: 13px;">
            <p style="margin: 0 0 8px 0;">Need help? support@foodscan.example</p>
            <p style="margin: 12px 0 0 0; font-weight: 600;">&copy; {datetime.now().year} FoodScan</p>
        </div>
    </div>
    """

# OTP Storage (in production, use Redis or database)
otp_store = {}

class OTPService:
    @staticmethod
    def generate_and_store_otp(email, purpose="verification", length=5, expires_in_minutes=10):
        """Generate OTP and store with expiration"""
        otp = generate_otp(length)
        expires_at = datetime.now().timestamp() + (expires_in_minutes * 60)
        
        otp_store[email] = {
            'otp': otp,
            'purpose': purpose,
            'expires_at': expires_at,
            'attempts': 0,
            'max_attempts': 3
        }
        
        logging.info(f"OTP generated for {email} - Purpose: {purpose}")
        return otp
    
    @staticmethod
    def verify_otp(email, otp):
        """Verify OTP"""
        stored_data = otp_store.get(email)
        
        if not stored_data:
            return False, "OTP not found or expired"
        
        # Check expiration
        if datetime.now().timestamp() > stored_data['expires_at']:
            del otp_store[email]
            return False, "OTP has expired"
        
        # Check attempts
        if stored_data['attempts'] >= stored_data['max_attempts']:
            del otp_store[email]
            return False, "Maximum verification attempts exceeded"
        
        # Verify OTP
        if stored_data['otp'] != otp:
            stored_data['attempts'] += 1
            return False, f"Invalid OTP. {stored_data['max_attempts'] - stored_data['attempts']} attempts remaining"
        
        # Success - clean up
        purpose = stored_data['purpose']
        del otp_store[email]
        return True, f"{purpose} successful"
    
    @staticmethod
    def send_otp_email(email, purpose="verification"):
        """Generate and send OTP via email"""
        try:
            otp = OTPService.generate_and_store_otp(email, purpose)
            html_content = create_otp_email_template(otp, purpose)
            
            send_email(
                to_email=email,
                subject=f"FoodScan - Your {purpose.title()} Code",
                html_content=html_content,
                text_content=f"Your FoodScan {purpose} code is: {otp}. This code will expire in 10 minutes."
            )
            
            logging.info(f"OTP email sent successfully to {email}")
            return True, "OTP sent successfully"
            
        except Exception as e:
            logging.error(f"Failed to send OTP email to {email}: {str(e)}")
            return False, f"Failed to send OTP: {str(e)}"

    @staticmethod
    def send_welcome_email(email, user_name):
        """Send welcome email to new user"""
        try:
            html_content = create_welcome_email_template(user_name)
            
            send_email(
                to_email=email,
                subject="Welcome to FoodScan - Let's Start Your Journey",
                html_content=html_content,
                text_content=f"Welcome to FoodScan, {user_name}! Your account has been successfully created."
            )
            
            logging.info(f"Welcome email sent successfully to {email}")
            return True, "Welcome email sent successfully"
            
        except Exception as e:
            logging.error(f"Failed to send welcome email to {email}: {str(e)}")
            return False, f"Failed to send welcome email: {str(e)}"
