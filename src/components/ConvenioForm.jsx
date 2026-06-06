import { useState } from 'react';
import { DEFAULT_PROCEDURES, DEFAULT_PLANS } from '../config';

function generateId() {
  return 'custom-' + Math.random().toString(36).substring(2, 9);
}

function calculateResults(procedures, plans, custoFixo) {
  const receitaPrivada = procedures.reduce((sum, p) => sum + (p.precoPrivado * p.volume), 0);

  const planResults = plans.map((plan) => {
    const reembolsoPct = plan.reembolso / 100;

    const procedureDetails = procedures.map((proc) => {
      const receitaPlano = proc.precoPrivado * reembolsoPct;
      const receitaMensalPlano = receitaPlano * proc.volume;
      const receitaMensalPrivada = proc.precoPrivado * proc.volume;
      const perda = receitaMensalPrivada - receitaMensalPlano;

      return {
        nome: proc.nome,
        precoPrivado: proc.precoPrivado,
        precoPlano: receitaPlano,
        volume: proc.volume,
        receitaMensalPrivada,
        receitaMensalPlano,
        perda,
      };
    });

    const receitaPlanoTotal = procedureDetails.reduce((sum, p) => sum + p.receitaMensalPlano, 0);
    const perdaTotal = receitaPrivada - receitaPlanoTotal;
    const percentualPerda = receitaPrivada > 0 ? ((perdaTotal / receitaPrivada) * 100) : 0;

    // Break-even: how many extra patients needed at plan price to match private revenue
    const receitaMediaPorPacientePlano = procedures.length > 0
      ? receitaPlanoTotal / procedures.reduce((sum, p) => sum + p.volume, 0)
      : 0;
    const volumeAtual = procedures.reduce((sum, p) => sum + p.volume, 0);
    const breakEvenVolume = receitaMediaPorPacientePlano > 0
      ? Math.ceil(perdaTotal / receitaMediaPorPacientePlano)
      : 0;

    // Profitability score: 100 = plan pays same as private, 0 = plan pays nothing
    const score = Math.round(reembolsoPct * 100);

    // Classification
    let classificacao = 'vermelho'; // red = money loser
    if (score >= 60) classificacao = 'verde'; // green = worth it
    else if (score >= 45) classificacao = 'amarelo'; // yellow = borderline

    // Adjust classification based on break-even feasibility
    if (breakEvenVolume > volumeAtual * 0.5 && classificacao === 'amarelo') {
      classificacao = 'vermelho';
    }

    return {
      nome: plan.nome,
      reembolso: plan.reembolso,
      receitaPlanoTotal,
      perdaTotal,
      percentualPerda,
      breakEvenVolume,
      volumeAtual,
      score,
      classificacao,
      procedureDetails,
    };
  });

  // Overall score: weighted average of plan scores
  const overallScore = planResults.length > 0
    ? Math.round(planResults.reduce((sum, p) => sum + p.score, 0) / planResults.length)
    : 0;

  // Custos fixos analysis
  let breakEvenCustos = null;
  if (custoFixo > 0) {
    const lucroPrivado = receitaPrivada - custoFixo;
    breakEvenCustos = {
      custoFixo,
      receitaPrivada,
      lucroPrivado,
      planAnalysis: planResults.map((p) => ({
        nome: p.nome,
        receitaPlano: p.receitaPlanoTotal,
        lucroPlano: p.receitaPlanoTotal - custoFixo,
        viavel: p.receitaPlanoTotal > custoFixo,
      })),
    };
  }

  return {
    receitaPrivada,
    overallScore,
    planResults,
    breakEvenCustos,
    totalProcedimentos: procedures.length,
    totalPlanos: plans.length,
  };
}

export default function ConvenioForm({ onCalculate }) {
  const [procedures, setProcedures] = useState(DEFAULT_PROCEDURES);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [custoFixo, setCustoFixo] = useState(0);
  const [currentStep, setCurrentStep] = useState(1); // 1=procedures, 2=plans, 3=costs

  const updateProcedure = (index, field, value) => {
    const updated = [...procedures];
    updated[index] = { ...updated[index], [field]: value };
    setProcedures(updated);
  };

  const addProcedure = () => {
    setProcedures([...procedures, { id: generateId(), nome: '', precoPrivado: 0, volume: 0 }]);
  };

  const removeProcedure = (index) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  const updatePlan = (index, field, value) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: value };
    setPlans(updated);
  };

  const addPlan = () => {
    setPlans([...plans, { id: generateId(), nome: '', reembolso: 50 }]);
  };

  const removePlan = (index) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validProcedures = procedures.filter(p => p.nome && p.precoPrivado > 0);
    const validPlans = plans.filter(p => p.nome && p.reembolso > 0);

    if (validProcedures.length === 0 || validPlans.length === 0) {
      alert('Preencha pelo menos 1 procedimento e 1 convenio.');
      return;
    }

    const results = calculateResults(validProcedures, validPlans, custoFixo);
    onCalculate({ procedures: validProcedures, plans: validPlans, custoFixo }, results);
  };

  return (
    <div className="fade-up">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-2">
          Simulador de Convenios
        </h1>
        <p className="text-brand-text-secondary max-w-lg mx-auto">
          Descubra quais convenios estao dando lucro ou prejuizo para a sua clinica.
          Preencha seus dados e receba uma analise completa.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep >= s
                  ? 'bg-brand-gold text-white'
                  : 'bg-brand-border text-brand-text-secondary'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`w-8 h-0.5 ${currentStep > s ? 'bg-brand-gold' : 'bg-brand-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Procedures */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm fade-up">
          <h2 className="text-lg font-semibold text-brand-text mb-1">Seus Procedimentos</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Informe o preco particular e o volume mensal de cada procedimento.
          </p>

          <div className="space-y-3">
            {procedures.map((proc, i) => (
              <div key={proc.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-5">
                  {i === 0 && <label className="block text-xs text-brand-text-secondary mb-1">Procedimento</label>}
                  <input
                    type="text"
                    value={proc.nome}
                    onChange={(e) => updateProcedure(i, 'nome', e.target.value)}
                    placeholder="Nome do procedimento"
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  {i === 0 && <label className="block text-xs text-brand-text-secondary mb-1">Preco particular (R$)</label>}
                  <input
                    type="number"
                    value={proc.precoPrivado || ''}
                    onChange={(e) => updateProcedure(i, 'precoPrivado', Number(e.target.value))}
                    placeholder="R$ 0"
                    min="0"
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  {i === 0 && <label className="block text-xs text-brand-text-secondary mb-1">Volume/mes</label>}
                  <input
                    type="number"
                    value={proc.volume || ''}
                    onChange={(e) => updateProcedure(i, 'volume', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeProcedure(i)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none pb-1"
                    title="Remover"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addProcedure}
            className="mt-4 text-sm text-brand-gold hover:text-brand-gold-dark font-medium"
          >
            + Adicionar procedimento
          </button>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="bg-brand-gold hover:bg-brand-gold-dark text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Proximo
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Plans */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm fade-up">
          <h2 className="text-lg font-semibold text-brand-text mb-1">Convenios para Simular</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Selecione os convenios e ajuste o percentual de reembolso que cada um paga em relacao ao seu preco particular.
          </p>

          <div className="space-y-3">
            {plans.map((plan, i) => (
              <div key={plan.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-7">
                  {i === 0 && <label className="block text-xs text-brand-text-secondary mb-1">Convenio</label>}
                  <input
                    type="text"
                    value={plan.nome}
                    onChange={(e) => updatePlan(i, 'nome', e.target.value)}
                    placeholder="Nome do convenio"
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="col-span-10 sm:col-span-4">
                  {i === 0 && <label className="block text-xs text-brand-text-secondary mb-1">Reembolso (%)</label>}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      value={plan.reembolso}
                      onChange={(e) => updatePlan(i, 'reembolso', Number(e.target.value))}
                      min="10"
                      max="100"
                      className="flex-1 accent-brand-gold"
                    />
                    <span className="text-sm font-medium w-10 text-right">{plan.reembolso}%</span>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removePlan(i)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none pb-1"
                    title="Remover"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPlan}
            className="mt-4 text-sm text-brand-gold hover:text-brand-gold-dark font-medium"
          >
            + Adicionar convenio
          </button>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-brand-text-secondary hover:text-brand-text font-medium px-4 py-2.5 transition-colors"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="bg-brand-gold hover:bg-brand-gold-dark text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Proximo
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Fixed costs + submit */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm fade-up">
          <h2 className="text-lg font-semibold text-brand-text mb-1">Custos Fixos (Opcional)</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Informe seus custos fixos mensais para calcular o ponto de equilibrio de cada convenio.
          </p>

          <div className="max-w-sm">
            <label className="block text-xs text-brand-text-secondary mb-1">Custo fixo mensal (R$)</label>
            <input
              type="number"
              value={custoFixo || ''}
              onChange={(e) => setCustoFixo(Number(e.target.value))}
              placeholder="Ex: 15000"
              min="0"
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
            />
            <p className="text-xs text-brand-text-secondary mt-1">
              Aluguel, folha salarial, materiais, etc.
            </p>
          </div>

          {/* Summary before submit */}
          <div className="mt-6 bg-brand-bg rounded-lg p-4 border border-brand-border">
            <h3 className="text-sm font-medium text-brand-text mb-2">Resumo da simulacao:</h3>
            <ul className="text-sm text-brand-text-secondary space-y-1">
              <li>{procedures.filter(p => p.nome && p.precoPrivado > 0).length} procedimentos configurados</li>
              <li>{plans.filter(p => p.nome && p.reembolso > 0).length} convenios para simular</li>
              {custoFixo > 0 && <li>Custo fixo: R$ {custoFixo.toLocaleString('pt-BR')}/mes</li>}
            </ul>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-brand-text-secondary hover:text-brand-text font-medium px-4 py-2.5 transition-colors"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-8 py-2.5 rounded-lg transition-colors shadow-md"
            >
              Simular Agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
