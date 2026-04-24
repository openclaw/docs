---
read_when:
    - Ajustar la UI del menú de macOS o la lógica de estado
summary: Lógica de estado de la barra de menú y qué se muestra a los usuarios
title: Barra de menú
x-i18n:
    generated_at: "2026-04-24T05:38:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Lógica de estado de la barra de menú

## Qué se muestra

- Mostramos el estado de trabajo actual del agente en el icono de la barra de menú y en la primera fila de estado del menú.
- El estado de salud se oculta mientras el trabajo está activo; reaparece cuando todas las sesiones están inactivas.
- El bloque “Nodes” del menú enumera solo **dispositivos** (Nodes emparejados mediante `node.list`), no entradas de cliente/presencia.
- Aparece una sección “Usage” debajo de Context cuando hay instantáneas de uso del proveedor disponibles.

## Modelo de estado

- Sesiones: los eventos llegan con `runId` (por ejecución) más `sessionKey` en la carga. La sesión “main” es la clave `main`; si no está presente, recurrimos a la sesión actualizada más recientemente.
- Prioridad: main siempre gana. Si main está activa, su estado se muestra inmediatamente. Si main está inactiva, se muestra la sesión no main activa más reciente. No cambiamos de un lado a otro a mitad de la actividad; solo cambiamos cuando la sesión actual pasa a inactiva o main se activa.
- Tipos de actividad:
  - `job`: ejecución de comandos de alto nivel (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` con `toolName` y `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (sobrescritura de depuración)

### `ActivityKind` → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- predeterminado → 🛠️

### Asignación visual

- `idle`: critter normal.
- `workingMain`: insignia con glifo, tinte completo, animación de patas “working”.
- `workingOther`: insignia con glifo, tinte atenuado, sin desplazamiento.
- `overridden`: usa el glifo/tinte elegido independientemente de la actividad.

## Texto de la fila de estado (menú)

- Mientras el trabajo está activo: `<Session role> · <activity label>`
  - Ejemplos: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Cuando está inactivo: vuelve al resumen de salud.

## Ingesta de eventos

- Origen: eventos `agent` del canal de control (`ControlChannel.handleAgentEvent`).
- Campos analizados:
  - `stream: "job"` con `data.state` para inicio/parada.
  - `stream: "tool"` con `data.phase`, `name` y `meta`/`args` opcionales.
- Etiquetas:
  - `exec`: primera línea de `args.command`.
  - `read`/`write`: ruta acortada.
  - `edit`: ruta más tipo de cambio inferido a partir de `meta`/conteos de diff.
  - fallback: nombre de la herramienta.

## Sobrescritura de depuración

- Ajustes ▸ Depuración ▸ selector “Icon override”:
  - `System (auto)` (predeterminado)
  - `Working: main` (por tipo de herramienta)
  - `Working: other` (por tipo de herramienta)
  - `Idle`
- Se almacena mediante `@AppStorage("iconOverride")`; se asigna a `IconState.overridden`.

## Lista de comprobación de pruebas

- Activa un job de la sesión principal: verifica que el icono cambie inmediatamente y que la fila de estado muestre la etiqueta de main.
- Activa un job de sesión no main mientras main está inactiva: el icono/estado muestra no main; se mantiene estable hasta que termina.
- Inicia main mientras otra está activa: el icono cambia a main al instante.
- Ráfagas rápidas de herramientas: asegúrate de que la insignia no parpadee (margen TTL en resultados de herramientas).
- La fila de salud reaparece una vez que todas las sesiones están inactivas.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Icono de la barra de menú](/es/platforms/mac/icon)
