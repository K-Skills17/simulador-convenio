import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SimuladorForm from './components/SimuladorForm';
import TeaserGate from './components/TeaserGate';
import ResultsDashboard from './components/ResultsDashboard';
import { calculateConvenio } from './utils/calculations';
import './App.css';

function encodeResults(data) {
  try {
    return window.btoa(encodeURIComponent(JSON.stringify(data)));
  } catch {
    return null;
  }
}

function decodeResults(hash) {
  try {
    return JSON.parse(decodeURIComponent(window.atob(hash)));
  } catch {
    return null;
  }
}

function App() {
  const [step, setStep] = useState('landing');
  const [leadData, setLeadData] = useState(null);
  const [results, setResults] = useState(null);
  const [formInputs, setFormInputs] = useState(null);

  // On mount, check URL hash for encoded results
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#results=')) {
      const encoded = hash.slice('#results='.length);
      const decoded = decodeResults(encoded);
      if (decoded) {
        setResults(decoded);
        setStep('results');
      }
    }
  }, []);

  const handleStartSimulator = () => {
    setStep('form');
    window.scrollTo(0, 0);
  };

  const handleCalculate = (inputs) => {
    const calcResults = calculateConvenio(inputs);
    setResults(calcResults);
    setFormInputs(inputs);
    setStep('teaser');
    window.scrollTo(0, 0);
  };

  const handleLeadSubmit = (data) => {
    setLeadData(data);

    // Encode results in URL hash
    const encoded = encodeResults(results);
    if (encoded) {
      window.location.hash = `results=${encoded}`;
    }

    setStep('results');
    window.scrollTo(0, 0);
  };

  return (
    <>
      {step === 'landing' && <LandingPage onStart={handleStartSimulator} />}
      {step === 'form' && (
        <SimuladorForm onCalculate={handleCalculate} />
      )}
      {step === 'teaser' && (
        <TeaserGate
          results={results}
          formInputs={formInputs}
          onLeadSubmit={handleLeadSubmit}
        />
      )}
      {step === 'results' && (
        <ResultsDashboard results={results} leadData={leadData} />
      )}
    </>
  );
}

export default App;
