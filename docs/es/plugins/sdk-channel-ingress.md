---
read_when:
    - Crear o migrar un plugin de canal de mensajería
    - Cambiar listas de permitidos de mensajes directos o grupos, controles de ruta, autenticación de comandos, autenticación de eventos o activación por mención
    - Revisión de la censura de datos sensibles en el ingreso de canales o de los límites de compatibilidad del SDK
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canales para la autorización de mensajes entrantes
title: API de entrada de canales
x-i18n:
    generated_at: "2026-07-05T11:32:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

La entrada de canal es el límite experimental de control de acceso para eventos
entrantes de canales. Los plugins son dueños de los hechos de plataforma y los
efectos secundarios; el núcleo es dueño de la política genérica: listas de
permitidos de DM/grupo, entradas de DM del almacén de emparejamiento, puertas de
ruta, puertas de comando, autenticación de eventos, activación por mención,
diagnósticos redactados y admisión.

Usa `openclaw/plugin-sdk/channel-ingress-runtime` para las nuevas rutas de recepción. La
subruta anterior `openclaw/plugin-sdk/channel-ingress` permanece exportada como una
fachada de compatibilidad obsoleta para plugins de terceros.

## Resolvedor de runtime

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

No precalcules listas de permitidos efectivas, dueños de comandos ni grupos de
comandos. El resolvedor los deriva de listas de permitidos sin procesar,
callbacks de almacén, descriptores de ruta, grupos de acceso, política y tipo de
conversación.

## Resultado

Los plugins incluidos deben consumir las proyecciones modernas directamente:

| Campo              | Significado                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | decisión de puerta ordenada y admisión                             |
| `senderAccess`     | solo autorización de remitente/conversación                        |
| `routeAccess`      | proyección de ruta y remitente de ruta                             |
| `commandAccess`    | autorización de comando; `requested: false` cuando no se ejecutó ninguna puerta de comando |
| `activationAccess` | resultado de mención/activación                                    |

La autorización de eventos sigue disponible en el `ingress.graph` ordenado y el
`ingress.reasonCode` decisivo; no se emite ninguna proyección de evento separada.

Los helpers obsoletos del SDK de terceros pueden reconstruir internamente formas
anteriores. Las nuevas rutas de recepción incluidas no deben traducir resultados
modernos de vuelta a DTO locales.

## Grupos de acceso

Las entradas `accessGroup:<name>` permanecen redactadas. El núcleo resuelve por
sí mismo los grupos estáticos `message.senders` y llama a
`resolveAccessGroupMembership` solo para grupos dinámicos que requieren una
búsqueda de plataforma. Los grupos ausentes, no admitidos y fallidos fallan de
forma cerrada.

## Modos de evento

| `authMode`       | Significado                                      |
| ---------------- | ------------------------------------------------ |
| `inbound`        | puertas normales de remitente entrante           |
| `command`        | puertas de comando para callbacks o botones con ámbito |
| `origin-subject` | el actor debe coincidir con el sujeto del mensaje original |
| `route-only`     | solo puertas de ruta para eventos confiables con ámbito de ruta |
| `none`           | eventos internos propiedad del plugin omiten la autenticación compartida |

Usa `mayPair: false` para reacciones, botones, callbacks y comandos nativos.

## Rutas y activación

Usa descriptores de ruta para políticas de sala, tema, guild, hilo o ruta
anidada:

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

Usa `channelIngressRoutes(...)` cuando un plugin tenga varios descriptores de
ruta opcionales; filtra las ramas deshabilitadas mientras mantiene los hechos de
ruta genéricos y ordenados por la `precedence` de cada descriptor.

La puerta de mención es una puerta de activación. Un fallo de mención devuelve
`admission: "skip"` para que el kernel de turnos no procese un turno solo de
observación. La mayoría de los canales deben dejar la activación después de las
puertas de remitente y comando. Las superficies de chat públicas que deben
silenciar el tráfico sin mención antes del ruido de la lista de permitidos del
remitente pueden optar por `activation.order: "before-sender"` cuando el bypass
de comandos de texto está deshabilitado. Los canales con activación implícita,
como respuestas en hilos de bot, pueden pasar
`activation.allowedImplicitMentionKinds`; la proyección
`activationAccess.shouldBypassMention` informa entonces cuándo un comando o una
activación implícita omitió una mención explícita.

## Redacción

Los valores de remitente sin procesar y las entradas de lista de permitidos sin
procesar son solo entradas del resolvedor. No deben aparecer en el estado
resuelto, decisiones, diagnósticos, instantáneas ni hechos de compatibilidad. Usa
ids opacos de sujeto, ids de entrada, ids de ruta e ids de diagnóstico.

## Verificación

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
