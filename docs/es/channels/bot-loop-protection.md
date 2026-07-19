---
read_when:
    - Configuración de mensajes de canal creados por bots
    - Ajuste de la protección contra bucles entre bots
sidebarTitle: Bot loop protection
summary: Valores predeterminados de protección contra bucles entre bots y anulaciones por canal
title: Protección contra bucles de bots
x-i18n:
    generated_at: "2026-07-19T01:46:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d59d3b48dd5506e774282b880334df8970b05c4d001261ff7107e8e1678894db
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw puede aceptar mensajes escritos por otros bots en canales compatibles con `allowBots`. Cuando esta ruta está habilitada, la protección contra bucles entre pares evita que dos identidades de bot se respondan entre sí indefinidamente.

La protección se aplica mediante el ejecutor central de respuestas entrantes. Cada canal compatible convierte su evento entrante en datos genéricos: cuenta o ámbito, id. de conversación, id. del bot remitente e id. del bot receptor. El núcleo realiza el seguimiento del par de participantes en ambas direcciones (de A a B y de B a A cuentan como el mismo par), aplica un límite de ventana deslizante y bloquea el par durante un periodo de espera después de que se supere el límite.

## Valores predeterminados

La protección contra bucles entre pares está activa siempre que un canal permita que los mensajes creados por bots lleguen al despacho. Valores predeterminados integrados:

| Clave                | Valor predeterminado | Significado                                                   |
| -------------------- | -------------------- | ------------------------------------------------------------- |
| `enabled`   | `true`   | Protección activa para los canales compatibles con ella.      |
| `maxEventsPerWindow`   | `20`   | Eventos que un par de bots puede intercambiar en la ventana.   |
| `windowSeconds`   | `60`   | Duración de la ventana deslizante.                             |
| `cooldownSeconds`   | `60`   | Tiempo de bloqueo después de que el par supere el límite.      |

La protección no afecta a los mensajes creados por personas, las implementaciones con un solo bot, el filtrado de mensajes propios ni las respuestas de bots que se mantienen por debajo del límite.

## Configurar valores predeterminados compartidos

Establezca `channels.defaults.botLoopProtection` una vez para proporcionar la misma configuración de referencia a todos los canales compatibles. Los canales también pueden ofrecer anulaciones más específicas; Feishu utiliza intencionadamente solo esta configuración compartida.

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

Establezca `enabled: false` solo cuando la política del canal permita intencionadamente conversaciones entre bots sin bloqueo automático.

## Anular por canal, cuenta o sala

Los canales compatibles superponen su propia configuración a los valores predeterminados compartidos, clave por clave. Precedencia, de más específica a menos específica:

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
          allowBots: true,
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

- Discord: datos nativos de `author.bot`, identificados por cuenta de Discord, canal y par de bots.
- Feishu: datos nativos de `sender_type=bot` para mensajes de grupo admitidos creados por bots, identificados por cuenta de Feishu, chat y par de bots. Feishu utiliza únicamente `channels.defaults.botLoopProtection`.
- Google Chat: datos nativos de `sender.type=BOT` para mensajes aceptados creados por bots, identificados por cuenta, espacio y par de bots.
- Matrix: cuentas de bot de Matrix configuradas, identificadas por cuenta de Matrix, sala y par de bots configurado.
- Slack: datos nativos de `bot_id` para mensajes aceptados creados por bots, identificados por cuenta de Slack, canal y par de bots.

Los canales que no proporcionan una identidad fiable del bot entrante siguen utilizando sus filtros habituales de mensajes propios y de políticas de acceso. No deben activar esta protección hasta que puedan identificar a ambos participantes del par de bots.

Consulte [el entorno de ejecución del SDK](/es/plugins/sdk-runtime#reusable-runtime-utilities) para obtener detalles sobre la implementación de plugins.
