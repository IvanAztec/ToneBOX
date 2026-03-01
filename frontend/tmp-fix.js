const fs = require('fs');
const files = [
  'd:/Antigravity/Testing/Proyectos/tintas-y-toners/frontend/app/admin/inventory/page.tsx',
  'd:/Antigravity/Testing/Proyectos/tintas-y-toners/frontend/app/admin/campanas/page.tsx',
  'd:/Antigravity/Testing/Proyectos/tintas-y-toners/frontend/app/dashboard/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix outer headers directly on dark background
  content = content.replace(/className=\"text-2xl font-bold text-gray-900 flex items-center/, 'className="text-2xl font-bold text-white flex items-center');
  content = content.replace(/className=\"text-sm text-gray-500 mt-0\.5\"/, 'className="text-sm text-slate-400 mt-0.5"');
  content = content.replace(/className=\"w-4 h-4 text-gray-500\"/g, 'className="w-4 h-4 text-slate-100"'); // Button icons on dark

  if (file.includes('dashboard')) {
    content = content.replace(/text-2xl font-bold text-gray-900/g, 'text-2xl font-bold text-white');
    content = content.replace(/text-gray-600 mt-1/, 'text-slate-300 mt-1');
  }

  if (file.includes('campanas')) {
    content = content.replace(/text-2xl font-black text-gray-900 flex items-center/, 'text-2xl font-black text-white flex items-center');
    content = content.replace(/className=\"text-sm text-gray-500 mt-0\.5\"/, 'className="text-sm text-slate-400 mt-0.5"');
  }
  
  if (file.includes('inventory')) {
    content = content.replace(/<ArrowLeft className=\"w-4 h-4 text-gray-500\"/, '<ArrowLeft className="w-4 h-4 text-slate-400"');
  }

  // Replace all other gray occurrences to slate for better contrast on the light cards
  content = content.replace(/text-gray-900/g, 'text-slate-900');
  content = content.replace(/text-gray-800/g, 'text-slate-800');
  content = content.replace(/text-gray-700/g, 'text-slate-700');
  content = content.replace(/text-gray-600/g, 'text-slate-600');
  content = content.replace(/text-gray-500/g, 'text-slate-500');
  content = content.replace(/text-gray-400/g, 'text-slate-400');
  content = content.replace(/text-gray-300/g, 'text-slate-300');
  content = content.replace(/text-gray-200/g, 'text-slate-200');
  
  content = content.replace(/bg-gray-50/g, 'bg-slate-50');
  content = content.replace(/bg-gray-100/g, 'bg-slate-100');
  content = content.replace(/bg-gray-900/g, 'bg-slate-900');
  content = content.replace(/border-gray-100/g, 'border-slate-200');
  content = content.replace(/border-gray-200/g, 'border-slate-300');
  content = content.replace(/divide-gray-50/g, 'divide-slate-100');
  content = content.replace(/divide-gray-100/g, 'divide-slate-200');

  // Also replace DashboardLayout's colors if we haven't linked sellers, but let's stick to these pages first
  fs.writeFileSync(file, content);
});
console.log('Done replacing colors.');
