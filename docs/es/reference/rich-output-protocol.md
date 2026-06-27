---
read_when:
    - Cambiar el renderizado de la salida del asistente en la interfaz de control
    - Depuración de las directivas de presentación `[embed ...]`, de medios estructurados, de respuesta o de audio
summary: Protocolo de salida enriquecida para medios estructurados, incrustaciones, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-06-27T12:54:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La salida del asistente puede llevar un pequeño conjunto de directivas de entrega/renderizado:

- campos estructurados `mediaUrl` / `mediaUrls` para la entrega de archivos adjuntos
- `[[audio_as_voice]]` para indicaciones de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para el renderizado enriquecido de Control UI

Los adjuntos multimedia remotos deben ser URL públicas `https:`. Las URL `http:`
simples, loopback, de enlace local, privadas y los nombres de host internos se ignoran como directivas de adjuntos; los recuperadores de medios del lado del servidor siguen aplicando sus propias protecciones de red.

Los adjuntos multimedia locales pueden usar rutas absolutas, rutas relativas al espacio de trabajo o
rutas relativas al directorio de inicio `~/`. Aun así pasan por la política de lectura de archivos del agente y
las comprobaciones de tipo de medio antes de la entrega.

<Warning>
No emitas comandos de texto para adjuntos desde herramientas, plugins, bloques de streaming,
salida del navegador ni acciones de mensaje. Usa campos de medios estructurados en su lugar.

Carga válida de herramienta de mensaje:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

El texto heredado de la respuesta final del asistente aún puede normalizarse por compatibilidad, pero
no es un protocolo general de plugin/herramienta.
</Warning>

La sintaxis simple de imagen de Markdown permanece como texto de forma predeterminada. Los canales que intencionalmente
mapean respuestas de imagen Markdown a adjuntos multimedia optan por ello en su adaptador
de salida; Telegram hace esto para que `![alt](url)` aún pueda convertirse en una respuesta multimedia.

Estas directivas son independientes. Los campos de medios estructurados y las etiquetas de respuesta/voz son
metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido exclusiva de la web.

Cuando el streaming por bloques está habilitado, los medios deben transportarse en campos de carga
estructurados. Si la misma URL de medio se envía en un bloque transmitido y se repite en la
carga final del asistente, OpenClaw entrega el adjunto una vez y elimina el
duplicado de la carga final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para Control UI.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salidas nuevas.
- Los shortcodes de inserción se renderizan solo en la superficie de mensajes del asistente.
- Solo se renderizan las inserciones respaldadas por URL. Usa `ref="..."` o `url="..."`.
- Los shortcodes de inserción HTML en línea con forma de bloque no se renderizan.
- La interfaz web elimina el shortcode del texto visible y renderiza la inserción en línea.
- Los medios estructurados no son un alias de inserción y no deben usarse para el renderizado de inserciones enriquecidas.

## Forma de renderizado almacenada

El bloque de contenido del asistente normalizado/almacenado es un elemento `canvas` estructurado:

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

Los bloques enriquecidos almacenados/renderizados usan esta forma `canvas` directamente. `present_view` no se reconoce.

## Relacionado

- [adaptadores RPC](/es/reference/rpc)
- [Typebox](/es/concepts/typebox)
