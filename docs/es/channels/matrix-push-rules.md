---
read_when:
    - Configuración del streaming silencioso de Matrix para Synapse o Tuwunel autoalojados
    - Los usuarios quieren recibir notificaciones solo cuando los bloques estén terminados, no con cada edición de la vista previa
summary: Reglas de notificaciones push de Matrix por destinatario para ediciones silenciosas de vistas previas finalizadas
title: Reglas push de Matrix para vistas previas silenciosas
x-i18n:
    generated_at: "2026-07-14T13:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Cuando `channels.matrix.streaming.mode` es `"quiet"`, OpenClaw transmite la respuesta editando en el mismo lugar un único evento de vista previa. Las vistas previas se envían como eventos `m.notice` que no generan notificaciones, y la edición finalizada se marca con `content["com.openclaw.finalized_preview"] = true`. Los clientes de Matrix notifican esa edición final solo si una regla de notificaciones push por usuario coincide con el marcador. Esta página está dirigida a quienes alojan Matrix por cuenta propia y desean instalar esa regla para cada cuenta destinataria.

`streaming.mode: "progress"` finaliza sus borradores mediante la misma ruta, por lo que la misma regla también se activa para las ediciones finalizadas del modo de progreso.

Si solo se desea el comportamiento de notificaciones estándar de Matrix, se debe usar `streaming.mode: "partial"` o dejar desactivada la transmisión. Consulte [Configuración del canal Matrix](/es/channels/matrix#streaming-previews).

## Requisitos previos

- usuario destinatario = la persona que debe recibir la notificación
- usuario bot = la cuenta de Matrix de OpenClaw que envía la respuesta
- use el token de acceso del usuario destinatario para las llamadas a la API que aparecen a continuación
- haga coincidir `sender` en la regla de notificaciones push con el MXID completo del usuario bot
- la cuenta destinataria ya debe tener pushers operativos; las reglas de vistas previas silenciosas solo funcionan cuando la entrega normal de notificaciones push de Matrix funciona correctamente

## Pasos

<Steps>
  <Step title="Configurar vistas previas silenciosas">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Obtener el token de acceso del destinatario">
    Siempre que sea posible, reutilice el token de una sesión de cliente existente. Para generar uno nuevo:

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

  <Step title="Verificar que existan pushers">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si no se devuelve ningún pusher, corrija la entrega normal de notificaciones push de Matrix para esta cuenta antes de continuar.

  </Step>

  <Step title="Instalar la regla de notificaciones push de anulación">
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

    Sustituya lo siguiente antes de ejecutar:

    - `https://matrix.example.org`: la URL base de su servidor doméstico
    - `$USER_ACCESS_TOKEN`: el token de acceso del usuario destinatario
    - `openclaw-finalized-preview-botname`: un ID de regla único para cada bot y destinatario (patrón: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: el MXID de su bot de OpenClaw, no el del destinatario

  </Step>

  <Step title="Verificar">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

A continuación, pruebe una respuesta transmitida. En el modo silencioso, la sala muestra una vista previa silenciosa del borrador y envía una notificación cuando termina el bloque o el turno.

  </Step>
</Steps>

Para eliminar la regla más adelante, aplique `DELETE` a la misma URL de la regla con el token del destinatario.

## Notas sobre varios bots

Las reglas de notificaciones push se indexan mediante `ruleId`: volver a ejecutar `PUT` con el mismo ID actualiza una única regla. Si varios bots de OpenClaw notifican al mismo destinatario, cree una regla por bot con una coincidencia de remitente distinta.

Las nuevas reglas `override` definidas por el usuario se insertan antes de las reglas de supresión predeterminadas del servidor, por lo que no se necesita ningún parámetro de orden adicional. La regla solo afecta a las ediciones de vistas previas de solo texto que pueden finalizarse en el mismo lugar; las respuestas multimedia, los mecanismos alternativos para vistas previas obsoletas y los textos finales que activarían menciones de Matrix se entregan, en cambio, como mensajes normales que generan notificaciones.

## Notas sobre el servidor doméstico

<AccordionGroup>
  <Accordion title="Synapse">
    No se requiere ningún cambio especial en `homeserver.yaml`. Si las notificaciones normales de Matrix ya llegan a este usuario, el token del destinatario y la llamada `pushrules` anterior constituyen el paso principal de configuración.

    Si se ejecuta Synapse detrás de un proxy inverso o de procesos de trabajo, asegúrese de que `/_matrix/client/.../pushrules/` llegue correctamente a Synapse. La entrega de notificaciones push la gestiona el proceso principal o `synapse.app.pusher` / los procesos de trabajo de pushers configurados; asegúrese de que funcionen correctamente.

    La regla utiliza la condición `event_property_is` de las reglas de notificaciones push (MSC3758, regla de notificaciones push v1.10), que se añadió a Synapse en 2023. Las versiones anteriores de Synapse aceptan la llamada `PUT pushrules/...`, pero nunca hacen coincidir la condición de forma silenciosa; actualice Synapse si no llega ninguna notificación al finalizar una edición de vista previa.

  </Accordion>

  <Accordion title="Tuwunel">
    Se aplica el mismo proceso que con Synapse; no se necesita ninguna configuración específica de Tuwunel para el marcador de vista previa finalizada.

    Si las notificaciones desaparecen mientras el usuario está activo en otro dispositivo, compruebe si `suppress_push_when_active` está habilitado. Tuwunel añadió esta opción en la versión 1.4.2 (septiembre de 2025) y esta puede suprimir intencionadamente las notificaciones push a otros dispositivos mientras uno de ellos está activo.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Configuración del canal Matrix](/es/channels/matrix)
- [Conceptos de transmisión](/es/concepts/streaming)
