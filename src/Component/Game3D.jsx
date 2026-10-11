import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Play, Pause, RotateCcw, Cpu } from "lucide-react";

export default function Game3D() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);
  const [explored, setExplored] = useState(0);

  const handleStartGame = () => {
    setGameStarted(true);
    setIsGameActive(true);
    setScore(0);
    setLevel(1);
    setExplored(0);
    toast.success("3D Dunyo boshlandi! 🌌");
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
    setExplored(0);
    toast.info("O'yin qayta o'rnatildi");
  };

  const handleExplore = () => {
    if (isGameActive && gameStarted) {
      const newExplored = explored + 20;
      setExplored(Math.min(newExplored, 100));
      setScore(score + 15);
      toast.success("Yangi joy kashf etildi! +15 ball");
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-purple-500/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 hover:text-purple-400 transition"
          >
            <ArrowLeft size={24} />
            <span>Ortga</span>
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            🌌 3D Dunyo
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Darajа: {level}</p>
            <p className="text-lg font-bold text-purple-400">Ball: {score}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!gameStarted ? (
          // Introduction Screen
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[60vh]">
            <div>
              <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                Voxel City - 3D Eksploratsiya
              </h2>
              <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                3D dunyo bilan tanishing. Xayoliy shaharlar, kosmik yo'llar va sirli sayohatlar
                sizni kutmoqda. Yangi dunyoda kashfiyot qiling.
              </p>

              <div className="space-y-3 mb-6 bg-purple-900/30 p-4 rounded-lg border border-purple-500/30">
                <h3 className="text-xl font-bold text-purple-400">📋 O'yin qoidalari:</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>🧭 Arrow Keys - Harakat qil</li>
                  <li>🔍 Yangi joylarni kashf et</li>
                  <li>💎 Treasure toplan va ball oshir</li>
                  <li>🎯 100% dunyo kashf et</li>
                </ul>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-3 px-6 rounded-lg font-bold text-lg transition transform hover:scale-105"
              >
                <Play className="inline mr-2" size={20} />
                O'yinga Kirish
              </button>
            </div>

            <div className="bg-purple-900/20 border-2 border-purple-500/50 rounded-lg p-8 text-center">
              <div className="text-8xl mb-4 animate-spin" style={{ animation: "spin 3s linear infinite" }}>🌌</div>
              <p className="text-xl text-purple-300 font-semibold">
                Cheksiz 3D Dunyo
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Eksploratsiya va kashfiyotlar
              </p>
            </div>
          </div>
        ) : (
          // Game Screen
          <div className="space-y-6">
            {/* Exploration Progress */}
            <div className="bg-purple-900/40 border-2 border-purple-500/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Kashf etilgan: {explored}%</p>
              <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden border border-purple-400">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${explored}%` }}
                ></div>
              </div>
            </div>

            {/* Game Canvas */}
            <div className="bg-gradient-to-b from-purple-400/20 to-purple-900/40 border-2 border-purple-500/50 rounded-lg p-8 min-h-96 relative overflow-hidden">
              {isGameActive && (
                <>
                  <div className="absolute top-20 left-1/4 text-6xl animate-bounce">🧱</div>
                  <div className="absolute top-32 right-1/4 text-6xl">🏢</div>
                  <div className="absolute bottom-20 left-1/3 text-5xl animate-pulse">💎</div>
                  <div className="absolute bottom-32 right-1/3 text-5xl">🌳</div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl">👨</div>
                </>
              )}
              {!isGameActive && gameStarted && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-purple-300 mb-2">⏸️ PAUZA</h3>
                    <p className="text-gray-400">Davom ettirish uchun "Davom" tugmasini bosing</p>
                  </div>
                </div>
              )}
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Darajа</p>
                <p className="text-3xl font-bold text-purple-400">{level}</p>
              </div>
              <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Ball</p>
                <p className="text-3xl font-bold text-yellow-400">{score}</p>
              </div>
              <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-4 text-center">
                <Cpu className="inline text-purple-400 mb-2" size={24} />
                <p className="text-gray-400 text-sm">Kashf</p>
                <p className="text-xl font-bold text-green-400">{explored}%</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={handleExplore}
                disabled={!isGameActive}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                🔍 Kashf Et
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
                className="flex-1 bg-red-600 hover:bg-red-700 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
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