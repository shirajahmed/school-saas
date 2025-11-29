import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendOtp(email: string, otp: string): Promise<void> {
    // For now, just log the OTP. In production, integrate with email service
    console.log(`OTP for ${email}: ${otp}`);
    
    // TODO: Integrate with email service like SendGrid, AWS SES, etc.
    // Example:
    // await this.emailProvider.send({
    //   to: email,
    //   subject: 'Password Reset OTP',
    //   text: `Your OTP is: ${otp}. Valid for 10 minutes.`
    // });
  }
}
