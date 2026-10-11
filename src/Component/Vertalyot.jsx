import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Stars,
  Float,
  Text,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Crosshair,
  Shield,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

/* =========================================================
   3D VERTALYOT
========================================================= */

function Samalyot({ position, rotation, active }) {
  const group = useRef();
  const rotor = useRef();

  useFrame((_, delta) => {
    if (!group.current) return;

    group.current.position.y =
      position[1] + Math.sin(Date.now() * 0.002) * 0.12;

    if (rotor.current) {
      rotor.current.rotation.y += delta * 25;
    }
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={active ? 1 : 0.85}
    >
      {/* Asosiy korpus */}
      <mesh castShadow>
        <sphereGeometry args={[1.1, 24, 16]} />
        <meshStandardMaterial
          color="#172554"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Kabina */}
      <mesh position={[0, 0.35, -0.75]} castShadow>
        <sphereGeometry args={[0.65, 24, 16]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#083344"
          emissiveIntensity={1}
          transparent
          opacity={0.8}
          metalness={0.5}
          roughness={0.1}
        />
      </mesh>

      {/* Dum */}
      <mesh position={[0, 0.05, 1.7]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.12, 2.5, 16]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Dum stabilizatori */}
      <mesh position={[0, 0.05, 2.9]}>
        <boxGeometry args={[1.15, 0.12, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>

      {/* Rotor */}
      <group ref={rotor} position={[0, 1.25, 0]}>
        <mesh>
          <boxGeometry args={[4.2, 0.06, 0.18]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[4.2, 0.06, 0.18]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.9}
          />
        </mesh>
      </group>

      {/* Yon rotor */}
      <mesh
        position={[0, 0.1, 2.85]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.35, 0.04, 8, 24]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Chiroqlar */}
      <mesh position={[0.8, -0.25, -0.7]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      <mesh position={[-0.8, -0.25, -0.7]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

/* =========================================================
   3D BAZA
========================================================= */

function Base({ health }) {
  const shieldScale = Math.max(0.7, health / 100);

  return (
    <group position={[0, 0, -12]}>
      {/* Baza korpusi */}
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[7, 4, 5]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.35}
        />
      </mesh>

      {/* Boshqaruv minorasi */}
      <mesh castShadow position={[0, 5, 0]}>
        <cylinderGeometry args={[1.5, 2, 3, 8]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>

      {/* Energiya yadrosi */}
      <mesh position={[0, 5, 1.35]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#0891b2"
          emissiveIntensity={5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Qalqon */}
      <mesh scale={[shieldScale, shieldScale, shieldScale]}>
        <sphereGeometry args={[5.3, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* Yon minoralar */}
      {[-4, 4].map((x) => (
        <group key={x} position={[x, 2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.7, 0.9, 4, 12]} />
            <meshStandardMaterial
              color="#475569"
              metalness={0.8}
            />
          </mesh>

          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      ))}

      {/* Baza nomi */}
      <Text
        position={[0, 7.2, 0]}
        fontSize={0.65}
        color="#67e8f9"
        anchorX="center"
      >
        ENERGIYA BAZASI
      </Text>
    </group>
  );
}

/* =========================================================
   ENERGIYA SNARYADI
========================================================= */

function EnergyShot({ start, target, onFinish }) {
  const ref = useRef();
  const progress = useRef(0);

  useFrame((_, delta) => {
    progress.current += delta * 2.8;

    if (ref.current) {
      ref.current.position.lerpVectors(
        new THREE.Vector3(...start),
        new THREE.Vector3(...target),
        Math.min(progress.current, 1)
      );

      ref.current.scale.setScalar(
        1 + Math.sin(progress.current * 15) * 0.25
      );
    }

    if (progress.current >= 1) {
      onFinish?.();
    }
  });

  return (
    <group ref={ref} position={start}>
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      <pointLight
        color="#22d3ee"
        intensity={8}
        distance={5}
      />

      <Sparkles
        count={15}
        scale={1.5}
        size={3}
        speed={3}
        color="#67e8f9"
      />
    </group>
  );
}

/* =========================================================
   DRON
========================================================= */

function Drone({ position }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;

    ref.current.rotation.y += 0.025;
    ref.current.position.y =
      position[1] + Math.sin(Date.now() * 0.003) * 0.25;
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <octahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color="#7f1d1d"
          metalness={0.8}
          roughness={0.25}
          emissive="#450a0a"
          emissiveIntensity={1}
        />
      </mesh>

      <mesh position={[0, 0, 0.75]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      <pointLight
        color="#ef4444"
        intensity={3}
        distance={3}
      />
    </group>
  );
}

/* =========================================================
   3D SAHNA
========================================================= */

function GameWorld({ baseHealth, shots, onShotFinish }) {
  return (
    <>
      <color attach="background" args={["#020617"]} />

      <fog
        attach="fog"
        args={["#020617", 15, 55]}
      />

      <ambientLight intensity={0.35} />

      <directionalLight
        position={[10, 20, 10]}
        intensity={2}
        castShadow
      />

      <pointLight
        position={[0, 8, -12]}
        color="#22d3ee"
        intensity={20}
        distance={25}
      />

      <Stars
        radius={80}
        depth={50}
        count={2500}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <Environment preset="night" />

      {/* Yer */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2, -10]}
        receiveShadow
      >
        <planeGeometry args={[80, 80, 20, 20]} />
        <meshStandardMaterial
          color="#07111f"
          metalness={0.3}
          roughness={0.85}
          wireframe
        />
      </mesh>

      {/* Yorqin yo'l */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.95, -8]}
      >
        <planeGeometry args={[10, 50]} />
        <meshBasicMaterial
          color="#0e7490"
          transparent
          opacity={0.12}
        />
      </mesh>

      <Float
        speed={1.5}
        rotationIntensity={0.15}
        floatIntensity={0.3}
      >
        <Samalyot
          position={[0, 2.5, 3]}
          rotation={[0, Math.PI, 0]}
          active
        />
      </Float>

      <Base health={baseHealth} />

      {/* Dronlar */}
      <Drone position={[-8, 4, -7]} />
      <Drone position={[8, 5, -10]} />
      <Drone position={[-6, 7, -17]} />
      <Drone position={[7, 3, -20]} />

      {shots.map((shot) => (
        <EnergyShot
          key={shot.id}
          start={shot.start}
          target={shot.target}
          onFinish={() => onShotFinish(shot.id)}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

/* =========================================================
   ASOSIY KOMPONENT
========================================================= */

export default function Vertalyot() {
  const navigate = useNavigate();

  const [gameStarted, setGameStarted] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [baseHealth, setBaseHealth] = useState(100);
  const [shots, setShots] = useState([]);

  const startGame = () => {
    setGameStarted(true);
    setIsGameActive(true);
    setScore(0);
    setLevel(1);
    setBaseHealth(100);
    setShots([]);

    toast.success("3D vertalyot missiyasi boshlandi!");
  };

  const pauseGame = () => {
    setIsGameActive((prev) => !prev);

    toast.info(
      isGameActive
        ? "O'yin pauzaga qo'yildi"
        : "O'yin davom ettirildi"
    );
  };

  const resetGame = () => {
    setGameStarted(false);
    setIsGameActive(false);
    setScore(0);
    setLevel(1);
    setBaseHealth(100);
    setShots([]);

    toast.info("Missiya qayta boshlandi");
  };

  const fireEnergy = () => {
    if (!isGameActive) return;

    const shot = {
      id: Date.now() + Math.random(),
      start: [0, 2.5, 2],
      target: [0, 5, -12],
    };

    setShots((prev) => [...prev, shot]);
  };

  const removeShot = (id) => {
    setShots((prev) =>
      prev.filter((shot) => shot.id !== id)
    );

    setScore((prev) => prev + 100);

    setBaseHealth((prev) => {
      const next = Math.max(0, prev - 10);

      if (next === 0) {
        setIsGameActive(false);
        toast.success("🏆 Baza qalqoni buzildi!");
      }

      return next;
    });
  };

  /* Klaviatura */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted) return;

      if (e.code === "Space") {
        e.preventDefault();
        fireEnergy();
      }

      if (e.key.toLowerCase() === "p") {
        pauseGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, isGameActive]);

  /* Level */
  useEffect(() => {
    const newLevel = Math.min(
      5,
      Math.floor(score / 500) + 1
    );

    setLevel(newLevel);
  }, [score]);

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">

      {/* HEADER */}
      <header className="relative z-50 border-b border-cyan-400/20 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition"
          >
            <ArrowLeft size={21} />
            Ortga
          </button>

          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-black tracking-wider">
              <span className="text-cyan-400">SKY</span>
              <span className="text-white"> FORCE</span>
            </h1>

            <p className="text-[10px] text-slate-500 tracking-[0.35em]">
              3D AIR MISSION
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden md:flex items-center gap-2">
              <Trophy
                size={18}
                className="text-yellow-400"
              />
              <span className="font-bold">
                {score}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Zap
                size={18}
                className="text-cyan-400"
              />
              <span className="font-bold">
                LVL {level}
              </span>
            </div>

          </div>
        </div>
      </header>

      {!gameStarted ? (

        /* =================================================
           START SCREEN
        ================================================= */

        <main className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-5">

          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[130px] rounded-full top-10 left-1/2 -translate-x-1/2" />
            <div className="absolute w-[350px] h-[350px] bg-purple-600/10 blur-[120px] rounded-full bottom-0 right-0" />
          </div>

          <div className="relative z-10 max-w-5xl w-full grid lg:grid-cols-2 gap-12 items-center">

            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 text-sm mb-5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                3D ARCADE MISSIYA
              </div>

              <h2 className="text-5xl md:text-7xl font-black leading-none mb-6">
                SKY
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500">
                  FORCE
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mb-8">
                3D osmon jang maydonida vertalyotingizni
                boshqaring. Energiya nishonlarini aniq
                mo‘ljallab, himoyalangan bazaning qalqonini
                zaiflashtiring.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">

                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                  <Target className="text-cyan-400 mb-2" />
                  <p className="font-bold">Aniq mo‘ljal</p>
                  <p className="text-xs text-slate-500">
                    3D nishon tizimi
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                  <Shield className="text-purple-400 mb-2" />
                  <p className="font-bold">Baza qalqoni</p>
                  <p className="text-xs text-slate-500">
                    100% → 0%
                  </p>
                </div>

              </div>

              <button
                onClick={startGame}
                className="group w-full md:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-black shadow-[0_0_35px_rgba(34,211,238,0.25)] transition-all hover:scale-[1.03]"
              >
                <Play
                  size={20}
                  className="inline mr-2"
                  fill="currentColor"
                />
                MISSIYANI BOSHLASH
              </button>

            </div>

            {/* 3D preview */}
            <div className="h-[430px] rounded-3xl overflow-hidden border border-cyan-400/20 bg-black/30 shadow-[0_0_80px_rgba(34,211,238,0.08)]">

              <Canvas camera={{ position: [7, 4, 9], fov: 50 }}>

                <color
                  attach="background"
                  args={["#020617"]}
                />

                <ambientLight intensity={0.5} />

                <directionalLight
                  position={[5, 10, 5]}
                  intensity={3}
                />

                <Stars
                  radius={50}
                  depth={30}
                  count={1200}
                  factor={3}
                  fade
                />

                <Float
                  speed={2}
                  rotationIntensity={0.2}
                  floatIntensity={0.5}
                >
                  <Samalyot
                    position={[0, 1, 0]}
                    rotation={[0, -0.3, 0]}
                    active
                  />
                </Float>

                <OrbitControls
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={1.2}
                />

              </Canvas>

            </div>

          </div>
        </main>

      ) : (

        /* =================================================
           GAME SCREEN
        ================================================= */

        <main className="relative min-h-[calc(100vh-73px)]">

          {/* HUD */}
          <div className="absolute z-40 top-5 left-5 right-5 pointer-events-none">

            <div className="max-w-7xl mx-auto flex justify-between items-start">

              <div className="space-y-3">

                <div className="px-4 py-3 rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl">
                  <p className="text-xs text-slate-500">
                    MISSIYA
                  </p>
                  <p className="font-black text-cyan-300">
                    BAZA QALQONI
                  </p>

                  <div className="w-40 h-2 mt-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                      style={{
                        width: `${baseHealth}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    {baseHealth}%
                  </p>
                </div>

              </div>

              <div className="flex gap-2">

                <div className="px-4 py-3 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 text-center">
                  <p className="text-xs text-slate-500">
                    BALL
                  </p>
                  <p className="text-xl font-black text-yellow-400">
                    {score}
                  </p>
                </div>

                <div className="px-4 py-3 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 text-center">
                  <p className="text-xs text-slate-500">
                    DARAJA
                  </p>
                  <p className="text-xl font-black text-cyan-400">
                    {level}
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* 3D GAME */}
          <div className="h-[calc(100vh-73px)] w-full">

            <Canvas
              shadows
              camera={{
                position: [0, 5, 12],
                fov: 60,
              }}
            >

              <GameWorld
                baseHealth={baseHealth}
                shots={shots}
                onShotFinish={removeShot}
              />

            </Canvas>

          </div>

          {/* CROSSHAIR */}
          {isGameActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

              <div className="relative w-20 h-20 border border-cyan-400/30 rounded-full">

                <Crosshair
                  size={70}
                  strokeWidth={1}
                  className="text-cyan-300/80"
                />

                <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_15px_#22d3ee]" />

              </div>

            </div>
          )}

          {/* PAUSE */}
          {!isGameActive && baseHealth > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm">

              <div className="text-center">

                <Pause
                  size={55}
                  className="mx-auto text-cyan-400 mb-4"
                />

                <h2 className="text-4xl font-black">
                  PAUZA
                </h2>

                <p className="text-slate-400 mt-2">
                  Missiyani davom ettirish uchun tugmani bosing
                </p>

              </div>

            </div>
          )}

          {/* WIN */}
          {baseHealth <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-md">

              <div className="text-center p-10 rounded-3xl border border-cyan-400/30 bg-slate-950/90">

                <Trophy
                  size={70}
                  className="mx-auto text-yellow-400 mb-5"
                />

                <h2 className="text-4xl font-black text-cyan-300">
                  MISSIYA BAJARILDI
                </h2>

                <p className="text-slate-400 mt-3 mb-6">
                  Yakuniy ball:{" "}
                  <span className="text-yellow-400 font-bold">
                    {score}
                  </span>
                </p>

                <button
                  onClick={resetGame}
                  className="px-7 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black transition"
                >
                  <RotateCcw
                    size={18}
                    className="inline mr-2"
                  />
                  QAYTA O'YNASH
                </button>

              </div>

            </div>
          )}

          {/* CONTROLS */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50">

            <div className="flex items-center gap-2 p-2 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl">

              <button
                onClick={pauseGame}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                {isGameActive ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} />
                )}
              </button>

              <button
                onClick={fireEnergy}
                disabled={!isGameActive}
                className="px-7 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black transition"
              >
                <Zap
                  size={20}
                  className="inline mr-2"
                />
                FIRE
              </button>

              <button
                onClick={resetGame}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                <RotateCcw size={20} />
              </button>

            </div>

            <p className="text-center text-[10px] text-slate-500 mt-2">
              SPACE — ENERGIYA • P — PAUZA • MOUSE — KAMERA
            </p>

          </div>

        </main>
      )}
    </div>
  );
}