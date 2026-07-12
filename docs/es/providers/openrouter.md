---
read_when:
    - Quiere una única clave de API para muchos LLM
    - Quieres ejecutar modelos mediante OpenRouter en OpenClaw
    - Quiere usar OpenRouter para generar imágenes
    - Quieres usar OpenRouter para generar música
    - Quieres usar OpenRouter para generar videos
summary: Usa la API unificada de OpenRouter para acceder a numerosos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T14:47:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter enruta solicitudes a muchos modelos mediante una API y una clave. Es
compatible con OpenAI, por lo que OpenClaw se comunica con él mediante el mismo
transporte de estilo `openai-completions` utilizado para otros proveedores proxy.

## Primeros pasos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Ejecutar la incorporación mediante OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw abre el flujo de inicio de sesión de OpenRouter en el navegador
        (PKCE), intercambia el código por una clave de API de OpenRouter y la
        almacena en el perfil de autenticación predeterminado de OpenRouter. En
        hosts remotos o sin interfaz gráfica, OpenClaw muestra la URL de inicio
        de sesión y solicita que se pegue la URL de redirección después de iniciar sesión.
      </Step>
      <Step title="(Opcional) Cambiar a un modelo específico">
        La incorporación utiliza `openrouter/auto` de forma predeterminada. Más
        adelante, se puede elegir un modelo concreto:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Clave de API">
    <Steps>
      <Step title="Obtener la clave de API">
        Cree una clave de API en [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Ejecutar la incorporación mediante clave de API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opcional) Cambiar a un modelo específico">
        La incorporación utiliza `openrouter/auto` de forma predeterminada. Más
        adelante, se puede elegir un modelo concreto:

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
Las referencias de modelos siguen el patrón `openrouter/<provider>/<model>`. Para
consultar la lista completa de proveedores y modelos disponibles, véase
[/concepts/model-providers](/es/concepts/model-providers).
</Note>

Modelos alternativos incluidos, utilizados cuando no está disponible el
descubrimiento del catálogo en vivo:

| Referencia de modelo              | Notas                              |
| --------------------------------- | ---------------------------------- |
| `openrouter/auto`                 | Enrutamiento automático de OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 mediante MoonshotAI      |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 mediante MoonshotAI      |

Cualquier otra referencia `openrouter/<provider>/<model>`, incluida
`openrouter/openrouter/fusion` (véase [Enrutador Fusion](#fusion-router)), se
resuelve dinámicamente mediante el catálogo de modelos en vivo de OpenRouter.

## Generación de imágenes

OpenRouter puede respaldar la herramienta `image_generate`. Configure un modelo
de imágenes de OpenRouter en `agents.defaults.imageGenerationModel`:

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

OpenClaw envía las solicitudes de imágenes a la API de imágenes de finalización
de chat de OpenRouter con `modalities: ["image", "text"]`. Los modelos de
imágenes de Gemini reciben además indicaciones de `aspectRatio` y `resolution`
mediante `image_config` de OpenRouter; los demás modelos de imágenes no las
reciben. Utilice `agents.defaults.imageGenerationModel.timeoutMs` para modelos
más lentos; el valor `timeoutMs` por llamada de la herramienta `image_generate`
sigue teniendo prioridad.

## Generación de vídeo

OpenRouter puede respaldar la herramienta `video_generate` mediante su API
asíncrona `/videos`. Configure un modelo de vídeo de OpenRouter en
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

OpenClaw envía trabajos de texto a vídeo y de imagen a vídeo, consulta
periódicamente la `polling_url` devuelta y descarga el vídeo terminado desde
`unsigned_urls` de OpenRouter o desde el punto de conexión del contenido del
trabajo. Las imágenes de referencia se usan de forma predeterminada como
imágenes del primer o último fotograma; las imágenes etiquetadas como
`reference_image` se envían en su lugar como referencias de entrada. El modelo
predeterminado incluido `google/veo-3.1-fast` admite duraciones de 4/6/8
segundos, resoluciones `720P`/`1080P` y relaciones de aspecto `16:9`/`9:16`.
No se admite la conversión de vídeo a vídeo: la API ascendente solo acepta
referencias de texto e imágenes.

## Generación de música

OpenRouter puede respaldar la herramienta `music_generate` mediante la salida de
audio de finalización de chat. Configure un modelo de audio de OpenRouter en
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

El proveedor de música de OpenRouter incluido utiliza
`google/lyria-3-pro-preview` de forma predeterminada y también ofrece
`google/lyria-3-clip-preview`. OpenClaw envía `modalities:
["text", "audio"]`, transmite la respuesta, recopila los fragmentos de audio y
guarda el resultado como contenido multimedia generado para entregarlo mediante
el canal. Los modelos Lyria aceptan una imagen de referencia mediante el
parámetro compartido `music_generate image=...`. El audio en streaming, la
retención de transcripciones y el sobre de eventos SSE derivado están limitados
por `agents.defaults.mediaMaxMb` (el límite de audio predeterminado es de 16 MB).

## Texto a voz

OpenRouter puede actuar como proveedor de TTS mediante su endpoint compatible con OpenAI
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

Si se omite `messages.tts.providers.openrouter.apiKey`, TTS recurre primero a
`models.providers.openrouter.apiKey` y después a `OPENROUTER_API_KEY`.

## Conversión de voz a texto (audio entrante)

OpenRouter puede transcribir archivos adjuntos de voz/audio entrantes mediante la ruta compartida
`tools.media.audio`, usando su endpoint de STT (`/audio/transcriptions`).
Esto se aplica a cualquier plugin de canal que reenvíe voz/audio entrante a la
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

OpenClaw envía las solicitudes de STT de OpenRouter como JSON con el audio en base64 dentro de
`input_audio` (el contrato de STT de OpenRouter), no como cargas de formularios
multiparte de OpenAI.

## Enrutador Fusion

OpenRouter Fusion envía una referencia de modelo de OpenClaw a varios modelos de OpenRouter en
paralelo, hace que OpenRouter evalúe sus respuestas y devuelve una respuesta final
mediante el endpoint normal de OpenRouter. El identificador del modelo ascendente es
`openrouter/fusion`, por lo que la referencia de modelo de OpenClaw contiene tanto el prefijo del
proveedor de OpenClaw como el espacio de nombres ascendente de OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configure el panel y el evaluador de Fusion mediante `params.extraBody` del modelo;
esos campos se reenvían directamente al cuerpo de la solicitud de finalización de chat de OpenRouter.
Fusion funciona tanto con la incorporación mediante OAuth como mediante clave de API; si usa OAuth,
omita la línea `env.OPENROUTER_API_KEY` de abajo.

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

`analysis_models` es el panel paralelo; `model` dentro de la configuración del plugin Fusion
es el modelo evaluador. No establezca `tool_choice` de nivel superior en `"required"`
durante los turnos normales del agente/chat para intentar forzar Fusion: los turnos de OpenClaw pueden incluir
sus propias definiciones de herramientas, y una elección de herramienta obligatoria de nivel superior podría seleccionar una de
ellas en lugar del enrutador Fusion. Cuando está presente esta configuración del plugin Fusion,
OpenClaw añade una nota depurada al prompt del sistema que enumera los modelos de análisis
y el modelo evaluador configurados, para que el agente pueda responder preguntas sobre su propio panel
Fusion. Los demás campos de `extraBody` no se copian en el prompt.

Fusion es más lento por diseño: OpenRouter distribuye el prompt entre varios
modelos de análisis y después ejecuta un paso de evaluación/síntesis, por lo que la latencia es mayor que
la de una solicitud directa a un solo modelo. Úselo para obtener respuestas deliberadas y de alta calidad o
en rutas de escalamiento, no como opción predeterminada sensible a la latencia. Mantenga el panel pequeño y
elija modelos de análisis y evaluación más rápidos para obtener respuestas con mayor rapidez.

Pruebe una referencia configurada con una llamada local de una sola ejecución:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Responde exactamente con: FUSION_OK" \
  --json
```

## Autenticación y encabezados

OpenRouter usa un token Bearer procedente de su clave de API. OAuth de OpenRouter es un flujo de
inicio de sesión PKCE que emite una clave de API de OpenRouter, por lo que OpenClaw almacena el resultado en
el mismo perfil de autenticación mediante clave de API `openrouter:default` que se usa para la configuración manual
de la clave de API.

Para iniciar sesión o rotar la clave almacenada en una instalación existente sin volver a ejecutar
todo el proceso de incorporación:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

En las solicitudes verificadas de OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw añade
los encabezados documentados de atribución de aplicaciones de OpenRouter:

| Encabezado                | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si redirige el proveedor OpenRouter a otro proxy o URL base, OpenClaw
**no** inserta esos encabezados específicos de OpenRouter ni los marcadores de caché de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Almacenamiento en caché de respuestas">
    El almacenamiento en caché de respuestas de OpenRouter es opcional. Actívelo para cada modelo:

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
    la solicitud actual y almacena la respuesta de reemplazo. Se aceptan los alias en
    snake_case (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`), al igual que `responseCacheTtl` /
    `response_cache_ttl` sin el sufijo `Seconds`.

    Esto es independiente del almacenamiento en caché de prompts del proveedor y de los marcadores
    `cache_control` de Anthropic de OpenRouter. Solo se aplica a rutas verificadas de
    `openrouter.ai`, no a URL base de proxies personalizados.

  </Accordion>

  <Accordion title="Marcadores de caché de Anthropic">
    En las rutas verificadas de OpenRouter, las referencias de modelos de Anthropic conservan los marcadores
    `cache_control` de Anthropic de OpenRouter para mejorar la reutilización de la caché de prompts en
    los bloques de prompts del sistema/desarrollador.
  </Accordion>

  <Accordion title="Prefill de razonamiento de Anthropic">
    En las rutas verificadas de OpenRouter, las referencias a modelos de Anthropic con el razonamiento habilitado
    eliminan los turnos finales de prefill del asistente antes de que la solicitud llegue a
    OpenRouter, de acuerdo con el requisito de Anthropic de que las conversaciones de razonamiento
    terminen con un turno del usuario.
  </Accordion>

  <Accordion title="Inyección de pensamiento / razonamiento">
    En las rutas compatibles distintas de `auto`, OpenClaw asigna el nivel de pensamiento seleccionado
    a las cargas útiles de razonamiento del proxy de OpenRouter. `openrouter/auto` y las indicaciones de
    modelos no compatibles omiten esa inyección. Las referencias obsoletas a `openrouter/hunter-alpha` también
    la omiten, porque OpenRouter podía devolver el texto de la respuesta final en campos de razonamiento
    en esa ruta retirada.
  </Accordion>

  <Accordion title="Reproducción del razonamiento de DeepSeek V4">
    En las rutas verificadas de OpenRouter, `openrouter/deepseek/deepseek-v4-flash` y
    `openrouter/deepseek/deepseek-v4-pro` rellenan el valor `reasoning_content` que falte en
    los turnos reproducidos del asistente, lo que mantiene las conversaciones de pensamiento y herramientas con el
    formato de seguimiento requerido por DeepSeek V4. OpenClaw envía los valores de
    `reasoning.effort` compatibles con OpenRouter para estas rutas: `xhigh`/`max` se asignan a `xhigh`;
    cualquier otro nivel que no esté desactivado se asigna a `high`.
  </Accordion>

  <Accordion title="Conformación de solicitudes exclusiva de OpenAI">
    OpenRouter se ejecuta mediante la ruta compatible con OpenAI de estilo proxy, por lo que no
    se reenvía la conformación de solicitudes exclusiva de OpenAI nativo, como `serviceTier`, `store`
    de Responses, las cargas útiles de compatibilidad de razonamiento de OpenAI y las indicaciones de caché de prompts.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias de OpenRouter respaldadas por Gemini permanecen en la ruta Gemini del proxy: OpenClaw conserva
    allí la depuración de firmas de pensamiento de Gemini, pero no habilita la
    validación de reproducción nativa de Gemini ni las reescrituras de inicialización.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    OpenRouter admite un objeto de solicitud `provider` para el enrutamiento del proveedor
    subyacente. Configure una política predeterminada para todas las solicitudes de modelos de texto de OpenRouter
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

    OpenClaw reenvía ese objeto a OpenRouter como la carga útil `provider`
    de la solicitud. Use los campos snake_case documentados de OpenRouter, incluidos `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` y `enforce_distillable_text`.

    Los parámetros específicos de cada modelo anulan el objeto de enrutamiento de todo el proveedor:

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

    Esto solo se aplica a las rutas de finalizaciones de chat de OpenRouter. Las rutas directas de Anthropic,
    Google, OpenAI o proveedores personalizados ignoran los parámetros de enrutamiento de OpenRouter.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
