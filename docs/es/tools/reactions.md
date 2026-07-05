---
read_when:
    - Trabajar con reacciones en cualquier canal
    - Comprender cómo difieren las reacciones con emoji entre plataformas
summary: Semántica de la herramienta de reacción en todos los canales compatibles
title: Reacciones
x-i18n:
    generated_at: "2026-07-05T11:48:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcffae5deb5525b7f38fe827cce7ab46b66f238512d063c4cda651378efd8a67
    source_path: tools/reactions.md
    workflow: 16
---

El agente añade y elimina reacciones de emoji con la acción `react` de la
herramienta `message`. El comportamiento varía según el canal.

## Cómo funciona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` es obligatorio al añadir una reacción.
- Establece `emoji` en una cadena vacía (`""`) para eliminar la(s) reacción(es)
  del bot en los canales que lo admiten.
- Establece `remove: true` para eliminar un emoji específico (requiere un
  `emoji` no vacío).
- En canales con reacciones de estado, `trackToolCalls: true` en una reacción
  permite que el runtime reutilice ese mensaje con reacción para posteriores
  reacciones de progreso de herramientas durante el mismo turno.

## Comportamiento por canal

<AccordionGroup>
  <Accordion title="Discord y Slack">
    - `emoji` vacío elimina todas las reacciones del bot en el mensaje.
    - `remove: true` elimina solo el emoji especificado.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` vacío (o `remove: true`) elimina las reacciones propias del bot en el mensaje, filtradas por `emoji` cuando está definido.
    - `remove: true` elimina solo el emoji especificado.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Solo se pueden añadir reacciones: `emoji` es obligatorio y no debe estar vacío.
    - La eliminación de reacciones todavía no está conectada a una llamada de borrado; `remove: true` se rechaza con un error explícito en lugar de no hacer nada silenciosamente.
    - Requiere el bot de Talk registrado con la función `reaction` (consulta la [documentación del canal Nextcloud Talk](/es/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vacío elimina las reacciones del bot.
    - `remove: true` también elimina reacciones, pero sigue requiriendo un `emoji` no vacío para la validación de la herramienta.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vacío elimina la reacción del bot.
    - `remove: true` se asigna internamente a un emoji vacío (aun así requiere `emoji` en la llamada de la herramienta).
    - WhatsApp tiene una ranura de reacción del bot por mensaje; enviar una reacción nueva la sustituye en lugar de apilar varios emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Requiere `emoji` no vacío tanto para añadir como para eliminar.
    - `remove: true` elimina esa reacción de emoji específica.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa la misma acción `react` que otros canales (añadir/eliminar/listar mediante identificadores de reacción del mensaje), no una herramienta aparte.
    - Añadir requiere `emoji` no vacío (asignado a un `emoji_type` de Feishu, por ejemplo, `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` requiere `emoji` no vacío y elimina la reacción propia del bot que coincide con ese tipo de emoji.
    - `emoji` vacío con `clearAll: true` elimina todas las reacciones del bot en el mensaje.

  </Accordion>

  <Accordion title="Signal">
    - Las notificaciones de reacciones entrantes se controlan con `channels.signal.reactionNotifications`: `"off"` las desactiva, `"own"` (predeterminado) emite eventos cuando los usuarios reaccionan a mensajes del bot, `"all"` emite eventos para todas las reacciones y `"allowlist"` emite eventos solo para remitentes incluidos en `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Las reacciones salientes son tapbacks de iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` y `question`); `emoji` debe corresponder a uno de estos tipos para añadir una reacción.
    - `remove: true` sin un tipo de tapback reconocido elimina todos los tipos de tapback; con un tipo reconocido elimina solo ese.

  </Accordion>
</AccordionGroup>

## Nivel de reacciones

`reactionLevel` por canal limita la frecuencia con la que el agente envía sus
propias reacciones. Valores: `off`, `ack`, `minimal` o `extensive`.

- [Notificaciones de reacciones de Telegram](/es/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (predeterminado `minimal`)
- [Nivel de reacciones de WhatsApp](/es/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (predeterminado `minimal`)
- [Reacciones de Signal](/es/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (predeterminado `minimal`)

## Relacionado

- [Envío del agente](/es/tools/agent-send) - la herramienta `message` que incluye `react`
- [Canales](/es/channels) - configuración específica del canal
