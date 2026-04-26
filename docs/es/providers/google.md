---
read_when:
    - Quieres usar modelos Google Gemini con OpenClaw
    - Necesitas el flujo de autenticación con clave API u OAuth
summary: Configuración de Google Gemini (clave API + OAuth, generación de imágenes, comprensión multimedia, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:36:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

El plugin de Google proporciona acceso a modelos Gemini mediante Google AI Studio, además de
generación de imágenes, comprensión multimedia (imagen/audio/vídeo), texto a voz y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Opción de runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  reutiliza OAuth de Gemini CLI mientras mantiene las referencias de modelo canónicas como `google/*`.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave API">
    **Ideal para:** acceso estándar a la API de Gemini mediante Google AI Studio.

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
    Se aceptan ambas variables de entorno, `GEMINI_API_KEY` y `GOOGLE_API_KEY`. Usa la que ya tengas configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante PKCE OAuth en lugar de una clave API independiente.

    <Warning>
    `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan de restricciones de cuenta al usar OAuth de esta forma. Úsalo bajo tu propia responsabilidad.
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

        OpenClaw admite tanto instalaciones con Homebrew como instalaciones globales con npm, incluidos
        los diseños comunes de Windows/npm.
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

    **Variables de entorno:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (O las variantes `GEMINI_CLI_*`.)

    <Note>
    Si las solicitudes de OAuth de Gemini CLI fallan después del inicio de sesión, establece `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que empiece el flujo del navegador, asegúrate de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    Las referencias de modelo `google-gemini-cli/*` son alias heredados de compatibilidad. Las configuraciones nuevas
    deben usar referencias de modelo `google/*` más el runtime `google-gemini-cli`
    cuando quieran ejecución local con Gemini CLI.

  </Tab>
</Tabs>

## Capacidades

| Capacidad             | Compatible                    |
| --------------------- | ----------------------------- |
| Chat completions      | Sí                            |
| Generación de imágenes | Sí                           |
| Generación de música  | Sí                            |
| Texto a voz           | Sí                            |
| Voz en tiempo real    | Sí (Google Live API)          |
| Comprensión de imágenes | Sí                          |
| Transcripción de audio | Sí                           |
| Comprensión de vídeo  | Sí                            |
| Búsqueda web (Grounding) | Sí                         |
| Thinking/razonamiento | Sí (Gemini 2.5+ / Gemini 3+)  |
| Modelos Gemma 4       | Sí                            |

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y los alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas/de baja latencia no envíen valores
deshabilitados de `thinkingBudget`.

`/think adaptive` mantiene la semántica de thinking dinámico de Google en lugar de elegir
un nivel fijo de OpenClaw. Gemini 3 y Gemini 3.1 omiten un `thinkingLevel` fijo para que
Google pueda elegir el nivel; Gemini 2.5 envía el centinela dinámico de Google
`thinkingBudget: -1`.

Los modelos Gemma 4 (por ejemplo `gemma-4-26b-a4b-it`) admiten modo thinking. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Establecer thinking en `off` conserva thinking deshabilitado en lugar de asignarlo a
`MINIMAL`.
</Tip>

## Generación de imágenes

El proveedor de generación de imágenes `google` incluido usa por defecto
`google/gemini-3.1-flash-image-preview`.

- También admite `google/gemini-3-pro-image-preview`
- Generación: hasta 4 imágenes por solicitud
- Modo edición: habilitado, hasta 5 imágenes de entrada
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
Consulta [Image Generation](/es/tools/image-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

## Generación de vídeo

El plugin `google` incluido también registra generación de vídeo mediante la herramienta compartida
`video_generate`.

- Modelo de vídeo predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a vídeo, imagen a vídeo y flujos de referencia de vídeo único
- Admite `aspectRatio`, `resolution` y `audio`
- Límite actual de duración: **4 a 8 segundos**

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
Consulta [Video Generation](/es/tools/video-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

## Generación de música

El plugin `google` incluido también registra generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles del prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` por defecto, además de `wav` en `google/lyria-3-pro-preview`
- Entradas de referencia: hasta 10 imágenes
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

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
Consulta [Music Generation](/es/tools/music-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

## Texto a voz

El proveedor de voz `google` incluido usa la ruta TTS de la API de Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, Opus para destinos de nota de voz, PCM para Talk/telefonía
- Salida de nota de voz: Google PCM se envuelve como WAV y se transcodifica a Opus de 48 kHz con `ffmpeg`

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
          voiceName: "Kore",
          audioProfile: "Habla de forma profesional con un tono calmado.",
        },
      },
    },
  },
}
```

El TTS de la API de Gemini usa prompts en lenguaje natural para controlar el estilo. Establece
`audioProfile` para anteponer un prompt de estilo reutilizable antes del texto hablado. Establece
`speakerName` cuando el texto del prompt haga referencia a un hablante con nombre.

El TTS de la API de Gemini también acepta etiquetas expresivas de audio entre corchetes en el texto,
como `[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat
mientras se envían a TTS, colócalas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Aquí está el texto limpio de la respuesta.

[[tts:text]][whispers] Aquí está la versión hablada.[[/tts:text]]
```

<Note>
Una clave API de Google Cloud Console restringida a la API de Gemini es válida para este
proveedor. Esta no es la ruta independiente de Cloud Text-to-Speech API.
</Note>

## Voz en tiempo real

El plugin `google` incluido registra un proveedor de voz en tiempo real respaldado por la
Gemini Live API para puentes de audio de backend como Voice Call y Google Meet.

| Configuración         | Ruta de configuración                                                | Predeterminado                                                                         |
| --------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Modelo                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voz                   | `...google.voice`                                                   | `Kore`                                                                                 |
| Temperature           | `...google.temperature`                                             | (sin definir)                                                                          |
| Sensibilidad de inicio VAD | `...google.startSensitivity`                                  | (sin definir)                                                                          |
| Sensibilidad de fin VAD | `...google.endSensitivity`                                        | (sin definir)                                                                          |
| Duración del silencio | `...google.silenceDurationMs`                                       | (sin definir)                                                                          |
| Clave API             | `...google.apiKey`                                                  | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`       |

Ejemplo de configuración de Voice Call en tiempo real:

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
                voice: "Kore",
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
Google Live API usa audio bidireccional y llamadas a funciones sobre WebSocket.
OpenClaw adapta el audio del puente de telefonía/Meet al flujo PCM Live API de Gemini y
mantiene las llamadas a herramientas en el contrato compartido de voz en tiempo real. Deja `temperature`
sin definir salvo que necesites cambios de muestreo; OpenClaw omite valores no positivos
porque Google Live puede devolver transcripciones sin audio con `temperature: 0`.
La transcripción de la API de Gemini se habilita sin `languageCodes`; el SDK actual de Google
rechaza sugerencias de códigos de idioma en esta ruta de API.
</Note>

<Note>
Las sesiones Talk del navegador en Control UI siguen requiriendo un proveedor de voz en tiempo real con una
implementación de sesión WebRTC del navegador. Actualmente esa ruta es OpenAI Realtime; el
proveedor de Google es para puentes de backend en tiempo real.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas de la API de Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador configurado de `cachedContent` directamente a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
      `cachedContent` o el heredado `cached_content`
    - Si ambos están presentes, `cachedContent` prevalece
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en OpenClaw como `cacheRead` a partir de
      `cachedContentTokenCount` upstream

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

  <Accordion title="Notas de uso de JSON de Gemini CLI">
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw normaliza
    la salida JSON de la CLI de la siguiente manera:

    - El texto de respuesta proviene del campo JSON `response` de la CLI.
    - El uso recurre a `stats` cuando la CLI deja vacío `usage`.
    - `stats.cached` se normaliza en OpenClaw como `cacheRead`.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración de entorno y demonio">
    Si el Gateway se ejecuta como demonio (launchd/systemd), asegúrate de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
</CardGroup>
