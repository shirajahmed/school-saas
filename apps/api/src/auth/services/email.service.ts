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
