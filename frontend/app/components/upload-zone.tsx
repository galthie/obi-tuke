'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { isPDF, formatFileSize } from '@/lib/utils';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
}

/**
 * ファイルアップロード用のドラッグ&ドロップゾーンコンポーネント
 * PDFファイル（最大10MB）のみを受け付ける
 */
export function UploadZone({ onFileUpload }: UploadZoneProps) {
  const { currentFile, reset } = useAppStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && isPDF(file)) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。');
        return;
      }
      reset(); // Clear previous state
      onFileUpload(file);
    }
  }, [onFileUpload, reset]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const hasErrors = fileRejections.length > 0;

  if (currentFile) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-900">{currentFile.name}</p>
              <p className="text-sm text-green-700">
                {formatFileSize(currentFile.size)} • PDFファイル
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              変更
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : hasErrors
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent className="p-12">
          <div {...getRootProps()} className="text-center">
            <input {...getInputProps()} />
            
            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {hasErrors ? (
                <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              )}
            </motion.div>

            {hasErrors ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-red-900">
                  ファイルをアップロードできませんでした
                </p>
                <div className="text-sm text-red-700">
                  {fileRejections.map(({ file, errors }) => (
                    <div key={file.name}>
                      <p className="font-medium">{file.name}</p>
                      <ul className="list-disc list-inside">
                        {errors.map(error => (
                          <li key={error.code}>
                            {error.code === 'file-too-large' && 'ファイルサイズが大きすぎます（最大10MB）'}
                            {error.code === 'file-invalid-type' && 'PDFファイルのみアップロード可能です'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : isDragActive ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-blue-900">
                  ファイルをドロップしてください
                </p>
                <p className="text-sm text-blue-700">
                  PDFファイル（最大10MB）
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    マイソク（PDF）をアップロード
                  </p>
                  <p className="text-sm text-gray-600">
                    ファイルをドラッグ&ドロップするか、クリックして選択してください
                  </p>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• PDFファイルのみ対応</p>
                  <p>• 最大ファイルサイズ: 10MB</p>
                  <p>• マルチページ対応</p>
                </div>

                <Button variant="secondary" className="mt-4">
                  ファイルを選択
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}