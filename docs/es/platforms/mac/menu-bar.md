---
read_when:
    - Ajustar la interfaz de usuario del menú de Mac o la lógica de estado
summary: Lógica de estado de la barra de menú y lo que se muestra a los usuarios
title: Barra de menús
x-i18n:
    generated_at: "2026-05-06T05:41:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Qué se muestra

- Mostramos el estado de trabajo actual del agente en el icono de la barra de menús y en la primera fila de estado del menú.
- El estado de salud se oculta mientras hay trabajo activo; vuelve cuando todas las sesiones están inactivas.
- Un submenú raíz "Contexto" contiene las sesiones recientes en lugar de expandirlas directamente en el menú raíz.
- El bloque "Nodos" del menú raíz enumera solo **dispositivos** (nodos emparejados mediante `node.list`), no entradas de cliente/presencia.
- Una sección raíz "Uso" aparece debajo de Contexto cuando hay instantáneas de uso del proveedor disponibles, seguida de detalles de costo de uso cuando están disponibles.

## Modelo de estado

- Sesiones: los eventos llegan con `runId` (por ejecución) más `sessionKey` en la carga útil. La sesión "main" es la clave `main`; si no está presente, recurrimos a la sesión actualizada más recientemente.
- Prioridad: main siempre gana. Si main está activa, su estado se muestra de inmediato. Si main está inactiva, se muestra la sesión que no es main activa más recientemente. No alternamos a mitad de actividad; solo cambiamos cuando la sesión actual pasa a inactiva o main se activa.
- Tipos de actividad:
  - `job`: ejecución de comandos de alto nivel (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` con `toolName` y `meta/args`.

## Enum IconState (Swift)

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

### Mapeo visual

- `idle`: criatura normal.
- `workingMain`: insignia con glifo, tinte completo, animación de pata "trabajando".
- `workingOther`: insignia con glifo, tinte atenuado, sin correteo.
- `overridden`: usa el glifo/tinte elegido independientemente de la actividad.

## Submenú Contexto

- El menú raíz muestra una fila "Contexto" con un conteo/estado de sesiones y abre un submenú.
- El encabezado del submenú Contexto muestra el conteo de sesiones activas de las últimas 24 horas.
- Cada fila de sesión conserva su barra de tokens, antigüedad, vista previa, pensamiento/detalle, y acciones de restablecer, compactar y eliminar.
- Los mensajes de carga, desconexión y error de carga de sesión aparecen dentro del submenú Contexto.
- El uso del proveedor y los detalles de costo de uso permanecen en el nivel raíz debajo de Contexto para que sigan siendo visibles de un vistazo sin abrir el submenú.

## Texto de fila de estado (menú)

- Mientras hay trabajo activo: `<Session role> · <activity label>`
  - Ejemplos: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Cuando está inactivo: vuelve al resumen de salud.

## Ingesta de eventos

- Fuente: eventos `agent` del canal de control (`ControlChannel.handleAgentEvent`).
- Campos analizados:
  - `stream: "job"` con `data.state` para inicio/detención.
  - `stream: "tool"` con `data.phase`, `name`, `meta`/`args` opcionales.
- Etiquetas:
  - `exec`: primera línea de `args.command`.
  - `read`/`write`: ruta abreviada.
  - `edit`: ruta más tipo de cambio inferido a partir de `meta`/conteos de diff.
  - alternativa: nombre de la herramienta.

## Anulación de depuración

- Configuración ▸ Depuración ▸ selector "Anulación de icono":
  - `System (auto)` (predeterminado)
  - `Working: main` (por tipo de herramienta)
  - `Working: other` (por tipo de herramienta)
  - `Idle`
- Almacenado mediante `@AppStorage("iconOverride")`; mapeado a `IconState.overridden`.

## Lista de comprobación de pruebas

- Activar trabajo de sesión main: verificar que el icono cambie de inmediato y que la fila de estado muestre la etiqueta de main.
- Activar trabajo de sesión que no sea main mientras main está inactiva: el icono/estado muestra la sesión que no es main; permanece estable hasta que termine.
- Iniciar main mientras otra está activa: el icono cambia a main al instante.
- Ráfagas rápidas de herramientas: asegurar que la insignia no parpadee (gracia TTL en resultados de herramientas).
- La fila de salud reaparece una vez que todas las sesiones están inactivas.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Icono de la barra de menús](/es/platforms/mac/icon)
