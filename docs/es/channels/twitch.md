---
read_when:
    - Configuración de la integración del chat de Twitch para OpenClaw
sidebarTitle: Twitch
summary: 'Bot de chat de Twitch: instalación, credenciales, control de acceso, renovación de tokens'
title: Twitch
x-i18n:
    generated_at: "2026-07-19T01:50:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d827c742ded5fd0b071443dead27b975e2414419b0facb486d7f9c0c9800b060
    source_path: channels/twitch.md
    workflow: 16
---

Compatibilidad con el chat de Twitch mediante la interfaz de chat (IRC) de Twitch a través del cliente Twurple. OpenClaw inicia sesión con una cuenta de bot de Twitch, se une a un canal por cada cuenta configurada y responde en ese canal.

## Instalación

Twitch se distribuye como un plugin oficial; no forma parte de la instalación principal.

<Tabs>
  <Tab title="Registro de npm">
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

`plugins install` registra y habilita el plugin. Al elegir Twitch durante `openclaw onboard` o `openclaw channels add`, se instala bajo demanda. Use el nombre del paquete sin versión para seguir la versión actual; fije una versión exacta solo para instalaciones reproducibles. Requiere OpenClaw 2026.4.10 o una versión posterior.

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

<Steps>
  <Step title="Instalar el plugin">
    Consulte [Instalación](#install) más arriba.
  </Step>
  <Step title="Crear una cuenta de bot de Twitch">
    Cree una cuenta de Twitch dedicada para el bot (o use una cuenta existente).
  </Step>
  <Step title="Generar credenciales">
    Use [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Seleccione **Bot Token**
    - Compruebe que estén seleccionados los permisos `chat:read` y `chat:write`
    - Copie **Client ID** y **Access Token**

  </Step>
  <Step title="Buscar su ID de usuario de Twitch">
    Use [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para convertir un nombre de usuario en un ID de usuario de Twitch.
  </Step>
  <Step title="Configurar el token">
    - Variable de entorno: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo para la cuenta predeterminada)
    - O configuración: `channels.twitch.accessToken`

    Si se establecen ambos, la configuración tiene prioridad (la variable de entorno solo sirve como alternativa para la cuenta predeterminada).

  </Step>
  <Step title="Iniciar el Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Añada control de acceso (`allowFrom` o `allowedRoles`) para impedir que usuarios no autorizados activen el bot. El valor predeterminado de `requireMention` es `true`.
</Warning>

Configuración mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Cuenta de Twitch del bot (se autentica)
      accessToken: "oauth:abc123...", // Token de acceso OAuth (o use la variable de entorno OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // ID de cliente de Token Generator
      channel: "yourchannel", // Chat del canal de Twitch al que se debe unir (obligatorio)
      allowFrom: ["123456789"], // (recomendado) Solo su ID de usuario de Twitch
    },
  },
}
```

## Qué es

- Un canal de Twitch propiedad del Gateway.
- Enrutamiento determinista: las respuestas siempre regresan al canal de Twitch del que procede el mensaje.
- Cada canal al que se une se asigna a una clave de sesión de grupo aislada `agent:<agentId>:twitch:group:<channel>`.
- `username` es la cuenta del bot (la que se autentica) y `channel` es la sala de chat a la que se une. Cada entrada de cuenta se une exactamente a un canal.
- Los tokens funcionan con o sin el prefijo `oauth:`; OpenClaw normaliza ambos formatos (el asistente de configuración espera el formato `oauth:`).

## Durabilidad de los mensajes entrantes

OpenClaw pone de forma duradera en cola cada mensaje de chat de Twitch aceptado antes del envío normal. Los mensajes pendientes o reintentables sobreviven al reinicio del Gateway, permanecen serializados para el canal configurado y usan el ID de mensaje de Twitch para evitar entradas duplicadas en la cola mientras exista el registro de finalización activo o conservado.

El chat de Twitch no vuelve a enviar un `PRIVMSG` después de que el cliente lo haya aceptado. Esto protege el intervalo entre la aceptación local y el envío en caso de fallo, pero no permite recuperar mensajes perdidos antes de su admisión duradera. Si falla la propia incorporación a la cola, OpenClaw registra el fallo; volver a conectarse no solicita a Twitch que reenvíe ese mensaje.

## Renovación de tokens (opcional)

OpenClaw no puede renovar los tokens de [Twitch Token Generator](https://twitchtokengenerator.com/); genérelos de nuevo cuando caduquen (duran unas horas y no requieren registrar una aplicación).

Para la renovación automática, cree su propia aplicación en [Twitch Developer Console](https://dev.twitch.tv/console) y añada:

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

Con ambos valores establecidos, el plugin usa un proveedor de autenticación con renovación que renueva los tokens antes de que caduquen y registra cada renovación. Sin `refreshToken`, registra `token refresh disabled (no refresh token)`; sin `clientSecret`, recurre a un token estático (sin renovación).

## Compatibilidad con varias cuentas

Use `channels.twitch.accounts` con credenciales por cuenta. Consulte [Configuración](/es/gateway/configuration) para conocer el patrón compartido.

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
Cada entrada de cuenta necesita su propio `accessToken` (la variable de entorno solo cubre la cuenta predeterminada). Cada cuenta se une exactamente a un canal, por lo que unirse a dos canales requiere dos cuentas. `channels.twitch.defaultAccount` selecciona qué cuenta es la predeterminada.
</Note>

## Control de acceso

`allowFrom` es una lista estricta de ID de usuarios de Twitch permitidos. Cuando se establece, se ignora `allowedRoles`; deje `allowFrom` sin establecer para usar en su lugar el acceso basado en roles.

**Roles disponibles:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Lista de ID de usuarios permitidos (más segura)">
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
**¿Por qué usar ID de usuario?** Los nombres de usuario pueden cambiar, lo que permite la suplantación de identidad. Los ID de usuario son permanentes.

Busque el suyo con el [conversor de nombre de usuario a ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Solución de problemas

Primero, ejecute los comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="El bot no responde a los mensajes">
    - **Compruebe el control de acceso:** Asegúrese de que su ID de usuario esté en `allowFrom` o elimine temporalmente `allowFrom` y establezca `allowedRoles: ["all"]` para realizar una prueba.
    - **Compruebe el filtro de menciones:** Con `requireMention: true` (valor predeterminado), los mensajes deben incluir una @mención al nombre de usuario del bot.
    - **Compruebe que el bot esté en el canal:** El bot solo se une al canal indicado en `channel`.

  </Accordion>
  <Accordion title="Problemas con el token">
    Errores de autenticación o "Failed to connect":

    - Compruebe que `accessToken` sea el valor del token de acceso OAuth (el prefijo `oauth:` es opcional)
    - Compruebe que el token tenga los permisos `chat:read` y `chat:write`
    - Si usa la renovación de tokens, compruebe que `clientSecret` y `refreshToken` estén establecidos

  </Accordion>
  <Accordion title="La renovación del token no funciona">
    Compruebe los registros para buscar eventos de renovación:

    ```text
    Uso de la fuente de tokens de la variable de entorno para mybot
    Token de acceso renovado para el usuario 123456 (caduca en 14400s)
    ```

    Si aparece `token refresh disabled (no refresh token)`:

    - Asegúrese de proporcionar `clientSecret`
    - Asegúrese de proporcionar `refreshToken`

  </Accordion>
</AccordionGroup>

## Configuración

### Configuración de la cuenta

<ParamField path="username" type="string" required>
  Nombre de usuario del bot (la cuenta que se autentica).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token de acceso OAuth con `chat:read` y `chat:write` (configuración o variable de entorno para la cuenta predeterminada).
</ParamField>
<ParamField path="clientId" type="string" required>
  ID de cliente de Twitch (de Token Generator o de su aplicación). Es opcional en el esquema, pero obligatorio para conectarse.
</ParamField>
<ParamField path="channel" type="string" required>
  Canal al que se debe unir.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Habilita esta cuenta.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcional: para la renovación automática del token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcional: para la renovación automática del token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Caducidad del token en segundos (seguimiento de la renovación).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Marca de tiempo de obtención del token (seguimiento de la renovación).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista de ID de usuarios permitidos. Cuando se establece, se ignoran los roles.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Control de acceso basado en roles.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Requiere una @mención para activar el bot.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Sustitución del prefijo de las respuestas salientes para esta cuenta.
</ParamField>

### Opciones del proveedor

- `channels.twitch.enabled` - Habilita o deshabilita el inicio del canal
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Configuración simplificada de una sola cuenta (cuenta `default` implícita; tiene prioridad sobre `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Configuración de varias cuentas (todos los campos de cuenta anteriores)
- `channels.twitch.defaultAccount` - Nombre de la cuenta predeterminada
- `channels.twitch.markdown.tables` - Modo de representación de tablas Markdown (`off` | `bullets` | `code` | `block`)

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

## Acciones de herramientas

El agente puede enviar mensajes de Twitch mediante la acción `send` de la herramienta de mensajes:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "¡Hola, Twitch!",
}
```

`to` es opcional y su valor predeterminado es el `channel` configurado de la cuenta.

## Seguridad y operaciones

- **Trata los tokens como contraseñas**: nunca confirmes tokens en git.
- **Usa la actualización automática de tokens** para bots de larga duración.
- **Usa listas de permitidos de ID de usuario** en lugar de nombres de usuario para el control de acceso.
- **Supervisa los registros** para detectar eventos de actualización de tokens y el estado de la conexión.
- **Limita al mínimo el alcance de los tokens**: solicita únicamente `chat:read` y `chat:write`.
- **En caso de bloqueo**: reinicia el Gateway después de confirmar que ningún otro proceso controla la sesión.

## Límites

- **500 caracteres** por mensaje; las respuestas más largas se dividen en los límites entre palabras.
- Markdown se elimina antes del envío (el chat de Twitch es texto sin formato; los saltos de línea se convierten en espacios).
- OpenClaw no añade ninguna limitación de frecuencia propia; el cliente de chat Twurple gestiona los límites de frecuencia de Twitch.

## Contenido relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control mediante menciones
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de la seguridad
