---
read_when:
    - Trabajando en las funciones del canal Tlon/Urbit
summary: Estado de soporte, capacidades y configuración de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-30T05:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon es un mensajero descentralizado construido sobre Urbit. OpenClaw se conecta a tu ship de Urbit y puede
responder a mensajes directos y mensajes de chat grupal. Las respuestas de grupo requieren una mención @ de forma predeterminada y pueden
restringirse aún más mediante listas de permitidos.

Estado: Plugin incluido. Se admiten mensajes directos, menciones de grupo, respuestas en hilos, formato de texto enriquecido y
cargas de imágenes. Las reacciones y encuestas aún no son compatibles.

## Plugin incluido

Tlon se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación separada.

Si usas una compilación antigua o una instalación personalizada que excluye Tlon, instala un
paquete npm actual cuando se publique uno:

Instalar mediante CLI (registro npm, cuando exista un paquete actual):

```bash
openclaw plugins install @openclaw/tlon
```

Si npm indica que el paquete propiedad de OpenClaw está obsoleto, usa una compilación
empaquetada actual de OpenClaw o la ruta del checkout local hasta que se
publique un paquete npm más nuevo.

Checkout local (cuando se ejecuta desde un repositorio git):

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
4. Reinicia el gateway.
5. Envía un mensaje directo al bot o menciónalo en un canal de grupo.

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

## Ships privadas/LAN

De forma predeterminada, OpenClaw bloquea nombres de host internos/privados y rangos de IP para protección contra SSRF.
Si tu ship se ejecuta en una red privada (localhost, IP LAN o nombre de host interno),
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

⚠️ Activa esto solo si confías en tu red local. Esta opción desactiva las protecciones SSRF
para solicitudes a la URL de tu ship.

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

Desactivar la detección automática:

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

Lista de permitidos para mensajes directos (vacía = no se permiten mensajes directos, usa `ownerShip` para el flujo de aprobación):

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

## Sistema de propietario y aprobación

Define una ship propietaria para recibir solicitudes de aprobación cuando usuarios no autorizados intenten interactuar:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

La ship propietaria está **autorizada automáticamente en todas partes**: las invitaciones por mensaje directo se aceptan automáticamente y
los mensajes de canal siempre se permiten. No necesitas agregar el propietario a `dmAllowlist` ni a
`defaultAuthorizedShips`.

Cuando está configurada, el propietario recibe notificaciones por mensaje directo para:

- Solicitudes de mensaje directo de ships que no están en la lista de permitidos
- Menciones en canales sin autorización
- Solicitudes de invitación a grupos

## Opciones de aceptación automática

Aceptar automáticamente invitaciones por mensaje directo (para ships en dmAllowlist):

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

## Destinos de entrega (CLI/cron)

Úsalos con `openclaw message send` o entrega por cron:

- Mensaje directo: `~sampel-palnet` o `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluido

El Plugin de Tlon incluye un skill incluido ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que proporciona acceso por CLI a operaciones de Tlon:

- **Contactos**: obtener/actualizar perfiles, listar contactos
- **Canales**: listar, crear, publicar mensajes, obtener historial
- **Grupos**: listar, crear, administrar miembros
- **Mensajes directos**: enviar mensajes, reaccionar a mensajes
- **Reacciones**: agregar/eliminar reacciones emoji a publicaciones y mensajes directos
- **Opciones**: administrar permisos del Plugin mediante comandos slash

El skill está disponible automáticamente cuando el Plugin está instalado.

## Capacidades

| Función          | Estado                                           |
| ---------------- | ------------------------------------------------ |
| Mensajes directos | ✅ Compatible                                    |
| Grupos/canales   | ✅ Compatible (requiere mención de forma predeterminada) |
| Hilos            | ✅ Compatible (respuestas automáticas en el hilo) |
| Texto enriquecido | ✅ Markdown convertido al formato de Tlon       |
| Imágenes         | ✅ Cargadas al almacenamiento de Tlon             |
| Reacciones       | ✅ Mediante [skill incluido](#bundled-skill)     |
| Encuestas        | ❌ Aún no compatible                             |
| Comandos nativos | ✅ Compatible (solo propietario de forma predeterminada) |

## Solución de problemas

Ejecuta primero esta escalera:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Fallos comunes:

- **Mensajes directos ignorados**: el remitente no está en `dmAllowlist` y no hay `ownerShip` configurado para el flujo de aprobación.
- **Mensajes de grupo ignorados**: el canal no se descubrió o el remitente no está autorizado.
- **Errores de conexión**: comprueba que la URL de la ship sea accesible; habilita `allowPrivateNetwork` para ships locales.
- **Errores de autenticación**: verifica que el código de inicio de sesión esté vigente (los códigos rotan).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.tlon.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.tlon.ship`: nombre de la ship de Urbit del bot (por ejemplo, `~sampel-palnet`).
- `channels.tlon.url`: URL de la ship (por ejemplo, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de inicio de sesión de la ship.
- `channels.tlon.allowPrivateNetwork`: permitir URL localhost/LAN (omisión de SSRF).
- `channels.tlon.ownerShip`: ship propietaria para el sistema de aprobación (siempre autorizada).
- `channels.tlon.dmAllowlist`: ships autorizadas a enviar mensajes directos (vacía = ninguna).
- `channels.tlon.autoAcceptDmInvites`: aceptar automáticamente mensajes directos de ships en la lista de permitidos.
- `channels.tlon.autoAcceptGroupInvites`: aceptar automáticamente todas las invitaciones a grupos.
- `channels.tlon.autoDiscoverChannels`: detectar automáticamente canales de grupo (valor predeterminado: true).
- `channels.tlon.groupChannels`: nests de canal fijados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizadas para todos los canales.
- `channels.tlon.authorization.channelRules`: reglas de autenticación por canal.
- `channels.tlon.showModelSignature`: agregar el nombre del modelo a los mensajes.

## Notas

- Las respuestas de grupo requieren una mención (por ejemplo, `~your-bot-ship`) para responder.
- Respuestas en hilos: si el mensaje entrante está en un hilo, OpenClaw responde dentro del hilo.
- Texto enriquecido: el formato Markdown (negrita, cursiva, código, encabezados, listas) se convierte al formato nativo de Tlon.
- Imágenes: las URL se cargan al almacenamiento de Tlon y se incrustan como bloques de imagen.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por mensaje directo y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
