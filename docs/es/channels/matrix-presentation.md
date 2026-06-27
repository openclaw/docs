---
read_when:
    - Creación de clientes de Matrix que renderizan respuestas enriquecidas de OpenClaw
    - Depuración del contenido de eventos de com.openclaw.presentation
summary: Metadatos de Matrix MessagePresentation para clientes compatibles con OpenClaw
title: Metadatos de presentación de Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw puede adjuntar metadatos `MessagePresentation` normalizados a eventos Matrix `m.room.message` salientes bajo `com.openclaw.presentation`.

Los clientes Matrix estándar siguen renderizando el texto sin formato de `body`. Los clientes compatibles con OpenClaw pueden leer los metadatos estructurados y renderizar una interfaz de usuario nativa, como botones, selectores, filas de contexto y divisores.

## Contenido del evento

Los metadatos se almacenan en el contenido del evento Matrix:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` es la versión del esquema de metadatos de presentación de Matrix. `type` es un discriminador estable para clientes compatibles con OpenClaw. Los clientes deben ignorar valores de `type` desconocidos, versiones desconocidas que no puedan interpretar de forma segura y tipos de bloque desconocidos.

## Comportamiento de reserva

OpenClaw siempre renderiza una alternativa de texto sin formato legible en `body`. Los metadatos estructurados son aditivos y no deben ser necesarios para la interoperabilidad básica con Matrix.

Los clientes no compatibles deben seguir mostrando el texto de reserva. Los clientes compatibles con OpenClaw pueden preferir los metadatos estructurados para la visualización, a la vez que conservan el texto de reserva para copia, búsqueda, notificaciones y accesibilidad.

## Bloques admitidos

El adaptador saliente de Matrix anuncia compatibilidad con:

- `buttons`
- `select`
- `context`
- `divider`

Los clientes deben tratar estos bloques como indicaciones de presentación de mejor esfuerzo. Los campos desconocidos y los tipos de bloque desconocidos deben ignorarse en lugar de provocar que el mensaje completo no se pueda renderizar.

## Interacciones

Estos metadatos no añaden semántica de devolución de llamada de Matrix. Los valores de botones y opciones de selección son cargas de interacción de reserva, normalmente comandos de barra diagonal o comandos de texto. Un cliente Matrix que quiera admitir interacción puede enviar el valor seleccionado de vuelta a la sala como un mensaje normal.

Por ejemplo, un botón con el valor `/model deepseek/deepseek-chat` puede gestionarse enviando ese valor como un mensaje de texto Matrix cifrado en la misma sala.

## Relación con los metadatos de aprobación

`com.openclaw.presentation` es para la presentación general enriquecida de mensajes.

Las solicitudes de aprobación usan los metadatos dedicados `com.openclaw.approval` porque las aprobaciones contienen estado, decisiones y detalles de ejecución/Plugin sensibles para la seguridad. Si ambas claves de metadatos están presentes en el mismo evento, los clientes deben preferir el renderizador de aprobación dedicado.

## Mensajes multimedia

Cuando una respuesta contiene varias URL multimedia, OpenClaw envía un evento Matrix por cada URL multimedia. Los metadatos de presentación se adjuntan solo al primer evento multimedia para que los clientes tengan una carga estructurada estable y se eviten renderizadores duplicados.

Mantén compactos los metadatos de presentación. El texto grande visible para el usuario debe permanecer en `body` y usar la ruta normal de fragmentación de texto de Matrix.
