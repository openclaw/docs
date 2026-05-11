---
read_when:
    - Generar o editar imágenes mediante el agente
    - Configuración de proveedores y modelos de generación de imágenes
    - Comprender los parámetros de la herramienta image_generate
sidebarTitle: Image generation
summary: Generar y editar imágenes mediante image_generate en OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Generación de imágenes
x-i18n:
    generated_at: "2026-05-11T20:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10c15b48a673ef673e3cf7c4f4950a08961d64a3fd21eff9d1944ec6d4b9c410
    source_path: tools/image-generation.md
    workflow: 16
---

La herramienta `image_generate` permite al agente crear y editar imágenes usando tus
proveedores configurados. Las imágenes generadas se entregan automáticamente como
adjuntos multimedia en la respuesta del agente.

<Note>
La herramienta solo aparece cuando hay al menos un proveedor de generación de
imágenes disponible. Si no ves `image_generate` en las herramientas de tu agente,
configura `agents.defaults.imageGenerationModel`, establece una clave de API de
proveedor o inicia sesión con OAuth de OpenAI Codex.
</Note>

## Inicio rápido

<Steps>
  <Step title="Configurar autenticación">
    Establece una clave de API para al menos un proveedor (por ejemplo `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) o inicia sesión con OAuth de OpenAI Codex.
  </Step>
  <Step title="Elegir un modelo predeterminado (opcional)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    OAuth de Codex usa la misma referencia de modelo `openai/gpt-image-2`. Cuando se
    configura un perfil OAuth `openai-codex`, OpenClaw enruta las solicitudes de imagen
    a través de ese perfil OAuth en lugar de intentar primero
    `OPENAI_API_KEY`. La configuración explícita `models.providers.openai` (clave de API,
    URL base personalizada/Azure) vuelve a optar por la ruta directa de la API de imágenes
    de OpenAI.

  </Step>
  <Step title="Pedir al agente">
    _"Genera una imagen de una mascota robot amigable."_

    El agente llama a `image_generate` automáticamente. No es necesario incluir
    la herramienta en una lista de permitidas; está habilitada de forma predeterminada
    cuando hay un proveedor disponible.

  </Step>
</Steps>

<Warning>
Para endpoints LAN compatibles con OpenAI, como LocalAI, conserva el
`models.providers.openai.baseUrl` personalizado y opta explícitamente con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Los endpoints de imagen
privados e internos permanecen bloqueados de forma predeterminada.
</Warning>

## Rutas comunes

| Objetivo                                             | Referencia de modelo                               | Autenticación                          |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generación de imágenes de OpenAI con facturación por API | `openai/gpt-image-2`                           | `OPENAI_API_KEY`                       |
| Generación de imágenes de OpenAI con autenticación de suscripción de Codex | `openai/gpt-image-2`        | OAuth de OpenAI Codex                  |
| PNG/WebP con fondo transparente de OpenAI            | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` u OAuth de OpenAI Codex |
| Generación de imágenes de DeepInfra                  | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Generación de imágenes de OpenRouter                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generación de imágenes de LiteLLM                    | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generación de imágenes de Google Gemini              | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`    |

La misma herramienta `image_generate` gestiona texto a imagen y la edición con
imágenes de referencia. Usa `image` para una referencia o `images` para varias
referencias. Las indicaciones de salida admitidas por el proveedor, como `quality`,
`outputFormat` y `background`, se reenvían cuando están disponibles y se informan como
ignoradas cuando un proveedor no las admite. La compatibilidad incluida con fondos
transparentes es específica de OpenAI; otros proveedores aún pueden conservar el alfa
de PNG si su backend lo emite.

## Proveedores compatibles

| Proveedor  | Modelo predeterminado                  | Compatibilidad de edición           | Autenticación                                         |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Sí (1 imagen, configurada por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para cloud |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Sí (1 imagen)                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Sí (límites específicos del modelo) | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Sí                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                   |
| LiteLLM    | `gpt-image-2`                           | Sí (hasta 5 imágenes de entrada)    | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Sí (referencia de sujeto)           | `MINIMAX_API_KEY` o OAuth de MiniMax (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Sí (hasta 4 imágenes)               | `OPENAI_API_KEY` u OAuth de OpenAI Codex              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sí (hasta 5 imágenes de entrada)    | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | No                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Sí (hasta 5 imágenes)               | `XAI_API_KEY`                                         |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```text
/tool image_generate action=list
```

## Capacidades de los proveedores

| Capacidad             | ComfyUI            | DeepInfra | fal                       | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ------------------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Generar (cantidad máx.) | Definido por workflow | 4      | 4                         | 4              | 9                     | 4              | 1     | 4              |
| Editar / referencia   | 1 imagen (workflow) | 1 imagen | Flux: 1; GPT: 10; NB2: 14 | Hasta 5 imágenes | 1 imagen (ref. de sujeto) | Hasta 5 imágenes | - | Hasta 5 imágenes |
| Control de tamaño     | -                  | ✓         | ✓                         | ✓              | -                     | Hasta 4K       | -     | -              |
| Relación de aspecto   | -                  | -         | ✓                         | ✓              | ✓                     | -              | -     | ✓              |
| Resolución (1K/2K/4K) | -                  | -         | ✓                         | ✓              | -                     | -              | -     | 1K, 2K         |

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Prompt de generación de imagen. Obligatorio para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Usa `"list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>
<ParamField path="model" type="string">
  Anulación de proveedor/modelo (p. ej., `openai/gpt-image-2`). Usa
  `openai/gpt-image-1.5` para fondos transparentes de OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una sola imagen de referencia para el modo de edición.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia para el modo de edición (hasta 5 en proveedores compatibles).
</ParamField>
<ParamField path="size" type="string">
  Indicación de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Indicación de resolución.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Indicación de calidad cuando el proveedor la admite.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Indicación de formato de salida cuando el proveedor lo admite.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Indicación de fondo cuando el proveedor la admite. Usa `transparent` con
  `outputFormat: "png"` o `"webp"` para proveedores capaces de transparencia.
</ParamField>
<ParamField path="count" type="number">Número de imágenes que se generarán (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Tiempo de espera opcional de solicitud del proveedor en milisegundos. Cuando Codex llama a
  `image_generate` a través de herramientas dinámicas, este valor por llamada sigue anulando
  el predeterminado configurado y tiene un límite de 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Indicación de nombre de archivo de salida.</ParamField>
<ParamField path="openai" type="object">
  Indicaciones solo de OpenAI: `background`, `moderation`, `outputCompression` y `user`.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. Cuando un proveedor de respaldo admite
una opción de geometría cercana en lugar de la solicitada exactamente, OpenClaw reasigna al
tamaño, la relación de aspecto o la resolución compatibles más cercanos antes del envío.
Las indicaciones de salida no compatibles se descartan para los proveedores que no declaran
compatibilidad y se informan en el resultado de la herramienta. Los resultados de la herramienta
informan la configuración aplicada; `details.normalization` captura cualquier traducción
de solicitado a aplicado.
</Note>

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Orden de selección de proveedores

OpenClaw prueba proveedores en este orden:

1. Parámetro **`model`** de la llamada de herramienta (si el agente especifica uno).
2. **`imageGenerationModel.primary`** de la configuración.
3. **`imageGenerationModel.fallbacks`** en orden.
4. **Detección automática**: solo valores predeterminados de proveedores con autenticación:
   - proveedor predeterminado actual primero;
   - proveedores restantes registrados para generación de imágenes en orden de id. de proveedor.

Si un proveedor falla (error de autenticación, límite de tasa, etc.), se prueba
automáticamente el siguiente candidato configurado. Si todos fallan, el error incluye detalles
de cada intento.

<AccordionGroup>
  <Accordion title="Las anulaciones de modelo por llamada son exactas">
    Una anulación `model` por llamada prueba solo ese proveedor/modelo y no
    continúa con el principal/de respaldo configurado ni con proveedores detectados automáticamente.
  </Accordion>
  <Accordion title="La detección automática tiene en cuenta la autenticación">
    Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw puede
    autenticar realmente ese proveedor. Establece
    `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar solo
    entradas explícitas de `model`, `primary` y `fallbacks`.
  </Accordion>
  <Accordion title="Tiempos de espera">
    Establece `agents.defaults.imageGenerationModel.timeoutMs` para backends de imagen lentos.
    Un parámetro de herramienta `timeoutMs` por llamada anula el valor predeterminado
    configurado. Las llamadas de herramientas dinámicas de Codex respetan el mismo presupuesto
    de tiempo de espera, limitado por el máximo de 600000 ms del puente de herramientas dinámicas
    de OpenClaw.
  </Accordion>
  <Accordion title="Inspeccionar en tiempo de ejecución">
    Usa `action: "list"` para inspeccionar los proveedores actualmente registrados,
    sus modelos predeterminados y las indicaciones de variables de entorno de autenticación.
  </Accordion>
</AccordionGroup>

### Edición de imágenes

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI y xAI admiten la edición de
imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```text
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google y xAI admiten hasta 5 imágenes de referencia mediante el
parámetro `images`. fal admite 1 imagen de referencia para imagen a imagen de Flux,
hasta 10 para ediciones de GPT Image 2 y hasta 14 para ediciones de Nano Banana 2. MiniMax y
ComfyUI admiten 1.

## Análisis detallado de proveedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (y gpt-image-1.5)">
    La generación de imágenes de OpenAI usa `openai/gpt-image-2` de forma predeterminada. Si hay un
    perfil OAuth de `openai-codex` configurado, OpenClaw reutiliza el mismo
    perfil OAuth que usan los modelos de chat de suscripción de Codex y envía la
    solicitud de imagen a través del backend de Codex Responses. Las URL base heredadas de Codex
    como `https://chatgpt.com/backend-api` se canonizan a
    `https://chatgpt.com/backend-api/codex` para solicitudes de imagen. OpenClaw
    **no** recurre silenciosamente a `OPENAI_API_KEY` para esa solicitud;
    para forzar el enrutamiento directo a la API de OpenAI Images, configura
    `models.providers.openai` explícitamente con una clave de API, una URL base personalizada
    o un endpoint de Azure.

    Los modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` y
    `openai/gpt-image-1-mini` todavía se pueden seleccionar explícitamente. Usa
    `gpt-image-1.5` para salida PNG/WebP con fondo transparente; la API actual de
    `gpt-image-2` rechaza `background: "transparent"`.

    `gpt-image-2` admite tanto generación de texto a imagen como
    edición con imágenes de referencia mediante la misma herramienta `image_generate`.
    OpenClaw reenvía `prompt`, `count`, `size`, `quality`, `outputFormat`
    y las imágenes de referencia a OpenAI. OpenAI **no** recibe
    `aspectRatio` ni `resolution` directamente; cuando es posible, OpenClaw los asigna
    a un `size` admitido; de lo contrario, la herramienta los informa como
    anulaciones ignoradas.

    Las opciones específicas de OpenAI viven bajo el objeto `openai`:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` acepta `transparent`, `opaque` o `auto`;
    las salidas transparentes requieren `outputFormat` `png` o `webp` y un
    modelo de imagen de OpenAI compatible con transparencia. OpenClaw enruta las solicitudes predeterminadas de
    `gpt-image-2` con fondo transparente a `gpt-image-1.5`.
    `openai.outputCompression` se aplica a las salidas JPEG/WebP.

    La sugerencia de nivel superior `background` es neutral respecto al proveedor y actualmente se asigna
    al mismo campo de solicitud `background` de OpenAI cuando se selecciona el proveedor OpenAI.
    Los proveedores que no declaran compatibilidad con fondos la devuelven
    en `ignoredOverrides` en lugar de recibir el parámetro no admitido.

    Para enrutar la generación de imágenes de OpenAI a través de un despliegue de Azure OpenAI
    en lugar de `api.openai.com`, consulta
    [endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modelos de imagen de OpenRouter">
    La generación de imágenes de OpenRouter usa la misma `OPENROUTER_API_KEY` y
    se enruta a través de la API de imágenes de finalizaciones de chat de OpenRouter. Selecciona
    modelos de imagen de OpenRouter con el prefijo `openrouter/`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw reenvía `prompt`, `count`, imágenes de referencia y
    sugerencias `aspectRatio` / `resolution` compatibles con Gemini a OpenRouter.
    Los accesos directos actuales integrados para modelos de imagen de OpenRouter incluyen
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`. Usa
    `action: "list"` para ver qué expone tu plugin configurado.

  </Accordion>
  <Accordion title="Autenticación dual de MiniMax">
    La generación de imágenes de MiniMax está disponible mediante ambas rutas de autenticación
    integradas de MiniMax:

    - `minimax/image-01` para configuraciones con clave de API
    - `minimax-portal/image-01` para configuraciones con OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    El proveedor xAI integrado usa `/v1/images/generations` para solicitudes
    solo con prompt y `/v1/images/edits` cuando `image` o `images` está presente.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Recuento: hasta 4
    - Referencias: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Salidas: se devuelven como adjuntos de imagen gestionados por OpenClaw

    OpenClaw no expone intencionadamente `quality`, `mask`,
    `user` ni relaciones de aspecto adicionales exclusivas de xAI hasta que esos controles existan
    en el contrato compartido entre proveedores `image_generate`.

  </Accordion>
</AccordionGroup>

## Ejemplos

<Tabs>
  <Tab title="Generar (paisaje 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generar (PNG transparente)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generar (dos cuadrados)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Editar (una referencia)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Editar (varias referencias)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Las mismas marcas `--output-format` y `--background` están disponibles en
`openclaw infer image edit`; `--openai-background` permanece como un alias
específico de OpenAI. Los proveedores integrados distintos de OpenAI no declaran
control explícito de fondo actualmente, por lo que `background: "transparent"` se informa
como ignorado para ellos.

## Relacionado

- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
- [ComfyUI](/es/providers/comfy) - configuración de flujos de trabajo locales de ComfyUI y Comfy Cloud
- [fal](/es/providers/fal) - configuración del proveedor de imágenes y video fal
- [Google (Gemini)](/es/providers/google) - configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) - configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) - configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) - configuración de imágenes, video y voz de Vydra
- [xAI](/es/providers/xai) - configuración de imagen, video, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) - configuración de modelos y conmutación por error
