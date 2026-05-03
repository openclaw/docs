---
read_when:
    - Implementación de aprobaciones de emparejamiento de nodos sin interfaz de usuario de macOS
    - Añadiendo flujos de CLI para aprobar nodos remotos
    - Ampliación del protocolo Gateway con gestión de Node
summary: Emparejamiento de nodos gestionado por el Gateway (Opción B) para iOS y otros nodos remotos
title: Emparejamiento gestionado por el Gateway
x-i18n:
    generated_at: "2026-05-03T05:28:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

En el emparejamiento propiedad del Gateway, el **Gateway** es la fuente de verdad sobre qué nodos
tienen permitido unirse. Las interfaces de usuario (app de macOS, clientes futuros) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** Los nodos WS usan **emparejamiento de dispositivos** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento separado y **no** controla el handshake WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo pidió unirse; requiere aprobación.
- **Nodo emparejado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint WS del Gateway reenvía solicitudes, pero no decide
  la pertenencia. (Se eliminó la compatibilidad con el puente TCP heredado).

## Cómo funciona el emparejamiento

1. Un nodo se conecta al WS del Gateway y solicita emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o UI).
4. Tras la aprobación, el Gateway emite un **token nuevo** (los tokens se rotan al reemparejar).
5. El nodo se reconecta usando el token y ahora queda “emparejado”.

Las solicitudes pendientes caducan automáticamente después de **5 minutos**.

## Flujo de trabajo de CLI (apto para headless)

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

- `node.pair.requested` — emitido cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` — emitido cuando una solicitud se aprueba/rechaza/caduca.

Métodos:

- `node.pair.request` — crea o reutiliza una solicitud pendiente.
- `node.pair.list` — lista nodos pendientes y emparejados (`operator.pairing`).
- `node.pair.approve` — aprueba una solicitud pendiente (emite token).
- `node.pair.reject` — rechaza una solicitud pendiente.
- `node.pair.remove` — elimina una entrada obsoleta de nodo emparejado.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente también actualizan los metadatos
  almacenados del nodo y la última instantánea permitida de comandos declarados para visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; nunca se devuelve un token desde
  `node.pair.request`.
- Los niveles de alcance del operador y las comprobaciones en el momento de aprobación se resumen en
  [Alcances de operador](/es/gateway/operator-scopes).
- Las solicitudes pueden incluir `silent: true` como indicio para flujos de aprobación automática.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para exigir
  alcances de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comandos no exec: `operator.pairing` + `operator.write`
  - solicitud `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
El emparejamiento de nodos es un flujo de confianza e identidad más emisión de tokens. **No** fija la superficie de comandos activa del nodo por nodo.

- Los comandos activos de nodo provienen de lo que el nodo declara al conectarse después de aplicar la política global de comandos de nodo del Gateway (`gateway.nodes.allowCommands` y `denyCommands`).
- La política por nodo de permitir y preguntar para `system.run` vive en el nodo en `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** A partir de `2026.3.31`, los comandos de nodo están deshabilitados hasta que se apruebe el emparejamiento de nodo. El emparejamiento de dispositivos por sí solo ya no basta para exponer comandos de nodo declarados.
</Warning>

Cuando un nodo se conecta por primera vez, el emparejamiento se solicita automáticamente. Hasta que se apruebe la solicitud de emparejamiento, todos los comandos pendientes de ese nodo se filtran y no se ejecutan. Una vez establecida la confianza mediante la aprobación del emparejamiento, los comandos declarados del nodo quedan disponibles sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían solo del emparejamiento de dispositivos para exponer comandos ahora deben completar el emparejamiento de nodo.
- Los comandos en cola antes de la aprobación del emparejamiento se descartan, no se difieren.

## Límites de confianza de eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** Las ejecuciones originadas por nodos ahora permanecen en una superficie confiable reducida.
</Warning>

Los resúmenes originados por nodos y los eventos de sesión relacionados se restringen a la superficie confiable prevista. Es posible que los flujos impulsados por notificaciones o activados por nodos que antes dependían de un acceso más amplio a herramientas del host o de sesión necesiten ajustes. Este endurecimiento garantiza que los eventos de nodo no puedan escalar a acceso a herramientas de nivel host más allá de lo que permite el límite de confianza del nodo.

Las actualizaciones duraderas de presencia de nodo siguen el mismo límite de identidad. El evento `node.presence.alive` se
acepta solo desde sesiones de dispositivos de nodo autenticadas y actualiza los metadatos de emparejamiento solo cuando la
identidad de dispositivo/nodo ya está emparejada. Los valores `client.id` autodeclarados no bastan para escribir
el estado de última vista.

## Aprobación automática (app de macOS)

La app de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del Gateway usando el mismo usuario.

Si la aprobación silenciosa falla, recurre al aviso normal de “Aprobar/Rechazar”.

## Aprobación automática de dispositivos por CIDR de confianza

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. Para redes
privadas de nodos donde el Gateway ya confía en la ruta de red, los operadores pueden
activarlo con CIDR explícitos o IP exactas:

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
- No existe un modo general de aprobación automática para LAN o red privada.
- Solo el emparejamiento nuevo de dispositivos con `role: node` sin alcances solicitados es elegible.
- Los clientes de operador, navegador, Control UI y WebChat siguen siendo manuales.
- Las actualizaciones de rol, alcance, metadatos y clave pública siguen siendo manuales.
- Las rutas de encabezado de proxy de confianza para local loopback en el mismo host no son elegibles porque esa
  ruta puede ser suplantada por llamadores locales.

## Aprobación automática de actualización de metadatos

Cuando un dispositivo ya emparejado se reconecta con solo cambios de metadatos no sensibles
(por ejemplo, nombre visible o indicios de plataforma del cliente), OpenClaw trata
eso como un `metadata-upgrade`. La aprobación automática silenciosa es limitada: se aplica solo
a reconexiones locales confiables que no sean de navegador y que ya hayan probado posesión de credenciales locales
o compartidas, incluidas las reconexiones de apps nativas en el mismo host después de cambios de metadatos de versión del SO. Los clientes de navegador/Control UI y los clientes remotos siguen
usando el flujo explícito de reaprobación. Las actualizaciones de alcance (lectura a escritura/admin) y
los cambios de clave pública **no** son elegibles para aprobación automática de metadata-upgrade;
permanecen como solicitudes explícitas de reaprobación.

## Ayudantes de emparejamiento QR

`/pair qr` representa la carga útil de emparejamiento como medios estructurados para que los clientes móviles y
de navegador puedan escanearla directamente.

Eliminar un dispositivo también limpia cualquier solicitud de emparejamiento pendiente obsoleta para ese
id de dispositivo, por lo que `nodes pending` no muestra filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway trata una conexión como loopback solo cuando tanto el socket bruto
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
incluye encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
que apuntan a un origen no local, esa evidencia de encabezado reenviado descalifica
la afirmación de localidad loopback. La ruta de emparejamiento entonces requiere aprobación explícita
en vez de tratar silenciosamente la solicitud como una conexión del mismo host. Consulta
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

## Comportamiento del transporte

- El transporte es **sin estado**; no almacena pertenencia.
- Si el Gateway está offline o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- Si el Gateway está en modo remoto, el emparejamiento sigue ocurriendo contra el almacén del Gateway remoto.

## Relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [Nodos](/es/nodes)
- [CLI de dispositivos](/es/cli/devices)
