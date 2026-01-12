import { readPsd, type Psd as AgPsdDocument } from 'ag-psd';
import WebtoonPsd from '@webtoon/psd';
import { displayPSDInfo, displayLayers, displayPreview, displayLayerGrid, displayDomPreview } from './psdParser';

declare global {
    interface Window {
        loadSample: (filename: string) => Promise<void>;
    }
}

const getRequiredElement = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" was not found.`);
    }
    return element as T;
};

// DOM要素の取得
const fileInput = getRequiredElement<HTMLInputElement>('fileInput');
const uploadSection = getRequiredElement<HTMLElement>('uploadSection');
const resultsSection = getRequiredElement<HTMLElement>('resultsSection');
const psdInfo = getRequiredElement<HTMLElement>('psdInfo');
const layersContainer = getRequiredElement<HTMLElement>('layersContainer');
const previewContainer = getRequiredElement<HTMLElement>('previewContainer');
const domPreviewContainer = getRequiredElement<HTMLElement>('domPreviewContainer');
const layerGridContainer = getRequiredElement<HTMLElement>('layerGridContainer');
const imageModal = getRequiredElement<HTMLDivElement>('imageModal');
const modalClose = getRequiredElement<HTMLButtonElement>('modalClose');
const modalCanvas = getRequiredElement<HTMLCanvasElement>('modalCanvas');
const modalLabel = getRequiredElement<HTMLDivElement>('modalLabel');
const modalOverlay = imageModal.querySelector<HTMLDivElement>('.modal-overlay');

if (!modalOverlay) {
    throw new Error('Modal overlay element not found.');
}

// グローバル変数
let currentPsd: AgPsdDocument | null = null;

// ファイルアップロード処理
fileInput.addEventListener('change', handleFileSelect);

// ドラッグ&ドロップ処理
uploadSection.addEventListener('dragover', (event: DragEvent) => {
    event.preventDefault();
    uploadSection.classList.add('dragover');
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('dragover');
});

uploadSection.addEventListener('drop', (event: DragEvent) => {
    event.preventDefault();
    uploadSection.classList.remove('dragover');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0 && files[0].name.endsWith('.psd')) {
        void handleFile(files[0]);
    } else {
        showError('PSDファイルをアップロードしてください');
    }
});

// ファイル選択処理
async function handleFileSelect(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (file) {
        await handleFile(file);
    }
}

// ファイル処理
async function handleFile(file: File): Promise<void> {
    try {
        showLoading();

        // PSDファイルの読み込みと解析
        const arrayBuffer = await file.arrayBuffer();
        const psd = readPsd(arrayBuffer, { skipLayerImageData: false, skipCompositeImageData: false });
        const previewPsd = WebtoonPsd.parse(arrayBuffer);

        // グローバル変数に保存
        currentPsd = psd;

        // PSD情報の表示
        displayPSDInfo(psd, psdInfo);

        // レイヤー構造の表示
        displayLayers(psd, layersContainer);

        // コマ一覧グリッドの表示
        displayLayerGrid(psd, layerGridContainer);

        // プレビュー画像の表示
        await displayPreview(previewPsd, previewContainer, psd);
        displayDomPreview(psd, domPreviewContainer);

        // 結果セクションを表示
        resultsSection.classList.add('active');

        // グリッドアイテムにクリックイベントを追加
        setupGridItemClickHandlers();

        console.log('PSD parsed successfully:', psd);
    } catch (error) {
        console.error('Error parsing PSD:', error);
        const message = error instanceof Error ? error.message : '不明なエラー';
        showError(`エラーが発生しました: ${message}`);
    }
}

// サンプルファイルの読み込み
window.loadSample = async (filename: string): Promise<void> => {
    try {
        showLoading();

        const response = await fetch(`/samples/${filename}`);
        if (!response.ok) {
            throw new Error('サンプルファイルが見つかりません');
        }

        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'image/vnd.adobe.photoshop' });

        await handleFile(file);
    } catch (error) {
        console.error('Error loading sample:', error);
        const message = error instanceof Error ? error.message : '不明なエラー';
        showError(`サンプルファイルの読み込みに失敗しました: ${message}`);
    }
};

// ローディング表示
function showLoading(): void {
    resultsSection.classList.add('active');
    psdInfo.innerHTML = '<div class="loading">読み込み中...</div>';
    layersContainer.innerHTML = '<div class="loading">解析中...</div>';
    previewContainer.innerHTML = '<div class="loading">プレビュー生成中...</div>';
    domPreviewContainer.innerHTML = '<div class="loading">DOM構築中...</div>';
}

// エラー表示
function showError(message: string): void {
    resultsSection.classList.add('active');
    psdInfo.innerHTML = `<div class="error">${message}</div>`;
    layersContainer.innerHTML = '';
    previewContainer.innerHTML = '';
    domPreviewContainer.innerHTML = '';
}

// グリッドアイテムのクリックハンドラーを設定
function setupGridItemClickHandlers(): void {
    const gridItems = document.querySelectorAll<HTMLDivElement>('.grid-item');
    gridItems.forEach(item => {
        item.addEventListener('click', () => {
            const canvas = item.querySelector<HTMLCanvasElement>('.grid-canvas');
            const label = item.querySelector<HTMLDivElement>('.grid-label');
            if (canvas && label?.textContent) {
                openModal(canvas, label.textContent);
            }
        });
    });
}

// モーダルを開く
function openModal(sourceCanvas: HTMLCanvasElement, labelText: string): void {
    // モーダルのcanvasに画像をコピー
    modalCanvas.width = sourceCanvas.width;
    modalCanvas.height = sourceCanvas.height;

    const ctx = modalCanvas.getContext('2d');
    if (!ctx) {
        throw new Error('2D context is not available on the modal canvas.');
    }

    ctx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);

    // ラベルを設定
    modalLabel.textContent = labelText;

    // モーダルを表示
    imageModal.classList.add('active');
}

// モーダルを閉じる
function closeModal(): void {
    imageModal.classList.remove('active');
}

// モーダルのイベントリスナー
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && imageModal.classList.contains('active')) {
        closeModal();
    }
});

// PSDライブラリの初期化確認
console.log('ag-psd loaded successfully');
