---
read_when:
    - Quieres una única clave de API para muchos LLM
    - Desea ejecutar modelos mediante OpenRouter en OpenClaw
    - Quieres usar OpenRouter para generar imágenes
    - Quiere usar OpenRouter para generar videos
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T02:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
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

Ejemplos de respaldo incluidos:

| Referencia de modelo             | Notas                                 |
| --------------------------------- | ------------------------------------- |
| `openrouter/auto`                 | Enrutamiento automático de OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 mediante MoonshotAI         |

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

OpenClaw envía solicitudes de imagen a la API de imágenes de finalización de chat de OpenRouter con `modalities: ["image", "text"]`. Los modelos de imagen de Gemini reciben indicaciones compatibles de `aspectRatio` y `resolution` a través de `image_config` de OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` para los modelos de imagen de OpenRouter más lentos; el parámetro `timeoutMs` por llamada de la herramienta `image_generate` sigue teniendo prioridad.

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
el `polling_url` devuelto y descarga el video completado desde
`unsigned_urls` de OpenRouter o desde el endpoint de contenido de trabajos documentado.
Las imágenes de referencia se envían como imágenes del primer/último fotograma de forma predeterminada; las imágenes
etiquetadas con `reference_image` se envían como referencias de entrada de OpenRouter. El valor predeterminado
incluido `google/veo-3.1-fast` anuncia las duraciones de 4/6/8
segundos admitidas actualmente, resoluciones `720P`/`1080P` y relaciones de aspecto
`16:9`/`9:16`. Video a video no está registrado para OpenRouter porque la API
ascendente de generación de video acepta actualmente texto y referencias de imagen.

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
Si rediriges el proveedor de OpenRouter a otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni marcadores de caché de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Almacenamiento en caché de respuestas">
    El almacenamiento en caché de respuestas de OpenRouter es opcional. Habilítalo por modelo de OpenRouter con
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

    Esto es independiente del almacenamiento en caché de prompts del proveedor y de los
    marcadores `cache_control` de Anthropic de OpenRouter. Solo se aplica en rutas
    verificadas de `openrouter.ai`, no en URL base de proxy personalizadas.

  </Accordion>

  <Accordion title="Marcadores de caché de Anthropic">
    En rutas verificadas de OpenRouter, las referencias de modelos de Anthropic conservan los
    marcadores `cache_control` específicos de Anthropic de OpenRouter que OpenClaw usa para
    reutilizar mejor la caché de prompts en bloques de prompts de sistema/desarrollador.
  </Accordion>

  <Accordion title="Prefill de razonamiento de Anthropic">
    En rutas verificadas de OpenRouter, las referencias de modelos de Anthropic con razonamiento habilitado
    eliminan los turnos finales de prefill del asistente antes de que la solicitud llegue a OpenRouter,
    lo que coincide con el requisito de Anthropic de que las conversaciones de razonamiento terminen con un turno
    de usuario.
  </Accordion>

  <Accordion title="Inyección de pensamiento / razonamiento">
    En rutas compatibles que no sean `auto`, OpenClaw asigna el nivel de pensamiento seleccionado a
    cargas de razonamiento de proxy de OpenRouter. Las indicaciones de modelos no compatibles y
    `openrouter/auto` omiten esa inyección de razonamiento. Hunter Alpha también omite el
    razonamiento de proxy para referencias de modelos configuradas obsoletas porque OpenRouter podría
    devolver texto de respuesta final en campos de razonamiento para esa ruta retirada.
  </Accordion>

  <Accordion title="Reproducción de razonamiento de DeepSeek V4">
    En rutas verificadas de OpenRouter, `openrouter/deepseek/deepseek-v4-flash` y
    `openrouter/deepseek/deepseek-v4-pro` completan el `reasoning_content` faltante en
    turnos de asistente reproducidos para que las conversaciones con pensamiento/herramientas conserven la
    forma de seguimiento requerida por DeepSeek V4.
  </Accordion>

  <Accordion title="Modelado de solicitudes solo para OpenAI">
    OpenRouter sigue ejecutándose mediante la ruta compatible con OpenAI de estilo proxy, por lo que
    el modelado nativo de solicitudes solo para OpenAI, como `serviceTier`, `store` de Responses,
    las cargas compatibles con razonamiento de OpenAI y las indicaciones de caché de prompts no se reenvían.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias de OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw conserva
    allí la limpieza de firmas de pensamiento de Gemini, pero no habilita la validación nativa de reproducción de Gemini
    ni las reescrituras de arranque.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    Si pasas enrutamiento de proveedor de OpenRouter en los parámetros del modelo, OpenClaw lo reenvía
    como metadatos de enrutamiento de OpenRouter antes de que se ejecuten los envoltorios de stream compartidos.
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
