---
read_when:
    - Generar imágenes mediante el agente
    - Configurar proveedores y modelos de generación de imágenes
    - Entender los parámetros de la herramienta `image_generate`
summary: Generar y editar imágenes usando proveedores configurados (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-24T05:54:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

La herramienta `image_generate` permite al agente crear y editar imágenes usando tus proveedores configurados. Las imágenes generadas se entregan automáticamente como archivos multimedia adjuntos en la respuesta del agente.

<Note>
La herramienta solo aparece cuando hay disponible al menos un proveedor de generación de imágenes. Si no ves `image_generate` en las herramientas de tu agente, configura `agents.defaults.imageGenerationModel`, establece una clave de API de proveedor o inicia sesión con OpenAI Codex OAuth.
</Note>

## Inicio rápido

1. Establece una clave de API para al menos un proveedor (por ejemplo `OPENAI_API_KEY`, `GEMINI_API_KEY` o `OPENROUTER_API_KEY`) o inicia sesión con OpenAI Codex OAuth.
2. Opcionalmente, establece tu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth usa la misma referencia de modelo `openai/gpt-image-2`. Cuando hay configurado un perfil OAuth
`openai-codex`, OpenClaw enruta las solicitudes de imagen
a través de ese mismo perfil OAuth en lugar de probar primero `OPENAI_API_KEY`.
La configuración explícita de imágenes personalizada de `models.providers.openai`, como una clave de API o
una URL base personalizada/Azure, vuelve a activar la ruta directa a la API OpenAI Images.
Para endpoints LAN compatibles con OpenAI como LocalAI, mantén
`models.providers.openai.baseUrl` personalizado y activa explícitamente
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; los endpoints de imagen privados/internos siguen bloqueados de forma predeterminada.

3. Pide al agente: _"Generate an image of a friendly robot mascot."_

El agente llama automáticamente a `image_generate`. No hace falta lista de permitidos de herramientas: está habilitada de forma predeterminada cuando hay un proveedor disponible.

## Proveedores compatibles

| Proveedor  | Modelo predeterminado                    | Compatibilidad de edición             | Autenticación                                           |
| ---------- | ---------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| OpenAI     | `gpt-image-2`                            | Sí (hasta 4 imágenes)                 | `OPENAI_API_KEY` u OpenAI Codex OAuth                   |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | Sí (hasta 5 imágenes de entrada)      | `OPENROUTER_API_KEY`                                    |
| Google     | `gemini-3.1-flash-image-preview`         | Sí                                    | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                     |
| fal        | `fal-ai/flux/dev`                        | Sí                                    | `FAL_KEY`                                               |
| MiniMax    | `image-01`                               | Sí (referencia del sujeto)            | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`)    |
| ComfyUI    | `workflow`                               | Sí (1 imagen, configurado por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para la nube |
| Vydra      | `grok-imagine`                           | No                                    | `VYDRA_API_KEY`                                         |
| xAI        | `grok-imagine-image`                     | Sí (hasta 5 imágenes)                 | `XAI_API_KEY`                                           |

Usa `action: "list"` para inspeccionar proveedores y modelos disponibles en tiempo de ejecución:

```text
/tool image_generate action=list
```

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
Prompt de generación de imagen. Obligatorio para `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Usa `"list"` para inspeccionar proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>

<ParamField path="model" type="string">
Anulación de proveedor/modelo, por ejemplo `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Ruta o URL de una única imagen de referencia para el modo de edición.
</ParamField>

<ParamField path="images" type="string[]">
Varias imágenes de referencia para el modo de edición (hasta 5).
</ParamField>

<ParamField path="size" type="string">
Indicación de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Indicación de resolución.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Indicación de calidad cuando el proveedor la admite.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Indicación de formato de salida cuando el proveedor la admite.
</ParamField>

<ParamField path="count" type="number">
Número de imágenes a generar (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Tiempo de espera opcional de la solicitud al proveedor en milisegundos.
</ParamField>

<ParamField path="filename" type="string">
Indicación del nombre del archivo de salida.
</ParamField>

<ParamField path="openai" type="object">
Indicaciones exclusivas de OpenAI: `background`, `moderation`, `outputCompression` y `user`.
</ParamField>

No todos los proveedores admiten todos los parámetros. Cuando un proveedor alternativo admite una opción geométrica cercana en lugar de la solicitada exactamente, OpenClaw reasigna al tamaño, relación de aspecto o resolución compatible más próximo antes de enviar la solicitud. Las indicaciones de salida no compatibles como `quality` u `outputFormat` se descartan para proveedores que no declaran compatibilidad y se informan en el resultado de la herramienta.

Los resultados de la herramienta informan de la configuración aplicada. Cuando OpenClaw reasigna geometría durante la conmutación por error del proveedor, los valores devueltos de `size`, `aspectRatio` y `resolution` reflejan lo que realmente se envió, y `details.normalization` captura la traducción de lo solicitado a lo aplicado.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
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

### Orden de selección de proveedor

Al generar una imagen, OpenClaw prueba los proveedores en este orden:

1. **Parámetro `model`** de la llamada a la herramienta (si el agente especifica uno)
2. **`imageGenerationModel.primary`** de la configuración
3. **`imageGenerationModel.fallbacks`** en orden
4. **Detección automática** — usa solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los proveedores restantes registrados de generación de imágenes en orden por id de proveedor

Si un proveedor falla (error de autenticación, límite de velocidad, etc.), se prueba automáticamente el siguiente candidato. Si todos fallan, el error incluye detalles de cada intento.

Notas:

- La detección automática tiene en cuenta la autenticación. Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw puede autenticar realmente a ese proveedor.
- La detección automática está habilitada de forma predeterminada. Establece
  `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la generación de imágenes use solo las entradas explícitas `model`, `primary` y `fallbacks`.
- Usa `action: "list"` para inspeccionar los proveedores registrados actualmente, sus modelos predeterminados y las sugerencias de variables de entorno de autenticación.

### Edición de imágenes

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI y xAI admiten edición de imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google y xAI admiten hasta 5 imágenes de referencia mediante el parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

### Modelos de imagen de OpenRouter

La generación de imágenes con OpenRouter usa la misma `OPENROUTER_API_KEY` y se enruta mediante la API de imágenes de chat completions de OpenRouter. Selecciona modelos de imagen de OpenRouter con el prefijo `openrouter/`:

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

OpenClaw reenvía `prompt`, `count`, imágenes de referencia e indicaciones compatibles con Gemini de `aspectRatio` / `resolution` a OpenRouter. Los accesos directos actuales integrados a modelos de imagen de OpenRouter incluyen `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`; usa `action: "list"` para ver lo que expone tu plugin configurado.

### OpenAI `gpt-image-2`

La generación de imágenes de OpenAI usa por defecto `openai/gpt-image-2`. Si hay configurado un perfil OAuth
`openai-codex`, OpenClaw reutiliza el mismo perfil OAuth
usado por los modelos de chat de suscripción de Codex y envía la solicitud de imagen
a través del backend de Codex Responses; no recurre silenciosamente a
`OPENAI_API_KEY` para esa solicitud. Para forzar el enrutamiento directo a la API OpenAI Images,
configura `models.providers.openai` explícitamente con una clave de API, una URL base personalizada
o un endpoint de Azure. El modelo antiguo
`openai/gpt-image-1` todavía puede seleccionarse explícitamente, pero las nuevas solicitudes de
generación y edición de imágenes de OpenAI deberían usar `gpt-image-2`.

`gpt-image-2` admite tanto generación de texto a imagen como edición con imágenes
de referencia mediante la misma herramienta `image_generate`. OpenClaw reenvía `prompt`,
`count`, `size`, `quality`, `outputFormat` e imágenes de referencia a OpenAI.
OpenAI no recibe `aspectRatio` ni `resolution` directamente; cuando es posible,
OpenClaw los asigna a un `size` compatible; en caso contrario, la herramienta los informa como
anulaciones ignoradas.

Las opciones específicas de OpenAI están dentro del objeto `openai`:

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

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Generar dos imágenes cuadradas:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Editar una imagen local de referencia:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Editar con varias referencias:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para enrutar la generación de imágenes de OpenAI mediante un despliegue Azure OpenAI
en lugar de `api.openai.com`, consulta [Endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints)
en la documentación del proveedor OpenAI.

La generación de imágenes de MiniMax está disponible mediante ambas rutas de autenticación incluidas de MiniMax:

- `minimax/image-01` para configuraciones con clave de API
- `minimax-portal/image-01` para configuraciones OAuth

## Capacidades del proveedor

| Capacidad              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| ---------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generar                | Sí (hasta 4)         | Sí (hasta 4)         | Sí (hasta 4)        | Sí (hasta 9)               | Sí (salidas definidas por workflow) | Sí (1)  | Sí (hasta 4)         |
| Editar/referencia      | Sí (hasta 5 imágenes) | Sí (hasta 5 imágenes) | Sí (1 imagen)      | Sí (1 imagen, referencia del sujeto) | Sí (1 imagen, configurado por workflow) | No      | Sí (hasta 5 imágenes) |
| Control de tamaño      | Sí (hasta 4K)        | Sí                   | Sí                  | No                         | No                                 | No      | No                   |
| Relación de aspecto    | No                   | Sí                   | Sí (solo generar)   | Sí                         | No                                 | No      | Sí                   |
| Resolución (1K/2K/4K)  | No                   | Sí                   | Sí                  | No                         | No                                 | No      | Sí (1K/2K)           |

### xAI `grok-imagine-image`

El proveedor integrado de xAI usa `/v1/images/generations` para solicitudes
solo con prompt y `/v1/images/edits` cuando está presente `image` o `images`.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Cantidad: hasta 4
- Referencias: una `image` o hasta cinco `images`
- Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluciones: `1K`, `2K`
- Salidas: devueltas como archivos adjuntos de imagen gestionados por OpenClaw

OpenClaw no expone intencionadamente `quality`, `mask`, `user` nativos de xAI ni
relaciones de aspecto adicionales exclusivas nativas hasta que esos controles existan en el
contrato compartido entre proveedores de `image_generate`.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [fal](/es/providers/fal) — configuración del proveedor de imágenes y vídeo de fal
- [ComfyUI](/es/providers/comfy) — configuración de workflows locales de ComfyUI y de Comfy Cloud
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes de MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) — configuración de imágenes, vídeo y voz en Vydra
- [xAI](/es/providers/xai) — configuración de imágenes, vídeo, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) — configuración de modelos y conmutación por error
