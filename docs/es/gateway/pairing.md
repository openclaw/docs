---
read_when:
    - Implementación de aprobaciones de emparejamiento de Node sin la interfaz de usuario de macOS
    - Adición de flujos de la CLI para aprobar nodos remotos
    - Ampliación del protocolo del Gateway con gestión de nodos
summary: 'Aprobaciones de capacidades de Node: cómo los nodos obtienen acceso a comandos después de vincular el dispositivo'
title: Emparejamiento de Node
x-i18n:
    generated_at: "2026-07-11T23:08:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

El emparejamiento de Node tiene dos capas, ambas almacenadas en el registro del dispositivo emparejado en la base de datos de estado SQLite del Gateway:

- El **emparejamiento de dispositivos** (rol `node`) controla el protocolo de enlace `connect`. Consulta
  [Aprobación automática de dispositivos mediante CIDR de confianza](#trusted-cidr-device-auto-approval)
  más abajo y [Emparejamiento de canales](/es/channels/pairing).
- La **aprobación de capacidades de Node** (`node.pair.*`) controla qué
  capacidades/comandos declarados puede exponer un Node conectado. El Gateway es la
  fuente de verdad; las interfaces de usuario (aplicación para macOS, interfaz de control) son frontends que aprueban o
  rechazan las solicitudes pendientes.

El anterior almacén independiente de emparejamiento de Node (`nodes/paired.json` con un
token por Node, retirado de la ruta de conexión en enero de 2026) ha desaparecido: los gateways incorporan
una vez durante el inicio cualquier fila restante a los registros de dispositivos y archivan los
archivos heredados con el sufijo `.migrated`. Se ha eliminado la compatibilidad con el
puente TCP heredado.

## Cómo funciona la aprobación de capacidades

1. Un Node se conecta al WS del Gateway (el emparejamiento de dispositivos controla este paso).
2. El Gateway compara la superficie de capacidades/comandos declarada con la
   aprobada; las superficies nuevas o ampliadas almacenan una **solicitud pendiente** en el
   registro del dispositivo y emiten `node.pair.requested`.
3. Apruebas o rechazas la solicitud (mediante la CLI o la interfaz de usuario).
4. Hasta que se apruebe, los comandos de Node permanecen filtrados; la aprobación expone la superficie
   declarada, sujeta a la política de comandos habitual.

Las solicitudes pendientes caducan automáticamente **5 minutos después del último
reintento del Node**: un Node que se reconecta activamente mantiene activa su única solicitud pendiente
en lugar de generar una solicitud nueva (y un aviso de aprobación) por cada intento.

## Flujo de trabajo de la CLI (apto para entornos sin interfaz gráfica)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra los Nodes emparejados/conectados y sus capacidades.

## Superficie de la API (protocolo del Gateway)

Eventos:

- `node.pair.requested`: se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved`: se emite cuando una solicitud se aprueba, se rechaza o
  caduca.

Métodos:

- `node.pair.list`: enumera los Nodes pendientes y emparejados (`operator.pairing`).
- `node.pair.approve`: aprueba una solicitud pendiente.
- `node.pair.reject`: rechaza una solicitud pendiente.
- `node.pair.remove`: elimina un Node emparejado. Esto revoca el rol `node` del dispositivo
  en el almacén de dispositivos emparejados, elimina con él la superficie de Node aprobada e
  invalida/desconecta las sesiones con rol de Node de ese dispositivo. Un dispositivo con
  **varios roles** (por ejemplo, uno que también tenga `operator`) conserva su fila y solo
  pierde el rol `node`; la fila de un dispositivo que solo tenga el rol de Node se elimina. Autorización:
  `operator.pairing` puede eliminar filas de Nodes que no sean operadores; un llamador con token
  de dispositivo que revoque su **propio** rol de Node en un dispositivo con varios roles necesita además
  `operator.admin`.
- `node.rename`: cambia el nombre para mostrar de un Node emparejado que ve el operador.

Eliminados en 2026.7: `node.pair.request` y `node.pair.verify`. Ahora, el propio Gateway
crea las solicitudes pendientes durante las conexiones de Nodes, y el
token independiente por Node que usaban ya no existe; la autenticación del Node utiliza el
token de emparejamiento del dispositivo.

Notas:

- Las reconexiones con una superficie sin cambios reutilizan la solicitud pendiente; las solicitudes
  repetidas actualizan los metadatos almacenados del Node y la instantánea más reciente
  de los comandos declarados incluidos en la lista de permitidos para que el operador pueda verlos.
- Los niveles de ámbito del operador y las comprobaciones realizadas durante la aprobación se resumen en
  [Ámbitos del operador](/es/gateway/operator-scopes).
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para exigir
  ámbitos de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comandos que no sean de ejecución: `operator.pairing` + `operator.write`
  - solicitud de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
La aprobación del emparejamiento de Node registra la superficie de capacidades de confianza. **No** fija la superficie activa de comandos de Node para cada Node.

- Los comandos activos de Node proceden de lo que el Node declara al conectarse, filtrado por
  la política global de comandos de Node del Gateway (`gateway.nodes.allowCommands` y
  `denyCommands`).
- La política de permiso y consulta de `system.run` para cada Node reside en el Node, en
  `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** a partir de `2026.3.31`, los comandos de Node están deshabilitados hasta que se apruebe el emparejamiento de Node. El emparejamiento de dispositivos por sí solo ya no basta para exponer los comandos declarados del Node.
</Warning>

Cuando un Node se conecta por primera vez, el emparejamiento se solicita automáticamente.
Hasta que se apruebe esa solicitud, todos los comandos pendientes de ese Node se
filtran y no se ejecutan. Una vez aprobado el emparejamiento, los comandos declarados
del Node quedan disponibles, sujetos a la política de comandos habitual.

Esto significa lo siguiente:

- Los Nodes que antes dependían únicamente del emparejamiento de dispositivos para exponer comandos ahora también deben
  completar el emparejamiento de Node.
- Los comandos puestos en cola antes de la aprobación del emparejamiento se descartan, no se posponen.

## Límites de confianza de los eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** las ejecuciones originadas por Nodes ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por Nodes y los eventos de sesión relacionados se restringen a la
superficie de confianza prevista. Es posible que deban ajustarse los flujos activados por notificaciones o por Nodes
que antes dependían de un acceso más amplio a las herramientas del host o de la sesión.
Este refuerzo evita que los eventos de Node escalen a un acceso a herramientas en el ámbito del host
más allá de lo permitido por el límite de confianza del Node.

Las actualizaciones persistentes de presencia de Nodes siguen el mismo límite de identidad: el
evento `node.presence.alive` solo se acepta desde sesiones autenticadas de dispositivos
Node, y solo actualiza los metadatos de emparejamiento cuando la identidad del dispositivo/Node
ya está emparejada. Un valor `client.id` autodeclarado no basta para escribir
el estado de última actividad.

## Aprobación automática de dispositivos verificada mediante SSH (predeterminada)

El emparejamiento inicial de dispositivos con `role: node` desde una dirección privada/CGNAT se
aprueba automáticamente cuando el Gateway puede **demostrar mediante SSH la propiedad de la máquina**:
se conecta de vuelta al host que solicita el emparejamiento (`BatchMode`, `StrictHostKeyChecking=yes`),
ejecuta allí `openclaw node identity --json` y solo aprueba cuando el identificador del
dispositivo remoto y la clave pública coinciden exactamente con la solicitud pendiente. La coincidencia de la clave es
lo que hace que esto sea seguro: la mera conectividad nunca da lugar a una aprobación, por lo que otros usuarios
que compartan la NAT, otros usuarios del mismo host y la suplantación en la LAN recurren al aviso
normal.

Está habilitada de forma predeterminada. Requisitos para que se active:

- El usuario del proceso del Gateway (o `sshVerify.user`) puede conectarse mediante SSH al host del Node
  de forma no interactiva (claves/agente; Tailscale SSH también funciona), y la clave del host
  ya es de confianza.
- `openclaw` se resuelve en el `PATH` remoto para `sh -lc` no interactivo.
- La IP de conexión es una dirección directa (sin proxy y no local loopback) privada, ULA,
  de vínculo local o CGNAT, o coincide con `sshVerify.cidrs` cuando está configurado.
- El mismo requisito mínimo que para la aprobación mediante CIDR de confianza: solo
  emparejamientos nuevos de Nodes sin ámbitos; las actualizaciones, los navegadores, la interfaz de control y WebChat siempre solicitan aprobación.

Mientras se ejecuta una comprobación, se indica al cliente Node que siga reintentando
(`wait_then_retry`) en lugar de ponerse en pausa para una aprobación manual; si la comprobación
falla, el siguiente intento recurre al flujo normal de solicitud de aprobación. Los destinos fallidos
entran en un breve período de espera (5 minutos después de una discrepancia de claves).

Los dispositivos aprobados registran `approvedVia: "ssh-verified"` y su primera superficie de
capacidades declarada se aprueba en el mismo paso: la coincidencia de claves ya demuestra
que el Node se ejecuta con la cuenta del operador en una máquina de su propiedad, lo cual constituye la
misma afirmación que una aprobación manual de capacidades. Las ampliaciones posteriores de la superficie
siguen solicitando aprobación.

Para reforzarlo o deshabilitarlo:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Aprobación automática (aplicación para macOS)

La aplicación para macOS puede intentar una **aprobación silenciosa** de las solicitudes de capacidades
de Node cuando:

- la solicitud está marcada como `silent` (el Gateway marca como silenciosa la primera superficie de
  capacidades cuando el emparejamiento del dispositivo se aprobó de forma no interactiva), y
- la aplicación puede verificar una conexión SSH con el host del Gateway mediante el mismo
  usuario.

Si la aprobación silenciosa falla, recurre al aviso normal Approve/Reject.

## Aprobación automática de dispositivos mediante CIDR de confianza

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. En las redes privadas
de Nodes donde el Gateway ya confía en la ruta de red, los operadores pueden habilitarlo
mediante CIDR explícitos o direcciones IP exactas:

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

- Se deshabilita cuando `gateway.nodes.pairing.autoApproveCidrs` no está configurado.
- No existe ningún modo general de aprobación automática para la LAN o las redes privadas; la aprobación automática
  verificada mediante SSH (descrita anteriormente) requiere una coincidencia criptográfica de la clave del dispositivo, nunca
  únicamente la localidad de la red.
- Solo son válidas las solicitudes nuevas de emparejamiento de dispositivos con `role: node` y sin ámbitos
  solicitados.
- Los clientes de operador, navegador, interfaz de control y WebChat siguen requiriendo aprobación manual.
- Las actualizaciones de rol, ámbito, metadatos y clave pública siguen requiriendo aprobación manual.
- Las rutas de encabezados de proxy de confianza mediante local loopback en el mismo host no son válidas, porque
  los llamadores locales pueden suplantarlas.

## Limpieza de emparejamientos silenciosos reemplazados

Las aprobaciones no interactivas registran su procedencia en la fila del dispositivo emparejado:
las aprobaciones mediante políticas locales del mismo host como `silent`, las aprobaciones de Nodes mediante CIDR de confianza como
`trusted-cidr` y las aprobaciones de Nodes verificadas mediante SSH como `ssh-verified`. Los clientes cuyo directorio de estado es efímero (directorios personales temporales,
contenedores y entornos aislados por ejecución) generan un nuevo par de claves del dispositivo en cada ejecución, y cada
ejecución vuelve a emparejarse silenciosamente como un dispositivo completamente nuevo; sin limpieza, la lista de dispositivos emparejados
crece en una fila obsoleta por ejecución.

Cuando el Gateway aprueba silenciosamente un emparejamiento de dispositivo **local**, retira
los registros antiguos aprobados mediante `silent` que pertenecen al mismo clúster de clientes
(con coincidencia de `clientId`, `clientMode` y nombre para mostrar) y que no están
conectados en ese momento. Los clientes locales se ejecutan en el propio host del Gateway, por lo que la clave del clúster
no puede coincidir con una máquina diferente. Las filas retiradas pierden sus tokens inmediatamente;
se elimina cualquier entrada heredada coincidente de emparejamiento de Node y se difunde un evento de
eliminación `node.pair.resolved`.

Límites:

- Solo son válidos, tanto como desencadenantes como objetivos, los registros cuya aprobación más reciente proceda
  del mismo host local (`silent`). Los emparejamientos mediante CIDR de confianza y los verificados mediante SSH
  abarcan varios hosts, donde los metadatos de visualización no identifican a una máquina, por lo que
  nunca se eliminan automáticamente; utiliza la limpieza de la interfaz de control o
  `openclaw nodes remove` para ellos.
- Los emparejamientos aprobados por el propietario y mediante QR/código de configuración (`bootstrap`) nunca se eliminan
  automáticamente. Los registros aprobados antes de que existiera la información de procedencia permanecen protegidos,
  incluso tras una aprobación silenciosa posterior del mismo identificador de dispositivo.
- Los dispositivos conectados actualmente se omiten, por lo que las sesiones locales simultáneas con
  directorios de estado independientes conservan sus tokens mientras están activas. También se omiten los registros
  aprobados durante el último minuto, de modo que los protocolos de enlace de emparejamiento simultáneos
  no puedan retirarse mutuamente antes de que se registren sus conexiones.
- Los clientes afectados son locales por definición, por lo que vuelven a emparejarse silenciosamente en
  su siguiente conexión.

## Aprobación automática de actualizaciones de metadatos

Cuando un dispositivo ya emparejado se vuelve a conectar únicamente con cambios de metadatos
no confidenciales (por ejemplo, el nombre para mostrar o indicaciones sobre la plataforma del cliente), OpenClaw lo trata
como una `metadata-upgrade`. La aprobación automática silenciosa es limitada: se aplica únicamente
a reconexiones locales de confianza que no provengan de navegadores y que ya hayan demostrado la posesión de
credenciales locales o compartidas, incluidas las reconexiones de aplicaciones nativas en el mismo host después
de cambios en los metadatos de la versión del sistema operativo. Los clientes de navegador/interfaz de control y los clientes remotos
siguen utilizando el flujo explícito de nueva aprobación. Las ampliaciones de ámbito (de lectura a
escritura/administración) y los cambios de clave pública **no** son válidos para la
aprobación automática de `metadata-upgrade`; siguen siendo solicitudes explícitas de nueva aprobación.

## Utilidades de emparejamiento mediante QR

`/pair qr` representa la carga útil de emparejamiento como contenido multimedia estructurado para que los clientes móviles y de navegador puedan escanearla directamente.

Al eliminar un dispositivo, también se borran las solicitudes de emparejamiento pendientes obsoletas correspondientes a ese identificador de dispositivo, por lo que `nodes pending` no muestra filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway considera que una conexión es local loopback solo cuando tanto el socket sin procesar como cualquier indicio del proxy ascendente coinciden. Si una solicitud llega mediante local loopback, pero contiene indicios en los encabezados `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, dichos indicios de encabezados reenviados invalidan la afirmación de localidad local loopback, y la ruta de emparejamiento requiere aprobación explícita en lugar de tratar silenciosamente la solicitud como una conexión desde el mismo host. Consulta [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth) para conocer la regla equivalente aplicable a la autenticación del operador.

## Almacenamiento (local y privado)

El estado de emparejamiento se guarda en los registros de dispositivos emparejados de la base de datos de estado SQLite compartida, dentro del directorio de estado del Gateway (de forma predeterminada, `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivos emparejados con autenticación de dispositivo, superficies de Node aprobadas, solicitudes de superficies pendientes, solicitudes de emparejamiento de dispositivos pendientes y tokens de arranque)

Si sobrescribes `OPENCLAW_STATE_DIR`, la base de datos se traslada con él. Los Gateways actualizados desde versiones que usaban almacenes JSON los importan al iniciarse y conservan los archivos `devices/*.json.migrated` y `nodes/*.json.migrated`.

Notas de seguridad:

- Los tokens de dispositivo son secretos; trata la base de datos de estado como información confidencial.
- Para rotar un token de dispositivo, se utiliza `openclaw devices rotate` / `device.token.rotate`.

## Comportamiento del transporte

- El transporte **no mantiene estado**; no almacena la pertenencia.
- Si el Gateway está desconectado o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- En modo remoto, el emparejamiento se realiza con el almacén del Gateway remoto.

## Contenido relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [CLI de nodos](/es/cli/nodes)
- [CLI de dispositivos](/es/cli/devices)
