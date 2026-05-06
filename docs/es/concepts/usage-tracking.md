---
read_when:
    - Estás conectando las superficies de uso/cuota del proveedor
    - Debe explicar el comportamiento del seguimiento de uso o los requisitos de autenticación
summary: Interfaces de seguimiento del uso y requisitos de credenciales
title: Seguimiento de uso
x-i18n:
    generated_at: "2026-05-06T05:33:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Qué es

- Extrae el uso/cuota del proveedor directamente desde sus endpoints de uso.
- Sin costos estimados; solo las ventanas reportadas por el proveedor.
- La salida de estado legible para humanos se normaliza a `X% left`, incluso cuando una
  API upstream reporta cuota consumida, cuota restante o solo conteos sin procesar.
- `/status` y `session_status` a nivel de sesión pueden recurrir a la entrada de uso
  más reciente de la transcripción cuando la instantánea de sesión en vivo es escasa. Ese
  respaldo rellena contadores faltantes de tokens/caché, puede recuperar la etiqueta del modelo
  de runtime activo y prefiere el total orientado al prompt más grande cuando faltan
  metadatos de sesión o son menores. Los valores en vivo existentes distintos de cero siguen teniendo prioridad.

## Dónde aparece

- `/status` en chats: tarjeta de estado rica en emoji con tokens de sesión + costo estimado (solo clave de API). El uso del proveedor se muestra para el **proveedor del modelo actual** cuando está disponible como una ventana normalizada `X% left`.
- `/usage off|tokens|full` en chats: pie de uso por respuesta (OAuth muestra solo tokens).
- `/usage cost` en chats: resumen de costo local agregado desde los registros de sesión de OpenClaw.
- CLI: `openclaw status --usage` imprime un desglose completo por proveedor.
- CLI: `openclaw channels list` imprime la misma instantánea de uso junto con la configuración del proveedor (usa `--no-usage` para omitirla).
- barra de menú de macOS: sección "Uso" bajo Contexto (solo si está disponible).

## Proveedores + credenciales

- **Anthropic (Claude)**: tokens OAuth en perfiles de autenticación.
- **GitHub Copilot**: tokens OAuth en perfiles de autenticación.
- **Gemini CLI**: tokens OAuth en perfiles de autenticación.
  - El uso JSON recurre a `stats`; `stats.cached` se normaliza en
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth en perfiles de autenticación (`accountId` se usa cuando está presente).
- **MiniMax**: clave de API o perfil de autenticación OAuth de MiniMax. OpenClaw trata
  `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax,
  prefiere OAuth de MiniMax almacenado cuando está presente y, de lo contrario, recurre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  El sondeo de uso deriva el host del Coding Plan desde `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` cuando está configurado y, de lo contrario, usa el
  host CN de MiniMax.
  Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax significan cuota
  **restante**, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en conteo tienen prioridad cuando
  están presentes.
  - Las etiquetas de ventana del plan de codificación provienen de los campos de horas/minutos del proveedor cuando
    están presentes y luego recurren al intervalo `start_time` / `end_time`.
  - Si el endpoint del plan de codificación devuelve `model_remains`, OpenClaw prefiere la
    entrada del modelo de chat, deriva la etiqueta de ventana de las marcas de tiempo cuando los campos explícitos
    `window_hours` / `window_minutes` están ausentes e incluye el nombre del modelo
    en la etiqueta del plan.
- **Xiaomi MiMo**: clave de API mediante env/config/almacén de autenticación (`XIAOMI_API_KEY`).
- **z.ai**: clave de API mediante env/config/almacén de autenticación.

El uso se oculta cuando no se puede resolver ninguna autenticación de uso de proveedor utilizable. Los proveedores
pueden suministrar lógica de autenticación de uso específica de plugin; de lo contrario, OpenClaw recurre a
credenciales OAuth/clave de API coincidentes desde perfiles de autenticación, variables de entorno
o configuración.

## Relacionado

- [Uso de tokens y costos](/es/reference/token-use)
- [Uso y costos de API](/es/reference/api-usage-costs)
- [Caché de prompts](/es/reference/prompt-caching)
