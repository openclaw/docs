---
read_when:
    - Implementación de aprobaciones de emparejamiento de nodos sin la interfaz de usuario de macOS
    - Adición de flujos de CLI para aprobar nodos remotos
    - Ampliación del protocolo del Gateway con gestión de nodos
summary: 'Aprobaciones de capacidades de Node: cómo los Node obtienen acceso a comandos tras emparejar el dispositivo'
title: Emparejamiento de Node
x-i18n:
    generated_at: "2026-07-22T10:34:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 25e4016657379573ddb7e9027899afd8b97b16709da6e73ed44d4016b99e715a
    source_path: gateway/pairing.md
    workflow: 16
---

El emparejamiento de Node tiene dos capas, ambas almacenadas en el registro del dispositivo emparejado en la
base de datos de estado SQLite del Gateway:

- **Emparejamiento de dispositivos** (rol `node`) controla el protocolo de enlace `connect`. Consulte
  [Aprobación automática de dispositivos mediante CIDR de confianza](#trusted-cidr-device-auto-approval)
  más adelante y [Emparejamiento de canales](/es/channels/pairing).
- **Aprobación de capacidades de Node** (`node.pair.*`) controla qué
  capacidades/comandos declarados puede exponer un Node conectado. El Gateway es la
  fuente de verdad; las interfaces de usuario (aplicación para macOS, interfaz de control) son frontends que aprueban o
  rechazan las solicitudes pendientes.

El anterior almacén independiente de emparejamiento de Node (`nodes/paired.json` con un token por Node,
retirado de la ruta de conexión en enero de 2026) ha desaparecido: los gateways incorporan
las filas restantes a los registros de dispositivos una vez durante el inicio y archivan los
archivos heredados con el sufijo `.migrated`. Se ha eliminado la compatibilidad con el puente TCP
heredado.

## Cómo funciona la aprobación de capacidades

1. Un Node se conecta al WS del Gateway (el emparejamiento de dispositivos controla este paso).
2. El Gateway compara la superficie de capacidades/comandos declarada con la
   aprobada; las superficies nuevas o ampliadas almacenan una **solicitud pendiente** en el
   registro del dispositivo y emiten `node.pair.requested`.
3. Se aprueba o rechaza la solicitud (mediante la CLI o la interfaz de usuario).
4. Hasta su aprobación, los comandos de Node permanecen filtrados; la aprobación expone la superficie
   declarada, sujeta a la política de comandos habitual.

Las solicitudes pendientes caducan automáticamente **5 minutos después del último
reintento del Node**: un Node que se reconecta activamente mantiene activa su única solicitud pendiente
en lugar de generar una nueva solicitud (y una petición de aprobación) por cada intento.

## Flujo de trabajo mediante la CLI (apto para entornos sin interfaz gráfica)

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

- `node.pair.requested` - se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` - se emite cuando una solicitud se aprueba, se rechaza o
  caduca.

Métodos:

- `node.pair.list` - enumera los Nodes pendientes y emparejados (`operator.pairing`).
- `node.pair.approve` - aprueba una solicitud pendiente.
- `node.pair.reject` - rechaza una solicitud pendiente.
- `node.pair.remove` - elimina un Node emparejado. Esto revoca el rol `node`
  del dispositivo en el almacén de dispositivos emparejados, elimina con él la superficie aprobada del Node e
  invalida/desconecta las sesiones con rol de Node de ese dispositivo. Un dispositivo con **varios roles**
  (por ejemplo, uno que también tenga `operator`) conserva su fila y solo
  pierde el rol `node`; se elimina la fila de un dispositivo que solo tenga el rol de Node. Autorización:
  `operator.pairing` puede eliminar filas de Nodes que no sean de operador; un llamador con token de dispositivo
  que revoque su **propio** rol de Node en un dispositivo con varios roles necesita además
  `operator.admin`.
- `node.rename` - cambia el nombre visible para el operador de un Node emparejado.

Eliminados en 2026.7: `node.pair.request` y `node.pair.verify`. Las solicitudes
pendientes las crea el propio Gateway durante las conexiones de los Nodes, y el
token independiente por Node para el que servían ya no existe; la autenticación de Node usa el
token de emparejamiento del dispositivo.

Notas:

- Las reconexiones con una superficie sin cambios reutilizan la solicitud pendiente; las solicitudes
  repetidas actualizan los metadatos almacenados del Node y la instantánea más reciente de
  comandos declarados incluidos en la lista de permitidos para que el operador pueda consultarla.
- Los niveles de ámbito de operador y las comprobaciones realizadas en el momento de la aprobación se resumen en
  [Ámbitos de operador](/es/gateway/operator-scopes).
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para exigir
  ámbitos de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comandos ordinarios: `operator.pairing` + `operator.write`
  - solicitud sensible para la administración que contiene `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` o
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
La aprobación del emparejamiento de Node registra la superficie de capacidades de confianza. **No** fija la superficie activa de comandos de Node para cada Node.

- Los comandos activos de Node proceden de lo que este declara al conectarse, filtrado por
  la política global de comandos de Node del Gateway (`gateway.nodes.commands.allow` y
  `gateway.nodes.commands.deny`).
- La política de permiso y consulta de `system.run` para cada Node reside en el Node dentro de
  `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** a partir de `2026.3.31`, los comandos de Node se deshabilitan hasta que se aprueba el emparejamiento de Node. El emparejamiento de dispositivos por sí solo ya no basta para exponer los comandos de Node declarados.
</Warning>

Cuando un Node se conecta por primera vez, el emparejamiento se solicita automáticamente.
Hasta que se aprueba esa solicitud, todos los comandos pendientes de ese Node se
filtran y no se ejecutan. Una vez aprobado el emparejamiento, los comandos declarados
por el Node quedan disponibles, sujetos a la política de comandos habitual.

Esto significa:

- Los Nodes que anteriormente dependían únicamente del emparejamiento de dispositivos para exponer comandos
  ahora también deben completar el emparejamiento de Node.
- Los comandos puestos en cola antes de la aprobación del emparejamiento se descartan, no se aplazan.

## Límites de confianza de los eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** las ejecuciones originadas por Nodes ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por Nodes y los eventos de sesión relacionados se restringen a la
superficie de confianza prevista. Es posible que deban ajustarse los flujos impulsados por notificaciones o
activados por Nodes que anteriormente dependían de un acceso más amplio a las herramientas del host o de la sesión.
Este refuerzo evita que los eventos de Node escalen hasta obtener acceso a herramientas a nivel de host
más allá de lo permitido por el límite de confianza del Node.

Las actualizaciones duraderas de presencia de Node siguen el mismo límite de identidad: el evento
`node.presence.alive` solo se acepta de sesiones autenticadas de dispositivos Node
y actualiza los metadatos de emparejamiento únicamente cuando la identidad del dispositivo/Node ya está
emparejada. Un valor `client.id` autodeclarado no basta para escribir
el estado de la última actividad.

## Aprobación automática de dispositivos verificada mediante SSH (predeterminada)

El emparejamiento inicial de dispositivos `role: node` desde una dirección privada/CGNAT se
aprueba automáticamente cuando el Gateway puede **demostrar la propiedad de la máquina mediante SSH**: se
conecta de vuelta al host que solicita el emparejamiento (`BatchMode`, `StrictHostKeyChecking=yes`),
ejecuta allí `openclaw node identity --json` y solo aprueba cuando el
id. del dispositivo remoto y la clave pública coinciden exactamente con la solicitud pendiente. La coincidencia de claves es
lo que hace seguro este proceso: la accesibilidad por sí sola nunca da lugar a la aprobación, por lo que otros inquilinos de la NAT,
otros usuarios de un host compartido y la suplantación en la LAN pasan al flujo normal de
solicitud de aprobación.

Está habilitada de forma predeterminada. Requisitos para que se active:

- El usuario del proceso del Gateway (o `sshVerify.user`) puede conectarse por SSH al host del Node
  de forma no interactiva (mediante claves/agente; Tailscale SSH también funciona), y la clave del host
  ya es de confianza.
- `openclaw` se resuelve en el `PATH` remoto para `sh -lc` no interactivo.
- La IP que se conecta es una dirección directa (sin proxy y que no sea de bucle invertido) privada, ULA,
  local de enlace o CGNAT, o coincide con `sshVerify.cidrs` cuando este se establece.
- Se aplica el mismo umbral de admisibilidad que para la aprobación mediante CIDR de confianza: solo un emparejamiento
  nuevo de Node sin ámbitos; las actualizaciones, los navegadores, la interfaz de control y WebChat siempre solicitan aprobación.

Mientras se ejecuta una comprobación, se indica al cliente del Node que siga reintentándolo
(`wait_then_retry`) en lugar de detenerse para esperar una aprobación manual; si la comprobación
falla, el siguiente intento vuelve al flujo normal de solicitud de aprobación. Los destinos con errores
entran en un breve periodo de espera (5 minutos después de que una clave no coincida).

Los dispositivos aprobados registran `approvedVia: "ssh-verified"` y su primera superficie de
capacidades declarada se aprueba en el mismo paso: la coincidencia de claves ya demuestra
que el Node se ejecuta con la cuenta del operador en una máquina de su propiedad, lo cual constituye la
misma afirmación que una aprobación manual de capacidades. Las ampliaciones posteriores de la superficie siguen
solicitando aprobación.

Para reforzarlo o deshabilitarlo:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Deshabilitar por completo:
        sshVerify: false,
        // ...o limitar/ajustar la comprobación:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Aprobación automática (aplicación para macOS)

La aplicación para macOS puede intentar una **aprobación silenciosa** de las solicitudes de capacidades de Node
cuando:

- la solicitud está marcada como `silent` (el Gateway marca la primera superficie de capacidades
  como silenciosa cuando el emparejamiento del dispositivo se aprobó de forma no interactiva), y
- la aplicación puede verificar una conexión SSH con el host del Gateway mediante el mismo
  usuario.

Si la aprobación silenciosa falla, vuelve a la solicitud normal de Approve/Reject.

## Aprobación automática de dispositivos mediante CIDR de confianza

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual de forma predeterminada. En redes privadas de
Nodes donde el Gateway ya confía en la ruta de red, los operadores pueden habilitarlo
con CIDR o direcciones IP exactas explícitas:

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

- Se deshabilita cuando `gateway.nodes.pairing.autoApproveCidrs` no está establecido.
- No existe ningún modo general de aprobación automática para la LAN o las redes privadas; la aprobación automática
  verificada mediante SSH (descrita anteriormente) requiere una coincidencia criptográfica de la clave del dispositivo, nunca
  únicamente la proximidad de red.
- Solo es admisible una solicitud nueva de emparejamiento de dispositivo `role: node` sin ámbitos solicitados.
- Los clientes de operador, navegador, interfaz de control y WebChat siguen siendo manuales.
- Las actualizaciones de rol, ámbito, metadatos y clave pública siguen siendo manuales.
- Las rutas de encabezados de proxy de confianza mediante bucle invertido en el mismo host no son admisibles, porque los
  llamadores locales pueden suplantar esa ruta.

## Limpieza de emparejamientos silenciosos sustituidos

Las aprobaciones no interactivas registran su procedencia en la fila del dispositivo emparejado:
las aprobaciones mediante políticas locales del mismo host como `silent`, las aprobaciones de Nodes mediante CIDR de confianza como
`trusted-cidr` y las aprobaciones de Nodes verificadas mediante SSH como `ssh-verified`. Los clientes cuyo directorio de estado es efímero (directorios personales temporales,
contenedores y entornos aislados por ejecución) generan un nuevo par de claves de dispositivo en cada ejecución, y cada
ejecución vuelve a emparejarse silenciosamente como un dispositivo totalmente nuevo; sin limpieza, la lista de dispositivos emparejados
crece en una fila obsoleta por ejecución.

Cuando el Gateway aprueba silenciosamente el emparejamiento de un dispositivo **local**, retira
los registros anteriores aprobados mediante `silent` que pertenecen al mismo clúster de clientes
(con coincidencia de `clientId`, `clientMode` y el nombre visible) y no están
conectados en ese momento. Los clientes locales se ejecutan en el propio host del Gateway, por lo que la clave del clúster
no puede coincidir con una máquina diferente. Las filas retiradas pierden sus tokens inmediatamente;
se borra cualquier entrada heredada coincidente de emparejamiento de Node y se difunde un evento de
eliminación `node.pair.resolved`.

Límites:

- Solo son aptos, como desencadenante y como objetivo, los registros cuya aprobación más reciente fue local en el mismo host (`silent`).
  Los emparejamientos mediante CIDR de confianza y verificados por SSH
  atraviesan hosts en los que los metadatos de visualización no constituyen una identidad de máquina, por lo que
  nunca se eliminan automáticamente; para ellos, use la limpieza de la interfaz de control o
  `openclaw nodes remove`.
- Los emparejamientos aprobados por el propietario y mediante código QR/de configuración (arranque) nunca se eliminan
  automáticamente. Los registros aprobados antes de que existiera la procedencia permanecen protegidos,
  incluso después de una posterior reaprobación silenciosa del mismo identificador de dispositivo.
- Se omiten los dispositivos conectados actualmente, de modo que las sesiones locales simultáneas con
  directorios de estado separados conservan sus tokens mientras están activas. También se omiten los registros aprobados
  durante el último minuto, de modo que los protocolos de enlace de emparejamiento simultáneos
  no puedan retirarse mutuamente antes de que se registren sus conexiones.
- Los clientes afectados son locales por construcción, por lo que vuelven a emparejarse silenciosamente en
  su siguiente conexión.

## Aprobación automática de actualizaciones de metadatos

Cuando un dispositivo ya emparejado vuelve a conectarse solo con cambios de metadatos
no sensibles (por ejemplo, el nombre para mostrar o indicaciones de la plataforma del cliente), OpenClaw los considera
un `metadata-upgrade`. La aprobación automática silenciosa es limitada: se aplica únicamente
a reconexiones locales de confianza que no sean de navegador y que ya hayan demostrado la posesión de
credenciales locales o compartidas, incluidas las reconexiones de aplicaciones nativas en el mismo host después de
cambios en los metadatos de la versión del sistema operativo. Los clientes de navegador/interfaz de control y los clientes remotos
siguen utilizando el flujo de reaprobación explícita. Las ampliaciones de ámbito (de lectura a
escritura/administración) y los cambios de clave pública **no** son aptos para la
aprobación automática de actualizaciones de metadatos; permanecen como solicitudes explícitas de reaprobación.

## Utilidades de emparejamiento mediante QR

`/pair qr` representa la carga útil de emparejamiento como contenido multimedia estructurado para que los clientes móviles y de
navegador puedan escanearla directamente.

Al eliminar un dispositivo, también se depuran las solicitudes de emparejamiento pendientes obsoletas de ese
identificador de dispositivo, de modo que `nodes pending` no muestre filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway considera que una conexión es de bucle invertido solo cuando tanto el socket sin procesar
como cualquier evidencia del proxy ascendente coinciden. Si una solicitud llega mediante bucle invertido pero
incluye evidencia de los encabezados `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, dicha
evidencia de encabezados reenviados invalida la afirmación de localidad de bucle invertido, y la
ruta de emparejamiento requiere aprobación explícita en lugar de tratar silenciosamente la
solicitud como una conexión en el mismo host. Consulte
[Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth) para conocer la regla equivalente sobre la
autenticación del operador.

## Almacenamiento (local y privado)

El estado de emparejamiento reside en los registros de dispositivos emparejados de la base de datos de estado SQLite
compartida, dentro del directorio de estado del Gateway (valor predeterminado: `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivos emparejados con autenticación de dispositivo,
  superficies de Node aprobadas, solicitudes de superficies pendientes, solicitudes pendientes de emparejamiento de
  dispositivos y tokens de arranque)

Si sustituye `OPENCLAW_STATE_DIR`, la base de datos se mueve con él. Los Gateways
actualizados desde versiones con almacenes JSON los importan al iniciarse y dejan
archivos `devices/*.json.migrated` y `nodes/*.json.migrated`.

Notas de seguridad:

- Los tokens de dispositivo son secretos; trate la base de datos de estado como información confidencial.
- Para rotar un token de dispositivo se usan `openclaw devices rotate` /
  `device.token.rotate`.

## Comportamiento del transporte

- El transporte es **sin estado**; no almacena la pertenencia.
- Si el Gateway está fuera de línea o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- En modo remoto, el emparejamiento se realiza con el almacén del Gateway remoto.

## Contenido relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [CLI de nodos](/es/cli/nodes)
- [CLI de dispositivos](/es/cli/devices)
