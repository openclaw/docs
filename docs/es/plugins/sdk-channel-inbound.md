---
read_when:
    - Se está creando o refactorizando la ruta de recepción de un plugin de canal de mensajería
    - Necesita una construcción compartida del contexto entrante, el registro de sesiones o el envío de respuestas preparadas
    - Estás migrando los antiguos auxiliares de turnos de canal a las API de entrada/mensajes
summary: 'Ayudantes de eventos entrantes para plugins de canal: creación de contexto, orquestación del ejecutor compartido, registro de sesión y envío de respuestas preparadas'
title: API de entrada del canal
x-i18n:
    generated_at: "2026-07-20T00:55:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f702019b0ee35055edd6fdbccc190eee66f35419d918c50076a005072d3f8ec
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Las rutas de recepción de los canales siguen un único flujo:

```text
evento de la plataforma -> hechos/contexto de entrada -> respuesta del agente -> entrega del mensaje
```

Use `openclaw/plugin-sdk/channel-inbound` para la normalización de eventos de entrada,
el formato, las raíces y la orquestación. Use
`openclaw/plugin-sdk/channel-outbound` para el envío nativo, la recepción, la entrega
duradera y el comportamiento de la vista previa en vivo.

## Utilidades principales

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: proyecta los hechos normalizados del canal
  en el contexto del prompt o de la sesión. Pase los metadatos del remitente y del chat
  que son propiedad del canal mediante `channelContext`, que los hooks del plugin ven como `ctx.channelContext`.
  Amplíe `PluginHookChannelSenderContext` o `PluginHookChannelChatContext`
  desde esta subruta para incluir campos específicos del canal.
- `runChannelInboundEvent(...)`: ejecuta la ingesta, clasificación, comprobación previa, resolución,
  registro, despacho y finalización de un evento entrante de la plataforma.
- `dispatchChannelInboundReply(...)`: registra y despacha una respuesta de entrada
  ya ensamblada mediante un adaptador de entrega.

Para eventos de entrada que solo contengan contenido multimedia, mantenga vacíos el cuerpo del mensaje y el texto del comando, y
pase un hecho `ChannelInboundMediaInput` por cada archivo adjunto nativo. Cuando una línea del
historial ambiental u otro contenedor exclusivamente textual deba describir esos hechos, use
`formatMediaPlaceholderText(media)`. Clasifica cada hecho a partir de `kind`, el tipo
MIME y, después, la extensión de la ruta o URL; los archivos adjuntos nativos no descargados también deben
aportar un hecho únicamente de tipo cada uno. No use el formateador para sintetizar el
cuerpo de entrada principal.

Los canales incluidos o nativos que ya reciben el objeto inyectado del entorno de ejecución del plugin
pueden invocar las mismas utilidades mediante `runtime.channel.inbound.*` en lugar de
importar directamente esta subruta:

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
de compatibilidad que mantienen la entrega de la plataforma en el adaptador de entrega. Las nuevas rutas de
envío deben usar adaptadores de mensajes y utilidades de mensajes duraderos de
`channel-outbound` en su lugar.

## Migración

Se eliminaron los alias de entorno de ejecución de `runtime.channel.turn.*`. Use:

- `runtime.channel.inbound.run(...)` para eventos de entrada sin procesar.
- `runtime.channel.inbound.dispatchReply(...)` para contextos de respuesta ensamblados.
- `runtime.channel.inbound.buildContext(...)` para cargas útiles del contexto de entrada.
- `runtime.channel.inbound.runPreparedReply(...)`, obsoleto, solo para
  rutas de despacho preparadas que son propiedad del canal y que ya ensamblan su propio
  cierre de despacho.

El código nuevo de plugins no debe introducir APIs de canal denominadas `turn`. Mantenga el vocabulario de turnos del modelo o
del agente dentro del código del agente o proveedor; los plugins de canal usan términos de entrada,
mensaje, entrega y respuesta.
