'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { mmToPx } from '@/lib/utils';

interface PDFPreviewProps {
  previewImages: string[];
}

/**
 * PDFプレビューコンポーネント
 * ページ切り替えとドラッグ可能な帯クロップオーバーレイを提供
 */
export function PDFPreview({ previewImages }: PDFPreviewProps) {
  const { 
    currentPage, 
    setCurrentPage, 
    bandSettings, 
    setBandSettings 
  } = useAppStore();
  
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0, initialOffset: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 画像が読み込まれたときのサイズを取得
  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageSize({ width: naturalWidth, height: naturalHeight });
    }
  };

  // 帯の位置とサイズを計算（ピクセル単位）
  const getBandPixelDimensions = () => {
    if (!imageSize.width || !imageSize.height) return { top: 0, height: 0 };
    
    // PDF座標系（72 DPI）でのピクセル計算
    const heightPx = mmToPx(bandSettings.height) * zoom;
    const topPx = mmToPx(bandSettings.yOffset) * zoom;
    
    return {
      top: topPx,
      height: heightPx
    };
  };

  const bandDimensions = getBandPixelDimensions();

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ 
      y, 
      initialOffset: bandSettings.yOffset 
    });
    
    e.preventDefault();
  };

  // ドラッグ中
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !previewRef.current) return;
      
      const rect = previewRef.current.getBoundingClientRect();
      const currentY = e.clientY - rect.top;
      const deltaY = (currentY - dragStart.y) / zoom;
      
      // ミリメートル単位で新しいオフセットを計算
      const newOffsetMm = Math.max(0, dragStart.initialOffset + deltaY * 25.4 / 72);
      
      setBandSettings({ yOffset: newOffsetMm });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, zoom, setBandSettings]);

  // 帯の高さをドラッグで調整
  const handleHeightResize = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    
    const startY = e.clientY;
    const startHeight = bandSettings.height;
    const startOffset = bandSettings.yOffset;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = (e.clientY - startY) / zoom;
      const deltaMm = deltaY * 25.4 / 72;

      if (direction === 'bottom') {
        const newHeight = Math.max(10, startHeight + deltaMm);
        setBandSettings({ height: newHeight });
      } else {
        const newOffset = Math.max(0, startOffset + deltaMm);
        const newHeight = Math.max(10, startHeight - deltaMm);
        setBandSettings({ 
          yOffset: newOffset,
          height: newHeight 
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const nextPage = () => {
    if (currentPage < previewImages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  if (previewImages.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          PDFファイルをアップロードしてプレビューを表示
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              PDFプレビュー ({currentPage + 1} / {previewImages.length})
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={zoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div 
            ref={previewRef}
            className="pdf-preview-container relative overflow-auto max-h-[600px]"
          >
            <img
              ref={imageRef}
              src={previewImages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="w-full h-auto select-none"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              onLoad={handleImageLoad}
              draggable={false}
            />
            
            {/* 帯クロップオーバーレイ */}
            <div
              className={`crop-overlay ${isDragging ? 'opacity-75' : ''}`}
              style={{
                top: `${bandDimensions.top}px`,
                left: 0,
                right: 0,
                height: `${bandDimensions.height}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left'
              }}
              onMouseDown={handleMouseDown}
            >
              {/* 上部リサイズハンドル */}
              <div
                className="crop-handle top"
                onMouseDown={(e) => handleHeightResize(e, 'top')}
              />
              
              {/* 下部リサイズハンドル */}
              <div
                className="crop-handle bottom"
                onMouseDown={(e) => handleHeightResize(e, 'bottom')}
              />
              
              {/* 中央のラベル */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  帯エリア ({Math.round(bandSettings.height)}mm)
                </div>
              </div>
            </div>
          </div>
          
          {/* ページナビゲーション */}
          {previewImages.length > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={currentPage === 0}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>前のページ</span>
              </Button>
              
              <div className="text-sm text-gray-600">
                ページ {currentPage + 1} / {previewImages.length}
              </div>
              
              <Button
                variant="outline"
                onClick={nextPage}
                disabled={currentPage === previewImages.length - 1}
                className="flex items-center space-x-2"
              >
                <span>次のページ</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}