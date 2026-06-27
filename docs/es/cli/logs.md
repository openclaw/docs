---
read_when:
    - Necesitas seguir los logs del Gateway de forma remota (sin SSH)
    - Necesita líneas de registro JSON para herramientas
summary: Referencia de CLI para `openclaw logs` (seguir los logs del Gateway mediante RPC)
title: Registros
x-i18n:
    generated_at: "2026-06-27T11:00:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Sigue los registros de archivo del Gateway por RPC (funciona en modo remoto).

Relacionado:

- Descripción general del registro: [Registro](/es/logging)
- CLI del Gateway: [gateway](/es/cli/gateway)

## Opciones

- `--limit <n>`: número máximo de líneas de registro que se devolverán (predeterminado `200`)
- `--max-bytes <n>`: bytes máximos que se leerán del archivo de registro (predeterminado `250000`)
- `--follow`: seguir el flujo de registros
- `--interval <ms>`: intervalo de sondeo al seguir (predeterminado `1000`)
- `--json`: emitir eventos JSON delimitados por líneas
- `--plain`: salida de texto sin formato sin formato con estilos
- `--no-color`: deshabilitar los colores ANSI
- `--local-time`: representar marcas de tiempo en tu zona horaria local (predeterminado)
- `--utc`: representar marcas de tiempo en UTC

## Opciones RPC compartidas del Gateway

`openclaw logs` también acepta las marcas estándar del cliente Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: tiempo de espera en ms (predeterminado `30000`)
- `--expect-final`: esperar una respuesta final cuando la llamada al Gateway esté respaldada por un agente

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Notas

- Las marcas de tiempo se representan en tu zona horaria local de forma predeterminada. Usa `--utc` para la salida en UTC.
- Si el Gateway local loopback implícito solicita emparejamiento, se cierra durante la conexión o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al registro de archivo del Gateway configurado. Los destinos explícitos de `--url` no usan este mecanismo de reserva.
- `openclaw logs --follow` no sigue los mecanismos de reserva de archivo configurado después de fallos RPC implícitos del Gateway local. En Linux, usa el diario activo del Gateway de systemd de usuario por PID cuando está disponible e imprime el origen de registro seleccionado; de lo contrario, sigue reintentando el Gateway en vivo en lugar de seguir un archivo paralelo potencialmente obsoleto.
- Al usar `--follow`, las desconexiones transitorias del gateway (cierre de WebSocket, tiempo de espera, caída de conexión) activan la reconexión automática con retroceso exponencial (hasta 8 reintentos, con un máximo de 30 s entre intentos). Se imprime una advertencia en stderr en cada reintento, y se imprime un aviso `[logs] gateway reconnected` una vez que un sondeo se realiza correctamente. En modo `--json`, tanto la advertencia de reintento como la transición de reconexión se emiten como registros `{"type":"notice"}` en stderr. Los errores no recuperables (fallo de autenticación, configuración incorrecta) siguen saliendo inmediatamente.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Registro del Gateway](/es/gateway/logging)
