---
read_when:
    - Generación de videos mediante el agente
    - Configuración de proveedores y modelos de generación de video
    - Comprender los parámetros de la herramienta `video_generate`
summary: Genera videos a partir de texto, imágenes o videos existentes usando 14 backends de proveedores
title: Generación de video
x-i18n:
    generated_at: "2026-04-11T15:15:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec159a0bbb6b8a030e68828c0a8bcaf40c8538ecf98bc8ff609dab9d0068263
    source_path: tools/video-generation.md
    workflow: 15
---

# Generación de video

Los agentes de OpenClaw pueden generar videos a partir de indicaciones de texto, imágenes de referencia o videos existentes. Se admiten catorce backends de proveedores, cada uno con diferentes opciones de modelos, modos de entrada y conjuntos de funciones. El agente elige automáticamente el proveedor correcto según tu configuración y las claves de API disponibles.

<Note>
La herramienta `video_generate` solo aparece cuando al menos un proveedor de generación de video está disponible. Si no la ves en las herramientas de tu agente, configura una clave de API de proveedor o establece `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw trata la generación de video como tres modos de ejecución:

- `generate` para solicitudes de texto a video sin medios de referencia
- `imageToVideo` cuando la solicitud incluye una o más imágenes de referencia
- `videoToVideo` cuando la solicitud incluye uno o más videos de referencia

Los proveedores pueden admitir cualquier subconjunto de esos modos. La herramienta valida el modo activo antes del envío e informa los modos admitidos en `action=list`.

## Inicio rápido

1. Configura una clave de API para cualquier proveedor compatible:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcionalmente, fija un modelo predeterminado:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Pídele al agente:

> Genera un video cinematográfico de 5 segundos de una langosta amigable haciendo surf al atardecer.

El agente llama a `video_generate` automáticamente. No se necesita ninguna lista de herramientas permitidas.

## Qué sucede cuando generas un video

La generación de video es asíncrona. Cuando el agente llama a `video_generate` en una sesión:

1. OpenClaw envía la solicitud al proveedor y devuelve inmediatamente un ID de tarea.
2. El proveedor procesa el trabajo en segundo plano (normalmente entre 30 segundos y 5 minutos, según el proveedor y la resolución).
3. Cuando el video está listo, OpenClaw reactiva la misma sesión con un evento interno de finalización.
4. El agente publica el video terminado de vuelta en la conversación original.

Mientras un trabajo está en curso, las llamadas duplicadas a `video_generate` en la misma sesión devuelven el estado actual de la tarea en lugar de iniciar otra generación. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` para comprobar el progreso desde la CLI.

Fuera de las ejecuciones de agente respaldadas por sesión (por ejemplo, invocaciones directas de herramientas), la herramienta recurre a la generación en línea y devuelve la ruta final del medio en el mismo turno.

### Ciclo de vida de la tarea

Cada solicitud de `video_generate` pasa por cuatro estados:

1. **queued** -- tarea creada, esperando a que el proveedor la acepte.
2. **running** -- el proveedor está procesando (normalmente entre 30 segundos y 5 minutos, según el proveedor y la resolución).
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

| Proveedor             | Modelo predeterminado           | Texto | Imagen de ref.                                      | Video de ref.    | Clave de API                             |
| --------------------- | ------------------------------- | ----- | --------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Sí    | Sí (URL remota)                                     | Sí (URL remota)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Sí    | Hasta 2 imágenes (solo modelos I2V; primer + último fotograma) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Sí    | Hasta 2 imágenes (primer + último fotograma mediante rol) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Sí    | Hasta 9 imágenes de referencia                      | Hasta 3 videos   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Sí    | 1 imagen                                            | No               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Sí    | 1 imagen                                            | No               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Sí    | 1 imagen                                            | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Sí    | 1 imagen                                            | No               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Sí    | 1 imagen                                            | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Sí    | Sí (URL remota)                                     | Sí (URL remota)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Sí    | 1 imagen                                            | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Sí    | 1 imagen                                            | No               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Sí    | 1 imagen (`kling`)                                  | No               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Sí    | 1 imagen                                            | 1 video          | `XAI_API_KEY`                            |

Algunos proveedores aceptan variables de entorno adicionales o alternativas para la clave de API. Consulta las [páginas de proveedores](#related) individuales para más detalles.

Ejecuta `video_generate action=list` para inspeccionar los proveedores, modelos y
modos de ejecución disponibles en tiempo de ejecución.

### Matriz de capacidades declaradas

Este es el contrato explícito de modos utilizado por `video_generate`, las pruebas de contrato
y el barrido compartido en vivo.

| Proveedor | `generate` | `imageToVideo` | `videoToVideo` | Carriles compartidos en vivo hoy                                                                                                         |
| --------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video remotas `http(s)`                       |
| BytePlus  | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI   | Sí         | Sí             | No             | No está en el barrido compartido; la cobertura específica del flujo de trabajo vive con las pruebas de Comfy                            |
| fal       | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                               |
| Google    | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; el `videoToVideo` compartido se omite porque el barrido actual de Gemini/Veo respaldado por búfer no acepta esa entrada |
| MiniMax   | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI    | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; el `videoToVideo` compartido se omite porque esta ruta de organización/entrada actualmente necesita acceso del lado del proveedor a inpaint/remix |
| Qwen      | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video remotas `http(s)`                       |
| Runway    | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` solo se ejecuta cuando el modelo seleccionado es `runway/gen4_aleph`                         |
| Together  | Sí         | Sí             | No             | `generate`, `imageToVideo`                                                                                                               |
| Vydra     | Sí         | Sí             | No             | `generate`; el `imageToVideo` compartido se omite porque `veo3` incluido solo acepta texto y `kling` incluido requiere una URL de imagen remota |
| xAI       | Sí         | Sí             | Sí             | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor actualmente necesita una URL MP4 remota                       |

## Parámetros de la herramienta

### Obligatorios

| Parámetro | Tipo   | Descripción                                                                  |
| --------- | ------ | ---------------------------------------------------------------------------- |
| `prompt`  | string | Descripción en texto del video que se va a generar (obligatorio para `action: "generate"`) |

### Entradas de contenido

| Parámetro    | Tipo     | Descripción                                                                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Imagen de referencia única (ruta o URL)                                                                                                |
| `images`     | string[] | Varias imágenes de referencia (hasta 9)                                                                                                |
| `imageRoles` | string[] | Pistas de rol opcionales por posición, paralelas a la lista combinada de imágenes. Valores canónicos: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Video de referencia único (ruta o URL)                                                                                                 |
| `videos`     | string[] | Varios videos de referencia (hasta 4)                                                                                                  |
| `videoRoles` | string[] | Pistas de rol opcionales por posición, paralelas a la lista combinada de videos. Valor canónico: `reference_video`                    |
| `audioRef`   | string   | Audio de referencia único (ruta o URL). Se usa, por ejemplo, para música de fondo o referencia de voz cuando el proveedor admite entradas de audio |
| `audioRefs`  | string[] | Varios audios de referencia (hasta 3)                                                                                                  |
| `audioRoles` | string[] | Pistas de rol opcionales por posición, paralelas a la lista combinada de audios. Valor canónico: `reference_audio`                    |

Las pistas de rol se reenvían al proveedor tal como están. Los valores canónicos provienen
de la unión `VideoGenerationAssetRole`, pero los proveedores pueden aceptar cadenas
de rol adicionales. Los arreglos `*Roles` no deben tener más entradas que la
lista de referencias correspondiente; los errores de desfase fallan con un error claro.
Usa una cadena vacía para dejar una posición sin establecer.

### Controles de estilo

| Parámetro         | Tipo    | Descripción                                                                                 |
| ----------------- | ------- | ------------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` o `adaptive`      |
| `resolution`      | string  | `480P`, `720P`, `768P` o `1080P`                                                            |
| `durationSeconds` | number  | Duración objetivo en segundos (redondeada al valor compatible más cercano del proveedor)    |
| `size`            | string  | Sugerencia de tamaño cuando el proveedor lo admite                                          |
| `audio`           | boolean | Habilita el audio generado en la salida cuando se admite. Es distinto de `audioRef*` (entradas) |
| `watermark`       | boolean | Activa o desactiva la marca de agua del proveedor cuando se admite                          |

`adaptive` es un valor centinela específico del proveedor: se reenvía tal cual a
los proveedores que declaran `adaptive` en sus capacidades (por ejemplo, BytePlus
Seedance lo usa para detectar automáticamente la relación de aspecto a partir de las
dimensiones de la imagen de entrada). Los proveedores que no lo declaran muestran el valor mediante
`details.ignoredOverrides` en el resultado de la herramienta para que la omisión sea visible.

### Avanzado

| Parámetro         | Tipo   | Descripción                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (predeterminado), `"status"` o `"list"`                                                                                                                                                                                                                                                                                                       |
| `model`           | string | Anulación de proveedor/modelo (por ejemplo, `runway/gen4.5`)                                                                                                                                                                                                                                                                                               |
| `filename`        | string | Sugerencia de nombre de archivo de salida                                                                                                                                                                                                                                                                                                                  |
| `providerOptions` | object | Opciones específicas del proveedor como objeto JSON (por ejemplo, `{"seed": 42, "draft": true}`). Los proveedores que declaran un esquema tipado validan las claves y los tipos; las claves desconocidas o las discrepancias hacen que se omita el candidato durante el fallback. Los proveedores sin un esquema declarado reciben las opciones tal como están. Ejecuta `video_generate action=list` para ver qué acepta cada proveedor |

No todos los proveedores admiten todos los parámetros. OpenClaw ya normaliza la duración al valor compatible más cercano del proveedor, y también reasigna sugerencias de geometría traducidas, como tamaño a relación de aspecto, cuando un proveedor de fallback expone una superficie de control diferente. Las anulaciones realmente no compatibles se ignoran en la medida de lo posible y se informan como advertencias en el resultado de la herramienta. Los límites estrictos de capacidad (como demasiadas entradas de referencia) fallan antes del envío.

Los resultados de la herramienta informan la configuración aplicada. Cuando OpenClaw reasigna la duración o la geometría durante el fallback del proveedor, los valores devueltos `durationSeconds`, `size`, `aspectRatio` y `resolution` reflejan lo que se envió, y `details.normalization` captura la traducción de solicitado a aplicado.

Las entradas de referencia también seleccionan el modo de ejecución:

- Sin medios de referencia: `generate`
- Cualquier imagen de referencia: `imageToVideo`
- Cualquier video de referencia: `videoToVideo`
- Las entradas de audio de referencia no cambian el modo resuelto; se aplican además del modo que seleccionen las referencias de imagen/video, y solo funcionan con proveedores que declaran `maxInputAudios`

Las referencias mixtas de imagen y video no son una superficie de capacidad compartida estable.
Prefiere un tipo de referencia por solicitud.

#### Fallback y opciones tipadas

Algunas comprobaciones de capacidad se aplican en la capa de fallback en lugar del
límite de la herramienta para que una solicitud que exceda los límites del proveedor principal
aún pueda ejecutarse en un fallback compatible:

- Si el candidato activo no declara `maxInputAudios` (o lo declara como
  `0`), se omite cuando la solicitud contiene referencias de audio, y se
  prueba el siguiente candidato.
- Si `maxDurationSeconds` del candidato activo está por debajo de los
  `durationSeconds` solicitados y el candidato no declara una lista
  `supportedDurationSeconds`, se omite.
- Si la solicitud contiene `providerOptions` y el candidato activo
  declara explícitamente un esquema tipado de `providerOptions`, el candidato se
  omite cuando las claves proporcionadas no están en el esquema o los tipos de valor no
  coinciden. Los proveedores que aún no han declarado un esquema reciben las
  opciones tal como están (paso directo compatible con versiones anteriores). Un proveedor puede
  excluir explícitamente todas las opciones del proveedor declarando un esquema vacío
  (`capabilities.providerOptions: {}`), lo que provoca la misma omisión que una
  discrepancia de tipo.

La primera razón de omisión en una solicitud se registra en `warn` para que los operadores vean
cuándo se pasó por alto su proveedor principal; las omisiones posteriores se registran en
`debug` para mantener silenciosas las cadenas largas de fallback. Si se omiten todos los candidatos,
el error agregado incluye la razón de omisión de cada uno.

## Acciones

- **generate** (predeterminado) -- crea un video a partir de la indicación dada y las entradas de referencia opcionales.
- **status** -- comprueba el estado de la tarea de video en curso para la sesión actual sin iniciar otra generación.
- **list** -- muestra los proveedores disponibles, los modelos y sus capacidades.

## Selección de modelo

Al generar un video, OpenClaw resuelve el modelo en este orden:

1. **Parámetro de herramienta `model`** -- si el agente especifica uno en la llamada.
2. **`videoGenerationModel.primary`** -- desde la configuración.
3. **`videoGenerationModel.fallbacks`** -- se prueban en orden.
4. **Detección automática** -- usa proveedores que tienen autenticación válida, comenzando por el proveedor predeterminado actual y luego los proveedores restantes en orden alfabético.

Si un proveedor falla, el siguiente candidato se prueba automáticamente. Si todos los candidatos fallan, el error incluye detalles de cada intento.

Establece `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que
la generación de video use solo las entradas explícitas `model`, `primary` y `fallbacks`.

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

| Proveedor             | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba               | Usa el endpoint asíncrono de DashScope/Model Studio. Las imágenes y videos de referencia deben ser URL remotas `http(s)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| BytePlus (1.0)        | Id. de proveedor `byteplus`. Modelos: `seedance-1-0-pro-250528` (predeterminado), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`. Los modelos T2V (`*-t2v-*`) no aceptan entradas de imagen; los modelos I2V y los modelos generales `*-pro-*` admiten una sola imagen de referencia (primer fotograma). Pasa la imagen por posición o establece `role: "first_frame"`. Los IDs de modelos T2V se cambian automáticamente a la variante I2V correspondiente cuando se proporciona una imagen. Claves `providerOptions` compatibles: `seed` (number), `draft` (boolean, fuerza 480p), `camera_fixed` (boolean). |
| BytePlus Seedance 1.5 | Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Id. de proveedor `byteplus-seedance15`. Modelo: `seedance-1-5-pro-251215`. Usa la API unificada `content[]`. Admite como máximo 2 imágenes de entrada (first_frame + last_frame). Todas las entradas deben ser URL remotas `https://`. Establece `role: "first_frame"` / `"last_frame"` en cada imagen o pasa las imágenes por posición. `aspectRatio: "adaptive"` detecta automáticamente la proporción a partir de la imagen de entrada. `audio: true` se asigna a `generate_audio`. `providerOptions.seed` (number) se reenvía.                                                                 |
| BytePlus Seedance 2.0 | Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Id. de proveedor `byteplus-seedance2`. Modelos: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`. Usa la API unificada `content[]`. Admite hasta 9 imágenes de referencia, 3 videos de referencia y 3 audios de referencia. Todas las entradas deben ser URL remotas `https://`. Establece `role` en cada recurso — valores compatibles: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`. `aspectRatio: "adaptive"` detecta automáticamente la proporción a partir de la imagen de entrada. `audio: true` se asigna a `generate_audio`. `providerOptions.seed` (number) se reenvía. |
| ComfyUI               | Ejecución local o en la nube basada en flujos de trabajo. Admite texto a video e imagen a video mediante el grafo configurado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| fal                   | Usa un flujo respaldado por cola para trabajos de larga duración. Solo una imagen de referencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Google                | Usa Gemini/Veo. Admite una imagen o un video de referencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| MiniMax               | Solo una imagen de referencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| OpenAI                | Solo se reenvía la anulación `size`. Las demás anulaciones de estilo (`aspectRatio`, `resolution`, `audio`, `watermark`) se ignoran con una advertencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Qwen                  | Mismo backend de DashScope que Alibaba. Las entradas de referencia deben ser URL remotas `http(s)`; los archivos locales se rechazan de antemano.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Runway                | Admite archivos locales mediante URI de datos. Video a video requiere `runway/gen4_aleph`. Las ejecuciones solo de texto exponen relaciones de aspecto `16:9` y `9:16`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Together              | Solo una imagen de referencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Vydra                 | Usa `https://www.vydra.ai/api/v1` directamente para evitar redirecciones que eliminan la autenticación. `veo3` se incluye solo como texto a video; `kling` requiere una URL remota de imagen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| xAI                   | Admite flujos de texto a video, imagen a video y edición/extensión de video remoto.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Modos de capacidad del proveedor

El contrato compartido de generación de video ahora permite a los proveedores declarar
capacidades específicas por modo en lugar de solo límites agregados planos. Las nuevas
implementaciones de proveedores deben preferir bloques de modo explícitos:

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
suficientes para anunciar compatibilidad con el modo de transformación. Los proveedores deben declarar
`generate`, `imageToVideo` y `videoToVideo` explícitamente para que las pruebas en vivo,
las pruebas de contrato y la herramienta compartida `video_generate` puedan validar la compatibilidad de modo
de forma determinista.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores incluidos compartidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media video
```

Este archivo en vivo carga las variables de entorno de proveedores que faltan desde `~/.profile`, prioriza
las claves de API en vivo/de entorno por delante de los perfiles de autenticación almacenados de forma predeterminada,
y ejecuta los modos declarados que puede probar con seguridad con medios locales:

- `generate` para cada proveedor del barrido
- `imageToVideo` cuando `capabilities.imageToVideo.enabled`
- `videoToVideo` cuando `capabilities.videoToVideo.enabled` y el proveedor/modelo
  acepta entrada de video local respaldada por búfer en el barrido compartido

Hoy, el carril compartido en vivo `videoToVideo` cubre:

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

- [Descripción general de herramientas](/es/tools)
- [Tareas en segundo plano](/es/automation/tasks) -- seguimiento de tareas para la generación asíncrona de video
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
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults)
- [Modelos](/es/concepts/models)
