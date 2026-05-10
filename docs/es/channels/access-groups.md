---
read_when:
    - Configurar la misma lista de permitidos en varios canales de mensajería
    - Reglas para compartir acceso de remitente en mensajes directos y grupos
    - Revisión del control de acceso del canal de mensajes
summary: Listas de remitentes permitidos reutilizables para canales de mensajería
title: Grupos de acceso
x-i18n:
    generated_at: "2026-05-10T19:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

Los grupos de acceso son listas de remitentes con nombre que defines una vez y referencias desde listas de permitidos de canales con `accessGroup:<name>`.

Úsalos cuando las mismas personas deban estar permitidas en varios canales de mensajes, o cuando un conjunto de confianza deba aplicarse tanto a la autorización de remitentes de mensajes directos como de grupos.

Los grupos de acceso no conceden acceso por sí mismos. Un grupo solo importa cuando un campo de lista de permitidos lo referencia.

## Grupos estáticos de remitentes de mensajes

Los grupos estáticos de remitentes usan `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Las listas de miembros se organizan por id de canal de mensajes:

| Clave      | Significado                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `"*"`      | Entradas compartidas que se comprueban para cada canal de mensajes que referencia el grupo. |
| `discord`  | Entradas que se comprueban solo para coincidencias de lista de permitidos de Discord. |
| `telegram` | Entradas que se comprueban solo para coincidencias de lista de permitidos de Telegram. |
| `whatsapp` | Entradas que se comprueban solo para coincidencias de lista de permitidos de WhatsApp. |

Las entradas se comparan con las reglas normales de `allowFrom` del canal de destino. OpenClaw no traduce ids de remitente entre canales. Si Alice tiene un id de Telegram y un id de Discord, enumera ambos ids bajo las claves correspondientes.

## Referenciar grupos desde listas de permitidos

Referencia un grupo con `accessGroup:<name>` en cualquier lugar donde la ruta del canal de mensajes admita listas de permitidos de remitentes.

Ejemplo de lista de permitidos de mensajes directos:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Ejemplo de lista de permitidos de remitentes de grupo:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Puedes mezclar grupos y entradas directas:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Rutas de canales de mensajes admitidas

Los grupos de acceso están disponibles en rutas compartidas de autorización de canales de mensajes, incluidas:

- listas de permitidos de remitentes de mensajes directos como `channels.<channel>.allowFrom`
- listas de permitidos de remitentes de grupo como `channels.<channel>.groupAllowFrom`
- listas de permitidos de remitentes por sala específicas del canal que usan las mismas reglas de coincidencia de remitentes
- rutas de autorización de comandos que reutilizan listas de permitidos de remitentes de canales de mensajes

La compatibilidad de cada canal depende de si ese canal está conectado mediante los helpers compartidos de autorización de remitentes de OpenClaw. La compatibilidad incluida actualmente abarca Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo y Zalo Personal. Los grupos estáticos `message.senders` están diseñados para ser independientes del canal, por lo que los canales de mensajes nuevos deberían admitirlos usando los helpers compartidos del SDK de Plugin en lugar de una expansión personalizada de listas de permitidos.

## Diagnósticos de Plugin

Los autores de Plugin pueden inspeccionar el estado estructurado de los grupos de acceso sin expandirlo de nuevo a una lista de permitidos plana:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

El resultado informa sobre grupos referenciados, coincidentes, ausentes, no admitidos y fallidos. Usa esto cuando necesites diagnósticos o pruebas de conformidad. Usa `expandAllowFromWithAccessGroups(...)` solo para rutas de compatibilidad que todavía esperan un arreglo `allowFrom` plano.

## Audiencias de canales de Discord

Discord también admite un tipo de grupo de acceso dinámico:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` significa "permitir remitentes de mensajes directos de Discord que actualmente pueden ver este canal de servidor". OpenClaw resuelve el remitente mediante Discord en el momento de la autorización y aplica las reglas de permiso `ViewChannel` de Discord.

Usa esto cuando un canal de Discord ya sea la fuente de verdad para un equipo, como `#maintainers` o `#on-call`.

Requisitos y comportamiento ante fallos:

- El bot necesita acceso al servidor y al canal.
- El bot necesita **Server Members Intent** en el Portal para desarrolladores de Discord.
- El grupo de acceso falla de forma cerrada cuando Discord devuelve `Missing Access`, el remitente no se puede resolver como miembro del servidor o el canal pertenece a otro servidor.

Más ejemplos específicos de Discord: [Control de acceso de Discord](/es/channels/discord#access-control-and-routing)

## Notas de seguridad

- Los grupos de acceso son alias de listas de permitidos, no roles. No crean propietarios, no aprueban solicitudes de emparejamiento ni conceden permisos de herramientas por sí mismos.
- `dmPolicy: "open"` todavía requiere `"*"` en la lista efectiva de permitidos de mensajes directos. Referenciar un grupo de acceso no equivale a acceso público.
- Los nombres de grupo ausentes fallan de forma cerrada. Si `allowFrom` contiene `accessGroup:operators` y `accessGroups.operators` está ausente, esa entrada no autoriza a nadie.
- Mantén estables los ids de canal. Prefiere ids numéricos/de usuario antes que nombres visibles cuando el canal admita ambos.

## Solución de problemas

Si un remitente debería coincidir pero está bloqueado:

1. Confirma que el campo de lista de permitidos contiene la referencia exacta `accessGroup:<name>`.
2. Confirma que `accessGroups.<name>.type` es correcto.
3. Confirma que el id del remitente está enumerado bajo la clave de canal correspondiente, o bajo `"*"`.
4. Confirma que la entrada usa la sintaxis normal de lista de permitidos de ese canal.
5. Para audiencias de canales de Discord, confirma que el bot puede ver el canal del servidor y que tiene habilitado Server Members Intent.

Ejecuta `openclaw doctor` después de editar la configuración de control de acceso. Detecta muchas combinaciones inválidas de listas de permitidos y políticas antes del tiempo de ejecución.
