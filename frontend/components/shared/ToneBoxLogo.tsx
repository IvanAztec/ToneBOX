interface Props {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: 32, inner: 11, dot: 14, dotOff: -6, text: 18, r: 7, bw: 2 },
  md: { box: 40, inner: 14, dot: 18, dotOff: -7, text: 24, r: 9, bw: 2.5 },
  lg: { box: 64, inner: 22, dot: 26, dotOff: -10, text: 38, r: 14, bw: 4 },
};

export default function ToneBoxLogo({ size = 'md', showTagline = false, className = '' }: Props) {
  const c = SIZES[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Mark: box + inner square + pulsing dot */}
      <div className="relative flex-shrink-0">
        <div
          style={{
            width: c.box,
            height: c.box,
            border: `${c.bw}px solid white`,
            borderRadius: c.r,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: c.inner,
              height: c.inner,
              background: 'white',
              opacity: 0.85,
              borderRadius: 3,
            }}
          />
        </div>
        <div
          className="animate-pulse-dot absolute rounded-full bg-[#00C896] border-2 border-[#0B0E14]"
          style={{ width: c.dot, height: c.dot, top: c.dotOff, right: c.dotOff }}
        />
      </div>

      {/* Wordmark */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-syne, Syne, sans-serif)',
            fontWeight: 800,
            fontSize: c.text,
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          Tone<span style={{ color: '#00C896' }}>Box</span>
        </div>
        {showTagline && (
          <div
            style={{
              fontSize: 10,
              opacity: 0.45,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            Tu oficina · Siempre lista
          </div>
        )}
      </div>
    </div>
  );
}
