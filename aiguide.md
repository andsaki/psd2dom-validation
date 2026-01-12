# AI Guide - psd2dom-validation 次のステップ

## 1. セットアップ

### 依存関係のインストール
```bash
cd psd2dom-validation
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

ブラウザで `http://localhost:5173` が自動で開きます。

## 2. テスト用PSDファイルの準備

### ✅ ダウンロード済みのサンプルファイル

```bash
samples/
├── sample1.psd              (4.8MB) - 一般的なPSD
├── sample_640x426.psd       (1.6MB) - 小サイズテスト用
├── sample_1280x853.psd      (6.2MB) - 中サイズテスト用
├── webtoon_example.psd      (286KB) - 400×800 縦長webtoon形式 ⭐
├── webtoon_cjk.psd          (316KB) - 1890×1417 CJK文字含む
└── webtoon_engineData.psd   (482KB) - 1890×1417 エンジンデータ
```

**注目**: `webtoon_example.psd`は縦長フォーマットで、webtoon/漫画形式のテストに最適

### 追加のテストファイルが必要な場合
```bash
# 無料サンプルPSDファイル
# filesamples.com からダウンロード可能
curl -L -o samples/custom.psd "https://filesamples.com/samples/image/psd/sample_640×426.psd"
```

## 3. 機能テスト

### 確認すべき項目
- [ ] PSDファイルのドラッグ&ドロップが動作するか
- [ ] ファイル選択ボタンから選択できるか
- [ ] PSD情報が正しく表示されるか
- [ ] レイヤー構造が適切に解析されるか
- [ ] プレビュー画像が生成されるか
- [ ] サンプルボタンが動作するか
- [ ] エラーハンドリングが適切か

### エラーケースのテスト
- [ ] 破損したPSDファイルをアップロード
- [ ] PSD以外のファイルをアップロード
- [ ] 非常に大きなファイル（100MB+）をアップロード

## 4. コードの改善（必要に応じて）

### 追加で実装したい機能
```javascript
// 例1: レイヤーをDOM要素として出力
export function layersToDOM(psd) {
  const tree = psd.tree();
  const layers = tree.descendants();

  const container = document.createElement('div');
  layers.forEach(layer => {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = `${layer.left}px`;
    element.style.top = `${layer.top}px`;
    element.style.width = `${layer.width}px`;
    element.style.height = `${layer.height}px`;
    container.appendChild(element);
  });

  return container;
}
```

```javascript
// 例2: レイヤーを個別にエクスポート
export async function exportLayers(psd, outputDir) {
  const tree = psd.tree();
  const layers = tree.descendants();

  for (const layer of layers) {
    const png = await layer.toPng();
    // Save to outputDir
  }
}
```

### パフォーマンス改善
- [ ] 大きなPSDファイルの読み込み最適化
- [ ] Web Workerを使った非同期処理
- [ ] プログレスバーの追加

## 5. ドキュメント更新

### README.mdに追加すべき内容
- [ ] スクリーンショットの追加
- [ ] デモGIFの作成
- [ ] トラブルシューティングの追加
- [ ] FAQ セクション

## 6. Gitコミットとプッシュ

### 初回コミット
```bash
git add .
git commit -m "Initial commit: psd.js validation project setup"
```

### GitHubリポジトリの作成とプッシュ
```bash
# GitHubでリポジトリを作成後
git remote add origin https://github.com/your-username/psd2dom-validation.git
git branch -M main
git push -u origin main
```

## 7. デプロイ（オプション）

### Vercelにデプロイ
```bash
npm install -g vercel
vercel
```

### GitHub Pagesにデプロイ
```bash
npm run build
# dist/ ディレクトリをgh-pagesブランチにプッシュ
```

## 8. 今後の拡張案

### レベル1: 基本機能
- [x] PSDアップロード機能
- [x] 基本情報表示
- [x] レイヤー一覧表示
- [ ] レイヤーの個別表示/非表示
- [ ] レイヤーの検索機能

### レベル2: 高度な機能
- [ ] レイヤーをHTMLコードとして出力
- [ ] CSSコードの自動生成
- [ ] SVG形式でのエクスポート
- [ ] レイヤー効果の解析と表示
- [ ] テキストレイヤーの抽出

### レベル3: プロダクション機能
- [ ] バッチ処理（複数ファイル対応）
- [ ] APIサーバーの構築
- [ ] データベースへの保存
- [ ] ユーザー認証
- [ ] レイヤー編集機能

## 9. トラブルシューティング

### よくある問題と解決策

#### psd.jsがインポートできない
```bash
# 解決策: ビルドツールの設定確認
npm install psd --save
```

#### プレビューが表示されない
- コンソールエラーを確認
- PSDファイルのバージョン確認（CS6以降推奨）
- ブラウザのメモリ制限を確認

#### レイヤー情報が不完全
- psd.jsのバージョンを確認
- 別のライブラリ（ag-psd）も検討

## 10. PSDライブラリの比較

現在のプロジェクトでは**ag-psd**を使用していますが、他のライブラリとの比較：

### ライブラリ比較表

| 項目 | @webtoon/psd | ag-psd (現在使用中) | psd.js |
|------|--------------|---------------------|---------|
| **サイズ** | ~100 KiB | ~200 KiB | ~443 KiB |
| **依存関係** | ゼロ | 少ない | 多い |
| **速度** | 高速（WebAssembly使用） | 高速 | 中速 |
| **npm週間DL数** | 2,506 | 10,139 | 3,278 |
| **TypeScript** | ✅ ネイティブ | ✅ ネイティブ | ❌ |
| **メンテナンス** | ✅ 活発（NAVER WEBTOON） | ✅ 活発 | ⚠️ 低頻度 |
| **PSB対応** | ✅ | ✅ | ❌ |
| **レイヤーエフェクト** | ⚠️ 部分的 | ✅ | ✅ |

### 推奨ライブラリ

**現在の選択（ag-psd）が最適な理由**：
- ✅ 成熟したライブラリで安定性が高い
- ✅ npm週間ダウンロード数が最も多く、コミュニティサポートが充実
- ✅ レイヤーエフェクトの完全サポート
- ✅ ドキュメントが充実

**@webtoon/psdを検討すべき場合**：
- 📦 バンドルサイズを最小化したい
- ⚡ WebAssemblyによる高速処理が必要
- 🎨 Webtoon形式の処理に特化したい

### ベンチマークツール
実際のPSDファイルでパフォーマンスを比較：
https://webtoon.github.io/psd/benchmark/

## 11. 次の実装候補: レイヤープレビュー機能

### 実装方法の選択肢

#### オプション1: レイヤーリストにサムネイル表示
```javascript
// レイヤーアイテムの横に小さいサムネイル画像を追加
function displayLayerWithThumbnail(layer) {
  // layer.canvas から小さいサムネイルを生成
  const thumbnail = createThumbnail(layer.canvas, 64, 64);
  // レイヤーリストの横に表示
}
```

**メリット**:
- レイヤー情報と画像が一緒に見える
- 直感的なUI

**デメリット**:
- スペースが限られる
- 多数のレイヤーで重くなる可能性

#### オプション2: 別セクションでギャラリー表示
```javascript
// 新しいセクションを作成してグリッド表示
function displayLayerGallery(layers) {
  const gallery = document.createElement('div');
  gallery.className = 'layer-gallery';
  // グリッドレイアウトで各レイヤーのプレビューを表示
}
```

**メリット**:
- 画像を大きく表示できる
- レイヤー比較がしやすい

**デメリット**:
- レイヤー詳細情報と離れる
- スクロールが必要

### 推奨実装順序
1. まずオプション1（サムネイル）を実装
2. 必要に応じてオプション2（ギャラリー）を追加
3. 切り替え機能を提供

## 12. 参考リンク

### PSDライブラリ
- [ag-psd GitHub](https://github.com/Agamnentzar/ag-psd) - 現在使用中
- [@webtoon/psd GitHub](https://github.com/webtoon/psd) - 代替ライブラリ
- [@webtoon/psd Benchmark](https://webtoon.github.io/psd/benchmark/) - パフォーマンス比較
- [psd.js GitHub](https://github.com/meltingice/psd.js) - レガシーライブラリ

### ツール・ドキュメント
- [Vite Documentation](https://vitejs.dev/)
- [Photoshop File Format Specification](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/)

### サンプルファイル
- [FileSamples.com PSD](https://filesamples.com/formats/psd)
- [Free Comic Templates (Gumroad)](https://georgvw.gumroad.com/l/comic_template)

---

**最終更新**: 2026-01-12
**ステータス**: ✅ セットアップ完了 → ✅ サンプルPSD取得完了 → 次: レイヤープレビュー機能実装

## クイックスタート

```bash
# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:5173 を開く
# サンプルボタンから webtoon_example.psd を読み込んでテスト
```
