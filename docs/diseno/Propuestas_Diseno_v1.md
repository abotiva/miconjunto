# Tres propuestas de diseño — MiConjunto

**Fecha:** 3 de noviembre de 2026
**Base:** estado del producto en v0.4 (panel, unidades, auditoría, roles) y propuesta funcional v1.3.
**Pantalla diseñada:** panel del conjunto para el rol *Administración*, con los mismos datos en las tres propuestas para poder compararlas de igual a igual.

> Los mockups usan datos de ejemplo coherentes entre sí: conjunto Altos del Nogal (Bogotá), 128 unidades, 342 personas, 289 vinculaciones, 82 % de cuotas al día, 6 paquetes en portería y 4 PQRS abiertas.

---

## A · Patio

**Idea:** el conjunto se siente como un vecindario, no como un sistema.

| | |
|---|---|
| Tono | Cálido, humano, editorial |
| Tipografía | Georgia para títulos · Segoe UI para interfaz |
| Paleta | Hueso `#F3EDE3` · papel `#FFFCF6` · tinta `#2B2521` · terracota `#B44E2B` · verde bosque `#2C4638` · salvia `#DCE5D7` |
| Formas | Radios de 20 px, bordes cálidos, sombras muy suaves |
| Firma | Titulares en serif, cifras grandes, tarjetas tipo revista y un «mural» de comunicados |

**A favor**

- Se siente cercano: baja la barrera para residentes y para la administración.
- El mural, la agenda y la asamblea ganan protagonismo natural.
- Da personalidad sin recurrir a ilustraciones ni fotos.

**En contra**

- Menos denso para operación y para tablas largas (unidades, auditoría).
- La calidez compite con la lectura rápida de estados y alertas.
- Requiere una tipografía serif en toda la marca para no quedar a medias.

**Encaja mejor en:** residentes, comunicados, reservas, asambleas y la pantalla de ingreso.

---

## B · Conserje

**Idea:** una consola de turno, pensada para portería y para turnos de 8 horas.

| | |
|---|---|
| Tono | Técnico, nocturno, operativo |
| Tipografía | Bahnschrift para títulos · Consolas para horas, unidades y códigos |
| Paleta | Fondo `#0B0F11` · panel `#121A1E` · lima señal `#C6F26B` · ámbar `#FFB257` · cian `#5FD0C5` |
| Formas | Radios de 10 px, tablas compactas, alto contraste de estados |
| Firma | Bitácora en vivo, reloj de turno, paquetería con tiempos de espera y pase de visita por QR |

**A favor**

- Excelente para uso intensivo: todo lo que entra y sale está en una sola tabla.
- Los estados (dentro, abierto, 24 h) se leen de un vistazo.
- El modo oscuro funciona bien en garitas y turnos de noche.

**En contra**

- No representa la marca para residentes ni para asambleas.
- Dark mode en exteriores con luz solar puede perder legibilidad.
- Es el más costoso de construir: tabla, chips, atajos y QR.

**Encaja mejor en:** portería y paquetería. Podría convivir como *modo operación* del mismo producto.

---

## C · Mirador

**Idea:** la evolución serena de la marca actual (azul marino + verde azulado), ordenada para crecer.

| | |
|---|---|
| Tono | Institucional, confiable, tranquilo |
| Tipografía | Segoe UI Variable · títulos de 26 px con tracking cerrado |
| Paleta | Fondo `#F4F7F8` · superficie `#FFFFFF` · marino `#12324B` · verde `#0E7A6B` · menta `#EDF6F3` |
| Formas | Radios de 12 px, bordes de 1 px, mucho aire, jerarquía por tamaño y color |
| Firma | Gráfico de cuotas, tabla de unidades con coeficiente y auditoría visible en la barra lateral |

**A favor**

- Continúa los colores que ya están en `globals.css`: no hay que rehacer la marca.
- Aguanta tablas, reportes, asambleas y auditoría sin perder claridad.
- Es la más rápida de implementar con Tailwind y la más fácil de explicar en una asamblea.

**En contra**

- Es la menos memorable de las tres: se parece a un buen SaaS genérico.
- La calidez queda en segundo plano; los residentes pueden percibirla distante.
- Exige disciplina en tipografía y espaciado para no verse plana.

**Encaja mejor en:** administración, unidades, cuotas, auditoría y reportes.

---

## Comparación

| Criterio | A · Patio | B · Conserje | C · Mirador |
|---|---|---|---|
| Tono | Cercano y cálido | Técnico y nocturno | Institucional y sereno |
| Densidad de información | Media | Alta | Media-alta |
| Mejor rol | Residente / Administración | Portería | Administración |
| Implementación | Media | Alta | Baja |
| Riesgo | Verse «poco software» | No servir para residentes | Verse genérica |
| Diferenciación | Alta | Alta | Baja-media |
| Continuidad con la marca actual | Baja | Baja | Alta |

---

## Recomendación

**Elegir C · Mirador como base del producto** y usarla para el panel, unidades, cuotas, auditoría y asambleas.

Razones:

1. **Continuidad:** conserva el azul marino y el verde azulado que ya viven en la app; el cambio es de sistema, no de marca.
2. **Escala:** es la única que resuelve con naturalidad tablas densas, reportes y estados de cuenta sin sacrificar legibilidad.
3. **Costo:** se implementa con los tokens actuales de Tailwind y sin dependencias nuevas.
4. **Confianza:** para una asamblea o un acceso de soporte auditado, la lectura institucional juega a favor.

**Complementos recomendados**

- Tomar de **A** el tono de los textos y el «mural» para las pantallas del residente (comunicados, reservas, ingreso). La calidez debe estar en el lenguaje y en los acentos, no en todo el panel.
- Reservar **B** como *modo operación* para portería, solo si el uso real lo justifica. No debería ser la cara del producto.
- Definir primero los tokens (color, tipografía, radios, estados) y luego construir tres pantallas piloto: **ingreso**, **panel** y **unidades**.

---

## Archivos

| Archivo | Contenido |
|---|---|
| `docs/diseno/propuestas/propuesta-a-patio.html` | Mockup editable de la propuesta A |
| `docs/diseno/propuestas/propuesta-b-conserje.html` | Mockup editable de la propuesta B |
| `docs/diseno/propuestas/propuesta-c-mirador.html` | Mockup editable de la propuesta C |
| `docs/diseno/propuestas/img/*.png` | Capturas 1440 × 1024 a 2× (2880 × 2048) |

Los HTML son la fuente de verdad del diseño: se pueden abrir en el navegador y ajustar sin regenerar imágenes.

---

## Decisión

**3 de noviembre de 2026.** Se adopta **C · Mirador** como base del producto y se toma de **A · Patio** el tono del ingreso y de las pantallas del residente. **B · Conserje** queda reservada como *modo operación* de portería, sin implementarse todavía.

El detalle de tokens, componentes y pantallas ya implementadas está en [Implementacion_Mirador_v1.md](Implementacion_Mirador_v1.md). Los tres diseños por rol están en [Diseno_Por_Rol_v1.md](Diseno_Por_Rol_v1.md).
