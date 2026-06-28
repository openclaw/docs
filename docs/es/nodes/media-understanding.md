---
read_when:
    - Diseñar o refactorizar la comprensión de medios
    - Ajuste del preprocesamiento de audio, video e imágenes entrantes
sidebarTitle: Media understanding
summary: Comprensión entrante de imágenes/audio/video (opcional) con alternativas del proveedor y la CLI
title: Comprensión de medios
x-i18n:
    generated_at: "2026-06-28T05:18:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw puede **resumir medios entrantes** (imagen/audio/video) antes de que se ejecute la canalización de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y puede desactivarse o personalizarse. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URLs originales como de costumbre.

El comportamiento de medios específico del proveedor lo registran los plugins de proveedor, mientras que el núcleo de OpenClaw posee la configuración compartida `tools.media`, el orden de fallback y la integración con la canalización de respuesta.

## Objetivos

- Opcional: predigerir medios entrantes en texto breve para un enrutamiento más rápido y un mejor análisis de comandos.
- Preservar la entrega de medios originales al modelo (siempre).
- Admitir **APIs de proveedores** y **fallbacks de CLI**.
- Permitir varios modelos con fallback ordenado (error/tamaño/tiempo de espera).

## Comportamiento de alto nivel

<Steps>
  <Step title="Collect attachments">
    Recopila adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Para cada capacidad habilitada (imagen/audio/video), selecciona adjuntos según la política (predeterminado: **primero**).
  </Step>
  <Step title="Choose model">
    Elige la primera entrada de modelo elegible (tamaño + capacidad + autenticación).
  </Step>
  <Step title="Fallback on failure">
    Si un modelo falla o el medio es demasiado grande, **hace fallback a la siguiente entrada**.
  </Step>
  <Step title="Apply success block">
    En caso de éxito:

    - `Body` se convierte en un bloque `[Image]`, `[Audio]` o `[Video]`.
    - El audio establece `{{Transcript}}`; el análisis de comandos usa el texto del pie de foto cuando está presente; de lo contrario, la transcripción.
    - Los pies de foto se conservan como `User text:` dentro del bloque.

  </Step>
</Steps>

Si la comprensión falla o está desactivada, **el flujo de respuesta continúa** con el cuerpo + adjuntos originales.

## Resumen de configuración

`tools.media` admite **modelos compartidos** más anulaciones por capacidad:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: lista de modelos compartida (usa `capabilities` para restringir).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - anulaciones de proveedor (`baseUrl`, `headers`, `providerOptions`)
      - opciones de audio de Deepgram mediante `tools.media.audio.providerOptions.deepgram`
      - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
      - **lista `models` por capacidad** opcional (preferida antes de los modelos compartidos)
      - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (restricción opcional por canal/chatType/clave de sesión)
    - `tools.media.concurrency`: máximo de ejecuciones de capacidad concurrentes (predeterminado **2**).

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

Cada entrada de `models[]` puede ser de **proveedor** o de **CLI**:

<Tabs>
  <Tab title="Provider entry">
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
  <Tab title="CLI entry">
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

    - `{{MediaDir}}` (directorio que contiene el archivo de medios)
    - `{{OutputDir}}` (directorio temporal creado para esta ejecución)
    - `{{OutputBase}}` (ruta base de archivo temporal, sin extensión)

  </Tab>
</Tabs>

### Credenciales de proveedor (`apiKey`)

La comprensión de medios de proveedor usa la misma resolución de autenticación de proveedor que las llamadas normales a modelos: perfiles de autenticación, variables de entorno y luego `models.providers.<providerId>.apiKey`.

Las entradas de `tools.media.*.models[]` no aceptan un campo `apiKey` en línea. El valor de `provider` en una entrada de modelo de medios, como `openai` o `moonshot`, debe tener credenciales disponibles mediante una de las fuentes de autenticación de proveedor estándar.

Ejemplo mínimo:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Para la referencia completa de autenticación de proveedor, incluidos perfiles, variables de entorno y URLs base personalizadas, consulta [Herramientas y proveedores personalizados](/es/gateway/config-tools).

## Valores predeterminados y límites

Valores predeterminados recomendados:

- `maxChars`: **500** para imagen/video (breve, adecuado para comandos)
- `maxChars`: **sin establecer** para audio (transcripción completa salvo que establezcas un límite)
- `maxBytes`:
  - imagen: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - Si el medio supera `maxBytes`, ese modelo se omite y se **prueba el siguiente modelo**.
    - Los archivos de audio menores que **1024 bytes** se tratan como vacíos/corruptos y se omiten antes de la transcripción por proveedor/CLI; el contexto de respuesta entrante recibe una transcripción de marcador determinista para que el agente sepa que la nota era demasiado pequeña.
    - Si el modelo devuelve más de `maxChars`, la salida se recorta.
    - `prompt` usa de forma predeterminada un "Describe the {media}." simple más la guía de `maxChars` (solo imagen/video).
    - Si el modelo de imagen primario activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
    - Si un modelo primario de Gateway/WebChat es solo de texto, los adjuntos de imagen se conservan como referencias descargadas `media://inbound/*`, de modo que las herramientas de imagen/PDF o el modelo de imagen configurado aún puedan inspeccionarlos en lugar de perder el adjunto.
    - Las solicitudes explícitas `openclaw infer image describe --model <provider/model>` son diferentes: ejecutan directamente ese proveedor/modelo con capacidad de imagen, incluidas referencias de Ollama como `ollama/qwen2.5vl:7b`.
    - Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el **modelo de respuesta activo** cuando su proveedor admite la capacidad.

  </Accordion>
</AccordionGroup>

### Detección automática de comprensión de medios (predeterminada)

Si `tools.media.<capability>.enabled` **no** está establecido en `false` y no has configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera opción funcional**:

<Steps>
  <Step title="Active reply model">
    Modelo de respuesta activo cuando su proveedor admite la capacidad.
  </Step>
  <Step title="agents.defaults.imageModel">
    Referencias primarias/fallback de `agents.defaults.imageModel` (solo imagen).
    Prefiere referencias `provider/model`. Las referencias simples se califican desde entradas de modelos de proveedor configuradas con capacidad de imagen solo cuando la coincidencia es única.
  </Step>
  <Step title="Local CLIs (audio only)">
    CLI locales (si están instaladas):

    - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
    - `whisper` (CLI de Python; descarga modelos automáticamente)

  </Step>
  <Step title="Gemini CLI">
    `gemini` usando `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Las entradas configuradas de `models.providers.*` que admiten la capacidad se prueban antes del orden de fallback incluido.
    - Los proveedores de configuración solo de imagen con un modelo con capacidad de imagen se registran automáticamente para la comprensión de medios incluso cuando no son un plugin de proveedor incluido.
    - La comprensión de imágenes de Ollama está disponible cuando se selecciona explícitamente, por ejemplo mediante `agents.defaults.imageModel` u `openclaw infer image describe --model ollama/<vision-model>`.

    Orden de fallback incluido:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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

### Compatibilidad con entorno de proxy (modelos de proveedor)

Cuando la comprensión de medios de **audio** y **video** basada en proveedor está habilitada, OpenClaw respeta las variables de entorno de proxy saliente estándar para llamadas HTTP de proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si no hay variables de entorno de proxy establecidas, la comprensión de medios usa salida directa. Si el valor del proxy está mal formado, OpenClaw registra una advertencia y hace fallback a una obtención directa.

## Capacidades (opcional)

Si estableces `capabilities`, la entrada solo se ejecuta para esos tipos de medios. Para listas compartidas, OpenClaw puede inferir valores predeterminados:

- `openai`, `anthropic`, `minimax`: **imagen**
- `minimax-portal`: **imagen**
- `moonshot`: **imagen + video**
- `openrouter`: **imagen + audio**
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

| Capacidad | Integración de proveedor                                                                                                     | Notas                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen     | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores de configuración | Los plugins de proveedor registran compatibilidad con imágenes; `openai/*` puede usar clave de API o enrutamiento Codex OAuth; `codex/*` usa un turno acotado de Codex app-server; MiniMax y MiniMax OAuth usan `MiniMax-VL-01`; los proveedores de configuración con capacidad de imagen se registran automáticamente. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transcripción de proveedor (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| Video      | Google, Qwen, Moonshot                                                                                                       | Comprensión de video de proveedor mediante plugins de proveedor; la comprensión de video de Qwen usa los endpoints Standard DashScope.                                                                                                      |

<Note>
**Nota de MiniMax**

- La comprensión de imágenes de `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` proviene del proveedor de medios `MiniMax-VL-01` propiedad del Plugin.
- El enrutamiento automático de imágenes sigue usando `MiniMax-VL-01` incluso si los metadatos heredados de chat de MiniMax M2.x declaran entrada de imagen.

</Note>

## Guía de selección de modelos

- Prefiere el modelo más potente de última generación disponible para cada capacidad multimedia cuando la calidad y la seguridad importen.
- Para agentes con herramientas habilitadas que manejan entradas no confiables, evita modelos multimedia más antiguos o más débiles.
- Mantén al menos una alternativa por capacidad para disponibilidad (modelo de calidad + modelo más rápido o económico).
- Las alternativas de CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API de proveedores no están disponibles.
- Nota sobre `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no se especifica); los formatos que no son `txt` recurren a stdout.

## Política de adjuntos

`attachments` por capacidad controla qué adjuntos se procesan:

<ParamField path="mode" type='"first" | "all"' default="first">
  Si se debe procesar el primer adjunto seleccionado o todos.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita la cantidad procesada.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencia de selección entre adjuntos candidatos.
</ParamField>

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - El texto extraído del archivo se envuelve como **contenido externo no confiable** antes de anexarse al prompt multimedia.
    - El bloque inyectado usa marcadores de límite explícitos como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos `Source: External`.
    - Esta ruta de extracción de adjuntos omite intencionalmente el banner largo `SECURITY NOTICE:` para evitar inflar el prompt multimedia; los marcadores de límite y los metadatos permanecen igualmente.
    - Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
    - Si un PDF recurre a imágenes de páginas renderizadas en esta ruta, OpenClaw reenvía esas imágenes de páginas a modelos de respuesta con capacidad de visión y mantiene el marcador de posición `[PDF content rendered to images]` en el bloque de archivo.

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

Cuando se ejecuta la comprensión multimedia, `/status` incluye una breve línea de resumen:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Esto muestra los resultados por capacidad y el proveedor/modelo elegido cuando corresponde.

## Notas

- La comprensión es **de mejor esfuerzo**. Los errores no bloquean las respuestas.
- Los adjuntos se siguen pasando a los modelos incluso cuando la comprensión está deshabilitada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo mensajes directos).

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Soporte de imágenes y medios](/es/nodes/images)
