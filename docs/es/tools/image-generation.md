---
read_when:
    - Generar o editar imágenes mediante el agente
    - Configurar proveedores y modelos de generación de imágenes
    - Comprender los parámetros de la herramienta `image_generate`
sidebarTitle: Image generation
summary: Genera y edita imágenes mediante `image_generate` en OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI y Vydra
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-26T11:39:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

La herramienta `image_generate` permite al agente crear y editar imágenes usando tus
proveedores configurados. Las imágenes generadas se entregan automáticamente como
archivos multimedia adjuntos en la respuesta del agente.

<Note>
La herramienta solo aparece cuando al menos un proveedor de generación de imágenes está
disponible. Si no ves `image_generate` en las herramientas de tu agente,
configura `agents.defaults.imageGenerationModel`, establece una clave de API de proveedor
o inicia sesión con OpenAI Codex OAuth.
</Note>

## Inicio rápido

<Steps>
  <Step title="Configurar autenticación">
    Establece una clave de API para al menos un proveedor (por ejemplo `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) o inicia sesión con OpenAI Codex OAuth.
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

    Codex OAuth usa la misma referencia de modelo `openai/gpt-image-2`. Cuando hay un
    perfil OAuth `openai-codex` configurado, OpenClaw enruta las solicitudes de imágenes
    a través de ese perfil OAuth en lugar de intentar primero
    `OPENAI_API_KEY`. La configuración explícita de `models.providers.openai` (clave de API,
    URL base personalizada/Azure) vuelve a optar por la
    ruta directa de la API de Images de OpenAI.

  </Step>
  <Step title="Pedirle al agente">
    _"Genera una imagen de una mascota robot amigable."_

    El agente llama a `image_generate` automáticamente. No hace falta
    incluir la herramienta en una lista de permitidas:
    está habilitada de forma predeterminada cuando hay un proveedor disponible.

  </Step>
</Steps>

<Warning>
Para endpoints LAN compatibles con OpenAI como LocalAI, mantén la
`models.providers.openai.baseUrl` personalizada y activa explícitamente la opción con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Los endpoints de imágenes privados e
internos siguen bloqueados de forma predeterminada.
</Warning>

## Rutas comunes

| Objetivo                                             | Referencia de modelo                                | Autenticación                          |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generación de imágenes con OpenAI con facturación por API | `openai/gpt-image-2`                           | `OPENAI_API_KEY`                       |
| Generación de imágenes con OpenAI con autenticación por suscripción de Codex | `openai/gpt-image-2` | OpenAI Codex OAuth                     |
| PNG/WebP con fondo transparente de OpenAI            | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` o OpenAI Codex OAuth |
| Generación de imágenes con OpenRouter                | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generación de imágenes con LiteLLM                   | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generación de imágenes con Google Gemini             | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`   |

La misma herramienta `image_generate` gestiona tanto texto a imagen como
edición con imágenes de referencia. Usa `image` para una referencia o `images` para
varias referencias. Las sugerencias de salida compatibles con el proveedor, como
`quality`, `outputFormat` y `background`, se reenvían cuando están disponibles y se
informan como ignoradas cuando un proveedor no las admite. La compatibilidad incluida con
fondo transparente es específica de OpenAI; otros proveedores pueden seguir conservando el canal alfa de PNG si su
backend lo emite.

## Proveedores compatibles

| Proveedor  | Modelo predeterminado                    | Compatibilidad de edición            | Autenticación                                        |
| ---------- | ---------------------------------------- | ------------------------------------ | --------------------------------------------------- |
| ComfyUI    | `workflow`                               | Sí (1 imagen, configurado por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para cloud |
| fal        | `fal-ai/flux/dev`                        | Sí                                   | `FAL_KEY`                                           |
| Google     | `gemini-3.1-flash-image-preview`         | Sí                                   | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                            | Sí (hasta 5 imágenes de entrada)     | `LITELLM_API_KEY`                                   |
| MiniMax    | `image-01`                               | Sí (referencia de sujeto)            | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                            | Sí (hasta 4 imágenes)                | `OPENAI_API_KEY` o OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | Sí (hasta 5 imágenes de entrada)     | `OPENROUTER_API_KEY`                                |
| Vydra      | `grok-imagine`                           | No                                   | `VYDRA_API_KEY`                                     |
| xAI        | `grok-imagine-image`                     | Sí (hasta 5 imágenes)                | `XAI_API_KEY`                                       |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```text
/tool image_generate action=list
```

## Capacidades de los proveedores

| Capacidad            | ComfyUI            | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Generar (cantidad máx.) | Definida por workflow | 4              | 4              | 9                     | 4              | 1     | 4              |
| Editar / referencia   | 1 imagen (workflow) | 1 imagen          | Hasta 5 imágenes | 1 imagen (ref. de sujeto) | Hasta 5 imágenes | —     | Hasta 5 imágenes |
| Control de tamaño     | —                  | ✓                 | ✓              | —                     | Hasta 4K       | —     | —              |
| Relación de aspecto   | —                  | ✓ (solo generar)  | ✓              | ✓                     | —              | —     | ✓              |
| Resolución (1K/2K/4K) | —                  | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Prompt de generación de imágenes. Obligatorio para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Usa `"list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>
<ParamField path="model" type="string">
  Anulación de proveedor/modelo (por ejemplo `openai/gpt-image-2`). Usa
  `openai/gpt-image-1.5` para fondos transparentes en OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una sola imagen de referencia para el modo de edición.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia para el modo de edición (hasta 5 en proveedores compatibles).
</ParamField>
<ParamField path="size" type="string">
  Sugerencia de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Sugerencia de resolución.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Sugerencia de calidad cuando el proveedor la admite.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Sugerencia de formato de salida cuando el proveedor la admite.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Sugerencia de fondo cuando el proveedor la admite. Usa `transparent` con
  `outputFormat: "png"` o `"webp"` para proveedores con capacidad de transparencia.
</ParamField>
<ParamField path="count" type="number">Número de imágenes que se van a generar (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional de la solicitud del proveedor en milisegundos.</ParamField>
<ParamField path="filename" type="string">Sugerencia de nombre de archivo de salida.</ParamField>
<ParamField path="openai" type="object">
  Sugerencias exclusivas de OpenAI: `background`, `moderation`, `outputCompression` y `user`.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. Cuando un proveedor de failover admite una
opción geométrica cercana en lugar de la solicitada exactamente, OpenClaw reasigna a
el tamaño, la relación de aspecto o la resolución compatible más cercana antes del envío.
Las sugerencias de salida no compatibles se eliminan para los proveedores que no declaran
compatibilidad y se informan en el resultado de la herramienta. Los resultados de la herramienta informan la
configuración aplicada; `details.normalization` captura cualquier traducción
de lo solicitado a lo aplicado.
</Note>

## Configuración

### Selección de modelos

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

OpenClaw prueba los proveedores en este orden:

1. **Parámetro `model`** de la llamada a la herramienta (si el agente especifica uno).
2. **`imageGenerationModel.primary`** de la configuración.
3. **`imageGenerationModel.fallbacks`** en orden.
4. **Detección automática**: solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual;
   - los proveedores restantes de generación de imágenes registrados en orden de id de proveedor.

Si un proveedor falla (error de autenticación, límite de tasa, etc.), el siguiente
candidato configurado se prueba automáticamente. Si todos fallan, el error incluye detalles
de cada intento.

<AccordionGroup>
  <Accordion title="Las anulaciones de modelo por llamada son exactas">
    Una anulación `model` por llamada prueba solo ese proveedor/modelo y
    no continúa con los proveedores configurados como principal/de failover ni con los detectados automáticamente.
  </Accordion>
  <Accordion title="La detección automática tiene en cuenta la autenticación">
    Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw puede
    autenticar realmente ese proveedor. Establece
    `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar solo
    las entradas explícitas `model`, `primary` y `fallbacks`.
  </Accordion>
  <Accordion title="Tiempos de espera">
    Establece `agents.defaults.imageGenerationModel.timeoutMs` para backends de imágenes
    lentos. Un parámetro de herramienta `timeoutMs` por llamada anula el valor predeterminado
    configurado.
  </Accordion>
  <Accordion title="Inspeccionar en tiempo de ejecución">
    Usa `action: "list"` para inspeccionar los proveedores registrados actualmente,
    sus modelos predeterminados y las sugerencias de variables de entorno de autenticación.
  </Accordion>
</AccordionGroup>

### Edición de imágenes

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI y xAI admiten la edición de
imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```text
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google y xAI admiten hasta 5 imágenes de referencia mediante el
parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

## Detalles de proveedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (y gpt-image-1.5)">
    La generación de imágenes de OpenAI usa de forma predeterminada `openai/gpt-image-2`. Si hay un
    perfil OAuth `openai-codex` configurado, OpenClaw reutiliza el mismo
    perfil OAuth usado por los modelos de chat con suscripción de Codex y envía la
    solicitud de imagen a través del backend de Responses de Codex. Las URL base heredadas de Codex
    como `https://chatgpt.com/backend-api` se canonizan a
    `https://chatgpt.com/backend-api/codex` para las solicitudes de imágenes. OpenClaw
    **no** recurre silenciosamente a `OPENAI_API_KEY` para esa solicitud;
    para forzar el enrutamiento directo de la API de Images de OpenAI, configura
    `models.providers.openai` explícitamente con una clave de API, URL base personalizada
    o endpoint de Azure.

    Los modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` y
    `openai/gpt-image-1-mini` todavía se pueden seleccionar explícitamente. Usa
    `gpt-image-1.5` para salida PNG/WebP con fondo transparente; la API actual de
    `gpt-image-2` rechaza `background: "transparent"`.

    `gpt-image-2` admite tanto la generación de texto a imagen como la
    edición con imágenes de referencia mediante la misma herramienta `image_generate`.
    OpenClaw reenvía `prompt`, `count`, `size`, `quality`, `outputFormat`
    e imágenes de referencia a OpenAI. OpenAI **no** recibe
    `aspectRatio` ni `resolution` directamente; cuando es posible, OpenClaw los asigna
    a un `size` compatible; de lo contrario, la herramienta los informa como
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
    modelo de imágenes de OpenAI con capacidad de transparencia. OpenClaw enruta las solicitudes
    predeterminadas con fondo transparente de `gpt-image-2` a `gpt-image-1.5`.
    `openai.outputCompression` se aplica a las salidas JPEG/WebP.

    La sugerencia `background` de nivel superior es neutral respecto al proveedor y actualmente se asigna
    al mismo campo de solicitud `background` de OpenAI cuando se selecciona
    el proveedor OpenAI. Los proveedores que no declaran compatibilidad con fondos
    la devuelven en `ignoredOverrides` en lugar de recibir el parámetro no compatible.

    Para enrutar la generación de imágenes de OpenAI a través de una implementación de Azure OpenAI
    en lugar de `api.openai.com`, consulta
    [Endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modelos de imágenes de OpenRouter">
    La generación de imágenes de OpenRouter usa la misma `OPENROUTER_API_KEY` y
    se enruta a través de la API de imágenes de finalizaciones de chat de OpenRouter. Selecciona
    modelos de imágenes de OpenRouter con el prefijo `openrouter/`:

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
    Los atajos integrados actuales para modelos de imágenes de OpenRouter incluyen
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`. Usa
    `action: "list"` para ver lo que expone tu Plugin configurado.

  </Accordion>
  <Accordion title="Autenticación dual de MiniMax">
    La generación de imágenes de MiniMax está disponible a través de ambas rutas de
    autenticación de MiniMax incluidas:

    - `minimax/image-01` para configuraciones con clave de API
    - `minimax-portal/image-01` para configuraciones con OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    El proveedor xAI incluido usa `/v1/images/generations` para solicitudes
    solo de prompt y `/v1/images/edits` cuando `image` o `images` está presente.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Cantidad: hasta 4
    - Referencias: un `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Salidas: se devuelven como archivos adjuntos de imágenes gestionados por OpenClaw

    OpenClaw intencionalmente no expone `quality`, `mask`,
    `user` nativos de xAI ni relaciones de aspecto adicionales exclusivas nativas hasta que esos controles existan
    en el contrato compartido entre proveedores de `image_generate`.

  </Accordion>
</AccordionGroup>

## Ejemplos

<Tabs>
  <Tab title="Generar (4K horizontal)">
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
  <Tab title="Generar (dos cuadradas)">
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
`openclaw infer image edit`; `--openai-background` sigue existiendo como
alias específico de OpenAI. Los proveedores incluidos distintos de OpenAI no declaran
control explícito del fondo por ahora, así que `background: "transparent"` se informa
como ignorado para ellos.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [ComfyUI](/es/providers/comfy) — configuración de workflow local de ComfyUI y Comfy Cloud
- [fal](/es/providers/fal) — configuración del proveedor de imágenes y video de fal
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes de Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes de MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) — configuración de imágenes, video y voz de Vydra
- [xAI](/es/providers/xai) — configuración de Grok para imágenes, video, búsqueda, ejecución de código y TTS
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) — configuración de modelos y failover
