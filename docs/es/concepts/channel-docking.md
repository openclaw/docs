---
read_when:
    - Quieres que las respuestas de una sesión activa pasen de Telegram a Discord, Slack, Mattermost u otro canal vinculado.
    - Estás configurando session.identityLinks para mensajes directos entre canales
    - Un comando /dock indica que el remitente no está vinculado o que no existe ninguna sesión activa
summary: Mover la ruta de respuesta de una sesión de OpenClaw entre canales de chat vinculados
title: Acoplamiento de canales
x-i18n:
    generated_at: "2026-07-11T23:02:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

El acoplamiento de canales es un desvío de llamadas para una sesión de OpenClaw. Mantiene el mismo
contexto de conversación, pero cambia el lugar donde se entregan las respuestas futuras de esa sesión.
El acoplamiento solo funciona desde un chat directo; no se ejecuta desde un chat
grupal.

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

| Antes del acoplamiento          | Después de `/dock_discord`        |
| ------------------------------- | --------------------------------- |
| Las respuestas van a Telegram `123` | Las respuestas van a Discord `456` |

La sesión no se vuelve a crear. El historial de la transcripción permanece asociado a la
misma sesión.

## Por qué usarlo

Use el acoplamiento cuando una tarea comience en una aplicación de chat, pero las siguientes respuestas deban llegar
a otro lugar.

Flujo habitual:

1. Inicie una tarea de agente desde Telegram.
2. Cambie a Discord, donde está coordinando el trabajo.
3. Envíe `/dock_discord` desde el chat directo de Telegram.
4. Mantenga la misma sesión de OpenClaw, pero reciba las respuestas futuras en Discord.

## Configuración necesaria

El acoplamiento requiere `session.identityLinks`. El remitente de origen y el interlocutor de destino
deben pertenecer al mismo grupo de identidad:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Los valores son identificadores de interlocutor con el prefijo del canal:

| Valor          | Significado                            |
| -------------- | -------------------------------------- |
| `telegram:123` | Id. de remitente de Telegram `123`     |
| `discord:456`  | Id. de interlocutor directo de Discord `456` |
| `slack:U123`   | Id. de usuario de Slack `U123`         |

La clave canónica (`alice` en el ejemplo anterior) es únicamente el nombre del grupo de identidad compartido. Los comandos de
acoplamiento usan los valores con el prefijo del canal para demostrar que el remitente de origen y el
interlocutor de destino son la misma persona.

## Comandos

OpenClaw genera un comando `/dock-<channel>` para cada Plugin de canal cargado
que admita comandos nativos, por lo que la lista crece a medida que se añaden plugins. Plugins
incluidos que lo admiten actualmente:

| Canal de destino | Comando            | Alias              |
| ---------------- | ------------------ | ------------------ |
| Discord          | `/dock-discord`    | `/dock_discord`    |
| Mattermost       | `/dock-mattermost` | `/dock_mattermost` |
| Slack            | `/dock-slack`      | `/dock_slack`      |
| Telegram         | `/dock-telegram`   | `/dock_telegram`   |

La forma con guion bajo también es el nombre del comando nativo en interfaces como Telegram,
que exponen directamente los comandos con barra diagonal.

## Qué cambia

El acoplamiento actualiza los campos de entrega de la sesión activa:

| Campo de sesión | Ejemplo después de `/dock_discord`      |
| --------------- | --------------------------------------- |
| `lastChannel`   | `discord`                               |
| `lastTo`        | `456`                                   |
| `lastAccountId` | la cuenta del canal de destino o `default` |

Esos campos se conservan en el almacén de sesiones y se usan para la entrega de
respuestas posteriores de esa sesión.

## Qué no cambia

El acoplamiento no:

- crea cuentas de canal
- conecta un nuevo bot de Discord, Telegram, Slack o Mattermost
- concede acceso a un usuario
- elude las listas de permitidos del canal ni las políticas de mensajes directos
- mueve el historial de la transcripción a otra sesión
- hace que usuarios no relacionados compartan una sesión

Solo cambia la ruta de entrega de la sesión actual.

## Solución de problemas

**El comando indica que el remitente no está vinculado.**

Añada tanto el remitente actual como el interlocutor de destino al mismo grupo de
`session.identityLinks`. Por ejemplo, si el remitente de Telegram `123` debe acoplarse
al interlocutor de Discord `456`, incluya tanto `telegram:123` como `discord:456`.

**El comando indica que el acoplamiento solo está disponible desde chats directos.**

Envíe el comando de acoplamiento desde un chat directo con OpenClaw, no desde un chat grupal.

**El comando indica que no existe ninguna sesión activa.**

Realice el acoplamiento desde una sesión existente de chat directo. El comando necesita una entrada de sesión
activa para poder conservar la nueva ruta.

**Las respuestas siguen llegando al canal anterior.**

Compruebe que el comando haya respondido con un mensaje de confirmación y confirme que el
id. del interlocutor de destino coincida con el id. usado por ese canal. El acoplamiento solo cambia la ruta de la
sesión activa; otra sesión puede seguir dirigiendo las respuestas a otro lugar.

**Necesito volver al canal anterior.**

Envíe el comando correspondiente al canal original, como `/dock_telegram` o
`/dock-telegram`, desde un remitente vinculado.
