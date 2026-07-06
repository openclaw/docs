---
read_when:
    - Quieres servir modelos desde tu propia máquina con GPU
    - Estás conectando LM Studio o un proxy compatible con OpenAI
    - Necesita la orientación más segura para modelos locales
summary: Ejecuta OpenClaw en LLM locales (LM Studio, vLLM, LiteLLM, endpoints personalizados de OpenAI)
title: Modelos locales
x-i18n:
    generated_at: "2026-07-06T10:49:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cb81958fb70660a6eee290171102d68b520a0498bd3f3333cf646c9aea00f41
    source_path: gateway/local-models.md
    workflow: 16
---

Los modelos locales funcionan, pero elevan las exigencias de hardware, tamaño de contexto y defensa contra inyección de prompts: los modelos pequeños o cuantizados agresivamente truncan el contexto y omiten los filtros de seguridad del lado del proveedor. Esta página cubre stacks locales de gama alta y servidores personalizados compatibles con OpenAI. Para la ruta con menos fricción, empieza con [LM Studio](/es/providers/lmstudio) u [Ollama](/es/providers/ollama) y `openclaw onboard`.

Para servidores locales que solo deberían iniciarse cuando un modelo seleccionado los necesita, consulta [Servicios de modelos locales](/es/gateway/local-model-services).

## Base mínima de hardware

Apunta a **2+ Mac Studios al máximo o un equipo GPU equivalente (~$30k+)** para un ciclo de agente cómodo. Una sola GPU de **24 GB** solo maneja prompts más ligeros con mayor latencia. Ejecuta siempre la **variante más grande / de tamaño completo que puedas alojar**: los checkpoints pequeños o muy cuantizados aumentan el riesgo de inyección de prompts (consulta [Seguridad](/es/gateway/security)).

## Elige un backend

| Backend                                              | Úsalo cuando                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| [ds4](/es/providers/ds4)                                | DeepSeek V4 Flash local en macOS Metal con llamadas a herramientas compatibles con OpenAI |
| [LM Studio](/es/providers/lmstudio)                     | Primera configuración local, cargador GUI, Responses API nativa              |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | Expones otra API de modelo y necesitas que OpenClaw la trate como OpenAI     |
| MLX / vLLM / SGLang                                  | Servicio autoalojado de alto rendimiento con un endpoint HTTP compatible con OpenAI |
| [Ollama](/es/providers/ollama)                          | Flujo de trabajo CLI, biblioteca de modelos, servicio systemd sin intervención |

Usa `api: "openai-responses"` cuando el backend lo admita (LM Studio lo hace). De lo contrario, usa `api: "openai-completions"`. Si `api` se omite en un proveedor personalizado con un `baseUrl`, OpenClaw usa `openai-completions` de forma predeterminada.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** el instalador oficial de Ollama para Linux habilita un servicio systemd con `Restart=always`. En configuraciones WSL2 con GPU, el inicio automático puede recargar el último modelo durante el arranque y fijar memoria del host, causando reinicios repetidos de la VM. Consulta [bucle de bloqueo en WSL2](/es/providers/ollama#troubleshooting).
</Warning>

## LM Studio + modelo local grande (Responses API)

Este es el mejor stack local actual. Carga un modelo grande en LM Studio (una compilación de tamaño completo de Qwen, DeepSeek o Llama), habilita el servidor local (`http://127.0.0.1:1234` de forma predeterminada) y usa Responses API para mantener el razonamiento separado del texto final.

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
- Descarga la **compilación de modelo más grande disponible** (evita variantes "small"/muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` la lista.
- Reemplaza `my-local-model` por el ID de modelo real que se muestra en LM Studio.
- Mantén el modelo cargado; la carga en frío añade latencia de inicio.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio difiere.
- Para WhatsApp, usa Responses API para que solo se envíe el texto final.
- Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como alternativas.

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

Para priorizar lo local con una red de seguridad alojada, intercambia el orden de `primary`/`fallbacks` y mantén el mismo bloque `providers` y `models.mode: "merge"`.

### Alojamiento regional / enrutamiento de datos

También existen variantes alojadas de MiniMax/Kimi/GLM en OpenRouter con endpoints fijados por región (por ejemplo, alojados en EE. UU.). Elige la variante regional para mantener el tráfico en la jurisdicción elegida mientras conservas `models.mode: "merge"` para alternativas de Anthropic/OpenAI. Solo local sigue siendo la ruta de privacidad más sólida; el enrutamiento regional alojado es el punto intermedio cuando necesitas funciones del proveedor pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o cualquier Gateway personalizado funciona si expone un endpoint `/v1/chat/completions` de estilo OpenAI. Usa `openai-completions` salvo que el backend documente explícitamente soporte para `/v1/responses`.

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

Las entradas de proveedores personalizados/locales confían en el origen exacto de `baseUrl` configurado para solicitudes de modelo protegidas, incluidos loopback, LAN, tailnet y hosts DNS privados. Los orígenes metadata/link-local siempre se bloquean de todos modos. Las solicitudes a otros orígenes privados siguen necesitando `models.providers.<id>.request.allowPrivateNetwork: true`; establece la marca de confianza en `false` para excluirte de la confianza en el origen exacto.

`models.providers.<id>.models[].id` es local al proveedor: no incluyas el prefijo del proveedor. Para un servidor MLX iniciado con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Establece `input: ["text", "image"]` en modelos locales o de visión con proxy para que los adjuntos de imagen se inyecten en los turnos del agente. El onboarding interactivo de proveedor personalizado infiere IDs comunes de modelos de visión y solo pregunta por nombres desconocidos; el onboarding no interactivo usa la misma inferencia, con `--custom-image-input` / `--custom-text-input` para sobrescribirla.

Usa `models.providers.<id>.timeoutSeconds` para servidores de modelos locales/remotos lentos antes de aumentar `agents.defaults.timeoutSeconds`. El timeout del proveedor cubre conexión, encabezados, streaming del cuerpo y la anulación total de guarded-fetch solo para solicitudes HTTP de modelo; si el timeout del agente/run es menor, súbelo también, ya que el timeout del proveedor no puede extender toda la ejecución.

<Note>
Para proveedores personalizados compatibles con OpenAI, se acepta un marcador local no secreto como `apiKey: "ollama-local"` cuando `baseUrl` se resuelve a loopback, una LAN privada, `.local` o un nombre de host simple: OpenClaw lo trata como una credencial local válida en lugar de informar que falta una clave. Usa un valor real para cualquier proveedor que acepte un nombre de host público.
</Note>

Notas de comportamiento para backends `/v1` locales/con proxy:

- OpenClaw los trata como rutas compatibles con OpenAI de estilo proxy, no como endpoints nativos de OpenAI.
- La adaptación de solicitudes solo para OpenAI nativo no se aplica: sin `service_tier`, sin Responses `store`, sin adaptación de payload de compatibilidad de razonamiento de OpenAI, sin sugerencias de caché de prompts.
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en URLs de proxy personalizadas.

Sobrescrituras de compatibilidad para backends compatibles con OpenAI más estrictos:

- **Contenido solo como cadena**: algunos servidores aceptan solo `messages[].content` como cadena, no arrays estructurados de partes de contenido. Establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Claves de mensaje estrictas**: si el servidor rechaza entradas de mensaje con más que `role`/`content`, establece `compat.strictMessageKeys: true`.
- **Texto de herramienta entre corchetes**: algunos modelos locales emiten solicitudes de herramienta independientes entre corchetes como texto, como `[tool_name]` seguido de JSON y `[END_TOOL_REQUEST]`. OpenClaw las promueve a llamadas de herramienta reales solo cuando el nombre coincide exactamente con una herramienta registrada para el turno; de lo contrario, permanece como texto oculto no admitido.
- **Texto no estructurado que parece llamada de herramienta**: si un modelo emite texto de estilo JSON/XML/ReAct que parece una llamada de herramienta pero no era una invocación estructurada, OpenClaw lo deja como texto y registra una advertencia con el ID de ejecución, proveedor/modelo, patrón detectado y nombre de herramienta cuando está disponible. Eso es una incompatibilidad de proveedor/modelo, no una ejecución de herramienta completada.
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

  Usa esto solo donde cada turno normal debería llamar a una herramienta. Reemplaza `local/my-local-model` con la referencia exacta de `openclaw models list`, o establécelo mediante CLI:

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

Si el modelo carga correctamente pero los turnos completos del agente se comportan mal, trabaja de arriba hacia abajo: confirma primero el transporte y luego reduce la superficie.

1. **Confirma que el modelo local responde**: sin herramientas, sin contexto de agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Confirma el enrutamiento del Gateway** - envía solo el prompt, omitiendo la transcripción, el arranque de AGENTS, el ensamblado del motor de contexto, las herramientas y los servidores MCP incluidos, pero aun así ejercita el enrutamiento del Gateway, la autenticación y la selección de proveedor:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prueba el modo ligero** si ambas sondas pasan pero los turnos reales del agente fallan con llamadas de herramientas mal formadas o prompts demasiado grandes: establece `agents.defaults.experimental.localModelLean: true`. Descarta las herramientas pesadas de navegador, cron, mensajes, generación de medios, voz y PDF salvo que se requieran explícitamente, y coloca por defecto los catálogos de herramientas más grandes detrás de controles estructurados de Tool Search. Consulta [Funciones experimentales -> Modo ligero de modelo local](/es/concepts/experimental-features#local-model-lean-mode) para obtener detalles y saber cómo confirmar que está activado.

4. **Desactiva las herramientas por completo como último recurso** estableciendo `models.providers.<provider>.models[].compat.supportsTools: false` para ese modelo; entonces el agente se ejecuta sin llamadas de herramientas.

5. **Más allá de eso, el cuello de botella está upstream.** Si el backend sigue fallando solo en ejecuciones más grandes de OpenClaw después del modo ligero y `supportsTools: false`, el problema restante suele ser el propio modelo o servidor: ventana de contexto, memoria de GPU, expulsión de kv-cache o un error del backend, no la capa de transporte de OpenClaw.

## Solución de problemas

- **¿El Gateway no puede alcanzar el proxy?** `curl http://127.0.0.1:1234/v1/models`.
- **¿Modelo de LM Studio descargado?** Vuelve a cargarlo; el arranque en frío es una causa común de "bloqueo".
- **¿El servidor local dice `terminated`, `ECONNRESET` o cierra el flujo a mitad del turno?** OpenClaw registra un `model.call.error.failureKind` de baja cardinalidad junto con una instantánea de RSS/heap del proceso de OpenClaw en los diagnósticos. Para presión de memoria en LM Studio/Ollama, compara esa marca de tiempo con el registro del servidor o con un registro de bloqueo/jetsam de macOS para confirmar si el servidor del modelo fue terminado.
- **¿Errores de contexto?** OpenClaw deriva los umbrales de prevalidación de la ventana de contexto a partir de la ventana del modelo detectada (o la ventana limitada cuando `agents.defaults.contextTokens` la reduce), con advertencia por debajo del 20% con un piso de **8k** y bloqueo estricto por debajo del 10% con un piso de **4k** (limitado a la ventana de contexto efectiva para que los metadatos sobredimensionados del modelo no rechacen un límite de usuario válido). Reduce `contextWindow` o aumenta el límite de contexto del servidor/modelo.
- **¿`messages[].content ... expected a string`?** Añade `compat.requiresStringContent: true` en esa entrada de modelo.
- **¿`validation.keys`, o "message entries only allow `role` and `content`"?** Añade `compat.strictMessageKeys: true` en esa entrada de modelo.
- **¿Las llamadas directas a `/v1/chat/completions` funcionan, pero `openclaw infer model run --local` falla en Gemma u otro modelo local?** Revisa primero la URL del proveedor, la referencia del modelo, el marcador de autenticación y los registros del servidor; `model run` omite por completo las herramientas de agente. Si `model run` tiene éxito pero los turnos de agente más grandes fallan, reduce la superficie de herramientas con `localModelLean` o `compat.supportsTools: false`.
- **¿Las llamadas de herramientas aparecen como texto JSON/XML/ReAct sin procesar, o el proveedor devuelve un arreglo `tool_calls` vacío?** No añadas un proxy que convierta ciegamente texto del asistente en ejecución de herramientas; corrige primero la plantilla/parser de chat del servidor. Si el modelo solo funciona cuando se fuerza el uso de herramientas, añade la anulación `params.extra_body.tool_choice: "required"` anterior y usa esa entrada de modelo solo para sesiones donde se espere una llamada de herramienta en cada turno.
- **Seguridad**: los modelos locales omiten los filtros del lado del proveedor. Mantén los agentes acotados y Compaction activado para limitar el radio de impacto de la inyección de prompts.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Conmutación por error de modelos](/es/concepts/model-failover)
