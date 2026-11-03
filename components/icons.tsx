import type { ReactNode, SVGProps } from "react";

type IconoProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconoProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoCasa(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </Base>
  );
}

export function IconoPanel(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </Base>
  );
}

export function IconoEdificio(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21v-6h6v6" />
    </Base>
  );
}

export function IconoPuerta(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" />
      <path d="M3 21h18" />
      <path d="M14.5 12h.01" />
    </Base>
  );
}

export function IconoCalendario(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </Base>
  );
}

export function IconoMensaje(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a3 3 0 0 1 3-3h11a4 4 0 0 1 4 4v8Z" />
    </Base>
  );
}

export function IconoMegafono(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3 10v4h3l5 4V6L6 10H3Z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
    </Base>
  );
}

export function IconoUsuarios(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16.5 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  );
}

export function IconoMoneda(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 2v20" />
      <path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Base>
  );
}

export function IconoEscudo(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </Base>
  );
}

export function IconoEnlace(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </Base>
  );
}

export function IconoPorcentaje(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m19 5-14 14" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </Base>
  );
}

export function IconoMas(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconoMenu(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Base>
  );
}

export function IconoCerrar(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Base>
  );
}

export function IconoSalir(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Base>
  );
}
