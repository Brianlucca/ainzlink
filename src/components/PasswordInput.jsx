import { useState } from 'react';
import Loading from './Loading';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { getApiError } from '../api/client';
import { linkService } from '../services/linkService';

export default function PasswordInput({ shortCode, destinationToken, onSuccess }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await linkService.verifyPassword(shortCode, password, destinationToken);
      if (response.originalUrl) {
        onSuccess(response.originalUrl);
      }
    } catch (err) {
      setError(getApiError(err, 'Erro ao verificar a senha.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading message="Verificando senha..." />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Link Protegido</h2>
          <p className="text-gray-400 mt-2">Este link requer uma senha para continuar.</p>
        </div>
        
        <div className="relative mb-4">
          <label htmlFor="password" className="block mb-2 text-sm font-bold text-gray-300">Senha</label>
          <FiLock className="absolute top-11 left-4 text-gray-400" />
          <input
            id="password"
            type={isPasswordVisible ? 'text' : 'password'}
            className="w-full p-3 pl-10 pr-10 text-gray-300 bg-gray-900 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute top-11 right-4 text-gray-400 hover:text-white"
            aria-label="Mostrar ou esconder a senha"
          >
            {isPasswordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        
        <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105">
          Desbloquear
        </button>
      </form>
    </div>
  );
}
