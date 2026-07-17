import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiCopy, FiPlus, FiSettings, FiShare2 } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { env } from '../config/env';
import LinkQrCode from './LinkQrCode';
import { useAuth } from '../contexts/useAuth';
import { linkService } from '../services/linkService';

export default function Result({ shortUrl, adminUrl, error, onCreateAnother }) {
  const [copied, setCopied] = useState('');
  const [claimState, setClaimState] = useState('');
  const { user, login, configured } = useAuth();

  const handleCopy = async (text, type) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  if (error) {
    return (
      <div className="border border-red-900 bg-red-950/40 text-red-200 p-5 rounded-md flex items-center">
        <FiAlertTriangle className="text-2xl mr-3 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }
  if (!shortUrl) return null;

  const getPath = (url) => {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search + parsed.hash;
  };
  const shortPath = getPath(shortUrl);
  const adminPath = getPath(adminUrl);
  const displayShortUrl = `${env.appUrl}${shortPath}`;
  const displayAdminUrl = `${env.appUrl}${adminPath}`;
  const claimCreatedLink = async () => {
    try {
      setClaimState('loading');
      if (!user) await login();
      const admin = new URL(adminUrl);
      const token = new URLSearchParams(admin.hash.slice(1)).get('token')
        || admin.searchParams.get('token');
      const shortCode = shortPath.split('/').filter(Boolean).pop();
      await linkService.claim(shortCode, token);
      setClaimState('saved');
    } catch {
      setClaimState('error');
    }
  };

  return (
    <div className="surface overflow-hidden border-[#3159bf]">
      <div className="px-4 pt-5 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
        <span className="eyebrow">Link criado</span>
        <h2 className="text-2xl font-extrabold text-white mt-2">Pronto para compartilhar</h2>
        <p className="text-sm text-[#929baa] mt-1">Baixe o QR Code, copie o endereço ou abra a administração.</p>
      </div>
      <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center md:text-left gap-6">
        <LinkQrCode shortUrl={displayShortUrl} />
        <div className="w-full flex-grow min-w-0">
        <div className="mb-4">
          <h3 className="font-bold text-xs text-[#8994a4] flex items-center"><FiShare2 className="mr-2" />LINK PRONTO</h3>
          <div className="flex items-center min-w-0 mt-2 bg-[#0d1118] p-2 rounded-md border border-[#303744]">
            <Link to={shortPath} target="_blank" rel="noopener noreferrer" className="text-[#8eabff] break-all hover:text-white text-sm sm:text-lg flex-grow min-w-0">
              {displayShortUrl}
            </Link>
            <button title="Copiar link" onClick={() => handleCopy(displayShortUrl, 'short')} className="ml-2 sm:ml-3 shrink-0 bg-[#252c38] hover:bg-[#375fc8] text-white p-2 rounded-md">
              {copied === 'short' ? <FiCheckCircle /> : <FiCopy />}
            </button>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-xs text-[#8994a4] flex items-center"><FiSettings className="mr-2" />LINK DE ADMINISTRAÇÃO</h3>
          <div className="flex items-center min-w-0 mt-2 bg-[#0d1118] p-2 rounded-md border border-[#303744]">
            <Link to={adminPath} target="_blank" rel="noopener noreferrer" className="text-[#d5b86f] break-all hover:text-white text-xs sm:text-sm flex-grow min-w-0">
              {displayAdminUrl}
            </Link>
            <button title="Copiar link de administração" onClick={() => handleCopy(displayAdminUrl, 'admin')} className="ml-2 sm:ml-3 shrink-0 bg-[#252c38] hover:bg-[#6f5c2c] text-white p-2 rounded-md">
              {copied === 'admin' ? <FiCheckCircle /> : <FiCopy />}
            </button>
          </div>
        </div>
        {!user && claimState !== 'saved' && (
          <div className="mt-5 pt-5 border-t border-[#303744]">
            <strong className="text-white">Não perca este link</strong>
            <p className="text-sm text-[#929baa] mt-1 mb-3">Entre para salvá-lo no dashboard e gerenciar de qualquer dispositivo.</p>
            <button disabled={!configured || claimState === 'loading'} onClick={claimCreatedLink} className="w-full flex items-center justify-center gap-2 bg-white text-[#101318] font-bold p-3 rounded-md hover:bg-[#e4e9f0] disabled:opacity-50">
              <FcGoogle size={20} /> {claimState === 'loading' ? 'Salvando...' : 'Entrar e salvar link'}
            </button>
            {claimState === 'error' && <p className="text-sm text-red-300 mt-2">Não foi possível salvar. Tente novamente.</p>}
          </div>
        )}
        {(user || claimState === 'saved') && (
          <p className="mt-5 pt-4 border-t border-[#303744] text-sm text-[#65d4ad] flex items-center gap-2">
            <FiCheckCircle /> Link salvo no seu dashboard.
          </p>
        )}
        </div>
      </div>
      {onCreateAnother && (
        <div className="p-5 md:px-8 md:py-6 bg-[#0e1219] border-t border-[#2b323e]">
          <button type="button" onClick={onCreateAnother} className="w-full inline-flex items-center justify-center gap-2 border border-[#3a4555] hover:border-[#668bff] hover:text-white text-[#c7cfda] font-bold p-3.5 rounded-md">
            <FiPlus /> Criar outro link
          </button>
        </div>
      )}
    </div>
  );
}
