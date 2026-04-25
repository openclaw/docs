---
read_when:
    - Generar videos mediante el agente
    - Configurar proveedores y modelos de generación de video
    - Comprender los parámetros de la herramienta `video_generate`
summary: Genera videos a partir de texto, imágenes o videos existentes usando 14 backends de proveedores
title: Generación de video
x-i18n:
    generated_at: "2026-04-25T18:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f04c9ac25a0ad08036266ab0c61a6ddf41ad944f64aa273ba31e09fc5774ac74
    source_path: tools/video-generation.md
    workflow: 15
---

Los agentes de OpenClaw pueden generar videos a partir de prompts de texto, imágenes de referencia o videos existentes. Se admiten catorce backends de proveedores, cada uno con distintas opciones de modelo, modos de entrada y conjuntos de funciones. El agente elige automáticamente el proveedor correcto según tu configuración y las claves de API disponibles.

<Note>
La herramienta `video_generate` solo aparece cuando hay al menos un proveedor de generación de video disponible. Si no la ves en las herramientas de tu agente, establece una clave de API de proveedor o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw trata la generación de video como tres modos de runtime:

- `generate` para solicitudes de texto a video sin medios de referencia
- `imageToVideo` cuando la solicitud incluye una o más imágenes de referencia
- `videoToVideo` cuando la solicitud incluye uno o más videos de referencia

Los proveedores pueden admitir cualquier subconjunto de esos modos. La herramienta valida el
modo activo antes del envío e informa los modos admitidos en `action=list`.

## Inicio rápido

1. Establece una clave de API para cualquier proveedor compatible:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcionalmente, fija un modelo predeterminado:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Pídele al agente:

> Genera un video cinematográfico de 5 segundos de una langosta amistosa surfeando al atardecer.

El agente llama a `video_generate` automáticamente. No se necesita lista permitida de herramientas.

## Qué ocurre cuando generas un video

La generación de video es asíncrona. Cuando el agente llama a `video_generate` en una sesión:

1. OpenClaw envía la solicitud al proveedor y devuelve inmediatamente un ID de tarea.
2. El proveedor procesa el trabajo en segundo plano (normalmente entre 30 segundos y 5 minutos según el proveedor y la resolución).
3. Cuando el video está listo, OpenClaw reactiva la misma sesión con un evento interno de finalización.
4. El agente publica el video terminado de vuelta en la conversación original.

Mientras un trabajo está en curso, las llamadas duplicadas a `video_generate` en la misma sesión devuelven el estado actual de la tarea en lugar de iniciar otra generación. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` para comprobar el progreso desde la CLI.

Fuera de las ejecuciones de agente respaldadas por sesión (por ejemplo, invocaciones directas de herramientas), la herramienta recurre a la generación en línea y devuelve la ruta final del medio en el mismo turno.

Los archivos de video generados se guardan en el almacenamiento de medios administrado por OpenClaw cuando el
proveedor devuelve bytes. El límite predeterminado de guardado de video generado sigue el límite de
medios de video, y `agents.defaults.mediaMaxMb` lo aumenta para renderizados más grandes.
Cuando un proveedor también devuelve una URL de salida alojada, OpenClaw puede entregar esa URL
en lugar de fallar la tarea si la persistencia local rechaza un archivo demasiado grande.

### Ciclo de vida de la tarea

Cada solicitud `video_generate` pasa por cuatro estados:

1. **queued** -- tarea creada, esperando a que el proveedor la acepte.
2. **running** -- el proveedor está procesando (normalmente entre 30 segundos y 5 minutos según el proveedor y la resolución).
3. **succeeded** -- video listo; el agente se reactiva y lo publica en la conversación.
4. **failed** -- error del proveedor o tiempo de espera agotado; el agente se reactiva con detalles del error.

Comprueba el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevención de duplicados: si una tarea de video ya está `queued` o `running` para la sesión actual, `video_generate` devuelve el estado de la tarea existente en lugar de iniciar una nueva. Usa `action: "status"` para comprobarlo explícitamente sin activar una nueva generación.

## Proveedores compatibles

| Proveedor             | Modelo predeterminado           | Texto | Imagen de ref.                                       | Video de ref.    | Clave de API                             |
| --------------------- | ------------------------------- | ----- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Sí    | Sí (URL remota)                                      | Sí (URL remota)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Sí    | Hasta 2 imágenes (solo modelos I2V; primer + último fotograma) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Sí    | Hasta 2 imágenes (primer + último fotograma mediante rol) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Sí    | Hasta 9 imágenes de referencia                       | Hasta 3 videos   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Sí    | 1 imagen                                             | No               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Sí    | 1 imagen                                             | No               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Sí    | 1 imagen                                             | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Sí    | 1 imagen                                             | No               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Sí    | 1 imagen                                             | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Sí    | Sí (URL remota)                                      | Sí (URL remota)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Sí    | 1 imagen                                             | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Sí    | 1 imagen                                             | No               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Sí    | 1 imagen (`kling`)                                   | No               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Sí    | 1 imagen de primer fotograma o hasta 7 `reference_image`s | 1 video          | `XAI_API_KEY`                            |

Algunos proveedores aceptan variables de entorno de clave de API adicionales o alternativas. Consulta las [páginas de proveedor](#related) individuales para obtener más detalles.

Ejecuta `video_generate action=list` para inspeccionar los proveedores, modelos y
modos de runtime disponibles en tiempo de ejecución.

### Matriz de capacidades declarada

Este es el contrato explícito de modos que usan `video_generate`, las pruebas de contrato
y el barrido compartido en vivo.

| Proveedor | `generate` | `imageToVideo` | `videoToVideo` | Carriles compartidos en vivo actualmente                                                                                                  |
| --------- | ---------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video remotas `http(s)`                        |
| BytePlus  | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI   | Sí         | Sí             | No             | No está en el barrido compartido; la cobertura específica del flujo de trabajo vive con las pruebas de Comfy                              |
| fal       | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                                |
| Google    | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque el barrido actual Gemini/Veo respaldado por buffer no acepta esa entrada |
| MiniMax   | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                                |
| OpenAI    | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque esta ruta de organización/entrada actualmente necesita acceso del lado del proveedor a inpaint/remix |
| Qwen      | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video remotas `http(s)`                        |
| Runway    | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` solo se ejecuta cuando el modelo seleccionado es `runway/gen4_aleph`                          |
| Together  | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                                |
| Vydra     | Sí         | Sí             | No             | `generate`; `imageToVideo` compartido se omite porque el `veo3` integrado es solo de texto y el `kling` integrado requiere una URL remota de imagen |
| xAI       | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor actualmente necesita una URL remota MP4                         |

## Parámetros de la herramienta

### Obligatorios

| Parámetro | Tipo   | Descripción                                                                  |
| --------- | ------ | ---------------------------------------------------------------------------- |
| `prompt`  | string | Descripción de texto del video que se va a generar (obligatoria para `action: "generate"`) |

### Entradas de contenido

| Parámetro   | Tipo     | Descripción                                                                                                                             |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Imagen de referencia única (ruta o URL)                                                                                                 |
| `images`     | string[] | Varias imágenes de referencia (hasta 9)                                                                                                 |
| `imageRoles` | string[] | Sugerencias de rol opcionales por posición en paralelo a la lista combinada de imágenes. Valores canónicos: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Video de referencia único (ruta o URL)                                                                                                  |
| `videos`     | string[] | Varios videos de referencia (hasta 4)                                                                                                   |
| `videoRoles` | string[] | Sugerencias de rol opcionales por posición en paralelo a la lista combinada de videos. Valor canónico: `reference_video`               |
| `audioRef`   | string   | Audio de referencia único (ruta o URL). Se usa, por ejemplo, para música de fondo o referencia de voz cuando el proveedor admite entradas de audio |
| `audioRefs`  | string[] | Varios audios de referencia (hasta 3)                                                                                                   |
| `audioRoles` | string[] | Sugerencias de rol opcionales por posición en paralelo a la lista combinada de audios. Valor canónico: `reference_audio`               |

Las sugerencias de rol se reenvían al proveedor tal como están. Los valores canónicos provienen
de la unión `VideoGenerationAssetRole`, pero los proveedores pueden aceptar
cadenas de rol adicionales. Los arrays `*Roles` no deben tener más entradas que la
lista de referencias correspondiente; los errores de desfase fallan con un mensaje claro.
Usa una cadena vacía para dejar una posición sin establecer. Para xAI, establece cada rol de imagen en
`reference_image` para usar su modo de generación `reference_images`; omite el rol
o usa `first_frame` para image-to-video con una sola imagen.

### Controles de estilo

| Parámetro        | Tipo    | Descripción                                                                            |
| ---------------- | ------- | -------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` o `adaptive`  |
| `resolution`      | string  | `480P`, `720P`, `768P` o `1080P`                                                       |
| `durationSeconds` | number  | Duración objetivo en segundos (redondeada al valor compatible más cercano del proveedor) |
| `size`            | string  | Sugerencia de tamaño cuando el proveedor lo admite                                     |
| `audio`           | boolean | Habilita audio generado en la salida cuando es compatible. Distinto de `audioRef*` (entradas) |
| `watermark`       | boolean | Activa o desactiva la marca de agua del proveedor cuando es compatible                 |

`adaptive` es un valor centinela específico del proveedor: se reenvía tal cual a
los proveedores que declaran `adaptive` en sus capacidades (por ejemplo, BytePlus
Seedance lo usa para detectar automáticamente la relación desde las dimensiones
de la imagen de entrada). Los proveedores que no lo declaran muestran el valor mediante
`details.ignoredOverrides` en el resultado de la herramienta para que la omisión sea visible.

### Avanzado

| Parámetro        | Tipo   | Descripción                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (predeterminado), `"status"` o `"list"`                                                                                                                                                                                                                                                                                                  |
| `model`           | string | Anulación de proveedor/modelo (por ejemplo, `runway/gen4.5`)                                                                                                                                                                                                                                                                                          |
| `filename`        | string | Sugerencia de nombre de archivo de salida                                                                                                                                                                                                                                                                                                             |
| `timeoutMs`       | number | Tiempo de espera opcional de la solicitud al proveedor en milisegundos                                                                                                                                                                                                                                                                                |
| `providerOptions` | object | Opciones específicas del proveedor como objeto JSON (por ejemplo, `{"seed": 42, "draft": true}`). Los proveedores que declaran un esquema tipado validan las claves y los tipos; las claves desconocidas o incompatibilidades hacen que el candidato se omita durante la alternativa. Los proveedores sin esquema declarado reciben las opciones tal cual. Ejecuta `video_generate action=list` para ver qué acepta cada proveedor |

No todos los proveedores admiten todos los parámetros. OpenClaw ya normaliza la duración al valor compatible más cercano del proveedor, y también remapea sugerencias de geometría traducidas, como tamaño a relación de aspecto, cuando un proveedor alternativo expone una superficie de control diferente. Las anulaciones realmente incompatibles se ignoran según el mejor esfuerzo y se informan como advertencias en el resultado de la herramienta. Los límites estrictos de capacidad (como demasiadas entradas de referencia) fallan antes del envío.

Los resultados de la herramienta informan la configuración aplicada. Cuando OpenClaw remapea duración o geometría durante la alternativa de proveedor, los valores devueltos `durationSeconds`, `size`, `aspectRatio` y `resolution` reflejan lo que se envió, y `details.normalization` captura la traducción de solicitado a aplicado.

Las entradas de referencia también seleccionan el modo de runtime:

- Sin medios de referencia: `generate`
- Cualquier imagen de referencia: `imageToVideo`
- Cualquier video de referencia: `videoToVideo`
- Las entradas de audio de referencia no cambian el modo resuelto; se aplican sobre el modo que seleccionen las referencias de imagen/video y solo funcionan con proveedores que declaran `maxInputAudios`

Las referencias mixtas de imagen y video no son una superficie de capacidad compartida estable.
Prefiere un solo tipo de referencia por solicitud.

#### Alternativa y opciones tipadas

Algunas comprobaciones de capacidad se aplican en la capa de alternativa en lugar del
límite de la herramienta para que una solicitud que exceda los límites del proveedor principal
todavía pueda ejecutarse en una alternativa compatible:

- Si el candidato activo no declara `maxInputAudios` (o lo declara como
  `0`), se omite cuando la solicitud contiene referencias de audio, y se
  prueba el siguiente candidato.
- Si `maxDurationSeconds` del candidato activo está por debajo de la
  `durationSeconds` solicitada y el candidato no declara una lista
  `supportedDurationSeconds`, se omite.
- Si la solicitud contiene `providerOptions` y el candidato activo
  declara explícitamente un esquema tipado para `providerOptions`, el candidato se
  omite cuando las claves suministradas no están en el esquema o los tipos de valor no
  coinciden. Los proveedores que aún no han declarado un esquema reciben las
  opciones tal cual (paso directo compatible con versiones anteriores). Un proveedor puede
  excluir explícitamente todas las opciones de proveedor declarando un esquema vacío
  (`capabilities.providerOptions: {}`), lo que provoca la misma omisión que una
  incompatibilidad de tipo.

El primer motivo de omisión en una solicitud se registra en `warn` para que los operadores vean
cuándo se ignoró su proveedor principal; las omisiones posteriores se registran en
`debug` para mantener silenciosas las cadenas largas de alternativas. Si se omiten todos los candidatos,
el error agregado incluye el motivo de omisión de cada uno.

## Acciones

- **generate** (predeterminada) -- crea un video a partir del prompt dado y entradas de referencia opcionales.
- **status** -- comprueba el estado de la tarea de video en curso para la sesión actual sin iniciar otra generación.
- **list** -- muestra los proveedores, modelos y sus capacidades disponibles.

## Selección de modelo

Al generar un video, OpenClaw resuelve el modelo en este orden:

1. **Parámetro de herramienta `model`** -- si el agente especifica uno en la llamada.
2. **`videoGenerationModel.primary`** -- desde la configuración.
3. **`videoGenerationModel.fallbacks`** -- se prueban en orden.
4. **Detección automática** -- usa proveedores que tienen autenticación válida, empezando por el proveedor predeterminado actual y luego los proveedores restantes en orden alfabético.

Si un proveedor falla, el siguiente candidato se prueba automáticamente. Si todos los candidatos fallan, el error incluye detalles de cada intento.

Establece `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres
que la generación de video use solo las entradas explícitas `model`, `primary` y `fallbacks`.

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
    Usa el endpoint asíncrono de DashScope / Model Studio. Las imágenes y videos de referencia deben ser URL remotas `http(s)`.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    ID del proveedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (predeterminado), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Los modelos T2V (`*-t2v-*`) no aceptan entradas de imagen; los modelos I2V y los modelos generales `*-pro-*` admiten una sola imagen de referencia (primer fotograma). Pasa la imagen por posición o establece `role: "first_frame"`. Los ID de modelos T2V se cambian automáticamente a la variante I2V correspondiente cuando se proporciona una imagen.

    Claves `providerOptions` compatibles: `seed` (number), `draft` (boolean — fuerza 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID del proveedor: `byteplus-seedance15`. Modelo: `seedance-1-5-pro-251215`.

    Usa la API unificada `content[]`. Admite como máximo 2 imágenes de entrada (`first_frame` + `last_frame`). Todas las entradas deben ser URL remotas `https://`. Establece `role: "first_frame"` / `"last_frame"` en cada imagen, o pasa las imágenes por posición.

    `aspectRatio: "adaptive"` detecta automáticamente la relación desde la imagen de entrada. `audio: true` se asigna a `generate_audio`. `providerOptions.seed` (number) se reenvía.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID del proveedor: `byteplus-seedance2`. Modelos: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Usa la API unificada `content[]`. Admite hasta 9 imágenes de referencia, 3 videos de referencia y 3 audios de referencia. Todas las entradas deben ser URL remotas `https://`. Establece `role` en cada recurso: valores compatibles: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automáticamente la relación desde la imagen de entrada. `audio: true` se asigna a `generate_audio`. `providerOptions.seed` (number) se reenvía.

  </Accordion>

  <Accordion title="ComfyUI">
    Ejecución local o en la nube basada en workflows. Admite texto a video e imagen a video mediante el grafo configurado.
  </Accordion>

  <Accordion title="fal">
    Usa un flujo respaldado por cola para trabajos de larga duración. Solo una imagen de referencia.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Admite una imagen o un video de referencia.
  </Accordion>

  <Accordion title="MiniMax">
    Solo una imagen de referencia.
  </Accordion>

  <Accordion title="OpenAI">
    Solo se reenvía la anulación `size`. Otras anulaciones de estilo (`aspectRatio`, `resolution`, `audio`, `watermark`) se ignoran con una advertencia.
  </Accordion>

  <Accordion title="Qwen">
    Mismo backend DashScope que Alibaba. Las entradas de referencia deben ser URL remotas `http(s)`; los archivos locales se rechazan por adelantado.
  </Accordion>

  <Accordion title="Runway">
    Admite archivos locales mediante URI de datos. Video a video requiere `runway/gen4_aleph`. Las ejecuciones de solo texto exponen relaciones de aspecto `16:9` y `9:16`.
  </Accordion>

  <Accordion title="Together">
    Solo una imagen de referencia.
  </Accordion>

  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` directamente para evitar redirecciones que eliminan autenticación. `veo3` se incluye solo como texto a video; `kling` requiere una URL remota de imagen.
  </Accordion>

  <Accordion title="xAI">
    Admite texto a video, image-to-video con una sola imagen de primer fotograma, hasta 7 entradas `reference_image` mediante xAI `reference_images`, y flujos remotos de edición/extensión de video.
  </Accordion>
</AccordionGroup>

## Modos de capacidades de proveedores

El contrato compartido de generación de video ahora permite que los proveedores declaren
capacidades específicas por modo en lugar de solo límites agregados planos. Las nuevas
implementaciones de proveedores deberían preferir bloques de modo explícitos:

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

Los campos agregados planos como `maxInputImages` y `maxInputVideos` no son
suficientes para anunciar compatibilidad con modos de transformación. Los proveedores deben declarar
`generate`, `imageToVideo` y `videoToVideo` explícitamente para que las pruebas en vivo,
las pruebas de contrato y la herramienta compartida `video_generate` puedan validar la compatibilidad de modo
de forma determinista.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores integrados compartidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media video
```

Este archivo en vivo carga las variables de entorno de proveedor que faltan desde `~/.profile`, prioriza
por defecto las claves de API en vivo/env por delante de los perfiles de autenticación almacenados y ejecuta un smoke seguro para lanzamientos por defecto:

- `generate` para cada proveedor del barrido que no sea FAL
- prompt de langosta de un segundo
- límite de operación por proveedor desde `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` por defecto)

FAL es opcional porque la latencia de cola del lado del proveedor puede dominar el tiempo de lanzamiento:

```bash
pnpm test:live:media video --video-providers fal
```

Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados
que el barrido compartido puede ejercitar de forma segura con medios locales:

- `imageToVideo` cuando `capabilities.imageToVideo.enabled`
- `videoToVideo` cuando `capabilities.videoToVideo.enabled` y el proveedor/modelo
  acepta entrada local de video respaldada por buffer en el barrido compartido

Actualmente, el carril en vivo compartido `videoToVideo` cubre:

- `runway` solo cuando seleccionas `runway/gen4_aleph`

## Configuración

Establece el modelo predeterminado de generación de video en tu configuración de OpenClaw:

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

- [Resumen de herramientas](/es/tools)
- [Tareas en segundo plano](/es/automation/tasks) -- seguimiento de tareas para generación asíncrona de video
- [Alibaba Model Studio](/es/providers/alibaba)
- [BytePlus](/es/concepts/model-providers#byteplus-international)
- [ComfyUI](/es/providers/comfy)
- [fal](/es/providers/fal)
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [OpenAI](/es/providers/openai)
- [Qwen](/es/providers/qwen)
- [Runway](/es/providers/runway)
- [Together AI](/es/providers/together)
- [Vydra](/es/providers/vydra)
- [xAI](/es/providers/xai)
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults)
- [Modelos](/es/concepts/models)
