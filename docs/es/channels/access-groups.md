---
read_when:
    - Configurar la misma lista de permitidos en varios canales de mensajes
    - Reglas para compartir el acceso de remitentes de mensajes directos y grupos
    - Revisión del control de acceso del canal de mensajes
summary: Listas de remitentes permitidos reutilizables para canales de mensajes
title: Grupos de acceso
x-i18n:
    generated_at: "2026-07-05T11:01:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Los grupos de acceso son listas de remitentes con nombre que defines una vez en `accessGroups` y referencias desde listas de permitidos de canales con `accessGroup:<name>`.

Úsalos cuando las mismas personas deban estar permitidas en varios canales de mensajes, o cuando un conjunto de confianza deba aplicarse tanto a la autorización de remitentes de MD como de grupos.

Un grupo no concede nada por sí solo. Solo importa donde un campo de lista de permitidos lo referencia.

## Grupos estáticos de remitentes de mensajes

Los grupos estáticos de remitentes usan `type: "message.senders"`. `members` usa como claves el id del canal de mensajes, además de `"*"` para entradas compartidas por todos los canales:

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

| Clave                      | Significado                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `"*"`                      | Entradas compartidas que se comprueban para cada canal de mensajes que referencia el grupo. |
| `discord`, `telegram`, ... | Entradas comprobadas solo para la coincidencia de lista de permitidos de ese canal. |

Las entradas se comparan con las reglas normales de `allowFrom` del canal de destino. OpenClaw no traduce ids de remitente entre canales: si Alicia tiene un id de Telegram y un id de Discord, lista ambos ids bajo las claves de canal correspondientes.

## Referenciar grupos desde listas de permitidos

Referencia un grupo con `accessGroup:<name>` en cualquier lugar donde la ruta del canal de mensajes admita listas de permitidos de remitentes.

Ejemplo de lista de permitidos de MD:

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
      groups: {
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

## Rutas de canales de mensajes compatibles

Los grupos de acceso funcionan en las rutas compartidas de autorización de canales de mensajes:

- listas de permitidos de remitentes de MD como `channels.<channel>.allowFrom`
- listas de permitidos de remitentes de grupo como `channels.<channel>.groupAllowFrom`
- listas de permitidos de remitentes por sala específicas de canal que usan las mismas reglas de coincidencia de remitentes (por ejemplo, Google Chat `groups.<space>.users`)
- rutas de autorización de comandos que reutilizan listas de permitidos de remitentes de canales de mensajes

La compatibilidad de canales depende de si ese canal está conectado mediante los helpers compartidos de autorización de remitentes de OpenClaw. La compatibilidad empaquetada actual incluye ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo y Zalo Personal. Los grupos estáticos `message.senders` son agnósticos al canal, por lo que los nuevos canales de mensajes los obtienen usando los helpers de ingreso del SDK de Plugin compartido en lugar de expansión personalizada de listas de permitidos.

## Audiencias de canal de Discord

Discord también admite un tipo dinámico de grupo de acceso:

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

`discord.channelAudience` significa "permitir remitentes de MD de Discord que actualmente pueden ver este canal del gremio". OpenClaw resuelve el remitente mediante Discord en el momento de la autorización y aplica las reglas de permiso `ViewChannel` de Discord. `membership` es opcional y su valor predeterminado es `canViewChannel`.

Usa esto cuando un canal de Discord ya sea la fuente de verdad para un equipo, como `#maintainers` o `#on-call`.

Requisitos y comportamiento ante fallos:

- El bot necesita acceso al gremio y al canal.
- El bot necesita **Server Members Intent** del Discord Developer Portal.
- El grupo de acceso falla en modo cerrado cuando Discord devuelve `Missing Access`, el remitente no puede resolverse como miembro del gremio o el canal pertenece a otro gremio.

Más ejemplos específicos de Discord: [control de acceso de Discord](/es/channels/discord#access-control-and-routing)

## Diagnósticos de Plugin

Los autores de Plugin pueden inspeccionar el estado estructurado de grupos de acceso sin expandirlo de nuevo a una lista de permitidos plana:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

El resultado informa grupos referenciados, coincidentes, ausentes, no compatibles y fallidos. Úsalo para diagnósticos o pruebas de conformidad. Usa `expandAllowFromWithAccessGroups(...)` solo para rutas de compatibilidad que todavía esperan un array `allowFrom` plano.

## Notas de seguridad

- Los grupos de acceso son alias de listas de permitidos, no roles. No crean propietarios, aprueban solicitudes de emparejamiento ni conceden permisos de herramientas por sí mismos.
- `dmPolicy: "open"` sigue requiriendo `"*"` en la lista de permitidos efectiva de MD. Referenciar un grupo de acceso no es lo mismo que acceso público.
- Los nombres de grupo ausentes fallan en modo cerrado. Si `allowFrom` contiene `accessGroup:operators` y `accessGroups.operators` está ausente, esa entrada no autoriza a nadie.
- Mantén estables los ids de canal. Prefiere ids numéricos/de usuario sobre nombres visibles cuando el canal admita ambos.

## Solución de problemas

Si un remitente debería coincidir pero está bloqueado:

1. Confirma que el campo de lista de permitidos contiene la referencia exacta `accessGroup:<name>`.
2. Confirma que `accessGroups.<name>.type` es correcto.
3. Confirma que el id del remitente aparece bajo la clave de canal correspondiente, o bajo `"*"`.
4. Confirma que la entrada usa la sintaxis normal de lista de permitidos de ese canal.
5. Para audiencias de canal de Discord, confirma que el bot puede ver el canal del gremio y tiene Server Members Intent habilitado.

Ejecuta `openclaw doctor` después de editar la configuración de control de acceso. Detecta muchas combinaciones inválidas de listas de permitidos y políticas antes del tiempo de ejecución.
