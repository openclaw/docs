---
read_when:
    - Actualizar el comportamiento o los valores predeterminados de reintento del proveedor
    - Depurar errores de envío del proveedor o límites de tasa
summary: Política de reintentos para llamadas salientes al proveedor
title: Política de reintentos
x-i18n:
    generated_at: "2026-04-24T05:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Objetivos

- Reintentar por solicitud HTTP, no por flujo de varios pasos.
- Preservar el orden reintentando solo el paso actual.
- Evitar duplicar operaciones no idempotentes.

## Valores predeterminados

- Intentos: 3
- Límite máximo de demora: 30000 ms
- Jitter: 0.1 (10 por ciento)
- Valores predeterminados por proveedor:
  - Demora mínima de Telegram: 400 ms
  - Demora mínima de Discord: 500 ms

## Comportamiento

### Proveedores de modelos

- OpenClaw deja que los SDK de proveedores manejen los reintentos cortos normales.
- Para SDK basados en Stainless, como Anthropic y OpenAI, las respuestas reintentables
  (`408`, `409`, `429` y `5xx`) pueden incluir `retry-after-ms` o
  `retry-after`. Cuando esa espera es superior a 60 segundos, OpenClaw inyecta
  `x-should-retry: false` para que el SDK muestre el error inmediatamente y la
  conmutación por error del modelo pueda rotar a otro perfil de autenticación o modelo alternativo.
- Sobrescribe el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Establécelo en `0`, `false`, `off`, `none` o `disabled` para permitir que los SDK respeten
  internamente esperas largas de `Retry-After`.

### Discord

- Reintenta solo en errores de límite de tasa (HTTP 429).
- Usa `retry_after` de Discord cuando está disponible; en caso contrario usa backoff exponencial.

### Telegram

- Reintenta en errores transitorios (429, timeout, connect/reset/closed, temporalmente no disponible).
- Usa `retry_after` cuando está disponible; en caso contrario usa backoff exponencial.
- Los errores de análisis de Markdown no se reintentan; recurren a texto plano.

## Configuración

Establece la política de reintentos por proveedor en `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Notas

- Los reintentos se aplican por solicitud (envío de mensaje, carga de medios, reacción, encuesta, sticker).
- Los flujos compuestos no reintentan pasos ya completados.

## Relacionado

- [Conmutación por error de modelos](/es/concepts/model-failover)
- [Cola de comandos](/es/concepts/queue)
