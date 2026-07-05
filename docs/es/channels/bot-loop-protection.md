---
read_when:
    - Configuración de mensajes de canal creados por bots
    - Ajustar la protección contra bucles de bot a bot
sidebarTitle: Bot loop protection
summary: Protección predeterminada contra bucles de bot a bot y anulaciones de canal
title: Protección contra bucles de bot
x-i18n:
    generated_at: "2026-07-05T11:01:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw puede aceptar mensajes escritos por otros bots en canales que admiten `allowBots`. Cuando esa ruta está habilitada, la protección contra bucles por par evita que dos identidades de bot se respondan entre sí indefinidamente.

La protección la aplica el ejecutor central de respuestas entrantes. Cada canal compatible asigna su evento entrante a datos genéricos: cuenta o ámbito, id de conversación, id del bot remitente e id del bot receptor. El núcleo rastrea el par de participantes en ambas direcciones (A a B y B a A cuentan como el mismo par), aplica un presupuesto de ventana deslizante y suprime el par durante un periodo de enfriamiento después de que se supera el presupuesto.

## Valores predeterminados

La protección contra bucles por par está activa siempre que un canal permite que los mensajes escritos por bots lleguen al despacho. Valores predeterminados integrados:

| Clave                | Predeterminado | Significado                                               |
| -------------------- | -------------- | --------------------------------------------------------- |
| `enabled`            | `true`         | Protección activa para los canales que la admiten.        |
| `maxEventsPerWindow` | `20`           | Eventos que un par de bots puede intercambiar en la ventana. |
| `windowSeconds`      | `60`           | Duración de la ventana deslizante.                        |
| `cooldownSeconds`    | `60`           | Tiempo de supresión después de que el par supera el presupuesto. |

La protección no afecta a mensajes escritos por humanos, despliegues de un solo bot, filtrado de mensajes propios ni respuestas de bots que se mantienen por debajo del presupuesto.

## Configurar valores predeterminados compartidos

Configura `channels.defaults.botLoopProtection` una vez para dar a todos los canales compatibles la misma base. Las anulaciones de canal, cuenta y sala aún pueden ajustar superficies individuales.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Configura `enabled: false` solo cuando la política de tu canal permite intencionadamente conversaciones entre bots sin supresión automática.

## Anular por canal, cuenta o sala

Los canales compatibles superponen su propia configuración sobre el valor predeterminado compartido, clave por clave. Precedencia, de más estrecha a más amplia:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, cuando el canal admite anulaciones por conversación
2. `channels.<channel>.accounts.<account>.botLoopProtection`, cuando el canal admite cuentas
3. `channels.<channel>.botLoopProtection`, cuando el canal admite valores predeterminados de nivel superior
4. `channels.defaults.botLoopProtection`
5. valores predeterminados integrados

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Compatibilidad de canales

- Discord: datos nativos de `author.bot`, con clave por cuenta de Discord, canal y par de bots.
- Google Chat: datos nativos de `sender.type=BOT` para mensajes aceptados escritos por bots, con clave por cuenta, espacio y par de bots.
- Matrix: cuentas de bot de Matrix configuradas, con clave por cuenta de Matrix, sala y par de bots configurado.
- Slack: datos nativos de `bot_id` para mensajes aceptados escritos por bots, con clave por cuenta de Slack, canal y par de bots.

Los canales que no exponen una identidad de bot entrante fiable siguen usando sus filtros normales de mensajes propios y política de acceso. No deberían optar por esta protección hasta que puedan identificar a ambos participantes del par de bots.

Consulta [runtime del SDK](/es/plugins/sdk-runtime#reusable-runtime-utilities) para obtener detalles de implementación del plugin.
