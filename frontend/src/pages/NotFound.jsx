import React from 'react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="page-container flex flex-col items-center justify-center text-center py-24 my-auto">
      <p className="font-mono-meta mb-2">error 404 / route missing</p>
      <h1 className="text-[clamp(60px,10vw,140px)] font-heading font-extrabold text-gradient leading-none mb-4">
        404
      </h1>
      <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1B1630] mb-4">
        Signal Lost in the Constellation
      </h2>
      <p className="text-[#665F75] max-w-md mb-8 leading-relaxed">
        The briefing or screen you are looking for does not exist or has moved beyond the 30-day signal horizon.
      </p>
      <div className="flex gap-4">
        <Button to="/" variant="primary">
          Return to Home →
        </Button>
        <Button to="/dashboard" variant="ghost">
          Dashboard
        </Button>
      </div>
    </div>
  );
}
