export default function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-logo">
        LK <span>Digital</span>
      </div>

      <h1 className="fade-up">
        Seus convênios são <em>lucrativos</em> ou você está pagando para trabalhar?
      </h1>

      <p className="subtitle fade-up fade-up-delay-1">
        Descubra em 3 minutos se vale a pena manter seus convênios odontológicos
        — ou se você ganharia mais atendendo particular.
      </p>

      <div className="fade-up fade-up-delay-2" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <button type="button" className="btn-primary" onClick={onStart}>
          Simular Meus Convênios
        </button>
      </div>

      <div className="landing-features fade-up fade-up-delay-3">
        <div className="landing-feature">
          <div className="number">3 min</div>
          <p>Para preencher</p>
        </div>
        <div className="landing-feature">
          <div className="number">100%</div>
          <p>Gratuito</p>
        </div>
        <div className="landing-feature">
          <div className="number">R$</div>
          <p>Lucro real por convênio</p>
        </div>
      </div>

      <div className="landing-benefits fade-up fade-up-delay-4">
        <div className="benefit-item">Saiba exatamente quanto cada convênio custa para sua clínica</div>
        <div className="benefit-item">Veja o custo real por procedimento (incluindo tempo de cadeira)</div>
        <div className="benefit-item">Descubra quantos pacientes particulares substituem cada convênio</div>
      </div>

      <div className="footer">
        <a href="https://lkdigital.odo.br" target="_blank" rel="noopener noreferrer">
          lkdigital.odo.br
        </a>
      </div>
    </div>
  );
}
