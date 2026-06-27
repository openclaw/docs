---
read_when:
    - Implementación de aprobaciones de emparejamiento de nodos sin interfaz de usuario de macOS
    - Adición de flujos de CLI para aprobar nodos remotos
    - Extensión del protocolo Gateway con gestión de nodos
summary: Emparejamiento de nodos propiedad del Gateway (opción B) para iOS y otros nodos remotos
title: Emparejamiento propiedad del Gateway
x-i18n:
    generated_at: "2026-06-27T11:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

En el emparejamiento propiedad del Gateway, el **Gateway** es la fuente de verdad sobre qué nodos
pueden unirse. Las interfaces de usuario (aplicación de macOS, clientes futuros) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** Los nodos WS usan **emparejamiento de dispositivo** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento separado y **no** controla el handshake WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo pidió unirse; requiere aprobación.
- **Nodo emparejado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint WS del Gateway reenvía solicitudes, pero no decide
  la membresía. (Se eliminó el soporte heredado del puente TCP.)

## Cómo funciona el emparejamiento

1. Un nodo se conecta al WS del Gateway y solicita emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o interfaz de usuario).
4. Al aprobarse, el Gateway emite un **token nuevo** (los tokens se rotan al volver a emparejar).
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

- `node.pair.requested` - se emite cuando se crea una solicitud pendiente nueva.
- `node.pair.resolved` - se emite cuando una solicitud se aprueba, rechaza o expira.

Métodos:

- `node.pair.request` - crear o reutilizar una solicitud pendiente.
- `node.pair.list` - listar nodos pendientes y emparejados (`operator.pairing`).
- `node.pair.approve` - aprobar una solicitud pendiente (emite token).
- `node.pair.reject` - rechazar una solicitud pendiente.
- `node.pair.remove` - eliminar un nodo emparejado. En emparejamientos respaldados por dispositivo, esto
  revoca el rol `node` del dispositivo: muta `devices/paired.json` e
  invalida/desconecta las sesiones con rol de nodo de ese dispositivo. Un dispositivo de **roles mixtos**
  (por ejemplo, también tiene `operator`) conserva su fila y solo pierde el rol `node`;
  se elimina una fila de dispositivo solo de nodo. También elimina cualquier entrada heredada coincidente
  de emparejamiento de nodo propiedad del Gateway. Autorización: `operator.pairing` puede eliminar
  filas de nodo no operador; un llamador con token de dispositivo que revoca su rol de nodo **propio** en
  un dispositivo de roles mixtos además necesita `operator.admin`.
- `node.pair.verify` - verificar `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente también actualizan los metadatos almacenados del nodo
  y la instantánea más reciente de comandos declarados incluidos en la lista de permitidos para visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; `node.pair.request` nunca devuelve ningún token.
- Los niveles de alcance de operador y las comprobaciones en el momento de aprobación se resumen en
  [alcances de operador](/es/gateway/operator-scopes).
- Las solicitudes pueden incluir `silent: true` como sugerencia para flujos de aprobación automática.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para exigir
  alcances de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comando no exec: `operator.pairing` + `operator.write`
  - solicitud de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
El emparejamiento de nodos es un flujo de confianza e identidad más emisión de tokens. **No** fija la superficie de comandos de nodo en vivo por nodo.

- Los comandos de nodo en vivo provienen de lo que el nodo declara al conectarse después de aplicar la política global de comandos de nodo del gateway (`gateway.nodes.allowCommands` y `denyCommands`).
- La política de permitir y preguntar por nodo para `system.run` reside en el nodo en `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** A partir de `2026.3.31`, los comandos de nodo están deshabilitados hasta que se apruebe el emparejamiento de nodo. El emparejamiento de dispositivo por sí solo ya no basta para exponer los comandos de nodo declarados.
</Warning>

Cuando un nodo se conecta por primera vez, el emparejamiento se solicita automáticamente. Hasta que se apruebe la solicitud de emparejamiento, todos los comandos de nodo pendientes de ese nodo se filtran y no se ejecutarán. Una vez establecida la confianza mediante la aprobación del emparejamiento, los comandos declarados del nodo pasan a estar disponibles sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían solo del emparejamiento de dispositivo para exponer comandos ahora deben completar el emparejamiento de nodo.
- Los comandos encolados antes de la aprobación del emparejamiento se descartan, no se aplazan.

## Límites de confianza de eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** Las ejecuciones originadas por Node ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por Node y los eventos de sesión relacionados están restringidos a la superficie de confianza prevista. Los flujos impulsados por notificaciones o desencadenados por nodos que antes dependían de un acceso más amplio a herramientas del host o de la sesión pueden requerir ajustes. Este endurecimiento garantiza que los eventos de nodo no puedan escalar a acceso a herramientas a nivel de host más allá de lo que permite el límite de confianza del nodo.

Las actualizaciones duraderas de presencia de nodo siguen el mismo límite de identidad. El evento `node.presence.alive` se
acepta solo desde sesiones de dispositivo de nodo autenticadas y actualiza los metadatos de emparejamiento solo cuando la
identidad dispositivo/nodo ya está emparejada. Los valores `client.id` autodeclarados no bastan para escribir el estado de
última actividad.

## Aprobación automática (app de macOS)

La app de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del Gateway usando el mismo usuario.

Si la aprobación silenciosa falla, recurre al aviso normal de "Aprobar/Rechazar".

## Aprobación automática de dispositivos con CIDR de confianza

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. Para redes
privadas de nodos donde el Gateway ya confía en la ruta de red, los operadores pueden
optar por CIDR explícitos o IP exactas:

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
- No existe ningún modo general de aprobación automática para LAN o redes privadas.
- Solo es elegible el emparejamiento nuevo de dispositivos `role: node` sin ámbitos solicitados.
- Los clientes de operador, navegador, Control UI y WebChat siguen siendo manuales.
- Las actualizaciones de rol, ámbito, metadatos y clave pública siguen siendo manuales.
- Las rutas de cabecera de proxy de confianza para local loopback del mismo host no son elegibles porque esa
  ruta puede ser suplantada por llamadores locales.

## Aprobación automática de actualización de metadatos

Cuando un dispositivo ya emparejado se reconecta solo con cambios de metadatos no sensibles
(por ejemplo, nombre para mostrar o pistas de plataforma del cliente), OpenClaw lo trata
como una `metadata-upgrade`. La aprobación automática silenciosa es limitada: se aplica solo
a reconexiones locales de confianza que no sean de navegador y que ya hayan demostrado posesión de credenciales locales
o compartidas, incluidas reconexiones de apps nativas en el mismo host después de cambios de metadatos de versión del SO.
Los clientes de navegador/Control UI y los clientes remotos siguen
usando el flujo explícito de reaprobación. Las actualizaciones de ámbito (de lectura a escritura/admin) y
los cambios de clave pública **no** son elegibles para la aprobación automática de metadata-upgrade:
permanecen como solicitudes explícitas de reaprobación.

## Ayudantes de emparejamiento QR

`/pair qr` renderiza la carga útil de emparejamiento como medios estructurados para que los clientes móviles y de
navegador puedan escanearla directamente.

Eliminar un dispositivo también barre cualquier solicitud de emparejamiento pendiente obsoleta para ese
id de dispositivo, por lo que `nodes pending` no muestra filas huérfanas después de una revocación.

## Localidad y cabeceras reenviadas

El emparejamiento del Gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
incluye evidencia de cabecera `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, esa
evidencia de cabecera reenviada descalifica la afirmación de localidad loopback. La ruta de emparejamiento
entonces requiere aprobación explícita en lugar de tratar silenciosamente la solicitud como
una conexión del mismo host. Consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth) para
la regla equivalente sobre autenticación de operadores.

## Almacenamiento (local, privado)

El estado de emparejamiento se almacena bajo el directorio de estado del Gateway (predeterminado `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si sobrescribes `OPENCLAW_STATE_DIR`, la carpeta `nodes/` se mueve con él.

Notas de seguridad:

- Los tokens son secretos; trata `paired.json` como sensible.
- Rotar un token requiere reaprobación (o eliminar la entrada del nodo).

## Comportamiento del transporte

- El transporte es **sin estado**; no almacena membresía.
- Si el Gateway está desconectado o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- Si el Gateway está en modo remoto, el emparejamiento sigue ocurriendo contra el almacén del Gateway remoto.

## Relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [Nodos](/es/nodes)
- [CLI de dispositivos](/es/cli/devices)
