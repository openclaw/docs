---
read_when:
    - Configurar el control de acceso a los mensajes directos
    - Emparejar un nuevo Node de iOS/Android
    - Revisar la postura de seguridad de OpenClaw
summary: 'Resumen del emparejamiento: aprueba quién puede enviarte mensajes directos y qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-04-26T11:24:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

“El emparejamiento” es el paso explícito de **aprobación del propietario** de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento de DM** (quién puede hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Security](/es/gateway/security)

## 1) Emparejamiento de DM (acceso de chat entrante)

Cuando un canal está configurado con la política de DM `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas de DM predeterminadas están documentadas en: [Security](/es/gateway/security)

Códigos de emparejamiento:

- 8 caracteres, mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes pendientes de emparejamiento de DM están limitadas a **3 por canal** de forma predeterminada; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canales compatibles: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Dónde vive el estado

Se almacena en `~/.openclaw/credentials/`:

- Solicitudes pendientes: `<channel>-pairing.json`
- Almacén de lista de permitidos aprobados:
  - Cuenta predeterminada: `<channel>-allowFrom.json`
  - Cuenta no predeterminada: `<channel>-<accountId>-allowFrom.json`

Comportamiento del alcance por cuenta:

- Las cuentas no predeterminadas solo leen/escriben su archivo de lista de permitidos con alcance específico.
- La cuenta predeterminada usa el archivo de lista de permitidos sin alcance específico del canal.

Trátalos como información sensible (controlan el acceso a tu asistente).

Importante: este almacén es para acceso de DM. La autorización de grupos es independiente.
Aprobar un código de emparejamiento de DM no permite automáticamente que ese remitente ejecute comandos de grupo ni controle el bot en grupos. Para el acceso a grupos, configura las listas de permitidos explícitas del canal para grupos (por ejemplo, `groupAllowFrom`, `groups` o anulaciones por grupo/por tema, según el canal).

## 2) Emparejamiento de dispositivos Node (nodos de iOS/Android/macOS/sin interfaz)

Los Nodes se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes realizar el emparejamiento inicial del dispositivo completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje independiente con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app de OpenClaw para iOS → Ajustes → Gateway.
4. Pega el código de configuración y conéctate.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los alcances) y luego aprueba.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap temporal de un solo dispositivo usado para el protocolo inicial de emparejamiento

Ese token bootstrap lleva el perfil bootstrap de emparejamiento integrado:

- el token `node` principal transferido permanece en `scopes: []`
- cualquier token `operator` transferido permanece limitado a la lista de permitidos bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- las comprobaciones de alcance bootstrap usan prefijos de rol, no un único conjunto plano de alcances:
  las entradas de alcance de operator solo satisfacen solicitudes de operator, y los roles no operator
  deben seguir solicitando alcances bajo su propio prefijo de rol
- la rotación/revocación posterior de tokens sigue limitada tanto por el contrato de rol aprobado del dispositivo como por los alcances de operator de la sesión solicitante

Trata el código de configuración como una contraseña mientras sea válido.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si el mismo dispositivo reintenta con detalles de autenticación distintos (por ejemplo, un rol/alcances/clave pública diferentes), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.

Importante: un dispositivo ya emparejado no obtiene un acceso más amplio de forma silenciosa. Si se
reconecta solicitando más alcances o un rol más amplio, OpenClaw mantiene la
aprobación existente tal como está y crea una nueva solicitud pendiente de ampliación. Usa
`openclaw devices list` para comparar el acceso actualmente aprobado con el acceso recién
solicitado antes de aprobar.

### Autoaprobación opcional de Nodes de CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de Nodes muy controladas,
puedes activar la autoaprobación inicial de Nodes con CIDR explícitos o IP exactas:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Esto solo se aplica a solicitudes nuevas de emparejamiento con `role: node` sin alcances
solicitados. Los clientes Operator, navegador, Control UI y WebChat siguen requiriendo
aprobación manual. Los cambios de rol, alcance, metadatos y clave pública siguen requiriendo
aprobación manual.

### Almacenamiento del estado de emparejamiento de Node

Se almacena en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) es un
  almacén de emparejamiento independiente propiedad del Gateway. Los Nodes de WS siguen requiriendo emparejamiento de dispositivo.
- El registro de emparejamiento es la fuente de verdad duradera para los roles aprobados. Los
  tokens activos del dispositivo siguen limitados a ese conjunto de roles aprobado; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentación relacionada

- Modelo de seguridad + inyección de prompts: [Security](/es/gateway/security)
- Actualizar de forma segura (ejecuta doctor): [Updating](/es/install/updating)
- Configuraciones de canal:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/es/channels/bluebubbles)
  - iMessage (heredado): [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
