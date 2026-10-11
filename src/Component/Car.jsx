import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Play, Pause, RotateCcw, TrendingUp } from "lucide-react";

export default function Car() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);
  const [speed, setSpeed] = useState(0);

  const handleStartGame = () => {
    setGameStarted(true);
    setIsGameActive(true);
    setScore(0);
    setLevel(1);
    setSpeed(0);
    toast.success("Mashina poygasi boshlandi! 🏎️");
  };

  const handlePause = () => {
    setIsGameActive(!isGameActive);
    toast.info(isGameActive ? "Pauza" : "Davom");
  };

  const handleReset = () => {
    setGameStarted(false);
    setScore(0);
    setLevel(1);
    setIsGameActive(false);
    setSpeed(0);
    toast.info("O'yin qayta o'rnatildi");
  };

  const handleAccelerate = () => {
    if (isGameActive && gameStarted && speed < 200) {
      setSpeed(speed + 20);
      setScore(score + 5);
    }
  };

  const handleBrake = () => {
    if (speed > 0) {
      setSpeed(Math.max(0, speed - 20));
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-cyan-500/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 hover:text-cyan-400 transition"
          >
            <ArrowLeft size={24} />
            <span>Ortga</span>
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            🏎️ Mashina Poygasi
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Darajа: {level}</p>
            <p className="text-lg font-bold text-cyan-400">Ball: {score}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!gameStarted ? (
          // Introduction Screen
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[60vh]">
            <div>
              <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                Turbo Poyga
              </h2>
              <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                Mashina poygasida tezlikni boshqaring, egri yo'llarda muvozanatni saqlang,
                raqiblaringizni yutib, chempion bo'ling.
              </p>

              <div className="space-y-3 mb-6 bg-cyan-900/30 p-4 rounded-lg border border-cyan-500/30">
                <h3 className="text-xl font-bold text-cyan-400">📋 O'yin qoidalari:</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>⬆️ Gas - Tezlangiz</li>
                  <li>⬇️ Tormoz - Sekinlang</li>
                  <li>🛣️ Yo'lda qolib qolmang</li>
                  <li>🏁 Turli bosqichlarni yengib o'ting</li>
                </ul>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 py-3 px-6 rounded-lg font-bold text-lg transition transform hover:scale-105"
              >
                <Play className="inline mr-2" size={20} />
                O'yinga Kirish
              </button>
            </div>

            <div className="bg-cyan-900/20 border-2 border-cyan-500/50 rounded-lg p-8 text-center">
              <div className="text-8xl mb-4 animate-bounce">🏎️</div>
              <p className="text-xl text-cyan-300 font-semibold">
                Eng tezlar poyga
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Tezlik va manevrlar sinovi
              </p>
            </div>
          </div>
        ) : (
          // Game Screen
          <div className="space-y-6">
            {/* Speed Gauge */}
            <div className="bg-cyan-900/40 border-2 border-cyan-500/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Tezlik: {speed} km/h</p>
              <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden border border-cyan-400">
                <div
                  className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-full transition-all duration-300"
                  style={{ width: `${speed}%` }}
                ></div>
              </div>
            </div>

            {/* Game Canvas */}
            <div className="bg-gradient-to-b from-cyan-400/20 to-cyan-900/40 border-2 border-cyan-500/50 rounded-lg p-8 min-h-96 relative overflow-hidden">
              {isGameActive && (
                <>
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-6xl" style={{ animation: `pulse 0.3s ${speed > 0 ? 'infinite' : 'none'}` }}>🏎️</div>
                  <div className="absolute top-10 left-10 text-4xl text-gray-600">🚗</div>
                  <div className="absolute top-10 right-10 text-4xl text-gray-600">🚗</div>
                  <div className="absolute top-32 left-1/4 text-3xl text-yellow-600">🏁</div>
                  <div className="absolute top-32 right-1/4 text-3xl text-yellow-600">🏁</div>
                </>
              )}
              {!isGameActive && gameStarted && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-cyan-300 mb-2">⏸️ PAUZA</h3>
                    <p className="text-gray-400">Davom ettirish uchun "Davom" tugmasini bosing</p>
                  </div>
                </div>
              )}
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-cyan-900/40 border border-cyan-500/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Darajа</p>
                <p className="text-3xl font-bold text-cyan-400">{level}</p>
              </div>
              <div className="bg-cyan-900/40 border border-cyan-500/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Ball</p>
                <p className="text-3xl font-bold text-yellow-400">{score}</p>
              </div>
              <div className="bg-cyan-900/40 border border-cyan-500/30 rounded-lg p-4 text-center">
                <TrendingUp className="inline text-cyan-400 mb-2" size={24} />
                <p className="text-gray-400 text-sm">Tezlik</p>
                <p className="text-xl font-bold text-green-400">{speed} km/h</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={handleAccelerate}
                disabled={!isGameActive}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                ⬆️ Gas
              </button>
              <button
                onClick={handleBrake}
                disabled={!isGameActive}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                ⬇️ Tormoz
              </button>
              <button
                onClick={handlePause}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                {isGameActive ? <Pause size={20} /> : <Play size={20} />}
                {isGameActive ? "Pauza" : "Davom"}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                Qayta o'rnat
              </button>
              <button
                onClick={handleBack}
                className="flex-1 bg-slate-600 hover:bg-slate-700 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Ortga
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}