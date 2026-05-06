---
read_when:
    - Planificación de una amplia modernización de la aplicación OpenClaw
    - Actualización de los estándares de implementación frontend para trabajos de aplicación o de interfaz de usuario de Control
    - Convertir una revisión amplia de la calidad del producto en trabajo de ingeniería por fases
summary: Plan integral de modernización de aplicaciones con actualizaciones de Skills de entrega de interfaz de usuario
title: Plan de modernización de aplicaciones
x-i18n:
    generated_at: "2026-05-06T05:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## Objetivo

Acercar la aplicación a un producto más limpio, rápido y mantenible sin
romper los flujos de trabajo actuales ni ocultar riesgos en refactorizaciones amplias. El trabajo debe
entregarse en partes pequeñas y revisables, con pruebas para cada superficie tocada.

## Principios

- Preservar la arquitectura actual salvo que un límite esté causando de forma demostrable cambios frecuentes,
  coste de rendimiento o errores visibles para el usuario.
- Preferir el parche correcto más pequeño para cada problema y luego repetir.
- Separar las correcciones necesarias de las mejoras opcionales para que los mantenedores puedan incorporar trabajo de alto
  valor sin esperar decisiones subjetivas.
- Mantener documentado y compatible hacia atrás el comportamiento de cara a plugins.
- Verificar el comportamiento enviado, los contratos de dependencias y las pruebas antes de afirmar que una
  regresión está corregida.
- Mejorar primero la ruta principal del usuario: incorporación, autenticación, chat, configuración de proveedores,
  gestión de plugins y diagnósticos.

## Fase 1: Auditoría de referencia

Inventariar la aplicación actual antes de cambiarla.

- Identificar los principales flujos de trabajo de usuario y las superficies de código que los poseen.
- Enumerar prestaciones muertas, configuraciones duplicadas, estados de error poco claros y rutas de
  renderizado costosas.
- Capturar los comandos de validación actuales para cada superficie.
- Marcar los problemas como necesarios, recomendados u opcionales.
- Documentar los bloqueadores conocidos que necesitan revisión del propietario, especialmente cambios de API, seguridad,
  release y contrato de plugins.

Definición de terminado:

- Una lista de problemas con referencias de archivo desde la raíz del repositorio.
- Cada problema tiene gravedad, superficie propietaria, impacto esperado en el usuario y una ruta de
  validación propuesta.
- No se mezclan elementos especulativos de limpieza con correcciones necesarias.

## Fase 2: Limpieza de producto y UX

Priorizar flujos de trabajo visibles y eliminar confusión.

- Ajustar el texto de incorporación y los estados vacíos alrededor de la autenticación del modelo, el estado del gateway
  y la configuración de plugins.
- Eliminar o deshabilitar prestaciones muertas cuando no sea posible realizar ninguna acción.
- Mantener visibles las acciones importantes en anchos responsivos en lugar de ocultarlas
  detrás de suposiciones frágiles de diseño.
- Consolidar el lenguaje de estado repetido para que los errores tengan una única fuente de verdad.
- Añadir divulgación progresiva para configuraciones avanzadas manteniendo rápida la configuración básica.

Validación recomendada:

- Ruta feliz manual para la configuración inicial y el arranque de usuarios existentes.
- Pruebas enfocadas para cualquier lógica de enrutamiento, persistencia de configuración o derivación de estado.
- Capturas del navegador para superficies responsivas modificadas.

## Fase 3: Ajuste de la arquitectura frontend

Mejorar la mantenibilidad sin una reescritura amplia.

- Mover transformaciones repetidas de estado de UI a helpers tipados y acotados.
- Mantener separadas las responsabilidades de obtención de datos, persistencia y presentación.
- Preferir hooks, stores y patrones de componentes existentes frente a nuevas abstracciones.
- Dividir componentes sobredimensionados solo cuando reduzca el acoplamiento o aclare las pruebas.
- Evitar introducir estado global amplio para interacciones locales de paneles.

Protecciones obligatorias:

- No cambiar el comportamiento público como efecto secundario de dividir archivos.
- Mantener intacto el comportamiento de accesibilidad para menús, diálogos, pestañas y navegación
  por teclado.
- Verificar que los estados de carga, vacío, error y optimistas sigan renderizándose.

## Fase 4: Rendimiento y fiabilidad

Atacar dolores medidos en lugar de optimización teórica amplia.

- Medir costes de arranque, transición de rutas, listas grandes y transcripciones de chat.
- Sustituir datos derivados costosos y repetidos por selectores memoizados o helpers en caché
  donde el perfilado demuestre valor.
- Reducir escaneos evitables de red o sistema de archivos en rutas críticas.
- Mantener ordenamiento determinista para entradas de prompt, registro, archivo, plugin y red
  antes de construir payloads de modelo.
- Añadir pruebas de regresión ligeras para helpers críticos y límites de contrato.

Definición de terminado:

- Cada cambio de rendimiento registra referencia inicial, impacto esperado, impacto real y
  brecha restante.
- Ningún parche de rendimiento se incorpora solo por intuición cuando hay medición barata disponible.

## Fase 5: Endurecimiento de tipos, contratos y pruebas

Elevar la corrección en los puntos límite de los que dependen usuarios y autores de plugins.

- Sustituir cadenas de runtime laxas por uniones discriminadas o listas cerradas de códigos.
- Validar entradas externas con helpers de esquema existentes o zod.
- Añadir pruebas de contrato alrededor de manifiestos de plugins, catálogos de proveedores, mensajes de protocolo del gateway
  y comportamiento de migración de configuración.
- Mantener rutas de compatibilidad en flujos de doctor o reparación en lugar de migraciones ocultas
  en tiempo de arranque.
- Evitar acoplamiento solo de pruebas con internos de plugins; usar fachadas SDK y barrels
  documentados.

Validación recomendada:

- `pnpm check:changed`
- Pruebas dirigidas para cada límite modificado.
- `pnpm build` cuando cambien límites lazy, empaquetado o superficies publicadas.

## Fase 6: Documentación y preparación para release

Mantener la documentación de cara al usuario alineada con el comportamiento.

- Actualizar la documentación con cambios de comportamiento, API, configuración, incorporación o plugins.
- Añadir entradas de changelog solo para cambios visibles para el usuario.
- Mantener la terminología de plugins de cara al usuario; usar nombres internos de paquetes solo cuando
  sea necesario para colaboradores.
- Confirmar que las instrucciones de release e instalación sigan coincidiendo con la superficie actual de
  comandos.

Definición de terminado:

- La documentación relevante se actualiza en la misma rama que los cambios de comportamiento.
- Las comprobaciones de documentación generada o deriva de API pasan cuando se tocan.
- El traspaso nombra cualquier validación omitida y por qué se omitió.

## Primera parte recomendada

Empezar con una pasada acotada de Control UI e incorporación:

- Auditar la configuración inicial, la preparación de autenticación de proveedores, el estado del gateway y las superficies de
  configuración de plugins.
- Eliminar acciones muertas y aclarar estados de fallo.
- Añadir o actualizar pruebas enfocadas para derivación de estado y persistencia de configuración.
- Ejecutar `pnpm check:changed`.

Esto aporta un alto valor al usuario con riesgo arquitectónico limitado.

## Actualización de skill frontend

Usa esta sección para actualizar el `SKILL.md` centrado en frontend suministrado con la
tarea de modernización. Si adoptas esta guía como una skill local de OpenClaw en el repositorio,
crea primero `.agents/skills/openclaw-frontend/SKILL.md`, conserva el frontmatter
que pertenezca a esa skill de destino y luego añade o sustituye la guía del cuerpo con
el siguiente contenido.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
