"""
PDF処理モジュールのユニットテスト
PyMuPDFを使用したPDF操作の機能をテスト
"""
import io
import pytest
from PIL import Image
from backend.app.pdf_processor import PDFProcessor

class TestPDFProcessor:
    """PDFProcessorクラスのテストスイート"""
    
    def setup_method(self):
        """各テストメソッドの前に実行される準備処理"""
        self.processor = PDFProcessor()
    
    def test_mm_to_points_conversion(self):
        """ミリメートルからポイントへの変換テスト"""
        # 25.4mm = 72 points (1 inch)
        assert abs(self.processor.mm_to_points(25.4) - 72.0) < 0.01
        
        # 60mm = 約170.08 points
        result = self.processor.mm_to_points(60)
        expected = 60 * 72 / 25.4
        assert abs(result - expected) < 0.01
    
    def test_points_to_mm_conversion(self):
        """ポイントからミリメートルへの変換テスト"""
        # 72 points = 25.4mm (1 inch)
        assert abs(self.processor.points_to_mm(72.0) - 25.4) < 0.01
        
        # 170.08 points = 約60mm
        result = self.processor.points_to_mm(170.08)
        expected = 170.08 * 25.4 / 72
        assert abs(result - 60.0) < 0.1
    
    def test_create_band_image_basic(self):
        """基本的な帯画像生成テスト"""
        width, height = 400, 100
        
        # 白背景の帯画像を生成
        img = self.processor.create_band_image(width, height, "#ffffff")
        
        assert img.size == (width, height)
        assert img.mode == 'RGB'
        
        # 背景色の確認
        pixel = img.getpixel((50, 50))
        assert pixel == (255, 255, 255)  # 白色
    
    def test_create_band_image_with_color(self):
        """色指定での帯画像生成テスト"""
        width, height = 400, 100
        
        # 赤背景の帯画像を生成
        img = self.processor.create_band_image(width, height, "#ff0000")
        
        # 背景色の確認
        pixel = img.getpixel((50, 50))
        assert pixel == (255, 0, 0)  # 赤色
    
    def test_create_band_image_with_text(self):
        """テキスト付き帯画像生成テスト"""
        width, height = 400, 100
        text_content = "テストバナー"
        
        # テキスト付きの帯画像を生成
        img = self.processor.create_band_image(
            width, height, 
            background_color="#ffffff",
            text_content=text_content,
            text_color="#000000"
        )
        
        assert img.size == (width, height)
        assert img.mode == 'RGB'
        
        # テキストが描画されているかの簡単なチェック
        # （実際のテキスト描画は複雑なので、画像サイズとモードのみ確認）
        
    def test_create_sample_pdf(self):
        """テスト用のサンプルPDFを作成"""
        import fitz
        
        # A4サイズのPDFを作成
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)  # A4サイズ
        
        # 簡単なテキストを追加
        page.insert_text((50, 100), "賃料 ¥72,000", fontsize=16)
        page.insert_text((50, 150), "共益費 ¥3,000", fontsize=12)
        page.insert_text((50, 200), "これはテスト用のPDFです", fontsize=12)
        
        # 上部に帯エリアを示す矩形を描画
        band_rect = fitz.Rect(0, 0, 595, 170)  # 約60mm相当
        page.draw_rect(band_rect, color=(0.8, 0.8, 0.8), fill=(0.9, 0.9, 0.9))
        page.insert_text((250, 85), "帯エリア", fontsize=20)
        
        # PDFをバイト列として保存
        pdf_bytes = doc.tobytes()
        doc.close()
        
        return pdf_bytes
    
    def test_validate_pdf_valid(self):
        """有効なPDFの検証テスト"""
        pdf_bytes = self.create_sample_pdf()
        
        is_valid, error_msg = self.processor.validate_pdf(pdf_bytes)
        
        assert is_valid is True
        assert error_msg == ""
    
    def test_validate_pdf_invalid(self):
        """無効なデータの検証テスト"""
        invalid_data = b"This is not a PDF file"
        
        is_valid, error_msg = self.processor.validate_pdf(invalid_data)
        
        assert is_valid is False
        assert "破損" in error_msg or "形式" in error_msg
    
    def test_validate_pdf_empty(self):
        """空のPDFの検証テスト"""
        import fitz
        
        # 空のPDFを作成
        doc = fitz.open()
        pdf_bytes = doc.tobytes()
        doc.close()
        
        is_valid, error_msg = self.processor.validate_pdf(pdf_bytes)
        
        assert is_valid is False
        assert "ページが含まれていません" in error_msg
    
    def test_process_pdf_with_color_band(self):
        """色指定での帯置き換え処理テスト"""
        pdf_bytes = self.create_sample_pdf()
        
        # 青い帯で置き換え
        processed_pdf = self.processor.process_pdf(
            pdf_bytes=pdf_bytes,
            height_mm=60,
            y_offset_mm=0,
            background_color="#0000ff",
            text_content="新しい帯",
            text_color="#ffffff"
        )
        
        # 処理済みPDFが生成されることを確認
        assert isinstance(processed_pdf, bytes)
        assert len(processed_pdf) > 0
        
        # 処理済みPDFが有効であることを確認
        is_valid, _ = self.processor.validate_pdf(processed_pdf)
        assert is_valid is True
    
    def test_process_pdf_with_image_band(self):
        """画像指定での帯置き換え処理テスト"""
        pdf_bytes = self.create_sample_pdf()
        
        # テスト用の画像を作成
        test_image = Image.new('RGB', (400, 100), color=(255, 165, 0))  # オレンジ色
        img_bytes = io.BytesIO()
        test_image.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # 画像で帯を置き換え
        processed_pdf = self.processor.process_pdf(
            pdf_bytes=pdf_bytes,
            height_mm=60,
            y_offset_mm=0,
            replace_image_bytes=img_bytes.getvalue()
        )
        
        # 処理済みPDFが生成されることを確認
        assert isinstance(processed_pdf, bytes)
        assert len(processed_pdf) > 0
        
        # 処理済みPDFが有効であることを確認
        is_valid, _ = self.processor.validate_pdf(processed_pdf)
        assert is_valid is True
    
    def test_process_pdf_with_offset(self):
        """オフセット指定での帯置き換え処理テスト"""
        pdf_bytes = self.create_sample_pdf()
        
        # Y位置20mmオフセットで帯を配置
        processed_pdf = self.processor.process_pdf(
            pdf_bytes=pdf_bytes,
            height_mm=40,
            y_offset_mm=20,
            background_color="#00ff00",
        )
        
        # 処理済みPDFが生成されることを確認
        assert isinstance(processed_pdf, bytes)
        assert len(processed_pdf) > 0
        
        # 処理済みPDFが有効であることを確認
        is_valid, _ = self.processor.validate_pdf(processed_pdf)
        assert is_valid is True
    
    def test_replace_band_with_uploaded_image_rgba(self):
        """RGBA画像での帯置き換えテスト"""
        pdf_bytes = self.create_sample_pdf()
        
        # RGBA画像を作成（透明度付き）
        test_image = Image.new('RGBA', (400, 100), color=(255, 0, 0, 128))  # 半透明の赤
        img_bytes = io.BytesIO()
        test_image.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # RGBA画像で帯を置き換え（RGB変換が行われる）
        processed_pdf = self.processor.replace_band_with_uploaded_image(
            pdf_bytes=pdf_bytes,
            image_bytes=img_bytes.getvalue(),
            height_mm=60,
            y_offset_mm=0
        )
        
        # 処理済みPDFが生成されることを確認
        assert isinstance(processed_pdf, bytes)
        assert len(processed_pdf) > 0

@pytest.fixture
def sample_pdf_path():
    """テスト用のサンプルPDFファイルパスを提供"""
    return "tests/fixtures/sample.pdf"

@pytest.fixture  
def banner_image_path():
    """テスト用のバナー画像ファイルパスを提供"""
    return "tests/fixtures/banner.png"

def test_integration_with_sample_files(sample_pdf_path, banner_image_path):
    """実際のサンプルファイルを使用した統合テスト"""
    processor = PDFProcessor()
    
    try:
        # サンプルPDFを読み込み
        with open(sample_pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        
        # PDFが有効であることを確認
        is_valid, error_msg = processor.validate_pdf(pdf_bytes)
        if not is_valid:
            pytest.skip(f"サンプルPDFが無効です: {error_msg}")
        
        # バナー画像を読み込み
        with open(banner_image_path, 'rb') as f:
            image_bytes = f.read()
        
        # 画像で帯を置き換え
        processed_pdf = processor.replace_band_with_uploaded_image(
            pdf_bytes=pdf_bytes,
            image_bytes=image_bytes,
            height_mm=60,
            y_offset_mm=0
        )
        
        # 処理済みPDFが有効であることを確認
        is_valid, _ = processor.validate_pdf(processed_pdf)
        assert is_valid is True
        
        # 処理前後でファイルサイズが変わることを確認
        assert len(processed_pdf) != len(pdf_bytes)
        
        # テキスト内容が保持されていることを確認
        import fitz
        doc = fitz.open(stream=processed_pdf, filetype="pdf")
        page = doc.load_page(0)
        text = page.get_text()
        
        # 元のテキストが残っていることを確認
        assert "賃料" in text
        
        doc.close()
        
    except FileNotFoundError:
        pytest.skip("サンプルファイルが見つかりません")