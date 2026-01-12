import { readPsd } from 'ag-psd';
import Psd from '@webtoon/psd';
import { parsePSDFile, displayPSDInfo, displayLayers, displayPreview, displayLayerGrid } from './psdParser.js';

// DOM要素の取得
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const resultsSection = document.getElementById('resultsSection');
const psdInfo = document.getElementById('psdInfo');
const layersContainer = document.getElementById('layersContainer');
const previewContainer = document.getElementById('previewContainer');
const layerGridContainer = document.getElementById('layerGridContainer');
const imageModal = document.getElementById('imageModal');
const modalClose = document.getElementById('modalClose');
const modalCanvas = document.getElementById('modalCanvas');
const modalLabel = document.getElementById('modalLabel');

// グローバル変数
let currentPsd = null;

// ファイルアップロード処理
fileInput.addEventListener('change', handleFileSelect);

// ドラッグ&ドロップ処理
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('dragover');
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('dragover');
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.psd')) {
        handleFile(files[0]);
    } else {
        showError('PSDファイルをアップロードしてください');
    }
});

// ファイル選択処理
async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        await handleFile(file);
    }
}

// ファイル処理
async function handleFile(file) {
    try {
        showLoading();

        // PSDファイルの読み込みと解析
        const arrayBuffer = await file.arrayBuffer();
        const psd = readPsd(arrayBuffer, { skipLayerImageData: false, skipCompositeImageData: false });
        const previewPsd = Psd.parse(arrayBuffer);

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

        // 結果セクションを表示
        resultsSection.classList.add('active');

        // グリッドアイテムにクリックイベントを追加
        setupGridItemClickHandlers();

        console.log('PSD parsed successfully:', psd);
    } catch (error) {
        console.error('Error parsing PSD:', error);
        showError(`エラーが発生しました: ${error.message}`);
    }
}

// サンプルファイルの読み込み
window.loadSample = async function(filename) {
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
        showError(`サンプルファイルの読み込みに失敗しました: ${error.message}`);
    }
};

// ローディング表示
function showLoading() {
    resultsSection.classList.add('active');
    psdInfo.innerHTML = '<div class="loading">読み込み中...</div>';
    layersContainer.innerHTML = '<div class="loading">解析中...</div>';
    previewContainer.innerHTML = '<div class="loading">プレビュー生成中...</div>';
}

// エラー表示
function showError(message) {
    resultsSection.classList.add('active');
    psdInfo.innerHTML = `<div class="error">${message}</div>`;
    layersContainer.innerHTML = '';
    previewContainer.innerHTML = '';
}

// グリッドアイテムのクリックハンドラーを設定
function setupGridItemClickHandlers() {
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
        item.addEventListener('click', () => {
            const canvas = item.querySelector('.grid-canvas');
            const label = item.querySelector('.grid-label');
            if (canvas && label) {
                openModal(canvas, label.textContent);
            }
        });
    });
}

// モーダルを開く
function openModal(sourceCanvas, labelText) {
    // モーダルのcanvasに画像をコピー
    modalCanvas.width = sourceCanvas.width;
    modalCanvas.height = sourceCanvas.height;

    const ctx = modalCanvas.getContext('2d');
    ctx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);

    // ラベルを設定
    modalLabel.textContent = labelText;

    // モーダルを表示
    imageModal.classList.add('active');
}

// モーダルを閉じる
function closeModal() {
    imageModal.classList.remove('active');
}

// モーダルのイベントリスナー
modalClose.addEventListener('click', closeModal);
imageModal.querySelector('.modal-overlay').addEventListener('click', closeModal);

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('active')) {
        closeModal();
    }
});

// PSDライブラリの初期化確認
console.log('ag-psd loaded successfully');
