---
read_when:
    - Quieres servir modelos desde tu propia máquina con GPU
    - Estás configurando LM Studio o un proxy compatible con OpenAI
    - Necesitas la guía más segura para modelos locales
summary: Ejecuta OpenClaw en LLM locales (LM Studio, vLLM, LiteLLM, endpoints personalizados de OpenAI)
title: Modelos locales
x-i18n:
    generated_at: "2026-04-15T05:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8778cc1c623a356ff3cf306c494c046887f9417a70ec71e659e4a8aae912a780
    source_path: gateway/local-models.md
    workflow: 15
---

# Modelos locales

Lo local es viable, pero OpenClaw espera un contexto amplio y defensas sólidas contra la inyección de prompts. Las tarjetas pequeñas truncan el contexto y debilitan la seguridad. Apunta alto: **≥2 Mac Studios al máximo o un equipo GPU equivalente (~$30k+)**. Una sola GPU de **24 GB** funciona solo para prompts más ligeros y con mayor latencia. Usa la **variante de modelo más grande / de tamaño completo que puedas ejecutar**; los checkpoints muy cuantizados o “small” aumentan el riesgo de inyección de prompts (consulta [Security](/es/gateway/security)).

Si quieres la configuración local con menos fricción, empieza con [LM Studio](/es/providers/lmstudio) o [Ollama](/es/providers/ollama) y `openclaw onboard`. Esta página es la guía con recomendaciones firmes para stacks locales de gama alta y servidores locales personalizados compatibles con OpenAI.

## Recomendado: LM Studio + modelo local grande (Responses API)

La mejor pila local actual. Carga un modelo grande en LM Studio (por ejemplo, una compilación de tamaño completo de Qwen, DeepSeek o Llama), habilita el servidor local (por defecto `http://127.0.0.1:1234`) y usa Responses API para mantener el razonamiento separado del texto final.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Modelo local”,
            reasoning: false,
            input: [“text”],
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

**Lista de verificación de configuración**

- Instala LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- En LM Studio, descarga la **compilación de modelo más grande disponible** (evita las variantes “small” o muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` la liste.
- Sustituye `my-local-model` por el ID real del modelo que muestra LM Studio.
- Mantén el modelo cargado; la carga en frío añade latencia de inicio.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio difiere.
- Para WhatsApp, mantente en Responses API para que solo se envíe el texto final.

Mantén configurados también los modelos alojados incluso cuando ejecutes uno local; usa `models.mode: "merge"` para que los fallbacks sigan disponibles.

### Configuración híbrida: principal alojado, fallback local

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

Intercambia el orden del principal y los fallbacks; mantén el mismo bloque de proveedores y `models.mode: "merge"` para poder recurrir a Sonnet u Opus cuando la máquina local no esté disponible.

### Alojamiento regional / enrutamiento de datos

- Las variantes alojadas de MiniMax/Kimi/GLM también existen en OpenRouter con endpoints fijados por región (por ejemplo, alojados en EE. UU.). Elige allí la variante regional para mantener el tráfico en la jurisdicción que prefieras y seguir usando `models.mode: "merge"` para fallbacks de Anthropic/OpenAI.
- Solo local sigue siendo la opción con mayor privacidad; el enrutamiento regional alojado es el punto intermedio cuando necesitas funciones del proveedor pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

vLLM, LiteLLM, OAI-proxy o gateways personalizados funcionan si exponen un endpoint `/v1` de estilo OpenAI. Sustituye el bloque del proveedor anterior por tu endpoint y el ID de tu modelo:

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

Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como fallbacks.

Nota de comportamiento para backends `/v1` locales o con proxy:

- OpenClaw los trata como rutas compatibles con OpenAI de estilo proxy, no como endpoints nativos de OpenAI
- el modelado de solicitudes exclusivo de OpenAI nativo no se aplica aquí: sin `service_tier`, sin `store` de Responses, sin modelado de payload de compatibilidad de razonamiento de OpenAI y sin indicaciones de caché de prompts
- los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en estas URL de proxy personalizadas

Notas de compatibilidad para backends compatibles con OpenAI más estrictos:

- Algunos servidores aceptan solo `messages[].content` como cadena en Chat Completions, no matrices estructuradas de partes de contenido. Configura `models.providers.<provider>.models[].compat.requiresStringContent: true` para esos endpoints.
- Algunos backends locales más pequeños o más estrictos son inestables con la forma completa del prompt del tiempo de ejecución del agente de OpenClaw, especialmente cuando se incluyen esquemas de herramientas. Si el backend funciona para llamadas directas pequeñas a `/v1/chat/completions` pero falla en turnos normales del agente de OpenClaw, primero prueba `agents.defaults.localModelMode: "lean"` para quitar herramientas predeterminadas pesadas como `browser`, `cron` y `message`; si eso sigue fallando, prueba `models.providers.<provider>.models[].compat.supportsTools: false`.
- Si el backend sigue fallando solo en ejecuciones más grandes de OpenClaw, el problema restante suele ser la capacidad del modelo/servidor upstream o un bug del backend, no la capa de transporte de OpenClaw.

## Solución de problemas

- ¿Gateway puede alcanzar el proxy? `curl http://127.0.0.1:1234/v1/models`.
- ¿El modelo de LM Studio se descargó de memoria? Vuélvelo a cargar; el arranque en frío es una causa común de “bloqueo”.
- OpenClaw advierte cuando la ventana de contexto detectada está por debajo de **32k** y bloquea por debajo de **16k**. Si llegas a esa verificación previa, aumenta el límite de contexto del servidor/modelo o elige un modelo más grande.
- ¿Errores de contexto? Reduce `contextWindow` o aumenta el límite de tu servidor.
- ¿El servidor compatible con OpenAI devuelve `messages[].content ... expected a string`? Añade `compat.requiresStringContent: true` en esa entrada del modelo.
- ¿Las llamadas directas pequeñas a `/v1/chat/completions` funcionan, pero `openclaw infer model run` falla con Gemma u otro modelo local? Primero desactiva los esquemas de herramientas con `compat.supportsTools: false`, luego vuelve a probar. Si el servidor sigue fallando solo con prompts más grandes de OpenClaw, trátalo como una limitación del modelo/servidor upstream.
- Seguridad: los modelos locales omiten los filtros del lado del proveedor; mantén agentes limitados y Compaction activado para limitar el radio de impacto de la inyección de prompts.
