import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 text-center text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200/40 dark:border-neutral-800/40">
      <div className="max-w-6xl mx-auto px-4">
        <p>MockPilot — AI mock interview platform. Voice, evaluation & Firestore database persistence.</p>
      </div>
    </footer>
  );
};
