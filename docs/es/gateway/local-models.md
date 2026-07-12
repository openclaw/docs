---
read_when:
    - Quieres servir modelos desde tu propio equipo con GPU
    - Estás configurando LM Studio o un proxy compatible con OpenAI
    - Necesitas orientación sobre el modelo local más seguro
summary: Ejecuta OpenClaw con LLM locales (LM Studio, vLLM, LiteLLM y endpoints personalizados de OpenAI)
title: Modelos locales
x-i18n:
    generated_at: "2026-07-11T23:06:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Los modelos locales funcionan, pero elevan los requisitos de hardware, tamaño de contexto y defensa contra la inyección de prompts: los modelos pequeños o cuantizados agresivamente truncan el contexto y omiten los filtros de seguridad del proveedor. Esta página abarca pilas locales de gama alta y servidores personalizados compatibles con OpenAI. Para seguir la ruta más sencilla, comienza con [LM Studio](/es/providers/lmstudio) u [Ollama](/es/providers/ollama) y `openclaw onboard`.

Para los servidores locales que deban iniciarse solo cuando los necesite un modelo seleccionado, consulta [Servicios de modelos locales](/es/gateway/local-model-services).

## Requisitos mínimos de hardware

Procura usar **2 o más Mac Studio con la configuración máxima, o un equipo con GPU equivalente (unos 30 000 USD o más)** para disponer de un bucle de agente fluido. Una sola GPU de **24 GB** únicamente admite prompts más ligeros y con mayor latencia. Ejecuta siempre la **variante más grande o de tamaño completo que puedas alojar**; los puntos de control pequeños o muy cuantizados aumentan el riesgo de inyección de prompts (consulta [Seguridad](/es/gateway/security)).

## Elige un backend

| Backend                                              | Úsalo cuando                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [ds4](/es/providers/ds4)                                | Quieras ejecutar DeepSeek V4 Flash localmente en macOS Metal con llamadas a herramientas compatibles con OpenAI         |
| [LM Studio](/es/providers/lmstudio)                     | Realices la configuración local por primera vez y necesites un cargador gráfico y compatibilidad nativa con Responses API |
| LiteLLM / OAI-proxy / proxy personalizado compatible con OpenAI | Utilices como interfaz otra API de modelos y necesites que OpenClaw la trate como OpenAI                         |
| MLX / vLLM / SGLang                                  | Necesites un servicio autoalojado de alto rendimiento con un endpoint HTTP compatible con OpenAI                        |
| [Ollama](/es/providers/ollama)                          | Prefieras un flujo de trabajo mediante CLI, una biblioteca de modelos y un servicio systemd que no requiera intervención |

Usa `api: "openai-responses"` cuando el backend lo admita (LM Studio lo admite). De lo contrario, usa `api: "openai-completions"`. Si se omite `api` en un proveedor personalizado con una `baseUrl`, OpenClaw usa `openai-completions` de forma predeterminada.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** el instalador oficial de Ollama para Linux habilita un servicio systemd con `Restart=always`. En configuraciones de GPU con WSL2, el inicio automático puede volver a cargar el último modelo durante el arranque y mantener ocupada la memoria del equipo anfitrión, lo que provoca reinicios repetidos de la máquina virtual. Consulta [Bucle de fallos de WSL2](/es/providers/ollama#troubleshooting).
</Warning>

## LM Studio + modelo local grande (Responses API)

Esta es actualmente la mejor pila local. Carga un modelo grande en LM Studio (una compilación de tamaño completo de Qwen, DeepSeek o Llama), habilita el servidor local (valor predeterminado: `http://127.0.0.1:1234`) y usa Responses API para mantener el razonamiento separado del texto final.

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

Lista de comprobación para la configuración:

- Instala LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Descarga la **compilación de modelo más grande disponible** (evita las variantes «pequeñas» o muy cuantizadas), inicia el servidor y confirma que `http://127.0.0.1:1234/v1/models` muestre el modelo.
- Sustituye `my-local-model` por el identificador real del modelo que aparece en LM Studio.
- Mantén el modelo cargado; cargarlo desde cero aumenta la latencia de inicio.
- Ajusta `contextWindow`/`maxTokens` si tu compilación de LM Studio utiliza valores distintos.
- Para WhatsApp, usa Responses API para que solo se envíe el texto final.
- Mantén `models.mode: "merge"` para que los modelos alojados sigan disponibles como alternativas.

### Configuración híbrida: modelo principal alojado y alternativa local

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

Para priorizar el modelo local y disponer de un modelo alojado como red de seguridad, intercambia el orden de `primary`/`fallbacks` y conserva el mismo bloque `providers` y `models.mode: "merge"`.

### Alojamiento regional y enrutamiento de datos

También existen variantes alojadas de MiniMax/Kimi/GLM en OpenRouter con endpoints vinculados a regiones concretas (por ejemplo, alojados en Estados Unidos). Elige la variante regional para mantener el tráfico en la jurisdicción que prefieras y conserva `models.mode: "merge"` para utilizar Anthropic/OpenAI como alternativas. El uso exclusivamente local sigue siendo la opción que ofrece mayor privacidad; el enrutamiento regional alojado es el término medio cuando necesitas funciones del proveedor, pero quieres controlar el flujo de datos.

## Otros proxies locales compatibles con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o cualquier Gateway personalizado funciona si expone un endpoint `/v1/chat/completions` con el formato de OpenAI. Usa `openai-completions`, salvo que la documentación del backend indique explícitamente que admite `/v1/responses`.

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

Las entradas de proveedores personalizados/locales confían en el origen exacto de la `baseUrl` configurada para las solicitudes de modelos protegidas, incluidos local loopback, LAN, tailnet y hosts DNS privados. Los orígenes de metadatos o de enlace local se bloquean siempre. Las solicitudes a otros orígenes privados siguen necesitando `models.providers.<id>.request.allowPrivateNetwork: true`; establece el indicador de confianza en `false` para desactivar la confianza en el origen exacto.

`models.providers.<id>.models[].id` es local al proveedor; no incluyas el prefijo del proveedor. Para un servidor MLX iniciado con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Establece `input: ["text", "image"]` en los modelos de visión locales o accesibles mediante proxy para que los archivos de imagen adjuntos se incorporen a los turnos del agente. La incorporación interactiva de proveedores personalizados infiere los identificadores habituales de modelos de visión y solo pregunta por los nombres desconocidos; la incorporación no interactiva utiliza la misma inferencia, con `--custom-image-input` / `--custom-text-input` para sobrescribirla.

Usa `models.providers.<id>.timeoutSeconds` para servidores de modelos locales/remotos lentos antes de aumentar `agents.defaults.timeoutSeconds`. El tiempo de espera del proveedor abarca la conexión, las cabeceras, la transmisión del cuerpo y la cancelación total de la obtención protegida únicamente para las solicitudes HTTP del modelo; si el tiempo de espera del agente o de la ejecución es menor, auméntalo también, ya que el tiempo de espera del proveedor no puede ampliar la ejecución completa.

<Note>
Para proveedores personalizados compatibles con OpenAI, se acepta un marcador local no secreto como `apiKey: "ollama-local"` cuando `baseUrl` se resuelve como local loopback, una LAN privada, `.local` o un nombre de host sin dominio; OpenClaw lo trata como una credencial local válida en lugar de informar de que falta una clave. Usa un valor real para cualquier proveedor que acepte un nombre de host público.
</Note>

Notas de comportamiento para backends `/v1` locales o accesibles mediante proxy:

- OpenClaw los trata como rutas compatibles con OpenAI mediante proxy, no como endpoints nativos de OpenAI.
- No se aplica el formato de solicitudes exclusivo de OpenAI nativo: no se incluye `service_tier`, ni `store` de Responses, ni adaptación de cargas de compatibilidad con el razonamiento de OpenAI, ni indicaciones de caché de prompts.
- Las cabeceras ocultas de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se incorporan a las URL de proxies personalizados.

Anulaciones de compatibilidad para backends compatibles con OpenAI más estrictos:

- **Contenido solo como cadena**: algunos servidores solo aceptan `messages[].content` como cadena, no como matrices estructuradas de partes de contenido. Establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Claves de mensaje estrictas**: si el servidor rechaza entradas de mensajes con claves adicionales a `role`/`content`, establece `compat.strictMessageKeys: true`.
- **Texto de herramientas entre corchetes**: algunos modelos locales emiten solicitudes independientes de herramientas como texto entre corchetes, por ejemplo `[tool_name]`, seguido de JSON y `[END_TOOL_REQUEST]`. OpenClaw las convierte en llamadas reales a herramientas solo cuando el nombre coincide exactamente con una herramienta registrada para el turno; de lo contrario, permanece como texto oculto no compatible.
- **Texto no estructurado con apariencia de llamada a herramienta**: si un modelo emite texto con formato JSON/XML/ReAct que parece una llamada a una herramienta, pero no era una invocación estructurada, OpenClaw lo conserva como texto y registra una advertencia con el identificador de la ejecución, el proveedor/modelo, el patrón detectado y, cuando esté disponible, el nombre de la herramienta. Esto constituye una incompatibilidad del proveedor/modelo, no una ejecución de herramienta completada.
- **Forzar el uso de herramientas**: si las herramientas aparecen como texto del asistente (JSON/XML/ReAct sin procesar o una matriz `tool_calls` vacía), confirma primero que la plantilla o el analizador de chat del servidor admite llamadas a herramientas. Si el analizador solo funciona cuando se fuerza el uso de herramientas, sobrescribe el valor predeterminado del proxy `tool_choice: "auto"` para cada modelo:

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

  Usa esta opción únicamente cuando todos los turnos normales deban llamar a una herramienta. Sustituye `local/my-local-model` por la referencia exacta de `openclaw models list`, o establécela mediante la CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Niveles de razonamiento adicionales**: si un modelo personalizado compatible con OpenAI acepta niveles de razonamiento de OpenAI distintos de los incluidos en el perfil, decláralos en el bloque de compatibilidad del modelo. Añadir `"xhigh"` lo habilita para esa referencia de modelo en `/think xhigh`, los selectores de sesión, la validación del Gateway y la validación de `llm-task`:

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

## Backends más pequeños o estrictos

Si el modelo se carga correctamente, pero los turnos completos del agente se comportan de forma incorrecta, procede de arriba abajo: confirma primero el transporte y, después, reduce el ámbito.

1. **Confirma que el modelo local responde**: sin herramientas ni contexto del agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Confirmar el enrutamiento del Gateway**: envía únicamente el prompt, omitiendo la transcripción, la inicialización de AGENTS, el ensamblaje del motor de contexto, las herramientas y los servidores MCP incluidos, pero sigue comprobando el enrutamiento del Gateway, la autenticación y la selección del proveedor:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probar el modo ligero** si ambas pruebas tienen éxito, pero los turnos reales del agente fallan con llamadas a herramientas malformadas o prompts demasiado grandes: establece `agents.defaults.experimental.localModelLean: true`. Omite las herramientas pesadas de navegador, Cron, mensajería, generación multimedia, voz y PDF, salvo que sean necesarias explícitamente, y coloca de forma predeterminada los catálogos de herramientas más grandes detrás de controles estructurados de búsqueda de herramientas, a la vez que mantiene `exec` visible directamente. Consulta [Funciones experimentales -> Modo ligero para modelos locales](/es/concepts/experimental-features#local-model-lean-mode) para obtener más información y saber cómo confirmar que está activado.

4. **Desactivar por completo las herramientas como último recurso** estableciendo `models.providers.<provider>.models[].compat.supportsTools: false` para ese modelo; el agente se ejecutará entonces sin llamadas a herramientas.

5. **A partir de ahí, el cuello de botella está en el componente de nivel superior.** Si el backend sigue fallando únicamente en ejecuciones más grandes de OpenClaw después de activar el modo ligero y `supportsTools: false`, el problema restante suele estar en el propio modelo o servidor —la ventana de contexto, la memoria de la GPU, el desalojo de la caché KV o un error del backend—, no en la capa de transporte de OpenClaw.

## Solución de problemas

- **¿El Gateway no puede conectarse al proxy?** `curl http://127.0.0.1:1234/v1/models`.
- **¿El modelo de LM Studio está descargado?** Vuelve a cargarlo; un inicio en frío es una causa frecuente de que parezca «bloqueado».
- **¿El servidor local indica `terminated`, `ECONNRESET` o cierra el flujo a mitad de un turno?** OpenClaw registra en los diagnósticos un valor de baja cardinalidad en `model.call.error.failureKind`, además de una instantánea del RSS y del heap del proceso de OpenClaw. En caso de presión de memoria en LM Studio/Ollama, compara esa marca de tiempo con el registro del servidor o con un registro de bloqueo/jetsam de macOS para confirmar si se terminó el proceso del servidor de modelos.
- **¿Hay errores de contexto?** OpenClaw deriva los umbrales de comprobación previa de la ventana de contexto a partir de la ventana detectada del modelo (o de la ventana limitada cuando `agents.defaults.contextTokens` la reduce): muestra una advertencia por debajo del 20 %, con un mínimo de **8k**, y aplica un bloqueo estricto por debajo del 10 %, con un mínimo de **4k** (limitado a la ventana de contexto efectiva para que unos metadatos de modelo sobredimensionados no rechacen un límite de usuario válido). Reduce `contextWindow` o aumenta el límite de contexto del servidor/modelo.
- **¿`messages[].content ... expected a string`?** Añade `compat.requiresStringContent: true` a la entrada de ese modelo.
- **¿`validation.keys` o «message entries only allow `role` and `content`»?** Añade `compat.strictMessageKeys: true` a la entrada de ese modelo.
- **¿Las llamadas directas a `/v1/chat/completions` funcionan, pero `openclaw infer model run --local` falla con Gemma u otro modelo local?** Comprueba primero la URL del proveedor, la referencia del modelo, el marcador de autenticación y los registros del servidor; `model run` omite por completo las herramientas del agente. Si `model run` funciona, pero los turnos más grandes del agente fallan, reduce la superficie de herramientas con `localModelLean` o `compat.supportsTools: false`.
- **¿Las llamadas a herramientas aparecen como texto JSON/XML/ReAct sin procesar, o el proveedor devuelve un arreglo `tool_calls` vacío?** No añadas un proxy que convierta indiscriminadamente el texto del asistente en ejecuciones de herramientas; corrige primero la plantilla o el analizador de chat del servidor. Si el modelo solo funciona cuando se fuerza el uso de herramientas, añade la sustitución `params.extra_body.tool_choice: "required"` indicada anteriormente y utiliza esa entrada del modelo únicamente para sesiones en las que se espere una llamada a herramientas en cada turno.
- **Seguridad**: los modelos locales omiten los filtros del proveedor. Mantén los agentes con un alcance limitado y la Compaction activada para reducir el alcance de una inyección de prompts.

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Conmutación por error de modelos](/es/concepts/model-failover)
