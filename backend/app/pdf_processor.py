"""
PDF処理モジュール
PyMuPDFを使用してPDFの帯置き換え処理を実行
"""
import io
import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class PDFProcessor:
    """PDF処理クラス"""
    
    def __init__(self):
        self.dpi = 72  # PDF標準DPI
        
    def mm_to_points(self, mm: float) -> float:
        """ミリメートルをポイント（PDF座標系）に変換"""
        return mm * self.dpi / 25.4
    
    def points_to_mm(self, points: float) -> float:
        """ポイント（PDF座標系）をミリメートルに変換"""
        return points * 25.4 / self.dpi
    
    def create_band_image(self, 
                         width: int, 
                         height: int, 
                         background_color: str = "#ffffff",
                         text_content: Optional[str] = None,
                         text_color: str = "#000000") -> Image.Image:
        """
        帯用の画像を生成
        
        Args:
            width: 画像の幅（ピクセル）
            height: 画像の高さ（ピクセル）
            background_color: 背景色
            text_content: テキスト内容
            text_color: テキスト色
            
        Returns:
            PIL Image object
        """
        # 新しい画像を作成
        img = Image.new('RGB', (width, height), background_color)
        
        if text_content:
            draw = ImageDraw.Draw(img)
            
            # フォントサイズを動的に調整
            font_size = min(height // 3, 48)  # 高さに応じてフォントサイズを調整
            
            try:
                # システムフォントを使用（日本語対応）
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
            except (OSError, IOError):
                # フォントが見つからない場合はデフォルトフォントを使用
                font = ImageFont.load_default()
            
            # テキストのサイズを取得
            bbox = draw.textbbox((0, 0), text_content, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # 中央に配置
            x = (width - text_width) // 2
            y = (height - text_height) // 2
            
            # テキストを描画
            draw.text((x, y), text_content, fill=text_color, font=font)
        
        return img
    
    def replace_band_with_image(self, 
                               pdf_bytes: bytes,
                               band_image: Image.Image,
                               height_mm: float,
                               y_offset_mm: float = 0.0) -> bytes:
        """
        PDFの帯エリアを画像で置き換え
        
        Args:
            pdf_bytes: 元のPDFのバイト列
            band_image: 置き換える画像
            height_mm: 帯の高さ（ミリメートル）
            y_offset_mm: Y位置オフセット（ミリメートル）
            
        Returns:
            処理済みPDFのバイト列
        """
        # PDFを開く
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        try:
            # 各ページを処理
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                
                # ページサイズを取得
                page_rect = page.rect
                page_width = page_rect.width
                page_height = page_rect.height
                
                # 帯の位置とサイズを計算（ポイント単位）
                band_height_pt = self.mm_to_points(height_mm)
                y_offset_pt = self.mm_to_points(y_offset_mm)
                
                # 帯エリアの矩形を定義
                band_rect = fitz.Rect(0, y_offset_pt, page_width, y_offset_pt + band_height_pt)
                
                # 帯エリアを白で塗りつぶし（既存の内容を消去）
                page.draw_rect(band_rect, color=(1, 1, 1), fill=(1, 1, 1))
                
                # 画像をリサイズ
                band_image_resized = band_image.resize(
                    (int(page_width), int(band_height_pt)), 
                    Image.LANCZOS
                )
                
                # PIL Imageをバイトストリームにエンコード
                img_bytes = io.BytesIO()
                band_image_resized.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                
                # 画像をPDFページに挿入
                page.insert_image(band_rect, stream=img_bytes.getvalue())
                
            # 処理済みPDFをバイト列として返す
            output_bytes = doc.tobytes()
            return output_bytes
            
        except Exception as e:
            logger.error(f"PDF processing error: {e}")
            raise
        finally:
            doc.close()
    
    def replace_band_with_uploaded_image(self, 
                                       pdf_bytes: bytes,
                                       image_bytes: bytes,
                                       height_mm: float,
                                       y_offset_mm: float = 0.0) -> bytes:
        """
        PDFの帯エリアをアップロードされた画像で置き換え
        
        Args:
            pdf_bytes: 元のPDFのバイト列
            image_bytes: アップロードされた画像のバイト列
            height_mm: 帯の高さ（ミリメートル）
            y_offset_mm: Y位置オフセット（ミリメートル）
            
        Returns:
            処理済みPDFのバイト列
        """
        # アップロードされた画像を開く
        band_image = Image.open(io.BytesIO(image_bytes))
        
        # RGBA画像の場合、RGBに変換
        if band_image.mode == 'RGBA':
            background = Image.new('RGB', band_image.size, (255, 255, 255))
            background.paste(band_image, mask=band_image.split()[-1])
            band_image = background
        elif band_image.mode != 'RGB':
            band_image = band_image.convert('RGB')
        
        return self.replace_band_with_image(pdf_bytes, band_image, height_mm, y_offset_mm)
    
    def process_pdf(self, 
                   pdf_bytes: bytes,
                   height_mm: float,
                   y_offset_mm: float = 0.0,
                   background_color: str = "#ffffff",
                   text_content: Optional[str] = None,
                   text_color: str = "#000000",
                   replace_image_bytes: Optional[bytes] = None) -> bytes:
        """
        PDFの帯置き換え処理のメインメソッド
        
        Args:
            pdf_bytes: 元のPDFのバイト列
            height_mm: 帯の高さ（ミリメートル）
            y_offset_mm: Y位置オフセット（ミリメートル）
            background_color: 背景色
            text_content: テキスト内容
            text_color: テキスト色
            replace_image_bytes: 置き換える画像のバイト列（オプション）
            
        Returns:
            処理済みPDFのバイト列
        """
        if replace_image_bytes:
            # アップロードされた画像で置き換え
            return self.replace_band_with_uploaded_image(
                pdf_bytes, replace_image_bytes, height_mm, y_offset_mm
            )
        else:
            # 色とテキストで帯を生成
            # 仮の幅（実際の処理では各ページの幅に合わせて調整）
            temp_width = int(self.mm_to_points(210))  # A4幅
            temp_height = int(self.mm_to_points(height_mm))
            
            band_image = self.create_band_image(
                temp_width, temp_height, background_color, text_content, text_color
            )
            
            return self.replace_band_with_image(pdf_bytes, band_image, height_mm, y_offset_mm)
    
    def validate_pdf(self, pdf_bytes: bytes) -> Tuple[bool, str]:
        """
        PDFファイルの妥当性を検証
        
        Args:
            pdf_bytes: PDFのバイト列
            
        Returns:
            (妥当性, エラーメッセージ)
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            if len(doc) == 0:
                return False, "PDFにページが含まれていません"
            
            if len(doc) > 50:  # 最大50ページまで
                return False, "PDFのページ数が多すぎます（最大50ページ）"
            
            doc.close()
            return True, ""
            
        except Exception as e:
            return False, f"PDFファイルが破損しているか、形式が正しくありません: {e}"