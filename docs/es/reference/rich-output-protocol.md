---
read_when:
    - Cambiar la representación de la salida del asistente en la interfaz de control
    - Depuración de directivas de presentación de `[embed ...]`, `MEDIA:`, respuesta o audio
summary: Protocolo de códigos cortos de salida enriquecida para contenido incrustado, medios, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-05-02T22:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/renderizado:

- `MEDIA:` para la entrega de adjuntos
- `[[audio_as_voice]]` para indicaciones de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para el renderizado enriquecido de Control UI

Los adjuntos `MEDIA:` remotos deben ser URL públicas `https:`. Las URL `http:` sin formato,
loopback, link-local, privadas y los nombres de host internos se ignoran como directivas de
adjunto; los recuperadores de medios del lado del servidor siguen aplicando sus propias protecciones de red.

Los adjuntos `MEDIA:` locales pueden usar rutas absolutas, rutas relativas al espacio de trabajo o
rutas relativas al directorio de inicio `~/`. Aun así, pasan por la política de lectura de archivos del agente y
las comprobaciones de tipo de medio antes de la entrega.

La sintaxis de imagen de Markdown sin formato permanece como texto de forma predeterminada. Los canales que intencionalmente
asignan respuestas de imagen Markdown a adjuntos multimedia optan por ello en su adaptador
de salida; Telegram hace esto para que `![alt](url)` aún pueda convertirse en una respuesta multimedia.

Estas directivas son independientes. `MEDIA:` y las etiquetas de respuesta/voz siguen siendo metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido solo para la web.
Los medios de resultados de herramienta de confianza usan el mismo analizador `MEDIA:` / `[[audio_as_voice]]` antes de la entrega, por lo que las salidas de herramienta de texto aún pueden marcar un adjunto de audio como una nota de voz.

Cuando la transmisión por bloques está habilitada, `MEDIA:` sigue siendo metadatos de entrega única para un
turno. Si la misma URL multimedia se envía en un bloque transmitido y se repite en la carga útil final
del asistente, OpenClaw entrega el adjunto una vez y elimina el duplicado
de la carga útil final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para Control UI.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salidas nuevas.
- Los shortcodes de inserción se renderizan solo en la superficie de mensajes del asistente.
- Solo se renderizan inserciones respaldadas por URL. Usa `ref="..."` o `url="..."`.
- Los shortcodes de inserción HTML en línea en forma de bloque no se renderizan.
- La interfaz de usuario web elimina el shortcode del texto visible y renderiza la inserción en línea.
- `MEDIA:` no es un alias de inserción y no debe usarse para el renderizado enriquecido de inserciones.

## Forma de renderizado almacenada

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

Los bloques enriquecidos almacenados/renderizados usan esta forma `canvas` directamente. `present_view` no se reconoce.

## Relacionado

- [Adaptadores RPC](/es/reference/rpc)
- [Typebox](/es/concepts/typebox)
