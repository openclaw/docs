---
read_when:
    - Estás conectando superficies de uso/cuota del proveedor
    - Necesitas explicar el comportamiento del seguimiento de uso o los requisitos de autenticación
summary: Superficies de seguimiento de uso y requisitos de credenciales
title: Seguimiento de uso
x-i18n:
    generated_at: "2026-04-24T05:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## Qué es

- Extrae el uso/la cuota del proveedor directamente de sus endpoints de uso.
- No hay costos estimados; solo las ventanas informadas por el proveedor.
- La salida de estado legible para humanos se normaliza a `X% left`, incluso cuando
  una API ascendente informa cuota consumida, cuota restante o solo conteos sin procesar.
- `/status` a nivel de sesión y `session_status` pueden usar como respaldo la entrada de uso
  más reciente de la transcripción cuando la instantánea activa de la sesión es escasa. Ese
  respaldo completa contadores faltantes de tokens/caché, puede recuperar la etiqueta
  del modelo activo del entorno de ejecución y prefiere el total más grande orientado al prompt cuando faltan
  metadatos de sesión o son menores. Los valores activos no nulos existentes siguen teniendo prioridad.

## Dónde aparece

- `/status` en chats: tarjeta de estado rica en emoji con tokens de sesión + costo estimado (solo clave API). El uso del proveedor se muestra para el **proveedor del modelo actual** cuando está disponible como una ventana normalizada `X% left`.
- `/usage off|tokens|full` en chats: pie de uso por respuesta (OAuth muestra solo tokens).
- `/usage cost` en chats: resumen local de costos agregado desde los registros de sesión de OpenClaw.
- CLI: `openclaw status --usage` imprime un desglose completo por proveedor.
- CLI: `openclaw channels list` imprime la misma instantánea de uso junto con la configuración del proveedor (usa `--no-usage` para omitirla).
- barra de menús de macOS: sección “Uso” bajo Contexto (solo si está disponible).

## Proveedores + credenciales

- **Anthropic (Claude)**: tokens OAuth en perfiles de autenticación.
- **GitHub Copilot**: tokens OAuth en perfiles de autenticación.
- **Gemini CLI**: tokens OAuth en perfiles de autenticación.
  - El uso JSON usa `stats` como respaldo; `stats.cached` se normaliza a
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth en perfiles de autenticación (se usa accountId cuando está presente).
- **MiniMax**: clave API o perfil de autenticación OAuth de MiniMax. OpenClaw trata
  `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax,
  prefiere el OAuth almacenado de MiniMax cuando está presente y, en caso contrario, usa como respaldo
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax significan cuota
  **restante**, así que OpenClaw los invierte antes de mostrarlos; los campos basados en conteos tienen prioridad cuando
  están presentes.
  - Las etiquetas de ventana del plan de codificación provienen de los campos de horas/minutos del proveedor cuando
    están presentes, y en caso contrario usan como respaldo el intervalo `start_time` / `end_time`.
  - Si el endpoint del plan de codificación devuelve `model_remains`, OpenClaw prefiere la
    entrada del modelo de chat, deriva la etiqueta de ventana a partir de las marcas de tiempo cuando faltan
    los campos explícitos `window_hours` / `window_minutes`, e incluye el nombre del modelo
    en la etiqueta del plan.
- **Xiaomi MiMo**: clave API mediante env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: clave API mediante env/config/auth store.

El uso se oculta cuando no puede resolverse una autenticación útil de uso del proveedor. Los proveedores
pueden proporcionar lógica de autenticación de uso específica del Plugin; de lo contrario, OpenClaw usa como respaldo
la coincidencia de credenciales OAuth/clave API desde perfiles de autenticación, variables de entorno
o configuración.

## Relacionado

- [Uso y costos de tokens](/es/reference/token-use)
- [Uso y costos de API](/es/reference/api-usage-costs)
- [Caché de prompts](/es/reference/prompt-caching)
