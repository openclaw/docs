---
read_when:
    - Cambio del renderizado de la salida del asistente en la UI de Control
    - Depuración de las directivas de presentación `[embed ...]`, `MEDIA:`, reply o audio
summary: Protocolo de shortcodes de salida enriquecida para incrustaciones, medios, sugerencias de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-04-25T18:21:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/renderizado:

- `MEDIA:` para la entrega de adjuntos
- `[[audio_as_voice]]` para sugerencias de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para el renderizado enriquecido en la UI de Control

Estas directivas son independientes. `MEDIA:` y las etiquetas de respuesta/voz siguen siendo metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido solo para web.
Los medios de resultados de herramientas de confianza usan el mismo analizador `MEDIA:` / `[[audio_as_voice]]` antes de la entrega, por lo que las salidas de herramientas de texto aún pueden marcar un adjunto de audio como una nota de voz.

Cuando el streaming por bloques está habilitado, `MEDIA:` sigue siendo metadato de entrega única para un
turno. Si la misma URL de medio se envía en un bloque en streaming y se repite en la carga final
del asistente, OpenClaw entrega el adjunto una sola vez y elimina el duplicado
de la carga final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para la UI de Control.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salidas nuevas.
- Los shortcodes de incrustación se renderizan solo en la superficie de mensajes del asistente.
- Solo se renderizan incrustaciones respaldadas por URL. Usa `ref="..."` o `url="..."`.
- No se renderizan shortcodes de incrustación con HTML inline en formato de bloque.
- La UI web elimina el shortcode del texto visible y renderiza la incrustación en línea.
- `MEDIA:` no es un alias de incrustación y no debe usarse para el renderizado de incrustaciones enriquecidas.

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

Los bloques enriquecidos almacenados/renderizados usan directamente esta forma `canvas`. `present_view` no se reconoce.

## Relacionado

- [Adaptadores RPC](/es/reference/rpc)
- [Typebox](/es/concepts/typebox)
