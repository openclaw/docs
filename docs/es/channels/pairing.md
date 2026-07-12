---
read_when:
    - Configuración del control de acceso a mensajes directos
    - Emparejamiento de un nuevo Node iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Descripción general del emparejamiento: apruebe quién puede enviarle mensajes directos y qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-12T14:20:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32fcb7c9031afc1e18c9288c201b80aeee7ce8b44eb345492101949ec7c91358
    source_path: channels/pairing.md
    workflow: 16
---

El "emparejamiento" es el paso de aprobación de acceso explícito de OpenClaw.
Se utiliza en dos lugares:

1. **Emparejamiento de mensajes directos** (quién puede hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento de mensajes directos (acceso al chat entrante)

Cuando un canal se configura con la política de mensajes directos `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que se aprueba.

Las políticas predeterminadas de mensajes directos se documentan en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` solo es público cuando la lista de permitidos efectiva de mensajes directos incluye `"*"`.
La configuración y la validación requieren ese comodín para las configuraciones públicas abiertas. Si el estado
existente contiene `open` con entradas concretas de `allowFrom`, el entorno de ejecución sigue admitiendo
solo a esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas y sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora y remitente).
- Las solicitudes pendientes de emparejamiento de mensajes directos tienen un límite de **3 por cuenta de canal**; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Añada `--notify` al comando de aprobación para informar al solicitante en el mismo canal. Los canales con varias cuentas aceptan `--account <id>`.

Si todavía no se ha configurado ningún propietario de comandos, aprobar un código de emparejamiento de mensajes directos también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Esto proporciona a las configuraciones iniciales un propietario explícito para los comandos privilegiados y las solicitudes de
aprobación de ejecución. Una vez que existe un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso
a mensajes directos; no añaden más propietarios.

Canales compatibles (cualquier plugin de canal instalado que declare el emparejamiento; los plugins externos como `openclaw-weixin` pueden añadir más): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remitentes reutilizables

Utilice `accessGroups` en el nivel superior cuando el mismo conjunto de remitentes de confianza deba aplicarse a
varios canales de mensajería o tanto a las listas de permitidos de mensajes directos como de grupos.

Los grupos estáticos utilizan `type: "message.senders"` y se referencian mediante
`accessGroup:<name>` desde las listas de permitidos de los canales:

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

Los grupos de acceso se documentan detalladamente aquí: [Grupos de acceso](/es/channels/access-groups)

### Dónde se almacena el estado

Se almacena en `~/.openclaw/credentials/`:

- Solicitudes pendientes: `<channel>-pairing.json`
- Almacén de la lista de permitidos aprobada: `<channel>-<accountId>-allowFrom.json` (las aprobaciones de la
  cuenta predeterminada utilizan `<channel>-default-allowFrom.json`)

Comportamiento del ámbito de las cuentas:

- Las cuentas no predeterminadas solo leen y escriben su archivo de lista de permitidos específico.
- La cuenta predeterminada también sigue respetando un archivo heredado sin ámbito `<channel>-allowFrom.json`
  de instalaciones antiguas; las entradas de ambos archivos se combinan durante la lectura.

Trate estos archivos como confidenciales (controlan el acceso a su asistente).

<Note>
El almacén de la lista de permitidos de emparejamiento sirve para el acceso a mensajes directos. La autorización de grupos es independiente.
Aprobar un código de emparejamiento de mensajes directos no permite automáticamente que ese remitente ejecute
comandos de grupo ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración
independiente en `commands.ownerAllowFrom`, y la entrega de mensajes de chat de grupo sigue estando sujeta a las
listas de permitidos de grupos del canal (por ejemplo, `groupAllowFrom`, `groups` o las anulaciones por grupo
o por tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz gráfica)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento del dispositivo que debe aprobarse.

### Emparejar desde la interfaz de control (recomendado)

Utilice una sesión de la interfaz de control ya conectada con acceso `operator.admin`:

1. Abra la interfaz de control y seleccione **Nodes**.
2. En la página **Devices**, haga clic en **Pair mobile device**.
3. En el teléfono, abra la aplicación OpenClaw → **Settings** → **Gateway**.
4. Escanee el código QR o pegue el código de configuración y, a continuación, conéctese.

Las aplicaciones oficiales de OpenClaw para iOS y Android se aprueban automáticamente cuando los
metadatos de su código de configuración coinciden. Si **Pending approval** muestra una solicitud (por
ejemplo, para un cliente no oficial o con metadatos que no coinciden), revise su rol y
sus ámbitos antes de aprobarla.

El botón está deshabilitado cuando la sesión actual de la interfaz de control no tiene
acceso de administrador. En ese caso, utilice el siguiente flujo de aprobación mediante la CLI desde el host del Gateway.

### Emparejar mediante Telegram

Si utiliza el plugin `device-pair`, puede realizar el emparejamiento inicial del dispositivo íntegramente desde Telegram:

1. En Telegram, envíe un mensaje al bot: `/pair`
2. El bot responde con dos mensajes: uno con instrucciones y otro independiente con el **código de configuración** (fácil de copiar y pegar en Telegram).
3. En el teléfono, abra la aplicación OpenClaw para iOS → Settings → Gateway.
4. Escanee el código QR (`/pair qr`) o pegue el código de configuración y conéctese.
5. La aplicación móvil oficial se conecta automáticamente. Si `/pair pending` muestra una
   solicitud, revise su rol y sus ámbitos antes de aprobarla.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `urls`: cuando están disponibles, las rutas LAN/Tailnet ordenadas que puede probar la aplicación móvil
- `bootstrapToken`: un token de inicialización de un solo uso para el intercambio inicial de emparejamiento; el Gateway lo hace caducar después de 10 minutos

Ejecute `/pair cleanup` para invalidar los códigos de configuración no utilizados cuando finalice el emparejamiento.

Ese token de inicialización incorpora el perfil de inicialización de emparejamiento integrado:

- el perfil de configuración integrado solo permite la configuración inicial nueva mediante QR/código de configuración:
  `node` más una transferencia limitada de `operator`
- el token de `node` transferido conserva `scopes: []`
- el token de `operator` transferido se limita a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` y `operator.write`
- la inicialización mediante QR/código de configuración no concede `operator.admin`; requiere un
  emparejamiento de operador aprobado o un flujo de token independiente
- la rotación o revocación posterior de tokens sigue estando limitada tanto por el contrato de rol aprobado
  del dispositivo como por los ámbitos de operador de la sesión que realiza la llamada

Trate el código de configuración como una contraseña mientras sea válido.

Para el emparejamiento móvil remoto mediante Tailscale, acceso público u otros medios, utilice Tailscale Serve/Funnel
u otra URL `wss://` del Gateway. Los códigos de configuración `ws://` sin cifrar solo se aceptan
para direcciones de bucle invertido, direcciones LAN privadas, hosts Bonjour `.local` y el host del
emulador de Android. Las direcciones CGNAT de Tailnet, los nombres `.ts.net` y los hosts públicos siguen
rechazándose de forma segura antes de emitir el QR/código de configuración.

Para las URL de configuración con `gateway.bind=lan`, OpenClaw detecta las raíces HTTPS persistentes de Tailscale Serve
que actúan como proxy del puerto de bucle invertido del Gateway activo y las anuncia
junto con la ruta LAN. El comando de configuración añade esta alternativa solo
para `lan`; `custom` y `tailnet` conservan sus rutas anunciadas explícitamente. La
aplicación para iOS prueba las rutas anunciadas en orden y guarda el primer
punto de conexión accesible.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando se deniega una aprobación explícita porque la sesión del dispositivo emparejado que realiza la aprobación
se abrió con un ámbito exclusivo de emparejamiento, la CLI vuelve a intentar la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado existente con capacidad de administración recupere un nuevo
emparejamiento de la interfaz de control o del navegador sin editar manualmente el almacén de emparejamiento. El
Gateway sigue validando la conexión reintentada; los tokens que no puedan autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo vuelve a intentarlo con datos de autenticación diferentes (por ejemplo, un
rol, ámbitos o una clave pública diferentes), la solicitud pendiente anterior queda sustituida y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene silenciosamente un acceso más amplio. Si vuelve a conectarse solicitando más ámbitos o un rol más amplio, OpenClaw conserva la aprobación existente tal cual y crea una nueva solicitud de actualización pendiente. Utilice `openclaw devices list` para comparar el acceso aprobado actualmente con el nuevo acceso solicitado antes de aprobarlo.
</Note>

### Aprobación automática opcional de nodos mediante CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de nodos estrictamente controladas,
puede habilitar la aprobación automática inicial de nodos mediante CIDR explícitos o direcciones IP exactas:

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

Esto solo se aplica a solicitudes nuevas de emparejamiento con `role: node` que no soliciten
ámbitos. Los clientes de operador, navegador, interfaz de control y WebChat siguen requiriendo aprobación
manual. Los cambios de rol, ámbito, metadatos y clave pública también siguen requiriendo aprobación
manual.

### Almacenamiento del estado de emparejamiento de Node

Se almacena en la base de datos de estado SQLite compartida en `~/.openclaw/state/openclaw.sqlite`:

- solicitudes pendientes de emparejamiento de dispositivos (de corta duración; caducan después de 5 minutos)
- dispositivos emparejados y tokens

Los Gateway antiguos almacenaban este estado en `~/.openclaw/devices/*.json`; esos archivos se
importan a SQLite al iniciar el Gateway y se archivan con el sufijo `.migrated`.

### Notas

- La API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) administra
  las aprobaciones de capacidades de Node almacenadas en los mismos registros de dispositivos emparejados. Los nodos WS
  siguen requiriendo el emparejamiento de dispositivos; consulte [Emparejamiento de Node](/es/gateway/pairing).
- El registro de emparejamiento es la fuente de verdad persistente de los roles aprobados. Los tokens de
  dispositivos activos permanecen limitados a ese conjunto de roles aprobados; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentación relacionada

- Modelo de seguridad e inyección de instrucciones: [Seguridad](/es/gateway/security)
- Actualización segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canales:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
