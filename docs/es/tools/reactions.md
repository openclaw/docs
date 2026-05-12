---
read_when:
    - Trabajar con reacciones en cualquier canal
    - Comprender en qué difieren las reacciones con emoji entre plataformas
summary: Semántica de la herramienta de reacción en todos los canales compatibles
title: Reacciones
x-i18n:
    generated_at: "2026-05-12T00:59:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

El agente puede agregar y quitar reacciones con emojis en mensajes usando la herramienta `message` con la acción `react`. El comportamiento de las reacciones varía según el canal y el transporte.

## Cómo funciona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` es obligatorio al agregar una reacción.
- Establece `emoji` en una cadena vacía (`""`) para quitar la(s) reacción(es) del bot.
- Establece `remove: true` para quitar un emoji específico (requiere `emoji` no vacío).
- En los canales que admiten reacciones de estado, `trackToolCalls: true` en una reacción permite que el runtime use ese mensaje reaccionado para las reacciones de progreso posteriores de la herramienta durante el mismo turno.

## Comportamiento por canal

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` vacío quita todas las reacciones del bot en el mensaje.
    - `remove: true` quita solo el emoji especificado.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` vacío quita las reacciones de la aplicación en el mensaje.
    - `remove: true` quita solo el emoji especificado.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vacío quita las reacciones del bot.
    - `remove: true` también quita reacciones, pero aún requiere un `emoji` no vacío para la validación de la herramienta.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vacío quita la reacción del bot.
    - `remove: true` se asigna internamente a un emoji vacío (aun así requiere `emoji` en la llamada a la herramienta).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Requiere `emoji` no vacío.
    - `remove: true` quita esa reacción de emoji específica.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa la herramienta `feishu_reaction` con las acciones `add`, `remove` y `list`.
    - Agregar/quitar requiere `emoji_type`; quitar también requiere `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Las notificaciones de reacciones entrantes se controlan mediante `channels.signal.reactionNotifications`: `"off"` las desactiva, `"own"` (predeterminado) emite eventos cuando los usuarios reaccionan a mensajes del bot, y `"all"` emite eventos para todas las reacciones.

  </Accordion>

  <Accordion title="iMessage">
    - Las reacciones salientes son tapbacks de iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` y `question`).
    - Las notificaciones de tapbacks entrantes se controlan mediante `channels.imessage.reactionNotifications`: `"off"` las desactiva, `"own"` (predeterminado) emite eventos cuando los usuarios reaccionan a mensajes escritos por el bot, y `"all"` emite eventos para todos los tapbacks de remitentes autorizados.

  </Accordion>
</AccordionGroup>

## Nivel de reacción

La configuración `reactionLevel` por canal controla qué tan ampliamente el agente usa reacciones. Los valores suelen ser `off`, `ack`, `minimal` o `extensive`.

- [Telegram reactionLevel](/es/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/es/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Establece `reactionLevel` en canales individuales para ajustar qué tan activamente el agente reacciona a los mensajes en cada plataforma.

## Relacionado

- [Envío del agente](/es/tools/agent-send) — la herramienta `message` que incluye `react`
- [Canales](/es/channels) — configuración específica del canal
