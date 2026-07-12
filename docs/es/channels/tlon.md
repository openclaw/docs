---
read_when:
    - Trabajo en funcionalidades del canal Tlon/Urbit
summary: Estado de compatibilidad, capacidades y configuración de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-11T22:55:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon es un mensajero descentralizado creado sobre Urbit. OpenClaw se conecta a tu nave de Urbit y
responde a mensajes directos y mensajes de chats grupales. De forma predeterminada, las respuestas
en grupos requieren una mención @, además de reglas de autorización y un flujo de aprobación del
propietario.

Estado: plugin incluido. Se admiten mensajes directos, menciones en grupos, hilos, texto enriquecido,
carga y descarga de imágenes y un sistema de aprobación del propietario. No se admiten reacciones
ni encuestas.

## Plugin incluido

Tlon se incluye en las versiones actuales de OpenClaw; las compilaciones empaquetadas no necesitan
una instalación independiente.

En una compilación anterior o una instalación personalizada que lo excluya, instálalo desde npm:

```bash
openclaw plugins install @openclaw/tlon
```

Usa el nombre de paquete sin versión para seguir la etiqueta de la versión actual. Fija una versión
(`@openclaw/tlon@x.y.z`) solo para instalaciones reproducibles.

Desde un repositorio local:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

O edita directamente la configuración:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always authorized
    },
  },
}
```

Reinicia el Gateway después de editar directamente la configuración. Luego envía un mensaje directo
al bot o menciónalo con @ en un canal grupal.

## Naves privadas o de LAN

De forma predeterminada, OpenClaw bloquea los nombres de host internos o privados y los intervalos
de IP privados para proteger contra SSRF. Si tu nave se ejecuta en una red privada (localhost, IP de
LAN o nombre de host interno), habilítala explícitamente:

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

Esto se aplica a destinos como `http://localhost:8080`, `http://192.168.x.x:8080` y
`http://my-ship.local:8080`. Habilítalo únicamente para una URL de nave en la que confíes; desactiva
la protección contra SSRF para las solicitudes HTTP de esa cuenta.

<Note>
`channels.tlon.allowPrivateNetwork` (clave plana) está retirada. `openclaw doctor --fix` la mueve
automáticamente a `channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Canales grupales

Fija canales manualmente o activa la detección automática:

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

El valor predeterminado de `autoDiscoverChannels` es `false` cuando no se especifica en la
configuración; el asistente de configuración propone sí de forma predeterminada y escribe `true`
explícitamente. Cuando está activado, OpenClaw consulta mediante scry los grupos unidos al iniciarse,
observa los canales nuevos a medida que se aceptan invitaciones a grupos y vuelve a comprobarlos
cada 2 minutos.

## Control de acceso

Lista de permitidos para mensajes directos (vacía = no se permite ningún mensaje directo, salvo que
el remitente sea `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

La autorización de grupos utiliza `restricted` de forma predeterminada en cada canal. Establece
`defaultAuthorizedShips` como base y sobrescríbela para cada nido de canal:

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

Una vez que el bot haya respondido dentro de un hilo, seguirá respondiendo a los mensajes posteriores
de ese hilo sin requerir otra mención.

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

La nave propietaria está autorizada en todas partes: sus invitaciones a mensajes directos siempre se
aceptan automáticamente, sus invitaciones a grupos siempre se aceptan automáticamente y sus mensajes
en canales siempre superan la autorización. No es necesario que el propietario esté en
`dmAllowlist`, `defaultAuthorizedShips` ni `groupInviteAllowlist`.

Cuando se establece `ownerShip`, las solicitudes no autorizadas no se descartan sin más: se ponen
en cola como aprobaciones pendientes y se envía un mensaje directo al propietario:

- Solicitudes de mensajes directos de naves que no están en `dmAllowlist`
- Menciones en canales donde el remitente no supera la autorización
- Invitaciones a grupos de naves que no están en `groupInviteAllowlist` (cuando la aceptación
  automática está desactivada o está activada, pero el remitente de la invitación no figura en la
  lista de permitidos)

El propietario responde por mensaje directo para actuar sobre una solicitud:

| Respuesta del propietario     | Efecto                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| `approve` / `deny` / `block`  | Actúa sobre la aprobación pendiente más reciente              |
| `approve <id>` / `deny <id>`  | Actúa sobre una aprobación específica por identificador       |
| `block`                       | También bloquea la nave de forma nativa para impedir que vuelva a conectarse |
| `unblock ~ship`               | Revierte un bloqueo nativo                                    |
| `blocked`                     | Muestra las naves bloqueadas actualmente                      |
| `pending`                     | Muestra las solicitudes de aprobación pendientes              |

Si no se configura `ownerShip`, los mensajes directos y las menciones en canales no autorizados
simplemente se descartan y se registran; no se muestra ninguna solicitud de aprobación.

## Ajustes de aceptación automática

Acepta automáticamente invitaciones a mensajes directos de naves que ya estén en `dmAllowlist`
(el propietario siempre se acepta automáticamente, independientemente de este indicador):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Acepta automáticamente invitaciones a grupos desde una lista de permitidos (falla de forma cerrada:
con `autoAcceptGroupInvites: true` y una `groupInviteAllowlist` vacía, no se acepta ninguna
invitación que no sea del propietario):

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
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) se reflejan en el agente `%settings`
de la nave (escritorio `moltbot`, depósito `tlon`) durante la primera ejecución y, a partir de
entonces, se leen desde allí en tiempo real. Por tanto, los cambios realizados mediante un cliente
Landscape o los comandos de ajustes de la habilidad incluida se aplican sin reiniciar el Gateway.
`channelRules` y las aprobaciones pendientes también se conservan allí como JSON. La configuración
del archivo sigue siendo la fuente de verdad para los valores que nunca se escriben en el almacén
de ajustes.

## Destinos de entrega (CLI/cron)

Úsalos con `openclaw message send` o la entrega mediante cron:

- Mensaje directo: `~sampel-palnet` o `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Habilidad incluida

El plugin incluye [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), una CLI para
realizar operaciones directas en Urbit, disponible automáticamente una vez instalado el plugin:

- **Actividad**: menciones, respuestas, mensajes no leídos
- **Canales**: listar, crear, cambiar el nombre
- **Contactos**: listar, obtener y actualizar perfiles
- **Grupos**: crear, unirse, flujos de invitación y solicitud, roles
- **Hooks**: administrar hooks de canales
- **Mensajes**: historial, búsqueda
- **Mensajes directos**: enviar, reaccionar, aceptar o rechazar
- **Publicaciones**: reaccionar, eliminar
- **Cuaderno**: publicar en canales de diario
- **Ajustes**: recargar en caliente la configuración del plugin mediante el almacén de ajustes anterior

## Capacidades

| Función           | Estado                                                    |
| ----------------- | --------------------------------------------------------- |
| Mensajes directos | Admitidos                                                 |
| Grupos y canales  | Admitidos (requieren mención de forma predeterminada)     |
| Hilos             | Admitidos (sigue respondiendo una vez que se ha unido)    |
| Texto enriquecido | Markdown convertido al formato nativo de Tlon             |
| Imágenes          | Las entrantes se descargan y las salientes se cargan      |
| Reacciones        | Solo mediante la [habilidad incluida](#bundled-skill)     |
| Encuestas         | No admitidas                                              |
| Comandos nativos  | Solo para el propietario de forma predeterminada          |

## Solución de problemas

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Errores habituales:

- **Se ignoran los mensajes directos**: el remitente no está en `dmAllowlist` y no se ha configurado
  `ownerShip` para el flujo de aprobación.
- **Se ignoran los mensajes grupales**: el canal no se ha detectado o fijado, o el remitente no
  supera la autorización y no hay ningún `ownerShip` para poner una aprobación en cola.
- **Errores de conexión**: comprueba que se pueda acceder a la URL de la nave; establece
  `network.dangerouslyAllowPrivateNetwork` para las naves locales.
- **Errores de autenticación**: los códigos de inicio de sesión rotan; copia el código actual de tu nave.

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

| Clave                                                  | Significado                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Activa o desactiva el inicio del canal.                         |
| `channels.tlon.ship`                                   | Nombre de la nave de Urbit del bot (p. ej., `~sampel-palnet`).  |
| `channels.tlon.url`                                    | URL de la nave (p. ej., `https://sampel-palnet.tlon.network`).  |
| `channels.tlon.code`                                   | Código de inicio de sesión de la nave.                          |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Permite URL de naves en localhost o LAN (habilitación explícita de SSRF). |
| `channels.tlon.ownerShip`                              | Nave propietaria: siempre autorizada y receptora de solicitudes de aprobación. |
| `channels.tlon.dmAllowlist`                            | Naves autorizadas para enviar mensajes directos (vacía = ninguna salvo el propietario). |
| `channels.tlon.autoAcceptDmInvites`                    | Acepta automáticamente mensajes directos de naves en `dmAllowlist`. |
| `channels.tlon.autoAcceptGroupInvites`                 | Acepta automáticamente invitaciones a grupos de `groupInviteAllowlist`. |
| `channels.tlon.groupInviteAllowlist`                   | Naves cuyas invitaciones a grupos se aceptan automáticamente.   |
| `channels.tlon.autoDiscoverChannels`                   | Detecta automáticamente los canales grupales unidos (valor predeterminado: `false`). |
| `channels.tlon.groupChannels`                          | Nidos de canales fijados manualmente.                           |
| `channels.tlon.defaultAuthorizedShips`                 | Naves autorizadas para todos los canales (se usa cuando ninguna regla coincide). |
| `channels.tlon.authorization.channelRules`             | Modo de autenticación y lista de permitidos por nido de canal.  |
| `channels.tlon.showModelSignature`                     | Añade `_[Generated by <model>]_` a las respuestas.              |
| `channels.tlon.responsePrefix`                         | Prefijo estático añadido al principio de las respuestas salientes. |
| `channels.tlon.accounts.<id>`                          | Cuentas adicionales con nombre (configuraciones con varias naves). |

## Notas

- Las respuestas en grupos necesitan una mención @ (p. ej., `~your-bot-ship`), salvo que el bot ya
  se haya unido a ese hilo.
- Las respuestas a hilos se publican dentro del hilo; el bot también recibe antepuestos los últimos
  10 mensajes del contexto del hilo para el agente.
- El texto enriquecido (negrita, cursiva, código, encabezados y listas) se convierte al formato
  nativo de Tlon.
- Enviar un mensaje entrante que solicite un resumen del canal (por ejemplo, «resume este canal»)
  activa un resumen integrado del historial en lugar del flujo de respuesta normal.

## Contenido relacionado

- [Descripción general de los canales](/es/channels) — todos los canales admitidos
- [Vinculación](/es/channels/pairing) — flujo de autenticación y vinculación de mensajes directos
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y requisito de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y protección
