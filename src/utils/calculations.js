export function calculateConvenio(inputs) {
  const { convenios, custoFixoMensal, horasPorDia, diasPorMes, ticketMedioParticular } = inputs;

  const horasMensais = horasPorDia * diasPorMes;
  const custoPorHora = custoFixoMensal / horasMensais;

  const convenioResults = convenios.map((conv) => {
    const procedureResults = conv.procedimentos.map((proc) => {
      const custoTempoMinutos = (custoPorHora * proc.tempoMinutos) / 60;
      const custoTotal = proc.custoMaterial + proc.custoLab + custoTempoMinutos;
      const lucroPorProcedimento = proc.pagamentoConvenio - custoTotal;
      const volumeMensal = proc.volumeMensal;
      const lucroMensal = lucroPorProcedimento * volumeMensal;

      return {
        nome: proc.nome,
        pagamentoConvenio: proc.pagamentoConvenio,
        custoMaterial: proc.custoMaterial,
        custoLab: proc.custoLab,
        custoTempo: custoTempoMinutos,
        custoTotal,
        lucroPorProcedimento,
        volumeMensal,
        lucroMensal,
        isPrejuizo: lucroPorProcedimento < 0,
      };
    });

    const lucroMensalTotal = procedureResults.reduce((sum, p) => sum + p.lucroMensal, 0);
    const receitaMensalConvenio = procedureResults.reduce(
      (sum, p) => sum + p.pagamentoConvenio * p.volumeMensal, 0
    );
    const pacientesParaSubstituir = ticketMedioParticular > 0
      ? Math.ceil(receitaMensalConvenio / ticketMedioParticular)
      : 0;
    const pacientesTotais = procedureResults.reduce((sum, p) => sum + p.volumeMensal, 0);

    return {
      nomeConvenio: conv.nomeConvenio,
      procedimentos: procedureResults,
      lucroMensalTotal,
      receitaMensalConvenio,
      pacientesParaSubstituir,
      pacientesTotais,
      isPrejuizo: lucroMensalTotal < 0,
    };
  });

  const perdaTotalMensal = convenioResults.reduce((sum, c) => {
    return c.lucroMensalTotal < 0 ? sum + Math.abs(c.lucroMensalTotal) : sum;
  }, 0);

  const lucroTotalMensal = convenioResults.reduce((sum, c) => {
    return c.lucroMensalTotal > 0 ? sum + c.lucroMensalTotal : sum;
  }, 0);

  const saldoLiquido = convenioResults.reduce((sum, c) => sum + c.lucroMensalTotal, 0);
  const perdaTotalAnual = perdaTotalMensal * 12;

  const totalPacientesSubstituir = convenioResults
    .filter((c) => c.isPrejuizo)
    .reduce((sum, c) => sum + c.pacientesParaSubstituir, 0);

  return {
    convenioResults,
    perdaTotalMensal,
    lucroTotalMensal,
    saldoLiquido,
    perdaTotalAnual,
    totalPacientesSubstituir,
    custoPorHora,
    ticketMedioParticular,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
