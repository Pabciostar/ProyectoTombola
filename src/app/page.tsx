'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Zap } from 'lucide-react';

const CODES = ['3819', '7452', '9012', '5548', '1670', '8321', '4965'];

export default function Home() {
  const [code, setCode] = useState('----');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const randomIndex = Math.floor(Math.random() * CODES.length);
    setCode(CODES[randomIndex]);
  }, []);

  const backgroundImage = PlaceHolderImages.find(p => p.id === 'corporate-background');

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Red Bar */}
      <div className="flex h-full w-16 shrink-0 flex-col bg-accent p-4 pt-6 md:w-20">
        <Zap className="h-8 w-8 text-accent-foreground" />
      </div>

      {/* Main Content */}
      <div className="relative flex-grow h-full">
        {backgroundImage && (
          <Image
            src={backgroundImage.imageUrl}
            alt={backgroundImage.description}
            fill
            className="object-cover"
            data-ai-hint={backgroundImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-primary/60 backdrop-brightness-75" aria-hidden="true"></div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md">
            
            <p className="text-lg text-primary-foreground/80 mb-8">Your randomly generated access code is below.</p>
          </div>
          <div
            className="flex space-x-2 md:space-x-4 rounded-lg border-2 border-accent bg-background/90 p-4 md:p-8 shadow-[0_0_20px_hsl(var(--accent))] backdrop-blur-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {(isMounted ? code : '----').split('').map((digit, index) => (
              <div
                key={index}
                className="flex h-20 w-14 items-center justify-center rounded-md bg-card text-5xl font-bold text-card-foreground shadow-inner md:h-28 md:w-20 md:text-7xl font-code"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Black Bar */}
      <div className="flex items-center justify-center h-full w-12 shrink-0 bg-primary/95 md:w-16" aria-hidden="true">
        <h1 className="text-4xl font-headline font-bold text-primary-foreground drop-shadow-lg [writing-mode:vertical-rl]">
          Code Dispenser
        </h1>
      </div>
    </main>
  );
}
