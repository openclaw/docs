---
read_when:
    - Estás creando o refactorizando una ruta de recepción de un plugin de canal de mensajería
    - Necesitas construcción de contexto entrante compartido, registro de sesiones o envío de respuestas preparadas
    - Estás migrando los antiguos helpers de turnos de canal a las API de entrada/mensajes
summary: 'Ayudantes de eventos entrantes para plugins de canal: construcción de contexto, orquestación del ejecutor compartido, registro de sesión y envío de respuestas preparadas'
title: API de entrada del canal
x-i18n:
    generated_at: "2026-06-27T12:26:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Los plugins de canal deben modelar las rutas de recepción con sustantivos de entrada y de mensaje:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Usa `openclaw/plugin-sdk/channel-inbound` para la normalización de eventos de entrada,
el formato, las raíces y la orquestación. Usa
`openclaw/plugin-sdk/channel-outbound` para el comportamiento nativo de
envío, acuse, entrega duradera y vista previa en vivo.

## Helpers principales

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: proyecta los datos normalizados del canal en
  el contexto de prompt/sesión. Usa `channelContext` para pasar metadatos de
  remitente/chat propiedad del canal al hook de plugin `ctx.channelContext`; amplía
  `PluginHookChannelSenderContext` o `PluginHookChannelChatContext` desde esta
  subruta para campos específicos del canal.
- `runChannelInboundEvent(...)`: ejecuta la ingesta, clasificación, preflight, resolución,
  registro, despacho y finalización de un evento de plataforma entrante.
- `dispatchChannelInboundReply(...)`: registra y despacha una respuesta entrante ya ensamblada
  con un adaptador de entrega.

El runtime de plugin inyectado expone los mismos helpers de alto nivel bajo
`runtime.channel.inbound.*` para canales empaquetados/nativos que ya reciben el
objeto de runtime.

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Los despachadores de compatibilidad deben ensamblar las entradas de `dispatchChannelInboundReply(...)`
y mantener la entrega de plataforma en el adaptador de entrega. Las nuevas rutas de envío deben
preferir adaptadores de mensaje y helpers de mensajes duraderos.

## Migración

Los alias antiguos de runtime `runtime.channel.turn.*` se eliminaron. Usa:

- `runtime.channel.inbound.run(...)` para eventos entrantes sin procesar.
- `runtime.channel.inbound.dispatchReply(...)` para contextos de respuesta ensamblados.
- `runtime.channel.inbound.buildContext(...)` para cargas útiles de contexto entrante.
- `runtime.channel.inbound.runPreparedReply(...)` solo para rutas de despacho preparadas propiedad del canal
  que ya ensamblan su propio cierre de despacho.

El código nuevo de plugin no debe introducir API de canal con nombre `turn`. Mantén el vocabulario de turno de modelo o
agente dentro del código de agente/proveedor; los plugins de canal usan términos de entrada,
mensaje, entrega y respuesta.
