---
read_when:
    - Estás gestionando nodos emparejados (cámaras, pantalla, lienzo)
    - Necesitas aprobar solicitudes o invocar comandos de node
summary: Referencia de CLI para `openclaw nodes` (estado, emparejamiento, invocar, cámara/lienzo/pantalla/ubicación/notificar)
title: Nodos
x-i18n:
    generated_at: "2026-07-05T11:08:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2542d7cba45fd4db7480baee48370aea5980dc03d683ea28b65c11fef1007c03
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Administra nodos (dispositivos) emparejados e invoca capacidades de nodo.

Relacionado: [Descripción general de nodos](/es/nodes) - [Nodos de cámara](/es/nodes/camera) - [Nodos de imagen](/es/nodes/images)

Opciones comunes en todos los subcomandos: `--url <url>`, `--token <token>`, `--timeout <ms>` (valor predeterminado `10000`), `--json`.

## Estado

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` y `list` aceptan `--connected` (solo nodos conectados) y `--last-connected <duration>` (p. ej., `24h`, `7d`; solo nodos que se conectaron dentro de esa duración). `list` muestra los nodos pendientes y emparejados en tablas separadas, con filas emparejadas que incluyen la antigüedad de la conexión más reciente (Última conexión); `status` muestra una tabla combinada con detalles de capacidad y versión por nodo. `describe` imprime las capacidades, permisos y comandos de invocación efectivos/pendientes de un nodo.

## Emparejamiento

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Estos comandos controlan el almacén `node.pair.*` propiedad del Gateway, separado del emparejamiento de dispositivos (`openclaw devices approve`) que controla el handshake `connect` por WS del nodo. Consulta [Nodos](/es/nodes) para ver cómo se relacionan ambos.

- `remove` revoca la entrada de rol emparejado del nodo. Para un nodo respaldado por dispositivo, esto revoca el rol `node` en el almacén de emparejamiento de dispositivos y desconecta sus sesiones con rol de nodo: un dispositivo de rol mixto conserva su fila y solo pierde el rol `node`; una fila de dispositivo solo de nodo se elimina. También borra cualquier registro coincidente heredado de emparejamiento de nodos propiedad del Gateway.
- `pending` solo necesita el alcance `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` puede omitir el paso pendiente para emparejamientos de dispositivos `role: node` explícitamente confiables y de primera vez. Desactivado de forma predeterminada; no aprueba actualizaciones de rol.
- Los requisitos de alcance de `approve` siguen los comandos declarados por la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de nodo no exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`
- Alcance de `remove`: `operator.pairing` puede eliminar filas de nodo que no sean de operador; un llamador con token de dispositivo que revoque su propio rol de nodo en un dispositivo de rol mixto necesita además `operator.admin`.

## Invocación

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"name":"uname"}'
```

Flags:

- `--command <command>` (obligatorio): p. ej., `canvas.eval`.
- `--params <json>`: cadena de objeto JSON (valor predeterminado `{}`).
- `--invoke-timeout <ms>`: timeout de invocación del nodo (valor predeterminado `15000`).
- `--idempotency-key <key>`: clave de idempotencia opcional.

`system.run` y `system.run.prepare` están bloqueados aquí; usa en su lugar la herramienta `exec` con `host=node` para la ejecución de shell. `system.which` está permitido mediante `invoke`.

## Notificación, push, ubicación, pantalla

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` envía una notificación local en un nodo (solo macOS). Requiere `--title` o `--body`. Opciones: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (valor predeterminado `system`), `--invoke-timeout <ms>` (valor predeterminado `15000`).
- `push` envía un push de prueba de APNs a un nodo iOS. Opciones: `--title <text>` (valor predeterminado `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` para sobrescribir el entorno de APNs detectado.
- `location get` obtiene la ubicación actual del nodo. Opciones: `--max-age <ms>` (reutilizar una posición en caché), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (valor predeterminado `10000`), `--invoke-timeout <ms>` (valor predeterminado `20000`).
- `screen record` captura un clip breve e imprime la ruta guardada (o escribe JSON con `--json`). Opciones: `--screen <index>` (valor predeterminado `0`), `--duration <ms|10s>` (valor predeterminado `10000`), `--fps <fps>` (valor predeterminado `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (valor predeterminado `120000`).

Los comandos de cámara y Canvas tienen su propia documentación: [Nodos de cámara](/es/nodes/camera), [Canvas](/es/platforms/mac/canvas). Canvas está implementado por el Plugin Canvas experimental incluido; el núcleo conserva `openclaw nodes canvas` como punto de montaje de compatibilidad.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodos](/es/nodes)
