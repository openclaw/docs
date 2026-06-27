---
read_when:
    - Quieres conectar OpenClaw a canales de IRC o MDs
    - Estás configurando listas de permitidos de IRC, políticas de grupo o control de menciones
summary: Configuración del Plugin de IRC, controles de acceso y solución de problemas
title: IRC
x-i18n:
    generated_at: "2026-06-27T10:39:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
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

2. Habilita la configuración de IRC en `~/.openclaw/openclaw.json`.
3. Define al menos:

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

Prefiere un servidor IRC privado para la coordinación de bots. Si usas intencionalmente una red IRC pública, algunas opciones comunes incluyen Libera.Chat, OFTC y Snoonet. Evita canales públicos predecibles para el tráfico de canal secundario de bots o enjambres.

4. Inicia/reinicia Gateway:

```bash
openclaw gateway run
```

## Valores predeterminados de seguridad

- IRC usa sockets TCP/TLS sin procesar fuera del enrutamiento del proxy de reenvío administrado por el operador de OpenClaw. En implementaciones que requieren que todo el tráfico saliente pase por ese proxy de reenvío, define `channels.irc.enabled=false` salvo que la salida directa de IRC esté aprobada explícitamente.
- `channels.irc.dmPolicy` tiene como valor predeterminado `"pairing"`.
- `channels.irc.groupPolicy` tiene como valor predeterminado `"allowlist"`.
- Con `groupPolicy="allowlist"`, define `channels.irc.groups` para indicar los canales permitidos.
- Usa TLS (`channels.irc.tls=true`) salvo que aceptes intencionalmente transporte en texto plano.

## Control de acceso

Hay dos "puertas" separadas para los canales IRC:

1. **Acceso al canal** (`groupPolicy` + `groups`): si el bot acepta mensajes de un canal.
2. **Acceso del remitente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quién tiene permitido activar el bot dentro de ese canal.

Claves de configuración:

- Lista de permitidos de MD (acceso de remitente de MD): `channels.irc.allowFrom`
- Lista de permitidos de remitentes de grupo (acceso de remitente de canal): `channels.irc.groupAllowFrom`
- Controles por canal (reglas de canal + remitente + mención): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canales no configurados (**aun así, con puerta de mención de forma predeterminada**)

Las entradas de la lista de permitidos deben usar identidades de remitente estables (`nick!user@host`).
La coincidencia solo por nick es mutable y solo se habilita cuando `channels.irc.dangerouslyAllowNameMatching: true`.

### Error común: `allowFrom` es para MD, no para canales

Si ves registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa que el remitente no estaba permitido para mensajes de **grupo/canal**. Corrígelo de una de estas formas:

- definiendo `channels.irc.groupAllowFrom` (global para todos los canales), o
- definiendo listas de permitidos de remitentes por canal: `channels.irc.groups["#channel"].allowFrom`

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

Incluso si un canal está permitido (mediante `groupPolicy` + `groups`) y el remitente está permitido, OpenClaw usa de forma predeterminada una **puerta por mención** en contextos de grupo.

Eso significa que puedes ver registros como `drop channel … (missing-mention)` salvo que el mensaje incluya un patrón de mención que coincida con el bot.

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

O, para permitir **todos** los canales IRC (sin lista de permitidos por canal) y aun así responder sin menciones:

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

Usa `toolsBySender` para aplicar una política más estricta a `"*"` y una más laxa a tu nick:

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

- Las claves de `toolsBySender` deben usar `id:` para los valores de identidad de remitente de IRC:
  `id:eigen` o `id:eigen!~eigen@174.127.248.171` para una coincidencia más sólida.
- Las claves heredadas sin prefijo aún se aceptan y se hacen coincidir solo como `id:`.
- Gana la primera política de remitente coincidente; `"*"` es el comodín de reserva.

Para obtener más información sobre el acceso de grupo frente a la puerta por mención (y cómo interactúan), consulta: [/channels/groups](/es/channels/groups).

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

Deshabilita `register` después de que el nick esté registrado para evitar intentos REGISTER repetidos.

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

`IRC_HOST` no se puede definir desde un archivo `.env` de espacio de trabajo; consulta [archivos `.env` de espacio de trabajo](/es/gateway/security).

## Solución de problemas

- Si el bot se conecta pero nunca responde en canales, verifica `channels.irc.groups` **y** si la puerta por mención está descartando mensajes (`missing-mention`). Si quieres que responda sin pings, define `requireMention:false` para el canal.
- Si falla el inicio de sesión, verifica la disponibilidad del nick y la contraseña del servidor.
- Si TLS falla en una red personalizada, verifica el host/puerto y la configuración del certificado.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales admitidos
- [Pairing](/es/channels/pairing) — autenticación por MD y flujo de pairing
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y puerta de mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y hardening
