export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-6xl font-black mb-4">ToneBOX v1.8</h1>
      <p className="text-xl text-gray-400">Si ves esto, el App Router de Next.js finalmente está funcionando.</p>
      <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-400 font-mono">Status: Deployment Successful - System Live</p>
      </div>
    </div>
  );
}
