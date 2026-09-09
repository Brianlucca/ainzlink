import { useMemo } from 'react';
import brazilMap from '@svg-maps/brazil';
import worldMap from '@svg-maps/world';
import { FiGlobe, FiMap } from 'react-icons/fi';
import { countries } from '../constants/countries';

const countryNames = new Map(countries.map(({ code, name }) => [code, name]));

const colorFor = (value, maximum) => {
  if (!value) return '#171c25';
  const intensity = value / Math.max(maximum, 1);
  if (intensity >= 0.75) return '#4d78ff';
  if (intensity >= 0.45) return '#3f63d1';
  if (intensity >= 0.2) return '#314d9f';
  return '#263b73';
};

function MapPanel({ icon, title, description, map, values, labels, emptyMessage }) {
  const maximum = Math.max(...Object.values(values), 1);
  const ranking = Object.entries(values)
    .filter(([, value]) => value > 0)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5);

  return (
    <article className="bg-[#0f131a] border border-[#2c333e] rounded-md p-4 sm:p-5 min-w-0">
      <div className="flex items-start gap-3">
        <span className="grid place-items-center w-9 h-9 shrink-0 rounded-md bg-[#1b2a51] text-[#8ba6ff]">{icon}</span>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-xs sm:text-sm text-[#8994a5] mt-1">{description}</p>
        </div>
      </div>

      <div className="relative mt-5 min-h-52 grid place-items-center overflow-hidden rounded-md bg-[#0b0e13] border border-[#252c36] p-3">
        <svg
          viewBox={map.viewBox}
          role="img"
          aria-label={title}
          className="w-full max-h-64"
        >
          {map.locations.map((location) => {
            const code = location.id.toUpperCase();
            const value = values[code] || 0;
            const label = labels[code] || location.name;
            return (
              <path
                key={location.id}
                d={location.path}
                fill={colorFor(value, maximum)}
                stroke="#394250"
                strokeWidth="0.45"
                className="transition-colors hover:fill-[#7897ff] outline-none"
              >
                <title>{`${label}: ${value} ${value === 1 ? 'acesso' : 'acessos'}`}</title>
              </path>
            );
          })}
        </svg>
        {!ranking.length && (
          <p className="absolute inset-x-4 bottom-3 text-center text-xs text-[#7f8998] bg-[#0b0e13]/90 py-2">
            {emptyMessage}
          </p>
        )}
      </div>

      {ranking.length > 0 && (
        <div className="mt-4 space-y-2" aria-label={`Ranking: ${title}`}>
          {ranking.map(([code, value]) => (
            <div key={code} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[#b7c0cc] truncate">{labels[code] || code}</span>
              <strong className="text-white">{value}</strong>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function GeographicAccessMap({ analytics }) {
  const countryValues = analytics?.countries || {};
  const { brazilValues, brazilLabels } = useMemo(() => {
    const values = {};
    const labels = {};
    (analytics?.regions || [])
      .filter((region) => region.country === 'BR')
      .forEach((region) => {
        const code = String(region.code || '').toUpperCase();
        if (!code) return;
        values[code] = (values[code] || 0) + region.value;
        labels[code] = region.name || code;
      });
    return { brazilValues: values, brazilLabels: labels };
  }, [analytics?.regions]);

  const worldLabels = useMemo(() => Object.fromEntries(
    worldMap.locations.map((location) => {
      const code = location.id.toUpperCase();
      return [code, countryNames.get(code) || location.name];
    }),
  ), []);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Origem aproximada dos acessos</h2>
        <p className="text-sm text-[#8590a0] mt-1">
          Dados agregados por país e estado, sem armazenar IP, cidade ou localização exata.
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <MapPanel
          icon={<FiGlobe />}
          title="Acessos por país"
          description="Passe o cursor pelo mapa para consultar cada país."
          map={worldMap}
          values={countryValues}
          labels={worldLabels}
          emptyMessage="Os países aparecerão após os primeiros acessos identificados."
        />
        <MapPanel
          icon={<FiMap />}
          title="Acessos por estado do Brasil"
          description="Distribuição estadual aproximada informada pela Cloudflare."
          map={brazilMap}
          values={brazilValues}
          labels={brazilLabels}
          emptyMessage="Novos acessos do Brasil aparecerão quando a região estiver disponível."
        />
      </div>
      <p className="text-[11px] text-[#697383] mt-3 text-right">
        Mapas vetoriais por{' '}
        <a
          href="https://github.com/VictorCazanave/svg-maps"
          target="_blank"
          rel="noreferrer"
          className="hover:text-[#9aacdf]"
        >
          SVG Maps
        </a>{' '}
        (CC BY 4.0).
      </p>
    </section>
  );
}
