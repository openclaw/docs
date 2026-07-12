---
read_when:
    - Configuración de la transmisión silenciosa de Matrix para Synapse o Tuwunel autoalojados
    - Los usuarios quieren recibir notificaciones solo cuando se completen los bloques, no con cada edición de la vista previa.
summary: Reglas de notificaciones push de Matrix por destinatario para ediciones silenciosas de vistas previas finalizadas
title: Reglas de inserción de Matrix para vistas previas silenciosas
x-i18n:
    generated_at: "2026-07-11T22:55:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Cuando `channels.matrix.streaming` es `"quiet"`, OpenClaw transmite la respuesta editando en el mismo lugar un único evento de vista previa. Las vistas previas se envían como eventos `m.notice` que no generan notificaciones, y la edición finalizada se marca con `content["com.openclaw.finalized_preview"] = true`. Los clientes de Matrix notifican esa edición final solo si una regla push por usuario coincide con el marcador. Esta página está dirigida a los operadores que alojan Matrix por cuenta propia y desean instalar esa regla para cada cuenta destinataria.

`streaming: "progress"` finaliza sus borradores mediante la misma ruta, por lo que la misma regla también se activa para las ediciones finalizadas del modo de progreso.

Si solo desea el comportamiento de notificación estándar de Matrix, use `streaming: "partial"` o deje desactivada la transmisión. Consulte [Configuración del canal de Matrix](/es/channels/matrix#streaming-previews).

## Requisitos previos

- usuario destinatario = la persona que debe recibir la notificación
- usuario bot = la cuenta de Matrix de OpenClaw que envía la respuesta
- use el token de acceso del usuario destinatario para las llamadas a la API que aparecen a continuación
- haga coincidir `sender` en la regla push con el MXID completo del usuario bot
- la cuenta destinataria ya debe tener notificadores push funcionales; las reglas de vista previa silenciosa solo funcionan cuando la entrega push normal de Matrix está operativa

## Pasos

<Steps>
  <Step title="Configurar las vistas previas silenciosas">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Obtener el token de acceso del destinatario">
    Reutilice un token de sesión de cliente existente cuando sea posible. Para generar uno nuevo:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Verificar que existan notificadores push">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si no se devuelve ningún notificador push, corrija la entrega push normal de Matrix para esta cuenta antes de continuar.

  </Step>

  <Step title="Instalar la regla push de anulación">
    Instale una regla que coincida con el marcador de vista previa finalizada y con el MXID del bot como remitente:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Sustituya lo siguiente antes de ejecutarlo:

    - `https://matrix.example.org`: la URL base de su servidor doméstico
    - `$USER_ACCESS_TOKEN`: el token de acceso del usuario destinatario
    - `openclaw-finalized-preview-botname`: un ID de regla único por bot y destinatario (patrón: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: el MXID de su bot de OpenClaw, no el del destinatario

  </Step>

  <Step title="Verificar">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

A continuación, pruebe una respuesta transmitida. En el modo silencioso, la sala muestra una vista previa silenciosa del borrador y envía una notificación cuando finaliza el bloque o el turno.

  </Step>
</Steps>

Para eliminar la regla más adelante, envíe una solicitud `DELETE` a la misma URL de la regla con el token del destinatario.

## Notas sobre varios bots

Las reglas push se identifican mediante `ruleId`: volver a ejecutar `PUT` con el mismo ID actualiza una única regla. Si varios bots de OpenClaw notifican al mismo destinatario, cree una regla por bot con una coincidencia de remitente distinta.

Las nuevas reglas `override` definidas por el usuario se insertan antes que las reglas de supresión predeterminadas del servidor, por lo que no se necesita ningún parámetro de orden adicional. La regla solo afecta a las ediciones de vistas previas que contienen únicamente texto y que pueden finalizarse en el mismo lugar; en cambio, las respuestas multimedia, los mecanismos alternativos para vistas previas obsoletas y los textos finales que activarían menciones de Matrix se entregan como mensajes normales que generan notificaciones.

## Notas sobre el servidor doméstico

<AccordionGroup>
  <Accordion title="Synapse">
    No se requiere ningún cambio especial en `homeserver.yaml`. Si las notificaciones normales de Matrix ya llegan a este usuario, el token del destinatario y la llamada a `pushrules` anterior constituyen el paso principal de configuración.

    Si ejecuta Synapse detrás de un proxy inverso o con procesos de trabajo, asegúrese de que `/_matrix/client/.../pushrules/` llegue correctamente a Synapse. La entrega push la gestiona el proceso principal o `synapse.app.pusher` / los procesos de trabajo de notificación configurados; asegúrese de que estén operativos.

    La regla utiliza la condición de regla push `event_property_is` (MSC3758, regla push v1.10), que se añadió a Synapse en 2023. Las versiones anteriores de Synapse aceptan la llamada `PUT pushrules/...`, pero la condición nunca coincide y no se informa del problema; actualice Synapse si no llega ninguna notificación al finalizar una edición de vista previa.

  </Accordion>

  <Accordion title="Tuwunel">
    El procedimiento es el mismo que para Synapse; no se necesita ninguna configuración específica de Tuwunel para el marcador de vista previa finalizada.

    Si las notificaciones desaparecen mientras el usuario está activo en otro dispositivo, compruebe si `suppress_push_when_active` está habilitado. Tuwunel añadió esta opción en la versión 1.4.2 (septiembre de 2025), y puede suprimir intencionadamente las notificaciones push a otros dispositivos mientras uno de ellos está activo.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Configuración del canal de Matrix](/es/channels/matrix)
- [Conceptos de transmisión](/es/concepts/streaming)
