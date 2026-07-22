---
read_when:
    - Generación de vídeos mediante el agente
    - Configuración de proveedores y modelos de generación de vídeo
    - Descripción de los parámetros de la herramienta video_generate
sidebarTitle: Video generation
summary: Genera vídeos mediante `video_generate` a partir de referencias de texto, imagen o vídeo en 16 backends de proveedores
title: Generación de video
x-i18n:
    generated_at: "2026-07-22T10:52:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4afc9338fdfdc269b50b949b6d1a186e3a2064ed4ee40a41722efea40ae791aa
    source_path: tools/video-generation.md
    workflow: 16
---

Los agentes de OpenClaw generan vídeos a partir de indicaciones de texto, imágenes de referencia o
vídeos existentes mediante `video_generate`. Se admiten dieciséis backends de
proveedores; el agente elige automáticamente el adecuado según la configuración y
las claves de API disponibles.

<Note>
`video_generate` solo aparece cuando hay al menos un proveedor de generación de vídeo
disponible. Si no figura entre las herramientas del agente, establezca una clave de API del proveedor o
configure `agents.defaults.mediaModels.video`.
</Note>

`video_generate` tiene tres modos de ejecución, determinados a partir de las entradas de referencia
de la llamada:

- `generate` - sin contenido multimedia de referencia (texto a vídeo).
- `imageToVideo` - una o más imágenes de referencia.
- `videoToVideo` - uno o más vídeos de referencia.

Los proveedores pueden admitir cualquier subconjunto de esos modos. La herramienta valida el
modo activo antes del envío e informa de los modos admitidos en `action=list`.

## Inicio rápido

<Steps>
  <Step title="Configurar la autenticación">
    Establezca una clave de API para cualquier proveedor compatible:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Elegir un modelo predeterminado (opcional)">
    ```bash
    openclaw config set agents.defaults.mediaModels.video.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Solicitarlo al agente">
    > Genera un vídeo cinematográfico de 5 segundos de una langosta amistosa surfeando al atardecer.

    El agente llama automáticamente a `video_generate`. No es necesario incluir
    la herramienta en una lista de permitidas.

  </Step>
</Steps>

## Cómo funciona la generación asíncrona

La generación de vídeo es asíncrona:

1. OpenClaw envía la solicitud al proveedor y devuelve inmediatamente un id de tarea.
2. El proveedor procesa el trabajo en segundo plano (normalmente entre 30 segundos y varios minutos, según el proveedor y la resolución; los proveedores lentos respaldados por colas pueden ejecutarse hasta alcanzar el tiempo de espera configurado).
3. Cuando el vídeo está listo, OpenClaw reactiva la misma sesión con un evento interno de finalización.
4. El agente informa de ello mediante el modo normal de respuesta visible de la sesión:
   una respuesta final automática, o `message(action="send")` cuando la sesión requiere
   la herramienta de mensajes. Si la sesión solicitante está inactiva, o si falla su reactivación y
   el contenido multimedia generado sigue sin aparecer en la respuesta de finalización, OpenClaw envía
   directamente una alternativa idempotente con el contenido multimedia.

Mientras hay un trabajo en curso, las llamadas duplicadas a `video_generate` en la misma
sesión devuelven el estado actual de la tarea en lugar de iniciar otra
generación. Use `action: "status"` para comprobarlo sin activar una nueva
generación, o `openclaw tasks list` / `openclaw tasks show <lookup>` desde la
CLI (consulte [Tareas en segundo plano](/es/automation/tasks)).

Fuera de las ejecuciones del agente respaldadas por una sesión (por ejemplo, las invocaciones directas de herramientas),
la herramienta recurre a la generación en línea y devuelve la ruta final del contenido multimedia
en el mismo turno.

Los archivos de vídeo generados se guardan en el almacenamiento multimedia administrado por OpenClaw cuando el
proveedor devuelve bytes. El límite predeterminado es de 16MB (el límite compartido de contenido multimedia de
vídeo); `agents.defaults.mediaMaxMb` lo aumenta para renderizaciones más grandes. Cuando un
proveedor también devuelve una URL de salida alojada, OpenClaw entrega esa URL en lugar
de marcar la tarea como fallida si la persistencia local rechaza un archivo demasiado grande.

### Ciclo de vida de las tareas

| Estado       | Significado                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tarea creada, a la espera de que el proveedor la acepte.                                               |
| `running`   | El proveedor está procesándola (normalmente entre 30 segundos y varios minutos, según el proveedor y la resolución). |
| `succeeded` | El vídeo está listo; el agente se reactiva y lo publica en la conversación.                            |
| `failed`    | Error del proveedor o tiempo de espera agotado; el agente se reactiva con los detalles del error.       |

Compruebe el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Proveedores compatibles

| Proveedor             | Modelo predeterminado            | Texto | Referencia de imagen                                 | Referencia de vídeo                            | Autenticación                            |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Sí (URL remota)                                      | Sí (URL remota)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (incluido)   | `seedance-1-0-pro-250528`       |  ✓   | Hasta 2 imágenes (primer y último fotograma)         | -                                               | `BYTEPLUS_API_KEY`                       |
| Plugin BytePlus 1.5   | `seedance-1-5-pro-251215`       |  ✓   | Hasta 2 imágenes (primer y último fotograma mediante rol) | -                                          | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Hasta 9 imágenes de referencia                       | Hasta 3 vídeos                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 imagen                                             | -                                               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 imagen; hasta 9 con referencia a vídeo de Seedance | Hasta 3 vídeos con referencia a vídeo de Seedance | `FAL_KEY`                    |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 imagen                                             | 1 vídeo                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 imagen                                             | -                                               | `MINIMAX_API_KEY` o OAuth de MiniMax    |
| OpenAI                | `sora-2`                        |  ✓   | 1 imagen                                             | 1 vídeo                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Hasta 4 imágenes (primer/último fotograma o referencias) | -                                           | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Sí (URL remota)                                      | Sí (URL remota)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 imagen                                             | 1 vídeo                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | Solo `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 imagen (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Clásico: 1 primer fotograma o 7 referencias; 1.5: 1 fotograma | Clásico: 1 vídeo                         | `XAI_API_KEY`                            |

Algunos proveedores aceptan variables de entorno de claves de API adicionales o alternativas. Consulte
las [páginas de cada proveedor](#related) para obtener más información.

Ejecute `video_generate action=list` para inspeccionar en tiempo de ejecución los proveedores, modelos y
modos de ejecución disponibles.

### Matriz de capacidades

El contrato de modos explícito utilizado por `video_generate`, las pruebas de contrato y
el barrido compartido en vivo:

| Proveedor  | `generate` | `imageToVideo` | `videoToVideo` | Carriles compartidos en vivo actualmente                                                                                               |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; se omite `videoToVideo` porque este proveedor necesita URL de vídeo `http(s)` remotas                           |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | No se incluye en el barrido compartido; la cobertura específica del flujo de trabajo reside en las pruebas de Comfy                    |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; los esquemas de vídeo nativos de DeepInfra son de texto a vídeo en el contrato del Plugin                                  |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo cuando se usa la referencia a vídeo de Seedance                                |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; se omite el `videoToVideo` compartido porque el barrido actual de Gemini/Veo respaldado por búfer no acepta esa entrada |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; se omite el `videoToVideo` compartido porque esta ruta de organización/entrada requiere actualmente acceso de edición de vídeo por parte del proveedor |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; se omite `videoToVideo` porque este proveedor necesita URL de vídeo `http(s)` remotas                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo se ejecuta cuando el modelo seleccionado es `runway/gen4_aleph`                         |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; se omite el `imageToVideo` compartido porque el `veo3` incluido solo admite texto y el `kling` incluido requiere una URL de imagen remota |
| xAI        |     ✓      |       ✓        |       ✓        | La versión clásica admite todos los modos; Video 1.5 solo admite imagen a vídeo; la entrada MP4 remota mantiene `videoToVideo` fuera del barrido compartido |

## Parámetros de la herramienta

### Obligatorios

<ParamField path="prompt" type="string" required>
  Descripción textual del vídeo que se generará. Obligatoria para `action: "generate"`.
</ParamField>

### Entradas de contenido

<ParamField path="image" type="string">Una sola imagen de referencia (ruta o URL).</ParamField>
<ParamField path="images" type="string[]">Varias imágenes de referencia (hasta 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Indicaciones opcionales de rol por posición, paralelas a la lista combinada de imágenes.
Valores canónicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Un solo vídeo de referencia (ruta o URL).</ParamField>
<ParamField path="videos" type="string[]">Varios vídeos de referencia (hasta 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Indicaciones opcionales de rol por posición, paralelas a la lista combinada de vídeos.
Valor canónico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Un solo audio de referencia (ruta o URL). Se utiliza para música de fondo o como
referencia de voz cuando el proveedor admite entradas de audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Varios audios de referencia (hasta 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indicaciones opcionales de rol por posición, paralelas a la lista combinada de audios.
Valor canónico: `reference_audio`.
</ParamField>

<Note>
Las indicaciones de rol se reenvían al proveedor sin modificaciones. Los valores canónicos
proceden de la unión `VideoGenerationAssetRole`, pero los proveedores pueden aceptar cadenas de
rol adicionales. Las matrices `*Roles` no deben tener más entradas que la
lista de referencias correspondiente; los errores de desplazamiento de una posición
producen un error claro. Utilice una cadena vacía para dejar una posición sin establecer.
Para xAI, establezca todos los roles de imagen en `reference_image` para utilizar su
modo de generación `reference_images`; omita el rol o utilice
`first_frame` para la conversión de una sola imagen a vídeo.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  Indicación de relación de aspecto, como `1:1`, `16:9`, `9:16`, `adaptive` o un valor específico del proveedor. OpenClaw normaliza o ignora los valores no admitidos según el proveedor.
</ParamField>
<ParamField path="resolution" type="string">Indicación de resolución, como `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` o un valor específico del proveedor. OpenClaw normaliza o ignora los valores no admitidos según el proveedor.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos (redondeada al valor admitido por el proveedor más cercano).
</ParamField>
<ParamField path="size" type="string">Indicación de tamaño cuando el proveedor la admite.</ParamField>
<ParamField path="audio" type="boolean">
  Activa el audio generado en la salida cuando sea compatible. Es distinto de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Activa o desactiva la marca de agua del proveedor cuando sea compatible.</ParamField>

`adaptive` es un valor centinela específico del proveedor: se reenvía sin
modificaciones a los proveedores que declaran `adaptive` en sus capacidades
(p. ej., BytePlus Seedance lo utiliza para detectar automáticamente la relación a partir
de las dimensiones de la imagen de entrada). Los proveedores que no lo declaran muestran
el valor mediante `details.ignoredOverrides` en el resultado de la herramienta, para que la
omisión sea visible.

### Opciones avanzadas

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea actual de la sesión; `"list"` inspecciona los proveedores.
</ParamField>
<ParamField path="model" type="string">Sustitución del proveedor/modelo (p. ej., `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indicación del nombre del archivo de salida.</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional de la operación del proveedor en milisegundos. Cuando se omite, OpenClaw utiliza `agents.defaults.mediaModels.video.timeoutMs` si está configurado; de lo contrario, utiliza el valor predeterminado del proveedor definido por el autor del plugin, si existe.</ParamField>
<ParamField path="providerOptions" type="object">
  Opciones específicas del proveedor como objeto JSON (p. ej., `{"seed": 42, "draft": true}`).
  Los proveedores que declaran un esquema tipado validan las claves y los tipos; las
  claves desconocidas o las discrepancias hacen que se omita el candidato durante la
  conmutación por error. Los proveedores sin un esquema declarado reciben las opciones
  sin modificaciones. Ejecute `video_generate action=list` para ver qué acepta cada proveedor.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw normaliza la duración
al valor admitido por el proveedor más cercano y reasigna indicaciones geométricas
traducidas, como de tamaño a relación de aspecto, cuando un proveedor alternativo
expone una superficie de control diferente. Las sustituciones que realmente no se
admiten se ignoran en la medida de lo posible y se notifican como advertencias en el
resultado de la herramienta. Los límites estrictos de capacidad (como demasiadas
entradas de referencia) producen un error antes del envío. Los resultados de la
herramienta informan de los ajustes aplicados; `details.normalization` registra cualquier
traducción entre lo solicitado y lo aplicado.
</Note>

Las entradas de referencia seleccionan el modo de ejecución:

- Sin medios de referencia -> `generate`
- Cualquier referencia de imagen -> `imageToVideo`
- Cualquier referencia de vídeo -> `videoToVideo`
- Las entradas de audio de referencia **no** cambian el modo resuelto; se aplican
  sobre el modo que seleccionen las referencias de imagen o vídeo y solo funcionan
  con proveedores que declaran `maxInputAudios`.

Las referencias mixtas de imagen y vídeo no constituyen una superficie de capacidad
compartida estable. Se recomienda utilizar un solo tipo de referencia por solicitud.

#### Conmutación por error y opciones tipadas

Algunas comprobaciones de capacidades se aplican en la capa de conmutación por error,
en lugar de en el límite de la herramienta, por lo que una solicitud que supere los
límites del proveedor principal puede ejecutarse en un proveedor alternativo capaz:

- El candidato activo que no declare `maxInputAudios` (o `0`) se omite cuando
  la solicitud contiene referencias de audio; se prueba el siguiente candidato. La misma
  protección se aplica a los recuentos de referencias de imagen y vídeo con respecto a
  `maxInputImages`/`maxInputVideos`.
- Si el valor `maxDurationSeconds` del candidato activo es inferior al `durationSeconds`
  solicitado y no hay una lista `supportedDurationSeconds` declarada, se omite.
- Si la solicitud contiene `providerOptions` y el candidato activo declara explícitamente
  un esquema tipado `providerOptions`, se omite si las claves proporcionadas no están
  en el esquema o si los tipos de los valores no coinciden. Los proveedores sin un
  esquema declarado reciben las opciones sin modificaciones (transferencia compatible
  con versiones anteriores). Un proveedor puede rechazar todas las opciones de proveedor
  mediante la declaración de un esquema vacío (`capabilities.providerOptions: {}`), lo que provoca la
  misma omisión que una discrepancia de tipos.

El primer motivo de omisión de una solicitud se registra en `warn` para que
los operadores vean cuándo se ha descartado su proveedor principal; las omisiones
posteriores se registran en `debug` para mantener silenciosas las cadenas
largas de conmutación por error. Si se omiten todos los candidatos, el error agregado
incluye el motivo de omisión de cada uno.

## Acciones

| Acción     | Qué hace                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Valor predeterminado. Crea un vídeo a partir de la instrucción proporcionada y las entradas de referencia opcionales. |
| `status`   | Comprueba el estado de la tarea de vídeo en curso de la sesión actual sin iniciar otra generación.       |
| `list`     | Muestra los proveedores y modelos disponibles, así como sus capacidades.                                 |

## Selección del modelo

OpenClaw resuelve el modelo en este orden:

1. **Parámetro de herramienta `model`**: si el agente especifica uno en la llamada.
2. **`videoGenerationModel.primary`** de la configuración.
3. **`videoGenerationModel.fallbacks`** en orden.
4. **Detección automática**: proveedores con autenticación válida, comenzando por el
   proveedor predeterminado actual y siguiendo con los proveedores restantes en orden
   alfabético.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si fallan
todos los candidatos, el error incluye los detalles de cada intento.

La conmutación automática por error entre proveedores autenticados siempre está
activada. Un valor `model` por llamada sigue siendo el que prevalece.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // sustitución opcional del tiempo de espera de la solicitud al proveedor por herramienta
      },
    },
  },
}
```

## Notas sobre los proveedores

<AccordionGroup>
  <Accordion title="Alibaba">
    Utiliza el endpoint asíncrono de DashScope / Model Studio. Las imágenes y los
    vídeos de referencia deben ser URL `http(s)` remotas.
  </Accordion>
  <Accordion title="BytePlus (incluido)">
    Id. del proveedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (predeterminado),
    `seedance-1-5-pro-251215`.

    Utiliza la API unificada `content[]`. Admite hasta 2 imágenes de entrada
    (`first_frame` + `last_frame`). Pase las imágenes por posición o establezca
    explícitamente el valor `role` de cada imagen.

    Claves `providerOptions` admitidas: `seed` (número), `draft` (booleano:
    fuerza 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="Plugin BytePlus Seedance 1.5">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (externo, no incluido). Id. del proveedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Utiliza la API unificada `content[]`. Admite como máximo 2 imágenes de entrada
    (`first_frame` + `last_frame`). Todas las entradas deben ser URL
    `https://` remotas. Establezca `role: "first_frame"` / `"last_frame"`
    en cada imagen o pase las imágenes por posición.

    `aspectRatio: "adaptive"` detecta automáticamente la relación a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (número) se reenvía.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Requiere el plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (externo, no incluido). Id. del proveedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Utiliza la API unificada `content[]`. Admite hasta 9 imágenes de referencia,
    3 vídeos de referencia y 3 audios de referencia. Todas las entradas deben ser URL
    `https://` remotas. Establezca `role` en cada recurso; valores admitidos:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automáticamente la relación a partir de la imagen de entrada.
    `audio: true` se asigna a `generate_audio`. `providerOptions.seed`
    (número) se reenvía.

  </Accordion>
  <Accordion title="ComfyUI">
    Ejecución local o en la nube basada en flujos de trabajo. Admite texto a vídeo y
    de imagen a vídeo mediante el grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Utiliza un flujo respaldado por colas para trabajos de larga duración. OpenClaw espera hasta 20
    minutos de forma predeterminada antes de considerar agotado el tiempo de espera de un trabajo
    en curso en la cola de fal. La mayoría de los modelos de vídeo de fal
    aceptan una sola referencia de imagen. Los modelos de referencia a vídeo
    Seedance 2.0 aceptan hasta 9 imágenes, 3 vídeos y 3 referencias de audio, con
    un máximo de 12 archivos de referencia en total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Admite una referencia de imagen o una referencia de vídeo. Las solicitudes de audio generado se
    ignoran con una advertencia en la ruta de la API de Gemini porque esa API rechaza
    el parámetro `generateAudio` para la generación de vídeo actual de Veo.
  </Accordion>
  <Accordion title="MiniMax">
    Solo se admite una referencia de imagen. MiniMax acepta las resoluciones `768P` y `1080P`;
    las solicitudes como `720P` se normalizan al valor compatible más
    cercano antes de enviarse.
  </Accordion>
  <Accordion title="OpenAI">
    Solo se reenvía la sustitución `size`. Las demás sustituciones de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) se ignoran con
    una advertencia.
  </Accordion>
  <Accordion title="OpenRouter">
    Utiliza la API asíncrona `/videos` de OpenRouter. OpenClaw envía el
    trabajo, consulta periódicamente `polling_url` y descarga `unsigned_urls` o el
    endpoint documentado del contenido del trabajo. El valor predeterminado incluido `google/veo-3.1-fast`
    anuncia duraciones de 4/6/8 segundos, resoluciones `720P`/`1080P` y
    relaciones de aspecto `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Utiliza el mismo backend de DashScope que Alibaba. Las entradas de referencia deben ser
    URL remotas `http(s)`; los archivos locales se rechazan de antemano.
  </Accordion>
  <Accordion title="Runway">
    Admite archivos locales mediante URI de datos. La conversión de vídeo a vídeo requiere
    `runway/gen4_aleph`. Las ejecuciones que solo usan texto exponen relaciones de aspecto
    `16:9` y `9:16`.
  </Accordion>
  <Accordion title="Together">
    Solo se admite una referencia de imagen.
  </Accordion>
  <Accordion title="Vydra">
    Utiliza `https://www.vydra.ai/api/v1` directamente para evitar redirecciones que
    descarten la autenticación. `veo3` se incluye únicamente para texto a vídeo; `kling` requiere
    una URL de imagen remota.
  </Accordion>
  <Accordion title="xAI">
    El modelo predeterminado `grok-imagine-video` admite texto a vídeo, conversión
    de una sola imagen del primer fotograma a vídeo, hasta 7 entradas `reference_image` mediante
    `reference_images` de xAI y flujos remotos de edición y extensión de vídeo. La generación usa
    `480P` de forma predeterminada; la conversión de una sola imagen a vídeo hereda la relación
    de la fuente cuando se omite `aspectRatio`. La edición y extensión de vídeo heredan la geometría
    de entrada y no aceptan sustituciones de relación de aspecto ni de resolución. La extensión acepta entre 2 y 10
    segundos.

    `grok-imagine-video-1.5` solo admite imagen a vídeo: proporcione exactamente una imagen.
    Admite entre 1 y 15 segundos y `480P`, `720P` o `1080P`, con
    `480P` como valor predeterminado; omita `aspectRatio` para heredar la relación de la imagen de origen. Los identificadores
    de vista previa y los identificadores 1.5 con fecha reciben la misma validación y se reenvían
    sin cambios.

  </Accordion>
</AccordionGroup>

## Modos de capacidad de los proveedores

El contrato compartido de generación de vídeo admite capacidades específicas
por modo en lugar de limitarse a límites agregados planos. Las nuevas implementaciones
de proveedores deben priorizar bloques de modo explícitos:

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

Los campos agregados planos como `maxInputImages` y `maxInputVideos`
**no** bastan para anunciar la compatibilidad con los modos de transformación. Los proveedores deben
declarar `generate`, `imageToVideo` y `videoToVideo` explícitamente para que las
pruebas en vivo, las pruebas de contrato y la herramienta compartida `video_generate` puedan validar
la compatibilidad de los modos de forma determinista.

Cuando un modelo de un proveedor admita más entradas de referencia que los
demás, utilice `maxInputImagesByModel`, `maxInputVideosByModel` o
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

Este archivo de pruebas en vivo utiliza de forma predeterminada las variables de entorno ya exportadas de los proveedores antes que los perfiles
de autenticación almacenados y ejecuta de forma predeterminada una prueba de humo segura para versiones:

- `generate` para cada proveedor que no sea FAL del barrido.
- Prompt de langosta de un segundo.
- Límite de operaciones por proveedor de
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada).

FAL es opcional porque la latencia de la cola del proveedor puede dominar el tiempo
de publicación:

```bash
pnpm test:live:media video --video-providers fal
```

Establezca `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de
transformación declarados que el barrido compartido pueda ejercer de forma segura con medios locales:

- `imageToVideo` cuando `capabilities.imageToVideo.enabled`.
- `videoToVideo` cuando `capabilities.videoToVideo.enabled` y el
  proveedor/modelo acepte entradas de vídeo local respaldadas por búfer en el barrido
  compartido.

Actualmente, el carril en vivo compartido `videoToVideo` cubre `runway` solo cuando se
selecciona `runway/gen4_aleph`.

## Configuración

Establezca el modelo predeterminado de generación de vídeo en la configuración de OpenClaw:

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
openclaw config set agents.defaults.mediaModels.video.primary "qwen/wan2.6-t2v"
```

## Temas relacionados

- [Alibaba Model Studio](/es/providers/alibaba)
- [Tareas en segundo plano](/es/automation/tasks) - seguimiento de tareas para la generación asíncrona de vídeo
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
- [Descripción general de las herramientas](/es/tools)
- [Vydra](/es/providers/vydra)
- [xAI](/es/providers/xai)
