---
read_when:
    - Quieres usar los modelos de Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión de medios, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T05:57:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

El plugin de Google proporciona acceso a los modelos Gemini mediante Google AI Studio, además de
generación de imágenes, comprensión de medios (imagen/audio/video), texto a voz y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: Google Gemini API
- Opción de entorno de ejecución: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  reutiliza OAuth de Gemini CLI y mantiene las referencias de modelo canónicas como `google/*`.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a Gemini API mediante Google AI Studio.

    <Steps>
      <Step title="Ejecutar la configuración inicial">
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
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante OAuth PKCE en lugar de una clave de API separada.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    reportan restricciones de cuenta al usar OAuth de esta manera. Úsalo bajo tu propio riesgo.
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

        OpenClaw admite instalaciones de Homebrew e instalaciones globales de npm, incluidas
        distribuciones comunes de Windows/npm.
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

    El id de modelo de Gemini API para Gemini 3.1 Pro es `gemini-3.1-pro-preview`. OpenClaw acepta el `google/gemini-3.1-pro` más corto como alias de conveniencia y lo normaliza antes de las llamadas al proveedor.

    **Variables de entorno:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (O las variantes `GEMINI_CLI_*`.)

    <Note>
    Si las solicitudes de OAuth de Gemini CLI fallan después del inicio de sesión, define `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo del navegador, asegúrate de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    Las referencias de modelo `google-gemini-cli/*` son alias de compatibilidad heredados. Las
    configuraciones nuevas deben usar referencias de modelo `google/*` más el entorno de ejecución `google-gemini-cli`
    cuando quieran ejecución local de Gemini CLI.

  </Tab>
</Tabs>

## Capacidades

| Capacidad              | Admitido                      |
| ---------------------- | ----------------------------- |
| Finalizaciones de chat | Sí                            |
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

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y de los alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas/de baja latencia no envíen valores
`thinkingBudget` deshabilitados.

`/think adaptive` mantiene la semántica de pensamiento dinámico de Google en lugar de elegir
un nivel fijo de OpenClaw. Gemini 3 y Gemini 3.1 omiten un `thinkingLevel` fijo para que
Google pueda elegir el nivel; Gemini 2.5 envía el centinela dinámico de Google
`thinkingBudget: -1`.

Los modelos Gemma 4 (por ejemplo `gemma-4-26b-a4b-it`) admiten el modo de pensamiento. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google admitido para Gemma 4.
Establecer el pensamiento en `off` conserva el pensamiento deshabilitado en lugar de asignarlo a
`MINIMAL`.
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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

## Generación de video

El plugin `google` incluido también registra la generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de un solo video
- Admite `aspectRatio`, `resolution` y `audio`
- Límite de duración actual: **4 a 8 segundos**

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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

## Generación de música

El plugin `google` incluido también registra la generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` de forma predeterminada, además de `wav` en `google/lyria-3-pro-preview`
- Entradas de referencia: hasta 10 imágenes
- Las ejecuciones con respaldo de sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

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
Consulta [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

## Texto a voz

El proveedor de voz `google` incluido usa la ruta TTS de Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, Opus para destinos de notas de voz, PCM para Talk/telefonía
- Salida de nota de voz: el PCM de Google se empaqueta como WAV y se transcodifica a Opus de 48 kHz con `ffmpeg`

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

TTS de Gemini API usa instrucciones en lenguaje natural para controlar el estilo. Configura
`audioProfile` para anteponer una instrucción de estilo reutilizable antes del texto hablado. Configura
`speakerName` cuando el texto de tu prompt haga referencia a un hablante con nombre.

TTS de Gemini API también acepta etiquetas de audio expresivas entre corchetes en el texto,
como `[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat
mientras se envían a TTS, colócalas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una clave de API de Google Cloud Console restringida a Gemini API es válida para este
proveedor. Esta no es la ruta separada de Cloud Text-to-Speech API.
</Note>

## Voz en tiempo real

El plugin `google` incluido registra un proveedor de voz en tiempo real respaldado por
Gemini Live API para puentes de audio de backend como Voice Call y Google Meet.

| Ajuste                | Ruta de configuración                                                | Predeterminado                                                                        |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modelo                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voz                   | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura           | `...google.temperature`                                             | (sin definir)                                                                         |
| Sensibilidad de inicio de VAD | `...google.startSensitivity`                               | (sin definir)                                                                         |
| Sensibilidad de fin de VAD | `...google.endSensitivity`                                      | (sin definir)                                                                         |
| Duración del silencio | `...google.silenceDurationMs`                                       | (sin definir)                                                                         |
| Gestión de actividad  | `...google.activityHandling`                                        | Predeterminado de Google, `start-of-activity-interrupts`                              |
| Cobertura del turno   | `...google.turnCoverage`                                            | Predeterminado de Google, `only-activity`                                             |
| Desactivar VAD automático | `...google.automaticActivityDetectionDisabled`                  | `false`                                                                               |
| Clave de API          | `...google.apiKey`                                                  | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`       |

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
Google Live API usa audio bidireccional y llamadas a funciones a través de un WebSocket.
OpenClaw adapta el audio del puente de telefonía/Meet al flujo PCM Live API de Gemini y
mantiene las llamadas a herramientas en el contrato de voz en tiempo real compartido. Deja `temperature`
sin definir salvo que necesites cambios de muestreo; OpenClaw omite los valores no positivos
porque Google Live puede devolver transcripciones sin audio para `temperature: 0`.
La transcripción de Gemini API está habilitada sin `languageCodes`; el SDK actual de Google
rechaza las sugerencias de códigos de idioma en esta ruta de API.
</Note>

<Note>
Control UI Talk admite sesiones de navegador de Google Live con tokens restringidos de un solo uso.
Los proveedores de voz en tiempo real solo de backend también pueden ejecutarse mediante el transporte
de retransmisión genérico del Gateway, que mantiene las credenciales del proveedor en el Gateway.
</Note>

Para la verificación en vivo de mantenedores, ejecuta
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
El tramo de Google emite la misma forma de token restringido de Live API que usa Control
UI Talk, abre el endpoint WebSocket del navegador, envía la carga útil de configuración inicial
y espera `setupComplete`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de la caché de Gemini">
    Para ejecuciones directas de Gemini API (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
      `cachedContent` o el heredado `cached_content`
    - Si ambos están presentes, `cachedContent` tiene prioridad
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en `cacheRead` de OpenClaw a partir de
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

  <Accordion title="Notas de uso de JSON de Gemini CLI">
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw normaliza
    la salida JSON de la CLI de la siguiente manera:

    - El texto de respuesta proviene del campo `response` del JSON de la CLI.
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza en `cacheRead` de OpenClaw.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración del entorno y del daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de herramientas de imagen y selección de proveedores.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedores.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de herramientas de música y selección de proveedores.
  </Card>
</CardGroup>
