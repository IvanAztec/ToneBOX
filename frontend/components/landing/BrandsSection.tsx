'use client';

const BRANDS = ['HP', 'Brother', 'Canon', 'Epson', 'Xerox', 'Samsung', 'Kyocera', 'Lexmark', 'Sharp', 'Ricoh'];

export default function BrandsSection() {
  return (
    <section className="py-20 max-w-[1160px] mx-auto px-8" id="consumibles">
      <div className="font-mono text-[10px] tracking-[3px] uppercase mb-3" style={{ color: '#00C896' }}>
        // Consumibles Originales y Compatibles
      </div>
      <h2
        className="font-syne mb-4"
        style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.1 }}
      >
        Todas las marcas.<br />Un solo proveedor.
      </h2>
      <p className="mb-10" style={{ fontSize: 16, color: '#7A8494', lineHeight: 1.7, maxWidth: 520 }}>
        Toners, tintas y drums compatibles Premium certificados ISO 9001. El mismo rendimiento que el original, hasta 60% más barato.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {BRANDS.map(brand => (
          <div
            key={brand}
            className="text-center font-syne font-bold transition-all cursor-default"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '16px 12px',
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = 'rgba(0,200,150,0.3)';
              el.style.color = 'white';
              el.style.background = 'rgba(0,200,150,0.05)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = 'rgba(255,255,255,0.08)';
              el.style.color = 'rgba(255,255,255,0.5)';
              el.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            {brand}
          </div>
        ))}
      </div>
    </section>
  );
}
