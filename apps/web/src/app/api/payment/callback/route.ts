import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantTransactionId, transactionId, amount, status } = body;

    // Call your backend API to complete onboarding step 3
    const backendResponse = await fetch(`${process.env.API_URL}/onboarding/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: merchantTransactionId, // Using merchantTransactionId as onboarding token
        step: 3,
        stepData: {
          paymentMethod: 'phonepe',
          paymentToken: transactionId,
          paymentStatus: status,
          amount: amount
        }
      }),
    });

    const result = await backendResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment processed successfully',
      data: result 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Payment callback failed' },
      { status: 500 }
    );
  }
}
