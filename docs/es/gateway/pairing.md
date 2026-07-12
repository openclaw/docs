---
read_when:
    - Implementación de aprobaciones de emparejamiento de Node sin la interfaz de usuario de macOS
    - Adición de flujos de la CLI para aprobar Nodes remotos
    - Ampliación del protocolo del Gateway con gestión de nodos
summary: 'Aprobaciones de capacidades de Node: cómo los nodos obtienen acceso a comandos tras el emparejamiento de dispositivos'
title: Emparejamiento de Node
x-i18n:
    generated_at: "2026-07-12T14:35:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

El emparejamiento de Node tiene dos capas, ambas almacenadas en el registro del dispositivo emparejado en la base de datos de estado SQLite del Gateway:

- El **emparejamiento de dispositivos** (rol `node`) controla el protocolo de enlace `connect`. Consulte
  [Aprobación automática de dispositivos mediante CIDR de confianza](#trusted-cidr-device-auto-approval)
  a continuación y [Emparejamiento de canales](/es/channels/pairing).
- La **aprobación de capacidades de Node** (`node.pair.*`) controla qué
  capacidades/comandos declarados puede exponer un Node conectado. El Gateway es la
  fuente de verdad; las interfaces de usuario (aplicación para macOS, interfaz de control) son interfaces que aprueban o
  rechazan las solicitudes pendientes.

El anterior almacén independiente de emparejamiento de Node (`nodes/paired.json` con un token por Node,
retirado de la ruta de conexión en enero de 2026) ya no existe: los gateways incorporan
una sola vez durante el inicio las filas restantes en los registros de dispositivos y archivan los
archivos heredados con el sufijo `.migrated`. Se ha eliminado la compatibilidad con el puente TCP
heredado.

## Cómo funciona la aprobación de capacidades

1. Un Node se conecta al WS del Gateway (el emparejamiento de dispositivos controla este paso).
2. El Gateway compara la superficie de capacidades/comandos declarada con la
   aprobada; las superficies nuevas o ampliadas almacenan una **solicitud pendiente** en el
   registro del dispositivo y emiten `node.pair.requested`.
3. Se aprueba o rechaza la solicitud (CLI o interfaz de usuario).
4. Hasta que se apruebe, los comandos de Node permanecen filtrados; la aprobación expone la superficie
   declarada, sujeta a la política de comandos habitual.

Las solicitudes pendientes caducan automáticamente **5 minutos después del último
reintento del Node**: un Node que se reconecta activamente mantiene activa su única solicitud pendiente
en lugar de generar una solicitud nueva (y una petición de aprobación) en cada intento.

## Flujo de trabajo mediante CLI (apto para entornos sin interfaz gráfica)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra los Nodes emparejados/conectados y sus capacidades.

## Superficie de API (protocolo del Gateway)

Eventos:

- `node.pair.requested`: se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved`: se emite cuando una solicitud se aprueba, rechaza o
  caduca.

Métodos:

- `node.pair.list`: enumera los Nodes pendientes y emparejados (`operator.pairing`).
- `node.pair.approve`: aprueba una solicitud pendiente.
- `node.pair.reject`: rechaza una solicitud pendiente.
- `node.pair.remove`: elimina un Node emparejado. Esto revoca el rol `node` del dispositivo
  en el almacén de dispositivos emparejados, elimina junto con él la superficie de Node aprobada e
  invalida/desconecta las sesiones de ese dispositivo con rol de Node. Un dispositivo con **varios roles**
  (por ejemplo, uno que también tenga `operator`) conserva su fila y solo
  pierde el rol `node`; se elimina la fila de un dispositivo que solo tenga el rol de Node. Autorización:
  `operator.pairing` puede eliminar filas de Nodes que no sean operadores; un llamador con token de dispositivo
  que revoque su **propio** rol de Node en un dispositivo con varios roles necesita además
  `operator.admin`.
- `node.rename`: cambia el nombre para mostrar de cara al operador de un Node emparejado.

Eliminados en 2026.7: `node.pair.request` y `node.pair.verify`. Las solicitudes
pendientes las crea el propio Gateway durante las conexiones de los Nodes, y el
token independiente por Node al que daban servicio ya no existe; la autenticación del Node utiliza el
token de emparejamiento del dispositivo.

Notas:

- Las reconexiones con una superficie sin cambios reutilizan la solicitud pendiente; las solicitudes
  repetidas actualizan los metadatos de Node almacenados y la instantánea más reciente de
  comandos declarados incluidos en la lista de permitidos para que el operador pueda consultarla.
- Los niveles de ámbito del operador y las comprobaciones realizadas durante la aprobación se resumen en
  [Ámbitos del operador](/es/gateway/operator-scopes).
- `node.pair.approve` utiliza los comandos declarados de la solicitud pendiente para exigir
  ámbitos de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comandos que no sean de ejecución: `operator.pairing` + `operator.write`
  - solicitud de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
La aprobación del emparejamiento de Node registra la superficie de capacidades de confianza. **No** fija la superficie activa de comandos de Node por cada Node.

- Los comandos activos de Node proceden de lo que el Node declara al conectarse, filtrado por
  la política global de comandos de Node del Gateway (`gateway.nodes.allowCommands` y
  `denyCommands`).
- La política por Node de permisos y confirmaciones para `system.run` reside en el Node, en
  `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** a partir de `2026.3.31`, los comandos de Node permanecen deshabilitados hasta que se apruebe el emparejamiento de Node. El emparejamiento de dispositivos por sí solo ya no basta para exponer los comandos declarados del Node.
</Warning>

Cuando un Node se conecta por primera vez, el emparejamiento se solicita automáticamente.
Hasta que se apruebe esa solicitud, todos los comandos pendientes de ese Node se
filtran y no se ejecutan. Una vez aprobado el emparejamiento, los comandos declarados
del Node pasan a estar disponibles, sujetos a la política de comandos habitual.

Esto significa lo siguiente:

- Los Nodes que antes dependían únicamente del emparejamiento de dispositivos para exponer comandos ahora
  también deben completar el emparejamiento de Node.
- Los comandos puestos en cola antes de aprobar el emparejamiento se descartan, no se aplazan.

## Límites de confianza de los eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** las ejecuciones iniciadas por Nodes ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes iniciados por Nodes y los eventos de sesión relacionados se restringen a la
superficie de confianza prevista. Es posible que deban ajustarse los flujos activados por notificaciones o
por Nodes que antes dependían de un acceso más amplio a las herramientas del host o de la sesión.
Este refuerzo impide que los eventos de Node escalen hasta obtener acceso a herramientas a nivel del host
más allá de lo permitido por el límite de confianza del Node.

Las actualizaciones persistentes de presencia de Node siguen el mismo límite de identidad: el
evento `node.presence.alive` solo se acepta desde sesiones autenticadas de dispositivos
Node, y actualiza los metadatos de emparejamiento únicamente cuando la identidad del dispositivo/Node ya
está emparejada. Un valor de `client.id` autodeclarado no basta para escribir
el estado de última actividad.

## Aprobación automática de dispositivos verificada mediante SSH (predeterminada)

El primer emparejamiento de un dispositivo con `role: node` desde una dirección privada/CGNAT se
aprueba automáticamente cuando el Gateway puede **demostrar la propiedad de la máquina mediante SSH**: se
conecta de vuelta al host que solicita el emparejamiento (`BatchMode`, `StrictHostKeyChecking=yes`),
ejecuta allí `openclaw node identity --json` y solo aprueba cuando el identificador del dispositivo
remoto y la clave pública coinciden exactamente con la solicitud pendiente. La coincidencia de claves
es lo que hace seguro este proceso: la accesibilidad por sí sola nunca da lugar a la aprobación, por lo que otros usuarios
que compartan la NAT, otros usuarios de un host compartido y la suplantación en la LAN pasan al flujo de
solicitud normal.

Está habilitada de forma predeterminada. Requisitos para que se active:

- El usuario del proceso del Gateway (o `sshVerify.user`) puede conectarse mediante SSH al host del Node
  sin interacción (claves/agente; Tailscale SSH también funciona) y la clave del host
  ya es de confianza.
- `openclaw` se resuelve en el `PATH` remoto para una ejecución no interactiva de `sh -lc`.
- La IP que se conecta es una dirección privada, ULA, de vínculo local o CGNAT directa
  (sin proxy y sin bucle invertido), o coincide con `sshVerify.cidrs` cuando está configurado.
- Se aplica el mismo umbral de admisibilidad que para la aprobación mediante CIDR de confianza: solo emparejamientos
  nuevos de Nodes sin ámbitos; las actualizaciones, los navegadores, la interfaz de control y WebChat siempre solicitan confirmación.

Mientras se ejecuta una comprobación, se indica al cliente Node que siga reintentando
(`wait_then_retry`) en lugar de pausar para esperar una aprobación manual; si la comprobación
falla, el siguiente intento vuelve al flujo de solicitud normal. Los destinos con errores
reciben un breve período de espera (5 minutos después de una discrepancia de claves).

Los dispositivos aprobados registran `approvedVia: "ssh-verified"` y su primera superficie de
capacidades declaradas se aprueba en el mismo paso: la coincidencia de claves ya demuestra
que el Node se ejecuta con la cuenta del operador en una máquina de su propiedad, lo que constituye la
misma afirmación que una aprobación manual de capacidades. Las ampliaciones posteriores de la superficie siguen
requiriendo confirmación.

Refuerzo o desactivación:

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

- la solicitud está marcada como `silent` (el Gateway marca como silenciosa la primera superficie de
  capacidades cuando el emparejamiento del dispositivo se aprobó sin interacción), y
- la aplicación puede verificar una conexión SSH con el host del Gateway utilizando el mismo
  usuario.

Si la aprobación silenciosa falla, se recurre al mensaje normal de Approve/Reject.

## Aprobación automática de dispositivos mediante CIDR de confianza

El emparejamiento de dispositivos mediante WS para `role: node` sigue siendo manual de forma predeterminada. En redes privadas de
Nodes donde el Gateway ya confía en la ruta de red, los operadores pueden habilitarlo
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
- No existe un modo de aprobación automática general para redes LAN o privadas; la aprobación automática
  verificada mediante SSH (descrita anteriormente) requiere una coincidencia criptográfica de la clave del dispositivo, nunca
  solo la proximidad de red.
- Solo es admisible una solicitud nueva de emparejamiento de dispositivo con `role: node` y sin ámbitos solicitados.
- Los clientes de operador, navegador, interfaz de control y WebChat siguen requiriendo aprobación manual.
- Las ampliaciones de roles, ámbitos, metadatos y claves públicas siguen requiriendo aprobación manual.
- Las rutas de cabeceras de proxy de confianza mediante bucle invertido en el mismo host no son admisibles, porque esa
  ruta puede ser suplantada por llamadores locales.

## Limpieza de emparejamientos silenciosos reemplazados

Las aprobaciones no interactivas registran su procedencia en la fila del dispositivo emparejado:
las aprobaciones por políticas locales en el mismo host como `silent`, las aprobaciones de Nodes mediante CIDR de confianza como
`trusted-cidr` y las aprobaciones de Nodes verificadas mediante SSH como `ssh-verified`. Los clientes cuyo directorio de estado es efímero (directorios personales temporales,
contenedores y entornos aislados por ejecución) generan un nuevo par de claves de dispositivo en cada ejecución, y cada
ejecución vuelve a emparejarse silenciosamente como un dispositivo completamente nuevo; sin limpieza, la lista de dispositivos emparejados
acumula una fila obsoleta por ejecución.

Cuando el Gateway aprueba silenciosamente un emparejamiento de dispositivo **local**, retira
los registros antiguos aprobados como `silent` que pertenezcan al mismo clúster de clientes
(con coincidencia de `clientId`, `clientMode` y nombre para mostrar) y que no estén
conectados en ese momento. Los clientes locales se ejecutan en el propio host del Gateway, por lo que la clave del clúster
no puede coincidir con otra máquina. Las filas retiradas pierden sus tokens de inmediato;
se elimina cualquier entrada coincidente de emparejamiento de Node heredada y se difunde un evento de
eliminación `node.pair.resolved`.

Límites:

- Solo son admisibles, tanto como desencadenantes como destinos, los registros cuya aprobación más reciente se realizó
  localmente en el mismo host (`silent`). Los emparejamientos mediante CIDR de confianza y verificados mediante SSH
  abarcan distintos hosts, donde los metadatos de visualización no constituyen una identidad de máquina, por lo que
  nunca se eliminan automáticamente; para ellos, se debe utilizar la limpieza de la interfaz de control o
  `openclaw nodes remove`.
- Los emparejamientos aprobados por el propietario y mediante código QR/de configuración (inicio) nunca se eliminan
  automáticamente. Los registros aprobados antes de que existiera la procedencia siguen protegidos,
  incluso después de una aprobación silenciosa posterior del mismo identificador de dispositivo.
- Se omiten los dispositivos conectados actualmente, de modo que las sesiones locales simultáneas con
  directorios de estado separados conservan sus tokens mientras están activas. También se omiten los registros aprobados
  durante el último minuto, para que los protocolos de enlace de emparejamiento simultáneos
  no puedan retirarse entre sí antes de que se registren sus conexiones.
- Los clientes afectados son locales por definición, por lo que vuelven a emparejarse silenciosamente en
  su próxima conexión.

## Aprobación automática de actualizaciones de metadatos

Cuando un dispositivo ya emparejado se vuelve a conectar con únicamente cambios de metadatos no
confidenciales (por ejemplo, el nombre para mostrar o indicaciones sobre la plataforma del cliente), OpenClaw trata
esto como una `metadata-upgrade`. La aprobación automática silenciosa tiene un alcance limitado: solo se aplica
a reconexiones locales de confianza que no procedan de navegadores y que ya hayan demostrado la posesión de
credenciales locales o compartidas, incluidas las reconexiones de aplicaciones nativas en el mismo host tras
cambios en los metadatos de la versión del sistema operativo. Los clientes de navegador/interfaz de control y los clientes remotos
siguen utilizando el flujo explícito de nueva aprobación. Las ampliaciones de ámbito (de lectura a
escritura/administración) y los cambios de claves públicas **no** son admisibles para la
aprobación automática de actualizaciones de metadatos; siguen siendo solicitudes explícitas de nueva aprobación.

## Herramientas auxiliares para el emparejamiento mediante QR

`/pair qr` representa la carga útil de emparejamiento como contenido multimedia estructurado para que los clientes móviles y de
navegador puedan escanearla directamente.

Al eliminar un dispositivo, también se borran las solicitudes de emparejamiento pendientes obsoletas de ese
id de dispositivo, por lo que `nodes pending` no muestra filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia del proxy ascendente coinciden. Si una solicitud llega por loopback, pero
incluye evidencia de los encabezados `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, esa
evidencia de encabezados reenviados invalida la afirmación de localidad de loopback, y la
ruta de emparejamiento requiere aprobación explícita en lugar de tratar silenciosamente la
solicitud como una conexión desde el mismo host. Consulte
[Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth) para conocer la regla equivalente de
autenticación del operador.

## Almacenamiento (local y privado)

El estado de emparejamiento reside en los registros de los dispositivos emparejados de la base de datos
de estado SQLite compartida, dentro del directorio de estado del Gateway (valor predeterminado: `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivos emparejados con autenticación de dispositivo,
  superficies de Node aprobadas, solicitudes de superficies pendientes, solicitudes de emparejamiento
  de dispositivos pendientes y tokens de arranque)

Si se sobrescribe `OPENCLAW_STATE_DIR`, la base de datos se mueve con este. Los Gateways
actualizados desde versiones con almacenes JSON los importan al iniciarse y conservan
los archivos `devices/*.json.migrated` y `nodes/*.json.migrated`.

Notas de seguridad:

- Los tokens de dispositivo son secretos; la base de datos de estado debe tratarse como información confidencial.
- Para rotar el token de un dispositivo, se usa `openclaw devices rotate` /
  `device.token.rotate`.

## Comportamiento del transporte

- El transporte **no tiene estado**; no almacena la pertenencia.
- Si el Gateway está desconectado o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- En modo remoto, el emparejamiento se realiza con el almacén del Gateway remoto.

## Contenido relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [CLI de nodos](/es/cli/nodes)
- [CLI de dispositivos](/es/cli/devices)
