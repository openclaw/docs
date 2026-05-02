---
read_when:
    - Ajustar la interfaz de usuario del menú de Mac o la lógica de estado
summary: Lógica de estado de la barra de menús y lo que se muestra a los usuarios
title: Barra de menús
x-i18n:
    generated_at: "2026-05-02T05:30:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Lógica de estado de la barra de menús

## Qué se muestra

- Mostramos el estado de trabajo actual del agente en el icono de la barra de menús y en la primera fila de estado del menú.
- El estado de salud se oculta mientras el trabajo está activo; vuelve cuando todas las sesiones están inactivas.
- Un submenú raíz “Contexto” contiene las sesiones recientes en lugar de expandirlas directamente en el menú raíz.
- El bloque “Nodes” del menú raíz enumera solo **dispositivos** (nodos emparejados mediante `node.list`), no entradas de cliente/presencia.
- Una sección raíz “Uso” aparece debajo de Contexto cuando hay instantáneas de uso del proveedor disponibles, seguida de detalles de coste de uso cuando están disponibles.

## Modelo de estado

- Sesiones: los eventos llegan con `runId` (por ejecución) además de `sessionKey` en la carga útil. La sesión “principal” es la clave `main`; si está ausente, recurrimos a la sesión actualizada más recientemente.
- Prioridad: la principal siempre gana. Si la principal está activa, su estado se muestra de inmediato. Si la principal está inactiva, se muestra la sesión no principal activa más recientemente. No alternamos a mitad de actividad; solo cambiamos cuando la sesión actual queda inactiva o la principal se activa.
- Tipos de actividad:
  - `job`: ejecución de comandos de alto nivel (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` con `toolName` y `meta/args`.

## Enumeración IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (anulación de depuración)

### ActivityKind → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- predeterminado → 🛠️

### Asignación visual

- `idle`: criatura normal.
- `workingMain`: insignia con glifo, tinte completo, animación de pata “trabajando”.
- `workingOther`: insignia con glifo, tinte atenuado, sin correteo.
- `overridden`: usa el glifo/tinte elegido independientemente de la actividad.

## Submenú Contexto

- El menú raíz muestra una fila “Contexto” con un conteo/estado de sesiones y abre un submenú.
- El encabezado del submenú Contexto muestra el conteo de sesiones activas de las últimas 24 horas.
- Cada fila de sesión conserva su barra de tokens, antigüedad, vista previa, pensamiento/verbose, y las acciones de restablecer, compactar y eliminar.
- Los mensajes de carga, desconexión y error de carga de sesión aparecen dentro del submenú Contexto.
- El uso del proveedor y los detalles de coste de uso permanecen en el nivel raíz debajo de Contexto para que sigan siendo consultables de un vistazo sin abrir el submenú.

## Texto de la fila de estado (menú)

- Mientras el trabajo está activo: `<Session role> · <activity label>`
  - Ejemplos: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Cuando está inactivo: recurre al resumen de salud.

## Ingesta de eventos

- Fuente: eventos `agent` del canal de control (`ControlChannel.handleAgentEvent`).
- Campos analizados:
  - `stream: "job"` con `data.state` para inicio/parada.
  - `stream: "tool"` con `data.phase`, `name`, `meta`/`args` opcionales.
- Etiquetas:
  - `exec`: primera línea de `args.command`.
  - `read`/`write`: ruta abreviada.
  - `edit`: ruta más tipo de cambio inferido a partir de `meta`/conteos de diff.
  - alternativa: nombre de la herramienta.

## Anulación de depuración

- Ajustes ▸ Depuración ▸ selector “Anulación de icono”:
  - `System (auto)` (predeterminado)
  - `Working: main` (por tipo de herramienta)
  - `Working: other` (por tipo de herramienta)
  - `Idle`
- Se almacena mediante `@AppStorage("iconOverride")`; se asigna a `IconState.overridden`.

## Lista de comprobación de pruebas

- Activar trabajo de sesión principal: verificar que el icono cambia de inmediato y que la fila de estado muestra la etiqueta principal.
- Activar trabajo de sesión no principal mientras la principal está inactiva: el icono/estado muestra la no principal; se mantiene estable hasta que finaliza.
- Iniciar la principal mientras otra está activa: el icono cambia a la principal al instante.
- Ráfagas rápidas de herramientas: asegurar que la insignia no parpadee (gracia TTL en los resultados de herramientas).
- La fila de salud reaparece una vez que todas las sesiones están inactivas.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Icono de la barra de menús](/es/platforms/mac/icon)
