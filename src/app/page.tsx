'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogIn, LogOut } from 'lucide-react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { initializeApp } from "firebase/app";

// ----------------------------------------------------
// 1. CONFIGURACIÓN E IMÁGENES
// ----------------------------------------------------
const LEFT_BORDER_URL = '/borde_izquierda.png';
const RIGHT_BORDER_URL = '/borde_derecho.png';
const BACKGROUND_VIDEO_URL = "https://firebasestorage.googleapis.com/v0/b/proyectotombola-51309.firebasestorage.app/o/Programa%20TRAINEE%20HORIZONTAL%202.mp4?alt=media&token=e92f5e18-64a5-40f1-999a-9615882c820f";

const firebaseConfig = {
  apiKey: "AIzaSyBeaDm9nv8fcXXlxr4oo46OWOLeuDyTIY0",
  authDomain: "proyectotombola-51309.firebaseapp.com",
  projectId: "proyectotombola-51309",
  storageBucket: "proyectotombola-51309.firebasestorage.app",
  messagingSenderId: "512495213940",
  appId: "1:512495213940:web:310b906698281900dbe021",
  measurementId: "G-RV1NKJYD64"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export default function TombolaPage() {
  const [winnerName, setWinnerName] = useState('ESPERANDO...');
  const [isAnimating, setIsAnimating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Esperando credenciales...');

  // Lista de nombres placeholder para la animación visual
  const placeholders = ["MARÍA GARCÍA", "JUAN PÉREZ", "CARLA SOTO", "ANDRÉS VIAL", "DIEGO LÓPEZ", "ELENA ROJAS"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setStatusMessage(`Hola, ${currentUser.displayName}.`);
        await currentUser.getIdToken(true);
      } else {
        setStatusMessage('Debes iniciar sesión.');
      }
    });
    return () => unsubscribe();
  }, []);

  const generateWinner = async () => {
    if (isAnimating || !user) return;
    setIsAnimating(true);

    // Animación rápida de nombres aleatorios
    let animationInterval = setInterval(() => {
      const randomPos = Math.floor(Math.random() * placeholders.length);
      setWinnerName(placeholders[randomPos]);
    }, 80);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/tombola', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error en el sorteo");

      // Actualizamos con el nombre real del backend
      setWinnerName(data.selectedName);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message);
      setWinnerName('ERROR');
    } finally {
      clearInterval(animationInterval);
      setIsAnimating(false);
    }
  };

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  const isButtonDisabled = isAnimating || !user || statusMessage.includes('Denegado');

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black font-mono">

      {/* CAPA 0: VIDEO DE FONDO */}
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60">
          <source src={BACKGROUND_VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20 z-[1]"></div>
      </div>

      {/* CAPA 0.5: BORDES LATERALES */}
      <img
        src={LEFT_BORDER_URL}
        alt=""
        className="absolute top-0 left-0 h-full w-auto z-20 pointer-events-none select-none"
      />
      <img
        src={RIGHT_BORDER_URL}
        alt=""
        className="absolute top-0 right-0 h-full w-auto z-20 pointer-events-none select-none"
      />

      {/* LOGIN/LOGOUT (Esquina superior derecha) */}
      <div className="absolute top-6 right-10 z-[100] flex flex-col items-end gap-4">
        {user ? (
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white shadow-xl">
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        ) : (
          <Button onClick={handleLogin} className="bg-white text-black hover:bg-gray-200 shadow-2xl border-2 border-cyan-400">
            <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión con Google
          </Button>
        )}

      </div>

      {/* CONTENEDOR CENTRAL */}
      <div className="relative z-30 h-full w-full flex items-center justify-center">
        <div
          className="relative w-full h-full max-w-[1920px] flex flex-col items-center justify-center"
          style={{ paddingTop: '30%' }} // <--- Aumentado de 20% a 30% para bajar todo el grupo
        >

          {/* BOTÓN (Mantiene su posición a la derecha) */}
          <div className="mb-20 z-40 transform translate-x-32"> {/* mb-20 aumenta la distancia con el cuadro */}
            <Button
              onClick={generateWinner}
              variant="default"
              size="lg"
              disabled={isButtonDisabled}
              className="px-10 py-8 text-2xl shadow-2xl bg-cyan-600 hover:bg-cyan-500 text-white border-2 border-cyan-300 transition-all hover:scale-105"
            >
              <RefreshCw className={`mr-4 h-8 w-8 ${isAnimating ? 'animate-spin' : ''}`} />
              {isAnimating ? 'SORTEANDO...' : (user ? 'SORTEAR GANADOR' : 'Inicia Sesión')}
            </Button>
          </div>

          {/* PANEL DE NEÓN (CUADRO DE NOMBRES) */}
          <div className="flex justify-center items-center w-full px-10">
            <div
              className="
          min-w-[600px] max-w-[85vw] px-16 py-10
          border-[6px] border-cyan-400 rounded-[40px]
          text-cyan-50 font-bold text-center
          text-[3.5vw] lg:text-[65px] leading-tight
          bg-cyan-950/40 backdrop-blur-md
          shadow-[0_0_60px_rgba(34,211,238,0.6),inset_0_0_20px_rgba(34,211,238,0.3)]
          uppercase tracking-widest break-all
        "
              style={{
                textShadow: '0 0 10px #fff, 0 0 20px #22d3ee, 0 0 40px #22d3ee'
              }}
            >
              {winnerName}
            </div>
          </div>

        </div>
      </div>

    </main>
  );
}