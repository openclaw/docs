---
read_when:
    - Quieres usar modelos de Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión de contenido multimedia, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-11T23:29:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

El Plugin de Google proporciona acceso a los modelos Gemini mediante Google AI Studio, además de generación de imágenes, comprensión multimedia (imagen/audio/vídeo), texto a voz y búsqueda web mediante Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Opción de ejecución: `agentRuntime.id: "google-gemini-cli"` reutiliza OAuth de Gemini CLI y mantiene las referencias de modelos en su forma canónica `google/*`.

## Primeros pasos

Elija su método de autenticación preferido y siga los pasos de configuración.

<Tabs>
  <Tab title="Clave de API">
    **Recomendado para:** acceso estándar a la API de Gemini mediante Google AI Studio.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        También puede proporcionar la clave directamente:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Se aceptan tanto `GEMINI_API_KEY` como `GOOGLE_API_KEY`. Utilice la que ya tenga configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Recomendado para:** reutilizar un inicio de sesión existente de Gemini CLI mediante OAuth con PKCE, en lugar de usar una clave de API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan de restricciones en sus cuentas al usar OAuth de este modo. Úselo bajo su
    propia responsabilidad.
    </Warning>

    <Steps>
      <Step title="Instalar Gemini CLI">
        El comando local `gemini` debe estar disponible en `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw admite tanto instalaciones mediante Homebrew como instalaciones globales
        mediante npm, incluidas las disposiciones habituales de Windows/npm.
      </Step>
      <Step title="Iniciar sesión mediante OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modelo predeterminado: `google/gemini-3.1-pro-preview`
    - Entorno de ejecución: `google-gemini-cli`
    - Alias: `gemini-cli`

    El identificador de modelo de Gemini 3.1 Pro en la API de Gemini es `gemini-3.1-pro-preview`. OpenClaw acepta la forma abreviada `google/gemini-3.1-pro` como alias práctico y la normaliza antes de las llamadas al proveedor.

    **Variables de entorno:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Si las solicitudes OAuth de Gemini CLI fallan después de iniciar sesión, establezca
    `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway y vuelva a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo del navegador, asegúrese de
    que el comando local `gemini` esté instalado y disponible en `PATH`.
    </Note>

    Las referencias de modelos `google-gemini-cli/*` son alias de compatibilidad heredados.
    Las configuraciones nuevas deben usar referencias de modelos `google/*` junto con el
    entorno de ejecución `google-gemini-cli` cuando se desee ejecutar Gemini CLI localmente.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` se retiró el 2026-03-09; utilice `google/gemini-3.1-pro-preview` en su lugar. Volver a ejecutar la configuración de la clave de API de Gemini (`openclaw onboard --auth-choice gemini-api-key` u `openclaw models auth login --provider google`) sustituye un valor predeterminado configurado y obsoleto por el modelo actual.
</Note>

## Capacidades

| Capacidad                    | Compatible                    |
| ---------------------------- | ----------------------------- |
| Finalización de chat         | Sí                            |
| Generación de imágenes       | Sí                            |
| Generación de música         | Sí                            |
| Texto a voz                  | Sí                            |
| Voz en tiempo real           | Sí (Google Live API)          |
| Comprensión de imágenes      | Sí                            |
| Transcripción de audio       | Sí                            |
| Comprensión de vídeo         | Sí                            |
| Búsqueda web (Grounding)     | Sí                            |
| Pensamiento/razonamiento     | Sí (Gemini 2.5+ / Gemini 3+)  |
| Modelos Gemma 4              | Sí                            |

## Búsqueda web

El proveedor de búsqueda web `gemini` incluido utiliza el anclaje con Google Search de Gemini.
Configure una clave de búsqueda específica en `plugins.entries.google.config.webSearch`,
o permita que reutilice `models.providers.google.apiKey` después de `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

El orden de precedencia de las credenciales es `webSearch.apiKey` específica, después
`GEMINI_API_KEY` y, por último, `models.providers.google.apiKey`. `webSearch.baseUrl`
es opcional y está destinada a proxies de operadores o endpoints compatibles con la
API de Gemini; si se omite, la búsqueda web de Gemini reutiliza
`models.providers.google.baseUrl`. Consulte [Búsqueda con Gemini](/es/tools/gemini-search)
para conocer el comportamiento de la herramienta específico del proveedor.

<Tip>
Los modelos Gemini 3 utilizan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw
asigna los controles de razonamiento de Gemini 3, Gemini 3.1 y los alias
`gemini-*-latest` a `thinkingLevel`, de modo que las ejecuciones predeterminadas o de
baja latencia no envíen valores deshabilitados de `thinkingBudget`.

`/think adaptive` conserva la semántica de pensamiento dinámico de Google en lugar de
elegir un nivel fijo de OpenClaw. Gemini 3 y Gemini 3.1 omiten un `thinkingLevel` fijo
para que Google pueda elegir el nivel; Gemini 2.5 envía el valor centinela dinámico de
Google `thinkingBudget: -1`.

Los modelos Gemma 4 (por ejemplo, `gemma-4-26b-a4b-it`) admiten el modo de pensamiento.
OpenClaw convierte `thinkingBudget` en un `thinkingLevel` de Google compatible con
Gemma 4. Establecer el pensamiento en `off` mantiene el pensamiento deshabilitado en
lugar de asignarlo a `MINIMAL`.

Gemini 2.5 Pro solo funciona en modo de pensamiento y rechaza un
`thinkingBudget: 0` explícito; OpenClaw elimina ese valor de las solicitudes de
Gemini 2.5 Pro en lugar de enviarlo.
</Tip>

## Generación de imágenes

El proveedor de generación de imágenes `google` incluido utiliza de forma predeterminada
`google/gemini-3.1-flash-image-preview`.

- También admite `google/gemini-3-pro-image-preview`
- Generación: hasta 4 imágenes por solicitud
- Modo de edición: habilitado, con hasta 5 imágenes de entrada
- Controles de geometría: `size`, `aspectRatio` y `resolution`

Para utilizar Google como proveedor de imágenes predeterminado:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Consulte [Generación de imágenes](/es/tools/image-generation) para conocer los parámetros compartidos de la herramienta, la selección del proveedor y el comportamiento de conmutación por error.
</Note>

## Generación de vídeo

El Plugin `google` incluido también registra la generación de vídeo mediante la
herramienta compartida `video_generate`.

- Modelo de vídeo predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a vídeo, imagen a vídeo y flujos con una única referencia de vídeo
- Admite `aspectRatio` (`16:9`, `9:16`) y `resolution` (`720P`, `1080P`); actualmente Veo no admite salida de audio
- Duraciones compatibles: **4, 6 u 8 segundos** (los demás valores se ajustan al valor permitido más cercano)

Para utilizar Google como proveedor de vídeo predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Consulte [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta, la selección del proveedor y el comportamiento de conmutación por error.
</Note>

## Generación de música

El Plugin `google` incluido también registra la generación de música mediante la
herramienta compartida `music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles del prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` de forma predeterminada, además de `wav` con `google/lyria-3-pro-preview`
- Entradas de referencia: hasta 10 imágenes
- Las ejecuciones respaldadas por sesiones se desvinculan mediante el flujo compartido de tareas y estados, incluido `action: "status"`

Para utilizar Google como proveedor de música predeterminado:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Consulte [Generación de música](/es/tools/music-generation) para conocer los parámetros compartidos de la herramienta, la selección del proveedor y el comportamiento de conmutación por error.
</Note>

## Texto a voz

El proveedor de voz `google` incluido utiliza la ruta TTS de la API de Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para archivos adjuntos TTS normales, Opus para destinos de notas de voz y PCM para conversaciones/telefonía
- Salida de notas de voz: el PCM de Google se encapsula como WAV y se transcodifica a Opus de 48 kHz mediante `ffmpeg`

La ruta por lotes de TTS de Gemini de Google devuelve el audio generado en la
respuesta `generateContent` completada. Para obtener conversaciones habladas con la
menor latencia, utilice el proveedor de voz en tiempo real de Google basado en Gemini
Live API en lugar del TTS por lotes.

Para utilizar Google como proveedor TTS predeterminado:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

El TTS de la API de Gemini utiliza prompts en lenguaje natural para controlar el
estilo. Establezca `audioProfile` para anteponer un prompt de estilo reutilizable al
texto hablado. Establezca `speakerName` cuando el texto del prompt haga referencia a
un hablante por su nombre.

El TTS de la API de Gemini también acepta etiquetas de audio expresivas entre
corchetes en el texto, como `[whispers]` o `[laughs]`. Para evitar que las etiquetas
aparezcan en la respuesta visible del chat y enviarlas al mismo tiempo al TTS,
colóquelas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una clave de API de Google Cloud Console restringida a la API de Gemini es válida para
este proveedor. Esta no es la ruta independiente de la API de Cloud Text-to-Speech.
</Note>

## Voz en tiempo real

El Plugin `google` incluido registra un proveedor de voz en tiempo real basado en
Gemini Live API para puentes de audio de backend como Voice Call y Google Meet.

| Ajuste                            | Ruta de configuración                                               | Valor predeterminado                                                                  |
| --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                            | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Voz                               | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura                       | `...google.temperature`                                             | (sin establecer)                                                                      |
| Sensibilidad de inicio de VAD     | `...google.startSensitivity`                                        | (sin establecer)                                                                      |
| Sensibilidad de finalización de VAD | `...google.endSensitivity`                                        | (sin establecer)                                                                      |
| Duración del silencio             | `...google.silenceDurationMs`                                       | (sin establecer)                                                                      |
| Gestión de actividad              | `...google.activityHandling`                                        | Valor predeterminado de Google, `start-of-activity-interrupts`                        |
| Cobertura del turno               | `...google.turnCoverage`                                            | Valor predeterminado de Google, `audio-activity-and-all-video`                        |
| Desactivar VAD automático         | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Reanudación de sesión             | `...google.sessionResumption`                                       | `true`                                                                                |
| Compresión de contexto            | `...google.contextWindowCompression`                                | `true`                                                                                |
| Clave de API                      | `...google.apiKey`                                                  | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`        |

Ejemplo de configuración en tiempo real de llamadas de voz:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
La API Live de Google usa audio bidireccional y llamadas a funciones mediante un WebSocket.
OpenClaw adapta el audio del puente de telefonía/Meet al flujo de la API Live PCM de Gemini y
mantiene las llamadas a herramientas en el contrato compartido de voz en tiempo real. Deje
`temperature` sin establecer salvo que necesite cambiar el muestreo; OpenClaw omite los valores
no positivos porque Google Live puede devolver transcripciones sin audio con `temperature: 0`.
La transcripción de la API de Gemini se habilita sin `languageCodes`; el SDK actual de Google
rechaza las sugerencias de códigos de idioma en esta ruta de la API.
</Note>

<Note>
Gemini 3.1 Live acepta texto conversacional mediante la entrada en tiempo real y usa
llamadas secuenciales a funciones. OpenClaw omite los campos antiguos `NON_BLOCKING`, de
programación de respuestas de funciones y de diálogo afectivo para este modelo. Se recomienda
`thinkingLevel`; los valores positivos configurados de `thinkingBudget` se asignan al
nivel compatible más cercano, mientras que `-1` mantiene el valor predeterminado de Google. Consulte la
[comparación de capacidades de Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
La función Conversación de Control UI admite sesiones de Google Live en el navegador con tokens
restringidos de un solo uso. Los proveedores de voz en tiempo real exclusivos del backend también
pueden ejecutarse mediante el transporte de retransmisión genérico del Gateway, que mantiene las
credenciales del proveedor en el Gateway.
</Note>

Para la verificación en vivo por parte de responsables de mantenimiento, ejecute
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
La prueba de humo también cubre las rutas de backend/WebRTC de OpenAI; la parte de Google emite
el mismo formato de token restringido de la API Live que utiliza la función Conversación de Control UI,
abre el extremo WebSocket del navegador, envía la carga útil de configuración inicial y espera
`setupComplete`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Para las ejecuciones directas de la API de Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configure los parámetros por modelo o globales con
      `cachedContent` o el valor heredado `cached_content`
    - Los parámetros de un ámbito más específico (nivel de modelo frente a global) siempre tienen prioridad.
      Dentro del mismo ámbito, si ambas claves están establecidas, `cached_content` tiene prioridad.
      Use solo una clave por ámbito para evitar resultados inesperados.
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en `cacheRead` de OpenClaw a partir de
      `cachedContentTokenCount` del proveedor

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI usage notes">
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw utiliza de forma predeterminada
    la salida `stream-json` de la CLI de Gemini y normaliza el uso a partir de la carga útil
    `stats` final. Las anulaciones heredadas `--output-format json` siguen utilizando el
    analizador JSON.

    - El texto de la respuesta transmitida procede de los eventos `message` del asistente.
    - Para la salida JSON heredada, el texto de la respuesta procede del campo `response` del JSON de la CLI.
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza en `cacheRead` de OpenClaw.
    - Si falta `stats.input`, OpenClaw obtiene los tokens de entrada mediante
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Si el Gateway se ejecuta como demonio (launchd/systemd), asegúrese de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Image generation" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedor.
  </Card>
  <Card title="Music generation" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
</CardGroup>
