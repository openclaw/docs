---
read_when:
    - Quieres servir modelos desde tu propia máquina con GPU
    - Estás conectando LM Studio o un proxy compatible con OpenAI
    - Necesitas la guía más segura para modelos locales
summary: Ejecutar OpenClaw con LLM locales (LM Studio, vLLM, LiteLLM, endpoints OpenAI personalizados)
title: Modelos locales
x-i18n:
    generated_at: "2026-04-24T05:29:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Es posible usar modelos locales, pero OpenClaw espera un contexto amplio y defensas sólidas contra la inyección de prompts. Las tarjetas pequeñas truncan el contexto y debilitan la seguridad. Aspira a algo grande: **≥2 Mac Studio al máximo o un equipo GPU equivalente (~30 000 USD o más)**. Una sola GPU de **24 GB** solo sirve para prompts más ligeros y con mayor latencia. Usa la **variante de modelo más grande / de tamaño completo que puedas ejecutar**; los checkpoints muy cuantizados o “small” aumentan el riesgo de inyección de prompts (consulta [Seguridad](/es/gateway/security)).

Si quieres la configuración local con menos fricción, empieza con [LM Studio](/es/providers/lmstudio) o [Ollama](/es/providers/ollama) y `openclaw onboard`. Esta página es la guía con criterio para pilas locales de gama alta y servidores locales personalizados compatibles con OpenAI.

## Recomendado: LM Studio + modelo local grande (Responses API)

La mejor pila local actual. Carga un modelo grande en LM Studio (por ejemplo, una compilación de tamaño completo de Qwen, DeepSeek o Llama), habilita el servidor local (predeterminado `http://127.0.0.1:1234`) y usa Responses API para mantener el razonamiento separado del texto final.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Lista de comprobación de configuración**

- Instala LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- En LM Studio, descarga la **compilación de modelo más grande disponible** (evita variantes “small” o muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` lo liste.
- Sustituye `my-local-model` por el ID real del modelo que muestra LM Studio.
- Mantén el modelo cargado; la carga en frío añade latencia de arranque.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio es diferente.
- Para WhatsApp, limítate a Responses API para que solo se envíe el texto final.

Mantén configurados también modelos alojados incluso si ejecutas local; usa `models.mode: "merge"` para que las alternativas sigan disponibles.

### Configuración híbrida: principal alojado, alternativa local

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Prioridad local con red de seguridad alojada

Intercambia el orden de principal y alternativa; mantén el mismo bloque de proveedores y `models.mode: "merge"` para poder recurrir a Sonnet u Opus cuando la máquina local no esté disponible.

### Alojamiento regional / enrutamiento de datos

- Las variantes alojadas de MiniMax/Kimi/GLM también existen en OpenRouter con endpoints fijados por región (por ejemplo, alojados en EE. UU.). Elige allí la variante regional para mantener el tráfico dentro de tu jurisdicción elegida mientras sigues usando `models.mode: "merge"` para alternativas de Anthropic/OpenAI.
- El modo solo local sigue siendo la ruta de privacidad más fuerte; el enrutamiento regional alojado es el punto intermedio cuando necesitas funciones del proveedor pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

vLLM, LiteLLM, OAI-proxy u otros gateways personalizados funcionan si exponen un endpoint estilo OpenAI `/v1`. Sustituye el bloque de proveedor anterior por tu endpoint y el ID de tu modelo:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como alternativas.

Nota de comportamiento para backends locales/proxificados `/v1`:

- OpenClaw los trata como rutas tipo proxy compatibles con OpenAI, no como endpoints nativos de OpenAI
- el ajuste de solicitudes exclusivo de OpenAI nativo no se aplica aquí: no
  `service_tier`, no `store` de Responses, no ajuste de carga útil de compatibilidad
  de razonamiento de OpenAI y no hay indicaciones de caché de prompt
- los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`)
  no se inyectan en estas URL personalizadas de proxy

Notas de compatibilidad para backends compatibles con OpenAI más estrictos:

- Algunos servidores aceptan solo `messages[].content` como cadena en Chat Completions, no
  matrices estructuradas de partes de contenido. Establece
  `models.providers.<provider>.models[].compat.requiresStringContent: true` para
  esos endpoints.
- Algunos backends locales más pequeños o más estrictos son inestables con la forma completa del prompt del runtime
  del agente de OpenClaw, especialmente cuando se incluyen esquemas de herramientas. Si el
  backend funciona para llamadas diminutas directas a `/v1/chat/completions` pero falla en turnos normales
  del agente de OpenClaw, primero prueba
  `agents.defaults.experimental.localModelLean: true` para eliminar herramientas
  predeterminadas pesadas como `browser`, `cron` y `message`; esto es una marca
  experimental, no un ajuste estable del modo predeterminado. Consulta
  [Funciones experimentales](/es/concepts/experimental-features). Si aun así falla, prueba
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Si el backend sigue fallando solo en ejecuciones más grandes de OpenClaw, el problema restante
  suele ser la capacidad del modelo/servidor de origen o un error del backend, no la
  capa de transporte de OpenClaw.

## Solución de problemas

- ¿El gateway puede alcanzar el proxy? `curl http://127.0.0.1:1234/v1/models`.
- ¿Modelo de LM Studio descargado de memoria? Vuelve a cargarlo; el arranque en frío es una causa común de “bloqueo”.
- OpenClaw avisa cuando la ventana de contexto detectada es inferior a **32k** y bloquea por debajo de **16k**. Si llegas a ese control previo, aumenta el límite de contexto del servidor/modelo o elige un modelo más grande.
- ¿Errores de contexto? Reduce `contextWindow` o aumenta el límite de tu servidor.
- ¿El servidor compatible con OpenAI devuelve `messages[].content ... expected a string`?
  Añade `compat.requiresStringContent: true` en esa entrada de modelo.
- ¿Las llamadas diminutas directas a `/v1/chat/completions` funcionan, pero `openclaw infer model run`
  falla con Gemma u otro modelo local? Primero desactiva los esquemas de herramientas con
  `compat.supportsTools: false` y vuelve a probar. Si el servidor sigue fallando solo
  con prompts más grandes de OpenClaw, trátalo como una limitación del modelo/servidor de origen.
- Seguridad: los modelos locales omiten los filtros del lado del proveedor; mantén los agentes acotados y Compaction activado para limitar el radio de impacto de la inyección de prompts.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Conmutación por error de modelos](/es/concepts/model-failover)
