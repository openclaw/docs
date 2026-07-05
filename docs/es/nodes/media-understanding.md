---
read_when:
    - Diseñar o refactorizar la comprensión de medios
    - Ajustar el preprocesamiento de audio, video e imágenes entrantes
sidebarTitle: Media understanding
summary: Comprensión entrante de imágenes/audio/video (opcional) con alternativas de proveedor + CLI
title: Comprensión de medios
x-i18n:
    generated_at: "2026-07-05T11:28:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aabf40780d3528fe8ee3e28782b9e19f624009f5f8684a015357bb27458150ef
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw puede resumir medios entrantes (imagen/audio/video) antes de que se ejecute la canalización de respuesta, de modo que el análisis de comandos y el enrutamiento funcionen con texto breve en lugar de bytes sin procesar. La comprensión detecta automáticamente herramientas locales o claves de proveedor, o puedes configurar modelos explícitos. Los medios originales siempre se entregan al modelo como de costumbre; cuando la comprensión falla o está deshabilitada, el flujo de respuesta continúa sin cambios.

Los Plugins de proveedores registran metadatos de capacidad (qué proveedor admite qué tipo de medio, modelo predeterminado, prioridad). El núcleo de OpenClaw es dueño de la configuración compartida `tools.media`, el orden de reserva y la integración con la canalización de respuesta.

## Cómo funciona

<Steps>
  <Step title="Collect attachments">
    Recopila adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per capability">
    Para cada capacidad habilitada (imagen/audio/video), selecciona adjuntos según la política `attachments` (predeterminado: solo el primer adjunto).
  </Step>
  <Step title="Choose a model">
    Elige la primera entrada de modelo apta (tamaño + capacidad + autenticación disponible).
  </Step>
  <Step title="Fall back on failure">
    Si un modelo produce un error, agota el tiempo de espera o el medio supera `maxBytes`, prueba la siguiente entrada.
  </Step>
  <Step title="Apply on success">
    `Body` se convierte en un bloque `[Image]`, `[Audio]` o `[Video]`. El audio también establece `{{Transcript}}`; el análisis de comandos usa el texto del pie cuando está presente; de lo contrario, la transcripción. Los pies se conservan como `User text:` dentro del bloque.
  </Step>
</Steps>

## Configuración

`tools.media` contiene una lista compartida de modelos más anulaciones por capacidad:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [
        /* shared list, gate with capabilities */
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

Claves por capacidad (`image`/`audio`/`video`):

| Clave                                           | Tipo      | Predeterminado                                      | Notas                                                                                 |
| ----------------------------------------------- | --------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | automático (`false` deshabilita)                   | Establece `false` para desactivar la detección automática para esta capacidad          |
| `models`                                        | arreglo   | ninguno                                             | Se prefiere antes de la lista compartida `tools.media.models`                         |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ guía de maxChars)      | Solo imagen/video de forma predeterminada                                             |
| `maxChars`                                      | `number`  | `500` (imagen/video), sin definir (audio)           | La salida se recorta si el modelo devuelve más                                        |
| `maxBytes`                                      | `number`  | imagen `10485760`, audio `20971520`, video `52428800` | Los medios sobredimensionados saltan al siguiente modelo                            |
| `timeoutSeconds`                                | `number`  | `60` (imagen/audio), `120` (video)                  |                                                                                       |
| `language`                                      | `string`  | sin definir                                         | Sugerencia de transcripción de audio                                                  |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                   | Anulaciones de solicitud de proveedor; consulta [Herramientas y proveedores personalizados](/es/gateway/config-tools) |
| `attachments`                                   | objeto    | `{ mode: "first", maxAttachments: 1 }`              | Consulta [Política de adjuntos](#attachment-policy)                                   |
| `scope`                                         | objeto    | sin definir                                         | Limita por canal/chatType/keyPrefix                                                   |
| `echoTranscript`                                | `boolean` | `false`                                             | Solo audio: devuelve la transcripción al chat antes del procesamiento del agente      |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                               | Solo audio: marcador de posición `{transcript}`                                       |

Las opciones específicas de Deepgram van en `providerOptions.deepgram` (el campo de nivel superior `deepgram: { detectLanguage, punctuate, smartFormat }` está obsoleto, pero aún se lee).

### Entradas de modelo

Cada entrada `models[]` es una entrada de **proveedor** (predeterminada) o una entrada de **CLI**:

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
      capabilities: ["image"], // optional, for multi-modal shared entries
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

    Las plantillas de CLI también pueden usar `{{MediaDir}}` (directorio que contiene el archivo multimedia), `{{OutputDir}}` (directorio temporal creado para esta ejecución) y `{{OutputBase}}` (ruta base del archivo temporal, sin extensión).

  </Tab>
</Tabs>

### Credenciales de proveedor

La comprensión de medios por proveedor usa la misma resolución de autenticación que las llamadas normales al modelo: perfiles de autenticación, variables de entorno y luego `models.providers.<providerId>.apiKey`. Las entradas `tools.media.*.models[]` no aceptan un campo `apiKey` en línea.

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

Consulta [Herramientas y proveedores personalizados](/es/gateway/config-tools) para perfiles, variables de entorno y URL base personalizadas.

## Reglas y comportamiento

- Los medios que superen `maxBytes` omiten ese modelo y prueban el siguiente.
- Los archivos de audio de menos de 1024 bytes se tratan como vacíos/corruptos y se omiten antes de la transcripción; el agente recibe en su lugar una transcripción de marcador de posición determinista.
- Si el modelo de imagen principal activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original directamente al modelo. MiniMax es una excepción: `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` siempre enrutan la comprensión de imágenes a través del proveedor de medios `MiniMax-VL-01` propiedad del Plugin, incluso si los metadatos de chat heredados de MiniMax M2.x declaran entrada de imagen (solo `MiniMax-M3` y posteriores se tratan como compatibles con visión de forma nativa).
- Si un modelo principal de Gateway/WebChat es solo texto, los adjuntos de imagen se conservan como referencias descargadas `media://inbound/*`, de modo que las herramientas de imagen/PDF o un modelo de imagen configurado aún puedan inspeccionarlos en lugar de perder el adjunto.
- `openclaw infer image describe --file <path> --model <provider/model>` explícito (alias: `openclaw capability image describe`) ejecuta directamente ese proveedor/modelo compatible con imágenes, incluidas referencias de Ollama como `ollama/qwen2.5vl:7b` cuando se configura un modelo compatible con imágenes coincidente en `models.providers.ollama.models[]`.
- Si `<capability>.enabled` no es `false` pero no hay modelos configurados, OpenClaw prueba el modelo de respuesta activo cuando su proveedor admite la capacidad.

### Detección automática (predeterminada)

Cuando `tools.media.<capability>.enabled` no es `false` y no hay modelos configurados, OpenClaw prueba estos en orden y se detiene en la primera opción funcional:

<Steps>
  <Step title="Configured image model (image only)">
    Referencias principales/de reserva de `agents.defaults.imageModel`, salvo que el modelo de respuesta activo ya admita visión de forma nativa. Prefiere referencias `provider/model`; las referencias simples se califican desde entradas configuradas de modelos de proveedor compatibles con imágenes solo cuando la coincidencia es única.
  </Step>
  <Step title="Active reply model">
    El modelo de respuesta activo, cuando su proveedor admite la capacidad.
  </Step>
  <Step title="Provider auth (audio only, before local CLIs)">
    Las entradas configuradas `models.providers.*` que admiten audio se prueban antes de las CLI locales. Orden de prioridad de proveedores incluidos (los empates se resuelven alfabéticamente por identificador de proveedor): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="Local CLIs (audio only)">
    Primer binario local instalado, en este orden:
    - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o un modelo diminuto incluido)
    - `whisper` (CLI de Python; usa de forma predeterminada el modelo `turbo`, se descarga automáticamente)

  </Step>
  <Step title="Provider auth (image/video)">
    Las entradas configuradas `models.providers.*` que admiten la capacidad se prueban antes del orden de reserva incluido. Los proveedores de configuración solo de imagen con un modelo compatible con imágenes se registran automáticamente para la comprensión de medios incluso cuando no son un Plugin de proveedor incluido.

    Orden de prioridad de proveedores incluidos (los empates se resuelven alfabéticamente por identificador de proveedor):
    - Imagen: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity CLI (image/video only)">
    Primer binario `agy` o `antigravity` instalado (anula con `OPENCLAW_ANTIGRAVITY_CLI`), aislado dentro del directorio del medio.
  </Step>
</Steps>

Para deshabilitar la detección automática para una capacidad:

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
La detección de binarios es de mejor esfuerzo en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (`~` se expande), o establece una entrada de modelo de CLI explícita con una ruta completa de comando.
</Note>

### Compatibilidad con proxy (llamadas de proveedor de audio/video)

La comprensión de **audio** y **video** basada en proveedor respeta las variables de entorno estándar de proxy saliente, incluidas las reglas de omisión `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Las variables en minúsculas tienen prioridad sobre las mayúsculas. Si no se establece ninguna, la comprensión de medios usa salida directa; si el valor del proxy está mal formado, OpenClaw registra una advertencia y vuelve a la obtención directa. La comprensión de imágenes no pasa por esta ruta de proxy.

## Capacidades

Establece `capabilities` en una entrada `models[]` para restringirla a tipos de medios específicos. Para listas compartidas, OpenClaw infiere valores predeterminados por proveedor incluido:

| Proveedor                                                                | Capacidades           |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | imagen                |
| `minimax-portal`                                                         | imagen                |
| `moonshot`                                                               | imagen + video        |
| `openrouter`                                                             | imagen + audio        |
| `google` (API de Gemini)                                                 | imagen + audio + video |
| `qwen`                                                                   | imagen + video        |
| `deepinfra`                                                              | imagen + audio        |
| `mistral`                                                                | audio                 |
| `zai`                                                                    | imagen                |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | audio                 |
| Cualquier catálogo `models.providers.<id>.models[]` con un modelo compatible con imágenes | imagen                 |

Para las entradas de CLI, establece `capabilities` explícitamente para evitar coincidencias inesperadas; si se omite, la entrada es apta para cada lista de capacidades en la que aparezca.

## Matriz de compatibilidad de proveedores

| Capacidad | Proveedores                                                                                                                                             | Notas                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen     | Anthropic, servidor de aplicaciones Codex, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OAuth de OpenAI Codex, OpenRouter, Qwen, Z.AI, proveedores de configuración | Los plugins de proveedores registran compatibilidad con imágenes; `openai/*` puede usar enrutamiento con clave de API u OAuth de Codex; `codex/*` usa un turno acotado del servidor de aplicaciones Codex; los proveedores de configuración compatibles con imágenes se registran automáticamente. |
| Audio      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transcripción del proveedor (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Video      | Google, Moonshot, Qwen                                                                                                                                  | Comprensión de video del proveedor mediante plugins de proveedores; la comprensión de video de Qwen usa los endpoints estándar de DashScope.                                                                        |

<Note>
**Nota de MiniMax**: la comprensión de imágenes de `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` siempre proviene del proveedor multimedia `MiniMax-VL-01`, propiedad del plugin, aunque los metadatos de chat heredados de MiniMax M2.x declaren entrada de imagen.
</Note>

## Guía de selección de modelos

- Prefiere el modelo más potente de la generación actual para cada capacidad multimedia cuando la calidad y la seguridad importen.
- Para agentes con herramientas habilitadas que manejan entradas no confiables, evita modelos multimedia antiguos o más débiles.
- Mantén al menos una alternativa por capacidad para disponibilidad (modelo de calidad + modelo más rápido/barato).
- Las alternativas de CLI (`whisper-cli`, `whisper`, `gemini`) ayudan cuando las API de proveedores no están disponibles.
- `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` o no se especifica; otros formatos recurren a stdout.

## Política de adjuntos

`attachments` por capacidad controla qué adjuntos se procesan:

<ParamField path="mode" type='"first" | "all"' default="first">
  Procesa solo el primer adjunto seleccionado, o todos ellos.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita la cantidad procesada.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencia de selección entre adjuntos candidatos.
</ParamField>

Cuando `mode: "all"`, las salidas se etiquetan como `[Imagen 1/2]`, `[Audio 2/2]`, etc.

### Extracción de archivos adjuntos

- El texto extraído de archivos se envuelve como contenido externo no confiable antes de anexarlo al prompt multimedia, usando marcadores de límite como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` más una línea de metadatos `Source: External`.
- Esta ruta omite intencionalmente el banner largo `SECURITY NOTICE:` para mantener breve el prompt multimedia; los marcadores de límite y los metadatos siguen aplicándose.
- Un archivo sin texto extraíble recibe `[No extractable text]`.
- Si un PDF recurre a imágenes de página renderizadas, OpenClaw reenvía esas imágenes a modelos de respuesta con capacidad de visión y mantiene el marcador de posición `[PDF content rendered to images]` en el bloque del archivo.

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
              { provider: "anthropic", model: "claude-opus-4-8" },
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

Cuando se ejecuta la comprensión multimedia, `/status` incluye una línea de resumen por capacidad:

```
📎 Media: image ok (openai/gpt-5.5) · audio skipped (maxBytes)
```

## Notas

- La comprensión se hace con el máximo esfuerzo. Los errores no bloquean las respuestas.
- Los adjuntos siguen pasándose a los modelos aunque la comprensión esté deshabilitada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo MD).

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y multimedia](/es/nodes/images)
