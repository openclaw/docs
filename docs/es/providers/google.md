---
read_when:
    - Quieres usar modelos Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión multimedia, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

El Plugin de Google proporciona acceso a los modelos Gemini a través de Google AI Studio, además de
generación de imágenes, comprensión multimedia (imagen/audio/video), conversión de texto a voz y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Proveedor alternativo: `google-gemini-cli` (OAuth)

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API de Gemini a través de Google AI Studio.

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
    Las variables de entorno `GEMINI_API_KEY` y `GOOGLE_API_KEY` son ambas aceptadas. Usa la que ya tengas configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante PKCE OAuth en lugar de una clave de API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan restricciones de cuenta al usar OAuth de esta manera. Úsalo bajo tu propio riesgo.
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

        OpenClaw es compatible tanto con instalaciones de Homebrew como con instalaciones globales de npm, incluidas
        disposiciones comunes de Windows/npm.
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

    (O las variantes `GEMINI_CLI_*`).

    <Note>
    Si las solicitudes de OAuth de Gemini CLI fallan después de iniciar sesión, establece `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo en el navegador, asegúrate de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    El proveedor `google-gemini-cli`, solo con OAuth, es una superficie independiente
    de inferencia de texto. La generación de imágenes, la comprensión multimedia y Gemini Grounding siguen en
    el id de proveedor `google`.

  </Tab>
</Tabs>

## Capacidades

| Capacidad              | Compatible                    |
| ---------------------- | ----------------------------- |
| Finalizaciones de chat | Sí                            |
| Generación de imágenes | Sí                            |
| Generación de música   | Sí                            |
| Conversión de texto a voz | Sí                         |
| Comprensión de imágenes | Sí                           |
| Transcripción de audio | Sí                            |
| Comprensión de video   | Sí                            |
| Búsqueda web (Grounding) | Sí                          |
| Pensamiento/razonamiento | Sí (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4        | Sí                            |

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y el alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas/de baja latencia no envíen valores de
`thinkingBudget` deshabilitados.

Los modelos Gemma 4 (por ejemplo, `gemma-4-26b-a4b-it`) admiten el modo de pensamiento. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Configurar el pensamiento como `off` conserva el pensamiento deshabilitado en lugar de asignarlo a
`MINIMAL`.
</Tip>

## Generación de imágenes

El proveedor empaquetado de generación de imágenes `google` usa de forma predeterminada
`google/gemini-3.1-flash-image-preview`.

- También es compatible con `google/gemini-3-pro-image-preview`
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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Generación de video

El Plugin empaquetado `google` también registra la generación de video a través de la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de un solo video
- Compatible con `aspectRatio`, `resolution` y `audio`
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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Generación de música

El Plugin empaquetado `google` también registra la generación de música a través de la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También es compatible con `google/lyria-3-pro-preview`
- Controles del prompt: `lyrics` e `instrumental`
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
Consulta [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Conversión de texto a voz

El proveedor de voz empaquetado `google` usa la ruta TTS de la API de Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, PCM para Talk/telefonía
- Salida nativa de nota de voz: no compatible en esta ruta de la API de Gemini porque la API devuelve PCM en lugar de Opus

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

La API TTS de Gemini acepta etiquetas expresivas de audio entre corchetes en el texto, como
`[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat mientras
se envían a TTS, colócalas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Aquí está el texto limpio de la respuesta.

[[tts:text]][whispers] Aquí está la versión hablada.[[/tts:text]]
```

<Note>
Una clave de API de Google Cloud Console restringida a la API de Gemini es válida para este
proveedor. Esta no es la ruta independiente de la API de Cloud Text-to-Speech.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas con la API de Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
      `cachedContent` o el valor heredado `cached_content`
    - Si ambos están presentes, `cachedContent` tiene prioridad
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en OpenClaw como `cacheRead` desde
      el valor ascendente `cachedContentTokenCount`

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

  <Accordion title="Notas sobre el uso de JSON en Gemini CLI">
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw normaliza
    la salida JSON de la CLI de la siguiente manera:

    - El texto de respuesta proviene del campo JSON `response` de la CLI.
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza en OpenClaw como `cacheRead`.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
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
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
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
