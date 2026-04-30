---
read_when:
    - Configurar el control de acceso a mensajes directos
    - Emparejamiento de un nuevo Node iOS/Android
    - Revisión de la postura de seguridad de OpenClaw
summary: 'Resumen del emparejamiento: aprueba quién puede enviarte mensajes directos + qué nodos pueden unirse'
title: Emparejamiento
x-i18n:
    generated_at: "2026-04-30T05:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

“Emparejamiento” es el paso explícito de aprobación de acceso de OpenClaw.
Se usa en dos lugares:

1. **Emparejamiento por MD** (quién puede hablar con el bot)
2. **Emparejamiento de Node** (qué dispositivos/nodos pueden unirse a la red del Gateway)

Contexto de seguridad: [Seguridad](/es/gateway/security)

## 1) Emparejamiento por MD (acceso de chat entrante)

Cuando un canal está configurado con la política de MD `pairing`, los remitentes desconocidos reciben un código corto y su mensaje **no se procesa** hasta que lo apruebes.

Las políticas de MD predeterminadas están documentadas en: [Seguridad](/es/gateway/security)

`dmPolicy: "open"` es público solo cuando la lista de permitidos de MD efectiva incluye `"*"`.
La configuración y la validación requieren ese comodín para configuraciones públicas abiertas. Si el estado existente
contiene `open` con entradas `allowFrom` concretas, el entorno de ejecución sigue admitiendo
solo a esos remitentes, y las aprobaciones del almacén de emparejamiento no amplían el acceso `open`.

Códigos de emparejamiento:

- 8 caracteres, en mayúsculas, sin caracteres ambiguos (`0O1I`).
- **Caducan después de 1 hora**. El bot solo envía el mensaje de emparejamiento cuando se crea una solicitud nueva (aproximadamente una vez por hora por remitente).
- Las solicitudes de emparejamiento por MD pendientes tienen un límite predeterminado de **3 por canal**; las solicitudes adicionales se ignoran hasta que una caduque o se apruebe.

### Aprobar un remitente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si aún no hay un propietario de comandos configurado, aprobar un código de emparejamiento por MD también inicializa
`commands.ownerAllowFrom` con el remitente aprobado, como `telegram:123456789`.
Eso da a las configuraciones iniciales un propietario explícito para comandos privilegiados y solicitudes de aprobación de
exec. Después de que exista un propietario, las aprobaciones de emparejamiento posteriores solo conceden acceso por MD; no agregan más propietarios.

Canales compatibles: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Dónde reside el estado

Almacenado en `~/.openclaw/credentials/`:

- Solicitudes pendientes: `<channel>-pairing.json`
- Almacén de lista de permitidos aprobada:
  - Cuenta predeterminada: `<channel>-allowFrom.json`
  - Cuenta no predeterminada: `<channel>-<accountId>-allowFrom.json`

Comportamiento de ámbito de cuenta:

- Las cuentas no predeterminadas leen/escriben solo su archivo de lista de permitidos con ámbito.
- La cuenta predeterminada usa el archivo de lista de permitidos sin ámbito, con ámbito de canal.

Trata estos archivos como confidenciales (controlan el acceso a tu asistente).

<Note>
El almacén de lista de permitidos de emparejamiento es para acceso por MD. La autorización de grupos es independiente.
Aprobar un código de emparejamiento por MD no permite automáticamente que ese remitente ejecute comandos de grupo
ni controle el bot en grupos. La inicialización del primer propietario es un estado de configuración independiente
en `commands.ownerAllowFrom`, y la entrega de chat de grupo sigue las listas de permitidos de grupo del canal
(por ejemplo `groupAllowFrom`, `groups`, o anulaciones por grupo
o por tema según el canal).
</Note>

## 2) Emparejamiento de dispositivos Node (nodos iOS/Android/macOS/sin interfaz)

Los nodos se conectan al Gateway como **dispositivos** con `role: node`. El Gateway
crea una solicitud de emparejamiento de dispositivo que debe aprobarse.

### Emparejar mediante Telegram (recomendado para iOS)

Si usas el Plugin `device-pair`, puedes hacer el emparejamiento inicial de dispositivo completamente desde Telegram:

1. En Telegram, envía un mensaje a tu bot: `/pair`
2. El bot responde con dos mensajes: un mensaje de instrucciones y un mensaje separado con el **código de configuración** (fácil de copiar/pegar en Telegram).
3. En tu teléfono, abre la app de OpenClaw para iOS → Settings → Gateway.
4. Pega el código de configuración y conecta.
5. De vuelta en Telegram: `/pair pending` (revisa los ID de solicitud, el rol y los ámbitos), luego aprueba.

El código de configuración es una carga útil JSON codificada en base64 que contiene:

- `url`: la URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token de inicialización de un solo dispositivo y de corta duración usado para el protocolo inicial de emparejamiento

Ese token de inicialización lleva el perfil de inicialización de emparejamiento integrado:

- el token `node` principal transferido permanece con `scopes: []`
- cualquier token `operator` transferido permanece limitado a la lista de permitidos de inicialización:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- las comprobaciones de ámbito de inicialización tienen prefijo de rol, no un único conjunto plano de ámbitos:
  las entradas de ámbito de operador solo satisfacen solicitudes de operador, y los roles no operadores
  todavía deben solicitar ámbitos bajo su propio prefijo de rol
- la rotación/revocación posterior de tokens permanece limitada tanto por el contrato de rol aprobado del dispositivo
  como por los ámbitos de operador de la sesión que llama

Trata el código de configuración como una contraseña mientras sea válido.

### Aprobar un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si el mismo dispositivo reintenta con detalles de autenticación distintos (por ejemplo un rol, ámbitos o clave pública
diferentes), la solicitud pendiente anterior se sustituye y se crea un nuevo
`requestId`.

<Note>
Un dispositivo ya emparejado no obtiene acceso más amplio en silencio. Si se reconecta pidiendo más ámbitos o un rol más amplio, OpenClaw mantiene la aprobación existente tal como está y crea una nueva solicitud pendiente de ampliación. Usa `openclaw devices list` para comparar el acceso aprobado actualmente con el acceso solicitado recientemente antes de aprobar.
</Note>

### Aprobación automática opcional de Node por CIDR de confianza

El emparejamiento de dispositivos sigue siendo manual de forma predeterminada. Para redes de nodos estrechamente controladas,
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

Esto solo se aplica a solicitudes de emparejamiento `role: node` nuevas sin ámbitos
solicitados. Los clientes operador, navegador, Control UI y WebChat siguen requiriendo aprobación manual.
Los cambios de rol, ámbito, metadatos y clave pública siguen requiriendo aprobación manual.

### Almacenamiento de estado de emparejamiento de Node

Almacenado en `~/.openclaw/devices/`:

- `pending.json` (de corta duración; las solicitudes pendientes caducan)
- `paired.json` (dispositivos emparejados + tokens)

### Notas

- La API heredada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) es un
  almacén de emparejamiento independiente propiedad del Gateway. Los nodos WS siguen requiriendo emparejamiento de dispositivos.
- El registro de emparejamiento es la fuente de verdad duradera para los roles aprobados. Los tokens de dispositivo
  activos permanecen limitados a ese conjunto de roles aprobado; una entrada de token aislada
  fuera de los roles aprobados no crea acceso nuevo.

## Documentación relacionada

- Modelo de seguridad + inyección de prompts: [Seguridad](/es/gateway/security)
- Actualizar con seguridad (ejecutar doctor): [Actualización](/es/install/updating)
- Configuraciones de canal:
  - Telegram: [Telegram](/es/channels/telegram)
  - WhatsApp: [WhatsApp](/es/channels/whatsapp)
  - Signal: [Signal](/es/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/es/channels/bluebubbles)
  - iMessage (heredado): [iMessage](/es/channels/imessage)
  - Discord: [Discord](/es/channels/discord)
  - Slack: [Slack](/es/channels/slack)
