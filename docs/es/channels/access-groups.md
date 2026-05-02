---
read_when:
    - Configurar la misma lista de permitidos en varios canales de mensajería
    - Reglas de acceso para compartir remitentes de mensajes directos y grupos
    - Revisión del control de acceso a los canales de mensajería
summary: Listas reutilizables de remitentes permitidos para canales de mensajes
title: Grupos de acceso
x-i18n:
    generated_at: "2026-05-02T05:20:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Los grupos de acceso son listas de remitentes con nombre que defines una vez y referencias desde las listas de permitidos de canales con `accessGroup:<name>`.

Úsalos cuando las mismas personas deban estar permitidas en varios canales de mensajes, o cuando un conjunto de confianza deba aplicarse tanto a la autorización de remitentes de DM como de grupo.

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
| `"*"`      | Entradas compartidas comprobadas para cada canal de mensajes que referencia el grupo. |
| `discord`  | Entradas comprobadas solo para coincidencias de lista de permitidos de Discord. |
| `telegram` | Entradas comprobadas solo para coincidencias de lista de permitidos de Telegram. |
| `whatsapp` | Entradas comprobadas solo para coincidencias de lista de permitidos de WhatsApp. |

Las entradas se comparan con las reglas normales de `allowFrom` del canal de destino. OpenClaw no traduce ids de remitente entre canales. Si Alice tiene un id de Telegram y un id de Discord, incluye ambos ids bajo las claves correspondientes.

## Referenciar grupos desde listas de permitidos

Referencia un grupo con `accessGroup:<name>` en cualquier lugar donde la ruta del canal de mensajes admita listas de permitidos de remitentes.

Ejemplo de lista de permitidos de DM:

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

## Rutas de canales de mensajes compatibles

Los grupos de acceso están disponibles en rutas compartidas de autorización de canales de mensajes, incluidas:

- listas de permitidos de remitentes de DM como `channels.<channel>.allowFrom`
- listas de permitidos de remitentes de grupo como `channels.<channel>.groupAllowFrom`
- listas de permitidos de remitentes por sala específicas del canal que usan las mismas reglas de coincidencia de remitentes
- rutas de autorización de comandos que reutilizan listas de permitidos de remitentes de canales de mensajes

La compatibilidad del canal depende de si ese canal está conectado mediante los helpers compartidos de autorización de remitentes de OpenClaw. La compatibilidad incluida actualmente abarca Discord, Google Chat, Nostr, WhatsApp, Zalo y Zalo Personal. Los grupos estáticos `message.senders` están diseñados para ser independientes del canal, por lo que los nuevos canales de mensajes deberían admitirlos usando los helpers compartidos del SDK de Plugin en lugar de una expansión personalizada de listas de permitidos.

## Audiencias de canal de Discord

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

`discord.channelAudience` significa "permitir remitentes de DM de Discord que actualmente pueden ver este canal del servidor." OpenClaw resuelve el remitente mediante Discord en el momento de la autorización y aplica las reglas del permiso `ViewChannel` de Discord.

Usa esto cuando un canal de Discord ya sea la fuente de verdad para un equipo, como `#maintainers` o `#on-call`.

Requisitos y comportamiento ante fallos:

- El bot necesita acceso al servidor y al canal.
- El bot necesita el **Server Members Intent** del Discord Developer Portal.
- El grupo de acceso falla cerrado cuando Discord devuelve `Missing Access`, el remitente no se puede resolver como miembro del servidor, o el canal pertenece a otro servidor.

Más ejemplos específicos de Discord: [Control de acceso de Discord](/es/channels/discord#access-control-and-routing)

## Notas de seguridad

- Los grupos de acceso son alias de listas de permitidos, no roles. No crean propietarios, aprueban solicitudes de emparejamiento ni conceden permisos de herramientas por sí mismos.
- `dmPolicy: "open"` sigue requiriendo `"*"` en la lista de permitidos de DM efectiva. Referenciar un grupo de acceso no es lo mismo que acceso público.
- Los nombres de grupo faltantes fallan cerrado. Si `allowFrom` contiene `accessGroup:operators` y `accessGroups.operators` no existe, esa entrada no autoriza a nadie.
- Mantén estables los ids de canal. Prefiere ids numéricos/de usuario frente a nombres visibles cuando el canal admita ambos.

## Solución de problemas

Si un remitente debería coincidir pero está bloqueado:

1. Confirma que el campo de lista de permitidos contiene la referencia exacta `accessGroup:<name>`.
2. Confirma que `accessGroups.<name>.type` es correcto.
3. Confirma que el id del remitente aparece bajo la clave de canal correspondiente, o bajo `"*"`.
4. Confirma que la entrada usa la sintaxis normal de lista de permitidos de ese canal.
5. Para audiencias de canal de Discord, confirma que el bot puede ver el canal del servidor y tiene habilitado Server Members Intent.

Ejecuta `openclaw doctor` después de editar la configuración de control de acceso. Detecta muchas combinaciones no válidas de listas de permitidos y políticas antes del tiempo de ejecución.
