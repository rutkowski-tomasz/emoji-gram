// app/routes/home.tsx
'use client';

import { useRequireAuth } from '~/context/AuthContext';
import { Chat } from '~/chat/chat';

export default function Home() {
  useRequireAuth();
  
  return (
    <main>
      <Chat />
    </main>
  );
}