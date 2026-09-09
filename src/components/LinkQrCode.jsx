import { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FiCheck, FiDownload, FiRefreshCw, FiShare2 } from 'react-icons/fi';

const QR_PRESETS = [
  { name: 'Clássico', foreground: '#111827', background: '#ffffff' },
  { name: 'Azul', foreground: '#17458f', background: '#ffffff' },
  { name: 'Violeta', foreground: '#4c1d95', background: '#faf7ff' },
  { name: 'Esmeralda', foreground: '#065f46', background: '#f0fdf4' },
];

let logoPromise;

const loadLogo = () => {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = '/logo.png';
    });
  }
  return logoPromise;
};

const roundedRect = (context, x, y, width, height, radius) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
};

const drawRoundedFill = (context, x, y, width, height, radius, fill) => {
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
};

const drawRoundedStroke = (context, x, y, width, height, radius, stroke) => {
  roundedRect(context, x, y, width, height, radius);
  context.strokeStyle = stroke;
  context.stroke();
};

const fitText = (context, text, maximumWidth) => {
  if (context.measureText(text).width <= maximumWidth) return text;
  const url = new URL(text);
  let compact = `${url.host}${url.pathname}${url.search}`;
  while (compact.length > 12 && context.measureText(`${compact}…`).width > maximumWidth) {
    compact = compact.slice(0, -1);
  }
  return `${compact}…`;
};

const channel = (hex, offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
const luminance = (hex) => {
  const convert = (value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * convert(channel(hex, 1))
    + 0.7152 * convert(channel(hex, 3))
    + 0.0722 * convert(channel(hex, 5));
};
const contrastRatio = (first, second) => {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
};

const createShareImage = async (qrCanvas, shortUrl, qrBackground) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, '#07101f');
  background.addColorStop(0.55, '#0b1220');
  background.addColorStop(1, '#101a35');
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(940, 110, 20, 940, 110, 380);
  glow.addColorStop(0, 'rgba(77,120,255,.32)');
  glow.addColorStop(1, 'rgba(77,120,255,0)');
  context.fillStyle = glow;
  context.fillRect(560, 0, 520, 520);

  const logo = await loadLogo();
  drawRoundedFill(context, 68, 56, 112, 82, 18, '#ffffff');
  if (logo) context.drawImage(logo, 76, 62, 96, 70);
  else {
    context.fillStyle = '#17458f';
    context.font = '800 42px Arial';
    context.textAlign = 'center';
    context.fillText('A', 124, 112);
  }

  context.textAlign = 'left';
  context.fillStyle = '#ffffff';
  context.font = '800 34px Arial';
  context.fillText('AINZLINK', 202, 91);
  context.fillStyle = '#92a0b5';
  context.font = '22px Arial';
  context.fillText('Links inteligentes e seguros', 202, 124);

  drawRoundedFill(context, 780, 68, 230, 54, 27, 'rgba(77,120,255,.16)');
  drawRoundedStroke(context, 780, 68, 230, 54, 27, 'rgba(112,148,255,.55)');
  context.textAlign = 'center';
  context.fillStyle = '#a9bdff';
  context.font = '700 19px Arial';
  context.fillText('LINK SEGURO', 895, 102);

  context.textAlign = 'left';
  context.fillStyle = '#ffffff';
  context.font = '800 54px Arial';
  context.fillText('Escaneie para acessar', 68, 225);
  context.fillStyle = '#a8b3c4';
  context.font = '26px Arial';
  context.fillText('Abra a câmera do celular e aponte para o código.', 68, 273);

  context.shadowColor = 'rgba(0,0,0,.38)';
  context.shadowBlur = 34;
  context.shadowOffsetY = 18;
  drawRoundedFill(context, 130, 322, 820, 780, 44, '#111a2a');
  context.shadowColor = 'transparent';
  context.lineWidth = 2;
  drawRoundedStroke(context, 130, 322, 820, 780, 44, '#2b3a53');

  drawRoundedFill(context, 215, 382, 650, 650, 28, qrBackground);
  context.drawImage(qrCanvas, 245, 412, 590, 590);

  context.fillStyle = '#8290a6';
  context.font = '700 18px Arial';
  context.textAlign = 'center';
  context.fillText('ENDEREÇO DO LINK', 540, 1158);
  drawRoundedFill(context, 110, 1180, 860, 76, 24, 'rgba(8,13,24,.72)');
  context.lineWidth = 2;
  drawRoundedStroke(context, 110, 1180, 860, 76, 24, '#2c3c5b');
  context.fillStyle = '#b9caff';
  context.font = '700 27px Arial';
  context.fillText(fitText(context, shortUrl, 790), 540, 1228);

  context.fillStyle = '#7f8ba0';
  context.font = '20px Arial';
  context.fillText('Confira o domínio antes de continuar', 540, 1310);
  return canvas;
};

export default function LinkQrCode({ shortUrl, style = {}, editable = false, onStyleChange, compact = false }) {
  const qrWrapperRef = useRef(null);
  const [shared, setShared] = useState(false);
  const [exporting, setExporting] = useState(false);
  const foreground = style.foreground || '#111827';
  const background = style.background || '#ffffff';
  const displaySize = compact ? 96 : 184;
  const renderSize = compact ? 256 : 512;
  const contrast = useMemo(() => contrastRatio(foreground, background), [foreground, background]);

  const getImageCanvas = async () => {
    const qrCanvas = qrWrapperRef.current?.querySelector('canvas');
    return qrCanvas ? createShareImage(qrCanvas, shortUrl, background) : null;
  };

  const saveCanvas = (canvas) => {
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `ainzlink-${shortUrl.split('/').pop()}.png`;
    anchor.click();
  };

  const download = async () => {
    setExporting(true);
    try {
      const canvas = await getImageCanvas();
      if (canvas) saveCanvas(canvas);
    } finally {
      setExporting(false);
    }
  };

  const share = async () => {
    setExporting(true);
    const canvas = await getImageCanvas();
    if (!canvas) {
      setExporting(false);
      return;
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `ainzlink-${shortUrl.split('/').pop()}.png`, { type: 'image/png' });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Link compartilhado pelo AinzLink',
          text: 'Escaneie o QR Code ou abra o endereço compartilhado.',
          url: shortUrl,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(shortUrl);
        saveCanvas(canvas);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (error) {
      if (error.name !== 'AbortError') saveCanvas(canvas);
    } finally {
      setExporting(false);
    }
  };

  const updateStyle = (changes) => onStyleChange?.({ ...style, ...changes });

  return (
    <div className={compact ? 'flex flex-wrap items-center gap-3' : editable ? 'grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start' : 'shrink-0 space-y-4'}>
      <div ref={qrWrapperRef} className="shrink-0 p-2 bg-white rounded-lg w-fit aspect-square shadow-[0_12px_35px_rgba(0,0,0,.25)]">
        <QRCodeCanvas value={shortUrl} size={renderSize} fgColor={foreground} bgColor={background} includeMargin level="H" className="block shrink-0 aspect-square" style={{ width: displaySize, height: displaySize, maxWidth: 'none' }} />
      </div>

      <div className={compact ? 'flex gap-2' : 'space-y-4'}>
        {editable && (
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wide text-[#7f8998] mb-2">Estilos rápidos</span>
              <div className="flex flex-wrap gap-2">
                {QR_PRESETS.map((preset) => {
                  const active = foreground === preset.foreground && background === preset.background;
                  return (
                    <button key={preset.name} type="button" onClick={() => updateStyle({ foreground: preset.foreground, background: preset.background })} className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-bold transition-colors ${active ? 'border-[#6f91ff] bg-[#1b2a50] text-white' : 'border-[#343c49] text-[#aeb7c4] hover:border-[#596474]'}`}>
                      <span className="w-4 h-4 rounded-full border border-white/30" style={{ background: preset.foreground }} />
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-gray-400">
                Cor do código
                <span className="mt-1 flex items-center gap-2 border border-[#343c49] rounded-md p-2 bg-[#0e1219]">
                  <input type="color" value={foreground} onChange={(event) => updateStyle({ foreground: event.target.value })} className="w-8 h-8 bg-transparent cursor-pointer" />
                  <span className="font-mono uppercase">{foreground}</span>
                </span>
              </label>
              <label className="text-xs text-gray-400">
                Cor do fundo
                <span className="mt-1 flex items-center gap-2 border border-[#343c49] rounded-md p-2 bg-[#0e1219]">
                  <input type="color" value={background} onChange={(event) => updateStyle({ background: event.target.value })} className="w-8 h-8 bg-transparent cursor-pointer" />
                  <span className="font-mono uppercase">{background}</span>
                </span>
              </label>
              <button type="button" onClick={() => updateStyle({ foreground: QR_PRESETS[0].foreground, background: QR_PRESETS[0].background })} className="h-[50px] px-3 border border-[#343c49] rounded-md text-[#aeb7c4] hover:text-white inline-flex items-center gap-2 text-xs font-bold">
                <FiRefreshCw /> Restaurar
              </button>
            </div>
            {contrast < 4.5 && <p className="text-xs text-amber-300 border border-amber-900/70 bg-amber-950/20 rounded-md p-3">Use cores com mais contraste para que o QR Code seja reconhecido com facilidade.</p>}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} disabled={exporting} title="Baixar imagem com QR Code" className={`${compact ? 'p-2' : 'px-3 py-2'} border border-gray-600 rounded-md hover:border-cyan-500 hover:text-cyan-400 disabled:opacity-40 inline-flex items-center gap-2`}>
            <FiDownload /> {!compact && (exporting ? 'Preparando...' : 'Baixar PNG')}
          </button>
          <button type="button" onClick={share} disabled={exporting} title="Compartilhar imagem e link" className={`${compact ? 'p-2' : 'px-3 py-2'} border border-gray-600 rounded-md hover:border-cyan-500 hover:text-cyan-400 disabled:opacity-40 inline-flex items-center gap-2`}>
            {shared ? <FiCheck /> : <FiShare2 />} {!compact && (shared ? 'Compartilhado' : 'Compartilhar')}
          </button>
        </div>
      </div>
    </div>
  );
}
