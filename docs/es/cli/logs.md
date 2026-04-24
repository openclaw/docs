---
read_when:
    - Necesitas seguir los registros de Gateway de forma remota (sin SSH)
    - Quieres líneas de registro JSON para herramientas
summary: Referencia de la CLI para `openclaw logs` (seguir los registros de Gateway mediante RPC)
title: Registros
x-i18n:
    generated_at: "2026-04-24T05:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Sigue los registros de archivos de Gateway mediante RPC (funciona en modo remoto).

Relacionado:

- Resumen de registros: [Registros](/es/logging)
- CLI de Gateway: [gateway](/es/cli/gateway)

## Opciones

- `--limit <n>`: número máximo de líneas de registro que se devolverán (predeterminado `200`)
- `--max-bytes <n>`: número máximo de bytes que se leerán del archivo de registro (predeterminado `250000`)
- `--follow`: sigue el flujo de registros
- `--interval <ms>`: intervalo de sondeo durante el seguimiento (predeterminado `1000`)
- `--json`: emite eventos JSON delimitados por líneas
- `--plain`: salida de texto sin formato y sin formato con estilo
- `--no-color`: desactiva los colores ANSI
- `--local-time`: muestra las marcas de tiempo en tu zona horaria local

## Opciones RPC compartidas de Gateway

`openclaw logs` también acepta las banderas estándar del cliente de Gateway:

- `--url <url>`: URL WebSocket de Gateway
- `--token <token>`: token de Gateway
- `--timeout <ms>`: tiempo de espera en ms (predeterminado `30000`)
- `--expect-final`: espera una respuesta final cuando la llamada a Gateway está respaldada por un agente

Cuando pasas `--url`, la CLI no aplica automáticamente credenciales de configuración ni de entorno. Incluye `--token` explícitamente si el Gateway de destino requiere autenticación.

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
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Notas

- Usa `--local-time` para mostrar las marcas de tiempo en tu zona horaria local.
- Si el Gateway de `local loopback` solicita emparejamiento, `openclaw logs` recurre automáticamente al archivo de registro local configurado. Los destinos `--url` explícitos no usan esta alternativa.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Registros de Gateway](/es/gateway/logging)
