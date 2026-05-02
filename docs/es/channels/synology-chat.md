---
read_when:
    - Configuración de Synology Chat con OpenClaw
    - Depuración del enrutamiento de Webhook de Synology Chat
summary: Configuración del Webhook de Synology Chat y de OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T05:20:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Estado: canal de mensajes directos de Plugin incluido que usa Webhooks de Synology Chat.
El Plugin acepta mensajes entrantes de Webhooks salientes de Synology Chat y envía respuestas
mediante un Webhook entrante de Synology Chat.

## Plugin incluido

Synology Chat se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación separada.

Si estás en una compilación anterior o en una instalación personalizada que excluye Synology Chat,
instálalo manualmente:

Instalar desde un checkout local:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Asegúrate de que el Plugin de Synology Chat esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden agregarlo manualmente desde un checkout de código fuente con el comando anterior.
   - `openclaw onboard` ahora muestra Synology Chat en la misma lista de configuración de canales que `openclaw channels add`.
   - Configuración no interactiva: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. En las integraciones de Synology Chat:
   - Crea un Webhook entrante y copia su URL.
   - Crea un Webhook saliente con tu token secreto.
3. Apunta la URL del Webhook saliente a tu Gateway de OpenClaw:
   - `https://gateway-host/webhook/synology` de forma predeterminada.
   - O tu `channels.synology-chat.webhookPath` personalizado.
4. Completa la configuración en OpenClaw.
   - Guiada: `openclaw onboard`
   - Directa: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicia el Gateway y envía un DM al bot de Synology Chat.

Detalles de autenticación del Webhook:

- OpenClaw acepta el token del Webhook saliente desde `body.token`, luego
  `?token=...`, luego desde los encabezados.
- Formas de encabezado aceptadas:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Los tokens vacíos o ausentes fallan de forma cerrada.

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

Los valores de configuración sobrescriben las variables de entorno.

`SYNOLOGY_CHAT_INCOMING_URL` no se puede establecer desde un `.env` de espacio de trabajo; consulta [archivos `.env` de espacio de trabajo](/es/gateway/security).

## Política de DM y control de acceso

- `dmPolicy: "allowlist"` es el valor predeterminado recomendado.
- `allowedUserIds` acepta una lista (o cadena separada por comas) de IDs de usuario de Synology.
- En modo `allowlist`, una lista `allowedUserIds` vacía se trata como una mala configuración y la ruta del Webhook no se iniciará (usa `dmPolicy: "open"` con `allowedUserIds: ["*"]` para permitir todo).
- `dmPolicy: "open"` permite DMs públicos solo cuando `allowedUserIds` incluye `"*"`; con entradas restrictivas, solo los usuarios coincidentes pueden chatear.
- `dmPolicy: "disabled"` bloquea los DMs.
- La vinculación del destinatario de respuesta permanece en el `user_id` numérico estable de forma predeterminada. `channels.synology-chat.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la búsqueda por nombre de usuario/apodo mutable para la entrega de respuestas.
- Las aprobaciones de emparejamiento funcionan con:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Entrega saliente

Usa IDs de usuario numéricos de Synology Chat como destinos.

Ejemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

El envío de medios se admite mediante entrega de archivos basada en URL.
Las URL de archivos salientes deben usar `http` o `https`, y los destinos de red privados o bloqueados de otro modo se rechazan antes de que OpenClaw reenvíe la URL al Webhook del NAS.

## Varias cuentas

Se admiten varias cuentas de Synology Chat bajo `channels.synology-chat.accounts`.
Cada cuenta puede sobrescribir el token, la URL entrante, la ruta del Webhook, la política de DM y los límites.
Las sesiones de mensajes directos se aíslan por cuenta y usuario, por lo que el mismo `user_id` numérico
en dos cuentas de Synology diferentes no comparte el estado de la transcripción.
Asigna a cada cuenta habilitada un `webhookPath` distinto. OpenClaw ahora rechaza rutas exactas duplicadas
y se niega a iniciar cuentas con nombre que solo heredan una ruta de Webhook compartida en configuraciones de varias cuentas.
Si intencionalmente necesitas herencia heredada para una cuenta con nombre, establece
`dangerouslyAllowInheritedWebhookPath: true` en esa cuenta o en `channels.synology-chat`,
pero las rutas exactas duplicadas aún se rechazan de forma cerrada. Prefiere rutas explícitas por cuenta.

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
- Las solicitudes de Webhook entrantes se verifican por token y se limitan por tasa por remitente.
- Las comprobaciones de tokens no válidos usan comparación de secretos en tiempo constante y fallan de forma cerrada.
- Prefiere `dmPolicy: "allowlist"` para producción.
- Mantén `dangerouslyAllowNameMatching` desactivado salvo que necesites explícitamente la entrega de respuestas heredada basada en nombre de usuario.
- Mantén `dangerouslyAllowInheritedWebhookPath` desactivado salvo que aceptes explícitamente el riesgo de enrutamiento por ruta compartida en una configuración de varias cuentas.

## Solución de problemas

- `Missing required fields (token, user_id, text)`:
  - al payload del Webhook saliente le falta uno de los campos obligatorios
  - si Synology envía el token en encabezados, asegúrate de que el Gateway/proxy preserve esos encabezados
- `Invalid token`:
  - el secreto del Webhook saliente no coincide con `channels.synology-chat.token`
  - la solicitud está llegando a la cuenta/ruta de Webhook equivocada
  - un proxy inverso eliminó el encabezado de token antes de que la solicitud llegara a OpenClaw
- `Rate limit exceeded`:
  - demasiados intentos con token no válido desde la misma fuente pueden bloquear temporalmente esa fuente
  - los remitentes autenticados también tienen un límite de tasa de mensajes separado por usuario
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` está habilitado pero no hay usuarios configurados
- `User not authorized`:
  - el `user_id` numérico del remitente no está en `allowedUserIds`

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
