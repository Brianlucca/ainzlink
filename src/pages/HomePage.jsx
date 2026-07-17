import { useEffect, useState } from 'react';
import { FiCheckCircle, FiEye, FiGitBranch, FiShield } from 'react-icons/fi';
import FormLink from '../components/FormLink';
import Result from '../components/Result';
import Loading from '../components/Loading';
import Layout from '../components/Layout';
import FaqSection from '../components/FaqSection';
import { getApiError } from '../api/client';
import { linkService } from '../services/linkService';

const features = [
  { icon: <FiEye />, title: 'Destino transparente', text: 'O domínio final aparece antes do redirecionamento, com tempo para cancelar ou denunciar.' },
  { icon: <FiGitBranch />, title: 'Rotas inteligentes', text: 'Distribua acessos entre páginas e crie destinos específicos por dispositivo ou país.' },
  { icon: <FiShield />, title: 'Privacidade por padrão', text: 'Estatísticas úteis sem mostrar nem armazenar o IP na área de gerenciamento.' },
];

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Preparando o criador...');
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState({ shortUrl: '', adminUrl: '' });

  useEffect(() => {
    linkService.healthCheck()
      .catch((err) => setError(getApiError(err, 'O servidor não respondeu. Recarregue a página.')))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Layout>
      <section className="app-shell home-grid">
        <div className="home-intro">
          <span className="eyebrow">Links inteligentes e transparentes</span>
          <h1 className="home-title">Um link curto que mostra para onde vai.</h1>
          <p className="home-copy">Crie, distribua e acompanhe links com QR Code, rotas inteligentes e confirmação de destino antes de cada acesso.</p>
          <div className="trust-row mt-7">
            <span className="trust-item"><FiCheckCircle /> Sem IP no painel</span>
            <span className="trust-item"><FiCheckCircle /> Proteção Cloudflare</span>
            <span className="trust-item"><FiCheckCircle /> QR Code persistente</span>
          </div>
        </div>

        <div className="min-w-0">
          {isLoading ? <Loading message={loadingMessage} /> : (
            resultado.shortUrl ? (
              <Result
                shortUrl={resultado.shortUrl}
                adminUrl={resultado.adminUrl}
                error={error}
                onCreateAnother={() => {
                  setResultado({ shortUrl: '', adminUrl: '' });
                  setError('');
                }}
              />
            ) : (
              <FormLink setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} setResultado={setResultado} setError={setError} />
            )
          )}
          {!resultado.shortUrl && error && <div className="mt-4"><Result error={error} /></div>}
        </div>
      </section>

      <section className="feature-strip">
        <div className="app-shell feature-grid">
          {features.map((feature) => (
            <article className="feature-item" key={feature.title}>
              <span className="feature-icon">{feature.icon}</span>
              <h2 className="text-lg font-bold text-white">{feature.title}</h2>
              <p className="muted text-sm leading-6 mt-2">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
      <FaqSection />
    </Layout>
  );
}
