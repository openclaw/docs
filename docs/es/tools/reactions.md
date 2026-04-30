---
read_when:
    - Trabajar con reacciones en cualquier canal
    - Comprender cómo difieren las reacciones con emojis entre plataformas
summary: Semántica de la herramienta de reacciones en todos los canales compatibles
title: Reacciones
x-i18n:
    generated_at: "2026-04-30T06:05:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

El agente puede añadir y eliminar reacciones de emoji en los mensajes mediante la herramienta `message`
con la acción `react`. El comportamiento de las reacciones varía según el canal y el transporte.

## Cómo funciona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` es obligatorio al añadir una reacción.
- Establece `emoji` en una cadena vacía (`""`) para eliminar las reacciones del bot.
- Establece `remove: true` para eliminar un emoji específico (requiere `emoji` no vacío).

## Comportamiento por canal

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` vacío elimina todas las reacciones del bot en el mensaje.
    - `remove: true` elimina solo el emoji especificado.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` vacío elimina las reacciones de la aplicación en el mensaje.
    - `remove: true` elimina solo el emoji especificado.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vacío elimina las reacciones del bot.
    - `remove: true` también elimina reacciones, pero sigue requiriendo un `emoji` no vacío para la validación de la herramienta.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vacío elimina la reacción del bot.
    - `remove: true` se asigna internamente a un emoji vacío (sigue requiriendo `emoji` en la llamada a la herramienta).

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
    - Las notificaciones de reacciones entrantes se controlan mediante `channels.signal.reactionNotifications`: `"off"` las desactiva, `"own"` (predeterminado) emite eventos cuando los usuarios reaccionan a mensajes del bot, y `"all"` emite eventos para todas las reacciones.

  </Accordion>
</AccordionGroup>

## Nivel de reacción

La configuración `reactionLevel` por canal controla con qué amplitud el agente usa las reacciones. Los valores suelen ser `off`, `ack`, `minimal` o `extensive`.

- [Telegram reactionLevel](/es/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/es/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Establece `reactionLevel` en canales individuales para ajustar qué tan activamente el agente reacciona a los mensajes en cada plataforma.

## Relacionado

- [Envío del agente](/es/tools/agent-send) — la herramienta `message` que incluye `react`
- [Canales](/es/channels) — configuración específica del canal
