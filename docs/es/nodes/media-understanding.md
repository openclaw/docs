---
read_when:
    - Diseñar o refactorizar la comprensión multimedia
    - Ajustar el preprocesamiento entrante de audio/video/imagen
summary: Comprensión entrante de imágenes/audio/video (opcional) con proveedor + respaldos de CLI
title: Comprensión multimedia
x-i18n:
    generated_at: "2026-04-24T05:36:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Comprensión multimedia - Entrante (2026-01-17)

OpenClaw puede **resumir multimedia entrante** (imagen/audio/video) antes de que se ejecute el pipeline de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y puede deshabilitarse o personalizarse. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URL originales como siempre.

El comportamiento multimedia específico del proveedor se registra mediante Plugins del proveedor, mientras que el núcleo de OpenClaw
es propietario de la configuración compartida `tools.media`, el orden de respaldo y la integración con el pipeline de respuesta.

## Objetivos

- Opcional: preprocesar multimedia entrante en texto corto para un enrutamiento más rápido y un mejor análisis de comandos.
- Preservar siempre la entrega del multimedia original al modelo.
- Admitir **API de proveedor** y **respaldos de CLI**.
- Permitir múltiples modelos con respaldo ordenado (error/tamaño/timeout).

## Comportamiento de alto nivel

1. Recoger archivos adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidad habilitada (imagen/audio/video), seleccionar archivos adjuntos según la política (predeterminado: **primero**).
3. Elegir la primera entrada de modelo elegible (tamaño + capacidad + autenticación).
4. Si un modelo falla o el multimedia es demasiado grande, **recurrir a la siguiente entrada**.
5. En caso de éxito:
   - `Body` se convierte en un bloque `[Image]`, `[Audio]` o `[Video]`.
   - El audio establece `{{Transcript}}`; el análisis de comandos usa el texto del pie de foto cuando está presente,
     o en caso contrario la transcripción.
   - Los pies de foto se conservan como `User text:` dentro del bloque.

Si la comprensión falla o está deshabilitada, **el flujo de respuesta continúa** con el cuerpo original + archivos adjuntos.

## Resumen de configuración

`tools.media` admite **modelos compartidos** más sobrescrituras por capacidad:

- `tools.media.models`: lista de modelos compartida (usa `capabilities` para restringir).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - sobrescrituras de proveedor (`baseUrl`, `headers`, `providerOptions`)
  - opciones de audio Deepgram mediante `tools.media.audio.providerOptions.deepgram`
  - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
  - **lista `models` opcional por capacidad** (preferida antes que los modelos compartidos)
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

```json5
{
  type: "provider", // predeterminado si se omite
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
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

## Valores predeterminados y límites

Valores predeterminados recomendados:

- `maxChars`: **500** para imagen/video (corto, fácil de analizar como comando)
- `maxChars`: **sin establecer** para audio (transcripción completa salvo que pongas un límite)
- `maxBytes`:
  - imagen: **10MB**
  - audio: **20MB**
  - video: **50MB**

Reglas:

- Si el multimedia supera `maxBytes`, ese modelo se omite y se **prueba el siguiente modelo**.
- Los archivos de audio menores de **1024 bytes** se tratan como vacíos/corruptos y se omiten antes de la transcripción por proveedor/CLI.
- Si el modelo devuelve más de `maxChars`, la salida se recorta.
- `prompt` usa por defecto un sencillo “Describe the {media}.” más la orientación de `maxChars` (solo imagen/video).
- Si el modelo principal de imagen activo ya admite visión de forma nativa, OpenClaw
  omite el bloque de resumen `[Image]` y pasa la imagen original al
  modelo.
- Si un modelo principal de Gateway/WebChat es solo de texto, los archivos adjuntos de imagen se
  conservan como refs descargadas `media://inbound/*` para que la herramienta de imagen o el modelo
  de imagen configurado aún puedan inspeccionarlos en lugar de perder el archivo adjunto.
- Las solicitudes explícitas `openclaw infer image describe --model <provider/model>` son diferentes: ejecutan directamente ese proveedor/modelo con capacidad de imagen, incluidas
  refs de Ollama como `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el
  **modelo de respuesta activo** cuando su proveedor admite esa capacidad.

### Detección automática de comprensión multimedia (predeterminada)

Si `tools.media.<capability>.enabled` **no** está configurado como `false` y no has
configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera
opción que funciona**:

1. **Modelo de respuesta activo** cuando su proveedor admite la capacidad.
2. Refs primary/fallback de **`agents.defaults.imageModel`** (solo imagen).
3. **CLI locales** (solo audio; si están instaladas)
   - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
   - `whisper` (CLI de Python; descarga modelos automáticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticación de proveedor**
   - Las entradas configuradas `models.providers.*` que admiten la capacidad se
     prueban antes del orden de respaldo incluido.
   - Los proveedores de configuración solo de imagen con un modelo capaz de imagen se autorregistran para comprensión multimedia incluso cuando no son un Plugin de proveedor incluido.
   - La comprensión de imágenes con Ollama está disponible cuando se selecciona explícitamente, por
     ejemplo mediante `agents.defaults.imageModel` o
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Orden de respaldo incluido:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Imagen: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Para desactivar la detección automática, configura:

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

Nota: la detección de binarios es best-effort en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`), o configura un modelo CLI explícito con una ruta completa al comando.

### Soporte de entorno de proxy (modelos de proveedor)

Cuando la comprensión multimedia basada en proveedor de **audio** y **video** está habilitada, OpenClaw
respeta las variables de entorno de proxy saliente estándar para llamadas HTTP al proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si no se configura ninguna variable de entorno de proxy, la comprensión multimedia usa salida directa.
Si el valor del proxy está mal formado, OpenClaw registra una advertencia y recurre a la
recuperación directa.

## Capacidades (opcional)

Si configuras `capabilities`, la entrada solo se ejecuta para esos tipos de multimedia. Para listas compartidas, OpenClaw puede inferir valores predeterminados:

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
- Cualquier catálogo `models.providers.<id>.models[]` con un modelo capaz de imagen:
  **image**

Para entradas de CLI, **configura `capabilities` explícitamente** para evitar coincidencias inesperadas.
Si omites `capabilities`, la entrada es elegible para la lista en la que aparece.

## Matriz de soporte de proveedores (integraciones de OpenClaw)

| Capacidad | Integración de proveedor                                                                                                     | Notas                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen     | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores de configuración | Los Plugins del proveedor registran soporte de imagen; `openai-codex/*` usa la infraestructura OAuth del proveedor; `codex/*` usa un turno limitado del app-server de Codex; MiniMax y MiniMax OAuth usan ambos `MiniMax-VL-01`; los proveedores de configuración con capacidad de imagen se autorregistran. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Transcripción de proveedor (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                          |
| Video      | Google, Qwen, Moonshot                                                                                                       | Comprensión de video del proveedor mediante Plugins del proveedor; la comprensión de video de Qwen usa los endpoints Standard DashScope.                                                                                               |

Nota de MiniMax:

- La comprensión de imágenes `minimax` y `minimax-portal` viene del proveedor
  multimedia `MiniMax-VL-01` propiedad del Plugin.
- El catálogo de texto incluido de MiniMax sigue empezando como solo texto; las entradas explícitas
  `models.providers.minimax` materializan refs de chat M2.7 con capacidad de imagen.

## Guía de selección de modelos

- Prefiere el modelo más fuerte y de última generación disponible para cada capacidad multimedia cuando importen la calidad y la seguridad.
- Para agentes con herramientas habilitadas que manejan entradas no confiables, evita modelos multimedia más antiguos o débiles.
- Mantén al menos un respaldo por capacidad para disponibilidad (modelo de calidad + modelo más rápido/barato).
- Los respaldos de CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API de proveedor no están disponibles.
- Nota sobre `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no se especifica); los formatos que no son `txt` recurren a stdout.

## Política de archivos adjuntos

`attachments` por capacidad controla qué archivos adjuntos se procesan:

- `mode`: `first` (predeterminado) o `all`
- `maxAttachments`: límite del número procesado (predeterminado **1**)
- `prefer`: `first`, `last`, `path`, `url`

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportamiento de extracción de archivos adjuntos:

- El texto extraído del archivo se envuelve como **contenido externo no confiable** antes de
  añadirse al prompt multimedia.
- El bloque inyectado usa marcadores explícitos de límite como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una
  línea de metadatos `Source: External`.
- Esta ruta de extracción de archivos adjuntos omite intencionadamente el largo banner
  `SECURITY NOTICE:` para evitar inflar el prompt multimedia; los marcadores de
  límite y los metadatos permanecen igualmente.
- Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
- Si en esta ruta un PDF recurre a imágenes renderizadas de páginas, el prompt multimedia conserva
  el marcador `[PDF content rendered to images; images not forwarded to model]`
  porque este paso de extracción de adjuntos reenvía bloques de texto, no las imágenes renderizadas del PDF.

## Ejemplos de configuración

### 1) Lista de modelos compartida + sobrescrituras

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
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Comprensión de imagen opcional

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

Cuando se ejecuta la comprensión multimedia, `/status` incluye una breve línea de resumen:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Esto muestra resultados por capacidad y el proveedor/modelo elegido cuando corresponde.

## Notas

- La comprensión es **best-effort**. Los errores no bloquean las respuestas.
- Los archivos adjuntos siguen pasándose a los modelos incluso cuando la comprensión está deshabilitada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo en DMs).

## Documentación relacionada

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imagen y multimedia](/es/nodes/images)
