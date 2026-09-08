import { useEffect, useState } from 'react';

export default function Loading({ message }) {
  const [isTakingLonger, setIsTakingLonger] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsTakingLonger(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="surface w-full overflow-hidden"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-pulse p-5 sm:p-7 md:p-8" aria-hidden="true">
        <div className="flex items-center gap-4 mb-7">
          <div className="h-11 w-11 shrink-0 rounded-lg bg-[#28303d]" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 rounded-full bg-[#364052]" />
            <div className="h-6 w-2/3 max-w-xs rounded-md bg-[#28303d]" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-4 w-32 rounded-full bg-[#28303d]" />
          <div className="h-12 w-full rounded-md bg-[#202733]" />
          <div className="h-4 w-24 rounded-full bg-[#28303d]" />
          <div className="h-12 w-full rounded-md bg-[#202733]" />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-7">
          <div className="h-16 rounded-md bg-[#202733]" />
          <div className="h-16 rounded-md bg-[#202733]" />
          <div className="h-16 rounded-md bg-[#202733]" />
        </div>
      </div>

      <div className="border-t border-[#2b323e] bg-[#0e1219] px-5 py-4 text-center">
        <p className="text-sm font-medium text-gray-300">{message}</p>
        {isTakingLonger && (
          <p className="text-sm text-gray-400 mt-2">
            O servidor está iniciando. Isso pode levar alguns instantes; mantenha esta página aberta.
          </p>
        )}
      </div>
      <span className="sr-only">Conteúdo sendo carregado.</span>
    </div>
  );
}
