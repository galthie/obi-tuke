'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Download, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { formatFileSize } from '@/lib/utils';

/**
 * 処理済みファイルの履歴を表示するパネルコンポーネント
 * 最新5件の処理済みファイルを表示し、再ダウンロード機能を提供
 */
export function HistoryPanel() {
  const { processedFiles, removeProcessedFile } = useAppStore();

  const handleDownload = (file: { downloadUrl: string; originalName: string }) => {
    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.originalName.replace('.pdf', '_modified.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (processedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <History className="h-5 w-5" />
            <span>処理履歴</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">まだ処理されたファイルがありません</p>
            <p className="text-xs text-gray-400 mt-1">
              PDFを処理すると、ここに履歴が表示されます
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <History className="h-5 w-5" />
            <span>処理履歴</span>
            <span className="text-sm font-normal text-gray-500">
              ({processedFiles.length}/5)
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <AnimatePresence mode="popLayout">
            {processedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-shrink-0">
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt="Preview"
                      className="w-12 h-16 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 rounded border flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(file.processedAt)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">再DL</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeProcessedFile(file.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {processedFiles.length === 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                最新5件の履歴を表示しています
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}