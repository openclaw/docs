---
read_when:
    - Quieres usar modelos de Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión multimedia, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-12T23:31:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64b848add89061b208a5d6b19d206c433cace5216a0ca4b63d56496aecbde452
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

El Plugin de Google proporciona acceso a modelos Gemini a través de Google AI Studio, además de
generación de imágenes, comprensión multimedia (imagen/audio/video) y búsqueda web mediante
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Proveedor alternativo: `google-gemini-cli` (OAuth)

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="API key">
    **Ideal para:** acceso estándar a la API de Gemini mediante Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
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
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante OAuth PKCE en lugar de una clave de API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan de restricciones de cuenta al usar OAuth de esta forma. Úsalo bajo tu propio riesgo.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        El comando local `gemini` debe estar disponible en `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # o npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw admite tanto instalaciones con Homebrew como instalaciones globales con npm, incluidos
        layouts comunes de Windows/npm.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
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
    Si las solicitudes OAuth de Gemini CLI fallan después del inicio de sesión, establece `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que empiece el flujo del navegador, asegúrate de que el comando local `gemini`
    esté instalado y disponible en `PATH`.
    </Note>

    El proveedor `google-gemini-cli`, solo OAuth, es una superficie separada
    de inferencia de texto. La generación de imágenes, la comprensión multimedia y Gemini Grounding siguen en
    el id de proveedor `google`.

  </Tab>
</Tabs>

## Capacidades

| Capability             | Supported         |
| ---------------------- | ----------------- |
| Chat completions       | Sí                |
| Image generation       | Sí                |
| Music generation       | Sí                |
| Image understanding    | Sí                |
| Audio transcription    | Sí                |
| Video understanding    | Sí                |
| Web search (Grounding) | Sí                |
| Thinking/reasoning     | Sí (Gemini 3.1+)  |
| Gemma 4 models         | Sí                |

<Tip>
Los modelos Gemma 4 (por ejemplo, `gemma-4-26b-a4b-it`) admiten modo thinking. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Configurar thinking en `off` conserva thinking deshabilitado en lugar de asignarlo a
`MINIMAL`.
</Tip>

## Generación de imágenes

El proveedor de generación de imágenes `google` integrado usa por defecto
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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

## Generación de video

El Plugin `google` integrado también registra la generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de video único
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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

## Generación de música

El Plugin `google` integrado también registra la generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles del prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` por defecto, además de `wav` en `google/lyria-3-pro-preview`
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
Consulta [Generación de música](/es/tools/music-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas de la API de Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
      `cachedContent` o el heredado `cached_content`
    - Si ambos están presentes, `cachedContent` tiene prioridad
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso con acierto de caché de Gemini se normaliza en OpenClaw como `cacheRead` a partir de
      `cachedContentTokenCount` del upstream

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
    - El uso recurre a `stats` cuando la CLI deja `usage` vacío.
    - `stats.cached` se normaliza como `cacheRead` en OpenClaw.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración del entorno y del daemon">
    Si el Gateway se ejecuta como daemon (`launchd/systemd`), asegúrate de que `GEMINI_API_KEY`
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
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
</CardGroup>
