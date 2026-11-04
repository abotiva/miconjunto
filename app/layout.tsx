import type { Metadata, Viewport } from "next";
import "./globals.css";

/*
  Dirección pública del sitio, necesaria para resolver las URLs absolutas que
  exigen Open Graph y Twitter (la imagen, por ejemplo).

  - Con dominio propio se define SITIO_URL y manda esa.
  - En producción, Vercel expone el alias estable en VERCEL_PROJECT_PRODUCTION_URL.
  - En una vista previa se usa su propia dirección (VERCEL_URL): así la tarjeta
    del enlace funciona antes de promover, sin depender de producción.
  - En local cae en el alias de producción.
*/
function urlDelSitio(): URL {
  if (process.env.SITIO_URL) return new URL(process.env.SITIO_URL);
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("https://miconjunto-rose.vercel.app");
}

const sitio = urlDelSitio();

export const metadata: Metadata = {
  metadataBase: sitio,
  title: "MiConjunto · Administración de conjuntos residenciales",
  description:
    "Plataforma de administración para conjuntos residenciales: unidades, portería, reservas, PQRS, comunicados y asambleas.",
  twitter: {
    card: "summary_large_image",
    title: "MiConjunto · El conjunto, en orden",
    description:
      "Unidades, personas, portería y cuotas en un solo lugar. Cada rol ve solo lo que le corresponde.",
  },
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
