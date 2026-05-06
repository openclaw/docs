---
read_when:
    - Generación de videos mediante el agente
    - Configuración de proveedores y modelos de generación de video
    - Comprender los parámetros de la herramienta video_generate
sidebarTitle: Video generation
summary: Genera videos mediante video_generate a partir de referencias de texto, imagen o video en 16 backends de proveedores
title: Generación de video
x-i18n:
    generated_at: "2026-05-06T05:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebc8b61785f69c1354951be2d6b3e7b437c99994513f13e19faf3a9e420263fb
    source_path: tools/video-generation.md
    workflow: 16
---

Los agentes de OpenClaw pueden generar videos a partir de prompts de texto, imágenes de referencia o
videos existentes. Se admiten dieciséis backends de proveedores, cada uno con
diferentes opciones de modelo, modos de entrada y conjuntos de funciones. El agente elige el
proveedor adecuado automáticamente según tu configuración y las claves de API
disponibles.

<Note>
La herramienta `video_generate` solo aparece cuando hay al menos un proveedor de
generación de video disponible. Si no la ves en las herramientas de tu agente,
configura una clave de API de proveedor o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw trata la generación de video como tres modos de tiempo de ejecución:

- `generate` - solicitudes de texto a video sin medios de referencia.
- `imageToVideo` - la solicitud incluye una o más imágenes de referencia.
- `videoToVideo` - la solicitud incluye uno o más videos de referencia.

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
  <Step title="Pedir al agente">
    > Genera un video cinematográfico de 5 segundos de una langosta amigable surfeando al atardecer.

    El agente llama a `video_generate` automáticamente. No es necesario incluir
    la herramienta en una lista de permitidas.

  </Step>
</Steps>

## Cómo funciona la generación asíncrona

La generación de video es asíncrona. Cuando el agente llama a `video_generate` en una
sesión:

1. OpenClaw envía la solicitud al proveedor y devuelve inmediatamente un id. de tarea.
2. El proveedor procesa el trabajo en segundo plano (por lo general, de 30 segundos a varios minutos según el proveedor y la resolución; los proveedores lentos respaldados por cola pueden ejecutarse hasta el tiempo de espera configurado).
3. Cuando el video está listo, OpenClaw reactiva la misma sesión con un evento interno de finalización.
4. El agente informa al usuario y adjunta el video finalizado. En chats de grupo/canal
   que usan entrega visible solo mediante la herramienta de mensajes, el agente transmite el
   resultado a través de la herramienta de mensajes en lugar de que OpenClaw lo publique directamente.

Mientras un trabajo está en curso, las llamadas duplicadas a `video_generate` en la misma
sesión devuelven el estado actual de la tarea en lugar de iniciar otra
generación. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` para
consultar el progreso desde la CLI.

Fuera de ejecuciones de agente respaldadas por sesión (por ejemplo, invocaciones directas de herramientas),
la herramienta recurre a la generación en línea y devuelve la ruta final del medio
en el mismo turno.

Los archivos de video generados se guardan en el almacenamiento de medios administrado por OpenClaw cuando
el proveedor devuelve bytes. El límite predeterminado de guardado de videos generados sigue
el límite de medios de video, y `agents.defaults.mediaMaxMb` lo aumenta para
renderizados más grandes. Cuando un proveedor también devuelve una URL de salida alojada, OpenClaw
puede entregar esa URL en lugar de hacer fallar la tarea si la persistencia local
rechaza un archivo demasiado grande.

### Ciclo de vida de la tarea

| Estado      | Significado                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tarea creada, en espera de que el proveedor la acepte.                                                 |
| `running`   | El proveedor está procesando (por lo general, de 30 segundos a varios minutos según el proveedor y la resolución). |
| `succeeded` | Video listo; el agente se reactiva y lo publica en la conversación.                                    |
| `failed`    | Error del proveedor o tiempo de espera agotado; el agente se reactiva con detalles del error.          |

Consulta el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Si una tarea de video ya está `queued` o `running` para la sesión actual,
`video_generate` devuelve el estado de la tarea existente en lugar de iniciar una
nueva. Usa `action: "status"` para consultar explícitamente sin activar una nueva
generación.

## Proveedores compatibles

| Proveedor             | Modelo predeterminado           | Texto | Ref. de imagen                                      | Ref. de video                                  | Autenticación                            |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Sí (URL remota)                                      | Sí (URL remota)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Hasta 2 imágenes (solo modelos I2V; primer + último fotograma) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Hasta 2 imágenes (primer + último fotograma mediante rol) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Hasta 9 imágenes de referencia                       | Hasta 3 videos                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 imagen                                             | -                                               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`  |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 imagen; hasta 9 con Seedance reference-to-video    | Hasta 3 videos con Seedance reference-to-video  | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 imagen                                             | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 imagen                                             | -                                               | `MINIMAX_API_KEY` o MiniMax OAuth        |
| OpenAI                | `sora-2`                        |  ✓   | 1 imagen                                             | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Hasta 4 imágenes (primer/último fotograma o referencias) | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Sí (URL remota)                                      | Sí (URL remota)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 imagen                                             | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 imagen                                             | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 imagen (`kling`)                                   | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 imagen de primer fotograma o hasta 7 `reference_image`s | 1 video                                         | `XAI_API_KEY`                            |

Algunos proveedores aceptan variables de entorno de claves de API adicionales o alternativas. Consulta
las [páginas de proveedores](#related) individuales para obtener detalles.

Ejecuta `video_generate action=list` para inspeccionar los proveedores, modelos y
modos de tiempo de ejecución disponibles durante la ejecución.

### Matriz de capacidades

El contrato de modo explícito usado por `video_generate`, las pruebas de contrato y
el barrido en vivo compartido:

| Proveedor  | `generate` | `imageToVideo` | `videoToVideo` | Carriles en vivo compartidos hoy                                                                                                         |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video `http(s)` remotas                        |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | No está en el barrido compartido; la cobertura específica de flujos de trabajo vive con las pruebas de Comfy                             |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; los esquemas de video nativos de DeepInfra son de texto a video en el contrato incluido                                      |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo al usar Seedance reference-to-video                                                      |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque el barrido actual de Gemini/Veo respaldado por búfer no acepta esa entrada |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartido se omite porque esta organización/ruta de entrada actualmente necesita acceso a inpaint/remix del lado del proveedor |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor necesita URL de video `http(s)` remotas                        |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se ejecuta solo cuando el modelo seleccionado es `runway/gen4_aleph`                          |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; `imageToVideo` compartido se omite porque el `veo3` incluido es solo de texto y el `kling` incluido requiere una URL de imagen remota |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` se omite porque este proveedor actualmente necesita una URL MP4 remota                        |

## Parámetros de la herramienta

### Obligatorios

<ParamField path="prompt" type="string" required>
  Descripción textual del video que se generará. Obligatorio para `action: "generate"`.
</ParamField>

### Entradas de contenido

<ParamField path="image" type="string">Una sola imagen de referencia (ruta o URL).</ParamField>
<ParamField path="images" type="string[]">Múltiples imágenes de referencia (hasta 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Sugerencias de rol opcionales por posición, paralelas a la lista combinada de imágenes.
Valores canónicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Un solo video de referencia (ruta o URL).</ParamField>
<ParamField path="videos" type="string[]">Múltiples videos de referencia (hasta 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Sugerencias de rol opcionales por posición, paralelas a la lista combinada de videos.
Valor canónico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Un solo audio de referencia (ruta o URL). Se usa para música de fondo o referencia
de voz cuando el proveedor admite entradas de audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Múltiples audios de referencia (hasta 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Sugerencias de rol opcionales por posición, paralelas a la lista combinada de audio.
Valor canónico: `reference_audio`.
</ParamField>

<Note>
Las sugerencias de rol se reenvían al proveedor tal cual. Los valores canónicos provienen de
la unión `VideoGenerationAssetRole`, pero los proveedores pueden aceptar cadenas de rol
adicionales. Los arrays `*Roles` no deben tener más entradas que la lista de referencias
correspondiente; los errores de desfase por uno fallan con un error claro.
Use una cadena vacía para dejar una ranura sin configurar. Para xAI, establezca cada rol de imagen en
`reference_image` para usar su modo de generación `reference_images`; omita el
rol o use `first_frame` para imagen a video con una sola imagen.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  Sugerencia de relación de aspecto, como `1:1`, `16:9`, `9:16`, `adaptive` o un valor específico del proveedor. OpenClaw normaliza o ignora los valores no admitidos por proveedor.
</ParamField>
<ParamField path="resolution" type="string">Sugerencia de resolución, como `480P`, `720P`, `768P`, `1080P`, `4K` o un valor específico del proveedor. OpenClaw normaliza o ignora los valores no admitidos por proveedor.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos (redondeada al valor admitido por el proveedor más cercano).
</ParamField>
<ParamField path="size" type="string">Sugerencia de tamaño cuando el proveedor la admite.</ParamField>
<ParamField path="audio" type="boolean">
  Habilita el audio generado en la salida cuando se admite. Es distinto de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Activa o desactiva la marca de agua del proveedor cuando se admite.</ParamField>

`adaptive` es un valor centinela específico del proveedor: se reenvía tal cual a
los proveedores que declaran `adaptive` en sus capacidades (por ejemplo, BytePlus
Seedance lo usa para detectar automáticamente la relación a partir de las dimensiones
de la imagen de entrada). Los proveedores que no lo declaran muestran el valor mediante
`details.ignoredOverrides` en el resultado de la herramienta para que la omisión sea visible.

### Avanzado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea de sesión actual; `"list"` inspecciona proveedores.
</ParamField>
<ParamField path="model" type="string">Anulación de proveedor/modelo (por ejemplo, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Sugerencia de nombre de archivo de salida.</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional de la operación del proveedor en milisegundos.</ParamField>
<ParamField path="providerOptions" type="object">
  Opciones específicas del proveedor como objeto JSON (por ejemplo, `{"seed": 42, "draft": true}`).
  Los proveedores que declaran un esquema tipado validan las claves y los tipos; las claves
  desconocidas o las discrepancias omiten el candidato durante el respaldo. Los proveedores sin un
  esquema declarado reciben las opciones tal cual. Ejecute `video_generate action=list`
  para ver qué acepta cada proveedor.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw normaliza la duración al
valor admitido por el proveedor más cercano y reasigna sugerencias de geometría traducidas,
como tamaño a relación de aspecto, cuando un proveedor de respaldo expone una superficie de
control diferente. Las anulaciones realmente no admitidas se ignoran bajo un criterio de mejor
esfuerzo y se informan como advertencias en el resultado de la herramienta. Los límites estrictos
de capacidad (como demasiadas entradas de referencia) fallan antes del envío. Los resultados de la herramienta
informan la configuración aplicada; `details.normalization` captura cualquier
traducción de solicitado a aplicado.
</Note>

Las entradas de referencia seleccionan el modo de ejecución:

- Sin medios de referencia → `generate`
- Cualquier referencia de imagen → `imageToVideo`
- Cualquier referencia de video → `videoToVideo`
- Las entradas de audio de referencia **no** cambian el modo resuelto; se aplican encima
  del modo que seleccionen las referencias de imagen/video y solo funcionan
  con proveedores que declaran `maxInputAudios`.

Las referencias mixtas de imagen y video no son una superficie de capacidad compartida estable.
Prefiera un tipo de referencia por solicitud.

#### Respaldo y opciones tipadas

Algunas comprobaciones de capacidad se aplican en la capa de respaldo y no en el
límite de la herramienta, por lo que una solicitud que excede los límites del proveedor principal puede
ejecutarse igualmente en un respaldo capaz:

- El candidato activo que no declara `maxInputAudios` (o declara `0`) se omite cuando
  la solicitud contiene referencias de audio; se prueba el siguiente candidato.
- El `maxDurationSeconds` del candidato activo está por debajo del `durationSeconds` solicitado
  sin una lista `supportedDurationSeconds` declarada → se omite.
- La solicitud contiene `providerOptions` y el candidato activo declara explícitamente
  un esquema `providerOptions` tipado → se omite si las claves suministradas
  no están en el esquema o los tipos de valor no coinciden. Los proveedores sin un
  esquema declarado reciben las opciones tal cual (paso directo compatible hacia atrás).
  Un proveedor puede excluirse de todas las opciones de proveedor declarando un esquema vacío
  (`capabilities.providerOptions: {}`), lo que causa la misma omisión que una discrepancia de tipo.

El primer motivo de omisión en una solicitud se registra en `warn` para que los operadores vean cuándo
su proveedor principal fue descartado; las omisiones posteriores se registran en `debug` para
mantener silenciosas las cadenas de respaldo largas. Si se omiten todos los candidatos, el
error agregado incluye el motivo de omisión de cada uno.

## Acciones

| Acción     | Qué hace                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Predeterminado. Crea un video a partir del prompt dado y las entradas de referencia opcionales.                             |
| `status`   | Comprueba el estado de la tarea de video en curso para la sesión actual sin iniciar otra generación. |
| `list`     | Muestra los proveedores, modelos y sus capacidades disponibles.                                                |

## Selección de modelo

OpenClaw resuelve el modelo en este orden:

1. **Parámetro de herramienta `model`** - si el agente especifica uno en la llamada.
2. **`videoGenerationModel.primary`** de la configuración.
3. **`videoGenerationModel.fallbacks`** en orden.
4. **Detección automática** - proveedores que tienen autenticación válida, empezando por el
   proveedor predeterminado actual y luego los proveedores restantes en orden alfabético.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si todos los
candidatos fallan, el error incluye detalles de cada intento.

Establezca `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
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

## Notas del proveedor

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa el endpoint asíncrono de DashScope / Model Studio. Las imágenes y los
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
    Los ID de modelo T2V se cambian automáticamente a la variante I2V correspondiente
    cuando se proporciona una imagen.

    Claves `providerOptions` admitidas: `seed` (número), `draft` (booleano -
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

    `aspectRatio: "adaptive"` detecta automáticamente la relación a partir de la imagen de entrada.
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
    `https://` remotas. Establezca `role` en cada recurso - valores admitidos:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automáticamente la relación a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (número) se reenvía.

  </Accordion>
  <Accordion title="ComfyUI">
    Ejecución local o en la nube guiada por flujos de trabajo. Admite texto a video e
    imagen a video mediante el grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa un flujo respaldado por cola para trabajos de larga duración. OpenClaw espera hasta 20
    minutos de forma predeterminada antes de tratar como agotado el tiempo de espera de un trabajo de cola fal en curso. La mayoría de los modelos de video de fal
    aceptan una sola referencia de imagen. Los modelos de referencia a video
    Seedance 2.0 aceptan hasta 9 imágenes, 3 videos y 3 referencias de audio, con
    un máximo de 12 archivos de referencia en total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Admite una referencia de imagen o una referencia de video. Las solicitudes de audio generado se
    ignoran con una advertencia en la ruta de la API de Gemini porque esa API rechaza
    el parámetro `generateAudio` para la generación de video actual de Veo.
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
    Usa la API asíncrona `/videos` de OpenRouter. OpenClaw envía el
    trabajo, sondea `polling_url` y descarga `unsigned_urls` o el
    endpoint de contenido de trabajo documentado. El valor predeterminado empaquetado `google/veo-3.1-fast`
    anuncia duraciones de 4/6/8 segundos, resoluciones `720P`/`1080P` y
    relaciones de aspecto `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    El mismo backend DashScope que Alibaba. Las entradas de referencia deben ser URL remotas
    `http(s)`; los archivos locales se rechazan por adelantado.
  </Accordion>
  <Accordion title="Runway">
    Admite archivos locales mediante URI de datos. Video a video requiere
    `runway/gen4_aleph`. Las ejecuciones solo con texto exponen relaciones de aspecto
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
    Admite texto a video, imagen a video con un único primer fotograma, hasta 7
    entradas `reference_image` mediante `reference_images` de xAI y flujos remotos
    de edición/extensión de video.
  </Accordion>
</AccordionGroup>

## Modos de capacidad de proveedor

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

Los campos agregados planos como `maxInputImages` y `maxInputVideos` **no** son
suficientes para anunciar compatibilidad con modos de transformación. Los proveedores deberían
declarar `generate`, `imageToVideo` y `videoToVideo` explícitamente para que las
pruebas en vivo, las pruebas de contrato y la herramienta compartida `video_generate` puedan validar
la compatibilidad de modos de forma determinista.

Cuando un modelo de un proveedor tenga una compatibilidad más amplia con entradas de referencia que el
resto, usa `maxInputImagesByModel`, `maxInputVideosByModel` o
`maxInputAudiosByModel` en lugar de elevar el límite de todo el modo.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores empaquetados compartidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Contenedor del repositorio:

```bash
pnpm test:live:media video
```

Este archivo en vivo carga las variables de entorno faltantes del proveedor desde `~/.profile`, prefiere
claves de API en vivo/de entorno por encima de los perfiles de autenticación almacenados de forma predeterminada y ejecuta un
smoke seguro para versiones de forma predeterminada:

- `generate` para cada proveedor que no sea FAL en el barrido.
- Prompt de langosta de un segundo.
- Límite de operación por proveedor desde
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada).

FAL es opcional porque la latencia de cola del lado del proveedor puede dominar el tiempo
de publicación:

```bash
pnpm test:live:media video --video-providers fal
```

Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los
modos de transformación declarados que el barrido compartido puede ejercitar de forma segura con medios locales:

- `imageToVideo` cuando `capabilities.imageToVideo.enabled`.
- `videoToVideo` cuando `capabilities.videoToVideo.enabled` y el
  proveedor/modelo acepta entrada de video local respaldada por búfer en el barrido
  compartido.

Hoy, la línea en vivo compartida de `videoToVideo` cubre `runway` solo cuando
seleccionas `runway/gen4_aleph`.

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

- [Alibaba Model Studio](/es/providers/alibaba)
- [Tareas en segundo plano](/es/automation/tasks) - seguimiento de tareas para generación asíncrona de video
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
