---
read_when:
    - Implementación de aprobaciones de emparejamiento de Node sin interfaz de usuario de macOS
    - Agregar flujos de CLI para aprobar nodos remotos
    - Extensión del protocolo de Gateway con gestión de nodos
summary: Emparejamiento de nodos gestionado por Gateway (Opción B) para iOS y otros nodos remotos
title: Emparejamiento propiedad del Gateway
x-i18n:
    generated_at: "2026-05-06T05:35:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

En el emparejamiento propiedad del Gateway, el **Gateway** es la fuente de verdad sobre qué nodos
tienen permiso para unirse. Las interfaces de usuario (app de macOS, clientes futuros) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** Los nodos WS usan **emparejamiento de dispositivos** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento independiente y **no** controla el handshake WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo pidió unirse; requiere aprobación.
- **Nodo emparejado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint WS del Gateway reenvía solicitudes, pero no decide
  la pertenencia. (Se eliminó el soporte heredado del puente TCP.)

## Cómo funciona el emparejamiento

1. Un nodo se conecta al WS del Gateway y solicita emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o interfaz de usuario).
4. Al aprobar, el Gateway emite un **token nuevo** (los tokens se rotan al volver a emparejar).
5. El nodo se reconecta usando el token y ahora está "emparejado".

Las solicitudes pendientes expiran automáticamente después de **5 minutos**.

## Flujo de trabajo de CLI (apto para entornos sin interfaz)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra los nodos emparejados/conectados y sus capacidades.

## Superficie de API (protocolo de Gateway)

Eventos:

- `node.pair.requested` - se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` - se emite cuando una solicitud se aprueba/rechaza/expira.

Métodos:

- `node.pair.request` - crear o reutilizar una solicitud pendiente.
- `node.pair.list` - listar nodos pendientes + emparejados (`operator.pairing`).
- `node.pair.approve` - aprobar una solicitud pendiente (emite token).
- `node.pair.reject` - rechazar una solicitud pendiente.
- `node.pair.remove` - eliminar una entrada obsoleta de nodo emparejado.
- `node.pair.verify` - verificar `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente también actualizan los metadatos
  del nodo almacenados y la instantánea más reciente de comandos declarados permitidos para visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; nunca se devuelve ningún token desde
  `node.pair.request`.
- Los niveles de alcance de operador y las comprobaciones en el momento de aprobación se resumen en
  [Alcances de operador](/es/gateway/operator-scopes).
- Las solicitudes pueden incluir `silent: true` como sugerencia para flujos de aprobación automática.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para aplicar
  alcances de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comando que no sea exec: `operator.pairing` + `operator.write`
  - solicitud `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
El emparejamiento de Node es un flujo de confianza e identidad más emisión de tokens. **No** fija la superficie de comandos activos del nodo por nodo.

- Los comandos activos de Node provienen de lo que el nodo declara al conectarse después de aplicar la política global de comandos de Node del Gateway (`gateway.nodes.allowCommands` y `denyCommands`).
- La política de permiso y consulta por nodo para `system.run` vive en el nodo en `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** A partir de `2026.3.31`, los comandos de Node están deshabilitados hasta que se apruebe el emparejamiento de Node. El emparejamiento de dispositivos por sí solo ya no es suficiente para exponer comandos declarados de Node.
</Warning>

Cuando un nodo se conecta por primera vez, el emparejamiento se solicita automáticamente. Hasta que se apruebe la solicitud de emparejamiento, todos los comandos pendientes de Node de ese nodo se filtran y no se ejecutarán. Una vez establecida la confianza mediante la aprobación de emparejamiento, los comandos declarados del nodo quedan disponibles sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían solo del emparejamiento de dispositivos para exponer comandos ahora deben completar el emparejamiento de Node.
- Los comandos en cola antes de la aprobación de emparejamiento se descartan, no se difieren.

## Límites de confianza de eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** Las ejecuciones originadas en Node ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados en Node y los eventos de sesión relacionados se restringen a la superficie de confianza prevista. Los flujos impulsados por notificaciones o activados por Node que antes dependían de un acceso más amplio a herramientas de host o sesión pueden necesitar ajustes. Este refuerzo garantiza que los eventos de Node no puedan escalar a acceso a herramientas de nivel de host más allá de lo que permite el límite de confianza del nodo.

Las actualizaciones duraderas de presencia de Node siguen el mismo límite de identidad. El evento `node.presence.alive` se
acepta solo desde sesiones de dispositivo de Node autenticadas y actualiza los metadatos de emparejamiento solo cuando la
identidad de dispositivo/nodo ya está emparejada. Los valores `client.id` autodeclarados no bastan para escribir
el estado de última vista.

## Aprobación automática (app de macOS)

La app de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del gateway usando el mismo usuario.

Si la aprobación silenciosa falla, recurre al prompt normal de "Aprobar/Rechazar".

## Aprobación automática de dispositivos por CIDR de confianza

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. Para redes
privadas de nodos donde el Gateway ya confía en la ruta de red, los operadores pueden
habilitarlo con CIDR explícitos o IP exactas:

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

- Deshabilitado cuando `gateway.nodes.pairing.autoApproveCidrs` no está definido.
- No existe un modo de aprobación automática general para LAN o redes privadas.
- Solo es elegible el emparejamiento de dispositivo `role: node` nuevo sin alcances solicitados.
- Los clientes de operador, navegador, Control UI y WebChat siguen siendo manuales.
- Las actualizaciones de rol, alcance, metadatos y clave pública siguen siendo manuales.
- Las rutas de encabezados de proxy de confianza de loopback del mismo host no son elegibles porque esa
  ruta puede ser suplantada por llamadores locales.

## Aprobación automática de actualización de metadatos

Cuando un dispositivo ya emparejado se reconecta solo con cambios de metadatos no sensibles
(por ejemplo, nombre visible o pistas de plataforma del cliente), OpenClaw lo trata
como una `metadata-upgrade`. La aprobación automática silenciosa es estrecha: se aplica solo
a reconexiones locales de confianza que no sean de navegador y que ya hayan demostrado posesión de credenciales locales
o compartidas, incluidas reconexiones de apps nativas del mismo host después de cambios de metadatos de versión del SO.
Los clientes de navegador/Control UI y los clientes remotos siguen
usando el flujo explícito de reaprobación. Las actualizaciones de alcance (lectura a escritura/admin) y
los cambios de clave pública **no** son elegibles para aprobación automática de actualización de metadatos -
permanecen como solicitudes explícitas de reaprobación.

## Ayudantes de emparejamiento por QR

`/pair qr` representa la carga de emparejamiento como medios estructurados para que los clientes móviles y de
navegador puedan escanearla directamente.

Eliminar un dispositivo también limpia cualquier solicitud pendiente obsoleta de emparejamiento para ese
id de dispositivo, por lo que `nodes pending` no muestra filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento de Gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
incluye encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
que apuntan a un origen no local, esa evidencia de encabezados reenviados descalifica
la afirmación de localidad de loopback. La ruta de emparejamiento entonces requiere aprobación explícita
en lugar de tratar silenciosamente la solicitud como una conexión del mismo host. Consulta
[Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth) para la regla equivalente sobre
autenticación de operador.

## Almacenamiento (local, privado)

El estado de emparejamiento se almacena bajo el directorio de estado del Gateway (predeterminado `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si sobrescribes `OPENCLAW_STATE_DIR`, la carpeta `nodes/` se mueve con él.

Notas de seguridad:

- Los tokens son secretos; trata `paired.json` como sensible.
- Rotar un token requiere reaprobación (o eliminar la entrada del nodo).

## Comportamiento de transporte

- El transporte es **sin estado**; no almacena pertenencia.
- Si el Gateway está sin conexión o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- Si el Gateway está en modo remoto, el emparejamiento sigue ocurriendo contra el almacén del Gateway remoto.

## Relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [Nodos](/es/nodes)
- [CLI de dispositivos](/es/cli/devices)
