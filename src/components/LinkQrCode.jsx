import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FiCheck, FiDownload, FiShare2 } from 'react-icons/fi';

const createShareImage = (qrCanvas, shortUrl) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');

  context.fillStyle = '#030712';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#22d3ee';
  context.font = 'bold 76px Arial';
  context.textAlign = 'center';
  context.fillText('AinzLink', canvas.width / 2, 150);

  context.fillStyle = '#ffffff';
  context.fillRect(190, 255, 700, 700);
  context.drawImage(qrCanvas, 230, 295, 620, 620);

  context.fillStyle = '#f3f4f6';
  context.font = 'bold 38px Arial';
  context.fillText('Aponte a camera para abrir', canvas.width / 2, 1050);
  context.fillStyle = '#67e8f9';
  context.font = '32px Arial';

  const displayUrl = shortUrl.length > 48 ? `${shortUrl.slice(0, 45)}...` : shortUrl;
  context.fillText(displayUrl, canvas.width / 2, 1120);

  context.fillStyle = '#9ca3af';
  context.font = '26px Arial';
  context.fillText('Confira o dominio antes de continuar', canvas.width / 2, 1210);
  return canvas;
};

export default function LinkQrCode({
  shortUrl,
  style = {},
  editable = false,
  onStyleChange,
  compact = false,
}) {
  const qrWrapperRef = useRef(null);
  const [shared, setShared] = useState(false);
  const foreground = style.foreground || '#111827';
  const background = style.background || '#ffffff';
  const size = compact ? 96 : 184;

  const getImageCanvas = () => {
    const qrCanvas = qrWrapperRef.current?.querySelector('canvas');
    return qrCanvas ? createShareImage(qrCanvas, shortUrl) : null;
  };

  const download = () => {
    const canvas = getImageCanvas();
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `ainzlink-${shortUrl.split('/').pop()}.png`;
    anchor.click();
  };

  const share = async () => {
    const canvas = getImageCanvas();
    if (!canvas) return;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `ainzlink-${shortUrl.split('/').pop()}.png`, { type: 'image/png' });

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'AinzLink',
          text: `Acesse este link: ${shortUrl}`,
          url: shortUrl,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(shortUrl);
        download();
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (error) {
      if (error.name !== 'AbortError') download();
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-3' : 'space-y-4'}>
      <div ref={qrWrapperRef} className="shrink-0 p-2 bg-white rounded-md w-fit">
        <QRCodeCanvas value={shortUrl} size={size} fgColor={foreground} bgColor={background} includeMargin />
      </div>

      <div className={compact ? 'flex gap-2' : 'space-y-3'}>
        {editable && (
          <div className="flex items-center gap-4">
            <label className="text-xs text-gray-400">
              Cor do QR
              <input type="color" value={foreground} onChange={(event) => onStyleChange({ ...style, foreground: event.target.value })} className="block mt-1 w-10 h-9 bg-transparent" />
            </label>
            <label className="text-xs text-gray-400">
              Fundo
              <input type="color" value={background} onChange={(event) => onStyleChange({ ...style, background: event.target.value })} className="block mt-1 w-10 h-9 bg-transparent" />
            </label>
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={download} title="Baixar imagem com QR Code" className="p-2 border border-gray-600 rounded-md hover:border-cyan-500 hover:text-cyan-400">
            <FiDownload />
          </button>
          <button type="button" onClick={share} title="Compartilhar imagem e link" className="p-2 border border-gray-600 rounded-md hover:border-cyan-500 hover:text-cyan-400">
            {shared ? <FiCheck /> : <FiShare2 />}
          </button>
        </div>
      </div>
    </div>
  );
}
