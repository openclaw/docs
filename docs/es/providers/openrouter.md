---
read_when:
    - Quieres una única clave de API para muchos LLMs
    - Quieres ejecutar modelos mediante OpenRouter en OpenClaw
    - Quieres usar OpenRouter para la generación de imágenes
    - Quieres usar OpenRouter para la generación de música
    - Quieres usar OpenRouter para la generación de video
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-05T11:37:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e500fa78c096a5d16d7099d12a4e96659f15e44be09c3ad6dfcbafdb5f6827fb
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter enruta solicitudes a muchos modelos detrás de una sola API y una sola clave. Es
compatible con OpenAI, por lo que OpenClaw se comunica con él mediante el mismo
transporte de estilo `openai-completions` usado para otros proveedores proxy.

## Primeros pasos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw abre el flujo de inicio de sesión en navegador de OpenRouter (PKCE), intercambia el
        código por una clave de API de OpenRouter y la guarda en el perfil de autenticación
        predeterminado de OpenRouter. En hosts remotos o sin interfaz gráfica, OpenClaw imprime la
        URL de inicio de sesión y te pide pegar la URL de redirección después de iniciar sesión.
      </Step>
      <Step title="(Optional) Switch to a specific model">
        La incorporación usa `openrouter/auto` de forma predeterminada. Elige un modelo concreto más adelante:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get your API key">
        Crea una clave de API en [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Run API-key onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Switch to a specific model">
        La incorporación usa `openrouter/auto` de forma predeterminada. Elige un modelo concreto más adelante:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ejemplo de configuración

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Referencias de modelos

<Note>
Las referencias de modelo siguen el patrón `openrouter/<provider>/<model>`. Para ver la lista completa de
proveedores y modelos disponibles, consulta [/concepts/model-providers](/es/concepts/model-providers).
</Note>

Modelos de respaldo incluidos, usados cuando el descubrimiento del catálogo en vivo no está disponible:

| Referencia de modelo             | Notas                                  |
| --------------------------------- | -------------------------------------- |
| `openrouter/auto`                 | Enrutamiento automático de OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 a través de MoonshotAI       |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 a través de MoonshotAI       |

Cualquier otra referencia `openrouter/<provider>/<model>`, incluida
`openrouter/openrouter/fusion` (consulta [Fusion router](#fusion-router)), se resuelve
dinámicamente contra el catálogo de modelos en vivo de OpenRouter.

## Generación de imágenes

OpenRouter puede respaldar la herramienta `image_generate`. Configura un modelo de imagen de OpenRouter
en `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw envía solicitudes de imagen a la API de imágenes de chat-completions de OpenRouter con
`modalities: ["image", "text"]`. Los modelos de imagen de Gemini reciben además
pistas de `aspectRatio` y `resolution` mediante `image_config` de OpenRouter; otros
modelos de imagen no. Usa `agents.defaults.imageGenerationModel.timeoutMs` para
modelos más lentos; el `timeoutMs` por llamada de la herramienta `image_generate` sigue teniendo prioridad.

## Generación de video

OpenRouter puede respaldar la herramienta `video_generate` mediante su API asíncrona
`/videos`. Configura un modelo de video de OpenRouter en
`agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw envía trabajos de texto a video y de imagen a video, sondea la
`polling_url` devuelta y descarga el video finalizado desde los
`unsigned_urls` de OpenRouter o desde el endpoint de contenido del trabajo. Las imágenes de referencia usan de forma predeterminada
imágenes de primer o último fotograma; las imágenes etiquetadas como `reference_image` se envían como referencias
de entrada en su lugar. El valor predeterminado incluido `google/veo-3.1-fast` admite duraciones de 4/6/8
segundos, resoluciones `720P`/`1080P` y relaciones de aspecto `16:9`/`9:16`.
Video a video no es compatible: la API ascendente solo acepta referencias de texto e imagen.

## Generación de música

OpenRouter puede respaldar la herramienta `music_generate` mediante salida de audio de
chat-completions. Configura un modelo de audio de OpenRouter en
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

El proveedor de música de OpenRouter incluido usa `google/lyria-3-pro-preview` de forma predeterminada
y también expone `google/lyria-3-clip-preview`. OpenClaw envía `modalities:
["text", "audio"]`, transmite la respuesta, recopila los fragmentos de audio y guarda
el resultado como medios generados para la entrega por canal. Los modelos Lyria aceptan una
imagen de referencia mediante el parámetro compartido `music_generate image=...`.

## Texto a voz

OpenRouter puede actuar como proveedor TTS mediante su endpoint compatible con OpenAI
`/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Si se omite `messages.tts.providers.openrouter.apiKey`, TTS recurre a
`models.providers.openrouter.apiKey` y luego a `OPENROUTER_API_KEY`.

## Voz a texto (audio entrante)

OpenRouter puede transcribir adjuntos entrantes de voz/audio mediante la ruta compartida
`tools.media.audio`, usando su endpoint STT (`/audio/transcriptions`).
Esto se aplica a cualquier plugin de canal que reenvíe voz/audio entrante a la
preverificación de comprensión de medios.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw envía solicitudes STT de OpenRouter como JSON con audio en base64 en
`input_audio` (el contrato STT de OpenRouter), no como cargas de formulario
multipart de OpenAI.

## Enrutador Fusion

OpenRouter Fusion envía una referencia de modelo de OpenClaw a varios modelos de OpenRouter en
paralelo, hace que OpenRouter evalúe sus respuestas y devuelve una respuesta final
mediante el endpoint normal de OpenRouter. El slug del modelo ascendente es
`openrouter/fusion`, por lo que la referencia de modelo de OpenClaw lleva tanto el prefijo del proveedor
de OpenClaw como el espacio de nombres ascendente de OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configura el panel y el juez de Fusion mediante `params.extraBody` del modelo;
esos campos se reenvían directamente al cuerpo de la solicitud de chat-completions de OpenRouter.
Fusion funciona con incorporación OAuth o con clave de API; si usas OAuth,
omite la línea `env.OPENROUTER_API_KEY` siguiente.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` es el panel paralelo; `model` dentro de la configuración del plugin
Fusion es el modelo juez. No configures `tool_choice` de nivel superior como `"required"`
en turnos normales de agente/chat para intentar forzar Fusion: los turnos de OpenClaw pueden incluir
sus propias definiciones de herramientas, y una elección de herramienta requerida de nivel superior puede elegir una de
ellas en lugar del enrutador Fusion. Cuando esta configuración del plugin Fusion está presente,
OpenClaw agrega una nota sanitizada del prompt del sistema que enumera los modelos de análisis
configurados y el modelo juez, para que el agente pueda responder preguntas sobre su propio panel
Fusion. Otros campos de `extraBody` no se copian al prompt.

Fusion es más lento por diseño: OpenRouter distribuye el prompt a múltiples
modelos de análisis y luego ejecuta un paso de juez/síntesis, por lo que la latencia es mayor que
en una solicitud directa a un solo modelo. Úsalo para respuestas deliberadas y de alta calidad o
rutas de escalado, no como valor predeterminado sensible a la latencia. Mantén el panel pequeño y
elige modelos de análisis/juez más rápidos para obtener respuestas más ágiles.

Prueba una referencia configurada con una llamada local de una sola ejecución:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autenticación y encabezados

OpenRouter usa un token Bearer de tu clave de API. OpenRouter OAuth es un flujo de inicio de sesión
PKCE que emite una clave de API de OpenRouter, por lo que OpenClaw guarda el resultado en
el mismo perfil de autenticación de clave de API `openrouter:default` usado por la configuración manual
con clave de API.

Para iniciar sesión o rotar la clave guardada en una instalación existente sin volver a ejecutar
toda la incorporación:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

En solicitudes verificadas de OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw agrega
los encabezados de atribución de aplicación documentados por OpenRouter:

| Encabezado                | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si rediriges el proveedor OpenRouter a algún otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni marcadores de caché de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Response caching">
    El almacenamiento en caché de respuestas de OpenRouter es opt-in. Actívalo por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw envía `X-OpenRouter-Cache: true` y, cuando está configurado,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` fuerza una actualización para
    la solicitud actual y guarda la respuesta de reemplazo. Se aceptan alias
    snake_case (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`), al igual que `responseCacheTtl` /
    `response_cache_ttl` sin el sufijo `Seconds`.

    Esto es independiente del almacenamiento en caché de prompts del proveedor y de los marcadores
    `cache_control` de Anthropic de OpenRouter. Solo se aplica en rutas verificadas de
    `openrouter.ai`, no en URL base de proxy personalizadas.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    En rutas verificadas de OpenRouter, las referencias de modelos Anthropic conservan los marcadores
    `cache_control` de Anthropic de OpenRouter para una mejor reutilización de la caché de prompts en
    bloques de prompt de sistema/desarrollador.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    En rutas verificadas de OpenRouter, las referencias de modelos Anthropic con razonamiento activado
    eliminan los turnos finales de prellenado del asistente antes de que la solicitud llegue a
    OpenRouter, coincidiendo con el requisito de Anthropic de que las conversaciones con razonamiento
    terminen con un turno de usuario.
  </Accordion>

  <Accordion title="Inyección de pensamiento / razonamiento">
    En las rutas compatibles que no son `auto`, OpenClaw asigna el nivel de razonamiento seleccionado
    a las cargas útiles de razonamiento del proxy de OpenRouter. `openrouter/auto` y las sugerencias de
    modelo no compatibles omiten esa inyección. Las referencias obsoletas `openrouter/hunter-alpha` también
    la omiten, porque OpenRouter podría devolver texto de respuesta final en los campos de razonamiento
    en esa ruta retirada.
  </Accordion>

  <Accordion title="Reproducción de razonamiento de DeepSeek V4">
    En rutas verificadas de OpenRouter, `openrouter/deepseek/deepseek-v4-flash` y
    `openrouter/deepseek/deepseek-v4-pro` completan el `reasoning_content` faltante en
    turnos de asistente reproducidos, manteniendo las conversaciones de razonamiento/herramientas en la
    forma de seguimiento requerida por DeepSeek V4. OpenClaw envía valores de
    `reasoning.effort` compatibles con OpenRouter para estas rutas: `xhigh`/`max` se asignan a `xhigh`,
    y cualquier otro nivel que no sea desactivado se asigna a `high`.
  </Accordion>

  <Accordion title="Conformación de solicitudes solo para OpenAI">
    OpenRouter se ejecuta mediante la ruta compatible con OpenAI de estilo proxy, por lo que no se reenvía
    la conformación de solicitudes nativa solo de OpenAI, como `serviceTier`, Responses `store`,
    las cargas útiles de compatibilidad de razonamiento de OpenAI y las sugerencias de caché de prompts.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias de OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw mantiene
    allí la limpieza de firmas de pensamiento de Gemini, pero no habilita la validación de reproducción nativa
    de Gemini ni las reescrituras de arranque.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    OpenRouter admite un objeto de solicitud `provider` para el enrutamiento del proveedor subyacente.
    Configura una política predeterminada para todas las solicitudes de modelos de texto de OpenRouter
    con `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw reenvía ese objeto a OpenRouter como la carga útil de solicitud `provider`.
    Usa los campos snake_case documentados de OpenRouter, incluidos `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` y `enforce_distillable_text`.

    Los parámetros por modelo anulan el objeto de enrutamiento de todo el proveedor:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Esto solo se aplica en rutas de chat-completions de OpenRouter. Las rutas directas de Anthropic,
    Google, OpenAI o proveedores personalizados ignoran los parámetros de enrutamiento de OpenRouter.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
