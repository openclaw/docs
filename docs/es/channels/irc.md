---
read_when:
    - Quieres conectar OpenClaw a canales o mensajes directos de IRC
    - Estás configurando listas de permitidos de IRC, políticas de grupo o restricción por menciones
summary: Configuración del Plugin de IRC, controles de acceso y solución de problemas
title: IRC
x-i18n:
    generated_at: "2026-04-24T05:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

Usa IRC cuando quieras OpenClaw en canales clásicos (`#room`) y mensajes directos.
IRC se distribuye como un Plugin incluido, pero se configura en la configuración principal bajo `channels.irc`.

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

Prefiere un servidor IRC privado para la coordinación del bot. Si intencionalmente usas una red IRC pública, algunas opciones comunes incluyen Libera.Chat, OFTC y Snoonet. Evita canales públicos predecibles para el tráfico de coordinación interna del bot o del enjambre.

3. Inicia o reinicia el Gateway:

```bash
openclaw gateway run
```

## Valores predeterminados de seguridad

- `channels.irc.dmPolicy` usa `"pairing"` de forma predeterminada.
- `channels.irc.groupPolicy` usa `"allowlist"` de forma predeterminada.
- Con `groupPolicy="allowlist"`, configura `channels.irc.groups` para definir los canales permitidos.
- Usa TLS (`channels.irc.tls=true`) salvo que aceptes intencionalmente transporte en texto plano.

## Control de acceso

Hay dos “puertas” separadas para los canales IRC:

1. **Acceso al canal** (`groupPolicy` + `groups`): si el bot acepta mensajes de un canal en absoluto.
2. **Acceso del remitente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quién puede activar el bot dentro de ese canal.

Claves de configuración:

- Lista de permitidos para DM (acceso del remitente en DM): `channels.irc.allowFrom`
- Lista de permitidos para remitentes de grupo (acceso del remitente en canal): `channels.irc.groupAllowFrom`
- Controles por canal (canal + remitente + reglas de mención): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canales no configurados (**aun así, con restricción por menciones de forma predeterminada**)

Las entradas de la lista de permitidos deben usar identidades estables del remitente (`nick!user@host`).
La coincidencia solo por nick es mutable y solo se habilita cuando `channels.irc.dangerouslyAllowNameMatching: true`.

### Error común: `allowFrom` es para DMs, no para canales

Si ves registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa que el remitente no estaba permitido para mensajes de **grupo/canal**. Corrígelo de una de estas formas:

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

## Activación de respuesta (menciones)

Aunque un canal esté permitido (mediante `groupPolicy` + `groups`) y el remitente esté permitido, OpenClaw usa de forma predeterminada la **restricción por menciones** en contextos de grupo.

Eso significa que puedes ver registros como `drop channel … (missing-mention)` a menos que el mensaje incluya un patrón de mención que coincida con el bot.

Para hacer que el bot responda en un canal IRC **sin necesitar una mención**, desactiva la restricción por menciones para ese canal:

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

O bien, para permitir **todos** los canales IRC (sin lista de permitidos por canal) y aun así responder sin menciones:

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

Si permites `allowFrom: ["*"]` en un canal público, cualquiera puede dar instrucciones al bot.
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

### Herramientas diferentes por remitente (el propietario obtiene más permisos)

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

- Las claves de `toolsBySender` deben usar `id:` para los valores de identidad de remitente IRC:
  `id:eigen` o `id:eigen!~eigen@174.127.248.171` para una coincidencia más fuerte.
- Las claves heredadas sin prefijo siguen siendo aceptadas y coinciden solo como `id:`.
- Gana la primera política de remitente que coincida; `"*"` es el comodín de respaldo.

Para más información sobre acceso de grupo frente a restricción por menciones (y cómo interactúan), consulta: [/channels/groups](/es/channels/groups).

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

Registro opcional una sola vez al conectarte:

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
- `IRC_CHANNELS` (separados por comas)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` no puede configurarse desde un `.env` del espacio de trabajo; consulta [archivos `.env` del espacio de trabajo](/es/gateway/security).

## Solución de problemas

- Si el bot se conecta pero nunca responde en canales, verifica `channels.irc.groups` **y** si la restricción por menciones está descartando mensajes (`missing-mention`). Si quieres que responda sin menciones directas, establece `requireMention:false` para el canal.
- Si el inicio de sesión falla, verifica la disponibilidad del nick y la contraseña del servidor.
- Si TLS falla en una red personalizada, verifica la configuración de host/puerto y del certificado.

## Relacionado

- [Resumen de canales](/es/channels): todos los canales compatibles
- [Pairing](/es/channels/pairing): autenticación por DM y flujo de Pairing
- [Grupos](/es/channels/groups): comportamiento del chat de grupo y restricción por menciones
- [Enrutamiento de canales](/es/channels/channel-routing): enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security): modelo de acceso y refuerzo de seguridad
