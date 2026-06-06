import { useState } from 'react';
import { sendToSheet } from '../utils/sheets';
import { sendCapiEvent } from '../utils/capi';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getScoreColor(score) {
  if (score >= 60) return '#27AE60';
  if (score >= 45) return '#F39C12';
  return '#E74C3C';
}

export default function TeaserGate({ results, formInputs, onLeadSubmitted }) {
  const [form, setForm] = useState({ nome: '', clinica: '', whatsapp: '', email: '', cidade: '' });
  const [submitting, setSubmitting] = useState(false);

  const isValid = form.nome && form.clinica && form.whatsapp;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);

    try {
      // Send lead to Google Sheets
      await sendToSheet({
        ...form,
        overallScore: results.overallScore,
        receitaPrivada: results.receitaPrivada,
        totalPlanos: results.totalPlanos,
        totalProcedimentos: results.totalProcedimentos,
        tool: 'simulador-convenio',
      });

      // Send Facebook CAPI event
      await sendCapiEvent({
        eventName: 'Lead',
        phone: form.whatsapp,
        name: form.nome,
        customData: {
          content_name: 'Simulador Convenio',
          value: results.overallScore,
          currency: 'BRL',
        },
      });

      // Send WhatsApp via serverless function
      try {
        await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.nome,
            phone: form.whatsapp,
            clinicName: form.clinica,
            email: form.email,
            cidade: form.cidade,
            score: results.overallScore,
            receitaPrivada: results.receitaPrivada,
            planResults: results.planResults.map(p => ({
              nome: p.nome,
              score: p.score,
              classificacao: p.classificacao,
              perdaTotal: p.perdaTotal,
            })),
            reportUrl: window.location.href,
          }),
        });
      } catch (err) {
        console.error('WhatsApp send error:', err);
      }
    } catch (err) {
      console.error('Lead submission error:', err);
    }

    setSubmitting(false);
    onLeadSubmitted(form);
  };

  const topPlan = results.planResults.reduce((best, p) => p.score > best.score ? p : best, results.planResults[0]);
  const worstPlan = results.planResults.reduce((worst, p) => p.score < worst.score ? p : worst, results.planResults[0]);

  return (
    <div className="fade-up">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s <= 2 ? 'bg-brand-gold text-white' : 'bg-brand-border text-brand-text-secondary'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-8 h-0.5 ${s < 2 ? 'bg-brand-gold' : 'bg-brand-border'}`} />}
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-brand-text">Previa do Resultado</h2>
        <p className="text-sm text-brand-text-secondary mt-1">
          Seus numeros foram calculados! Veja o destaque abaixo.
        </p>
      </div>

      {/* Score card */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm text-center mb-6 fade-up fade-up-delay-1">
        <div className="text-sm text-brand-text-secondary mb-2">Pontuacao geral dos seus convenios</div>
        <div
          className="text-5xl font-bold mb-1"
          style={{ color: getScoreColor(results.overallScore) }}
        >
          {results.overallScore}/100
        </div>
        <div className="text-sm text-brand-text-secondary">
          {results.overallScore >= 60 && 'Seus convenios estao razoavelmente rentaveis'}
          {results.overallScore >= 45 && results.overallScore < 60 && 'Seus convenios estao no limite da rentabilidade'}
          {results.overallScore < 45 && 'Atencao! Seus convenios estao gerando prejuizo significativo'}
        </div>
      </div>

      {/* Teaser findings */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6 fade-up fade-up-delay-2">
        <div className="bg-white rounded-xl border border-brand-border p-4 shadow-sm">
          <div className="text-xs text-brand-text-secondary mb-1">Melhor convenio</div>
          <div className="font-semibold text-green-600">{topPlan?.nome}</div>
          <div className="text-sm text-brand-text-secondary">Reembolso: {topPlan?.reembolso}%</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-4 shadow-sm">
          <div className="text-xs text-brand-text-secondary mb-1">Pior convenio</div>
          <div className="font-semibold text-red-600">{worstPlan?.nome}</div>
          <div className="text-sm text-brand-text-secondary">Perda mensal: {formatCurrency(worstPlan?.perdaTotal || 0)}</div>
        </div>
      </div>

      {/* Blurred preview */}
      <div className="relative mb-8 fade-up fade-up-delay-3">
        <div
          style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.6 }}
        >
          <div className="bg-white rounded-xl border border-brand-border p-4 shadow-sm mb-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-brand-border p-4 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/95 px-6 py-4 rounded-xl shadow-lg text-center max-w-sm">
            <strong className="text-base text-brand-text">Preencha seus dados para desbloquear</strong>
            <p className="text-xs text-brand-text-secondary mt-1">
              Analise completa por convenio, break-even e recomendacoes personalizadas.
            </p>
          </div>
        </div>
      </div>

      {/* Lead form */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Desbloqueie Seu Resultado Completo</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Seu nome *</label>
              <input
                type="text"
                placeholder="Ex: Dr. Joao"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Nome da clinica *</label>
              <input
                type="text"
                placeholder="Ex: Odonto Vida"
                value={form.clinica}
                onChange={(e) => setForm({ ...form, clinica: e.target.value })}
                required
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">WhatsApp *</label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                required
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">E-mail <span className="text-brand-text-secondary">(opcional)</span></label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Cidade <span className="text-brand-text-secondary">(opcional)</span></label>
              <input
                type="text"
                placeholder="Ex: Sao Paulo"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full sm:w-auto bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md"
            >
              {submitting ? 'Desbloqueando...' : 'Ver Resultado Completo'}
            </button>
          </div>
        </form>
      </div>

      {/* Contact */}
      <div className="mt-6 text-center text-sm text-brand-text-secondary">
        <p>Precisa de ajuda? Fale conosco:</p>
        <a href="https://wa.me/5511946851028" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">
          (11) 94685-1028
        </a>
      </div>
    </div>
  );
}
