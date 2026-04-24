---
read_when:
    - Cambiar la representación de la salida del asistente en la UI de control
    - Depurar directivas de `[embed ...]`, `MEDIA:`, respuesta o presentación de audio
summary: Protocolo de códigos cortos de salida enriquecida para incrustaciones, archivos multimedia, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-04-24T05:48:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/representación:

- `MEDIA:` para la entrega de archivos adjuntos
- `[[audio_as_voice]]` para indicaciones de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para representación enriquecida en la UI de control

Estas directivas están separadas. `MEDIA:` y las etiquetas de respuesta/voz siguen siendo metadatos de entrega; `[embed ...]` es la ruta de representación enriquecida solo para web.

## `[embed ...]`

`[embed ...]` es la única sintaxis de representación enriquecida orientada al agente para la UI de control.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salida nueva.
- Los códigos cortos de inserción se representan solo en la superficie de mensajes del asistente.
- Solo se representan inserciones respaldadas por URL. Usa `ref="..."` o `url="..."`.
- Los códigos cortos de inserción HTML en línea en forma de bloque no se representan.
- La UI web elimina el código corto del texto visible y representa la inserción en línea.
- `MEDIA:` no es un alias de inserción y no debe usarse para la representación de inserciones enriquecidas.

## Forma de representación almacenada

El bloque normalizado/almacenado de contenido del asistente es un elemento `canvas` estructurado:

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

Los bloques enriquecidos almacenados/representados usan directamente esta forma `canvas`. `present_view` no se reconoce.

## Relacionado

- [Adaptadores RPC](/es/reference/rpc)
- [TypeBox](/es/concepts/typebox)
