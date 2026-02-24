const ITEMS = [
  '🚚 Envío Express Nacional',
  '🛡️ Garantía Total de Cambio',
  '📄 Facturación CFDI Inmediata',
  '💳 Pago Seguro Stripe + PayPal',
  '📍 Recoge Gratis en +44 Ciudades',
  '⚡ Compatibles ISO 9001 Certificados',
];

// Duplicated for seamless infinite loop
const FULL = [...ITEMS, ...ITEMS];

export default function TickerBar() {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: '#00C896',
        color: '#0B0E14',
        padding: '10px 0',
        fontFamily: 'var(--font-space-mono, monospace)',
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <div className="animate-ticker inline-flex">
        {FULL.map((item, i) => (
          <span key={i} style={{ padding: '0 32px' }}>
            {item}
            {i < FULL.length - 1 && (
              <span style={{ opacity: 0.4, marginLeft: 32 }}>·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
