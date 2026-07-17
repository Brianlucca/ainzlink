import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiExternalLink,
  FiLink,
  FiPlus,
  FiSearch,
} from 'react-icons/fi';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { getApiError } from '../api/client';
import { useAuth } from '../contexts/useAuth';
import { linkService } from '../services/linkService';
import LinkQrCode from '../components/LinkQrCode';

const getLinkState = (link) => {
  if (link.moderationStatus === 'under_review') return { label: 'Em análise', className: 'text-amber-300 bg-amber-950/40 border-amber-900' };
  if (link.status === 'active') return { label: 'Ativo', className: 'text-emerald-300 bg-emerald-950/40 border-emerald-900' };
  return { label: 'Desativado', className: 'text-gray-300 bg-gray-800 border-gray-700' };
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
    linkService.list()
      .then((response) => setLinks(Array.isArray(response) ? response : []))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [user]);

  const safeLinks = useMemo(() => (Array.isArray(links) ? links : []), [links]);

  const filtered = useMemo(() => safeLinks.filter((link) => {
    const matchesQuery = `${link.shortCode} ${link.originalUrl}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'all'
      || (status === 'under_review' ? link.moderationStatus === 'under_review' : link.status === status);
    return matchesQuery && matchesStatus;
  }), [safeLinks, query, status]);

  const totalClicks = safeLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const activeLinks = safeLinks.filter((link) => link.status === 'active' && link.moderationStatus !== 'under_review').length;
  const reviewLinks = safeLinks.filter((link) => link.moderationStatus === 'under_review').length;
  const chartLinks = [...safeLinks].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 6);
  const chartMax = Math.max(...chartLinks.map((link) => link.clicks), 1);

  if (authLoading) return <Layout><Loading message="Carregando sessão..." /></Layout>;
  if (!user) return <Navigate to="/" replace />;

  return (
    <Layout>
      <section className="app-shell py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <span className="eyebrow">Visão geral</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Meus links</h1>
            <p className="text-[#929baa] mt-2">Acompanhe desempenho, disponibilidade e moderação.</p>
          </div>
          <Link to="/" className="inline-flex items-center justify-center gap-2 bg-[#4d78ff] hover:bg-[#668bff] px-5 py-3 rounded-md font-bold">
            <FiPlus /> Criar link
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            ['Links ativos', activeLinks, <FiCheckCircle key="active" />],
            ['Cliques totais', totalClicks, <FiBarChart2 key="clicks" />],
            ['Em análise', reviewLinks, <FiAlertTriangle key="review" />],
          ].map(([label, value, icon]) => (
            <article key={label} className="surface p-5 shadow-none">
              <div className="text-[#8290a3] flex items-center gap-2 text-sm">{icon}{label}</div>
              <strong className="block text-3xl text-white mt-3">{value}</strong>
            </article>
          ))}
        </div>

        {chartLinks.length > 0 && (
          <section className="surface p-5 md:p-6 mb-6 shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Desempenho por link</h2>
                <p className="text-sm text-[#8590a0] mt-1">Seus seis links com mais acessos.</p>
              </div>
              <FiBarChart2 className="text-[#89a5ff]" />
            </div>
            <div className="space-y-4">
              {chartLinks.map((link) => (
                <div key={link.shortCode} className="grid grid-cols-[100px_1fr_42px] sm:grid-cols-[160px_1fr_52px] items-center gap-3 text-sm">
                  <span className="truncate text-[#b9c1cc]">/{link.shortCode}</span>
                  <div className="h-2 rounded-full bg-[#252b35] overflow-hidden">
                    <div className="h-full bg-[#5b82ff] rounded-full" style={{ width: `${Math.max((link.clicks / chartMax) * 100, 2)}%` }} />
                  </div>
                  <strong className="text-right">{link.clicks}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <label className="relative flex-1">
            <FiSearch className="absolute left-3 top-3.5 text-gray-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por alias ou destino" className="w-full bg-[#10141b] border border-[#303744] rounded-md p-3 pl-10 outline-none focus:border-[#6488ff]" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-[#10141b] border border-[#303744] rounded-md p-3">
            <option value="all">Todos os estados</option>
            <option value="active">Ativos</option>
            <option value="disabled">Desativados</option>
            <option value="under_review">Em análise</option>
          </select>
        </div>

        {loading && <Loading message="Buscando links..." />}
        {error && <p className="border border-red-900 bg-red-950/30 text-red-300 p-4 rounded-md">{error}</p>}
        {!loading && !filtered.length && <div className="border border-dashed border-[#303744] p-10 text-center text-[#8791a0] rounded-md">Nenhum link encontrado.</div>}

        <div className="grid gap-3">
          {filtered.map((link) => {
            const state = getLinkState(link);
            return (
              <article key={link.shortCode} className="bg-[#141821] border border-[#282f3a] hover:border-[#3b4656] rounded-md p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-5 overflow-hidden">
                <LinkQrCode shortUrl={link.shortUrl} style={link.qrStyle} compact />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-1 border rounded text-xs font-bold ${state.className}`}>{state.label}</span>
                    <strong className="text-[#91abff] break-all">{link.shortUrl}</strong>
                  </div>
                  <p className="text-[#929baa] break-all sm:truncate">{link.originalUrl}</p>
                  {link.reportCount > 0 && (
                    <p className="text-sm text-amber-200 mt-3 flex items-start gap-2">
                      <FiAlertTriangle className="mt-0.5 shrink-0" />
                      {link.reportCount} {link.reportCount === 1 ? 'denúncia recebida' : 'denúncias recebidas'}.
                      {link.moderationStatus === 'under_review' ? ' O link está em verificação e poderá ser excluído.' : ' A atividade será monitorada.'}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-[#c6cdd7] flex items-center gap-2"><FiBarChart2 /> {link.clicks}</span>
                  <a href={link.shortUrl} target="_blank" rel="noreferrer" title="Abrir link" className="p-2 hover:text-[#91abff]"><FiExternalLink /></a>
                  <Link to={`/admin/${link.shortCode}`} className="inline-flex items-center gap-2 bg-[#252c38] hover:bg-[#333d4c] px-3 py-2 rounded-md"><FiLink /> Gerenciar</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}
