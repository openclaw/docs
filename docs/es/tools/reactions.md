---
read_when:
    - Trabajar con reacciones en cualquier canal
    - Comprender cómo difieren las reacciones con emoji entre plataformas
summary: Semántica de la herramienta de reacción en todos los canales compatibles
title: Reacciones
x-i18n:
    generated_at: "2026-06-27T13:07:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

El agente puede agregar y quitar reacciones emoji en mensajes usando la herramienta `message`
con la acción `react`. El comportamiento de las reacciones varía según el canal y el transporte.

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
- En canales que admiten reacciones de estado, `trackToolCalls: true` en una
  reacción permite que el runtime use ese mensaje con reacción para las reacciones
  de progreso de herramientas posteriores durante el mismo turno.

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

  <Accordion title="Nextcloud Talk">
    - Solo agregar reacciones: `emoji` es obligatorio y no debe estar vacío.
    - La eliminación de reacciones aún no es compatible; las llamadas con `remove: true` (o `emoji` vacío) se rechazan con un error claro en lugar de no hacer nada silenciosamente.
    - Requiere que el bot de Talk esté registrado con la característica `reaction` (consulta la [documentación del canal Nextcloud Talk](/es/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vacío quita las reacciones del bot.
    - `remove: true` también quita reacciones, pero sigue requiriendo un `emoji` no vacío para la validación de la herramienta.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vacío quita la reacción del bot.
    - `remove: true` se asigna internamente a un emoji vacío (sigue requiriendo `emoji` en la llamada a la herramienta).
    - WhatsApp tiene una ranura de reacción de bot por mensaje; las actualizaciones de reacciones de estado reemplazan esa ranura en lugar de acumular varios emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Requiere `emoji` no vacío.
    - `remove: true` quita esa reacción emoji específica.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa la herramienta `feishu_reaction` con las acciones `add`, `remove` y `list`.
    - Agregar/quitar requiere `emoji_type`; quitar también requiere `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Las notificaciones de reacciones entrantes se controlan con `channels.signal.reactionNotifications`: `"off"` las desactiva, `"own"` (valor predeterminado) emite eventos cuando los usuarios reaccionan a mensajes del bot y `"all"` emite eventos para todas las reacciones.

  </Accordion>

  <Accordion title="iMessage">
    - Las reacciones salientes son tapbacks de iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` y `question`).
    - Las notificaciones de tapbacks entrantes se controlan con `channels.imessage.reactionNotifications`: `"off"` las desactiva, `"own"` (valor predeterminado) emite eventos cuando los usuarios reaccionan a mensajes escritos por el bot y `"all"` emite eventos para todos los tapbacks de remitentes autorizados.

  </Accordion>
</AccordionGroup>

## Nivel de reacción

La configuración `reactionLevel` por canal controla qué tan ampliamente usa reacciones el agente. Los valores suelen ser `off`, `ack`, `minimal` o `extensive`.

- [Telegram reactionLevel](/es/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/es/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Establece `reactionLevel` en canales individuales para ajustar con qué actividad reacciona el agente a los mensajes en cada plataforma.

## Relacionado

- [Envío del agente](/es/tools/agent-send) — la herramienta `message` que incluye `react`
- [Canales](/es/channels) — configuración específica del canal
