---
read_when:
    - Configurar el streaming silencioso de Matrix para Synapse o Tuwunel autohospedados
    - Los usuarios quieren notificaciones solo en los bloques finalizados, no en cada edición de vista previa
summary: Reglas de envío de Matrix por destinatario para ediciones silenciosas de vista previa finalizadas
title: Reglas de envío de Matrix para vistas previas silenciosas
x-i18n:
    generated_at: "2026-04-24T05:19:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Cuando `channels.matrix.streaming` es `"quiet"`, OpenClaw edita un único evento de vista previa en su lugar y marca la edición finalizada con una marca de contenido personalizada. Los clientes de Matrix notifican solo en la edición final si una regla de envío por usuario coincide con esa marca. Esta página está dirigida a operadores que autohospedan Matrix y quieren instalar esa regla para cada cuenta destinataria.

Si solo quieres el comportamiento estándar de notificaciones de Matrix, usa `streaming: "partial"` o deja el streaming desactivado. Consulta [configuración del canal de Matrix](/es/channels/matrix#streaming-previews).

## Requisitos previos

- usuario destinatario = la persona que debe recibir la notificación
- usuario bot = la cuenta de Matrix de OpenClaw que envía la respuesta
- usa el token de acceso del usuario destinatario para las llamadas a la API que aparecen a continuación
- haz coincidir `sender` en la regla de envío con el MXID completo del usuario bot
- la cuenta destinataria ya debe tener pushers funcionales: las reglas de vista previa silenciosa solo funcionan cuando la entrega normal de notificaciones de Matrix está en buen estado

## Pasos

<Steps>
  <Step title="Configurar vistas previas silenciosas">

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
    Reutiliza un token de sesión de cliente existente cuando sea posible. Para generar uno nuevo:

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

Si no se devuelve ningún pusher, corrige la entrega normal de notificaciones de Matrix para esta cuenta antes de continuar.

  </Step>

  <Step title="Instalar la regla de envío de anulación">
    OpenClaw marca las ediciones finalizadas de vista previa solo de texto con `content["com.openclaw.finalized_preview"] = true`. Instala una regla que coincida con ese marcador más el MXID del bot como remitente:

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

    Sustituye antes de ejecutar:

    - `https://matrix.example.org`: la URL base de tu homeserver
    - `$USER_ACCESS_TOKEN`: el token de acceso del usuario destinatario
    - `openclaw-finalized-preview-botname`: un ID de regla único por bot y por destinatario (patrón: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: el MXID de tu bot de OpenClaw, no el del destinatario

  </Step>

  <Step title="Verificar">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Luego prueba una respuesta en streaming. En el modo silencioso, la sala muestra una vista previa de borrador silenciosa y notifica una vez que termina el bloque o el turno.

  </Step>
</Steps>

Para eliminar la regla más adelante, usa `DELETE` en la misma URL de la regla con el token del destinatario.

## Notas sobre varios bots

Las reglas de envío se identifican mediante `ruleId`: volver a ejecutar `PUT` con el mismo ID actualiza una sola regla. Para varios bots de OpenClaw que notifican al mismo destinatario, crea una regla por bot con una coincidencia de remitente distinta.

Las nuevas reglas `override` definidas por el usuario se insertan antes de las reglas de supresión predeterminadas, por lo que no se necesita ningún parámetro de orden adicional. La regla solo afecta a las ediciones de vista previa solo de texto que pueden finalizarse en su lugar; los reemplazos para multimedia y para vistas previas obsoletas usan la entrega normal de Matrix.

## Notas sobre el homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    No se requiere ningún cambio especial en `homeserver.yaml`. Si las notificaciones normales de Matrix ya llegan a este usuario, el token del destinatario + la llamada a `pushrules` anterior es el paso principal de configuración.

    Si ejecutas Synapse detrás de un proxy inverso o workers, asegúrate de que `/_matrix/client/.../pushrules/` llegue correctamente a Synapse. La entrega de notificaciones la gestiona el proceso principal o `synapse.app.pusher` / los workers de pusher configurados; asegúrate de que estén en buen estado.

  </Accordion>

  <Accordion title="Tuwunel">
    El flujo es el mismo que en Synapse; no se necesita ninguna configuración específica de Tuwunel para el marcador de vista previa finalizada.

    Si las notificaciones desaparecen mientras el usuario está activo en otro dispositivo, comprueba si `suppress_push_when_active` está habilitado. Tuwunel añadió esta opción en la versión 1.4.2 (septiembre de 2025) y puede suprimir intencionadamente las notificaciones a otros dispositivos mientras uno de ellos está activo.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Configuración del canal de Matrix](/es/channels/matrix)
- [Conceptos de streaming](/es/concepts/streaming)
