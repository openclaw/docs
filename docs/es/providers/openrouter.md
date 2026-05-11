---
read_when:
    - Quieres una única clave de API para muchos LLMs
    - Quiere ejecutar modelos mediante OpenRouter en OpenClaw
    - Quieres usar OpenRouter para la generación de imágenes
    - Desea usar OpenRouter para generar video
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-11T20:51:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Cambia a un modelo específico">
    La incorporación usa `openrouter/auto` de forma predeterminada. Elige un modelo concreto más tarde:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

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
Las refs de modelos siguen el patrón `openrouter/<provider>/<model>`. Para ver la lista completa de
proveedores y modelos disponibles, consulta [/concepts/model-providers](/es/concepts/model-providers).
</Note>

Ejemplos de reserva incluidos:

| Ref de modelo                    | Notas                                  |
| -------------------------------- | -------------------------------------- |
| `openrouter/auto`                | Enrutamiento automático de OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 mediante MoonshotAI          |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 mediante MoonshotAI          |

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

OpenClaw envía solicitudes de imagen a la API de imágenes de chat completions de OpenRouter con `modalities: ["image", "text"]`. Los modelos de imagen de Gemini reciben indicaciones compatibles de `aspectRatio` y `resolution` mediante `image_config` de OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagen de OpenRouter más lentos; el parámetro `timeoutMs` por llamada de la herramienta `image_generate` sigue teniendo prioridad.

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

OpenClaw envía trabajos de texto a video e imagen a video a OpenRouter, consulta
la `polling_url` devuelta y descarga el video completado desde los
`unsigned_urls` de OpenRouter o desde el endpoint documentado de contenido del trabajo.
Las imágenes de referencia se envían de forma predeterminada como imágenes de primer/último fotograma; las imágenes
etiquetadas con `reference_image` se envían como referencias de entrada de OpenRouter. El valor predeterminado
incluido `google/veo-3.1-fast` anuncia las duraciones actualmente compatibles de 4/6/8
segundos, resoluciones `720P`/`1080P` y relaciones de aspecto `16:9`/`9:16`.
Video a video no está registrado para OpenRouter porque la API upstream
de generación de video actualmente acepta texto y referencias de imagen.

## Texto a voz

OpenRouter también puede usarse como proveedor de TTS mediante su endpoint
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
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Si se omite `messages.tts.providers.openrouter.apiKey`, TTS reutiliza
`models.providers.openrouter.apiKey` y luego `OPENROUTER_API_KEY`.

## Autenticación y encabezados

OpenRouter usa internamente un token Bearer con tu clave de API.

En solicitudes reales de OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw también añade
los encabezados documentados de atribución de aplicación de OpenRouter:

| Encabezado                | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si apuntas el proveedor de OpenRouter a otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni los marcadores de caché de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Caché de respuestas">
    La caché de respuestas de OpenRouter es opcional. Habilítala por modelo de OpenRouter con
    parámetros de modelo:

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
    la solicitud actual y almacena la respuesta de reemplazo. También se aceptan alias en snake_case
    (`response_cache`, `response_cache_ttl_seconds` y
    `response_cache_clear`).

    Esto es independiente de la caché de prompts del proveedor y de los marcadores
    `cache_control` de Anthropic de OpenRouter. Solo se aplica en rutas
    verificadas de `openrouter.ai`, no en URLs base de proxy personalizadas.

  </Accordion>

  <Accordion title="Marcadores de caché de Anthropic">
    En rutas verificadas de OpenRouter, las refs de modelos de Anthropic conservan los
    marcadores `cache_control` específicos de Anthropic de OpenRouter que OpenClaw usa para
    reutilizar mejor la caché de prompts en bloques de prompts de sistema/desarrollador.
  </Accordion>

  <Accordion title="Prefill de razonamiento de Anthropic">
    En rutas verificadas de OpenRouter, las refs de modelos de Anthropic con razonamiento habilitado
    eliminan los turnos finales de prefill del asistente antes de que la solicitud llegue a OpenRouter,
    coincidiendo con el requisito de Anthropic de que las conversaciones con razonamiento terminen con un turno
    del usuario.
  </Accordion>

  <Accordion title="Inyección de pensamiento / razonamiento">
    En rutas compatibles que no son `auto`, OpenClaw asigna el nivel de pensamiento seleccionado a
    payloads de razonamiento del proxy de OpenRouter. Las indicaciones de modelos no compatibles y
    `openrouter/auto` omiten esa inyección de razonamiento. Hunter Alpha también omite
    el razonamiento del proxy para refs de modelos configuradas obsoletas porque OpenRouter podría
    devolver texto de respuesta final en campos de razonamiento para esa ruta retirada.
  </Accordion>

  <Accordion title="Reproducción de razonamiento de DeepSeek V4">
    En rutas verificadas de OpenRouter, `openrouter/deepseek/deepseek-v4-flash` y
    `openrouter/deepseek/deepseek-v4-pro` rellenan el `reasoning_content` faltante en
    turnos del asistente reproducidos para que las conversaciones de pensamiento/herramientas mantengan la
    forma de seguimiento requerida por DeepSeek V4. OpenClaw envía valores
    `reasoning_effort` compatibles con OpenRouter para estas rutas; `xhigh` es el nivel más alto anunciado,
    y las sobrescrituras obsoletas de `max` se asignan a `xhigh`.
  </Accordion>

  <Accordion title="Modelado de solicitudes solo para OpenAI">
    OpenRouter sigue ejecutándose por la ruta proxy compatible con OpenAI, por lo que
    el modelado de solicitudes nativo solo de OpenAI, como `serviceTier`, Responses `store`,
    payloads compatibles con razonamiento de OpenAI y sugerencias de caché de prompts, no se reenvía.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las refs de OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw conserva
    allí el saneamiento de firmas de pensamiento de Gemini, pero no habilita la validación
    nativa de reproducción de Gemini ni reescrituras de bootstrap.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    Si pasas el enrutamiento de proveedor de OpenRouter en los parámetros del modelo, OpenClaw lo reenvía
    como metadatos de enrutamiento de OpenRouter antes de que se ejecuten los wrappers de stream compartidos.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
