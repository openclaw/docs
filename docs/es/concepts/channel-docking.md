---
read_when:
    - Quieres que las respuestas de una sesión activa pasen de Telegram a Discord, Slack, Mattermost u otro canal vinculado
    - Está configurando session.identityLinks para mensajes directos entre canales
    - Un comando /dock indica que el remitente no está vinculado o que no existe ninguna sesión activa
summary: Mover la ruta de respuesta de una sesión de OpenClaw entre canales de chat vinculados
title: Acoplamiento de canales
x-i18n:
    generated_at: "2026-04-30T05:36:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
    postprocess_version: locale-links-v1
---

El acoplamiento de canales es el reenvío de llamadas para una sesión de OpenClaw.

Mantiene el mismo contexto de conversación, pero cambia dónde se entregarán las respuestas futuras de
esa sesión.

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

Si Alice envía esto desde Telegram:

```text
/dock_discord
```

OpenClaw mantiene el contexto de la sesión actual y cambia la ruta de respuesta:

| Antes del acoplamiento       | Después de `/dock_discord`  |
| ---------------------------- | --------------------------- |
| Las respuestas van a Telegram `123` | Las respuestas van a Discord `456` |

La sesión no se vuelve a crear. El historial de la transcripción permanece adjunto a la
misma sesión.

## Por qué usarlo

Usa el acoplamiento cuando una tarea empieza en una aplicación de chat, pero las siguientes respuestas deben llegar
a otro lugar.

Flujo común:

1. Inicia una tarea de agente desde Telegram.
2. Muévete a Discord, donde estás coordinando el trabajo.
3. Envía `/dock_discord` desde la sesión de Telegram.
4. Mantén la misma sesión de OpenClaw, pero recibe las respuestas futuras en Discord.

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

Los valores son identificadores de pares con prefijo de canal:

| Valor          | Significado                  |
| -------------- | ---------------------------- |
| `telegram:123` | id de remitente de Telegram `123` |
| `discord:456`  | id de par directo de Discord `456` |
| `slack:U123`   | id de usuario de Slack `U123` |

La clave canónica (`alice` arriba) es solo el nombre del grupo de identidad compartido. Los comandos de acoplamiento
usan los valores con prefijo de canal para demostrar que el remitente de origen y
el par de destino son la misma persona.

## Comandos

Los comandos de acoplamiento se generan a partir de los plugins de canal cargados que admiten comandos
nativos. Comandos incluidos actuales:

| Canal de destino | Comando            | Alias              |
| -------------- | ------------------ | ------------------ |
| Discord        | `/dock-discord`    | `/dock_discord`    |
| Mattermost     | `/dock-mattermost` | `/dock_mattermost` |
| Slack          | `/dock-slack`      | `/dock_slack`      |
| Telegram       | `/dock-telegram`   | `/dock_telegram`   |

Los alias con guion bajo son útiles en superficies de comandos nativas como Telegram.

## Qué cambia

El acoplamiento actualiza los campos de entrega de la sesión activa:

| Campo de sesión | Ejemplo después de `/dock_discord`       |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | la cuenta del canal de destino, o `default` |

Esos campos se conservan en el almacén de sesiones y se usan para la entrega de respuestas
posteriores de esa sesión.

## Qué no cambia

El acoplamiento no:

- crea cuentas de canal
- conecta un nuevo bot de Discord, Telegram, Slack o Mattermost
- concede acceso a un usuario
- omite las listas de permitidos del canal ni las políticas de MD
- mueve el historial de transcripción a otra sesión
- hace que usuarios no relacionados compartan una sesión

Solo cambia la ruta de entrega de la sesión actual.

## Solución de problemas

**El comando dice que el remitente no está vinculado.**

Añade tanto el remitente actual como el par de destino al mismo grupo de
`session.identityLinks`. Por ejemplo, si el remitente de Telegram `123` debe acoplarse
al par de Discord `456`, incluye tanto `telegram:123` como `discord:456`.

**El comando dice que no existe ninguna sesión activa.**

Acopla desde una sesión existente de chat directo. El comando necesita una entrada de sesión activa
para poder conservar la nueva ruta.

**Las respuestas todavía van al canal anterior.**

Comprueba que el comando respondió con un mensaje de éxito y confirma que el id del par de destino
coincide con el id usado por ese canal. El acoplamiento solo cambia la ruta de la sesión
activa; otra sesión aún puede enrutar a otro lugar.

**Necesito volver a cambiar.**

Envía el comando correspondiente para el canal original, como `/dock_telegram` o
`/dock-telegram`, desde un remitente vinculado.
