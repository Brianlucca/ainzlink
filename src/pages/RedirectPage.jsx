import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import PasswordInput from '../components/PasswordInput';
import Layout from '../components/Layout';
import { getApiError } from '../api/client';
import { linkService } from '../services/linkService';
import TurnstileWidget from '../components/TurnstileWidget';

export default function RedirectPage() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [destination, setDestination] = useState({ host: '', token: '' });
  const [reportSent, setReportSent] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportToken, setReportToken] = useState('');
  const [reportResetKey, setReportResetKey] = useState(0);
  const handleReportWidgetError = useCallback(() => {
    setReportMessage('Não foi possível carregar a verificação de segurança.');
  }, []);

  const handlePasswordSuccess = (originalUrl) => {
    window.location.replace(originalUrl);
  };

  useEffect(() => {
    const fetchUrl = async (previewConfirmed = false) => {
      try {
        const response = await linkService.resolve(shortCode, previewConfirmed);
        
        if (response.previewRequired) {
          setDestination({
            host: response.destinationHost,
            token: response.destinationToken,
          });
          setStatus('preview');
        } else if (response.passwordProtected) {
          setStatus('needsPassword');
        } else if (response.originalUrl) {
          window.location.replace(response.originalUrl);
        }
      } catch (err) {
        setError(getApiError(err, 'Não foi possível encontrar este link.'));
        setStatus('error');
      }
    };
    fetchUrl();
  }, [shortCode]);

  const continueToDestination = async () => {
    setStatus('loading');
    try {
      const response = await linkService.resolve(shortCode, true, destination.token);
      if (response.passwordProtected) setStatus('needsPassword');
      else window.location.replace(response.originalUrl);
    } catch (err) {
      setError(getApiError(err));
      setStatus('error');
    }
  };

  const reportLink = async () => {
    setReportMessage('');
    try {
      await linkService.report(shortCode, 'Link suspeito', reportToken);
      setReportSent(true);
      setReportOpen(false);
      setReportMessage('Denúncia enviada. Obrigado por ajudar a manter o AinzLink seguro.');
    } catch (err) {
      const message = getApiError(err, 'Não foi possível enviar a denúncia.');
      setReportMessage(message);
    } finally {
      setReportToken('');
      setReportResetKey((current) => current + 1);
    }
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="app-shell flex justify-center py-8 sm:py-12">
            <div className="w-full max-w-lg">
                <Loading message="Redirecionando..." />
            </div>
        </div>
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout>
         <div className="w-[calc(100%-24px)] max-w-lg mx-auto my-8 sm:my-12 bg-red-900/50 border border-red-700 text-red-300 p-5 sm:p-8 rounded-lg text-center shadow-lg">
            <h2 className="text-3xl font-bold">Erro</h2>
            <p className="text-xl mt-2">{error}</p>
        </div>
      </Layout>
    );
  }

  if (status === 'needsPassword') {
    return (
      <Layout>
        <PasswordInput shortCode={shortCode} destinationToken={destination.token} onSuccess={handlePasswordSuccess} />
      </Layout>
    );
  }

  if (status === 'preview') {
    return (
      <Layout>
        <section className="surface w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-xl mx-auto my-8 sm:mt-12 md:mt-20 p-5 sm:p-7 md:p-9">
          <span className="eyebrow">Saída segura</span>
          <h2 className="text-3xl font-extrabold mt-2">Confirme o destino</h2>
          <p className="text-gray-400 mt-6">Este link direciona para o domínio:</p>
          <p className="text-[#9db3ff] text-xl sm:text-2xl font-bold break-all mt-2 p-3 sm:p-4 bg-[#0d1118] border border-[#303744] rounded-md">{destination.host}</p>
          <p className="text-gray-500 text-sm leading-6 mt-4">Confira o domínio antes de continuar. Nunca informe senhas em sites que você não reconhece.</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button onClick={continueToDestination} className="sm:flex-1 bg-[#4d78ff] hover:bg-[#668bff] p-3 rounded-md font-bold">Continuar</button>
            <button onClick={() => navigate('/')} className="border border-gray-600 text-gray-300 p-3 rounded-md">
              Cancelar
            </button>
            <button onClick={() => setReportOpen((current) => !current)} className="border border-red-700 text-red-300 p-3 rounded-md">
              {reportSent ? 'Denunciar novamente' : 'Denunciar'}
            </button>
          </div>
          {reportOpen && (
            <div className="mt-5 p-4 border border-red-900 bg-red-950/20 rounded-md">
              <p className="text-sm text-gray-300 mb-3">Confirme a verificação para enviar a denúncia.</p>
              <TurnstileWidget action="report_link" resetKey={reportResetKey} onToken={setReportToken} onError={handleReportWidgetError} />
              <div className="flex flex-col min-[420px]:flex-row gap-2 mt-3">
                <button onClick={reportLink} disabled={!reportToken} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md font-bold disabled:opacity-40">
                  Enviar denúncia
                </button>
                <button onClick={() => setReportOpen(false)} className="text-gray-400 px-3 py-2">Fechar</button>
              </div>
            </div>
          )}
          {reportMessage && <p className="text-sm text-gray-400 mt-4">{reportMessage}</p>}
        </section>
      </Layout>
    );
  }

  return null;
}
