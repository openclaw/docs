---
read_when:
    - Creación o migración de un plugin de canal de mensajería
    - Cambio de listas de permitidos de mensajes directos o grupos, restricciones de enrutamiento, autorización de comandos, autorización de eventos o activación mediante menciones
    - Revisión de los límites de compatibilidad del SDK o de la ocultación de datos en la entrada de canales
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canales para la autorización de mensajes entrantes
title: API de entrada de canales
x-i18n:
    generated_at: "2026-07-11T23:22:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

La entrada de canales es el límite experimental de control de acceso para los eventos entrantes de canales. Los Plugins son responsables de los datos específicos de la plataforma y de los efectos secundarios; el núcleo es responsable de la política genérica: listas de permitidos de mensajes directos y grupos, entradas de mensajes directos del almacén de emparejamiento, controles de rutas, controles de comandos, autorización de eventos, activación por mención, diagnósticos censurados y admisión.

Use `openclaw/plugin-sdk/channel-ingress-runtime` para las nuevas rutas de recepción. La subruta anterior `openclaw/plugin-sdk/channel-ingress` continúa exportándose como una fachada de compatibilidad obsoleta para Plugins de terceros.

## Resolutor en tiempo de ejecución

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

No calcule previamente las listas de permitidos efectivas, los propietarios de comandos ni los grupos de comandos. El resolutor los deriva de las listas de permitidos sin procesar, las devoluciones de llamada del almacén, los descriptores de rutas, los grupos de acceso, la política y el tipo de conversación.

## Resultado

Los Plugins incluidos deben consumir directamente las proyecciones modernas:

| Campo              | Significado                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `ingress`          | decisión ordenada de los controles y admisión                               |
| `senderAccess`     | solo autorización del remitente y de la conversación                        |
| `routeAccess`      | proyección de la ruta y del remitente de la ruta                            |
| `commandAccess`    | autorización de comandos; `requested: false` si no se ejecutó ningún control de comandos |
| `activationAccess` | resultado de mención o activación                                            |

La autorización de eventos continúa disponible en el `ingress.graph` ordenado y en el `ingress.reasonCode` decisivo; no se emite ninguna proyección de eventos independiente.

Los auxiliares obsoletos del SDK para terceros pueden reconstruir internamente las estructuras anteriores. Las nuevas rutas de recepción incluidas no deben volver a convertir los resultados modernos en DTO locales.

## Grupos de acceso

Las entradas `accessGroup:<name>` permanecen censuradas. El núcleo resuelve por sí mismo los grupos estáticos `message.senders` y llama a `resolveAccessGroupMembership` únicamente para los grupos dinámicos que requieren una consulta a la plataforma. Los grupos ausentes, no compatibles o con errores deniegan el acceso de forma predeterminada.

## Modos de eventos

| `authMode`       | Significado                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `inbound`        | controles normales del remitente entrante                          |
| `command`        | controles de comandos para devoluciones de llamada o botones con ámbito |
| `origin-subject` | el actor debe coincidir con el sujeto del mensaje original         |
| `route-only`     | solo controles de rutas para eventos de confianza con ámbito de ruta |
| `none`           | los eventos internos gestionados por el Plugin omiten la autorización compartida |

Use `mayPair: false` para reacciones, botones, devoluciones de llamada y comandos nativos.

## Rutas y activación

Use descriptores de rutas para políticas de salas, temas, servidores, hilos o rutas anidadas:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Use `channelIngressRoutes(...)` cuando un Plugin tenga varios descriptores de rutas opcionales; filtra las ramas deshabilitadas mientras mantiene los datos de las rutas genéricos y ordenados según la `precedence` de cada descriptor.

El control de menciones es un control de activación. Una mención no detectada devuelve `admission: "skip"` para que el núcleo de turnos no procese un turno exclusivamente de observación. La mayoría de los canales deben mantener la activación después de los controles de remitente y comandos. Las superficies de chat públicas que deban silenciar el tráfico sin menciones antes del ruido de las listas de permitidos de remitentes pueden optar por `activation.order: "before-sender"` cuando la omisión mediante comandos de texto esté deshabilitada. Los canales con activación implícita, como las respuestas en hilos de bots, pueden pasar `activation.allowedImplicitMentionKinds`; la proyección `activationAccess.shouldBypassMention` indica entonces cuándo un comando o una activación implícita omitieron una mención explícita.

## Censura

Los valores sin procesar de los remitentes y las entradas sin procesar de las listas de permitidos son únicamente datos de entrada del resolutor. No deben aparecer en el estado resuelto, las decisiones, los diagnósticos, las instantáneas ni los datos de compatibilidad. Use identificadores opacos de sujetos, entradas, rutas y diagnósticos.

## Verificación

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
