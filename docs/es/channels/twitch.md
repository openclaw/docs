---
read_when:
    - Configuración de la integración del chat de Twitch para OpenClaw
sidebarTitle: Twitch
summary: 'Bot de chat de Twitch: instalación, credenciales, control de acceso, renovación de tokens'
title: Twitch
x-i18n:
    generated_at: "2026-07-05T11:06:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Compatibilidad con el chat de Twitch mediante la interfaz de chat (IRC) de Twitch a través del cliente Twurple. OpenClaw inicia sesión como una cuenta de bot de Twitch, se une a un canal por cada cuenta configurada y responde en ese canal.

## Instalación

Twitch se distribuye como un plugin oficial; no forma parte de la instalación principal.

<Tabs>
  <Tab title="Registro npm">
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

`plugins install` registra y habilita el plugin. Elegir Twitch durante `openclaw onboard` o `openclaw channels add` lo instala bajo demanda. Usa el nombre de paquete sin versión para seguir la versión actual; fija una versión exacta solo para instalaciones reproducibles. Requiere OpenClaw 2026.4.10 o posterior.

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

<Steps>
  <Step title="Instala el plugin">
    Consulta [Instalación](#install) más arriba.
  </Step>
  <Step title="Crea una cuenta de bot de Twitch">
    Crea una cuenta de Twitch dedicada para el bot (o usa una cuenta existente).
  </Step>
  <Step title="Genera credenciales">
    Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecciona **Bot Token**
    - Verifica que los alcances `chat:read` y `chat:write` estén seleccionados
    - Copia el **Client ID** y el **Access Token**

  </Step>
  <Step title="Encuentra tu ID de usuario de Twitch">
    Usa [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para convertir un nombre de usuario en un ID de usuario de Twitch.
  </Step>
  <Step title="Configura el token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo cuenta predeterminada)
    - O configuración: `channels.twitch.accessToken`

    Si ambos están definidos, la configuración tiene prioridad (la variable de entorno solo es una alternativa para la cuenta predeterminada).

  </Step>
  <Step title="Inicia el Gateway">
    ```bash
    openclaw gateway run
    ```
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
      username: "openclaw", // Bot's Twitch account (authenticates)
      accessToken: "oauth:abc123...", // OAuth access token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "yourchannel", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

## Qué es

- Un canal de Twitch propiedad del Gateway.
- Enrutamiento determinista: las respuestas siempre vuelven al canal de Twitch del que provino el mensaje.
- Cada canal unido se asigna a una clave de sesión de grupo aislada `agent:<agentId>:twitch:group:<channel>`.
- `username` es la cuenta del bot (quien autentica), `channel` es la sala de chat a la que se unirá. Cada entrada de cuenta se une exactamente a un canal.
- Los tokens funcionan con o sin el prefijo `oauth:`; OpenClaw normaliza ambos formatos (el asistente de configuración espera la forma `oauth:`).

## Actualización de token (opcional)

Los tokens de [Twitch Token Generator](https://twitchtokengenerator.com/) no pueden actualizarse desde OpenClaw: regenéralos cuando expiren (duran unas pocas horas; no hace falta registrar una aplicación).

Para actualización automática, crea tu propia aplicación en la [Twitch Developer Console](https://dev.twitch.tv/console) y agrega:

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

Con ambos definidos, el plugin usa un proveedor de autenticación con actualización que renueva los tokens antes de que expiren y registra cada actualización. Sin `refreshToken`, registra `token refresh disabled (no refresh token)`; sin `clientSecret`, recurre a un token estático (sin actualización).

## Compatibilidad con varias cuentas

Usa `channels.twitch.accounts` con credenciales por cuenta. Consulta [Configuración](/es/gateway/configuration) para ver el patrón compartido.

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
          channel: "yourchannel",
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
Cada entrada de cuenta necesita su propio `accessToken` (la variable de entorno cubre solo la cuenta predeterminada). Una cuenta se une exactamente a un canal, por lo que unirse a dos canales implica dos cuentas. `channels.twitch.defaultAccount` elige qué cuenta es la predeterminada.
</Note>

## Control de acceso

`allowFrom` es una lista estricta de IDs de usuario de Twitch permitidos. Cuando está definida, `allowedRoles` se ignora; deja `allowFrom` sin definir para usar acceso basado en roles.

**Roles disponibles:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

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
  </Tab>
  <Tab title="Deshabilitar el requisito de @mención">
    De forma predeterminada, `requireMention` es `true`. Para responder a todos los mensajes permitidos:

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

<Note>
**¿Por qué IDs de usuario?** Los nombres de usuario pueden cambiar, lo que permite la suplantación. Los IDs de usuario son permanentes.

Encuentra el tuyo con el [conversor de nombre de usuario a ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Solución de problemas

Primero, ejecuta comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="El bot no responde a los mensajes">
    - **Comprueba el control de acceso:** Asegúrate de que tu ID de usuario esté en `allowFrom`, o elimina temporalmente `allowFrom` y define `allowedRoles: ["all"]` para probar.
    - **Comprueba la puerta de mención:** Con `requireMention: true` (predeterminado), los mensajes deben @mencionar el nombre de usuario del bot.
    - **Comprueba que el bot esté en el canal:** El bot solo se une al canal indicado en `channel`.

  </Accordion>
  <Accordion title="Problemas de token">
    "Error al conectar" o errores de autenticación:

    - Verifica que `accessToken` sea el valor del token de acceso OAuth (el prefijo `oauth:` es opcional)
    - Comprueba que el token tenga los alcances `chat:read` y `chat:write`
    - Si usas actualización de token, verifica que `clientSecret` y `refreshToken` estén definidos

  </Accordion>
  <Accordion title="La actualización de token no funciona">
    Revisa los registros para ver eventos de actualización:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Si ves `token refresh disabled (no refresh token)`:

    - Asegúrate de proporcionar `clientSecret`
    - Asegúrate de proporcionar `refreshToken`

  </Accordion>
</AccordionGroup>

## Configuración

### Configuración de cuenta

<ParamField path="username" type="string" required>
  Nombre de usuario del bot (la cuenta que autentica).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token de acceso OAuth con `chat:read` y `chat:write` (configuración o variable de entorno para la cuenta predeterminada).
</ParamField>
<ParamField path="clientId" type="string" required>
  Client ID de Twitch (de Token Generator o de tu aplicación). Opcional en el esquema, pero requerido para conectar.
</ParamField>
<ParamField path="channel" type="string" required>
  Canal al que unirse.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Habilita esta cuenta.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcional: para actualización automática de token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcional: para actualización automática de token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Caducidad del token en segundos (seguimiento de actualización).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Marca de tiempo de cuando se obtuvo el token (seguimiento de actualización).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista de permitidos por ID de usuario. Cuando está definida, los roles se ignoran.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Control de acceso basado en roles.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Requiere @mención para activar el bot.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Anulación del prefijo de respuesta saliente para esta cuenta.
</ParamField>

### Opciones del proveedor

- `channels.twitch.enabled` - Habilita/deshabilita el inicio del canal
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Configuración simplificada de una sola cuenta (cuenta `default` implícita; tiene prioridad sobre `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Configuración de varias cuentas (todos los campos de cuenta anteriores)
- `channels.twitch.defaultAccount` - Qué nombre de cuenta es el predeterminado
- `channels.twitch.markdown.tables` - Modo de renderizado de tablas Markdown (`off` | `bullets` | `code` | `block`)

Ejemplo completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Acciones de herramienta

El agente puede enviar mensajes de Twitch mediante la acción `send` de la herramienta de mensajes:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` es opcional y toma como valor predeterminado el `channel` configurado de la cuenta.

## Seguridad y operaciones

- **Trata los tokens como contraseñas** - nunca confirmes tokens en git.
- **Usa actualización automática de token** para bots de larga duración.
- **Usa listas de permitidos por ID de usuario** en lugar de nombres de usuario para el control de acceso.
- **Supervisa los registros** para ver eventos de actualización de token y el estado de conexión.
- **Limita los alcances de los tokens al mínimo** - solicita solo `chat:read` y `chat:write`.
- **Si te bloqueas**: reinicia el Gateway después de confirmar que ningún otro proceso posee la sesión.

## Límites

- **500 caracteres** por mensaje; las respuestas más largas se dividen en límites de palabras.
- Markdown se elimina antes de enviar (el chat de Twitch es texto plano; los saltos de línea se convierten en espacios).
- OpenClaw no agrega ninguna limitación de tasa propia; el cliente de chat Twurple gestiona los límites de tasa de Twitch.

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y puerta de mención
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
