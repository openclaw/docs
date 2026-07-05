---
read_when:
    - Creación de clientes Matrix que renderizan respuestas enriquecidas de OpenClaw
    - Depuración del contenido de eventos de com.openclaw.presentation
summary: Metadatos de Matrix MessagePresentation para clientes compatibles con OpenClaw
title: Metadatos de presentación de Matrix
x-i18n:
    generated_at: "2026-07-05T11:03:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw adjunta metadatos `MessagePresentation` normalizados a los eventos Matrix `m.room.message` salientes bajo la clave de contenido `com.openclaw.presentation`.

Los clientes Matrix estándar siguen renderizando el texto sin formato `body`. Los clientes compatibles con OpenClaw pueden leer los metadatos estructurados y renderizar una interfaz nativa, como botones, selectores, filas de contexto y divisores.

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

- `version` es la versión del esquema de metadatos; la versión actual es `1`. `type` es un discriminador estable, siempre `"message.presentation"`. El adaptador Matrix solo emite cargas con exactamente esta versión y tipo; del mismo modo, los clientes deberían ignorar versiones desconocidas que no puedan interpretar de forma segura, valores `type` desconocidos y tipos de bloque desconocidos.
- `title` y `tone` (`info`, `success`, `warning`, `danger`, `neutral`) son pistas opcionales.
- Los botones y las opciones de selección pueden incluir una `action` tipada (`{ "type": "command", "command": "/..." }` o `{ "type": "callback", "value": "..." }`) junto con la cadena heredada `value`. Prefiere `action` cuando ambas estén presentes.

## Comportamiento de respaldo

OpenClaw siempre renderiza un respaldo de texto sin formato legible en `body`. Los metadatos estructurados son aditivos y no deben ser necesarios para la interoperabilidad básica con Matrix.

Reglas de renderizado de respaldo:

- El contenido `title`, `text` y `context` se renderiza como líneas de texto sin formato.
- Los botones con una acción `command` se renderizan como ``label: `/command` `` para que el comando siga siendo copiable. Los botones con una acción `callback` o solo un `value` heredado se renderizan solo con la etiqueta para que los valores de callback opacos sigan siendo privados; los botones deshabilitados siempre se muestran solo con la etiqueta. Los botones de URL y de aplicaciones web se renderizan como `label: URL`.
- Los bloques de selección renderizan el marcador de posición (o `Options:`) como encabezado más líneas de opciones solo con etiqueta.
- Si no se renderiza nada, por ejemplo una presentación compuesta solo por un divisor, el cuerpo usa `---` como respaldo.

Los clientes no compatibles siguen mostrando el texto de respaldo. Los clientes compatibles con OpenClaw pueden preferir los metadatos estructurados para la visualización mientras conservan el respaldo para copiar, buscar, notificaciones y accesibilidad.

## Bloques compatibles

El adaptador saliente de Matrix anuncia compatibilidad nativa con:

- `buttons`
- `select`
- `context`
- `divider`

Los bloques `text` siempre son compatibles a través del cuerpo de respaldo. Trata todos los bloques como pistas de presentación de mejor esfuerzo; ignora campos y tipos de bloque desconocidos en lugar de hacer fallar todo el mensaje.

## Interacciones

Estos metadatos no añaden semántica de callbacks de Matrix. Los valores de botones y selectores son cargas de interacción de respaldo, normalmente comandos slash o comandos de texto. Un cliente Matrix que quiera admitir la interacción resuelve el valor del control (`action.command`, luego `action.value`, luego `value`) y lo envía de vuelta a la sala como un mensaje normal.

Por ejemplo, un botón con el valor `/model deepseek/deepseek-chat` puede gestionarse enviando ese valor como un mensaje de texto Matrix cifrado en la misma sala.

## Relación con los metadatos de aprobación

`com.openclaw.presentation` sirve para la presentación general de mensajes enriquecidos.

Las solicitudes de aprobación usan los metadatos dedicados `com.openclaw.approval` porque las aprobaciones contienen estado, decisiones y detalles de ejecución/Plugin sensibles para la seguridad. Si ambas claves de metadatos están presentes en el mismo evento, los clientes deberían preferir el renderizador de aprobación dedicado.

## Mensajes multimedia

Cuando una respuesta contiene varias URL multimedia, OpenClaw envía un evento Matrix por cada URL multimedia. El texto del pie y los metadatos de presentación se adjuntan solo al primer evento para que los clientes reciban una única carga estructurada estable sin renderizadores duplicados. La misma regla se aplica cuando un texto largo se divide en fragmentos entre eventos: los metadatos viajan solo en el primer evento.

Mantén compactos los metadatos de presentación. El texto grande visible para el usuario debería permanecer en `body` y usar la ruta normal de fragmentación de texto de Matrix.
