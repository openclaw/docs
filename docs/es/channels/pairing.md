---
read_when:
    - Configuración del control de acceso a mensajes directos
    - Emparejar un nuevo nodo iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Resumen de la vinculación: aprueba quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-05T17:39:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a3f76771d40606bf90ecaadef3f5b58f8cdbae9b2132ca5086c444371b61b87
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

`dmPolicy: "open"` solo es público cuando la lista de permitidos de DM efectiva incluye `"*"`.
La configuración y la validación requieren ese comodín para configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas concretas de `allowFrom`, en tiempo de ejecución todavía se admiten
solo esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes pendientes de emparejamiento por DM tienen un límite de **3 por cuenta de canal**; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Agrega `--notify` al comando de aprobación para avisar al solicitante en el mismo canal. Los canales con varias cuentas aceptan `--account <id>`.

Si todavía no hay un propietario de comandos configurado, aprobar un código de emparejamiento por DM también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso da a las configuraciones iniciales un propietario explícito para comandos privilegiados y solicitudes de aprobación de exec.
Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden
acceso por DM; no agregan más propietarios.

Canales compatibles (cualquier Plugin de canal instalado que declare emparejamiento; plugins externos como `openclaw-weixin` pueden agregar más): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

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

Los grupos de acceso se documentan en detalle aquí: [Grupos de acceso](/es/channels/access-groups)

### Dónde vive el estado

Almacenado en `~/.openclaw/credentials/`:

- Solicitudes pendientes: `<channel>-pairing.json`
- Almacén de lista de permitidos aprobada: `<channel>-<accountId>-allowFrom.json` (las aprobaciones para la
  cuenta predeterminada usan `<channel>-default-allowFrom.json`)

Comportamiento de alcance por cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con alcance.
- La cuenta predeterminada también sigue respetando un archivo heredado sin alcance `<channel>-allowFrom.json`
  de instalaciones antiguas; las entradas de ambos archivos se combinan al leer.

Trátalos como sensibles (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para acceso por DM. La autorización de grupo es independiente.
Aprobar un código de emparejamiento por DM no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración independiente
en `commands.ownerAllowFrom`, y la entrega de chat grupal todavía sigue las listas de permitidos de grupo
del canal (por ejemplo `groupAllowFrom`, `groups`, o anulaciones por grupo
o por tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar desde la Control UI (recomendado)

Usa una sesión de Control UI ya conectada con acceso `operator.admin`:

1. Abre la Control UI y selecciona **Nodos**.
2. En **Dispositivos**, haz clic en **Emparejar dispositivo móvil**.
3. En tu teléfono, abre la app de OpenClaw → **Configuración** → **Gateway**.
4. Escanea el código QR o pega el código de configuración, y luego conéctate.

Las apps oficiales de OpenClaw para iOS y Android se aprueban automáticamente cuando sus
metadatos de código de configuración coinciden. Si **Dispositivos** muestra una solicitud pendiente (por
ejemplo, para un cliente no oficial o metadatos no coincidentes), revisa su rol y
alcances antes de aprobarla.

El botón está deshabilitado cuando la sesión actual de Control UI no tiene
acceso de administrador. En ese caso, usa el flujo de aprobación por CLI que se muestra abajo desde el host del Gateway.

### Emparejar mediante Telegram

Si usas el Plugin `device-pair`, puedes hacer el emparejamiento inicial de dispositivos completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado de **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app de OpenClaw para iOS → Configuración → Gateway.
4. Escanea el código QR (`/pair qr`) o pega el código de configuración y conéctate.
5. La app móvil oficial se conecta automáticamente. Si `/pair pending` muestra una
   solicitud, revisa su rol y alcances antes de aprobarla.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `urls`: cuando está disponible, las rutas LAN/Tailnet ordenadas que la app móvil puede probar
- `bootstrapToken`: un token de inicialización de un solo uso para el intercambio inicial de emparejamiento (caduca después de 10 minutos; `expiresAtMs` se incluye en la carga)

Ejecuta `/pair cleanup` para invalidar los códigos de configuración no utilizados cuando termine el emparejamiento.

Ese token de inicialización lleva el perfil de inicialización de emparejamiento integrado:

- el perfil de configuración integrado permite solo la línea base nueva de QR/código de configuración:
  `node` más una transferencia acotada de `operator`
- el token `node` transferido permanece con `scopes: []`
- el token `operator` transferido está limitado a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` y `operator.write`
- `operator.admin` no se concede mediante inicialización por QR/código de configuración; requiere un
  flujo separado aprobado de emparejamiento o token de operador
- la rotación/revocación posterior de tokens sigue acotada tanto por el contrato de rol aprobado
  del dispositivo como por los alcances de operador de la sesión llamadora

Trata el código de configuración como una contraseña mientras sea válido.

Para emparejamiento móvil remoto mediante Tailscale, público u otro, usa Tailscale Serve/Funnel
u otra URL `wss://` del Gateway. Los códigos de configuración `ws://` en texto claro solo se aceptan
para local loopback, direcciones LAN privadas, hosts Bonjour `.local` y el host del emulador
de Android. Las direcciones CGNAT de Tailnet, los nombres `.ts.net` y los hosts públicos todavía
fallan de forma cerrada antes de emitir QR/código de configuración.

Para URL de configuración `gateway.bind=lan`, OpenClaw detecta raíces HTTPS persistentes de Tailscale Serve
que actúan como proxy del puerto de loopback activo del Gateway y las anuncia
junto con la ruta LAN. Los binds `custom` y `tailnet` de interfaz específica no
reciben ese recurso porque un proxy Serve de loopback no puede alcanzar esos
listeners. La app de iOS sondea las rutas anunciadas en orden y guarda el primer
endpoint alcanzable.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando se deniega una aprobación explícita porque la sesión de dispositivo emparejado aprobadora
se abrió con alcance solo de emparejamiento, la CLI reintenta la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado con capacidad de administrador recupere un nuevo
emparejamiento de Control UI/navegador sin editar `devices/paired.json` a mano. El
Gateway todavía valida la conexión reintentada; los tokens que no puedan autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo vuelve a intentarlo con detalles de autenticación distintos (por ejemplo, diferente
rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio en silencio. Si se vuelve a conectar solicitando más alcances o un rol más amplio, OpenClaw conserva la aprobación existente tal como está y crea una nueva solicitud de actualización pendiente. Usa `openclaw devices list` para comparar el acceso actualmente aprobado con el acceso nuevo solicitado antes de aprobar.
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

Esto solo se aplica a solicitudes nuevas de emparejamiento con `role: node` sin alcances
solicitados. Los clientes de operador, navegador, Control UI y WebChat todavía requieren aprobación
manual. Los cambios de rol, alcance, metadatos y clave pública todavía requieren aprobación
manual.

### Almacenamiento del estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan después de 5 minutos)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento independiente propiedad del gateway. Los nodos WS todavía requieren emparejamiento de dispositivo.
- El registro de emparejamiento es la fuente de verdad durable para los roles aprobados. Los tokens de
  dispositivo activos permanecen acotados a ese conjunto de roles aprobado; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentación relacionada

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualización segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canal:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
