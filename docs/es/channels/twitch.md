---
read_when:
    - Configuración de la integración del chat de Twitch para OpenClaw
sidebarTitle: Twitch
summary: Configuración y puesta en marcha del bot de chat de Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-30T05:31:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Compatibilidad con el chat de Twitch mediante conexión IRC. OpenClaw se conecta como un usuario de Twitch (cuenta de bot) para recibir y enviar mensajes en canales.

## Plugin incluido

<Note>
Twitch se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.
</Note>

Si usas una compilación anterior o una instalación personalizada que excluye Twitch, instala un paquete npm actual cuando haya uno publicado:

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa una compilación
empaquetada actual de OpenClaw o la ruta de checkout local hasta que se publique
un paquete npm más reciente.

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

<Steps>
  <Step title="Asegúrate de que el Plugin esté disponible">
    Las versiones empaquetadas actuales de OpenClaw ya lo incluyen. Las instalaciones anteriores o personalizadas pueden agregarlo manualmente con los comandos anteriores.
  </Step>
  <Step title="Crea una cuenta de bot de Twitch">
    Crea una cuenta de Twitch dedicada para el bot (o usa una cuenta existente).
  </Step>
  <Step title="Genera credenciales">
    Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecciona **Bot Token**
    - Verifica que los ámbitos `chat:read` y `chat:write` estén seleccionados
    - Copia el **Client ID** y el **Access Token**

  </Step>
  <Step title="Busca tu ID de usuario de Twitch">
    Usa [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para convertir un nombre de usuario en un ID de usuario de Twitch.
  </Step>
  <Step title="Configura el token">
    - Entorno: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo cuenta predeterminada)
    - O configuración: `channels.twitch.accessToken`

    Si ambos están definidos, la configuración tiene prioridad (el respaldo de entorno es solo para la cuenta predeterminada).

  </Step>
  <Step title="Inicia el gateway">
    Inicia el gateway con el canal configurado.
  </Step>
</Steps>

<Warning>
Agrega control de acceso (`allowFrom` o `allowedRoles`) para impedir que usuarios no autorizados activen el bot. `requireMention` tiene el valor predeterminado `true`.
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

### Genera credenciales

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecciona **Bot Token**
- Verifica que los ámbitos `chat:read` y `chat:write` estén seleccionados
- Copia el **Client ID** y el **Access Token**

<Note>
No hace falta registrar una aplicación manualmente. Los tokens vencen después de varias horas.
</Note>

### Configura el bot

<Tabs>
  <Tab title="Variable de entorno (solo cuenta predeterminada)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Configuración">
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

Si tanto el entorno como la configuración están definidos, la configuración tiene prioridad.

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
**¿Por qué IDs de usuario?** Los nombres de usuario pueden cambiar, lo que permite la suplantación. Los IDs de usuario son permanentes.

Busca tu ID de usuario de Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Convierte tu nombre de usuario de Twitch en ID)
</Note>

## Actualización de tokens (opcional)

Los tokens de [Twitch Token Generator](https://twitchtokengenerator.com/) no se pueden actualizar automáticamente; vuelve a generarlos cuando venzan.

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

El bot actualiza automáticamente los tokens antes de que venzan y registra los eventos de actualización.

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
  <Tab title="Lista de permitidos de IDs de usuario (más segura)">
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
  <Tab title="Basado en roles">
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
  <Tab title="Desactivar el requisito de @mention">
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
  <Accordion title="El bot no responde a los mensajes">
    - **Revisa el control de acceso:** Asegúrate de que tu ID de usuario esté en `allowFrom`, o elimina temporalmente `allowFrom` y define `allowedRoles: ["all"]` para probar.
    - **Comprueba que el bot esté en el canal:** El bot debe unirse al canal especificado en `channel`.

  </Accordion>
  <Accordion title="Problemas con tokens">
    Errores de "Failed to connect" o de autenticación:

    - Verifica que `accessToken` sea el valor del token de acceso OAuth (normalmente empieza con el prefijo `oauth:`)
    - Comprueba que el token tenga los ámbitos `chat:read` y `chat:write`
    - Si usas actualización de tokens, verifica que `clientSecret` y `refreshToken` estén definidos

  </Accordion>
  <Accordion title="La actualización de tokens no funciona">
    Revisa los registros para ver eventos de actualización:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Si ves "token refresh disabled (no refresh token)":

    - Asegúrate de proporcionar `clientSecret`
    - Asegúrate de proporcionar `refreshToken`

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
  Client ID de Twitch (de Token Generator o de tu aplicación).
</ParamField>
<ParamField path="channel" type="string" required>
  Canal al que unirse.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Habilita esta cuenta.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcional: para la actualización automática de tokens.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcional: para la actualización automática de tokens.
</ParamField>
<ParamField path="expiresIn" type="number">
  Vencimiento del token en segundos.
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
  Requiere @mention.
</ParamField>

### Opciones del proveedor

- `channels.twitch.enabled` - Habilitar/deshabilitar el inicio del canal
- `channels.twitch.username` - Nombre de usuario del bot (configuración simplificada de una sola cuenta)
- `channels.twitch.accessToken` - Token de acceso OAuth (configuración simplificada de una sola cuenta)
- `channels.twitch.clientId` - Client ID de Twitch (configuración simplificada de una sola cuenta)
- `channels.twitch.channel` - Canal al que unirse (configuración simplificada de una sola cuenta)
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

## Acciones de herramientas

El agente puede llamar a `twitch` con la acción:

- `send` - Enviar un mensaje a un canal

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

- **Trata los tokens como contraseñas** — Nunca hagas commit de tokens en git.
- **Usa actualización automática de tokens** para bots de larga duración.
- **Usa listas de permitidos de IDs de usuario** en lugar de nombres de usuario para el control de acceso.
- **Supervisa los registros** para ver eventos de actualización de tokens y el estado de conexión.
- **Limita al mínimo los ámbitos de los tokens** — Solicita solo `chat:read` y `chat:write`.
- **Si te bloqueas**: Reinicia el gateway después de confirmar que ningún otro proceso posee la sesión.

## Límites

- **500 caracteres** por mensaje (dividido automáticamente en fragmentos en límites de palabra).
- Markdown se elimina antes de fragmentar.
- Sin limitación de velocidad (usa los límites de velocidad integrados de Twitch).

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y control de menciones
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
