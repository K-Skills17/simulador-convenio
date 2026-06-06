import { WHATSAPP_NUMBER } from '../config';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getScoreColor(score) {
  if (score >= 60) return '#27AE60';
  if (score >= 45) return '#F39C12';
  return '#E74C3C';
}

function getClassBg(classificacao) {
  if (classificacao === 'verde') return 'bg-green-50 border-green-200';
  if (classificacao === 'amarelo') return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function getClassBadge(classificacao) {
  if (classificacao === 'verde') return { bg: 'bg-green-100 text-green-800', label: 'RENTAVEL' };
  if (classificacao === 'amarelo') return { bg: 'bg-yellow-100 text-yellow-800', label: 'LIMITE' };
  return { bg: 'bg-red-100 text-red-800', label: 'PREJUIZO' };
}

export default function ResultsDashboard({ results }) {
  const shareUrl = window.location.href;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Simulador de Convenios - Resultado',
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copiado!');
    }
  };

  const verdes = results.planResults.filter(p => p.classificacao === 'verde');
  const amarelos = results.planResults.filter(p => p.classificacao === 'amarelo');
  const vermelhos = results.planResults.filter(p => p.classificacao === 'vermelho');

  return (
    <div className="fade-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand-text mb-1">Resultado da Simulacao</h1>
        <p className="text-sm text-brand-text-secondary">Analise completa dos seus convenios</p>
      </div>

      {/* Overall Score Ring */}
      <div className="bg-white rounded-xl border border-brand-border p-8 shadow-sm text-center mb-6 fade-up">
        <div className="relative inline-block mb-4">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="#E8E4DC" strokeWidth="10" />
            <circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke={getScoreColor(results.overallScore)}
              strokeWidth="10"
              strokeDasharray={`${(results.overallScore / 100) * 377} 377`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(results.overallScore) }}>
              {results.overallScore}
            </span>
          </div>
        </div>
        <div className="text-sm text-brand-text-secondary mb-1">Pontuacao Geral de Rentabilidade</div>
        <div className="text-lg font-medium text-brand-text">
          Receita particular: {formatCurrency(results.receitaPrivada)}/mes
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6 fade-up fade-up-delay-1">
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{verdes.length}</div>
          <div className="text-xs text-green-700">Rentaveis</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{amarelos.length}</div>
          <div className="text-xs text-yellow-700">No limite</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{vermelhos.length}</div>
          <div className="text-xs text-red-700">Prejuizo</div>
        </div>
      </div>

      {/* Per-plan breakdown */}
      <div className="space-y-4 mb-8 fade-up fade-up-delay-2">
        <h2 className="text-lg font-semibold text-brand-text">Analise por Convenio</h2>
        {results.planResults.map((plan, i) => {
          const badge = getClassBadge(plan.classificacao);
          return (
            <div key={i} className={`rounded-xl border p-5 shadow-sm ${getClassBg(plan.classificacao)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-brand-text">{plan.nome}</h3>
                  <span className="text-xs text-brand-text-secondary">Reembolso: {plan.reembolso}%</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>

              {/* Revenue comparison */}
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-xs text-brand-text-secondary">Receita particular</div>
                  <div className="font-semibold text-brand-text">{formatCurrency(results.receitaPrivada)}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-xs text-brand-text-secondary">Receita com convenio</div>
                  <div className="font-semibold text-brand-text">{formatCurrency(plan.receitaPlanoTotal)}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-xs text-brand-text-secondary">Perda mensal</div>
                  <div className="font-semibold text-red-600">-{formatCurrency(plan.perdaTotal)}</div>
                </div>
              </div>

              {/* Break-even */}
              <div className="text-sm text-brand-text-secondary">
                <span className="font-medium">Break-even:</span> Voce precisa de{' '}
                <span className="font-semibold text-brand-text">+{plan.breakEvenVolume} atendimentos/mes</span>
                {' '}a mais para compensar a perda ({plan.percentualPerda.toFixed(1)}% menos que o particular).
              </div>

              {/* Procedure details (collapsed) */}
              <details className="mt-3">
                <summary className="text-xs text-brand-gold cursor-pointer hover:underline">
                  Ver detalhamento por procedimento
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-brand-text-secondary">
                        <th className="py-1 pr-2">Procedimento</th>
                        <th className="py-1 pr-2">Particular</th>
                        <th className="py-1 pr-2">Convenio</th>
                        <th className="py-1 pr-2">Vol.</th>
                        <th className="py-1">Perda/mes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.procedureDetails.map((proc, j) => (
                        <tr key={j} className="border-t border-brand-border/50">
                          <td className="py-1 pr-2">{proc.nome}</td>
                          <td className="py-1 pr-2">{formatCurrency(proc.precoPrivado)}</td>
                          <td className="py-1 pr-2">{formatCurrency(proc.precoPlano)}</td>
                          <td className="py-1 pr-2">{proc.volume}</td>
                          <td className="py-1 text-red-600">-{formatCurrency(proc.perda)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {/* Break-even with fixed costs */}
      {results.breakEvenCustos && (
        <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm mb-6 fade-up fade-up-delay-3">
          <h2 className="text-lg font-semibold text-brand-text mb-3">Analise de Ponto de Equilibrio</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Com custos fixos de {formatCurrency(results.breakEvenCustos.custoFixo)}/mes:
          </p>
          <div className="space-y-2">
            {results.breakEvenCustos.planAnalysis.map((pa, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-brand-border/50 last:border-0">
                <span className="text-sm text-brand-text">{pa.nome}</span>
                <div className="text-right">
                  <span className={`text-sm font-medium ${pa.viavel ? 'text-green-600' : 'text-red-600'}`}>
                    {pa.viavel ? 'Cobre custos' : 'NAO cobre custos'}
                  </span>
                  <span className="text-xs text-brand-text-secondary ml-2">
                    (Lucro: {formatCurrency(pa.lucroPlano)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-brand-text mb-3">Recomendacoes</h2>
        <div className="space-y-3 text-sm">
          {verdes.length > 0 && (
            <div className="flex gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <p className="text-brand-text">
                <strong>Manter:</strong> {verdes.map(p => p.nome).join(', ')} — esses convenios estao trazendo volume adequado para compensar a tabela reduzida.
              </p>
            </div>
          )}
          {amarelos.length > 0 && (
            <div className="flex gap-2">
              <span className="text-yellow-500 mt-0.5">●</span>
              <p className="text-brand-text">
                <strong>Renegociar:</strong> {amarelos.map(p => p.nome).join(', ')} — estao no limite. Tente renegociar a tabela ou aumente o volume de pacientes desses planos.
              </p>
            </div>
          )}
          {vermelhos.length > 0 && (
            <div className="flex gap-2">
              <span className="text-red-500 mt-0.5">●</span>
              <p className="text-brand-text">
                <strong>Considerar descredenciar:</strong> {vermelhos.map(p => p.nome).join(', ')} — estao gerando prejuizo significativo. Avalie se o volume de novos pacientes justifica manter.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-blue-500 mt-0.5">●</span>
            <p className="text-brand-text">
              <strong>Dica:</strong> Convenios com reembolso abaixo de 45% raramente se justificam, a menos que tragam um volume muito alto de pacientes novos que depois convertem para tratamentos particulares.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={handleShare}
          className="flex-1 border border-brand-border text-brand-text font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          Compartilhar resultado
        </button>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Ola! Usei o Simulador de Convenios e quero otimizar a rentabilidade dos meus planos. Minha nota foi ' + results.overallScore + '/100.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center shadow-md"
        >
          Quer otimizar seus convenios? Fale com um especialista
        </a>
      </div>
    </div>
  );
}
