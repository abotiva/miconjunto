import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiConjunto · Administración de conjuntos residenciales",
  description:
    "Plataforma de administración para conjuntos residenciales: unidades, portería, reservas, PQRS, comunicados y asambleas.",
};

export const viewport: Viewport = {
  themeColor: "#12324b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
