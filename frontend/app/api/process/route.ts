import { NextRequest, NextResponse } from 'next/server';

/**
 * PDF処理APIルート
 * Next.js API Routeを通じてFastAPIバックエンドにリクエストをプロキシ
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディをそのまま転送
    const formData = await request.formData();
    
    // バックエンドAPIのURL（開発環境では localhost:8000 を想定）
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    // FastAPI バックエンドにリクエストを転送
    const response = await fetch(`${backendUrl}/process`, {
      method: 'POST',
      body: formData,
      // FormDataの場合、Content-Typeヘッダーは自動設定される
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error || 'Processing failed' },
        { status: response.status }
      );
    }
    
    // レスポンスヘッダーをコピー
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/pdf');
    headers.set('Content-Disposition', response.headers.get('Content-Disposition') || 'attachment; filename=modified.pdf');
    
    // バイナリデータをそのままクライアントに返す
    const pdfBuffer = await response.arrayBuffer();
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('API Route error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'PDF Processing API',
    methods: ['POST'],
    version: '1.0.0'
  });
}