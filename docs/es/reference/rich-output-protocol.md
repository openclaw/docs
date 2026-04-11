---
x-i18n:
    generated_at: "2026-04-11T15:15:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a8884fc2c304bf96d4675f0c1d1ff781d6dc1ae8c49d92ce08040c9c7709035
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protocolo de salida enriquecida

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/renderizado:

- `MEDIA:` para la entrega de archivos adjuntos
- `[[audio_as_voice]]` para sugerencias de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para el renderizado enriquecido de la UI de Control

Estas directivas son independientes. `MEDIA:` y las etiquetas de respuesta/voz siguen siendo metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido solo para la web.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada a agentes para la UI de Control.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Estado" /]
```

Reglas:

- `[view ...]` ya no es válido para nuevas salidas.
- Los shortcodes de embed se renderizan solo en la superficie de mensajes del asistente.
- Solo se renderizan los embeds respaldados por URL. Usa `ref="..."` o `url="..."`.
- Los shortcodes de embed en HTML inline con formato de bloque no se renderizan.
- La UI web elimina el shortcode del texto visible y renderiza el embed en línea.
- `MEDIA:` no es un alias de embed y no debe usarse para el renderizado de embeds enriquecidos.

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
