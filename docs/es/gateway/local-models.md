---
read_when:
    - Quieres servir modelos desde tu propio equipo con GPU
    - Estás conectando LM Studio o un proxy compatible con OpenAI
    - Necesitas la guía más segura para modelos locales
summary: Ejecutar OpenClaw en LLM locales (LM Studio, vLLM, LiteLLM, puntos de conexión personalizados de OpenAI)
title: Modelos locales
x-i18n:
    generated_at: "2026-04-30T09:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Local es viable, pero OpenClaw espera un contexto grande y defensas sólidas contra la inyección de prompts. Las tarjetas pequeñas truncan el contexto y debilitan la seguridad. Apunta alto: **≥2 Mac Studios al máximo o una plataforma GPU equivalente (~$30k+)**. Una sola GPU de **24 GB** solo funciona para prompts más ligeros con mayor latencia. Usa la **variante de modelo más grande / de tamaño completo que puedas ejecutar**; los checkpoints cuantizados de forma agresiva o “pequeños” aumentan el riesgo de inyección de prompts (consulta [Seguridad](/es/gateway/security)).

Si quieres la configuración local con menos fricción, empieza con [LM Studio](/es/providers/lmstudio) u [Ollama](/es/providers/ollama) y `openclaw onboard`. Esta página es la guía con criterio para stacks locales de gama alta y servidores locales personalizados compatibles con OpenAI.

<Warning>
**Usuarios de WSL2 + Ollama + NVIDIA/CUDA:** El instalador oficial de Ollama para Linux habilita un servicio systemd con `Restart=always`. En configuraciones WSL2 con GPU, el inicio automático puede recargar el último modelo durante el arranque y fijar memoria del host. Si tu VM de WSL2 se reinicia repetidamente después de habilitar Ollama, consulta [bucle de fallos de WSL2](/es/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Recomendado: LM Studio + modelo local grande (Responses API)

El mejor stack local actual. Carga un modelo grande en LM Studio (por ejemplo, una compilación de tamaño completo de Qwen, DeepSeek o Llama), habilita el servidor local (`http://127.0.0.1:1234` de forma predeterminada) y usa Responses API para mantener el razonamiento separado del texto final.

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

**Lista de configuración**

- Instala LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- En LM Studio, descarga la **compilación de modelo más grande disponible** (evita variantes “pequeñas” o muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` lo liste.
- Sustituye `my-local-model` por el ID de modelo real que se muestra en LM Studio.
- Mantén el modelo cargado; la carga en frío añade latencia de inicio.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio difiere.
- Para WhatsApp, usa Responses API para que solo se envíe el texto final.

Mantén los modelos alojados configurados incluso cuando ejecutes en local; usa `models.mode: "merge"` para que los fallbacks sigan disponibles.

### Configuración híbrida: primario alojado, fallback local

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

Intercambia el orden de primario y fallback; mantén el mismo bloque de providers y `models.mode: "merge"` para poder recurrir a Sonnet u Opus cuando la máquina local esté caída.

### Alojamiento regional / enrutamiento de datos

- También existen variantes alojadas de MiniMax/Kimi/GLM en OpenRouter con endpoints fijados por región (por ejemplo, alojados en EE. UU.). Elige allí la variante regional para mantener el tráfico en la jurisdicción que elijas y seguir usando `models.mode: "merge"` para fallbacks de Anthropic/OpenAI.
- Solo local sigue siendo la ruta de privacidad más sólida; el enrutamiento regional alojado es el punto intermedio cuando necesitas funciones del proveedor, pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o Gateways personalizados funcionan si exponen un endpoint `/v1/chat/completions` de estilo OpenAI. Usa el adaptador Chat Completions salvo que el backend documente explícitamente compatibilidad con `/v1/responses`. Sustituye el bloque de provider anterior por tu endpoint e ID de modelo:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
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

Si se omite `api` en un provider personalizado con `baseUrl`, OpenClaw usa `openai-completions` de forma predeterminada. Los endpoints de loopback como `127.0.0.1` se consideran de confianza automáticamente; los endpoints de LAN, tailnet y DNS privado aún necesitan `request.allowPrivateNetwork: true`.

El valor `models.providers.<id>.models[].id` es local al provider. No incluyas ahí el prefijo del provider. Por ejemplo, un servidor MLX iniciado con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` debería usar este ID de catálogo y referencia de modelo:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Configura `input: ["text", "image"]` en modelos locales o de visión proxied para que los adjuntos de imagen se inyecten en los turnos del agente. El onboarding interactivo de provider personalizado infiere IDs comunes de modelos de visión y solo pregunta por nombres desconocidos. El onboarding no interactivo usa la misma inferencia; usa `--custom-image-input` para IDs de visión desconocidos o `--custom-text-input` cuando un modelo que parece conocido es solo de texto detrás de tu endpoint.

Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como fallbacks. Usa `models.providers.<id>.timeoutSeconds` para servidores de modelos locales o remotos lentos antes de aumentar `agents.defaults.timeoutSeconds`. El timeout del provider se aplica solo a solicitudes HTTP de modelo, incluida la conexión, las cabeceras, el streaming del cuerpo y la cancelación total de guarded-fetch.

<Note>
Para providers personalizados compatibles con OpenAI, se acepta persistir un marcador local no secreto como `apiKey: "ollama-local"` cuando `baseUrl` resuelve a loopback, una LAN privada, `.local` o un hostname simple. OpenClaw lo trata como una credencial local válida en lugar de informar que falta una clave. Usa un valor real para cualquier provider que acepte un hostname público.
</Note>

Nota de comportamiento para backends `/v1` locales/proxied:

- OpenClaw los trata como rutas compatibles con OpenAI de estilo proxy, no como endpoints nativos de OpenAI
- el moldeado de solicitudes exclusivo de OpenAI nativo no se aplica aquí: sin `service_tier`, sin `store` de Responses, sin moldeado de payload de compatibilidad de razonamiento de OpenAI y sin pistas de caché de prompts
- las cabeceras ocultas de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en estas URL de proxy personalizadas

Notas de compatibilidad para backends compatibles con OpenAI más estrictos:

- Algunos servidores solo aceptan `messages[].content` como cadena en Chat Completions, no arrays estructurados de partes de contenido. Configura `models.providers.<provider>.models[].compat.requiresStringContent: true` para esos endpoints.
- Algunos modelos locales emiten solicitudes de herramientas entre corchetes independientes como texto, como `[tool_name]` seguido de JSON y `[END_TOOL_REQUEST]`. OpenClaw las promueve a llamadas reales a herramientas solo cuando el nombre coincide exactamente con una herramienta registrada para el turno; de lo contrario, el bloque se trata como texto no compatible y se oculta de las respuestas visibles para el usuario.
- Si un modelo emite JSON, XML o texto de estilo ReAct que parece una llamada a herramienta, pero el provider no emitió una invocación estructurada, OpenClaw lo deja como texto y registra una advertencia con el ID de ejecución, provider/modelo, patrón detectado y nombre de herramienta cuando esté disponible. Trátalo como incompatibilidad de llamadas a herramientas del provider/modelo, no como una ejecución de herramienta completada.
- Si las herramientas aparecen como texto del asistente en lugar de ejecutarse, por ejemplo JSON sin procesar, XML, sintaxis ReAct o un array `tool_calls` vacío en la respuesta del provider, primero verifica que el servidor esté usando una plantilla/parser de chat con capacidad para llamadas a herramientas. Para backends Chat Completions compatibles con OpenAI cuyo parser solo funciona cuando el uso de herramientas es obligatorio, configura una anulación de solicitud por modelo en lugar de depender del análisis de texto:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Usa esto solo para modelos/sesiones en los que cada turno normal debe llamar a una herramienta. Anula el valor proxy predeterminado de OpenClaw de `tool_choice: "auto"`.
  Sustituye `local/my-local-model` por la referencia exacta provider/modelo mostrada por `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Si un modelo personalizado compatible con OpenAI acepta esfuerzos de razonamiento de OpenAI más allá del perfil integrado, decláralos en el bloque compat del modelo. Añadir `"xhigh"` aquí hace que `/think xhigh`, los selectores de sesión, la validación de Gateway y la validación de `llm-task` expongan el nivel para esa referencia provider/modelo configurada:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Algunos backends locales más pequeños o más estrictos son inestables con la forma completa del prompt del entorno de ejecución de agente de OpenClaw, especialmente cuando se incluyen esquemas de herramientas. Primero verifica la ruta del provider con la prueba local ligera:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Para verificar la ruta de Gateway sin la forma completa del prompt de agente, usa en su lugar la prueba de modelo de Gateway:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Ambas pruebas de modelo, local y Gateway, envían solo el prompt proporcionado. La prueba de Gateway sigue validando el enrutamiento de Gateway, la autenticación y la selección de provider, pero omite intencionalmente el historial previo de la sesión, el contexto AGENTS/bootstrap, el ensamblaje del motor de contexto, las herramientas y los servidores MCP incluidos.

  Si eso funciona pero los turnos normales del agente de OpenClaw fallan, primero prueba
  `agents.defaults.experimental.localModelLean: true` para quitar herramientas
  predeterminadas pesadas como `browser`, `cron` y `message`; esta es una marca
  experimental, no una configuración estable de modo predeterminado. Consulta
  [Funciones experimentales](/es/concepts/experimental-features). Si eso sigue fallando, prueba
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Si el servicio servidor sigue fallando solo en ejecuciones más grandes de OpenClaw, el problema restante
  suele ser la capacidad del modelo/servidor ascendente o un error del servidor subyacente, no la
  capa de transporte de OpenClaw.

## Solución de problemas

- ¿Gateway puede alcanzar el proxy? `curl http://127.0.0.1:1234/v1/models`.
- ¿Modelo de LM Studio descargado? Vuelve a cargarlo; el arranque en frío es una causa común de “bloqueo”.
- ¿El servidor local dice `terminated`, `ECONNRESET` o cierra el flujo a mitad del turno?
  OpenClaw registra un `model.call.error.failureKind` de baja cardinalidad junto con la
  instantánea de RSS/heap del proceso de OpenClaw en los diagnósticos. Para presión de memoria
  de LM Studio/Ollama, compara esa marca de tiempo con el registro del servidor o el registro de fallos /
  jetsam de macOS para confirmar si se finalizó el servidor del modelo.
- OpenClaw deriva los umbrales de comprobación previa de la ventana de contexto a partir de la ventana del modelo detectada, o de la ventana de modelo sin límite cuando `agents.defaults.contextTokens` reduce la ventana efectiva. Advierte por debajo del 20% con un piso de **8k**. Los bloqueos estrictos usan el umbral del 10% con un piso de **4k**, limitado a la ventana de contexto efectiva para que los metadatos de modelo sobredimensionados no puedan rechazar un límite de usuario que, por lo demás, es válido. Si alcanzas esa comprobación previa, aumenta el límite de contexto del servidor/modelo o elige un modelo más grande.
- ¿Errores de contexto? Baja `contextWindow` o aumenta el límite de tu servidor.
- ¿El servidor compatible con OpenAI devuelve `messages[].content ... expected a string`?
  Añade `compat.requiresStringContent: true` en esa entrada de modelo.
- ¿Las llamadas directas pequeñas a `/v1/chat/completions` funcionan, pero `openclaw infer model run --local`
  falla en Gemma u otro modelo local? Revisa primero la URL del proveedor, la referencia del modelo, el marcador de autenticación
  y los registros del servidor; `model run` local no incluye herramientas del agente.
  Si `model run` local funciona pero fallan turnos más grandes del agente, reduce la
  superficie de herramientas del agente con `localModelLean` o `compat.supportsTools: false`.
- ¿Las llamadas de herramientas aparecen como texto JSON/XML/ReAct sin procesar, o el proveedor devuelve un
  arreglo `tool_calls` vacío? No añadas un proxy que convierta a ciegas texto del asistente
  en ejecución de herramientas. Corrige primero la plantilla/parser de chat del servidor. Si el
  modelo solo funciona cuando se fuerza el uso de herramientas, añade la anulación por modelo
  `params.extra_body.tool_choice: "required"` anterior y usa esa entrada de modelo
  solo para sesiones donde se espera una llamada de herramienta en cada turno.
- Seguridad: los modelos locales omiten los filtros del lado del proveedor; mantén los agentes acotados y Compaction activado para limitar el radio de impacto de la inyección de prompts.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Conmutación por error de modelos](/es/concepts/model-failover)
