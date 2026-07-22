---
read_when:
    - Configuración del control de acceso a mensajes directos
    - Emparejamiento de un nuevo Node iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Descripción general del emparejamiento: apruebe quién puede enviarle mensajes directos y qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-22T13:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc874d660509f59bc26795c8b3ce13f5d238cd61154c717637f5d545b995fb08
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" es el paso explícito de aprobación de acceso de OpenClaw.
Se utiliza en dos lugares:

1. **Emparejamiento de MD** (quién puede comunicarse con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento de MD (acceso al chat entrante)

Cuando un canal está configurado con la política de MD `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que se aprueba.

Las políticas de MD predeterminadas se documentan en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` solo es público cuando la lista de permitidos de MD efectiva incluye `"*"`.
La configuración y la validación requieren ese comodín para las configuraciones abiertas al público. Si el estado
existente contiene `open` con entradas `allowFrom` concretas, en tiempo de ejecución se sigue admitiendo
solo a esos remitentes, y las aprobaciones del almacén de emparejamientos no amplían el acceso de `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas y sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora y por remitente).
- Las solicitudes pendientes de emparejamiento de MD están limitadas a **3 por cuenta de canal**; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar desde la interfaz de control

Abra **Settings → Channels → DM access requests**. La cola reúne las solicitudes
pendientes de todas las cuentas de canal configuradas cuya política de MD sea `pairing`.
Filtre por canal o cuenta, revise el ID y los metadatos del remitente y, a continuación, elija
**Approve**.

La aprobación solo concede acceso a los mensajes directos. No concede acceso a grupos. El
cuadro de diálogo de aprobación también ofrece estas opciones explícitas cuando son compatibles:

- **Notificar al solicitante después de la aprobación**
- **Convertir también a este remitente en el primer propietario de comandos**, se muestra solo cuando no existe ningún
  propietario de comandos y la sesión de la interfaz de control tiene `operator.admin`

Elija **Dismiss** para eliminar una solicitud pendiente sin aprobarla. El descarte
no es un bloqueo permanente; el remitente puede volver a solicitar acceso más adelante.

### Aprobar desde la CLI

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Añada `--notify` para avisar al solicitante en el mismo canal. Los canales con varias cuentas
aceptan `--account <id>`.

A diferencia de la casilla explícita de la interfaz de control, la CLI inicializa automáticamente
`commands.ownerAllowFrom` cuando no hay ningún propietario de comandos configurado, mediante una entrada
como `telegram:123456789`. Esto proporciona a las configuraciones iniciales un propietario explícito para
los comandos privilegiados y las solicitudes de aprobación de ejecución. Una vez que existe un propietario, las
aprobaciones de emparejamiento posteriores solo conceden acceso a MD; no añaden más propietarios.

<Note>
El QR de inicio de sesión de WhatsApp vincula una cuenta de WhatsApp con OpenClaw. Las solicitudes de acceso a MD
aprueban a las personas que envían mensajes a esa cuenta. Son flujos independientes.
</Note>

Canales compatibles (cualquier plugin de canal instalado que declare emparejamiento; los plugins externos como `openclaw-weixin` pueden añadir más): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remitentes reutilizables

Utilice `accessGroups` en el nivel superior cuando el mismo conjunto de remitentes de confianza deba aplicarse a
varios canales de mensajería o tanto a las listas de permitidos de MD como a las de grupos.

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

Los grupos de acceso se documentan en detalle aquí: [Grupos de acceso](/es/channels/access-groups)

### Ubicación del estado

Se almacena en la base de datos de estado SQLite compartida en
`~/.openclaw/state/openclaw.sqlite`:

- solicitudes pendientes en `channel_pairing_requests`
- remitentes aprobados en `channel_pairing_allow_entries`

Comportamiento del ámbito de las cuentas:

- cada solicitud y remitente aprobado se identifica por canal y cuenta
- en tiempo de ejecución solo se leen las filas canónicas de SQLite; no se combinan archivos heredados

Los Gateways anteriores escribían `<channel>-pairing.json` y
`<channel>-<accountId>-allowFrom.json` en `~/.openclaw/credentials/`.
La migración durante el inicio y `openclaw doctor --fix` importan esos archivos en SQLite y
eliminan cada origen tras una importación correcta. Trate la base de datos SQLite como
información confidencial, ya que estas filas controlan el acceso al asistente.

<Note>
El almacén de listas de permitidos de emparejamiento es para el acceso a MD. La autorización de grupos es independiente.
Aprobar un código de emparejamiento de MD no permite automáticamente que ese remitente ejecute
comandos de grupo ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración
independiente en `commands.ownerAllowFrom`, y la entrega en chats de grupo sigue rigiéndose por las
listas de permitidos de grupos del canal (por ejemplo, `groupAllowFrom`, `groups` o las anulaciones por grupo
o tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz gráfica)

Los Nodes se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar desde la interfaz de control (recomendado)

Utilice una sesión de la interfaz de control ya conectada con acceso `operator.admin`:

1. Abra la interfaz de control y vaya a **Settings → Devices**.
2. En la página **Devices**, haga clic en **Pair mobile device**.
3. Mantenga **Full access (recommended)** o seleccione **Limited access** para omitir
   los controles administrativos del Gateway.
4. Haga clic en **Create setup code**.
5. En el teléfono, abra la aplicación OpenClaw → **Settings** → **Gateway**.
6. Escanee el código QR o pegue el código de configuración y, a continuación, conéctese.

Las aplicaciones oficiales de OpenClaw para iOS y Android se aprueban automáticamente cuando los
metadatos de su código de configuración coinciden. Si **Pending approval** muestra una solicitud (por
ejemplo, para un cliente no oficial o metadatos que no coinciden), revise su rol y
sus ámbitos antes de aprobarla.

El botón está deshabilitado cuando la sesión actual de la interfaz de control no tiene
acceso de administrador. En ese caso, utilice el flujo de aprobación de la CLI que aparece a continuación desde el host del Gateway.

### Emparejar mediante Telegram

Si utiliza el plugin `device-pair`, puede realizar el emparejamiento inicial del dispositivo íntegramente desde Telegram:

1. En Telegram, envíe un mensaje al bot: `/pair`
2. El bot responde con dos mensajes: uno de instrucciones y otro independiente con el **código de configuración** (fácil de copiar y pegar en Telegram).
3. En el teléfono, abra la aplicación OpenClaw para iOS → Settings → Gateway.
4. Escanee el código QR (`/pair qr`) o pegue el código de configuración y conéctese.
5. La aplicación móvil oficial se conecta automáticamente. Si `/pair pending` muestra una
   solicitud, revise su rol y sus ámbitos antes de aprobarla.

El código de configuración es una carga JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `urls`: cuando están disponibles, las rutas LAN/Tailnet ordenadas que la aplicación móvil puede probar
- `bootstrapToken`: un token de inicialización de un solo uso para el protocolo de enlace de emparejamiento inicial; el Gateway lo hace caducar después de 10 minutos

Ejecute `/pair cleanup` para invalidar los códigos de configuración no utilizados cuando finalice el emparejamiento.

Ese token de inicialización incluye el perfil integrado de inicialización del emparejamiento:

- una configuración segura de `wss://` (o el bucle local del mismo host) usa de forma predeterminada `node` junto con acceso
  completo `operator` para dispositivos móviles nativos
- el token `node` transferido se mantiene como `scopes: []`
- el token `operator` transferido de forma predeterminada incluye `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` y
  `operator.write`
- **Limited access** de la interfaz de control y `openclaw qr --limited` omiten
  `operator.admin`, pero conservan los demás ámbitos de operador
- la configuración `ws://` mediante LAN en texto sin formato utiliza automáticamente el mismo perfil limitado;
  configure `wss://` o Tailscale Serve y genere un código nuevo para obtener acceso completo
- la rotación o revocación posterior de tokens sigue estando limitada tanto por el contrato
  de rol aprobado del dispositivo como por los ámbitos de operador de la sesión que realiza la llamada

Trate el código de configuración como una contraseña mientras sea válido.

Las páginas **Settings → Gateway** de iOS y Android muestran acceso **Full** o **Limited**.
Para actualizar un teléfono con acceso limitado, configure primero una ruta segura `wss://` o
Tailscale Serve; después, genere un nuevo código de configuración con acceso completo, escanéelo o péguelo
en esa página de configuración y vuelva a conectarse.

Para el emparejamiento móvil mediante Tailscale, una red pública u otro método remoto, utilice Tailscale Serve/Funnel
u otra URL del Gateway `wss://`. Los códigos de configuración `ws://` en texto sin formato solo se aceptan
para el bucle local, las direcciones LAN privadas, los hosts Bonjour `.local` y el host del
emulador de Android. Las rutas en texto sin formato que no sean de bucle local reciben acceso limitado. Las direcciones
CGNAT de Tailnet, los nombres `.ts.net` y los hosts públicos siguen denegándose de forma predeterminada antes
de emitir el código QR o de configuración.

Para las URL de configuración `gateway.bind=lan`, OpenClaw detecta las raíces HTTPS persistentes de Tailscale Serve
que actúan como proxy del puerto de bucle local del Gateway activo y las anuncia
junto con la ruta LAN. El comando de configuración añade esta alternativa solo
para `lan`; `custom` y `tailnet` conservan sus rutas anunciadas explícitamente. La
aplicación para iOS prueba las rutas anunciadas en orden y guarda el primer
endpoint accesible.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando se deniega una aprobación explícita porque la sesión del dispositivo emparejado que realiza la aprobación
se abrió con un ámbito exclusivo de emparejamiento, la CLI vuelve a intentar la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado existente con capacidad de administración recupere un nuevo
emparejamiento de interfaz de control/navegador sin editar manualmente el almacén de emparejamientos. El
Gateway sigue validando la conexión reintentada; los tokens que no pueden autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo vuelve a intentarlo con datos de autenticación distintos (por ejemplo, un
rol, ámbitos o una clave pública diferentes), la solicitud pendiente anterior se sustituye y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene silenciosamente un acceso más amplio. Si vuelve a conectarse solicitando más ámbitos o un rol más amplio, OpenClaw mantiene sin cambios la aprobación existente y crea una nueva solicitud de ampliación pendiente. Utilice `openclaw devices list` para comparar el acceso aprobado actualmente con el acceso solicitado recientemente antes de aprobarlo.
</Note>

### Aprobación automática opcional de Nodes mediante CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de Nodes estrictamente controladas,
se puede habilitar la aprobación automática del emparejamiento inicial de Nodes mediante CIDR explícitos o direcciones IP exactas:

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

Esto solo se aplica a solicitudes nuevas de emparejamiento `role: node` sin ámbitos
solicitados. Los clientes de operador, navegador, interfaz de control y WebChat siguen requiriendo aprobación
manual. Los cambios de rol, ámbito, metadatos y clave pública también siguen requiriendo aprobación
manual.

### Almacenamiento del estado de emparejamiento de Nodes

Se almacena en la base de datos de estado SQLite compartida en `~/.openclaw/state/openclaw.sqlite`:

- solicitudes pendientes de emparejamiento de dispositivos (de corta duración; caducan después de 5 minutos)
- dispositivos emparejados + tokens

Los gateways anteriores mantenían este estado en `~/.openclaw/devices/*.json`; esos archivos se
importan en SQLite al iniciar el gateway y se archivan con el sufijo `.migrated`.

### Notas

- La API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) gestiona
  las aprobaciones de capacidades de los nodos almacenadas en los mismos registros de dispositivos emparejados. Los nodos WS
  siguen requiriendo el emparejamiento de dispositivos; consulte [Emparejamiento de nodos](/es/gateway/pairing).
- El registro de emparejamiento es la fuente de verdad persistente para los roles aprobados. Los tokens
  de dispositivos activos permanecen limitados a ese conjunto de roles aprobados; una entrada de token aislada
  fuera de los roles aprobados no crea nuevos accesos.

## Documentación relacionada

- Modelo de seguridad e inyección de prompts: [Seguridad](/es/gateway/security)
- Actualización segura (ejecute doctor): [Actualización](/es/install/updating)
- Configuraciones de canales:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
