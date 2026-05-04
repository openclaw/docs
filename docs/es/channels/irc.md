---
read_when:
    - Desea conectar OpenClaw a canales de IRC o mensajes directos
    - Estás configurando listas de permitidos de IRC, políticas de grupo o control de menciones
summary: Configuración del Plugin de IRC, controles de acceso y solución de problemas
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC cuando quieras usar OpenClaw en canales clásicos (`#room`) y mensajes directos.
IRC se incluye como Plugin incluido, pero se configura en la configuración principal bajo `channels.irc`.

## Inicio rápido

1. Habilita la configuración de IRC en `~/.openclaw/openclaw.json`.
2. Configura al menos:

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

Prefiere un servidor IRC privado para la coordinación de bots. Si usas intencionalmente una red IRC pública, las opciones comunes incluyen Libera.Chat, OFTC y Snoonet. Evita canales públicos predecibles para el tráfico de canal secundario de bots o enjambres.

3. Inicia/reinicia el Gateway:

```bash
openclaw gateway run
```

## Valores predeterminados de seguridad

- IRC usa sockets TCP/TLS sin procesar fuera del enrutamiento de proxy de reenvío administrado por operadores de OpenClaw. En despliegues que requieren que toda la salida pase por ese proxy de reenvío, configura `channels.irc.enabled=false` a menos que la salida directa de IRC esté explícitamente aprobada.
- `channels.irc.dmPolicy` tiene como valor predeterminado `"pairing"`.
- `channels.irc.groupPolicy` tiene como valor predeterminado `"allowlist"`.
- Con `groupPolicy="allowlist"`, configura `channels.irc.groups` para definir los canales permitidos.
- Usa TLS (`channels.irc.tls=true`) a menos que aceptes intencionalmente el transporte en texto claro.

## Control de acceso

Hay dos “puertas” separadas para los canales IRC:

1. **Acceso al canal** (`groupPolicy` + `groups`): si el bot acepta mensajes de un canal.
2. **Acceso del remitente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quién puede activar el bot dentro de ese canal.

Claves de configuración:

- Lista de permitidos para DM (acceso del remitente por DM): `channels.irc.allowFrom`
- Lista de permitidos de remitentes de grupo (acceso del remitente por canal): `channels.irc.groupAllowFrom`
- Controles por canal (reglas de canal + remitente + menciones): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canales no configurados (**aun así, con puerta por mención de forma predeterminada**)

Las entradas de la lista de permitidos deben usar identidades de remitente estables (`nick!user@host`).
La coincidencia solo por nick es mutable y solo se habilita cuando `channels.irc.dangerouslyAllowNameMatching: true`.

### Problema común: `allowFrom` es para DM, no para canales

Si ves registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…significa que el remitente no estaba permitido para mensajes de **grupo/canal**. Corrígelo de una de estas formas:

- configurando `channels.irc.groupAllowFrom` (global para todos los canales), o
- configurando listas de permitidos de remitentes por canal: `channels.irc.groups["#channel"].allowFrom`

Ejemplo (permitir que cualquiera en `#tuirc-dev` hable con el bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Activación de respuestas (menciones)

Aunque un canal esté permitido (mediante `groupPolicy` + `groups`) y el remitente esté permitido, OpenClaw usa de forma predeterminada una **puerta por mención** en contextos de grupo.

Eso significa que puedes ver registros como `drop channel … (missing-mention)` a menos que el mensaje incluya un patrón de mención que coincida con el bot.

Para hacer que el bot responda en un canal IRC **sin necesitar una mención**, deshabilita la puerta por mención para ese canal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
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
        "#tuirc-dev": {
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
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- Las claves de `toolsBySender` deben usar `id:` para valores de identidad de remitente de IRC:
  `id:eigen` o `id:eigen!~eigen@174.127.248.171` para una coincidencia más fuerte.
- Las claves heredadas sin prefijo todavía se aceptan y coinciden solo como `id:`.
- La primera política de remitente coincidente gana; `"*"` es la alternativa comodín.

Para obtener más información sobre acceso de grupo frente a puerta por mención (y cómo interactúan), consulta: [/channels/groups](/es/channels/groups).

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

Registro opcional de una sola vez al conectar:

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

Deshabilita `register` después de que el nick esté registrado para evitar intentos repetidos de REGISTER.

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

- Si el bot se conecta pero nunca responde en canales, verifica `channels.irc.groups` **y** si la puerta por mención está descartando mensajes (`missing-mention`). Si quieres que responda sin pings, configura `requireMention:false` para el canal.
- Si el inicio de sesión falla, verifica la disponibilidad del nick y la contraseña del servidor.
- Si TLS falla en una red personalizada, verifica el host/puerto y la configuración del certificado.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y puerta por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
