/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'avatars.githubusercontent.com',
      'tonebox.mx',
      'www.tonebox.mx',
      'ctonline.mx',
      'connect.ctonline.mx',
      'images.ctonline.mx',
      'xlfbdxyzlfzjqykznnob.supabase.co',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
