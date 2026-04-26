---
read_when:
    - Implementar aprobaciones de emparejamiento de Nodes sin interfaz de macOS
    - Añadir flujos de CLI para aprobar Nodes remotos
    - Ampliar el protocolo del Gateway con gestión de Nodes
summary: Emparejamiento de Nodes propiedad del Gateway (Opción B) para iOS y otros Nodes remotos
title: Emparejamiento propiedad del Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

En el emparejamiento propiedad del Gateway, el **Gateway** es la fuente de verdad sobre qué Nodes
pueden unirse. Las UI (app de macOS, futuros clientes) son solo interfaces que
aprueban o rechazan solicitudes pendientes.

**Importante:** los Nodes WS usan **emparejamiento de dispositivo** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento independiente y **no** controla el handshake de WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un Node pidió unirse; requiere aprobación.
- **Node emparejado**: Node aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint WS del Gateway reenvía solicitudes, pero no decide
  la pertenencia. (Se eliminó el soporte heredado del puente TCP).

## Cómo funciona el emparejamiento

1. Un Node se conecta al WS del Gateway y solicita emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o UI).
4. Al aprobarla, el Gateway emite un **nuevo token** (los tokens rotan al volver a emparejar).
5. El Node se reconecta usando el token y ahora está “emparejado”.

Las solicitudes pendientes caducan automáticamente después de **5 minutos**.

## Flujo de trabajo de CLI (compatible con modo sin interfaz)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra los Nodes emparejados/conectados y sus capacidades.

## Superficie de API (protocolo del gateway)

Eventos:

- `node.pair.requested` — emitido cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` — emitido cuando una solicitud se aprueba/rechaza/caduca.

Métodos:

- `node.pair.request` — crea o reutiliza una solicitud pendiente.
- `node.pair.list` — lista Nodes pendientes + emparejados (`operator.pairing`).
- `node.pair.approve` — aprueba una solicitud pendiente (emite token).
- `node.pair.reject` — rechaza una solicitud pendiente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por Node: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo Node pendiente también actualizan los
  metadatos almacenados del Node y la instantánea más reciente de comandos declarados permitidos
  para visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; nunca se devuelve ningún token desde
  `node.pair.request`.
- Las solicitudes pueden incluir `silent: true` como sugerencia para flujos de autoaprobación.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para aplicar
  alcances de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comando que no sea exec: `operator.pairing` + `operator.write`
  - solicitud de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- El emparejamiento de Nodes es un flujo de confianza/identidad más emisión de token.
- **No** fija la superficie activa de comandos del Node por Node.
- Los comandos activos del Node provienen de lo que el Node declara al conectarse después de que se aplica
  la política global de comandos de Node del Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La política por Node de permitir/preguntar de `system.run` vive en el Node en
  `exec.approvals.node.*`, no en el registro de emparejamiento.

## Restricción de comandos de Node (2026.3.31+)

<Warning>
**Cambio importante:** a partir de `2026.3.31`, los comandos de Node se desactivan hasta que se apruebe el emparejamiento del Node. El emparejamiento de dispositivo por sí solo ya no basta para exponer los comandos declarados del Node.
</Warning>

Cuando un Node se conecta por primera vez, el emparejamiento se solicita automáticamente. Hasta que se apruebe la solicitud de emparejamiento, todos los comandos pendientes de ese Node se filtran y no se ejecutan. Una vez que se establece la confianza mediante la aprobación del emparejamiento, los comandos declarados del Node pasan a estar disponibles sujetos a la política normal de comandos.

Esto significa:

- Los Nodes que antes dependían solo del emparejamiento de dispositivo para exponer comandos ahora deben completar el emparejamiento del Node.
- Los comandos en cola antes de la aprobación del emparejamiento se descartan, no se aplazan.

## Límites de confianza de eventos de Node (2026.3.31+)

<Warning>
**Cambio importante:** las ejecuciones originadas por Nodes ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por Nodes y los eventos de sesión relacionados están restringidos a la superficie de confianza prevista. Los flujos activados por notificaciones o por Nodes que antes dependían de un acceso más amplio a herramientas del host o de la sesión pueden necesitar ajustes. Este refuerzo garantiza que los eventos de Node no puedan escalar a acceso a herramientas a nivel del host más allá de lo que permita el límite de confianza del Node.

## Autoaprobación (app de macOS)

La app de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del gateway usando el mismo usuario.

Si la aprobación silenciosa falla, vuelve al aviso normal de “Aprobar/Rechazar”.

## Autoaprobación de dispositivos por CIDR de confianza

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. Para redes privadas
de Nodes donde el Gateway ya confía en la ruta de red, los operadores pueden
activarlo explícitamente con CIDR explícitos o IP exactas:

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

Límite de seguridad:

- Está desactivado cuando `gateway.nodes.pairing.autoApproveCidrs` no está configurado.
- No existe ningún modo general de autoaprobación para LAN o red privada.
- Solo son elegibles las solicitudes nuevas de emparejamiento de dispositivo con `role: node` sin alcances solicitados.
- Los clientes Operator, navegador, Control UI y WebChat siguen siendo manuales.
- Las ampliaciones de rol, alcance, metadatos y clave pública siguen siendo manuales.
- Las rutas de encabezado trusted-proxy de loopback en el mismo host no son elegibles porque
  esa ruta puede ser falsificada por llamadores locales.

## Autoaprobación de mejora de metadatos

Cuando un dispositivo ya emparejado se reconecta con cambios solo en metadatos no sensibles
(por ejemplo, nombre para mostrar o pistas de plataforma del cliente), OpenClaw lo trata
como una `metadata-upgrade`. La autoaprobación silenciosa es limitada: se aplica solo
a reconexiones locales de confianza que no sean de navegador y que ya hayan demostrado posesión de credenciales locales
o compartidas, incluidas reconexiones de apps nativas del mismo host tras cambios de metadatos de versión del SO. Los clientes de navegador/Control UI y los clientes remotos siguen
usando el flujo explícito de reaprobación. Las ampliaciones de alcance (de lectura a escritura/admin) y los cambios de
clave pública **no** son elegibles para autoaprobación de mejora de metadatos:
siguen siendo solicitudes explícitas de reaprobación.

## Helpers de emparejamiento por QR

`/pair qr` renderiza la carga de emparejamiento como multimedia estructurada para que los clientes móviles y
de navegador puedan escanearla directamente.

Eliminar un dispositivo también limpia cualquier solicitud pendiente obsoleta de emparejamiento para ese
id de dispositivo, de modo que `nodes pending` no muestre filas huérfanas tras una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway trata una conexión como loopback solo cuando tanto el socket raw
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
lleva encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` que apuntan
a un origen no local, esa evidencia de encabezados reenviados invalida la afirmación
de localidad loopback. La ruta de emparejamiento entonces requiere aprobación explícita
en lugar de tratar silenciosamente la solicitud como una conexión del mismo host. Consulta
[Autenticación de Trusted Proxy](/es/gateway/trusted-proxy-auth) para la regla equivalente en
la autenticación del operador.

## Almacenamiento (local, privado)

El estado de emparejamiento se almacena bajo el directorio de estado del Gateway (valor predeterminado `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si anulas `OPENCLAW_STATE_DIR`, la carpeta `nodes/` se mueve con él.

Notas de seguridad:

- Los tokens son secretos; trata `paired.json` como información sensible.
- Rotar un token requiere reaprobación (o eliminar la entrada del Node).

## Comportamiento del transporte

- El transporte **no tiene estado**; no almacena pertenencia.
- Si el Gateway está offline o el emparejamiento está desactivado, los Nodes no pueden emparejarse.
- Si el Gateway está en modo remoto, el emparejamiento sigue ocurriendo contra el almacén del Gateway remoto.

## Relacionado

- [Emparejamiento de canal](/es/channels/pairing)
- [Nodes](/es/nodes)
- [CLI de dispositivos](/es/cli/devices)
