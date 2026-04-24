---
read_when:
    - Implementar aprobaciones de vinculación de nodos sin interfaz de macOS
    - Añadir flujos de CLI para aprobar nodos remotos
    - Extender el protocolo del gateway con gestión de nodos
summary: Vinculación de nodos controlada por el Gateway (Opción B) para iOS y otros nodos remotos
title: Vinculación controlada por el Gateway
x-i18n:
    generated_at: "2026-04-24T05:30:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Vinculación controlada por el Gateway (Opción B)

En la vinculación controlada por el Gateway, el **Gateway** es la fuente de verdad de qué nodos
tienen permiso para unirse. Las interfaces de usuario (app de macOS, futuros clientes) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** los nodos WS usan **vinculación de dispositivos** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de vinculación independiente y **no** controla el handshake WS.
Solo los clientes que llamen explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo ha pedido unirse; requiere aprobación.
- **Nodo vinculado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint Gateway WS reenvía solicitudes, pero no decide
  la pertenencia. (El soporte del puente TCP heredado se ha eliminado.)

## Cómo funciona la vinculación

1. Un nodo se conecta al Gateway WS y solicita vinculación.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o UI).
4. Al aprobarla, el Gateway emite un **nuevo token** (los tokens se rotan al volver a vincular).
5. El nodo vuelve a conectarse usando el token y ahora queda “vinculado”.

Las solicitudes pendientes caducan automáticamente después de **5 minutos**.

## Flujo de trabajo de CLI (compatible con modo sin interfaz)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra los nodos vinculados/conectados y sus capacidades.

## Superficie de API (protocolo del gateway)

Eventos:

- `node.pair.requested` — se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` — se emite cuando una solicitud se aprueba/rechaza/caduca.

Métodos:

- `node.pair.request` — crea o reutiliza una solicitud pendiente.
- `node.pair.list` — lista nodos pendientes + vinculados (`operator.pairing`).
- `node.pair.approve` — aprueba una solicitud pendiente (emite token).
- `node.pair.reject` — rechaza una solicitud pendiente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente también actualizan los metadatos almacenados del nodo
  y la instantánea más reciente declarada de comandos permitidos para visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; nunca se devuelve ningún token desde
  `node.pair.request`.
- Las solicitudes pueden incluir `silent: true` como pista para flujos de autoaprobación.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para aplicar
  ámbitos de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comandos sin ejecución: `operator.pairing` + `operator.write`
  - solicitud de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- La vinculación de nodos es un flujo de confianza/identidad más emisión de tokens.
- **No** fija la superficie activa de comandos del nodo por nodo.
- Los comandos activos del nodo provienen de lo que el nodo declara al conectarse después de aplicar
  la política global de comandos de nodos del gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La política por nodo de permitir/preguntar de `system.run` vive en el nodo en
  `exec.approvals.node.*`, no en el registro de vinculación.

## Control de comandos de nodos (2026.3.31+)

<Warning>
**Cambio incompatible:** a partir de `2026.3.31`, los comandos de nodo están deshabilitados hasta que se apruebe la vinculación del nodo. La vinculación de dispositivo por sí sola ya no basta para exponer los comandos declarados del nodo.
</Warning>

Cuando un nodo se conecta por primera vez, la vinculación se solicita automáticamente. Hasta que se apruebe la solicitud de vinculación, todos los comandos pendientes de ese nodo se filtran y no se ejecutarán. Una vez establecida la confianza mediante la aprobación de la vinculación, los comandos declarados del nodo pasan a estar disponibles sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían solo de la vinculación de dispositivo para exponer comandos ahora deben completar la vinculación del nodo.
- Los comandos puestos en cola antes de aprobar la vinculación se descartan, no se posponen.

## Límites de confianza de eventos de nodo (2026.3.31+)

<Warning>
**Cambio incompatible:** las ejecuciones originadas por nodos ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por nodos y los eventos de sesión relacionados se restringen a la superficie de confianza prevista. Los flujos impulsados por notificaciones o desencadenados por nodos que antes dependían de un acceso más amplio a herramientas de host o de sesión pueden necesitar ajustes. Este refuerzo garantiza que los eventos de nodo no puedan escalar a acceso a herramientas a nivel de host más allá de lo que permita el límite de confianza del nodo.

## Autoaprobación (app de macOS)

La app de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del gateway usando el mismo usuario.

Si la aprobación silenciosa falla, recurre a la solicitud normal de “Aprobar/Rechazar”.

## Autoaprobación de actualización de metadatos

Cuando un dispositivo ya vinculado vuelve a conectarse con solo cambios de metadatos no sensibles
(por ejemplo, nombre para mostrar o pistas de plataforma del cliente), OpenClaw trata
eso como una `metadata-upgrade`. La autoaprobación silenciosa es limitada: se aplica solo
a reconexiones confiables de CLI/helper locales que ya demostraron posesión del
token o contraseña compartidos por loopback. Los clientes Browser/Control UI y los
clientes remotos siguen usando el flujo explícito de reaprobación. Las actualizaciones de ámbito (de lectura a
escritura/admin) y los cambios de clave pública **no** son elegibles para
autoaprobación de actualización de metadatos; siguen siendo solicitudes explícitas de reaprobación.

## Ayudantes de vinculación por QR

`/pair qr` representa la carga útil de vinculación como medio estructurado para que los clientes móviles y de navegador puedan escanearla directamente.

Eliminar un dispositivo también limpia cualquier solicitud pendiente obsoleta de vinculación para ese
id de dispositivo, de modo que `nodes pending` no muestre filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

La vinculación del gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
lleva encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
que apuntan a un origen no local, esa evidencia de encabezados reenviados invalida
la afirmación de localidad loopback. La ruta de vinculación pasa entonces a requerir aprobación explícita
en lugar de tratar silenciosamente la solicitud como una conexión del mismo host. Consulta
[Autenticación de trusted proxy](/es/gateway/trusted-proxy-auth) para ver la regla equivalente en
la autenticación de operador.

## Almacenamiento (local, privado)

El estado de vinculación se almacena en el directorio de estado del Gateway (predeterminado `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si anulas `OPENCLAW_STATE_DIR`, la carpeta `nodes/` se mueve con él.

Notas de seguridad:

- Los tokens son secretos; trata `paired.json` como material sensible.
- Rotar un token requiere reaprobación (o eliminar la entrada del nodo).

## Comportamiento del transporte

- El transporte es **sin estado**; no almacena pertenencia.
- Si el Gateway está desconectado o la vinculación está deshabilitada, los nodos no pueden vincularse.
- Si el Gateway está en modo remoto, la vinculación sigue produciéndose contra el almacén del Gateway remoto.

## Relacionado

- [Vinculación de canales](/es/channels/pairing)
- [Nodos](/es/nodes)
- [CLI de dispositivos](/es/cli/devices)
