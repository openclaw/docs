---
read_when:
    - Quieres servir modelos desde tu propia máquina con GPU
    - Está conectando LM Studio o un proxy compatible con OpenAI
    - Necesitas la guía más segura sobre modelos locales
summary: Ejecutar OpenClaw en LLM locales (LM Studio, vLLM, LiteLLM, puntos de conexión personalizados de OpenAI)
title: Modelos locales
x-i18n:
    generated_at: "2026-07-05T11:20:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 850bbd6db1cf3da8719edec37cc271d9ea36dd5adf3722a555ded0823ec022ea
    source_path: gateway/local-models.md
    workflow: 16
---

Los modelos locales funcionan, pero elevan las exigencias de hardware, tamaño de contexto y defensa contra inyección de prompts: los modelos pequeños o cuantizados agresivamente truncan el contexto y omiten los filtros de seguridad del lado del proveedor. Esta página cubre stacks locales de gama alta y servidores personalizados compatibles con OpenAI. Para la ruta con menos fricción, empieza con [LM Studio](/es/providers/lmstudio) u [Ollama](/es/providers/ollama) y `openclaw onboard`.

Para servidores locales que solo deberían iniciarse cuando un modelo seleccionado los necesita, consulta [Servicios de modelos locales](/es/gateway/local-model-services).

## Base mínima de hardware

Apunta a **2 o más Mac Studios al máximo o una plataforma GPU equivalente (~30 000 USD o más)** para un bucle de agente cómodo. Una sola GPU de **24 GB** solo maneja prompts más ligeros con mayor latencia. Ejecuta siempre la **variante más grande / de tamaño completo que puedas alojar**: los checkpoints pequeños o muy cuantizados aumentan el riesgo de inyección de prompts (consulta [Seguridad](/es/gateway/security)).

## Elige un backend

| Backend                                              | Úsalo cuando                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| [ds4](/es/providers/ds4)                                | DeepSeek V4 Flash local en macOS Metal con llamadas a herramientas compatibles con OpenAI |
| [LM Studio](/es/providers/lmstudio)                     | Configuración local inicial, cargador GUI, Responses API nativa              |
| LiteLLM / OAI-proxy / proxy personalizado compatible con OpenAI | Uses otra API de modelo como frontend y necesites que OpenClaw la trate como OpenAI |
| MLX / vLLM / SGLang                                  | Servicio autoalojado de alto rendimiento con endpoint HTTP compatible con OpenAI |
| [Ollama](/es/providers/ollama)                          | Flujo de trabajo CLI, biblioteca de modelos, servicio systemd sin intervención |

Usa `api: "openai-responses"` cuando el backend lo admita (LM Studio lo hace). De lo contrario, usa `api: "openai-completions"`. Si se omite `api` en un proveedor personalizado con `baseUrl`, OpenClaw usa `openai-completions` de forma predeterminada.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** el instalador oficial de Ollama para Linux habilita un servicio systemd con `Restart=always`. En configuraciones GPU de WSL2, el inicio automático puede recargar el último modelo durante el arranque y fijar memoria del host, lo que causa reinicios repetidos de la máquina virtual. Consulta [bucle de fallos de WSL2](/es/providers/ollama#troubleshooting).
</Warning>

## LM Studio + modelo local grande (Responses API)

Este es el mejor stack local actual. Carga un modelo grande en LM Studio (una compilación de tamaño completo de Qwen, DeepSeek o Llama), habilita el servidor local (predeterminado `http://127.0.0.1:1234`) y usa Responses API para mantener el razonamiento separado del texto final.

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

Lista de verificación de configuración:

- Instala LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Descarga la **compilación de modelo más grande disponible** (evita variantes "small"/muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` la liste.
- Sustituye `my-local-model` por el ID de modelo real que se muestra en LM Studio.
- Mantén el modelo cargado; la carga en frío añade latencia de inicio.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio difiere.
- Para WhatsApp, mantente en Responses API para que solo se envíe el texto final.
- Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como alternativas.

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

Para priorizar lo local con una red de seguridad alojada, invierte el orden de `primary`/`fallbacks` y conserva el mismo bloque `providers` y `models.mode: "merge"`.

### Alojamiento regional / enrutamiento de datos

También existen variantes alojadas de MiniMax/Kimi/GLM en OpenRouter con endpoints anclados a una región (por ejemplo, alojados en EE. UU.). Elige la variante regional para mantener el tráfico en la jurisdicción que elijas mientras mantienes `models.mode: "merge"` para alternativas de Anthropic/OpenAI. Solo local sigue siendo la ruta de privacidad más fuerte; el enrutamiento regional alojado es el punto intermedio cuando necesitas funciones del proveedor pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o cualquier gateway personalizado funciona si expone un endpoint `/v1/chat/completions` de estilo OpenAI. Usa `openai-completions` salvo que el backend documente explícitamente compatibilidad con `/v1/responses`.

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

Las entradas de proveedor personalizado/local confían en el origen exacto de `baseUrl` configurado para solicitudes de modelos protegidas, incluidos loopback, LAN, tailnet y hosts DNS privados. Los orígenes metadata/link-local siempre se bloquean igualmente. Las solicitudes a otros orígenes privados todavía necesitan `models.providers.<id>.request.allowPrivateNetwork: true`; establece la marca de confianza en `false` para optar por no confiar en el origen exacto.

`models.providers.<id>.models[].id` es local al proveedor: no incluyas el prefijo del proveedor. Para un servidor MLX iniciado con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Establece `input: ["text", "image"]` en modelos de visión locales o proxificados para que los archivos adjuntos de imagen se inyecten en los turnos del agente. El onboarding interactivo de proveedores personalizados infiere IDs comunes de modelos de visión y solo pregunta por nombres desconocidos; el onboarding no interactivo usa la misma inferencia, con `--custom-image-input` / `--custom-text-input` para sobrescribirla.

Usa `models.providers.<id>.timeoutSeconds` para servidores de modelos locales/remotos lentos antes de aumentar `agents.defaults.timeoutSeconds`. El timeout del proveedor cubre conexión, headers, streaming del cuerpo y el aborto total de guarded-fetch solo para solicitudes HTTP de modelos; si el timeout del agente/ejecución es menor, auméntalo también, ya que el timeout del proveedor no puede extender toda la ejecución.

<Note>
Para proveedores personalizados compatibles con OpenAI, se acepta un marcador local no secreto como `apiKey: "ollama-local"` cuando `baseUrl` se resuelve a loopback, una LAN privada, `.local` o un hostname simple: OpenClaw lo trata como una credencial local válida en lugar de reportar una clave faltante. Usa un valor real para cualquier proveedor que acepte un hostname público.
</Note>

Notas de comportamiento para backends `/v1` locales/proxificados:

- OpenClaw los trata como rutas compatibles con OpenAI de estilo proxy, no como endpoints nativos de OpenAI.
- No se aplica el modelado de solicitudes exclusivo de OpenAI nativo: sin `service_tier`, sin `store` de Responses, sin modelado de payload de compatibilidad de razonamiento de OpenAI, sin pistas de prompt-cache.
- Los headers ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en URLs de proxy personalizadas.

Sobrescrituras de compatibilidad para backends compatibles con OpenAI más estrictos:

- **Contenido solo de cadena**: algunos servidores solo aceptan `messages[].content` como cadena, no arrays estructurados de partes de contenido. Establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Claves de mensaje estrictas**: si el servidor rechaza entradas de mensaje con más de `role`/`content`, establece `compat.strictMessageKeys: true`.
- **Texto de herramienta entre corchetes**: algunos modelos locales emiten solicitudes de herramienta independientes entre corchetes como texto, como `[tool_name]` seguido de JSON y `[END_TOOL_REQUEST]`. OpenClaw las promueve a llamadas reales a herramientas solo cuando el nombre coincide exactamente con una herramienta registrada para el turno; de lo contrario permanece como texto oculto no compatible.
- **Texto no estructurado que parece una llamada a herramienta**: si un modelo emite texto estilo JSON/XML/ReAct que parece una llamada a herramienta pero no fue una invocación estructurada, OpenClaw lo deja como texto y registra una advertencia con el ID de ejecución, proveedor/modelo, patrón detectado y nombre de herramienta cuando está disponible. Eso es incompatibilidad de proveedor/modelo, no una ejecución de herramienta completada.
- **Forzar el uso de herramientas**: si las herramientas aparecen como texto del asistente (JSON/XML/ReAct sin procesar, o un array `tool_calls` vacío), primero confirma que la plantilla/parser de chat del servidor admita llamadas a herramientas. Si el parser solo funciona cuando se fuerza el uso de herramientas, sobrescribe el valor de proxy predeterminado de `tool_choice: "auto"` por modelo:

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

  Usa esto solo donde cada turno normal deba llamar a una herramienta. Sustituye `local/my-local-model` por la referencia exacta de `openclaw models list`, o establécelo mediante CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Esfuerzos de razonamiento adicionales**: si un modelo personalizado compatible con OpenAI acepta esfuerzos de razonamiento de OpenAI más allá del perfil integrado, decláralos en el bloque de compatibilidad del modelo. Añadir `"xhigh"` lo expone para esa referencia de modelo en `/think xhigh`, selectores de sesión, validación de Gateway y validación de `llm-task`:

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

## Backends más pequeños o más estrictos

Si el modelo se carga correctamente pero los turnos completos del agente se comportan mal, trabaja de arriba abajo: confirma primero el transporte y luego acota la superficie.

1. **Confirma que el modelo local responda**: sin herramientas, sin contexto de agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Confirma el enrutamiento del Gateway** - envía solo el prompt, omitiendo la transcripción, el arranque de AGENTS, el ensamblaje del motor de contexto, las herramientas y los servidores MCP incluidos, pero aun así ejercita el enrutamiento del Gateway, la autenticación y la selección del proveedor:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prueba el modo ligero** si ambas sondas pasan pero los turnos reales del agente fallan con llamadas de herramientas mal formadas o prompts demasiado grandes: establece `agents.defaults.experimental.localModelLean: true`. Elimina las tres herramientas predeterminadas más pesadas (`browser`, `cron`, `message` - salvo que una ejecución deba conservar la semántica de entrega directa de `message`) y pone los catálogos de herramientas más grandes detrás de controles estructurados de búsqueda de herramientas de forma predeterminada. Consulta [Funciones experimentales -> Modo ligero para modelos locales](/es/concepts/experimental-features#local-model-lean-mode) para obtener detalles y saber cómo confirmar que está activado.

4. **Desactiva las herramientas por completo como último recurso** estableciendo `models.providers.<provider>.models[].compat.supportsTools: false` para ese modelo - entonces el agente se ejecuta sin llamadas de herramientas.

5. **Más allá de eso, el cuello de botella está aguas arriba.** Si el backend aún falla solo en ejecuciones más grandes de OpenClaw después del modo ligero y `supportsTools: false`, el problema restante suele ser el modelo o el servidor en sí - ventana de contexto, memoria de GPU, expulsión de kv-cache o un error del backend - no la capa de transporte de OpenClaw.

## Solución de problemas

- **¿El Gateway no puede alcanzar el proxy?** `curl http://127.0.0.1:1234/v1/models`.
- **¿El modelo de LM Studio está descargado?** Vuelve a cargarlo; el arranque en frío es una causa común de "bloqueo".
- **¿El servidor local dice `terminated`, `ECONNRESET` o cierra el flujo a mitad del turno?** OpenClaw registra un `model.call.error.failureKind` de baja cardinalidad junto con una instantánea de RSS/heap del proceso de OpenClaw en los diagnósticos. Para presión de memoria en LM Studio/Ollama, compara esa marca de tiempo con el registro del servidor o con un registro de bloqueo/jetsam de macOS para confirmar si el servidor del modelo fue finalizado.
- **¿Errores de contexto?** OpenClaw deriva los umbrales de preflight de la ventana de contexto a partir de la ventana del modelo detectada (o de la ventana limitada cuando `agents.defaults.contextTokens` la reduce), avisando por debajo del 20% con un piso de **8k** y bloqueando estrictamente por debajo del 10% con un piso de **4k** (limitado a la ventana de contexto efectiva para que los metadatos de un modelo sobredimensionado no puedan rechazar un límite de usuario válido). Reduce `contextWindow` o aumenta el límite de contexto del servidor/modelo.
- **¿`messages[].content ... expected a string`?** Agrega `compat.requiresStringContent: true` en esa entrada de modelo.
- **¿`validation.keys`, o "message entries only allow `role` and `content`"?** Agrega `compat.strictMessageKeys: true` en esa entrada de modelo.
- **¿Las llamadas directas a `/v1/chat/completions` funcionan, pero `openclaw infer model run --local` falla en Gemma u otro modelo local?** Primero revisa la URL del proveedor, la referencia del modelo, el marcador de autenticación y los registros del servidor - `model run` omite por completo las herramientas del agente. Si `model run` funciona pero los turnos de agente más grandes fallan, reduce la superficie de herramientas con `localModelLean` o `compat.supportsTools: false`.
- **¿Las llamadas de herramientas aparecen como texto JSON/XML/ReAct sin procesar, o el proveedor devuelve un arreglo `tool_calls` vacío?** No agregues un proxy que convierta a ciegas el texto del asistente en ejecución de herramientas - corrige primero la plantilla/el analizador de chat del servidor. Si el modelo solo funciona cuando se fuerza el uso de herramientas, agrega la sobrescritura `params.extra_body.tool_choice: "required"` anterior y usa esa entrada de modelo solo para sesiones donde se espera una llamada de herramienta en cada turno.
- **Seguridad**: los modelos locales omiten los filtros del lado del proveedor. Mantén los agentes acotados y Compaction activado para limitar el radio de impacto de la inyección de prompts.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Conmutación por error de modelos](/es/concepts/model-failover)
