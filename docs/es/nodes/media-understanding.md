---
read_when:
    - Diseñando o refactorizando la comprensión multimedia
    - Ajustando el preprocesamiento entrante de audio/video/imágenes
summary: Comprensión entrante de imágenes/audio/video (opcional) con proveedor y respaldos de CLI
title: Comprensión multimedia
x-i18n:
    generated_at: "2026-04-23T05:16:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Comprensión multimedia - Entrante (2026-01-17)

OpenClaw puede **resumir multimedia entrante** (imagen/audio/video) antes de que se ejecute la canalización de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y puede deshabilitarse o personalizarse. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URL originales como siempre.

El comportamiento multimedia específico del proveedor se registra mediante plugins de proveedor, mientras que el
núcleo de OpenClaw es propietario de la configuración compartida `tools.media`, el orden de respaldo y la
integración con la canalización de respuesta.

## Objetivos

- Opcional: predigerir multimedia entrante en texto corto para un enrutamiento más rápido y un mejor análisis de comandos.
- Preservar siempre la entrega del multimedia original al modelo.
- Compatibilidad con **API de proveedores** y **respaldos de CLI**.
- Permitir varios modelos con respaldo ordenado (error/tamaño/tiempo de espera).

## Comportamiento de alto nivel

1. Recopilar adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidad habilitada (imagen/audio/video), seleccionar adjuntos según la política (predeterminado: **first**).
3. Elegir la primera entrada de modelo elegible (tamaño + capacidad + autenticación).
4. Si un modelo falla o el multimedia es demasiado grande, **usar respaldo con la siguiente entrada**.
5. En caso de éxito:
   - `Body` pasa a ser un bloque `[Image]`, `[Audio]` o `[Video]`.
   - El audio establece `{{Transcript}}`; el análisis de comandos usa el texto del subtítulo cuando está presente,
     en caso contrario la transcripción.
   - Los subtítulos se conservan como `User text:` dentro del bloque.

Si la comprensión falla o está deshabilitada, **el flujo de respuesta continúa** con el cuerpo original + adjuntos.

## Resumen de configuración

`tools.media` admite **modelos compartidos** además de reemplazos por capacidad:

- `tools.media.models`: lista de modelos compartidos (usa `capabilities` para restringir).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - reemplazos de proveedor (`baseUrl`, `headers`, `providerOptions`)
  - opciones de audio de Deepgram mediante `tools.media.audio.providerOptions.deepgram`
  - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
  - lista opcional de `models` **por capacidad** (se prefiere antes que los modelos compartidos)
  - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (restricción opcional por canal/chatType/clave de sesión)
- `tools.media.concurrency`: máximo de ejecuciones concurrentes por capacidad (predeterminado **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartida */
      ],
      image: {
        /* reemplazos opcionales */
      },
      audio: {
        /* reemplazos opcionales */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* reemplazos opcionales */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada de `models[]` puede ser de **proveedor** o de **CLI**:

```json5
{
  type: "provider", // predeterminado si se omite
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe la imagen en <= 500 caracteres.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcional, se usa para entradas multimodales
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Lee el multimedia en {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
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

## Valores predeterminados y límites

Valores predeterminados recomendados:

- `maxChars`: **500** para imagen/video (corto, fácil de analizar por comandos)
- `maxChars`: **sin establecer** para audio (transcripción completa a menos que establezcas un límite)
- `maxBytes`:
  - imagen: **10MB**
  - audio: **20MB**
  - video: **50MB**

Reglas:

- Si el multimedia supera `maxBytes`, ese modelo se omite y se **prueba el siguiente modelo**.
- Los archivos de audio menores de **1024 bytes** se tratan como vacíos/dañados y se omiten antes de la transcripción por proveedor/CLI.
- Si el modelo devuelve más de `maxChars`, la salida se recorta.
- `prompt` usa de forma predeterminada un simple “Describe el/la {media}.” más la guía de `maxChars` (solo imagen/video).
- Si el modelo principal activo de imagen ya admite visión de forma nativa, OpenClaw
  omite el bloque de resumen `[Image]` y en su lugar pasa la imagen original al
  modelo.
- Las solicitudes explícitas `openclaw infer image describe --model <provider/model>`
  son diferentes: ejecutan directamente ese proveedor/modelo con capacidad de imagen, incluidos
  refs de Ollama como `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el
  **modelo de respuesta activo** cuando su proveedor admite la capacidad.

### Detección automática de comprensión multimedia (predeterminada)

Si `tools.media.<capability>.enabled` **no** está establecido en `false` y no has
configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera
opción que funcione**:

1. **Modelo de respuesta activo** cuando su proveedor admite la capacidad.
2. Refs principal/de respaldo de **`agents.defaults.imageModel`** (solo imagen).
3. **CLI locales** (solo audio; si están instalados)
   - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
   - `whisper` (CLI de Python; descarga modelos automáticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticación de proveedor**
   - Las entradas configuradas en `models.providers.*` que admiten la capacidad se
     prueban antes del orden de respaldo incluido.
   - Los proveedores configurados solo para imagen con un modelo con capacidad de imagen se registran automáticamente para
     comprensión multimedia incluso cuando no son un plugin de proveedor incluido.
   - La comprensión de imágenes de Ollama está disponible cuando se selecciona explícitamente, por
     ejemplo mediante `agents.defaults.imageModel` o
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Orden de respaldo incluido:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Imagen: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Para deshabilitar la detección automática, establece:

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

Nota: la detección de binarios es por mejor esfuerzo en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`), o establece un modelo de CLI explícito con una ruta completa al comando.

### Compatibilidad con entorno de proxy (modelos de proveedor)

Cuando la comprensión multimedia de **audio** y **video** basada en proveedor está habilitada, OpenClaw
respeta las variables de entorno de proxy saliente estándar para las llamadas HTTP al proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si no se establece ninguna variable de entorno de proxy, la comprensión multimedia usa salida directa.
Si el valor del proxy está mal formado, OpenClaw registra una advertencia y usa la
obtención directa como respaldo.

## Capacidades (opcional)

Si estableces `capabilities`, la entrada solo se ejecuta para esos tipos de multimedia. Para listas
compartidas, OpenClaw puede inferir valores predeterminados:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (API de Gemini): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Cualquier catálogo `models.providers.<id>.models[]` con un modelo con capacidad de imagen:
  **image**

Para entradas de CLI, **establece `capabilities` explícitamente** para evitar coincidencias inesperadas.
Si omites `capabilities`, la entrada es elegible para la lista en la que aparece.

## Matriz de compatibilidad de proveedores (integraciones de OpenClaw)

| Capability | Integración de proveedor                                                               | Notes                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores configurados | Los plugins de proveedor registran compatibilidad de imagen; MiniMax y MiniMax OAuth usan ambos `MiniMax-VL-01`; los proveedores configurados con capacidad de imagen se registran automáticamente. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Transcripción del proveedor (Whisper/Deepgram/Gemini/Voxtral).                                                                          |
| Video      | Google, Qwen, Moonshot                                                                 | Comprensión de video del proveedor mediante plugins de proveedor; la comprensión de video de Qwen usa los endpoints Standard DashScope. |

Nota de MiniMax:

- La comprensión de imágenes de `minimax` y `minimax-portal` proviene del proveedor multimedia
  `MiniMax-VL-01` propiedad del plugin.
- El catálogo de texto incluido de MiniMax sigue comenzando solo con texto; las entradas explícitas de
  `models.providers.minimax` materializan refs de chat M2.7 con capacidad de imagen.

## Guía de selección de modelos

- Prefiere el modelo más potente y de última generación disponible para cada capacidad multimedia cuando la calidad y la seguridad importan.
- Para agentes con herramientas que manejan entradas no confiables, evita modelos multimedia más antiguos o débiles.
- Mantén al menos un respaldo por capacidad para disponibilidad (modelo de calidad + modelo más rápido/barato).
- Los respaldos de CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API de proveedor no están disponibles.
- Nota de `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no se especifica); los formatos que no son `txt` usan stdout como respaldo.

## Política de adjuntos

`attachments` por capacidad controla qué adjuntos se procesan:

- `mode`: `first` (predeterminado) o `all`
- `maxAttachments`: limita la cantidad procesada (predeterminado **1**)
- `prefer`: `first`, `last`, `path`, `url`

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportamiento de extracción de adjuntos de archivo:

- El texto extraído del archivo se envuelve como **contenido externo no confiable** antes de
  añadirse al prompt multimedia.
- El bloque inyectado usa marcadores de límite explícitos como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una
  línea de metadatos `Source: External`.
- Esta ruta de extracción de adjuntos omite intencionalmente el extenso
  banner `SECURITY NOTICE:` para evitar inflar el prompt multimedia; los marcadores
  de límite y los metadatos siguen presentes.
- Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
- Si un PDF usa como respaldo imágenes renderizadas de páginas en esta ruta, el prompt multimedia conserva
  el marcador `[PDF content rendered to images; images not forwarded to model]`
  porque este paso de extracción de adjuntos reenvía bloques de texto, no las imágenes renderizadas del PDF.

## Ejemplos de configuración

### 1) Lista de modelos compartidos + reemplazos

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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
            "Lee el multimedia en {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
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

### 2) Solo audio + video (imagen desactivada)

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
              "Lee el multimedia en {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Comprensión opcional de imágenes

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Lee el multimedia en {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Entrada única multimodal (capacidades explícitas)

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

## Salida de estado

Cuando se ejecuta la comprensión multimedia, `/status` incluye una línea breve de resumen:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Esto muestra resultados por capacidad y el proveedor/modelo elegido cuando corresponde.

## Notas

- La comprensión es **de mejor esfuerzo**. Los errores no bloquean las respuestas.
- Los adjuntos se siguen pasando a los modelos incluso cuando la comprensión está deshabilitada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo en mensajes directos).

## Documentación relacionada

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y multimedia](/es/nodes/images)
