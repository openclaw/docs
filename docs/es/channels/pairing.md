---
read_when:
    - Configurar el control de acceso a mensajes directos
    - Emparejar un nuevo nodo iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Resumen del emparejamiento: autoriza quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-05-02T05:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

El “emparejamiento” es el paso explícito de aprobación de acceso de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento de DM** (quién tiene permiso para hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos tienen permiso para unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento de DM (acceso de chat entrante)

Cuando un canal está configurado con la política de DM `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas de DM predeterminadas están documentadas en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista de permitidos de DM efectiva incluye `"*"`.
La configuración y la validación requieren ese comodín para configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas `allowFrom` concretas, en tiempo de ejecución todavía se admiten
solo esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Expiran después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes pendientes de emparejamiento de DM tienen un límite predeterminado de **3 por canal**; las solicitudes adicionales se ignoran hasta que una expire o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si todavía no hay un propietario de comandos configurado, aprobar un código de emparejamiento de DM también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso da a las configuraciones iniciales un propietario explícito para comandos privilegiados y solicitudes de aprobación de exec.
Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso de DM;
no agregan más propietarios.

Canales compatibles: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remitentes reutilizables

Usa `accessGroups` de nivel superior cuando el mismo conjunto de remitentes de confianza deba aplicarse a
varios canales de mensajes o tanto a listas de permitidos de DM como de grupos.

Los grupos estáticos usan `type: "message.senders"` y se referencian con
`accessGroup:<name>` desde las listas de permitidos del canal:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Los grupos de acceso están documentados en detalle aquí: [Grupos de acceso](/es/channels/access-groups)

### Dónde vive el estado

Almacenado en `~/.openclaw/credentials/`:

- Solicitudes pendientes: `<channel>-pairing.json`
- Almacén de lista de permitidos aprobada:
  - Cuenta predeterminada: `<channel>-allowFrom.json`
  - Cuenta no predeterminada: `<channel>-<accountId>-allowFrom.json`

Comportamiento del alcance por cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con alcance.
- La cuenta predeterminada usa el archivo de lista de permitidos sin alcance específico del canal.

Trátalos como información sensible (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para acceso de DM. La autorización de grupo es independiente.
Aprobar un código de emparejamiento de DM no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración separado
en `commands.ownerAllowFrom`, y la entrega de chats grupales sigue obedeciendo las listas de permitidos de grupo
del canal (por ejemplo `groupAllowFrom`, `groups`, o anulaciones por grupo
o por tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes hacer el emparejamiento inicial de dispositivos completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app de OpenClaw para iOS → Settings → Gateway.
4. Pega el código de configuración y conéctate.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los alcances), luego aprueba.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de inicialización de corta duración y de un solo dispositivo que se usa para el intercambio inicial de emparejamiento

Ese token de inicialización lleva el perfil de inicialización de emparejamiento integrado:

- el token `node` principal entregado permanece con `scopes: []`
- cualquier token `operator` entregado permanece limitado a la lista de permitidos de inicialización:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- las comprobaciones de alcance de inicialización tienen prefijo de rol, no un único conjunto plano de alcances:
  las entradas de alcance de operador solo satisfacen solicitudes de operador, y los roles que no son de operador
  aún deben solicitar alcances bajo su propio prefijo de rol
- la rotación/revocación posterior de tokens sigue limitada tanto por el contrato de rol aprobado
  del dispositivo como por los alcances de operador de la sesión llamante

Trata el código de configuración como una contraseña mientras sea válido.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si el mismo dispositivo reintenta con detalles de autenticación distintos (por ejemplo, una clave pública,
rol o alcances diferentes), la solicitud pendiente anterior se reemplaza y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio silenciosamente. Si se vuelve a conectar solicitando más alcances o un rol más amplio, OpenClaw conserva la aprobación existente tal cual y crea una nueva solicitud de actualización pendiente. Usa `openclaw devices list` para comparar el acceso aprobado actualmente con el nuevo acceso solicitado antes de aprobar.
</Note>

### Aprobación automática opcional de Node con CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de Node estrechamente controladas,
puedes optar por la aprobación automática inicial de Node con CIDR explícitos o IP exactas:

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

Esto solo se aplica a solicitudes nuevas de emparejamiento con `role: node` sin
alcances solicitados. Los clientes de operador, navegador, Control UI y WebChat siguen requiriendo aprobación
manual. Los cambios de rol, alcance, metadatos y clave pública siguen requiriendo aprobación
manual.

### Almacenamiento del estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes expiran)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento separado propiedad del Gateway. Los nodos WS siguen requiriendo emparejamiento de dispositivo.
- El registro de emparejamiento es la fuente de verdad duradera para los roles aprobados. Los tokens de dispositivo
  activos permanecen limitados a ese conjunto de roles aprobados; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentos relacionados

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualizar de forma segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canales:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/es/channels/bluebubbles)
  - iMessage (heredado): [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
