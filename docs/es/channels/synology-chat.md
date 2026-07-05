---
read_when:
    - Configuración de Synology Chat con OpenClaw
    - Depuración del enrutamiento de webhooks de Synology Chat
summary: Configuración del Webhook de Synology Chat y configuración de OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-05T11:03:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat se conecta a OpenClaw mediante un par de Webhook: un Webhook saliente de Synology Chat publica mensajes directos entrantes en el Gateway, y las respuestas vuelven mediante un Webhook entrante de Synology Chat.

Estado: Plugin oficial, instalado por separado. Solo mensajes directos; se admiten texto y envíos de archivos basados en URL.

## Instalación

```bash
openclaw plugins install @openclaw/synology-chat
```

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Instala el Plugin (arriba).
2. En las integraciones de Synology Chat:
   - Crea un Webhook entrante y copia su URL.
   - Crea un Webhook saliente con tu token secreto.
3. Apunta la URL del Webhook saliente a tu Gateway de OpenClaw:
   - `https://gateway-host/webhook/synology` de forma predeterminada.
   - O tu `channels.synology-chat.webhookPath` personalizado.
4. Termina la configuración en OpenClaw. Synology Chat aparece en la misma lista de configuración de canales en ambos flujos:
   - Guiado: `openclaw onboard` u `openclaw channels add`
   - Directo: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicia el Gateway y envía un mensaje directo al bot de Synology Chat.

Detalles de autenticación del Webhook:

- OpenClaw acepta el token del Webhook saliente desde `body.token`, luego
  `?token=...`, y luego los encabezados.
- Formas de encabezado aceptadas:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Los tokens vacíos o ausentes fallan de forma cerrada.
- Las cargas pueden ser `application/x-www-form-urlencoded` o `application/json`; `token`, `user_id` y `text` son obligatorios.

Configuración mínima:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variables de entorno

Para la cuenta predeterminada, puedes usar variables de entorno:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separados por comas)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Los valores de configuración sustituyen a las variables de entorno.

`SYNOLOGY_CHAT_INCOMING_URL` y `SYNOLOGY_NAS_HOST` no se pueden establecer desde un `.env` de workspace; consulta [archivos `.env` de workspace](/es/gateway/security#workspace-env-files).

## Política de mensajes directos y control de acceso

- Valores de `dmPolicy` admitidos: `allowlist` (predeterminado), `open` y `disabled`. Synology Chat no tiene flujo de emparejamiento; aprueba remitentes agregando sus ID numéricos de usuario de Synology a `allowedUserIds`.
- `allowedUserIds` acepta una lista (o una cadena separada por comas) de ID de usuario de Synology.
- En modo `allowlist`, una lista `allowedUserIds` vacía se trata como configuración incorrecta y la ruta del Webhook no se iniciará.
- `dmPolicy: "open"` permite mensajes directos públicos solo cuando `allowedUserIds` incluye `"*"`; con entradas restrictivas, solo pueden chatear los usuarios coincidentes. `open` con una lista `allowedUserIds` vacía también se niega a iniciar la ruta.
- `dmPolicy: "disabled"` bloquea los mensajes directos.
- La vinculación del destinatario de la respuesta permanece en el `user_id` numérico estable de forma predeterminada. `channels.synology-chat.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la búsqueda por nombre de usuario/apodo mutable para la entrega de respuestas.

## Entrega saliente

Usa ID numéricos de usuario de Synology Chat como destinos. Se aceptan los prefijos `synology-chat:`, `synology_chat:` y `synology:`.

Ejemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

El texto saliente se divide en fragmentos de 2000 caracteres. Los envíos de medios se admiten mediante entrega de archivos basada en URL: el NAS descarga y adjunta el archivo (máx. 32 MB). Las URL de archivos salientes deben usar `http` o `https`, y los destinos de red privados o bloqueados de otro modo se rechazan antes de que OpenClaw reenvíe la URL al Webhook del NAS.

## Multicuenta

Se admiten varias cuentas de Synology Chat en `channels.synology-chat.accounts`.
Cada cuenta puede sustituir el token, la URL entrante, la ruta de Webhook, la política de mensajes directos y los límites.
Las sesiones de mensajes directos se aíslan por cuenta y usuario, por lo que el mismo `user_id`
numérico en dos cuentas de Synology distintas no comparte el estado de la transcripción.
Asigna a cada cuenta habilitada un `webhookPath` distinto. OpenClaw rechaza rutas exactas duplicadas
y se niega a iniciar cuentas con nombre que solo heredan una ruta de Webhook compartida en configuraciones multicuenta.
Si necesitas intencionalmente la herencia heredada para una cuenta con nombre, establece
`dangerouslyAllowInheritedWebhookPath: true` en esa cuenta o en `channels.synology-chat`,
pero las rutas exactas duplicadas siguen rechazándose de forma cerrada. Prefiere rutas explícitas por cuenta.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Notas de seguridad

- Mantén `token` en secreto y rótalo si se filtra.
- Mantén `allowInsecureSsl: false` salvo que confíes explícitamente en un certificado local autofirmado del NAS.
- Las solicitudes de Webhook entrantes se verifican con token y se limitan por remitente (`rateLimitPerMinute`, valor predeterminado 30).
- Las comprobaciones de tokens no válidos usan comparación de secretos en tiempo constante y fallan de forma cerrada; los intentos repetidos con tokens no válidos bloquean temporalmente la IP de origen.
- El texto de los mensajes entrantes se sanea contra patrones conocidos de inyección de prompts y se trunca a 4000 caracteres.
- Prefiere `dmPolicy: "allowlist"` para producción.
- Mantén `dangerouslyAllowNameMatching` desactivado salvo que necesites explícitamente la entrega de respuestas heredada basada en nombre de usuario.
- Mantén `dangerouslyAllowInheritedWebhookPath` desactivado salvo que aceptes explícitamente el riesgo de enrutamiento por ruta compartida en una configuración multicuenta.

## Solución de problemas

- `Missing required fields (token, user_id, text)`:
  - a la carga del Webhook saliente le falta uno de los campos obligatorios
  - si Synology envía el token en encabezados, asegúrate de que el gateway/proxy preserve esos encabezados
- `Invalid token`:
  - el secreto del Webhook saliente no coincide con `channels.synology-chat.token`
  - la solicitud está llegando a la cuenta/ruta de Webhook equivocada
  - un proxy inverso quitó el encabezado del token antes de que la solicitud llegara a OpenClaw
- `Rate limit exceeded`:
  - demasiados intentos con tokens no válidos desde el mismo origen pueden bloquear temporalmente ese origen
  - los remitentes autenticados también tienen un límite de frecuencia de mensajes por usuario independiente
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` está habilitado, pero no hay usuarios configurados
- `User not authorized`:
  - el `user_id` numérico del remitente no está en `allowedUserIds`

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales admitidos
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
