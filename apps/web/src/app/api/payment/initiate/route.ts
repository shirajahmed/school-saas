import { NextRequest, NextResponse } from 'next/server';
import { phonePeService } from '@/lib/phonepe';

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE CALLED ===');
  
  try {
    console.log('API: Payment initiate called');
    console.log('API: Environment variables check:');
    console.log('PHONEPE_BASE_URL:', process.env.PHONEPE_BASE_URL);
    console.log('PHONEPE_CLIENT_ID:', process.env.PHONEPE_CLIENT_ID ? 'Set' : 'Missing');
    
    const body = await request.json();
    console.log('API: Request body:', body);
    
    const { amount, merchantTransactionId, merchantUserId, redirectUrl, callbackUrl } = body;

    console.log('API: About to call PhonePe service...');
    
    const paymentResponse = await phonePeService.initiatePayment({
      amount,
      merchantTransactionId,
      merchantUserId,
      redirectUrl,
      callbackUrl,
    });

    console.log('API: PhonePe response received:', paymentResponse);

    return NextResponse.json(paymentResponse);
  } catch (error) {
    console.error('API: Payment initiation error:', error);
    console.error('API: Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Payment initiation failed', details: error.message },
      { status: 500 }
    );
  }
}
