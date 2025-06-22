import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * 帯置き換え機能のE2Eテスト
 * サンプルPDFをアップロードし、帯を置き換えてダウンロードする一連の流れをテスト
 */
test.describe('Band Replacement E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // メインページに移動
    await page.goto('/');
  });

  test('should upload PDF and show preview', async ({ page }) => {
    // ページタイトルを確認
    await expect(page).toHaveTitle(/帯付け替えツール/);
    
    // メインヘッダーの存在確認
    await expect(page.locator('h1')).toContainText('帯付け替えツール');
    
    // アップロードゾーンの存在確認
    const uploadZone = page.locator('[data-testid="upload-zone"]').first();
    await expect(uploadZone).toBeVisible();
    
    // サンプルPDFファイルのパス
    const samplePdfPath = path.join(__dirname, '../fixtures/sample.pdf');
    
    // ファイルアップロード（ドラッグ&ドロップをシミュレート）
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(samplePdfPath);
    
    // ファイルがアップロードされ、プレビューが表示されることを確認
    await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible({ timeout: 10000 });
    
    // ページ情報の表示確認
    await expect(page.locator('text=PDFプレビュー')).toBeVisible();
  });

  test('should replace band with image and download', async ({ page }) => {
    // サンプルファイルのパス
    const samplePdfPath = path.join(__dirname, '../fixtures/sample.pdf');
    const bannerImagePath = path.join(__dirname, '../fixtures/banner.png');
    
    // PDFファイルをアップロード
    const pdfInput = page.locator('input[type="file"]').first();
    await pdfInput.setInputFiles(samplePdfPath);
    
    // プレビューが表示されるまで待機
    await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible({ timeout: 10000 });
    
    // 帯エディターで画像モードを選択
    const imageButton = page.locator('button', { hasText: '画像' });
    await imageButton.click();
    
    // 画像ファイルをアップロード
    const imageInput = page.locator('input[type="file"]').nth(1);
    await imageInput.setInputFiles(bannerImagePath);
    
    // 画像プレビューが表示されることを確認
    await expect(page.locator('img[alt="Band preview"]')).toBeVisible();
    
    // ダウンロードイベントをリッスン
    const downloadPromise = page.waitForEvent('download');
    
    // 適用ボタンをクリック
    const applyButton = page.locator('button', { hasText: '帯を適用してダウンロード' });
    await applyButton.click();
    
    // ダウンロードが開始されることを確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/_modified\.pdf$/);
    
    // 処理中の状態が表示されることを確認
    await expect(page.locator('text=処理中')).toBeVisible();
    
    // 処理完了まで待機（最大30秒）
    await expect(page.locator('text=処理中')).toBeHidden({ timeout: 30000 });
  });

  test('should replace band with color and text', async ({ page }) => {
    const samplePdfPath = path.join(__dirname, '../fixtures/sample.pdf');
    
    // PDFファイルをアップロード
    const pdfInput = page.locator('input[type="file"]').first();
    await pdfInput.setInputFiles(samplePdfPath);
    
    // プレビューが表示されるまで待機
    await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible({ timeout: 10000 });
    
    // 色・テキストモードを選択
    const colorButton = page.locator('button', { hasText: '色・テキスト' });
    await colorButton.click();
    
    // 背景色を設定
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.fill('#ff0000'); // 赤色
    
    // テキストを入力
    const textInput = page.locator('input[placeholder="帯に表示するテキスト"]');
    await textInput.fill('テストバナー');
    
    // テキスト色を設定
    const textColorInput = page.locator('input[type="color"]').nth(1);
    await textColorInput.fill('#ffffff'); // 白色
    
    // プレビューで色が反映されることを確認
    const preview = page.locator('[data-testid="color-preview"]');
    await expect(preview).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    
    // ダウンロードイベントをリッスン
    const downloadPromise = page.waitForEvent('download');
    
    // 適用ボタンをクリック
    const applyButton = page.locator('button', { hasText: '帯を適用してダウンロード' });
    await applyButton.click();
    
    // ダウンロードが開始されることを確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/_modified\.pdf$/);
  });

  test('should adjust band height and position', async ({ page }) => {
    const samplePdfPath = path.join(__dirname, '../fixtures/sample.pdf');
    
    // PDFファイルをアップロード
    const pdfInput = page.locator('input[type="file"]').first();
    await pdfInput.setInputFiles(samplePdfPath);
    
    // プレビューが表示されるまで待機
    await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible({ timeout: 10000 });
    
    // 帯の高さを変更
    const heightInput = page.locator('input[type="number"]').first();
    await heightInput.fill('80');
    
    // 帯のY位置を変更
    const offsetInput = page.locator('input[type="number"]').nth(1);
    await offsetInput.fill('10');
    
    // 帯のオーバーレイが更新されることを確認
    const overlay = page.locator('.crop-overlay');
    await expect(overlay).toBeVisible();
    
    // 帯の高さ表示が更新されることを確認
    await expect(page.locator('text=帯エリア (80mm)')).toBeVisible();
  });

  test('should show history panel after processing', async ({ page }) => {
    const samplePdfPath = path.join(__dirname, '../fixtures/sample.pdf');
    const bannerImagePath = path.join(__dirname, '../fixtures/banner.png');
    
    // PDFファイルをアップロード
    const pdfInput = page.locator('input[type="file"]').first();
    await pdfInput.setInputFiles(samplePdfPath);
    
    // プレビューが表示されるまで待機
    await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible({ timeout: 10000 });
    
    // 画像を設定
    const imageButton = page.locator('button', { hasText: '画像' });
    await imageButton.click();
    
    const imageInput = page.locator('input[type="file"]').nth(1);
    await imageInput.setInputFiles(bannerImagePath);
    
    // ダウンロードイベントをリッスン
    const downloadPromise = page.waitForEvent('download');
    
    // 適用ボタンをクリック
    const applyButton = page.locator('button', { hasText: '帯を適用してダウンロード' });
    await applyButton.click();
    
    // ダウンロード完了まで待機
    await downloadPromise;
    
    // 処理完了まで待機
    await expect(page.locator('text=処理中')).toBeHidden({ timeout: 30000 });
    
    // 履歴パネルに処理済みファイルが表示されることを確認
    await expect(page.locator('[data-testid="processed-file"]')).toBeVisible();
    
    // 再ダウンロードボタンが表示されることを確認
    await expect(page.locator('button', { hasText: '再DL' })).toBeVisible();
  });

  test('should handle file upload errors', async ({ page }) => {
    // 大きすぎるファイルや不正なファイルのテスト
    
    // テキストファイルをアップロードしてエラーになることを確認
    const textFilePath = path.join(__dirname, '../fixtures/test.txt');
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(textFilePath);
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=PDFファイルのみアップロード可能です')).toBeVisible();
  });

  test('should validate band settings', async ({ page }) => {
    const samplePdfPath = path.join(__dirname, '../fixtures/sample.pdf');
    
    // PDFファイルをアップロード
    const pdfInput = page.locator('input[type="file"]').first();
    await pdfInput.setInputFiles(samplePdfPath);
    
    // プレビューが表示されるまで待機
    await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible({ timeout: 10000 });
    
    // 不正な高さを入力
    const heightInput = page.locator('input[type="number"]').first();
    await heightInput.fill('5'); // 最小値以下
    
    // 適用ボタンが無効になることを確認
    const applyButton = page.locator('button', { hasText: '帯を適用してダウンロード' });
    await expect(applyButton).toBeDisabled();
    
    // 正常な値に戻す
    await heightInput.fill('60');
    
    // 色・テキストモードを選択
    const colorButton = page.locator('button', { hasText: '色・テキスト' });
    await colorButton.click();
    
    // 背景色を設定
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.fill('#0000ff');
    
    // 適用ボタンが有効になることを確認
    await expect(applyButton).toBeEnabled();
  });
});