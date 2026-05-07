---
read_when:
    - Configurar el control de acceso a los mensajes directos
    - Emparejamiento de un nuevo Node iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Resumen del emparejamiento: aprueba quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-05-07T01:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" es el paso explícito de aprobación de acceso de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento por DM** (quién puede hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento por DM (acceso de chat entrante)

Cuando un canal está configurado con la política de DM `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas de DM predeterminadas están documentadas en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista de permitidos de DM efectiva incluye `"*"`.
La configuración y la validación requieren ese comodín para las configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas `allowFrom` concretas, en tiempo de ejecución se siguen admitiendo
solo esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes de emparejamiento por DM pendientes están limitadas a **3 por canal** de forma predeterminada; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si aún no hay un propietario de comandos configurado, aprobar un código de emparejamiento por DM también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso proporciona a las configuraciones iniciales un propietario explícito para comandos privilegiados y avisos de aprobación de exec.
Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso por DM;
no añaden más propietarios.

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

Comportamiento de ámbito de cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con ámbito.
- La cuenta predeterminada usa el archivo de lista de permitidos sin ámbito con ámbito de canal.

Trátalos como información sensible (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para acceso por DM. La autorización de grupos es independiente.
Aprobar un código de emparejamiento por DM no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración separado
en `commands.ownerAllowFrom`, y la entrega de chats de grupo sigue obedeciendo las listas de permitidos de grupo
del canal (por ejemplo `groupAllowFrom`, `groups` o anulaciones por grupo
o por tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes hacer el emparejamiento inicial de dispositivo completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app de iOS de OpenClaw → Settings → Gateway.
4. Escanea el código QR o pega el código de configuración y conéctate.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los ámbitos), luego aprueba.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de inicialización de corta duración para un solo dispositivo que se usa en el intercambio inicial de emparejamiento

Ese token de inicialización lleva el perfil de inicialización de emparejamiento integrado:

- el token `node` principal traspasado conserva `scopes: []`
- cualquier token `operator` traspasado permanece limitado a la lista de permitidos de inicialización:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- las comprobaciones de ámbito de inicialización tienen prefijo de rol, no un único grupo plano de ámbitos:
  las entradas de ámbito de operador solo satisfacen solicitudes de operador, y los roles que no son de operador
  deben seguir solicitando ámbitos bajo su propio prefijo de rol
- la rotación/revocación posterior de tokens sigue limitada tanto por el contrato de rol aprobado del dispositivo
  como por los ámbitos de operador de la sesión llamadora

Trata el código de configuración como una contraseña mientras sea válido.

Para Tailscale, emparejamiento móvil público u otro emparejamiento móvil remoto, usa Tailscale Serve/Funnel
u otra URL de Gateway `wss://`. Los códigos de configuración `ws://` en texto claro se aceptan solo
para local loopback, direcciones de LAN privada, hosts Bonjour `.local` y el host del emulador de Android.
Las direcciones CGNAT de tailnet, los nombres `.ts.net` y los hosts públicos siguen
cerrándose por defecto antes de la emisión de QR/código de configuración.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando se deniega una aprobación explícita porque la sesión de dispositivo emparejado que aprueba
se abrió con ámbito solo de emparejamiento, la CLI reintenta la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado existente con capacidad de administración recupere un nuevo
emparejamiento de Control UI/navegador sin editar `devices/paired.json` a mano. El
Gateway sigue validando la conexión reintentada; los tokens que no pueden autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo reintenta con detalles de autenticación diferentes (por ejemplo, distinto
rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio de forma silenciosa. Si se reconecta solicitando más ámbitos o un rol más amplio, OpenClaw conserva la aprobación existente tal cual y crea una nueva solicitud pendiente de actualización. Usa `openclaw devices list` para comparar el acceso aprobado actualmente con el acceso recién solicitado antes de aprobar.
</Note>

### Autoaprobación opcional de Node por CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de nodos estrictamente controladas,
puedes optar por la autoaprobación inicial de Node con CIDR explícitos o IP exactas:

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

Esto solo se aplica a solicitudes nuevas de emparejamiento con `role: node` sin ámbitos solicitados.
Los clientes de operador, navegador, Control UI y WebChat siguen requiriendo aprobación manual.
Los cambios de rol, ámbito, metadatos y clave pública siguen requiriendo aprobación manual.

### Almacenamiento de estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento separado propiedad del gateway. Los nodos WS siguen requiriendo emparejamiento de dispositivo.
- El registro de emparejamiento es la fuente duradera de verdad para los roles aprobados. Los tokens de dispositivo
  activos siguen limitados a ese conjunto de roles aprobado; una entrada de token suelta
  fuera de los roles aprobados no crea nuevo acceso.

## Documentos relacionados

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualizar de forma segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canales:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - BlueBubbles (puente heredado de iMessage): [BlueBubbles](/es/channels/bluebubbles)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
