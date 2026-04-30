---
read_when:
    - Necesitas seguir los registros del Gateway de forma remota (sin SSH)
    - Quieres líneas de registro JSON para herramientas
summary: Referencia de la CLI para `openclaw logs` (seguir los registros del Gateway mediante RPC)
title: Registros
x-i18n:
    generated_at: "2026-04-30T05:34:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Sigue en tiempo real los registros de archivo del Gateway por RPC (funciona en modo remoto).

Relacionado:

- Resumen de registros: [Registros](/es/logging)
- CLI del Gateway: [gateway](/es/cli/gateway)

## Opciones

- `--limit <n>`: número máximo de líneas de registro que devolver (predeterminado `200`)
- `--max-bytes <n>`: bytes máximos que leer del archivo de registro (predeterminado `250000`)
- `--follow`: seguir el flujo de registros
- `--interval <ms>`: intervalo de sondeo mientras se sigue (predeterminado `1000`)
- `--json`: emitir eventos JSON delimitados por líneas
- `--plain`: salida de texto sin formato, sin formato estilizado
- `--no-color`: desactivar colores ANSI
- `--local-time`: mostrar marcas de tiempo en tu zona horaria local

## Opciones RPC compartidas del Gateway

`openclaw logs` también acepta las opciones estándar del cliente Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: tiempo de espera en ms (predeterminado `30000`)
- `--expect-final`: esperar una respuesta final cuando la llamada al Gateway esté respaldada por un agente

Cuando pasas `--url`, la CLI no aplica automáticamente la configuración ni las credenciales de entorno. Incluye `--token` explícitamente si el Gateway de destino requiere autenticación.

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

- Usa `--local-time` para mostrar marcas de tiempo en tu zona horaria local.
- Si el Gateway de local loopback implícito solicita emparejamiento, se cierra durante la conexión o agota el tiempo antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al registro de archivo del Gateway configurado. Los destinos explícitos de `--url` no usan esta alternativa.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Registros del Gateway](/es/gateway/logging)
