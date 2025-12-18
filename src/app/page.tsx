'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogIn, LogOut } from 'lucide-react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { initializeApp } from "firebase/app";

// ----------------------------------------------------
// 1. CONFIGURACIÓN E IMÁGENES
// ----------------------------------------------------
// NUEVAS IMÁGENES DE BORDE (Asegúrate de que estén en /public)
const LEFT_BORDER_URL = '/borde_izquierda.png';
const RIGHT_BORDER_URL = '/borde_derecha.png';

// URL generada con tu bucket y token de Firebase Storage
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
  const [code, setCode] = useState('--------');
  const [isAnimating, setIsAnimating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Esperando credenciales...');

  // 1. VERIFICACIÓN DE AUTENTICACIÓN
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

  // 2. LÓGICA DE SORTEO
  const generateCode = async () => {
    if (isAnimating || !user) return;
    setIsAnimating(true);

    let animationInterval = setInterval(() => {
      const randomCode = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      setCode(randomCode);
    }, 50);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/tombola', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error en el sorteo");
      }

      setCode(data.selectedID);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message);
      setCode('--------');
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
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src={BACKGROUND_VIDEO_URL} type="video/mp4" />
          Tu navegador no soporta videos.
        </video>
        <div className="absolute inset-0 bg-black/20 z-[1]"></div>
      </div>

      {/* CAPA 0.5: BORDES LATERALES (REQ 1 - Pegados a los bordes de la pantalla) */}
      {/* Usamos 'h-full w-auto' para que ocupen todo el alto y mantengan su proporción */}
      <img
        src={LEFT_BORDER_URL}
        alt="Borde Izquierdo"
        className="absolute top-0 left-0 h-full w-auto z-20 pointer-events-none select-none"
      />


      {/* LOGIN/LOGOUT (Esquina superior derecha) */}
      <div className="absolute top-6 right-10 z-[100]"> {/* Z-index muy alto */}
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
          style={{ paddingTop: '20%' }} // <--- ESTO BAJA TODO EL GRUPO (Botón + Cuadros)
        >

          {/* REQUERIMIENTO: EL BOTÓN ARRIBA */}
          <div className="mb-12 z-40 transform translate-x-32">
            {/* translate-x-20 lo mueve a la derecha. 
      Puedes usar translate-x-32 para más lejos o valores negativos para la izquierda */}
            <Button
              onClick={generateCode}
              variant="default"
              size="lg"
              disabled={isButtonDisabled}
              className="px-10 py-8 text-2xl shadow-2xl bg-cyan-600 hover:bg-cyan-500 text-white border-2 border-cyan-300"
            >
              <RefreshCw className={`mr-4 h-8 w-8 ${isAnimating ? 'animate-spin' : ''}`} />
              {isAnimating ? 'Generando...' : (user ? 'GENERAR CÓDIGO' : 'Inicia Sesión')}
            </Button>
          </div>

          {/* REQUERIMIENTO: CUADROS ABAJO DEL BOTÓN */}
          <div className="flex justify-center items-center w-full px-10">
            {code.split('').map((digit, index) => (
              <div
                key={index}
                className="
                  flex flex-1 items-center justify-center 
                  aspect-square max-w-[120px] /* Ajuste para que no crezcan infinito */
                  mx-1 md:mx-2 
                  border-4 border-cyan-400 rounded-2xl 
                  text-cyan-50 font-bold 
                  text-[5vw] md:text-[6vw] lg:text-[80px] leading-none
                  bg-cyan-950/40 
                  shadow-[0_0_25px_rgba(34,211,238,0.5),inset_0_0_10px_rgba(34,211,238,0.2)] 
                  backdrop-blur-sm
                "
                style={{ textShadow: '0 0 5px #fff, 0 0 15px #22d3ee, 0 0 30px #22d3ee' }}
              >
                {digit}
              </div>
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}