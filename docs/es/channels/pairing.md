---
read_when:
    - Configurar el control de acceso a mensajes directos
    - Emparejar un nuevo nodo iOS/Android
    - Revisar la postura de seguridad de OpenClaw
summary: 'Resumen del emparejamiento: aprueba quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-04T17:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

El "emparejamiento" es el paso explícito de aprobación de acceso de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento por DM** (quién puede hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento por DM (acceso de chat entrante)

Cuando un canal está configurado con la política de DM `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas de DM predeterminadas están documentadas en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista de permitidos efectiva de DM incluye `"*"`.
La configuración y la validación requieren ese comodín para configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas concretas de `allowFrom`, el runtime sigue admitiendo
solo a esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes pendientes de emparejamiento por DM tienen un límite predeterminado de **3 por canal**; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si aún no hay un propietario de comandos configurado, aprobar un código de emparejamiento por DM también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso proporciona a las configuraciones iniciales un propietario explícito para comandos privilegiados y solicitudes de aprobación de exec.
Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso por DM;
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

Los grupos de acceso se documentan en detalle aquí: [Grupos de acceso](/es/channels/access-groups)

### Dónde vive el estado

Almacenado en `~/.openclaw/credentials/`:

- Solicitudes pendientes: `<channel>-pairing.json`
- Almacén de lista de permitidos aprobada:
  - Cuenta predeterminada: `<channel>-allowFrom.json`
  - Cuenta no predeterminada: `<channel>-<accountId>-allowFrom.json`

Comportamiento de alcance de cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con alcance.
- La cuenta predeterminada usa el archivo de lista de permitidos sin alcance con alcance de canal.

Trátalos como sensibles (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para acceso por DM. La autorización de grupos es independiente.
Aprobar un código de emparejamiento por DM no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración separado
en `commands.ownerAllowFrom`, y la entrega de chat grupal sigue respetando las listas de permitidos de grupo
del canal (por ejemplo `groupAllowFrom`, `groups`, o sobrescrituras por grupo
o por tema según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (iOS/Android/macOS/nodos sin interfaz)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar desde Control UI (recomendado)

Usa una sesión de Control UI ya conectada con acceso `operator.admin`:

1. Abre Control UI y selecciona **Nodos**.
2. En **Dispositivos**, haz clic en **Emparejar dispositivo móvil**.
3. En tu teléfono, abre la aplicación OpenClaw → **Configuración** → **Gateway**.
4. Escanea el código QR o pega el código de configuración, luego conéctate.

Las aplicaciones oficiales de OpenClaw para iOS y Android se aprueban automáticamente cuando sus
metadatos de código de configuración coinciden. Si **Dispositivos** muestra una solicitud pendiente (por
ejemplo, para un cliente no oficial o metadatos que no coinciden), revisa su rol y
sus alcances antes de aprobarla.

El botón está deshabilitado cuando la sesión actual de Control UI no tiene
acceso de administrador. En ese caso, usa el flujo de aprobación de la CLI que aparece abajo desde el host del Gateway.

### Emparejar mediante Telegram

Si usas el Plugin `device-pair`, puedes hacer el emparejamiento inicial del dispositivo completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado de **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la aplicación de OpenClaw para iOS → Configuración → Gateway.
4. Escanea el código QR o pega el código de configuración y conéctate.
5. La aplicación móvil oficial se conecta automáticamente. Si `/pair pending` muestra una
   solicitud, revisa su rol y sus alcances antes de aprobarla.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de inicialización de un solo dispositivo y corta duración usado para el protocolo inicial de emparejamiento

Ese token de inicialización lleva el perfil de inicialización de emparejamiento integrado:

- el perfil de configuración integrado solo permite la línea base nueva de QR/código de configuración:
  `node` más una transferencia acotada de `operator`
- el token `node` transferido permanece con `scopes: []`
- el token `operator` transferido está limitado a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` y `operator.write`
- `operator.admin` no se concede mediante la inicialización de QR/código de configuración; requiere un
  emparejamiento de operador aprobado por separado o un flujo de token
- la rotación/revocación posterior de tokens sigue acotada tanto por el contrato de rol aprobado
  del dispositivo como por los alcances de operador de la sesión llamadora

Trata el código de configuración como una contraseña mientras sea válido.

Para Tailscale, emparejamiento móvil público u otro emparejamiento móvil remoto, usa Tailscale Serve/Funnel
u otra URL del Gateway `wss://`. Los códigos de configuración `ws://` en texto claro solo se aceptan
para loopback, direcciones LAN privadas, hosts Bonjour `.local` y el host del emulador de Android.
Las direcciones CGNAT de Tailnet, los nombres `.ts.net` y los hosts públicos siguen
fallando de forma cerrada antes de emitir el QR/código de configuración.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando se deniega una aprobación explícita porque la sesión de dispositivo emparejado que aprueba
se abrió con alcance solo de emparejamiento, la CLI reintenta la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado existente con capacidad de administrador recupere un nuevo
emparejamiento de Control UI/navegador sin editar `devices/paired.json` manualmente. El
Gateway sigue validando la conexión reintentada; los tokens que no pueden autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo reintenta con detalles de autenticación distintos (por ejemplo, una
rol/alcances/clave pública diferentes), la solicitud pendiente anterior se reemplaza y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio de forma silenciosa. Si se reconecta solicitando más alcances o un rol más amplio, OpenClaw mantiene la aprobación existente tal cual y crea una nueva solicitud de actualización pendiente. Usa `openclaw devices list` para comparar el acceso aprobado actualmente con el acceso solicitado nuevo antes de aprobar.
</Note>

### Aprobación automática opcional de Node por CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de nodos estrictamente controladas,
puedes activar la aprobación automática inicial de Node con CIDR explícitos o IP exactas:

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
alcances solicitados. Los clientes de operador, navegador, Control UI y WebChat siguen requiriendo aprobación
manual. Los cambios de rol, alcance, metadatos y clave pública siguen requiriendo aprobación manual.

### Almacenamiento de estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento separado propiedad del gateway. Los nodos WS siguen requiriendo emparejamiento de dispositivo.
- El registro de emparejamiento es la fuente duradera de verdad para los roles aprobados. Los tokens de dispositivo
  activos permanecen acotados a ese conjunto de roles aprobado; una entrada de token suelta
  fuera de los roles aprobados no crea acceso nuevo.

## Documentos relacionados

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualización segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canal:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
