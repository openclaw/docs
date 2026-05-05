---
read_when:
    - Quieres una sola clave de API para muchos LLM
    - Quieres ejecutar modelos mediante OpenRouter en OpenClaw
    - Quieres usar OpenRouter para la generación de imágenes
    - Quieres usar OpenRouter para la generación de video
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
punto de conexión y una clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

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
    La incorporación usa `openrouter/auto` de forma predeterminada. Elige un modelo concreto más adelante:

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
Las referencias de modelos siguen el patrón `openrouter/<provider>/<model>`. Para ver la lista completa de
proveedores y modelos disponibles, consulta [/concepts/model-providers](/es/concepts/model-providers).
</Note>

Ejemplos de reserva incluidos:

| Referencia de modelo             | Notas                                   |
| --------------------------------- | --------------------------------------- |
| `openrouter/auto`                 | Enrutamiento automático de OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 mediante MoonshotAI           |

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

OpenClaw envía solicitudes de imagen a la API de imágenes de completaciones de chat de OpenRouter con `modalities: ["image", "text"]`. Los modelos de imagen de Gemini reciben indicaciones admitidas de `aspectRatio` y `resolution` mediante `image_config` de OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` para los modelos de imagen de OpenRouter más lentos; el parámetro `timeoutMs` por llamada de la herramienta `image_generate` sigue teniendo prioridad.

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

OpenClaw envía trabajos de texto a video e imagen a video a OpenRouter, sondea
el `polling_url` devuelto y descarga el video completado desde los
`unsigned_urls` de OpenRouter o desde el punto de conexión de contenido del trabajo documentado.
Las imágenes de referencia se envían como imágenes de fotograma inicial/final de forma predeterminada; las imágenes
etiquetadas con `reference_image` se envían como referencias de entrada de OpenRouter. El valor predeterminado
incluido `google/veo-3.1-fast` anuncia las duraciones actualmente admitidas de 4/6/8
segundos, resoluciones `720P`/`1080P` y relaciones de aspecto `16:9`/`9:16`.
Video a video no está registrado para OpenRouter porque la API de generación de video
ascendente actualmente acepta texto y referencias de imagen.

## Texto a voz

OpenRouter también se puede usar como proveedor de TTS mediante su punto de conexión
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
los encabezados de atribución de aplicación documentados de OpenRouter:

| Encabezado                | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si rediriges el proveedor OpenRouter a otro proxy o URL base, OpenClaw
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

    Esto es independiente de la caché de prompts del proveedor y de los
    marcadores `cache_control` de Anthropic de OpenRouter. Solo se aplica en rutas
    `openrouter.ai` verificadas, no en URL base de proxy personalizadas.

  </Accordion>

  <Accordion title="Marcadores de caché de Anthropic">
    En rutas de OpenRouter verificadas, las referencias de modelos de Anthropic conservan los
    marcadores `cache_control` de Anthropic específicos de OpenRouter que OpenClaw usa para
    mejorar la reutilización de la caché de prompts en bloques de prompts del sistema/desarrollador.
  </Accordion>

  <Accordion title="Prefill de razonamiento de Anthropic">
    En rutas de OpenRouter verificadas, las referencias de modelos de Anthropic con razonamiento habilitado
    eliminan los turnos finales de prefill del asistente antes de que la solicitud llegue a OpenRouter,
    lo que coincide con el requisito de Anthropic de que las conversaciones de razonamiento terminen con un turno
    de usuario.
  </Accordion>

  <Accordion title="Inyección de pensamiento / razonamiento">
    En rutas no `auto` admitidas, OpenClaw asigna el nivel de pensamiento seleccionado a
    cargas útiles de razonamiento del proxy de OpenRouter. Las indicaciones de modelos no admitidas y
    `openrouter/auto` omiten esa inyección de razonamiento. Hunter Alpha también omite
    el razonamiento de proxy para referencias de modelos configuradas obsoletas porque OpenRouter podría
    devolver texto de respuesta final en campos de razonamiento para esa ruta retirada.
  </Accordion>

  <Accordion title="Reproducción de razonamiento de DeepSeek V4">
    En rutas de OpenRouter verificadas, `openrouter/deepseek/deepseek-v4-flash` y
    `openrouter/deepseek/deepseek-v4-pro` rellenan el `reasoning_content` faltante en
    turnos de asistente reproducidos para que las conversaciones de pensamiento/herramientas mantengan la
    forma de seguimiento requerida de DeepSeek V4. OpenClaw envía valores
    `reasoning_effort` admitidos por OpenRouter para estas rutas; `xhigh` es el nivel más alto
    anunciado, y las sobrescrituras obsoletas `max` se asignan a `xhigh`.
  </Accordion>

  <Accordion title="Conformación de solicitudes solo de OpenAI">
    OpenRouter sigue pasando por la ruta compatible con OpenAI de estilo proxy, por lo que
    la conformación de solicitudes nativa solo de OpenAI, como `serviceTier`, `store` de Responses,
    cargas útiles de compatibilidad de razonamiento de OpenAI e indicaciones de caché de prompts, no se reenvía.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias de OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw conserva
    allí la depuración de firmas de pensamiento de Gemini, pero no habilita la validación de reproducción
    nativa de Gemini ni las reescrituras de arranque.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    Si pasas enrutamiento de proveedor de OpenRouter en los parámetros del modelo, OpenClaw lo reenvía
    como metadatos de enrutamiento de OpenRouter antes de que se ejecuten los envoltorios de flujo compartidos.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia de configuración completa para agentes, modelos y proveedores.
  </Card>
</CardGroup>
