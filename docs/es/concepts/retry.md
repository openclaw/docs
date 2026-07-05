---
read_when:
    - Actualización del comportamiento o los valores predeterminados de reintentos del proveedor
    - Depuración de errores de envío del proveedor o límites de tasa
summary: Política de reintentos para llamadas salientes al proveedor
title: Política de reintentos
x-i18n:
    generated_at: "2026-07-05T11:16:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Objetivos

- Reintentar por solicitud HTTP, no por flujo de varios pasos.
- Preservar el orden reintentando solo el paso actual.
- Evitar duplicar operaciones no idempotentes.

## Valores predeterminados

| Configuración            | Valor predeterminado |
| ------------------ | --------- |
| Intentos           | 3         |
| Límite máximo de demora      | 30000 ms  |
| Variación aleatoria             | 0.1 (10%) |
| Demora mínima de Telegram | 400 ms    |
| Demora mínima de Discord  | 500 ms    |

## Comportamiento

### Proveedores de modelos

- OpenClaw permite que los SDKs de proveedores gestionen los reintentos breves normales.
- Para SDKs basados en Stainless, como Anthropic y OpenAI, las respuestas reintentables (`408`, `409`, `429` y `5xx`) pueden incluir `retry-after-ms` o `retry-after`. Cuando esa espera es superior a 60 segundos, OpenClaw inyecta `x-should-retry: false` para que el SDK exponga el error de inmediato y la conmutación por error de modelos pueda rotar a otro perfil de autenticación o modelo de respaldo.
- Sobrescribe el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Establécelo en `0`, `false`, `off`, `none` o `disabled` para permitir que los SDKs respeten internamente las esperas largas de `Retry-After`.

### Discord

- Reintenta en errores de límite de frecuencia (HTTP 429), tiempos de espera de solicitudes, respuestas HTTP 5xx y fallos transitorios de transporte, como fallos de búsqueda DNS, restablecimientos de conexión, cierres de socket y fallos de fetch.
- Usa `retry_after` de Discord cuando está disponible; de lo contrario, usa retroceso exponencial.

### Telegram

- Reintenta en errores transitorios (429, tiempo de espera, conexión/restablecimiento/cierre, temporalmente no disponible).
- Usa `retry_after` cuando está disponible; de lo contrario, usa retroceso exponencial.
- Los errores de análisis de HTML/Markdown no se reintentan; vuelven a texto sin formato en el primer intento.

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
- Los flujos compuestos no reintentan pasos completados.

## Relacionado

- [Conmutación por error de modelos](/es/concepts/model-failover)
- [Cola de comandos](/es/concepts/queue)
