---
read_when:
    - Cambiar la representación de la salida del asistente en la UI de Control
    - Depuración de directivas de presentación de `[embed ...]`, medios estructurados, respuesta o audio
summary: Protocolo de salida enriquecida para medios estructurados, incrustaciones, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-07-05T11:40:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La salida del asistente transporta directivas de entrega/renderización mediante algunos canales dedicados:

- Campos estructurados `mediaUrl` / `mediaUrls` para la entrega de archivos adjuntos.
- `[[audio_as_voice]]` para indicaciones de presentación de audio.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta.
- `[embed ...]` para renderización enriquecida en la Control UI.

Los campos de medios estructurados y las etiquetas `[[...]]` son metadatos de entrega. `[embed ...]` es la ruta separada de renderización enriquecida solo para la web; no es un alias de medios.

## Archivos adjuntos multimedia

Los archivos adjuntos remotos deben ser URL públicas `https:`. `http:`, loopback, link-local, nombres de host privados e internos se rechazan como directivas de adjuntos; los recuperadores de medios del lado del servidor aplican sus propias protecciones de red además de esto.

Los archivos adjuntos locales aceptan rutas absolutas, rutas relativas al espacio de trabajo o rutas relativas al inicio `~/`. Aun así, pasan por la política de lectura de archivos del agente y las comprobaciones de tipo de medio antes de la entrega.

<Warning>
No emitas comandos de texto para archivos adjuntos desde herramientas, plugins, bloques de streaming, salida del navegador o acciones de mensaje. Usa campos de medios estructurados en su lugar:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

El texto heredado de respuesta final aún puede normalizarse por compatibilidad, pero esto no es un protocolo general de plugin/herramienta.
</Warning>

La sintaxis simple de imagen de Markdown (`![alt](url)`) permanece como texto de forma predeterminada. Los canales que quieren que las imágenes de Markdown se traten como respuestas multimedia optan por ello en su adaptador de salida; Telegram hace esto para que `![alt](url)` se convierta en un archivo adjunto multimedia.

Cuando el streaming de bloques está habilitado, los medios deben viajar en campos de carga útil estructurados. Si la misma URL de medios aparece en un bloque transmitido y de nuevo en la carga útil final del asistente, OpenClaw la entrega una vez y elimina el duplicado de la carga útil final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderización enriquecida orientada al agente para la Control UI. Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salidas nuevas.
- Los shortcodes de incrustación solo se renderizan en la superficie de mensajes del asistente.
- Solo se renderizan incrustaciones respaldadas por URL; usa `ref="..."` o `url="..."`.
- Los shortcodes de incrustación HTML en línea con forma de bloque no se renderizan.
- La interfaz web elimina el shortcode del texto visible y renderiza la incrustación en línea.

## Forma de renderización almacenada

El bloque de contenido del asistente normalizado/almacenado es un elemento estructurado `canvas`:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

`present_view` no se reconoce; los bloques enriquecidos almacenados/renderizados siempre usan esta forma `canvas`.

## Relacionado

- [Adaptadores RPC](/es/reference/rpc)
- [Typebox](/es/concepts/typebox)
