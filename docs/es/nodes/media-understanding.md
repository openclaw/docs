---
read_when:
    - Diseño o refactorización de la comprensión de contenido multimedia
    - Ajuste del preprocesamiento de audio, vídeo e imágenes entrantes
sidebarTitle: Media understanding
summary: Comprensión de imágenes, audio y vídeo entrantes (opcional) con alternativas mediante proveedor y CLI
title: Comprensión de contenido multimedia
x-i18n:
    generated_at: "2026-07-11T23:14:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw puede resumir los medios entrantes (imagen/audio/vídeo) antes de que se ejecute el flujo de respuestas, de modo que el análisis de comandos y el enrutamiento trabajen con texto breve en lugar de bytes sin procesar. La comprensión detecta automáticamente las herramientas locales o las claves de proveedores, aunque también puede configurar modelos explícitos. Los medios originales siempre se entregan al modelo de la forma habitual; cuando la comprensión falla o está deshabilitada, el flujo de respuestas continúa sin cambios.

Los plugins de proveedores registran metadatos de capacidades (qué proveedor admite cada tipo de medio, modelo predeterminado y prioridad). El núcleo de OpenClaw gestiona la configuración compartida `tools.media`, el orden de alternativas y la integración con el flujo de respuestas.

## Cómo funciona

<Steps>
  <Step title="Recopilar archivos adjuntos">
    Recopila los archivos adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Seleccionar por capacidad">
    Para cada capacidad habilitada (imagen/audio/vídeo), selecciona los archivos adjuntos según la política `attachments` (valor predeterminado: solo el primer archivo adjunto).
  </Step>
  <Step title="Elegir un modelo">
    Elige la primera entrada de modelo apta (tamaño + capacidad + autenticación disponible).
  </Step>
  <Step title="Usar una alternativa en caso de fallo">
    Si un modelo produce un error, agota el tiempo de espera o el medio supera `maxBytes`, prueba la siguiente entrada.
  </Step>
  <Step title="Aplicar en caso de éxito">
    `Body` se convierte en un bloque `[Image]`, `[Audio]` o `[Video]`. El audio también establece `{{Transcript}}`; el análisis de comandos usa el texto de la leyenda cuando está presente y, en caso contrario, la transcripción. Las leyendas se conservan como `User text:` dentro del bloque.
  </Step>
</Steps>

## Configuración

`tools.media` contiene una lista compartida de modelos y anulaciones por capacidad:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Claves por capacidad (`image`/`audio`/`video`):

| Clave                                           | Tipo      | Valor predeterminado                                  | Notas                                                                                         |
| ----------------------------------------------- | --------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | automático (`false` deshabilita)                      | Establezca `false` para desactivar la detección automática de esta capacidad                  |
| `models`                                        | matriz    | ninguno                                               | Tiene preferencia sobre la lista compartida `tools.media.models`                              |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ orientación de maxChars) | Solo para imagen/vídeo de forma predeterminada                                                |
| `maxChars`                                      | `number`  | `500` (imagen/vídeo), sin establecer (audio)          | La salida se recorta si el modelo devuelve más                                                |
| `maxBytes`                                      | `number`  | imagen `10485760`, audio `20971520`, vídeo `52428800` | Los medios demasiado grandes hacen que se pase al siguiente modelo                            |
| `timeoutSeconds`                                | `number`  | `60` (imagen/audio), `120` (vídeo)                    |                                                                                               |
| `language`                                      | `string`  | sin establecer                                        | Indicación para la transcripción de audio                                                     |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                     | Anulaciones de solicitudes del proveedor; consulte [Herramientas y proveedores personalizados](/es/gateway/config-tools) |
| `attachments`                                   | objeto    | `{ mode: "first", maxAttachments: 1 }`                | Consulte [Política de archivos adjuntos](#attachment-policy)                                  |
| `scope`                                         | objeto    | sin establecer                                        | Restringe por canal/chatType/keyPrefix                                                        |
| `echoTranscript`                                | `boolean` | `false`                                               | Solo audio: devuelve la transcripción al chat antes del procesamiento del agente              |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                 | Solo audio: marcador de posición `{transcript}`                                               |

Las opciones específicas de Deepgram se colocan en `providerOptions.deepgram` (el campo de nivel superior `deepgram: { detectLanguage, punctuate, smartFormat }` está obsoleto, pero aún se procesa).

### Entradas de modelos

Cada entrada de `models[]` es una entrada de **proveedor** (predeterminada) o una entrada de **CLI**:

<Tabs>
  <Tab title="Entrada de proveedor">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
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

    Las plantillas de CLI también pueden usar `{{MediaDir}}` (directorio que contiene el archivo multimedia), `{{OutputDir}}` (directorio temporal creado para esta ejecución) y `{{OutputBase}}` (ruta base del archivo temporal, sin extensión).

  </Tab>
</Tabs>

### Credenciales del proveedor

La comprensión de medios mediante proveedores usa la misma resolución de autenticación que las llamadas normales a modelos: perfiles de autenticación, variables de entorno y, después, `models.providers.<providerId>.apiKey`. Las entradas `tools.media.*.models[]` no aceptan un campo `apiKey` en línea.

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

Consulte [Herramientas y proveedores personalizados](/es/gateway/config-tools) para obtener información sobre perfiles, variables de entorno y URL base personalizadas.

## Reglas y comportamiento

- Los medios que superan `maxBytes` omiten ese modelo y prueban el siguiente.
- Los archivos de audio de menos de 1024 bytes se consideran vacíos o dañados y se omiten antes de la transcripción; el agente recibe en su lugar una transcripción de marcador de posición determinista.
- Si el modelo de imagen principal activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original directamente al modelo. MiniMax es una excepción: `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` siempre enrutan la comprensión de imágenes mediante el proveedor de medios `MiniMax-VL-01`, gestionado por el plugin, aunque los metadatos heredados de chat de MiniMax M2.x indiquen que admite entrada de imágenes (solo `MiniMax-M3` y versiones posteriores se consideran capaces de procesar visión de forma nativa).
- Si el modelo principal de Gateway/WebChat solo admite texto, los archivos adjuntos de imagen se conservan como referencias externalizadas `media://inbound/*`, para que las herramientas de imagen/PDF o un modelo de imagen configurado todavía puedan inspeccionarlos en lugar de perder el archivo adjunto.
- La ejecución explícita de `openclaw infer image describe --file <path> --model <provider/model>` (alias: `openclaw capability image describe`) utiliza directamente ese proveedor/modelo compatible con imágenes, incluidas referencias de Ollama como `ollama/qwen2.5vl:7b` cuando se configura un modelo compatible con imágenes coincidente en `models.providers.ollama.models[]`.
- Si `<capability>.enabled` no es `false`, pero no hay modelos configurados, OpenClaw prueba el modelo de respuesta activo cuando su proveedor admite la capacidad.

### Detección automática (predeterminada)

Cuando `tools.media.<capability>.enabled` no es `false` y no hay modelos configurados, OpenClaw prueba las siguientes opciones en orden y se detiene en la primera que funcione:

<Steps>
  <Step title="Modelo de imagen configurado (solo imágenes)">
    Referencias principales/alternativas de `agents.defaults.imageModel`, salvo que el modelo de respuesta activo ya admita visión de forma nativa. Se prefieren las referencias `provider/model`; las referencias simples solo se completan a partir de entradas de modelos de proveedor compatibles con imágenes configuradas cuando la coincidencia es única.
  </Step>
  <Step title="Modelo de respuesta activo">
    El modelo de respuesta activo, cuando su proveedor admite la capacidad.
  </Step>
  <Step title="Autenticación de proveedores (solo audio, antes de las CLI locales)">
    Las entradas configuradas de `models.providers.*` que admiten audio se prueban antes que las CLI locales. Orden de prioridad de proveedores incluidos (los empates se resuelven alfabéticamente por identificador de proveedor): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="CLI locales (solo audio)">
    Los binarios locales preparados forman una lista ordenada de alternativas:
    - `whisper-cli` primero solo después de que una invocación anterior de un modelo en el proceso actual haya detectado Metal o CUDA
    - `sherpa-onnx-offline` con CPU de forma predeterminada (requiere `SHERPA_ONNX_MODEL_DIR` con `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` cuando la aceleración solo está disponible en la compilación o aún no se ha detectado
    - `parakeet-mlx` en Apple Silicon (compatible con MLX, uso del dispositivo no detectado)
    - `whisper` (CLI de Python; usa de forma predeterminada el modelo `turbo` y lo descarga automáticamente)

    La inspección de capacidades del motor se almacena en caché y no carga ningún modelo. La capacidad de compilación, los indicadores solicitados del motor y el motor detectado mediante una invocación real permanecen separados. El whisper.cpp detectado automáticamente mantiene habilitados los registros de ejecución del modelo para que pueda registrarse la línea del motor seleccionado por el proyecto de origen. Las entradas explícitas de CLI conservan su orden, sus indicadores de motor y sus indicadores de salida configurados.

  </Step>
  <Step title="Autenticación de proveedores (imagen/vídeo)">
    Las entradas configuradas de `models.providers.*` que admiten la capacidad se prueban antes del orden de alternativas incluido. Los proveedores de configuración exclusiva para imágenes que tengan un modelo compatible con imágenes se registran automáticamente para la comprensión de medios, aunque no sean plugins de proveedores incluidos.

    Orden de prioridad de proveedores incluidos (los empates se resuelven alfabéticamente por identificador de proveedor):
    - Imagen: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Vídeo: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI de Antigravity (solo imagen/vídeo)">
    El primer binario `agy` o `antigravity` instalado (se puede anular con `OPENCLAW_ANTIGRAVITY_CLI`), aislado en un entorno restringido al directorio del medio.
  </Step>
</Steps>

Para deshabilitar la detección automática de una capacidad:

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
La detección de binarios se realiza con el máximo esfuerzo posible en macOS/Linux/Windows; asegúrese de que la CLI esté en `PATH` (`~` se expande) o establezca una entrada explícita de modelo de CLI con la ruta completa del comando.
</Note>

### Compatibilidad con proxy (llamadas de proveedores de audio/vídeo)

La comprensión de **audio** y **vídeo** basada en proveedores respeta las variables de entorno estándar de proxy saliente, incluidas las reglas de omisión `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Las variables en minúsculas tienen prioridad sobre las escritas en mayúsculas. Si no se establece ninguna, la comprensión de medios usa una salida directa; si el valor del proxy tiene un formato incorrecto, OpenClaw registra una advertencia y recurre a la obtención directa. La comprensión de imágenes no utiliza esta ruta de proxy.

## Capacidades

Establezca `capabilities` en una entrada de `models[]` para restringirla a tipos de medios específicos. Para las listas compartidas, OpenClaw infiere los valores predeterminados de cada proveedor incluido:

| Proveedor                                                                | Capacidades           |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | imagen                |
| `minimax-portal`                                                         | imagen                |
| `moonshot`                                                               | imagen + vídeo        |
| `openrouter`                                                             | imagen + audio        |
| `google` (API de Gemini)                                                 | imagen + audio + vídeo |
| `qwen`                                                                   | imagen + vídeo        |
| `deepinfra`                                                              | imagen + audio        |
| `mistral`                                                                | audio                 |
| `zai`                                                                    | imagen                |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | audio                 |
| Cualquier catálogo `models.providers.<id>.models[]` con un modelo compatible con imágenes | imagen                 |

Para las entradas de la CLI, establezca `capabilities` explícitamente para evitar coincidencias inesperadas; si se omite, la entrada es apta para todas las listas de capacidades en las que aparezca.

## Matriz de compatibilidad de proveedores

| Capacidad | Proveedores                                                                                                                                               | Notas                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen     | Anthropic, servidor de aplicaciones de Codex, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OAuth de OpenAI Codex, OpenRouter, Qwen, Z.AI, proveedores de configuración | Los plugins de los proveedores registran la compatibilidad con imágenes; `openai/*` puede usar el enrutamiento mediante clave de API u OAuth de Codex; `codex/*` usa un turno acotado del servidor de aplicaciones de Codex; los proveedores de configuración compatibles con imágenes se registran automáticamente. |
| Audio      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transcripción del proveedor (Whisper/Groq/xAI/Deepgram/STT de OpenRouter/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Vídeo      | Google, Moonshot, Qwen                                                                                                                                  | Comprensión de vídeo del proveedor mediante plugins del proveedor; la comprensión de vídeo de Qwen usa los endpoints estándar de DashScope.                                                                        |

<Note>
**Nota sobre MiniMax**: la comprensión de imágenes de `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` siempre proviene del proveedor de medios `MiniMax-VL-01`, propiedad del plugin, incluso si los metadatos heredados del chat de MiniMax M2.x indican que admiten entrada de imágenes.
</Note>

## Orientación para seleccionar modelos

- Prefiera el modelo de la generación actual más potente para cada capacidad multimedia cuando la calidad y la seguridad sean importantes.
- Para agentes con herramientas que procesan entradas no confiables, evite modelos multimedia antiguos o menos potentes.
- Mantenga al menos una alternativa por capacidad para garantizar la disponibilidad (un modelo de calidad y otro más rápido o económico).
- Las alternativas de la CLI (`whisper-cli`, `whisper`, `gemini`) resultan útiles cuando las API de los proveedores no están disponibles.
- Los modos conocidos de salida a archivos son autoritativos: si el archivo de transcripción inferido está vacío o no existe, no se genera ninguna transcripción en lugar de recurrir a la salida de progreso de la CLI.
- `parakeet-mlx`: use `--output-format txt` (o `all`) con `--output-dir` y la plantilla de salida predeterminada `{filename}`. También se respetan las variables de entorno ascendentes `PARAKEET_OUTPUT_FORMAT` y `PARAKEET_OUTPUT_TEMPLATE`. OpenClaw lee `<output-dir>/<media-basename>.txt`; el formato predeterminado `srt`, los demás formatos y las plantillas de salida personalizadas siguen usando stdout.

## Política de archivos adjuntos

La opción `attachments` de cada capacidad controla qué archivos adjuntos se procesan:

<ParamField path="mode" type='"first" | "all"' default="first">
  Procesa solo el primer archivo adjunto seleccionado o todos ellos.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita el número de archivos procesados.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencia de selección entre los archivos adjuntos candidatos.
</ParamField>

Cuando se usa `mode: "all"`, las salidas se etiquetan como `[Imagen 1/2]`, `[Audio 2/2]`, etc.

### Extracción de archivos adjuntos

- El texto extraído de los archivos se encapsula como contenido externo no confiable antes de añadirse al mensaje multimedia, mediante marcadores de límites como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` y una línea de metadatos `Source: External`.
- Esta ruta omite deliberadamente el encabezado largo `SECURITY NOTICE:` para mantener breve el mensaje multimedia; los marcadores de límites y los metadatos siguen aplicándose.
- Un archivo sin texto extraíble recibe `[No extractable text]`.
- Si un PDF recurre a imágenes renderizadas de sus páginas, OpenClaw envía esas imágenes a los modelos de respuesta con capacidad de visión y conserva el marcador `[PDF content rendered to images]` en el bloque del archivo.

## Ejemplos de configuración

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
  <Tab title="Image only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
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

Cuando se ejecuta la comprensión multimedia, `/status` incluye una línea de resumen por capacidad:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Para obtener el inventario previo, ejecute `openclaw capability audio providers`. Las filas locales muestran el proveedor alternativo local seleccionado por separado de la selección global de proveedores, la disponibilidad y los campos independientes de backend compatible, solicitado y observado. La misma selección local está disponible como hallazgo informativo de doctor:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Notas

- La comprensión se realiza en la medida de lo posible. Los errores no bloquean las respuestas.
- Los archivos adjuntos se siguen enviando a los modelos aunque la comprensión esté desactivada.
- Use `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo en mensajes directos).

## Contenido relacionado

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y contenido multimedia](/es/nodes/images)
