---
read_when:
    - Quieres una sola clave de API para varios LLM
    - Quieres ejecutar modelos a través de OpenRouter en OpenClaw
    - Quiere usar OpenRouter para la generación de imágenes
    - Quieres usar OpenRouter para la generación de video
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T21:03:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

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

| Referencia de modelo              | Notas                                  |
| --------------------------------- | -------------------------------------- |
| `openrouter/auto`                 | Enrutamiento automático de OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 mediante MoonshotAI          |

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

OpenClaw envía solicitudes de imágenes a la API de imágenes de completions de chat de OpenRouter con `modalities: ["image", "text"]`. Los modelos de imagen de Gemini reciben indicaciones compatibles de `aspectRatio` y `resolution` mediante `image_config` de OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagen de OpenRouter más lentos; el parámetro `timeoutMs` por llamada de la herramienta `image_generate` sigue teniendo prioridad.

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

OpenClaw envía trabajos de texto a video y de imagen a video a OpenRouter, consulta
la `polling_url` devuelta y descarga el video completado desde
`unsigned_urls` de OpenRouter o desde el endpoint documentado de contenido del trabajo.
Las imágenes de referencia se envían como imágenes del primer/último fotograma de forma predeterminada; las imágenes
etiquetadas con `reference_image` se envían como referencias de entrada de OpenRouter. El valor predeterminado
incluido `google/veo-3.1-fast` anuncia las duraciones actualmente compatibles de 4/6/8
segundos, resoluciones `720P`/`1080P` y relaciones de aspecto `16:9`/`9:16`.
Video a video no está registrado para OpenRouter porque la API de generación de video upstream
actualmente acepta referencias de texto e imagen.

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
los encabezados documentados de atribución de app de OpenRouter:

| Encabezado                | Valor                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Si rediriges el proveedor OpenRouter a algún otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni los marcadores de caché de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Marcadores de caché de Anthropic">
    En rutas verificadas de OpenRouter, las referencias de modelos de Anthropic conservan los
    marcadores `cache_control` de Anthropic específicos de OpenRouter que OpenClaw usa para
    reutilizar mejor la caché de prompts en bloques de prompts de sistema/desarrollador.
  </Accordion>

  <Accordion title="Precarga de razonamiento de Anthropic">
    En rutas verificadas de OpenRouter, las referencias de modelos de Anthropic con razonamiento habilitado
    eliminan los turnos finales de precarga del asistente antes de que la solicitud llegue a OpenRouter,
    de acuerdo con el requisito de Anthropic de que las conversaciones con razonamiento terminen con un
    turno del usuario.
  </Accordion>

  <Accordion title="Inyección de pensamiento / razonamiento">
    En rutas compatibles que no son `auto`, OpenClaw asigna el nivel de pensamiento seleccionado a
    cargas útiles de razonamiento del proxy de OpenRouter. Las indicaciones de modelos no compatibles y
    `openrouter/auto` omiten esa inyección de razonamiento. Hunter Alpha también omite
    el razonamiento del proxy para referencias de modelos configuradas obsoletas porque OpenRouter podría
    devolver texto de respuesta final en campos de razonamiento para esa ruta retirada.
  </Accordion>

  <Accordion title="Reproducción de razonamiento de DeepSeek V4">
    En rutas verificadas de OpenRouter, `openrouter/deepseek/deepseek-v4-flash` y
    `openrouter/deepseek/deepseek-v4-pro` rellenan el `reasoning_content` faltante en
    turnos de asistente reproducidos para que las conversaciones de pensamiento/herramientas mantengan la
    forma de seguimiento requerida por DeepSeek V4.
  </Accordion>

  <Accordion title="Moldeado de solicitudes solo para OpenAI">
    OpenRouter sigue pasando por la ruta de estilo proxy compatible con OpenAI, por lo que
    el moldeado de solicitudes nativo solo de OpenAI, como `serviceTier`, Responses `store`,
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
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia de configuración completa para agentes, modelos y proveedores.
  </Card>
</CardGroup>
