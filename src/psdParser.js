/**
 * PSDファイル解析ユーティリティ (ag-psd version)
 */

/**
 * PSD情報を表示
 */
export function displayPSDInfo(psd, container) {
    const info = {
        'ファイル名': 'Untitled',
        '幅': `${psd.width}px`,
        '高さ': `${psd.height}px`,
        'カラーモード': getColorMode(psd.colorMode),
        'ビット深度': `${psd.bitsPerChannel || 8} bit`,
        'レイヤー数': countLayers(psd.children || []),
        'ドキュメント解像度': `${psd.imageResources?.resolutionInfo?.horizontalRes || 72} DPI`
    };

    let html = '';
    for (const [label, value] of Object.entries(info)) {
        html += `
            <div class="info-row">
                <span class="info-label">${label}:</span>
                <span class="info-value">${value}</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * レイヤー数をカウント（再帰的）
 */
function countLayers(layers) {
    let count = 0;
    for (const layer of layers) {
        count++;
        if (layer.children) {
            count += countLayers(layer.children);
        }
    }
    return count;
}

/**
 * レイヤー構造を表示（サムネイル付き）
 */
export function displayLayers(psd, container) {
    const layers = getAllLayers(psd.children || []);

    if (!layers || layers.length === 0) {
        container.innerHTML = '<p>レイヤーが見つかりません</p>';
        return;
    }

    container.innerHTML = '';

    layers.forEach((layer, index) => {
        const name = layer.name || `Layer ${index + 1}`;
        const type = getLayerType(layer);
        const visible = layer.hidden !== true;
        const opacity = layer.opacity !== undefined ? layer.opacity : 255;
        const blendMode = layer.blendMode || 'normal';

        const width = layer.right && layer.left ? layer.right - layer.left : 0;
        const height = layer.bottom && layer.top ? layer.bottom - layer.top : 0;
        const left = layer.left || 0;
        const top = layer.top || 0;

        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.dataset.layerIndex = index;

        // サムネイル画像を生成
        const thumbnail = createLayerThumbnail(layer, 60);

        layerItem.innerHTML = `
            <div class="layer-thumbnail-container"></div>
            <div class="layer-info">
                <div class="layer-name">${name}</div>
                <div class="layer-details">
                    タイプ: ${type} |
                    表示: ${visible ? '表示' : '非表示'} |
                    不透明度: ${Math.round((opacity / 255) * 100)}% |
                    合成モード: ${blendMode}
                    <br>
                    サイズ: ${width}×${height}px |
                    位置: (${left}, ${top})
                </div>
            </div>
        `;

        if (thumbnail) {
            layerItem.querySelector('.layer-thumbnail-container').appendChild(thumbnail);
        }

        container.appendChild(layerItem);
    });
}

/**
 * レイヤーのサムネイルを生成
 */
function createLayerThumbnail(layer, maxSize = 60) {
    if (!layer.canvas) return null;

    const canvas = document.createElement('canvas');
    const sourceWidth = layer.canvas.width;
    const sourceHeight = layer.canvas.height;

    // アスペクト比を保ちながらサイズ調整
    let width = sourceWidth;
    let height = sourceHeight;

    if (width > height) {
        if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
        }
    } else {
        if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
        }
    }

    canvas.width = width;
    canvas.height = height;
    canvas.className = 'layer-thumbnail';

    const ctx = canvas.getContext('2d');
    ctx.drawImage(layer.canvas, 0, 0, width, height);

    return canvas;
}

/**
 * コマ一覧をグリッドで表示
 */
export function displayLayerGrid(psd, container) {
    const layers = getAllLayers(psd.children || []).filter(layer => layer.canvas);

    if (!layers || layers.length === 0) {
        container.innerHTML = '<p>画像レイヤーが見つかりません</p>';
        return;
    }

    container.innerHTML = '';

    layers.forEach((layer, index) => {
        const name = layer.name || `Layer ${index + 1}`;

        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.dataset.layerIndex = index;

        if (layer.canvas) {
            const canvas = layer.canvas.cloneNode(false);
            canvas.width = layer.canvas.width;
            canvas.height = layer.canvas.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(layer.canvas, 0, 0);
            canvas.className = 'grid-canvas';

            gridItem.appendChild(canvas);
        }

        const labelDiv = document.createElement('div');
        labelDiv.className = 'grid-label';
        labelDiv.textContent = name;
        gridItem.appendChild(labelDiv);

        container.appendChild(gridItem);
    });
}

/**
 * すべてのレイヤーを再帰的に取得
 */
function getAllLayers(layers, result = []) {
    for (const layer of layers) {
        result.push(layer);
        if (layer.children) {
            getAllLayers(layer.children, result);
        }
    }
    return result;
}

/**
 * レイヤータイプを判定
 */
function getLayerType(layer) {
    if (layer.children) return 'group';
    if (layer.text) return 'text';
    if (layer.canvas) return 'image';
    return 'normal';
}

function getLayerGeometry(layer) {
    const left = typeof layer.left === 'number' ? layer.left : 0;
    const top = typeof layer.top === 'number' ? layer.top : 0;
    const width = typeof layer.right === 'number' && typeof layer.left === 'number'
        ? layer.right - layer.left
        : (layer.canvas?.width || 0);
    const height = typeof layer.bottom === 'number' && typeof layer.top === 'number'
        ? layer.bottom - layer.top
        : (layer.canvas?.height || 0);

    return {
        left,
        top,
        width,
        height
    };
}

/**
 * プレビュー画像を表示
 */
export async function displayPreview(previewPsd, container, fallbackPsd = null) {
    try {
        const compositeBuffer = await previewPsd.composite();
        const canvas = document.createElement('canvas');
        canvas.width = previewPsd.width;
        canvas.height = previewPsd.height;
        canvas.className = 'preview-image';

        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(compositeBuffer, previewPsd.width, previewPsd.height);
        ctx.putImageData(imageData, 0, 0);

        container.innerHTML = '';
        container.appendChild(canvas);
    } catch (error) {
        console.error('Preview generation error:', error);
        if (fallbackPsd) {
            renderFallbackPreview(fallbackPsd, container);
        } else {
            container.innerHTML = `<p class="error">プレビュー生成エラー: ${error.message}</p>`;
        }
    }
}

/**
 * DOMベースのプレビューを表示
 */
export function displayDomPreview(psd, container) {
    if (!psd?.width || !psd?.height) {
        container.innerHTML = '<p>ドキュメントサイズを取得できませんでした</p>';
        return;
    }

    const layers = getAllLayers(psd.children || []).filter(layer => layer.canvas && layer.hidden !== true);
    container.innerHTML = '';

    if (layers.length === 0) {
        container.innerHTML = '<p>DOMレンダリング可能なレイヤーが見つかりません</p>';
        return;
    }

    const maxWidth = 700;
    const maxHeight = 500;
    const scale = Math.min(1, maxWidth / psd.width, maxHeight / psd.height);

    const wrapper = document.createElement('div');
    wrapper.className = 'dom-preview-wrapper';

    const stage = document.createElement('div');
    stage.className = 'dom-preview-stage';
    stage.style.width = `${psd.width}px`;
    stage.style.height = `${psd.height}px`;
    if (scale < 1) {
        stage.style.transform = `scale(${scale})`;
    }

    layers.forEach((layer, index) => {
        const geometry = getLayerGeometry(layer);
        if (geometry.width === 0 || geometry.height === 0) return;

        const node = document.createElement('div');
        node.className = 'dom-layer-node';
        node.style.left = `${geometry.left}px`;
        node.style.top = `${geometry.top}px`;
        node.style.width = `${geometry.width}px`;
        node.style.height = `${geometry.height}px`;
        node.style.opacity = layer.opacity !== undefined ? layer.opacity / 255 : 1;
        node.style.display = layer.hidden ? 'none' : 'block';
        node.title = `${layer.name || `Layer ${index + 1}`}`;

        try {
            const dataUrl = layer.canvas.toDataURL('image/png');
            node.style.backgroundImage = `url(${dataUrl})`;
        } catch (err) {
            console.warn('Layer previewの生成に失敗しました', err);
        }

        stage.appendChild(node);
    });

    wrapper.appendChild(stage);
    container.appendChild(wrapper);

    const meta = document.createElement('div');
    meta.className = 'dom-preview-meta';
    const scaleLabel = scale < 1 ? `縮尺: ${Math.round(scale * 100)}%` : '等倍表示';
    meta.textContent = `DOM Layers: ${layers.length} / サイズ: ${psd.width}×${psd.height}px (${scaleLabel})`;
    container.appendChild(meta);
}

function renderFallbackPreview(psd, container) {
    if (psd.canvas) {
        container.innerHTML = '';
        psd.canvas.className = 'preview-image';
        container.appendChild(psd.canvas);
    } else if (psd.imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = psd.width;
        canvas.height = psd.height;
        canvas.className = 'preview-image';

        const ctx = canvas.getContext('2d');
        ctx.putImageData(psd.imageData, 0, 0);

        container.innerHTML = '';
        container.appendChild(canvas);
    } else {
        container.innerHTML = '<p>プレビューを生成できませんでした</p>';
    }
}

/**
 * カラーモードを人間が読める形式に変換
 */
function getColorMode(mode) {
    const modes = {
        0: 'Bitmap',
        1: 'Grayscale',
        2: 'Indexed',
        3: 'RGB',
        4: 'CMYK',
        7: 'Multichannel',
        8: 'Duotone',
        9: 'Lab'
    };
    return modes[mode] || 'Unknown';
}

/**
 * PSDファイルを解析（詳細情報取得用）
 */
export function parsePSDFile(psd) {
    const layers = getAllLayers(psd.children || []);

    return {
        document: {
            name: 'Untitled',
            width: psd.width,
            height: psd.height,
            colorMode: getColorMode(psd.colorMode),
            depth: psd.bitsPerChannel || 8,
            resolution: psd.imageResources?.resolutionInfo
        },
        layers: layers.map((layer, index) => ({
            id: index,
            name: layer.name,
            type: getLayerType(layer),
            visible: layer.hidden !== true,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
            bounds: {
                width: layer.right && layer.left ? layer.right - layer.left : 0,
                height: layer.bottom && layer.top ? layer.bottom - layer.top : 0,
                left: layer.left,
                top: layer.top,
                right: layer.right,
                bottom: layer.bottom
            }
        }))
    };
}
