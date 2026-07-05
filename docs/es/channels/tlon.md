---
read_when:
    - Trabajando en funciones del canal Tlon/Urbit
summary: Estado de soporte, capacidades y configuración de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-05T11:04:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon es un mensajero descentralizado construido sobre Urbit. OpenClaw se conecta a tu nave de Urbit y
responde a mensajes directos y mensajes de chat grupal. Las respuestas en grupos requieren una mención @ de forma predeterminada, con
reglas de autorización y un flujo de aprobación del propietario superpuestos.

Estado: plugin incluido. Se admiten mensajes directos, menciones de grupo, hilos, texto enriquecido, carga/descarga de imágenes y un
sistema de aprobación del propietario. Las reacciones y encuestas no lo están.

## Plugin incluido

Tlon se distribuye incluido en las versiones actuales de OpenClaw; las compilaciones empaquetadas no necesitan una instalación aparte.

En una compilación anterior o una instalación personalizada que lo excluya, instálalo desde npm:

```bash
openclaw plugins install @openclaw/tlon
```

Usa el nombre de paquete sin más para seguir la etiqueta de versión actual. Fija una versión (`@openclaw/tlon@x.y.z`)
solo para instalaciones reproducibles.

Desde un checkout local:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

O edita la configuración directamente:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recomendado: tu nave, siempre autorizada
    },
  },
}
```

Reinicia el gateway después de editar la configuración directamente. Luego envía un mensaje directo al bot o menciónalo con @ en un
canal de grupo.

## Naves privadas/LAN

OpenClaw bloquea nombres de host internos/privados y rangos de IP para protección contra SSRF de forma predeterminada. Si tu
nave se ejecuta en una red privada (localhost, IP de LAN, nombre de host interno), actívalo explícitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Se aplica a destinos como `http://localhost:8080`, `http://192.168.x.x:8080` y
`http://my-ship.local:8080`. Activa esto solo para una URL de nave en la que confíes; desactiva la protección contra SSRF
para las solicitudes HTTP de esa cuenta.

<Note>
`channels.tlon.allowPrivateNetwork` (clave plana) está retirada. `openclaw doctor --fix` la mueve a
`channels.tlon.network.dangerouslyAllowPrivateNetwork` automáticamente.
</Note>

## Canales de grupo

Fija canales manualmente o activa el descubrimiento automático:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

`autoDiscoverChannels` tiene el valor predeterminado `false` cuando no está definido en la configuración; el asistente de configuración establece la
pregunta en sí de forma predeterminada y escribe `true` explícitamente. Con esto activado, OpenClaw inspecciona los grupos unidos al iniciar,
observa canales nuevos cuando se aceptan invitaciones de grupo y vuelve a comprobar cada 2 minutos.

## Control de acceso

Lista de permitidos de mensajes directos (vacía = no se permiten mensajes directos salvo que el remitente sea `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

La autorización de grupos tiene el valor predeterminado `restricted` por canal. Define `defaultAuthorizedShips` para una
base y sobrescribe por nest de canal:

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

Una vez que el bot ha respondido dentro de un hilo, sigue respondiendo a mensajes posteriores en ese hilo
sin requerir otra mención.

## Propietario y sistema de aprobación

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

La nave propietaria está autorizada en todas partes: las invitaciones a mensajes directos siempre se aceptan automáticamente, las invitaciones a grupos
siempre se aceptan automáticamente y los mensajes de canal siempre pasan la autorización. El propietario no necesita
estar en `dmAllowlist`, `defaultAuthorizedShips` ni `groupInviteAllowlist`.

Cuando `ownerShip` está definido, las solicitudes no autorizadas no solo se descartan: ponen en cola una
aprobación pendiente y envían un mensaje directo al propietario:

- Solicitudes de mensajes directos de naves que no están en `dmAllowlist`
- Menciones en canales donde el remitente no supera la autorización
- Invitaciones de grupo de naves que no están en `groupInviteAllowlist` (cuando la aceptación automática está desactivada, o activada pero el
  invitador no está en la lista de permitidos)

El propietario responde por mensaje directo para actuar sobre una solicitud:

| Respuesta del propietario    | Efecto                                               |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | Actúa sobre la aprobación pendiente más reciente     |
| `approve <id>` / `deny <id>` | Actúa sobre una aprobación específica por id         |
| `block`                      | También bloquea la nave de forma nativa para que no pueda reconectarse |
| `unblock ~ship`              | Revierte un bloqueo nativo                           |
| `blocked`                    | Lista las naves bloqueadas actualmente               |
| `pending`                    | Lista las solicitudes de aprobación pendientes       |

Sin `ownerShip` configurado, los mensajes directos y menciones de canal no autorizados simplemente se descartan y se registran;
no hay aviso de aprobación.

## Ajustes de aceptación automática

Acepta automáticamente invitaciones a mensajes directos de naves que ya están en `dmAllowlist` (el propietario siempre se acepta automáticamente
independientemente de esta opción):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Acepta automáticamente invitaciones de grupo de una lista de permitidos (falla cerrado: con `autoAcceptGroupInvites: true` y
un `groupInviteAllowlist` vacío, no se acepta ninguna invitación de no propietario):

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

## Recarga en caliente mediante el almacén de ajustes de Urbit

La mayoría de los ajustes anteriores (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) se reflejan en el agente
`%settings` de la nave (desk `moltbot`, bucket `tlon`) en la primera ejecución y luego se leen en vivo desde allí,
por lo que los cambios hechos mediante un cliente Landscape o los comandos de ajustes de la skill incluida se aplican sin
reiniciar el gateway. `channelRules` y las aprobaciones pendientes también se conservan allí como JSON. La
configuración de archivo sigue siendo la fuente de verdad para los valores que nunca se escriben en el almacén de ajustes.

## Destinos de entrega (CLI/cron)

Úsalo con `openclaw message send` o entrega por cron:

- Mensaje directo: `~sampel-palnet` o `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluida

El plugin incluye [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), una CLI para
operaciones directas de Urbit, disponible automáticamente una vez que el plugin está instalado:

- **Actividad**: menciones, respuestas, no leídos
- **Canales**: listar, crear, renombrar
- **Contactos**: listar/obtener/actualizar perfiles
- **Grupos**: crear, unirse, flujos de invitación/solicitud, roles
- **Hooks**: gestionar hooks de canal
- **Mensajes**: historial, búsqueda
- **Mensajes directos**: enviar, reaccionar, aceptar/rechazar
- **Publicaciones**: reaccionar, eliminar
- **Notebook**: publicar en canales de diario
- **Ajustes**: recargar en caliente la configuración del plugin mediante el almacén de ajustes anterior

## Capacidades

| Función         | Estado                                        |
| --------------- | --------------------------------------------- |
| Mensajes directos | Compatible                                     |
| Grupos/canales | Compatible (con mención obligatoria de forma predeterminada) |
| Hilos         | Compatible (sigue respondiendo una vez que se ha unido) |
| Texto enriquecido | Markdown convertido al formato nativo de Tlon    |
| Imágenes          | Descargadas al entrar, cargadas al salir         |
| Reacciones       | Solo mediante la [skill incluida](#bundled-skill)  |
| Encuestas           | No compatible                                 |
| Comandos nativos | Solo propietario de forma predeterminada                         |

## Solución de problemas

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Fallos comunes:

- **Mensajes directos ignorados**: el remitente no está en `dmAllowlist` y no hay `ownerShip` configurado para el flujo de aprobación.
- **Mensajes de grupo ignorados**: el canal no se ha descubierto/fijado, o el remitente no supera la autorización sin
  `ownerShip` para poner en cola una aprobación.
- **Errores de conexión**: comprueba que la URL de la nave sea accesible; define
  `network.dangerouslyAllowPrivateNetwork` para naves locales.
- **Errores de autenticación**: los códigos de inicio de sesión rotan; copia el código actual desde tu nave.

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

| Clave                                                    | Significado                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Activar/desactivar el inicio del canal.                                |
| `channels.tlon.ship`                                   | Nombre de nave de Urbit del bot (p. ej., `~sampel-palnet`).                 |
| `channels.tlon.url`                                    | URL de la nave (p. ej., `https://sampel-palnet.tlon.network`).          |
| `channels.tlon.code`                                   | Código de inicio de sesión de la nave.                                               |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Permitir URL de naves en localhost/LAN (activación de SSRF).                   |
| `channels.tlon.ownerShip`                              | Nave propietaria: siempre autorizada, recibe solicitudes de aprobación.     |
| `channels.tlon.dmAllowlist`                            | Naves autorizadas a enviar mensajes directos (vacío = ninguna aparte del propietario).              |
| `channels.tlon.autoAcceptDmInvites`                    | Aceptar automáticamente mensajes directos de naves en `dmAllowlist`.                   |
| `channels.tlon.autoAcceptGroupInvites`                 | Aceptar automáticamente invitaciones de grupo de `groupInviteAllowlist`.         |
| `channels.tlon.groupInviteAllowlist`                   | Naves cuyas invitaciones de grupo se aceptan automáticamente.                   |
| `channels.tlon.autoDiscoverChannels`                   | Descubrir automáticamente canales de grupo unidos (predeterminado: `false`).        |
| `channels.tlon.groupChannels`                          | Nests de canal fijados manualmente.                                 |
| `channels.tlon.defaultAuthorizedShips`                 | Naves autorizadas para todos los canales (se usa cuando ninguna regla coincide). |
| `channels.tlon.authorization.channelRules`             | Modo de autorización + lista de permitidos por nest de canal.                        |
| `channels.tlon.showModelSignature`                     | Añadir `_[Generated by <model>]_` a las respuestas.                  |
| `channels.tlon.responsePrefix`                         | Prefijo estático añadido al principio de las respuestas salientes.                   |
| `channels.tlon.accounts.<id>`                          | Cuentas con nombre adicionales (configuraciones de varias naves).                 |

## Notas

- Las respuestas de grupo necesitan una mención @ (p. ej., `~your-bot-ship`) salvo que el bot ya se haya unido a ese hilo.
- Las respuestas de hilo se entregan dentro del hilo; el bot también recibe los últimos 10 mensajes de contexto del hilo antepuestos
  para el agente.
- El texto enriquecido (negrita, cursiva, código, encabezados, listas) se convierte al formato nativo de Tlon.
- Enviar un mensaje entrante que pide un resumen de canal (por ejemplo "resume este
  canal") activa una resumición de historial integrada en lugar del flujo de respuesta normal.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y bloqueo por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
