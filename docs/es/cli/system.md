---
read_when:
    - Quieres poner en cola un evento del sistema sin crear un trabajo de Cron
    - Necesitas habilitar o deshabilitar Heartbeats
    - Quieres inspeccionar entradas de presencia del sistema
summary: Referencia de CLI para `openclaw system` (eventos del sistema, Heartbeat, presencia)
title: Sistema
x-i18n:
    generated_at: "2026-04-24T05:24:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Ayudantes a nivel de sistema para el Gateway: poner en cola eventos del sistema, controlar Heartbeats
y ver la presencia.

Todos los subcomandos de `system` usan RPC del Gateway y aceptan las flags compartidas del cliente:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Comandos comunes

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Pone en cola un evento del sistema en la sesión **principal**. El siguiente Heartbeat lo inyectará
como una línea `System:` en el prompt. Usa `--mode now` para activar el Heartbeat
inmediatamente; `next-heartbeat` espera al siguiente tick programado.

Flags:

- `--text <text>`: texto obligatorio del evento del sistema.
- `--mode <mode>`: `now` o `next-heartbeat` (predeterminado).
- `--json`: salida legible por máquinas.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartidas de RPC del Gateway.

## `system heartbeat last|enable|disable`

Controles de Heartbeat:

- `last`: muestra el último evento de Heartbeat.
- `enable`: vuelve a activar Heartbeats (úsalo si estaban deshabilitados).
- `disable`: pausa Heartbeats.

Flags:

- `--json`: salida legible por máquinas.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartidas de RPC del Gateway.

## `system presence`

Lista las entradas actuales de presencia del sistema que conoce el Gateway (Node,
instancias y líneas de estado similares).

Flags:

- `--json`: salida legible por máquinas.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartidas de RPC del Gateway.

## Notas

- Requiere un Gateway en ejecución accesible mediante tu configuración actual (local o remota).
- Los eventos del sistema son efímeros y no persisten entre reinicios.

## Relacionado

- [Referencia de CLI](/es/cli)
