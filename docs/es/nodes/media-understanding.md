---
read_when:
    - Diseñar o refactorizar la comprensión de medios
    - Ajuste del preprocesamiento de audio/video/imagen entrante
sidebarTitle: Media understanding
summary: Comprensión entrante de imágenes/audio/video (opcional) con alternativas de proveedor + CLI
title: Comprensión de medios
x-i18n:
    generated_at: "2026-06-28T05:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw puede **resumir medios entrantes** (imagen/audio/video) antes de que se ejecute la canalización de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y se puede desactivar o personalizar. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URLs originales como de costumbre.

El comportamiento de medios específico de cada proveedor lo registran los plugins de proveedor, mientras que el núcleo de OpenClaw gestiona la configuración compartida `tools.media`, el orden de fallback y la integración con la canalización de respuesta.

## Objetivos

- Opcional: predigerir medios entrantes en texto breve para un enrutamiento más rápido y un mejor análisis de comandos.
- Conservar la entrega de medios originales al modelo (siempre).
- Admitir **API de proveedor** y **fallbacks de CLI**.
- Permitir varios modelos con fallback ordenado (error/tamaño/tiempo de espera).

## Comportamiento general

<Steps>
  <Step title="Recopilar adjuntos">
    Recopila adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Seleccionar por capacidad">
    Para cada capacidad habilitada (imagen/audio/video), selecciona adjuntos según la política (predeterminado: **primero**).
  </Step>
  <Step title="Elegir modelo">
    Elige la primera entrada de modelo apta (tamaño + capacidad + autenticación).
  </Step>
  <Step title="Fallback ante fallo">
    Si un modelo falla o el medio es demasiado grande, **recurre a la siguiente entrada**.
  </Step>
  <Step title="Aplicar bloque correcto">
    Si se completa correctamente:

    - `Body` se convierte en un bloque `[Image]`, `[Audio]` o `[Video]`.
    - El audio establece `{{Transcript}}`; el análisis de comandos usa el texto del pie de foto cuando está presente; de lo contrario, usa la transcripción.
    - Los pies de foto se conservan como `User text:` dentro del bloque.

  </Step>
</Steps>

Si la comprensión falla o está desactivada, **el flujo de respuesta continúa** con el cuerpo original + adjuntos.

## Resumen de configuración

`tools.media` admite **modelos compartidos** además de sobrescrituras por capacidad:

<AccordionGroup>
  <Accordion title="Claves de nivel superior">
    - `tools.media.models`: lista de modelos compartidos (usa `capabilities` para limitar).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sobrescrituras de proveedor (`baseUrl`, `headers`, `providerOptions`)
      - opciones de audio de Deepgram mediante `tools.media.audio.providerOptions.deepgram`
      - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
      - **lista `models` por capacidad** opcional (preferida antes que los modelos compartidos)
      - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (limitación opcional por canal/chatType/clave de sesión)
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

Cada entrada de `models[]` puede ser de **proveedor** o de **CLI**:

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
    - `{{OutputDir}}` (directorio de trabajo creado para esta ejecución)
    - `{{OutputBase}}` (ruta base del archivo de trabajo, sin extensión)

  </Tab>
</Tabs>

### Credenciales de proveedor (`apiKey`)

La comprensión de medios de proveedor usa la misma resolución de autenticación de proveedor que las llamadas
normales a modelos: perfiles de autenticación, variables de entorno y después
`models.providers.<providerId>.apiKey`.

Las entradas `tools.media.*.models[]` no aceptan un campo `apiKey` en línea. El valor
`provider` en una entrada de modelo de medios, como `openai` o `moonshot`, debe
tener credenciales disponibles mediante una de las fuentes estándar de autenticación de proveedor.

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

Para consultar la referencia completa de autenticación de proveedores, incluidos perfiles, variables de entorno
y URLs base personalizadas, consulta [Herramientas y proveedores personalizados](/es/gateway/config-tools).

## Valores predeterminados y límites

Valores predeterminados recomendados:

- `maxChars`: **500** para imagen/video (breve, apto para comandos)
- `maxChars`: **sin definir** para audio (transcripción completa salvo que establezcas un límite)
- `maxBytes`:
  - imagen: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Reglas">
    - Si el contenido multimedia supera `maxBytes`, se omite ese modelo y se **prueba el siguiente modelo**.
    - Los archivos de audio menores de **1024 bytes** se tratan como vacíos/corruptos y se omiten antes de la transcripción del proveedor/CLI; el contexto de respuesta entrante recibe una transcripción de marcador determinista para que el agente sepa que la nota era demasiado pequeña.
    - Si el modelo devuelve más de `maxChars`, la salida se recorta.
    - `prompt` usa de forma predeterminada un simple "Describe el {media}." más la guía de `maxChars` (solo imagen/video).
    - Si el modelo primario de imagen activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
    - Si un modelo primario de Gateway/WebChat solo admite texto, los adjuntos de imagen se conservan como refs `media://inbound/*` descargadas para que las herramientas de imagen/PDF o el modelo de imagen configurado aún puedan inspeccionarlas en lugar de perder el adjunto.
    - Las solicitudes explícitas `openclaw infer image describe --model <provider/model>` son distintas: ejecutan directamente ese proveedor/modelo con capacidad de imagen, incluidas refs de Ollama como `ollama/qwen2.5vl:7b`.
    - Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el **modelo de respuesta activo** cuando su proveedor admite la capacidad.

  </Accordion>
</AccordionGroup>

### Detección automática de comprensión multimedia (predeterminada)

Si `tools.media.<capability>.enabled` **no** está establecido en `false` y no has configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera opción que funcione**:

<Steps>
  <Step title="Modelo de respuesta activo">
    Modelo de respuesta activo cuando su proveedor admite la capacidad.
  </Step>
  <Step title="agents.defaults.imageModel">
    Refs primarias/de respaldo de `agents.defaults.imageModel` (solo imagen).
    Prefiere refs `provider/model`. Las refs simples se califican desde entradas de modelo de proveedor configuradas con capacidad de imagen solo cuando la coincidencia es única.
  </Step>
  <Step title="CLI locales (solo audio)">
    CLI locales (si están instaladas):

    - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
    - `whisper` (CLI de Python; descarga modelos automáticamente)

  </Step>
  <Step title="Gemini CLI">
    `gemini` con `read_many_files`.
  </Step>
  <Step title="Autenticación de proveedor">
    - Las entradas configuradas de `models.providers.*` que admiten la capacidad se prueban antes del orden de respaldo incluido.
    - Los proveedores de configuración solo de imagen con un modelo con capacidad de imagen se registran automáticamente para comprensión multimedia incluso cuando no son un plugin de proveedor incluido.
    - La comprensión de imágenes de Ollama está disponible cuando se selecciona explícitamente, por ejemplo mediante `agents.defaults.imageModel` o `openclaw infer image describe --model ollama/<vision-model>`.

    Orden de respaldo incluido:

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

Cuando la comprensión multimedia basada en proveedor para **audio** y **video** está habilitada, OpenClaw respeta las variables de entorno de proxy saliente estándar para llamadas HTTP de proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si no se establecen variables de entorno de proxy, la comprensión multimedia usa salida directa. Si el valor del proxy tiene formato incorrecto, OpenClaw registra una advertencia y vuelve a la obtención directa.

## Capacidades (opcional)

Si estableces `capabilities`, la entrada solo se ejecuta para esos tipos de contenido multimedia. Para listas compartidas, OpenClaw puede inferir valores predeterminados:

- `openai`, `anthropic`, `minimax`: **imagen**
- `minimax-portal`: **imagen**
- `moonshot`: **imagen + video**
- `openrouter`: **imagen + audio**
- `google` (API Gemini): **imagen + audio + video**
- `qwen`: **imagen + video**
- `mistral`: **audio**
- `zai`: **imagen**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Cualquier catálogo `models.providers.<id>.models[]` con un modelo con capacidad de imagen: **imagen**

Para entradas de CLI, **establece `capabilities` explícitamente** para evitar coincidencias inesperadas. Si omites `capabilities`, la entrada es apta para la lista en la que aparece.

## Matriz de compatibilidad de proveedores (integraciones de OpenClaw)

| Capacidad | Integración de proveedor                                                                                                      | Notas                                                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Imagen     | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores de configuración | Los plugins de proveedores registran compatibilidad con imágenes; `openai/*` puede usar enrutamiento con clave de API o Codex OAuth; `codex/*` usa un turno acotado de Codex app-server; MiniMax y MiniMax OAuth usan `MiniMax-VL-01`; los proveedores de configuración con capacidad de imagen se registran automáticamente. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transcripción de proveedor (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                            |
| Video      | Google, Qwen, Moonshot                                                                                                       | Comprensión de video de proveedor mediante plugins de proveedores; la comprensión de video de Qwen usa los endpoints Standard DashScope.                                                                                                                            |

<Note>
**Nota de MiniMax**

- La comprensión de imágenes de `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` proviene del proveedor multimedia `MiniMax-VL-01`, propiedad del plugin.
- El enrutamiento automático de imágenes sigue usando `MiniMax-VL-01` incluso si los metadatos de chat heredados de MiniMax M2.x declaran entrada de imagen.

</Note>

## Guía de selección de modelos

- Prefiere el modelo más potente de última generación disponible para cada capacidad multimedia cuando la calidad y la seguridad sean importantes.
- Para agentes con herramientas habilitadas que manejan entradas no confiables, evita modelos multimedia antiguos o más débiles.
- Mantén al menos una alternativa por capacidad para disponibilidad (modelo de calidad + modelo más rápido o económico).
- Las alternativas de CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API de proveedores no están disponibles.
- Nota sobre `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no se especifica); los formatos que no son `txt` recurren a stdout.

## Política de adjuntos

`attachments` por capacidad controla qué adjuntos se procesan:

<ParamField path="mode" type='"first" | "all"' default="first">
  Si se debe procesar el primer adjunto seleccionado o todos.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita el número procesado.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencia de selección entre los adjuntos candidatos.
</ParamField>

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

<AccordionGroup>
  <Accordion title="Comportamiento de extracción de archivos adjuntos">
    - El texto de archivo extraído se envuelve como **contenido externo no confiable** antes de anexarlo al prompt multimedia.
    - El bloque inyectado usa marcadores de límite explícitos como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos `Source: External`.
    - Esta ruta de extracción de adjuntos omite intencionalmente el banner largo `SECURITY NOTICE:` para evitar inflar el prompt multimedia; los marcadores de límite y los metadatos permanecen.
    - Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
    - Si un PDF recurre a imágenes de página renderizadas en esta ruta, OpenClaw reenvía esas imágenes de página a modelos de respuesta con visión y mantiene el marcador de posición `[PDF content rendered to images]` en el bloque del archivo.

  </Accordion>
</AccordionGroup>

## Ejemplos de configuración

<Tabs>
  <Tab title="Modelos compartidos + anulaciones">
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
  <Tab title="Entrada multimodal única">
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

Cuando se ejecuta la comprensión multimedia, `/status` incluye una línea breve de resumen:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Esto muestra los resultados por capacidad y el proveedor/modelo elegido cuando corresponda.

## Notas

- La comprensión es **de mejor esfuerzo**. Los errores no bloquean las respuestas.
- Los adjuntos se siguen pasando a los modelos incluso cuando la comprensión está deshabilitada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo DMs).

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y multimedia](/es/nodes/images)
