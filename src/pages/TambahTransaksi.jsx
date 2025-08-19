import React, { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { supabase } from "../SupabaseClient";

const calculateSuddenSpike = async (companyId, currentAmount, currentHour) => {
  // Fetch recent transactions (last 24 hours) for this company
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: recentTransactions, error } = await supabase
    .from("transaction")
    .select('"Transaction Amount", "Transaction Hour"')
    .eq("company_id", companyId)
    .order('"Transaction Hour"', { ascending: false })
    .limit(10); // Look at last 10 transactions

  if (error) {
    console.error("Error fetching recent transactions:", error);
    return false;
  }

  if (!recentTransactions || recentTransactions.length === 0) {
    return false; // No previous transactions to compare
  }

  // Calculate mean and standard deviation of recent transaction amounts
  const amounts = recentTransactions.map((t) => t["Transaction Amount"]);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length);

  // Calculate z-score for current transaction
  const zScore = (currentAmount - mean) / (stdDev || 1); // Avoid division by zero

  // Calculate time-based weight
  const hourDiffs = recentTransactions.map((t) => Math.abs(t["Transaction Hour"] - currentHour));
  const timeWeight = Math.min(...hourDiffs) <= 3 ? 1.5 : 1; // Higher weight for transactions close in time

  // Consider it a spike if:
  // 1. Z-score is high (transaction amount deviates significantly from mean)
  // 2. Time weight adjusts the threshold for temporal proximity
  return Math.abs(zScore) * timeWeight > 2.5; // Threshold of 2.5 standard deviations
};

export default function TambahTransaksi() {
  const location = useLocation();
  const navigate = useNavigate();
  const company = location.state?.company;
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setFileData(content);
    };

    reader.readAsText(file);
  };

  const processCSVData = async (csvData) => {
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    const processedRows = [];

    for (const row of results.data) {
      // Validate required fields - using actual CSV header names
      if (
        !row["Transaction Amount"] ||
        !row["Carbon Volume"] ||
        !row["Price per Ton"] ||
        !row["Origin Country"] ||
        !row["Buyer Industry"] ||
        !row["Entity Type"] ||
        row["Transaction Hour"] === undefined ||
        row["Cross-Border Flag"] === undefined
      ) {
        console.warn("Skipping row with missing required fields:", row);
        continue;
      }

      // Calculate if this is a sudden spike
      const transactionAmount = parseFloat(row["Transaction Amount"]);
      const transactionHour = parseInt(row["Transaction Hour"]);
      const isSpike = await calculateSuddenSpike(company.company_id, transactionAmount, transactionHour);

      // Prepare data for API
      const apiData = {
        "Transaction Amount": transactionAmount,
        "Carbon Volume": parseFloat(row["Carbon Volume"]),
        "Price per Ton": parseFloat(row["Price per Ton"]),
        "Origin Country": row["Origin Country"],
        "Cross-Border Flag": (row["Cross-Border Flag"] || "").toLowerCase() === "true",
        "Buyer Industry": row["Buyer Industry"],
        "Sudden Transaction Spike": isSpike,
        "Transaction Hour": transactionHour,
        "Entity Type": row["Entity Type"],
      };

      console.log(apiData);

      try {
        // Call prediction API
        const response = await fetch("https://backend-carbonwatch-204193890098.europe-west1.run.app/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        });

        const predictionResult = await response.json();
        const prediction = predictionResult.predictions[0];

        // Generate a random transaction ID
        const randomTransactionId = Math.floor(Math.random() * 1000000) + 1;

        // Generate current date in the required format
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const hours = String(currentDate.getHours()).padStart(2, "0");
        const minutes = String(currentDate.getMinutes()).padStart(2, "0");
        const seconds = String(currentDate.getSeconds()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        // Prepare data for Supabase
        const transactionData = {
          "Transaction Amount": apiData["Transaction Amount"],
          "Carbon Volume": apiData["Carbon Volume"],
          "Price per Ton": apiData["Price per Ton"],
          "Origin Country": apiData["Origin Country"],
          "Cross-Border Flag": apiData["Cross-Border Flag"],
          "Buyer Industry": apiData["Buyer Industry"],
          "Sudden Transaction Spike": isSpike,
          "Transaction Hour": apiData["Transaction Hour"],
          "Entity Type": apiData["Entity Type"],
          Date: formattedDate,
          Label: prediction.label,
          company_id: company.company_id, // Keep this for relationship
          transaction_id: randomTransactionId, // Use random ID instead of prediction ID
        };

        // Insert into Supabase
        const { data: insertedTransaction, error: transactionError } = await supabase
          .from("transaction")
          .insert(transactionData)
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Prepare and insert transaction_detail data
        const transactionDetailData = {
          transaction_id: randomTransactionId,
          verify_status: false,
          ai_summary: prediction.explanation.ai_summary,
          technical_reasons: prediction.explanation.technical_reasons  // This is an array of strings
        };

        const { error: detailError } = await supabase.from("transaction_detail").insert(transactionDetailData);

        if (detailError) throw detailError;

        processedRows.push(transactionData);
      } catch (error) {
        console.error("Error processing row:", error);
        alert(`Error processing transaction: ${error.message}`);
      }
    }

    return processedRows;
  };

  const handleSubmit = async () => {
    if (!fileData) {
      alert("Mohon unggah file terlebih dahulu!");
      return;
    }

    if (!company) {
      alert("Data perusahaan tidak ditemukan!");
      return;
    }

    setIsProcessing(true);
    try {
      const processedData = await processCSVData(fileData);
      alert(`${processedData.length} transaksi berhasil diproses!`);
      window.history.back();
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat memproses file!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-10">
        <h1
          className="text-2xl font-bold text-violet-600 tracking-tight cursor-pointer hover:text-violet-700 transition-colors"
          onClick={() => navigate("/")}
        >
          carbonwatch
        </h1>
      </header>

      {/* Main Content */}
      <main className="px-6 py-10 max-w-7xl mx-auto space-y-6">
        {/* Sub-header */}
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center gap-4">
          <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800 text-xl">
            ←
          </button>
          <h2 className="text-lg font-semibold">Tambah Transaksi</h2>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow px-6 py-6">
          <h3 className="text-md font-semibold mb-4">Tambah Transaksi Perusahaan</h3>

          <label className="block text-sm text-gray-600 mb-1">Unggah File</label>

          <label className="relative flex items-center w-full bg-gray-100 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-200">
            <span className="text-gray-500 flex-1 truncate">{fileName || "Unggah Data Transaksi"}</span>
            <FiUploadCloud className="text-xl text-gray-500" />
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`mt-6 w-full py-3 ${
              isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white text-sm font-semibold rounded-full transition flex items-center justify-center gap-2`}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Memproses...
              </>
            ) : (
              "Tambah Transaksi"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
