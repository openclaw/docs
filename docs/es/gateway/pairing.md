---
read_when:
    - Implementar aprobaciones de emparejamiento de nodos sin interfaz de usuario de macOS
    - Añadiendo flujos de CLI para aprobar nodos remotos
    - Ampliación del protocolo de gateway con gestión de nodos
summary: Emparejamiento de nodos propiedad del Gateway (opción B) para iOS y otros nodos remotos
title: Emparejamiento propiedad de Gateway
x-i18n:
    generated_at: "2026-07-06T21:49:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5793d2b0c440e2a0b455055493996f03c43fe087a55371c6e36b7752265d208
    source_path: gateway/pairing.md
    workflow: 16
---

En el emparejamiento propiedad del Gateway, el **Gateway** es la fuente de verdad sobre qué
nodos pueden unirse. Las IU (app de macOS, futuros clientes) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** los nodos WS usan **emparejamiento de dispositivos** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento separado y heredado, y **no** controla el handshake WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo pidió unirse; requiere aprobación.
- **Nodo emparejado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint WS del Gateway reenvía solicitudes, pero no decide
  la pertenencia. Se eliminó la compatibilidad con el puente TCP heredado.

## Cómo funciona el emparejamiento

1. Un nodo se conecta al WS del Gateway y solicita emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o IU).
4. Tras la aprobación, el Gateway emite un **token nuevo** (los tokens rotan al volver a emparejar).
5. El nodo se reconecta usando el token y queda emparejado.

Las solicitudes pendientes caducan automáticamente **5 minutos después del último
reintento del nodo**: un nodo que se reconecta activamente mantiene viva su única
solicitud pendiente en lugar de generar una solicitud nueva (y una solicitud de aprobación)
por cada intento.

## Flujo de CLI (apto para entornos sin interfaz)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra los nodos emparejados/conectados y sus capacidades.

## Superficie de API (protocolo del gateway)

Eventos:

- `node.pair.requested` - emitido cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` - emitido cuando una solicitud se aprueba, se rechaza o
  caduca.

Métodos:

- `node.pair.request` - crea o reutiliza una solicitud pendiente.
- `node.pair.list` - lista nodos pendientes y emparejados (`operator.pairing`).
- `node.pair.approve` - aprueba una solicitud pendiente (emite un token).
- `node.pair.reject` - rechaza una solicitud pendiente.
- `node.pair.remove` - elimina un nodo emparejado. Para un emparejamiento respaldado por dispositivo, esto
  revoca el rol `node` del dispositivo: modifica `devices/paired.json` e
  invalida/desconecta las sesiones con rol de nodo de ese dispositivo. Un dispositivo de **rol mixto**
  (por ejemplo, uno que también tiene `operator`) conserva su fila y solo
  pierde el rol `node`; una fila de dispositivo solo de nodo se elimina. También borra cualquier
  entrada coincidente de emparejamiento de nodo heredada propiedad del gateway. Autorización: `operator.pairing`
  puede eliminar filas de nodos no operadores; un llamador con token de dispositivo que revoque su
  **propio** rol de nodo en un dispositivo de rol mixto necesita además
  `operator.admin`.
- `node.pair.verify` - verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente actualizan los metadatos almacenados
  del nodo y la instantánea más reciente de comandos declarados en la lista de permitidos para la
  visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; `node.pair.request` nunca
  devuelve un token.
- Los niveles de alcance de operador y las comprobaciones en el momento de la aprobación se resumen en
  [Alcances de operador](/es/gateway/operator-scopes).
- Las solicitudes pueden incluir `silent: true` como indicio para flujos de aprobación automática.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para aplicar
  alcances adicionales de aprobación:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comando no exec: `operator.pairing` + `operator.write`
  - solicitud `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
El emparejamiento de nodos es un flujo de confianza e identidad más emisión de tokens. **No** fija la superficie de comandos activa del nodo por nodo.

- Los comandos activos del nodo provienen de lo que el nodo declara al conectarse, filtrado por
  la política global de comandos de nodo del gateway (`gateway.nodes.allowCommands` y
  `denyCommands`).
- La política de permitir y preguntar por nodo para `system.run` vive en el nodo en
  `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de nodo (2026.3.31+)

<Warning>
**Cambio incompatible:** a partir de `2026.3.31`, los comandos de nodo están deshabilitados hasta que se aprueba el emparejamiento del nodo. El emparejamiento de dispositivos por sí solo ya no basta para exponer comandos declarados por el nodo.
</Warning>

Cuando un nodo se conecta por primera vez, el emparejamiento se solicita automáticamente.
Hasta que esa solicitud se apruebe, todos los comandos pendientes de ese nodo se
filtran y no se ejecutarán. Una vez aprobado el emparejamiento, los comandos declarados
del nodo pasan a estar disponibles, sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían solo del emparejamiento de dispositivos para exponer comandos deben
  completar ahora también el emparejamiento de nodos.
- Los comandos en cola antes de la aprobación del emparejamiento se descartan, no se aplazan.

## Límites de confianza de eventos de nodo (2026.3.31+)

<Warning>
**Cambio incompatible:** las ejecuciones originadas por nodos ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por nodos y los eventos de sesión relacionados se restringen a la
superficie de confianza prevista. Los flujos impulsados por notificaciones o activados por nodos que
antes dependían de un acceso más amplio a herramientas de host o sesión pueden requerir ajustes.
Este endurecimiento impide que los eventos de nodo escalen a acceso a herramientas de nivel de host
más allá de lo que permite el límite de confianza del nodo.

Las actualizaciones duraderas de presencia de nodo siguen el mismo límite de identidad: el
evento `node.presence.alive` solo se acepta desde sesiones autenticadas de dispositivo de nodo,
y actualiza los metadatos de emparejamiento solo cuando la identidad de dispositivo/nodo ya está
emparejada. Un valor `client.id` autodeclarado no basta para escribir
el estado de última vez visto.

## Aprobación automática (app de macOS)

La app de macOS puede intentar una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del gateway usando el mismo
  usuario.

Si la aprobación silenciosa falla, vuelve al prompt normal de Aprobar/Rechazar.

## Aprobación automática de dispositivos por CIDR de confianza

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. Para redes privadas de nodos
donde el Gateway ya confía en la ruta de red, los operadores pueden optar
por CIDR explícitos o IP exactas:

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
- Solo una solicitud nueva de emparejamiento de dispositivo con `role: node` sin alcances solicitados es
  elegible.
- Los clientes de operador, navegador, Control UI y WebChat siguen siendo manuales.
- Las actualizaciones de rol, alcance, metadatos y clave pública siguen siendo manuales.
- Las rutas de encabezado de proxy de confianza same-host loopback no son elegibles, porque esa
  ruta puede ser suplantada por llamadores locales.

## Aprobación automática de actualización de metadatos

Cuando un dispositivo ya emparejado se reconecta solo con cambios de metadatos
no sensibles (por ejemplo, nombre visible o indicios de plataforma del cliente), OpenClaw trata
eso como un `metadata-upgrade`. La aprobación automática silenciosa es limitada: se aplica solo
a reconexiones locales de confianza no navegador que ya demostraron posesión de
credenciales locales o compartidas, incluidas reconexiones de app nativa en el mismo host después de
cambios de metadatos de versión del SO. Los clientes de navegador/Control UI y clientes remotos
siguen usando el flujo explícito de reaprobación. Las actualizaciones de alcance (lectura a
escritura/admin) y los cambios de clave pública **no** son elegibles para
aprobación automática de `metadata-upgrade`; siguen siendo solicitudes explícitas de reaprobación.

## Ayudantes de emparejamiento QR

`/pair qr` renderiza la carga útil de emparejamiento como medios estructurados para que los clientes móviles y
de navegador puedan escanearla directamente.

Eliminar un dispositivo también barre cualquier solicitud pendiente de emparejamiento obsoleta para ese
id de dispositivo, de modo que `nodes pending` no muestre filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
lleva evidencia de encabezado `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, esa
evidencia de encabezado reenviado descalifica la afirmación de localidad de loopback, y la
ruta de emparejamiento requiere aprobación explícita en lugar de tratar silenciosamente la
solicitud como una conexión del mismo host. Consulta
[Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth) para la regla equivalente sobre
autenticación de operador.

## Almacenamiento (local, privado)

El estado de emparejamiento se almacena bajo el directorio de estado del Gateway (predeterminado
`~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si sobrescribes `OPENCLAW_STATE_DIR`, la carpeta `nodes/` se mueve con él.

Notas de seguridad:

- Los tokens son secretos; trata `paired.json` como sensible.
- Rotar un token requiere reaprobación (o eliminar la entrada del nodo).

## Comportamiento del transporte

- El transporte es **sin estado**; no almacena pertenencia.
- Si el Gateway está sin conexión o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- En modo remoto, el emparejamiento ocurre contra el almacén del Gateway remoto.

## Relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [CLI de nodos](/es/cli/nodes)
- [CLI de dispositivos](/es/cli/devices)
