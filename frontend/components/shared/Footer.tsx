import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-xl text-white tracking-tight">ToneBOX</span>
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
                className="text-primary-400 hover:text-white font-medium transition-colors duration-200 border-b border-transparent hover:border-primary-400"
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
