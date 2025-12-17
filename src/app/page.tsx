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
const OFFICIAL_BG_URL = '/base1.png';

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
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      
      {/* CAPA 0: FONDO DE OFICINA */}
      <div className="absolute inset-0 z-0">
        <Image src="/fondo.png" alt="Fondo" fill className="object-cover opacity-40" priority />
      </div>

      {/* CAPA SUPERIOR: BOTÓN DE GOOGLE (Siempre visible y clickeable) */}
      <div className="absolute top-4 right-4 z-50">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm hidden md:block">{user.displayName}</span>
            <Button onClick={handleLogout} variant="secondary" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Salir
            </Button>
          </div>
        ) : (
          <Button onClick={handleLogin} variant="secondary" size="sm">
            <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
          </Button>
        )}
      </div>

      {/* CONTENEDOR MAESTRO DE ENCUADRE */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] aspect-video">
          
          {/* CAPA 1: MARCO DE LA TÓMBOLA (base1.png) */}
          <Image
            src={OFFICIAL_BG_URL}
            alt="Marco Tómbola"
            fill
            className="object-contain z-10 pointer-events-none" 
            priority
          />

          {/* CAPA 2: DÍGITOS (Ajustados a la izquierda y compactos) */}
          <div 
            className="absolute z-30 flex justify-between"
            style={{
              top: '45.5%',  
              left: '8%',    // Izquierda
              width: '72%',  // Compacto
              height: '10%'
            }}
          >
            {code.split('').map((digit, index) => (
              <div
                key={index}
                className="flex flex-1 items-center justify-center text-white font-mono font-bold
                           text-[5vw] md:text-[4vw] lg:text-[70px] leading-none"
              >
                {digit}
              </div>
            ))}
          </div>

          {/* CAPA 3: BOTÓN DE GENERAR */}
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 z-40">
            <Button
              onClick={generateCode}
              variant="default"
              size="lg"
              disabled={isButtonDisabled}
              className="px-8 py-6 text-xl"
            >
              <RefreshCw className={`mr-3 h-6 w-6 ${isAnimating ? 'animate-spin' : ''}`} />
              {isAnimating ? 'Generando...' : (user ? 'Generar Código' : 'Inicia Sesión')}
            </Button>
          </div>

        </div>
      </div>
    </main>
  );
}