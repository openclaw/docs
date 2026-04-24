---
read_when:
    - Desea usar modelos Google Gemini con OpenClaw
    - Necesita el flujo de autenticación con clave API o OAuth
summary: Configuración de Google Gemini (clave API + OAuth, generación de imágenes, comprensión de medios, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

El Plugin de Google proporciona acceso a modelos Gemini a través de Google AI Studio, además de
generación de imágenes, comprensión de medios (imagen/audio/video), texto a voz y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Proveedor alternativo: `google-gemini-cli` (OAuth)

## Primeros pasos

Elija su método de autenticación preferido y siga los pasos de configuración.

<Tabs>
  <Tab title="Clave API">
    **Ideal para:** acceso estándar a la API de Gemini a través de Google AI Studio.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        O pase la clave directamente:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Configurar un modelo predeterminado">
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
    Se aceptan ambas variables de entorno `GEMINI_API_KEY` y `GOOGLE_API_KEY`. Use la que ya tenga configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante OAuth PKCE en lugar de una clave API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan restricciones de cuenta al usar OAuth de esta manera. Úselo bajo su propio riesgo.
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

        OpenClaw admite tanto instalaciones con Homebrew como instalaciones globales con npm, incluidas
        distribuciones comunes de Windows/npm.
      </Step>
      <Step title="Iniciar sesión mediante OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Variables de entorno:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (O las variantes `GEMINI_CLI_*`.)

    <Note>
    Si las solicitudes OAuth de Gemini CLI fallan después de iniciar sesión, configure `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host de Gateway y vuelva a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo del navegador, asegúrese de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    El proveedor `google-gemini-cli`, solo para OAuth, es una superficie independiente
    de inferencia de texto. La generación de imágenes, la comprensión de medios y Gemini Grounding permanecen en
    el id de proveedor `google`.

  </Tab>
</Tabs>

## Capacidades

| Capacidad              | Compatible                    |
| ---------------------- | ----------------------------- |
| Finalizaciones de chat | Sí                            |
| Generación de imágenes | Sí                            |
| Generación de música   | Sí                            |
| Texto a voz            | Sí                            |
| Voz en tiempo real     | Sí (Google Live API)          |
| Comprensión de imagen  | Sí                            |
| Transcripción de audio | Sí                            |
| Comprensión de video   | Sí                            |
| Búsqueda web (Grounding) | Sí                          |
| Thinking/razonamiento  | Sí (Gemini 2.5+ / Gemini 3+)  |
| Modelos Gemma 4        | Sí                            |

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y el alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas/de baja latencia no envíen valores
deshabilitados de `thinkingBudget`.

Los modelos Gemma 4 (por ejemplo `gemma-4-26b-a4b-it`) admiten modo thinking. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Configurar thinking en `off` mantiene thinking deshabilitado en lugar de asignarlo a
`MINIMAL`.
</Tip>

## Generación de imágenes

El proveedor incluido de generación de imágenes `google` usa por defecto
`google/gemini-3.1-flash-image-preview`.

- También admite `google/gemini-3-pro-image-preview`
- Generación: hasta 4 imágenes por solicitud
- Modo de edición: habilitado, hasta 5 imágenes de entrada
- Controles geométricos: `size`, `aspectRatio` y `resolution`

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
Consulte [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de herramientas, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Generación de video

El Plugin incluido `google` también registra generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de un solo video
- Admite `aspectRatio`, `resolution` y `audio`
- Límite actual de duración: **de 4 a 8 segundos**

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
Consulte [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de herramientas, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Generación de música

El Plugin incluido `google` también registra generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles del prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` de forma predeterminada, además de `wav` en `google/lyria-3-pro-preview`
- Entradas de referencia: hasta 10 imágenes
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tareas/estado, incluido `action: "status"`

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
Consulte [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de herramientas, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Texto a voz

El proveedor de voz incluido `google` usa la ruta TTS de la API de Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, PCM para Talk/telefonía
- Salida nativa de notas de voz: no compatible en esta ruta de la API de Gemini porque la API devuelve PCM en lugar de Opus

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
        },
      },
    },
  },
}
```

El TTS de la API de Gemini acepta etiquetas expresivas de audio entre corchetes en el texto, como
`[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat mientras
se envían a TTS, colóquelas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Aquí está el texto limpio de la respuesta.

[[tts:text]][whispers] Aquí está la versión hablada.[[/tts:text]]
```

<Note>
Una clave API de Google Cloud Console restringida a la API de Gemini es válida para este
proveedor. Esta no es la ruta independiente de la API de Cloud Text-to-Speech.
</Note>

## Voz en tiempo real

El Plugin incluido `google` registra un proveedor de voz en tiempo real respaldado por la
Gemini Live API para puentes de audio de backend como Voice Call y Google Meet.

| Configuración         | Ruta de configuración                                                | Predeterminado                                                                        |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voz                   | `...google.voice`                                                    | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                              | (sin establecer)                                                                      |
| Sensibilidad de inicio de VAD | `...google.startSensitivity`                               | (sin establecer)                                                                      |
| Sensibilidad de fin de VAD | `...google.endSensitivity`                                     | (sin establecer)                                                                      |
| Duración del silencio | `...google.silenceDurationMs`                                        | (sin establecer)                                                                      |
| Clave API             | `...google.apiKey`                                                   | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`      |

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
Google Live API usa audio bidireccional y llamadas de función sobre un WebSocket.
OpenClaw adapta el audio de telefonía/puente de Meet al flujo PCM Live API de Gemini y
mantiene las llamadas de herramientas en el contrato compartido de voz en tiempo real. Deje `temperature`
sin establecer a menos que necesite cambios de muestreo; OpenClaw omite valores no positivos
porque Google Live puede devolver transcripciones sin audio para `temperature: 0`.
La transcripción de la API de Gemini está habilitada sin `languageCodes`; el SDK actual de Google
rechaza las sugerencias de códigos de idioma en esta ruta de API.
</Note>

<Note>
Las sesiones del navegador Talk de la interfaz de control siguen requiriendo un proveedor de voz en tiempo real con una
implementación de sesión WebRTC del navegador. Hoy esa ruta es OpenAI Realtime; el
proveedor de Google es para puentes en tiempo real de backend.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas de la API de Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configure parámetros por modelo o globales con
      `cachedContent` o el heredado `cached_content`
    - Si ambos están presentes, `cachedContent` tiene prioridad
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en OpenClaw como `cacheRead` a partir de
      `cachedContentTokenCount` ascendente

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

  <Accordion title="Notas sobre el uso de JSON de Gemini CLI">
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw normaliza
    la salida JSON de la CLI de la siguiente manera:

    - El texto de respuesta proviene del campo JSON `response` de la CLI.
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza en OpenClaw como `cacheRead`.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración del entorno y del daemon">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrese de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
</CardGroup>
