---
read_when:
    - Estás gestionando Nodes emparejados (cámaras, pantalla, lienzo)
    - Debes aprobar las solicitudes o invocar comandos de Node
summary: Referencia de la CLI para `openclaw nodes` (estado, emparejamiento, invocación, cámara/lienzo/pantalla/ubicación/notificaciones)
title: Nodos
x-i18n:
    generated_at: "2026-07-12T14:26:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gestiona los nodos (dispositivos) emparejados e invoca las capacidades de los nodos.

Relacionado: [Descripción general de los nodos](/es/nodes) - [Presencia activa del equipo](/es/nodes/presence) - [Nodos de cámara](/es/nodes/camera) - [Nodos de imagen](/es/nodes/images)

Opciones comunes en todos los subcomandos: `--url <url>`, `--token <token>`, `--timeout <ms>` (valor predeterminado: `10000`), `--json`.

## Estado

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

Tanto `status` como `list` aceptan `--connected` (solo nodos conectados) y `--last-connected <duration>` (p. ej., `24h`, `7d`; solo nodos que se conectaron dentro de ese período). `list` muestra los nodos pendientes y emparejados en tablas separadas; las filas de los nodos emparejados incluyen el tiempo transcurrido desde la conexión más reciente (Last Connect). `status` muestra una única tabla combinada con información por nodo sobre las capacidades, la versión y la última entrada. Un nodo macOS conectado solo informa de la última entrada mientras se haya concedido el permiso Accessibility, y la fila con los datos más recientes se marca como `active`; consulta [Presencia activa del equipo](/es/nodes/presence). `describe` muestra las capacidades, los permisos, la actividad y los comandos de invocación efectivos y pendientes de un nodo.

## Emparejamiento

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Estos comandos controlan el almacén `node.pair.*`, propiedad del Gateway, que es independiente del emparejamiento de dispositivos (`openclaw devices approve`) que autoriza el protocolo de enlace `connect` de WS del nodo. Consulta [Nodos](/es/nodes) para saber cómo se relacionan ambos.

- `remove` revoca la entrada de rol emparejado del nodo. En un nodo respaldado por un dispositivo, esto revoca el rol `node` en el almacén de emparejamiento de dispositivos y desconecta sus sesiones con rol de nodo: un dispositivo con varios roles conserva su fila y solo pierde el rol `node`, mientras que se elimina la fila de un dispositivo que solo tiene el rol de nodo. También borra cualquier registro de emparejamiento de nodos heredado coincidente que pertenezca al Gateway.
- `pending` solo necesita el ámbito `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` puede omitir el paso pendiente para el emparejamiento de dispositivos de confianza explícita que soliciten por primera vez `role: node`. Está desactivado de forma predeterminada y no aprueba ampliaciones de roles.
- `gateway.nodes.pairing.sshVerify` (activado de forma predeterminada) aprueba automáticamente el emparejamiento de dispositivos que soliciten por primera vez `role: node` cuando el Gateway puede verificar mediante SSH la clave del dispositivo en el host del nodo; la primera superficie de capacidades se aprueba en el mismo paso. Consulta [Emparejamiento de nodos](/es/gateway/pairing#ssh-verified-device-auto-approval-default).
- Los requisitos de ámbito de `approve` dependen de los comandos declarados por la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de nodo distintos de ejecución: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`
- Ámbito de `remove`: `operator.pairing` puede eliminar filas de nodos que no sean operadores; quien invoque mediante un token de dispositivo para revocar su propio rol de nodo en un dispositivo con varios roles también necesita `operator.admin`.

## Invocación

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Opciones:

- `--command <command>` (obligatorio): p. ej., `canvas.eval`.
- `--params <json>`: cadena de objeto JSON (valor predeterminado: `{}`).
- `--invoke-timeout <ms>`: tiempo de espera de invocación del nodo (valor predeterminado: `15000`).
- `--idempotency-key <key>`: clave de idempotencia opcional.

`system.run` y `system.run.prepare` están bloqueados aquí; para ejecutar comandos de shell, usa en su lugar la herramienta `exec` con `host=node`. `system.which` se permite mediante `invoke`.

## Notificaciones, push, ubicación y pantalla

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` envía una notificación local a un nodo que declara `system.notify`, incluidos los nodos de macOS, iOS y Android, así como los nodos directos de watchOS. La entrega directa a watchOS requiere que OpenClaw esté activo. Requiere `--title` o `--body`. Opciones: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (valor predeterminado: `system`), `--invoke-timeout <ms>` (valor predeterminado: `15000`).
- `push` envía una notificación push de prueba mediante APNs a un nodo iOS. Opciones: `--title <text>` (valor predeterminado: `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` para anular el entorno APNs detectado.
- `location get` obtiene la ubicación actual del nodo. Opciones: `--max-age <ms>` (reutiliza una posición almacenada en caché), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (valor predeterminado: `10000`), `--invoke-timeout <ms>` (valor predeterminado: `20000`).
- `screen record` captura un clip breve y muestra la ruta donde se guardó (o escribe JSON con `--json`). Opciones: `--screen <index>` (valor predeterminado: `0`), `--duration <ms|10s>` (valor predeterminado: `10000`), `--fps <fps>` (valor predeterminado: `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (valor predeterminado: `120000`).

Los comandos de cámara y Canvas tienen su propia documentación: [Nodos de cámara](/es/nodes/camera), [Canvas](/es/platforms/mac/canvas). Canvas está implementado por el Plugin experimental Canvas incluido; el núcleo conserva `openclaw nodes canvas` como punto de montaje de compatibilidad.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
