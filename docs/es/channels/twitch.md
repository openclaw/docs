---
read_when:
    - Configurar la integración del chat de Twitch para OpenClaw
sidebarTitle: Twitch
summary: Configuración y puesta en marcha del bot de chat de Twitch
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Compatibilidad con el chat de Twitch mediante conexión IRC. OpenClaw se conecta como un usuario de Twitch (cuenta de bot) para recibir y enviar mensajes en canales.

## Plugin incluido

<Note>
Twitch se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, así que las compilaciones empaquetadas normales no necesitan una instalación separada.
</Note>

Si usas una compilación antigua o una instalación personalizada que excluye Twitch, instala directamente el paquete npm:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Usa el paquete sin versión para seguir la etiqueta de versión oficial actual. Fija una versión exacta
solo cuando necesites una instalación reproducible.

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

<Steps>
  <Step title="Ensure plugin is available">
    Las versiones empaquetadas actuales de OpenClaw ya lo incluyen. Las instalaciones antiguas o personalizadas pueden agregarlo manualmente con los comandos anteriores.
  </Step>
  <Step title="Create a Twitch bot account">
    Crea una cuenta de Twitch dedicada para el bot (o usa una cuenta existente).
  </Step>
  <Step title="Generate credentials">
    Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecciona **Bot Token**
    - Verifica que los alcances `chat:read` y `chat:write` estén seleccionados
    - Copia el **Client ID** y el **Access Token**

  </Step>
  <Step title="Find your Twitch user ID">
    Usa [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para convertir un nombre de usuario en un ID de usuario de Twitch.
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo cuenta predeterminada)
    - O configuración: `channels.twitch.accessToken`

    Si ambos están definidos, la configuración tiene prioridad (la alternativa de env es solo para la cuenta predeterminada).

  </Step>
  <Step title="Start the gateway">
    Inicia el Gateway con el canal configurado.
  </Step>
</Steps>

<Warning>
Agrega control de acceso (`allowFrom` o `allowedRoles`) para evitar que usuarios no autorizados activen el bot. `requireMention` tiene `true` como valor predeterminado.
</Warning>

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

- Un canal de Twitch propiedad del Gateway.
- Enrutamiento determinista: las respuestas siempre vuelven a Twitch.
- Cada cuenta se asigna a una clave de sesión aislada `agent:<agentId>:twitch:<accountName>`.
- `username` es la cuenta del bot (quien se autentica), `channel` es la sala de chat a la que se une.

## Configuración (detallada)

### Generar credenciales

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecciona **Bot Token**
- Verifica que los alcances `chat:read` y `chat:write` estén seleccionados
- Copia el **Client ID** y el **Access Token**

<Note>
No se necesita registrar una aplicación manualmente. Los tokens caducan después de varias horas.
</Note>

### Configurar el bot

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
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
  </Tab>
</Tabs>

Si tanto env como la configuración están definidos, la configuración tiene prioridad.

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

Prefiere `allowFrom` para una lista de permitidos estricta. Usa `allowedRoles` en su lugar si quieres acceso basado en roles.

**Roles disponibles:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**¿Por qué IDs de usuario?** Los nombres de usuario pueden cambiar, lo que permite suplantación. Los IDs de usuario son permanentes.

Encuentra tu ID de usuario de Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Convierte tu nombre de usuario de Twitch a ID)
</Note>

## Actualización de token (opcional)

Los tokens de [Twitch Token Generator](https://twitchtokengenerator.com/) no se pueden actualizar automáticamente; regénéralos cuando caduquen.

Para la actualización automática de tokens, crea tu propia aplicación de Twitch en [Twitch Developer Console](https://dev.twitch.tv/console) y agrégala a la configuración:

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

El bot actualiza automáticamente los tokens antes de que caduquen y registra los eventos de actualización.

## Compatibilidad con varias cuentas

Usa `channels.twitch.accounts` con tokens por cuenta. Consulta [Configuración](/es/gateway/configuration) para ver el patrón compartido.

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

<Note>
Cada cuenta necesita su propio token (un token por canal).
</Note>

## Control de acceso

<Tabs>
  <Tab title="User ID allowlist (most secure)">
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
  </Tab>
  <Tab title="Role-based">
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

    `allowFrom` es una lista de permitidos estricta. Cuando está definida, solo se permiten esos IDs de usuario. Si quieres acceso basado en roles, deja `allowFrom` sin definir y configura `allowedRoles` en su lugar.

  </Tab>
  <Tab title="Disable @mention requirement">
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

  </Tab>
</Tabs>

## Solución de problemas

Primero, ejecuta comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **Revisa el control de acceso:** Asegúrate de que tu ID de usuario esté en `allowFrom`, o elimina temporalmente `allowFrom` y define `allowedRoles: ["all"]` para probar.
    - **Comprueba que el bot esté en el canal:** El bot debe unirse al canal especificado en `channel`.

  </Accordion>
  <Accordion title="Token issues">
    "Failed to connect" o errores de autenticación:

    - Verifica que `accessToken` sea el valor del token de acceso OAuth (normalmente empieza con el prefijo `oauth:`)
    - Comprueba que el token tenga los alcances `chat:read` y `chat:write`
    - Si usas actualización de tokens, verifica que `clientSecret` y `refreshToken` estén definidos

  </Accordion>
  <Accordion title="Token refresh not working">
    Revisa los registros para ver eventos de actualización:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Si ves "token refresh disabled (no refresh token)":

    - Asegúrate de que se proporcione `clientSecret`
    - Asegúrate de que se proporcione `refreshToken`

  </Accordion>
</AccordionGroup>

## Configuración

### Configuración de cuenta

<ParamField path="username" type="string">
  Nombre de usuario del bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Token de acceso OAuth con `chat:read` y `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Client ID de Twitch (desde Token Generator o tu aplicación).
</ParamField>
<ParamField path="channel" type="string" required>
  Canal al que unirse.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Habilita esta cuenta.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcional: para actualización automática de tokens.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcional: para actualización automática de tokens.
</ParamField>
<ParamField path="expiresIn" type="number">
  Caducidad del token en segundos.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Marca de tiempo de obtención del token.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista de permitidos de IDs de usuario.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Control de acceso basado en roles.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Requiere @mención.
</ParamField>

### Opciones del proveedor

- `channels.twitch.enabled` - Habilita/deshabilita el inicio del canal
- `channels.twitch.username` - Nombre de usuario del bot (configuración simplificada de cuenta única)
- `channels.twitch.accessToken` - Token de acceso OAuth (configuración simplificada de cuenta única)
- `channels.twitch.clientId` - Client ID de Twitch (configuración simplificada de cuenta única)
- `channels.twitch.channel` - Canal al que unirse (configuración simplificada de cuenta única)
- `channels.twitch.accounts.<accountName>` - Configuración de varias cuentas (todos los campos de cuenta anteriores)

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

## Acciones de herramienta

El agente puede llamar a `twitch` con la acción:

- `send` - Envía un mensaje a un canal

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

- **Trata los tokens como contraseñas** — Nunca confirmes tokens en git.
- **Usa actualización automática de tokens** para bots de larga duración.
- **Usa listas de permitidos de IDs de usuario** en lugar de nombres de usuario para el control de acceso.
- **Supervisa los registros** para ver eventos de actualización de tokens y el estado de conexión.
- **Limita al mínimo los alcances de los tokens** — Solicita solo `chat:read` y `chat:write`.
- **Si te bloqueas**: Reinicia el Gateway después de confirmar que ningún otro proceso posee la sesión.

## Límites

- **500 caracteres** por mensaje (dividido automáticamente en fragmentos en límites de palabra).
- Markdown se elimina antes de fragmentar.
- Sin limitación de velocidad (usa los límites de velocidad integrados de Twitch).

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control de menciones
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
