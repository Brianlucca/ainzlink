import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiBell, FiCheckCircle, FiClock, FiLock, FiMail, FiSend, FiTrash2 } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
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
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, reauthenticate } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [savedPreferences, setSavedPreferences] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [manualWeeklySummary, setManualWeeklySummary] = useState(null);
  const [accountSummary, setAccountSummary] = useState({ links: 0, clicks: 0 });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const accountName = user?.displayName || user?.email?.split('@')[0] || 'Usuário AinzLink';
  const accountInitial = accountName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!user) return;
    userService.getNotificationSettings()
      .then((settings) => {
        setPreferences(settings.emailPreferences);
        setSavedPreferences(settings.emailPreferences);
        setManualWeeklySummary(settings.manualWeeklySummary);
        setAccountSummary(settings.accountSummary || { links: 0, clicks: 0 });
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

  const deleteAccount = async () => {
    setDeletingAccount(true);
    setError('');
    setSuccessMessage('');
    try {
      await reauthenticate();
      await userService.deleteAccount();
      await logout();
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError?.message || getApiError(requestError, 'Não foi possível excluir sua conta.'));
      setDeletingAccount(false);
    }
  };

  return (
    <Layout>
      <section className="app-shell py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <span className="eyebrow">Configurações</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Notificações por e-mail</h1>
          <p className="text-[#929baa] mt-3 leading-6">
            Gerencie sua conta e escolha quais mensagens deseja receber.
          </p>

          <section className="surface mt-7 p-4 sm:p-5 shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover shrink-0 border border-[#3a4351]"
                  />
                ) : (
                  <span className="grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#29457f] text-white text-xl font-extrabold shrink-0">
                    {accountInitial}
                  </span>
                )}
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-[#7f8b9c]">Conta conectada</span>
                  <strong className="block text-white text-lg mt-1 truncate">{accountName}</strong>
                  <span className="block text-sm text-[#929baa] mt-0.5 break-all">{user.email}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 w-fit px-3 py-2 bg-white text-[#15181d] rounded-md text-sm font-bold shrink-0">
                <FcGoogle size={18} /> Google
              </span>
            </div>
          </section>

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

            <section className="mt-8 border border-red-950 bg-[linear-gradient(135deg,rgba(69,10,10,.18),rgba(13,17,24,.85))] rounded-lg overflow-hidden">
              <div className="p-5 sm:p-7">
                <div className="flex gap-4 items-start">
                  <span className="grid place-items-center w-11 h-11 shrink-0 rounded-md border border-red-900 bg-red-950/60 text-red-400">
                    <FiAlertTriangle />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-red-400">Encerrar conta AinzLink</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Apagar permanentemente seus links</h2>
                    <p className="text-sm text-[#a8aebb] mt-2 leading-6">
                      A conta Google <strong className="text-gray-200 break-all">{user.email}</strong> será desvinculada. Seus endereços curtos deixarão de redirecionar imediatamente e não poderão ser recuperados.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
                  <div className="border border-red-950/80 bg-[#0c0f15] rounded-md p-4">
                    <span className="block text-xs uppercase font-bold text-[#777f8c]">Links apagados</span>
                    <strong className="block text-2xl text-white mt-1">{accountSummary.links}</strong>
                  </div>
                  <div className="border border-red-950/80 bg-[#0c0f15] rounded-md p-4">
                    <span className="block text-xs uppercase font-bold text-[#777f8c]">Acessos removidos</span>
                    <strong className="block text-2xl text-white mt-1">{accountSummary.clicks}</strong>
                  </div>
                  <div className="border border-red-950/80 bg-[#0c0f15] rounded-md p-4">
                    <span className="block text-xs uppercase font-bold text-[#777f8c]">Resultado</span>
                    <strong className="block text-sm text-red-300 mt-2">Irreversível</strong>
                  </div>
                </div>

                {!deleteOpen ? (
                  <button onClick={() => setDeleteOpen(true)} className="mt-5 border border-red-800 text-red-300 hover:bg-red-950/40 px-5 py-3 rounded-md font-bold inline-flex items-center gap-2">
                    <FiTrash2 /> Quero excluir minha conta
                  </button>
                ) : (
                  <div className="mt-5 p-4 sm:p-5 border border-red-900 bg-[#0d1118] rounded-md">
                    <label htmlFor="delete-confirmation" className="block text-sm text-gray-300 leading-6">
                      Para confirmar a exclusão de <strong className="text-white break-all">{user.email}</strong>, digite <strong className="text-red-300">EXCLUIR</strong>. Depois, confirme sua identidade novamente pelo Google.
                    </label>
                    <input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmation(event.target.value)}
                      disabled={deletingAccount}
                      autoComplete="off"
                      className="w-full mt-3 bg-[#090c11] border border-[#3b424e] rounded-md p-3 text-white outline-none focus:border-red-600"
                    />
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <button
                        onClick={deleteAccount}
                        disabled={deleteConfirmation !== 'EXCLUIR' || deletingAccount}
                        className="bg-red-700 hover:bg-red-600 px-5 py-3 rounded-md font-bold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <FiTrash2 /> {deletingAccount ? 'Excluindo...' : 'Excluir permanentemente'}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteOpen(false);
                          setDeleteConfirmation('');
                        }}
                        disabled={deletingAccount}
                        className="border border-[#3b424e] text-gray-300 px-5 py-3 rounded-md font-bold disabled:opacity-40"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
