import { useState, useEffect } from 'react';
import ConvenioForm from './components/ConvenioForm';
import TeaserGate from './components/TeaserGate';
import ResultsDashboard from './components/ResultsDashboard';

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
  const [step, setStep] = useState('form');
  const [results, setResults] = useState(null);
  const [formInputs, setFormInputs] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#results=')) {
      const encoded = hash.substring('#results='.length);
      const decoded = decodeResults(encoded);
      if (decoded) {
        setResults(decoded);
        setStep('results');
      }
    }
  }, []);

  const handleCalculate = (inputs, calcResults) => {
    setFormInputs(inputs);
    setResults(calcResults);
    setStep('teaser');
    window.scrollTo(0, 0);
  };

  const handleLeadSubmitted = () => {
    const encoded = encodeResults(results);
    if (encoded) {
      const newUrl = window.location.origin + window.location.pathname + '#results=' + encoded;
      window.history.replaceState(null, '', newUrl);
    }
    setStep('results');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="border-b border-brand-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lk-logo.png" alt="LK Digital" className="h-8 w-8 rounded" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="font-semibold text-brand-text">LK Digital</span>
          </div>
          <span className="text-xs text-brand-text-secondary hidden sm:block">Simulador de Convenios Odontologicos</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {step === 'form' && <ConvenioForm onCalculate={handleCalculate} />}
        {step === 'teaser' && (
          <TeaserGate results={results} formInputs={formInputs} onLeadSubmitted={handleLeadSubmitted} />
        )}
        {step === 'results' && <ResultsDashboard results={results} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border py-6 text-center text-sm text-brand-text-secondary">
        Ferramenta gratuita por{' '}
        <a href="https://lkdigital.odo.br" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">
          LK Digital
        </a>
        {' '} — Sistemas que funcionam para dentistas
      </footer>
    </div>
  );
}

export default App;
