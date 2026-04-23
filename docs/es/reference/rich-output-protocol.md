---
read_when:
    - Cambiar el renderizado de salida del asistente en la UI de Control
    - Depurar directivas de presentación de `[embed ...]`, `MEDIA:`, respuesta o audio
summary: Protocolo de shortcodes de salida enriquecida para embeds, medios, sugerencias de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-04-23T14:08:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protocolo de salida enriquecida

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/renderizado:

- `MEDIA:` para entrega de adjuntos
- `[[audio_as_voice]]` para sugerencias de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para renderizado enriquecido en la UI de Control

Estas directivas son independientes. `MEDIA:` y las etiquetas de respuesta/voz siguen siendo metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido solo para web.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para la UI de Control.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salida nueva.
- Los shortcodes embed se renderizan solo en la superficie de mensajes del asistente.
- Solo se renderizan embeds respaldados por URL. Use `ref="..."` o `url="..."`.
- Los shortcodes embed en HTML inline con formato de bloque no se renderizan.
- La UI web elimina el shortcode del texto visible y renderiza el embed inline.
- `MEDIA:` no es un alias de embed y no debe usarse para renderizado de embed enriquecido.

## Forma de renderizado almacenada

El bloque normalizado/almacenado de contenido del asistente es un elemento estructurado `canvas`:

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
