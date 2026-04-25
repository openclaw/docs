---
read_when:
    - Generación de imágenes mediante el agente
    - Configuración de proveedores y modelos de generación de imágenes
    - Comprender los parámetros de la herramienta `image_generate`
summary: Generar y editar imágenes usando proveedores configurados (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-25T18:21:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40ec0e9a004e769b3db8b98b1a687097cb4bc6aa78dc903e4f6a17c3731156c0
    source_path: tools/image-generation.md
    workflow: 15
---

La herramienta `image_generate` permite al agente crear y editar imágenes usando tus proveedores configurados. Las imágenes generadas se entregan automáticamente como adjuntos multimedia en la respuesta del agente.

<Note>
La herramienta solo aparece cuando hay al menos un proveedor de generación de imágenes disponible. Si no ves `image_generate` entre las herramientas de tu agente, configura `agents.defaults.imageGenerationModel`, establece una clave de API del proveedor o inicia sesión con OpenAI Codex OAuth.
</Note>

## Inicio rápido

1. Establece una clave de API para al menos un proveedor (por ejemplo `OPENAI_API_KEY`, `GEMINI_API_KEY` o `OPENROUTER_API_KEY`) o inicia sesión con OpenAI Codex OAuth.
2. Opcionalmente establece tu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // Tiempo de espera predeterminado opcional de la solicitud del proveedor para image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth usa la misma referencia de modelo `openai/gpt-image-2`. Cuando se configura un
perfil OAuth `openai-codex`, OpenClaw enruta las solicitudes de imágenes
a través de ese mismo perfil OAuth en lugar de probar primero `OPENAI_API_KEY`.
Una configuración explícita y personalizada de imágenes en `models.providers.openai`, como una clave de API o una
URL base personalizada/Azure, vuelve a optar por la ruta directa de la API de imágenes de OpenAI.
Para endpoints LAN compatibles con OpenAI como LocalAI, mantén la
`models.providers.openai.baseUrl` personalizada y opta explícitamente con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; los endpoints de imágenes
privados/internos siguen bloqueados de forma predeterminada.

3. Pide al agente: _"Genera una imagen de una mascota robot amistosa."_

El agente llama a `image_generate` automáticamente. No hace falta permitir herramientas en listas: está habilitada de forma predeterminada cuando hay un proveedor disponible.

## Rutas comunes

| Objetivo                                             | Referencia de modelo                               | Autenticación                        |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Generación de imágenes de OpenAI con facturación por API | `openai/gpt-image-2`                            | `OPENAI_API_KEY`                     |
| Generación de imágenes de OpenAI con autenticación de suscripción Codex | `openai/gpt-image-2`            | OpenAI Codex OAuth                   |
| Generación de imágenes de OpenRouter                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                |
| Generación de imágenes de LiteLLM                    | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                    |
| Generación de imágenes de Google Gemini              | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`  |

La misma herramienta `image_generate` maneja tanto la generación de imagen a partir de texto como la
edición de imágenes de referencia. Usa `image` para una referencia o `images` para varias referencias.
Las sugerencias de salida compatibles con el proveedor, como `quality`, `outputFormat` y
`background` específico de OpenAI, se reenvían cuando están disponibles y se informan como
ignoradas cuando un proveedor no las admite.

## Proveedores compatibles

| Proveedor  | Modelo predeterminado                    | Compatibilidad de edición           | Autenticación                                          |
| ---------- | ---------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| OpenAI     | `gpt-image-2`                            | Sí (hasta 4 imágenes)               | `OPENAI_API_KEY` u OpenAI Codex OAuth                  |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | Sí (hasta 5 imágenes de entrada)    | `OPENROUTER_API_KEY`                                   |
| LiteLLM    | `gpt-image-2`                            | Sí (hasta 5 imágenes de entrada)    | `LITELLM_API_KEY`                                      |
| Google     | `gemini-3.1-flash-image-preview`         | Sí                                  | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal        | `fal-ai/flux/dev`                        | Sí                                  | `FAL_KEY`                                              |
| MiniMax    | `image-01`                               | Sí (referencia de sujeto)           | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`)   |
| ComfyUI    | `workflow`                               | Sí (1 imagen, configurada por flujo de trabajo) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para la nube |
| Vydra      | `grok-imagine`                           | No                                  | `VYDRA_API_KEY`                                        |
| xAI        | `grok-imagine-image`                     | Sí (hasta 5 imágenes)               | `XAI_API_KEY`                                          |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```
/tool image_generate action=list
```

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
Prompt de generación de imágenes. Obligatorio para `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Usa `"list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>

<ParamField path="model" type="string">
Anulación de proveedor/modelo, por ejemplo `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Ruta o URL de una sola imagen de referencia para el modo de edición.
</ParamField>

<ParamField path="images" type="string[]">
Varias imágenes de referencia para el modo de edición (hasta 5).
</ParamField>

<ParamField path="size" type="string">
Sugerencia de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Sugerencia de resolución.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Sugerencia de calidad cuando el proveedor la admite.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Sugerencia de formato de salida cuando el proveedor lo admite.
</ParamField>

<ParamField path="count" type="number">
Número de imágenes que se van a generar (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Tiempo de espera opcional de la solicitud del proveedor en milisegundos.
</ParamField>

<ParamField path="filename" type="string">
Sugerencia de nombre de archivo de salida.
</ParamField>

<ParamField path="openai" type="object">
Sugerencias exclusivas de OpenAI: `background`, `moderation`, `outputCompression` y `user`.
</ParamField>

No todos los proveedores admiten todos los parámetros. Cuando un proveedor de respaldo admite una opción de geometría cercana en lugar de la solicitada exactamente, OpenClaw la reasigna al tamaño, relación de aspecto o resolución compatibles más cercanos antes del envío. Las sugerencias de salida no compatibles, como `quality` o `outputFormat`, se descartan para proveedores que no declaran compatibilidad y se informan en el resultado de la herramienta.

Los resultados de la herramienta informan la configuración aplicada. Cuando OpenClaw reasigna la geometría durante el respaldo del proveedor, los valores devueltos de `size`, `aspectRatio` y `resolution` reflejan lo que realmente se envió, y `details.normalization` captura la traducción de solicitado a aplicado.

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

### Orden de selección del proveedor

Al generar una imagen, OpenClaw prueba los proveedores en este orden:

1. **Parámetro `model`** de la llamada a la herramienta (si el agente especifica uno)
2. **`imageGenerationModel.primary`** de la configuración
3. **`imageGenerationModel.fallbacks`** en orden
4. **Detección automática** — usa solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - los demás proveedores registrados de generación de imágenes en orden de identificador de proveedor

Si un proveedor falla (error de autenticación, límite de tasa, etc.), el siguiente candidato configurado se prueba automáticamente. Si todos fallan, el error incluye detalles de cada intento.

Notas:

- Una anulación `model` por llamada es exacta: OpenClaw prueba solo ese proveedor/modelo
  y no continúa con el principal/respaldo configurado ni con proveedores
  detectados automáticamente.
- La detección automática tiene en cuenta la autenticación. Un valor predeterminado del proveedor solo entra en la lista de candidatos
  cuando OpenClaw puede autenticar realmente ese proveedor.
- La detección automática está habilitada de forma predeterminada. Establece
  `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la generación de imágenes
  use solo las entradas explícitas `model`, `primary` y `fallbacks`.
- Establece `agents.defaults.imageGenerationModel.timeoutMs` para backends de imágenes lentos.
  Un parámetro de herramienta `timeoutMs` por llamada anula el valor predeterminado configurado.
- Usa `action: "list"` para inspeccionar los proveedores registrados actualmente, sus
  modelos predeterminados y las sugerencias de variables de entorno de autenticación.

### Edición de imágenes

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI y xAI admiten la edición de imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google y xAI admiten hasta 5 imágenes de referencia mediante el parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

### Modelos de imagen de OpenRouter

La generación de imágenes de OpenRouter usa la misma `OPENROUTER_API_KEY` y se enruta a través de la API de imágenes de chat completions de OpenRouter. Selecciona modelos de imagen de OpenRouter con el prefijo `openrouter/`:

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

OpenClaw reenvía `prompt`, `count`, imágenes de referencia y sugerencias compatibles de Gemini para `aspectRatio` / `resolution` a OpenRouter. Los accesos directos actuales integrados para modelos de imagen de OpenRouter incluyen `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`; usa `action: "list"` para ver lo que expone tu plugin configurado.

### OpenAI `gpt-image-2`

La generación de imágenes de OpenAI usa por defecto `openai/gpt-image-2`. Si se configura un
perfil OAuth `openai-codex`, OpenClaw reutiliza el mismo perfil OAuth
usado por los modelos de chat con suscripción Codex y envía la solicitud de imagen
a través del backend de Codex Responses. Las URL base heredadas de Codex, como
`https://chatgpt.com/backend-api`, se canonizan a
`https://chatgpt.com/backend-api/codex` para las solicitudes de imágenes. No
recurre silenciosamente a `OPENAI_API_KEY` para esa solicitud. Para forzar el enrutamiento directo a la
API de imágenes de OpenAI, configura `models.providers.openai` explícitamente con una clave de API,
una URL base personalizada o un endpoint de Azure. El modelo antiguo
`openai/gpt-image-1` todavía se puede seleccionar explícitamente, pero las nuevas solicitudes de
generación y edición de imágenes de OpenAI deben usar `gpt-image-2`.

`gpt-image-2` admite tanto la generación de imagen a partir de texto como la
edición de imágenes de referencia mediante la misma herramienta `image_generate`. OpenClaw reenvía `prompt`,
`count`, `size`, `quality`, `outputFormat` e imágenes de referencia a OpenAI.
OpenAI no recibe `aspectRatio` ni `resolution` directamente; cuando es posible,
OpenClaw los asigna a un `size` compatible; de lo contrario, la herramienta los informa como
anulaciones ignoradas.

Las opciones específicas de OpenAI están en el objeto `openai`:

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

`openai.background` acepta `transparent`, `opaque` o `auto`; las
salidas transparentes requieren `outputFormat` `png` o `webp`. `openai.outputCompression`
se aplica a salidas JPEG/WebP.

Generar una imagen horizontal 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Un póster editorial limpio para la generación de imágenes de OpenClaw" size=3840x2160 count=1
```

Generar dos imágenes cuadradas:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Editar una imagen de referencia local:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Editar con varias referencias:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para enrutar la generación de imágenes de OpenAI a través de una implementación de Azure OpenAI en lugar
de `api.openai.com`, consulta [Endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints)
en la documentación del proveedor OpenAI.

La generación de imágenes de MiniMax está disponible a través de ambas rutas de autenticación MiniMax integradas:

- `minimax/image-01` para configuraciones con clave de API
- `minimax-portal/image-01` para configuraciones con OAuth

## Capacidades del proveedor

| Capacidad            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generar              | Sí (hasta 4)         | Sí (hasta 4)         | Sí (hasta 4)        | Sí (hasta 9)               | Sí (salidas definidas por workflow) | Sí (1) | Sí (hasta 4)         |
| Edición/referencia   | Sí (hasta 5 imágenes) | Sí (hasta 5 imágenes) | Sí (1 imagen)      | Sí (1 imagen, referencia de sujeto) | Sí (1 imagen, configurada por workflow) | No | Sí (hasta 5 imágenes) |
| Control de tamaño    | Sí (hasta 4K)        | Sí                   | Sí                  | No                         | No                                 | No      | No                   |
| Relación de aspecto  | No                   | Sí                   | Sí (solo generación) | Sí                       | No                                 | No      | Sí                   |
| Resolución (1K/2K/4K) | No                  | Sí                   | Sí                  | No                         | No                                 | No      | Sí (1K/2K)           |

### xAI `grok-imagine-image`

El proveedor xAI integrado usa `/v1/images/generations` para solicitudes solo con prompt
y `/v1/images/edits` cuando `image` o `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Cantidad: hasta 4
- Referencias: una `image` o hasta cinco `images`
- Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluciones: `1K`, `2K`
- Salidas: se devuelven como adjuntos de imagen gestionados por OpenClaw

OpenClaw intencionalmente no expone `quality`, `mask`, `user` nativos de xAI ni
relaciones de aspecto adicionales exclusivas nativas hasta que esos controles existan en el contrato compartido
multiplataforma de `image_generate`.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [fal](/es/providers/fal) — configuración del proveedor de imágenes y video de fal
- [ComfyUI](/es/providers/comfy) — configuración local de workflow de ComfyUI y Comfy Cloud
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) — configuración de imágenes, video y voz de Vydra
- [xAI](/es/providers/xai) — configuración de imágenes, video, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) — configuración de modelos y respaldo
