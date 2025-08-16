import React from 'react';
import { FiEdit3 } from 'react-icons/fi';
import { IoChevronBack } from 'react-icons/io5';
import { useLocation } from 'react-router-dom';

export default function DetailTransaksi() {
  const location = useLocation();
  const { transaction } = location.state || {};

  if (!transaction) {
    return <div className="p-8 text-center">No transaction data available</div>;
  }

  const statusColor = {
    Normal: 'bg-green-500',
    Suspicious: 'bg-orange-500',
    'Red-Flagged': 'bg-red-500',
  };

  const suspiciousNotes = [
    'Melakukan transaksi di luar jam kerja normal',
    'Volume transaksi tidak proporsional dengan profil industri',
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-violet-600 tracking-tight">carbonwatch</h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Title + Status + Back */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800 text-xl">
                ←
            </button>
            <div>
              <h2 className="text-xl font-semibold mb-1">Laporan Detail Transaksi</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{transaction.id}</span>
                <span className={`text-white text-xs px-2 py-1 rounded ${
                  transaction.label === 'Suspicious' ? statusColor.Suspicious :
                  transaction.label === 'High-Risk' ? statusColor['Red-Flagged'] :
                  statusColor.Normal
                }`}>
                  {transaction.label || 'Normal'}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2 md:mt-0">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium">
              Validasi
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium">
              Invalid
            </button>
          </div>
        </div>

        {/* Detail Box */}
        <div className="bg-white rounded-xl p-6 text-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div><span className="text-gray-500">ID Transaksi</span><br />{transaction.transaction_id}</div>
            <div className="mt-4"><span className="text-gray-500">Tanggal & Waktu</span><br />2025-08-16</div>
            <div className="mt-4"><span className="text-gray-500">Origin Country</span><br />{transaction.origin_country}</div>
            <div className="mt-4"><span className="text-gray-500">Entity Type</span><br />{transaction.entity_type}</div>
          </div>
          <div>
            <div><span className="text-gray-500">Carbon Volume (Ton)</span><br />{transaction.carbon_volume}</div>
            <div className="mt-4"><span className="text-gray-500">Transaction Amount (USD)</span><br />{transaction.transaction_amount}</div>
            <div className="mt-4"><span className="text-gray-500">Price per Ton (USD)</span><br />{transaction.price_per_ton}</div>
            <div className="mt-4"><span className="text-gray-500">Buyer Industry</span><br />{transaction.buyer_industry}</div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-white rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xl">⚡</div>
            <div>
              <p className="text-sm text-gray-500">Mendeteksi pola transaksi yang tidak wajar</p>
              <p className="font-semibold">Petunjuk AI</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Telah mendeteksi potensi transaksi mencurigakan pada transaksi <strong>ID {transaction.id}</strong>
          </p>

          <div className="flex flex-col gap-2 mt-3">
            {suspiciousNotes.map((note, i) => (
              <span
                key={i}
                className={`inline-block px-4 py-2 rounded text-xs font-medium ${
                  i === 0 ? 'bg-pink-100 text-pink-600' : 'bg-orange-100 text-orange-600'
                }`}
              >
                {note}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}