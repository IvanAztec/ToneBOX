import Link from 'next/link';
import ToneBoxLogo from './ToneBoxLogo';

const NAV_PRODUCTS = [
  { label: 'Combos PYME',          href: '#combos' },
  { label: 'Toners Compatibles',   href: '#consumibles' },
  { label: 'Tintas',               href: '#consumibles' },
  { label: 'Duo Packs',            href: '#combos' },
];

const NAV_COMPANY = [
  { label: 'Nosotros',            href: '#' },
  { label: 'Sucursales',          href: '#logistica' },
  { label: 'Facturación CFDI',    href: '#' },
  { label: 'Garantías',           href: '#' },
];

const NAV_CONTACT = [
  { label: 'WhatsApp',            href: 'https://wa.me/528441628536' },
  { label: 'hola@tonebox.mx',     href: 'mailto:hola@tonebox.mx' },
  { label: 'Saltillo, Coahuila',  href: '#' },
];

const TECH_TAGS = ['Next.js 14', 'Supabase', 'Stripe + SPEI', 'Red Nacional'];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: '#161B26', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 0 32px' }}>
      <div className="max-w-[1160px] mx-auto px-8">

        {/* 4-column grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <ToneBoxLogo showTagline />
            <p style={{ fontSize: 13, color: '#7A8494', lineHeight: 1.6, marginTop: 16, maxWidth: 260 }}>
              Consumibles e impresoras para PYMES. Entrega en +44 ciudades de México. Ahorro garantizado desde el primer pedido.
            </p>
          </div>

          {/* Productos */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Productos
            </h4>
            {NAV_PRODUCTS.map(l => (
              <a key={l.label} href={l.href} className="block mb-2.5 transition-colors hover:text-white" style={{ fontSize: 13, color: '#7A8494' }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Empresa
            </h4>
            {NAV_COMPANY.map(l => (
              <a key={l.label} href={l.href} className="block mb-2.5 transition-colors hover:text-white" style={{ fontSize: 13, color: '#7A8494' }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Contacto
            </h4>
            {NAV_CONTACT.map(l => (
              <a key={l.label} href={l.href} className="block mb-2.5 transition-colors hover:text-white" style={{ fontSize: 13, color: '#7A8494' }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-wrap justify-between items-center gap-3 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            © {year} ToneBox. Todos los derechos reservados.{' '}
            <Link href="https://aztecstudio.net" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Aztec Studio.Net
            </Link>
          </p>
          <div className="flex gap-2 flex-wrap">
            {TECH_TAGS.map(t => (
              <span
                key={t}
                className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-1 rounded"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
