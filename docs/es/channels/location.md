---
read_when:
    - Agregar o modificar el análisis de ubicaciones de canal
    - Usar campos de contexto de ubicación en prompts o herramientas del agente
summary: Análisis de ubicación de canales entrantes (Telegram, WhatsApp, Matrix, LINE) y campos de contexto
title: Análisis de la ubicación del canal
x-i18n:
    generated_at: "2026-07-05T11:02:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3388739af0514238453aefbbf32de9ccdd19240367907a045bfe5e48e95a2ae6
    source_path: channels/location.md
    workflow: 16
---

OpenClaw normaliza las ubicaciones compartidas desde canales de chat en:

- texto conciso de coordenadas añadido al cuerpo entrante, y
- campos estructurados en la carga útil de contexto de respuesta automática. Las etiquetas, direcciones y leyendas/comentarios proporcionados por el canal se representan en el prompt mediante el bloque JSON compartido de metadatos no confiables, no en línea en el cuerpo del usuario.

Compatibilidad actual:

- **LINE** (mensajes de ubicación con título/dirección)
- **Matrix** (`m.location` con `geo_uri`)
- **Telegram** (pines de ubicación + lugares + ubicaciones en vivo)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Formato de texto

Las ubicaciones se representan como líneas amigables sin corchetes. Las coordenadas usan seis decimales; la precisión se redondea a metros enteros:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Lugar con nombre (misma línea; el nombre/dirección van solo al bloque de metadatos):
  - `📍 48.858844, 2.294351 ±12m`
- Uso compartido en vivo:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Si el canal incluye una etiqueta, dirección o leyenda/comentario, se conserva en la carga útil de contexto y aparece en el prompt como JSON no confiable delimitado (los campos se omiten cuando están ausentes):

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## Campos de contexto

Cuando hay una ubicación presente, estos campos se añaden a `ctx`:

- `LocationLat` (número)
- `LocationLon` (número)
- `LocationAccuracy` (número, metros; opcional)
- `LocationName` (cadena; opcional)
- `LocationAddress` (cadena; opcional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booleano)
- `LocationCaption` (cadena; opcional)

Cuando el canal no establece una fuente explícita, OpenClaw la infiere: los usos compartidos en vivo se convierten en `live`, las ubicaciones con nombre o dirección se convierten en `place`, y todo lo demás es `pin`.

El renderizador de prompts trata `LocationName`, `LocationAddress` y `LocationCaption` como metadatos no confiables y los serializa mediante la misma ruta JSON acotada usada para otros contextos de canal.

## Notas de canal

- **LINE**: el mensaje de ubicación `title`/`address` se asigna a `LocationName`/`LocationAddress`; no hay ubicaciones en vivo.
- **Matrix**: `geo_uri` se analiza como una ubicación de pin; el parámetro `u` (incertidumbre) se asigna a `LocationAccuracy`, el cuerpo del evento rellena `LocationCaption`, la altitud se ignora y `LocationIsLive` siempre es falso.
- **Telegram**: los lugares se asignan a `LocationName`/`LocationAddress`; las ubicaciones en vivo se detectan mediante `live_period`.
- **WhatsApp**: `locationMessage.comment` y `liveLocationMessage.caption` rellenan `LocationCaption`.

## Relacionado

- [Comando de ubicación (nodos)](/es/nodes/location-command)
- [Captura de cámara](/es/nodes/camera)
- [Comprensión de medios](/es/nodes/media-understanding)
