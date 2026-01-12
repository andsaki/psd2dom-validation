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

### samplesディレクトリに配置
```bash
# PSDファイルを samples/ ディレクトリにコピー
cp /path/to/your/file.psd samples/sample1.psd
```

推奨するテストパターン：
- **sample1.psd**: シンプルなレイヤー構造（2-3レイヤー）
- **sample2.psd**: 複雑なレイヤー構造（10+レイヤー、グループあり）
- **sample3.psd**: エフェクトやマスクを含むデザイン

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

## 10. 参考リンク

- [psd.js GitHub](https://github.com/meltingice/psd.js)
- [psd.js API Documentation](https://github.com/meltingice/psd.js/wiki)
- [Vite Documentation](https://vitejs.dev/)
- [Photoshop File Format Specification](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/)

---

**最終更新**: 2026-01-12
**ステータス**: セットアップ完了 → テスト開始待ち
