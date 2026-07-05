---
read_when:
    - Ajustar la interfaz de usuario del menú de mac o la lógica de estado
summary: Lógica de estado de la barra de menús y qué se muestra a los usuarios
title: Barra de menús
x-i18n:
    generated_at: "2026-07-05T11:31:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Qué se muestra

- El estado de trabajo actual del agente se muestra en el icono de la barra de menús y en la primera fila de estado del menú.
- El estado de salud se oculta mientras hay trabajo activo; vuelve cuando todas las sesiones están inactivas.
- Un elemento raíz "Contexto" abre un submenú con sesiones recientes en lugar de expandirlas en el menú raíz.
- Un bloque "Nodos" en el menú raíz enumera solo **dispositivos** emparejados (desde `node.list`), no entradas de cliente/presencia.
- Una sección raíz "Uso" aparece debajo de Contexto cuando hay instantáneas de uso del proveedor disponibles, seguida de detalles de costo cuando están disponibles.

## Modelo de estado

- Fuente: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Los eventos llegan como `ControlAgentEvent` con un `runId`; el controlador (`ControlChannel.routeWorkActivity`) lee `sessionKey` de la carga útil del evento y usa `"main"` de forma predeterminada si está ausente.
- Prioridad: la sesión principal (`sessionKey == "main"` de forma predeterminada) siempre gana. Si la principal está activa, su estado se muestra de inmediato. Si la principal está inactiva, se muestra en su lugar la sesión no principal activa más recientemente. El almacén no cambia a mitad de la actividad; solo cambia cuando la sesión actual queda inactiva o la principal se activa.
- Tipos de actividad:
  - `job`: ejecución de comandos de alto nivel (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` con `name`, `meta`/`args` opcionales.

## Enumeración IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (sobrescritura de depuración)

### ActivityKind -> símbolo de insignia

`ActivityKind` envuelve un `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) o un `job` directo. Cada uno se asigna a una insignia de SF Symbol dibujada sobre el icono de la criatura (`IconState.badgeSymbolName`):

| Tipo            | Símbolo                            |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Asignación visual

- `idle`: criatura normal, sin insignia.
- `workingMain`: insignia con símbolo, tinte completo (prominencia `.primary`), animación de pata "trabajando".
- `workingOther`: insignia con símbolo, tinte atenuado (prominencia `.secondary`), sin correteo.
- `overridden`: usa el símbolo/tinte elegido independientemente de la actividad real.

## Submenú Contexto

- El menú raíz muestra una fila "Contexto" con un conteo/estado de sesiones; abre un submenú (`MenuSessionsInjector`).
- El encabezado del submenú muestra el conteo de sesiones activas de las últimas 24 horas.
- Cada fila de sesión conserva su barra de tokens, antigüedad, vista previa, alternancia de pensamiento/detallado, restablecimiento, compactación y acciones de eliminación.
- Los mensajes de carga, desconexión y error de carga de sesión se muestran dentro del submenú Contexto.
- Las secciones de uso y costo permanecen en el nivel raíz debajo de Contexto para que sigan siendo visibles de un vistazo sin abrir el submenú.

## Texto de la fila de estado (menú)

- Mientras hay trabajo activo: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` en `MenuContentView`), donde la etiqueta de rol es `Main` u `Other`.
- Cuando está inactivo: vuelve al resumen de salud.

## Ingesta de eventos

- Fuente: eventos `agent` del canal de control, enrutados por `ControlChannel.routeWorkActivity(from:)`.
- Campos analizados:
  - `stream: "job"` con `data.state` para inicio/detención.
  - `stream: "tool"` con `data.phase`, `data.name`, `data.meta`/`data.args` opcionales.
- Las etiquetas de herramientas provienen de `ToolDisplayRegistry.resolve(name:args:meta:)`; los nombres sin resolver recurren al nombre bruto de la herramienta.

## Sobrescritura de depuración

- Ajustes > Depuración > selector "Sobrescritura de icono":
  - `System (auto)` (predeterminado)
  - `Working: main` / `Working: other` (por tipo de herramienta: bash, read, write, edit, other)
  - `Idle`
- Almacenado bajo la clave `UserDefaults` `openclaw.iconOverride`; asignado a `IconState.overridden`.

## Lista de comprobación de pruebas

- Activar trabajo de la sesión principal: el icono cambia de inmediato y la fila de estado muestra la etiqueta principal.
- Activar trabajo de una sesión no principal mientras la principal está inactiva: el icono/estado muestra la sesión no principal; permanece estable hasta que termina.
- Iniciar la principal mientras otra sesión está activa: el icono cambia a la principal al instante.
- Ráfagas rápidas de herramientas: la insignia no parpadea (ventana de gracia de 2 s antes de borrar una herramienta finalizada, `WorkActivityStore.toolResultGrace`).
- La fila de salud reaparece cuando todas las sesiones están inactivas.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Icono de la barra de menús](/es/platforms/mac/icon)
