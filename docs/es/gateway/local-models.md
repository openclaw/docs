---
read_when:
    - Quieres servir modelos desde tu propio equipo con GPU
    - Estás configurando LM Studio o un proxy compatible con OpenAI
    - Necesitas la orientación más segura para modelos locales
summary: Ejecuta OpenClaw en LLM locales (LM Studio, vLLM, LiteLLM, endpoints personalizados de OpenAI)
title: Modelos locales
x-i18n:
    generated_at: "2026-05-11T20:36:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

Los modelos locales son viables. También elevan el listón en hardware, tamaño de contexto y defensa contra inyección de prompts: las tarjetas pequeñas o cuantizadas agresivamente recortan el contexto y debilitan la seguridad. Esta página es la guía prescriptiva para stacks locales de gama alta y servidores locales personalizados compatibles con OpenAI. Para una incorporación con la menor fricción, empieza con [LM Studio](/es/providers/lmstudio) u [Ollama](/es/providers/ollama) y `openclaw onboard`.

Para servidores locales que solo deberían iniciarse cuando un modelo seleccionado los necesita, consulta
[Servicios de modelos locales](/es/gateway/local-model-services).

## Mínimo de hardware

Apunta alto: **≥2 Mac Studios al máximo o un equipo GPU equivalente (~$30k+)** para un ciclo de agente cómodo. Una sola GPU de **24 GB** solo funciona para prompts más ligeros con mayor latencia. Ejecuta siempre la **variante más grande / de tamaño completo que puedas alojar**; los checkpoints pequeños o muy cuantizados aumentan el riesgo de inyección de prompts (consulta [Seguridad](/es/gateway/security)).

## Elige un backend

| Backend                                              | Úsalo cuando                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/es/providers/lmstudio)                     | Configuración local inicial, cargador GUI, Responses API nativa             |
| [Ollama](/es/providers/ollama)                          | Flujo de trabajo CLI, biblioteca de modelos, servicio systemd desatendido   |
| MLX / vLLM / SGLang                                  | Servicio autoalojado de alto rendimiento con un endpoint HTTP compatible con OpenAI |
| LiteLLM / OAI-proxy / proxy personalizado compatible con OpenAI | Pones otra API de modelo delante y necesitas que OpenClaw la trate como OpenAI |

Usa Responses API (`api: "openai-responses"`) cuando el backend la admita (LM Studio lo hace). De lo contrario, mantente con Chat Completions (`api: "openai-completions"`).

<Warning>
**Usuarios de WSL2 + Ollama + NVIDIA/CUDA:** El instalador oficial de Ollama para Linux habilita un servicio systemd con `Restart=always`. En configuraciones GPU con WSL2, el inicio automático puede recargar el último modelo durante el arranque y fijar memoria del host. Si tu VM de WSL2 se reinicia repetidamente después de habilitar Ollama, consulta [bucle de fallos de WSL2](/es/providers/ollama#wsl2-crash-loop-repeated-reboots).
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
- En LM Studio, descarga la **compilación de modelo más grande disponible** (evita variantes "small"/muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` la liste.
- Sustituye `my-local-model` por el ID de modelo real que se muestra en LM Studio.
- Mantén el modelo cargado; la carga en frío añade latencia de inicio.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio difiere.
- Para WhatsApp, mantente con Responses API para que solo se envíe el texto final.

Mantén los modelos alojados configurados incluso cuando ejecutes localmente; usa `models.mode: "merge"` para que los fallbacks sigan disponibles.

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

### Primero local con red de seguridad alojada

Intercambia el orden del primario y del fallback; mantén el mismo bloque de providers y `models.mode: "merge"` para poder recurrir a Sonnet u Opus cuando el equipo local esté caído.

### Alojamiento regional / enrutamiento de datos

- También existen variantes alojadas de MiniMax/Kimi/GLM en OpenRouter con endpoints fijados por región (por ejemplo, alojados en EE. UU.). Elige allí la variante regional para mantener el tráfico en la jurisdicción elegida y seguir usando `models.mode: "merge"` para fallbacks de Anthropic/OpenAI.
- Solo local sigue siendo la ruta de privacidad más sólida; el enrutamiento regional alojado es el punto intermedio cuando necesitas funciones del provider pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o gateways
personalizados funcionan si exponen un endpoint `/v1/chat/completions`
de estilo OpenAI. Usa el adaptador de Chat Completions salvo que el backend documente explícitamente
soporte para `/v1/responses`. Sustituye el bloque de provider anterior por tu
endpoint e ID de modelo:

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

Si se omite `api` en un provider personalizado con un `baseUrl`, OpenClaw usa de forma predeterminada
`openai-completions`. Los endpoints de loopback como `127.0.0.1` se consideran de confianza
automáticamente; los endpoints de LAN, tailnet y DNS privado aún necesitan
`request.allowPrivateNetwork: true`.

El valor `models.providers.<id>.models[].id` es local al provider. No
incluyas ahí el prefijo del provider. Por ejemplo, un servidor MLX iniciado con
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` debería usar este
ID de catálogo y referencia de modelo:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Establece `input: ["text", "image"]` en modelos locales o de visión con proxy para que los
adjuntos de imagen se inyecten en los turnos del agente. La incorporación interactiva de providers personalizados
infiere los IDs comunes de modelos de visión y solo pregunta por nombres desconocidos.
La incorporación no interactiva usa la misma inferencia; usa `--custom-image-input`
para IDs de visión desconocidos o `--custom-text-input` cuando un modelo que parece conocido
es solo de texto detrás de tu endpoint.

Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como fallbacks.
Usa `models.providers.<id>.timeoutSeconds` para servidores de modelos locales o remotos lentos
antes de aumentar `agents.defaults.timeoutSeconds`. El timeout del provider
solo se aplica a solicitudes HTTP de modelo, incluida la conexión, cabeceras, streaming del cuerpo
y la cancelación total de guarded-fetch.

<Note>
Para providers personalizados compatibles con OpenAI, se acepta persistir un marcador local no secreto como `apiKey: "ollama-local"` cuando `baseUrl` se resuelve a loopback, una LAN privada, `.local` o un hostname simple. OpenClaw lo trata como una credencial local válida en lugar de informar que falta una clave. Usa un valor real para cualquier provider que acepte un hostname público.
</Note>

Nota de comportamiento para backends `/v1` locales/con proxy:

- OpenClaw los trata como rutas compatibles con OpenAI de estilo proxy, no como endpoints nativos
  de OpenAI
- aquí no se aplica la conformación de solicitudes exclusiva de OpenAI nativa: sin
  `service_tier`, sin `store` de Responses, sin conformación de payload compatible con razonamiento
  de OpenAI y sin indicios de caché de prompts
- las cabeceras ocultas de atribución de OpenClaw (`originator`, `version`, `User-Agent`)
  no se inyectan en estas URL de proxy personalizadas

Notas de compatibilidad para backends compatibles con OpenAI más estrictos:

- Algunos servidores solo aceptan `messages[].content` como string en Chat Completions, no
  arrays estructurados de partes de contenido. Establece
  `models.providers.<provider>.models[].compat.requiresStringContent: true` para
  esos endpoints.
- Algunos modelos locales emiten solicitudes de herramientas independientes entre corchetes como texto, como
  `[tool_name]` seguido de JSON y `[END_TOOL_REQUEST]`. OpenClaw las promueve
  a llamadas de herramienta reales solo cuando el nombre coincide exactamente con una herramienta registrada
  para el turno; de lo contrario, el bloque se trata como texto no compatible y se
  oculta de las respuestas visibles para el usuario.
- Si un modelo emite JSON, XML o texto de estilo ReAct que parece una llamada de herramienta
  pero el provider no emitió una invocación estructurada, OpenClaw lo deja como
  texto y registra una advertencia con el ID de ejecución, provider/modelo, patrón detectado y
  nombre de herramienta cuando esté disponible. Trátalo como una incompatibilidad de llamada de herramienta
  del provider/modelo, no como una ejecución de herramienta completada.
- Si las herramientas aparecen como texto del asistente en lugar de ejecutarse, por ejemplo JSON sin procesar,
  XML, sintaxis ReAct o un array `tool_calls` vacío en la respuesta del provider,
  primero verifica que el servidor esté usando una plantilla/parser de chat compatible con llamadas de herramienta. Para
  backends de Chat Completions compatibles con OpenAI cuyo parser solo funciona cuando se fuerza el uso de
  herramientas, establece una sobrescritura de solicitud por modelo en lugar de depender del análisis de texto:

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

  Usa esto solo para modelos/sesiones donde cada turno normal debería llamar a una herramienta.
  Sobrescribe el valor de proxy predeterminado de OpenClaw de `tool_choice: "auto"`.
  Sustituye `local/my-local-model` por la referencia exacta de provider/modelo que muestra
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Si un modelo personalizado compatible con OpenAI acepta esfuerzos de razonamiento de OpenAI más allá
  del perfil incorporado, decláralos en el bloque compat del modelo. Añadir `"xhigh"`
  aquí hace que `/think xhigh`, los selectores de sesión, la validación de Gateway y la validación de `llm-task`
  expongan el nivel para esa referencia de provider/modelo configurada:

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

Si el modelo se carga correctamente pero los turnos completos de agente se comportan mal, trabaja de arriba abajo: confirma primero el transporte y luego acota la superficie.

1. **Confirma que el modelo local en sí responde.** Sin herramientas, sin contexto de agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Confirma el enrutamiento del Gateway.** Envía solo el prompt suministrado: omite la transcripción, el arranque de AGENTS, el ensamblaje del motor de contexto, las herramientas y los servidores MCP incluidos, pero aun así ejercita el enrutamiento del Gateway, la autenticación y la selección de proveedor:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prueba el modo ligero.** Si ambas pruebas pasan pero los turnos reales del agente fallan con llamadas a herramientas malformadas o prompts demasiado grandes, habilita `agents.defaults.experimental.localModelLean: true`. Elimina las tres herramientas predeterminadas más pesadas (`browser`, `cron`, `message`) para que la forma del prompt sea más pequeña y menos frágil. Consulta [Funciones experimentales → Modo ligero de modelo local](/es/concepts/experimental-features#local-model-lean-mode) para ver la explicación completa, cuándo usarlo y cómo confirmar que está activado.

4. **Deshabilita las herramientas por completo como último recurso.** Si el modo ligero no basta, establece `models.providers.<provider>.models[].compat.supportsTools: false` para esa entrada de modelo. Entonces el agente operará sin llamadas a herramientas en ese modelo.

5. **Más allá de eso, el cuello de botella está aguas arriba.** Si el backend sigue fallando solo en ejecuciones más grandes de OpenClaw después del modo ligero y `supportsTools: false`, el problema restante suele ser la capacidad del modelo o servidor aguas arriba: ventana de contexto, memoria de GPU, expulsión de kv-cache o un error del backend. En ese punto no es la capa de transporte de OpenClaw.

## Solución de problemas

- ¿El Gateway puede llegar al proxy? `curl http://127.0.0.1:1234/v1/models`.
- ¿Modelo de LM Studio descargado? Vuelve a cargarlo; el arranque en frío es una causa común de “bloqueo”.
- ¿El servidor local dice `terminated`, `ECONNRESET` o cierra el flujo a mitad de turno?
  OpenClaw registra un `model.call.error.failureKind` de baja cardinalidad más la instantánea de RSS/heap del proceso de OpenClaw en los diagnósticos. Para presión de memoria en LM Studio/Ollama, compara esa marca de tiempo con el registro del servidor o el registro de fallo / jetsam de macOS para confirmar si el servidor del modelo fue terminado.
- OpenClaw deriva los umbrales de preflight de la ventana de contexto a partir de la ventana de modelo detectada, o de la ventana de modelo sin límite cuando `agents.defaults.contextTokens` reduce la ventana efectiva. Advierte por debajo del 20% con un mínimo de **8k**. Los bloqueos estrictos usan el umbral del 10% con un mínimo de **4k**, limitado a la ventana de contexto efectiva para que los metadatos sobredimensionados del modelo no puedan rechazar un límite de usuario que de otro modo sería válido. Si encuentras ese preflight, aumenta el límite de contexto del servidor/modelo o elige un modelo más grande.
- ¿Errores de contexto? Reduce `contextWindow` o aumenta el límite del servidor.
- ¿El servidor compatible con OpenAI devuelve `messages[].content ... expected a string`?
  Añade `compat.requiresStringContent: true` en esa entrada de modelo.
- ¿El servidor compatible con OpenAI devuelve `validation.keys` o dice que las entradas de mensaje solo permiten `role` y `content`?
  Añade `compat.strictMessageKeys: true` en esa entrada de modelo.
- ¿Las llamadas directas diminutas a `/v1/chat/completions` funcionan, pero `openclaw infer model run --local`
  falla en Gemma u otro modelo local? Revisa primero la URL del proveedor, la referencia del modelo, el marcador de autenticación y los registros del servidor; `model run` local no incluye herramientas de agente.
  Si `model run` local tiene éxito pero los turnos de agente más grandes fallan, reduce la superficie de herramientas del agente con `localModelLean` o `compat.supportsTools: false`.
- ¿Las llamadas a herramientas aparecen como texto JSON/XML/ReAct sin procesar, o el proveedor devuelve un array `tool_calls` vacío? No añadas un proxy que convierta a ciegas texto del asistente en ejecución de herramientas. Corrige primero la plantilla/parser de chat del servidor. Si el modelo solo funciona cuando se fuerza el uso de herramientas, añade la anulación por modelo `params.extra_body.tool_choice: "required"` anterior y usa esa entrada de modelo solo para sesiones donde se espere una llamada a herramienta en cada turno.
- Seguridad: los modelos locales omiten los filtros del lado del proveedor; mantén los agentes acotados y Compaction activada para limitar el radio de impacto de la inyección de prompts.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Conmutación por error del modelo](/es/concepts/model-failover)
