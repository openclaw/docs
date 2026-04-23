---
read_when:
    - Configurar Synology Chat con OpenClaw
    - Depuración del enrutamiento del Webhook de Synology Chat
summary: Configuración del Webhook de Synology Chat y configuración de OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T13:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Estado: canal de mensajes directos de Plugin integrado que usa Webhooks de Synology Chat.
El Plugin acepta mensajes entrantes desde Webhooks salientes de Synology Chat y envía respuestas
a través de un Webhook entrante de Synology Chat.

## Plugin integrado

Synology Chat se incluye como Plugin integrado en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no requieren una instalación aparte.

Si usas una compilación antigua o una instalación personalizada que excluye Synology Chat,
instálalo manualmente:

Instalar desde una copia local del repositorio:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Asegúrate de que el Plugin de Synology Chat esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden añadirlo manualmente desde una copia del código fuente con el comando anterior.
   - `openclaw onboard` ahora muestra Synology Chat en la misma lista de configuración de canales que `openclaw channels add`.
   - Configuración no interactiva: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. En las integraciones de Synology Chat:
   - Crea un Webhook entrante y copia su URL.
   - Crea un Webhook saliente con tu token secreto.
3. Dirige la URL del Webhook saliente a tu Gateway de OpenClaw:
   - `https://gateway-host/webhook/synology` de forma predeterminada.
   - O tu `channels.synology-chat.webhookPath` personalizado.
4. Completa la configuración en OpenClaw.
   - Guiada: `openclaw onboard`
   - Directa: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicia el Gateway y envía un MD al bot de Synology Chat.

Detalles de autenticación del Webhook:

- OpenClaw acepta el token del Webhook saliente desde `body.token`, luego
  `?token=...`, y después desde los encabezados.
- Formas de encabezado aceptadas:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Los tokens vacíos o ausentes fallan en modo cerrado.

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

`SYNOLOGY_CHAT_INCOMING_URL` no puede definirse desde un `.env` del espacio de trabajo; consulta [archivos `.env` del espacio de trabajo](/es/gateway/security).

## Política de MD y control de acceso

- `dmPolicy: "allowlist"` es la opción predeterminada recomendada.
- `allowedUserIds` acepta una lista (o una cadena separada por comas) de IDs de usuario de Synology.
- En modo `allowlist`, una lista vacía de `allowedUserIds` se trata como una mala configuración y la ruta del Webhook no se iniciará (usa `dmPolicy: "open"` para permitir a todos).
- `dmPolicy: "open"` permite cualquier remitente.
- `dmPolicy: "disabled"` bloquea los MD.
- La vinculación del destinatario de respuesta permanece en `user_id` numérico estable de forma predeterminada. `channels.synology-chat.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la búsqueda por nombre de usuario/apodo mutable para la entrega de respuestas.
- Las aprobaciones de emparejamiento funcionan con:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Entrega saliente

Usa IDs numéricos de usuario de Synology Chat como destinos.

Ejemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Se admiten envíos de medios mediante entrega de archivos basada en URL.
Las URL de archivos salientes deben usar `http` o `https`, y los destinos de red privados o bloqueados por cualquier otro motivo se rechazan antes de que OpenClaw reenvíe la URL al Webhook del NAS.

## Varias cuentas

Se admiten varias cuentas de Synology Chat en `channels.synology-chat.accounts`.
Cada cuenta puede sobrescribir token, URL entrante, ruta del Webhook, política de MD y límites.
Las sesiones de mensajes directos se aíslan por cuenta y usuario, de modo que el mismo `user_id` numérico
en dos cuentas distintas de Synology no comparte el estado de la transcripción.
Asigna a cada cuenta habilitada un `webhookPath` distinto. OpenClaw ahora rechaza rutas exactas duplicadas
y se niega a iniciar cuentas con nombre que solo heredan una ruta de Webhook compartida en configuraciones de varias cuentas.
Si intencionadamente necesitas herencia heredada para una cuenta con nombre, establece
`dangerouslyAllowInheritedWebhookPath: true` en esa cuenta o en `channels.synology-chat`,
pero las rutas exactas duplicadas siguen rechazándose en modo cerrado. Prefiere rutas explícitas por cuenta.

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
- Mantén `allowInsecureSsl: false` a menos que confíes explícitamente en un certificado local autofirmado del NAS.
- Las solicitudes entrantes al Webhook se verifican por token y se limitan por tasa por remitente.
- Las comprobaciones de token no válido usan comparación de secretos en tiempo constante y fallan en modo cerrado.
- Prefiere `dmPolicy: "allowlist"` en producción.
- Mantén `dangerouslyAllowNameMatching` desactivado a menos que necesites explícitamente la entrega de respuestas heredada basada en nombre de usuario.
- Mantén `dangerouslyAllowInheritedWebhookPath` desactivado a menos que aceptes explícitamente el riesgo de enrutamiento por ruta compartida en una configuración de varias cuentas.

## Solución de problemas

- `Missing required fields (token, user_id, text)`:
  - a la carga útil del Webhook saliente le falta uno de los campos obligatorios
  - si Synology envía el token en encabezados, asegúrate de que el Gateway/proxy conserve esos encabezados
- `Invalid token`:
  - el secreto del Webhook saliente no coincide con `channels.synology-chat.token`
  - la solicitud está llegando a la cuenta o ruta de Webhook equivocada
  - un proxy inverso eliminó el encabezado del token antes de que la solicitud llegara a OpenClaw
- `Rate limit exceeded`:
  - demasiados intentos de token no válido desde el mismo origen pueden bloquear temporalmente ese origen
  - los remitentes autenticados también tienen un límite de tasa de mensajes independiente por usuario
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` está habilitado, pero no hay usuarios configurados
- `User not authorized`:
  - el `user_id` numérico del remitente no está en `allowedUserIds`

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
