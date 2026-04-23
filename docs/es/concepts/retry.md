---
read_when:
    - Actualizar el comportamiento o los valores predeterminados de reintento del proveedor
    - Depurar errores de envío del proveedor o límites de tasa
summary: Política de reintentos para llamadas salientes al proveedor
title: Política de reintentos
x-i18n:
    generated_at: "2026-04-23T05:14:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Política de reintentos

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

- OpenClaw permite que los SDK del proveedor gestionen los reintentos cortos normales.
- Para SDK basados en Stainless, como Anthropic y OpenAI, las respuestas reintentables
  (`408`, `409`, `429` y `5xx`) pueden incluir `retry-after-ms` o
  `retry-after`. Cuando esa espera es superior a 60 segundos, OpenClaw inyecta
  `x-should-retry: false` para que el SDK exponga el error de inmediato y la
  conmutación por error del modelo pueda rotar a otro perfil de autenticación o modelo de respaldo.
- Reemplaza el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Establécelo en `0`, `false`, `off`, `none` o `disabled` para permitir que los SDK respeten internamente
  las esperas largas de `Retry-After`.

### Discord

- Reintenta solo en errores de límite de tasa (HTTP 429).
- Usa `retry_after` de Discord cuando está disponible; de lo contrario, usa retroceso exponencial.

### Telegram

- Reintenta en errores transitorios (429, timeout, connect/reset/closed, temporalmente no disponible).
- Usa `retry_after` cuando está disponible; de lo contrario, usa retroceso exponencial.
- Los errores de análisis de Markdown no se reintentan; recurren a texto sin formato.

## Configuración

Configura la política de reintentos por proveedor en `~/.openclaw/openclaw.json`:

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

- Los reintentos se aplican por solicitud (envío de mensajes, carga de medios, reacción, encuesta, sticker).
- Los flujos compuestos no reintentan pasos ya completados.
