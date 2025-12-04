import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Test API: Environment variables:');
    console.log('PHONEPE_BASE_URL:', process.env.PHONEPE_BASE_URL);
    console.log('PHONEPE_CLIENT_ID:', process.env.PHONEPE_CLIENT_ID);
    console.log('PHONEPE_CLIENT_SECRET:', process.env.PHONEPE_CLIENT_SECRET ? 'Set' : 'Missing');
    console.log('PHONEPE_CLIENT_VERSION:', process.env.PHONEPE_CLIENT_VERSION);

    return NextResponse.json({
      baseUrl: process.env.PHONEPE_BASE_URL,
      clientId: process.env.PHONEPE_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.PHONEPE_CLIENT_SECRET ? 'Set' : 'Missing',
      clientVersion: process.env.PHONEPE_CLIENT_VERSION
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
