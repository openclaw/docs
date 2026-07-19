---
read_when:
    - Quieres conectar OpenClaw a canales de IRC o mensajes directos.
    - Se están configurando listas de permitidos de IRC, políticas de grupo o filtros de menciones
summary: Configuración del plugin de IRC, controles de acceso y solución de problemas
title: IRC
x-i18n:
    generated_at: "2026-07-19T01:46:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85c3da80b45d6611872ddbd10b3be4a5742b46e355e8bb554353a478f2a1702f
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC cuando quieras utilizar OpenClaw en canales clásicos (`#room`) y mensajes directos.
Instala el plugin oficial de IRC y configúralo en `channels.irc`.

## Inicio rápido

1. Instala el plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Configura al menos el host, el apodo y los canales a los que se debe unir en `~/.openclaw/openclaw.json`:

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

Se recomienda usar un servidor IRC privado para coordinar bots. Si se utiliza intencionadamente una red IRC pública, algunas opciones habituales son Libera.Chat, OFTC y Snoonet. Evita canales públicos predecibles para el tráfico de canal secundario de bots o enjambres.

## Durabilidad de la entrada

OpenClaw escribe cada `PRIVMSG` de IRC aceptado en su cola de entrada duradera antes de las comprobaciones normales de políticas y del envío al agente. Los mensajes pendientes o que se pueden reintentar sobreviven a un reinicio del Gateway y permanecen serializados por canal o interlocutor de mensajes directos.

IRC no proporciona un identificador de entrega reproducible ni reenvía los mensajes que un cliente desconectado no haya recibido. Por lo tanto, OpenClaw asigna un identificador local que solo es estable durante la conexión TCP actual. La cola protege el intervalo local entre la aceptación y el envío; no puede recuperar un mensaje que nunca llegó a OpenClaw ni eliminar los duplicados de un reenvío del servidor entre conexiones.

## Ajustes de conexión

| Clave                         | Valor predeterminado          | Notas                                                       |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | ninguno (obligatorio)         | Nombre de host del servidor IRC                             |
| `port`                        | `6697` con TLS, `6667` sin cifrar | 1-65535                                                     |
| `tls`                         | `true`                        | Establece `false` solo para usar texto sin cifrar intencionadamente |
| `nick`                        | ninguno (obligatorio)         | Apodo del bot                                               |
| `username`                    | apodo; en su defecto, `openclaw` | Nombre de usuario de IRC                                    |
| `realname`                    | `OpenClaw`                    | Campo de nombre real/GECOS                                  |
| `password` / `passwordFile`   | ninguno                       | Contraseña del servidor; el archivo debe ser un archivo normal |
| `channels`                    | ninguno                       | Canales a los que unirse (`["#openclaw"]`)               |
| `accounts` / `defaultAccount` | ninguno                       | Configuración de varias cuentas; las variables de entorno solo completan la cuenta predeterminada |

## Valores de seguridad predeterminados

- IRC utiliza sockets TCP/TLS sin procesar fuera del enrutamiento mediante el proxy de reenvío gestionado por el operador de OpenClaw. En implementaciones que requieran dirigir todo el tráfico saliente a través de ese proxy de reenvío, establece `channels.irc.enabled=false` salvo que se haya aprobado explícitamente la salida directa de IRC.
- `channels.irc.dmPolicy` tiene como valor predeterminado `"pairing"`: los remitentes desconocidos de mensajes directos reciben un código de vinculación que se aprueba con `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` tiene como valor predeterminado `"allowlist"`.
- Con `groupPolicy="allowlist"`, establece `channels.irc.groups` para definir los canales permitidos.
- Usa TLS (`channels.irc.tls=true`) salvo que se acepte intencionadamente el transporte de texto sin cifrar.

## Control de acceso

Existen dos «puertas» independientes para los canales de IRC:

1. **Acceso al canal** (`groupPolicy` + `groups`): determina si el bot acepta mensajes de un canal.
2. **Acceso del remitente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): determina quién puede activar el bot dentro de ese canal.

Claves de configuración:

- Lista de permitidos de mensajes directos (acceso de remitentes de mensajes directos): `channels.irc.allowFrom`
- Lista de permitidos de remitentes de grupo (acceso de remitentes del canal): `channels.irc.groupAllowFrom`
- Controles por canal (reglas de canal, remitente y mención): `channels.irc.groups["#channel"]` con `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` y `systemPrompt`
- `channels.irc.groupPolicy="open"` permite canales sin configurar (**de forma predeterminada, siguen requiriendo una mención**)

Las entradas de la lista de permitidos deben utilizar identidades estables de remitentes (`nick!user@host`).
La coincidencia únicamente por apodo es mutable y solo se habilita cuando `channels.irc.dangerouslyAllowNameMatching: true`.

### Error habitual: `allowFrom` se aplica a los mensajes directos, no a los canales

Si aparecen registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa que el remitente no tenía permiso para enviar mensajes de **grupo/canal**. Para corregirlo:

- configura `channels.irc.groupAllowFrom` (global para todos los canales), o
- configura listas de permitidos de remitentes por canal: `channels.irc.groups["#channel"].allowFrom`

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

Aunque un canal esté permitido (mediante `groupPolicy` + `groups`) y el remitente tenga permiso, OpenClaw exige **una mención para activar respuestas** de forma predeterminada en contextos de grupo. Se considera que se ha mencionado al bot cuando el mensaje contiene el apodo del bot conectado o coincide con los patrones de mención configurados.

Por eso, pueden aparecer registros como `drop channel … (missing-mention)` salvo que el mensaje incluya un patrón de mención que coincida con el bot.

Para que el bot responda en un canal de IRC **sin necesidad de una mención**, desactiva el requisito de mención para ese canal:

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

También se pueden permitir **todos** los canales de IRC (sin una lista de permitidos por canal) y seguir respondiendo sin menciones:

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

Si se permite `allowFrom: ["*"]` en un canal público, cualquier persona puede enviar instrucciones al bot.
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

### Herramientas distintas según el remitente (el propietario obtiene más privilegios)

Usa `toolsBySender` para aplicar una política más estricta a `"*"` y otra menos restrictiva a tu apodo:

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

- Las claves de `toolsBySender` deben utilizar prefijos explícitos (`channel:`, `id:`, `e164:`, `username:`, `name:`). Para IRC, usa `id:` con el valor de identidad del remitente: `id:alice` o `id:alice!~alice@203.0.113.7` para obtener una coincidencia más sólida.
- Las claves heredadas sin prefijo siguen siendo válidas, se comparan únicamente como `id:` y generan una advertencia de obsolescencia.
- Se aplica la primera política de remitente que coincida; `"*"` es la alternativa comodín.

Para obtener más información sobre el acceso a grupos y el requisito de mención (y cómo interactúan), consulta: [/channels/groups](/es/channels/groups).

## NickServ

Para identificarse con NickServ después de conectarse:

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

De forma predeterminada, la identificación con NickServ se ejecuta siempre que haya una contraseña configurada (`enabled` solo debe establecerse en `false` para desactivarla). El valor predeterminado de `service` es `NickServ`; `passwordFile` es una alternativa a `password` en línea.

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

Desactiva `register` después de registrar el apodo para evitar intentos reiterados de REGISTER.

## Variables de entorno

La cuenta predeterminada admite:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separado por comas)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` no se puede configurar desde un `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Solución de problemas

- Si el bot se conecta pero nunca responde en los canales, comprueba `channels.irc.groups` **y** si el requisito de mención está descartando mensajes (`missing-mention`). Para que responda sin menciones, configura `requireMention:false` para el canal.
- Si falla el inicio de sesión, comprueba la disponibilidad del apodo y la contraseña del servidor.
- Si TLS falla en una red personalizada, comprueba el host, el puerto y la configuración del certificado.

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Vinculación](/es/channels/pairing) — autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento de los chats de grupo y requisito de mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
