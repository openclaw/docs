---
read_when:
    - Quieres conectar OpenClaw con canales de IRC o mensajes directos
    - Está configurando listas de permitidos de IRC, políticas de grupo o control de menciones
summary: Configuración del Plugin de IRC, controles de acceso y solución de problemas
title: IRC
x-i18n:
    generated_at: "2026-05-06T09:02:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7de49784dec1b6a21a5a65b298552c66ce82543e3f0a7075abedb442b4ebff7e
    source_path: channels/irc.md
    workflow: 16
---

Usa IRC cuando quieras OpenClaw en canales clásicos (`#room`) y mensajes directos.
IRC se incluye como Plugin empaquetado, pero se configura en la configuración principal bajo `channels.irc`.

## Inicio rápido

1. Habilita la configuración de IRC en `~/.openclaw/openclaw.json`.
2. Define al menos:

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

Prefiere un servidor IRC privado para la coordinación de bots. Si usas intencionalmente una red IRC pública, las opciones comunes incluyen Libera.Chat, OFTC y Snoonet. Evita canales públicos predecibles para tráfico de bots o de canal secundario de enjambre.

3. Inicia/reinicia el Gateway:

```bash
openclaw gateway run
```

## Valores predeterminados de seguridad

- IRC usa sockets TCP/TLS sin procesar fuera del enrutamiento del proxy de reenvío administrado por el operador de OpenClaw. En implementaciones que requieren que todo el tráfico saliente pase por ese proxy de reenvío, define `channels.irc.enabled=false` salvo que la salida directa de IRC esté aprobada explícitamente.
- `channels.irc.dmPolicy` tiene el valor predeterminado `"pairing"`.
- `channels.irc.groupPolicy` tiene el valor predeterminado `"allowlist"`.
- Con `groupPolicy="allowlist"`, define `channels.irc.groups` para especificar los canales permitidos.
- Usa TLS (`channels.irc.tls=true`) salvo que aceptes intencionalmente el transporte en texto plano.

## Control de acceso

Hay dos "puertas" separadas para canales IRC:

1. **Acceso al canal** (`groupPolicy` + `groups`): si el bot acepta mensajes de un canal.
2. **Acceso del remitente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quién puede activar el bot dentro de ese canal.

Claves de configuración:

- Lista de permitidos de DM (acceso de remitente por DM): `channels.irc.allowFrom`
- Lista de permitidos de remitentes de grupo (acceso de remitente de canal): `channels.irc.groupAllowFrom`
- Controles por canal (reglas de canal, remitente y mención): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canales no configurados (**aun así, con control por mención de forma predeterminada**)

Las entradas de la lista de permitidos deben usar identidades estables de remitente (`nick!user@host`).
La coincidencia solo por nick es mutable y solo se habilita cuando `channels.irc.dangerouslyAllowNameMatching: true`.

### Problema frecuente: `allowFrom` es para DM, no para canales

Si ves registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa que el remitente no estaba permitido para mensajes de **grupo/canal**. Arréglalo de una de estas formas:

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

Aunque un canal esté permitido (mediante `groupPolicy` + `groups`) y el remitente esté permitido, OpenClaw aplica de forma predeterminada **control por mención** en contextos de grupo.

Eso significa que puedes ver registros como `drop channel … (missing-mention)` salvo que el mensaje incluya un patrón de mención que coincida con el bot.

Para hacer que el bot responda en un canal IRC **sin necesitar una mención**, deshabilita el control por mención para ese canal:

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

## Nota de seguridad (recomendada para canales públicos)

Si permites `allowFrom: ["*"]` en un canal público, cualquiera puede enviar indicaciones al bot.
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

- Las claves de `toolsBySender` deben usar `id:` para valores de identidad de remitente IRC:
  `id:eigen` o `id:eigen!~eigen@174.127.248.171` para una coincidencia más fuerte.
- Las claves heredadas sin prefijo todavía se aceptan y solo se comparan como `id:`.
- La primera política de remitente que coincida gana; `"*"` es la alternativa comodín.

Para más información sobre acceso de grupo frente a control por mención (y cómo interactúan), consulta: [/channels/groups](/es/channels/groups).

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

Registro único opcional al conectarse:

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

`IRC_HOST` no puede definirse desde un archivo `.env` del espacio de trabajo; consulta [archivos `.env` del espacio de trabajo](/es/gateway/security).

## Solución de problemas

- Si el bot se conecta pero nunca responde en canales, verifica `channels.irc.groups` **y** si el control por mención está descartando mensajes (`missing-mention`). Si quieres que responda sin pings, define `requireMention:false` para el canal.
- Si el inicio de sesión falla, verifica la disponibilidad del nick y la contraseña del servidor.
- Si TLS falla en una red personalizada, verifica el host/puerto y la configuración del certificado.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
