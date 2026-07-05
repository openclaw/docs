---
read_when:
    - Quieres usar modelos de Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión de medios, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-05T11:35:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c73a556012cf9560a4f5f99838f538e32ab66250fcec902149af79672f1184da
    source_path: providers/google.md
    workflow: 16
---

El plugin de Google proporciona acceso a los modelos Gemini a través de Google AI Studio, además de generación de imágenes, comprensión de medios (imagen/audio/video), texto a voz y búsqueda web mediante Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Opción de runtime: `agentRuntime.id: "google-gemini-cli"` reutiliza OAuth de Gemini CLI mientras mantiene las referencias de modelo canónicas como `google/*`.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API">
    **Recomendado para:** acceso estándar a la API de Gemini mediante Google AI Studio.

    <Steps>
      <Step title="Ejecutar la incorporación">
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
    Se aceptan tanto `GEMINI_API_KEY` como `GOOGLE_API_KEY`. Usa la que ya tengas configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Recomendado para:** reutilizar un inicio de sesión existente de Gemini CLI mediante PKCE OAuth en lugar de una clave de API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    reportan restricciones de cuenta al usar OAuth de esta forma. Úsalo bajo tu propia responsabilidad.
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

        OpenClaw admite tanto instalaciones con Homebrew como instalaciones globales con npm, incluidos
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

    El id de modelo de Gemini API para Gemini 3.1 Pro es `gemini-3.1-pro-preview`. OpenClaw acepta el `google/gemini-3.1-pro` más corto como alias práctico y lo normaliza antes de las llamadas al proveedor.

    **Variables de entorno:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Si las solicitudes de OAuth de Gemini CLI fallan después del inicio de sesión, configura `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo del navegador, asegúrate de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    Las referencias de modelo `google-gemini-cli/*` son alias de compatibilidad heredados. Las configuraciones
    nuevas deben usar referencias de modelo `google/*` más el runtime `google-gemini-cli`
    cuando quieran ejecución local de Gemini CLI.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` se retiró el 2026-03-09; usa `google/gemini-3.1-pro-preview` en su lugar. Volver a ejecutar la configuración de la clave de API de Gemini (`openclaw onboard --auth-choice gemini-api-key` o `openclaw models auth login --provider google`) reescribe un valor predeterminado configurado obsoleto al modelo actual.
</Note>

## Capacidades

| Capacidad              | Compatible                    |
| ---------------------- | ----------------------------- |
| Completados de chat    | Sí                            |
| Generación de imágenes | Sí                            |
| Generación de música   | Sí                            |
| Texto a voz            | Sí                            |
| Voz en tiempo real     | Sí (Google Live API)          |
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
existe para proxies de operador o endpoints compatibles de Gemini API; cuando se omite,
la búsqueda web de Gemini reutiliza `models.providers.google.baseUrl`. Consulta
[Búsqueda de Gemini](/es/tools/gemini-search) para ver el comportamiento de herramienta específico del proveedor.

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw mapea
los controles de razonamiento de Gemini 3, Gemini 3.1 y alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas/de baja latencia no envíen valores
`thinkingBudget` deshabilitados.

`/think adaptive` conserva la semántica de pensamiento dinámico de Google en lugar de elegir
un nivel fijo de OpenClaw. Gemini 3 y Gemini 3.1 omiten un `thinkingLevel` fijo para que
Google pueda elegir el nivel; Gemini 2.5 envía el centinela dinámico de Google
`thinkingBudget: -1`.

Los modelos Gemma 4 (por ejemplo `gemma-4-26b-a4b-it`) admiten modo de pensamiento. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Establecer el pensamiento en `off` conserva el pensamiento deshabilitado en lugar de mapearlo a
`MINIMAL`.

Gemini 2.5 Pro solo funciona en modo de pensamiento y rechaza un
`thinkingBudget: 0` explícito; OpenClaw elimina ese valor para las solicitudes de Gemini 2.5 Pro
en lugar de enviarlo.
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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de conmutación por error.
</Note>

## Generación de video

El plugin `google` incluido también registra generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: flujos de texto a video, imagen a video y referencia de video único
- Admite `aspectRatio` (`16:9`, `9:16`) y `resolution` (`720P`, `1080P`); la salida de audio no es compatible con Veo hoy
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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de conmutación por error.
</Note>

## Generación de música

El plugin `google` incluido también registra generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` de forma predeterminada, además de `wav` en `google/lyria-3-pro-preview`
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
Consulta [Generación de música](/es/tools/music-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de conmutación por error.
</Note>

## Texto a voz

El proveedor de voz `google` incluido usa la ruta TTS de Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, Opus para destinos de notas de voz, PCM para Talk/telefonía
- Salida de nota de voz: Google PCM se envuelve como WAV y se transcodifica a Opus de 48 kHz con `ffmpeg`

La ruta Gemini TTS por lotes de Google devuelve el audio generado en la respuesta
`generateContent` completada. Para conversaciones habladas con la menor latencia, usa el
proveedor de voz en tiempo real de Google respaldado por Gemini Live API en lugar de TTS
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

Gemini API TTS usa prompting en lenguaje natural para controlar el estilo. Configura
`audioProfile` para anteponer un prompt de estilo reutilizable antes del texto hablado. Configura
`speakerName` cuando tu texto de prompt haga referencia a un hablante con nombre.

Gemini API TTS también acepta etiquetas de audio expresivas entre corchetes en el texto,
como `[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat
mientras se envían a TTS, colócalas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una clave de API de Google Cloud Console restringida a la API de Gemini es válida para este
proveedor. Esta no es la ruta separada de Cloud Text-to-Speech API.
</Note>

## Voz en tiempo real

El plugin `google` incluido registra un proveedor de voz en tiempo real respaldado por
Gemini Live API para puentes de audio backend como Voice Call y Google Meet.

| Configuración        | Ruta de configuración                                               | Valor predeterminado                                                                                   |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Modelo               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                                        |
| Voz                  | `...google.voice`                                                   | `Kore`                                                                                                 |
| Temperatura          | `...google.temperature`                                             | (sin definir)                                                                                          |
| Sensibilidad de inicio de VAD | `...google.startSensitivity`                              | (sin definir)                                                                                          |
| Sensibilidad de fin de VAD | `...google.endSensitivity`                                    | (sin definir)                                                                                          |
| Duración del silencio | `...google.silenceDurationMs`                                      | (sin definir)                                                                                          |
| Gestión de actividad | `...google.activityHandling`                                        | Valor predeterminado de Google, `start-of-activity-interrupts`                                         |
| Cobertura de turno   | `...google.turnCoverage`                                            | Valor predeterminado de Google, `only-activity`                                                        |
| Desactivar VAD automático | `...google.automaticActivityDetectionDisabled`                 | `false`                                                                                                |
| Reanudación de sesión | `...google.sessionResumption`                                      | `true`                                                                                                 |
| Compresión de contexto | `...google.contextWindowCompression`                              | `true`                                                                                                 |
| Clave de API         | `...google.apiKey`                                                  | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`                        |

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
OpenClaw adapta el audio del puente de telefonía/Meet al flujo de PCM de Live API de Gemini y
mantiene las llamadas a herramientas en el contrato de voz en tiempo real compartido. Deja `temperature`
sin definir a menos que necesites cambios de muestreo; OpenClaw omite los valores no positivos
porque Google Live puede devolver transcripciones sin audio para `temperature: 0`.
La transcripción de Gemini API se habilita sin `languageCodes`; el SDK actual de Google
rechaza las sugerencias de código de idioma en esta ruta de API.
</Note>

<Note>
Control UI Talk admite sesiones de navegador de Google Live con tokens de un solo uso
restringidos. Los proveedores de voz en tiempo real solo de backend también pueden ejecutarse mediante el transporte de retransmisión genérico de
Gateway, que mantiene las credenciales del proveedor en el Gateway.
</Note>

Para la verificación en vivo de mantenedor, ejecuta
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
La prueba smoke también cubre las rutas de backend/WebRTC de OpenAI; el tramo de Google emite la misma
forma de token restringido de Live API que usa Control UI Talk, abre el endpoint
WebSocket del navegador, envía la carga útil de configuración inicial y espera
`setupComplete`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas de Gemini API (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
      `cachedContent` o el heredado `cached_content`
    - Los parámetros de un ámbito más específico (nivel de modelo sobre global) siempre prevalecen.
      Dentro del mismo ámbito, si ambas claves están definidas, `cached_content` prevalece.
      Usa solo una clave por ámbito para evitar sorpresas.
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en `cacheRead` de OpenClaw desde
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

  <Accordion title="Notas de uso de Gemini CLI">
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw usa la salida
    `stream-json` de Gemini CLI de forma predeterminada y normaliza el uso desde la carga útil final
    `stats`. Las anulaciones heredadas de `--output-format json` siguen usando el
    analizador JSON.

    - El texto de respuesta transmitido proviene de los eventos `message` del asistente.
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
    Parámetros compartidos de herramientas de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de herramientas de música y selección de proveedor.
  </Card>
</CardGroup>
