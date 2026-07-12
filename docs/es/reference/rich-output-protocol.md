---
read_when:
    - Cambio de la representación de las respuestas del asistente en la interfaz de control
    - Depuración de las directivas de presentación de `[embed ...]`, contenido multimedia estructurado, respuestas o audio
summary: Protocolo de salida enriquecida para contenido multimedia estructurado, elementos incrustados, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-07-11T23:29:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La salida del asistente transmite directivas de entrega y renderizado mediante varios canales específicos:

- Campos estructurados `mediaUrl` / `mediaUrls` para entregar archivos adjuntos.
- `[[audio_as_voice]]` para indicar cómo presentar el audio.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para los metadatos de respuesta.
- `[embed ...]` para el renderizado enriquecido en la interfaz de control.

Los campos estructurados de contenido multimedia y las etiquetas `[[...]]` son metadatos de entrega. `[embed ...]` es la vía independiente de renderizado enriquecido exclusiva de la web; no es un alias de contenido multimedia.

## Archivos multimedia adjuntos

Los archivos adjuntos remotos deben usar URL `https:` públicas. Las URL `http:`, de local loopback, locales de enlace o privadas, y los nombres de host internos, se rechazan como directivas de archivos adjuntos; además, los sistemas de obtención de contenido multimedia del servidor aplican sus propias medidas de protección de red.

Los archivos adjuntos locales aceptan rutas absolutas, rutas relativas al espacio de trabajo o rutas `~/` relativas al directorio personal. Antes de la entrega, siguen sujetos a la política de lectura de archivos del agente y a las comprobaciones del tipo de contenido multimedia.

<Warning>
No emita comandos de texto para archivos adjuntos desde herramientas, plugins, bloques de transmisión, la salida del navegador ni acciones de mensajes. Utilice en su lugar campos estructurados de contenido multimedia:

```json
{ "message": "Aquí está su imagen.", "mediaUrl": "/workspace/image.png" }
```

El texto heredado de la respuesta final aún puede normalizarse por compatibilidad, pero esto no constituye un protocolo general para plugins o herramientas.
</Warning>

La sintaxis de imagen de Markdown sin formato (`![alt](url)`) permanece como texto de forma predeterminada. Los canales que quieran tratar las imágenes de Markdown como respuestas multimedia deben habilitarlo en su adaptador de salida; Telegram lo hace, por lo que `![alt](url)` se convierte en un archivo multimedia adjunto.

Cuando la transmisión por bloques está habilitada, el contenido multimedia debe enviarse en campos estructurados de la carga útil. Si la misma URL de contenido multimedia aparece en un bloque transmitido y de nuevo en la carga útil final del asistente, OpenClaw la entrega una sola vez y elimina el duplicado de la carga útil final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para la interfaz de control. Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para las nuevas salidas.
- Los códigos cortos de inserción solo se renderizan en la superficie de mensajes del asistente.
- Solo se renderizan las inserciones respaldadas por una URL; use `ref="..."` o `url="..."`.
- Los códigos cortos de inserción HTML en línea con formato de bloque no se renderizan.
- La interfaz web elimina el código corto del texto visible y renderiza la inserción en línea.

## Estructura de renderizado almacenada

El bloque de contenido normalizado y almacenado del asistente es un elemento estructurado `canvas`:

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

`present_view` no se reconoce; los bloques enriquecidos almacenados y renderizados siempre utilizan esta estructura `canvas`.

## Contenido relacionado

- [Adaptadores RPC](/es/reference/rpc)
- [Typebox](/es/concepts/typebox)
