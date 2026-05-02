---
read_when:
    - Trabajando en las funciones del canal Tlon/Urbit
summary: Estado de soporte, capacidades y configuración de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon es un mensajero descentralizado creado sobre Urbit. OpenClaw se conecta a tu nave de Urbit y puede
responder a MD y mensajes de chat grupal. Las respuestas de grupo requieren una mención con @ de forma predeterminada y pueden
restringirse aún más mediante listas de permitidos.

Estado: Plugin incluido. Se admiten MD, menciones de grupo, respuestas en hilos, formato de texto enriquecido y
cargas de imágenes. Las reacciones y encuestas aún no son compatibles.

## Plugin incluido

Tlon se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación aparte.

Si usas una compilación anterior o una instalación personalizada que excluye Tlon, instala un
paquete npm actual:

Instalar mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Usa el paquete sin versión para seguir la etiqueta de versión oficial actual. Fija una
versión exacta solo cuando necesites una instalación reproducible.

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración

1. Asegúrate de que el Plugin de Tlon esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Recopila la URL de tu nave y el código de inicio de sesión.
3. Configura `channels.tlon`.
4. Reinicia el Gateway.
5. Envía un MD al bot o menciónalo en un canal de grupo.

Configuración mínima (una sola cuenta):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Naves privadas/LAN

De forma predeterminada, OpenClaw bloquea nombres de host y rangos de IP privados/internos para proteger contra SSRF.
Si tu nave se ejecuta en una red privada (localhost, IP de LAN o nombre de host interno),
debes aceptarlo explícitamente:

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

⚠️ Habilita esto solo si confías en tu red local. Esta opción deshabilita las protecciones SSRF
para las solicitudes a la URL de tu nave.

## Canales de grupo

El descubrimiento automático está habilitado de forma predeterminada. También puedes fijar canales manualmente:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Deshabilitar el descubrimiento automático:

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

Lista de permitidos de MD (vacía = no se permiten MD, usa `ownerShip` para el flujo de aprobación):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorización de grupo (restringida de forma predeterminada):

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

Configura una nave propietaria para recibir solicitudes de aprobación cuando usuarios no autorizados intenten interactuar:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

La nave propietaria está **autorizada automáticamente en todas partes**: las invitaciones de MD se aceptan automáticamente y
los mensajes de canal siempre se permiten. No necesitas añadir el propietario a `dmAllowlist` ni a
`defaultAuthorizedShips`.

Cuando se configura, el propietario recibe notificaciones por MD para:

- Solicitudes de MD de naves que no están en la lista de permitidos
- Menciones en canales sin autorización
- Solicitudes de invitación a grupos

## Opciones de aceptación automática

Aceptar automáticamente invitaciones de MD (para naves en dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceptar automáticamente invitaciones de grupo:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Destinos de entrega (CLI/cron)

Usa estos con `openclaw message send` o entrega por cron:

- MD: `~sampel-palnet` o `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluido

El Plugin de Tlon incluye un skill incluido ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que proporciona acceso mediante CLI a las operaciones de Tlon:

- **Contactos**: obtener/actualizar perfiles, listar contactos
- **Canales**: listar, crear, publicar mensajes, obtener historial
- **Grupos**: listar, crear, administrar miembros
- **MD**: enviar mensajes, reaccionar a mensajes
- **Reacciones**: añadir/eliminar reacciones emoji a publicaciones y MD
- **Configuración**: administrar permisos del Plugin mediante comandos de barra

El skill está disponible automáticamente cuando se instala el Plugin.

## Capacidades

| Función          | Estado                                                 |
| ---------------- | ------------------------------------------------------ |
| Mensajes directos | ✅ Compatible                                          |
| Grupos/canales   | ✅ Compatible (requiere mención de forma predeterminada) |
| Hilos            | ✅ Compatible (respuestas automáticas en el hilo)      |
| Texto enriquecido | ✅ Markdown convertido al formato de Tlon              |
| Imágenes         | ✅ Cargadas al almacenamiento de Tlon                   |
| Reacciones       | ✅ Mediante [skill incluido](#bundled-skill)            |
| Encuestas        | ❌ Aún no compatible                                   |
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

- **MD ignorados**: el remitente no está en `dmAllowlist` y no hay `ownerShip` configurado para el flujo de aprobación.
- **Mensajes de grupo ignorados**: canal no descubierto o remitente no autorizado.
- **Errores de conexión**: comprueba que se pueda acceder a la URL de la nave; habilita `allowPrivateNetwork` para naves locales.
- **Errores de autenticación**: verifica que el código de inicio de sesión sea actual (los códigos rotan).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.tlon.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.tlon.ship`: nombre de la nave de Urbit del bot (p. ej., `~sampel-palnet`).
- `channels.tlon.url`: URL de la nave (p. ej., `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de inicio de sesión de la nave.
- `channels.tlon.allowPrivateNetwork`: permitir URL localhost/LAN (omisión de SSRF).
- `channels.tlon.ownerShip`: nave propietaria para el sistema de aprobación (siempre autorizada).
- `channels.tlon.dmAllowlist`: naves autorizadas a enviar MD (vacía = ninguna).
- `channels.tlon.autoAcceptDmInvites`: aceptar automáticamente MD de naves en la lista de permitidos.
- `channels.tlon.autoAcceptGroupInvites`: aceptar automáticamente todas las invitaciones de grupo.
- `channels.tlon.autoDiscoverChannels`: descubrir automáticamente canales de grupo (predeterminado: true).
- `channels.tlon.groupChannels`: nidos de canal fijados manualmente.
- `channels.tlon.defaultAuthorizedShips`: naves autorizadas para todos los canales.
- `channels.tlon.authorization.channelRules`: reglas de autorización por canal.
- `channels.tlon.showModelSignature`: añadir el nombre del modelo a los mensajes.

## Notas

- Las respuestas de grupo requieren una mención (p. ej., `~your-bot-ship`) para responder.
- Respuestas en hilos: si el mensaje entrante está en un hilo, OpenClaw responde dentro del hilo.
- Texto enriquecido: el formato Markdown (negrita, cursiva, código, encabezados, listas) se convierte al formato nativo de Tlon.
- Imágenes: las URL se cargan al almacenamiento de Tlon y se incrustan como bloques de imagen.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y requisito de mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
