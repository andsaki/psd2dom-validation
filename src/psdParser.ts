import type { ImageResources, Layer, Psd as AgPsdDocument, PixelData } from 'ag-psd';
import type WebtoonPsd from '@webtoon/psd';

type LayerType = 'group' | 'text' | 'image' | 'normal';
type LayerWithCanvas = Layer & { canvas: HTMLCanvasElement };
type ResolutionInfo = ImageResources['resolutionInfo'];

interface LayerGeometry {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface ParsedLayerSummary {
    id: number;
    name?: string;
    type: LayerType;
    visible: boolean;
    opacity?: number;
    blendMode?: string;
    bounds: {
        width: number;
        height: number;
        left?: number;
        top?: number;
        right?: number;
        bottom?: number;
    };
}

interface ParsedPsdSummary {
    document: {
        name: string;
        width: number;
        height: number;
        colorMode: string;
        depth: number;
        resolution?: ResolutionInfo;
    };
    layers: ParsedLayerSummary[];
}

const hasCanvas = (layer: Layer): layer is LayerWithCanvas => Boolean(layer.canvas);
const isRenderableLayer = (layer: Layer): layer is LayerWithCanvas => Boolean(layer.canvas) && layer.hidden !== true;

/**
 * PSD情報を表示
 */
export function displayPSDInfo(psd: AgPsdDocument, container: HTMLElement): void {
    const info: Record<string, string> = {
        'ファイル名': 'Untitled',
        '幅': `${psd.width}px`,
        '高さ': `${psd.height}px`,
        'カラーモード': getColorMode(psd.colorMode),
        'ビット深度': `${psd.bitsPerChannel ?? 8} bit`,
        'レイヤー数': `${countLayers(psd.children ?? [])}`,
        'ドキュメント解像度': `${psd.imageResources?.resolutionInfo?.horizontalResolution ?? 72} DPI`
    };

    const rows = Object.entries(info).map(([label, value]) => `
            <div class="info-row">
                <span class="info-label">${label}:</span>
                <span class="info-value">${value}</span>
            </div>
        `);

    container.innerHTML = rows.join('');
}

/**
 * レイヤー数をカウント（再帰的）
 */
function countLayers(layers: Layer[] = []): number {
    let count = 0;
    for (const layer of layers) {
        count += 1;
        if (layer.children) {
            count += countLayers(layer.children);
        }
    }
    return count;
}

/**
 * レイヤー構造を表示（サムネイル付き）
 */
export function displayLayers(psd: AgPsdDocument, container: HTMLElement): void {
    const layers = getAllLayers(psd.children ?? []);

    if (layers.length === 0) {
        container.innerHTML = '<p>レイヤーが見つかりません</p>';
        return;
    }

    container.innerHTML = '';

    layers.forEach((layer, index) => {
        const name = layer.name || `Layer ${index + 1}`;
        const type = getLayerType(layer);
        const visible = layer.hidden !== true;
        const opacity = layer.opacity ?? 255;
        const blendMode = layer.blendMode || 'normal';

        const width = typeof layer.right === 'number' && typeof layer.left === 'number'
            ? layer.right - layer.left
            : 0;
        const height = typeof layer.bottom === 'number' && typeof layer.top === 'number'
            ? layer.bottom - layer.top
            : 0;
        const left = layer.left ?? 0;
        const top = layer.top ?? 0;

        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.dataset.layerIndex = index.toString();

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
            const thumbnailContainer = layerItem.querySelector<HTMLDivElement>('.layer-thumbnail-container');
            thumbnailContainer?.appendChild(thumbnail);
        }

        container.appendChild(layerItem);
    });
}

/**
 * レイヤーのサムネイルを生成
 */
function createLayerThumbnail(layer: Layer, maxSize = 60): HTMLCanvasElement | null {
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
    } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;
    canvas.className = 'layer-thumbnail';

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(layer.canvas, 0, 0, width, height);
    }

    return canvas;
}

/**
 * コマ一覧をグリッドで表示
 */
export function displayLayerGrid(psd: AgPsdDocument, container: HTMLElement): void {
    const layers = getAllLayers(psd.children ?? []).filter(hasCanvas);

    if (layers.length === 0) {
        container.innerHTML = '<p>画像レイヤーが見つかりません</p>';
        return;
    }

    container.innerHTML = '';

    layers.forEach((layer, index) => {
        const name = layer.name || `Layer ${index + 1}`;

        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.dataset.layerIndex = index.toString();

        const canvas = layer.canvas.cloneNode(false) as HTMLCanvasElement;
        canvas.width = layer.canvas.width;
        canvas.height = layer.canvas.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(layer.canvas, 0, 0);
        }
        canvas.className = 'grid-canvas';
        gridItem.appendChild(canvas);

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
function getAllLayers(layers: Layer[] = [], result: Layer[] = []): Layer[] {
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
function getLayerType(layer: Layer): LayerType {
    if (layer.children) return 'group';
    if (layer.text) return 'text';
    if (layer.canvas) return 'image';
    return 'normal';
}

function getLayerGeometry(layer: Layer): LayerGeometry {
    const left = typeof layer.left === 'number' ? layer.left : 0;
    const top = typeof layer.top === 'number' ? layer.top : 0;
    const width = typeof layer.right === 'number' && typeof layer.left === 'number'
        ? layer.right - layer.left
        : layer.canvas?.width ?? 0;
    const height = typeof layer.bottom === 'number' && typeof layer.top === 'number'
        ? layer.bottom - layer.top
        : layer.canvas?.height ?? 0;

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
export async function displayPreview(previewPsd: WebtoonPsd, container: HTMLElement, fallbackPsd: AgPsdDocument | null = null): Promise<void> {
    try {
        const compositeBuffer = await previewPsd.composite();
        const canvas = document.createElement('canvas');
        canvas.width = previewPsd.width;
        canvas.height = previewPsd.height;
        canvas.className = 'preview-image';

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('2D context is not available.');
        }
        const imageDataArray = cloneToImageDataArray(compositeBuffer);
        const imageData = new ImageData(imageDataArray, previewPsd.width, previewPsd.height);
        ctx.putImageData(imageData, 0, 0);

        container.innerHTML = '';
        container.appendChild(canvas);
    } catch (error) {
        console.error('Preview generation error:', error);
        if (fallbackPsd) {
            renderFallbackPreview(fallbackPsd, container);
        } else {
            const message = error instanceof Error ? error.message : '不明なエラー';
            container.innerHTML = `<p class="error">プレビュー生成エラー: ${message}</p>`;
        }
    }
}

/**
 * DOMベースのプレビューを表示
 */
export function displayDomPreview(psd: AgPsdDocument, container: HTMLElement): void {
    if (!psd?.width || !psd?.height) {
        container.innerHTML = '<p>ドキュメントサイズを取得できませんでした</p>';
        return;
    }

    const allLayers = getAllLayers(psd.children ?? []);
    const layers = allLayers.filter(isRenderableLayer);

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

        if (geometry.width === 0 || geometry.height === 0) {
            return;
        }

        const node = document.createElement('div');
        node.className = 'dom-layer-node';
        node.style.left = `${geometry.left}px`;
        node.style.top = `${geometry.top}px`;

        // ag-psdのopacityは0-255の範囲。255が完全不透明、0が完全透明
        // undefinedまたは255の場合は完全不透明として扱う
        const opacityValue = layer.opacity === undefined || layer.opacity === 255 ? 1 : layer.opacity / 255;
        node.style.opacity = `${opacityValue}`;
        console.log(`Layer ${index} opacity: raw=${layer.opacity}, calculated=${opacityValue}`);

        node.style.display = layer.hidden ? 'none' : 'block';
        node.title = `${layer.name || `Layer ${index + 1}`}`;

        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = layer.canvas.width;
        layerCanvas.height = layer.canvas.height;
        layerCanvas.style.border = '1px solid red';
        console.log(`Layer ${index} (${layer.name}): canvas ${layerCanvas.width}x${layerCanvas.height}, pos: (${geometry.left}, ${geometry.top})`);

        const ctx = layerCanvas.getContext('2d');
        if (ctx) {
            try {
                ctx.drawImage(layer.canvas, 0, 0);
                console.log(`Layer ${index}: drawn successfully`);
            } catch (err) {
                console.error(`Layer ${index} draw failed:`, err);
            }
        }
        node.appendChild(layerCanvas);

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

function renderFallbackPreview(psd: AgPsdDocument, container: HTMLElement): void {
    if (psd.canvas) {
        container.innerHTML = '';
        psd.canvas.className = 'preview-image';
        container.appendChild(psd.canvas);
        return;
    }

    if (psd.imageData) {
        const canvas = buildCanvasFromPixelData(psd.imageData);
        canvas.className = 'preview-image';

        container.innerHTML = '';
        container.appendChild(canvas);
        return;
    }

    container.innerHTML = '<p>プレビューを生成できませんでした</p>';
}

function buildCanvasFromPixelData(pixelData: PixelData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = pixelData.width;
    canvas.height = pixelData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('2D context is not available for fallback preview.');
    }

    const imageDataArray = cloneToImageDataArray(pixelData.data);
    const imageData = new ImageData(imageDataArray, pixelData.width, pixelData.height);
    ctx.putImageData(imageData, 0, 0);

    return canvas;
}

function cloneToImageDataArray(source: ArrayLike<number>): Uint8ClampedArray<ArrayBuffer> {
    const buffer = new ArrayBuffer(source.length);
    const target = new Uint8ClampedArray(buffer);
    target.set(source);
    return target;
}

/**
 * カラーモードを人間が読める形式に変換
 */
function getColorMode(mode?: number): string {
    const modes: Record<number, string> = {
        0: 'Bitmap',
        1: 'Grayscale',
        2: 'Indexed',
        3: 'RGB',
        4: 'CMYK',
        7: 'Multichannel',
        8: 'Duotone',
        9: 'Lab'
    };
    return typeof mode === 'number' && modes[mode] ? modes[mode] : 'Unknown';
}

/**
 * PSDファイルを解析（詳細情報取得用）
 */
export function parsePSDFile(psd: AgPsdDocument): ParsedPsdSummary {
    const layers = getAllLayers(psd.children ?? []);

    return {
        document: {
            name: 'Untitled',
            width: psd.width,
            height: psd.height,
            colorMode: getColorMode(psd.colorMode),
            depth: psd.bitsPerChannel ?? 8,
            resolution: psd.imageResources?.resolutionInfo
        },
        layers: layers.map((layer, index): ParsedLayerSummary => ({
            id: index,
            name: layer.name,
            type: getLayerType(layer),
            visible: layer.hidden !== true,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
            bounds: {
                width: typeof layer.right === 'number' && typeof layer.left === 'number' ? layer.right - layer.left : 0,
                height: typeof layer.bottom === 'number' && typeof layer.top === 'number' ? layer.bottom - layer.top : 0,
                left: layer.left,
                top: layer.top,
                right: layer.right,
                bottom: layer.bottom
            }
        }))
    };
}
