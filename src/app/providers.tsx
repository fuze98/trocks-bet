"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#27272a',
            color: '#fff',
            border: '1px solid #3f3f46',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#27272a',
            },
          },
        }}
      />
    </SessionProvider>
  );
}
