---
read_when:
    - Trabajar con reacciones en cualquier canal
    - Comprender cómo difieren las reacciones con emoji entre plataformas
summary: Semántica de la herramienta de reacción en todos los canales compatibles
title: Reacciones
x-i18n:
    generated_at: "2026-05-03T21:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

El agente puede añadir y quitar reacciones con emoji en mensajes usando la herramienta `message` con la acción `react`. El comportamiento de las reacciones varía según el canal y el transporte.

## Cómo funciona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` es obligatorio al añadir una reacción.
- Establece `emoji` en una cadena vacía (`""`) para quitar la(s) reacción(es) del bot.
- Establece `remove: true` para quitar un emoji específico (requiere `emoji` no vacío).
- En los canales que admiten reacciones de estado, `trackToolCalls: true` en una reacción permite que el entorno de ejecución use ese mensaje reaccionado para las reacciones de progreso de herramientas posteriores durante el mismo turno.

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
    - `remove: true` también quita reacciones, pero sigue requiriendo un `emoji` no vacío para la validación de la herramienta.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vacío quita la reacción del bot.
    - `remove: true` se asigna internamente a un emoji vacío (sigue requiriendo `emoji` en la llamada a la herramienta).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Requiere `emoji` no vacío.
    - `remove: true` quita esa reacción de emoji específica.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa la herramienta `feishu_reaction` con las acciones `add`, `remove` y `list`.
    - Añadir/quitar requiere `emoji_type`; quitar también requiere `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Las notificaciones de reacciones entrantes se controlan mediante `channels.signal.reactionNotifications`: `"off"` las desactiva, `"own"` (valor predeterminado) emite eventos cuando los usuarios reaccionan a mensajes del bot, y `"all"` emite eventos para todas las reacciones.

  </Accordion>
</AccordionGroup>

## Nivel de reacción

La configuración `reactionLevel` por canal controla con qué amplitud el agente usa reacciones. Los valores suelen ser `off`, `ack`, `minimal` o `extensive`.

- [reactionLevel de Telegram](/es/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel de WhatsApp](/es/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Establece `reactionLevel` en canales individuales para ajustar con qué actividad el agente reacciona a los mensajes en cada plataforma.

## Relacionado

- [Envío del agente](/es/tools/agent-send) — la herramienta `message` que incluye `react`
- [Canales](/es/channels) — configuración específica del canal
