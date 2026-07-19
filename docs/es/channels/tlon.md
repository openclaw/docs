---
read_when:
    - Trabajo en funcionalidades del canal Tlon/Urbit
summary: Estado de compatibilidad, capacidades y configuración de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-19T01:48:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d742628d6cf9aaf82d79a8d96b1685229905e9452c9fc4d3a494d2dee8d69943
    source_path: channels/tlon.md
    workflow: 16
---

Tlon es un mensajero descentralizado creado sobre Urbit. OpenClaw se conecta a su nave de Urbit y
responde a mensajes directos y mensajes de chats grupales. De forma predeterminada, las respuestas en grupos requieren una mención @, con
reglas de autorización y un flujo de aprobación del propietario superpuestos.

Estado: plugin incluido. Se admiten mensajes directos, menciones en grupos, hilos, texto enriquecido, carga y descarga de imágenes y un
sistema de aprobación del propietario. No se admiten reacciones ni encuestas.

## Plugin incluido

Tlon se incluye en las versiones actuales de OpenClaw; las compilaciones empaquetadas no requieren una instalación independiente.

En una compilación anterior o una instalación personalizada que lo excluya, instálelo desde npm:

```bash
openclaw plugins install @openclaw/tlon
```

Use el nombre simple del paquete para seguir la etiqueta de la versión actual. Fije una versión (`@openclaw/tlon@x.y.z`)
solo para instalaciones reproducibles.

Desde un repositorio local:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

O edite directamente la configuración:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recomendado: su nave, siempre autorizada
    },
  },
}
```

Reinicie el Gateway después de editar directamente la configuración. A continuación, envíe un mensaje directo al bot o menciónelo con @ en un
canal grupal.

## Durabilidad de la entrada

OpenClaw conserva los eventos aceptados de mensajes directos y chats grupales de Tlon antes de enviarlos al agente. Los turnos pendientes o reintentables sobreviven a un reinicio del Gateway, y el trabajo permanece serializado por canal grupal o interlocutor directo. Los identificadores estables de mensajes de Urbit también suprimen un evento reenviado mientras exista su registro en la cola o el registro retenido de su finalización.

La entrega se realiza al menos una vez en el límite entre la cola y el agente: un fallo durante la transferencia puede reproducir un turno. Por tanto, las acciones del agente que produzcan efectos secundarios externos deben seguir siendo idempotentes cuando sea posible.

## Naves privadas o de LAN

OpenClaw bloquea de forma predeterminada los nombres de host y los intervalos de IP privados o internos como protección contra SSRF. Si su
nave se ejecuta en una red privada (localhost, IP de LAN o nombre de host interno), habilítelo explícitamente:

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
`http://my-ship.local:8080`. Habilite esta opción únicamente para una URL de nave en la que confíe; desactiva la protección
contra SSRF para las solicitudes HTTP de esa cuenta.

<Note>
`channels.tlon.allowPrivateNetwork` (clave plana) se ha retirado. `openclaw doctor --fix` la traslada a
`channels.tlon.network.dangerouslyAllowPrivateNetwork` automáticamente.
</Note>

## Canales grupales

Fije los canales manualmente o active la detección automática:

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

`autoDiscoverChannels` utiliza `false` de forma predeterminada cuando no está definido en la configuración; el asistente de configuración establece
la respuesta predeterminada en sí y escribe `true` explícitamente. Cuando está activado, OpenClaw consulta los grupos a los que se ha unido al iniciarse,
observa nuevos canales a medida que se aceptan invitaciones a grupos y vuelve a comprobarlos cada 2 minutos.

## Control de acceso

Lista de permitidos para mensajes directos (vacía = no se permiten mensajes directos, salvo que el remitente sea `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

La autorización de grupos utiliza `restricted` de forma predeterminada por canal. Defina `defaultAuthorizedShips` como
base y sobrescríbala para cada nido de canal:

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

Una vez que el bot ha respondido dentro de un hilo, continúa respondiendo a los mensajes posteriores de ese hilo
sin requerir otra mención.

Defina `channels.tlon.implicitMentions.threadParticipation: false` para requerir una nueva mención explícita
en esos seguimientos. Las sobrescrituras de cuentas usan `channels.tlon.accounts.<id>.implicitMentions`. Actualmente, Tlon
no produce datos `replyToBot` ni `quotedBot`, por lo que esas opciones no tienen efecto aquí.

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

La nave del propietario está autorizada en todas partes: las invitaciones a mensajes directos se aceptan siempre automáticamente, las invitaciones a grupos se
aceptan siempre automáticamente y los mensajes de canales siempre superan la autorización. No es necesario que el propietario
esté en `dmAllowlist`, `defaultAuthorizedShips` ni `groupInviteAllowlist`.

Cuando se establece `ownerShip`, las solicitudes no autorizadas no se descartan sin más: se ponen en cola como una
aprobación pendiente y se envía un mensaje directo al propietario:

- Solicitudes de mensajes directos de naves que no están en `dmAllowlist`
- Menciones en canales donde el remitente no supera la autorización
- Invitaciones a grupos de naves que no están en `groupInviteAllowlist` (cuando la aceptación automática está desactivada, o activada pero el
  remitente de la invitación no está en la lista de permitidos)

El propietario responde mediante un mensaje directo para actuar sobre una solicitud:

| Respuesta del propietario    | Efecto                                               |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | Actúa sobre la aprobación pendiente más reciente     |
| `approve <id>` / `deny <id>` | Actúa sobre una aprobación específica mediante su id |
| `block`                      | También bloquea la nave de forma nativa para que no pueda volver a conectarse |
| `unblock ~ship`              | Revierte un bloqueo nativo                           |
| `blocked`                    | Enumera las naves bloqueadas actualmente             |
| `pending`                    | Enumera las solicitudes de aprobación pendientes     |

Sin `ownerShip` configurado, los mensajes directos y las menciones en canales no autorizados simplemente se descartan y se registran;
no aparece ninguna solicitud de aprobación.

## Ajustes de aceptación automática

Acepte automáticamente las invitaciones a mensajes directos de naves que ya estén en `dmAllowlist` (el propietario siempre se acepta automáticamente,
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

Acepte automáticamente las invitaciones a grupos de una lista de permitidos (si no se cumple la condición, se deniega: con `autoAcceptGroupInvites: true` y
un `groupInviteAllowlist` vacío, no se acepta ninguna invitación que no sea del propietario):

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
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) se replican en el agente
`%settings` de la nave (escritorio `moltbot`, contenedor `tlon`) durante la primera ejecución y después se leen en vivo desde allí,
por lo que los cambios realizados mediante un cliente de Landscape o los comandos de ajustes de la skill incluida se aplican sin
reiniciar el Gateway. `channelRules` y las aprobaciones pendientes también se conservan allí como JSON. La
configuración del archivo sigue siendo la fuente de verdad para los valores que nunca se escriben en el almacén de ajustes.

## Destinos de entrega (CLI/cron)

Úselos con `openclaw message send` o la entrega mediante cron:

- Mensaje directo: `~sampel-palnet` o `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluida

El plugin incluye [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), una CLI para
operaciones directas de Urbit, disponible automáticamente una vez instalado el plugin:

- **Actividad**: menciones, respuestas, elementos no leídos
- **Canales**: enumerar, crear, cambiar de nombre
- **Contactos**: enumerar, obtener y actualizar perfiles
- **Grupos**: crear, unirse, flujos de invitación y solicitud, roles
- **Hooks**: gestionar hooks de canales
- **Mensajes**: historial, búsqueda
- **Mensajes directos**: enviar, reaccionar, aceptar o rechazar
- **Publicaciones**: reaccionar, eliminar
- **Cuaderno**: publicar en canales de diario
- **Ajustes**: recargar en caliente la configuración del plugin mediante el almacén de ajustes anterior

## Capacidades

| Función          | Estado                                                       |
| ---------------- | ------------------------------------------------------------ |
| Mensajes directos | Admitidos                                                    |
| Grupos/canales   | Admitidos (requieren una mención de forma predeterminada)     |
| Hilos            | Admitidos (sigue respondiendo una vez que se ha unido)        |
| Texto enriquecido | Markdown convertido al formato nativo de Tlon               |
| Imágenes         | Se descargan al recibirlas y se cargan al enviarlas           |
| Reacciones       | Solo mediante la [skill incluida](#bundled-skill)             |
| Encuestas        | No se admiten                                                 |
| Comandos nativos | Solo para el propietario de forma predeterminada              |

## Solución de problemas

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Fallos habituales:

- **Mensajes directos ignorados**: el remitente no está en `dmAllowlist` y no hay ningún `ownerShip` configurado para el flujo de aprobación.
- **Mensajes grupales ignorados**: el canal no se ha detectado ni fijado, o el remitente no supera la autorización y no hay ningún
  `ownerShip` para poner en cola una aprobación.
- **Errores de conexión**: compruebe que se pueda acceder a la URL de la nave; defina
  `network.dangerouslyAllowPrivateNetwork` para las naves locales.
- **Errores de autenticación**: los códigos de inicio de sesión rotan; copie el código actual de su nave.

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

| Clave                                                  | Significado                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Activa o desactiva el inicio del canal.                        |
| `channels.tlon.ship`                                   | Nombre de la nave de Urbit del bot (p. ej., `~sampel-palnet`). |
| `channels.tlon.url`                                    | URL de la nave (p. ej., `https://sampel-palnet.tlon.network`).                   |
| `channels.tlon.code`                                   | Código de inicio de sesión de la nave.                         |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Permite URL de naves de localhost/LAN (activación explícita de SSRF). |
| `channels.tlon.ownerShip`                              | Nave del propietario: siempre autorizada y recibe solicitudes de aprobación. |
| `channels.tlon.dmAllowlist`                            | Naves que pueden enviar mensajes directos (vacío = ninguna salvo el propietario). |
| `channels.tlon.autoAcceptDmInvites`                    | Acepta automáticamente mensajes directos de naves en `dmAllowlist`. |
| `channels.tlon.autoAcceptGroupInvites`                 | Acepta automáticamente invitaciones a grupos de `groupInviteAllowlist`. |
| `channels.tlon.groupInviteAllowlist`                   | Naves cuyas invitaciones a grupos se aceptan automáticamente.  |
| `channels.tlon.autoDiscoverChannels`                   | Detecta automáticamente los canales grupales a los que se ha unido (valor predeterminado: `false`). |
| `channels.tlon.implicitMentions.threadParticipation`   | Permite que los seguimientos de hilos con participación omitan el requisito de mención. |
| `channels.tlon.groupChannels`                          | Nidos de canales fijados manualmente.                          |
| `channels.tlon.defaultAuthorizedShips`                 | Naves autorizadas para todos los canales (se usa cuando no coincide ninguna regla). |
| `channels.tlon.authorization.channelRules`             | Modo de autenticación y lista de permitidos por nido de canal. |
| `channels.tlon.showModelSignature`                     | Añade `_[Generated by <model>]_` a las respuestas.                     |
| `channels.tlon.responsePrefix`                         | Prefijo estático antepuesto a las respuestas salientes.       |
| `channels.tlon.accounts.<id>`                          | Cuentas adicionales con nombre (configuraciones con varias naves). |

## Notas

- Las respuestas en grupos requieren una mención con @ (p. ej., `~your-bot-ship`), salvo que el bot ya se haya unido a ese hilo.
- Las respuestas a hilos se publican dentro del hilo; el bot también recibe antepuestos los últimos 10 mensajes del contexto del hilo
  para el agente.
- El texto enriquecido (negrita, cursiva, código, encabezados, listas) se convierte al formato nativo de Tlon.
- Enviar un mensaje entrante que solicite un resumen del canal (por ejemplo, «resume este
  canal») activa un resumen integrado del historial en lugar del flujo normal de respuesta.

## Relacionado

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por mensaje directo y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y requisito de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y protección avanzada
