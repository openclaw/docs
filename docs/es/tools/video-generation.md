---
read_when:
    - Generación de videos mediante el agente
    - Configuración de proveedores y modelos de generación de video
    - Comprender los parámetros de la herramienta video_generate
sidebarTitle: Video generation
summary: Genera videos mediante video_generate a partir de referencias de texto, imagen o video en 16 backends de proveedores
title: Generación de videos
x-i18n:
    generated_at: "2026-05-05T01:50:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

Los agentes de OpenClaw pueden generar videos a partir de prompts de texto, imágenes de referencia o
videos existentes. Se admiten dieciséis backends de proveedores, cada uno con
diferentes opciones de modelo, modos de entrada y conjuntos de funciones. El agente elige el
proveedor adecuado automáticamente según tu configuración y las claves de API
disponibles.

<Note>
La herramienta `video_generate` solo aparece cuando hay al menos un proveedor de generación de video
disponible. Si no la ves en las herramientas de tu agente, configura una
clave de API de proveedor o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw trata la generación de video como tres modos de runtime:

- `generate` — solicitudes de texto a video sin medios de referencia.
- `imageToVideo` — la solicitud incluye una o más imágenes de referencia.
- `videoToVideo` — la solicitud incluye uno o más videos de referencia.

Los proveedores pueden admitir cualquier subconjunto de esos modos. La herramienta valida el
modo activo antes del envío e informa los modos admitidos en `action=list`.

## Inicio rápido

<Steps>
  <Step title="Configurar autenticación">
    Configura una clave de API para cualquier proveedor compatible:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Elegir un modelo predeterminado (opcional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Preguntar al agente">
    > Genera un video cinematográfico de 5 segundos de una langosta amigable surfeando al atardecer.

    El agente llama a `video_generate` automáticamente. No es necesario incluir
    herramientas en una lista de permitidas.

  </Step>
</Steps>

## Cómo funciona la generación asíncrona

La generación de video es asíncrona. Cuando el agente llama a `video_generate` en una
sesión:

1. OpenClaw envía la solicitud al proveedor y devuelve de inmediato un ID de tarea.
2. El proveedor procesa el trabajo en segundo plano (normalmente de 30 segundos a 5 minutos, según el proveedor y la resolución).
3. Cuando el video está listo, OpenClaw reactiva la misma sesión con un evento interno de finalización.
4. El agente informa al usuario y adjunta el video terminado. En chats de grupo/canal
   que usan entrega visible solo mediante herramienta de mensajes, el agente transmite el
   resultado mediante la herramienta de mensajes en lugar de que OpenClaw lo publique directamente.

Mientras un trabajo está en curso, las llamadas duplicadas a `video_generate` en la misma
sesión devuelven el estado actual de la tarea en lugar de iniciar otra
generación. Usa `openclaw tasks list` u `openclaw tasks show <taskId>` para
consultar el progreso desde la CLI.

Fuera de ejecuciones de agente respaldadas por sesión (por ejemplo, invocaciones directas de herramientas),
la herramienta vuelve a la generación en línea y devuelve la ruta final del medio
en el mismo turno.

Los archivos de video generados se guardan en el almacenamiento de medios administrado por OpenClaw cuando
el proveedor devuelve bytes. El límite predeterminado de guardado de videos generados sigue
el límite de medios de video, y `agents.defaults.mediaMaxMb` lo eleva para
renders más grandes. Cuando un proveedor también devuelve una URL de salida alojada, OpenClaw
puede entregar esa URL en lugar de fallar la tarea si la persistencia local
rechaza un archivo demasiado grande.

### Ciclo de vida de la tarea

| Estado      | Significado                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `queued`    | Tarea creada, esperando a que el proveedor la acepte.                                             |
| `running`   | El proveedor está procesando (normalmente de 30 segundos a 5 minutos, según proveedor y resolución). |
| `succeeded` | Video listo; el agente se reactiva y lo publica en la conversación.                               |
| `failed`    | Error o tiempo de espera agotado del proveedor; el agente se reactiva con detalles del error.     |

Consulta el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Si una tarea de video ya está en `queued` o `running` para la sesión actual,
`video_generate` devuelve el estado de la tarea existente en lugar de iniciar una nueva
tarea. Usa `action: "status"` para consultarlo explícitamente sin activar una nueva
generación.

## Proveedores compatibles

| Proveedor             | Modelo predeterminado              | Texto | Ref. de imagen                                      | Ref. de video                                  | Autenticación                            |
| --------------------- | ---------------------------------- | :---: | --------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                       |   ✓   | Sí (URL remota)                                     | Sí (URL remota)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`          |   ✓   | Hasta 2 imágenes (solo modelos I2V; primer + último fotograma) | —                                     | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`          |   ✓   | Hasta 2 imágenes (primer + último fotograma mediante rol) | —                                          | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`     |   ✓   | Hasta 9 imágenes de referencia                      | Hasta 3 videos                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                         |   ✓   | 1 imagen                                            | —                                              | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`  |
| DeepInfra             | `Pixverse/Pixverse-T2V`            |   ✓   | —                                                   | —                                              | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`     |   ✓   | 1 imagen; hasta 9 con Seedance reference-to-video   | Hasta 3 videos con Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview`    |   ✓   | 1 imagen                                            | 1 video                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`               |   ✓   | 1 imagen                                            | —                                              | `MINIMAX_API_KEY` o MiniMax OAuth        |
| OpenAI                | `sora-2`                           |   ✓   | 1 imagen                                            | 1 video                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`              |   ✓   | Hasta 4 imágenes (primer/último fotograma o referencias) | —                                       | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                       |   ✓   | Sí (URL remota)                                     | Sí (URL remota)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                           |   ✓   | 1 imagen                                            | 1 video                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`           |   ✓   | 1 imagen                                            | —                                              | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                             |   ✓   | 1 imagen (`kling`)                                  | —                                              | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`               |   ✓   | 1 imagen de primer fotograma o hasta 7 `reference_image`s | 1 video                                  | `XAI_API_KEY`                            |

Algunos proveedores aceptan variables de entorno de clave de API adicionales o alternativas. Consulta
las [páginas de proveedores](#related) individuales para obtener detalles.

Ejecuta `video_generate action=list` para inspeccionar los proveedores, modelos y
modos de runtime disponibles en tiempo de ejecución.

### Matriz de capacidades

El contrato de modo explícito utilizado por `video_generate`, las pruebas de contrato y
el barrido compartido en vivo:

| Proveedor  | `generate` | `imageToVideo` | `videoToVideo` | Lanes compartidos en vivo actualmente                                                                                                    |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video `http(s)` remotas                         |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | No está en el barrido compartido; la cobertura específica de workflow vive con las pruebas de Comfy                                      |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; los esquemas de video nativos de DeepInfra son de texto a video en el contrato incluido                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo al usar Seedance reference-to-video                                                      |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque el barrido actual de Gemini/Veo respaldado por búfer no acepta esa entrada |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque esta organización/ruta de entrada actualmente necesita acceso de inpaint/remix del lado del proveedor |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video `http(s)` remotas                         |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se ejecuta solo cuando el modelo seleccionado es `runway/gen4_aleph`                          |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` compartido se omite porque el `veo3` incluido es solo texto y el `kling` incluido requiere una URL de imagen remota |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor actualmente necesita una URL MP4 remota                        |

## Parámetros de la herramienta

### Obligatorios

<ParamField path="prompt" type="string" required>
  Descripción de texto del video que se va a generar. Obligatorio para `action: "generate"`.
</ParamField>

### Entradas de contenido

<ParamField path="image" type="string">Imagen de referencia única (ruta o URL).</ParamField>
<ParamField path="images" type="string[]">Varias imágenes de referencia (hasta 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Indicaciones de rol opcionales por posición, paralelas a la lista combinada de imágenes.
Valores canónicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Video de referencia único (ruta o URL).</ParamField>
<ParamField path="videos" type="string[]">Varios videos de referencia (hasta 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Indicaciones de rol opcionales por posición, paralelas a la lista combinada de videos.
Valor canónico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Audio de referencia único (ruta o URL). Se usa para música de fondo o referencia de voz
cuando el proveedor admite entradas de audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Varios audios de referencia (hasta 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indicaciones de rol opcionales por posición, paralelas a la lista combinada de audios.
Valor canónico: `reference_audio`.
</ParamField>

<Note>
Las indicaciones de rol se reenvían al proveedor tal cual. Los valores canónicos provienen de
la unión `VideoGenerationAssetRole`, pero los proveedores pueden aceptar cadenas de rol
adicionales. Los arreglos `*Roles` no deben tener más entradas que la lista de referencias
correspondiente; los errores de desplazamiento de uno fallan con un error claro.
Use una cadena vacía para dejar un espacio sin definir. Para xAI, establezca cada rol de imagen en
`reference_image` para usar su modo de generación `reference_images`; omita el
rol o use `first_frame` para imagen a video con una sola imagen.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, o `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, o `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos (redondeada al valor más cercano admitido por el proveedor).
</ParamField>
<ParamField path="size" type="string">Indicación de tamaño cuando el proveedor la admite.</ParamField>
<ParamField path="audio" type="boolean">
  Activa el audio generado en la salida cuando se admite. Distinto de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Activa o desactiva la marca de agua del proveedor cuando se admite.</ParamField>

`adaptive` es un centinela específico del proveedor: se reenvía tal cual a
los proveedores que declaran `adaptive` en sus capacidades (por ejemplo,
BytePlus Seedance lo usa para detectar automáticamente la proporción a partir de las dimensiones
de la imagen de entrada). Los proveedores que no lo declaran exponen el valor mediante
`details.ignoredOverrides` en el resultado de la herramienta para que el descarte sea visible.

### Avanzado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea de sesión actual; `"list"` inspecciona los proveedores.
</ParamField>
<ParamField path="model" type="string">Anulación de proveedor/modelo (por ejemplo, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indicación de nombre de archivo de salida.</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional de la solicitud al proveedor en milisegundos.</ParamField>
<ParamField path="providerOptions" type="object">
  Opciones específicas del proveedor como objeto JSON (por ejemplo, `{"seed": 42, "draft": true}`).
  Los proveedores que declaran un esquema tipado validan las claves y los tipos; las claves
  desconocidas o las discrepancias omiten el candidato durante la reserva. Los proveedores sin un
  esquema declarado reciben las opciones tal cual. Ejecute `video_generate action=list`
  para ver qué acepta cada proveedor.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw normaliza la duración al
valor admitido por el proveedor más cercano y reasigna indicaciones de geometría traducidas,
como tamaño a relación de aspecto, cuando un proveedor de reserva expone una superficie de
control diferente. Las anulaciones realmente no admitidas se ignoran con el criterio de mejor esfuerzo
y se informan como advertencias en el resultado de la herramienta. Los límites estrictos de capacidad
(como demasiadas entradas de referencia) fallan antes del envío. Los resultados de la herramienta
informan la configuración aplicada; `details.normalization` captura cualquier
traducción de solicitado a aplicado.
</Note>

Las entradas de referencia seleccionan el modo de ejecución:

- Sin medios de referencia → `generate`
- Cualquier referencia de imagen → `imageToVideo`
- Cualquier referencia de video → `videoToVideo`
- Las entradas de audio de referencia **no** cambian el modo resuelto; se aplican
  sobre cualquier modo que seleccionen las referencias de imagen/video y solo funcionan
  con proveedores que declaran `maxInputAudios`.

Las referencias mixtas de imagen y video no son una superficie estable de capacidad compartida.
Prefiera un tipo de referencia por solicitud.

#### Reserva y opciones tipadas

Algunas comprobaciones de capacidad se aplican en la capa de reserva en lugar de en el
límite de la herramienta, por lo que una solicitud que excede los límites del proveedor principal aún puede
ejecutarse en una reserva capaz:

- El candidato activo que no declara `maxInputAudios` (o declara `0`) se omite cuando
  la solicitud contiene referencias de audio; se prueba el siguiente candidato.
- El `maxDurationSeconds` del candidato activo por debajo del `durationSeconds` solicitado
  sin una lista `supportedDurationSeconds` declarada → se omite.
- La solicitud contiene `providerOptions` y el candidato activo declara explícitamente
  un esquema `providerOptions` tipado → se omite si las claves suministradas no están
  en el esquema o los tipos de valor no coinciden. Los proveedores sin un
  esquema declarado reciben las opciones tal cual (paso directo compatible hacia atrás).
  Un proveedor puede optar por no aceptar ninguna opción de proveedor declarando
  un esquema vacío (`capabilities.providerOptions: {}`), lo que causa
  la misma omisión que una discrepancia de tipo.

El primer motivo de omisión en una solicitud se registra en `warn` para que los operadores vean cuándo
se pasó por alto su proveedor principal; las omisiones posteriores se registran en `debug` para
mantener silenciosas las cadenas largas de reserva. Si se omiten todos los candidatos, el
error agregado incluye el motivo de omisión de cada uno.

## Acciones

| Acción     | Qué hace                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Predeterminada. Crea un video a partir del prompt dado y las entradas de referencia opcionales.                             |
| `status`   | Comprueba el estado de la tarea de video en curso para la sesión actual sin iniciar otra generación. |
| `list`     | Muestra los proveedores, modelos y sus capacidades disponibles.                                                |

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

Establezca `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
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

## Notas del proveedor

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa el endpoint asíncrono de DashScope / Model Studio. Las imágenes y
    videos de referencia deben ser URL `http(s)` remotas.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Id. de proveedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (predeterminado),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Los modelos T2V (`*-t2v-*`) no aceptan entradas de imagen; los modelos I2V y
    los modelos generales `*-pro-*` admiten una sola imagen de referencia (primer
    fotograma). Pase la imagen por posición o establezca `role: "first_frame"`.
    Los ID de modelo T2V se cambian automáticamente a la variante I2V
    correspondiente cuando se proporciona una imagen.

    Claves `providerOptions` admitidas: `seed` (número), `draft` (booleano —
    fuerza 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Requiere el Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Id. de proveedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Usa la API unificada `content[]`. Admite como máximo 2 imágenes de entrada
    (`first_frame` + `last_frame`). Todas las entradas deben ser URL `https://`
    remotas. Establezca `role: "first_frame"` / `"last_frame"` en cada imagen, o
    pase las imágenes por posición.

    `aspectRatio: "adaptive"` detecta automáticamente la proporción a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (número) se reenvía.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Requiere el Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Id. de proveedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa la API unificada `content[]`. Admite hasta 9 imágenes de referencia,
    3 videos de referencia y 3 audios de referencia. Todas las entradas deben ser URL
    `https://` remotas. Establezca `role` en cada recurso — valores admitidos:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automáticamente la proporción a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (número) se reenvía.

  </Accordion>
  <Accordion title="ComfyUI">
    Ejecución local o en la nube dirigida por flujo de trabajo. Admite texto a video e
    imagen a video mediante el grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa un flujo respaldado por cola para trabajos de larga duración. La mayoría de los modelos de video de fal
    aceptan una sola referencia de imagen. Los modelos de referencia a video de Seedance 2.0
    aceptan hasta 9 imágenes, 3 videos y 3 referencias de audio, con
    un máximo de 12 archivos de referencia en total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Admite una referencia de imagen o una referencia de video.
  </Accordion>
  <Accordion title="MiniMax">
    Solo una referencia de imagen.
  </Accordion>
  <Accordion title="OpenAI">
    Solo se reenvía la anulación `size`. Las demás anulaciones de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) se ignoran con
    una advertencia.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa la API asíncrona `/videos` de OpenRouter. OpenClaw envía el
    trabajo, sondea `polling_url` y descarga `unsigned_urls` o el
    endpoint de contenido de trabajo documentado. El valor predeterminado incluido `google/veo-3.1-fast`
    anuncia duraciones de 4/6/8 segundos, resoluciones `720P`/`1080P` y
    relaciones de aspecto `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    El mismo backend DashScope que Alibaba. Las entradas de referencia deben ser URL
    `http(s)` remotas; los archivos locales se rechazan de antemano.
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
    Usa `https://www.vydra.ai/api/v1` directamente para evitar redirecciones
    que eliminan la autenticación. `veo3` se incluye solo como texto a video; `kling` requiere
    una URL de imagen remota.
  </Accordion>
  <Accordion title="xAI">
    Admite texto a video, imagen a video de un solo primer fotograma, hasta 7
    entradas `reference_image` mediante `reference_images` de xAI, y flujos remotos
    de edición/extensión de video.
  </Accordion>
</AccordionGroup>

## Modos de capacidad del proveedor

El contrato compartido de generación de video admite capacidades específicas por modo
en lugar de solo límites agregados planos. Las nuevas implementaciones de proveedores
deberían preferir bloques de modo explícitos:

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
son suficientes para anunciar compatibilidad con modos de transformación. Los
proveedores deberían declarar `generate`, `imageToVideo` y `videoToVideo`
explícitamente para que las pruebas en vivo, las pruebas de contrato y la
herramienta compartida `video_generate` puedan validar la compatibilidad de
modos de forma determinista.

Cuando un modelo de un proveedor admite entradas de referencia más amplias que el
resto, usa `maxInputImagesByModel`, `maxInputVideosByModel` o
`maxInputAudiosByModel` en lugar de aumentar el límite de todo el modo.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos incluidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media video
```

Este archivo en vivo carga las variables de entorno de proveedores faltantes desde `~/.profile`, prefiere
las claves de API live/env antes que los perfiles de autenticación almacenados de forma predeterminada y ejecuta una
prueba smoke segura para releases de forma predeterminada:

- `generate` para cada proveedor que no sea FAL en el barrido.
- Prompt de langosta de un segundo.
- Límite de operaciones por proveedor desde
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada).

FAL es opcional porque la latencia de cola del lado del proveedor puede dominar el tiempo de release:

```bash
pnpm test:live:media video --video-providers fal
```

Configura `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos
de transformación declarados que el barrido compartido puede probar de forma segura con medios locales:

- `imageToVideo` cuando `capabilities.imageToVideo.enabled`.
- `videoToVideo` cuando `capabilities.videoToVideo.enabled` y el
  proveedor/modelo acepta entrada de video local respaldada por búfer en el barrido
  compartido.

Actualmente, el carril en vivo compartido de `videoToVideo` cubre `runway` solo cuando
seleccionas `runway/gen4_aleph`.

## Configuración

Configura el modelo de generación de video predeterminado en tu configuración de OpenClaw:

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
