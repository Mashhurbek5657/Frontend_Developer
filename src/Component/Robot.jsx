import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Play, Pause, RotateCcw, Zap } from "lucide-react";

export default function Robot() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);
  const [health, setHealth] = useState(100);

  const handleStartGame = () => {
    setGameStarted(true);
    setIsGameActive(true);
    setScore(0);
    setLevel(1);
    setHealth(100);
    toast.success("Robot jangari boshlandi! 🤖");
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
    setHealth(100);
    toast.info("O'yin qayta o'rnatildi");
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleAttack = () => {
    if (isGameActive && gameStarted) {
      setScore(score + 10);
      toast.success("Zarba berdi! +10 ball");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-red-500/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 hover:text-red-400 transition"
          >
            <ArrowLeft size={24} />
            <span>Ortga</span>
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">
            🤖 Robot Jangari
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Darajа: {level}</p>
            <p className="text-lg font-bold text-red-400">Ball: {score}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!gameStarted ? (
          // Introduction Screen
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[60vh]">
            <div>
              <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">
                Robot Arena Jangari
              </h2>
              <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                Robotlar bilan jang qiling, qurollaringizni yangilang va arena g'olibi bo'ling.
                Har bir daraja qiyinlashadi, shuning uchun ehtiyotkor bo'ling.
              </p>

              <div className="space-y-3 mb-6 bg-red-900/30 p-4 rounded-lg border border-red-500/30">
                <h3 className="text-xl font-bold text-red-400">📋 O'yin qoidalari:</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>⚔️ Space - Zarba ber</li>
                  <li>🛡️ Dushman zarbasidan qochib chiq</li>
                  <li>💪 Kuch qattasini topib ol</li>
                  <li>🏆 5-bosqichdagi boss robotni yeng</li>
                </ul>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 py-3 px-6 rounded-lg font-bold text-lg transition transform hover:scale-105"
              >
                <Play className="inline mr-2" size={20} />
                O'yinga Kirish
              </button>
            </div>

            <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-8 text-center">
              <div className="text-8xl mb-4 animate-pulse">🤖</div>
              <p className="text-xl text-red-300 font-semibold">
                Eng qattiq janglar
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Kuch va zeriklik sinovi
              </p>
            </div>
          </div>
        ) : (
          // Game Screen
          <div className="space-y-6">
            {/* Health Bar */}
            <div className="bg-red-900/40 border-2 border-red-500/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Sog'lig'i: {health}%</p>
              <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden border border-red-400">
                <div
                  className="bg-gradient-to-r from-green-500 to-red-500 h-full transition-all duration-300"
                  style={{ width: `${health}%` }}
                ></div>
              </div>
            </div>

            {/* Game Canvas */}
            <div className="bg-gradient-to-b from-red-400/20 to-red-900/40 border-2 border-red-500/50 rounded-lg p-8 min-h-96 relative overflow-hidden">
              {isGameActive && (
                <>
                  <div className="absolute top-20 left-1/4 text-7xl animate-pulse">🤖</div>
                  <div className="absolute top-20 right-1/4 text-7xl animate-bounce">🤖</div>
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-6xl">⚡</div>
                </>
              )}
              {!isGameActive && gameStarted && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-red-300 mb-2">⏸️ PAUZA</h3>
                    <p className="text-gray-400">Davom ettirish uchun "Davom" tugmasini bosing</p>
                  </div>
                </div>
              )}
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Darajа</p>
                <p className="text-3xl font-bold text-red-400">{level}</p>
              </div>
              <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Ball</p>
                <p className="text-3xl font-bold text-yellow-400">{score}</p>
              </div>
              <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Sog'lig'i</p>
                <p className="text-xl font-bold text-green-400">{health}%</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={handleAttack}
                disabled={!isGameActive}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-3 px-6 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                Zarba Ber
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