---
read_when:
    - Diseño o refactorización de la comprensión multimedia
    - Ajuste del preprocesamiento de audio, vídeo e imágenes entrantes
sidebarTitle: Media understanding
summary: Comprensión de imágenes, audio y vídeo entrantes (opcional) con alternativas de proveedor y CLI
title: Comprensión de medios
x-i18n:
    generated_at: "2026-07-22T10:38:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0948e9b4b59d1006a126a598ced38a9edc2902a01e4dd150717044f91ef57049
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw puede resumir los archivos multimedia entrantes (imagen/audio/video) antes de que se ejecute el pipeline de respuesta, de modo que el análisis de comandos y el enrutamiento trabajen con texto breve en lugar de bytes sin procesar. La comprensión detecta automáticamente las herramientas locales o las claves de proveedores, aunque también se pueden configurar modelos explícitos. Los archivos multimedia originales siempre se entregan al modelo de la forma habitual; cuando la comprensión falla o está deshabilitada, el flujo de respuesta continúa sin cambios.

Los plugins de proveedores registran metadatos de capacidades (qué proveedor admite cada tipo de archivo multimedia, el modelo predeterminado y la prioridad). El núcleo de OpenClaw gestiona la configuración compartida `tools.media`, el orden de respaldo y la integración con el pipeline de respuesta.

## Cómo funciona

<Steps>
  <Step title="Recopilar archivos adjuntos">
    Recopila los archivos adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Seleccionar por capacidad">
    Para cada capacidad habilitada (imagen/audio/video), selecciona los archivos adjuntos según la política `attachments` (valor predeterminado: solo el primer archivo adjunto).
  </Step>
  <Step title="Elegir un modelo">
    Elige la primera entrada de modelo apta (tamaño + capacidad + autenticación disponible).
  </Step>
  <Step title="Usar un respaldo en caso de fallo">
    Si un modelo genera un error, agota el tiempo de espera o el archivo multimedia supera `maxBytes`, prueba la entrada siguiente.
  </Step>
  <Step title="Aplicar en caso de éxito">
    `Body` se convierte en un bloque `[Image]`, `[Audio]` o `[Video]`. El audio también establece `{{Transcript}}`; el análisis de comandos utiliza el texto de la descripción cuando está presente y, en caso contrario, la transcripción. Las descripciones se conservan como `User text:` dentro del bloque.
  </Step>
</Steps>

## Configuración

`tools.media` contiene una lista de modelos etiquetados por capacidad y algunos controles pequeños para cada capacidad:

```json5
{
  tools: {
    media: {
      concurrency: 2, // máximo de ejecuciones simultáneas de capacidades (predeterminado)
      models: [
        { provider: "openai", model: "gpt-4o-mini-transcribe", capabilities: ["audio"] },
        { provider: "google", model: "gemini-3-flash-preview", capabilities: ["image", "video"] },
      ],
      image: { preferredModel: "google/gemini-3-flash-preview" },
      audio: { enabled: true },
      video: { enabled: true },
    },
  },
}
```

Claves por capacidad (`image`/`audio`/`video`):

| Clave              | Tipo      | Valor predeterminado                                | Notas                                                                |
| ---------------- | --------- | -------------------------------------- | -------------------------------------------------------------------- |
| `enabled`        | `boolean` | automático (`false` lo deshabilita)                | Establece `false` para desactivar la detección automática de esta capacidad              |
| `preferredModel` | `string`  | primera entrada compatible                 | Da preferencia a `provider/model`, el id. del modelo, `provider:<id>` o `cli:command` |
| `prompt`         | `string`  | valor predeterminado de la capacidad                     | Prompt predeterminado cuando una entrada no lo sustituye                    |
| `maxChars`       | `number`  | `500` para imagen/video, sin establecer para audio         | Límite de salida predeterminado                                                 |
| `maxBytes`       | `number`  | 10MB para imagen, 20MB para audio, 50MB para video     | Límite de entrada predeterminado                                                  |
| `timeoutSeconds` | `number`  | `60` para imagen/audio, `120` para video          | Tiempo de espera predeterminado de la solicitud                                              |
| `language`       | `string`  | sin establecer                                  | Indicación para la transcripción de audio                                             |
| `scope`          | objeto    | sin establecer                                  | Restringe por canal/tipo de chat/clave de origen                                 |
| `attachments`    | objeto    | `{ mode: "first", maxAttachments: 1 }` | Selecciona qué archivos adjuntos coincidentes se procesan                      |
| `echoTranscript` | `boolean` | `false`                                | Solo audio: muestra la transcripción antes del procesamiento del agente              |
| `echoFormat`     | `string`  | `'📝 "{transcript}"'`                  | Solo audio: formato de la transcripción mostrada                         |

Los prompts, límites, indicaciones de idioma, sustituciones de solicitudes y opciones del proveedor se pueden establecer como valores predeterminados de la capacidad o sustituir en entradas `tools.media.models[]` individuales. Los valores predeterminados de las capacidades también se aplican a los proveedores detectados automáticamente cuando no se configura ningún modelo explícito.

### Entradas de modelos

Cada entrada `models[]` es una entrada de **proveedor** (predeterminada) o una entrada de **CLI**:

<Tabs>
  <Tab title="Entrada de proveedor">
    ```json5
    {
      type: "provider", // valor predeterminado si se omite
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe la imagen en <= 500 caracteres.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"],
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
        "Lee el archivo multimedia en {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Las plantillas de CLI también pueden utilizar `{{MediaDir}}` (directorio que contiene el archivo multimedia), `{{OutputDir}}` (directorio temporal creado para esta ejecución) y `{{OutputBase}}` (ruta base del archivo temporal, sin extensión).

  </Tab>
</Tabs>

### Credenciales del proveedor

La comprensión de archivos multimedia mediante proveedores utiliza la misma resolución de autenticación que las llamadas normales al modelo: perfiles de autenticación, variables de entorno y, después, `models.providers.<providerId>.apiKey`. Las entradas `tools.media.models[]` no aceptan un campo `apiKey` insertado directamente.

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

Consulta [Herramientas y proveedores personalizados](/es/gateway/config-tools) para obtener información sobre perfiles, variables de entorno y URL base personalizadas.

## Reglas y comportamiento

- Los archivos multimedia que superan `maxBytes` omiten ese modelo y prueban el siguiente.
- Los archivos de audio de menos de 1024 bytes se consideran vacíos o dañados y se omiten antes de la transcripción; en su lugar, el agente recibe una transcripción de marcador de posición determinista.
- Si el modelo de imagen principal activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original directamente al modelo. MiniMax es una excepción: `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` siempre enrutan la comprensión de imágenes mediante el proveedor multimedia `MiniMax-VL-01` perteneciente al plugin, incluso si los metadatos heredados del chat de MiniMax M2.x declaran que admite entradas de imagen (solo `MiniMax-M3` y versiones posteriores se consideran compatibles con visión de forma nativa).
- Si un modelo principal de Gateway/WebChat solo admite texto, los archivos adjuntos de imagen se conservan como referencias `media://inbound/*` descargadas, para que las herramientas de imagen/PDF o un modelo de imagen configurado puedan seguir inspeccionándolos en lugar de perder el archivo adjunto.
- El valor explícito `openclaw infer image describe --file <path> --model <provider/model>` (alias: `openclaw capability image describe`) ejecuta directamente ese proveedor/modelo compatible con imágenes, incluidas referencias de Ollama como `ollama/qwen2.5vl:7b` cuando se configura un modelo compatible con imágenes coincidente en `models.providers.ollama.models[]`.
- Si `<capability>.enabled` no es `false`, pero no hay modelos configurados, OpenClaw prueba el modelo de respuesta activo cuando su proveedor admite la capacidad.

### Detección automática (predeterminada)

Cuando `tools.media.<capability>.enabled` no es `false` y no hay modelos configurados, OpenClaw prueba las siguientes opciones en orden y se detiene en la primera que funciona:

<Steps>
  <Step title="Modelo de imagen configurado (solo imagen)">
    Referencias principales/de respaldo de `agents.defaults.imageModel`, salvo que el modelo de respuesta activo ya admita visión de forma nativa. Se da preferencia a las referencias `provider/model`; las referencias simples solo se completan a partir de entradas configuradas de modelos de proveedores compatibles con imágenes cuando la coincidencia es única.
  </Step>
  <Step title="Modelo de respuesta activo">
    El modelo de respuesta activo, cuando su proveedor admite la capacidad.
  </Step>
  <Step title="Autenticación del proveedor (solo audio, antes de las CLI locales)">
    Las entradas `models.providers.*` configuradas que admiten audio se prueban antes que las CLI locales. Orden de prioridad de los proveedores incluidos (los empates se resuelven alfabéticamente por id. de proveedor): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="CLI locales (solo audio)">
    Los binarios locales disponibles forman una lista de respaldo ordenada:
    - `whisper-cli` primero, solo después de que una invocación anterior del modelo en el proceso actual haya observado Metal o CUDA
    - `sherpa-onnx-offline` con CPU de forma predeterminada (requiere `SHERPA_ONNX_MODEL_DIR` con `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` cuando la aceleración solo está disponible en la compilación o no se ha observado
    - `parakeet-mlx` en Apple Silicon (compatible con MLX, uso del dispositivo no observado)
    - `whisper` (CLI de Python; utiliza de forma predeterminada el modelo `turbo` y lo descarga automáticamente)

    La inspección de capacidades del backend se almacena en caché y no carga ningún modelo. La capacidad de compilación, las opciones del backend solicitadas y el backend observado en una invocación real se mantienen separados. whisper.cpp detectado automáticamente mantiene habilitados los registros de ejecución del modelo para que se pueda registrar la línea del backend seleccionado por el proyecto de origen. Las entradas de CLI explícitas mantienen el orden, las opciones del backend y las opciones de salida configurados.

  </Step>
  <Step title="Autenticación del proveedor (imagen/video)">
    Las entradas `models.providers.*` configuradas que admiten la capacidad se prueban antes del orden de respaldo incluido. Los proveedores de configuración exclusivos para imágenes que dispongan de un modelo compatible con imágenes se registran automáticamente para la comprensión de archivos multimedia, aunque no sean plugins de proveedor incluidos.

    Orden de prioridad de los proveedores incluidos (los empates se resuelven alfabéticamente por id. de proveedor):
    - Imagen: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI de Antigravity (solo imagen/video)">
    El primer binario `agy` o `antigravity` instalado (se puede sustituir con `OPENCLAW_ANTIGRAVITY_CLI`), aislado en un entorno restringido respecto al directorio del archivo multimedia.
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
La detección de binarios se realiza en la medida de lo posible en macOS/Linux/Windows; se debe garantizar que la CLI esté en `PATH` (`~` se expande), o establecer una entrada de modelo de CLI explícita con la ruta completa del comando.
</Note>

### Compatibilidad con proxy (llamadas del proveedor para audio/video)

La comprensión de **audio** y **video** basada en proveedores respeta las variables de entorno estándar de proxy de salida, incluidas las reglas de omisión `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Las variables en minúsculas tienen prioridad sobre las escritas en mayúsculas. Si no se establece ninguna, la comprensión de archivos multimedia utiliza una salida directa; si el valor del proxy tiene un formato incorrecto, OpenClaw registra una advertencia y recurre a una solicitud directa. La comprensión de imágenes no utiliza esta ruta de proxy.

## Capacidades

Establece `capabilities` en una entrada `models[]` para restringirla a tipos específicos de archivos multimedia. En las listas compartidas, OpenClaw deduce los valores predeterminados de cada proveedor incluido:

| Proveedor                                                                | Capacidades           |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | imagen                |
| `minimax-portal`                                                         | imagen                |
| `moonshot`                                                               | imagen + vídeo        |
| `openrouter`                                                             | imagen + audio        |
| `google` (API de Gemini)                                                    | imagen + audio + vídeo |
| `qwen`                                                                   | imagen + vídeo        |
| `deepinfra`                                                              | imagen + audio        |
| `mistral`                                                                | audio                 |
| `zai`                                                                    | imagen                |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | audio                 |
| Cualquier catálogo de `models.providers.<id>.models[]` con un modelo compatible con imágenes | imagen                 |

Para las entradas de la CLI, establezca `capabilities` explícitamente para evitar coincidencias inesperadas; si se omite, la entrada puede utilizarse en todas las listas de capacidades en las que aparezca.

## Matriz de compatibilidad de proveedores

| Capacidad | Proveedores                                                                                                                                               | Notas                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen     | Anthropic, servidor de aplicaciones Codex, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OAuth de OpenAI Codex, OpenRouter, Qwen, Z.AI, proveedores de configuración | Los plugins de los proveedores registran la compatibilidad con imágenes; `openai/*` puede usar el enrutamiento mediante clave de API u OAuth de Codex; `codex/*` usa un turno limitado del servidor de aplicaciones Codex; los proveedores de configuración compatibles con imágenes se registran automáticamente. |
| Audio      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transcripción del proveedor (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Vídeo      | Google, Moonshot, Qwen                                                                                                                                  | Comprensión de vídeo del proveedor mediante plugins del proveedor; la comprensión de vídeo de Qwen usa los endpoints estándar de DashScope.                                                                        |

<Note>
**Nota sobre MiniMax**: la comprensión de imágenes de `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` siempre procede del proveedor de medios `MiniMax-VL-01`, propiedad del plugin, incluso si los metadatos heredados del chat MiniMax M2.x indican que admite la entrada de imágenes.
</Note>

## Orientación para seleccionar modelos

- Cuando la calidad y la seguridad sean importantes, utilice el modelo más potente de la generación actual para cada capacidad multimedia.
- Para los agentes con herramientas que procesan entradas no confiables, evite los modelos multimedia antiguos o menos potentes.
- Mantenga al menos una alternativa por capacidad para garantizar la disponibilidad (un modelo de calidad y otro más rápido o económico).
- Las alternativas de la CLI (`whisper-cli`, `whisper`, `gemini`) resultan útiles cuando las API de los proveedores no están disponibles.
- Los modos conocidos de salida a archivos son autoritativos: si el archivo de transcripción inferido falta o está vacío, no se genera ninguna transcripción en lugar de recurrir a la salida de progreso de la CLI.
- `parakeet-mlx`: use `--output-format txt` (o `all`) con `--output-dir` y la plantilla de salida predeterminada `{filename}`. También se respetan las variables de entorno `PARAKEET_OUTPUT_FORMAT` y `PARAKEET_OUTPUT_TEMPLATE` del proyecto de origen. OpenClaw lee `<output-dir>/<media-basename>.txt`; el formato predeterminado `srt`, los demás formatos y las plantillas de salida personalizadas siguen usando stdout.

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

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

### Extracción de archivos adjuntos

- El texto extraído del archivo se encapsula como contenido externo no confiable antes de añadirse al prompt multimedia mediante marcadores de límite como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, además de una línea de metadatos `Source: External`.
- Esta ruta omite deliberadamente el aviso largo `SECURITY NOTICE:` para mantener breve el prompt multimedia; los marcadores de límite y los metadatos siguen aplicándose.
- Un archivo sin texto extraíble recibe `[No extractable text]`.
- Si un PDF recurre a imágenes renderizadas de sus páginas, OpenClaw reenvía esas imágenes a los modelos de respuesta compatibles con visión y conserva el marcador de posición `[PDF content rendered to images]` en el bloque del archivo.

## Ejemplos de configuración

<Tabs>
  <Tab title="Modelos compartidos y anulaciones">
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
                "Lee el contenido multimedia de {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
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
  <Tab title="Solo audio y vídeo">
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
                  "Lee el contenido multimedia de {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
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
                  "Lee el contenido multimedia de {{MediaPath}} y descríbelo en <= {{MaxChars}} caracteres.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Una sola entrada multimodal">
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
📎 Contenido multimedia: imagen correcta (openai/gpt-5.6-sol) · audio correcto (whisper-cli observado=metal)
```

Para obtener el inventario de comprobación previa, ejecute `openclaw capability audio providers`. Las filas locales muestran por separado la alternativa local seleccionada, la selección global del proveedor, la disponibilidad y los campos independientes de backend compatible, solicitado y observado. La misma selección local está disponible como hallazgo informativo del diagnóstico:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Notas

- La comprensión se realiza con el mejor esfuerzo posible. Los errores no bloquean las respuestas.
- Los archivos adjuntos se siguen pasando a los modelos incluso cuando la comprensión está desactivada.
- Use `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo en mensajes directos).

## Contenido relacionado

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y contenido multimedia](/es/nodes/images)
