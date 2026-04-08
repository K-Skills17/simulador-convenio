import { useState } from 'react';
import LandingPage from './components/LandingPage';
import SimuladorForm from './components/SimuladorForm';
import ResultsDashboard from './components/ResultsDashboard';
import { calculateConvenio } from './utils/calculations';
import { sendToSheet } from './utils/sheets';
import './App.css';

function App() {
  const [step, setStep] = useState('landing');
  const [leadData, setLeadData] = useState(null);
  const [results, setResults] = useState(null);

  const handleLeadSubmit = (data) => {
    setLeadData(data);
    setStep('form');
    window.scrollTo(0, 0);
  };

  const handleCalculate = (inputs) => {
    const calcResults = calculateConvenio(inputs);
    setResults(calcResults);
    setStep('results');
    window.scrollTo(0, 0);

    sendToSheet({
      ...leadData,
      totalConvenios: inputs.convenios.length,
      custoFixoMensal: inputs.custoFixoMensal,
      horasPorDia: inputs.horasPorDia,
      diasPorMes: inputs.diasPorMes,
      ticketMedioParticular: inputs.ticketMedioParticular,
      perdaTotalMensal: calcResults.perdaTotalMensal,
      perdaTotalAnual: calcResults.perdaTotalAnual,
    });
  };

  return (
    <>
      {step === 'landing' && <LandingPage onSubmit={handleLeadSubmit} />}
      {step === 'form' && (
        <SimuladorForm leadData={leadData} onCalculate={handleCalculate} />
      )}
      {step === 'results' && (
        <ResultsDashboard results={results} leadData={leadData} />
      )}
    </>
  );
}

export default App;
