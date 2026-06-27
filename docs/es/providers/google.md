---
read_when:
    - Quieres usar modelos de Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión de medios, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T12:37:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

El Plugin de Google proporciona acceso a modelos Gemini a través de Google AI Studio, además de
generación de imágenes, comprensión de medios (imagen/audio/video), texto a voz y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Opción de runtime: proveedor/modelo `agentRuntime.id: "google-gemini-cli"`
  reutiliza el OAuth de Gemini CLI mientras mantiene las referencias de modelo canónicas como `google/*`.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API de Gemini a través de Google AI Studio.

    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        O pasa la clave directamente:

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
    Se aceptan las variables de entorno `GEMINI_API_KEY` y `GOOGLE_API_KEY`. Usa la que ya tengas configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante OAuth con PKCE en lugar de una clave de API separada.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan restricciones de cuenta al usar OAuth de esta forma. Úsalo bajo tu propia responsabilidad.
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

        OpenClaw admite instalaciones de Homebrew e instalaciones globales de npm, incluidos
        diseños comunes de Windows/npm.
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
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    El ID de modelo de la API de Gemini para Gemini 3.1 Pro es `gemini-3.1-pro-preview`. OpenClaw acepta el `google/gemini-3.1-pro` más corto como alias práctico y lo normaliza antes de las llamadas al proveedor.

    **Variables de entorno:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (O las variantes `GEMINI_CLI_*`.)

    <Note>
    Si las solicitudes de OAuth de Gemini CLI fallan después de iniciar sesión, define `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo del navegador, asegúrate de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    Las referencias de modelo `google-gemini-cli/*` son alias de compatibilidad heredados. Las
    configuraciones nuevas deben usar referencias de modelo `google/*` más el runtime `google-gemini-cli`
    cuando quieran ejecución local con Gemini CLI.

  </Tab>
</Tabs>

## Capacidades

| Capacidad              | Compatibilidad                |
| ---------------------- | ----------------------------- |
| Finalizaciones de chat | Sí                            |
| Generación de imágenes | Sí                            |
| Generación de música   | Sí                            |
| Texto a voz            | Sí                            |
| Voz en tiempo real     | Sí (API de Google Live)       |
| Comprensión de imágenes | Sí                           |
| Transcripción de audio | Sí                            |
| Comprensión de video   | Sí                            |
| Búsqueda web (Grounding) | Sí                          |
| Pensamiento/razonamiento | Sí (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4        | Sí                            |

## Búsqueda web

El proveedor de búsqueda web `gemini` incluido usa grounding de Google Search de Gemini.
Configura una clave de búsqueda dedicada en `plugins.entries.google.config.webSearch`,
o deja que reutilice `models.providers.google.apiKey` después de `GEMINI_API_KEY`:

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

La precedencia de credenciales es `webSearch.apiKey` dedicada, luego `GEMINI_API_KEY`,
luego `models.providers.google.apiKey`. `webSearch.baseUrl` es opcional y
existe para proxies de operadores o endpoints compatibles de la API de Gemini; cuando se omite,
la búsqueda web de Gemini reutiliza `models.providers.google.baseUrl`. Consulta
[Búsqueda de Gemini](/es/tools/gemini-search) para ver el comportamiento de la herramienta específica del proveedor.

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas/de baja latencia no envíen valores
`thinkingBudget` deshabilitados.

`/think adaptive` conserva la semántica de pensamiento dinámico de Google en lugar de elegir
un nivel fijo de OpenClaw. Gemini 3 y Gemini 3.1 omiten un `thinkingLevel` fijo para que
Google pueda elegir el nivel; Gemini 2.5 envía el centinela dinámico de Google
`thinkingBudget: -1`.

Los modelos Gemma 4 (por ejemplo `gemma-4-26b-a4b-it`) admiten modo de pensamiento. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Establecer pensamiento en `off` conserva el pensamiento deshabilitado en lugar de asignarlo a
`MINIMAL`.
</Tip>

## Generación de imágenes

El proveedor de generación de imágenes `google` incluido usa de forma predeterminada
`google/gemini-3.1-flash-image-preview`.

- También admite `google/gemini-3-pro-image-preview`
- Generar: hasta 4 imágenes por solicitud
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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

## Generación de video

El Plugin `google` incluido también registra la generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de un solo video
- Admite `aspectRatio` (`16:9`, `9:16`) y `resolution` (`720P`, `1080P`); la salida de audio no es compatible con Veo actualmente
- Duraciones admitidas: **4, 6 u 8 segundos** (otros valores se ajustan al valor permitido más cercano)

Para usar Google como proveedor de video predeterminado:

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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

## Generación de música

El Plugin `google` incluido también registra la generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` de forma predeterminada, más `wav` en `google/lyria-3-pro-preview`
- Entradas de referencia: hasta 10 imágenes
- Las ejecuciones respaldadas por sesión se desvinculan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

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
Consulta [Generación de música](/es/tools/music-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

## Texto a voz

El proveedor de voz `google` incluido usa la ruta TTS de la API de Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, Opus para destinos de notas de voz, PCM para Talk/telefonía
- Salida de nota de voz: el PCM de Google se envuelve como WAV y se transcodifica a Opus de 48 kHz con `ffmpeg`

La ruta TTS por lotes de Gemini de Google devuelve el audio generado en la respuesta
`generateContent` completada. Para conversaciones habladas de menor latencia, usa el
proveedor de voz en tiempo real de Google respaldado por la API de Gemini Live en lugar de TTS
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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

TTS de la API de Gemini usa prompting en lenguaje natural para el control de estilo. Define
`audioProfile` para anteponer un prompt de estilo reutilizable antes del texto hablado. Define
`speakerName` cuando el texto de tu prompt se refiera a un hablante con nombre.

TTS de la API de Gemini también acepta etiquetas de audio expresivas entre corchetes en el texto,
como `[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat
mientras se envían a TTS, ponlas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una clave de API de Google Cloud Console restringida a la API de Gemini es válida para este
proveedor. Esta no es la ruta separada de la API Cloud Text-to-Speech.
</Note>

## Voz en tiempo real

El Plugin `google` incluido registra un proveedor de voz en tiempo real respaldado por la
API de Gemini Live para puentes de audio backend, como Voice Call y Google Meet.

| Configuración                 | Ruta de configuración                                               | Predeterminado                                                                        |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                        | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voz                           | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura                   | `...google.temperature`                                             | (sin definir)                                                                         |
| Sensibilidad de inicio de VAD | `...google.startSensitivity`                                        | (sin definir)                                                                         |
| Sensibilidad de fin de VAD    | `...google.endSensitivity`                                          | (sin definir)                                                                         |
| Duración del silencio         | `...google.silenceDurationMs`                                       | (sin definir)                                                                         |
| Manejo de actividad           | `...google.activityHandling`                                        | Predeterminado de Google, `start-of-activity-interrupts`                              |
| Cobertura de turno            | `...google.turnCoverage`                                            | Predeterminado de Google, `only-activity`                                             |
| Desactivar VAD automático     | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Reanudación de sesión         | `...google.sessionResumption`                                       | `true`                                                                                |
| Compresión de contexto        | `...google.contextWindowCompression`                                | `true`                                                                                |
| Clave de API                  | `...google.apiKey`                                                  | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`       |

Ejemplo de configuración en tiempo real de Voice Call:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
Google Live API usa audio bidireccional y llamadas a funciones mediante un WebSocket.
OpenClaw adapta el audio del puente de telefonía/Meet al flujo de PCM Live API de Gemini y
mantiene las llamadas a herramientas en el contrato compartido de voz en tiempo real. Deja `temperature`
sin definir salvo que necesites cambios de muestreo; OpenClaw omite los valores no positivos
porque Google Live puede devolver transcripciones sin audio para `temperature: 0`.
La transcripción de Gemini API se habilita sin `languageCodes`; el SDK actual de Google
rechaza las sugerencias de códigos de idioma en esta ruta de API.
</Note>

<Note>
Control UI Talk admite sesiones de navegador de Google Live con tokens restringidos de un solo uso.
Los proveedores de voz en tiempo real solo de backend también pueden ejecutarse mediante el transporte de retransmisión genérico de
Gateway, que mantiene las credenciales del proveedor en el Gateway.
</Note>

Para la verificación en vivo de mantenedores, ejecuta
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
La prueba de humo también cubre las rutas de backend/WebRTC de OpenAI; el tramo de Google emite la misma
forma de token restringido de Live API que usa Control UI Talk, abre el punto de conexión
WebSocket del navegador, envía la carga útil de configuración inicial y espera
`setupComplete`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas de Gemini API (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
      `cachedContent` o el heredado `cached_content`
    - Si ambos están presentes, `cachedContent` tiene prioridad
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en `cacheRead` de OpenClaw desde
      el `cachedContentTokenCount` del origen

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
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw usa la salida
    `stream-json` de Gemini CLI de forma predeterminada y normaliza el uso desde la carga útil final
    `stats`. Las anulaciones heredadas de `--output-format json` siguen usando el
    analizador JSON.

    - El texto de respuesta transmitido proviene de eventos `message` del asistente.
    - Para la salida JSON heredada, el texto de respuesta proviene del campo `response` del JSON de la CLI.
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza en `cacheRead` de OpenClaw.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración de entorno y daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
</CardGroup>
