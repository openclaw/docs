---
read_when:
    - Configuración del control de acceso a mensajes directos
    - Emparejar un nuevo Node iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Resumen del emparejamiento: aprueba quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-05-10T19:22:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

"Emparejamiento" es el paso explícito de aprobación de acceso de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento de DM** (quién tiene permitido hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos tienen permitido unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento de DM (acceso de chat entrante)

Cuando un canal está configurado con la política de DM `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebas.

Las políticas de DM predeterminadas están documentadas en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista de permitidos de DM efectiva incluye `"*"`.
La configuración y la validación requieren ese comodín para las configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas `allowFrom` concretas, el runtime sigue admitiendo
solo a esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes pendientes de emparejamiento de DM están limitadas a **3 por canal** de forma predeterminada; las solicitudes adicionales se ignoran hasta que una caduque o sea aprobada.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si aún no se ha configurado ningún propietario de comandos, aprobar un código de emparejamiento de DM también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso da a las configuraciones iniciales un propietario explícito para comandos privilegiados y solicitudes de aprobación de exec.
Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso de DM;
no agregan más propietarios.

Canales compatibles: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

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

Comportamiento de alcance por cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con alcance propio.
- La cuenta predeterminada usa el archivo de lista de permitidos sin alcance específico del canal.

Trátalos como sensibles (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para acceso de DM. La autorización de grupos es independiente.
Aprobar un código de emparejamiento de DM no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración separado
en `commands.ownerAllowFrom`, y la entrega de chat de grupo sigue obedeciendo las listas de permitidos de grupo
del canal (por ejemplo `groupAllowFrom`, `groups`, o anulaciones por grupo
o por tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/headless)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes hacer el emparejamiento inicial del dispositivo íntegramente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app OpenClaw para iOS → Ajustes → Gateway.
4. Escanea el código QR o pega el código de configuración y conecta.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los alcances), luego aprueba.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de inicialización de un solo dispositivo y corta duración usado para el handshake de emparejamiento inicial

Ese token de inicialización lleva el perfil de inicialización de emparejamiento integrado:

- el token `node` principal entregado permanece en `scopes: []`
- cualquier token `operator` entregado permanece limitado a la lista de permitidos de inicialización:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- las comprobaciones de alcance de inicialización llevan prefijo de rol, no son un único conjunto plano de alcances:
  las entradas de alcance de operador solo satisfacen solicitudes de operador, y los roles que no son de operador
  aún deben solicitar alcances bajo su propio prefijo de rol
- la rotación/revocación posterior de tokens permanece limitada tanto por el contrato de rol aprobado
  del dispositivo como por los alcances de operador de la sesión llamadora

Trata el código de configuración como una contraseña mientras sea válido.

Para Tailscale, emparejamiento móvil público u otro emparejamiento móvil remoto, usa Tailscale Serve/Funnel
u otra URL `wss://` del Gateway. Los códigos de configuración `ws://` en texto plano solo se aceptan
para loopback, direcciones LAN privadas, hosts Bonjour `.local` y el host del emulador de Android.
Las direcciones CGNAT de tailnet, los nombres `.ts.net` y los hosts públicos aún
fallan en modo cerrado antes de la emisión del QR/código de configuración.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando se deniega una aprobación explícita porque la sesión del dispositivo emparejado que aprueba
se abrió con alcance solo de emparejamiento, la CLI reintenta la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado existente con capacidad de administrador recupere un nuevo
emparejamiento de Control UI/navegador sin editar `devices/paired.json` manualmente. El
Gateway aún valida la conexión reintentada; los tokens que no pueden autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo reintenta con detalles de autenticación distintos (por ejemplo, distinto
rol/alcances/clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio de forma silenciosa. Si se reconecta solicitando más alcances o un rol más amplio, OpenClaw mantiene la aprobación existente tal como está y crea una nueva solicitud pendiente de actualización. Usa `openclaw devices list` para comparar el acceso actualmente aprobado con el acceso recién solicitado antes de aprobar.
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

Esto solo se aplica a solicitudes nuevas de emparejamiento `role: node` sin
alcances solicitados. Los clientes de operador, navegador, Control UI y WebChat aún requieren aprobación
manual. Los cambios de rol, alcance, metadatos y clave pública aún requieren aprobación
manual.

### Almacenamiento del estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento independiente propiedad del gateway. Los nodos WS aún requieren emparejamiento de dispositivos.
- El registro de emparejamiento es la fuente de verdad duradera para los roles aprobados. Los tokens de dispositivo
  activos permanecen limitados a ese conjunto de roles aprobado; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentos relacionados

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualizar de forma segura (ejecuta doctor): [Actualización](/es/install/updating)
- Configuraciones de canales:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
