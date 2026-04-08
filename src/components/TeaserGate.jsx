import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';
import { sendToSheet } from '../utils/sheets';

export default function TeaserGate({ results, formInputs, onLeadSubmit }) {
  const [form, setForm] = useState({
    nome: '',
    clinica: '',
    email: '',
    whatsapp: '',
    cidade: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const isValid = form.nome && form.clinica && form.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);

    // Send lead + simulation data to Google Sheets
    try {
      await sendToSheet({
        ...form,
        totalConvenios: formInputs?.convenios?.length || 0,
        custoFixoMensal: formInputs?.custoFixoMensal || 0,
        horasPorDia: formInputs?.horasPorDia || 0,
        diasPorMes: formInputs?.diasPorMes || 0,
        ticketMedioParticular: formInputs?.ticketMedioParticular || 0,
        perdaTotalMensal: results.perdaTotalMensal,
        perdaTotalAnual: results.perdaTotalAnual,
      });
    } catch {
      // Don't block the user if sheet fails
    }

    setSubmitting(false);
    onLeadSubmit(form);
  };

  return (
    <div className="teaser-page">
      <div className="container">
        <div className="progress-bar">
          <div className="progress-step active" />
          <div className="progress-step active" />
          <div className="progress-step active" />
          <div className="progress-step" />
        </div>

        <div className="teaser-header fade-up">
          <h2>Sua Simulação Está Pronta</h2>
          <p>Veja um preview do resultado abaixo</p>
        </div>

        {/* Big number - revealed */}
        <div className={`big-number-card fade-up fade-up-delay-1 ${results.saldoLiquido >= 0 ? 'positive' : ''}`}>
          <div className="label">
            {results.saldoLiquido < 0 ? 'Você está PERDENDO com convênios por mês' : 'Saldo líquido dos convênios por mês'}
          </div>
          <div className="amount" style={{ color: results.saldoLiquido < 0 ? '#E74C3C' : '#27AE60' }}>
            {formatCurrency(Math.abs(results.saldoLiquido))}
          </div>
          {results.saldoLiquido < 0 && (
            <div className="annual">
              Isso equivale a <span>{formatCurrency(results.perdaTotalAnual)}</span> por ano
            </div>
          )}
        </div>

        {/* Blurred preview */}
        <div className="teaser-blurred-section fade-up fade-up-delay-2">
          <div className="teaser-blurred-content">
            {results.convenioResults.map((conv, i) => (
              <div className="teaser-blurred-card" key={i}>
                <div className="teaser-blurred-header">
                  <span className="teaser-blurred-name">{conv.nomeConvenio}</span>
                  <span className={`convenio-badge ${conv.isPrejuizo ? 'red' : 'green'}`}>
                    {conv.isPrejuizo ? 'PREJUIZO' : 'LUCRATIVO'}
                  </span>
                </div>
                <div className="teaser-blurred-rows">
                  <div className="teaser-blur-line" />
                  <div className="teaser-blur-line short" />
                  <div className="teaser-blur-line" />
                </div>
              </div>
            ))}
            <div className="teaser-blurred-card">
              <div className="teaser-blur-line" />
              <div className="teaser-blur-line short" />
            </div>
          </div>
          <div className="teaser-blurred-overlay">
            <div className="teaser-lock-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <p>Análise detalhada por convênio, recomendações e plano de transição</p>
          </div>
        </div>

        {/* Lead capture form */}
        <div className="teaser-gate-form fade-up fade-up-delay-3">
          <h3>Preencha para ver o resultado completo</h3>
          <p className="teaser-gate-subtitle">
            Seus dados ficam seguros. Enviamos apenas conteúdo relevante para dentistas.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="lead-form">
              <input
                type="text"
                placeholder="Seu nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Nome da clínica"
                value={form.clinica}
                onChange={(e) => setForm({ ...form, clinica: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="WhatsApp (opcional)"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
              <input
                type="text"
                placeholder="Cidade (opcional)"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              />
              <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
                {submitting ? 'Carregando...' : 'Ver Resultado Completo'}
              </button>
            </div>
          </form>
        </div>

        {/* Contact info */}
        <div className="contact-section">
          <p className="contact-label">Precisa de ajuda? Fale conosco:</p>
          <div className="contact-links">
            <a href="mailto:contato@lkdigital.org" className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13 2 4" />
              </svg>
              contato@lkdigital.org
            </a>
            <a href="tel:+5511946851028" className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              (11) 94685-1028
            </a>
          </div>
        </div>

        <div className="footer">
          <a href="https://lkdigital.odo.br" target="_blank" rel="noopener noreferrer">
            lkdigital.odo.br
          </a>
        </div>
      </div>
    </div>
  );
}
