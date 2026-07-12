---
read_when:
    - Estás creando o refactorizando la ruta de recepción de un plugin de canal de mensajería
    - Necesitas una construcción compartida del contexto entrante, el registro de sesiones o el envío de respuestas preparadas.
    - Estás migrando los antiguos auxiliares de turnos de canal a las API de entrada/mensajes
summary: 'Utilidades de eventos entrantes para plugins de canal: creación de contexto, orquestación del ejecutor compartido, registro de sesión y envío de respuestas preparadas'
title: API de entrada del canal
x-i18n:
    generated_at: "2026-07-11T23:23:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Las rutas de recepción de los canales siguen un único flujo:

```text
evento de la plataforma -> hechos/contexto de entrada -> respuesta del agente -> entrega del mensaje
```

Use `openclaw/plugin-sdk/channel-inbound` para la normalización de eventos de entrada,
el formato, las raíces y la orquestación. Use
`openclaw/plugin-sdk/channel-outbound` para el envío nativo, la confirmación, la entrega
duradera y el comportamiento de la vista previa en tiempo real.

## Funciones auxiliares principales

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: proyecta los hechos normalizados del canal
  en el contexto del prompt y de la sesión. Pase los metadatos del remitente y del chat
  gestionados por el canal mediante `channelContext`, que los hooks del Plugin reciben
  como `ctx.channelContext`. Amplíe `PluginHookChannelSenderContext` o
  `PluginHookChannelChatContext` desde esta subruta para los campos específicos del canal.
- `runChannelInboundEvent(...)`: ejecuta la ingesta, clasificación, comprobación previa,
  resolución, registro, despacho y finalización de un evento de entrada de la plataforma.
- `dispatchChannelInboundReply(...)`: registra y despacha una respuesta de entrada ya
  ensamblada mediante un adaptador de entrega.

Los canales integrados o nativos que ya reciben el objeto inyectado del entorno de ejecución
del Plugin pueden invocar las mismas funciones auxiliares mediante
`runtime.channel.inbound.*`, en lugar de importar directamente esta subruta:

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

Ensamble las entradas de `dispatchChannelInboundReply(...)` para los despachadores
de compatibilidad que mantienen la entrega de la plataforma en el adaptador de entrega.
Las nuevas rutas de envío deben usar adaptadores de mensajes y funciones auxiliares
de mensajes duraderos de `channel-outbound`.

## Migración

Se eliminaron los alias de entorno de ejecución `runtime.channel.turn.*`. Use:

- `runtime.channel.inbound.run(...)` para eventos de entrada sin procesar.
- `runtime.channel.inbound.dispatchReply(...)` para contextos de respuesta ensamblados.
- `runtime.channel.inbound.buildContext(...)` para cargas útiles de contexto de entrada.
- `runtime.channel.inbound.runPreparedReply(...)`, obsoleto, solo para rutas de despacho
  preparado gestionadas por el canal que ya ensamblan su propio cierre de despacho.

El código nuevo de los Plugins no debe introducir API de canales con nombres basados
en `turn`. Mantenga la terminología de turnos del modelo o del agente dentro del código
del agente o proveedor; los Plugins de canal usan los términos entrada, mensaje, entrega
y respuesta.
