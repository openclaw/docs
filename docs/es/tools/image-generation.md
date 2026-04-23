---
read_when:
    - Generar imágenes mediante el agente
    - Configurar proveedores y modelos de generación de imágenes
    - Entender los parámetros de la herramienta `image_generate`
summary: Generar y editar imágenes usando los proveedores configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-23T14:08:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# Generación de imágenes

La herramienta `image_generate` permite que el agente cree y edite imágenes usando tus proveedores configurados. Las imágenes generadas se entregan automáticamente como adjuntos multimedia en la respuesta del agente.

<Note>
La herramienta solo aparece cuando al menos un proveedor de generación de imágenes está disponible. Si no ves `image_generate` en las herramientas de tu agente, configura `agents.defaults.imageGenerationModel` o establece una clave API de proveedor.
</Note>

## Inicio rápido

1. Establece una clave API para al menos un proveedor (por ejemplo `OPENAI_API_KEY` o `GEMINI_API_KEY`).
2. Opcionalmente establece tu modelo preferido:

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

3. Pídele al agente: _"Genera una imagen de una mascota langosta amigable."_

El agente llama automáticamente a `image_generate`. No hace falta lista de permitidos de herramientas: está habilitada por defecto cuando hay un proveedor disponible.

## Proveedores compatibles

| Proveedor | Modelo predeterminado           | Soporte de edición                 | Clave API                                              |
| --------- | ------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI    | `gpt-image-2`                   | Sí (hasta 5 imágenes)              | `OPENAI_API_KEY`                                       |
| Google    | `gemini-3.1-flash-image-preview`| Sí                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal       | `fal-ai/flux/dev`               | Sí                                 | `FAL_KEY`                                              |
| MiniMax   | `image-01`                      | Sí (referencia de sujeto)          | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`)   |
| ComfyUI   | `workflow`                      | Sí (1 imagen, configurada por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para cloud |
| Vydra     | `grok-imagine`                  | No                                 | `VYDRA_API_KEY`                                        |
| xAI       | `grok-imagine-image`            | Sí (hasta 5 imágenes)              | `XAI_API_KEY`                                          |

Usa `action: "list"` para inspeccionar en runtime los proveedores y modelos disponibles:

```
/tool image_generate action=list
```

## Parámetros de la herramienta

| Parámetro     | Tipo     | Descripción                                                                          |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt de generación de imagen (obligatorio para `action: "generate"`)              |
| `action`      | string   | `"generate"` (predeterminado) o `"list"` para inspeccionar proveedores              |
| `model`       | string   | Anulación de proveedor/modelo, p. ej. `openai/gpt-image-2`                          |
| `image`       | string   | Ruta o URL de una única imagen de referencia para modo edición                      |
| `images`      | string[] | Varias imágenes de referencia para modo edición (hasta 5)                           |
| `size`        | string   | Sugerencia de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string   | Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Sugerencia de resolución: `1K`, `2K` o `4K`                                         |
| `count`       | number   | Número de imágenes a generar (1–4)                                                  |
| `filename`    | string   | Sugerencia de nombre de archivo de salida                                           |

No todos los proveedores admiten todos los parámetros. Cuando un proveedor de fallback admite una opción geométrica cercana en lugar de la solicitada exacta, OpenClaw remapea al tamaño, relación de aspecto o resolución compatible más cercano antes del envío. Las anulaciones realmente no compatibles siguen informándose en el resultado de la herramienta.

Los resultados de la herramienta informan los ajustes aplicados. Cuando OpenClaw remapea la geometría durante el fallback de proveedor, los valores devueltos `size`, `aspectRatio` y `resolution` reflejan lo que realmente se envió, y `details.normalization` captura la traducción entre lo solicitado y lo aplicado.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Orden de selección de proveedores

Al generar una imagen, OpenClaw prueba los proveedores en este orden:

1. **Parámetro `model`** de la llamada a la herramienta (si el agente especifica uno)
2. **`imageGenerationModel.primary`** de la configuración
3. **`imageGenerationModel.fallbacks`** en orden
4. **Detección automática** — usa solo valores predeterminados de proveedor respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los proveedores restantes de generación de imágenes registrados en orden de id de proveedor

Si un proveedor falla (error de autenticación, límite de tasa, etc.), se prueba automáticamente el siguiente candidato. Si todos fallan, el error incluye detalles de cada intento.

Notas:

- La detección automática tiene en cuenta la autenticación. Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw puede autenticar realmente ese proveedor.
- La detección automática está habilitada por defecto. Establece `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la generación de imágenes use solo las entradas explícitas `model`, `primary` y `fallbacks`.
- Usa `action: "list"` para inspeccionar los proveedores registrados actualmente, sus modelos predeterminados y las sugerencias de variables de entorno de autenticación.

### Edición de imágenes

OpenAI, Google, fal, MiniMax, ComfyUI y xAI admiten edición de imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI, Google y xAI admiten hasta 5 imágenes de referencia mediante el parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

### OpenAI `gpt-image-2`

La generación de imágenes de OpenAI usa por defecto `openai/gpt-image-2`. El modelo más antiguo `openai/gpt-image-1` todavía puede seleccionarse explícitamente, pero las nuevas solicitudes de generación y edición de imágenes de OpenAI deberían usar `gpt-image-2`.

`gpt-image-2` admite tanto generación de texto a imagen como edición de imágenes de referencia mediante la misma herramienta `image_generate`. OpenClaw reenvía `prompt`, `count`, `size` e imágenes de referencia a OpenAI. OpenAI no recibe directamente `aspectRatio` ni `resolution`; cuando es posible, OpenClaw los asigna a un `size` compatible; en caso contrario, la herramienta los informa como anulaciones ignoradas.

Genera una imagen apaisada 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Genera dos imágenes cuadradas:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Edita una imagen de referencia local:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Edita con varias referencias:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para enrutar la generación de imágenes de OpenAI a través de un despliegue Azure OpenAI en lugar de `api.openai.com`, consulta [Endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints) en la documentación del proveedor OpenAI.

La generación de imágenes de MiniMax está disponible mediante ambas rutas de autenticación incluidas de MiniMax:

- `minimax/image-01` para configuraciones con clave API
- `minimax-portal/image-01` para configuraciones con OAuth

## Capacidades del proveedor

| Capacidad              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| ---------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generar                | Sí (hasta 4)         | Sí (hasta 4)         | Sí (hasta 4)        | Sí (hasta 9)               | Sí (salidas definidas por workflow) | Sí (1) | Sí (hasta 4)         |
| Editar/referencia      | Sí (hasta 5 imágenes)| Sí (hasta 5 imágenes)| Sí (1 imagen)       | Sí (1 imagen, ref. de sujeto) | Sí (1 imagen, configurada por workflow) | No | Sí (hasta 5 imágenes) |
| Control de tamaño      | Sí (hasta 4K)        | Sí                   | Sí                  | No                         | No                                 | No      | No                   |
| Relación de aspecto    | No                   | Sí                   | Sí (solo generar)   | Sí                         | No                                 | No      | Sí                   |
| Resolución (1K/2K/4K)  | No                   | Sí                   | Sí                  | No                         | No                                 | No      | Sí (1K/2K)           |

### xAI `grok-imagine-image`

El proveedor xAI incluido usa `/v1/images/generations` para solicitudes solo con prompt y `/v1/images/edits` cuando `image` o `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Cantidad: hasta 4
- Referencias: una `image` o hasta cinco `images`
- Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluciones: `1K`, `2K`
- Salidas: se devuelven como adjuntos de imagen gestionados por OpenClaw

OpenClaw intencionadamente no expone `quality`, `mask`, `user` nativos de xAI ni relaciones de aspecto adicionales solo nativas hasta que esos controles existan en el contrato compartido multiproveedor de `image_generate`.

## Relacionado

- [Descripción general de herramientas](/es/tools) — todas las herramientas disponibles del agente
- [fal](/es/providers/fal) — configuración del proveedor de imagen y vídeo fal
- [ComfyUI](/es/providers/comfy) — configuración de workflow local de ComfyUI y Comfy Cloud
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) — configuración de imagen, vídeo y voz de Vydra
- [xAI](/es/providers/xai) — configuración de imagen, vídeo, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) — configuración `imageGenerationModel`
- [Models](/es/concepts/models) — configuración de modelos y failover
