---
read_when:
    - Cambiar el renderizado de la salida del asistente en la interfaz de usuario de Control
    - Depuración de las directivas de presentación de `[embed ...]`, `MEDIA:`, reply o audio
summary: Protocolo de shortcodes de salida enriquecida para incrustaciones, multimedia, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-04-26T11:37:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/renderizado:

- `MEDIA:` para la entrega de adjuntos
- `[[audio_as_voice]]` para indicaciones de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para renderizado enriquecido en la interfaz de usuario de Control

Los adjuntos remotos `MEDIA:` deben ser URL públicas `https:`. Las URL `http:` simples,
de loopback, link-local, redes privadas y nombres de host internos se ignoran como directivas
de adjuntos; los recuperadores multimedia del lado del servidor siguen aplicando sus propias protecciones de red.

Estas directivas son independientes. `MEDIA:` y las etiquetas de respuesta/voz siguen siendo metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido solo para la web.
Los elementos multimedia de resultados de herramientas confiables usan el mismo analizador `MEDIA:` / `[[audio_as_voice]]` antes de la entrega, por lo que las salidas de texto de herramientas aún pueden marcar un adjunto de audio como una nota de voz.

Cuando el streaming por bloques está habilitado, `MEDIA:` sigue siendo metadato de entrega única para un
turno. Si la misma URL multimedia se envía en un bloque transmitido y se repite en la carga útil final
del asistente, OpenClaw entrega el adjunto una vez y elimina el duplicado
de la carga útil final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para la interfaz de usuario de Control.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salida nueva.
- Los shortcodes de incrustación se renderizan solo en la superficie de mensajes del asistente.
- Solo se renderizan incrustaciones respaldadas por URL. Usa `ref="..."` o `url="..."`.
- Los shortcodes de incrustación con HTML inline en formato de bloque no se renderizan.
- La interfaz web elimina el shortcode del texto visible y renderiza la incrustación en línea.
- `MEDIA:` no es un alias de incrustación y no debe usarse para renderizado enriquecido de incrustaciones.

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
