---
read_when:
    - Necesitas seguir los logs de Gateway de forma remota (sin SSH)
    - Quieres líneas de registro JSON para herramientas
summary: Referencia de CLI para `openclaw logs` (seguir los registros de Gateway mediante RPC)
title: Registros
x-i18n:
    generated_at: "2026-07-05T11:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Sigue los registros de archivo del Gateway mediante RPC. Funciona en modo remoto.

## Opciones

- `--limit <n>`: máximo de líneas de registro que se devolverán (predeterminado `200`)
- `--max-bytes <n>`: máximo de bytes que se leerán del archivo de registro (predeterminado `250000`)
- `--follow`: seguir el flujo de registros
- `--interval <ms>`: intervalo de sondeo durante el seguimiento (predeterminado `1000`)
- `--json`: emitir eventos JSON delimitados por líneas
- `--plain`: salida de texto sin formato sin formato con estilo
- `--no-color`: desactivar colores ANSI
- `--local-time`: mostrar marcas de tiempo en tu zona horaria local (predeterminado)
- `--utc`: mostrar marcas de tiempo en UTC

## Opciones RPC compartidas del Gateway

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: tiempo de espera en ms (predeterminado `30000`)
- `--expect-final`: esperar una respuesta final cuando la llamada al Gateway esté respaldada por un agente

Pasar `--url` omite las credenciales de configuración aplicadas automáticamente; incluye `--token` explícitamente si el Gateway de destino requiere autenticación.

## Ejemplos

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Comportamiento de reserva y recuperación

- Si el Gateway de local loopback implícito solicita emparejamiento, se cierra durante la conexión o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al registro de archivo del Gateway configurado. Los destinos `--url` explícitos nunca usan esta reserva.
- `--follow` no recurre a ese archivo configurado después de una falla RPC implícita del Gateway local: un archivo paralelo obsoleto podría inducir a error en un seguimiento en vivo. En Linux, en su lugar usa el diario activo del Gateway de user-systemd por PID cuando está disponible (imprime la fuente seleccionada); de lo contrario, sigue reintentando el Gateway en vivo.
- Durante `--follow`, las desconexiones transitorias (cierre de WebSocket, tiempo de espera, caída de conexión) activan la reconexión automática con retroceso exponencial: hasta 8 reintentos, con un límite de 30 s entre intentos. Se imprime una advertencia en stderr en cada reintento, y se imprime un aviso `[logs] gateway reconnected` cuando una encuesta tiene éxito. En modo `--json`, ambos se emiten como registros `{"type":"notice"}` en stderr. Los errores no recuperables (falla de autenticación, configuración incorrecta) todavía salen de inmediato.
- En modo `--follow --json`, las transiciones de fuente de registro se emiten como registros `{"type":"meta"}`. Rastrea cursores por `sourceKind`: un flujo puede pasar de la salida del archivo del Gateway (`sourceKind: "file"`) a la reserva del diario local (`sourceKind: "journal"`, `localFallback: true`, con `service.pid`/`service.unit`) y volver a la salida del archivo del Gateway después de la recuperación. No asumas una única fuente o cursor estable para toda la sesión, y tolera líneas superpuestas cuando la recuperación reproduce el cursor del archivo del Gateway.

## Relacionado

- [Resumen de registro](/es/logging)
- [CLI del Gateway](/es/cli/gateway)
- [Referencia de CLI](/es/cli)
- [Registro del Gateway](/es/gateway/logging)
