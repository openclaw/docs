---
read_when:
    - Configuración del control de acceso a mensajes directos
    - Emparejamiento de un nuevo Node iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Descripción general del emparejamiento: apruebe quién puede enviarle mensajes directos y qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-14T13:27:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

El «emparejamiento» es el paso explícito de aprobación de acceso de OpenClaw.
Se utiliza en dos lugares:

1. **Emparejamiento de mensajes directos** (quién puede hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento de mensajes directos (acceso a chats entrantes)

Cuando un canal está configurado con la política de mensajes directos `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que se aprueba.

Las políticas predeterminadas de mensajes directos se documentan en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista de permitidos efectiva para mensajes directos incluye `"*"`.
La configuración y la validación requieren ese comodín para las configuraciones abiertas al público. Si el estado
existente contiene `open` con entradas concretas de `allowFrom`, el entorno de ejecución sigue admitiendo
solo a esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso de `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas y sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una nueva solicitud (aproximadamente una vez por hora y por remitente).
- Las solicitudes pendientes de emparejamiento de mensajes directos están limitadas a **3 por cuenta de canal**; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Añada `--notify` al comando de aprobación para avisar al solicitante en el mismo canal. Los canales con varias cuentas aceptan `--account <id>`.

Si todavía no se ha configurado ningún propietario de comandos, aprobar un código de emparejamiento de mensajes directos también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Esto proporciona a las configuraciones iniciales un propietario explícito para los comandos con privilegios y las solicitudes
de aprobación de ejecución. Cuando ya existe un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso
a mensajes directos; no añaden más propietarios.

Canales compatibles (cualquier Plugin de canal instalado que declare el emparejamiento; los plugins externos como `openclaw-weixin` pueden añadir más): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

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

Los grupos de acceso se documentan en detalle aquí: [Grupos de acceso](/es/channels/access-groups)

### Dónde se almacena el estado

Se almacena en la base de datos de estado SQLite compartida en
`~/.openclaw/state/openclaw.sqlite`:

- solicitudes pendientes en `channel_pairing_requests`
- remitentes aprobados en `channel_pairing_allow_entries`

Comportamiento del ámbito de las cuentas:

- cada solicitud y remitente aprobado se identifica por canal y cuenta
- el entorno de ejecución solo lee las filas SQLite canónicas; no combina archivos heredados

Las versiones anteriores del Gateway escribían `<channel>-pairing.json` y
`<channel>-<accountId>-allowFrom.json` en `~/.openclaw/credentials/`.
La migración de inicio y `openclaw doctor --fix` importan esos archivos en SQLite y
eliminan cada origen tras importarlo correctamente. La base de datos SQLite debe tratarse como
información confidencial, ya que estas filas controlan el acceso al asistente.

<Note>
El almacén de listas de permitidos de emparejamiento sirve para el acceso a mensajes directos. La autorización de grupos es independiente.
Aprobar un código de emparejamiento de mensajes directos no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración independiente
en `commands.ownerAllowFrom`, y la entrega en chats de grupo sigue respetando las
listas de permitidos de grupos del canal (por ejemplo, `groupAllowFrom`, `groups` o las anulaciones por grupo
o por tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz gráfica)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar desde la interfaz de control (recomendado)

Utilice una sesión ya conectada de la interfaz de control con acceso `operator.admin`:

1. Abra la interfaz de control y vaya a **Settings → Devices**.
2. En la página **Devices**, haga clic en **Pair mobile device**.
3. Mantenga **Full access (recommended)** o seleccione **Limited access** para omitir
   los controles administrativos del Gateway.
4. Haga clic en **Create setup code**.
5. En el teléfono, abra la aplicación OpenClaw → **Settings** → **Gateway**.
6. Escanee el código QR o pegue el código de configuración y, a continuación, conéctese.

Las aplicaciones oficiales de OpenClaw para iOS y Android se aprueban automáticamente cuando sus
metadatos del código de configuración coinciden. Si **Pending approval** muestra una solicitud (por
ejemplo, para un cliente no oficial o con metadatos que no coinciden), revise su rol y
sus ámbitos antes de aprobarla.

El botón está deshabilitado cuando la sesión actual de la interfaz de control no tiene
acceso de administrador. En ese caso, utilice el siguiente flujo de aprobación mediante la CLI desde el host del Gateway.

### Emparejar mediante Telegram

Si se utiliza el Plugin `device-pair`, el emparejamiento inicial de dispositivos puede realizarse íntegramente desde Telegram:

1. En Telegram, envíe un mensaje al bot: `/pair`
2. El bot responde con dos mensajes: uno con instrucciones y otro independiente con el **código de configuración** (fácil de copiar y pegar en Telegram).
3. En el teléfono, abra la aplicación OpenClaw para iOS → Settings → Gateway.
4. Escanee el código QR (`/pair qr`) o pegue el código de configuración y conéctese.
5. La aplicación móvil oficial se conecta automáticamente. Si `/pair pending` muestra una
   solicitud, revise su rol y sus ámbitos antes de aprobarla.

El código de configuración es una carga útil JSON codificada en base64 que contiene:

- `url`: la URL de WebSocket del Gateway (`ws://...` o `wss://...`)
- `urls`: cuando están disponibles, las rutas ordenadas de la LAN/Tailnet que puede probar la aplicación móvil
- `bootstrapToken`: un token de inicialización de un solo uso para el protocolo de enlace de emparejamiento inicial; el Gateway lo hace caducar después de 10 minutos

Ejecute `/pair cleanup` para invalidar los códigos de configuración sin usar cuando finalice el emparejamiento.

Ese token de inicialización incluye el perfil de inicialización de emparejamiento integrado:

- una configuración segura de `wss://` (o mediante bucle invertido en el mismo host) utiliza de forma predeterminada `node`, además de acceso completo
  a `operator` para dispositivos móviles nativos
- el token `node` transferido permanece como `scopes: []`
- el token `operator` transferido de forma predeterminada incluye `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` y
  `operator.write`
- La opción **Limited access** de la interfaz de control y `openclaw qr --limited` omiten
  `operator.admin`, pero mantienen los demás ámbitos del operador
- la configuración de `ws://` mediante LAN con texto sin cifrar utiliza automáticamente el mismo perfil limitado;
  configure `wss://` o Tailscale Serve y genere un nuevo código para obtener acceso completo
- la rotación o revocación posterior del token sigue estando limitada tanto por el contrato
  de rol aprobado del dispositivo como por los ámbitos de operador de la sesión que realiza la llamada

Mientras sea válido, trate el código de configuración como una contraseña.

Las páginas **Settings → Gateway** de iOS y Android muestran el acceso **Full** o **Limited**.
Para ampliar el acceso de un teléfono limitado, configure primero una ruta segura de `wss://` o
Tailscale Serve; después, genere un nuevo código de configuración con acceso completo, escanéelo o péguelo
en esa página de configuración y vuelva a conectarse.

Para el emparejamiento móvil remoto mediante Tailscale, redes públicas u otros medios, utilice Tailscale Serve/Funnel
u otra URL de Gateway `wss://`. Los códigos de configuración `ws://` con texto sin cifrar solo se aceptan
para bucle invertido, direcciones LAN privadas, hosts Bonjour `.local` y el host del emulador
de Android. Las rutas con texto sin cifrar que no sean de bucle invertido reciben acceso limitado. Las direcciones CGNAT
de Tailnet, los nombres `.ts.net` y los hosts públicos se siguen rechazando de forma segura antes
de emitir el código QR o el código de configuración.

Para las URL de configuración `gateway.bind=lan`, OpenClaw detecta las raíces HTTPS persistentes de Tailscale Serve
que actúan como proxy del puerto de bucle invertido del Gateway activo y las anuncia
junto con la ruta LAN. El comando de configuración añade esta alternativa solo
para `lan`; `custom` y `tailnet` mantienen sus rutas anunciadas explícitamente. La
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
Gateway sigue validando la conexión reintentada; los tokens que no pueden autenticarse
con `operator.admin` permanecen bloqueados.

Si el mismo dispositivo vuelve a intentarlo con datos de autenticación diferentes (por ejemplo, otro
rol, otros ámbitos u otra clave pública), la solicitud pendiente anterior se sustituye y se crea
un nuevo `requestId`.

<Note>
Un dispositivo ya emparejado no obtiene silenciosamente un acceso más amplio. Si vuelve a conectarse solicitando más ámbitos o un rol más amplio, OpenClaw conserva la aprobación existente sin cambios y crea una nueva solicitud pendiente de ampliación. Utilice `openclaw devices list` para comparar el acceso aprobado actualmente con el acceso recién solicitado antes de aprobar.
</Note>

### Aprobación automática opcional de nodos mediante CIDR de confianza

De forma predeterminada, el emparejamiento de dispositivos sigue siendo manual. En redes de nodos estrictamente controladas,
se puede habilitar la aprobación automática del emparejamiento inicial de nodos mediante CIDR explícitos o direcciones IP exactas:

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

Esto solo se aplica a nuevas solicitudes de emparejamiento de `role: node` sin ámbitos
solicitados. Los clientes de operador, navegador, interfaz de control y WebChat siguen requiriendo aprobación
manual. Los cambios de rol, ámbito, metadatos y clave pública también siguen requiriendo aprobación
manual.

### Almacenamiento del estado de emparejamiento de Node

Se almacena en la base de datos de estado SQLite compartida en `~/.openclaw/state/openclaw.sqlite`:

- solicitudes pendientes de emparejamiento de dispositivos (de corta duración; caducan después de 5 minutos)
- dispositivos emparejados y tokens

Las versiones anteriores del Gateway conservaban este estado en `~/.openclaw/devices/*.json`; esos archivos se
importan en SQLite al iniciar el Gateway y se archivan con el sufijo `.migrated`.

### Notas

- La API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) administra
  las aprobaciones de capacidades de los nodos almacenadas en los mismos registros de dispositivos emparejados. Los nodos WS
  siguen requiriendo el emparejamiento de dispositivos; consulte [Emparejamiento de Node](/es/gateway/pairing).
- El registro de emparejamiento es la fuente de información duradera para los roles aprobados. Los tokens
  de dispositivos activos siguen estando limitados al conjunto de roles aprobado; una entrada de token aislada
  fuera de los roles aprobados no crea nuevo acceso.

## Documentación relacionada

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualización segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canales:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
