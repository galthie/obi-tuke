from pydantic import BaseModel, Field
from typing import Optional

class BandSettings(BaseModel):
    """帯の設定を定義するモデル"""
    height: float = Field(..., ge=5.0, le=300.0, description="帯の高さ（ミリメートル）")
    yOffset: float = Field(default=0.0, ge=0.0, description="Y位置オフセット（ミリメートル）")
    backgroundColor: Optional[str] = Field(default=None, description="背景色（16進数）")
    textContent: Optional[str] = Field(default=None, description="テキスト内容")
    textColor: Optional[str] = Field(default="#000000", description="テキスト色（16進数）")

class ProcessRequest(BaseModel):
    """PDF処理リクエストモデル"""
    settings: BandSettings

class ProcessResponse(BaseModel):
    """PDF処理レスポンスモデル"""
    success: bool
    message: str
    jobId: Optional[str] = None
    downloadUrl: Optional[str] = None

class ErrorResponse(BaseModel):
    """エラーレスポンスモデル"""
    error: str
    detail: Optional[str] = None