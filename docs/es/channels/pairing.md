---
read_when:
    - Configurar el control de acceso para mensajes directos
    - Vincular un nuevo nodo de iOS/Android
    - Revisar la postura de seguridad de OpenClaw
summary: 'Descripción general de la vinculación: aprobar quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Vinculación
x-i18n:
    generated_at: "2026-04-24T05:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

La “vinculación” es el paso explícito de **aprobación del propietario** de OpenClaw.
Se usa en dos lugares:

1. **Vinculación de mensajes directos** (quién puede hablar con el bot)
2. **Vinculación de nodos** (qué dispositivos/nodos pueden unirse a la red de gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Vinculación de mensajes directos (acceso a chat entrante)

Cuando un canal está configurado con la política de mensajes directos `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas predeterminadas de mensajes directos están documentadas en: [Seguridad](/es/gateway/security)

Códigos de vinculación:

- 8 caracteres, en mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de vinculación cuando se crea una nueva solicitud (aproximadamente una vez por hora por remitente).
- Las solicitudes pendientes de vinculación de mensajes directos están limitadas a **3 por canal** de forma predeterminada; las solicitudes adicionales se ignoran hasta que una caduque o sea aprobada.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canales compatibles: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Dónde se guarda el estado

Se almacena en `~/.openclaw/credentials/`:

- Solicitudes pendientes: `<channel>-pairing.json`
- Almacén de lista de permitidos aprobada:
  - Cuenta predeterminada: `<channel>-allowFrom.json`
  - Cuenta no predeterminada: `<channel>-<accountId>-allowFrom.json`

Comportamiento del alcance por cuenta:

- Las cuentas no predeterminadas solo leen/escriben su archivo de lista de permitidos con alcance.
- La cuenta predeterminada usa el archivo de lista de permitidos sin alcance del canal.

Trata estos archivos como sensibles (controlan el acceso a tu asistente).

Importante: este almacén es para acceso por mensajes directos. La autorización de grupos es independiente.
Aprobar un código de vinculación de mensaje directo no permite automáticamente que ese remitente ejecute comandos de grupo ni controle el bot en grupos. Para el acceso a grupos, configura las listas de permitidos explícitas del canal para grupos (por ejemplo `groupAllowFrom`, `groups` o sobrescrituras por grupo/tema según el canal).

## 2) Vinculación de dispositivos nodo (nodos iOS/Android/macOS/sin interfaz)

Los nodos se conectan a Gateway como **dispositivos** con `role: node`. Gateway
crea una solicitud de vinculación de dispositivo que debe aprobarse.

### Vincular mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes hacer la vinculación inicial del dispositivo completamente desde Telegram:

1. En Telegram, envía a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje aparte con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app OpenClaw para iOS → Ajustes → Gateway.
4. Pega el código de configuración y conéctate.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los alcances) y luego aprueba.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket de Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de arranque inicial de un solo dispositivo y corta duración usado para el protocolo inicial de vinculación

Ese token de arranque inicial contiene el perfil integrado de arranque para vinculación:

- el token `node` principal transferido sigue siendo `scopes: []`
- cualquier token `operator` transferido sigue limitado a la lista de permitidos de arranque:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- las comprobaciones de alcance de arranque usan prefijos por rol, no un único conjunto plano de alcances:
  las entradas de alcance de operador solo satisfacen solicitudes de operador, y los roles que no son de operador
  deben seguir solicitando alcances bajo el prefijo de su propio rol

Trata el código de configuración como una contraseña mientras sea válido.

### Aprobar un dispositivo nodo

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si el mismo dispositivo reintenta con detalles de autenticación distintos (por ejemplo, distinto
rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo
`requestId`.

Importante: un dispositivo ya vinculado no obtiene acceso más amplio en silencio. Si
se reconecta solicitando más alcances o un rol más amplio, OpenClaw mantiene la
aprobación existente tal como está y crea una nueva solicitud pendiente de actualización. Usa
`openclaw devices list` para comparar el acceso actualmente aprobado con el acceso
recién solicitado antes de aprobar.

### Almacenamiento del estado de vinculación de nodos

Se almacena en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos vinculados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) es un
  almacén de vinculación independiente propiedad de gateway. Los nodos WS siguen requiriendo vinculación de dispositivo.
- El registro de vinculación es la fuente de verdad duradera para los roles aprobados. Los
  tokens de dispositivo activos siguen limitados a ese conjunto de roles aprobados; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentación relacionada

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualización segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canal:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/es/channels/bluebubbles)
  - iMessage (heredado): [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
