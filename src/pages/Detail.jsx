import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../SupabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as LineTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
} from "recharts";

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const statusColors = {
    Normal: "text-green-600",
    Suspicious: "text-orange-500",
    "Red-Flag": "text-red-600",
  };

  const CATEGORY_COLORS = ["#00C49F", "#FF9800", "#FF4D4F"];

  useEffect(() => {
    const fetchData = async () => {
      const cleanId = id.startsWith("id=") ? id.substring(3) : id;
      const { data: companyData } = await supabase.from("company").select("*").eq("company_id", cleanId).single();

      const { data: transactionData } = await supabase.from("transaction").select("*").eq("company_id", cleanId);

      setCompany(companyData);
      setTransactions(transactionData);
    };
    fetchData();
  }, [id]);

  const countByStatus = () => {
    const count = { Normal: 0, Suspicious: 0, "Red-Flag": 0 };
    transactions.forEach((tx) => {
      const label = tx["Label"] || "Normal";
      if (count[label] !== undefined) {
        count[label]++;
      }
    });
    return [
      { name: "Normal", value: count.Normal },
      { name: "Suspicious", value: count.Suspicious },
      { name: "Red-Flag", value: count["Red-Flag"] },
    ];
  };

  const getMonthlySuspiciousTrend = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Initialize data array with zero counts
    const monthlyData = months.map((month) => ({
      month,
      suspicious: 0,
      redFlag: 0,
    }));

    // Count transactions for each month
    transactions.forEach((t) => {
      // Use the Date column if available, fallback to current date
      const transactionDate = t.Date || "2025-08-16 00:00:00";
      const monthIndex = new Date(transactionDate).getMonth();

      if (t["Label"] === "Suspicious") {
        monthlyData[monthIndex].suspicious++;
      } else if (t["Label"] === "Red-Flag") {
        monthlyData[monthIndex].redFlag++;
      }
    });

    return monthlyData;
  };

  const detectAnomalousPatterns = () => {
    const patterns = [];

    if (transactions.length === 0) return patterns;

    // Filter only suspicious and red-flag transactions
    const suspiciousTransactions = transactions.filter((t) => t["Label"] === "Suspicious" || t["Label"] === "Red-Flag");

    if (suspiciousTransactions.length === 0) return patterns;

    // 1. Check for off-hours trading (assuming business hours are 8-18)
    const offHoursTransactions = suspiciousTransactions.filter((t) => {
      const hour = t["Transaction Hour"];
      return hour < 8 || hour > 18;
    });

    if (offHoursTransactions.length > 0) {
      const percentage = ((offHoursTransactions.length / suspiciousTransactions.length) * 100).toFixed(1);
      patterns.push({
        type: "off-hours",
        message: `${percentage}% transaksi mencurigakan dilakukan di luar jam kerja normal (${offHoursTransactions.length} dari ${suspiciousTransactions.length})`,
        color: "bg-pink-100 text-pink-600",
      });
    }

    // 2. Check for disproportionate volume vs industry
    const totalVolume = suspiciousTransactions.reduce((sum, t) => sum + parseFloat(t["Carbon Volume"] || 0), 0);
    const avgVolume = totalVolume / suspiciousTransactions.length;
    const largeVolumeTransactions = suspiciousTransactions.filter(
      (t) => parseFloat(t["Carbon Volume"] || 0) > avgVolume * 3
    );

    if (largeVolumeTransactions.length > 0) {
      patterns.push({
        type: "volume-anomaly",
        message: `${largeVolumeTransactions.length} transaksi mencurigakan memiliki volume tidak proporsional (>3x rata-rata)`,
        color: "bg-orange-100 text-orange-600",
      });
    }

    // 3. Check for unusual price patterns
    const prices = suspiciousTransactions.map((t) => parseFloat(t["Price per Ton"] || 0)).filter((p) => p > 0);
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const stdDev = Math.sqrt(prices.reduce((sq, n) => sq + Math.pow(n - avgPrice, 2), 0) / prices.length);

      const unusualPriceTransactions = suspiciousTransactions.filter((t) => {
        const price = parseFloat(t["Price per Ton"] || 0);
        return Math.abs(price - avgPrice) > stdDev * 2;
      });

      if (unusualPriceTransactions.length > 0) {
        patterns.push({
          type: "price-anomaly",
          message: `${unusualPriceTransactions.length} transaksi mencurigakan memiliki harga tidak wajar (deviasi >2σ)`,
          color: "bg-purple-100 text-purple-600",
        });
      }
    }

    // 4. Check for cross-border transaction patterns
    const crossBorderTransactions = suspiciousTransactions.filter((t) => t["Cross-Border Flag"] === true);
    if (crossBorderTransactions.length > suspiciousTransactions.length * 0.7) {
      patterns.push({
        type: "cross-border",
        message: `Mayoritas transaksi mencurigakan lintas negara (${crossBorderTransactions.length} dari ${suspiciousTransactions.length})`,
        color: "bg-blue-100 text-blue-600",
      });
    }

    // 5. Check for sudden transaction spikes
    const spikeTransactions = suspiciousTransactions.filter((t) => t["Sudden Transaction Spike"] === true);
    if (spikeTransactions.length > 0) {
      patterns.push({
        type: "transaction-spike",
        message: `${spikeTransactions.length} transaksi mencurigakan terdeteksi sebagai lonjakan mendadak`,
        color: "bg-red-100 text-red-600",
      });
    }

    return patterns.slice(0, 4); // Limit to 4 most important patterns
  };

  if (!company) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-10">
        <h1
          className="text-2xl font-bold text-violet-600 tracking-tight cursor-pointer hover:text-violet-700 transition-colors"
          onClick={() => navigate("/")}
        >
          carbonwatch
        </h1>
      </header>

      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-7xl space-y-10">
          <div className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4">
              <img src={company.gambar} alt="logo" className="w-16 h-16 object-contain rounded" />
              <h2 className="text-xl font-bold text-gray-900">{company.nama_perusahaan}</h2>
            </div>

            <div className="text-sm text-gray-700 space-y-1">
              <div>
                <span className="font-semibold">ID Perusahaan:</span> {company.company_id}
              </div>
              <div>
                <span className="font-semibold">Sektor:</span> {company.sector}
              </div>
              <div>
                <span className="font-semibold">NPWP:</span> {company.npwp}
              </div>
            </div>

            <div className="text-sm text-gray-700 space-y-1">
              <div>
                <span className="font-semibold">Alamat:</span> {company.address}
              </div>
              <div>
                <span className="font-semibold">Situs Web:</span>{" "}
                <a href={company.website} className="text-blue-600 hover:underline">
                  {company.website}
                </a>
              </div>
              <div>
                <span className="font-semibold">Kontak:</span> {company.contact}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-6 h-64 flex flex-col">
              <h3 className="font-semibold mb-2">Tren Transaksi Mencurigakan dan Berisiko Tinggi</h3>
              <div className="flex-1 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMonthlySuspiciousTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Line type="monotone" dataKey="suspicious" stroke="#FFB547" strokeWidth={2} name="Suspicious" />
                    <Line type="monotone" dataKey="redFlag" stroke="#FF4842" strokeWidth={2} name="Red Flag" />
                    <LineTooltip />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 h-64 flex flex-col">
              <h3 className="font-semibold mb-2">Distribusi Transaksi Berdasarkan Kategori</h3>
              <div className="flex-1 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countByStatus()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      label
                    >
                      {countByStatus().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index]} />
                      ))}
                    </Pie>
                    <PieTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 h-64">
              <h3 className="font-semibold mb-2">Pola Transaksi Tidak Wajar yang Terdeteksi</h3>
              <div className="space-y-2 text-sm overflow-y-auto max-h-48">
                {detectAnomalousPatterns().length > 0 ? (
                  detectAnomalousPatterns().map((pattern, index) => (
                    <li key={index} className={`${pattern.color} px-4 py-2 rounded list-none`}>
                      {pattern.message}
                    </li>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    <div className="text-green-600 font-medium">✓ Tidak ada pola mencurigakan terdeteksi</div>
                    <div className="text-xs mt-1">
                      Tidak ada transaksi Suspicious atau Red-Flag dengan pola yang tidak wajar
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-100">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="text-lg font-semibold">Daftar Transaksi</h3>
              <button
                onClick={() => navigate("/tambah-transaksi", { state: { company } })}
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                + Tambah Transaksi
              </button>
            </div>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Transaction Amount (USD)</th>
                  <th className="px-6 py-3">Carbon Volume (Ton)</th>
                  <th className="px-6 py-3">Price per Ton (USD)</th>
                  <th className="px-6 py-3">Origin Country</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.transaction_id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() =>
                      navigate(`/detail-transaksi`, {
                        state: {
                          transaction: {
                            ...t,
                            company: company,
                          },
                        },
                      })
                    }
                  >
                    <td className="px-6 py-4">{t.transaction_id}</td>
                    <td className="px-6 py-4">{t.Date ? t.Date.slice(0, 10) : "2025-08-16"}</td>
                    <td className="px-6 py-4">${parseFloat(t["Transaction Amount"] || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">{parseFloat(t["Carbon Volume"] || 0).toLocaleString()} Ton</td>
                    <td className="px-6 py-4">${parseFloat(t["Price per Ton"] || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">{t["Origin Country"]}</td>
                    <td
                      className={`px-6 py-4 font-medium ${
                        t["Label"] === "Suspicious"
                          ? "text-yellow-500"
                          : t["Label"] === "Red-Flag"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {t["Label"] || "Normal"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
