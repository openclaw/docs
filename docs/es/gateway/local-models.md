---
read_when:
    - Quieres servir modelos desde tu propio equipo con GPU
    - Estás conectando LM Studio o un proxy compatible con OpenAI
    - Necesitas la guía más segura para modelos locales
summary: Ejecuta OpenClaw en LLM locales (LM Studio, vLLM, LiteLLM, endpoints personalizados de OpenAI)
title: Modelos locales
x-i18n:
    generated_at: "2026-04-30T05:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

Local es viable, pero OpenClaw espera contexto grande y defensas sólidas contra la inyección de prompts. Las tarjetas pequeñas truncan el contexto y filtran seguridad. Apunta alto: **≥2 Mac Studios al máximo o un equipo GPU equivalente (~$30k+)**. Una sola GPU de **24 GB** funciona solo para prompts más ligeros con mayor latencia. Usa la **variante de modelo más grande / de tamaño completo que puedas ejecutar**; los checkpoints muy cuantizados o “pequeños” aumentan el riesgo de inyección de prompts (consulta [Seguridad](/es/gateway/security)).

Si quieres la configuración local con menos fricción, empieza con [LM Studio](/es/providers/lmstudio) u [Ollama](/es/providers/ollama) y `openclaw onboard`. Esta página es la guía opinada para stacks locales de gama alta y servidores locales personalizados compatibles con OpenAI.

<Warning>
**Usuarios de WSL2 + Ollama + NVIDIA/CUDA:** El instalador oficial de Ollama para Linux habilita un servicio systemd con `Restart=always`. En configuraciones WSL2 con GPU, el inicio automático puede volver a cargar el último modelo durante el arranque y fijar la memoria del host. Si tu VM WSL2 se reinicia repetidamente después de habilitar Ollama, consulta [bucle de fallos de WSL2](/es/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Recomendado: LM Studio + modelo local grande (Responses API)

El mejor stack local actual. Carga un modelo grande en LM Studio (por ejemplo, una compilación de tamaño completo de Qwen, DeepSeek o Llama), habilita el servidor local (predeterminado `http://127.0.0.1:1234`) y usa Responses API para mantener el razonamiento separado del texto final.

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
- En LM Studio, descarga la **compilación de modelo más grande disponible** (evita variantes “pequeñas” o muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` la enumera.
- Sustituye `my-local-model` por el ID de modelo real que se muestra en LM Studio.
- Mantén el modelo cargado; la carga en frío añade latencia de inicio.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio difiere.
- Para WhatsApp, mantente en Responses API para que solo se envíe el texto final.

Mantén los modelos alojados configurados incluso cuando ejecutes localmente; usa `models.mode: "merge"` para que las alternativas sigan disponibles.

### Configuración híbrida: primario alojado, alternativa local

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

### Local primero con red de seguridad alojada

Intercambia el orden del primario y las alternativas; conserva el mismo bloque de proveedores y `models.mode: "merge"` para poder recurrir a Sonnet u Opus cuando la máquina local no esté disponible.

### Alojamiento regional / enrutamiento de datos

- También existen variantes alojadas de MiniMax/Kimi/GLM en OpenRouter con endpoints fijados por región (por ejemplo, alojadas en EE. UU.). Elige allí la variante regional para mantener el tráfico en la jurisdicción que elijas sin dejar de usar `models.mode: "merge"` para las alternativas de Anthropic/OpenAI.
- Solo local sigue siendo la vía de privacidad más sólida; el enrutamiento regional alojado es el punto intermedio cuando necesitas funciones de proveedor pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o gateways personalizados funcionan si exponen un endpoint de estilo OpenAI `/v1/chat/completions`. Usa el adaptador Chat Completions salvo que el backend documente explícitamente compatibilidad con `/v1/responses`. Sustituye el bloque de proveedor anterior por tu endpoint e ID de modelo:

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

Si `api` se omite en un proveedor personalizado con `baseUrl`, OpenClaw usa de forma predeterminada `openai-completions`. Los endpoints de loopback como `127.0.0.1` son de confianza automáticamente; los endpoints LAN, tailnet y DNS privado aún necesitan `request.allowPrivateNetwork: true`.

El valor `models.providers.<id>.models[].id` es local del proveedor. No incluyas allí el prefijo del proveedor. Por ejemplo, un servidor MLX iniciado con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` debe usar este ID de catálogo y referencia de modelo:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Configura `input: ["text", "image"]` en modelos locales o con proxy de visión para que los adjuntos de imagen se inyecten en los turnos del agente. El onboarding interactivo de proveedores personalizados infiere los ID comunes de modelos de visión y solo pregunta por nombres desconocidos. El onboarding no interactivo usa la misma inferencia; usa `--custom-image-input` para ID de visión desconocidos o `--custom-text-input` cuando un modelo que parece conocido es solo de texto detrás de tu endpoint.

Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como alternativas. Usa `models.providers.<id>.timeoutSeconds` para servidores de modelos locales o remotos lentos antes de aumentar `agents.defaults.timeoutSeconds`. El timeout del proveedor se aplica solo a solicitudes HTTP de modelo, incluida la conexión, encabezados, streaming del cuerpo y la cancelación total de guarded-fetch.

<Note>
Para proveedores personalizados compatibles con OpenAI, se acepta persistir un marcador local no secreto como `apiKey: "ollama-local"` cuando `baseUrl` resuelve a loopback, una LAN privada, `.local` o un hostname simple. OpenClaw lo trata como una credencial local válida en lugar de informar una clave ausente. Usa un valor real para cualquier proveedor que acepte un hostname público.
</Note>

Nota de comportamiento para backends `/v1` locales o con proxy:

- OpenClaw los trata como rutas compatibles con OpenAI de estilo proxy, no como endpoints nativos de OpenAI
- aquí no se aplica el moldeado de solicitudes exclusivo de OpenAI nativo: sin `service_tier`, sin `store` de Responses, sin moldeado de payload de compatibilidad de razonamiento de OpenAI y sin indicios de caché de prompts
- los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en estas URL de proxy personalizadas

Notas de compatibilidad para backends compatibles con OpenAI más estrictos:

- Algunos servidores aceptan solo `messages[].content` como cadena en Chat Completions, no arrays estructurados de partes de contenido. Configura `models.providers.<provider>.models[].compat.requiresStringContent: true` para esos endpoints.
- Algunos modelos locales emiten solicitudes de herramientas independientes entre corchetes como texto, como `[tool_name]` seguido de JSON y `[END_TOOL_REQUEST]`. OpenClaw las promueve a llamadas reales de herramientas solo cuando el nombre coincide exactamente con una herramienta registrada para el turno; de lo contrario, el bloque se trata como texto no compatible y se oculta de las respuestas visibles para el usuario.
- Si un modelo emite JSON, XML o texto de estilo ReAct que parece una llamada de herramienta pero el proveedor no emitió una invocación estructurada, OpenClaw lo deja como texto y registra una advertencia con el ID de ejecución, proveedor/modelo, patrón detectado y nombre de herramienta cuando esté disponible. Trátalo como incompatibilidad de llamadas de herramientas del proveedor/modelo, no como una ejecución de herramienta completada.
- Si las herramientas aparecen como texto del asistente en lugar de ejecutarse, por ejemplo JSON sin procesar, XML, sintaxis ReAct o un array `tool_calls` vacío en la respuesta del proveedor, primero verifica que el servidor esté usando una plantilla/parser de chat capaz de llamadas de herramientas. Para backends Chat Completions compatibles con OpenAI cuyo parser solo funciona cuando el uso de herramientas se fuerza, configura una sobrescritura de solicitud por modelo en lugar de depender del análisis de texto:

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

  Usa esto solo para modelos/sesiones donde cada turno normal deba llamar a una herramienta. Sobrescribe el valor de proxy predeterminado de OpenClaw de `tool_choice: "auto"`. Sustituye `local/my-local-model` por la referencia exacta de proveedor/modelo que muestra `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Si un modelo personalizado compatible con OpenAI acepta esfuerzos de razonamiento de OpenAI más allá del perfil integrado, decláralos en el bloque de compatibilidad del modelo. Añadir `"xhigh"` aquí hace que `/think xhigh`, los selectores de sesión, la validación de Gateway y la validación de `llm-task` expongan el nivel para esa referencia configurada de proveedor/modelo:

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

- Algunos backends locales más pequeños o más estrictos son inestables con la forma completa del prompt de tiempo de ejecución de agente de OpenClaw, especialmente cuando se incluyen esquemas de herramientas. Primero verifica la ruta del proveedor con la sonda local ligera:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Para verificar la ruta de Gateway sin la forma completa del prompt de agente, usa en su lugar la sonda de modelo de Gateway:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Ambas sondas de modelo, local y de Gateway, envían solo el prompt proporcionado. La sonda de Gateway aún valida el enrutamiento de Gateway, la autenticación y la selección de proveedor, pero omite intencionalmente la transcripción previa de la sesión, el contexto AGENTS/bootstrap, el ensamblado del motor de contexto, las herramientas y los servidores MCP incluidos.

  Si eso funciona pero los turnos normales del agente de OpenClaw fallan, primero prueba
  `agents.defaults.experimental.localModelLean: true` para quitar herramientas
  predeterminadas pesadas como `browser`, `cron` y `message`; esta es una marca
  experimental, no una configuración estable de modo predeterminado. Consulta
  [Funciones experimentales](/es/concepts/experimental-features). Si todavía falla, prueba
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Si el backend todavía falla solo en ejecuciones más grandes de OpenClaw, el problema restante
  suele ser capacidad del modelo/servidor ascendente o un error del backend, no la
  capa de transporte de OpenClaw.

## Solución de problemas

- ¿Gateway puede alcanzar el proxy? `curl http://127.0.0.1:1234/v1/models`.
- ¿El modelo de LM Studio está descargado? Recárgalo; el arranque en frío es una causa común de “bloqueos”.
- ¿El servidor local dice `terminated`, `ECONNRESET` o cierra el flujo a mitad del turno?
  OpenClaw registra un `model.call.error.failureKind` de baja cardinalidad más la
  instantánea de RSS/heap del proceso de OpenClaw en los diagnósticos. Para presión
  de memoria en LM Studio/Ollama, compara esa marca de tiempo con el registro del servidor o el registro de cierres /
  jetsam de macOS para confirmar si el servidor de modelos fue terminado.
- OpenClaw advierte cuando la ventana de contexto detectada está por debajo de **32k** y bloquea por debajo de **16k**. Si llegas a esa comprobación previa, aumenta el límite de contexto del servidor/modelo o elige un modelo más grande.
- ¿Errores de contexto? Reduce `contextWindow` o aumenta el límite de tu servidor.
- ¿El servidor compatible con OpenAI devuelve `messages[].content ... expected a string`?
  Agrega `compat.requiresStringContent: true` en esa entrada de modelo.
- ¿Las llamadas directas pequeñas a `/v1/chat/completions` funcionan, pero `openclaw infer model run --local`
  falla en Gemma u otro modelo local? Revisa primero la URL del proveedor, la referencia del modelo, el marcador de autenticación
  y los registros del servidor; `model run` local no incluye herramientas de agente.
  Si `model run` local funciona pero los turnos de agente más grandes fallan, reduce la
  superficie de herramientas del agente con `localModelLean` o `compat.supportsTools: false`.
- ¿Las llamadas a herramientas aparecen como texto JSON/XML/ReAct sin procesar, o el proveedor devuelve un
  arreglo `tool_calls` vacío? No agregues un proxy que convierta a ciegas el
  texto del asistente en ejecución de herramientas. Corrige primero la plantilla/parser de chat del servidor. Si el
  modelo solo funciona cuando se fuerza el uso de herramientas, agrega la anulación por modelo
  `params.extra_body.tool_choice: "required"` anterior y usa esa entrada de modelo
  solo para sesiones donde se espera una llamada a herramienta en cada turno.
- Seguridad: los modelos locales omiten los filtros del lado del proveedor; mantén los agentes acotados y la Compaction activada para limitar el alcance de inyección de prompts.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Conmutación por error de modelos](/es/concepts/model-failover)
