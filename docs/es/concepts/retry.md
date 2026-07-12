---
read_when:
    - Actualización del comportamiento de reintento o de los valores predeterminados del proveedor
    - Depuración de errores de envío del proveedor o límites de tasa
summary: Política de reintentos para llamadas salientes a proveedores
title: Política de reintentos
x-i18n:
    generated_at: "2026-07-11T23:05:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Objetivos

- Reintentar por solicitud HTTP, no por flujo de varios pasos.
- Conservar el orden reintentando únicamente el paso actual.
- Evitar duplicar operaciones no idempotentes.

## Valores predeterminados

| Configuración                | Valor predeterminado |
| ---------------------------- | -------------------- |
| Intentos                     | 3                    |
| Límite máximo de demora      | 30000 ms             |
| Variación aleatoria          | 0.1 (10%)            |
| Demora mínima de Telegram    | 400 ms               |
| Demora mínima de Discord     | 500 ms               |

## Comportamiento

### Proveedores de modelos

- OpenClaw permite que los SDK de los proveedores gestionen los reintentos breves habituales.
- En los SDK basados en Stainless, como Anthropic y OpenAI, las respuestas que admiten reintentos (`408`, `409`, `429` y `5xx`) pueden incluir `retry-after-ms` o `retry-after`. Cuando esa espera supera los 60 segundos, OpenClaw inyecta `x-should-retry: false` para que el SDK devuelva el error inmediatamente y la conmutación por error del modelo pueda cambiar a otro perfil de autenticación o modelo alternativo.
- Sobrescriba el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Establézcalo en `0`, `false`, `off`, `none` o `disabled` para permitir que los SDK respeten internamente las esperas prolongadas de `Retry-After`.

### Discord

- Reintenta ante errores de límite de solicitudes (HTTP 429), tiempos de espera agotados de solicitudes, respuestas HTTP 5xx y fallos transitorios de transporte, como fallos de búsqueda de DNS, restablecimientos de conexión, cierres de sockets y fallos de obtención.
- Utiliza el valor `retry_after` de Discord cuando está disponible; de lo contrario, aplica una espera exponencial.

### Telegram

- Reintenta ante errores transitorios (429, tiempo de espera agotado, conexión/restablecimiento/cierre, indisponibilidad temporal).
- Utiliza `retry_after` cuando está disponible; de lo contrario, aplica una espera exponencial.
- Los errores de análisis de HTML/Markdown no se reintentan; en el primer intento se recurre a texto sin formato.

## Configuración

Defina la política de reintentos por proveedor en `~/.openclaw/openclaw.json`:

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

- Los reintentos se aplican por solicitud (envío de mensajes, carga de contenido multimedia, reacción, encuesta, adhesivo).
- Los flujos compuestos no reintentan los pasos completados.

## Temas relacionados

- [Conmutación por error del modelo](/es/concepts/model-failover)
- [Cola de comandos](/es/concepts/queue)
