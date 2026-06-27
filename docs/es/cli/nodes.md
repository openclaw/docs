---
read_when:
    - Estás gestionando nodos emparejados (cámaras, pantalla, lienzo)
    - Debe aprobar solicitudes o invocar comandos de Node
summary: Referencia de la CLI para `openclaw nodes` (estado, emparejamiento, invocación, cámara/lienzo/pantalla)
title: Nodos
x-i18n:
    generated_at: "2026-06-27T11:02:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gestiona Nodes emparejados (dispositivos) e invoca capacidades de Node.

Relacionado:

- Descripción general de Nodes: [Nodes](/es/nodes)
- Cámara: [Nodes de cámara](/es/nodes/camera)
- Imágenes: [Nodes de imagen](/es/nodes/images)

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

`nodes list` imprime tablas de solicitudes pendientes y emparejadas. Las filas emparejadas incluyen la antigüedad de la conexión más reciente (Última conexión).
Usa `--connected` para mostrar solo los Nodes conectados actualmente. Usa `--last-connected <duration>` para
filtrar a los Nodes que se conectaron dentro de una duración (por ejemplo, `24h`, `7d`).
Usa `nodes remove --node <id|name|ip>` para eliminar un emparejamiento de Node. Para un
Node respaldado por un dispositivo, esto revoca el rol `node` del dispositivo en `devices/paired.json`
y desconecta sus sesiones con rol de Node (un dispositivo con roles mixtos conserva su fila y
solo pierde el rol `node`; un dispositivo solo de Node se elimina); también borra cualquier
registro de emparejamiento de Node heredado y propiedad del Gateway que coincida. `operator.pairing` puede eliminar
filas de Node no operadoras; un llamador con token de dispositivo que revoca su propio rol de Node en un
dispositivo con roles mixtos necesita además `operator.admin`.

Nota de aprobación:

- `openclaw nodes pending` solo necesita ámbito de emparejamiento.
- `gateway.nodes.pairing.autoApproveCidrs` puede omitir el paso pendiente solo para
  emparejamientos de dispositivo `role: node` explícitamente confiables y de primera vez. Está desactivado de forma
  predeterminada y no aprueba actualizaciones.
- `openclaw nodes approve <requestId>` hereda requisitos de ámbito adicionales de la
  solicitud pendiente:
  - solicitud sin comando: solo emparejamiento
  - comandos de Node que no son exec: emparejamiento + escritura
  - `system.run` / `system.run.prepare` / `system.which`: emparejamiento + administrador

## Invocar

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Opciones de invocación:

- `--params <json>`: cadena de objeto JSON (predeterminado `{}`).
- `--invoke-timeout <ms>`: tiempo de espera de invocación de Node (predeterminado `15000`).
- `--idempotency-key <key>`: clave de idempotencia opcional.
- `system.run` y `system.run.prepare` están bloqueados aquí; usa la herramienta `exec` con `host=node` para la ejecución de shell.

Para la ejecución de shell en un Node, usa la herramienta `exec` con `host=node` en lugar de `openclaw nodes run`.
La CLI de `nodes` ahora se centra en capacidades: RPC directo mediante `nodes invoke`, además de emparejamiento, cámara,
pantalla, ubicación, Canvas y notificaciones. Los comandos de Canvas los implementa el Plugin experimental de Canvas incluido; el núcleo conserva un enlace de compatibilidad para que sigan estando bajo `openclaw nodes canvas`.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodes](/es/nodes)
