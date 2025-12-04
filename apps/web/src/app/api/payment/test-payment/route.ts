import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing PhonePe payment API...');
    
    // Get token first
    const tokenResponse = await fetch(`${process.env.PHONEPE_BASE_URL}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.PHONEPE_CLIENT_ID!,
        client_version: process.env.PHONEPE_CLIENT_VERSION!,
        client_secret: process.env.PHONEPE_CLIENT_SECRET!,
        grant_type: 'client_credentials',
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token received:', tokenData);

    // Test payment API
    const payload = {
      merchantOrderId: `TEST${Date.now()}`,
      amount: 1000,
      expireAfter: 1200,
      metaInfo: {
        udf1: "test_user",
        udf2: "onboarding_payment",
        udf3: "school_saas"
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Test Payment",
        merchantUrls: {
          redirectUrl: "https://google.com"
        }
      }
    };

    console.log('Payment payload:', payload);

    const paymentResponse = await fetch(`${process.env.PHONEPE_BASE_URL}/checkout/v2/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const paymentData = await paymentResponse.json();
    console.log('Payment response:', paymentData);

    return NextResponse.json({
      tokenStatus: tokenResponse.status,
      paymentStatus: paymentResponse.status,
      paymentData: paymentData
    });
  } catch (error) {
    console.error('Payment test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
