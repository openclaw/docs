---
read_when:
    - Implementando aprobaciones de emparejamiento de nodos sin interfaz de macOS
    - Agregando flujos de CLI para aprobar nodos remotos
    - Extendiendo el protocolo del Gateway con administración de nodos
summary: Emparejamiento de nodos propiedad del Gateway (Opción B) para iOS y otros nodos remotos
title: Emparejamiento propiedad del Gateway
x-i18n:
    generated_at: "2026-04-23T14:03:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Emparejamiento propiedad del Gateway (Opción B)

En el emparejamiento propiedad del Gateway, el **Gateway** es la fuente de verdad sobre qué nodos
pueden unirse. Las interfaces (aplicación de macOS, futuros clientes) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** Los nodos WS usan **emparejamiento de dispositivos** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento independiente y **no** controla el handshake de WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo pidió unirse; requiere aprobación.
- **Nodo emparejado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el extremo WS del Gateway reenvía solicitudes, pero no decide
  la pertenencia. (Se eliminó el soporte heredado del puente TCP.)

## Cómo funciona el emparejamiento

1. Un nodo se conecta al WS del Gateway y solicita emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o UI).
4. Al aprobar, el Gateway emite un **token nuevo** (los tokens rotan al volver a emparejar).
5. El nodo se vuelve a conectar usando el token y ahora está “emparejado”.

Las solicitudes pendientes vencen automáticamente después de **5 minutos**.

## Flujo de trabajo de CLI (apto para modo sin interfaz)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra nodos emparejados/conectados y sus capacidades.

## Superficie de API (protocolo del Gateway)

Eventos:

- `node.pair.requested` — emitido cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` — emitido cuando una solicitud es aprobada/rechazada/vencida.

Métodos:

- `node.pair.request` — crea o reutiliza una solicitud pendiente.
- `node.pair.list` — lista nodos pendientes + emparejados (`operator.pairing`).
- `node.pair.approve` — aprueba una solicitud pendiente (emite token).
- `node.pair.reject` — rechaza una solicitud pendiente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente también actualizan los metadatos almacenados del nodo
  y la instantánea más reciente declarada de comandos permitidos, para visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; nunca se devuelve ningún token desde
  `node.pair.request`.
- Las solicitudes pueden incluir `silent: true` como indicación para flujos de aprobación automática.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para aplicar
  ámbitos de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comando sin ejecución: `operator.pairing` + `operator.write`
  - solicitud `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- El emparejamiento de nodos es un flujo de confianza/identidad más emisión de tokens.
- **No** fija la superficie de comandos del nodo en vivo por nodo.
- Los comandos de nodos en vivo provienen de lo que el nodo declara al conectarse después de aplicar la
  política global de comandos de nodos del Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La política por nodo de permitir/preguntar para `system.run` vive en el nodo en
  `exec.approvals.node.*`, no en el registro de emparejamiento.

## Restricción de comandos de nodos (2026.3.31+)

<Warning>
**Cambio importante:** A partir de `2026.3.31`, los comandos de nodos están deshabilitados hasta que se apruebe el emparejamiento del nodo. El emparejamiento de dispositivos por sí solo ya no basta para exponer comandos declarados del nodo.
</Warning>

Cuando un nodo se conecta por primera vez, el emparejamiento se solicita automáticamente. Hasta que se apruebe la solicitud de emparejamiento, todos los comandos pendientes del nodo procedentes de ese nodo se filtran y no se ejecutan. Una vez que se establece la confianza mediante la aprobación del emparejamiento, los comandos declarados del nodo pasan a estar disponibles sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían únicamente del emparejamiento de dispositivos para exponer comandos ahora deben completar el emparejamiento del nodo.
- Los comandos puestos en cola antes de la aprobación del emparejamiento se descartan, no se difieren.

## Límites de confianza de eventos de nodos (2026.3.31+)

<Warning>
**Cambio importante:** Las ejecuciones originadas por nodos ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por nodos y los eventos de sesión relacionados se restringen a la superficie de confianza prevista. Los flujos activados por notificaciones o por nodos que antes dependían de un acceso más amplio a herramientas del host o de la sesión podrían requerir ajustes. Este refuerzo garantiza que los eventos de nodos no puedan escalar a acceso a herramientas a nivel de host más allá de lo que permite el límite de confianza del nodo.

## Aprobación automática (aplicación de macOS)

La aplicación de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la aplicación puede verificar una conexión SSH al host del Gateway usando el mismo usuario.

Si la aprobación silenciosa falla, vuelve al aviso normal de “Aprobar/Rechazar”.

## Aprobación automática por actualización de metadatos

Cuando un dispositivo ya emparejado se vuelve a conectar con cambios solo de metadatos no sensibles
(por ejemplo, nombre para mostrar o pistas de plataforma del cliente), OpenClaw lo trata
como una `metadata-upgrade`. La aprobación automática silenciosa es limitada: se aplica solo
a reconexiones confiables de CLI/helper locales que ya demostraron posesión del
token o contraseña compartidos sobre loopback. Los clientes de navegador/Control UI y los clientes remotos
siguen usando el flujo explícito de reaprobación. Las ampliaciones de ámbito (de lectura a
escritura/admin) y los cambios de clave pública **no** son aptos para aprobación automática por
actualización de metadatos; siguen siendo solicitudes explícitas de reaprobación.

## Ayudantes de emparejamiento por QR

`/pair qr` representa la carga útil de emparejamiento como medios estructurados para que los clientes móviles y
de navegador puedan escanearla directamente.

Eliminar un dispositivo también elimina cualquier solicitud pendiente de emparejamiento obsoleta para ese
id de dispositivo, de modo que `nodes pending` no muestre filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
lleva encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` que apuntan a un
origen no local, esa evidencia de encabezados reenviados invalida la afirmación de localidad
por loopback. La ruta de emparejamiento entonces requiere aprobación explícita en lugar de tratar
silenciosamente la solicitud como una conexión del mismo host. Consulta
[Autenticación de proxy confiable](/es/gateway/trusted-proxy-auth) para la regla equivalente en
la autenticación del operador.

## Almacenamiento (local, privado)

El estado de emparejamiento se almacena bajo el directorio de estado del Gateway (predeterminado `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si sobrescribes `OPENCLAW_STATE_DIR`, la carpeta `nodes/` se mueve con ella.

Notas de seguridad:

- Los tokens son secretos; trata `paired.json` como información sensible.
- Rotar un token requiere reaprobación (o eliminar la entrada del nodo).

## Comportamiento del transporte

- El transporte es **sin estado**; no almacena membresía.
- Si el Gateway está sin conexión o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- Si el Gateway está en modo remoto, el emparejamiento sigue realizándose contra el almacén del Gateway remoto.
