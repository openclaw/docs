---
read_when:
    - Diseño o implementación del aprovisionamiento de workers en la nube, el modo worker o la transferencia de sesiones
    - Cambio de `environments.*`, el protocolo de los workers, la ingesta de transcripciones o las RPC del proxy de inferencia
    - Revisión de la postura de seguridad de la ejecución remota de agentes
summary: Ejecuta sesiones de agentes en máquinas efímeras accesibles mediante SSH, con inferencia a través de un proxy del Gateway y transmisión en tiempo real en la barra lateral.
title: Plan de workers en la nube
x-i18n:
    generated_at: "2026-07-12T14:40:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Estado

Propuesta, revisión 3. No implementada. Dirección acordada en 2026-07; la revisión 2 incorporó los hallazgos de la revisión adversarial (protocolo dedicado para trabajadores, máquinas de estado de ubicación/entorno, sincronización entrante con conocimiento de Git, traspaso unidireccional en v1 y redacción de seguridad sobre egreso controlado). La revisión 3 define el modelo de propiedad de la sincronización (el trabajador crea los commits, el Gateway los adopta y publica), añade un modo de sincronización simple sin Git, corrige la ejecución del trabajador para que sea completa dentro de la máquina, traslada la política de Internet al momento del aprovisionamiento y restaura el despacho por parte del agente al hito 3.

## Problema

Las sesiones de agente de OpenClaw ejecutan su bucle, sus herramientas y la inferencia dentro del proceso del Gateway en una sola máquina. La capacidad de cómputo está limitada por esa máquina, las tareas largas la ocupan y el trabajo paralelo compite por sus recursos. Los productos alojados (agentes en la nube de Cursor, Claude Code en la web y Codex cloud) resuelven esto mediante entornos aislados efímeros en la nube para cada tarea, pero requieren infraestructura y confianza en el proveedor.

Los operadores que ya poseen máquinas libres (o pueden alquilarlas a bajo costo) no tienen forma de indicar: ejecuta esta sesión allí, muéstrala en mi barra lateral como cualquier otra sesión y desecha la máquina después.

## Objetivos

- Ejecutar una sesión de agente completa (bucle + herramientas) en una máquina remota efímera («trabajador en la nube»), mientras la sesión aparece y transmite contenido en la interfaz de control exactamente igual que una sesión local.
- No mantener credenciales permanentes en el trabajador (sin autenticación del proveedor ni tokens del servicio de alojamiento de código) ni permitir egreso directo de red; la máquina solo necesita un sshd accesible.
- Aprovisionar, sincronizar, ejecutar, recopilar y destruir de forma totalmente automatizada y con proveedores intercambiables (primer proveedor: CLI de arrendamiento del estilo de Crabbox).
- Despachar trabajo en ejecución desde el Gateway a un trabajador en el límite entre turnos sin perder la transcripción, la identidad de la sesión ni, cuando los bytes de la solicitud sigan siendo equivalentes, la afinidad con la caché del proveedor; recuperar los resultados de forma segura.
- Permitir que tanto las personas (interfaz de usuario) como los agentes (herramienta) despachen trabajo a un trabajador en la nube.
- Admitir sesiones que duren varios días; la duración es una política, no un límite codificado.

## Fuera de alcance (v1)

- No se admiten entornos externos de programación (Claude Code, Codex CLI) en los trabajadores. Las sesiones de trabajador solo ejecutan el ejecutor integrado de OpenClaw. La compatibilidad con estos entornos será una opción de v2 porque realizan su propia inferencia con sus propias credenciales.
- No se admiten múltiples intentos en paralelo ni la selección del mejor de N.
- No se depende de VPN ni de tailnet. El transporte es exclusivamente SSH.
- No se incorpora un nuevo entorno de aislamiento. La máquina del trabajador constituye el límite de aislamiento; el aislamiento del sistema operativo dentro de la máquina podrá añadirse posteriormente.
- No hay migración simétrica en vivo en v1: el despacho es local → trabajador; el retorno de trabajador → local requiere una sesión detenida y una reconciliación completa del espacio de trabajo. El traspaso bidireccional en vivo se desarrollará posteriormente sobre la misma maquinaria de barreras.
- No hay estado auxiliar en JSON en el Gateway; el estado del entorno, la ubicación, el cursor y las concesiones reside en SQLite.

## Trabajo previo (qué copiamos y qué invertimos)

- Agentes en la nube de Cursor: el bucle del agente se ejecuta en su nube; la máquina virtual es un destino para la ejecución de herramientas; un almacén de conversaciones de solo anexado transmite a todos los clientes; una instantánea posterior a la instalación permite un inicio rápido; los trabajadores autoalojados son procesos que solo realizan conexiones salientes. Copiamos el modelo en el que «la fuente de verdad de la conversación permanece en el orquestador» y el modelo de transmisión; invertimos la ubicación del bucle (consulte la decisión a continuación).
- Codex cloud: entorno de ejecución en dos fases: una fase de configuración con red y, después, una fase del agente sin conexión y sin secretos; caché del estado del contenedor para agilizar las continuaciones. Copiamos la división en fases como estrategia de egreso y la idea de la caché para las imágenes preparadas de v2.
- Claude Code en la web: una máquina virtual por sesión; un proxy de Git que aísla las credenciales (los tokens reales nunca entran en el entorno aislado y el envío está restringido a la rama de la sesión); una instantánea del sistema de archivos después de la configuración; traspaso por teletransporte = rama enviada + historial reproducido. Copiamos el aislamiento de credenciales y el planteamiento del traspaso, pero la sincronización saliente se realiza mediante rsync desde el Gateway para que funcionen los árboles de trabajo con cambios sin confirmar y no haya ningún token del servicio de alojamiento de código cerca de la máquina.
- Agente de programación de Copilot: egreso denegado de forma predeterminada con una lista de permitidos para registros de paquetes. Nuestro valor predeterminado en estado estable es más estricto (no se permite ningún egreso directo) porque la inferencia y la búsqueda web llegan a través del túnel SSH; sin embargo, consulte Seguridad para entender por qué se trata de «egreso controlado» y no de «egreso cero».

## Decisión arquitectónica: bucle en el trabajador, inferencia a través del Gateway

Se consideraron tres ubicaciones:

1. El bucle permanece en el Gateway y el trabajador ejecuta las herramientas (modelo de Cursor). Es el dominio de fallos más seguro (la transcripción, la inferencia, las aprobaciones y la recuperación tras reinicios permanecen en local) y fue el primer hito preferido por un revisor. Se descartó como arquitectura del producto: las herramientas de OpenClaw distintas de ejecución son operaciones del sistema de archivos dentro del proceso, por lo que cada lectura, edición o búsqueda con grep en archivos se convertiría en un viaje de ida y vuelta por la red o exigiría una gran refactorización de la superficie de herramientas para convertirla en RPC de alto nivel sobre el espacio de trabajo; el comportamiento del entorno de ejecución genera mucho tráfico y queda limitado por la latencia. Reutilizamos su enfoque donde ya está implementado (descarga de ejecución en nodos), pero no desarrollamos la capa de ejecución remota de herramientas.
2. Tanto el bucle como la inferencia se ejecutan en el trabajador. Es el dominio de fallos más sencillo, pero las credenciales del modelo (incluidos los perfiles de OAuth) tendrían que enviarse a máquinas desechables, el Gateway perdería el control de políticas, enrutamiento y auditoría, y la migración cambiaría la identidad que realiza las llamadas al proveedor, lo que invalidaría sus cachés.
3. El bucle y las herramientas se ejecutan en el trabajador, y las llamadas al modelo pasan mediante proxy por el Gateway. Opción elegida. Se requiere un viaje de ida y vuelta por cada turno del modelo, en lugar de por cada llamada a una herramienta; las herramientas se ejecutan junto al código; el Gateway sigue siendo el único propietario de los perfiles de autenticación, el enrutamiento de proveedores y las políticas; el trabajador no conserva secretos.

El costo de la opción 3 es una dependencia sincrónica del Gateway durante cada turno del modelo, por lo que sus reglas de durabilidad forman parte de la decisión y no son una consideración posterior:

- La pérdida del Gateway durante un turno provoca el fallo de la llamada activa al proveedor. El turno se marca como fallido y se reintenta como un turno nuevo después de restablecer la conexión; no se reproduce de forma transparente una transmisión del proveedor en curso, debido al riesgo de doble facturación o de ejecutar dos veces una llamada a una herramienta.
- Cada operación entre trabajador y Gateway contiene una identidad duradera (consulte Protocolo del trabajador), de modo que las reconexiones reanudan la operación o recuperan resultados terminales almacenados en caché, en lugar de dejarla pendiente.
- El Gateway es un componente cuya capacidad se administra: los límites de trabajadores simultáneos, el control de flujo y el rechazo de carga forman parte del alcance de v1 (consulte Capacidad).

Como el Gateway almacena la transcripción y origina todo el tráfico hacia los proveedores, la sesión es independiente de su ubicación: trasladar el bucle entre el Gateway y el trabajador no cambia nada del lado del proveedor ni en la ruta de datos de la interfaz de usuario. Esto permite que el despacho y la recuperación sean económicos.

## Componentes

### 1. Máquina de estados del entorno + contrato del proveedor

`environments.*` en el protocolo del Gateway es actualmente una proyección exclusivamente de estado. El núcleo duradero es un registro de entorno y una máquina de estados propiedad de SQLite, diseñados antes que las formas de los RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- El aprovisionamiento tolera fallos: la fila de intención se conserva antes de llamar al proveedor, con un identificador de operación determinista, de modo que un reinicio del Gateway pueda adoptar un arrendamiento en curso en lugar de aprovisionarlo dos veces o dejar una máquina de pago huérfana.
- La reconciliación después de reinicios y un recolector de recursos huérfanos (`inspect` del proveedor frente a los registros locales) son requisitos de v1, no medidas de refuerzo posteriores.

Contrato del proveedor (implementado mediante Plugin; sin nombres de proveedores ni políticas en el núcleo):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → host/puerto/usuario SSH/material de claves
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopción/salud/barrido de huérfanos
  renew?(leaseId: string): Promise<void>; // sesiones de larga duración frente a TTL de proveedores
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotente, solo retorna tras comprobar la eliminación
};
```

RPC: `environments.create`, `environments.destroy` y versiones ampliadas de `environments.list/status` (proveedor, identificador de arrendamiento, estado, antigüedad, tiempo de inactividad y sesiones asociadas). Primeros proveedores: un contenedor para una CLI de arrendamiento con la forma de Crabbox (ruta del producto) y un proveedor de hosts SSH estáticos marcado como exclusivo para desarrollo; un trabajador en un host compartido puede leer datos ajenos del host, por lo que los hosts estáticos se destinan al desarrollo de la función, no constituyen la estrategia predeterminada.

### 2. Inicialización del trabajador: instalar OpenClaw en la máquina

No hay un artefacto de trabajador específico ni dependencia de la disponibilidad de npm:

- Instalación canónica para todos los modos: un paquete de trabajador generado por el Gateway y con hash de contenido (la salida de compilación del propio Gateway empaquetada como tarball), enviado mediante SSH e instalado en la máquina. Esto incluye por diseño las compilaciones de desarrollo y los commits aún no publicados.
- `npm i -g openclaw@<exact gateway version>` es una optimización cuando el Gateway ejecuta una versión publicada; nunca `latest`.
- La inicialización es idempotente; un arrendamiento preparado cuyo hash de paquete coincida omite la instalación. Las máquinas sin preparar pueden requerir una fase de instalación de herramientas con acceso a la red (entorno de ejecución de Node); esta forma parte de la fase de configuración y se cierra después.
- El protocolo de enlace verifica el hash de la compilación del trabajador, el conjunto de funciones del protocolo y la compatibilidad del entorno de ejecución. Las comprobaciones existentes de versión y protocolo del Gateway no son suficientes para esto (los nodos conectados mediante túneles SSH están exentos del rechazo por versión no exacta), por lo que la admisión del trabajador realiza su propia comprobación de compilación exacta.

El modo trabajador (`openclaw worker`) es un punto de entrada, no una bifurcación: gestión de conexiones más el ejecutor de agentes integrado, con persistencia de sesiones y llamadas al modelo respaldadas por RPC del Gateway. No debe iniciar superficies del Gateway: sin canales, sin inicio automático de plugins salvo los del conjunto de herramientas de la sesión, con un directorio de estado desechable y sin perfiles de autenticación locales.

### 3. Transporte: todo mediante SSH

El Gateway es propietario de la conectividad; el trabajador no requiere nada más que sshd:

- El Gateway abre una conexión SSH con el trabajador (credenciales del arrendamiento del proveedor y clave del host fijada a partir del resultado del aprovisionamiento; no se usa `StrictHostKeyChecking=no`) y establece un túnel inverso que reenvía un socket local del trabajador al punto de conexión WS del Gateway.
- El tráfico de control/modelo y la transferencia del espacio de trabajo utilizan conexiones SSH separadas con el mismo material de confianza fijado, para que rsync no bloquee las transmisiones de tokens por bloqueo en cabeza de línea.
- El ciclo de vida del túnel (señales de mantenimiento y reconexión con espera incremental) pertenece al entorno de ejecución del entorno en el Gateway. Una interrupción breve del túnel es invisible en el ámbito de la sesión: el estado duradero del protocolo (descrito a continuación) permite que el trabajador vuelva a conectarse y reanude la operación.

### 4. Protocolo del trabajador (dedicado; no es el protocolo de nodos)

La revisión adversarial de los mecanismos actuales de nodos descartó su reutilización directa: las invocaciones pendientes de los nodos son promesas locales del proceso que desaparecen con la conexión, las claves de idempotencia de los nodos se analizan pero no se deduplican y, de forma decisiva, un nodo conectado puede emitir eventos ordinarios de nodo (incluidas solicitudes de ejecución de agentes), por lo que «tipo de nodo + límite de capacidades» no constituye un límite de seguridad de entrada. Por lo tanto, los trabajadores reciben un rol `worker` autenticado con una lista cerrada y versionada de RPC y eventos permitidos; las conexiones de los trabajadores no pueden acceder a ningún controlador de eventos de nodos heredado.

Identidad y credenciales: durante el aprovisionamiento se genera una credencial de trabajador de corta duración vinculada al identificador del entorno, la clave del trabajador, el hash del paquete, la única sesión permitida, el conjunto de RPC permitido y una fecha de caducidad. El emparejamiento verificado mediante SSH sigue aplicándose (aprovisionamos la máquina y poseemos la clave), pero la autorización procede de la credencial generada, no de la superficie de nodo declarada.

Semántica de operaciones duraderas (forma basada en el entorno de ejecución ACP existente y su registro de eventos: identificadores estables, serialización por sesión y reproducción duradera de `(session, seq)`):

- Cada operación está delimitada por `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Las épocas de propiedad bloquean a los trabajadores obsoletos: un trabajador de reemplazo incrementa la época; los resultados tardíos de la época anterior se rechazan de forma determinista.
- Entrega al menos una vez con cursores de confirmación persistidos y resultados terminales almacenados en caché en SQLite; la deduplicación es determinista. No se garantiza una entrega exactamente una vez.
- Tramas explícitas para cancelación, cierre, reanudación y resultados terminales; control de flujo basado en créditos/ventanas para las transmisiones.
- La negociación de funciones del protocolo es independiente de la versión general del protocolo de nodos.

### 5. RPC del backend de sesiones

Dos contratos distintos: la base de código actual separa las mutaciones duraderas de la transcripción (propiedad del administrador de sesiones, árbol JSONL con estado de padre/hoja) de los eventos activos locales al proceso (deltas de streaming, ciclo de vida de herramientas, aprobaciones), y el protocolo del worker debe preservar esa separación:

- Confirmaciones duraderas de la transcripción: el worker envía lotes de anexión semántica con `runEpoch` + comparación e intercambio de la hoja base; el administrador de sesiones del Gateway genera los identificadores de las entradas y de sus padres. El worker nunca puede proporcionar filas de transcripción de confianza, identificadores de entradas, identificadores de padres ni identificadores de sesiones ajenas.
- Eventos activos reproducibles: una unión tipada de eventos con números de secuencia del worker, ACK del Gateway, retención acotada y exclusión de eventos tardíos, que alimenta la distribución existente de eventos del agente para que la vista de chat, las filas de herramientas y la lógica de estados/no leídos se comporten de forma idéntica a las sesiones locales.

Proxy de inferencia: reutilizar el vocabulario de eventos del cliente de streaming del proxy del entorno de ejecución existente (`src/agents/runtime/proxy.ts`), pero trasladar el límite de confianza. El worker envía únicamente la identidad de sesión/ejecución, una referencia de modelo aprobada, el contexto y opciones de generación restringidas; el Gateway resuelve el proveedor, el endpoint, la autenticación, los encabezados, el enrutamiento y la política de costos desde su propio catálogo. Se rechaza un objeto de modelo proporcionado por el worker (p. ej., un `baseUrl` controlado por un atacante). Se aplican límites de tamaño de solicitudes, cancelación, auditoría y reproducción del resultado terminal. Las herramientas residentes en el Gateway (websearch) se ejecutan en el Gateway y devuelven los resultados por el mismo canal.

### 6. Sincronización del espacio de trabajo

El punto de anclaje de la sincronización es un espacio de trabajo local al Gateway con propiedad exclusiva de la asignación: para espacios de trabajo de git, un worktree administrado dedicado (los metadatos existentes del worktree administrado —rama, base, propiedad de la instantánea— son la base); para espacios de trabajo sin git, un directorio de destino propiedad del Gateway. Nunca el checkout activo del usuario. La propiedad exclusiva mientras la sesión está asignada de forma remota es lo que hace que la sincronización entrante esté libre de conflictos por diseño.

División de responsabilidades: commit frente a publicación:

- El agente del lado del worker crea commits normalmente en su copia (`git commit` es una operación local que no requiere credenciales; la identidad del autor se proyecta desde la configuración del Gateway). Esos commits son objetos inertes hasta que el Gateway los adopta.
- El Gateway realiza todo lo que requiere confianza: verificar que los commits entrantes se basen en la base registrada, avanzar el worktree local mediante fast-forward, hacer push, crear PR y, opcionalmente, firmar o volver a firmar; todo ello con credenciales locales al Gateway. El worker nunca posee credenciales de git ni de la forja y nunca accede a un remoto.

Dos modos de sincronización, seleccionados según si el espacio de trabajo es un repositorio git:

- Modo git. Salida: sincronizar mediante rsync el worktree (incluidos los archivos sin confirmar y los archivos no rastreados admisibles; inclusión/exclusión al estilo crabbox, respetando `.worktreeinclude`) sobre la identidad SSH del túnel, registrado como un manifiesto base inmutable (hashes de contenido + commit base). Entrada: los commits nuevos regresan como un paquete git o una referencia temporal respecto de la base registrada; los artefactos no rastreados regresan mediante un manifiesto explícito con comprobaciones de tamaño/tipo/contención de enlaces simbólicos. La adopción verifica la ascendencia de la base y se detiene ante una divergencia: nada sobrescribe silenciosamente ninguno de los lados. Las eliminaciones, los cambios de nombre, los submódulos y los escapes mediante enlaces simbólicos se gestionan mediante las reglas del manifiesto, no mediante heurísticas de rsync.
- Modo simple (sin git; p. ej., al crear un proyecto desde cero en la máquina). La salida usa el mismo rsync + manifiesto base. La entrada es un reflejo basado en las diferencias del manifiesto hacia el directorio de destino propiedad del Gateway, con propagación de eliminaciones. Es seguro por la misma razón que el modo git: la propiedad exclusiva implica que no existen ediciones locales simultáneas que puedan generar conflictos; el manifiesto base sigue detectando cambios locales inesperados y se detiene en lugar de sobrescribirlos.

Los puntos de control protegen las sesiones que duran varios días frente a la pérdida del arrendamiento: puntos de control entrantes periódicos (commits de la rama de sesión en modo git, instantáneas del manifiesto en modo simple); la frecuencia es una política del perfil (por turnos de forma predeterminada).

### 7. Máquina de estados de asignación, sesiones e interfaz de usuario

La asignación del entorno de ejecución es una máquina de estados propiedad de SQLite y vinculada a la sesión, no un par de campos de fila independientes:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Persiste el identificador del entorno, la generación de transición, la época del propietario activo, el manifiesto base del espacio de trabajo, el hash del paquete del worker y los últimos cursores ACK. La admisión de turnos reclama atómicamente la asignación antes de que cualquiera de los bucles inicie un turno, por lo que un mensaje local admitido respecto de una instantánea obsoleta nunca puede competir con un turno del worker: exactamente un bucle es propietario de la sesión en cada momento.

Interfaz de usuario:

- Una sesión de worker es una fila de sesión ordinaria más metadatos de asignación. Reside en el almacén normal, se enumera mediante `sessions.list` y transmite mediante las suscripciones existentes; la barra lateral y el chat no necesitan una nueva ruta de datos, solo presentación: una insignia de worker y el estado de asignación/entorno (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Experiencia de creación: la barra de destino de la sesión (rediseño de la barra lateral de sesiones) incorpora un destino de worker en la nube junto con el Gateway y el Node. Requiere un perfil de proveedor configurado; la función no es visible hasta que se configura.
- Envío del agente: una herramienta de sesión permite que un agente delegue trabajo a un worker en la nube del mismo modo que lo hace una persona (subsesión respaldada por un worker, al estilo de un subagente). Se entrega en el mismo hito que el envío humano, condicionado por la misma configuración opcional del proveedor. La recursión está limitada estructuralmente (las sesiones de worker no pueden enviar a su vez otros workers en v1); el control del gasto se basa en la contabilidad/auditoría por entorno, no en mecanismos de cuotas.

## Envío y transferencia

v1 es deliberadamente asimétrica:

- Local → worker (envío): superar la barrera de migración descrita a continuación, aprovisionar o reutilizar un worker, sincronizar, cambiar la asignación; el siguiente turno se ejecuta de forma remota.
- Worker → local (recuperación): detener la sesión (drenar el worker conforme a la misma barrera), completar la reconciliación entrante, cambiar la asignación a local. No es una migración en vivo.
- La transferencia simétrica en vivo (mover una sesión que está trabajando activamente en ambas direcciones sin detenerla) reutiliza la misma barrera y los mismos mecanismos de reconciliación, y se entrega después de que las pruebas de inyección de fallos validen la barrera.

Barrera de migración (el «límite del turno» por sí solo es insuficiente: las aprobaciones, los procesos en segundo plano y las fusiones de transcripciones con bloqueo liberado pueden atravesarlo):

1. Detener la admisión de nuevos turnos (reclamación de la asignación).
2. Cancelar o drenar las ejecuciones activas.
3. Revocar las aprobaciones de ejecución y las concesiones de ejecución pendientes.
4. Drenar las escrituras secundarias de la transcripción y los ACK de eventos activos.
5. Terminar los procesos secundarios del worker.
6. Excluir al propietario anterior avanzando la época del propietario.
7. Reconciliar el espacio de trabajo (entrante, con detección de conflictos).
8. Activar al nuevo propietario.

Afinidad de caché: dado que las solicitudes al proveedor se originan en el Gateway en ambas asignaciones, la afinidad de caché se conserva cuando la solicitud serializada al proveedor permanece equivalente: el mismo orden de herramientas, instrucciones del sistema, envoltorios del proveedor y metadatos de caché (que permanecen del lado del Gateway). Esta es una propiedad comprobable, no una suposición: las pruebas de equivalencia byte a byte entre las asignaciones local/worker para cada transporte de proveedor compatible forman parte del hito que introduce el bucle del worker.

## Modelo de seguridad

Formulado con precisión: el worker no tiene salida directa a la red ni credenciales permanentes del proveedor o la forja. No es «salida cero»: la inferencia y las herramientas ejecutadas por el Gateway son canales de salida controlados (un worker afectado por una inyección de prompts aún puede incluir bytes del espacio de trabajo en el contexto del modelo o en consultas de websearch). Por consiguiente:

- Contabilidad de salida controlada: auditoría por entorno y contabilidad visible para el operador en el proxy de inferencia y las herramientas del Gateway. Existen límites de tasa/bytes como control de flujo del protocolo (capacidad), no como mecanismos de cuotas de gasto.
- La entrada del worker al Gateway es la lista cerrada de elementos permitidos del protocolo del worker; las escrituras de la transcripción están restringidas estructuralmente (identificadores generados por el Gateway, una sola sesión vinculada).
- La ejecución del worker dispone de permisos completos dentro de la máquina. La máquina es desechable y no contiene credenciales, por lo que la aprobación por comando añade fricción sin proteger nada; el límite protegido es la reconciliación entrante y la auditoría. La ejecución nunca atraviesa la ruta de aprobación del Node del Gateway.
- La política de Internet es una decisión del proveedor durante el aprovisionamiento: el perfil del entorno decide al crear la máquina (firewall/grupo de seguridad/red sin salida), opcionalmente con una fase de configuración con acceso a la red que el proveedor cierra antes de la fase del agente. El núcleo no implementa un conmutador de red en tiempo de ejecución.
- Higiene de la máquina durante el aprovisionamiento: endpoint de metadatos de la nube bloqueado o cuya ausencia se ha verificado, sin perfil de instancia, sin agente SSH heredado, sin socket de Docker, entorno/directorio de inicio limpios. Las claves de host SSH se fijan a partir de la salida del aprovisionamiento.
- Las aprobaciones y políticas para todo lo que se encuentre del lado del Gateway (push, PR, llamadas al proveedor) continúan ejecutándose en el Gateway.

Radio de impacto de una sesión de worker comprometida: la copia sincronizada del espacio de trabajo más lo que permitan los canales proxy auditados; sin credenciales, sin red directa y sin superficie del Gateway más allá de la lista de elementos permitidos.

## Capacidad

El Gateway retransmite cada prompt y flujo de tokens para N workers, por lo que v1 define un modelo de capacidad en lugar de descubrirlo en producción: límites de workers simultáneos por Gateway, ventanas de crédito por flujo (la cola actual del flujo de eventos no está acotada y el límite del búfer del socket del Node fuerza el cierre de los consumidores lentos; ninguno de los dos es adecuado sin modificaciones), almacenamiento temporal acotado en disco para ráfagas y reducción de carga con estados visibles de contrapresión en la interfaz de usuario. La transferencia del espacio de trabajo permanece en su propio canal SSH.

## Ciclo de vida

- La detención automática por inactividad y el TTL son políticas del perfil del proveedor, no constantes fijas. Los valores predeterminados son generosos y cuentan con mantenimiento de actividad explícito; el trabajo de varios días es un caso de primera clase (existe `renew` del proveedor para backends basados en arrendamientos); una sesión con un turno en curso o actividad reciente nunca se recupera.
- Ante la muerte o recuperación del worker: la asignación pasa a `reclaimed`, la fila de la sesión permanece y el siguiente mensaje aprovisiona un worker nuevo y vuelve a sincronizar desde el último punto de control. La conversación nunca se pierde (almacén del lado del Gateway); se pierden los cambios del espacio de trabajo posteriores al último punto de control y la interfaz de usuario lo indica.
- Reutilización de arrendamientos preparados desde el primer día (para los proveedores compatibles); la instantánea de imagen posterior al arranque es la vía de inicio rápido de v2.

## Superficie de configuración

Mínima y opcional: un bloque de perfil de proveedor (identificador del proveedor, referencia de credenciales/CLI, reglas de sincronización, política de duración, presupuestos, fase de configuración opcional) más la selección de asignación por sesión. No se añaden variables de entorno. Las instalaciones sin configurar no muestran nada.

## Hitos

La implementación se incorpora mediante PR pequeños que pueden fusionarse de forma independiente; cada hito descrito a continuación es una serie de PR, no un único cambio.

1. Fundamentos: máquina de estados del entorno + contrato del proveedor + proveedor con estructura de crabbox (SSH estático como banco de pruebas de desarrollo), arranque del paquete del worker + negociación de admisión, túnel SSH + fijación de claves de host, instantánea del worktree administrado + sincronización saliente (modos git + simple). Limpieza de huérfanos + adopción tras reinicio.
2. Protocolo del worker + bucle del worker: rol autenticado del worker, operaciones/épocas/cursores ACK duraderos, contratos de confirmación de transcripción + eventos activos, proxy de inferencia con modelos resueltos por el Gateway, control de flujo. Un proveedor, envío humano únicamente de sesiones nuevas, sin transferencia. Las pruebas de inyección de fallos (partición del túnel, reinicio del Gateway, muerte del worker) condicionan la finalización.
3. Envío + recuperación + envío del agente: barrera de migración, máquina de estados de asignación conectada a la barra de destino de la interfaz de usuario, reconciliación entrante + puntos de control, auditoría por entorno, límites de capacidad, herramienta de envío del agente (las sesiones de worker no pueden recurrir). Pruebas de equivalencia byte a byte de la caché de prompts.
4. Transferencia simétrica en vivo, después de la validación mediante inyección de fallos del hito 3.

Más adelante: bancos de pruebas ACP en workers como opción de hidratación de credenciales por entorno; inicio rápido mediante instantánea/imagen preparada; distribución en abanico (N arrendamientos, mismo prompt); aislamiento del sistema operativo dentro de la máquina; captura más completa de artefactos mediante el esquema de artefactos.

## Preguntas abiertas

- Disponibilidad de plugins/Skills en los workers: las Skills incluidas en el repositorio se sincronizan gratuitamente con el espacio de trabajo; las Skills/plugins de agente configurados en el Gateway requieren una decisión explícita de sincronización o exclusión (en cualquier caso, el manifiesto de herramienta/plugin forma parte del protocolo de admisión).
- Cadencia predeterminada de los puntos de control: basada en turnos frente a basada en tiempo para sesiones con mucha conversación.
- Cómo interactúan los perfiles de entorno con el enrutamiento multiagente (perfiles predeterminados por agente frente a selección únicamente por sesión).
