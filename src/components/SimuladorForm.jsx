import { useState } from 'react';

const emptyProcedure = {
  nome: '',
  pagamentoConvenio: '',
  custoMaterial: '',
  custoLab: '',
  tempoMinutos: '',
  volumeMensal: '',
};

const emptyConvenio = {
  nomeConvenio: '',
  procedimentos: [{ ...emptyProcedure }],
};

export default function SimuladorForm({ leadData, onCalculate }) {
  const [convenios, setConvenios] = useState([{ ...emptyConvenio, procedimentos: [{ ...emptyProcedure }] }]);
  const [custoFixoMensal, setCustoFixoMensal] = useState('');
  const [horasPorDia, setHorasPorDia] = useState('');
  const [diasPorMes, setDiasPorMes] = useState('');
  const [ticketMedioParticular, setTicketMedioParticular] = useState('');

  const updateConvenio = (ci, field, value) => {
    setConvenios((prev) => {
      const copy = [...prev];
      copy[ci] = { ...copy[ci], [field]: value };
      return copy;
    });
  };

  const updateProcedure = (ci, pi, field, value) => {
    setConvenios((prev) => {
      const copy = [...prev];
      const procs = [...copy[ci].procedimentos];
      procs[pi] = { ...procs[pi], [field]: value };
      copy[ci] = { ...copy[ci], procedimentos: procs };
      return copy;
    });
  };

  const addProcedure = (ci) => {
    if (convenios[ci].procedimentos.length >= 5) return;
    setConvenios((prev) => {
      const copy = [...prev];
      copy[ci] = {
        ...copy[ci],
        procedimentos: [...copy[ci].procedimentos, { ...emptyProcedure }],
      };
      return copy;
    });
  };

  const removeProcedure = (ci, pi) => {
    if (convenios[ci].procedimentos.length <= 1) return;
    setConvenios((prev) => {
      const copy = [...prev];
      copy[ci] = {
        ...copy[ci],
        procedimentos: copy[ci].procedimentos.filter((_, i) => i !== pi),
      };
      return copy;
    });
  };

  const addConvenio = () => {
    if (convenios.length >= 5) return;
    setConvenios((prev) => [...prev, { ...emptyConvenio, procedimentos: [{ ...emptyProcedure }] }]);
  };

  const removeConvenio = (ci) => {
    if (convenios.length <= 1) return;
    setConvenios((prev) => prev.filter((_, i) => i !== ci));
  };

  const isValid =
    custoFixoMensal && horasPorDia && diasPorMes && ticketMedioParticular &&
    convenios.every(
      (c) =>
        c.nomeConvenio &&
        c.procedimentos.every(
          (p) => p.nome && p.pagamentoConvenio && p.custoMaterial && p.tempoMinutos && p.volumeMensal
        )
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = {
      custoFixoMensal: parseFloat(custoFixoMensal) || 0,
      horasPorDia: parseFloat(horasPorDia) || 8,
      diasPorMes: parseFloat(diasPorMes) || 22,
      ticketMedioParticular: parseFloat(ticketMedioParticular) || 0,
      convenios: convenios.map((c) => ({
        nomeConvenio: c.nomeConvenio,
        procedimentos: c.procedimentos.map((p) => ({
          nome: p.nome,
          pagamentoConvenio: parseFloat(p.pagamentoConvenio) || 0,
          custoMaterial: parseFloat(p.custoMaterial) || 0,
          custoLab: parseFloat(p.custoLab) || 0,
          tempoMinutos: parseFloat(p.tempoMinutos) || 30,
          volumeMensal: parseFloat(p.volumeMensal) || 0,
        })),
      })),
    };
    onCalculate(parsed);
  };

  return (
    <div className="diagnostic-page">
      <div className="container">
        <div className="progress-bar">
          <div className="progress-step active" />
          <div className="progress-step active" />
          <div className="progress-step" />
        </div>

        <div className="diagnostic-header fade-up">
          <h2>Simulador de {leadData.clinica}</h2>
          <p>Preencha os dados reais. Não precisa ser exato — uma estimativa já revela muito.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-card fade-up">
            <h3 className="section-title">Dados Gerais da Clínica</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Custo fixo mensal (R$)<span className="hint"> (aluguel + folha + contas)</span></label>
                <input type="number" placeholder="Ex: 15000" value={custoFixoMensal} onChange={(e) => setCustoFixoMensal(e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label>Horas trabalhadas/dia</label>
                <input type="number" placeholder="Ex: 8" value={horasPorDia} onChange={(e) => setHorasPorDia(e.target.value)} min="1" max="16" />
              </div>
              <div className="form-group">
                <label>Dias trabalhados/mês</label>
                <input type="number" placeholder="Ex: 22" value={diasPorMes} onChange={(e) => setDiasPorMes(e.target.value)} min="1" max="31" />
              </div>
              <div className="form-group">
                <label>Ticket médio particular (R$)<span className="hint"> (para comparação)</span></label>
                <input type="number" placeholder="Ex: 350" value={ticketMedioParticular} onChange={(e) => setTicketMedioParticular(e.target.value)} min="0" />
              </div>
            </div>
          </div>

          {convenios.map((conv, ci) => (
            <div className="section-card fade-up" key={ci}>
              <div className="section-header">
                <h3 className="section-title">Convênio {ci + 1}</h3>
                {convenios.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeConvenio(ci)}>Remover</button>
                )}
              </div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nome do convênio</label>
                  <input type="text" placeholder="Ex: Amil, Bradesco Dental, OdontoPrev..." value={conv.nomeConvenio} onChange={(e) => updateConvenio(ci, 'nomeConvenio', e.target.value)} />
                </div>
              </div>

              {conv.procedimentos.map((proc, pi) => (
                <div className="procedure-block" key={pi}>
                  <div className="procedure-header">
                    <span className="procedure-label">Procedimento {pi + 1}</span>
                    {conv.procedimentos.length > 1 && (
                      <button type="button" className="btn-remove-sm" onClick={() => removeProcedure(ci, pi)}>x</button>
                    )}
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Nome do procedimento</label>
                      <input type="text" placeholder="Ex: Resina, Canal, Limpeza..." value={proc.nome} onChange={(e) => updateProcedure(ci, pi, 'nome', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Convênio paga (R$)</label>
                      <input type="number" placeholder="Ex: 25" value={proc.pagamentoConvenio} onChange={(e) => updateProcedure(ci, pi, 'pagamentoConvenio', e.target.value)} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Custo material (R$)</label>
                      <input type="number" placeholder="Ex: 15" value={proc.custoMaterial} onChange={(e) => updateProcedure(ci, pi, 'custoMaterial', e.target.value)} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Custo laboratório (R$)<span className="hint"> (se houver)</span></label>
                      <input type="number" placeholder="Ex: 0" value={proc.custoLab} onChange={(e) => updateProcedure(ci, pi, 'custoLab', e.target.value)} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Tempo de cadeira (min)</label>
                      <input type="number" placeholder="Ex: 30" value={proc.tempoMinutos} onChange={(e) => updateProcedure(ci, pi, 'tempoMinutos', e.target.value)} min="1" />
                    </div>
                    <div className="form-group">
                      <label>Quantidade por mês</label>
                      <input type="number" placeholder="Ex: 20" value={proc.volumeMensal} onChange={(e) => updateProcedure(ci, pi, 'volumeMensal', e.target.value)} min="0" />
                    </div>
                  </div>
                </div>
              ))}

              {conv.procedimentos.length < 5 && (
                <button type="button" className="btn-add" onClick={() => addProcedure(ci)}>
                  + Adicionar Procedimento
                </button>
              )}
            </div>
          ))}

          {convenios.length < 5 && (
            <div className="add-convenio-wrapper fade-up">
              <button type="button" className="btn-add-convenio" onClick={addConvenio}>
                + Adicionar Outro Convênio
              </button>
            </div>
          )}

          <div className="form-actions fade-up">
            <button type="submit" className="btn-primary" disabled={!isValid}>
              Ver Resultado da Simulação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
