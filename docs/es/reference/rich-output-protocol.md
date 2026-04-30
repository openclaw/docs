---
read_when:
    - Cambiar la representación de la salida del asistente en la interfaz de control
    - Depuración de `[embed ...]`, `MEDIA:`, respuesta o directivas de presentación de audio
summary: Protocolo de códigos cortos de salida enriquecida para incrustaciones, contenido multimedia, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-04-30T06:00:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/renderizado:

- `MEDIA:` para entrega de adjuntos
- `[[audio_as_voice]]` para indicaciones de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para renderizado enriquecido en la interfaz de usuario de Control

Los adjuntos `MEDIA:` remotos deben ser URL públicas `https:`. Las URL `http:` simples,
loopback, link-local, privadas y los nombres de host internos se ignoran como directivas
de adjuntos; los recuperadores de medios del lado del servidor siguen aplicando sus propias protecciones de red.

La sintaxis simple de imágenes de Markdown permanece como texto de forma predeterminada. Los canales que intencionalmente
asignan respuestas de imagen de Markdown a adjuntos de medios lo habilitan en su adaptador
saliente; Telegram hace esto para que `![alt](url)` aún pueda convertirse en una respuesta multimedia.

Estas directivas son independientes. `MEDIA:` y las etiquetas de respuesta/voz permanecen como metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido solo para la web.
Los medios de resultados de herramientas de confianza usan el mismo analizador `MEDIA:` / `[[audio_as_voice]]` antes de la entrega, por lo que las salidas de texto de herramientas aún pueden marcar un adjunto de audio como nota de voz.

Cuando la transmisión por bloques está habilitada, `MEDIA:` permanece como metadatos de entrega única para un
turno. Si la misma URL de medios se envía en un bloque transmitido y se repite en la carga final
del asistente, OpenClaw entrega el adjunto una vez y elimina el duplicado
de la carga final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para la interfaz de usuario de Control.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salidas nuevas.
- Los shortcodes de incrustación se renderizan solo en la superficie de mensajes del asistente.
- Solo se renderizan incrustaciones respaldadas por URL. Usa `ref="..."` o `url="..."`.
- Los shortcodes de incrustación de HTML inline en formato de bloque no se renderizan.
- La interfaz web elimina el shortcode del texto visible y renderiza la incrustación inline.
- `MEDIA:` no es un alias de incrustación y no debe usarse para el renderizado de incrustaciones enriquecidas.

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
