---
read_when:
    - Necesitas seguir los registros de Gateway de forma remota (sin SSH)
    - Quieres líneas de registro JSON para herramientas
summary: Referencia de la CLI para `openclaw logs` (seguir los registros de Gateway mediante RPC)
title: Registros
x-i18n:
    generated_at: "2026-07-01T15:19:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Sigue los logs de archivo de Gateway por RPC (funciona en modo remoto).

Relacionado:

- Descripción general del registro: [Registro](/es/logging)
- CLI de Gateway: [gateway](/es/cli/gateway)

## Opciones

- `--limit <n>`: número máximo de líneas de log que se devolverán (predeterminado `200`)
- `--max-bytes <n>`: bytes máximos que se leerán del archivo de log (predeterminado `250000`)
- `--follow`: seguir el flujo de logs
- `--interval <ms>`: intervalo de sondeo mientras se sigue (predeterminado `1000`)
- `--json`: emitir eventos JSON delimitados por líneas
- `--plain`: salida de texto sin formato sin formato con estilo
- `--no-color`: desactivar colores ANSI
- `--local-time`: renderizar marcas de tiempo en tu zona horaria local (predeterminado)
- `--utc`: renderizar marcas de tiempo en UTC

## Opciones RPC compartidas de Gateway

`openclaw logs` también acepta las marcas estándar del cliente de Gateway:

- `--url <url>`: URL WebSocket de Gateway
- `--token <token>`: token de Gateway
- `--timeout <ms>`: tiempo de espera en ms (predeterminado `30000`)
- `--expect-final`: esperar una respuesta final cuando la llamada de Gateway está respaldada por un agente

Cuando pasas `--url`, la CLI no aplica automáticamente las credenciales de configuración ni de entorno. Incluye `--token` explícitamente si el Gateway de destino requiere autenticación.

## Ejemplos

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Notas

- Las marcas de tiempo se renderizan en tu zona horaria local de forma predeterminada. Usa `--utc` para la salida en UTC.
- Si el Gateway local loopback implícito solicita emparejamiento, se cierra durante la conexión o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al log de archivo de Gateway configurado. Los destinos explícitos con `--url` no usan este respaldo.
- `openclaw logs --follow` no sigue respaldos de archivo configurado después de fallos RPC implícitos del Gateway local. En Linux, usa el diario de Gateway user-systemd activo por PID cuando está disponible e imprime la fuente de log seleccionada; de lo contrario, sigue reintentando el Gateway en vivo en vez de seguir un archivo adyacente que podría estar obsoleto.
- Al usar `--follow`, las desconexiones transitorias de Gateway (cierre de WebSocket, tiempo de espera agotado, caída de conexión) activan la reconexión automática con retroceso exponencial (hasta 8 reintentos, con un límite de 30 s entre intentos). Se imprime una advertencia en stderr en cada reintento, y se imprime un aviso `[logs] gateway reconnected` cuando un sondeo se realiza correctamente. En modo `--json`, tanto la advertencia de reintento como la transición de reconexión se emiten como registros `{"type":"notice"}` en stderr. Los errores no recuperables (fallo de autenticación, configuración incorrecta) siguen saliendo inmediatamente.
- En modo `--follow --json`, las transiciones de fuente de log se emiten como registros `{"type":"meta"}`. Los consumidores deben seguir los cursores por cada `sourceKind`: un flujo puede pasar de la salida de archivo de Gateway (`sourceKind: "file"`) al respaldo de diario local (`sourceKind: "journal"`, `localFallback: true`, con `service.pid`/`service.unit`) y volver a la salida de archivo de Gateway después de la recuperación. No asumas una única fuente o cursor estable para toda la sesión de seguimiento, y tolera líneas superpuestas cuando la recuperación reproduce el cursor del archivo de Gateway.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Registro de Gateway](/es/gateway/logging)
