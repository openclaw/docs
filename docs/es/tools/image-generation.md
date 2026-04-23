---
read_when:
    - Generar imágenes mediante el agente
    - Configurar proveedores y modelos de generación de imágenes
    - Entender los parámetros de la herramienta `image_generate`
summary: Generar y editar imágenes usando proveedores configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-23T05:20:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# Generación de imágenes

La herramienta `image_generate` permite que el agente cree y edite imágenes usando tus proveedores configurados. Las imágenes generadas se entregan automáticamente como archivos multimedia adjuntos en la respuesta del agente.

<Note>
La herramienta solo aparece cuando hay al menos un proveedor de generación de imágenes disponible. Si no ves `image_generate` en las herramientas de tu agente, configura `agents.defaults.imageGenerationModel` o establece una clave API de proveedor.
</Note>

## Inicio rápido

1. Establece una clave API para al menos un proveedor (por ejemplo `OPENAI_API_KEY` o `GEMINI_API_KEY`).
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

3. Pídele al agente: _"Genera una imagen de una mascota de langosta amigable."_

El agente llama a `image_generate` automáticamente. No hace falta una lista de permitidos de herramientas: está habilitada de forma predeterminada cuando hay un proveedor disponible.

## Proveedores compatibles

| Proveedor | Modelo predeterminado                    | Compatibilidad con edición                       | Clave API                                               |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | Sí (hasta 5 imágenes)               | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Sí                                | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Sí                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | Sí (referencia de sujeto)            | `MINIMAX_API_KEY` o OAuth de MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Sí (1 imagen, configurada por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para la nube    |
| Vydra    | `grok-imagine`                   | No                                 | `VYDRA_API_KEY`                                       |
| xAI      | `grok-imagine-image`             | Sí (hasta 5 imágenes)               | `XAI_API_KEY`                                         |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```
/tool image_generate action=list
```

## Parámetros de la herramienta

| Parámetro     | Tipo     | Descripción                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt de generación de imagen (obligatorio para `action: "generate"`)                           |
| `action`      | string   | `"generate"` (predeterminado) o `"list"` para inspeccionar proveedores                               |
| `model`       | string   | Anulación de proveedor/modelo, por ejemplo `openai/gpt-image-2`                                    |
| `image`       | string   | Ruta o URL de una sola imagen de referencia para modo de edición                                      |
| `images`      | string[] | Varias imágenes de referencia para modo de edición (hasta 5)                                     |
| `size`        | string   | Sugerencia de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`            |
| `aspectRatio` | string   | Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Sugerencia de resolución: `1K`, `2K` o `4K`                                                  |
| `count`       | number   | Número de imágenes a generar (1–4)                                                    |
| `filename`    | string   | Sugerencia de nombre de archivo de salida                                                                  |

No todos los proveedores admiten todos los parámetros. Cuando un proveedor alternativo admite una opción de geometría cercana en lugar de la solicitada exactamente, OpenClaw la reasigna al tamaño, relación de aspecto o resolución compatible más cercano antes del envío. Las anulaciones realmente no compatibles siguen informándose en el resultado de la herramienta.

Los resultados de la herramienta informan la configuración aplicada. Cuando OpenClaw reasigna la geometría durante la alternativa de proveedor, los valores devueltos de `size`, `aspectRatio` y `resolution` reflejan lo que realmente se envió, y `details.normalization` captura la traducción de lo solicitado a lo aplicado.

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

### Orden de selección de proveedor

Al generar una imagen, OpenClaw prueba los proveedores en este orden:

1. Parámetro **`model`** de la llamada a la herramienta (si el agente especifica uno)
2. **`imageGenerationModel.primary`** de la configuración
3. **`imageGenerationModel.fallbacks`** en orden
4. **Detección automática**: usa solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los demás proveedores registrados de generación de imágenes en orden por ID de proveedor

Si un proveedor falla (error de autenticación, límite de velocidad, etc.), se prueba automáticamente el siguiente candidato. Si todos fallan, el error incluye detalles de cada intento.

Notas:

- La detección automática reconoce la autenticación. Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw realmente puede autenticar ese proveedor.
- La detección automática está habilitada de forma predeterminada. Establece
  `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la
  generación de imágenes use solo las entradas explícitas `model`, `primary` y `fallbacks`.
- Usa `action: "list"` para inspeccionar los proveedores registrados actualmente, sus
  modelos predeterminados y las sugerencias de variables de entorno de autenticación.

### Edición de imágenes

OpenAI, Google, fal, MiniMax, ComfyUI y xAI admiten la edición de imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI, Google y xAI admiten hasta 5 imágenes de referencia mediante el parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

### OpenAI `gpt-image-2`

La generación de imágenes de OpenAI usa de forma predeterminada `openai/gpt-image-2`. El modelo anterior
`openai/gpt-image-1` todavía puede seleccionarse explícitamente, pero las nuevas solicitudes de generación
y edición de imágenes de OpenAI deben usar `gpt-image-2`.

`gpt-image-2` admite tanto generación de imagen a partir de texto como edición de
imágenes de referencia a través de la misma herramienta `image_generate`. OpenClaw reenvía `prompt`,
`count`, `size` e imágenes de referencia a OpenAI. OpenAI no recibe
`aspectRatio` ni `resolution` directamente; cuando es posible, OpenClaw los convierte en un
`size` compatible; de lo contrario, la herramienta los informa como anulaciones ignoradas.

Genera una imagen horizontal 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Un póster editorial limpio para la generación de imágenes de OpenClaw" size=3840x2160 count=1
```

Genera dos imágenes cuadradas:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Dos direcciones visuales para el icono de una app de productividad tranquila" size=1024x1024 count=2
```

Edita una imagen de referencia local:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantén el sujeto, reemplaza el fondo con una configuración de estudio luminosa" image=/path/to/reference.png size=1024x1536
```

Edita con varias referencias:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combina la identidad del personaje de la primera imagen con la paleta de colores de la segunda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

La generación de imágenes de MiniMax está disponible a través de ambas rutas de autenticación MiniMax incluidas:

- `minimax/image-01` para configuraciones con clave API
- `minimax-portal/image-01` para configuraciones con OAuth

## Capacidades del proveedor

| Capacidad            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generar              | Sí (hasta 4)        | Sí (hasta 4)        | Sí (hasta 4)       | Sí (hasta 9)              | Sí (salidas definidas por workflow)     | Sí (1) | Sí (hasta 4)        |
| Editar/referencia        | Sí (hasta 5 imágenes) | Sí (hasta 5 imágenes) | Sí (1 imagen)       | Sí (1 imagen, ref. de sujeto) | Sí (1 imagen, configurada por workflow) | No      | Sí (hasta 5 imágenes) |
| Control de tamaño          | Sí (hasta 4K)       | Sí                  | Sí                 | No                         | No                                 | No      | No                   |
| Relación de aspecto          | No                   | Sí                  | Sí (solo generar) | Sí                        | No                                 | No      | Sí                  |
| Resolución (1K/2K/4K) | No                   | Sí                  | Sí                 | No                         | No                                 | No      | Sí (1K/2K)          |

### xAI `grok-imagine-image`

El proveedor xAI incluido usa `/v1/images/generations` para solicitudes solo con prompt
y `/v1/images/edits` cuando `image` o `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Cantidad: hasta 4
- Referencias: una `image` o hasta cinco `images`
- Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluciones: `1K`, `2K`
- Salidas: se devuelven como archivos adjuntos de imagen administrados por OpenClaw

OpenClaw intencionalmente no expone `quality`, `mask`, `user` nativos de xAI ni
relaciones de aspecto extra solo nativas hasta que esos controles existan en el contrato compartido entre proveedores de `image_generate`.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [fal](/es/providers/fal) — configuración del proveedor de imágenes y video de fal
- [ComfyUI](/es/providers/comfy) — configuración de workflow local de ComfyUI y Comfy Cloud
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) — configuración de imágenes, video y voz de Vydra
- [xAI](/es/providers/xai) — configuración de imagen, video, búsqueda, ejecución de código y TTS de Grok
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) — configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) — configuración de modelos y conmutación por error
