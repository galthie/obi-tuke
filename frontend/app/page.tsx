'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadZone } from '@/components/upload-zone';
import { PDFPreview } from '@/components/pdf-preview';
import { BandEditor } from '@/components/band-editor';
import { HistoryPanel } from '@/components/history-panel';
import { useAppStore } from '@/lib/store';
import { generateJobId } from '@/lib/utils';

// PDF.js worker を設定
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * メインページコンポーネント
 * PDFアップロード、プレビュー、帯編集、処理を統合
 */
export default function HomePage() {
  const {
    currentFile,
    setCurrentFile,
    previewImages,
    setPreviewImages,
    bandSettings,
    setProcessing,
    setProcessingProgress,
    addProcessedFile,
  } = useAppStore();

  const [error, setError] = useState<string>('');

  /**
   * PDFファイルから各ページのプレビュー画像を生成
   */
  const generatePreviewImages = async (file: File): Promise<string[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        images.push(canvas.toDataURL('image/png'));
      }

      return images;
    } catch (error) {
      console.error('PDF preview generation failed:', error);
      throw new Error('PDFプレビューの生成に失敗しました');
    }
  };

  /**
   * ファイルアップロード処理
   */
  const handleFileUpload = async (file: File) => {
    setError('');
    setCurrentFile(file);

    try {
      const images = await generatePreviewImages(file);
      setPreviewImages(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルの処理に失敗しました');
      setCurrentFile(null);
    }
  };

  /**
   * 帯の適用とPDF処理
   */
  const handleApply = async () => {
    if (!currentFile) return;

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', currentFile);
      formData.append('settings', JSON.stringify({
        height: bandSettings.height,
        yOffset: bandSettings.yOffset,
        backgroundColor: bandSettings.backgroundColor,
        textContent: bandSettings.textContent,
        textColor: bandSettings.textColor,
      }));

      if (bandSettings.replaceImage) {
        formData.append('replaceImage', bandSettings.replaceImage);
      }

      // 進捗を段階的に更新
      setProcessingProgress(20);

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      setProcessingProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'サーバーエラーが発生しました');
      }

      setProcessingProgress(80);

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      setProcessingProgress(100);

      // 処理済みファイルを履歴に追加
      const processedFile = {
        id: generateJobId(),
        originalName: currentFile.name,
        processedAt: new Date(),
        downloadUrl,
        previewUrl: previewImages[0] || '',
      };

      addProcessedFile(processedFile);

      // 自動ダウンロード
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = currentFile.name.replace('.pdf', '_modified.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setProcessing(false);
      }, 500);

    } catch (err) {
      console.error('Processing failed:', err);
      setError(err instanceof Error ? err.message : 'PDF処理に失敗しました');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            帯付け替えツール
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            マイソク（不動産物件資料）の帯を簡単に付け替えることができるWebアプリケーションです。
            PDFをアップロードして、帯エリアを調整し、新しい画像や色で置き換えましょう。
          </p>
        </motion.div>

        {/* エラー表示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側: アップロードとプレビュー */}
          <div className="lg:col-span-2 space-y-6">
            <UploadZone onFileUpload={handleFileUpload} />
            
            {previewImages.length > 0 && (
              <PDFPreview previewImages={previewImages} />
            )}
          </div>

          {/* 右側: エディターと履歴 */}
          <div className="space-y-6">
            <BandEditor onApply={handleApply} />
            <HistoryPanel />
          </div>
        </div>

        {/* フッター */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500"
        >
          <p className="text-sm">
            © 2024 帯付け替えツール - 不動産業界向けマイソク編集ツール
          </p>
          <p className="text-xs mt-2">
            Next.js 14 • FastAPI • PyMuPDF で構築されています
          </p>
        </motion.footer>
      </div>
    </div>
  );
}