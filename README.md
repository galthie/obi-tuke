# 帯付け替えツール (Obi-Tuke)

マイソク（不動産物件資料）の帯を簡単に付け替えることができるWebアプリケーションです。不動産業界向けに、PDFの上部帯エリアを新しい画像や色・テキストで置き換える機能を提供します。

## 🌟 主な機能

- **PDFアップロード**: ドラッグ&ドロップで簡単にPDFをアップロード（最大10MB）
- **インタラクティブプレビュー**: ページ切り替え、ズーム、ドラッグ可能な帯クロップ機能
- **柔軟な帯置き換え**: 
  - 画像ファイル（PNG/JPEG/GIF）でのカスタム帯
  - 色とテキストでのシンプルな帯生成
- **リアルタイム調整**: 帯の高さ・位置をドラッグで直感的に調整
- **履歴管理**: 最新5件の処理済みファイルを自動保存・再ダウンロード
- **マルチページ対応**: 複数ページのPDFでも全ページに一括適用

## 🏗️ 技術スタック

### フロントエンド
- **Next.js 14** (App Router) - React 18ベースのフルスタックフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストのCSS
- **shadcn/ui** - 美しいUIコンポーネント
- **Framer Motion** - スムーズなアニメーション
- **Zustand** - 軽量状態管理
- **PDF.js** - ブラウザでのPDFプレビュー生成

### バックエンド
- **FastAPI** - 高性能なPython Webフレームワーク
- **PyMuPDF (fitz)** - PDF操作・編集エンジン
- **Pillow** - 画像処理ライブラリ
- **Pydantic** - データバリデーション

### 開発・テスト
- **Playwright** - E2Eテスト
- **pytest** - Pythonユニットテスト
- **Docker & Docker Compose** - 簡単な環境構築

## 🚀 クイックスタート

### 前提条件

- **Node.js** 18+ & **Yarn** 3+
- **Python** 3.11+ & **pip**
- **Docker** (オプション)

### 1. リポジトリクローン

```bash
git clone <repository-url>
cd obi-tuke
```

### 2. 開発環境セットアップ

#### Docker使用（推奨）

```bash
# 全サービスを一括起動
docker-compose up --build

# アプリケーションアクセス
# フロントエンド: http://localhost:3000
# バックエンドAPI: http://localhost:8000
```

#### ローカル環境

```bash
# バックエンド起動
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 別ターミナルでフロントエンド起動
cd frontend
yarn install
yarn dev

# アプリケーションアクセス: http://localhost:3000
```

### 3. 動作確認

1. ブラウザで http://localhost:3000 にアクセス
2. サンプルPDF（`tests/fixtures/sample.pdf`）をアップロード
3. 帯の高さ・位置を調整
4. 画像またはカラー・テキストで帯を設定
5. 「帯を適用してダウンロード」ボタンをクリック

## 📁 プロジェクト構造

```
obi-tuke/
├── frontend/               # Next.js フロントエンドアプリ
│   ├── app/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── lib/           # ユーティリティ・状態管理
│   │   ├── api/           # API Routes (FastAPIプロキシ)
│   │   └── page.tsx       # メインページ
├── backend/                # FastAPI バックエンドアプリ
│   ├── app/
│   │   ├── main.py        # FastAPIアプリケーション
│   │   ├── models.py      # Pydanticモデル
│   │   └── pdf_processor.py # PDF処理コア
├── tests/                  # テストスイート
│   ├── e2e/               # Playwright E2Eテスト
│   ├── unit/              # pytest ユニットテスト
│   └── fixtures/          # テスト用サンプルファイル
└── docker-compose.yml     # Docker設定
```

## 🔧 開発ガイド

### API仕様

#### POST `/api/process`

PDFの帯置き換え処理を実行

**リクエスト:**
```typescript
// FormData
pdf: File              // PDFファイル（最大10MB）
settings: string       // BandSettings JSON
replaceImage?: File    // 置き換え画像（最大5MB、オプション）
```

**BandSettings:**
```typescript
{
  height: number        // 帯の高さ（mm）
  yOffset: number       // Y位置オフセット（mm）
  backgroundColor?: string  // 背景色（16進数）
  textContent?: string     // テキスト内容
  textColor?: string      // テキスト色（16進数）
}
```

**レスポンス:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=modified.pdf
```

### 主要コンポーネント

#### `UploadZone`
- ドラッグ&ドロップによるPDFアップロード
- ファイル形式・サイズ検証
- エラーハンドリング

#### `PDFPreview` 
- PDF.jsによるページプレビュー生成
- ズーム・ページ切り替え機能
- ドラッグ可能な帯クロップオーバーレイ

#### `BandEditor`
- 帯設定UI（高さ・位置・内容）
- 画像アップロード vs 色・テキスト選択
- リアルタイムプレビュー

#### `HistoryPanel`
- 処理済みファイルの履歴表示（最大5件）
- ローカルストレージ使用
- 再ダウンロード機能

### 状態管理（Zustand）

```typescript
interface AppState {
  currentFile: File | null
  previewImages: string[]
  bandSettings: BandSettings
  isProcessing: boolean
  processedFiles: ProcessedFile[]
  // ... actions
}
```

## 🧪 テスト

### E2Eテスト実行

```bash
cd tests
npx playwright test

# UIモードで実行
npx playwright test --ui

# 特定のテストのみ実行
npx playwright test band-replacement.spec.ts
```

### ユニットテスト実行

```bash
cd backend
pytest tests/unit/ -v

# カバレッジ付きで実行
pytest tests/unit/ --cov=app --cov-report=html
```

### テストファイル準備

テスト用のサンプルファイルを用意してください：

- `tests/fixtures/sample.pdf` - テスト用PDF（マイソク形式）
- `tests/fixtures/banner.png` - テスト用帯画像

## 🚢 デプロイ

### Vercel（フロントエンド）

```bash
cd frontend
npm run build
npx vercel --prod
```

### Fly.io（バックエンド）

```bash
cd backend
fly launch
fly deploy
```

### 環境変数設定

```bash
# フロントエンド
BACKEND_URL=https://your-backend-api.fly.dev

# バックエンド（必要に応じて）
PYTHONPATH=/app
```

## 🔒 セキュリティ考慮事項

- ファイルサイズ制限（PDF: 10MB、画像: 5MB）
- ファイル形式検証（PDF、画像のみ受付）
- CORS設定（本番環境では適切なオリジン設定が必要）
- アップロードファイルの一時的な処理（永続化なし）

## 📈 パフォーマンス最適化

- PDF.jsプレビューの低解像度生成
- 画像リサイズによるメモリ使用量抑制
- フロントエンドコンポーネントの遅延読み込み
- バックエンドでの非同期処理

## 🤝 コントリビューション

1. 機能追加やバグ修正のissueを作成
2. フィーチャーブランチを作成
3. テストを含めた実装
4. プルリクエストを作成

### 開発規約

- **TypeScript**: 厳格な型定義を使用
- **関数型**: 純粋関数・イミュータブルなデータを推奨
- **コメント**: JSDocで関数の説明を記載
- **テスト**: 新機能には対応するテストを追加

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🆘 トラブルシューティング

### よくある問題

#### 1. PDFプレビューが表示されない
```bash
# PDF.js workerの確認
console.log(pdfjsLib.GlobalWorkerOptions.workerSrc)
```

#### 2. バックエンドAPIに接続できない
```bash
# バックエンドサービス状態確認
curl http://localhost:8000/health
```

#### 3. Docker環境での起動エラー
```bash
# Dockerコンテナ再構築
docker-compose down
docker-compose build --no-cache
docker-compose up
```

#### 4. 日本語テキストが文字化けする
- システムに適切な日本語フォントがインストールされているか確認
- PIL/Pillowでのフォント読み込みエラーの場合、デフォルトフォントが使用される

### ログ確認

```bash
# フロントエンド
# ブラウザの開発者ツール > Console

# バックエンド  
# docker-compose logs backend
```

## 🔮 今後の拡張予定

- [ ] 複数帯の同時編集機能
- [ ] テンプレート帯の保存・再利用
- [ ] バッチ処理（複数PDFの一括処理）
- [ ] より詳細な帯位置指定（ページごとの個別設定）
- [ ] 処理履歴のクラウド同期

---

**不動産業界の皆様の業務効率化を支援する、オープンソースのマイソク編集ツールです。**