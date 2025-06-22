'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Palette, Type, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { isImage, fileToDataURL } from '@/lib/utils';

interface BandEditorProps {
  onApply: () => void;
}

/**
 * 帯の置き換えオプションを提供するエディターコンポーネント
 * 画像アップロード、色指定、テキスト入力機能を含む
 */
export function BandEditor({ onApply }: BandEditorProps) {
  const { 
    bandSettings, 
    setBandSettings, 
    isProcessing, 
    processingProgress,
    currentFile 
  } = useAppStore();
  
  const [replaceMode, setReplaceMode] = useState<'image' | 'color'>('image');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // 画像ファイルのアップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isImage(file)) {
      alert('画像ファイル（PNG、JPEG、GIF）のみアップロード可能です。');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('画像ファイルサイズが大きすぎます。5MB以下の画像を選択してください。');
      return;
    }

    try {
      const dataUrl = await fileToDataURL(file);
      setPreviewUrl(dataUrl);
      setBandSettings({ replaceImage: file });
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
      alert('画像の読み込みに失敗しました。');
    }
  };

  // 帯の高さ調整
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = Math.max(10, Math.min(200, Number(e.target.value)));
    setBandSettings({ height });
  };

  // 帯のY位置調整  
  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const yOffset = Math.max(0, Number(e.target.value));
    setBandSettings({ yOffset });
  };

  // 背景色の変更
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBandSettings({ backgroundColor: e.target.value });
  };

  // テキスト内容の変更
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBandSettings({ textContent: e.target.value });
  };

  // テキスト色の変更
  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBandSettings({ textColor: e.target.value });
  };

  const canApply = currentFile && (
    (replaceMode === 'image' && bandSettings.replaceImage) ||
    (replaceMode === 'color' && (bandSettings.backgroundColor || bandSettings.textContent))
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>帯の置き換え設定</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 帯のサイズ設定 */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">サイズ設定</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  高さ (mm)
                </label>
                <Input
                  type="number"
                  min="10"
                  max="200"
                  value={bandSettings.height}
                  onChange={handleHeightChange}
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Y位置 (mm)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={bandSettings.yOffset}
                  onChange={handleOffsetChange}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* 置き換えモード選択 */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">置き換え内容</h3>
            
            <div className="flex space-x-2">
              <Button
                variant={replaceMode === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReplaceMode('image')}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                画像
              </Button>
              
              <Button
                variant={replaceMode === 'color' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReplaceMode('color')}
                className="flex-1"
              >
                <Type className="h-4 w-4 mr-2" />
                色・テキスト
              </Button>
            </div>
          </div>

          {/* 画像モード */}
          {replaceMode === 'image' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  画像ファイルを選択
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PNG、JPEG、GIF対応（最大5MB）
                </p>
              </div>
              
              {previewUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">プレビュー</p>
                  <div className="border rounded-lg p-2 bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Band preview"
                      className="max-w-full h-20 object-contain mx-auto rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 色・テキストモード */}
          {replaceMode === 'color' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  背景色
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    value={bandSettings.backgroundColor || '#ffffff'}
                    onChange={handleColorChange}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={bandSettings.backgroundColor || '#ffffff'}  
                    onChange={handleColorChange}
                    placeholder="#ffffff"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  テキスト内容（オプション）
                </label>
                <Input
                  type="text"
                  value={bandSettings.textContent || ''}
                  onChange={handleTextChange}
                  placeholder="帯に表示するテキスト"
                  className="text-sm"
                />
              </div>
              
              {bandSettings.textContent && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    テキスト色
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value={bandSettings.textColor || '#000000'}
                      onChange={handleTextColorChange}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={bandSettings.textColor || '#000000'}
                      onChange={handleTextColorChange}
                      placeholder="#000000"
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>
              )}
              
              {/* カラープレビュー */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">プレビュー</p>
                <div 
                  className="border rounded-lg h-20 flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: bandSettings.backgroundColor || '#ffffff',
                    color: bandSettings.textColor || '#000000'
                  }}
                >
                  {bandSettings.textContent || '背景色のプレビュー'}
                </div>
              </div>
            </div>
          )}

          {/* 適用ボタン */}
          <div className="pt-4 border-t">
            <Button
              onClick={onApply}
              disabled={!canApply || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>処理中... {Math.round(processingProgress)}%</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>帯を適用してダウンロード</span>
                </div>
              )}
            </Button>
            
            {!canApply && !isProcessing && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {!currentFile 
                  ? 'PDFファイルをアップロードしてください'
                  : replaceMode === 'image'
                  ? '画像ファイルを選択してください'
                  : '背景色またはテキストを設定してください'
                }
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}