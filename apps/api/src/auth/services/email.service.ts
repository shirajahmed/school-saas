import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    // Check if email credentials are provided
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Email features will be disabled.');
      return;
    }

    try {
      // Using Gmail SMTP (free tier)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      this.isConfigured = true;
      console.log('Email service configured successfully');
    } catch (error) {
      console.error('Failed to configure email service:', error);
    }
  }

  async sendNotificationEmail(email: string, title: string, message: string, firstName: string) {
    if (!this.isConfigured) {
      console.log('Email not configured. Notification email for', email);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #495057; margin-top: 0;">📢 ${title}</h2>
            
            <p>Dear ${firstName},</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              This is an automated notification from your School Management System.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent to:', email);
    } catch (error) {
      console.error('Failed to send notification email:', error.message);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, schoolName: string, firstName: string) {
    if (!this.isConfigured) {
      console.log('Email not configured. Welcome email for', email);
      return;
    }

    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to ${schoolName} Dashboard! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745; text-align: center;">🎉 Welcome to Your School Dashboard!</h1>
          
          <p>Dear ${firstName},</p>
          
          <p>Congratulations! Your school <strong>${schoolName}</strong> has been successfully set up on our School Management System.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">🚀 What's Next?</h3>
            <ul style="color: #6c757d;">
              <li>Access your admin dashboard</li>
              <li>Add teachers and staff members</li>
              <li>Create student accounts</li>
              <li>Set up classes and subjects</li>
              <li>Configure school settings</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #495057; margin-top: 0;">📞 Need Help?</h4>
            <p style="margin-bottom: 0; color: #6c757d;">
              Our support team is here to help you get started. Contact us anytime!
            </p>
          </div>
          
          <p style="color: #6c757d; font-size: 14px; text-align: center;">
            Thank you for choosing our School Management System!
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent to:', email);
    } catch (error) {
      console.error('Failed to send welcome email:', error.message);
    }
  }

  async sendOnboardingEmail(email: string, schoolName: string, onboardingToken: string) {
    if (!this.isConfigured) {
      console.log('Email not configured. Onboarding token for', email, 'is:', onboardingToken);
      return;
    }

    const onboardingUrl = `${process.env.FRONTEND_URL}/onboarding?token=${onboardingToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Complete ${schoolName} Onboarding - School Management System`,
      html: `
        <h2>Welcome to School Management System!</h2>
        <p>Your school <strong>${schoolName}</strong> has been successfully registered.</p>
        <p>To complete your setup and access your admin dashboard, please complete the onboarding process:</p>
        <a href="${onboardingUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
          Complete Onboarding
        </a>
        <p>Or copy this link: ${onboardingUrl}</p>
        <p><strong>What's next after onboarding:</strong></p>
        <ul>
          <li>Access your admin dashboard</li>
          <li>Add school branches</li>
          <li>Create teacher and student accounts</li>
          <li>Set up classes and subjects</li>
        </ul>
        <p>This link will expire in 24 hours.</p>
        <p>If you have any questions, please contact our support team.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Onboarding email sent to:', email);
    } catch (error) {
      console.error('Failed to send onboarding email:', error.message);
      console.log('Onboarding token for', email, 'is:', onboardingToken);
    }
  }

  async sendRegistrationEmail(email: string, schoolName: string) {
    if (!this.isConfigured) {
      console.log('Email not configured. Skipping registration email to:', email);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to ${schoolName} - School Management System`,
      html: `
        <h2>Welcome to ${schoolName}!</h2>
        <p>Your school has been successfully registered with our School Management System.</p>
        <p>You can now login and start managing your school.</p>
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Login to your admin dashboard</li>
          <li>Complete your school profile</li>
          <li>Add branches and users</li>
        </ul>
        <p>If you have any questions, please contact our support team.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Registration email sent to:', email);
    } catch (error) {
      console.error('Failed to send registration email:', error.message);
    }
  }

  async sendOtp(email: string, otp: string) {
    if (!this.isConfigured) {
      console.log('Email not configured. OTP for', email, 'is:', otp);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - School Management System',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #007bff; font-size: 32px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent to:', email);
    } catch (error) {
      console.error('Failed to send OTP email:', error.message);
      // Log OTP to console for development
      console.log('OTP for', email, 'is:', otp);
    }
  }

  async sendSetupEmail(email: string, setupToken: string) {
    if (!this.isConfigured) {
      console.log('Email not configured. Setup token for', email, 'is:', setupToken);
      return;
    }

    const setupUrl = `${process.env.FRONTEND_URL}/setup-account?token=${setupToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Complete Your Account Setup - School Management System',
      html: `
        <h2>Account Setup Required</h2>
        <p>An account has been created for you in the School Management System.</p>
        <p>Click the link below to complete your account setup:</p>
        <a href="${setupUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Complete Setup
        </a>
        <p>Or copy this link: ${setupUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Setup email sent to:', email);
    } catch (error) {
      console.error('Failed to send setup email:', error.message);
      console.log('Setup token for', email, 'is:', setupToken);
    }
  }
}
