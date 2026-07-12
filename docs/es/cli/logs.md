---
read_when:
    - Necesitas seguir los registros del Gateway de forma remota (sin SSH)
    - Quieres líneas de registro JSON para herramientas
summary: Referencia de la CLI para `openclaw logs` (seguir los registros del Gateway mediante RPC)
title: Registros
x-i18n:
    generated_at: "2026-07-11T22:56:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Sigue los registros de archivo del Gateway mediante RPC. Funciona en modo remoto.

## Opciones

- `--limit <n>`: número máximo de líneas de registro que se devolverán (valor predeterminado: `200`)
- `--max-bytes <n>`: número máximo de bytes que se leerán del archivo de registro (valor predeterminado: `250000`)
- `--follow`: sigue el flujo de registros
- `--interval <ms>`: intervalo de sondeo durante el seguimiento (valor predeterminado: `1000`)
- `--json`: emite eventos JSON delimitados por líneas
- `--plain`: salida de texto sin formato ni estilos
- `--no-color`: desactiva los colores ANSI
- `--local-time`: muestra las marcas de tiempo en tu zona horaria local (valor predeterminado)
- `--utc`: muestra las marcas de tiempo en UTC

## Opciones RPC compartidas del Gateway

- `--url <url>`: URL de WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: tiempo de espera en ms (valor predeterminado: `30000`)
- `--expect-final`: espera una respuesta final cuando la llamada al Gateway está respaldada por un agente

Al especificar `--url`, se omiten las credenciales de configuración aplicadas automáticamente; incluye `--token` explícitamente si el Gateway de destino requiere autenticación.

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

## Comportamiento de respaldo y recuperación

- Si el Gateway implícito de local loopback solicita emparejamiento, cierra la conexión durante su establecimiento o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al archivo de registro configurado del Gateway. Los destinos indicados explícitamente mediante `--url` nunca usan este respaldo.
- `--follow` no recurre a ese archivo configurado después de un fallo RPC del Gateway local implícito, ya que un archivo paralelo obsoleto podría inducir a error durante el seguimiento en vivo. En Linux, usa en su lugar el diario del Gateway activo de systemd del usuario mediante su PID cuando está disponible (e imprime la fuente seleccionada); de lo contrario, sigue intentando conectarse al Gateway en vivo.
- Durante `--follow`, las desconexiones transitorias (cierre de WebSocket, agotamiento del tiempo de espera o interrupción de la conexión) activan la reconexión automática con espera exponencial: hasta 8 reintentos, con un máximo de 30 s entre intentos. En cada reintento se imprime una advertencia en stderr y, cuando un sondeo se completa correctamente, se imprime una vez el aviso `[logs] gateway reconnected`. En el modo `--json`, ambos se emiten como registros `{"type":"notice"}` en stderr. Los errores no recuperables (fallo de autenticación o configuración incorrecta) siguen provocando una salida inmediata.
- En el modo `--follow --json`, las transiciones entre fuentes de registro se emiten como registros `{"type":"meta"}`. Mantén los cursores por `sourceKind`: un flujo puede pasar de la salida del archivo del Gateway (`sourceKind: "file"`) al respaldo del diario local (`sourceKind: "journal"`, `localFallback: true`, con `service.pid`/`service.unit`) y volver a la salida del archivo del Gateway tras la recuperación. No supongas que habrá una única fuente o un único cursor estable durante toda la sesión y admite líneas superpuestas cuando la recuperación vuelva a reproducir el cursor del archivo del Gateway.

## Contenido relacionado

- [Descripción general del registro](/es/logging)
- [CLI del Gateway](/es/cli/gateway)
- [Referencia de la CLI](/es/cli)
- [Registro del Gateway](/es/gateway/logging)
