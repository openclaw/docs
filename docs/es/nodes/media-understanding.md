---
read_when:
    - Diseñando o refactorizando la comprensión multimedia
    - Ajustando el preprocesamiento de audio/video/imagen entrante
sidebarTitle: Media understanding
summary: Comprensión de imágenes/audio/video entrantes (opcional) con proveedor + fallbacks de CLI
title: Comprensión multimedia
x-i18n:
    generated_at: "2026-04-26T11:33:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw puede **resumir medios entrantes** (imagen/audio/video) antes de que se ejecute el flujo de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y puede desactivarse o personalizarse. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URL originales como siempre.

El comportamiento específico por proveedor para medios lo registran los Plugins del proveedor, mientras que el core de OpenClaw es propietario de la configuración compartida `tools.media`, del orden de fallback y de la integración con el flujo de respuesta.

## Objetivos

- Opcional: resumir medios entrantes en texto corto para un enrutamiento más rápido y un mejor análisis de comandos.
- Preservar siempre la entrega del medio original al modelo.
- Admitir **API de proveedor** y **fallbacks de CLI**.
- Permitir varios modelos con fallback ordenado (error/tamaño/timeout).

## Comportamiento de alto nivel

<Steps>
  <Step title="Recopilar archivos adjuntos">
    Recopilar archivos adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Seleccionar por capacidad">
    Para cada capacidad habilitada (imagen/audio/video), seleccionar archivos adjuntos según la política (predeterminado: **first**).
  </Step>
  <Step title="Elegir modelo">
    Elegir la primera entrada de modelo elegible (tamaño + capacidad + autenticación).
  </Step>
  <Step title="Fallback ante fallo">
    Si un modelo falla o el medio es demasiado grande, **se recurre a la siguiente entrada**.
  </Step>
  <Step title="Aplicar bloque de éxito">
    En caso de éxito:

    - `Body` pasa a ser un bloque `[Image]`, `[Audio]` o `[Video]`.
    - Audio establece `{{Transcript}}`; el análisis de comandos usa el texto de la leyenda cuando está presente, o en caso contrario la transcripción.
    - Las leyendas se conservan como `User text:` dentro del bloque.

  </Step>
</Steps>

Si la comprensión falla o está desactivada, **el flujo de respuesta continúa** con el body original + archivos adjuntos.

## Resumen de configuración

`tools.media` admite **modelos compartidos** más sobrescrituras por capacidad:

<AccordionGroup>
  <Accordion title="Claves de nivel superior">
    - `tools.media.models`: lista compartida de modelos (usa `capabilities` para delimitar).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sobrescrituras de proveedor (`baseUrl`, `headers`, `providerOptions`)
      - opciones de audio Deepgram mediante `tools.media.audio.providerOptions.deepgram`
      - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
      - lista opcional de `models` **por capacidad** (preferida antes que los modelos compartidos)
      - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (delimitación opcional por canal/chatType/clave de sesión)
    - `tools.media.concurrency`: máximo de ejecuciones concurrentes por capacidad (predeterminado **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartida */
      ],
      image: {
        /* sobrescrituras opcionales */
      },
      audio: {
        /* sobrescrituras opcionales */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* sobrescrituras opcionales */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada `models[]` puede ser de **proveedor** o de **CLI**:

<Tabs>
  <Tab title="Entrada de proveedor">
    ```json5
    {
      type: "provider", // predeterminado si se omite
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // opcional, usado para entradas multimodales
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Entrada de CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Las plantillas de CLI también pueden usar:

    - `{{MediaDir}}` (directorio que contiene el archivo multimedia)
    - `{{OutputDir}}` (directorio temporal creado para esta ejecución)
    - `{{OutputBase}}` (ruta base del archivo temporal, sin extensión)

  </Tab>
</Tabs>

## Valores predeterminados y límites

Valores predeterminados recomendados:

- `maxChars`: **500** para imagen/video (corto, apto para comandos)
- `maxChars`: **sin establecer** para audio (transcripción completa salvo que fijes un límite)
- `maxBytes`:
  - imagen: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Reglas">
    - Si el medio supera `maxBytes`, ese modelo se omite y **se prueba el siguiente**.
    - Los archivos de audio menores de **1024 bytes** se tratan como vacíos/corruptos y se omiten antes de la transcripción por proveedor/CLI; el contexto de respuesta entrante recibe una transcripción placeholder determinista para que el agente sepa que la nota era demasiado pequeña.
    - Si el modelo devuelve más de `maxChars`, la salida se recorta.
    - `prompt` usa por defecto un simple "Describe the {media}." más la indicación de `maxChars` (solo imagen/video).
    - Si el modelo principal activo de imagen ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
    - Si un modelo principal de Gateway/WebChat es solo texto, los archivos adjuntos de imagen se conservan como referencias externalizadas `media://inbound/*` para que las herramientas de imagen/PDF o el modelo de imagen configurado puedan seguir inspeccionándolos en lugar de perder el archivo adjunto.
    - Las solicitudes explícitas `openclaw infer image describe --model <provider/model>` son diferentes: ejecutan directamente ese proveedor/modelo con capacidad de imagen, incluidas referencias de Ollama como `ollama/qwen2.5vl:7b`.
    - Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el **modelo activo de respuesta** cuando su proveedor admite esa capacidad.

  </Accordion>
</AccordionGroup>

### Detección automática de comprensión multimedia (predeterminada)

Si `tools.media.<capability>.enabled` **no** está establecido en `false` y no has configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera opción que funcione**:

<Steps>
  <Step title="Modelo activo de respuesta">
    Modelo activo de respuesta cuando su proveedor admite la capacidad.
  </Step>
  <Step title="agents.defaults.imageModel">
    Referencias primary/fallbacks de `agents.defaults.imageModel` (solo imagen).
  </Step>
  <Step title="CLI locales (solo audio)">
    CLI locales (si están instaladas):

    - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
    - `whisper` (CLI de Python; descarga modelos automáticamente)

  </Step>
  <Step title="CLI de Gemini">
    `gemini` usando `read_many_files`.
  </Step>
  <Step title="Autenticación de proveedor">
    - Las entradas configuradas `models.providers.*` que admiten la capacidad se prueban antes del orden de fallback incluido.
    - Los proveedores configurados solo de imagen con un modelo con capacidad de imagen se registran automáticamente para comprensión multimedia incluso cuando no son un Plugin de proveedor incluido.
    - La comprensión de imágenes con Ollama está disponible cuando se selecciona explícitamente, por ejemplo mediante `agents.defaults.imageModel` o `openclaw infer image describe --model ollama/<vision-model>`.

    Orden de fallback incluido:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Imagen: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

Para desactivar la detección automática, establece:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
La detección de binarios es de mejor esfuerzo en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`) o establece un modelo CLI explícito con una ruta completa al comando.
</Note>

### Compatibilidad con entorno proxy (modelos de proveedor)

Cuando la comprensión multimedia de **audio** y **video** basada en proveedor está habilitada, OpenClaw respeta las variables de entorno estándar de proxy saliente para llamadas HTTP al proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si no hay variables de entorno de proxy configuradas, la comprensión multimedia usa salida directa. Si el valor del proxy está mal formado, OpenClaw registra una advertencia y recurre a la obtención directa.

## Capacidades (opcional)

Si estableces `capabilities`, la entrada solo se ejecuta para esos tipos de medios. En listas compartidas, OpenClaw puede inferir valores predeterminados:

- `openai`, `anthropic`, `minimax`: **imagen**
- `minimax-portal`: **imagen**
- `moonshot`: **imagen + video**
- `openrouter`: **imagen**
- `google` (Gemini API): **imagen + audio + video**
- `qwen`: **imagen + video**
- `mistral`: **audio**
- `zai`: **imagen**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Cualquier catálogo `models.providers.<id>.models[]` con un modelo con capacidad de imagen: **imagen**

Para entradas de CLI, **establece `capabilities` explícitamente** para evitar coincidencias inesperadas. Si omites `capabilities`, la entrada es elegible para la lista en la que aparece.

## Matriz de compatibilidad de proveedores (integraciones de OpenClaw)

| Capability | Integración del proveedor                                                                                                     | Notas                                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen     | OpenAI, OpenAI Codex OAuth, app-server de Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores configurados | Los Plugins del proveedor registran compatibilidad con imagen; `openai-codex/*` usa la infraestructura del proveedor OAuth; `codex/*` usa un turno acotado de app-server de Codex; MiniMax y MiniMax OAuth usan ambos `MiniMax-VL-01`; los proveedores configurados con capacidad de imagen se registran automáticamente. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                          | Transcripción por proveedor (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                            |
| Video      | Google, Qwen, Moonshot                                                                                                        | Comprensión de video por proveedor mediante Plugins del proveedor; la comprensión de video de Qwen usa los endpoints Standard DashScope.                                                                                              |

<Note>
**Nota sobre MiniMax**

- La comprensión de imágenes de `minimax` y `minimax-portal` proviene del proveedor multimedia `MiniMax-VL-01` propiedad del Plugin.
- El catálogo de texto incluido de MiniMax sigue empezando como solo texto; las entradas explícitas `models.providers.minimax` materializan referencias de chat M2.7 con capacidad de imagen.

</Note>

## Guía de selección de modelo

- Prefiere el modelo más potente y de última generación disponible para cada capacidad multimedia cuando importen la calidad y la seguridad.
- Para agentes con herramientas habilitadas que manejan entradas no confiables, evita modelos multimedia más antiguos o débiles.
- Mantén al menos un fallback por capacidad para disponibilidad (modelo de calidad + modelo más rápido/barato).
- Los fallbacks de CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API del proveedor no están disponibles.
- Nota sobre `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no se especifica); los formatos no `txt` recurren a stdout.

## Política de archivos adjuntos

Los `attachments` por capacidad controlan qué archivos adjuntos se procesan:

<ParamField path="mode" type='"first" | "all"' default="first">
  Si se procesa el primer archivo adjunto seleccionado o todos ellos.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita el número procesado.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencia de selección entre archivos adjuntos candidatos.
</ParamField>

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

<AccordionGroup>
  <Accordion title="Comportamiento de extracción de archivos adjuntos">
    - El texto extraído del archivo se encapsula como **contenido externo no confiable** antes de añadirse al prompt de medios.
    - El bloque inyectado usa marcadores de límite explícitos como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos `Source: External`.
    - Esta ruta de extracción de archivos adjuntos omite intencionadamente el largo banner `SECURITY NOTICE:` para evitar inflar el prompt de medios; los marcadores de límite y los metadatos siguen presentes.
    - Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
    - Si un PDF recurre a imágenes renderizadas de páginas en esta ruta, el prompt de medios mantiene el placeholder `[PDF content rendered to images; images not forwarded to model]` porque este paso de extracción de archivos adjuntos reenvía bloques de texto, no las imágenes renderizadas del PDF.

  </Accordion>
</AccordionGroup>

## Ejemplos de configuración

<Tabs>
  <Tab title="Modelos compartidos + sobrescrituras">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Solo audio + video">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Solo imagen">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Entrada única multimodal">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Salida de estado

Cuando se ejecuta la comprensión multimedia, `/status` incluye una línea de resumen corta:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Esto muestra resultados por capacidad y el proveedor/modelo elegido cuando corresponde.

## Notas

- La comprensión es de **mejor esfuerzo**. Los errores no bloquean las respuestas.
- Los archivos adjuntos siguen pasándose a los modelos incluso cuando la comprensión está desactivada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo mensajes directos).

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y medios](/es/nodes/images)
