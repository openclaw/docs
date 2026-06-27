---
read_when:
    - Generar o editar imágenes mediante el agente
    - Configuración de proveedores y modelos de generación de imágenes
    - Comprender los parámetros de la herramienta image_generate
sidebarTitle: Image generation
summary: Genera y edita imágenes mediante image_generate en OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Generación de imágenes
x-i18n:
    generated_at: "2026-06-27T13:05:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

La herramienta `image_generate` permite que el agente cree y edite imágenes usando tus
proveedores configurados. En las sesiones de chat, la generación de imágenes se ejecuta de forma asíncrona:
OpenClaw registra una tarea en segundo plano, devuelve el id de la tarea de inmediato y despierta
al agente cuando el proveedor termina. El agente de finalización sigue el
modo normal de respuesta visible de la sesión: entrega automática de la respuesta final cuando
está configurada, o `message(action="send")` cuando la sesión requiere la herramienta
de mensajes. Si la sesión solicitante está inactiva o su activación falla, y aún faltan algunas
imágenes generadas en la respuesta de finalización, OpenClaw envía una
reserva directa idempotente solo con las imágenes faltantes.

<Note>
La herramienta solo aparece cuando hay al menos un proveedor de generación de imágenes
disponible. Si no ves `image_generate` en las herramientas de tu agente,
configura `agents.defaults.imageGenerationModel`, configura una clave de API del proveedor
o inicia sesión con OAuth de OpenAI ChatGPT/Codex.
</Note>

## Inicio rápido

<Steps>
  <Step title="Configurar autenticación">
    Define una clave de API para al menos un proveedor (por ejemplo `OPENAI_API_KEY`,
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

    OAuth de ChatGPT/Codex usa la misma referencia de modelo `openai/gpt-image-2`. Cuando se
    configura un perfil OAuth de `openai`, OpenClaw enruta las solicitudes de imagen
    a través de ese perfil OAuth en lugar de intentar primero
    `OPENAI_API_KEY`. La configuración explícita de `models.providers.openai` (clave de API,
    URL base personalizada/Azure) vuelve a optar por la ruta directa de la API de OpenAI Images.

  </Step>
  <Step title="Pedirle al agente">
    _"Genera una imagen de una mascota robot amigable."_

    El agente llama a `image_generate` automáticamente. No se necesita una lista de permitidos
    de herramientas: está habilitada de forma predeterminada cuando hay un proveedor disponible. La herramienta
    devuelve un id de tarea en segundo plano, y luego el agente de finalización envía el adjunto
    generado mediante la herramienta `message` cuando está listo.

  </Step>
</Steps>

<Warning>
Para endpoints LAN compatibles con OpenAI, como LocalAI, conserva el valor personalizado de
`models.providers.openai.baseUrl` y opta explícitamente por usar
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Los endpoints de imagen privados e
internos permanecen bloqueados de forma predeterminada.
</Warning>

## Rutas comunes

| Objetivo                                             | Referencia de modelo                                | Autenticación                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generación de imágenes de OpenAI con facturación por API | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Generación de imágenes de OpenAI con autenticación de suscripción de Codex | `openai/gpt-image-2`                               | OAuth de OpenAI ChatGPT/Codex          |
| PNG/WebP con fondo transparente de OpenAI            | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` u OAuth de OpenAI Codex |
| Generación de imágenes de DeepInfra                  | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Generación expresiva/dirigida por estilo de fal Krea 2 | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Generación de imágenes de OpenRouter                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generación de imágenes de LiteLLM                    | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generación de imágenes de Microsoft Foundry MAI      | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` o Entra ID      |
| Generación de imágenes de Google Gemini              | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`    |

La misma herramienta `image_generate` gestiona texto a imagen y edición con imágenes de referencia.
Usa `image` para una referencia o `images` para varias referencias.
Para los modelos Krea 2 en fal, esas referencias se envían como referencias de estilo
en lugar de entradas de edición.
Las indicaciones de salida admitidas por el proveedor, como `quality`, `outputFormat` y
`background`, se reenvían cuando están disponibles y se informan como ignoradas cuando un
proveedor no las admite. La compatibilidad incluida con fondos transparentes es
específica de OpenAI; otros proveedores aún pueden conservar el alfa PNG si su
backend lo emite.

## Proveedores admitidos

| Proveedor         | Modelo predeterminado                    | Compatibilidad de edición           | Autenticación                                        |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Sí (1 imagen, configurada por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para la nube |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Sí (1 imagen)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Sí (límites específicos del modelo) | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Sí                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Sí (hasta 5 imágenes de entrada)    | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Sí (solo modelos MAI-Image-2.5)     | `AZURE_OPENAI_API_KEY` o Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Sí (referencia de sujeto)           | `MINIMAX_API_KEY` u OAuth de MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Sí (hasta 4 imágenes)               | `OPENAI_API_KEY` u OAuth de OpenAI ChatGPT/Codex     |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Sí (hasta 5 imágenes de entrada)    | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | No                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Sí (hasta 5 imágenes)               | `XAI_API_KEY`                                         |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```text
/tool image_generate action=list
```

Usa `action: "status"` para inspeccionar la tarea activa de generación de imágenes de la
sesión actual:

```text
/tool image_generate action=status
```

## Capacidades de los proveedores

| Capacidad             | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Generar (cantidad máxima) | Definida por workflow | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Edición / referencia  | 1 imagen (workflow) | 1 imagen  | Flux: 1; GPT: 10; refs. de estilo Krea: 10; NB2: 14 | Hasta 5 imágenes | 1 imagen       | 1 imagen (ref. de sujeto) | Hasta 5 imágenes | -     | Hasta 5 imágenes |
| Control de tamaño     | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Hasta 4K       | -     | -              |
| Relación de aspecto   | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Resolución (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Prompt de generación de imágenes. Obligatorio para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Usa `"status"` para inspeccionar la tarea de la sesión activa o `"list"` para inspeccionar
  los proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>
<ParamField path="model" type="string">
  Anulación de proveedor/modelo (por ejemplo `openai/gpt-image-2`). Usa
  `openai/gpt-image-1.5` para fondos transparentes de OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una sola imagen de referencia para el modo de edición.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia para el modo de edición o modelos con referencias de estilo (hasta 10
  mediante la herramienta compartida; se siguen aplicando los límites específicos del proveedor).
</ParamField>
<ParamField path="size" type="string">
  Indicación de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Relación de aspecto: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Los proveedores
  validan su subconjunto específico del modelo.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Indicación de resolución.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Indicación de calidad cuando el proveedor la admite.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Indicación de formato de salida cuando el proveedor la admite.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Indicación de fondo cuando el proveedor la admite. Usa `transparent` con
  `outputFormat: "png"` o `"webp"` para proveedores compatibles con transparencia.
</ParamField>
<ParamField path="count" type="number">Número de imágenes que se generarán (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Tiempo de espera opcional de la solicitud al proveedor, en milisegundos. Cuando Codex llama a
  `image_generate` mediante herramientas dinámicas, este valor por llamada aún anula
  el valor predeterminado configurado y tiene un límite de 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Indicación de nombre de archivo de salida.</ParamField>
<ParamField path="openai" type="object">
  Indicaciones solo para OpenAI: `background`, `moderation`, `outputCompression` y `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Control de creatividad de fal Krea 2. El valor predeterminado es `medium`.
</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. Cuando un proveedor de reserva admite una
opción de geometría cercana en lugar de la exacta solicitada, OpenClaw reasigna al
tamaño, relación de aspecto o resolución compatibles más cercanos antes del envío.
Las indicaciones de salida no admitidas se descartan para los proveedores que no declaran
compatibilidad y se informan en el resultado de la herramienta. Los resultados de la herramienta informan la configuración
aplicada; `details.normalization` captura cualquier traducción de solicitado a aplicado.
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

OpenClaw prueba los proveedores en este orden:

1. Parámetro **`model`** de la llamada de herramienta (si el agente especifica uno).
2. **`imageGenerationModel.primary`** de la configuración.
3. **`imageGenerationModel.fallbacks`** en orden.
4. **Detección automática** - solo valores predeterminados de proveedor respaldados por autenticación:
   - primero el proveedor predeterminado actual;
   - el resto de proveedores de generación de imágenes registrados en orden de id de proveedor.

Si un proveedor falla (error de autenticación, límite de tasa, etc.), se prueba automáticamente el siguiente
candidato configurado. Si todos fallan, el error incluye detalles
de cada intento.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Una anulación de `model` por llamada prueba solo ese proveedor/modelo y
    no continúa con el proveedor principal/de reserva configurado ni con proveedores detectados automáticamente.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw puede
    autenticar realmente ese proveedor. Establece
    `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar solo
    entradas explícitas de `model`, `primary` y `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Establece `agents.defaults.imageGenerationModel.timeoutMs` para backends de imagen
    lentos. Un parámetro de herramienta `timeoutMs` por llamada anula el valor
    predeterminado configurado, y los valores predeterminados configurados anulan los valores
    predeterminados de proveedor definidos por plugins. Los proveedores de imágenes alojados de Google y OpenRouter usan valores
    predeterminados de 180 segundos; la generación de imágenes de Microsoft Foundry MAI, xAI y Azure OpenAI usa
    600 segundos. Las llamadas de herramientas dinámicas de Codex usan un valor predeterminado de puente `image_generate`
    de 120 segundos y respetan el mismo presupuesto de tiempo de espera cuando está configurado, limitado por
    el máximo de puente de herramienta dinámica de 600000 ms de OpenClaw.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Usa `action: "list"` para inspeccionar los proveedores registrados actualmente,
    sus modelos predeterminados y las pistas de variables de entorno de autenticación.
  </Accordion>
</AccordionGroup>

### Edición de imágenes

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI y xAI admiten editar imágenes de referencia. Los modelos Krea 2 en fal usan los
mismos campos `image` / `images` como referencias de estilo en lugar de entradas de edición. Pasa
una ruta o URL de imagen de referencia:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google y xAI admiten hasta 5 imágenes de referencia mediante el
parámetro `images`. fal admite 1 imagen de referencia para Flux de imagen a imagen, hasta
10 para ediciones de GPT Image 2, hasta 10 referencias de estilo para Krea 2 y hasta
14 para ediciones de Nano Banana 2. Microsoft Foundry, MiniMax y ComfyUI admiten 1.

## Análisis detallado de proveedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    La generación de imágenes de OpenAI usa `openai/gpt-image-2` de forma predeterminada. Si se
    configura un perfil OAuth de `openai`, OpenClaw reutiliza el mismo
    perfil OAuth usado por los modelos de chat de suscripción de Codex y envía la
    solicitud de imagen a través del backend de Codex Responses. Las URL base heredadas de Codex,
    como `https://chatgpt.com/backend-api`, se canonicalizan a
    `https://chatgpt.com/backend-api/codex` para solicitudes de imagen. OpenClaw
    **no** recurre silenciosamente a `OPENAI_API_KEY` para esa solicitud:
    para forzar el enrutamiento directo de la API de OpenAI Images, configura
    `models.providers.openai` explícitamente con una clave de API, una URL base personalizada
    o un endpoint de Azure.

    Los modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` y
    `openai/gpt-image-1-mini` todavía se pueden seleccionar explícitamente. Usa
    `gpt-image-1.5` para salida PNG/WebP con fondo transparente; la API actual
    de `gpt-image-2` rechaza `background: "transparent"`.

    `gpt-image-2` admite tanto generación de texto a imagen como
    edición con imágenes de referencia mediante la misma herramienta `image_generate`.
    OpenClaw reenvía `prompt`, `count`, `size`, `quality`, `outputFormat`
    e imágenes de referencia a OpenAI. OpenAI **no** recibe
    `aspectRatio` ni `resolution` directamente; cuando es posible, OpenClaw asigna
    esos valores a un `size` admitido; de lo contrario, la herramienta los informa como
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
    modelo de imagen de OpenAI con capacidad de transparencia. OpenClaw enruta las solicitudes predeterminadas
    de fondo transparente de `gpt-image-2` a `gpt-image-1.5`.
    `openai.outputCompression` se aplica a salidas JPEG/WebP y se ignora
    para salidas PNG.

    La pista de nivel superior `background` es neutral respecto al proveedor y actualmente se asigna
    al mismo campo de solicitud `background` de OpenAI cuando se selecciona el proveedor
    OpenAI. Los proveedores que no declaran compatibilidad con fondo la devuelven
    en `ignoredOverrides` en lugar de recibir el parámetro no admitido.

    Para enrutar la generación de imágenes de OpenAI mediante una implementación de Azure OpenAI
    en lugar de `api.openai.com`, consulta
    [endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    La generación de imágenes de Microsoft Foundry usa nombres de implementaciones de imagen MAI desplegadas
    bajo el prefijo de proveedor `microsoft-foundry/`. No hay un modelo predeterminado
    a nivel de proveedor porque la API MAI espera tu nombre de implementación en el
    campo `model`:

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

    El proveedor usa la API MAI de Microsoft Foundry, no la API de OpenAI Images:

    - Endpoint de generación: `/mai/v1/images/generations`
    - Endpoint de edición: `/mai/v1/images/edits`
    - Autenticación: `AZURE_OPENAI_API_KEY` / clave de API del proveedor, o Entra ID mediante `az login`
    - Salida: una imagen PNG
    - Tamaño: predeterminado `1024x1024`; el ancho y la altura deben ser de al menos 768 px cada uno,
      y el total de píxeles debe ser como máximo 1.048.576
    - Ediciones: una imagen de referencia PNG o JPEG, admitida solo por implementaciones
      `MAI-Image-2.5-Flash` y `MAI-Image-2.5`

    La generación solo con prompt puede usar un nombre de implementación personalizado con solo el
    endpoint de Foundry configurado. Las ediciones con nombres de implementación personalizados necesitan
    metadatos de onboarding/modelo para que OpenClaw pueda verificar que la implementación está
    respaldada por `MAI-Image-2.5-Flash` o `MAI-Image-2.5`.

    Los modelos de imagen MAI actuales son `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` y `MAI-Image-2`. Consulta
    [plugin de Microsoft Foundry](/es/plugins/reference/microsoft-foundry) para configuración
    y comportamiento de modelos de chat.

  </Accordion>
  <Accordion title="OpenRouter image models">
    La generación de imágenes de OpenRouter usa la misma `OPENROUTER_API_KEY` y
    enruta mediante la API de imágenes de chat completions de OpenRouter. Selecciona
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
    pistas `aspectRatio` / `resolution` compatibles con Gemini a OpenRouter.
    Los atajos de modelos de imagen integrados actuales de OpenRouter incluyen
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`. Usa
    `action: "list"` para ver qué expone tu plugin configurado.

  </Accordion>
  <Accordion title="fal Krea 2">
    Los modelos Krea 2 en fal usan el esquema nativo de Krea de fal en lugar del esquema genérico
    `image_size` usado por Flux. OpenClaw envía:

    - `aspect_ratio` para pistas de relación de aspecto
    - `creativity`, con valor predeterminado `medium`
    - `image_style_references` cuando se proporcionan `image` o `images`

    Selecciona Krea 2 Medium para ilustración expresiva más rápida y Krea 2 Large
    para aspectos fotorrealistas y texturizados más lentos y detallados:

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

    Krea 2 actualmente devuelve una imagen por solicitud. Prefiere `aspectRatio` para
    Krea; OpenClaw asigna `size` a la relación de aspecto de Krea admitida más cercana y
    rechaza `resolution` para Krea en lugar de descartarla. Usa `fal.creativity`
    cuando quieras un nivel de creatividad nativo de Krea:

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
    La generación de imágenes de MiniMax está disponible a través de ambas rutas de autenticación
    MiniMax incluidas:

    - `minimax/image-01` para configuraciones con clave de API
    - `minimax-portal/image-01` para configuraciones OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    El proveedor xAI incluido usa `/v1/images/generations` para solicitudes
    solo con prompt y `/v1/images/edits` cuando `image` o `images` está presente.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Cantidad: hasta 4
    - Referencias: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Salidas: devueltas como adjuntos de imagen gestionados por OpenClaw

    OpenClaw intencionalmente no expone `quality`, `mask`,
    `user` ni relaciones de aspecto adicionales solo nativas de xAI hasta que esos controles existan
    en el contrato compartido entre proveedores `image_generate`.

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
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Las mismas marcas `--output-format`, `--background`, `--quality` y
`--openai-moderation` están disponibles en `openclaw infer image edit`;
`--openai-background` se mantiene como alias específico de OpenAI. Los proveedores incluidos
distintos de OpenAI no declaran actualmente un control explícito del fondo, por lo que
`background: "transparent"` se informa como ignorado para ellos.

## Relacionado

- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
- [ComfyUI](/es/providers/comfy) - configuración de flujos de trabajo locales de ComfyUI y Comfy Cloud
- [fal](/es/providers/fal) - configuración del proveedor de imagen y video fal
- [Google (Gemini)](/es/providers/google) - configuración del proveedor de imágenes Gemini
- [Plugin Microsoft Foundry](/es/plugins/reference/microsoft-foundry) - configuración de chat de Microsoft Foundry e imágenes MAI
- [MiniMax](/es/providers/minimax) - configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) - configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) - configuración de imagen, video y voz de Vydra
- [xAI](/es/providers/xai) - configuración de imagen, video, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) - configuración de modelos y conmutación por error
