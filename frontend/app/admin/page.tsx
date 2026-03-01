import React from 'react';

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-100 p-8 text-slate-900">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold text-blue-600 mb-4">
                    Panel de Control: Tintas y Toners 🖨️
                </h1>
                <p className="text-slate-600 mb-6">
                    Bienvenido, Iván. Aquí podrás gestionar tu SaaS en "Piloto Automático".
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-blue-200 p-4 rounded-md bg-blue-50">
                        <h2 className="font-semibold text-lg text-slate-800">Pedidos Pendientes</h2>
                        <p className="text-2xl font-bold text-blue-700">0</p>
                    </div>
                    <div className="border border-green-200 p-4 rounded-md bg-green-50">
                        <h2 className="font-semibold text-lg text-slate-800">Leads de Marketing</h2>
                        <p className="text-2xl font-bold text-green-700">Activo</p>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="text-sm text-yellow-800">
                        <strong>Estado:</strong> La fábrica está lista para recibir tus primeras configuraciones de productos.
                    </p>
                </div>
            </div>
        </div>
    );
}