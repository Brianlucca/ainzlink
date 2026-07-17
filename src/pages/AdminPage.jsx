import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import Loading from '../components/Loading';
import Layout from '../components/Layout';
import { FiLink, FiLock, FiEdit, FiTrash2, FiBarChart2, FiShare2, FiX, FiCheck, FiCheckCircle, FiAlertTriangle, FiCalendar, FiGlobe, FiMonitor, FiShuffle } from 'react-icons/fi';
import { getApiError } from '../api/client';
import { linkService } from '../services/linkService';
import { useAuth } from '../contexts/useAuth';
import LinkQrCode from '../components/LinkQrCode';
import { currentLocalDateTimeInput, localDateTimeToIso, toLocalDateTimeInput } from '../utils/dateTime';
import DailyClicksChart from '../components/DailyClicksChart';

export default function AdminPage() {
  const { shortCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.hash.slice(1)).get('token')
    || new URLSearchParams(location.search).get('token');
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newOriginalUrl, setNewOriginalUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [secondaryEnabled, setSecondaryEnabled] = useState(false);
  const [secondaryUrl, setSecondaryUrl] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');
  const [legacyCountryRules, setLegacyCountryRules] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [qrStyle, setQrStyle] = useState({ foreground: '#111827', background: '#ffffff' });

  useEffect(() => {
    if (authLoading) return;
    if (!token && !user) {
      setError('Token de administração não fornecido.');
      setLoading(false);
      return;
    }

    const fetchInitialStats = async () => {
      try {
        const response = await linkService.getStats(shortCode, token);
        setStats(response);
        setNewOriginalUrl(response.originalUrl);
        setNewStatus(response.status);
        setNewExpiresAt(toLocalDateTimeInput(response.expiresAt));
        setNewStartsAt(toLocalDateTimeInput(response.startsAt));
        const alternative = response.destinations.find((item, index) => index > 0 || item.url !== response.originalUrl);
        setSecondaryEnabled(Boolean(alternative));
        setSecondaryUrl(alternative?.url || '');
        const iosRule = response.rules.find((rule) => rule.type === 'device' && rule.value === 'ios');
        const androidRule = response.rules.find((rule) => rule.type === 'device' && rule.value === 'android');
        const legacyMobileRule = response.rules.find((rule) => rule.type === 'device' && rule.value === 'mobile');
        const countryRules = response.rules.filter((rule) => rule.type === 'country');
        setIosUrl(iosRule?.url || legacyMobileRule?.url || '');
        setAndroidUrl(androidRule?.url || legacyMobileRule?.url || '');
        setLegacyCountryRules(countryRules);
        setQrStyle(response.qrStyle);
        linkService.getAnalytics(shortCode, token).then(setAnalytics).catch(() => {});
      } catch (err) {
        setError(getApiError(err, 'Não foi possível buscar os dados do link.'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialStats();

    return linkService.subscribeToStats(
      shortCode,
      token,
      (update) => setStats((previous) => ({ ...previous, ...update })),
      (message) => setError((current) => current || message),
    );
  }, [shortCode, token, user, authLoading]);
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setSuccessMessage('');
    setError('');
    try {
      await linkService.update(shortCode, token, {
        originalUrl: newOriginalUrl,
        password: newPassword || null,
        status: newStatus,
        expiresAt: newExpiresAt ? localDateTimeToIso(newExpiresAt) : null,
        startsAt: newStartsAt ? localDateTimeToIso(newStartsAt) : null,
        destinations: secondaryEnabled && secondaryUrl ? [
          { url: newOriginalUrl, weight: 50, label: 'Principal' },
          { url: secondaryUrl, weight: 50, label: 'Alternativo' },
        ] : [
          { url: newOriginalUrl, weight: 100, label: 'Principal' },
        ],
        rules: [
          ...(iosUrl ? [{ type: 'device', value: 'ios', url: iosUrl }] : []),
          ...(androidUrl ? [{ type: 'device', value: 'android', url: androidUrl }] : []),
          ...legacyCountryRules,
        ],
        qrStyle,
      });
      setStats((current) => ({
        ...current,
        originalUrl: newOriginalUrl,
        status: newStatus,
        startsAt: newStartsAt || null,
        expiresAt: newExpiresAt || null,
        destinations: secondaryEnabled && secondaryUrl ? [
          { url: newOriginalUrl, weight: 50, label: 'Principal' },
          { url: secondaryUrl, weight: 50, label: 'Alternativo' },
        ] : [{ url: newOriginalUrl, weight: 100, label: 'Principal' }],
        rules: [
          ...(iosUrl ? [{ type: 'device', value: 'ios', url: iosUrl }] : []),
          ...(androidUrl ? [{ type: 'device', value: 'android', url: androidUrl }] : []),
          ...legacyCountryRules,
        ],
      }));
      setSuccessMessage('Link atualizado com sucesso!');
      setIsEditing(false);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Você fez muitas requisições. Por favor, tente novamente mais tarde.');
      } else {
        setError(getApiError(err, 'Falha ao atualizar o link.'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Você tem certeza que deseja deletar este link? Esta ação é irreversível.')) {
      setIsProcessing(true);
      try {
        await linkService.delete(shortCode, token);
        setSuccessMessage('Link deletado com sucesso! Você será redirecionado.');
        setTimeout(() => navigate('/'), 2000);
      } catch (err) {
        if (err.response?.status === 429) {
          setError('Você fez muitas requisições. Por favor, tente novamente mais tarde.');
        } else {
          setError(getApiError(err, 'Falha ao deletar o link.'));
        }
        setIsProcessing(false);
      }
    }
  };

  const handleSaveQr = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await linkService.update(shortCode, token, { qrStyle });
      setStats((current) => ({ ...current, qrStyle }));
      setSuccessMessage('Cores do QR Code salvas.');
    } catch (err) {
      setError(getApiError(err, 'Não foi possível salvar o QR Code.'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return <Loading message="Buscando dados do link..." />;
    }
  
    if (error && !stats) {
      return (
        <div className="w-full max-w-lg mx-auto bg-red-900/50 border border-red-700 text-red-300 p-8 rounded-lg text-center shadow-lg">
          <h2 className="text-3xl font-bold">Acesso Negado</h2>
          <p className="text-xl mt-2">{error}</p>
        </div>
      );
    }

    if (stats) {
      return (
        <div className="app-shell py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
            <div>
              <span className="eyebrow">Gerenciamento</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Detalhes do link</h1>
              <p className="text-[#929baa] mt-2">Configuração, distribuição e desempenho em um só lugar.</p>
            </div>
            {stats && (
              <span className={`w-fit px-3 py-2 border rounded-md text-sm font-bold ${
                stats.moderationStatus === 'under_review'
                  ? 'text-amber-300 bg-amber-950/40 border-amber-900'
                  : stats.status === 'active'
                    ? 'text-emerald-300 bg-emerald-950/40 border-emerald-900'
                    : 'text-gray-300 bg-gray-800 border-gray-700'
              }`}>
                {stats.moderationStatus === 'under_review' ? 'Em análise' : stats.status === 'active' ? 'Ativo' : 'Desativado'}
              </span>
            )}
          </div>
          {successMessage && <div className="mb-4 bg-green-500/20 text-green-300 p-3 rounded-md text-center flex items-center justify-center"><FiCheckCircle className="mr-2"/>{successMessage}</div>}
          {error && <div className="mb-4 bg-red-500/20 text-red-300 p-3 rounded-md text-center flex items-center justify-center"><FiAlertTriangle className="mr-2"/>{error}</div>}
          {stats?.reportCount > 0 && (
            <div className="mb-4 border border-amber-900 bg-amber-950/30 text-amber-100 p-4 rounded-md flex items-start gap-3">
              <FiAlertTriangle className="mt-1 shrink-0" />
              <p>
                Este link recebeu <strong>{stats.reportCount} {stats.reportCount === 1 ? 'denúncia' : 'denúncias'}</strong>.
                {stats.moderationStatus === 'under_review'
                  ? ' Ele está em verificação e poderá ser excluído caso viole as regras da plataforma.'
                  : ' A atividade está sendo monitorada e poderá passar por verificação.'}
              </p>
            </div>
          )}
          {user && token && !claimed && (
            <button
              onClick={async () => {
                try {
                  await linkService.claim(shortCode, token);
                  setClaimed(true);
                  setSuccessMessage('Link adicionado ao seu dashboard.');
                } catch (err) {
                  setError(getApiError(err));
                }
              }}
              className="w-full mb-4 border border-purple-500 text-purple-300 p-3 rounded-md"
            >
              Adicionar este link ao meu dashboard
            </button>
          )}
          
          {!isEditing ? (
            <div className="bg-[#141821] p-4 sm:p-6 md:p-8 rounded-md border border-[#282f3a] overflow-hidden">
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-gray-400 flex items-center"><FiShare2 className="mr-2"/>LINK CURTO</h2>
                  <Link to={new URL(stats.shortUrl).pathname} target="_blank" rel="noopener noreferrer" className="text-cyan-400 break-all text-xl hover:underline">
                    {stats.shortUrl}
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-center border-y border-gray-700 py-6 overflow-hidden">
                  <LinkQrCode shortUrl={stats.shortUrl} style={qrStyle} editable onStyleChange={setQrStyle} />
                  <div>
                    <h2 className="font-bold text-gray-100">QR Code do link</h2>
                    <p className="text-sm text-gray-400 mt-2">
                      Personalize as cores e use os botões para baixar ou compartilhar uma imagem pronta junto com o link.
                    </p>
                    <button onClick={handleSaveQr} disabled={isProcessing} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2 rounded-md disabled:opacity-50">
                      Salvar cores
                    </button>
                  </div>
                </div>
                {analytics && (
                  <>
                    <DailyClicksChart daily={analytics.daily} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      ['Celulares por plataforma', analytics.platforms || { ios: 0, android: 0 }, { ios: 'Apple (iPhone/iPad)', android: 'Android' }],
                      ['Tipos de dispositivo', analytics.devices, { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computador', bot: 'Robô' }],
                    ].map(([title, values, labels]) => (
                      <div key={title} className="bg-[#0f131a] border border-[#2c333e] p-5 rounded-md">
                        <h3 className="font-bold text-white mb-3">{title}</h3>
                        {Object.entries(values).slice(0, 5).map(([label, value]) => {
                          const maxValue = Math.max(...Object.values(values), 1);
                          return (
                          <div key={label} className="text-sm py-2">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-gray-200 truncate">{labels[label] || label}</span>
                              <strong className="text-white">{value}</strong>
                            </div>
                            <div className="h-1.5 bg-[#272d37] rounded-full overflow-hidden">
                              <div className="h-full bg-[#5b82ff] rounded-full" style={{ width: `${(value / maxValue) * 100}%` }} />
                            </div>
                          </div>
                        )})}
                      </div>
                    ))}
                    </div>
                  </>
                )}
                <div>
                  <h2 className="text-sm font-bold text-gray-400 flex items-center"><FiLink className="mr-2"/>DESTINO ATUAL</h2>
                  <p className="text-gray-300 break-all text-lg">{stats.originalUrl}</p>
                </div>
                {(stats.destinations.length > 1 || stats.rules.length > 0) && (
                  <div className="border border-gray-700 rounded-md overflow-hidden">
                    <div className="px-4 py-3 bg-gray-900/70 border-b border-gray-700">
                      <h2 className="font-bold text-gray-200">Como os acessos são direcionados</h2>
                    </div>
                    <div className="divide-y divide-gray-700">
                      {stats.destinations.map((item) => (
                        <div key={`${item.label}-${item.url}`} className="p-4 flex items-start gap-3">
                          <FiShuffle className="mt-1 text-cyan-400 shrink-0" />
                          <div className="min-w-0">
                            <strong className="text-gray-300">{item.label || 'Destino'} · {item.weight}%</strong>
                            <p className="text-sm text-gray-500 break-all mt-1">{item.url}</p>
                          </div>
                        </div>
                      ))}
                      {stats.rules.map((rule) => (
                        <div key={`${rule.type}-${rule.value}`} className="p-4 flex items-start gap-3">
                          {rule.type === 'device' ? <FiMonitor className="mt-1 text-cyan-400 shrink-0" /> : <FiGlobe className="mt-1 text-cyan-400 shrink-0" />}
                          <div className="min-w-0">
                            <strong className="text-gray-300">
                              {rule.type === 'device'
                                ? ({
                                  ios: 'Dispositivos Apple (iPhone/iPad)',
                                  android: 'Dispositivos Android',
                                  mobile: 'Acessos por celular',
                                }[rule.value] || `Dispositivo: ${rule.value}`)
                                : `Acessos do país ${rule.value.toUpperCase()}`}
                            </strong>
                            <p className="text-sm text-gray-500 break-all mt-1">{rule.url}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center bg-[#0f131a] p-5 rounded-md border border-[#2c333e]">
                  <h2 className="text-lg font-bold text-gray-300 flex items-center"><FiBarChart2 className="mr-3"/>CLIQUES TOTAIS</h2>
                  <p className="text-4xl font-black text-[#91abff]">{stats.clicks}</p>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-400 flex items-center"><FiLock className="mr-2"/>STATUS DA SENHA</h2>
                  <p className="text-gray-300 text-lg">{stats.passwordProtected ? 'Protegido por Senha' : 'Público'}</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col md:flex-row gap-4">
                <button onClick={() => setIsEditing(true)} className="w-full bg-blue-600 hover:bg-blue-700 font-bold p-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <FiEdit /> Editar Link
                </button>
                <button onClick={handleDelete} disabled={isProcessing} className="w-full bg-red-600 hover:bg-red-700 font-bold p-3 rounded-lg transition-colors disabled:bg-red-900 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <FiTrash2 /> {isProcessing ? 'Deletando...' : 'Deletar Link'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="bg-[#141821] p-4 sm:p-6 md:p-8 rounded-md border border-[#282f3a] max-w-3xl mx-auto overflow-hidden">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">Editando Link</h2>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block mb-2 text-sm font-bold text-white">Link Curto (Não Editável)</label>
                  <FiShare2 className="absolute top-11 left-4 text-gray-500" />
                  <input
                    type="text"
                    className="w-full p-3 pl-10 bg-gray-900 text-gray-500 rounded-md border border-gray-700 cursor-not-allowed"
                    value={stats.shortUrl}
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-sm font-bold text-white">
                    Status
                    <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} className="w-full mt-2 p-3 bg-gray-900 border border-gray-600 rounded-md">
                      <option value="active">Ativo</option>
                      <option value="disabled">Desativado</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold text-white">
                    Expira em
                    <input type="datetime-local" min={newStartsAt || currentLocalDateTimeInput()} value={newExpiresAt} onChange={(event) => setNewExpiresAt(event.target.value)} className="w-full mt-2 p-3 bg-gray-900 border border-gray-600 rounded-md" />
                  </label>
                </div>
                <label className="block text-sm font-bold text-white">
                  <span className="flex items-center gap-2"><FiCalendar /> Começa em</span>
                  <input type="datetime-local" min={currentLocalDateTimeInput()} value={newStartsAt} onChange={(event) => setNewStartsAt(event.target.value)} className="w-full mt-2 p-3 bg-gray-900 border border-gray-600 rounded-md" />
                </label>
                <p className="p-3 border border-cyan-900 bg-cyan-950/30 rounded-md text-sm text-cyan-100">
                  A confirmação do domínio é obrigatória em todos os acessos e não pode ser desativada.
                </p>
                <div className="relative">
                  <label htmlFor="newOriginalUrl" className="block mb-2 text-sm font-bold text-white">Novo Destino Original</label>
                  <FiLink className="absolute top-11 left-4 text-gray-400" />
                  <input
                    id="newOriginalUrl"
                    type="url"
                    className="w-full p-3 pl-10 text-white bg-gray-900 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newOriginalUrl}
                    onChange={(e) => setNewOriginalUrl(e.target.value)}
                    required
                  />
                </div>
                <section className="border border-gray-700 rounded-md p-4 space-y-4">
                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <strong className="block text-white">Teste A/B</strong>
                      <span className="text-sm text-gray-500">Divide os acessos igualmente entre dois destinos.</span>
                    </span>
                    <input type="checkbox" checked={secondaryEnabled} onChange={(event) => setSecondaryEnabled(event.target.checked)} />
                  </label>
                  {secondaryEnabled && (
                    <label className="block text-sm font-bold text-white">
                      Segundo destino
                      <input type="url" required value={secondaryUrl} onChange={(event) => setSecondaryUrl(event.target.value)} placeholder="https://exemplo.com/versao-b" className="w-full mt-2 p-3 bg-gray-900 border border-gray-600 rounded-md" />
                    </label>
                  )}
                </section>
                <section className="border border-gray-700 rounded-md p-4 space-y-4">
                  <div>
                    <strong className="block text-white">Destinos inteligentes</strong>
                    <span className="text-sm text-gray-500">Regras específicas têm prioridade sobre o teste A/B.</span>
                  </div>
                  <label className="block text-sm font-bold text-white">
                    Destino para Apple (iPhone/iPad)
                    <input type="url" value={iosUrl} onChange={(event) => setIosUrl(event.target.value)} placeholder="https://apps.apple.com/..." className="w-full mt-2 p-3 bg-gray-900 border border-gray-600 rounded-md" />
                  </label>
                  <label className="block text-sm font-bold text-white">
                    Destino para Android
                    <input type="url" value={androidUrl} onChange={(event) => setAndroidUrl(event.target.value)} placeholder="https://play.google.com/..." className="w-full mt-2 p-3 bg-gray-900 border border-gray-600 rounded-md" />
                  </label>
                </section>
                <div className="relative">
                  <label htmlFor="newPassword" className="block mb-2 text-sm font-bold text-white">Nova Senha</label>
                  <FiLock className="absolute top-11 left-4 text-gray-400" />
                  <input
                    id="newPassword"
                    type="text"
                    className="w-full p-3 pl-10 text-white bg-gray-900 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Deixe em branco para remover a senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button type="button" onClick={() => setIsEditing(false)} className="w-full bg-gray-600 hover:bg-gray-700 font-bold p-3 rounded-lg flex items-center justify-center gap-2">
                  <FiX /> Cancelar
                </button>
                <button type="submit" disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-700 font-bold p-3 rounded-lg disabled:bg-purple-900 flex items-center justify-center gap-2">
                  <FiCheck /> {isProcessing ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}
