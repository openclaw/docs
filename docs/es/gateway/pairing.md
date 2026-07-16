---
read_when:
    - Implementación de aprobaciones de emparejamiento de nodos sin la interfaz de usuario de macOS
    - Adición de flujos de la CLI para aprobar Nodes remotos
    - Ampliación del protocolo del Gateway con gestión de nodos
summary: 'Aprobaciones de capacidades de Node: cómo los Node obtienen acceso a comandos tras emparejar el dispositivo'
title: Emparejamiento de Node
x-i18n:
    generated_at: "2026-07-16T11:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

El emparejamiento de Node tiene dos capas, ambas almacenadas en el registro del dispositivo emparejado en la
base de datos de estado SQLite del Gateway:

- El **emparejamiento de dispositivos** (rol `node`) controla el protocolo de enlace `connect`. Consulte
  [Aprobación automática de dispositivos mediante CIDR de confianza](#trusted-cidr-device-auto-approval)
  más adelante y [Emparejamiento de canales](/es/channels/pairing).
- La **aprobación de capacidades de Node** (`node.pair.*`) controla qué
  capacidades/comandos declarados puede exponer un Node conectado. El Gateway es la
  fuente de verdad; las interfaces de usuario (aplicación para macOS, interfaz de control) son frontends que aprueban o
  rechazan las solicitudes pendientes.

El antiguo almacén independiente de emparejamiento de Node (`nodes/paired.json` con un token
por Node, retirado de la ruta de conexión en enero de 2026) ya no existe: los gateways incorporan
las filas restantes en los registros de dispositivos una vez durante el inicio y archivan los
archivos heredados con un sufijo `.migrated`. Se ha eliminado la compatibilidad con el
puente TCP heredado.

## Cómo funciona la aprobación de capacidades

1. Un Node se conecta al WS del Gateway (el emparejamiento de dispositivos controla este paso).
2. El Gateway compara la superficie de capacidades/comandos declarada con la
   aprobada; las superficies nuevas o ampliadas almacenan una **solicitud pendiente** en el
   registro del dispositivo y emiten `node.pair.requested`.
3. Se aprueba o rechaza la solicitud (mediante la CLI o la interfaz de usuario).
4. Hasta que se apruebe, los comandos de Node permanecen filtrados; la aprobación expone la superficie
   declarada, sujeta a la política de comandos habitual.

Las solicitudes pendientes caducan automáticamente **5 minutos después del último
reintento del Node**: un Node que se reconecta activamente mantiene vigente su única solicitud pendiente
en lugar de generar una solicitud nueva (y una petición de aprobación) en cada intento.

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

- `node.pair.requested` - se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` - se emite cuando una solicitud se aprueba, se rechaza o
  caduca.

Métodos:

- `node.pair.list` - enumera los Nodes pendientes y emparejados (`operator.pairing`).
- `node.pair.approve` - aprueba una solicitud pendiente.
- `node.pair.reject` - rechaza una solicitud pendiente.
- `node.pair.remove` - elimina un Node emparejado. Esto revoca el rol `node`
  del dispositivo en el almacén de dispositivos emparejados, elimina con él la superficie de Node aprobada e
  invalida/desconecta las sesiones con rol de Node de ese dispositivo. Un dispositivo con **varios roles**
  (por ejemplo, uno que también tenga `operator`) conserva su fila y solo
  pierde el rol `node`; se elimina la fila de un dispositivo que solo tenga el rol de Node. Autorización:
  `operator.pairing` puede eliminar filas de Node que no sean de operador; un llamador con token de dispositivo
  que revoque su **propio** rol de Node en un dispositivo con varios roles también necesita
  `operator.admin`.
- `node.rename` - cambia el nombre para mostrar orientado al operador de un Node emparejado.

Eliminados en 2026.7: `node.pair.request` y `node.pair.verify`. Las solicitudes
pendientes las crea el propio Gateway durante las conexiones de los Nodes, y el
token independiente por Node al que servían ya no existe; la autenticación de Node utiliza el
token de emparejamiento del dispositivo.

Notas:

- Las reconexiones con una superficie sin cambios reutilizan la solicitud pendiente; las solicitudes
  repetidas actualizan los metadatos de Node almacenados y la instantánea más reciente de
  comandos declarados incluidos en la lista de permitidos, para que el operador pueda consultarla.
- Los niveles de ámbito del operador y las comprobaciones realizadas durante la aprobación se resumen en
  [Ámbitos del operador](/es/gateway/operator-scopes).
- `node.pair.approve` utiliza los comandos declarados de la solicitud pendiente para exigir
  ámbitos de aprobación adicionales:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comandos ordinarios: `operator.pairing` + `operator.write`
  - solicitud sensible para administradores que contenga `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` o
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
La aprobación del emparejamiento de Node registra la superficie de capacidades de confianza. **No** fija la superficie activa de comandos de Node para cada Node.

- Los comandos activos de Node proceden de lo que el Node declara al conectarse, filtrado por
  la política global de comandos de Node del Gateway (`gateway.nodes.allowCommands` y
  `denyCommands`).
- La política de permiso y consulta de `system.run` por Node reside en el Node, en
  `exec.approvals.node.*`, no en el registro de emparejamiento.

</Warning>

## Control de comandos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** a partir de `2026.3.31`, los comandos de Node están deshabilitados hasta que se aprueba el emparejamiento de Node. El emparejamiento de dispositivos por sí solo ya no basta para exponer los comandos de Node declarados.
</Warning>

Cuando un Node se conecta por primera vez, el emparejamiento se solicita automáticamente.
Hasta que se apruebe esa solicitud, todos los comandos de Node pendientes de ese Node se
filtran y no se ejecutan. Una vez aprobado el emparejamiento, los comandos declarados
del Node quedan disponibles, sujetos a la política de comandos habitual.

Esto significa lo siguiente:

- Los Nodes que antes dependían únicamente del emparejamiento de dispositivos para exponer comandos ahora
  también deben completar el emparejamiento de Node.
- Los comandos puestos en cola antes de la aprobación del emparejamiento se descartan, no se aplazan.

## Límites de confianza de los eventos de Node (2026.3.31+)

<Warning>
**Cambio incompatible:** las ejecuciones originadas por Nodes ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por Nodes y los eventos de sesión relacionados se restringen a la
superficie de confianza prevista. Es posible que sea necesario ajustar los flujos controlados por notificaciones o activados por Nodes
que antes dependían de un acceso más amplio a las herramientas del host o de la sesión.
Este refuerzo evita que los eventos de Node escalen a un acceso a herramientas en el ámbito del host
más allá de lo permitido por el límite de confianza del Node.

Las actualizaciones persistentes de presencia de Node siguen el mismo límite de identidad: el
evento `node.presence.alive` solo se acepta de sesiones autenticadas de dispositivos
Node y solo actualiza los metadatos de emparejamiento cuando la identidad del dispositivo/Node
ya está emparejada. Un valor `client.id` declarado por el propio dispositivo no basta para registrar
el estado de última actividad.

## Aprobación automática de dispositivos verificada mediante SSH (predeterminada)

El emparejamiento inicial de dispositivos `role: node` desde una dirección privada/CGNAT se
aprueba automáticamente cuando el Gateway puede **demostrar la propiedad de la máquina mediante SSH**: se
conecta de vuelta al host que solicita el emparejamiento (`BatchMode`, `StrictHostKeyChecking=yes`),
ejecuta `openclaw node identity --json` allí y solo aprueba cuando el
identificador del dispositivo remoto y la clave pública coinciden exactamente con la solicitud pendiente. La coincidencia de claves
es lo que hace que este proceso sea seguro: la accesibilidad por sí sola nunca da lugar a una aprobación, por lo que los demás usuarios de la misma NAT,
otros usuarios de un host compartido y la suplantación en la LAN pasan al flujo de solicitud
normal.

Está habilitada de forma predeterminada. Requisitos para que se active:

- El usuario del proceso del Gateway (o `sshVerify.user`) puede conectarse por SSH al host del Node
  de forma no interactiva (claves/agente; Tailscale SSH también funciona), y la clave del host
  ya es de confianza.
- `openclaw` se resuelve en el `PATH` remoto para el `sh -lc` no interactivo.
- La IP de conexión es una dirección privada, ULA, de enlace local o CGNAT directa
  (sin proxy y sin bucle invertido), o coincide con `sshVerify.cidrs` cuando está configurado.
- Se aplica el mismo requisito mínimo que para la aprobación mediante CIDR de confianza: solo emparejamientos nuevos de Node
  sin ámbitos; las actualizaciones, los navegadores, la interfaz de control y WebChat siempre solicitan aprobación.

Mientras se ejecuta una comprobación, se indica al cliente de Node que siga reintentando
(`wait_then_retry`) en lugar de detenerse para esperar la aprobación manual; si la comprobación
falla, el siguiente intento vuelve al flujo de solicitud normal. Los destinos con fallos
entran en un breve período de espera (5 minutos después de una discrepancia de claves).

Los dispositivos aprobados registran `approvedVia: "ssh-verified"` y su primera superficie de
capacidades declaradas se aprueba en el mismo paso: la coincidencia de claves ya demuestra
que el Node se ejecuta con la cuenta del operador en una máquina de su propiedad, que es la
misma afirmación que establece una aprobación manual de capacidades. Las ampliaciones posteriores de la superficie
siguen solicitando aprobación.

Para reforzarla o deshabilitarla:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Deshabilitar por completo:
        sshVerify: false,
        // ...o delimitar/ajustar la comprobación:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Aprobación automática (aplicación para macOS)

La aplicación para macOS puede intentar una **aprobación silenciosa** de las solicitudes de capacidades de Node
cuando:

- la solicitud está marcada como `silent` (el Gateway marca como silenciosa la primera superficie de capacidades
  cuando el emparejamiento de dispositivos se aprobó de forma no interactiva), y
- la aplicación puede verificar una conexión SSH con el host del Gateway utilizando el mismo
  usuario.

Si la aprobación silenciosa falla, se recurre a la solicitud normal de Approve/Reject.

## Aprobación automática de dispositivos mediante CIDR de confianza

El emparejamiento de dispositivos mediante WS para `role: node` sigue siendo manual de forma predeterminada. En redes privadas de Nodes
en las que el Gateway ya confía en la ruta de red, los operadores pueden habilitarlo
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
- No existe ningún modo de aprobación automática general para redes LAN o privadas; la aprobación
  automática verificada mediante SSH (descrita anteriormente) exige una coincidencia criptográfica de la clave del dispositivo, nunca
  solo la proximidad de red.
- Solo son aptas las solicitudes nuevas de emparejamiento de dispositivos `role: node` que no soliciten ningún ámbito.
- Los clientes de operador, navegador, interfaz de control y WebChat siguen requiriendo aprobación manual.
- Las actualizaciones de roles, ámbitos, metadatos y claves públicas siguen requiriendo aprobación manual.
- Las rutas de cabeceras de proxy de confianza mediante bucle invertido en el mismo host no son aptas, porque esa
  ruta puede ser suplantada por llamadores locales.

## Limpieza de sustituciones de emparejamientos silenciosos

Las aprobaciones no interactivas registran su procedencia en la fila del dispositivo emparejado:
las aprobaciones mediante políticas locales en el mismo host como `silent`, las aprobaciones de Nodes mediante CIDR de confianza como
`trusted-cidr` y las aprobaciones de Nodes verificadas mediante SSH como `ssh-verified`. Los clientes cuyo directorio de estado es efímero (directorios personales temporales,
contenedores o entornos aislados por ejecución) generan un nuevo par de claves de dispositivo en cada ejecución, y cada
ejecución vuelve a emparejarse silenciosamente como un dispositivo totalmente nuevo; sin limpieza, la lista de dispositivos emparejados
acumula una fila obsoleta por ejecución.

Cuando el Gateway aprueba silenciosamente el emparejamiento de un dispositivo **local**, retira
los registros anteriores aprobados mediante `silent` que pertenecen al mismo clúster de clientes
(con valores coincidentes de `clientId`, `clientMode` y el nombre para mostrar) y no están
conectados en ese momento. Los clientes locales se ejecutan en el propio host del Gateway, por lo que la clave del clúster
no puede coincidir con la de otra máquina. Las filas retiradas pierden sus tokens de inmediato;
se borra cualquier entrada heredada de emparejamiento de Node que coincida y se difunde un evento de
eliminación `node.pair.resolved`.

Límites:

- Solo son elegibles los registros cuya aprobación más reciente haya sido local en el mismo host (`silent`),
  tanto como desencadenante como objetivo. Los emparejamientos verificados mediante CIDR de confianza y SSH
  atraviesan hosts donde los metadatos de visualización no constituyen una identidad de máquina, por lo que
  nunca se eliminan automáticamente; para ellos, use la limpieza de la interfaz de control o
  `openclaw nodes remove`.
- Los emparejamientos aprobados por el propietario y mediante QR/código de configuración (arranque) nunca se eliminan
  automáticamente. Los registros aprobados antes de que existiera la procedencia permanecen protegidos,
  incluso tras una reaprobación silenciosa posterior del mismo identificador de dispositivo.
- Los dispositivos conectados actualmente se omiten, por lo que las sesiones locales simultáneas con
  directorios de estado separados conservan sus tokens mientras están activas. También se omiten los registros aprobados
  durante el último minuto, para que los protocolos de enlace de emparejamiento simultáneos
  no puedan retirarse entre sí antes de que se registren sus conexiones.
- Por definición, los clientes afectados son locales, por lo que vuelven a emparejarse silenciosamente
  en su siguiente conexión.

## Aprobación automática de actualizaciones de metadatos

Cuando un dispositivo ya emparejado vuelve a conectarse con cambios únicamente en metadatos no sensibles
(por ejemplo, el nombre para mostrar o indicios sobre la plataforma del cliente), OpenClaw lo considera
un `metadata-upgrade`. La aprobación automática silenciosa tiene un alcance limitado: solo se aplica
a reconexiones locales de confianza que no proceden de navegadores y que ya demostraron la posesión de
credenciales locales o compartidas, incluidas las reconexiones de aplicaciones nativas en el mismo host tras
cambios en los metadatos de la versión del sistema operativo. Los clientes de navegador/interfaz de control y los clientes remotos
siguen utilizando el flujo explícito de reaprobación. Las ampliaciones de alcance (de lectura a
escritura/administración) y los cambios de clave pública **no** cumplen los requisitos para la
aprobación automática de actualizaciones de metadatos; siguen siendo solicitudes explícitas de reaprobación.

## Asistentes de emparejamiento mediante QR

`/pair qr` representa la carga útil de emparejamiento como contenido multimedia estructurado para que los clientes móviles y de
navegador puedan escanearla directamente.

Al eliminar un dispositivo, también se depuran todas las solicitudes de emparejamiento pendientes obsoletas de ese
identificador de dispositivo, para que `nodes pending` no muestre filas huérfanas tras una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway considera que una conexión es de bucle invertido solo cuando tanto el socket sin procesar
como las pruebas de cualquier proxy ascendente coinciden. Si una solicitud llega mediante bucle invertido, pero
incluye pruebas en los encabezados `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, esas
pruebas de encabezados reenviados invalidan la afirmación de localidad de bucle invertido, y la
ruta de emparejamiento requiere aprobación explícita en lugar de considerar silenciosamente la
solicitud como una conexión en el mismo host. Consulte
[Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth) para conocer la regla equivalente sobre la
autenticación del operador.

## Almacenamiento (local y privado)

El estado de emparejamiento reside en los registros de dispositivos emparejados de la base de datos de estado SQLite compartida
ubicada en el directorio de estado del Gateway (valor predeterminado: `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivos emparejados con autenticación de dispositivo,
  superficies de Node aprobadas, solicitudes de superficie pendientes, solicitudes de emparejamiento
  de dispositivos pendientes y tokens de arranque)

Si se sobrescribe `OPENCLAW_STATE_DIR`, la base de datos se mueve con este. Los Gateways
actualizados desde versiones con almacenes JSON los importan al iniciarse y dejan
archivos `devices/*.json.migrated` y `nodes/*.json.migrated`.

Notas de seguridad:

- Los tokens de dispositivo son secretos; la base de datos de estado debe tratarse como información sensible.
- Para rotar un token de dispositivo, se utiliza `openclaw devices rotate` /
  `device.token.rotate`.

## Comportamiento del transporte

- El transporte **no conserva estado**; no almacena pertenencias.
- Si el Gateway está fuera de línea o el emparejamiento está desactivado, los Nodes no pueden emparejarse.
- En modo remoto, el emparejamiento se realiza con el almacén del Gateway remoto.

## Temas relacionados

- [Emparejamiento de canales](/es/channels/pairing)
- [CLI de Nodes](/es/cli/nodes)
- [CLI de dispositivos](/es/cli/devices)
