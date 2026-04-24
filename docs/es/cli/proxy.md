---
read_when:
    - Necesitas capturar tráfico de transporte de OpenClaw localmente para depuración
    - Quieres inspeccionar sesiones del proxy de depuración, blobs o preajustes de consulta integrados
summary: Referencia de CLI para `openclaw proxy`, el proxy local de depuración y el inspector de capturas
title: Proxy
x-i18n:
    generated_at: "2026-04-24T05:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Ejecuta el proxy local explícito de depuración e inspecciona el tráfico capturado.

Este es un comando de depuración para investigación a nivel de transporte. Puede iniciar un
proxy local, ejecutar un comando hijo con captura habilitada, listar sesiones de captura,
consultar patrones de tráfico comunes, leer blobs capturados y purgar los datos locales
de captura.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Preajustes de consulta

`openclaw proxy query --preset <name>` acepta:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notas

- `start` usa `127.0.0.1` de forma predeterminada a menos que se establezca `--host`.
- `run` inicia un proxy local de depuración y luego ejecuta el comando después de `--`.
- Las capturas son datos locales de depuración; usa `openclaw proxy purge` al terminar.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
