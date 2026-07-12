---
read_when:
    - Quieres usar los modelos de Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión multimedia, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T14:48:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

El plugin de Google proporciona acceso a los modelos Gemini mediante Google AI Studio, además de generación de imágenes, comprensión de contenido multimedia (imagen/audio/vídeo), conversión de texto a voz y búsqueda web mediante Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Opción de entorno de ejecución: `agentRuntime.id: "google-gemini-cli"` reutiliza OAuth de Gemini CLI y mantiene las referencias de modelos en su forma canónica `google/*`.

## Primeros pasos

Elija el método de autenticación que prefiera y siga los pasos de configuración.

<Tabs>
  <Tab title="Clave de API">
    **Recomendado para:** acceso estándar a la API de Gemini mediante Google AI Studio.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        O proporcione la clave directamente:

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
    Se aceptan tanto `GEMINI_API_KEY` como `GOOGLE_API_KEY`. Use la que ya tenga configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Recomendado para:** reutilizar una sesión existente de Gemini CLI mediante OAuth con PKCE en lugar de una clave de API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan de restricciones en sus cuentas al usar OAuth de esta forma. Úselo bajo su propia responsabilidad.
    </Warning>

    <Steps>
      <Step title="Instalar Gemini CLI">
        El comando local `gemini` debe estar disponible en `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # o npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw admite tanto instalaciones mediante Homebrew como instalaciones globales mediante npm, incluidas
        las disposiciones habituales de Windows/npm.
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
    Si las solicitudes OAuth de Gemini CLI fallan después de iniciar sesión, establezca `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway y vuelva a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo del navegador, asegúrese de que el comando local `gemini`
    esté instalado y disponible en `PATH`.
    </Note>

    Las referencias de modelos `google-gemini-cli/*` son alias heredados de compatibilidad. Las configuraciones
    nuevas deben usar referencias de modelos `google/*` junto con el entorno de ejecución `google-gemini-cli`
    cuando se desee ejecutar Gemini CLI localmente.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` se retiró el 2026-03-09; use `google/gemini-3.1-pro-preview` en su lugar. Volver a ejecutar la configuración de la clave de la API de Gemini (`openclaw onboard --auth-choice gemini-api-key` o `openclaw models auth login --provider google`) sustituye un modelo predeterminado obsoleto configurado por el modelo actual.
</Note>

## Capacidades

| Capacidad                       | Compatibilidad                    |
| ------------------------------- | --------------------------------- |
| Finalizaciones de chat          | Sí                                |
| Generación de imágenes          | Sí                                |
| Generación de música            | Sí                                |
| Conversión de texto a voz       | Sí                                |
| Voz en tiempo real              | Sí (API de Google Live)           |
| Comprensión de imágenes         | Sí                                |
| Transcripción de audio          | Sí                                |
| Comprensión de vídeo            | Sí                                |
| Búsqueda web (Grounding)        | Sí                                |
| Pensamiento/razonamiento        | Sí (Gemini 2.5+ / Gemini 3+)      |
| Modelos Gemma 4                 | Sí                                |

## Búsqueda web

El proveedor de búsqueda web `gemini` incluido usa la fundamentación de Google Search de Gemini.
Configure una clave de búsqueda específica en `plugins.entries.google.config.webSearch`,
o permita que reutilice `models.providers.google.apiKey` después de `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opcional si se establece GEMINI_API_KEY o models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // recurre a models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

El orden de precedencia de las credenciales es `webSearch.apiKey` específica, después `GEMINI_API_KEY`
y, por último, `models.providers.google.apiKey`. `webSearch.baseUrl` es opcional y
se proporciona para proxies del operador o endpoints compatibles con la API de Gemini; cuando se omite,
la búsqueda web de Gemini reutiliza `models.providers.google.baseUrl`. Consulte
[Búsqueda con Gemini](/es/tools/gemini-search) para conocer el comportamiento de la herramienta específico del proveedor.

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y los alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas o de baja latencia no envíen valores
de `thinkingBudget` desactivados.

`/think adaptive` conserva la semántica de pensamiento dinámico de Google en lugar de elegir
un nivel fijo de OpenClaw. Gemini 3 y Gemini 3.1 omiten un `thinkingLevel` fijo para que
Google pueda elegir el nivel; Gemini 2.5 envía el valor centinela dinámico de Google
`thinkingBudget: -1`.

Los modelos Gemma 4 (por ejemplo, `gemma-4-26b-a4b-it`) admiten el modo de pensamiento. OpenClaw
convierte `thinkingBudget` en un `thinkingLevel` de Google compatible para Gemma 4.
Establecer el pensamiento en `off` conserva el pensamiento desactivado en lugar de asignarlo a
`MINIMAL`.

Gemini 2.5 Pro solo funciona en modo de pensamiento y rechaza un valor explícito
`thinkingBudget: 0`; OpenClaw elimina ese valor de las solicitudes de Gemini 2.5 Pro
en lugar de enviarlo.
</Tip>

## Generación de imágenes

El proveedor de generación de imágenes `google` incluido usa de forma predeterminada
`google/gemini-3.1-flash-image-preview`.

- También admite `google/gemini-3-pro-image-preview`
- Generación: hasta 4 imágenes por solicitud
- Modo de edición: habilitado, hasta 5 imágenes de entrada
- Controles de geometría: `size`, `aspectRatio` y `resolution`

Para usar Google como proveedor de imágenes predeterminado:

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

El plugin `google` incluido también registra la generación de vídeo mediante la herramienta compartida
`video_generate`.

- Modelo de vídeo predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a vídeo, imagen a vídeo y flujos con una única referencia de vídeo
- Admite `aspectRatio` (`16:9`, `9:16`) y `resolution` (`720P`, `1080P`); actualmente Veo no admite salida de audio
- Duraciones admitidas: **4, 6 u 8 segundos** (los demás valores se ajustan al valor permitido más cercano)

Para usar Google como proveedor de vídeo predeterminado:

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

El plugin `google` incluido también registra la generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles de indicaciones: `lyrics` e `instrumental`
- Formato de salida: `mp3` de forma predeterminada, además de `wav` en `google/lyria-3-pro-preview`
- Entradas de referencia: hasta 10 imágenes
- Las ejecuciones respaldadas por sesiones se desacoplan mediante el flujo compartido de tareas/estado, incluido `action: "status"`

Para usar Google como proveedor de música predeterminado:

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

## Conversión de texto a voz

El proveedor de voz `google` incluido usa la ruta TTS de la API de Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para archivos adjuntos TTS normales, Opus para destinos de notas de voz y PCM para Talk/telefonía
- Salida de notas de voz: el PCM de Google se encapsula como WAV y se transcodifica a Opus de 48 kHz con `ffmpeg`

La ruta TTS por lotes de Gemini de Google devuelve el audio generado en la respuesta
`generateContent` completada. Para conversaciones habladas con la menor latencia, use el
proveedor de voz en tiempo real de Google basado en la API de Gemini Live en lugar de TTS
por lotes.

Para usar Google como proveedor TTS predeterminado:

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
          audioProfile: "Hable profesionalmente con un tono tranquilo.",
        },
      },
    },
  },
}
```

La TTS de la API de Gemini usa indicaciones en lenguaje natural para controlar el estilo. Establezca
`audioProfile` para anteponer una indicación de estilo reutilizable al texto hablado. Establezca
`speakerName` cuando el texto de la indicación haga referencia a un hablante concreto.

La TTS de la API de Gemini también acepta etiquetas de audio expresivas entre corchetes en el texto,
como `[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat
mientras se envían a TTS, colóquelas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Este es el texto limpio de la respuesta.

[[tts:text]][whispers] Esta es la versión hablada.[[/tts:text]]
```

<Note>
Una clave de API de Google Cloud Console restringida a la API de Gemini es válida para este
proveedor. Esta no es la ruta independiente de la API Cloud Text-to-Speech.
</Note>

## Voz en tiempo real

El plugin `google` incluido registra un proveedor de voz en tiempo real basado en la
API de Gemini Live para puentes de audio de backend como Voice Call y Google Meet.

| Ajuste                         | Ruta de configuración                                                | Valor predeterminado                                                                  |
| ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                         | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-3.1-flash-live-preview`                                                       |
| Voz                            | `...google.voice`                                                    | `Kore`                                                                                |
| Temperatura                    | `...google.temperature`                                              | (sin establecer)                                                                      |
| Sensibilidad de inicio del VAD | `...google.startSensitivity`                                         | (sin establecer)                                                                      |
| Sensibilidad de fin del VAD    | `...google.endSensitivity`                                           | (sin establecer)                                                                      |
| Duración del silencio          | `...google.silenceDurationMs`                                        | (sin establecer)                                                                      |
| Gestión de la actividad        | `...google.activityHandling`                                         | Valor predeterminado de Google, `start-of-activity-interrupts`                        |
| Cobertura del turno            | `...google.turnCoverage`                                             | Valor predeterminado de Google, `audio-activity-and-all-video`                        |
| Desactivar el VAD automático   | `...google.automaticActivityDetectionDisabled`                       | `false`                                                                               |
| Reanudación de la sesión       | `...google.sessionResumption`                                        | `true`                                                                                |
| Compresión del contexto        | `...google.contextWindowCompression`                                 | `true`                                                                                |
| Clave de API                   | `...google.apiKey`                                                   | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`       |

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
Google Live API utiliza audio bidireccional y llamadas a funciones mediante un WebSocket.
OpenClaw adapta el audio del puente de telefonía/Meet al flujo de la API PCM Live de Gemini y
mantiene las llamadas a herramientas en el contrato compartido de voz en tiempo real. Deje `temperature`
sin establecer, a menos que necesite cambios en el muestreo; OpenClaw omite los valores no positivos
porque Google Live puede devolver transcripciones sin audio con `temperature: 0`.
La transcripción de la API de Gemini se habilita sin `languageCodes`; el SDK actual de Google
rechaza las indicaciones de códigos de idioma en esta ruta de la API.
</Note>

<Note>
Gemini 3.1 Live acepta texto conversacional mediante entrada en tiempo real y utiliza
llamadas secuenciales a funciones. OpenClaw omite los campos antiguos `NON_BLOCKING`, de
programación de respuestas de funciones y de diálogo afectivo para este modelo. Se recomienda
`thinkingLevel`; los valores positivos configurados de `thinkingBudget` se asignan al
nivel compatible más cercano, mientras que `-1` mantiene el valor predeterminado de Google. Consulte la
[comparación de capacidades de Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Hablar de la interfaz de control admite sesiones de navegador de Google Live con tokens
restringidos de un solo uso. Los proveedores de voz en tiempo real exclusivos del backend también pueden ejecutarse mediante el
transporte de retransmisión genérico del Gateway, que mantiene las credenciales del proveedor en el Gateway.
</Note>

Para la verificación en vivo por parte de responsables de mantenimiento, ejecute
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
La prueba de humo también cubre las rutas de backend/WebRTC de OpenAI; la parte de Google emite la misma
estructura restringida de token de Live API que utiliza Hablar de la interfaz de control, abre el
punto de conexión WebSocket del navegador, envía la carga útil de configuración inicial y espera
`setupComplete`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de la caché de Gemini">
    Para las ejecuciones directas de la API de Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configure parámetros por modelo o globales con
      `cachedContent` o el `cached_content` heredado
    - Los parámetros de un ámbito más específico (nivel de modelo sobre global) siempre prevalecen.
      Dentro del mismo ámbito, si se establecen ambas claves, `cached_content` prevalece.
      Utilice solo una clave por ámbito para evitar sorpresas.
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

  <Accordion title="Notas de uso de Gemini CLI">
    Al utilizar el proveedor OAuth `google-gemini-cli`, OpenClaw usa de forma predeterminada la
    salida `stream-json` de Gemini CLI y normaliza el uso a partir de la carga útil final
    `stats`. Las sustituciones heredadas de `--output-format json` siguen utilizando el
    analizador JSON.

    - El texto de la respuesta transmitida procede de los eventos `message` del asistente.
    - Para la salida JSON heredada, el texto de la respuesta procede del campo `response` del JSON de la CLI.
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza en `cacheRead` de OpenClaw.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración del entorno y del demonio">
    Si el Gateway se ejecuta como demonio (launchd/systemd), asegúrese de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedores.
  </Card>
  <Card title="Generación de vídeos" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedores.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedores.
  </Card>
</CardGroup>
