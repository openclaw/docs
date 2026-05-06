---
read_when:
    - Estás gestionando nodos emparejados (cámaras, pantalla, lienzo)
    - Debes aprobar solicitudes o invocar comandos de Node
summary: Referencia de CLI para `openclaw nodes` (estado, emparejamiento, invocación, cámara/lienzo/pantalla)
title: Nodos
x-i18n:
    generated_at: "2026-05-06T17:54:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Administra nodos emparejados (dispositivos) e invoca capacidades de nodos.

Relacionado:

- Resumen de nodos: [Nodos](/es/nodes)
- Cámara: [Nodos de cámara](/es/nodes/camera)
- Imágenes: [Nodos de imagen](/es/nodes/images)

Opciones comunes:

- `--url`, `--token`, `--timeout`, `--json`

## Comandos comunes

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` imprime tablas de pendientes/emparejados. Las filas emparejadas incluyen la antigüedad de conexión más reciente (Última conexión).
Usa `--connected` para mostrar solo los nodos conectados actualmente. Usa `--last-connected <duration>` para
filtrar a los nodos que se conectaron dentro de una duración (por ejemplo, `24h`, `7d`).
Usa `nodes remove --node <id|name|ip>` para eliminar un registro obsoleto de emparejamiento de nodo propiedad del Gateway.

Nota de aprobación:

- `openclaw nodes pending` solo necesita el ámbito de emparejamiento.
- `gateway.nodes.pairing.autoApproveCidrs` puede omitir el paso de pendiente solo para el
  emparejamiento de dispositivo `role: node` explícitamente confiable y por primera vez. Está desactivado de forma
  predeterminada y no aprueba actualizaciones.
- `openclaw nodes approve <requestId>` hereda requisitos de ámbito adicionales de la
  solicitud pendiente:
  - solicitud sin comando: solo emparejamiento
  - comandos de nodo sin ejecución: emparejamiento + escritura
  - `system.run` / `system.run.prepare` / `system.which`: emparejamiento + admin

## Invocar

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Opciones de invocación:

- `--params <json>`: cadena de objeto JSON (predeterminado `{}`).
- `--invoke-timeout <ms>`: tiempo de espera de invocación del nodo (predeterminado `15000`).
- `--idempotency-key <key>`: clave de idempotencia opcional.
- `system.run` y `system.run.prepare` están bloqueados aquí; usa la herramienta `exec` con `host=node` para la ejecución de shell.

Para la ejecución de shell en un nodo, usa la herramienta `exec` con `host=node` en lugar de `openclaw nodes run`.
La CLI `nodes` ahora se centra en capacidades: RPC directa mediante `nodes invoke`, además de emparejamiento, cámara,
pantalla, ubicación, lienzo y notificaciones.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
