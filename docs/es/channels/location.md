---
read_when:
    - Adición o modificación del análisis de ubicación del canal
    - Uso de campos de contexto de ubicación en prompts o herramientas del agente
summary: Análisis de ubicaciones de canales y cargas útiles portátiles de ubicación saliente
title: Análisis de ubicación del canal
x-i18n:
    generated_at: "2026-07-12T14:18:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw normaliza las ubicaciones compartidas de los canales de chat en:

- texto conciso de coordenadas añadido al cuerpo entrante, y
- campos estructurados en la carga útil de contexto de respuesta automática. Las etiquetas, direcciones y leyendas/comentarios proporcionados por el canal se incorporan al prompt mediante el bloque JSON compartido de metadatos no confiables, no en línea en el cuerpo del usuario.

Compatibilidad actual:

- **LINE** (mensajes de ubicación con título/dirección)
- **Matrix** (`m.location` con `geo_uri`)
- **Telegram** (marcadores de ubicación + lugares + ubicaciones en tiempo real)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Formato del texto

Las ubicaciones se representan como líneas legibles sin corchetes. Las coordenadas usan seis decimales; la precisión se redondea a metros enteros:

- Marcador:
  - `📍 48.858844, 2.294351 ±12m`
- Lugar con nombre (en la misma línea; el nombre y la dirección solo se incluyen en el bloque de metadatos):
  - `📍 48.858844, 2.294351 ±12m`
- Ubicación compartida en tiempo real:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Si el canal incluye una etiqueta, dirección o leyenda/comentario, se conserva en la carga útil de contexto y aparece en el prompt como JSON delimitado no confiable (los campos se omiten cuando no están presentes):

````text
Ubicación (metadatos no confiables):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Torre Eiffel",
  "address": "Campo de Marte, París",
  "caption": "Nos vemos aquí"
}
```
````

## Campos de contexto

Cuando hay una ubicación, se añaden estos campos a `ctx`:

- `LocationLat` (número)
- `LocationLon` (número)
- `LocationAccuracy` (número, metros; opcional)
- `LocationName` (cadena; opcional)
- `LocationAddress` (cadena; opcional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booleano)
- `LocationCaption` (cadena; opcional)

Cuando el canal no establece una fuente explícita, OpenClaw la infiere: las ubicaciones compartidas en tiempo real se convierten en `live`, las ubicaciones con un nombre o una dirección se convierten en `place` y todas las demás son `pin`.

El renderizador del prompt trata `LocationName`, `LocationAddress` y `LocationCaption` como metadatos no confiables y los serializa mediante la misma ruta JSON limitada que se utiliza para el resto del contexto del canal.

## Cargas útiles salientes

La herramienta de mensajes y el SDK de Plugin utilizan la misma estructura `NormalizedLocation` para las ubicaciones salientes portables. Una carga útil que solo contiene coordenadas representa un marcador. Los canales con compatibilidad nativa con lugares pueden asignar `name` y `address` a una tarjeta de lugar.

Actualmente, Telegram expone esta función mediante `message(action="send")`. Su primera implementación es deliberadamente independiente: las cargas útiles de ubicación no se pueden combinar con texto ni contenido multimedia, y los pares de lugar incompletos generan un error en vez de descartar silenciosamente un nombre o una dirección. Los canales no compatibles no anuncian el parámetro de ubicación.

## Notas sobre los canales

- **LINE**: los campos `title`/`address` de los mensajes de ubicación se asignan a `LocationName`/`LocationAddress`; no admite ubicaciones en tiempo real.
- **Matrix**: `geo_uri` se analiza como una ubicación de marcador; el parámetro `u` (incertidumbre) se asigna a `LocationAccuracy`, el cuerpo del evento rellena `LocationCaption`, la altitud se ignora y `LocationIsLive` siempre es falso.
- **Telegram**: los lugares se asignan a `LocationName`/`LocationAddress`; las ubicaciones en tiempo real se detectan mediante `live_period`.
- **WhatsApp**: `locationMessage.comment` y `liveLocationMessage.caption` rellenan `LocationCaption`.

## Temas relacionados

- [Comando de ubicación (nodos)](/es/nodes/location-command)
- [Captura de cámara](/es/nodes/camera)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
