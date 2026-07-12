---
read_when:
    - Generar o editar imágenes mediante el agente
    - Configuración de proveedores y modelos de generación de imágenes
    - Comprender los parámetros de la herramienta image_generate
sidebarTitle: Image generation
summary: Genera y edita imágenes mediante image_generate en OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI y Vydra
title: Generación de imágenes
x-i18n:
    generated_at: "2026-07-12T14:53:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

La herramienta `image_generate` crea y edita imágenes mediante los proveedores
configurados. En las sesiones de chat, se ejecuta de forma asíncrona: OpenClaw
registra una tarea en segundo plano, devuelve inmediatamente el id de la tarea
y reactiva el agente cuando el proveedor termina. El agente de finalización
sigue el modo normal de respuesta visible de la sesión: entrega automática de
la respuesta final cuando está configurada, o `message(action="send")` cuando
la sesión requiere la herramienta de mensajes. Si la sesión solicitante está
inactiva o falla su reactivación activa, OpenClaw envía una alternativa directa
e idempotente con las imágenes generadas para que el resultado no se pierda.

<Note>
La herramienta solo aparece cuando hay al menos un proveedor de generación de
imágenes disponible. Si no aparece `image_generate` entre las herramientas del
agente, configure `agents.defaults.imageGenerationModel`, establezca una clave
de API de proveedor o inicie sesión con OAuth de OpenAI ChatGPT/Codex.
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
    OpenClaw dirige las solicitudes de imágenes mediante ese perfil OAuth en
    lugar de intentar primero `OPENAI_API_KEY`. Una configuración explícita de
    `models.providers.openai` (clave de API, URL base personalizada/de Azure)
    vuelve a habilitar la ruta directa de la API de imágenes de OpenAI.

  </Step>
  <Step title="Pedirlo al agente">
    _"Genera una imagen de una mascota robótica amistosa."_

    El agente llama automáticamente a `image_generate`. No es necesario
    incluirla en una lista de herramientas permitidas: está habilitada de forma
    predeterminada cuando hay un proveedor disponible. La herramienta devuelve
    un id de tarea en segundo plano y, cuando está lista, el agente de
    finalización envía la imagen generada como archivo adjunto mediante la
    herramienta `message`.

  </Step>
</Steps>

<Warning>
Para endpoints de LAN compatibles con OpenAI, como LocalAI, conserve el valor
personalizado de `models.providers.openai.baseUrl` y habilite explícitamente
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Los endpoints de
imágenes privados e internos permanecen bloqueados de forma predeterminada.
</Warning>

## Rutas comunes

| Objetivo                                             | Referencia del modelo                               | Autenticación                          |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generación de imágenes de OpenAI con facturación de API | `openai/gpt-image-2`                            | `OPENAI_API_KEY`                       |
| Generación de imágenes de OpenAI con autenticación de suscripción de Codex | `openai/gpt-image-2`            | OAuth de OpenAI ChatGPT/Codex          |
| PNG/WebP de OpenAI con fondo transparente            | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` u OAuth de OpenAI Codex |
| Generación de imágenes de DeepInfra                  | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Generación expresiva o dirigida por estilo con Krea 2 de fal | `fal/krea/v2/medium/text-to-image`          | `FAL_KEY`                              |
| Generación de imágenes de OpenRouter                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generación de imágenes de LiteLLM                    | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generación de imágenes MAI de Microsoft Foundry      | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` o Entra ID      |
| Generación de imágenes de Google Gemini              | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`    |

La misma herramienta gestiona la generación de texto a imagen y la edición con
imágenes de referencia. Use `image` para una referencia o `images` para varias.
En los modelos Krea 2 de fal, esas referencias se envían como referencias de
estilo en lugar de entradas de edición. Las indicaciones de salida compatibles
con el proveedor, como `quality`, `outputFormat` y `background`, se reenvían
cuando están disponibles y se indican como ignoradas cuando un proveedor no
declara compatibilidad. La compatibilidad integrada con fondos transparentes
es específica de OpenAI; otros proveedores aún pueden conservar el canal alfa
de PNG si su backend lo genera.

## Proveedores compatibles

| Proveedor         | Modelo predeterminado                    | Compatibilidad con edición                | Autenticación                                        |
| ----------------- | --------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| ComfyUI           | `workflow`                              | Sí (1 imagen, configurada por el flujo de trabajo) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para la nube |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Sí (1 imagen)                             | `DEEPINFRA_API_KEY`                                  |
| fal               | `fal-ai/flux/dev`                       | Sí (límites específicos del modelo)       | `FAL_KEY`                                            |
| Google            | `gemini-3.1-flash-image-preview`        | Sí (hasta 5 imágenes)                     | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Sí (hasta 5 imágenes de entrada)          | `LITELLM_API_KEY`                                    |
| Microsoft Foundry | `<deployment-name>`                     | Sí (solo modelos MAI-Image-2.5)           | `AZURE_OPENAI_API_KEY` o Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Sí (referencia de sujeto)                 | `MINIMAX_API_KEY` u OAuth de MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Sí (hasta 5 imágenes)                     | `OPENAI_API_KEY` u OAuth de OpenAI ChatGPT/Codex     |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Sí (hasta 5 imágenes de entrada)          | `OPENROUTER_API_KEY`                                 |
| Vydra             | `grok-imagine`                          | No                                        | `VYDRA_API_KEY`                                      |
| xAI               | `grok-imagine-image`                    | Sí (hasta 3 imágenes)                     | `XAI_API_KEY`                                        |

Use `action: "list"` para consultar los proveedores y modelos disponibles en
tiempo de ejecución:

```text
/tool image_generate action=list
```

Use `action: "status"` para consultar la tarea activa de generación de imágenes
de la sesión actual:

```text
/tool image_generate action=status
```

## Capacidades de los proveedores

| Capacidad              | ComfyUI                    | DeepInfra | fal                                            | Google            | Microsoft Foundry | MiniMax                         | OpenAI            | Vydra | xAI               |
| ---------------------- | -------------------------- | --------- | ---------------------------------------------- | ----------------- | ----------------- | ------------------------------- | ----------------- | ----- | ----------------- |
| Generación (cantidad máxima) | 1                    | 4         | 4                                              | 4                 | 1                 | 9                               | 4                 | 1     | 4                 |
| Edición/referencia     | 1 imagen (flujo de trabajo) | 1 imagen | Flux: 1; GPT: 10; refs. de estilo Krea: 10; NB2: 14 | Hasta 5 imágenes | 1 imagen          | 1 imagen (ref. de sujeto)       | Hasta 5 imágenes  | -     | Hasta 3 imágenes  |
| Control de tamaño      | -                          | ✓         | ✓                                              | ✓                 | ✓                 | -                               | Hasta 4K          | -     | -                 |
| Relación de aspecto    | -                          | -         | ✓                                              | ✓                 | -                 | ✓                               | -                 | -     | ✓                 |
| Resolución (1K/2K/4K)  | -                          | -         | ✓                                              | ✓                 | -                 | -                               | -                 | -     | 1K, 2K            |

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Indicación para generar la imagen. Obligatoria para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Use `"status"` para consultar la tarea activa de la sesión o `"list"` para
  consultar los proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>
<ParamField path="model" type="string">
  Sustitución del proveedor/modelo (por ejemplo, `openai/gpt-image-2`). Use
  `openai/gpt-image-1.5` para fondos transparentes de OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una sola imagen de referencia para el modo de edición.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia para el modo de edición o modelos de referencia
  de estilo (hasta 14 mediante la herramienta compartida; siguen aplicándose
  los límites específicos del proveedor).
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
  `outputFormat: "png"` o `"webp"` para proveedores con capacidad de
  transparencia.
</ParamField>
<ParamField path="count" type="number">Número de imágenes que se generarán (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Tiempo de espera opcional de la solicitud al proveedor, en milisegundos.
  Cuando Codex llama a `image_generate` mediante herramientas dinámicas, este
  valor por llamada sigue sustituyendo el valor predeterminado configurado y
  tiene un límite de 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Indicación del nombre del archivo de salida.</ParamField>
<ParamField path="openai" type="object">
  Indicaciones exclusivas de OpenAI: `background`, `moderation`,
  `outputCompression` y `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Control de creatividad de Krea 2 de fal. El valor predeterminado es `medium`.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. Cuando un proveedor
alternativo admite una opción geométrica cercana en lugar de la solicitada
exactamente, OpenClaw la reasigna al tamaño, relación de aspecto o resolución
compatible más cercana antes de enviarla. Las indicaciones de salida no
admitidas se descartan para los proveedores que no declaran compatibilidad y
se indican en el resultado de la herramienta. Los resultados de la herramienta
indican los ajustes aplicados; `details.normalization` registra cualquier
conversión de los valores solicitados a los aplicados.
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

1. Parámetro **`model`** de la llamada a la herramienta (si el agente especifica uno).
2. **`imageGenerationModel.primary`** de la configuración.
3. **`imageGenerationModel.fallbacks`** en orden.
4. **Detección automática**: solo valores predeterminados de proveedores respaldados por autenticación:
   - primero, el proveedor predeterminado actual;
   - después, los proveedores de generación de imágenes registrados restantes, ordenados por id. de proveedor.

Si un proveedor falla (error de autenticación, límite de frecuencia, etc.), se prueba automáticamente
el siguiente candidato configurado. Si todos fallan, el error incluye detalles
de cada intento.

<AccordionGroup>
  <Accordion title="Las sustituciones del modelo por llamada son exactas">
    Una sustitución de `model` por llamada prueba únicamente ese proveedor/modelo y
    no continúa con el proveedor principal, los alternativos ni los detectados automáticamente.
  </Accordion>
  <Accordion title="La detección automática tiene en cuenta la autenticación">
    El valor predeterminado de un proveedor solo entra en la lista de candidatos cuando OpenClaw puede
    autenticar realmente ese proveedor. Establezca
    `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar únicamente
    las entradas explícitas `model`, `primary` y `fallbacks`.
  </Accordion>
  <Accordion title="Tiempos de espera">
    Establezca `agents.defaults.imageGenerationModel.timeoutMs` para backends de imágenes
    lentos. Un parámetro `timeoutMs` de la herramienta por llamada sustituye el valor
    predeterminado configurado, y los valores predeterminados configurados sustituyen los
    valores predeterminados del proveedor definidos por el plugin. Los proveedores de imágenes
    alojados de Google y OpenRouter usan valores predeterminados de 180 segundos; la generación
    de imágenes de Microsoft Foundry MAI, xAI y Azure OpenAI usa 600 segundos. Las llamadas a
    herramientas dinámicas de Codex usan un valor predeterminado de 120 segundos para el puente
    `image_generate` y respetan el mismo límite de tiempo cuando está configurado, con el máximo
    de 600000 ms del puente de herramientas dinámicas de OpenClaw como límite superior.
  </Accordion>
  <Accordion title="Inspección en tiempo de ejecución">
    Use `action: "list"` para inspeccionar los proveedores registrados actualmente,
    sus modelos predeterminados y las indicaciones de variables de entorno de autenticación.
  </Accordion>
</AccordionGroup>

### Edición de imágenes

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI y xAI permiten editar imágenes de referencia. Los modelos Krea 2 en fal usan
los mismos campos `image` / `images` como referencias de estilo en lugar de entradas
de edición. Pase una ruta o URL de una imagen de referencia:

```text
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter y Google admiten hasta 5 imágenes de referencia mediante el
parámetro `images`; xAI admite hasta 3. fal admite 1 imagen de referencia para
la conversión de imagen a imagen de Flux, hasta 10 para ediciones de GPT Image 2,
hasta 10 referencias de estilo para Krea 2 y hasta 14 para ediciones de Nano Banana 2.
Microsoft Foundry, MiniMax y ComfyUI admiten 1.

## Análisis detallado de los proveedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (y gpt-image-1.5)">
    La generación de imágenes de OpenAI usa `openai/gpt-image-2` de forma predeterminada. Si se
    configura un perfil OAuth de `openai`, OpenClaw reutiliza el mismo
    perfil OAuth utilizado por los modelos de chat de la suscripción de Codex y envía la
    solicitud de imagen mediante el backend Codex Responses. Las URL base heredadas de Codex,
    como `https://chatgpt.com/backend-api`, se normalizan como
    `https://chatgpt.com/backend-api/codex` para las solicitudes de imágenes. OpenClaw
    **no** recurre silenciosamente a `OPENAI_API_KEY` para esa solicitud:
    para forzar el enrutamiento directo mediante la API OpenAI Images, configure
    `models.providers.openai` explícitamente con una clave de API, una URL base personalizada
    o un endpoint de Azure.

    Los modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` y
    `openai/gpt-image-1-mini` todavía pueden seleccionarse explícitamente. Use
    `gpt-image-1.5` para obtener PNG/WebP con fondo transparente; la API actual de
    `gpt-image-2` rechaza `background: "transparent"`.

    `gpt-image-2` admite tanto la generación de texto a imagen como
    la edición de imágenes de referencia mediante la misma herramienta `image_generate`.
    OpenClaw reenvía `prompt`, `count`, `size`, `quality`, `outputFormat`
    y las imágenes de referencia a OpenAI. OpenAI **no** recibe
    `aspectRatio` ni `resolution` directamente; cuando es posible, OpenClaw los asigna
    a un valor `size` compatible; de lo contrario, la herramienta informa que son
    sustituciones ignoradas.

    Las opciones específicas de OpenAI se encuentran en el objeto `openai`:

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
    las salidas transparentes requieren que `outputFormat` sea `png` o `webp` y un
    modelo de imágenes de OpenAI compatible con transparencias. OpenClaw enruta las solicitudes
    con fondo transparente del modelo predeterminado `gpt-image-2` a `gpt-image-1.5`.
    `openai.outputCompression` se aplica a las salidas JPEG/WebP y se ignora
    para las salidas PNG.

    La indicación de nivel superior `background` es independiente del proveedor y actualmente se asigna
    al mismo campo de solicitud `background` de OpenAI cuando se selecciona el proveedor
    OpenAI. Los proveedores que no declaran compatibilidad con fondos la devuelven
    en `ignoredOverrides` en lugar de recibir el parámetro no compatible.

    Para enrutar la generación de imágenes de OpenAI mediante una implementación de Azure OpenAI
    en lugar de `api.openai.com`, consulte
    [Endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modelos de imágenes Microsoft Foundry MAI">
    La generación de imágenes de Microsoft Foundry usa los nombres de las implementaciones
    de imágenes MAI bajo el prefijo de proveedor `microsoft-foundry/`. No hay un modelo
    predeterminado a nivel de proveedor porque la API MAI espera el nombre de la implementación
    en el campo `model`:

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

    El proveedor usa la API MAI de Microsoft Foundry, no la API OpenAI Images:

    - Endpoint de generación: `/mai/v1/images/generations`
    - Endpoint de edición: `/mai/v1/images/edits`
    - Autenticación: `AZURE_OPENAI_API_KEY` / clave de API del proveedor, o Entra ID mediante `az login`
    - Salida: una imagen PNG
    - Tamaño: valor predeterminado `1024x1024`; tanto el ancho como el alto deben ser de al menos 768 px,
      y el total de píxeles debe ser como máximo 1,048,576
    - Ediciones: una imagen de referencia PNG o JPEG, compatible únicamente con
      las implementaciones `MAI-Image-2.5-Flash` y `MAI-Image-2.5`

    La generación basada únicamente en una instrucción puede usar un nombre de implementación
    personalizado con solo el endpoint de Foundry configurado. Las ediciones con nombres de
    implementación personalizados necesitan metadatos de incorporación/modelo para que OpenClaw
    pueda verificar que la implementación está respaldada por `MAI-Image-2.5-Flash` o
    `MAI-Image-2.5`.

    Los modelos de imágenes MAI actuales son `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` y `MAI-Image-2`. Consulte
    [Plugin de Microsoft Foundry](/es/plugins/reference/microsoft-foundry) para obtener información
    sobre la configuración y el comportamiento de los modelos de chat.

  </Accordion>
  <Accordion title="Modelos de imágenes de OpenRouter">
    La generación de imágenes de OpenRouter usa la misma `OPENROUTER_API_KEY` y
    se enruta mediante la API de imágenes de finalizaciones de chat de OpenRouter. Seleccione
    los modelos de imágenes de OpenRouter con el prefijo `openrouter/`:

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

    OpenClaw reenvía `prompt`, `count`, las imágenes de referencia y las indicaciones
    `aspectRatio` / `resolution` compatibles con Gemini a OpenRouter.
    Los accesos directos integrados actuales para modelos de imágenes de OpenRouter incluyen
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`. Use
    `action: "list"` para ver lo que expone el plugin configurado.

  </Accordion>
  <Accordion title="fal Krea 2">
    Los modelos Krea 2 en fal usan el esquema Krea nativo de fal en lugar del esquema
    genérico `image_size` utilizado por Flux. OpenClaw envía:

    - `aspect_ratio` para indicaciones de relación de aspecto
    - `creativity`, con `medium` como valor predeterminado
    - `image_style_references` cuando se proporcionan `image` o `images`

    Seleccione Krea 2 Medium para ilustraciones expresivas más rápidas y Krea 2 Large
    para estilos fotorrealistas y con textura más lentos y detallados:

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

    Actualmente, Krea 2 devuelve una imagen por solicitud. Se recomienda `aspectRatio` para
    Krea; OpenClaw asigna `size` a la relación de aspecto de Krea compatible más próxima y
    rechaza `resolution` para Krea en lugar de descartarlo. Use `fal.creativity`
    cuando desee un nivel de creatividad nativo de Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "Un retrato de revista ciberpunk con textura de risografía",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Autenticación dual de MiniMax">
    La generación de imágenes de MiniMax está disponible mediante ambas rutas
    de autenticación incluidas de MiniMax:

    - `minimax/image-01` para configuraciones con clave de API
    - `minimax-portal/image-01` para configuraciones con OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    El proveedor xAI incluido usa `/v1/images/generations` para solicitudes
    basadas únicamente en instrucciones y `/v1/images/edits` cuando están presentes `image` o `images`.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Cantidad: hasta 4
    - Referencias: un `image` o hasta tres `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluciones: `1K`, `2K`
    - Salidas: se devuelven como archivos adjuntos de imagen administrados por OpenClaw

    OpenClaw no expone deliberadamente `quality`, `mask` ni `user` nativos de xAI,
    ni la relación de aspecto `auto`, hasta que esos controles existan en el contrato
    compartido entre proveedores de `image_generate`.

  </Accordion>
</AccordionGroup>

## Ejemplos

<Tabs>
  <Tab title="Generar (paisaje 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Un póster editorial limpio para la generación de imágenes de OpenClaw" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generar (PNG transparente)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Una pegatina sencilla de un círculo rojo sobre un fondo transparente" outputFormat=png background=transparent
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Una pegatina sencilla de un círculo rojo sobre un fondo transparente" \
  --json
```

  </Tab>
  <Tab title="Generar (calidad baja de OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Borrador de póster de bajo coste para una aplicación de productividad tranquila" quality=low openai='{"moderation":"low"}'
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Borrador de póster de bajo coste para una aplicación de productividad tranquila" \
  --json
```

  </Tab>
  <Tab title="Generar (dos imágenes cuadradas)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Dos direcciones visuales para el icono de una aplicación de productividad serena" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Editar (una referencia)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantén el sujeto y sustituye el fondo por un escenario de estudio luminoso" image=/path/to/reference.png size=1024x1536
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
`--openai-background` se mantiene como alias específico de OpenAI. Actualmente, los proveedores incluidos
distintos de OpenAI no declaran un control explícito del fondo, por lo que
`background: "transparent"` se indica como ignorado para ellos.

## Relacionado

- [Descripción general de las herramientas](/es/tools) - todas las herramientas de agente disponibles
- [ComfyUI](/es/providers/comfy) - configuración de flujos de trabajo locales de ComfyUI y Comfy Cloud
- [fal](/es/providers/fal) - configuración del proveedor de imágenes y vídeos fal
- [Google (Gemini)](/es/providers/google) - configuración del proveedor de imágenes Gemini
- [Plugin de Microsoft Foundry](/es/plugins/reference/microsoft-foundry) - configuración del chat de Microsoft Foundry y de imágenes MAI
- [MiniMax](/es/providers/minimax) - configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) - configuración del proveedor de OpenAI Images
- [Vydra](/es/providers/vydra) - configuración de imágenes, vídeos y voz de Vydra
- [xAI](/es/providers/xai) - configuración de imágenes, vídeos, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) - configuración de modelos y conmutación por error
