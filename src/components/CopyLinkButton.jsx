import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';

export default function CopyLinkButton({ value, compact = false }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const writeToClipboard = async () => {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copiedSuccessfully = document.execCommand('copy');
    input.remove();
    if (!copiedSuccessfully) throw new Error('Não foi possível copiar o link.');
  };

  const copy = async () => {
    try {
      await writeToClipboard();
      setCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Link copiado' : 'Copiar link curto'}
      aria-label={copied ? 'Link copiado' : 'Copiar link curto'}
      className={`${compact ? 'p-2' : 'px-3 py-2'} shrink-0 inline-flex items-center justify-center gap-2 rounded-md border transition-colors ${copied ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300' : 'border-[#3b4656] text-[#aeb7c4] hover:text-white hover:border-[#60708a]'}`}
    >
      {copied ? <FiCheck /> : <FiCopy />}
      {!compact && <span className="text-sm font-bold">{copied ? 'Copiado' : 'Copiar link'}</span>}
    </button>
  );
}
