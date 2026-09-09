import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FiBell, FiCheckCircle, FiClock, FiLock, FiMail, FiSend } from 'react-icons/fi';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { getApiError } from '../api/client';
import { useAuth } from '../contexts/useAuth';
import { userService } from '../services/userService';

const options = [
  {
    key: 'linkCreated',
    title: 'Links criados',
    description: 'Receba uma confirmação quando um novo link for salvo na sua conta.',
  },
  {
    key: 'expiration',
    title: 'Links próximos da expiração',
    description: 'Receba um aviso até 24 horas antes de um link expirar.',
  },
  {
    key: 'weeklySummary',
    title: 'Resumo semanal',
    description: 'Acompanhe semanalmente a quantidade de links e acessos acumulados.',
  },
];

export default function NotificationSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [savedPreferences, setSavedPreferences] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [manualWeeklySummary, setManualWeeklySummary] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    userService.getNotificationSettings()
      .then((settings) => {
        setPreferences(settings.emailPreferences);
        setSavedPreferences(settings.emailPreferences);
        setManualWeeklySummary(settings.manualWeeklySummary);
      })
      .catch((requestError) => setError(getApiError(requestError, 'Não foi possível carregar suas preferências.')));
  }, [user]);

  if (authLoading) return <Layout><Loading message="Carregando sua conta..." /></Layout>;
  if (!user) return <Navigate to="/" replace />;
  if (!preferences && !error) return <Layout><Loading message="Carregando notificações..." /></Layout>;

  const toggle = (key) => {
    setSuccessMessage('');
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = async () => {
    setSaving(true);
    setSuccessMessage('');
    setError('');
    try {
      setPreferences(await userService.updateEmailPreferences(preferences));
      setSavedPreferences(preferences);
      setSuccessMessage('Preferências salvas.');
    } catch (requestError) {
      setError(getApiError(requestError, 'Não foi possível salvar suas preferências.'));
    } finally {
      setSaving(false);
    }
  };

  const sendSummaryNow = async () => {
    setSendingSummary(true);
    setSuccessMessage('');
    setError('');
    try {
      const response = await userService.sendWeeklySummaryNow();
      setManualWeeklySummary({ available: false, nextAvailableAt: response.nextAvailableAt });
      setSuccessMessage('Resumo enviado. Confira sua caixa de entrada.');
    } catch (requestError) {
      setError(getApiError(requestError, 'Não foi possível enviar o resumo agora.'));
    } finally {
      setSendingSummary(false);
    }
  };

  const nextSummaryDate = manualWeeklySummary?.nextAvailableAt
    ? new Date(manualWeeklySummary.nextAvailableAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : '';
  const hasChanges = preferences && savedPreferences
    ? JSON.stringify(preferences) !== JSON.stringify(savedPreferences)
    : false;

  return (
    <Layout>
      <section className="app-shell py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <span className="eyebrow">Configurações</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Notificações por e-mail</h1>
          <p className="text-[#929baa] mt-3 leading-6">
            Escolha quais mensagens deseja receber em <strong className="text-gray-200">{user.email}</strong>.
          </p>

          {error && <p className="mt-6 border border-red-900 bg-red-950/30 text-red-300 p-4 rounded-md">{error}</p>}
          {successMessage && <p className="mt-6 border border-emerald-900 bg-emerald-950/30 text-emerald-300 p-4 rounded-md flex items-center gap-2"><FiCheckCircle /> {successMessage}</p>}

          {preferences && (
            <>
            <div className="surface mt-7 overflow-hidden">
              <div className="divide-y divide-[#2b323e]">
                {options.map((option) => (
                  <label key={option.key} className="flex items-start justify-between gap-5 p-5 sm:p-6 cursor-pointer hover:bg-[#181d27]">
                    <span className="flex gap-4 min-w-0">
                      <FiBell className="mt-1 shrink-0 text-[#8ea9ff]" />
                      <span>
                        <strong className="block text-white">{option.title}</strong>
                        <span className="block text-sm text-[#929baa] mt-1 leading-6">{option.description}</span>
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(preferences[option.key])}
                      onChange={() => toggle(option.key)}
                      className="mt-1 h-5 w-5 shrink-0 accent-[#4d78ff]"
                    />
                  </label>
                ))}
              </div>

              <div className="p-5 sm:p-6 bg-[#0e1219] border-t border-[#2b323e]">
                <div className="flex gap-3 text-sm text-[#929baa] leading-6 mb-5">
                  <FiLock className="mt-1 shrink-0 text-[#65d4ad]" />
                  <p>Alertas essenciais de segurança, alterações críticas e moderação permanecem ativos para proteger sua conta e seus links.</p>
                </div>
                <button onClick={save} disabled={saving || !hasChanges} className="w-full sm:w-auto bg-[#4d78ff] hover:bg-[#668bff] px-6 py-3 rounded-md font-bold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                  <FiMail /> {saving ? 'Salvando...' : 'Salvar preferências'}
                </button>
              </div>
            </div>

            <section className="surface mt-5 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex gap-4">
                  <span className="grid place-items-center w-11 h-11 shrink-0 rounded-md border border-[#304679] bg-[#131d34] text-[#91abff]">
                    <FiSend />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-white">Receber resumo agora</h2>
                    <p className="text-sm text-[#929baa] mt-1 leading-6 max-w-xl">
                      Envie uma cópia do seu resumo diretamente para {user.email}. O pedido manual fica disponível uma vez a cada 7 dias e não interfere no envio automático.
                    </p>
                  </div>
                </div>
                <button
                  onClick={sendSummaryNow}
                  disabled={sendingSummary || !manualWeeklySummary?.available}
                  className="shrink-0 bg-white text-[#101318] hover:bg-[#e4e9f0] px-5 py-3 rounded-md font-bold disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {sendingSummary ? 'Enviando...' : 'Enviar agora'}
                </button>
              </div>
              {!manualWeeklySummary?.available && nextSummaryDate && (
                <p className="mt-4 pt-4 border-t border-[#2b323e] text-sm text-[#8791a0] flex items-center gap-2">
                  <FiClock /> Novo envio manual disponível em {nextSummaryDate}.
                </p>
              )}
            </section>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
