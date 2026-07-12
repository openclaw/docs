---
read_when:
    - Configuración de Synology Chat con OpenClaw
    - Depuración del enrutamiento de Webhooks de Synology Chat
summary: Configuración del Webhook de Synology Chat y de OpenClaw
title: Chat de Synology
x-i18n:
    generated_at: "2026-07-11T22:52:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat se conecta a OpenClaw mediante un par de Webhooks: un Webhook saliente de Synology Chat publica los mensajes directos entrantes en el Gateway, y las respuestas regresan mediante un Webhook entrante de Synology Chat.

Estado: Plugin oficial, instalado por separado. Solo mensajes directos; se admiten envíos de texto y archivos mediante URL.

## Instalación

```bash
openclaw plugins install @openclaw/synology-chat
```

Copia de trabajo local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Instale el Plugin (indicado arriba).
2. En las integraciones de Synology Chat:
   - Cree un Webhook entrante y copie su URL.
   - Cree un Webhook saliente con su token secreto.
3. Dirija la URL del Webhook saliente a su Gateway de OpenClaw:
   - `https://gateway-host/webhook/synology` de forma predeterminada.
   - O su ruta personalizada `channels.synology-chat.webhookPath`.
4. Finalice la configuración en OpenClaw. Synology Chat aparece en la misma lista de configuración de canales en ambos flujos:
   - Guiado: `openclaw onboard` o `openclaw channels add`
   - Directo: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie el Gateway y envíe un mensaje directo al bot de Synology Chat.

Detalles de autenticación del Webhook:

- OpenClaw acepta el token del Webhook saliente desde `body.token`, después
  desde `?token=...` y, por último, desde los encabezados.
- Formatos de encabezado aceptados:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Los tokens vacíos o ausentes provocan un rechazo seguro.
- Las cargas útiles pueden ser `application/x-www-form-urlencoded` o `application/json`; se requieren `token`, `user_id` y `text`.

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

Para la cuenta predeterminada, puede utilizar variables de entorno:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separados por comas)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Los valores de configuración prevalecen sobre las variables de entorno.

`SYNOLOGY_CHAT_INCOMING_URL` y `SYNOLOGY_NAS_HOST` no pueden establecerse desde un archivo `.env` del espacio de trabajo; consulte [Archivos `.env` del espacio de trabajo](/es/gateway/security#workspace-env-files).

## Política de mensajes directos y control de acceso

- Valores admitidos de `dmPolicy`: `allowlist` (predeterminado), `open` y `disabled`. Synology Chat no dispone de un flujo de vinculación; autorice a los remitentes añadiendo sus identificadores numéricos de usuario de Synology a `allowedUserIds`.
- `allowedUserIds` acepta una lista (o una cadena separada por comas) de identificadores de usuario de Synology.
- En el modo `allowlist`, una lista `allowedUserIds` vacía se considera una configuración incorrecta y la ruta del Webhook no se iniciará.
- `dmPolicy: "open"` permite mensajes directos públicos únicamente cuando `allowedUserIds` incluye `"*"`; con entradas restrictivas, solo pueden conversar los usuarios coincidentes. El modo `open` con una lista `allowedUserIds` vacía también impide que se inicie la ruta.
- `dmPolicy: "disabled"` bloquea los mensajes directos.
- De forma predeterminada, la vinculación del destinatario de las respuestas permanece asociada al `user_id` numérico estable. `channels.synology-chat.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la búsqueda mediante nombres de usuario o apodos modificables para entregar respuestas.

## Entrega saliente

Utilice identificadores numéricos de usuario de Synology Chat como destinos. Se aceptan los prefijos `synology-chat:`, `synology_chat:` y `synology:`.

Ejemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

El texto saliente se divide en fragmentos de 2000 caracteres. Se admite el envío de contenido multimedia mediante la entrega de archivos basada en URL: el NAS descarga y adjunta el archivo (máximo de 32 MB). Las URL de archivos salientes deben utilizar `http` o `https`, y los destinos de red privados o bloqueados de otro modo se rechazan antes de que OpenClaw reenvíe la URL al Webhook del NAS.

## Varias cuentas

Se admiten varias cuentas de Synology Chat en `channels.synology-chat.accounts`.
Cada cuenta puede reemplazar el token, la URL entrante, la ruta del Webhook, la política de mensajes directos y los límites.
Las sesiones de mensajes directos se aíslan por cuenta y usuario, por lo que el mismo `user_id` numérico
en dos cuentas diferentes de Synology no comparte el estado de la transcripción.
Asigne a cada cuenta habilitada un `webhookPath` distinto. OpenClaw rechaza las rutas exactas duplicadas
y se niega a iniciar cuentas con nombre que solo hereden una ruta de Webhook compartida en configuraciones con varias cuentas.
Si necesita intencionadamente la herencia heredada para una cuenta con nombre, establezca
`dangerouslyAllowInheritedWebhookPath: true` en esa cuenta o en `channels.synology-chat`,
pero las rutas exactas duplicadas se siguen rechazando de forma segura. Prefiera rutas explícitas para cada cuenta.

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

- Mantenga `token` en secreto y rótelo si se filtra.
- Mantenga `allowInsecureSsl: false` salvo que confíe explícitamente en un certificado local autofirmado del NAS.
- Las solicitudes de Webhook entrantes se verifican mediante token y se limitan por remitente (`rateLimitPerMinute`, 30 de forma predeterminada).
- Las comprobaciones de tokens no válidos utilizan una comparación de secretos en tiempo constante y aplican un rechazo seguro; los intentos repetidos con tokens no válidos bloquean temporalmente la dirección IP de origen.
- El texto de los mensajes entrantes se depura para detectar patrones conocidos de inyección de instrucciones y se trunca a 4000 caracteres.
- Prefiera `dmPolicy: "allowlist"` en producción.
- Mantenga `dangerouslyAllowNameMatching` desactivado salvo que necesite explícitamente la entrega de respuestas heredada basada en nombres de usuario.
- Mantenga `dangerouslyAllowInheritedWebhookPath` desactivado salvo que acepte explícitamente el riesgo del enrutamiento mediante rutas compartidas en una configuración con varias cuentas.

## Solución de problemas

- `Missing required fields (token, user_id, text)`:
  - a la carga útil del Webhook saliente le falta uno de los campos obligatorios
  - si Synology envía el token en los encabezados, asegúrese de que el gateway/proxy conserve esos encabezados
- `Invalid token`:
  - el secreto del Webhook saliente no coincide con `channels.synology-chat.token`
  - la solicitud está llegando a una cuenta o ruta de Webhook incorrecta
  - un proxy inverso eliminó el encabezado del token antes de que la solicitud llegara a OpenClaw
- `Rate limit exceeded`:
  - demasiados intentos con tokens no válidos desde el mismo origen pueden bloquear temporalmente ese origen
  - los remitentes autenticados también tienen un límite independiente de mensajes por usuario
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` está habilitado, pero no hay usuarios configurados
- `User not authorized`:
  - el `user_id` numérico del remitente no figura en `allowedUserIds`

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de la seguridad
