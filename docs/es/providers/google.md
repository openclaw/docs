---
read_when:
    - Quieres usar modelos Google Gemini con OpenClaw
    - Necesitas el flujo de autenticación con clave API u OAuth
summary: Configuración de Google Gemini (clave API + OAuth, generación de imágenes, comprensión multimedia, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T05:44:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

El Plugin de Google proporciona acceso a modelos Gemini a través de Google AI Studio, además de
generación de imágenes, comprensión multimedia (imagen/audio/video), texto a voz y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Proveedor alternativo: `google-gemini-cli` (OAuth)

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave API">
    **Ideal para:** acceso estándar a la API Gemini mediante Google AI Studio.

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
      <Step title="Verificar que el modelo está disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Las variables de entorno `GEMINI_API_KEY` y `GOOGLE_API_KEY` se aceptan ambas. Usa la que ya tengas configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante OAuth PKCE en lugar de una clave API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan de restricciones de cuenta al usar OAuth de esta manera. Úsalo bajo tu propia responsabilidad.
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
        diseños comunes de Windows/npm.
      </Step>
      <Step title="Iniciar sesión mediante OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verificar que el modelo está disponible">
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
    Si las solicitudes OAuth de Gemini CLI fallan después del inicio de sesión, establece `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que se inicie el flujo del navegador, asegúrate de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    El proveedor `google-gemini-cli` solo OAuth es una superficie independiente
    de inferencia de texto. La generación de imágenes, comprensión multimedia y Gemini Grounding permanecen en
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
| Comprensión de imágenes | Sí                           |
| Transcripción de audio | Sí                            |
| Comprensión de video   | Sí                            |
| Búsqueda web (Grounding) | Sí                          |
| Pensamiento/razonamiento | Sí (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4        | Sí                            |

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y el alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas/de baja latencia no envíen valores deshabilitados
de `thinkingBudget`.

Los modelos Gemma 4 (por ejemplo `gemma-4-26b-a4b-it`) admiten modo de pensamiento. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Establecer thinking en `off` conserva thinking deshabilitado en lugar de asignarlo a
`MINIMAL`.
</Tip>

## Generación de imágenes

El proveedor integrado de generación de imágenes `google` usa por defecto
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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

## Generación de video

El Plugin integrado `google` también registra generación de video mediante la
herramienta compartida `video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de un solo video
- Admite `aspectRatio`, `resolution` y `audio`
- Límite actual de duración: **4 a 8 segundos**

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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

## Generación de música

El Plugin integrado `google` también registra generación de música mediante la
herramienta compartida `music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
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
Consulta [Generación de música](/es/tools/music-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

## Texto a voz

El proveedor de voz integrado `google` usa la ruta TTS de la API Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, PCM para Talk/telefonía
- Salida nativa como nota de voz: no compatible en esta ruta de la API Gemini porque la API devuelve PCM en lugar de Opus

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

El TTS de la API Gemini acepta etiquetas de audio expresivas entre corchetes en el texto, como
`[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat mientras se
envían a TTS, colócalas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Aquí está el texto limpio de la respuesta.

[[tts:text]][whispers] Aquí está la versión hablada.[[/tts:text]]
```

<Note>
Una clave API de Google Cloud Console restringida a la API Gemini es válida para este
proveedor. No es la ruta independiente de la API Cloud Text-to-Speech.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas de la API Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador configurado `cachedContent` a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
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

  <Accordion title="Notas de uso JSON de Gemini CLI">
    Cuando se usa el proveedor OAuth `google-gemini-cli`, OpenClaw normaliza
    la salida JSON de la CLI de la siguiente manera:

    - El texto de respuesta proviene del campo JSON `response` de la CLI.
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza en OpenClaw como `cacheRead`.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración de entorno y daemon">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
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
