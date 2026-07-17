import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FiArrowUpRight, FiGrid, FiLogIn, FiLogOut } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/useAuth';

export default function Layout({ children }) {
  const currentYear = new Date().getFullYear();
  const { user, login, logout, configured } = useAuth();
  const [authError, setAuthError] = useState('');

  const handleLogin = async () => {
    try {
      setAuthError('');
      await login();
    } catch (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#202631] bg-[#090b10]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="app-shell h-[74px] flex items-center justify-between gap-5">
          <Link to="/" className="flex items-center gap-3 group" aria-label="AinzLink - inicio">
            <img
              src="/logo.png"
              alt=""
              className="w-12 h-10 object-contain rounded-md"
              aria-hidden="true"
            />
            <span className="text-xl font-extrabold text-white group-hover:text-[#a9bbff]">AinzLink</span>
          </Link>

          <nav className="flex items-center gap-2">
            <a href="/#duvidas" className="hidden sm:block px-3 py-2 text-sm text-[#aab3c1] hover:text-white">
              Dúvidas
            </a>
            {user ? (
              <>
                <Link to="/dashboard" className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#cbd2dc] hover:text-white">
                  <FiGrid /> Dashboard
                </Link>
                <button onClick={logout} title="Sair" className="grid place-items-center w-10 h-10 border border-[#303744] rounded-md text-[#aab3c1] hover:text-white hover:border-[#505a6b]">
                  <FiLogOut />
                </button>
              </>
            ) : (
              <button onClick={handleLogin} disabled={!configured} className="inline-flex items-center gap-2 bg-white text-[#0b0e13] font-bold px-4 py-2.5 rounded-md hover:bg-[#dfe5ee] disabled:opacity-50">
                <FcGoogle size={19} /> Entrar com Google
              </button>
            )}
          </nav>
        </div>
      </header>

      {authError && (
        <div className="app-shell pt-4">
          <p className="border border-red-900 bg-red-950/40 text-red-300 px-4 py-3 rounded-md">{authError}</p>
        </div>
      )}

      <main className="w-full flex-grow">{children}</main>

      <footer className="border-t border-[#202631] bg-[#0b0e13]">
        <div className="app-shell py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-10 md:gap-16">
            <div>
              <Link to="/" className="flex items-center gap-3 w-fit">
                <img
                  src="/logo.png"
                  alt=""
                  className="w-16 h-12 object-contain rounded-md"
                  aria-hidden="true"
                />
                <strong className="text-xl text-white">AinzLink</strong>
              </Link>
              <p className="mt-4 max-w-sm text-[#8e98a7] leading-6">
                Links transparentes, inteligentes e sob seu controle. O destino sempre aparece antes do redirecionamento.
              </p>
              <span className="inline-flex items-center gap-2 mt-5 text-sm text-[#65d4ad]">
                <span className="w-2 h-2 rounded-full bg-[#4fd1a5]" /> Serviço operacional
              </span>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#dce2eb] mb-4">Produto</h2>
              <nav className="flex flex-col items-start gap-3 text-sm text-[#8e98a7]">
                <Link to="/" className="hover:text-white">Criar link</Link>
                {user && <Link to="/dashboard" className="hover:text-white">Dashboard</Link>}
                <a href="/#duvidas" className="hover:text-white">Central de dúvidas</a>
              </nav>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#dce2eb] mb-4">Privacidade</h2>
              <p className="text-sm text-[#8e98a7] leading-6">
                Estatísticas agregadas sem exibir IP no painel. Acessos protegidos por Cloudflare Turnstile.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[#202631] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-[#727d8c]">
            <span>© {currentYear} AinzLink. Todos os direitos reservados.</span>
            <a href="https://brianlucca.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
              Desenvolvido por Brian Lucca <FiArrowUpRight />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
