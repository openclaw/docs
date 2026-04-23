---
read_when:
    - Configuración de streaming silencioso de Matrix para Synapse o Tuwunel autoalojados
    - Los usuarios quieren notificaciones solo en los bloques finalizados, no en cada edición de vista previa
summary: Reglas de envío push de Matrix por destinatario para ediciones silenciosas de vista previa finalizadas
title: Reglas de envío push de Matrix para vistas previas silenciosas
x-i18n:
    generated_at: "2026-04-23T14:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbfdf2552ca352858d4e8d03a2a0f5f3b420d33b01063c111c0335c0229f0534
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

# Reglas de envío push de Matrix para vistas previas silenciosas

Cuando `channels.matrix.streaming` es `"quiet"`, OpenClaw edita un único evento de vista previa en el mismo lugar y marca la edición finalizada con una marca personalizada en el contenido. Los clientes de Matrix notifican solo en la edición final si una regla push por usuario coincide con esa marca. Esta página es para operadores que autoalojan Matrix y quieren instalar esa regla para cada cuenta destinataria.

Si solo quiere el comportamiento estándar de notificaciones de Matrix, use `streaming: "partial"` o deje el streaming desactivado. Consulte [Configuración del canal de Matrix](/es/channels/matrix#streaming-previews).

## Requisitos previos

- usuario destinatario = la persona que debe recibir la notificación
- usuario bot = la cuenta de Matrix de OpenClaw que envía la respuesta
- use el token de acceso del usuario destinatario para las llamadas a la API a continuación
- haga coincidir `sender` en la regla push con el MXID completo del usuario bot
- la cuenta destinataria ya debe tener pushers funcionando — las reglas de vista previa silenciosa solo funcionan cuando la entrega push normal de Matrix está en buen estado

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

  <Step title="Verificar que existan pushers">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si no aparece ningún pusher, corrija primero la entrega push normal de Matrix para esta cuenta antes de continuar.

  </Step>

  <Step title="Instalar la regla push de override">
    OpenClaw marca las ediciones finalizadas de vista previa solo de texto con `content["com.openclaw.finalized_preview"] = true`. Instale una regla que coincida con ese marcador más el MXID del bot como remitente:

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

    Sustituya antes de ejecutar:

    - `https://matrix.example.org`: la URL base de su homeserver
    - `$USER_ACCESS_TOKEN`: el token de acceso del usuario destinatario
    - `openclaw-finalized-preview-botname`: un ID de regla único por bot y por destinatario (patrón: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: el MXID de su bot de OpenClaw, no el del destinatario

  </Step>

  <Step title="Verificar">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Luego pruebe una respuesta con streaming. En modo silencioso, la sala muestra un borrador de vista previa silencioso y notifica una vez que el bloque o el turno terminan.

  </Step>
</Steps>

Para eliminar la regla más tarde, haga `DELETE` a la misma URL de la regla con el token del destinatario.

## Notas para varios bots

Las reglas push se indexan por `ruleId`: si vuelve a ejecutar `PUT` sobre el mismo ID, se actualiza una sola regla. Para varios bots de OpenClaw que notifican al mismo destinatario, cree una regla por bot con una coincidencia de remitente distinta.

Las nuevas reglas `override` definidas por el usuario se insertan antes de las reglas de supresión predeterminadas, por lo que no se necesita ningún parámetro de orden adicional. La regla solo afecta a las ediciones de vista previa solo de texto que pueden finalizarse en el mismo lugar; los respaldos de medios y los respaldos de vista previa obsoleta usan la entrega normal de Matrix.

## Notas del homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    No se requiere ningún cambio especial en `homeserver.yaml`. Si las notificaciones normales de Matrix ya llegan a este usuario, el token del destinatario + la llamada a `pushrules` de arriba son el paso principal de configuración.

    Si ejecuta Synapse detrás de un proxy inverso o workers, asegúrese de que `/_matrix/client/.../pushrules/` llegue correctamente a Synapse. La entrega push la gestiona el proceso principal o `synapse.app.pusher` / los workers de pusher configurados — asegúrese de que estén en buen estado.

  </Accordion>

  <Accordion title="Tuwunel">
    El flujo es el mismo que en Synapse; no se necesita ninguna configuración específica de Tuwunel para el marcador de vista previa finalizada.

    Si las notificaciones desaparecen mientras el usuario está activo en otro dispositivo, compruebe si `suppress_push_when_active` está habilitado. Tuwunel añadió esta opción en la versión 1.4.2 (septiembre de 2025) y puede suprimir intencionalmente los envíos push a otros dispositivos mientras un dispositivo está activo.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Configuración del canal de Matrix](/es/channels/matrix)
- [Conceptos de streaming](/es/concepts/streaming)
