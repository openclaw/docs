---
read_when:
    - Creación de clientes de Matrix que renderizan respuestas enriquecidas de OpenClaw
    - Depuración del contenido de eventos de com.openclaw.presentation
summary: Metadatos de MessagePresentation de Matrix para clientes compatibles con OpenClaw
title: Metadatos de presentación de Matrix
x-i18n:
    generated_at: "2026-07-11T22:53:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw adjunta metadatos `MessagePresentation` normalizados a los eventos salientes `m.room.message` de Matrix bajo la clave de contenido `com.openclaw.presentation`.

Los clientes Matrix estándar continúan representando el `body` de texto sin formato. Los clientes compatibles con OpenClaw pueden leer los metadatos estructurados y representar una interfaz de usuario nativa, como botones, selectores, filas de contexto y divisores.

## Contenido del evento

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` es la versión del esquema de metadatos; la versión actual es `1`. `type` es un discriminador estable, siempre `"message.presentation"`. El adaptador de Matrix solo emite cargas útiles que tienen exactamente esta versión y este tipo; del mismo modo, los clientes deben ignorar las versiones desconocidas que no puedan interpretar de forma segura, los valores de `type` desconocidos y los tipos de bloque desconocidos.
- `title` y `tone` (`info`, `success`, `warning`, `danger`, `neutral`) son indicaciones opcionales.
- Los botones y las opciones de selección pueden incluir una `action` tipada (`{ "type": "command", "command": "/..." }` o `{ "type": "callback", "value": "..." }`) junto con la cadena `value` heredada. Se debe preferir `action` cuando ambas estén presentes.

## Comportamiento alternativo

OpenClaw siempre genera en `body` una alternativa legible en texto sin formato. Los metadatos estructurados son adicionales y no deben ser necesarios para la interoperabilidad básica con Matrix.

Reglas de representación alternativa:

- El contenido de `title`, `text` y `context` se representa como líneas de texto sin formato.
- Los botones con una acción `command` se representan como ``etiqueta: `/comando` `` para que el comando se pueda copiar. Los botones con una acción `callback` o solo con un `value` heredado se representan únicamente con la etiqueta para que los valores opacos de devolución de llamada permanezcan privados; los botones deshabilitados siempre se representan únicamente con la etiqueta. Los botones de URL y de aplicaciones web se representan como `etiqueta: URL`.
- Los bloques de selección representan el texto de marcador de posición (o `Opciones:`) como encabezado, seguido de líneas de opciones que solo contienen la etiqueta.
- Si no se representa nada, por ejemplo, en una presentación que solo contiene un divisor, el cuerpo utiliza `---` como alternativa.

Los clientes no compatibles continúan mostrando el texto alternativo. Los clientes compatibles con OpenClaw pueden preferir los metadatos estructurados para la visualización, a la vez que conservan la alternativa para copiar, buscar, mostrar notificaciones y ofrecer accesibilidad.

## Bloques compatibles

El adaptador de salida de Matrix anuncia compatibilidad nativa con:

- `buttons`
- `select`
- `context`
- `divider`

Los bloques `text` siempre son compatibles mediante el cuerpo alternativo. Todos los bloques deben tratarse como indicaciones de presentación sin garantías; se deben ignorar los campos y tipos de bloque desconocidos en lugar de rechazar el mensaje completo.

## Interacciones

Estos metadatos no añaden semántica de devolución de llamada a Matrix. Los valores de los botones y selectores son cargas útiles de interacción alternativas, normalmente comandos con barra o comandos de texto. Un cliente Matrix que desee admitir la interacción debe resolver el valor del control (`action.command`, luego `action.value` y después `value`) y enviarlo de vuelta a la sala como un mensaje normal.

Por ejemplo, un botón con el valor `/model deepseek/deepseek-chat` puede gestionarse enviando ese valor como un mensaje de texto cifrado de Matrix en la misma sala.

## Relación con los metadatos de aprobación

`com.openclaw.presentation` se utiliza para la presentación general de mensajes enriquecidos.

Las solicitudes de aprobación utilizan los metadatos específicos `com.openclaw.approval`, ya que las aprobaciones incluyen estados y decisiones sensibles para la seguridad, así como detalles de ejecución y de plugins. Si ambas claves de metadatos están presentes en el mismo evento, los clientes deben preferir el componente de representación específico para aprobaciones.

## Mensajes multimedia

Cuando una respuesta contiene varias URL de contenido multimedia, OpenClaw envía un evento de Matrix por cada URL. El texto del pie y los metadatos de presentación se adjuntan únicamente al primer evento para que los clientes reciban una única carga útil estructurada y estable, sin componentes de representación duplicados. La misma regla se aplica cuando un texto largo se divide entre varios eventos: los metadatos solo se incluyen en el primer evento.

Mantenga compactos los metadatos de presentación. El texto extenso visible para el usuario debe permanecer en `body` y utilizar el mecanismo normal de Matrix para dividir el texto.
