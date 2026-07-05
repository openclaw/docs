---
read_when:
    - Está creando o refactorizando una ruta de recepción de un Plugin de canal de mensajería
    - Necesitas construcción compartida de contexto entrante, registro de sesiones o envío de respuestas preparadas
    - Estás migrando los antiguos helpers de turnos de canal a las API de entrada/mensajes
summary: 'Ayudantes de eventos entrantes para plugins de canal: creación de contexto, orquestación del ejecutor compartido, registro de sesión y envío de respuesta preparada'
title: API de entrada de canales
x-i18n:
    generated_at: "2026-07-05T11:36:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Las rutas de recepción de canales siguen un único flujo:

```text
evento de plataforma -> hechos/contexto de entrada -> respuesta del agente -> entrega de mensaje
```

Usa `openclaw/plugin-sdk/channel-inbound` para la normalización de eventos de entrada,
el formato, las raíces y la orquestación. Usa
`openclaw/plugin-sdk/channel-outbound` para el envío nativo, la recepción, la entrega
duradera y el comportamiento de vista previa en vivo.

## Ayudantes principales

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: proyecta hechos normalizados del canal
  en el contexto de prompt/sesión. Pasa los metadatos de remitente/chat propiedad
  del canal mediante `channelContext`, que los hooks del plugin ven como `ctx.channelContext`.
  Amplía `PluginHookChannelSenderContext` o `PluginHookChannelChatContext`
  desde esta subruta para campos específicos del canal.
- `runChannelInboundEvent(...)`: ejecuta ingestión, clasificación, verificación previa, resolución,
  registro, despacho y finalización para un evento de plataforma de entrada.
- `dispatchChannelInboundReply(...)`: registra y despacha una respuesta de entrada
  ya ensamblada con un adaptador de entrega.

Los canales empaquetados/nativos que ya reciben el objeto de runtime de plugin inyectado
pueden llamar a los mismos ayudantes en `runtime.channel.inbound.*` en lugar de
importar esta subruta directamente:

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

Ensambla las entradas de `dispatchChannelInboundReply(...)` para despachadores
de compatibilidad que mantienen la entrega de plataforma en el adaptador de entrega. Las nuevas rutas
de envío deberían usar adaptadores de mensaje y ayudantes de mensajes duraderos de
`channel-outbound`.

## Migración

Se eliminaron los alias de runtime `runtime.channel.turn.*`. Usa:

- `runtime.channel.inbound.run(...)` para eventos de entrada sin procesar.
- `runtime.channel.inbound.dispatchReply(...)` para contextos de respuesta ensamblados.
- `runtime.channel.inbound.buildContext(...)` para cargas útiles de contexto de entrada.
- `runtime.channel.inbound.runPreparedReply(...)`, obsoleto, solo para
  rutas de despacho preparado propiedad del canal que ya ensamblan su propio
  cierre de despacho.

El código de plugin nuevo no debería introducir APIs de canal con nombre `turn`. Mantén el vocabulario de turnos de modelo o
agente dentro del código de agente/proveedor; los plugins de canal usan términos de entrada,
mensaje, entrega y respuesta.
