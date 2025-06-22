"""
FastAPI バックエンドアプリケーション
PDF帯置き換え処理のためのAPIエンドポイントを提供
"""
import io
import json
import logging
import uuid
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from .models import BandSettings, ProcessResponse, ErrorResponse
from .pdf_processor import PDFProcessor

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPIアプリケーション初期化
app = FastAPI(
    title="Obi-Tuke API",
    description="PDF帯置き換え処理API",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンを設定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PDF処理インスタンス
pdf_processor = PDFProcessor()

@app.get("/")
async def root():
    """ルートエンドポイント - ヘルスチェック"""
    return {"message": "Obi-Tuke API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy", "service": "obi-tuke-api"}

@app.post("/process")
async def process_pdf(
    pdf: UploadFile = File(..., description="処理するPDFファイル"),
    settings: str = Form(..., description="帯設定のJSONデータ"),
    replaceImage: Optional[UploadFile] = File(None, description="置き換える画像ファイル")
):
    """
    PDF帯置き換え処理エンドポイント
    
    Args:
        pdf: アップロードされたPDFファイル
        settings: 帯設定のJSON文字列
        replaceImage: 置き換え用の画像ファイル（オプション）
        
    Returns:
        処理済みPDFファイル
    """
    try:
        # ファイルサイズチェック
        if pdf.size and pdf.size > 10 * 1024 * 1024:  # 10MB制限
            raise HTTPException(
                status_code=413,
                detail="ファイルサイズが大きすぎます（最大10MB）"
            )
        
        # PDFファイルの読み込み
        pdf_bytes = await pdf.read()
        
        # PDFファイルの妥当性検証
        is_valid, error_msg = pdf_processor.validate_pdf(pdf_bytes)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # 設定データの解析
        try:
            settings_data = json.loads(settings)
            band_settings = BandSettings(**settings_data)
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(
                status_code=400,
                detail=f"設定データの形式が正しくありません: {e}"
            )
        
        # 置き換え画像の処理
        replace_image_bytes = None
        if replaceImage:
            if replaceImage.size and replaceImage.size > 5 * 1024 * 1024:  # 5MB制限
                raise HTTPException(
                    status_code=413,
                    detail="画像ファイルサイズが大きすぎます（最大5MB）"
                )
            
            # サポートされている画像形式チェック
            if not replaceImage.content_type or not replaceImage.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail="サポートされていないファイル形式です（画像ファイルのみ）"
                )
            
            replace_image_bytes = await replaceImage.read()
        
        # PDF処理実行
        try:
            processed_pdf_bytes = pdf_processor.process_pdf(
                pdf_bytes=pdf_bytes,
                height_mm=band_settings.height,
                y_offset_mm=band_settings.yOffset,
                background_color=band_settings.backgroundColor or "#ffffff",
                text_content=band_settings.textContent,
                text_color=band_settings.textColor or "#000000",
                replace_image_bytes=replace_image_bytes
            )
        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"PDF処理中にエラーが発生しました: {e}"
            )
        
        # 処理済みPDFを返す
        output_filename = pdf.filename.replace('.pdf', '_modified.pdf') if pdf.filename else 'modified.pdf'
        
        return StreamingResponse(
            io.BytesIO(processed_pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in process_pdf: {e}")
        raise HTTPException(
            status_code=500,
            detail="内部サーバーエラーが発生しました"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTPエラーハンドラー"""
    return ErrorResponse(error=exc.detail, detail=str(exc.status_code))

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """一般的なエラーハンドラー"""
    logger.error(f"Unhandled exception: {exc}")
    return ErrorResponse(
        error="内部サーバーエラーが発生しました",
        detail=str(exc)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)