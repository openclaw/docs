---
read_when:
    - Generación o edición de imágenes mediante el agente
    - Configuración de proveedores y modelos de generación de imágenes
    - Descripción de los parámetros de la herramienta image_generate
sidebarTitle: Image generation
summary: Genera y edita imágenes mediante image_generate en OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI y Vydra
title: Generación de imágenes
x-i18n:
    generated_at: "2026-07-11T23:34:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

La herramienta `image_generate` crea y edita imágenes mediante los proveedores
configurados. En las sesiones de chat se ejecuta de forma asíncrona: OpenClaw
registra una tarea en segundo plano, devuelve inmediatamente el identificador
de la tarea y reactiva al agente cuando el proveedor termina. El agente de
finalización sigue el modo normal de respuesta visible de la sesión: entrega
automática de la respuesta final cuando está configurada, o
`message(action="send")` cuando la sesión requiere la herramienta de
mensajería. Si la sesión solicitante está inactiva o falla su reactivación
activa, OpenClaw envía directamente una alternativa idempotente con las
imágenes generadas para que el resultado no se pierda.

<Note>
La herramienta solo aparece cuando hay disponible al menos un proveedor de
generación de imágenes. Si no ve `image_generate` entre las herramientas de su
agente, configure `agents.defaults.imageGenerationModel`, establezca una clave
de API de un proveedor o inicie sesión con OAuth de OpenAI ChatGPT/Codex.
</Note>

## Inicio rápido

<Steps>
  <Step title="Configurar la autenticación">
    Establezca una clave de API para al menos un proveedor (por ejemplo,
    `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) o inicie sesión
    con OAuth de OpenAI Codex.
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

    OAuth de ChatGPT/Codex utiliza la misma referencia de modelo
    `openai/gpt-image-2`. Cuando se configura un perfil OAuth de `openai`,
    OpenClaw dirige las solicitudes de imágenes a través de ese perfil OAuth
    en lugar de probar primero `OPENAI_API_KEY`. Una configuración explícita
    de `models.providers.openai` (clave de API, URL base personalizada o de
    Azure) vuelve a habilitar la ruta directa de la API de imágenes de OpenAI.

  </Step>
  <Step title="Pedirlo al agente">
    _"Genera una imagen de una simpática mascota robótica."_

    El agente llama automáticamente a `image_generate`. No es necesario
    incluirla en una lista de herramientas permitidas: está habilitada de
    forma predeterminada cuando hay un proveedor disponible. La herramienta
    devuelve un identificador de tarea en segundo plano y, cuando está lista,
    el agente de finalización envía la imagen generada mediante la herramienta
    `message`.

  </Step>
</Steps>

<Warning>
Para endpoints de LAN compatibles con OpenAI, como LocalAI, conserve el valor
personalizado de `models.providers.openai.baseUrl` y habilite explícitamente
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Los endpoints de
imágenes privados e internos permanecen bloqueados de forma predeterminada.
</Warning>

## Rutas habituales

| Objetivo                                                     | Referencia de modelo                                | Autenticación                            |
| ------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------- |
| Generación de imágenes con OpenAI y facturación por API      | `openai/gpt-image-2`                                | `OPENAI_API_KEY`                         |
| Generación de imágenes con OpenAI y autenticación de Codex   | `openai/gpt-image-2`                                | OAuth de OpenAI ChatGPT/Codex            |
| PNG/WebP de OpenAI con fondo transparente                    | `openai/gpt-image-1.5`                              | `OPENAI_API_KEY` u OAuth de OpenAI Codex |
| Generación de imágenes con DeepInfra                         | `deepinfra/black-forest-labs/FLUX-1-schnell`        | `DEEPINFRA_API_KEY`                      |
| Generación expresiva o guiada por estilo con fal Krea 2      | `fal/krea/v2/medium/text-to-image`                  | `FAL_KEY`                                |
| Generación de imágenes con OpenRouter                        | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                     |
| Generación de imágenes con LiteLLM                           | `litellm/gpt-image-2`                               | `LITELLM_API_KEY`                        |
| Generación de imágenes con Microsoft Foundry MAI             | `microsoft-foundry/<deployment-name>`               | `AZURE_OPENAI_API_KEY` o Entra ID        |
| Generación de imágenes con Google Gemini                     | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` o `GOOGLE_API_KEY`      |

La misma herramienta gestiona tanto la conversión de texto a imagen como la
edición mediante imágenes de referencia. Use `image` para una referencia o
`images` para varias. En los modelos Krea 2 de fal, esas referencias se envían
como referencias de estilo en lugar de entradas de edición. Las indicaciones
de salida admitidas por el proveedor, como `quality`, `outputFormat` y
`background`, se reenvían cuando están disponibles y se indican como omitidas
cuando el proveedor no declara que las admite. La compatibilidad integrada
con fondos transparentes es específica de OpenAI; otros proveedores aún
pueden conservar el canal alfa de PNG si su backend lo genera.

## Proveedores compatibles

| Proveedor         | Modelo predeterminado                    | Compatibilidad con edición                    | Autenticación                                         |
| ----------------- | ---------------------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                               | Sí (1 imagen, configurada por el flujo)       | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para la nube  |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`       | Sí (1 imagen)                                 | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                        | Sí (límites específicos del modelo)           | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`         | Sí (hasta 5 imágenes)                         | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                   |
| LiteLLM           | `gpt-image-2`                            | Sí (hasta 5 imágenes de entrada)              | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                      | Sí (solo modelos MAI-Image-2.5)               | `AZURE_OPENAI_API_KEY` o Entra ID (`az login`)        |
| MiniMax           | `image-01`                               | Sí (referencia de sujeto)                     | `MINIMAX_API_KEY` u OAuth de MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                            | Sí (hasta 5 imágenes)                         | `OPENAI_API_KEY` u OAuth de OpenAI ChatGPT/Codex      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview`  | Sí (hasta 5 imágenes de entrada)              | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                           | No                                            | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                     | Sí (hasta 3 imágenes)                         | `XAI_API_KEY`                                         |

Use `action: "list"` para consultar los proveedores y modelos disponibles en
tiempo de ejecución:

```text
/tool image_generate action=list
```

Use `action: "status"` para consultar la tarea activa de generación de
imágenes de la sesión actual:

```text
/tool image_generate action=status
```

## Capacidades de los proveedores

| Capacidad               | ComfyUI                  | DeepInfra | fal                                                     | Google           | Microsoft Foundry | MiniMax                         | OpenAI           | Vydra | xAI              |
| ----------------------- | ------------------------ | --------- | ------------------------------------------------------- | ---------------- | ----------------- | ------------------------------- | ---------------- | ----- | ---------------- |
| Generación (máximo)     | 1                        | 4         | 4                                                       | 4                | 1                 | 9                               | 4                | 1     | 4                |
| Edición / referencia    | 1 imagen (flujo)         | 1 imagen  | Flux: 1; GPT: 10; refs. de estilo Krea: 10; NB2: 14     | Hasta 5 imágenes | 1 imagen          | 1 imagen (ref. de sujeto)       | Hasta 5 imágenes | -     | Hasta 3 imágenes |
| Control de tamaño       | -                        | ✓         | ✓                                                       | ✓                | ✓                 | -                               | Hasta 4K         | -     | -                |
| Relación de aspecto     | -                        | -         | ✓                                                       | ✓                | -                 | ✓                               | -                | -     | ✓                |
| Resolución (1K/2K/4K)   | -                        | -         | ✓                                                       | ✓                | -                 | -                               | -                | -     | 1K, 2K           |

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Instrucción para generar la imagen. Obligatoria para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Use `"status"` para consultar la tarea activa de la sesión o `"list"` para
  consultar los proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>
<ParamField path="model" type="string">
  Sustitución del proveedor o modelo (por ejemplo, `openai/gpt-image-2`). Use
  `openai/gpt-image-1.5` para obtener fondos transparentes con OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una sola imagen de referencia para el modo de edición.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia para el modo de edición o los modelos con
  referencias de estilo (hasta 14 mediante la herramienta compartida; siguen
  aplicándose los límites específicos de cada proveedor).
</ParamField>
<ParamField path="size" type="string">
  Indicación de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Relación de aspecto: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Los proveedores validan el subconjunto específico de
  cada modelo.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Indicación de resolución.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Indicación de calidad cuando el proveedor la admite.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Indicación del formato de salida cuando el proveedor lo admite.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Indicación del fondo cuando el proveedor la admite. Use `transparent` con
  `outputFormat: "png"` o `"webp"` para proveedores compatibles con
  transparencias.
</ParamField>
<ParamField path="count" type="number">Número de imágenes que se generarán (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Tiempo de espera opcional de la solicitud al proveedor, en milisegundos.
  Cuando Codex llama a `image_generate` mediante herramientas dinámicas, este
  valor por llamada sigue teniendo prioridad sobre el valor predeterminado
  configurado y está limitado a 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Indicación del nombre del archivo de salida.</ParamField>
<ParamField path="openai" type="object">
  Indicaciones exclusivas de OpenAI: `background`, `moderation`,
  `outputCompression` y `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Control de creatividad de fal Krea 2. El valor predeterminado es `medium`.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. Cuando un proveedor
alternativo admite una opción geométrica similar en lugar de la solicitada
exactamente, OpenClaw la reasigna al tamaño, la relación de aspecto o la
resolución compatibles más cercanos antes de enviar la solicitud. Las
indicaciones de salida no compatibles se descartan para los proveedores que
no declaran admitirlas y se notifican en el resultado de la herramienta. Los
resultados de la herramienta indican los ajustes aplicados;
`details.normalization` registra cualquier conversión entre el valor
solicitado y el aplicado.
</Note>

## Configuración

### Selección del modelo

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
   - primero, el proveedor predeterminado actual;
   - después, los demás proveedores de generación de imágenes registrados, ordenados por identificador de proveedor.

Si un proveedor falla (error de autenticación, límite de solicitudes, etc.), se
prueba automáticamente el siguiente candidato configurado. Si todos fallan, el
error incluye detalles de cada intento.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Una sustitución de `model` por llamada prueba únicamente ese proveedor/modelo
    y no continúa con el principal, los alternativos ni los proveedores
    detectados automáticamente.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    El valor predeterminado de un proveedor solo se incorpora a la lista de
    candidatos cuando OpenClaw puede autenticar realmente ese proveedor.
    Establezca `agents.defaults.mediaGenerationAutoProviderFallback: false` para
    usar únicamente las entradas explícitas `model`, `primary` y `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Establezca `agents.defaults.imageGenerationModel.timeoutMs` para backends
    de imágenes lentos. Un parámetro de herramienta `timeoutMs` por llamada
    sustituye el valor predeterminado configurado, y los valores predeterminados
    configurados sustituyen los definidos por el Plugin del proveedor. Los
    proveedores de imágenes alojados de Google y OpenRouter usan valores
    predeterminados de 180 segundos; la generación de imágenes de Microsoft
    Foundry MAI, xAI y Azure OpenAI usa 600 segundos. Las llamadas a herramientas
    dinámicas de Codex usan un valor predeterminado de 120 segundos para el
    puente `image_generate` y, cuando está configurado, respetan el mismo
    presupuesto de tiempo de espera, limitado por el máximo de 600000 ms del
    puente de herramientas dinámicas de OpenClaw.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Use `action: "list"` para inspeccionar los proveedores registrados
    actualmente, sus modelos predeterminados y las indicaciones sobre variables
    de entorno de autenticación.
  </Accordion>
</AccordionGroup>

### Edición de imágenes

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI y xAI admiten la edición de imágenes de referencia. Los modelos Krea 2
de fal usan los mismos campos `image` / `images` como referencias de estilo en
lugar de entradas de edición. Pase una ruta o URL de una imagen de referencia:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter y Google admiten hasta 5 imágenes de referencia mediante el
parámetro `images`; xAI admite hasta 3. fal admite 1 imagen de referencia para
la conversión de imagen a imagen de Flux, hasta 10 para ediciones de GPT Image 2,
hasta 10 referencias de estilo para Krea 2 y hasta 14 para ediciones de Nano
Banana 2. Microsoft Foundry, MiniMax y ComfyUI admiten 1.

## Análisis detallado de proveedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    La generación de imágenes de OpenAI usa de forma predeterminada
    `openai/gpt-image-2`. Si hay configurado un perfil OAuth de `openai`,
    OpenClaw reutiliza el mismo perfil OAuth que emplean los modelos de chat
    de suscripción de Codex y envía la solicitud de imagen mediante el backend
    de Responses de Codex. Las URL base heredadas de Codex, como
    `https://chatgpt.com/backend-api`, se normalizan como
    `https://chatgpt.com/backend-api/codex` para las solicitudes de imágenes.
    OpenClaw **no** recurre silenciosamente a `OPENAI_API_KEY` para esa
    solicitud; para forzar el enrutamiento directo mediante la API de imágenes
    de OpenAI, configure `models.providers.openai` explícitamente con una clave
    de API, una URL base personalizada o un endpoint de Azure.

    Los modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` y
    `openai/gpt-image-1-mini` todavía pueden seleccionarse explícitamente. Use
    `gpt-image-1.5` para generar PNG/WebP con fondo transparente; la API actual
    de `gpt-image-2` rechaza `background: "transparent"`.

    `gpt-image-2` admite tanto la generación de texto a imagen como la edición
    de imágenes de referencia mediante la misma herramienta `image_generate`.
    OpenClaw reenvía a OpenAI `prompt`, `count`, `size`, `quality`,
    `outputFormat` y las imágenes de referencia. OpenAI **no** recibe
    `aspectRatio` ni `resolution` directamente; cuando es posible, OpenClaw
    los convierte en un valor de `size` compatible. De lo contrario, la
    herramienta los informa como sustituciones ignoradas.

    Las opciones específicas de OpenAI se encuentran bajo el objeto `openai`:

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

    `openai.background` acepta `transparent`, `opaque` o `auto`; las salidas
    transparentes requieren que `outputFormat` sea `png` o `webp`, así como
    un modelo de imágenes de OpenAI compatible con transparencias. OpenClaw
    dirige las solicitudes con fondo transparente del modelo predeterminado
    `gpt-image-2` a `gpt-image-1.5`. `openai.outputCompression` se aplica a
    las salidas JPEG/WebP y se ignora en las salidas PNG.

    La indicación de nivel superior `background` es independiente del proveedor
    y actualmente se asigna al mismo campo de solicitud `background` de OpenAI
    cuando se selecciona el proveedor OpenAI. Los proveedores que no declaran
    compatibilidad con fondos la devuelven en `ignoredOverrides` en lugar de
    recibir el parámetro no compatible.

    Para dirigir la generación de imágenes de OpenAI mediante una implementación
    de Azure OpenAI en lugar de `api.openai.com`, consulte
    [Endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    La generación de imágenes de Microsoft Foundry usa nombres de implementaciones
    de imágenes MAI bajo el prefijo de proveedor `microsoft-foundry/`. No existe
    un modelo predeterminado a nivel de proveedor porque la API de MAI espera el
    nombre de la implementación en el campo `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    El proveedor usa la API de MAI de Microsoft Foundry, no la API de imágenes
    de OpenAI:

    - Endpoint de generación: `/mai/v1/images/generations`
    - Endpoint de edición: `/mai/v1/images/edits`
    - Autenticación: `AZURE_OPENAI_API_KEY` / clave de API del proveedor, o Entra ID mediante `az login`
    - Salida: una imagen PNG
    - Tamaño: valor predeterminado `1024x1024`; tanto el ancho como el alto deben ser de al menos 768 px,
      y el total de píxeles debe ser como máximo 1 048 576
    - Ediciones: una imagen de referencia PNG o JPEG, admitida únicamente por
      implementaciones `MAI-Image-2.5-Flash` y `MAI-Image-2.5`

    La generación basada solo en instrucciones puede usar un nombre de
    implementación personalizado con únicamente el endpoint de Foundry
    configurado. Las ediciones con nombres de implementación personalizados
    necesitan metadatos de incorporación/modelo para que OpenClaw pueda
    comprobar que la implementación está respaldada por `MAI-Image-2.5-Flash`
    o `MAI-Image-2.5`.

    Los modelos de imágenes MAI actuales son `MAI-Image-2.5-Flash`,
    `MAI-Image-2.5`, `MAI-Image-2e` y `MAI-Image-2`. Consulte
    [Plugin de Microsoft Foundry](/es/plugins/reference/microsoft-foundry) para
    conocer la configuración y el comportamiento de los modelos de chat.

  </Accordion>
  <Accordion title="OpenRouter image models">
    La generación de imágenes de OpenRouter usa la misma `OPENROUTER_API_KEY`
    y se dirige mediante la API de imágenes de finalizaciones de chat de
    OpenRouter. Seleccione modelos de imágenes de OpenRouter con el prefijo
    `openrouter/`:

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

    OpenClaw reenvía a OpenRouter `prompt`, `count`, las imágenes de referencia
    y las indicaciones `aspectRatio` / `resolution` compatibles con Gemini.
    Los atajos integrados actuales para modelos de imágenes de OpenRouter
    incluyen `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`. Use
    `action: "list"` para ver qué expone el Plugin configurado.

  </Accordion>
  <Accordion title="fal Krea 2">
    Los modelos Krea 2 de fal usan el esquema nativo de Krea de fal en lugar
    del esquema genérico `image_size` que usa Flux. OpenClaw envía:

    - `aspect_ratio` para indicaciones de relación de aspecto
    - `creativity`, cuyo valor predeterminado es `medium`
    - `image_style_references` cuando se proporcionan `image` o `images`

    Seleccione Krea 2 Medium para obtener ilustraciones expresivas con mayor
    rapidez y Krea 2 Large para obtener resultados fotorrealistas y con
    texturas, más lentos pero detallados:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Actualmente, Krea 2 devuelve una imagen por solicitud. Prefiera
    `aspectRatio` para Krea; OpenClaw asigna `size` a la relación de aspecto
    de Krea compatible más cercana y rechaza `resolution` para Krea en lugar
    de descartarla. Use `fal.creativity` cuando quiera un nivel de creatividad
    nativo de Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    La generación de imágenes de MiniMax está disponible mediante ambas rutas
    de autenticación incluidas de MiniMax:

    - `minimax/image-01` para configuraciones con clave de API
    - `minimax-portal/image-01` para configuraciones con OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    El proveedor xAI incluido usa `/v1/images/generations` para solicitudes
    basadas solo en instrucciones y `/v1/images/edits` cuando están presentes
    `image` o `images`.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Cantidad: hasta 4
    - Referencias: una `image` o hasta tres `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluciones: `1K`, `2K`
    - Salidas: se devuelven como archivos adjuntos de imagen administrados por OpenClaw

    OpenClaw no expone deliberadamente los controles nativos de xAI `quality`,
    `mask`, `user` ni la relación de aspecto `auto` hasta que dichos controles
    existan en el contrato compartido entre proveedores de `image_generate`.

  </Accordion>
</AccordionGroup>

## Ejemplos

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generar (dos cuadradas)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Dos direcciones visuales para el icono de una aplicación de productividad serena" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Editar (una referencia)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantén el sujeto y sustituye el fondo por un estudio con iluminación brillante" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Editar (varias referencias)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combina la identidad del personaje de la primera imagen con la paleta de colores de la segunda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Referencias de estilo de Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Un retrato editorial expresivo que utilice esta paleta de colores y textura de impresión" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Las mismas opciones `--output-format`, `--background`, `--quality` y
`--openai-moderation` están disponibles en `openclaw infer image edit`;
`--openai-background` se mantiene como alias específico de OpenAI. Actualmente,
los proveedores incluidos distintos de OpenAI no declaran un control explícito
del fondo, por lo que `background: "transparent"` se indica como ignorado para
ellos.

## Contenido relacionado

- [Descripción general de las herramientas](/es/tools) - todas las herramientas disponibles para agentes
- [ComfyUI](/es/providers/comfy) - configuración de flujos de trabajo de ComfyUI local y Comfy Cloud
- [fal](/es/providers/fal) - configuración del proveedor de imágenes y vídeos fal
- [Google (Gemini)](/es/providers/google) - configuración del proveedor de imágenes Gemini
- [Plugin de Microsoft Foundry](/es/plugins/reference/microsoft-foundry) - configuración del chat de Microsoft Foundry y de imágenes MAI
- [MiniMax](/es/providers/minimax) - configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) - configuración del proveedor de imágenes de OpenAI
- [Vydra](/es/providers/vydra) - configuración de imágenes, vídeos y voz de Vydra
- [xAI](/es/providers/xai) - configuración de imágenes, vídeos, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) - configuración de modelos y conmutación por error
