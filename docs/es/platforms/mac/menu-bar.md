---
read_when:
    - Ajustes de la interfaz del menú de macOS o de la lógica de estado
summary: Lógica de estado de la barra de menús y lo que se muestra a los usuarios
title: Barra de menús
x-i18n:
    generated_at: "2026-07-11T23:16:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Qué se muestra

- El estado de trabajo actual del agente se muestra en el icono de la barra de menús y en la primera fila de estado del menú.
- El estado de salud se oculta mientras hay trabajo activo; vuelve a mostrarse cuando todas las sesiones están inactivas.
- Un elemento raíz «Contexto» abre un submenú con las sesiones recientes en lugar de desplegarlas en el menú raíz.
- Un bloque «Nodos» del menú raíz muestra únicamente los **dispositivos** emparejados (de `node.list`), no las entradas de cliente/presencia.
- Una sección raíz «Uso» aparece debajo de Contexto cuando hay disponibles instantáneas de uso del proveedor, seguidas de los detalles de costes cuando están disponibles.

## Modelo de estados

- Fuente: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Los eventos llegan como `ControlAgentEvent` con un `runId`; el controlador (`ControlChannel.routeWorkActivity`) lee `sessionKey` de la carga útil del evento y usa `"main"` de forma predeterminada si no está presente.
- Prioridad: la sesión principal (`sessionKey == "main"` de forma predeterminada) siempre tiene preferencia. Si la sesión principal está activa, su estado se muestra inmediatamente. Si está inactiva, se muestra en su lugar la sesión no principal activa más recientemente. El almacén no cambia de sesión durante una actividad; solo lo hace cuando la sesión actual pasa a estar inactiva o cuando se activa la sesión principal.
- Tipos de actividad:
  - `job`: ejecución de comandos de alto nivel (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` con `name` y, opcionalmente, `meta`/`args`.

## Enumeración IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (anulación de depuración)

### ActivityKind -> símbolo de insignia

`ActivityKind` encapsula un `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) o un `job` independiente. Cada uno se asigna a una insignia de SF Symbols dibujada sobre el icono de la criatura (`IconState.badgeSymbolName`):

| Tipo            | Símbolo                            |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Correspondencia visual

- `idle`: criatura normal, sin insignia.
- `workingMain`: insignia con símbolo, tinte completo (prominencia `.primary`) y animación de «trabajo» de las patas.
- `workingOther`: insignia con símbolo, tinte atenuado (prominencia `.secondary`), sin correteo.
- `overridden`: usa el símbolo y el tinte elegidos independientemente de la actividad real.

## Submenú de contexto

- El menú raíz muestra una fila de «Contexto» con el número y el estado de las sesiones; esta abre un submenú (`MenuSessionsInjector`).
- El encabezado del submenú muestra el número de sesiones activas durante las últimas 24 horas.
- Cada fila de sesión conserva su barra de tokens, antigüedad, vista previa, controles para activar o desactivar el razonamiento y el modo detallado, y acciones para restablecer, compactar y eliminar.
- Los mensajes de carga, desconexión y error al cargar sesiones se muestran dentro del submenú de contexto.
- Las secciones de uso y coste permanecen en el nivel raíz, debajo de Contexto, para que puedan consultarse de un vistazo sin abrir el submenú.

## Texto de la fila de estado (menú)

- Mientras el trabajo está activo: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` en `MenuContentView`), donde la etiqueta de función es `Main` o `Other`.
- Cuando está inactivo: vuelve al resumen de estado.

## Ingesta de eventos

- Fuente: eventos `agent` del canal de control, enrutados mediante `ControlChannel.routeWorkActivity(from:)`.
- Campos analizados:
  - `stream: "job"` con `data.state` para iniciar/detener.
  - `stream: "tool"` con `data.phase`, `data.name` y los campos opcionales `data.meta`/`data.args`.
- Las etiquetas de las herramientas provienen de `ToolDisplayRegistry.resolve(name:args:meta:)`; los nombres no resueltos recurren al nombre sin procesar de la herramienta.

## Anulación de depuración

- Selector Settings > Debug > "Icon override":
  - `System (auto)` (predeterminado)
  - `Working: main` / `Working: other` (según el tipo de herramienta: bash, lectura, escritura, edición, otro)
  - `Idle`
- Se almacena en la clave `openclaw.iconOverride` de `UserDefaults`; se asigna a `IconState.overridden`.

## Lista de comprobación de pruebas

- Activar un trabajo de la sesión principal: el icono cambia inmediatamente y la fila de estado muestra la etiqueta principal.
- Activar un trabajo de una sesión no principal mientras la principal está inactiva: el icono y el estado muestran la sesión no principal; permanecen estables hasta que finaliza.
- Iniciar la sesión principal mientras otra sesión está activa: el icono cambia instantáneamente a la principal.
- Ráfagas rápidas de herramientas: el indicador no parpadea (ventana de gracia de 2 s antes de borrar una herramienta finalizada, `WorkActivityStore.toolResultGrace`).
- La fila de estado reaparece cuando todas las sesiones están inactivas.

## Relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Icono de la barra de menús](/es/platforms/mac/icon)
