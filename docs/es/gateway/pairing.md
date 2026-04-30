---
read_when:
    - Implementación de aprobaciones de emparejamiento de Node sin interfaz de usuario de macOS
    - Agregar flujos de CLI para aprobar nodos remotos
    - Ampliación del protocolo de Gateway con gestión de Node
summary: Emparejamiento de nodos propiedad del Gateway (Opción B) para iOS y otros nodos remotos
title: Emparejamiento gestionado por Gateway
x-i18n:
    generated_at: "2026-04-30T05:43:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

En el emparejamiento gestionado por Gateway, el **Gateway** es la fuente de verdad para determinar qué nodos
pueden unirse. Las IU (app de macOS, clientes futuros) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** Los nodos WS usan **emparejamiento de dispositivos** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento separado y **no** controla el handshake WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo solicitó unirse; requiere aprobación.
- **Nodo emparejado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint WS del Gateway reenvía solicitudes, pero no decide
  la pertenencia. (Se eliminó la compatibilidad con el puente TCP heredado.)

## Cómo funciona el emparejamiento

1. Un nodo se conecta al WS del Gateway y solicita el emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o IU).
4. Al aprobarla, el Gateway emite un **nuevo token** (los tokens se rotan al volver a emparejar).
5. El nodo se reconecta usando el token y ahora queda “emparejado”.

Las solicitudes pendientes caducan automáticamente después de **5 minutos**.

## Flujo de CLI (apto para modo sin interfaz)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra los nodos emparejados/conectados y sus capacidades.

## Superficie de API (protocolo de gateway)

Eventos:

- `node.pair.requested` — se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` — se emite cuando una solicitud se aprueba/rechaza/caduca.

Métodos:

- `node.pair.request` — crea o reutiliza una solicitud pendiente.
- `node.pair.list` — lista nodos pendientes + emparejados (`operator.pairing`).
- `node.pair.approve` — aprueba una solicitud pendiente (emite token).
- `node.pair.reject` — rechaza una solicitud pendiente.
- `node.pair.remove` — elimina una entrada obsoleta de nodo emparejado.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente también actualizan los metadatos
  de nodo almacenados y la instantánea más reciente permitida de comandos declarados para la visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; `node.pair.request` nunca devuelve ningún token.
- Las solicitudes pueden incluir `silent: true` como indicio para flujos de aprobación automática.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para aplicar
  alcances de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comandos no exec: `operator.pairing` + `operator.write`
  - solicitud `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
El emparejamiento de Node es un flujo de confianza e identidad, además de emisión de tokens. **No** fija por nodo la superficie activa de comandos del nodo.

- Los comandos activos del nodo provienen de lo que el nodo declara al conectarse después de aplicar la política global de comandos de nodo del gateway (`gateway.nodes.allowCommands` y `denyCommands`).
- La política por nodo de permitir y preguntar para `system.run` vive en el nodo, en `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** A partir de `2026.3.31`, los comandos de nodo están deshabilitados hasta que se apruebe el emparejamiento de nodo. El emparejamiento de dispositivos por sí solo ya no basta para exponer los comandos de nodo declarados.
</Warning>

Cuando un nodo se conecta por primera vez, el emparejamiento se solicita automáticamente. Hasta que la solicitud de emparejamiento se apruebe, todos los comandos pendientes de ese nodo se filtran y no se ejecutarán. Una vez establecida la confianza mediante la aprobación del emparejamiento, los comandos declarados del nodo quedan disponibles, sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían solo del emparejamiento de dispositivos para exponer comandos ahora deben completar el emparejamiento de nodo.
- Los comandos en cola antes de la aprobación del emparejamiento se descartan, no se difieren.

## Límites de confianza de eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** Las ejecuciones originadas por nodo ahora permanecen en una superficie confiable reducida.
</Warning>

Los resúmenes originados por nodo y los eventos de sesión relacionados se restringen a la superficie confiable prevista. Es posible que los flujos impulsados por notificaciones o activados por nodo que antes dependían de un acceso más amplio a herramientas de host o sesión necesiten ajustes. Este endurecimiento garantiza que los eventos de nodo no puedan escalar a acceso a herramientas de nivel host más allá de lo que permite el límite de confianza del nodo.

Las actualizaciones duraderas de presencia de nodo siguen el mismo límite de identidad. El evento `node.presence.alive` se
acepta solo desde sesiones autenticadas de dispositivos de nodo y actualiza los metadatos de emparejamiento solo cuando la
identidad de dispositivo/nodo ya está emparejada. Los valores `client.id` autodeclarados no bastan para escribir
el estado visto por última vez.

## Aprobación automática (app de macOS)

La app de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del gateway usando el mismo usuario.

Si la aprobación silenciosa falla, vuelve al prompt normal “Aprobar/Rechazar”.

## Aprobación automática de dispositivos por CIDR confiable

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. Para redes
privadas de nodos donde el Gateway ya confía en la ruta de red, los operadores pueden
habilitarlo explícitamente con CIDR o IP exactas:

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

- Deshabilitado cuando `gateway.nodes.pairing.autoApproveCidrs` no está configurado.
- No existe un modo general de aprobación automática para LAN o redes privadas.
- Solo es elegible el emparejamiento nuevo de dispositivos con `role: node` y sin alcances solicitados.
- Los clientes de operador, navegador, Control UI y WebChat siguen siendo manuales.
- Las mejoras de rol, alcance, metadatos y clave pública siguen siendo manuales.
- Las rutas de encabezado de proxy confiable por loopback del mismo host no son elegibles porque esa
  ruta puede ser falsificada por llamadores locales.

## Aprobación automática de actualización de metadatos

Cuando un dispositivo ya emparejado se reconecta solo con cambios de metadatos no sensibles
(por ejemplo, nombre visible o indicios de plataforma de cliente), OpenClaw lo trata
como un `metadata-upgrade`. La aprobación automática silenciosa es estricta: se aplica solo
a reconexiones locales confiables que no sean de navegador y que ya hayan demostrado posesión de credenciales locales
o compartidas, incluidas reconexiones de apps nativas del mismo host después de cambios en los metadatos de versión
del SO. Los clientes de navegador/Control UI y los clientes remotos siguen
usando el flujo explícito de reaprobación. Las mejoras de alcance (lectura a escritura/admin) y
los cambios de clave pública **no** son elegibles para la aprobación automática por metadata-upgrade:
permanecen como solicitudes explícitas de reaprobación.

## Ayudantes de emparejamiento QR

`/pair qr` representa la carga útil de emparejamiento como medio estructurado para que los clientes móviles y
de navegador puedan escanearla directamente.

Eliminar un dispositivo también limpia cualquier solicitud de emparejamiento pendiente obsoleta para ese
id de dispositivo, de modo que `nodes pending` no muestre filas huérfanas después de revocar.

## Localidad y encabezados reenviados

El emparejamiento de Gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
incluye encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
que apuntan a un origen no local, esa evidencia de encabezados reenviados descalifica
la afirmación de localidad loopback. La ruta de emparejamiento entonces requiere aprobación explícita
en lugar de tratar silenciosamente la solicitud como una conexión del mismo host. Consulta
[Autenticación de proxy confiable](/es/gateway/trusted-proxy-auth) para la regla equivalente sobre
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
- Si el Gateway está sin conexión o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- Si el Gateway está en modo remoto, el emparejamiento sigue ocurriendo contra el almacén del Gateway remoto.

## Relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [Nodos](/es/nodes)
- [CLI de dispositivos](/es/cli/devices)
