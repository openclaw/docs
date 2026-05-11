---
read_when:
    - Crear o migrar un Plugin de canal de mensajería
    - Cambiar listas de permitidos de DM o grupos, controles de ruta, autenticación de comandos, autenticación de eventos o activación por mención
    - Revisión del ocultamiento de datos en el ingreso de canales o de los límites de compatibilidad del SDK
sidebarTitle: Channel Ingress
summary: API experimental de entrada de canal para la autorización de mensajes entrantes
title: API de entrada de canales
x-i18n:
    generated_at: "2026-05-11T20:46:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# API de ingreso de canales

El ingreso de canales es el límite experimental de control de acceso para eventos
entrantes de canales. Usa `openclaw/plugin-sdk/channel-ingress-runtime` para las rutas de recepción.
El subpath anterior `openclaw/plugin-sdk/channel-ingress` sigue exportado como una
fachada de compatibilidad obsoleta para plugins de terceros.

Los plugins son propietarios de los hechos de la plataforma y los efectos secundarios. Core es propietario de la política genérica: listas de permitidos de DM/grupos, entradas de DM del almacén de emparejamiento, puertas de ruta, puertas de comandos, autenticación de eventos,
activación por mención, diagnósticos redactados y admisión.

## Resolver en tiempo de ejecución

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

No calcules previamente listas de permitidos efectivas, propietarios de comandos ni grupos de comandos. El
resolver los deriva de listas de permitidos sin procesar, callbacks del almacén, descriptores de ruta,
grupos de acceso, política y tipo de conversación.

## Resultado

Los plugins incluidos deben consumir directamente las proyecciones modernas:

- `ingress`: decisión ordenada de puerta y admisión
- `senderAccess`: solo autorización de remitente/conversación
- `routeAccess`: proyección de ruta y remitente de ruta
- `commandAccess`: autorización de comando; falso cuando no se ejecutó ninguna puerta de comando
- `activationAccess`: resultado de mención/activación

La autorización de eventos sigue disponible en el `ingress.graph` ordenado y el
`ingress.reasonCode` decisivo; no se emite ninguna proyección de evento separada.

Los helpers obsoletos del SDK de terceros pueden reconstruir internamente formas anteriores. Las nuevas
rutas de recepción incluidas no deben volver a traducir resultados modernos a DTO locales.

## Grupos de acceso

Las entradas `accessGroup:<name>` permanecen redactadas. Core resuelve por sí mismo los grupos estáticos
`message.senders` y llama a `resolveAccessGroupMembership` solo
para grupos dinámicos que requieren una búsqueda en la plataforma. Los grupos ausentes, no admitidos y
fallidos fallan de forma cerrada.

## Modos de evento

| `authMode`       | Significado                                      |
| ---------------- | ------------------------------------------------ |
| `inbound`        | puertas normales de remitente entrante           |
| `command`        | puertas de comando para callbacks o botones con ámbito |
| `origin-subject` | el actor debe coincidir con el sujeto del mensaje original |
| `route-only`     | solo puertas de ruta para eventos confiables con ámbito de ruta |
| `none`           | los eventos internos propiedad del plugin omiten la autenticación compartida |

Usa `mayPair: false` para reacciones, botones, callbacks y comandos nativos.

## Rutas y activación

Usa descriptores de ruta para políticas de sala, tema, gremio, hilo o ruta anidada:

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

Usa `channelIngressRoutes(...)` cuando un plugin tenga varios descriptores de ruta
opcionales; filtra ramas deshabilitadas mientras mantiene los hechos de ruta genéricos y
ordenados por la `precedence` de cada descriptor.

La puerta de mención es una puerta de activación. Una mención no coincidente devuelve
`admission: "skip"` para que el kernel de turno no procese un turno solo de observación.
La mayoría de los canales deben dejar la activación después de las puertas de remitente y comando. Las
superficies de chat públicas que deban silenciar el tráfico no mencionado antes del ruido de la lista de permitidos de remitentes
pueden optar por `activation.order: "before-sender"` cuando la omisión por comando de texto
está deshabilitada. Los canales con activación implícita, como respuestas en hilos de bot,
pueden pasar `activation.allowedImplicitMentionKinds`; el
`activationAccess.shouldBypassMention` proyectado informa entonces cuándo la activación por comando o implícita
omitió una mención explícita.

## Redacción

Los valores sin procesar del remitente y las entradas sin procesar de la lista de permitidos son solo entradas del resolver. No deben
aparecer en el estado resuelto, decisiones, diagnósticos, snapshots ni
hechos de compatibilidad. Usa ids de sujeto opacos, ids de entrada, ids de ruta e
ids de diagnóstico.

## Verificación

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
