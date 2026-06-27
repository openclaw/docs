---
read_when:
    - Configuración del control de acceso a mensajes directos
    - Emparejar un nuevo nodo iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Descripción general del emparejamiento: aprueba quién puede enviarte mensajes directos y qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-06-27T10:42:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

"Emparejamiento" es el paso explícito de aprobación de acceso de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento por DM** (quién tiene permiso para hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos tienen permiso para unirse a la red del gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento por DM (acceso entrante por chat)

Cuando un canal está configurado con la política de DM `pairing`, los remitentes desconocidos reciben un código breve y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas de DM predeterminadas están documentadas en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista efectiva de permitidos para DM incluye `"*"`.
La configuración y la validación requieren ese comodín para configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas concretas de `allowFrom`, el runtime sigue admitiendo
solo a esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes pendientes de emparejamiento por DM están limitadas a **3 por canal** de forma predeterminada; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si aún no hay un propietario de comandos configurado, aprobar un código de emparejamiento por DM también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso da a las configuraciones iniciales un propietario explícito para comandos privilegiados y solicitudes de aprobación de exec.
Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden
acceso por DM; no añaden más propietarios.

Canales compatibles: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remitentes reutilizables

Usa `accessGroups` de nivel superior cuando el mismo conjunto de remitentes de confianza deba aplicarse a
varios canales de mensajes o tanto a listas de permitidos de DM como de grupos.

Los grupos estáticos usan `type: "message.senders"` y se referencian con
`accessGroup:<name>` desde las listas de permitidos de canal:

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
- Almacén de lista de permitidos aprobados:
  - Cuenta predeterminada: `<channel>-allowFrom.json`
  - Cuenta no predeterminada: `<channel>-<accountId>-allowFrom.json`

Comportamiento de ámbito de cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con ámbito.
- La cuenta predeterminada usa el archivo de lista de permitidos sin ámbito con ámbito de canal.

Trátalos como sensibles (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para acceso por DM. La autorización de grupos es independiente.
Aprobar un código de emparejamiento por DM no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración separado
en `commands.ownerAllowFrom`, y la entrega de chat grupal sigue obedeciendo las listas de permitidos
de grupo del canal (por ejemplo `groupAllowFrom`, `groups` o anulaciones por grupo
o por tema, según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/headless)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes hacer el emparejamiento inicial del dispositivo completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app de OpenClaw para iOS → Settings → Gateway.
4. Escanea el código QR o pega el código de configuración y conéctate.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los ámbitos), luego aprueba.

El código de configuración es una carga útil JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de bootstrap de corta duración para un solo dispositivo usado para el handshake inicial de emparejamiento

Ese token de bootstrap lleva el perfil de bootstrap de emparejamiento integrado:

- el perfil de configuración integrado permite solo la línea base nueva de QR/código de configuración:
  `node` más una transferencia `operator` acotada
- el token `node` transferido permanece con `scopes: []`
- el token `operator` transferido está limitado a `operator.approvals`,
  `operator.read` y `operator.write`
- `operator.admin` y `operator.pairing` no se conceden mediante bootstrap
  de QR/código de configuración; requieren un flujo independiente de emparejamiento de operador o token aprobado
- la rotación/revocación posterior de tokens sigue acotada tanto por el contrato de rol aprobado
  del dispositivo como por los ámbitos de operador de la sesión llamadora

Trata el código de configuración como una contraseña mientras sea válido.

Para Tailscale, emparejamiento móvil público u otro remoto, usa Tailscale Serve/Funnel
u otra URL de Gateway `wss://`. Los códigos de configuración `ws://` en texto claro se aceptan solo
para loopback, direcciones LAN privadas, hosts Bonjour `.local` y el host del emulador
de Android. Las direcciones CGNAT de Tailnet, los nombres `.ts.net` y los hosts públicos siguen
fallando de forma cerrada antes de la emisión de QR/código de configuración.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Cuando se deniega una aprobación explícita porque la sesión del dispositivo emparejado que aprueba
se abrió con ámbito solo de emparejamiento, la CLI reintenta la misma solicitud con
`operator.admin`. Esto permite que un dispositivo emparejado existente con capacidad de administrador recupere un nuevo
emparejamiento de Control UI/navegador sin editar `devices/paired.json` a mano. El
Gateway sigue validando la conexión reintentada; los tokens que no pueden autenticarse
con `operator.admin` siguen bloqueados.

Si el mismo dispositivo reintenta con detalles de autenticación diferentes (por ejemplo, diferente
rol/ámbitos/clave pública), la solicitud pendiente anterior queda reemplazada y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio de forma silenciosa. Si se reconecta pidiendo más ámbitos o un rol más amplio, OpenClaw mantiene la aprobación existente tal cual y crea una nueva solicitud pendiente de mejora. Usa `openclaw devices list` para comparar el acceso actualmente aprobado con el acceso recién solicitado antes de aprobarlo.
</Note>

### Aprobación automática opcional de nodos por CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de nodos estrechamente controladas,
puedes optar por la aprobación automática inicial de nodos con CIDR explícitos o IP exactas:

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
solicitados. Los clientes de operador, navegador, Control UI y WebChat siguen requiriendo aprobación
manual. Los cambios de rol, ámbito, metadatos y clave pública siguen requiriendo aprobación
manual.

### Almacenamiento del estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento separado, propiedad del gateway. Los nodos WS siguen requiriendo emparejamiento de dispositivo.
- El registro de emparejamiento es la fuente duradera de verdad para los roles aprobados. Los tokens de dispositivo
  activos permanecen acotados a ese conjunto de roles aprobados; una entrada de token suelta
  fuera de los roles aprobados no crea acceso nuevo.

## Documentos relacionados

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualizar de forma segura (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canal:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - iMessage: [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
