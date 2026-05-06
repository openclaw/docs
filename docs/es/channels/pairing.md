---
read_when:
    - Configurar el control de acceso por DM
    - Emparejar un nuevo nodo iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Resumen del emparejamiento: aprueba quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-05-06T17:52:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

"Emparejamiento" es el paso explícito de aprobación de acceso de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento por DM** (quién puede hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento por DM (acceso de chat entrante)

Cuando un canal está configurado con la política de DM `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas de DM predeterminadas están documentadas en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista de permitidos de DM efectiva incluye `"*"`.
La configuración y la validación requieren ese comodín para configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas concretas de `allowFrom`, en tiempo de ejecución aún se admite
solo a esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una nueva solicitud (aproximadamente una vez por hora por remitente).
- Las solicitudes de emparejamiento por DM pendientes están limitadas a **3 por canal** de forma predeterminada; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si todavía no hay un propietario de comandos configurado, aprobar un código de emparejamiento por DM también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso da a las configuraciones iniciales un propietario explícito para comandos privilegiados y solicitudes de aprobación
de ejecución. Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso por DM;
no agregan más propietarios.

Canales admitidos: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

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

Comportamiento del ámbito de cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con ámbito.
- La cuenta predeterminada usa el archivo de lista de permitidos sin ámbito con ámbito de canal.

Trata estos archivos como sensibles (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para el acceso por DM. La autorización de grupos es independiente.
Aprobar un código de emparejamiento por DM no permite automáticamente a ese remitente ejecutar comandos de grupo
ni controlar el bot en grupos. La inicialización del primer propietario es un estado de configuración separado
en `commands.ownerAllowFrom`, y la entrega de chat grupal aún sigue las listas de permitidos de grupo
del canal (por ejemplo `groupAllowFrom`, `groups`, o anulaciones por grupo
o por tema según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes realizar el emparejamiento inicial del dispositivo completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app de iOS de OpenClaw → Configuración → Gateway.
4. Escanea el código QR o pega el código de configuración y conéctate.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los ámbitos), luego aprueba.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de inicialización de corta duración y de un solo dispositivo usado para el intercambio inicial de emparejamiento

Ese token de inicialización lleva el perfil de inicialización de emparejamiento integrado:

- el token `node` principal transferido permanece con `scopes: []`
- cualquier token `operator` transferido permanece limitado a la lista de permitidos de inicialización:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- las comprobaciones de ámbito de inicialización tienen prefijo de rol, no son un único grupo plano de ámbitos:
  las entradas de ámbito de operador solo satisfacen solicitudes de operador, y los roles que no son de operador
  aún deben solicitar ámbitos bajo su propio prefijo de rol
- la rotación/revocación posterior de tokens sigue limitada tanto por el contrato de rol aprobado
  del dispositivo como por los ámbitos de operador de la sesión que llama

Trata el código de configuración como una contraseña mientras sea válido.

Para emparejamiento móvil remoto mediante Tailscale, público u otro, usa Tailscale Serve/Funnel
u otra URL de Gateway `wss://`. Los códigos de configuración en texto claro `ws://` solo se aceptan
para local loopback, direcciones LAN privadas, hosts Bonjour `.local` y el host del emulador
de Android. Las direcciones CGNAT de tailnet, los nombres `.ts.net` y los hosts públicos aún
fallan de forma cerrada antes de la emisión del código QR/código de configuración.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando una aprobación explícita se deniega porque la sesión del dispositivo emparejado que aprueba
se abrió con ámbito solo de emparejamiento, la CLI reintenta la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado existente con capacidad de administración recupere un nuevo
emparejamiento de Control UI/navegador sin editar `devices/paired.json` a mano. El
Gateway aún valida la conexión reintentada; los tokens que no pueden autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo reintenta con detalles de autenticación diferentes (por ejemplo, distintos
rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio de forma silenciosa. Si se vuelve a conectar solicitando más ámbitos o un rol más amplio, OpenClaw mantiene la aprobación existente tal cual y crea una nueva solicitud de actualización pendiente. Usa `openclaw devices list` para comparar el acceso aprobado actualmente con el nuevo acceso solicitado antes de aprobar.
</Note>

### Aprobación automática opcional de Node por CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de Node estrictamente controladas,
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

Esto solo se aplica a solicitudes nuevas de emparejamiento con `role: node` sin ámbitos
solicitados. Los clientes de operador, navegador, Control UI y WebChat aún requieren aprobación
manual. Los cambios de rol, ámbito, metadatos y clave pública aún requieren aprobación
manual.

### Almacenamiento del estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento independiente propiedad del gateway. Los nodos WS aún requieren emparejamiento de dispositivo.
- El registro de emparejamiento es la fuente duradera de verdad para los roles aprobados. Los tokens de dispositivo
  activos permanecen limitados a ese conjunto de roles aprobados; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentación relacionada

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualizar de forma segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canal:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/es/channels/bluebubbles)
  - iMessage (heredado): [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
