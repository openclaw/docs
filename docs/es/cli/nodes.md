---
read_when:
    - Estás gestionando nodos emparejados (cámaras, pantalla, canvas)
    - Necesitas aprobar solicitudes o invocar comandos de nodos
summary: Referencia de CLI para `openclaw nodes` (estado, emparejamiento, invocación, cámara/canvas/pantalla)
title: Nodos
x-i18n:
    generated_at: "2026-04-24T05:23:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gestiona nodos emparejados (dispositivos) e invoca capacidades de nodos.

Relacionado:

- Descripción general de Nodes: [Nodes](/es/nodes)
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
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` imprime tablas de pendientes/emparejados. Las filas emparejadas incluyen la antigüedad de la conexión más reciente (Last Connect).
Usa `--connected` para mostrar solo los nodos conectados actualmente. Usa `--last-connected <duration>` para
filtrar a los nodos que se conectaron dentro de una duración (por ejemplo `24h`, `7d`).

Nota sobre aprobación:

- `openclaw nodes pending` solo necesita alcance de emparejamiento.
- `openclaw nodes approve <requestId>` hereda requisitos de alcance adicionales de la
  solicitud pendiente:
  - solicitud sin comando: solo emparejamiento
  - comandos de nodo que no son de exec: emparejamiento + escritura
  - `system.run` / `system.run.prepare` / `system.which`: emparejamiento + admin

## Invocar

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Indicadores de invocación:

- `--params <json>`: cadena de objeto JSON (predeterminado `{}`).
- `--invoke-timeout <ms>`: tiempo de espera de invocación del nodo (predeterminado `15000`).
- `--idempotency-key <key>`: clave de idempotencia opcional.
- `system.run` y `system.run.prepare` están bloqueados aquí; usa la herramienta `exec` con `host=node` para la ejecución de shell.

Para la ejecución de shell en un nodo, usa la herramienta `exec` con `host=node` en lugar de `openclaw nodes run`.
La CLI de `nodes` ahora está centrada en capacidades: RPC directo mediante `nodes invoke`, además de emparejamiento, cámara,
pantalla, ubicación, canvas y notificaciones.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodes](/es/nodes)
