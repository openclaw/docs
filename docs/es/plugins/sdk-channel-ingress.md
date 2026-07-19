---
read_when:
    - Creación o migración de un plugin de canal de mensajería
    - Cambiar las listas de permitidos de mensajes directos o grupos, las restricciones de enrutamiento, la autenticación de comandos, la autenticación de eventos o la activación mediante menciones
    - Revisión de los límites de compatibilidad del SDK o de la ocultación de datos en la entrada del canal
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canales para la autorización de mensajes entrantes
title: API de entrada de canales
x-i18n:
    generated_at: "2026-07-19T02:06:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60feecb7bcf203cf37d2543a7855e89b5bfb2eb9d8263d804219e140facb8fc6
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

El ingreso de canales es el límite experimental de control de acceso para los eventos
entrantes de canales. Los plugins son responsables de los datos de la plataforma y los efectos secundarios; el núcleo es responsable
de la política genérica: listas de permitidos de mensajes directos/grupos, entradas de mensajes directos del almacén de emparejamiento, controles de rutas,
controles de comandos, autorización de eventos, activación por mención, diagnósticos redactados y
admisión.

Use `openclaw/plugin-sdk/channel-ingress-runtime` para las rutas de recepción.

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

No calcule previamente las listas de permitidos efectivas, los propietarios de comandos ni los grupos de comandos.
El resolutor los deriva de las listas de permitidos sin procesar, las devoluciones de llamada del almacén, los descriptores
de rutas, los grupos de acceso, la política y el tipo de conversación.

## Resultado

Los plugins incluidos deben consumir directamente las proyecciones modernas:

| Campo              | Significado                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | decisión ordenada de los controles y admisión                                |
| `senderAccess`     | solo autorización del remitente/de la conversación                             |
| `routeAccess`      | proyección de la ruta y del remitente de la ruta                                  |
| `commandAccess`    | autorización de comandos; `requested: false` cuando no se ejecutó ningún control de comandos |
| `activationAccess` | resultado de mención/activación                                          |

La autorización de eventos sigue disponible en el `ingress.graph` ordenado y en el
`ingress.reasonCode` decisivo; no se emite ninguna proyección de eventos independiente.

Los ayudantes obsoletos del SDK de terceros pueden reconstruir internamente formas anteriores. Las nuevas
rutas de recepción incluidas no deben convertir los resultados modernos de nuevo en
DTO locales.

## Grupos de acceso

Las entradas de `accessGroup:<name>` permanecen redactadas. El núcleo resuelve por sí mismo los grupos
`message.senders` estáticos y llama a `resolveAccessGroupMembership` solo
para los grupos dinámicos que requieren una consulta a la plataforma. Los grupos ausentes, no compatibles o
fallidos deniegan el acceso.

## Modos de eventos

| `authMode`       | Significado                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | controles normales del remitente entrante                      |
| `command`        | controles de comandos para devoluciones de llamada o botones con ámbito    |
| `origin-subject` | el actor debe coincidir con el sujeto del mensaje original    |
| `route-only`     | controles de rutas solo para eventos de confianza con ámbito de ruta |
| `none`           | los eventos internos gestionados por el plugin omiten la autorización compartida  |

Use `mayPair: false` para reacciones, botones, devoluciones de llamada y comandos nativos.

## Rutas y activación

Use descriptores de rutas para la política de salas, temas, servidores, hilos o rutas anidadas:

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

Use `channelIngressRoutes(...)` cuando un plugin tenga varios descriptores de rutas
opcionales; filtra las ramas deshabilitadas mientras mantiene los datos de las rutas genéricos
y ordenados según el `precedence` de cada descriptor.

El control de menciones es un control de activación. Una mención ausente devuelve
`admission: "skip"` para que el núcleo de turnos no procese un turno solo de observación.
La mayoría de los canales deben situar la activación después de los controles de remitente y de comandos. Las superficies
de chat públicas que deban silenciar el tráfico sin menciones antes del ruido de las listas de permitidos
de remitentes pueden habilitar `activation.order: "before-sender"` cuando la omisión mediante comandos
de texto esté deshabilitada. Los canales con activación implícita, como las respuestas en hilos
de bots, resuelven `channels.defaults.implicitMentions` junto con las anulaciones de canal y cuenta
mediante `resolveChannelImplicitMentions(...)` y, después, pasan el resultado como
`activation.implicitMentions`. La proyección
`activationAccess.shouldBypassMention` indica cuándo un comando o una activación implícita
omitió una mención explícita.

## Redacción

Los valores sin procesar del remitente y las entradas sin procesar de las listas de permitidos son únicamente datos de entrada del resolutor. No
deben aparecer en el estado resuelto, las decisiones, los diagnósticos, las instantáneas ni
los datos de compatibilidad. Use identificadores opacos de sujetos, entradas, rutas y
diagnósticos.

## Verificación

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
