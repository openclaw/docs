---
read_when:
    - Diseñar o refactorizar la comprensión de medios
    - Ajuste del preprocesamiento de audio/video/imagen entrante
sidebarTitle: Media understanding
summary: Comprensión de imágenes/audio/video entrantes (opcional) con alternativas de proveedor + CLI
title: Comprensión de medios
x-i18n:
    generated_at: "2026-04-30T05:49:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw puede **resumir medios entrantes** (imagen/audio/video) antes de que se ejecute la canalización de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y se puede desactivar o personalizar. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URLs originales como siempre.

El comportamiento de medios específico de cada proveedor lo registran los plugins de proveedor, mientras que el núcleo de OpenClaw posee la configuración compartida `tools.media`, el orden de reserva y la integración con la canalización de respuesta.

## Objetivos

- Opcional: predigerir medios entrantes en texto breve para un enrutamiento más rápido y un mejor análisis de comandos.
- Preservar la entrega de medios originales al modelo (siempre).
- Admitir **API de proveedor** y **reservas de CLI**.
- Permitir varios modelos con reserva ordenada (error/tamaño/tiempo de espera).

## Comportamiento general

<Steps>
  <Step title="Recopilar adjuntos">
    Recopilar adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Seleccionar por capacidad">
    Para cada capacidad habilitada (imagen/audio/video), seleccionar adjuntos según la política (predeterminado: **primero**).
  </Step>
  <Step title="Elegir modelo">
    Elegir la primera entrada de modelo elegible (tamaño + capacidad + autenticación).
  </Step>
  <Step title="Reserva ante fallo">
    Si un modelo falla o el medio es demasiado grande, **pasar a la siguiente entrada como reserva**.
  </Step>
  <Step title="Aplicar bloque de éxito">
    En caso de éxito:

    - `Body` se convierte en bloque `[Image]`, `[Audio]` o `[Video]`.
    - El audio establece `{{Transcript}}`; el análisis de comandos usa el texto del pie de foto cuando está presente; de lo contrario, la transcripción.
    - Los pies de foto se preservan como `User text:` dentro del bloque.

  </Step>
</Steps>

Si la comprensión falla o está desactivada, **el flujo de respuesta continúa** con el cuerpo original + adjuntos.

## Resumen de configuración

`tools.media` admite **modelos compartidos** más sobrescrituras por capacidad:

<AccordionGroup>
  <Accordion title="Claves de nivel superior">
    - `tools.media.models`: lista de modelos compartida (usa `capabilities` para restringir).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sobrescrituras de proveedor (`baseUrl`, `headers`, `providerOptions`)
      - opciones de audio de Deepgram mediante `tools.media.audio.providerOptions.deepgram`
      - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
      - lista **`models` por capacidad** opcional (preferida antes que los modelos compartidos)
      - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (restricción opcional por canal/chatType/clave de sesión)
    - `tools.media.concurrency`: máximo de ejecuciones de capacidad simultáneas (predeterminado **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada `models[]` puede ser **proveedor** o **CLI**:

<Tabs>
  <Tab title="Entrada de proveedor">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
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

- `maxChars`: **500** para imagen/video (breve, apto para comandos)
- `maxChars`: **sin establecer** para audio (transcripción completa salvo que establezcas un límite)
- `maxBytes`:
  - imagen: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Reglas">
    - Si el medio supera `maxBytes`, ese modelo se omite y se prueba el **siguiente modelo**.
    - Los archivos de audio menores de **1024 bytes** se tratan como vacíos/corruptos y se omiten antes de la transcripción por proveedor/CLI; el contexto de respuesta entrante recibe una transcripción de marcador determinista para que el agente sepa que la nota era demasiado pequeña.
    - Si el modelo devuelve más de `maxChars`, la salida se recorta.
    - `prompt` usa de forma predeterminada un simple "Describe the {media}." más la guía de `maxChars` (solo imagen/video).
    - Si el modelo de imagen primario activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
    - Si un modelo primario de Gateway/WebChat es solo texto, los adjuntos de imagen se preservan como referencias descargadas `media://inbound/*` para que las herramientas de imagen/PDF o el modelo de imagen configurado aún puedan inspeccionarlos en lugar de perder el adjunto.
    - Las solicitudes explícitas `openclaw infer image describe --model <provider/model>` son diferentes: ejecutan directamente ese proveedor/modelo con capacidad de imagen, incluidas referencias de Ollama como `ollama/qwen2.5vl:7b`.
    - Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el **modelo de respuesta activo** cuando su proveedor admite la capacidad.

  </Accordion>
</AccordionGroup>

### Detección automática de comprensión de medios (predeterminado)

Si `tools.media.<capability>.enabled` **no** está establecido en `false` y no has configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera opción funcional**:

<Steps>
  <Step title="Modelo de respuesta activo">
    Modelo de respuesta activo cuando su proveedor admite la capacidad.
  </Step>
  <Step title="agents.defaults.imageModel">
    Referencias primarias/de reserva de `agents.defaults.imageModel` (solo imagen).
    Prefiere referencias `provider/model`. Las referencias simples se califican a partir de entradas de modelo de proveedor configuradas con capacidad de imagen solo cuando la coincidencia es única.
  </Step>
  <Step title="CLI locales (solo audio)">
    CLI locales (si están instaladas):

    - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
    - `whisper` (CLI de Python; descarga modelos automáticamente)

  </Step>
  <Step title="CLI de Gemini">
    `gemini` con `read_many_files`.
  </Step>
  <Step title="Autenticación de proveedor">
    - Las entradas `models.providers.*` configuradas que admiten la capacidad se prueban antes del orden de reserva incluido.
    - Los proveedores de configuración solo de imagen con un modelo con capacidad de imagen se registran automáticamente para comprensión de medios incluso cuando no son un plugin de proveedor incluido.
    - La comprensión de imágenes de Ollama está disponible cuando se selecciona explícitamente, por ejemplo mediante `agents.defaults.imageModel` u `openclaw infer image describe --model ollama/<vision-model>`.

    Orden de reserva incluido:

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
La detección de binarios es de mejor esfuerzo en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`) o establece un modelo de CLI explícito con una ruta de comando completa.
</Note>

### Compatibilidad con entorno proxy (modelos de proveedor)

Cuando la comprensión de medios por proveedor de **audio** y **video** está habilitada, OpenClaw respeta las variables de entorno proxy de salida estándar para llamadas HTTP de proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si no se establecen variables de entorno proxy, la comprensión de medios usa salida directa. Si el valor del proxy está mal formado, OpenClaw registra una advertencia y recurre a la obtención directa.

## Capacidades (opcional)

Si estableces `capabilities`, la entrada solo se ejecuta para esos tipos de medios. Para listas compartidas, OpenClaw puede inferir valores predeterminados:

- `openai`, `anthropic`, `minimax`: **imagen**
- `minimax-portal`: **imagen**
- `moonshot`: **imagen + video**
- `openrouter`: **imagen**
- `google` (API de Gemini): **imagen + audio + video**
- `qwen`: **imagen + video**
- `mistral`: **audio**
- `zai`: **imagen**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Cualquier catálogo `models.providers.<id>.models[]` con un modelo con capacidad de imagen: **imagen**

Para entradas de CLI, **establece `capabilities` explícitamente** para evitar coincidencias inesperadas. Si omites `capabilities`, la entrada es elegible para la lista en la que aparece.

## Matriz de soporte de proveedores (integraciones de OpenClaw)

| Capacidad | Integración de proveedor                                                                                                      | Notas                                                                                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen      | OpenAI, OpenAI Codex OAuth, servidor de aplicación Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores de configuración | Los plugins de proveedor registran soporte de imagen; `openai-codex/*` usa la infraestructura del proveedor OAuth; `codex/*` usa un turno delimitado del servidor de aplicación Codex; MiniMax y MiniMax OAuth usan `MiniMax-VL-01`; los proveedores de configuración con capacidad de imagen se registran automáticamente. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transcripción de proveedor (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                                                       | Comprensión de video por proveedor mediante plugins de proveedor; la comprensión de video de Qwen usa los endpoints Standard DashScope.                                                                                                                        |

<Note>
**Nota de MiniMax**

- La comprensión de imágenes de `minimax` y `minimax-portal` proviene del proveedor de medios `MiniMax-VL-01` propiedad del plugin.
- El catálogo de texto de MiniMax incluido sigue empezando como solo texto; las entradas explícitas `models.providers.minimax` materializan referencias de chat M2.7 con capacidad de imagen.

</Note>

## Guía de selección de modelos

- Prefiere el modelo de generación más reciente y potente disponible para cada capacidad de medios cuando importen la calidad y la seguridad.
- Para agentes con herramientas habilitadas que manejan entradas no confiables, evita modelos de medios más antiguos o más débiles.
- Mantén al menos una reserva por capacidad para disponibilidad (modelo de calidad + modelo más rápido/barato).
- Las reservas de CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API de proveedor no están disponibles.
- Nota sobre `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no se especifica); los formatos que no son `txt` recurren a stdout.

## Política de adjuntos

`attachments` por capacidad controla qué adjuntos se procesan:

<ParamField path="mode" type='"first" | "all"' default="first">
  Si se debe procesar el primer adjunto seleccionado o todos ellos.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita la cantidad procesada.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencia de selección entre los adjuntos candidatos.
</ParamField>

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - El texto extraído del archivo se encapsula como **contenido externo no confiable** antes de añadirse al prompt de medios.
    - El bloque inyectado usa marcadores de límite explícitos como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos `Source: External`.
    - Esta ruta de extracción de adjuntos omite intencionalmente el banner largo `SECURITY NOTICE:` para evitar aumentar demasiado el prompt de medios; los marcadores de límite y los metadatos siguen presentes.
    - Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
    - Si un PDF recurre a imágenes de página renderizadas en esta ruta, el prompt de medios conserva el marcador de posición `[PDF content rendered to images; images not forwarded to model]` porque este paso de extracción de adjuntos reenvía bloques de texto, no las imágenes renderizadas del PDF.

  </Accordion>
</AccordionGroup>

## Ejemplos de configuración

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

Cuando se ejecuta la comprensión de medios, `/status` incluye una breve línea de resumen:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Esto muestra los resultados por capacidad y el proveedor/modelo elegido cuando corresponde.

## Notas

- La comprensión es de **mejor esfuerzo**. Los errores no bloquean las respuestas.
- Los adjuntos se siguen pasando a los modelos incluso cuando la comprensión está desactivada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo mensajes directos).

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y medios](/es/nodes/images)
