---
read_when:
    - Configuración de mensajes de canal redactados por bots
    - Ajuste de la protección contra bucles entre bots
sidebarTitle: Bot loop protection
summary: Valores predeterminados de protección contra bucles de bot a bot y anulaciones de canal
title: Protección contra bucles del bot
x-i18n:
    generated_at: "2026-06-27T10:35:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Protección contra bucles de bots

OpenClaw puede aceptar mensajes escritos por otros bots en canales que admiten `allowBots`.
Cuando esa ruta está habilitada, la protección contra bucles por pares impide que dos identidades de bot
se respondan entre sí indefinidamente.

La guarda la aplica el ejecutor central de respuestas entrantes. Cada canal compatible
mapea su propio evento entrante a datos genéricos: cuenta o alcance, id de conversación,
id del bot remitente e id del bot receptor. Luego, el núcleo rastrea el par de participantes en ambas
direcciones, aplica un presupuesto de ventana deslizante y suprime el par durante un
periodo de enfriamiento después de que se supera el presupuesto.

## Valores predeterminados

La protección contra bucles por pares está activa cuando un canal permite que mensajes escritos por bots lleguen al
despacho. Los valores predeterminados integrados son:

- `maxEventsPerWindow: 20` - un par de bots puede intercambiar 20 eventos dentro de la ventana
- `windowSeconds: 60` - duración de la ventana deslizante
- `cooldownSeconds: 60` - tiempo de supresión después de que el par supera el presupuesto

La guarda no afecta a los mensajes normales escritos por humanos, despliegues con un solo bot,
el filtrado de mensajes propios ni las respuestas puntuales de bots que permanecen por debajo del presupuesto.

## Configurar valores predeterminados compartidos

Define `channels.defaults.botLoopProtection` una vez para dar a todos los canales compatibles
la misma línea base. Las anulaciones de canal y cuenta aún pueden ajustar superficies
individuales.

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

Define `enabled: false` solo cuando la política de tu canal permite intencionalmente
conversaciones de bot a bot sin supresión automática.

## Anular por canal o cuenta

Los canales compatibles superponen su propia configuración sobre el valor predeterminado compartido. La precedencia es:

- `channels.<channel>.<room-or-space>.botLoopProtection`, cuando el canal admite anulaciones por conversación
- `channels.<channel>.accounts.<account>.botLoopProtection`, cuando el canal admite cuentas
- `channels.<channel>.botLoopProtection`, cuando el canal admite valores predeterminados de nivel superior
- `channels.defaults.botLoopProtection`
- valores predeterminados integrados

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## Compatibilidad de canales

- Discord: datos nativos de `author.bot`, indexados por cuenta de Discord, canal y par de bots.
- Slack: datos nativos de `bot_id` para mensajes aceptados escritos por bots, indexados por cuenta de Slack, canal y par de bots.
- Matrix: cuentas de bot de Matrix configuradas, indexadas por cuenta de Matrix, sala y par de bots configurado.
- Google Chat: datos nativos de `sender.type=BOT` para mensajes aceptados escritos por bots, indexados por cuenta, espacio y par de bots.

Los canales que no exponen una identidad de bot entrante fiable siguen usando sus
filtros normales de mensajes propios y políticas de acceso. No deberían optar por esta
guarda hasta que puedan identificar a ambos participantes del par de bots.

Consulta [tiempo de ejecución del SDK](/es/plugins/sdk-runtime#reusable-runtime-utilities) para obtener detalles de implementación de Plugin.
