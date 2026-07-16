---
read_when:
    - Creación o migración de un plugin de canal de mensajería
    - Cambio de las listas de permitidos de mensajes directos o grupos, las puertas de enrutamiento, la autenticación de comandos, la autenticación de eventos o la activación mediante menciones
    - Revisión de la ocultación de datos en la entrada de canales o de los límites de compatibilidad del SDK
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canales para la autorización de mensajes entrantes
title: API de entrada de canales
x-i18n:
    generated_at: "2026-07-16T11:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

La entrada de canales es el límite experimental de control de acceso para los eventos
de canal entrantes. Los plugins controlan los hechos y efectos secundarios de la plataforma; el núcleo controla
la política genérica: listas de permitidos de mensajes directos/grupos, entradas de mensajes directos del almacén de emparejamiento, puertas de ruta,
puertas de comandos, autorización de eventos, activación por mención, diagnósticos con datos censurados y
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
El resolutor los deriva de las listas de permitidos sin procesar, las funciones de devolución del almacén, los descriptores
de ruta, los grupos de acceso, la política y el tipo de conversación.

## Resultado

Los plugins incluidos deben consumir directamente las proyecciones modernas:

| Campo              | Significado                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | decisión ordenada de las puertas y admisión                                |
| `senderAccess`     | solo autorización del remitente y de la conversación                             |
| `routeAccess`      | proyección de la ruta y del remitente de la ruta                                  |
| `commandAccess`    | autorización de comandos; `requested: false` cuando no se ejecutó ninguna puerta de comandos |
| `activationAccess` | resultado de mención/activación                                          |

La autorización de eventos sigue disponible en el elemento ordenado `ingress.graph` y en el
elemento decisivo `ingress.reasonCode`; no se emite ninguna proyección independiente de eventos.

Los auxiliares obsoletos del SDK para terceros pueden reconstruir internamente las estructuras anteriores. Las nuevas
rutas de recepción incluidas no deben volver a convertir los resultados modernos en
DTO locales.

## Grupos de acceso

Las entradas de `accessGroup:<name>` permanecen censuradas. El núcleo resuelve por sí mismo los grupos
estáticos `message.senders` y llama a `resolveAccessGroupMembership` únicamente
para los grupos dinámicos que requieren una consulta a la plataforma. Los grupos ausentes, no compatibles o
con errores se deniegan de forma predeterminada.

## Modos de evento

| `authMode`       | Significado                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | puertas normales para remitentes entrantes                      |
| `command`        | puertas de comandos para funciones de devolución o botones con ámbito    |
| `origin-subject` | el actor debe coincidir con el sujeto del mensaje original    |
| `route-only`     | puertas de ruta únicamente para eventos de confianza con ámbito de ruta |
| `none`           | los eventos internos controlados por el plugin omiten la autorización compartida  |

Use `mayPair: false` para reacciones, botones, funciones de devolución y comandos nativos.

## Rutas y activación

Use descriptores de ruta para la política de salas, temas, servidores, hilos o rutas anidadas:

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

Use `channelIngressRoutes(...)` cuando un plugin tenga varios descriptores de ruta
opcionales; filtra las ramas deshabilitadas mientras mantiene los hechos de las rutas genéricos
y ordenados según el valor `precedence` de cada descriptor.

La comprobación de menciones es una puerta de activación. Una mención ausente devuelve
`admission: "skip"` para que el núcleo de turnos no procese un turno de solo observación.
La mayoría de los canales deben situar la activación después de las puertas de remitentes y comandos. Las superficies
de chat público que deban silenciar el tráfico sin menciones antes del ruido de las listas de permitidos
de remitentes pueden habilitar `activation.order: "before-sender"` cuando la omisión
mediante comandos de texto esté deshabilitada. Los canales con activación implícita, como las respuestas en
hilos de bots, pueden pasar `activation.allowedImplicitMentionKinds`; el valor proyectado
`activationAccess.shouldBypassMention` indica entonces cuándo un comando o una activación
implícita omitió el requisito de una mención explícita.

## Censura

Los valores sin procesar de los remitentes y las entradas sin procesar de las listas de permitidos solo sirven como datos de entrada del resolutor. No
deben aparecer en el estado resuelto, las decisiones, los diagnósticos, las instantáneas ni los
datos de compatibilidad. Use identificadores opacos de sujetos, entradas, rutas y
diagnósticos.

## Verificación

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
