const DAY_COUNT = 14;

const getRecentDays = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = DAY_COUNT - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    days.push({
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      fullLabel: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    });
  }
  return days;
};

export default function DailyClicksChart({ daily = {} }) {
  const days = getRecentDays().map((day) => ({ ...day, value: daily[day.key] || 0 }));
  const max = Math.max(...days.map((day) => day.value), 1);
  const total = days.reduce((sum, day) => sum + day.value, 0);

  return (
    <section className="bg-[#0f131a] border border-[#2c333e] p-4 sm:p-5 md:p-6 rounded-md overflow-hidden">
      <div className="flex items-start justify-between gap-5 mb-6">
        <div>
          <h3 className="font-bold text-white">Acessos por dia</h3>
          <p className="text-sm text-[#8590a0] mt-1">Cliques registrados nos últimos 14 dias.</p>
        </div>
        <div className="text-right shrink-0">
          <strong className="block text-2xl text-[#91abff]">{total}</strong>
          <span className="text-xs text-[#7f8998]">no período</span>
        </div>
      </div>

      <div className="h-48 sm:h-56 flex items-end gap-1 sm:gap-2 border-b border-[#343b47]">
        {days.map((day, index) => (
          <div key={day.key} className="relative h-full flex-1 flex flex-col justify-end items-center group min-w-0">
            <span className="text-xs text-[#b9c6da] mb-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
              {day.value}
            </span>
            <button
              type="button"
              className="w-full max-w-9 bg-[#5b82ff] hover:bg-[#82a0ff] rounded-t-sm min-h-[3px]"
              style={{ height: `${Math.max((day.value / max) * 100, 2)}%` }}
              title={`${day.fullLabel}: ${day.value} ${day.value === 1 ? 'clique' : 'cliques'}`}
              aria-label={`${day.fullLabel}: ${day.value} ${day.value === 1 ? 'clique' : 'cliques'}`}
            />
            {(index % 2 === 0 || index === days.length - 1) && (
              <span className={`absolute translate-y-6 text-[9px] sm:text-[10px] text-[#778292] ${index % 4 !== 0 && index !== days.length - 1 ? 'hidden sm:inline' : ''}`}>{day.label}</span>
            )}
          </div>
        ))}
      </div>
      <div className="h-7" aria-hidden="true" />
    </section>
  );
}
