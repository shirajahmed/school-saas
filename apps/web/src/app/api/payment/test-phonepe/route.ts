import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing PhonePe token API...');
    
    const response = await fetch(`${process.env.PHONEPE_BASE_URL}/v1/oauth/token`, {
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

    const data = await response.json();
    console.log('PhonePe token response:', data);

    return NextResponse.json({
      status: response.status,
      data: data
    });
  } catch (error) {
    console.error('PhonePe token test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
