---
read_when:
    - Quieres conectar OpenClaw a canales IRC o mensajes directos
    - Está configurando listas de permitidos de IRC, política de grupo o control de menciones
summary: Configuración, controles de acceso y solución de problemas del plugin IRC
title: IRC
x-i18n:
    generated_at: "2026-07-05T11:01:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC cuando quieras OpenClaw en canales clásicos (`#room`) y mensajes directos.
Instala el Plugin oficial de IRC y luego configúralo en `channels.irc`.

## Inicio rápido

1. Instala el Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Define al menos el host, el nick y los canales a los que unirse en `~/.openclaw/openclaw.json`:

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

3. Inicia/reinicia el Gateway:

```bash
openclaw gateway run
```

Prefiere un servidor IRC privado para la coordinación de bots. Si usas intencionalmente una red IRC pública, las opciones habituales incluyen Libera.Chat, OFTC y Snoonet. Evita canales públicos predecibles para el tráfico de canal alternativo de bots o enjambres.

## Ajustes de conexión

| Clave                         | Predeterminado                | Notas                                                       |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | ninguno (obligatorio)         | Nombre de host del servidor IRC                             |
| `port`                        | `6697` con TLS, `6667` plano  | 1-65535                                                     |
| `tls`                         | `true`                        | Define `false` solo para texto plano intencional            |
| `nick`                        | ninguno (obligatorio)         | Nick del bot                                                |
| `username`                    | nick, si no `openclaw`        | Nombre de usuario de IRC                                    |
| `realname`                    | `OpenClaw`                    | Campo Realname/GECOS                                        |
| `password` / `passwordFile`   | ninguno                       | Contraseña del servidor; el archivo debe ser un archivo regular |
| `channels`                    | ninguno                       | Canales a los que unirse (`["#openclaw"]`)                  |
| `accounts` / `defaultAccount` | ninguno                       | Configuración multicuenta; las variables de entorno solo rellenan la cuenta predeterminada |

## Valores predeterminados de seguridad

- IRC usa sockets TCP/TLS sin procesar fuera del enrutamiento de proxy de reenvío administrado por el operador de OpenClaw. En despliegues que requieren que toda la salida pase por ese proxy de reenvío, define `channels.irc.enabled=false` a menos que la salida directa de IRC esté aprobada explícitamente.
- `channels.irc.dmPolicy` tiene como valor predeterminado `"pairing"`: los remitentes de MD desconocidos reciben un código de emparejamiento que apruebas con `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` tiene como valor predeterminado `"allowlist"`.
- Con `groupPolicy="allowlist"`, define `channels.irc.groups` para especificar los canales permitidos.
- Usa TLS (`channels.irc.tls=true`) a menos que aceptes intencionalmente transporte en texto plano.

## Control de acceso

Hay dos "puertas" separadas para los canales IRC:

1. **Acceso al canal** (`groupPolicy` + `groups`): si el bot acepta mensajes de un canal.
2. **Acceso del remitente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quién puede activar el bot dentro de ese canal.

Claves de configuración:

- Lista de permitidos para MD (acceso de remitentes de MD): `channels.irc.allowFrom`
- Lista de permitidos de remitentes de grupo (acceso de remitentes de canal): `channels.irc.groupAllowFrom`
- Controles por canal (reglas de canal + remitente + mención): `channels.irc.groups["#channel"]` con `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` y `systemPrompt`
- `channels.irc.groupPolicy="open"` permite canales no configurados (**aun así, con control por menciones de forma predeterminada**)

Las entradas de la lista de permitidos deben usar identidades de remitente estables (`nick!user@host`).
La coincidencia solo por nick es mutable y solo se habilita cuando `channels.irc.dangerouslyAllowNameMatching: true`.

### Problema común: `allowFrom` es para MD, no para canales

Si ves registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa que el remitente no estaba permitido para mensajes de **grupo/canal**. Corrígelo de una de estas formas:

- definiendo `channels.irc.groupAllowFrom` (global para todos los canales), o
- definiendo listas de remitentes permitidos por canal: `channels.irc.groups["#channel"].allowFrom`

Ejemplo (permitir que cualquiera en `#openclaw` hable con el bot):

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

Aunque un canal esté permitido (mediante `groupPolicy` + `groups`) y el remitente esté permitido, OpenClaw usa de forma predeterminada **control por menciones** en contextos de grupo. El bot cuenta como mencionado cuando el mensaje contiene el nick del bot conectado o coincide con tus patrones de mención configurados.

Eso significa que puedes ver registros como `drop channel … (missing-mention)` a menos que el mensaje incluya un patrón de mención que coincida con el bot.

Para hacer que el bot responda en un canal IRC **sin necesitar una mención**, desactiva el control por menciones para ese canal:

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

O para permitir **todos** los canales IRC (sin lista de permitidos por canal) y aun así responder sin menciones:

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

## Nota de seguridad (recomendado para canales públicos)

Si permites `allowFrom: ["*"]` en un canal público, cualquiera puede enviar prompts al bot.
Para reducir el riesgo, restringe las herramientas para ese canal.

### Las mismas herramientas para todos en el canal

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

### Herramientas diferentes por remitente (el propietario obtiene más poder)

Usa `toolsBySender` para aplicar una política más estricta a `"*"` y una más flexible a tu nick:

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

- Las claves de `toolsBySender` deben usar prefijos explícitos (`channel:`, `id:`, `e164:`, `username:`, `name:`). Para IRC, usa `id:` con el valor de identidad del remitente: `id:alice` o `id:alice!~alice@203.0.113.7` para una coincidencia más fuerte.
- Las claves heredadas sin prefijo todavía se aceptan, coinciden solo como `id:` y emiten una advertencia de obsolescencia.
- La primera política de remitente que coincida gana; `"*"` es la alternativa comodín.

Para más información sobre el acceso de grupo frente al control por menciones (y cómo interactúan), consulta: [/channels/groups](/es/channels/groups).

## NickServ

Para identificarte con NickServ después de conectar:

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

La identificación de NickServ se ejecuta de forma predeterminada siempre que se define una contraseña (`enabled` solo debe ser `false` para excluirse). `service` tiene como valor predeterminado `NickServ`; `passwordFile` es una alternativa a `password` en línea.

Registro opcional de una sola vez al conectar (`register: true` requiere `registerEmail`):

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

Desactiva `register` después de registrar el nick para evitar intentos repetidos de REGISTER.

## Variables de entorno

La cuenta predeterminada admite:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separadas por comas)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` no se puede definir desde un archivo `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Solución de problemas

- Si el bot se conecta pero nunca responde en canales, verifica `channels.irc.groups` **y** si el control por menciones está descartando mensajes (`missing-mention`). Si quieres que responda sin pings, define `requireMention:false` para el canal.
- Si el inicio de sesión falla, verifica la disponibilidad del nick y la contraseña del servidor.
- Si TLS falla en una red personalizada, verifica el host/puerto y la configuración del certificado.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación por MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
