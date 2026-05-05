---
read_when:
    - Generar videos mediante el agente
    - Configuración de proveedores y modelos de generación de video
    - Comprender los parámetros de la herramienta video_generate
sidebarTitle: Video generation
summary: Genera videos mediante video_generate a partir de referencias de texto, imagen o video en 16 servicios de proveedor
title: Generación de video
x-i18n:
    generated_at: "2026-05-05T06:16:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agents can generate videos from text prompts, reference images, or
existing videos. Sixteen provider backends are supported, each with
different model options, input modes, and feature sets. The agent picks the
right provider automatically based on your configuration and available API
keys.

<Note>
The `video_generate` tool only appears when at least one video-generation
provider is available. If you do not see it in your agent tools, set a
provider API key or configure `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw treats video generation as three runtime modes:

- `generate` — text-to-video requests with no reference media.
- `imageToVideo` — request includes one or more reference images.
- `videoToVideo` — request includes one or more reference videos.

Providers can support any subset of those modes. The tool validates the
active mode before submission and reports supported modes in `action=list`.

## Quick start

<Steps>
  <Step title="Configure auth">
    Set an API key for any supported provider:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > Generate a 5-second cinematic video of a friendly lobster surfing at sunset.

    The agent calls `video_generate` automatically. No tool allowlisting
    is needed.

  </Step>
</Steps>

## How async generation works

Video generation is asynchronous. When the agent calls `video_generate` in a
session:

1. OpenClaw submits the request to the provider and immediately returns a task id.
2. The provider processes the job in the background (typically 30 seconds to several minutes depending on the provider and resolution; slow queue-backed providers can run up to the configured timeout).
3. When the video is ready, OpenClaw wakes the same session with an internal completion event.
4. The agent tells the user and attaches the finished video. In group/channel
   chats that use message-tool-only visible delivery, the agent relays the
   result through the message tool instead of OpenClaw posting it directly.

While a job is in flight, duplicate `video_generate` calls in the same
session return the current task status instead of starting another
generation. Use `openclaw tasks list` or `openclaw tasks show <taskId>` to
check progress from the CLI.

Outside of session-backed agent runs (for example, direct tool invocations),
the tool falls back to inline generation and returns the final media path
in the same turn.

Generated video files are saved under OpenClaw-managed media storage when
the provider returns bytes. The default generated-video save cap follows
the video media limit, and `agents.defaults.mediaMaxMb` raises it for
larger renders. When a provider also returns a hosted output URL, OpenClaw
can deliver that URL instead of failing the task if local persistence
rejects an oversized file.

### Task lifecycle

| State       | Meaning                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Task created, waiting for the provider to accept it.                                                   |
| `running`   | Provider is processing (typically 30 seconds to several minutes depending on provider and resolution). |
| `succeeded` | Video ready; the agent wakes and posts it to the conversation.                                         |
| `failed`    | Provider error or timeout; the agent wakes with error details.                                         |

Check status from the CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

If a video task is already `queued` or `running` for the current session,
`video_generate` returns the existing task status instead of starting a new
one. Use `action: "status"` to check explicitly without triggering a new
generation.

## Supported providers

| Provider              | Default model                   | Text | Image ref                                            | Video ref                                       | Auth                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Yes (remote URL)                                     | Yes (remote URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Up to 2 images (I2V models only; first + last frame) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Up to 2 images (first + last frame via role)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Up to 9 reference images                             | Up to 3 videos                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 image                                              | —                                               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 image; up to 9 with Seedance reference-to-video    | Up to 3 videos with Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 image                                              | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 image                                              | —                                               | `MINIMAX_API_KEY` or MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 image                                              | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Up to 4 images (first/last frame or references)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Yes (remote URL)                                     | Yes (remote URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 image                                              | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 image                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 image (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 first-frame image or up to 7 `reference_image`s    | 1 video                                         | `XAI_API_KEY`                            |

Some providers accept additional or alternate API key env vars. See
individual [provider pages](#related) for details.

Run `video_generate action=list` to inspect available providers, models, and
runtime modes at runtime.

### Capability matrix

The explicit mode contract used by `video_generate`, contract tests, and
the shared live sweep:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes today                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider needs remote `http(s)` video URLs                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Not in the shared sweep; workflow-specific coverage lives with Comfy tests                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; native DeepInfra video schemas are text-to-video in the bundled contract                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` only when using Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; shared `videoToVideo` skipped because the current buffer-backed Gemini/Veo sweep does not accept that input  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; shared `videoToVideo` skipped because this org/input path currently needs provider-side inpaint/remix access |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider needs remote `http(s)` video URLs                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` runs only when the selected model is `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; shared `imageToVideo` skipped because bundled `veo3` is text-only and bundled `kling` requires a remote image URL            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider currently needs a remote MP4 URL                                |

## Tool parameters

### Required

<ParamField path="prompt" type="string" required>
  Text description of the video to generate. Required for `action: "generate"`.
</ParamField>

### Content inputs

<ParamField path="image" type="string">Una sola imagen de referencia (ruta o URL).</ParamField>
<ParamField path="images" type="string[]">Varias imágenes de referencia (hasta 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Indicaciones de rol opcionales por posición, paralelas a la lista combinada de imágenes.
Valores canónicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Un solo video de referencia (ruta o URL).</ParamField>
<ParamField path="videos" type="string[]">Varios videos de referencia (hasta 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Indicaciones de rol opcionales por posición, paralelas a la lista combinada de videos.
Valor canónico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Un solo audio de referencia (ruta o URL). Se usa para música de fondo o como
referencia de voz cuando el proveedor admite entradas de audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Varios audios de referencia (hasta 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indicaciones de rol opcionales por posición, paralelas a la lista combinada de audios.
Valor canónico: `reference_audio`.
</ParamField>

<Note>
Las indicaciones de rol se reenvían al proveedor tal cual. Los valores canónicos proceden de
la unión `VideoGenerationAssetRole`, pero los proveedores pueden aceptar cadenas de rol
adicionales. Los arreglos `*Roles` no deben tener más entradas que la lista de referencias
correspondiente; los errores por desfase de uno fallan con un error claro.
Usa una cadena vacía para dejar un espacio sin definir. Para xAI, establece cada rol de imagen en
`reference_image` para usar su modo de generación `reference_images`; omite el
rol o usa `first_frame` para imagen a video con una sola imagen.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  Indicación de relación de aspecto como `1:1`, `16:9`, `9:16`, `adaptive` o un valor específico del proveedor. OpenClaw normaliza o ignora los valores no admitidos según el proveedor.
</ParamField>
<ParamField path="resolution" type="string">Indicación de resolución como `480P`, `720P`, `768P`, `1080P`, `4K` o un valor específico del proveedor. OpenClaw normaliza o ignora los valores no admitidos según el proveedor.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos (redondeada al valor admitido más cercano por el proveedor).
</ParamField>
<ParamField path="size" type="string">Indicación de tamaño cuando el proveedor la admite.</ParamField>
<ParamField path="audio" type="boolean">
  Activa el audio generado en la salida cuando sea compatible. Es distinto de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Activa o desactiva la marca de agua del proveedor cuando sea compatible.</ParamField>

`adaptive` es un centinela específico del proveedor: se reenvía tal cual a
los proveedores que declaran `adaptive` en sus capacidades (por ejemplo, BytePlus
Seedance lo usa para detectar automáticamente la relación a partir de las dimensiones
de la imagen de entrada). Los proveedores que no lo declaran muestran el valor mediante
`details.ignoredOverrides` en el resultado de la herramienta para que la omisión sea visible.

### Avanzado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea de sesión actual; `"list"` inspecciona los proveedores.
</ParamField>
<ParamField path="model" type="string">Anulación de proveedor/modelo (por ejemplo, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indicación del nombre de archivo de salida.</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional de la operación del proveedor en milisegundos.</ParamField>
<ParamField path="providerOptions" type="object">
  Opciones específicas del proveedor como objeto JSON (por ejemplo, `{"seed": 42, "draft": true}`).
  Los proveedores que declaran un esquema tipado validan las claves y los tipos; las claves
  desconocidas o las discrepancias omiten el candidato durante la reserva. Los proveedores sin un
  esquema declarado reciben las opciones tal cual. Ejecuta `video_generate action=list`
  para ver qué acepta cada proveedor.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw normaliza la duración al
valor compatible más cercano del proveedor y reasigna indicaciones de geometría traducidas
como tamaño a relación de aspecto cuando un proveedor de reserva expone una superficie de control
diferente. Las anulaciones realmente no admitidas se ignoran con el máximo esfuerzo
y se notifican como advertencias en el resultado de la herramienta. Los límites estrictos de capacidad
(como demasiadas entradas de referencia) fallan antes del envío. Los resultados de la herramienta
informan los ajustes aplicados; `details.normalization` captura cualquier
traducción de solicitado a aplicado.
</Note>

Las entradas de referencia seleccionan el modo de ejecución:

- Sin medios de referencia → `generate`
- Cualquier referencia de imagen → `imageToVideo`
- Cualquier referencia de video → `videoToVideo`
- Las entradas de audio de referencia **no** cambian el modo resuelto; se aplican
  encima del modo que seleccionen las referencias de imagen/video, y solo funcionan
  con proveedores que declaran `maxInputAudios`.

Las referencias mixtas de imagen y video no son una superficie de capacidad compartida estable.
Prefiere un tipo de referencia por solicitud.

#### Reserva y opciones tipadas

Algunas comprobaciones de capacidad se aplican en la capa de reserva en lugar de en el
límite de la herramienta, por lo que una solicitud que excede los límites del proveedor principal
aún puede ejecutarse en una reserva capaz:

- Se omite un candidato activo que no declara `maxInputAudios` (o declara `0`) cuando
  la solicitud contiene referencias de audio; se intenta con el siguiente candidato.
- El `maxDurationSeconds` del candidato activo está por debajo del `durationSeconds` solicitado
  sin una lista declarada de `supportedDurationSeconds` → se omite.
- La solicitud contiene `providerOptions` y el candidato activo declara explícitamente
  un esquema tipado de `providerOptions` → se omite si las claves suministradas
  no están en el esquema o los tipos de valor no coinciden. Los proveedores sin un
  esquema declarado reciben las opciones tal cual (paso directo
  retrocompatible). Un proveedor puede excluir todas las opciones de proveedor
  declarando un esquema vacío (`capabilities.providerOptions: {}`), lo que
  causa la misma omisión que una discrepancia de tipo.

El primer motivo de omisión en una solicitud se registra en `warn` para que los operadores vean cuándo
se pasó por alto su proveedor principal; las omisiones posteriores se registran en `debug` para
mantener silenciosas las cadenas de reserva largas. Si se omiten todos los candidatos, el
error agregado incluye el motivo de omisión de cada uno.

## Acciones

| Acción     | Qué hace                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Predeterminada. Crea un video a partir del prompt dado y entradas de referencia opcionales.              |
| `status`   | Comprueba el estado de la tarea de video en curso de la sesión actual sin iniciar otra generación.        |
| `list`     | Muestra los proveedores, modelos y sus capacidades disponibles.                                          |

## Selección de modelo

OpenClaw resuelve el modelo en este orden:

1. **Parámetro de herramienta `model`** — si el agente especifica uno en la llamada.
2. **`videoGenerationModel.primary`** desde la configuración.
3. **`videoGenerationModel.fallbacks`** en orden.
4. **Detección automática** — proveedores que tienen autenticación válida, empezando por el
   proveedor predeterminado actual y luego los proveedores restantes en orden
   alfabético.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si todos
los candidatos fallan, el error incluye detalles de cada intento.

Establece `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
solo las entradas explícitas de `model`, `primary` y `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Notas de proveedores

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa el endpoint asíncrono de DashScope / Model Studio. Las imágenes y
    videos de referencia deben ser URL `http(s)` remotas.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID de proveedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (predeterminado),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Los modelos T2V (`*-t2v-*`) no aceptan entradas de imagen; los modelos I2V y
    los modelos generales `*-pro-*` admiten una sola imagen de referencia (primer
    fotograma). Pasa la imagen posicionalmente o establece `role: "first_frame"`.
    Los ID de modelo T2V se cambian automáticamente a la variante I2V
    correspondiente cuando se proporciona una imagen.

    Claves de `providerOptions` admitidas: `seed` (número), `draft` (booleano —
    fuerza 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID de proveedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Usa la API unificada `content[]`. Admite como máximo 2 imágenes de entrada
    (`first_frame` + `last_frame`). Todas las entradas deben ser URL `https://`
    remotas. Establece `role: "first_frame"` / `"last_frame"` en cada imagen, o
    pasa las imágenes posicionalmente.

    `aspectRatio: "adaptive"` detecta automáticamente la relación a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (número) se reenvía.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID de proveedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa la API unificada `content[]`. Admite hasta 9 imágenes de referencia,
    3 videos de referencia y 3 audios de referencia. Todas las entradas deben ser URL
    `https://` remotas. Establece `role` en cada recurso — valores admitidos:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automáticamente la relación a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (número) se reenvía.

  </Accordion>
  <Accordion title="ComfyUI">
    Ejecución local o en la nube impulsada por flujos de trabajo. Admite texto a video e
    imagen a video mediante el grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa un flujo respaldado por cola para trabajos de larga duración. OpenClaw espera hasta 20
    minutos de forma predeterminada antes de tratar un trabajo de cola de fal en curso como agotado
    por tiempo de espera. La mayoría de los modelos de video de fal
    aceptan una sola referencia de imagen. Los modelos de referencia a video
    Seedance 2.0 aceptan hasta 9 imágenes, 3 videos y 3 referencias de audio, con
    un máximo de 12 archivos de referencia en total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Admite una referencia de imagen o una referencia de video. Las solicitudes de audio generado se
    ignoran con una advertencia en la ruta de la API de Gemini porque esa API rechaza
    el parámetro `generateAudio` para la generación de video de Veo actual.
  </Accordion>
  <Accordion title="MiniMax">
    Solo una referencia de imagen. MiniMax acepta resoluciones `768P` y `1080P`;
    solicitudes como `720P` se normalizan al valor admitido más cercano
    antes del envío.
  </Accordion>
  <Accordion title="OpenAI">
    Solo se reenvía la anulación de `size`. Otras anulaciones de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) se ignoran con
    una advertencia.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa la API `/videos` asíncrona de OpenRouter. OpenClaw envía el
    trabajo, consulta `polling_url` y descarga `unsigned_urls` o el
    endpoint documentado de contenido del trabajo. El valor predeterminado incluido `google/veo-3.1-fast`
    anuncia duraciones de 4/6/8 segundos, resoluciones `720P`/`1080P` y
    relaciones de aspecto `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    El mismo backend de DashScope que Alibaba. Las entradas de referencia deben ser URL remotas
    `http(s)`; los archivos locales se rechazan por adelantado.
  </Accordion>
  <Accordion title="Runway">
    Admite archivos locales mediante URI de datos. Video a video requiere
    `runway/gen4_aleph`. Las ejecuciones solo de texto exponen relaciones de aspecto
    `16:9` y `9:16`.
  </Accordion>
  <Accordion title="Together">
    Solo una referencia de imagen.
  </Accordion>
  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` directamente para evitar redirecciones que
    descartan la autenticación. `veo3` se incluye solo como texto a video; `kling` requiere
    una URL de imagen remota.
  </Accordion>
  <Accordion title="xAI">
    Admite texto a video, imagen a video con una sola imagen de primer fotograma, hasta 7
    entradas `reference_image` mediante `reference_images` de xAI, y flujos remotos
    de edición/extensión de video.
  </Accordion>
</AccordionGroup>

## Modos de capacidad del proveedor

El contrato compartido de generación de video admite capacidades específicas de modo
en lugar de solo límites agregados planos. Las nuevas implementaciones de proveedores
deben preferir bloques de modo explícitos:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Los campos agregados planos como `maxInputImages` y `maxInputVideos` **no**
bastan para anunciar compatibilidad con modos de transformación. Los proveedores deben
declarar `generate`, `imageToVideo` y `videoToVideo` explícitamente para que las pruebas
en vivo, las pruebas de contrato y la herramienta compartida `video_generate` puedan validar
la compatibilidad de modos de forma determinista.

Cuando un modelo de un proveedor tenga compatibilidad de entrada de referencia más amplia que el
resto, usa `maxInputImagesByModel`, `maxInputVideosByModel` o
`maxInputAudiosByModel` en lugar de aumentar el límite para todo el modo.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos incluidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media video
```

Este archivo en vivo carga variables de entorno de proveedor faltantes desde `~/.profile`, prefiere
claves de API en vivo/de entorno antes que perfiles de autenticación almacenados de forma predeterminada, y ejecuta un
smoke seguro para releases de forma predeterminada:

- `generate` para cada proveedor que no sea FAL en el barrido.
- Prompt de langosta de un segundo.
- Límite de operación por proveedor de
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada).

FAL es opcional porque la latencia de cola del lado del proveedor puede dominar el tiempo de
release:

```bash
pnpm test:live:media video --video-providers fal
```

Define `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los
modos de transformación declarados que el barrido compartido pueda ejercer de forma segura con medios locales:

- `imageToVideo` cuando `capabilities.imageToVideo.enabled`.
- `videoToVideo` cuando `capabilities.videoToVideo.enabled` y el
  proveedor/modelo acepte entrada de video local respaldada por búfer en el barrido
  compartido.

Actualmente, el carril en vivo compartido `videoToVideo` cubre `runway` solo cuando
seleccionas `runway/gen4_aleph`.

## Configuración

Define el modelo predeterminado de generación de video en tu configuración de OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

O mediante la CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Relacionado

- [Alibaba Model Studio](/es/providers/alibaba)
- [Tareas en segundo plano](/es/automation/tasks) — seguimiento de tareas para generación de video asíncrona
- [BytePlus](/es/concepts/model-providers#byteplus-international)
- [ComfyUI](/es/providers/comfy)
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults)
- [fal](/es/providers/fal)
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models)
- [OpenAI](/es/providers/openai)
- [Qwen](/es/providers/qwen)
- [Runway](/es/providers/runway)
- [Together AI](/es/providers/together)
- [Resumen de herramientas](/es/tools)
- [Vydra](/es/providers/vydra)
- [xAI](/es/providers/xai)
