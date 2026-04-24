---
read_when:
    - Trabajar con reacciones en cualquier canal compatible
    - Entender cómo difieren las reacciones con emoji entre plataformas
summary: Semántica de la herramienta de reacciones en todos los canales compatibles
title: Reacciones
x-i18n:
    generated_at: "2026-04-24T05:55:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

El agente puede añadir y eliminar reacciones con emoji en mensajes usando la herramienta `message`
con la acción `react`. El comportamiento de las reacciones varía según el canal.

## Cómo funciona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` es obligatorio al añadir una reacción.
- Establece `emoji` como una cadena vacía (`""`) para eliminar la(s) reacción(es) del bot.
- Establece `remove: true` para eliminar un emoji específico (requiere `emoji` no vacío).

## Comportamiento por canal

<AccordionGroup>
  <Accordion title="Discord y Slack">
    - Un `emoji` vacío elimina todas las reacciones del bot en el mensaje.
    - `remove: true` elimina solo el emoji especificado.
  </Accordion>

  <Accordion title="Google Chat">
    - Un `emoji` vacío elimina las reacciones de la app en el mensaje.
    - `remove: true` elimina solo el emoji especificado.
  </Accordion>

  <Accordion title="Telegram">
    - Un `emoji` vacío elimina las reacciones del bot.
    - `remove: true` también elimina reacciones, pero sigue requiriendo un `emoji` no vacío para la validación de la herramienta.
  </Accordion>

  <Accordion title="WhatsApp">
    - Un `emoji` vacío elimina la reacción del bot.
    - `remove: true` se mapea internamente a un emoji vacío (pero sigue requiriendo `emoji` en la llamada de herramienta).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Requiere `emoji` no vacío.
    - `remove: true` elimina esa reacción de emoji específica.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa la herramienta `feishu_reaction` con las acciones `add`, `remove` y `list`.
    - Añadir/eliminar requiere `emoji_type`; eliminar también requiere `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Las notificaciones de reacciones entrantes se controlan con `channels.signal.reactionNotifications`: `"off"` las desactiva, `"own"` (predeterminado) emite eventos cuando los usuarios reaccionan a mensajes del bot, y `"all"` emite eventos para todas las reacciones.
  </Accordion>
</AccordionGroup>

## Nivel de reacción

La configuración `reactionLevel` por canal controla cuán ampliamente usa el agente las reacciones. Los valores suelen ser `off`, `ack`, `minimal` o `extensive`.

- [reactionLevel de Telegram](/es/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel de WhatsApp](/es/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Establece `reactionLevel` en canales individuales para ajustar qué tan activamente reacciona el agente a los mensajes en cada plataforma.

## Relacionado

- [Agent Send](/es/tools/agent-send) — la herramienta `message` que incluye `react`
- [Canales](/es/channels) — configuración específica por canal
