---
read_when:
    - Configurar la integración del chat de Twitch para OpenClaw
sidebarTitle: Twitch
summary: Configuración e instalación del bot de chat de Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Soporte de chat de Twitch mediante conexión IRC. OpenClaw se conecta como un usuario de Twitch (cuenta de bot) para recibir y enviar mensajes en canales.

## Plugin incluido

<Note>
Twitch se incluye como un Plugin integrado en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.
</Note>

Si usas una compilación antigua o una instalación personalizada que excluye Twitch, instálalo manualmente:

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="checkout local">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

<Steps>
  <Step title="Asegúrate de que el Plugin esté disponible">
    Las versiones empaquetadas actuales de OpenClaw ya lo incluyen. Las instalaciones antiguas/personalizadas pueden añadirlo manualmente con los comandos anteriores.
  </Step>
  <Step title="Crea una cuenta de bot de Twitch">
    Crea una cuenta de Twitch dedicada para el bot (o usa una cuenta existente).
  </Step>
  <Step title="Genera credenciales">
    Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecciona **Bot Token**
    - Verifica que estén seleccionados los alcances `chat:read` y `chat:write`
    - Copia el **Client ID** y el **Access Token**

  </Step>
  <Step title="Encuentra tu ID de usuario de Twitch">
    Usa [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para convertir un nombre de usuario en un ID de usuario de Twitch.
  </Step>
  <Step title="Configura el token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo cuenta predeterminada)
    - O config: `channels.twitch.accessToken`

    Si ambos están configurados, config tiene prioridad (el valor de env como respaldo es solo para la cuenta predeterminada).

  </Step>
  <Step title="Inicia el Gateway">
    Inicia el Gateway con el canal configurado.
  </Step>
</Steps>

<Warning>
Añade control de acceso (`allowFrom` o `allowedRoles`) para evitar que usuarios no autorizados activen el bot. `requireMention` tiene como valor predeterminado `true`.
</Warning>

Configuración mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Cuenta de Twitch del bot
      accessToken: "oauth:abc123...", // OAuth Access Token (o usa la variable de entorno OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID de Token Generator
      channel: "vevisk", // Canal de Twitch cuyo chat se va a unir (obligatorio)
      allowFrom: ["123456789"], // (recomendado) Solo tu ID de usuario de Twitch; obténlo en https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Qué es

- Un canal de Twitch propiedad del Gateway.
- Enrutamiento determinista: las respuestas siempre vuelven a Twitch.
- Cada cuenta se asigna a una clave de sesión aislada `agent:<agentId>:twitch:<accountName>`.
- `username` es la cuenta del bot (quién se autentica), `channel` es la sala de chat a la que se une.

## Configuración (detallada)

### Generar credenciales

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecciona **Bot Token**
- Verifica que estén seleccionados los alcances `chat:read` y `chat:write`
- Copia el **Client ID** y el **Access Token**

<Note>
No se necesita registro manual de aplicación. Los tokens caducan después de varias horas.
</Note>

### Configurar el bot

<Tabs>
  <Tab title="Variable de entorno (solo cuenta predeterminada)">
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

Si tanto env como config están configurados, config tiene prioridad.

### Control de acceso (recomendado)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recomendado) Solo tu ID de usuario de Twitch
    },
  },
}
```

Prefiere `allowFrom` para una lista de permitidos estricta. Usa `allowedRoles` en su lugar si quieres control de acceso basado en roles.

**Roles disponibles:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**¿Por qué IDs de usuario?** Los nombres de usuario pueden cambiar, lo que permite suplantación. Los IDs de usuario son permanentes.

Encuentra tu ID de usuario de Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Convierte tu nombre de usuario de Twitch en ID)
</Note>

## Actualización del token (opcional)

Los tokens de [Twitch Token Generator](https://twitchtokengenerator.com/) no pueden actualizarse automáticamente; vuelve a generarlos cuando caduquen.

Para la actualización automática del token, crea tu propia aplicación de Twitch en [Twitch Developer Console](https://dev.twitch.tv/console) y añade a config:

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

El bot actualiza automáticamente los tokens antes de su caducidad y registra eventos de actualización.

## Soporte para varias cuentas

Usa `channels.twitch.accounts` con tokens por cuenta. Consulta [Configuration](/es/gateway/configuration) para el patrón compartido.

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
  <Tab title="Lista de permitidos por ID de usuario (más segura)">
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

    `allowFrom` es una lista de permitidos estricta. Cuando está configurada, solo se permiten esos IDs de usuario. Si quieres acceso basado en roles, deja `allowFrom` sin configurar y configura `allowedRoles` en su lugar.

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
    - **Comprueba el control de acceso:** Asegúrate de que tu ID de usuario esté en `allowFrom`, o elimina temporalmente `allowFrom` y configura `allowedRoles: ["all"]` para probar.
    - **Comprueba que el bot esté en el canal:** El bot debe unirse al canal especificado en `channel`.
  </Accordion>
  <Accordion title="Problemas con el token">
    Errores de “Failed to connect” o autenticación:

    - Verifica que `accessToken` sea el valor del token de acceso OAuth (normalmente empieza con el prefijo `oauth:`)
    - Comprueba que el token tenga los alcances `chat:read` y `chat:write`
    - Si usas actualización de token, verifica que `clientSecret` y `refreshToken` estén configurados

  </Accordion>
  <Accordion title="La actualización del token no funciona">
    Comprueba los registros en busca de eventos de actualización:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Si ves “token refresh disabled (no refresh token)”:

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
  Twitch Client ID (de Token Generator o de tu aplicación).
</ParamField>
<ParamField path="channel" type="string" required>
  Canal al que unirse.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Habilita esta cuenta.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcional: para actualización automática del token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcional: para actualización automática del token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Caducidad del token en segundos.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Marca de tiempo de obtención del token.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista de permitidos por ID de usuario.
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
- `channels.twitch.clientId` - Twitch Client ID (configuración simplificada de una sola cuenta)
- `channels.twitch.channel` - Canal al que unirse (configuración simplificada de una sola cuenta)
- `channels.twitch.accounts.<accountName>` - Configuración multicuenta (todos los campos de cuenta anteriores)

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

## Acciones de la herramienta

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

- **Trata los tokens como contraseñas** — Nunca confirmes tokens en git.
- **Usa actualización automática del token** para bots de larga duración.
- **Usa listas de permitidos por ID de usuario** en lugar de nombres de usuario para el control de acceso.
- **Supervisa los registros** para ver eventos de actualización del token y el estado de la conexión.
- **Limita los alcances de los tokens al mínimo** — Solicita solo `chat:read` y `chat:write`.
- **Si te quedas atascado**: reinicia el Gateway después de confirmar que ningún otro proceso es propietario de la sesión.

## Límites

- **500 caracteres** por mensaje (dividido automáticamente por límites de palabra).
- El Markdown se elimina antes de dividir.
- Sin limitación de velocidad (usa los límites de velocidad integrados de Twitch).

## Relacionado

- [Channel Routing](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y restricción por mención
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Security](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
