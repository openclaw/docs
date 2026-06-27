---
read_when:
    - Quieres una sola clave de API para muchos LLMs
    - Quieres ejecutar modelos mediante OpenRouter en OpenClaw
    - Quieres usar OpenRouter para la generación de imágenes
    - Quieres usar OpenRouter para la generación de música
    - Quieres usar OpenRouter para generación de video
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T12:40:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
punto de conexión y una clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Primeros pasos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw abre el flujo de inicio de sesión en el navegador de OpenRouter, intercambia el código
        PKCE por una clave de API de OpenRouter y almacena esa clave en el perfil de autenticación
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

Ejemplos de reserva incluidos:

| Referencia de modelo              | Notas                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Enrutamiento automático de OpenRouter |
| `openrouter/openrouter/fusion`    | Enrutador OpenRouter Fusion  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 mediante MoonshotAI |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 mediante MoonshotAI |

## Generación de imágenes

OpenRouter también puede respaldar la herramienta `image_generate`. Usa un modelo de imagen de OpenRouter en `agents.defaults.imageGenerationModel`:

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

OpenClaw envía solicitudes de imagen a la API de imágenes de finalizaciones de chat de OpenRouter con `modalities: ["image", "text"]`. Los modelos de imagen de Gemini reciben indicaciones compatibles de `aspectRatio` y `resolution` mediante `image_config` de OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagen de OpenRouter más lentos; el parámetro `timeoutMs` por llamada de la herramienta `image_generate` sigue teniendo prioridad.

## Generación de video

OpenRouter también puede respaldar la herramienta `video_generate` mediante su API asíncrona `/videos`. Usa un modelo de video de OpenRouter en `agents.defaults.videoGenerationModel`:

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

OpenClaw envía trabajos de texto a video y de imagen a video a OpenRouter, sondea
el `polling_url` devuelto y descarga el video completado desde los
`unsigned_urls` de OpenRouter o desde el punto de conexión documentado de contenido del trabajo.
Las imágenes de referencia se envían como imágenes del primer/último fotograma de forma predeterminada; las imágenes
etiquetadas con `reference_image` se envían como referencias de entrada de OpenRouter. El valor
predeterminado incluido `google/veo-3.1-fast` anuncia las duraciones admitidas actualmente de 4/6/8
segundos, resoluciones `720P`/`1080P` y relaciones de aspecto `16:9`/`9:16`.
Video a video no está registrado para OpenRouter porque la API ascendente
de generación de video actualmente acepta texto y referencias de imagen.

## Generación de música

OpenRouter también puede respaldar la herramienta `music_generate` mediante la salida de audio
de finalizaciones de chat. Usa un modelo de audio de OpenRouter en
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

El proveedor de música de OpenRouter incluido usa de forma predeterminada
`google/lyria-3-pro-preview` y también expone
`google/lyria-3-clip-preview`. OpenClaw envía `modalities: ["text",
"audio"]`, habilita el streaming, recopila los fragmentos de audio transmitidos y guarda
el resultado como medio generado para la entrega por canal. Se aceptan imágenes de referencia
para modelos Lyria mediante el parámetro compartido `music_generate image=...`.

## Texto a voz

OpenRouter también puede usarse como proveedor de TTS mediante su punto de conexión
`/audio/speech` compatible con OpenAI.

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

Si se omite `messages.tts.providers.openrouter.apiKey`, TTS reutiliza
`models.providers.openrouter.apiKey` y luego `OPENROUTER_API_KEY`.

## Voz a texto (audio entrante)

OpenRouter puede transcribir adjuntos de voz/audio entrantes mediante la ruta
compartida `tools.media.audio` usando su endpoint de STT (`/audio/transcriptions`).
Esto se aplica a cualquier Plugin de canal que reenvíe voz/audio entrante a la
comprobación previa de comprensión multimedia.

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

OpenClaw envía solicitudes de STT de OpenRouter como JSON con audio en base64 en
`input_audio` (contrato de STT de OpenRouter), no como cargas de formulario
multipart de OpenAI.

## Enrutador Fusion

Usa OpenRouter Fusion cuando quieras que una sola referencia de modelo de OpenClaw
consulte varios modelos de OpenRouter en paralelo, que OpenRouter evalúe sus
respuestas y que devuelva una única respuesta final mediante el endpoint normal
del proveedor OpenRouter. Como el slug del modelo upstream es `openrouter/fusion`,
la referencia de modelo de OpenClaw incluye tanto el prefijo de proveedor de
OpenClaw como el espacio de nombres upstream de OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configura el panel y el juez de Fusion mediante `params.extraBody` del modelo.
Esos campos se reenvían al cuerpo de la solicitud de chat-completions de
OpenRouter. Fusion funciona con la incorporación mediante OAuth de OpenRouter o
con la incorporación mediante clave de API; si usas OAuth, omite la línea
`env.OPENROUTER_API_KEY` del ejemplo siguiente.

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

La lista `analysis_models` es el panel paralelo, y `model` dentro de la
configuración del Plugin de Fusion es el modelo juez. No configures el
`tool_choice` de nivel superior como `"required"` en turnos normales de
agente/chat de OpenClaw para intentar forzar Fusion; los turnos de OpenClaw
pueden incluir definiciones de herramientas de OpenClaw, y una elección de
herramienta obligatoria de nivel superior puede requerir una de esas herramientas
en lugar del enrutador Fusion. Cuando esta configuración del Plugin de Fusion
está presente, OpenClaw también añade una nota de prompt del sistema saneada con
los modelos de análisis configurados y el modelo juez para que el agente pueda
responder preguntas sobre su panel Fusion actual. Otros campos de `extraBody` no
se copian al prompt.

Fusion es más lento por diseño. OpenRouter puede enviar el mismo prompt de
OpenClaw a varios modelos de análisis y luego ejecutar un paso final de
juicio/síntesis, por lo que la latencia suele ser mayor que en una solicitud
directa a un solo modelo. Usa Fusion para respuestas deliberadas y de alta
calidad o rutas de escalado, no como valor predeterminado para chats sensibles a
la latencia. Para obtener respuestas más rápidas, mantén pequeño el panel y elige
modelos de análisis y juez más rápidos.

Prueba la referencia configurada con una llamada local de modelo de una sola ejecución:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autenticación y encabezados

OpenRouter usa internamente un token Bearer con tu clave de API. OAuth de
OpenRouter es un flujo de inicio de sesión PKCE que emite una clave de API de
OpenRouter, por lo que OpenClaw almacena el resultado como el mismo perfil de
autenticación de clave de API `openrouter:default` que usa la ruta de
configuración manual con clave de API.

Para una instalación existente, inicia sesión o rota la clave almacenada de
OpenRouter sin volver a ejecutar toda la incorporación:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Usa `openclaw models auth login --provider openrouter --method api-key` cuando
quieras pegar una clave que creaste manualmente en OpenRouter.

En solicitudes reales de OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw
también añade los encabezados documentados de atribución de aplicación de
OpenRouter:

| Encabezado                | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si rediriges el proveedor OpenRouter a otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni marcadores de caché
de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Response caching">
    El almacenamiento en caché de respuestas de OpenRouter es opcional. Actívalo
    por modelo de OpenRouter con parámetros de modelo:

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
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` fuerza una actualización
    para la solicitud actual y almacena la respuesta de reemplazo. También se
    aceptan alias snake_case (`response_cache`, `response_cache_ttl_seconds` y
    `response_cache_clear`).

    Esto es independiente del almacenamiento en caché de prompts del proveedor y
    de los marcadores `cache_control` de Anthropic de OpenRouter. Solo se aplica
    en rutas verificadas de `openrouter.ai`, no en URL base de proxy personalizadas.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    En rutas verificadas de OpenRouter, las referencias de modelos Anthropic
    conservan los marcadores `cache_control` de Anthropic específicos de
    OpenRouter que OpenClaw usa para mejorar la reutilización de la caché de
    prompts en bloques de prompt del sistema/desarrollador.
  </Accordion>

  <Accordion title="Prellenado de razonamiento de Anthropic">
    En rutas verificadas de OpenRouter, las referencias de modelos de Anthropic con razonamiento habilitado
    eliminan los turnos finales de prellenado del asistente antes de que la solicitud llegue a OpenRouter,
    de acuerdo con el requisito de Anthropic de que las conversaciones de razonamiento terminen con un
    turno de usuario.
  </Accordion>

  <Accordion title="Inyección de pensamiento / razonamiento">
    En rutas compatibles que no sean `auto`, OpenClaw asigna el nivel de pensamiento seleccionado a
    las cargas de razonamiento del proxy de OpenRouter. Las pistas de modelos no compatibles y
    `openrouter/auto` omiten esa inyección de razonamiento. Hunter Alpha también omite
    el razonamiento de proxy para referencias de modelo configuradas obsoletas porque OpenRouter podría
    devolver texto de respuesta final en campos de razonamiento para esa ruta retirada.
  </Accordion>

  <Accordion title="Reproducción de razonamiento de DeepSeek V4">
    En rutas verificadas de OpenRouter, `openrouter/deepseek/deepseek-v4-flash` y
    `openrouter/deepseek/deepseek-v4-pro` completan el `reasoning_content` faltante en
    turnos de asistente reproducidos para que las conversaciones de pensamiento/herramientas mantengan la
    forma de seguimiento requerida por DeepSeek V4. OpenClaw envía valores
    `reasoning_effort` compatibles con OpenRouter para estas rutas; `xhigh` es el nivel
    más alto anunciado, y las anulaciones obsoletas de `max` se asignan a `xhigh`.
  </Accordion>

  <Accordion title="Conformación de solicitudes solo para OpenAI">
    OpenRouter sigue pasando por la ruta de estilo proxy compatible con OpenAI, por lo que
    la conformación de solicitudes nativa solo para OpenAI, como `serviceTier`, Responses `store`,
    las cargas compatibles con razonamiento de OpenAI y las pistas de caché de prompts no se reenvían.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias de OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw conserva
    allí el saneamiento de firmas de pensamiento de Gemini, pero no habilita la validación de reproducción
    nativa de Gemini ni las reescrituras de arranque.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento de proveedor">
    OpenRouter admite un objeto de solicitud `provider` para el enrutamiento del proveedor
    subyacente. Configura una política predeterminada para todas las solicitudes de modelos de texto de OpenRouter
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

    OpenClaw reenvía ese objeto a OpenRouter como la carga de solicitud `provider`.
    Usa los campos snake_case documentados por OpenRouter, incluidos `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` y `enforce_distillable_text`.

    Los parámetros por modelo siguen anulando el objeto de enrutamiento para todo el proveedor:

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

    Esto solo se aplica en rutas de completions de chat de OpenRouter. Las rutas directas de Anthropic,
    Google, OpenAI o proveedores personalizados ignoran los parámetros de enrutamiento de OpenRouter.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
