'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, LogIn, LogOut } from 'lucide-react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { initializeApp } from "firebase/app";

// ----------------------------------------------------
// 1. RUTA DE LA IMAGEN OFICIAL
// ----------------------------------------------------
const OFFICIAL_BG_URL = '/base1.png';
// Asume que base1.png está en la carpeta /public de tu proyecto.

// --- Configuración de Firebase (Se mantiene) ---
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
const googleProvider = new GoogleAuthProvider(); // Proveedor de Google

// --- CODES NO NECESARIO: El sorteo lo hace la API ---
// const CODES = ['10102020', '20304040', '30201010', '40908080'];


export default function TombolaPage() {
  const [code, setCode] = useState('--------');
  const [isAnimating, setIsAnimating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Esperando credenciales...');


  // 1. VERIFICACIÓN DE AUTENTICACIÓN AL CARGAR
  useEffect(() => {
    // Escucha los cambios de estado de autenticación (login/logout)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setStatusMessage(`Hola, ${currentUser.displayName}. Verifica tu rol...`);
        // Forzar la obtención del token para actualizar los claims (roles) si acaban de ser asignados
        await currentUser.getIdToken(true);
      } else {
        setStatusMessage('Debes iniciar sesión para usar la tómbola.');
      }
    });
    return () => unsubscribe(); // Limpieza del listener
  }, []);


  // 2. LÓGICA DE SORTEO MODIFICADA (Llama a la API Segura)
  const generateCode = async () => {
    if (isAnimating || !user) return; // Bloquear si no hay usuario o está animando

    setIsAnimating(true);

    // 2.1 Animación de Tómbola (Visual, aún usa random localmente)
    let animationInterval = setInterval(() => {
      const randomCode = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      setCode(randomCode);
    }, 50);

    try {
      // 2.2 Obtener el Token de ID (Necesario para el Backend)
      const token = await user.getIdToken();

      // 2.3 Llamada a la API Route Segura
      const response = await fetch('/api/tombola', {
        headers: {
          'Authorization': `Bearer ${token}`, // Envía el token para verificación de Login y Rol
        },
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.error || `Error HTTP: ${response.status}`;

        if (response.status === 403) {
          errorMessage = "🚫 Permiso Denegado. No tienes el rol 'sorteador'.";
        } else if (response.status === 401) {
          errorMessage = "⚠️ Sesión expirada o Token inválido. Vuelve a iniciar sesión.";
        }

        throw new Error(errorMessage);
      }

      // 2.4 Finalizar animación y mostrar código real
      setStatusMessage(`¡Sorteo exitoso! Código generado por ${user.displayName}.`);
      setCode(data.selectedID); // <-- Usamos el ID real de Google Sheets

    } catch (err: any) {
      console.error("Error de Tómbola/Auth:", err);
      setStatusMessage(err.message);
      setCode('--------'); // Reiniciar visualmente
    } finally {
      clearInterval(animationInterval); // Detener animación
      setIsAnimating(false);
    }
  };

  // 3. Funciones de Login/Logout
  const handleLogin = () => {
    signInWithPopup(auth, googleProvider).catch((error) => {
      setStatusMessage(`Error de Login: ${error.message}`);
    });
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      setStatusMessage(`Error de Logout: ${error.message}`);
    });
  };


  // NOTA: Se eliminan las PlaceHolderImages ya que se usa OFFICIAL_BG_URL
  // const backgroundImage = PlaceHolderImages.find(p => p.id === 'corporate-background');

  // Determinar si el botón debe estar deshabilitado
  const isButtonDisabled = isAnimating || !user || statusMessage.includes('Permiso Denegado');


  return (
    // 1. Contenedor principal: Ocupa toda la pantalla y habilita el posicionamiento de capas
    <main className="relative h-screen w-screen overflow-hidden">

      {/* 2. Fondo Total PNG: CUBRE TODA LA PANTALLA (Reemplaza las barras de color y el fondo central) */}
      <Image
        src={OFFICIAL_BG_URL}
        alt="Fondo oficial de la tómbola"
        fill
        className="object-cover" // Asegura que cubre todo y es responsivo
        priority
      />

      {/* 3. Capa de Opacidad/Overlay: Ajusta el brillo para que el texto sea legible. */}
      <div className="absolute inset-0 bg-black/20 backdrop-brightness-75" aria-hidden="true"></div>


      {/* 4. Contenido Central (Flotante - z-10) */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center">

        {/* Barra superior con Login/Logout */}
        <div className="absolute top-0 right-0 z-20 p-4">
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white/80 hidden md:inline">
                Logueado como: **{user.displayName || user.email}**
              </span>
              <Button onClick={handleLogout} variant="secondary" size="sm" title="Cerrar Sesión">
                <LogOut className="mr-2 h-4 w-4" /> Salir
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} variant="secondary" size="sm">
              <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión (Google)
            </Button>
          )}
        </div>


        {/* Título y Mensajes */}
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-accent mb-2">Tómbola Segura</h2>
          <p className="text-base text-primary-foreground/80 mb-6 md:text-lg md:mb-8">
            {statusMessage}
          </p>
        </div>

        {/* Display del Código */}
        <div
          className="flex space-x-1 md:space-x-2"
          aria-live="polite"
          aria-atomic="true"
        >
          {code.split('').map((digit, index) => (
            <div
              key={index}
              // Corrección gráfica: Añadido md:w-24 y leading-none para centrado perfecto.
              className="flex h-16 w-10 items-center justify-center rounded-md border-2 border-accent bg-black text-4xl font-bold text-white shadow-[0_0_10px_hsl(var(--accent))] sm:h-20 sm:w-14 sm:text-5xl md:h-28 md:w-24 md:text-7xl font-mono leading-none"
            >
              {digit}
            </div>
          ))}
        </div>

        {/* Botón de Sorteo */}
        <Button
          onClick={generateCode}
          className="mt-10 md:mt-12"
          variant="secondary"
          size="lg"
          disabled={isButtonDisabled}
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${isAnimating ? 'animate-spin' : ''}`} />
          {isAnimating ? 'Generando...' : (user ? 'Generar Nuevo Código' : 'Inicia Sesión')}
        </Button>
      </div>
    </main>
  );
}