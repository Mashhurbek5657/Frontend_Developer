import { useNavigate } from "react-router-dom";
import { Play, Zap, Trophy, Target, Star, Gamepad2, Sparkles, TrendingUp } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const games = [
    {
      id: "vertalyot",
      name: "Vertalyot",
      emoji: "🚁",
      description: "Osmon bo'ylab uchib, to'siqlarni yengib o'ting.",
      color: "from-purple-500 to-pink-600",
      borderColor: "border-purple-500/50",
      players: "12.5K"
    },
    {
      id: "robot",
      name: "Robot",
      emoji: "🤖",
      description: "Robotlar bilan jang qiling va darajalarni yengib o'ting.",
      color: "from-red-500 to-orange-600",
      borderColor: "border-red-500/50",
      players: "8.3K"
    },
    {
      id: "car",
      name: "Mashina",
      emoji: "🏎️",
      description: "Tezkor poyga va mashina boshqaruvini sinab ko'ring.",
      color: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-500/50",
      players: "15.8K"
    },
    {
      id: "3d",
      name: "3D O'yinlar",
      emoji: "🕹️",
      description: "3D dunyoda yangi dunyo va quvnoq vaqtiyatni kashf eting.",
      color: "from-purple-600 to-indigo-600",
      borderColor: "border-purple-500/50",
      players: "9.1K"
    }
  ];

  const handlePlayGame = (gameId) => {
    navigate(`/games/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Header */}
          <div className="text-center mb-16 space-y-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Eng yangi o'yinlar</span>
              </div>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-600 to-blue-600">
                🎮 O'YIN
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-600">
                DUNYOSI
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Eng qiziqarli arcade va action o'yinlar shu yerda. Hazorlab o'yinchilarga qo'shiling va yuqori baholarga erishib ko'ring!
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <Gamepad2 size={20} className="text-cyan-400" />
                <span className="text-sm text-gray-300">45K+ o'yinchilari</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <TrendingUp size={20} className="text-green-400" />
                <span className="text-sm text-gray-300">Har kuni yangi</span>
              </div>
            </div>
          </div>

          {/* Featured Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {games.map((game, index) => (
              <div
                key={game.id}
                className="group relative overflow-hidden rounded-2xl border transition-all duration-500 transform hover:scale-105 hover:shadow-2xl"
                style={{
                  borderColor: game.borderColor,
                  animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                {/* Animated Border Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" style={{animation: 'shimmer 2s infinite'}}></div>

                {/* Content */}
                <div className="relative h-72 flex flex-col items-center justify-between p-6 text-center">
                  <div>
                    <div className="text-7xl mb-4 group-hover:scale-125 transition-transform duration-300 inline-block">
                      {game.emoji}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-600 transition-all">
                      {game.name}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 group-hover:text-gray-300 transition-colors">
                      {game.description}
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <User size={14} />
                      <span>{game.players} faol o'yinchi</span>
                    </div>
                    <button
                      onClick={() => handlePlayGame(game.id)}
                      className={`w-full bg-gradient-to-r ${game.color} hover:shadow-lg py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-110 active:scale-95 text-white shadow-lg`}
                    >
                      <Play size={18} />
                      O'yinga Kirish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
            {[
              { icon: Gamepad2, label: "Faol O'yinlar", value: "4" },
              { icon: Trophy, label: "Yuqori Balllar", value: "1000+" },
              { icon: Star, label: "O'yinchilari", value: "45K+" },
              { icon: Zap, label: "Eng Tezlar", value: "Avg 2.3s" }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-white/20 transition-all group">
                  <Icon className="w-8 h-8 mx-auto mb-3 text-cyan-400 group-hover:text-pink-400 transition-colors" />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-gradient-to-br from-purple-900/40 to-transparent border border-purple-500/30 rounded-2xl p-8 hover:border-purple-400 transition group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Tez va Qiziqarli</h3>
              <p className="text-gray-400 leading-relaxed">
                Har bir o'yin tezligini sinab, hayajonli daqiqalarni boshdan kechiring. Cheksiz quvnoq va o'yin tajribasi!
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-900/40 to-transparent border border-pink-500/30 rounded-2xl p-8 hover:border-pink-400 transition group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                🏆
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Rekord O'rnating</h3>
              <p className="text-gray-400 leading-relaxed">
                Eng yuqori ballni yig'ing va leaderboard da eng yuqori joyga o'ting. Boshqalardan ustun chiqing!
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/40 to-transparent border border-cyan-500/30 rounded-2xl p-8 hover:border-cyan-400 transition group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Turli Darajalar</h3>
              <p className="text-gray-400 leading-relaxed">
                Oson boshlang, qiyinroq bosqichlarni yengib o'ting. Har bir daraja yangi challanjadir!
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-900/40 via-transparent to-blue-900/40 border border-white/10 rounded-2xl p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Siz nimani kutmoqdasiz?
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              O'yinlardan birini tanlang va eng yaxshi o'yin tajribasini boshlang!
            </p>
            <button
              onClick={() => {
                document.querySelector('.grid').scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-4 px-8 rounded-lg font-bold text-lg flex items-center justify-center gap-2 mx-auto transition-all transform hover:scale-105 shadow-lg"
            >
              <Gamepad2 size={24} />
              O'yinga Boshlash
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function User({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}