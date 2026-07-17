import { useCallback, useState } from 'react';
import {
  FiArrowRight,
  FiCalendar,
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiLink,
  FiLock,
  FiMonitor,
  FiShuffle,
  FiTag,
} from 'react-icons/fi';
import { getApiError } from '../api/client';
import { linkService } from '../services/linkService';
import { countries } from '../constants/countries';
import TurnstileWidget from './TurnstileWidget';
import { currentLocalDateTimeInput, localDateTimeToIso } from '../utils/dateTime';

const OptionToggle = ({ icon, title, description, enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`w-full flex items-center gap-3 p-3 sm:p-4 border rounded-md text-left transition-colors ${
      enabled ? 'border-[#4f72d8] bg-[#182441]' : 'border-[#2b323e] bg-[#10141b] hover:border-[#46505f]'
    }`}
  >
    <span className={`text-xl shrink-0 ${enabled ? 'text-[#91abff]' : 'text-gray-500'}`}>{icon}</span>
    <span className="flex-1 min-w-0">
      <strong className="block text-gray-100">{title}</strong>
      <span className="block text-sm text-gray-500 mt-1">{description}</span>
    </span>
    <span className={`w-10 h-6 shrink-0 rounded-full p-1 transition-colors ${enabled ? 'bg-[#4d78ff]' : 'bg-gray-700'}`}>
      <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-4' : ''}`} />
    </span>
  </button>
);

export default function FormLink({ setIsLoading, setLoadingMessage, setResultado, setError }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [secondaryUrl, setSecondaryUrl] = useState('');
  const [mobileUrl, setMobileUrl] = useState('');
  const [country, setCountry] = useState('');
  const [countryUrl, setCountryUrl] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [routingEnabled, setRoutingEnabled] = useState(false);
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const handleTurnstileError = useCallback(() => {
    setError('Não foi possível carregar a verificação de segurança.');
  }, [setError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setLoadingMessage('Criando seu link...');
    setError('');
    setResultado({ shortUrl: '', adminUrl: '' });

    try {
      const response = await linkService.create({
        originalUrl,
        customCode: customCode || undefined,
        password: protectionEnabled && password ? password : undefined,
        expiresAt: scheduleEnabled && expiresAt ? localDateTimeToIso(expiresAt) : undefined,
        startsAt: scheduleEnabled && startsAt ? localDateTimeToIso(startsAt) : undefined,
        destinations: splitEnabled && secondaryUrl ? [
          { url: originalUrl, weight: 50, label: 'Principal' },
          { url: secondaryUrl, weight: 50, label: 'Alternativo' },
        ] : undefined,
        rules: routingEnabled ? [
          ...(mobileUrl ? [{ type: 'device', value: 'mobile', url: mobileUrl }] : []),
          ...(country && countryUrl ? [{ type: 'country', value: country, url: countryUrl }] : []),
        ] : [],
        turnstileToken,
      });
      setResultado(response);
    } catch (err) {
      setError(err.response?.status === 429
        ? 'Muitas tentativas. Aguarde um pouco e tente novamente.'
        : getApiError(err, 'Não foi possível criar o link.'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setTurnstileToken('');
      setTurnstileResetKey((current) => current + 1);
    }
  };

  const nowInput = currentLocalDateTimeInput();
  const inputClass = 'w-full h-[52px] px-4 bg-[#0e1219] text-[#edf1f7] rounded-md border border-[#303744] placeholder:text-[#697383] focus:outline-none focus:border-[#6488ff] focus:ring-2 focus:ring-[#426ef0]/20';

  return (
    <form onSubmit={handleSubmit} className="surface overflow-hidden">
      <div className="px-4 pt-5 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
        <span className="eyebrow">Novo link</span>
        <h2 className="text-2xl font-extrabold text-white mt-2">Configure seu endereço</h2>
        <p className="text-sm text-[#929baa] mt-1 mb-7">Comece pelo destino. Os outros controles são opcionais.</p>
      </div>
      <div className="px-4 pb-5 sm:px-6 sm:pb-6 md:px-8 md:pb-8 space-y-5">
        <div>
          <label htmlFor="originalUrl" className="block mb-2 text-sm font-bold text-gray-200">Link de destino</label>
          <div className="relative">
            <FiLink className="absolute top-3.5 left-4 text-gray-500" />
            <input id="originalUrl" type="url" className={`${inputClass} pl-11`} placeholder="https://exemplo.com/pagina" value={originalUrl} onChange={(event) => setOriginalUrl(event.target.value)} required />
          </div>
        </div>

        <div>
          <label htmlFor="customCode" className="block mb-2 text-sm font-bold text-gray-200">Final personalizado <span className="font-normal text-gray-500">(opcional)</span></label>
          <div className="relative">
            <FiTag className="absolute top-3.5 left-4 text-gray-500" />
            <input id="customCode" className={`${inputClass} pl-11`} placeholder="meu-evento" value={customCode} onChange={(event) => setCustomCode(event.target.value)} />
          </div>
        </div>

        <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)} className="w-full flex items-center justify-between py-4 border-t border-[#2b323e] text-[#cbd2dc] font-bold hover:text-white">
          Personalizar comportamento
          <FiChevronDown className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>

        {advancedOpen && (
          <div className="space-y-3">
            <OptionToggle icon={<FiCalendar />} title="Definir período" description="Escolha quando o link começa e quando deixa de funcionar." enabled={scheduleEnabled} onChange={setScheduleEnabled} />
            {scheduleEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-900 border border-gray-700 rounded-md">
                <label className="text-sm text-gray-300">Começa em<input type="datetime-local" min={nowInput} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={`${inputClass} mt-2`} /></label>
                <label className="text-sm text-gray-300">Expira em<input type="datetime-local" min={startsAt || nowInput} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className={`${inputClass} mt-2`} /></label>
              </div>
            )}

            <OptionToggle icon={<FiShuffle />} title="Dividir acessos" description="Metade dos visitantes vai para cada destino." enabled={splitEnabled} onChange={setSplitEnabled} />
            {splitEnabled && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-md">
                <label className="text-sm text-gray-300">Segundo destino<input type="url" required={splitEnabled} value={secondaryUrl} onChange={(event) => setSecondaryUrl(event.target.value)} placeholder="https://exemplo.com/versao-b" className={`${inputClass} mt-2`} /></label>
              </div>
            )}

            <OptionToggle icon={<FiMonitor />} title="Destino inteligente" description="Envie celulares ou visitantes de um país para outra página." enabled={routingEnabled} onChange={setRoutingEnabled} />
            {routingEnabled && (
              <div className="space-y-3 p-4 bg-gray-900 border border-gray-700 rounded-md">
                <label className="text-sm text-gray-300">Destino para celular<input type="url" value={mobileUrl} onChange={(event) => setMobileUrl(event.target.value)} placeholder="https://exemplo.com/mobile" className={`${inputClass} mt-2`} /></label>
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                  <label className="text-sm text-gray-300">
                    País
                    <select value={country} onChange={(event) => setCountry(event.target.value)} className={`${inputClass} mt-2`}>
                      <option value="">Selecione</option>
                      {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-gray-300">Destino nesse país<input type="url" value={countryUrl} onChange={(event) => setCountryUrl(event.target.value)} placeholder="https://exemplo.com/brasil" className={`${inputClass} mt-2`} /></label>
                </div>
              </div>
            )}

            <OptionToggle icon={<FiGlobe />} title="Proteger com senha" description="Exija uma senha antes de liberar o destino." enabled={protectionEnabled} onChange={setProtectionEnabled} />
            {protectionEnabled && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-md">
                <div>
                  <label htmlFor="password" className="block mb-2 text-sm text-gray-300">Senha de acesso <span className="text-gray-500">(opcional)</span></label>
                  <div className="relative">
                    <FiLock className="absolute top-3.5 left-4 text-gray-500" />
                    <input id="password" type={isPasswordVisible ? 'text' : 'password'} className={`${inputClass} pl-11 pr-11`} placeholder="Digite uma senha" value={password} onChange={(event) => setPassword(event.target.value)} />
                    <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute top-3 right-4 text-gray-500" title="Mostrar ou esconder senha">
                      {isPasswordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 border border-cyan-900 bg-cyan-950/30 rounded-md text-sm text-cyan-100">
              Antes de abrir qualquer link, o visitante sempre verá o domínio de destino e poderá cancelar ou denunciar.
            </div>
          </div>
        )}
      </div>

      <div className="p-5 md:px-8 md:py-6 bg-[#0e1219] border-t border-[#2b323e]">
        <div className="flex justify-center mb-4">
          <TurnstileWidget action="create_link" resetKey={turnstileResetKey} onToken={setTurnstileToken} onError={handleTurnstileError} />
        </div>
        <button type="submit" disabled={!turnstileToken} className="w-full bg-[#4d78ff] hover:bg-[#668bff] text-white font-extrabold p-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          Criar link <FiArrowRight />
        </button>
      </div>
    </form>
  );
}
