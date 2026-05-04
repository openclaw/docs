---
read_when:
    - Trabajando en funciones del canal Tlon/Urbit
summary: Estado de soporte, capacidades y configuración de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
---

Tlon es un mensajero descentralizado construido sobre Urbit. OpenClaw se conecta a tu ship de Urbit y puede
responder a MD y mensajes de chat grupal. Las respuestas en grupo requieren una mención @ de forma predeterminada y pueden
restringirse aún más mediante listas de permitidos.

Estado: plugin incluido. Se admiten MD, menciones en grupos, respuestas en hilos, formato de texto enriquecido y
cargas de imágenes. Las reacciones y las encuestas aún no son compatibles.

## Plugin incluido

Tlon se distribuye como un plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación separada.

Si estás usando una compilación anterior o una instalación personalizada que excluye Tlon, instala un
paquete npm actual:

Instalar mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Usa el paquete básico para seguir la etiqueta de lanzamiento oficial actual. Fija una versión
exacta solo cuando necesites una instalación reproducible.

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración

1. Asegúrate de que el plugin de Tlon esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Reúne la URL de tu ship y el código de inicio de sesión.
3. Configura `channels.tlon`.
4. Reinicia el gateway.
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

## Ships privadas/LAN

De forma predeterminada, OpenClaw bloquea nombres de host y rangos de IP privados/internos para protección contra SSRF.
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

⚠️ Habilita esto solo si confías en tu red local. Esta opción desactiva las protecciones contra SSRF
para las solicitudes a la URL de tu ship.

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

Desactivar el descubrimiento automático:

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

Lista de permitidos para MD (vacía = no se permiten MD, usa `ownerShip` para el flujo de aprobación):

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

La ship propietaria está **autorizada automáticamente en todas partes**: las invitaciones de MD se aceptan automáticamente y
los mensajes de canal siempre se permiten. No necesitas añadir el propietario a `dmAllowlist` ni a
`defaultAuthorizedShips`.

Cuando se configura, el propietario recibe notificaciones por MD para:

- Solicitudes de MD de ships que no están en la lista de permitidos
- Menciones en canales sin autorización
- Solicitudes de invitación a grupos

## Opciones de aceptación automática

Aceptar automáticamente invitaciones de MD (para ships en dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceptar automáticamente invitaciones a grupos de ships de confianza:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

`autoAcceptGroupInvites` falla de forma cerrada cuando `groupInviteAllowlist` está vacía. Define la
lista de permitidos con las ships cuyas invitaciones a grupos deben aceptarse automáticamente.

## Destinos de entrega (CLI/cron)

Úsalos con `openclaw message send` o entrega por cron:

- MD: `~sampel-palnet` o `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluida

El plugin de Tlon incluye una Skill incluida ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que proporciona acceso mediante CLI a operaciones de Tlon:

- **Contactos**: obtener/actualizar perfiles, listar contactos
- **Canales**: listar, crear, publicar mensajes, obtener historial
- **Grupos**: listar, crear, gestionar miembros
- **MD**: enviar mensajes, reaccionar a mensajes
- **Reacciones**: añadir/eliminar reacciones con emoji a publicaciones y MD
- **Configuración**: gestionar permisos del plugin mediante comandos slash

La Skill está disponible automáticamente cuando el plugin está instalado.

## Capacidades

| Funcionalidad    | Estado                                            |
| ---------------- | ------------------------------------------------- |
| Mensajes directos | ✅ Compatible                                     |
| Grupos/canales   | ✅ Compatible (requiere mención de forma predeterminada) |
| Hilos            | ✅ Compatible (respuestas automáticas en el hilo) |
| Texto enriquecido | ✅ Markdown convertido al formato de Tlon        |
| Imágenes         | ✅ Cargadas al almacenamiento de Tlon             |
| Reacciones       | ✅ Mediante [Skill incluida](#bundled-skill)      |
| Encuestas        | ❌ Aún no compatibles                             |
| Comandos nativos | ✅ Compatibles (solo propietario de forma predeterminada) |

## Solución de problemas

Ejecuta primero esta secuencia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Errores comunes:

- **MD ignorados**: el remitente no está en `dmAllowlist` y no hay ningún `ownerShip` configurado para el flujo de aprobación.
- **Mensajes de grupo ignorados**: el canal no se descubrió o el remitente no está autorizado.
- **Errores de conexión**: comprueba que se pueda acceder a la URL de la ship; habilita `allowPrivateNetwork` para ships locales.
- **Errores de autenticación**: verifica que el código de inicio de sesión esté vigente (los códigos rotan).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.tlon.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.tlon.ship`: nombre de la ship de Urbit del bot (p. ej., `~sampel-palnet`).
- `channels.tlon.url`: URL de la ship (p. ej., `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de inicio de sesión de la ship.
- `channels.tlon.allowPrivateNetwork`: permitir URL de localhost/LAN (omisión de SSRF).
- `channels.tlon.ownerShip`: ship propietaria para el sistema de aprobación (siempre autorizada).
- `channels.tlon.dmAllowlist`: ships autorizadas a enviar MD (vacía = ninguna).
- `channels.tlon.autoAcceptDmInvites`: aceptar automáticamente MD de ships en la lista de permitidos.
- `channels.tlon.autoAcceptGroupInvites`: aceptar automáticamente invitaciones a grupos de ships en la lista de permitidos.
- `channels.tlon.groupInviteAllowlist`: ships cuyas invitaciones a grupos pueden aceptarse automáticamente.
- `channels.tlon.autoDiscoverChannels`: descubrir automáticamente canales de grupo (predeterminado: true).
- `channels.tlon.groupChannels`: nidos de canal fijados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizadas para todos los canales.
- `channels.tlon.authorization.channelRules`: reglas de autorización por canal.
- `channels.tlon.showModelSignature`: añadir el nombre del modelo a los mensajes.

## Notas

- Las respuestas de grupo requieren una mención (p. ej., `~your-bot-ship`) para responder.
- Respuestas en hilos: si el mensaje entrante está en un hilo, OpenClaw responde dentro del hilo.
- Texto enriquecido: el formato Markdown (negrita, cursiva, código, encabezados, listas) se convierte al formato nativo de Tlon.
- Imágenes: las URL se cargan al almacenamiento de Tlon y se insertan como bloques de imagen.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y activación por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
