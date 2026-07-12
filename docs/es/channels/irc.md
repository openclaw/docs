---
read_when:
    - Quieres conectar OpenClaw a canales de IRC o mensajes directos
    - Estás configurando listas de permitidos de IRC, políticas de grupo o el control de menciones
summary: Configuración del plugin de IRC, controles de acceso y solución de problemas
title: IRC
x-i18n:
    generated_at: "2026-07-11T22:51:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC cuando quieras utilizar OpenClaw en canales clásicos (`#room`) y mensajes directos.
Instala el Plugin oficial de IRC y configúralo en `channels.irc`.

## Inicio rápido

1. Instala el Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Configura al menos el host, el apodo y los canales a los que se unirá en `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Inicia o reinicia el Gateway:

```bash
openclaw gateway run
```

Para coordinar bots, es preferible utilizar un servidor IRC privado. Si utilizas intencionadamente una red IRC pública, algunas opciones habituales son Libera.Chat, OFTC y Snoonet. Evita los canales públicos predecibles para el tráfico interno de bots o enjambres.

## Ajustes de conexión

| Clave                         | Valor predeterminado           | Notas                                                               |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `host`                        | ninguno (obligatorio)          | Nombre de host del servidor IRC                                     |
| `port`                        | `6697` con TLS, `6667` sin TLS | 1-65535                                                             |
| `tls`                         | `true`                         | Establécelo en `false` solo si se desea intencionadamente texto plano |
| `nick`                        | ninguno (obligatorio)          | Apodo del bot                                                       |
| `username`                    | apodo o, en su defecto, `openclaw` | Nombre de usuario de IRC                                         |
| `realname`                    | `OpenClaw`                     | Campo de nombre real/GECOS                                          |
| `password` / `passwordFile`   | ninguno                        | Contraseña del servidor; el archivo debe ser un archivo normal      |
| `channels`                    | ninguno                        | Canales a los que unirse (`["#openclaw"]`)                          |
| `accounts` / `defaultAccount` | ninguno                        | Configuración de varias cuentas; las variables de entorno solo completan la cuenta predeterminada |

## Valores predeterminados de seguridad

- IRC utiliza sockets TCP/TLS sin procesar fuera del enrutamiento del proxy de reenvío administrado por el operador de OpenClaw. En implementaciones que exijan que todo el tráfico saliente pase por dicho proxy de reenvío, establece `channels.irc.enabled=false`, salvo que se haya aprobado explícitamente el tráfico IRC saliente directo.
- El valor predeterminado de `channels.irc.dmPolicy` es `"pairing"`: los remitentes desconocidos de mensajes directos reciben un código de vinculación que debes aprobar con `openclaw pairing approve irc <code>`.
- El valor predeterminado de `channels.irc.groupPolicy` es `"allowlist"`.
- Con `groupPolicy="allowlist"`, configura `channels.irc.groups` para definir los canales permitidos.
- Utiliza TLS (`channels.irc.tls=true`), salvo que aceptes intencionadamente el transporte en texto plano.

## Control de acceso

Hay dos «barreras» independientes para los canales IRC:

1. **Acceso al canal** (`groupPolicy` + `groups`): determina si el bot acepta mensajes de un canal.
2. **Acceso del remitente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): determina quién puede activar el bot dentro de ese canal.

Claves de configuración:

- Lista de permitidos de mensajes directos (acceso de remitentes de mensajes directos): `channels.irc.allowFrom`
- Lista de remitentes permitidos de grupos (acceso de remitentes del canal): `channels.irc.groupAllowFrom`
- Controles por canal (reglas de canal, remitente y mención): `channels.irc.groups["#channel"]` con `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` y `systemPrompt`
- `channels.irc.groupPolicy="open"` permite canales no configurados (**de forma predeterminada, siguen requiriendo una mención**)

Las entradas de la lista de permitidos deben utilizar identidades estables de remitente (`nick!user@host`).
La coincidencia únicamente por apodo es mutable y solo se habilita cuando `channels.irc.dangerouslyAllowNameMatching: true`.

### Error habitual: `allowFrom` es para mensajes directos, no para canales

Si ves registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa que el remitente no estaba permitido para los mensajes de **grupo/canal**. Para corregirlo:

- configura `channels.irc.groupAllowFrom` (global para todos los canales), o
- configura listas de remitentes permitidos por canal: `channels.irc.groups["#channel"].allowFrom`

Ejemplo (permitir que cualquier persona de `#openclaw` hable con el bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Activación de respuestas (menciones)

Aunque un canal esté permitido (mediante `groupPolicy` + `groups`) y el remitente también lo esté, de forma predeterminada OpenClaw **exige una mención** en contextos de grupo. Se considera que se ha mencionado al bot cuando el mensaje contiene el apodo conectado del bot o coincide con los patrones de mención configurados.

Esto significa que puedes ver registros como `drop channel … (missing-mention)`, salvo que el mensaje incluya un patrón de mención que coincida con el bot.

Para que el bot responda en un canal IRC **sin necesidad de una mención**, deshabilita el requisito de mención para ese canal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

O bien, para permitir **todos** los canales IRC (sin una lista de permitidos por canal) y seguir respondiendo sin menciones:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Nota de seguridad (recomendada para canales públicos)

Si permites `allowFrom: ["*"]` en un canal público, cualquiera podrá enviar instrucciones al bot.
Para reducir el riesgo, restringe las herramientas de ese canal.

### Las mismas herramientas para todos los usuarios del canal

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Herramientas diferentes según el remitente (el propietario obtiene más privilegios)

Utiliza `toolsBySender` para aplicar una política más estricta a `"*"` y otra menos restrictiva a tu apodo:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Notas:

- Las claves de `toolsBySender` deben utilizar prefijos explícitos (`channel:`, `id:`, `e164:`, `username:`, `name:`). Para IRC, utiliza `id:` con el valor de identidad del remitente: `id:alice` o `id:alice!~alice@203.0.113.7` para una coincidencia más estricta.
- Las claves heredadas sin prefijo siguen siendo válidas, solo se comparan como `id:` y generan una advertencia de obsolescencia.
- Se aplica la primera política de remitente que coincida; `"*"` es la alternativa comodín.

Para obtener más información sobre el acceso a grupos frente al requisito de mención (y cómo interactúan), consulta: [/channels/groups](/es/channels/groups).

## NickServ

Para identificarte con NickServ después de conectarte:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

De forma predeterminada, la identificación con NickServ se ejecuta siempre que se haya establecido una contraseña (`enabled` solo debe ser `false` para desactivarla). El valor predeterminado de `service` es `NickServ`; `passwordFile` es una alternativa a especificar `password` directamente.

Registro único opcional al conectarse (`register: true` requiere `registerEmail`):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Deshabilita `register` después de registrar el apodo para evitar intentos repetidos de REGISTER.

## Variables de entorno

La cuenta predeterminada admite:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separados por comas)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` no puede configurarse desde un archivo `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Solución de problemas

- Si el bot se conecta pero nunca responde en los canales, comprueba `channels.irc.groups` **y** si el requisito de mención está descartando mensajes (`missing-mention`). Si quieres que responda sin avisos directos, establece `requireMention:false` para el canal.
- Si falla el inicio de sesión, comprueba la disponibilidad del apodo y la contraseña del servidor.
- Si TLS falla en una red personalizada, comprueba el host, el puerto y la configuración del certificado.

## Contenido relacionado

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Vinculación](/es/channels/pairing) — autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento de los chats de grupo y requisito de mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y protección
