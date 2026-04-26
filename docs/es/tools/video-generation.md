---
read_when:
    - Generar videos mediante el agente
    - Configurar proveedores y modelos de generación de video
    - Comprender los parámetros de la herramienta `video_generate`
sidebarTitle: Video generation
summary: Genera videos mediante `video_generate` a partir de referencias de texto, imagen o video en 14 backends de proveedores
title: Generación de video
x-i18n:
    generated_at: "2026-04-26T11:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

Los agentes de OpenClaw pueden generar videos a partir de prompts de texto, imágenes de referencia o
videos existentes. Se admiten catorce backends de proveedores, cada uno con
distintas opciones de modelo, modos de entrada y conjuntos de funciones. El agente elige el
proveedor adecuado automáticamente según tu configuración y las claves de API disponibles.

<Note>
La herramienta `video_generate` solo aparece cuando al menos un proveedor de generación de video
está disponible. Si no la ves en las herramientas de tu agente, establece una
clave de API del proveedor o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw trata la generación de video como tres modos de runtime:

- `generate` — solicitudes de texto a video sin medios de referencia.
- `imageToVideo` — la solicitud incluye una o más imágenes de referencia.
- `videoToVideo` — la solicitud incluye uno o más videos de referencia.

Los proveedores pueden admitir cualquier subconjunto de esos modos. La herramienta valida el
modo activo antes del envío e informa los modos admitidos en `action=list`.

## Inicio rápido

<Steps>
  <Step title="Configura la autenticación">
    Establece una clave de API para cualquier proveedor compatible:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Elige un modelo predeterminado (opcional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Pídele al agente">
    > Genera un video cinematográfico de 5 segundos de una langosta amistosa haciendo surf al atardecer.

    El agente llama a `video_generate` automáticamente. No se necesita lista de herramientas permitidas.

  </Step>
</Steps>

## Cómo funciona la generación asíncrona

La generación de video es asíncrona. Cuando el agente llama a `video_generate` en una
sesión:

1. OpenClaw envía la solicitud al proveedor y devuelve inmediatamente un ID de tarea.
2. El proveedor procesa el trabajo en segundo plano (normalmente entre 30 segundos y 5 minutos, según el proveedor y la resolución).
3. Cuando el video está listo, OpenClaw reactiva la misma sesión con un evento interno de finalización.
4. El agente publica el video terminado de vuelta en la conversación original.

Mientras un trabajo está en curso, las llamadas duplicadas a `video_generate` en la misma
sesión devuelven el estado actual de la tarea en lugar de iniciar otra
generación. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` para
consultar el progreso desde la CLI.

Fuera de las ejecuciones del agente respaldadas por sesión (por ejemplo, invocaciones directas de herramientas),
la herramienta recurre a la generación en línea y devuelve la ruta final del medio
en el mismo turno.

Los archivos de video generados se guardan en el almacenamiento de medios administrado por OpenClaw cuando
el proveedor devuelve bytes. El límite predeterminado de guardado de videos generados sigue
el límite de medios de video, y `agents.defaults.mediaMaxMb` lo aumenta para
renders más grandes. Cuando un proveedor también devuelve una URL de salida alojada, OpenClaw
puede entregar esa URL en lugar de marcar la tarea como fallida si la persistencia local
rechaza un archivo sobredimensionado.

### Ciclo de vida de la tarea

| Estado      | Significado                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Tarea creada, en espera de que el proveedor la acepte.                                           |
| `running`   | El proveedor está procesando (normalmente entre 30 segundos y 5 minutos, según el proveedor y la resolución). |
| `succeeded` | El video está listo; el agente se reactiva y lo publica en la conversación.                      |
| `failed`    | Error o tiempo de espera del proveedor; el agente se reactiva con detalles del error.            |

Consulta el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Si ya hay una tarea de video en `queued` o `running` para la sesión actual,
`video_generate` devuelve el estado de la tarea existente en lugar de iniciar una nueva.
Usa `action: "status"` para comprobarlo explícitamente sin activar una nueva
generación.

## Proveedores compatibles

| Proveedor             | Modelo predeterminado            | Texto | Referencia de imagen                                 | Referencia de video                              | Autenticación                           |
| --------------------- | -------------------------------- | :---: | ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| Alibaba               | `wan2.6-t2v`                     |  ✓    | Sí (URL remota)                                      | Sí (URL remota)                                  | `MODELSTUDIO_API_KEY`                  |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`        |  ✓    | Hasta 2 imágenes (solo modelos I2V; primer y último fotograma) | —                                        | `BYTEPLUS_API_KEY`                     |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`        |  ✓    | Hasta 2 imágenes (primer y último fotograma mediante rol) | —                                           | `BYTEPLUS_API_KEY`                     |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`   |  ✓    | Hasta 9 imágenes de referencia                       | Hasta 3 videos                                  | `BYTEPLUS_API_KEY`                     |
| ComfyUI               | `workflow`                       |  ✓    | 1 imagen                                             | —                                               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`   |  ✓    | 1 imagen; hasta 9 con referencia a video de Seedance | Hasta 3 videos con referencia a video de Seedance | `FAL_KEY`                            |
| Google                | `veo-3.1-fast-generate-preview`  |  ✓    | 1 imagen                                             | 1 video                                         | `GEMINI_API_KEY`                       |
| MiniMax               | `MiniMax-Hailuo-2.3`             |  ✓    | 1 imagen                                             | —                                               | `MINIMAX_API_KEY` o MiniMax OAuth      |
| OpenAI                | `sora-2`                         |  ✓    | 1 imagen                                             | 1 video                                         | `OPENAI_API_KEY`                       |
| Qwen                  | `wan2.6-t2v`                     |  ✓    | Sí (URL remota)                                      | Sí (URL remota)                                  | `QWEN_API_KEY`                         |
| Runway                | `gen4.5`                         |  ✓    | 1 imagen                                             | 1 video                                         | `RUNWAYML_API_SECRET`                  |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`         |  ✓    | 1 imagen                                             | —                                               | `TOGETHER_API_KEY`                     |
| Vydra                 | `veo3`                           |  ✓    | 1 imagen (`kling`)                                   | —                                               | `VYDRA_API_KEY`                        |
| xAI                   | `grok-imagine-video`             |  ✓    | 1 imagen de primer fotograma o hasta 7 `reference_image`s | 1 video                                    | `XAI_API_KEY`                          |

Algunos proveedores aceptan variables de entorno de clave de API adicionales o alternativas. Consulta las
[ páginas de proveedores ](#related) individuales para más detalles.

Ejecuta `video_generate action=list` para inspeccionar en tiempo de ejecución los proveedores, modelos y
modos de runtime disponibles.

### Matriz de capacidades

El contrato explícito de modos usado por `video_generate`, las pruebas de contrato y
el barrido compartido en vivo:

| Proveedor | `generate` | `imageToVideo` | `videoToVideo` | Lanes compartidos en vivo actualmente                                                                                                    |
| --------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL remotas de video `http(s)`                       |
| BytePlus  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI   |     ✓      |       ✓        |       —        | No está en el barrido compartido; la cobertura específica del flujo de trabajo vive con las pruebas de Comfy                            |
| fal       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo cuando se usa referencia a video de Seedance                                            |
| Google    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque el barrido actual de Gemini/Veo respaldado por búfer no acepta esa entrada |
| MiniMax   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque esta ruta actual de organización/entrada necesita acceso del lado del proveedor a inpaint/remix |
| Qwen      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL remotas de video `http(s)`                      |
| Runway    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo se ejecuta cuando el modelo seleccionado es `runway/gen4_aleph`                        |
| Together  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra     |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` compartido se omite porque `veo3` integrado es solo de texto y `kling` integrado requiere una URL de imagen remota |
| xAI       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor actualmente necesita una URL MP4 remota                      |

## Parámetros de la herramienta

### Obligatorios

<ParamField path="prompt" type="string" required>
  Descripción textual del video que se va a generar. Obligatorio para `action: "generate"`.
</ParamField>

### Entradas de contenido

<ParamField path="image" type="string">Imagen de referencia única (ruta o URL).</ParamField>
<ParamField path="images" type="string[]">Varias imágenes de referencia (hasta 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Sugerencias opcionales de rol por posición en paralelo a la lista combinada de imágenes.
Valores canónicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Video de referencia único (ruta o URL).</ParamField>
<ParamField path="videos" type="string[]">Varios videos de referencia (hasta 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Sugerencias opcionales de rol por posición en paralelo a la lista combinada de videos.
Valor canónico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Audio de referencia único (ruta o URL). Se usa para música de fondo o referencia de voz
cuando el proveedor admite entradas de audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Varios audios de referencia (hasta 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Sugerencias opcionales de rol por posición en paralelo a la lista combinada de audios.
Valor canónico: `reference_audio`.
</ParamField>

<Note>
Las sugerencias de rol se reenvían al proveedor tal como están. Los valores canónicos provienen
de la unión `VideoGenerationAssetRole`, pero los proveedores pueden aceptar cadenas de rol
adicionales. Los arreglos `*Roles` no deben tener más entradas que la
lista de referencias correspondiente; los errores de desfase fallan con un error claro.
Usa una cadena vacía para dejar una posición sin establecer. Para xAI, configura cada rol de imagen como
`reference_image` para usar su modo de generación `reference_images`; omite el
rol o usa `first_frame` para image-to-video con una sola imagen.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` o `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` o `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos (redondeada al valor compatible más cercano del proveedor).
</ParamField>
<ParamField path="size" type="string">Sugerencia de tamaño cuando el proveedor la admite.</ParamField>
<ParamField path="audio" type="boolean">
  Habilita audio generado en la salida cuando es compatible. Es distinto de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Activa o desactiva la marca de agua del proveedor cuando es compatible.</ParamField>

`adaptive` es un valor centinela específico del proveedor: se reenvía tal cual a
los proveedores que declaran `adaptive` en sus capacidades (por ejemplo, BytePlus
Seedance lo usa para detectar automáticamente la proporción a partir de las
dimensiones de la imagen de entrada). Los proveedores que no lo declaran muestran el valor mediante
`details.ignoredOverrides` en el resultado de la herramienta para que la omisión sea visible.

### Avanzado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea actual de la sesión; `"list"` inspecciona los proveedores.
</ParamField>
<ParamField path="model" type="string">Reemplazo de proveedor/modelo (por ejemplo, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Sugerencia de nombre del archivo de salida.</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional de solicitud al proveedor en milisegundos.</ParamField>
<ParamField path="providerOptions" type="object">
  Opciones específicas del proveedor como objeto JSON (por ejemplo, `{"seed": 42, "draft": true}`).
  Los proveedores que declaran un esquema tipado validan las claves y los tipos; las claves desconocidas
  o las discrepancias hacen que se omita el candidato durante la conmutación por error. Los proveedores sin un
  esquema declarado reciben las opciones tal como están. Ejecuta `video_generate action=list`
  para ver qué acepta cada proveedor.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw normaliza la duración al
valor compatible más cercano del proveedor y reasigna sugerencias geométricas traducidas
como size-to-aspect-ratio cuando un proveedor alternativo expone una superficie de control
distinta. Los reemplazos realmente no compatibles se ignoran en la medida de lo posible
y se informan como advertencias en el resultado de la herramienta. Los límites estrictos de capacidad
(como demasiadas entradas de referencia) fallan antes del envío. Los resultados de la herramienta
informan la configuración aplicada; `details.normalization` captura cualquier
traducción de solicitado a aplicado.
</Note>

Las entradas de referencia seleccionan el modo de runtime:

- Sin medios de referencia → `generate`
- Cualquier referencia de imagen → `imageToVideo`
- Cualquier referencia de video → `videoToVideo`
- Las entradas de audio de referencia **no** cambian el modo resuelto; se aplican
  además del modo que seleccionen las referencias de imagen/video, y solo funcionan
  con proveedores que declaran `maxInputAudios`.

Las referencias mixtas de imagen y video no son una superficie de capacidad compartida estable.
Prefiere un tipo de referencia por solicitud.

#### Conmutación por error y opciones tipadas

Algunas verificaciones de capacidad se aplican en la capa de conmutación por error en lugar del
límite de la herramienta, por lo que una solicitud que excede los límites del proveedor principal aún puede
ejecutarse en un proveedor alternativo capaz:

- El candidato activo que no declara `maxInputAudios` (o declara `0`) se omite cuando
  la solicitud contiene referencias de audio; se prueba el siguiente candidato.
- Si `maxDurationSeconds` del candidato activo está por debajo de `durationSeconds`
  solicitado y no hay una lista declarada `supportedDurationSeconds` → se omite.
- La solicitud contiene `providerOptions` y el candidato activo declara explícitamente
  un esquema tipado `providerOptions` → se omite si las claves proporcionadas
  no están en el esquema o si los tipos de valor no coinciden. Los proveedores sin un
  esquema declarado reciben las opciones tal como están (paso a través compatible
  hacia atrás). Un proveedor puede excluirse de todas las opciones de proveedor
  declarando un esquema vacío (`capabilities.providerOptions: {}`), lo que
  provoca la misma omisión que una discrepancia de tipo.

La primera razón de omisión en una solicitud se registra en `warn` para que los operadores vean cuándo
se omitió su proveedor principal; las omisiones posteriores se registran en `debug` para
mantener silenciosas las cadenas largas de conmutación por error. Si se omite cada candidato, el
error agregado incluye la razón de omisión de cada uno.

## Acciones

| Acción     | Qué hace                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `generate` | Predeterminada. Crea un video a partir del prompt dado y entradas de referencia opcionales.              |
| `status`   | Comprueba el estado de la tarea de video en curso para la sesión actual sin iniciar otra generación.     |
| `list`     | Muestra los proveedores, modelos y sus capacidades disponibles.                                           |

## Selección de modelo

OpenClaw resuelve el modelo en este orden:

1. **Parámetro de herramienta `model`** — si el agente especifica uno en la llamada.
2. **`videoGenerationModel.primary`** de la configuración.
3. **`videoGenerationModel.fallbacks`** en orden.
4. **Detección automática** — proveedores que tienen autenticación válida, comenzando con el
   proveedor predeterminado actual y luego los proveedores restantes en orden
   alfabético.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si todos los
candidatos fallan, el error incluye detalles de cada intento.

Establece `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
solo las entradas explícitas `model`, `primary` y `fallbacks`.

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

## Notas sobre proveedores

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa el endpoint asíncrono de DashScope / Model Studio. Las imágenes y
    videos de referencia deben ser URL remotas `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID del proveedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (predeterminado),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Los modelos T2V (`*-t2v-*`) no aceptan entradas de imagen; los modelos I2V y
    los modelos generales `*-pro-*` admiten una sola imagen de referencia (primer
    fotograma). Pasa la imagen por posición o establece `role: "first_frame"`.
    Los ID de modelo T2V se cambian automáticamente a la variante I2V
    correspondiente cuando se proporciona una imagen.

    Claves `providerOptions` admitidas: `seed` (number), `draft` (boolean —
    fuerza 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID del proveedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Usa la API unificada `content[]`. Admite como máximo 2 imágenes de entrada
    (`first_frame` + `last_frame`). Todas las entradas deben ser URL remotas `https://`.
    Establece `role: "first_frame"` / `"last_frame"` en cada imagen, o
    pasa las imágenes por posición.

    `aspectRatio: "adaptive"` detecta automáticamente la proporción a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (number) se reenvía.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID del proveedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa la API unificada `content[]`. Admite hasta 9 imágenes de referencia,
    3 videos de referencia y 3 audios de referencia. Todas las entradas deben ser URL remotas
    `https://`. Establece `role` en cada recurso: valores admitidos:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automáticamente la proporción a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (number) se reenvía.

  </Accordion>
  <Accordion title="ComfyUI">
    Ejecución local o en la nube basada en flujos de trabajo. Admite texto a video e
    imagen a video mediante el grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa un flujo respaldado por cola para trabajos de larga duración. La mayoría de los modelos de video de fal
    aceptan una sola imagen de referencia. Los modelos de referencia a video de Seedance 2.0
    aceptan hasta 9 imágenes, 3 videos y 3 referencias de audio, con
    un máximo de 12 archivos de referencia en total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Admite una imagen o un video de referencia.
  </Accordion>
  <Accordion title="MiniMax">
    Solo una referencia de imagen.
  </Accordion>
  <Accordion title="OpenAI">
    Solo se reenvía el reemplazo `size`. Los otros reemplazos de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) se ignoran con
    una advertencia.
  </Accordion>
  <Accordion title="Qwen">
    Mismo backend DashScope que Alibaba. Las entradas de referencia deben ser URL remotas
    `http(s)`; los archivos locales se rechazan de inmediato.
  </Accordion>
  <Accordion title="Runway">
    Admite archivos locales mediante URI de datos. Video a video requiere
    `runway/gen4_aleph`. Las ejecuciones solo de texto exponen las proporciones
    `16:9` y `9:16`.
  </Accordion>
  <Accordion title="Together">
    Solo una referencia de imagen.
  </Accordion>
  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` directamente para evitar redirecciones
    que eliminan autenticación. `veo3` viene integrado como solo texto a video; `kling` requiere
    una URL de imagen remota.
  </Accordion>
  <Accordion title="xAI">
    Admite texto a video, image-to-video con una sola imagen de primer fotograma, hasta 7
    entradas `reference_image` mediante `reference_images` de xAI y
    flujos remotos de edición/extensión de video.
  </Accordion>
</AccordionGroup>

## Modos de capacidad del proveedor

El contrato compartido de generación de video admite capacidades específicas por modo
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
son suficientes para anunciar compatibilidad con modos de transformación. Los proveedores deben
declarar `generate`, `imageToVideo` y `videoToVideo` explícitamente para que las pruebas en vivo,
las pruebas de contrato y la herramienta compartida `video_generate` puedan validar la
compatibilidad de modos de forma determinista.

Cuando un modelo dentro de un proveedor tiene un soporte de entradas de referencia más amplio que el
resto, usa `maxInputImagesByModel`, `maxInputVideosByModel` o
`maxInputAudiosByModel` en lugar de aumentar el límite general del modo.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos integrados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media video
```

Este archivo en vivo carga las variables de entorno del proveedor que falten desde `~/.profile`, prioriza
las claves de API en vivo/del entorno por encima de los perfiles de autenticación almacenados de forma predeterminada y ejecuta una
prueba básica segura para la versión de forma predeterminada:

- `generate` para cada proveedor que no sea FAL en el barrido.
- Prompt de langosta de un segundo.
- Límite de operación por proveedor de
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada).

FAL es opcional porque la latencia de cola del lado del proveedor puede dominar el
tiempo de publicación:

```bash
pnpm test:live:media video --video-providers fal
```

Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los
modos de transformación declarados que el barrido compartido puede ejercer de forma segura con medios locales:

- `imageToVideo` cuando `capabilities.imageToVideo.enabled`.
- `videoToVideo` cuando `capabilities.videoToVideo.enabled` y el
  proveedor/modelo acepta entrada de video local respaldada por búfer en el barrido
  compartido.

Hoy, el lane compartido en vivo de `videoToVideo` cubre `runway` solo cuando
seleccionas `runway/gen4_aleph`.

## Configuración

Establece el modelo de generación de video predeterminado en tu configuración de OpenClaw:

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
- [Tareas en segundo plano](/es/automation/tasks) — seguimiento de tareas para la generación asíncrona de video
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
