---
read_when:
    - Configurar la integración del chat de Twitch para OpenClaw
summary: Configuración e instalación del bot de chat de Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T05:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Compatibilidad con el chat de Twitch mediante conexión IRC. OpenClaw se conecta como un usuario de Twitch (cuenta del bot) para recibir y enviar mensajes en canales.

## Plugin incluido

Twitch se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación aparte.

Si estás en una compilación anterior o en una instalación personalizada que excluye Twitch, instálalo manualmente:

Instalar mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Twitch esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden agregarlo manualmente con los comandos anteriores.
2. Crea una cuenta de Twitch dedicada para el bot (o usa una cuenta existente).
3. Genera credenciales: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Selecciona **Bot Token**
   - Verifica que estén seleccionados los alcances `chat:read` y `chat:write`
   - Copia el **Client ID** y el **Access Token**
4. Busca tu ID de usuario de Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Configura el token:
   - Entorno: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo cuenta predeterminada)
   - O configuración: `channels.twitch.accessToken`
   - Si ambos están configurados, la configuración tiene prioridad (la variable de entorno es solo una alternativa para la cuenta predeterminada).
6. Inicia Gateway.

**⚠️ Importante:** Agrega control de acceso (`allowFrom` o `allowedRoles`) para evitar que usuarios no autorizados activen el bot. `requireMention` tiene el valor predeterminado `true`.

Configuración mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Qué es

- Un canal de Twitch propiedad de Gateway.
- Enrutamiento determinista: las respuestas siempre vuelven a Twitch.
- Cada cuenta se asigna a una clave de sesión aislada `agent:<agentId>:twitch:<accountName>`.
- `username` es la cuenta del bot (quien se autentica), `channel` es la sala de chat a la que se une.

## Configuración (detallada)

### Generar credenciales

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecciona **Bot Token**
- Verifica que estén seleccionados los alcances `chat:read` y `chat:write`
- Copia el **Client ID** y el **Access Token**

No se necesita registro manual de aplicación. Los tokens caducan después de varias horas.

### Configurar el bot

**Variable de entorno (solo cuenta predeterminada):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**O configuración:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Si tanto el entorno como la configuración están establecidos, la configuración tiene prioridad.

### Control de acceso (recomendado)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Prefiere `allowFrom` para una lista permitida estricta. Usa `allowedRoles` en su lugar si quieres acceso basado en roles.

**Roles disponibles:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**¿Por qué IDs de usuario?** Los nombres de usuario pueden cambiar, lo que permite suplantación. Los IDs de usuario son permanentes.

Busca tu ID de usuario de Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (convierte tu nombre de usuario de Twitch en ID)

## Renovación de token (opcional)

Los tokens de [Twitch Token Generator](https://twitchtokengenerator.com/) no se pueden renovar automáticamente; vuelve a generarlos cuando caduquen.

Para la renovación automática de tokens, crea tu propia aplicación de Twitch en [Twitch Developer Console](https://dev.twitch.tv/console) y agrégala a la configuración:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

El bot renueva automáticamente los tokens antes de que caduquen y registra eventos de renovación.

## Compatibilidad con varias cuentas

Usa `channels.twitch.accounts` con tokens por cuenta. Consulta [`gateway/configuration`](/es/gateway/configuration) para el patrón compartido.

Ejemplo (una cuenta de bot en dos canales):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Nota:** Cada cuenta necesita su propio token (un token por canal).

## Control de acceso

### Restricciones basadas en roles

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Lista permitida por ID de usuario (más segura)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Acceso basado en roles (alternativa)

`allowFrom` es una lista permitida estricta. Cuando está configurada, solo se permiten esos IDs de usuario.
Si quieres acceso basado en roles, deja `allowFrom` sin configurar y configura `allowedRoles` en su lugar:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Desactivar el requisito de @mention

De forma predeterminada, `requireMention` es `true`. Para desactivarlo y responder a todos los mensajes:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Solución de problemas

Primero, ejecuta comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

### El bot no responde a los mensajes

**Verifica el control de acceso:** asegúrate de que tu ID de usuario esté en `allowFrom`, o elimina temporalmente
`allowFrom` y establece `allowedRoles: ["all"]` para probar.

**Verifica que el bot esté en el canal:** el bot debe unirse al canal especificado en `channel`.

### Problemas con tokens

**"Failed to connect" o errores de autenticación:**

- Verifica que `accessToken` sea el valor del token de acceso OAuth (normalmente empieza con el prefijo `oauth:`)
- Comprueba que el token tenga los alcances `chat:read` y `chat:write`
- Si usas renovación de token, verifica que `clientSecret` y `refreshToken` estén configurados

### La renovación de token no funciona

**Revisa los registros para ver eventos de renovación:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Si ves "token refresh disabled (no refresh token)":

- Asegúrate de que se proporcione `clientSecret`
- Asegúrate de que se proporcione `refreshToken`

## Configuración

**Configuración de cuenta:**

- `username` - nombre de usuario del bot
- `accessToken` - token de acceso OAuth con `chat:read` y `chat:write`
- `clientId` - Twitch Client ID (de Token Generator o de tu app)
- `channel` - canal al que unirse (obligatorio)
- `enabled` - habilita esta cuenta (predeterminado: `true`)
- `clientSecret` - opcional: para renovación automática de token
- `refreshToken` - opcional: para renovación automática de token
- `expiresIn` - caducidad del token en segundos
- `obtainmentTimestamp` - marca de tiempo de obtención del token
- `allowFrom` - lista permitida de ID de usuario
- `allowedRoles` - control de acceso basado en roles (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - requiere @mention (predeterminado: `true`)

**Opciones del proveedor:**

- `channels.twitch.enabled` - habilita/deshabilita el inicio del canal
- `channels.twitch.username` - nombre de usuario del bot (configuración simplificada de cuenta única)
- `channels.twitch.accessToken` - token de acceso OAuth (configuración simplificada de cuenta única)
- `channels.twitch.clientId` - Twitch Client ID (configuración simplificada de cuenta única)
- `channels.twitch.channel` - canal al que unirse (configuración simplificada de cuenta única)
- `channels.twitch.accounts.<accountName>` - configuración de varias cuentas (todos los campos de cuenta anteriores)

Ejemplo completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Acciones de herramientas

El agente puede llamar a `twitch` con la acción:

- `send` - enviar un mensaje a un canal

Ejemplo:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Seguridad y operaciones

- **Trata los tokens como contraseñas**: nunca registres tokens en git
- **Usa renovación automática de token** para bots de larga duración
- **Usa listas permitidas por ID de usuario** en lugar de nombres de usuario para control de acceso
- **Supervisa los registros** para ver eventos de renovación de token y estado de conexión
- **Limita al mínimo los alcances de los tokens**: solicita solo `chat:read` y `chat:write`
- **Si te atascas**: reinicia Gateway después de confirmar que ningún otro proceso es propietario de la sesión

## Límites

- **500 caracteres** por mensaje (dividido automáticamente en límites de palabra)
- Markdown se elimina antes de fragmentar
- Sin limitación de frecuencia (usa los límites de frecuencia integrados de Twitch)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y restricción por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
