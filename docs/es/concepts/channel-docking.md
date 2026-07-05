---
read_when:
    - Quieres que las respuestas de una sesión activa se trasladen de Telegram a Discord, Slack, Mattermost u otro canal vinculado.
    - Estás configurando session.identityLinks para mensajes directos entre canales
    - Un comando /dock indica que el remitente no está vinculado o que no existe ninguna sesión activa
summary: Mueve la ruta de respuesta de una sesión de OpenClaw entre canales de chat vinculados
title: Acoplamiento de canales
x-i18n:
    generated_at: "2026-07-05T11:13:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

El acoplamiento de canales es el desvío de llamadas para una sesión de OpenClaw. Mantiene el mismo
contexto de conversación, pero cambia dónde se entregan las respuestas futuras de esa sesión. El acoplamiento solo funciona desde un chat directo; no se ejecuta desde un chat de grupo.

## Ejemplo

Alice puede enviar mensajes a OpenClaw en Telegram y Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Si Alice envía esto desde un chat directo de Telegram:

```text
/dock_discord
```

OpenClaw conserva el contexto de la sesión actual y cambia la ruta de respuesta:

| Antes del acoplamiento            | Después de `/dock_discord`     |
| --------------------------------- | ------------------------------ |
| Las respuestas van a Telegram `123` | Las respuestas van a Discord `456` |

La sesión no se vuelve a crear. El historial de transcripción permanece adjunto a la
misma sesión.

## Por qué usarlo

Usa el acoplamiento cuando una tarea empieza en una aplicación de chat, pero las siguientes respuestas deben llegar
a otro lugar.

Flujo común:

1. Inicia una tarea de agente desde Telegram.
2. Muévete a Discord, donde estás coordinando el trabajo.
3. Envía `/dock_discord` desde el chat directo de Telegram.
4. Mantén la misma sesión de OpenClaw, pero recibe respuestas futuras en Discord.

## Configuración requerida

El acoplamiento requiere `session.identityLinks`. El remitente de origen y el par de destino
deben estar en el mismo grupo de identidad:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Los valores son ids de par con prefijo de canal:

| Valor          | Significado                      |
| -------------- | -------------------------------- |
| `telegram:123` | id de remitente de Telegram `123` |
| `discord:456`  | id de par directo de Discord `456` |
| `slack:U123`   | id de usuario de Slack `U123`    |

La clave canónica (`alice` arriba) es solo el nombre del grupo de identidad compartida. Los comandos de acoplamiento
usan los valores con prefijo de canal para demostrar que el remitente de origen y
el par de destino son la misma persona.

## Comandos

OpenClaw genera un comando `/dock-<channel>` para cada Plugin de canal cargado
que admite comandos nativos, por lo que la lista crece a medida que se agregan Plugins. Plugins incluidos
que lo admiten actualmente:

| Canal de destino | Comando            | Alias              |
| ---------------- | ------------------ | ------------------ |
| Discord          | `/dock-discord`    | `/dock_discord`    |
| Mattermost       | `/dock-mattermost` | `/dock_mattermost` |
| Slack            | `/dock-slack`      | `/dock_slack`      |
| Telegram         | `/dock-telegram`   | `/dock_telegram`   |

La forma con guion bajo también es el nombre de comando nativo en superficies como Telegram
que exponen comandos de barra directamente.

## Qué cambia

El acoplamiento actualiza los campos de entrega de la sesión activa:

| Campo de sesión | Ejemplo después de `/dock_discord`       |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | la cuenta del canal de destino, o `default` |

Esos campos se conservan en el almacén de sesiones y se usan para la entrega de respuestas
posterior de esa sesión.

## Qué no cambia

El acoplamiento no:

- crea cuentas de canal
- conecta un nuevo bot de Discord, Telegram, Slack o Mattermost
- concede acceso a un usuario
- omite listas de permitidos de canal ni políticas de DM
- mueve el historial de transcripción a otra sesión
- hace que usuarios no relacionados compartan una sesión

Solo cambia la ruta de entrega de la sesión actual.

## Solución de problemas

**El comando dice que el remitente no está vinculado.**

Agrega tanto el remitente actual como el par de destino al mismo grupo
`session.identityLinks`. Por ejemplo, si el remitente de Telegram `123` debe acoplarse
al par de Discord `456`, incluye tanto `telegram:123` como `discord:456`.

**El comando dice que el acoplamiento solo está disponible desde chats directos.**

Envía el comando de acoplamiento desde un chat directo con OpenClaw, no desde un chat de grupo.

**El comando dice que no existe ninguna sesión activa.**

Acopla desde una sesión existente de chat directo. El comando necesita una entrada de sesión activa
para poder conservar la nueva ruta.

**Las respuestas aún van al canal anterior.**

Comprueba que el comando respondió con un mensaje de éxito y confirma que el id del par de destino
coincide con el id usado por ese canal. El acoplamiento solo cambia la ruta de la sesión activa;
otra sesión puede seguir enrutándose a otro lugar.

**Necesito volver atrás.**

Envía el comando correspondiente para el canal original, como `/dock_telegram` o
`/dock-telegram`, desde un remitente vinculado.
