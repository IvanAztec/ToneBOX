import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              ToneBOX <span className="text-green-400 font-black">v2.0</span>
            </span>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-sm md:text-base text-center md:text-right">
              © {currentYear} ToneBOX.
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 flex-wrap justify-center md:justify-end">
              <span>Hecho y diseñado con</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <span>por</span>
              <Link
                href="https://aztecstudio.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-white font-medium transition-colors duration-200 border-b border-transparent hover:border-green-400"
              >
                Aztec Studio.Net.
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest">
            SaaS Factory OS v3
          </p>
        </div>
      </div>
    </footer>
  );
}
