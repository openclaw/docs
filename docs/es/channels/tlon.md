---
read_when:
    - Trabajar en funciones del canal Tlon/Urbit
summary: Estado de compatibilidad, capacidades y configuración de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-24T05:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon es una plataforma de mensajería descentralizada construida sobre Urbit. OpenClaw se conecta a tu ship de Urbit y puede
responder a mensajes directos y mensajes de chat grupal. Las respuestas en grupos requieren una mención con @ de forma predeterminada y pueden
restringirse aún más mediante listas de permitidos.

Estado: Plugin incluido. Se admiten mensajes directos, menciones en grupos, respuestas en hilos, formato de texto enriquecido y
carga de imágenes. Las reacciones y las encuestas aún no son compatibles.

## Plugin incluido

Tlon se incluye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas
normales no necesitan una instalación separada.

Si usas una compilación anterior o una instalación personalizada que excluye Tlon, instálalo
manualmente:

Instalar mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración

1. Asegúrate de que el Plugin de Tlon esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden agregarlo manualmente con los comandos anteriores.
2. Reúne la URL de tu ship y el código de inicio de sesión.
3. Configura `channels.tlon`.
4. Reinicia el Gateway.
5. Envía un mensaje directo al bot o menciónalo en un canal grupal.

Configuración mínima (cuenta única):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recomendado: tu ship, siempre permitida
    },
  },
}
```

## Ships privados/LAN

De forma predeterminada, OpenClaw bloquea nombres de host e intervalos de IP privados/internos para proteger contra SSRF.
Si tu ship se ejecuta en una red privada (localhost, IP de LAN o nombre de host interno),
debes habilitarlo explícitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Esto se aplica a URL como:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Solo habilita esto si confías en tu red local. Esta configuración desactiva las protecciones SSRF
para las solicitudes a la URL de tu ship.

## Canales de grupo

La detección automática está habilitada de forma predeterminada. También puedes fijar canales manualmente:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Deshabilitar la detección automática:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Control de acceso

Lista de permitidos para mensajes directos (vacía = no se permiten mensajes directos; usa `ownerShip` para el flujo de aprobación):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorización de grupos (restringida de forma predeterminada):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Propietario y sistema de aprobación

Configura un ship propietario para recibir solicitudes de aprobación cuando usuarios no autorizados intenten interactuar:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

El ship propietario queda **autorizado automáticamente en todas partes**: las invitaciones a mensajes directos se aceptan automáticamente y
los mensajes de canal siempre están permitidos. No necesitas agregar al propietario a `dmAllowlist` ni a
`defaultAuthorizedShips`.

Cuando está configurado, el propietario recibe notificaciones por mensaje directo para:

- Solicitudes de mensajes directos desde ships que no están en la lista de permitidos
- Menciones en canales sin autorización
- Solicitudes de invitación a grupos

## Configuración de aceptación automática

Aceptar automáticamente invitaciones a mensajes directos (para ships en `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceptar automáticamente invitaciones a grupos:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Destinos de entrega (CLI/Cron)

Úsalos con `openclaw message send` o entrega por Cron:

- Mensaje directo: `~sampel-palnet` o `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluido

El Plugin de Tlon incluye un Skill incluido ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que proporciona acceso CLI a operaciones de Tlon:

- **Contactos**: obtener/actualizar perfiles, listar contactos
- **Canales**: listar, crear, publicar mensajes, obtener historial
- **Grupos**: listar, crear, gestionar miembros
- **Mensajes directos**: enviar mensajes, reaccionar a mensajes
- **Reacciones**: agregar/eliminar reacciones con emoji a publicaciones y mensajes directos
- **Configuración**: gestionar permisos del Plugin mediante comandos slash

El Skill está disponible automáticamente cuando el Plugin está instalado.

## Capacidades

| Función         | Estado                                     |
| --------------- | ------------------------------------------ |
| Mensajes directos | ✅ Compatible                            |
| Grupos/canales  | ✅ Compatible (restringido por mención de forma predeterminada) |
| Hilos           | ✅ Compatible (respuestas automáticas en hilo) |
| Texto enriquecido | ✅ Markdown convertido al formato de Tlon |
| Imágenes        | ✅ Cargadas al almacenamiento de Tlon      |
| Reacciones      | ✅ Mediante [Skill incluido](#bundled-skill) |
| Encuestas       | ❌ Aún no compatible                       |
| Comandos nativos | ✅ Compatible (solo propietario de forma predeterminada) |

## Solución de problemas

Ejecuta primero esta secuencia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Fallos comunes:

- **Mensajes directos ignorados**: el remitente no está en `dmAllowlist` y no hay `ownerShip` configurado para el flujo de aprobación.
- **Mensajes de grupo ignorados**: el canal no fue detectado o el remitente no está autorizado.
- **Errores de conexión**: verifica que la URL del ship sea accesible; habilita `allowPrivateNetwork` para ships locales.
- **Errores de autenticación**: verifica que el código de inicio de sesión siga vigente (los códigos rotan).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.tlon.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.tlon.ship`: nombre del ship Urbit del bot (por ejemplo, `~sampel-palnet`).
- `channels.tlon.url`: URL del ship (por ejemplo, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de inicio de sesión del ship.
- `channels.tlon.allowPrivateNetwork`: permitir URL de localhost/LAN (omisión de SSRF).
- `channels.tlon.ownerShip`: ship propietario para el sistema de aprobación (siempre autorizado).
- `channels.tlon.dmAllowlist`: ships con permiso para enviar mensajes directos (vacío = ninguno).
- `channels.tlon.autoAcceptDmInvites`: aceptar automáticamente mensajes directos de ships en la lista de permitidos.
- `channels.tlon.autoAcceptGroupInvites`: aceptar automáticamente todas las invitaciones a grupos.
- `channels.tlon.autoDiscoverChannels`: detectar automáticamente canales de grupo (predeterminado: true).
- `channels.tlon.groupChannels`: nests de canal fijados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizados para todos los canales.
- `channels.tlon.authorization.channelRules`: reglas de autorización por canal.
- `channels.tlon.showModelSignature`: agregar el nombre del modelo a los mensajes.

## Notas

- Las respuestas en grupos requieren una mención (por ejemplo, `~your-bot-ship`) para responder.
- Respuestas en hilos: si el mensaje entrante está en un hilo, OpenClaw responde dentro del hilo.
- Texto enriquecido: el formato Markdown (negrita, cursiva, código, encabezados, listas) se convierte al formato nativo de Tlon.
- Imágenes: las URL se cargan al almacenamiento de Tlon y se incrustan como bloques de imagen.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y restricción por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
