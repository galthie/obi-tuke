'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Download, ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

interface DonePageProps {
  params: {
    jobId: string;
  };
}

/**
 * 処理完了ページコンポーネント
 * 処理されたPDFのダウンロードと結果確認を提供
 */
export default function DonePage({ params }: DonePageProps) {
  const { processedFiles } = useAppStore();
  const [processedFile, setProcessedFile] = useState<any>(null);

  useEffect(() => {
    const file = processedFiles.find(f => f.id === params.jobId);
    setProcessedFile(file);
  }, [params.jobId, processedFiles]);

  const handleDownload = () => {
    if (!processedFile) return;

    const link = document.createElement('a');
    link.href = processedFile.downloadUrl;
    link.download = processedFile.originalName.replace('.pdf', '_modified.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (!processedFile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ファイルが見つかりません
            </h2>
            <p className="text-gray-600 mb-6">
              指定されたジョブIDのファイルが見つからないか、
              既に削除されている可能性があります。
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* 成功メッセージ */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200 
                }}
              >
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-green-900 mb-2">
                処理が完了しました！
              </h1>
              <p className="text-green-700">
                PDFの帯置き換えが正常に完了し、ダウンロード可能になりました。
              </p>
            </CardContent>
          </Card>

          {/* ファイル情報 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>処理済みファイル</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                {processedFile.previewUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={processedFile.previewUrl}
                      alt="PDF Preview"
                      className="w-24 h-32 object-cover rounded-lg border shadow-sm"
                    />
                  </div>
                )}
                
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      ファイル名
                    </label>
                    <p className="text-lg font-medium text-gray-900">
                      {processedFile.originalName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      処理完了日時
                    </label>
                    <p className="text-gray-900">
                      {formatDate(processedFile.processedAt)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      ジョブID
                    </label>
                    <p className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {processedFile.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* ダウンロードボタン */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  修正済みPDFをダウンロード
                </Button>
                
                <Link href="/" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    新しいファイルを処理
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 使用方法のヒント */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 使用方法のヒント</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 処理済みファイルは最大5件まで履歴に保存されます</p>
                <p>• ダウンロードリンクはブラウザを閉じるまで有効です</p>
                <p>• より精密な調整が必要な場合は、帯の位置やサイズを変更して再処理してください</p>
                <p>• 複数ページのPDFでも、全ページに同じ帯が適用されます</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}