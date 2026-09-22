import React from 'react';

export interface Metadata {
  title?: string;
  description?: string;
  manifest?: string;
  icons?: {
    icon?: Array<{ url: string; media?: string; sizes?: string; type?: string }>;
    apple?: string | Array<{ url: string; sizes?: string; type?: string }>;
    shortcut?: string;
    other?: Array<{ rel: string; url: string }>;
  };
}

export const metadata: Metadata = {
  title: 'Nexus Focus • A Evolução da sua TI',
  description: 'Plataforma executiva de foco, produtividade e inteligência operacional.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/Nexus_Focus_Icone_Preto_Tema_Claro.png', media: '(prefers-color-scheme: light)' },
      { url: '/Nexus_Focus_Icone_Branco_Tema_Escuro.png', media: '(prefers-color-scheme: dark)' }
    ],
    apple: '/Nexus_Focus_Icone_Preto_Tema_Claro.png' // Fallback para dispositivos Apple
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="icon"
          type="image/png"
          href="/Nexus_Focus_Icone_Preto_Tema_Claro.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/png"
          href="/Nexus_Focus_Icone_Branco_Tema_Escuro.png"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="apple-touch-icon"
          href="/Nexus_Focus_Icone_Preto_Tema_Claro.png"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
