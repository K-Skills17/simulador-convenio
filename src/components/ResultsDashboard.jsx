import { useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '../utils/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WHATSAPP_NUMBER } from '../config';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1A1A1A', color: 'white', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
        <div style={{ marginBottom: 4 }}>{payload[0].payload.name}</div>
        <div style={{ fontWeight: 600 }}>{formatCurrency(payload[0].value)}</div>
      </div>
    );
  }
  return null;
}

export default function ResultsDashboard({ results, leadData }) {
  const dashboardRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const clinicName = leadData?.clinica || 'Minha Clínica';
  const cityName = leadData?.cidade || 'Brasil';

  const whatsappMessage = encodeURIComponent(
    `Olá! Fiz o Simulador de Convênios da minha clínica "${clinicName}" e descobri que ${results.saldoLiquido < 0 ? `estou perdendo ${formatCurrency(Math.abs(results.saldoLiquido))} por mês com convênios` : `meus convênios geram ${formatCurrency(results.saldoLiquido)} por mês`}. Gostaria de saber como atrair mais pacientes particulares.`
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, backgroundColor: '#FAFAF8', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`simulador-convenio-${clinicName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch {
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const chartData = results.convenioResults.map((c) => ({
    name: c.nomeConvenio,
    valor: c.lucroMensalTotal,
  }));

  return (
    <div className="results-page">
      <div className="container" ref={dashboardRef}>
        <div className="progress-bar">
          <div className="progress-step active" />
          <div className="progress-step active" />
          <div className="progress-step active" />
          <div className="progress-step active" />
        </div>

        <div className="results-header fade-up">
          <h2>Resultado da Simulação</h2>
          <div className="clinic-name">{clinicName} — {cityName}</div>
        </div>

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

        {/* Per-convenio cards */}
        {results.convenioResults.map((conv, i) => (
          <div className={`convenio-result-card fade-up ${conv.isPrejuizo ? 'prejuizo' : 'lucrativo'}`} key={i}>
            <div className="convenio-result-header">
              <h3>{conv.nomeConvenio}</h3>
              <div className={`convenio-badge ${conv.isPrejuizo ? 'red' : 'green'}`}>
                {conv.isPrejuizo ? 'PREJUÍZO' : 'LUCRATIVO'}
              </div>
            </div>

            <div className="convenio-total">
              <span className="convenio-total-label">Resultado mensal:</span>
              <span className={`convenio-total-value ${conv.isPrejuizo ? 'red' : 'green'}`}>
                {conv.isPrejuizo ? '-' : '+'}{formatCurrency(Math.abs(conv.lucroMensalTotal))}
              </span>
            </div>

            <div className="procedure-table">
              <div className="procedure-table-header">
                <span>Procedimento</span>
                <span>Paga</span>
                <span>Custo</span>
                <span>Lucro</span>
              </div>
              {conv.procedimentos.map((proc, j) => (
                <div className={`procedure-table-row ${proc.isPrejuizo ? 'row-red' : ''}`} key={j}>
                  <span>{proc.nome}</span>
                  <span>{formatCurrency(proc.pagamentoConvenio)}</span>
                  <span>{formatCurrency(proc.custoTotal)}</span>
                  <span className={proc.isPrejuizo ? 'red' : 'green'}>
                    {formatCurrency(proc.lucroPorProcedimento)}
                  </span>
                </div>
              ))}
            </div>

            {conv.isPrejuizo && (
              <div className="breakeven-info">
                Para substituir este convênio, você precisaria de apenas{' '}
                <strong>{conv.pacientesParaSubstituir} pacientes particulares</strong>/mês
                (a {formatCurrency(results.ticketMedioParticular)} de ticket médio)
              </div>
            )}
          </div>
        ))}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="chart-section fade-up">
            <h3>Lucro/Prejuízo por Convênio</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.valor < 0 ? '#E74C3C' : '#27AE60'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary */}
        {results.totalPacientesSubstituir > 0 && (
          <div className="summary-card fade-up">
            <h3>Resumo da Transição</h3>
            <p>
              Para eliminar todos os convênios com prejuízo, você precisaria atrair apenas{' '}
              <strong>{results.totalPacientesSubstituir} pacientes particulares</strong> por mês.
            </p>
            <p className="summary-highlight">
              Custo atual da sua hora: <strong>{formatCurrency(results.custoPorHora)}/hora</strong>
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="cta-section fade-up">
          <h3>Pronto para Atrair Mais Pacientes Particulares?</h3>
          <p>
            Nós construímos sistemas de marketing que atraem pacientes dispostos a pagar
            o que seu trabalho realmente vale — sem depender de convênios.
          </p>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar com Especialista
          </a>
          <div className="results-actions">
            <button className="btn-secondary" onClick={handleExportPDF}>
              Baixar Simulação em PDF
            </button>
            <button className="btn-secondary btn-share" onClick={handleCopyLink}>
              {copied ? 'Link Copiado!' : 'Compartilhar Resultado'}
            </button>
          </div>
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
          Ferramenta gratuita por{' '}
          <a href="https://lkdigital.odo.br" target="_blank" rel="noopener noreferrer">
            LK Digital
          </a>{' '}
          — Sistemas que funcionam para dentistas
        </div>
      </div>
    </div>
  );
}
