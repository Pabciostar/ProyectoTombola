'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap } from 'lucide-react';

const CODES = ['10102020', '20304040', '30201010', '40908080'];

export default function Home() {
  const [code, setCode] = useState('--------');

  const generateCode = () => {
    const randomIndex = Math.floor(Math.random() * CODES.length);
    setCode(CODES[randomIndex]);
  };

  const backgroundImage = PlaceHolderImages.find(p => p.id === 'corporate-background');

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Red Bar */}
      <div className="hidden h-full shrink-0 flex-col bg-accent p-4 pt-6 sm:flex sm:w-20 md:w-24">
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
            
            <p className="text-base text-primary-foreground/80 mb-6 md:text-lg md:mb-8">Your randomly generated access code is below.</p>
          </div>
          <div
            className="flex space-x-1 md:space-x-2"
            aria-live="polite"
            aria-atomic="true"
          >
            {code.split('').map((digit, index) => (
              <div
                key={index}
                className="flex h-16 w-10 items-center justify-center rounded-md border-2 border-accent bg-black text-4xl font-bold text-white shadow-[0_0_10px_hsl(var(--accent))] sm:h-20 sm:w-14 sm:text-5xl md:h-28 md:w-20 md:text-7xl font-code"
              >
                {digit}
              </div>
            ))}
          </div>
          <Button onClick={generateCode} className="mt-10 md:mt-12" variant="secondary" size="lg">
            <RefreshCw className="mr-2 h-5 w-5" />
            Generate New Code
          </Button>
        </div>
      </div>

      {/* Right Black Bar */}
      <div className="hidden items-center justify-center h-full shrink-0 bg-black sm:flex sm:w-40 md:w-48" aria-hidden="true">
        <h1 className="text-4xl font-headline font-bold text-primary-foreground drop-shadow-lg [writing-mode:vertical-rl]" style={{textOrientation: 'mixed'}}>
          Code Dispenser
        </h1>
      </div>
    </main>
  );
}
