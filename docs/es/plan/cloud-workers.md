---
read_when:
    - Diseño o implementación del aprovisionamiento de trabajadores en la nube, el modo de trabajador o la transferencia de sesión
    - Cambiar environments.*, el protocolo de los workers, la ingesta de transcripciones o las RPC del proxy de inferencia
    - Revisión de la postura de seguridad de la ejecución remota de agentes
summary: Ejecuta sesiones de agente en máquinas efímeras accesibles mediante SSH, con inferencia a través del proxy del Gateway y transmisión en tiempo real en la barra lateral.
title: Plan de workers en la nube
x-i18n:
    generated_at: "2026-07-11T23:15:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Estado

Propuesta, revisión 3. No implementada. Dirección acordada en 2026-07; la revisión 2 incorporó los hallazgos de la revisión adversarial (protocolo dedicado para workers, máquinas de estados de ubicación/entorno, sincronización entrante con conocimiento de Git, traspaso unidireccional en v1 y redacción de seguridad sobre salida controlada). La revisión 3 establece el modelo de propiedad de la sincronización (el worker crea los commits, el Gateway los adopta y publica), añade un modo de sincronización simple sin Git, corrige la ejecución del worker para que sea completa dentro de la máquina aislada, traslada la política de Internet al momento del aprovisionamiento y restaura el despacho del agente al hito 3.

## Problema

Las sesiones de agente de OpenClaw ejecutan su bucle, herramientas e inferencia dentro del proceso del Gateway en una sola máquina. La capacidad de cómputo está limitada por esa máquina, las tareas largas la ocupan y el trabajo en paralelo compite por sus recursos. Los productos alojados (agentes en la nube de Cursor, Claude Code en la web y Codex cloud) resuelven esto con entornos aislados efímeros en la nube para cada tarea, pero requieren infraestructura y confianza en el proveedor.

Los operadores que ya poseen máquinas de sobra (o pueden alquilarlas a bajo costo) no tienen forma de indicar: ejecuta esta sesión allí, muéstrala en mi barra lateral como cualquier otra sesión y elimina la máquina al terminar.

## Objetivos

- Ejecutar una sesión de agente completa (bucle + herramientas) en una máquina remota efímera («worker en la nube»), mientras la sesión aparece y transmite datos en la interfaz de control exactamente igual que una sesión local.
- No mantener credenciales permanentes en el worker (ni autenticación del proveedor ni tokens de la plataforma Git) y no permitir salida directa a la red; la máquina solo necesita un `sshd` accesible.
- Aprovisionar, sincronizar, ejecutar, recopilar y destruir de forma totalmente automatizada y con proveedores intercambiables (primer proveedor: CLI de arrendamiento al estilo de Crabbox).
- Despachar desde el Gateway el trabajo en curso a un worker en el límite entre turnos, sin perder la transcripción, la identidad de la sesión ni, cuando los bytes de la solicitud sigan siendo equivalentes, la afinidad con la caché del proveedor; recuperar los resultados de forma segura.
- Permitir que tanto las personas (interfaz de usuario) como los agentes (herramienta) despachen trabajo a un worker en la nube.
- Admitir sesiones de varios días; la duración es una política, no un límite codificado.

## Fuera de alcance (v1)

- No habrá entornos de ejecución de programación externos (Claude Code, Codex CLI) en los workers. Las sesiones de worker solo ejecutan el runner integrado de OpenClaw. La compatibilidad con estos entornos será una opción voluntaria en v2, porque realizan su propia inferencia con sus propias credenciales.
- No habrá selección del mejor de N intentos ni distribución de intentos en paralelo.
- No habrá dependencia de VPN ni de red privada. El transporte será exclusivamente mediante SSH.
- No habrá un nuevo entorno de aislamiento. La máquina del worker constituye el límite de aislamiento; más adelante podrá añadirse aislamiento del sistema operativo dentro de la máquina.
- No habrá migración activa simétrica en v1: el despacho será de local → worker; el retorno de worker → local requerirá una sesión detenida y la conciliación completa del espacio de trabajo. El traspaso activo bidireccional se basará más adelante en el mismo mecanismo de barreras.
- No habrá estado lateral en JSON en el Gateway; los estados del entorno, la ubicación, los cursores y las concesiones se almacenarán en SQLite.

## Antecedentes (qué copiamos y qué invertimos)

- Agentes en la nube de Cursor: el bucle del agente se ejecuta en su nube; la máquina virtual es un destino para ejecutar herramientas; el almacén de conversaciones es de solo anexado y transmite datos a todos los clientes; una instantánea posterior a la instalación permite un inicio rápido; los workers autoalojados son procesos que solo establecen conexiones salientes. Copiamos el modelo de transmisión y el principio de que «la fuente de verdad de la conversación permanece en el orquestador»; invertimos la ubicación del bucle (consulte la decisión siguiente).
- Codex cloud: entorno de ejecución en dos fases: una fase de configuración con acceso a la red y, después, una fase del agente sin conexión y sin secretos; caché del estado del contenedor para seguimientos rápidos. Copiamos la separación de fases como estrategia de salida de red y la idea de la caché para imágenes precalentadas en v2.
- Claude Code en la web: máquina virtual por sesión; proxy Git que aísla las credenciales (los tokens reales nunca entran en el entorno aislado y el envío se restringe a la rama de la sesión); instantánea del sistema de archivos después de la configuración; traspaso por teletransporte = rama enviada + historial reproducido. Copiamos el aislamiento de credenciales y el planteamiento del traspaso, pero la sincronización saliente se realiza mediante `rsync` desde el Gateway, por lo que funcionan los árboles de trabajo con cambios sin confirmar y no existe ningún token de la plataforma Git cerca de la máquina.
- Agente de programación de Copilot: salida de red denegada de forma predeterminada, con una lista de permitidos para registros de paquetes. Nuestro valor predeterminado durante el funcionamiento estable es más estricto (ninguna salida directa), porque la inferencia y la búsqueda web llegan mediante el túnel SSH; sin embargo, consulte Seguridad para saber por qué esto es «salida controlada» y no «salida nula».

## Decisión de arquitectura: bucle en el worker, inferencia mediante el Gateway

Se consideraron tres ubicaciones:

1. El bucle permanece en el Gateway y el worker ejecuta las herramientas (modelo de Cursor). Es el dominio de fallos más seguro (la transcripción, la inferencia, las aprobaciones y la recuperación tras reinicios permanecen en local) y fue el primer hito preferido por un revisor. Se descartó como arquitectura del producto: las herramientas de OpenClaw que no ejecutan comandos son operaciones del sistema de archivos dentro del proceso, por lo que cada lectura, edición o búsqueda con `grep` de un archivo se convertiría en un viaje de ida y vuelta por la red, o exigiría una gran refactorización de la superficie de herramientas para convertirla en RPC generales del espacio de trabajo; el comportamiento del entorno de ejecución genera mucho tráfico y queda limitado por la latencia. Reutilizamos su principio donde ya está implementado (delegación de la ejecución a nodos), pero no creamos la capa de ejecución remota de herramientas.
2. Tanto el bucle como la inferencia se ejecutan en el worker. Es el dominio de fallos más sencillo, pero las credenciales del modelo (incluidos los perfiles OAuth) tendrían que enviarse a máquinas desechables, el Gateway perdería el control sobre las políticas, el enrutamiento y la auditoría, y la migración cambiaría la identidad que realiza las llamadas al proveedor, lo que invalidaría sus cachés.
3. El bucle y las herramientas se ejecutan en el worker, y las llamadas al modelo se canalizan mediante el Gateway. Opción elegida. Hay un viaje de ida y vuelta por cada turno del modelo, en lugar de uno por cada llamada a una herramienta; las herramientas se ejecutan junto al código; el Gateway sigue siendo el único propietario de los perfiles de autenticación, el enrutamiento de proveedores y las políticas; el worker no contiene secretos.

El costo de la opción 3 es una dependencia síncrona del Gateway durante cada turno del modelo, por lo que sus reglas de durabilidad forman parte de la decisión y no son una consideración posterior:

- La pérdida del Gateway durante un turno hace que falle la llamada activa al proveedor. El turno se marca como fallido y se reintenta como uno nuevo después de la reconexión; no se reproduce de forma transparente una transmisión del proveedor en curso, debido al riesgo de doble facturación o de ejecutar dos veces una llamada a una herramienta.
- Cada operación entre el worker y el Gateway incluye una identidad duradera (consulte Protocolo del worker), de modo que las reconexiones reanudan la operación o recuperan resultados terminales almacenados en caché, en lugar de dejarla pendiente.
- El Gateway es un componente con capacidad administrada: los límites de workers simultáneos, el control de flujo y la reducción de carga están incluidos en el alcance de v1 (consulte Capacidad).

Como el Gateway almacena la transcripción y origina todo el tráfico hacia el proveedor, la sesión es independiente de su ubicación: mover el bucle entre el Gateway y el worker no cambia nada del lado del proveedor ni en la ruta de datos de la interfaz de usuario. Esto permite que el despacho y la recuperación sean económicos.

## Componentes

### 1. Máquina de estados del entorno + contrato del proveedor

`environments.*` en el protocolo del Gateway es actualmente una proyección exclusiva del estado. El núcleo duradero es un registro de entorno y una máquina de estados propiedad de SQLite, diseñados antes que las formas de los RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- El aprovisionamiento tolera fallos: la fila de intención se conserva antes de llamar al proveedor, con un identificador de operación determinista, para que, tras reiniciarse, el Gateway pueda adoptar un arrendamiento en curso en lugar de aprovisionar dos veces o dejar huérfana una máquina de pago.
- La conciliación tras reinicios y un recolector de recursos huérfanos (`inspect` del proveedor frente a los registros locales) son requisitos de v1, no medidas de robustecimiento adicionales.

Contrato del proveedor (implementado mediante un Plugin; sin nombres de proveedores ni políticas en el núcleo):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh host/port/user/key material
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopt/health/orphan sweep
  renew?(leaseId: string): Promise<void>; // long-lived sessions vs provider TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, returns only on proof of teardown
};
```

RPC: `environments.create`, `environments.destroy` y versiones ampliadas de `environments.list/status` (proveedor, identificador del arrendamiento, estado, antigüedad, tiempo de inactividad y sesiones adjuntas). Primeros proveedores: un contenedor de una CLI de arrendamiento con la forma de Crabbox (ruta del producto) y un proveedor de host SSH estático marcado como exclusivo para desarrollo; un worker en un host compartido puede leer datos ajenos del host, por lo que los hosts estáticos sirven para desarrollar la función, no como estrategia predeterminada.

### 2. Inicialización del worker: instalar OpenClaw en la máquina

No se usa ningún artefacto específico para el worker ni existe dependencia de la disponibilidad de npm:

- Instalación canónica para todos los modos: un paquete del worker generado por el Gateway y con hash de contenido (la salida de compilación del propio Gateway empaquetada como archivo tar), enviado mediante SSH e instalado en la máquina. Esto incluye por diseño las compilaciones de desarrollo y las confirmaciones aún no publicadas.
- `npm i -g openclaw@<exact gateway version>` es una optimización cuando el Gateway ejecuta una versión publicada; nunca `latest`.
- La inicialización es idempotente; un arrendamiento precalentado con un hash de paquete coincidente omite la instalación. Las máquinas sin preparar pueden necesitar una fase de herramientas con acceso a la red (entorno de ejecución de Node), que forma parte de la fase de configuración y se cierra después.
- El protocolo de enlace verifica el hash de compilación del worker, el conjunto de funciones del protocolo y la compatibilidad del entorno de ejecución. Las comprobaciones actuales de versión y protocolo del Gateway no son suficientes para esto (los nodos conectados mediante un túnel SSH están exentos del rechazo por versión no exacta), por lo que la admisión del worker realiza su propia comprobación de compilación exacta.

El modo de worker (`openclaw worker`) es un punto de entrada, no una bifurcación: gestión de conexiones más el runner de agente integrado, con persistencia de sesiones y llamadas al modelo respaldadas por RPC del Gateway. No debe iniciar superficies del Gateway: ningún canal, ningún inicio automático de Plugins aparte del conjunto de herramientas de la sesión, directorio de estado desechable y ningún perfil de autenticación local.

### 3. Transporte: todo mediante SSH

El Gateway controla la conectividad; el worker no necesita más que `sshd`:

- El Gateway abre una conexión SSH con el worker (las credenciales proceden del arrendamiento del proveedor y la clave del host se fija a partir de la salida del aprovisionamiento; no se usa `StrictHostKeyChecking=no`) y establece un túnel inverso que reenvía un socket local del worker al punto de conexión WS del Gateway.
- El tráfico de control/modelo y la transferencia del espacio de trabajo usan conexiones SSH independientes con el mismo material de confianza fijado, para que `rsync` no bloquee las transmisiones de tokens por espera en el inicio de la cola.
- El ciclo de vida del túnel (señales de mantenimiento y reconexión con espera progresiva) pertenece al entorno de ejecución del entorno en el Gateway. Una interrupción breve del túnel es invisible en el ámbito de la sesión: el estado duradero del protocolo (descrito a continuación) permite que el worker vuelva a conectarse y reanude la operación.

### 4. Protocolo del worker (dedicado; distinto del protocolo de nodos)

La revisión adversarial de los mecanismos actuales de nodos descartó su reutilización directa: las invocaciones de nodo pendientes son promesas locales del proceso que desaparecen con la conexión, las claves de idempotencia de los nodos se analizan pero no se deduplican y, de forma decisiva, un nodo conectado puede emitir eventos ordinarios de nodo (incluidas solicitudes de ejecución del agente), por lo que «tipo de nodo + límite de capacidades» no constituye un límite de seguridad para el tráfico entrante. Por lo tanto, los workers reciben un rol `worker` autenticado, con una lista de RPC/eventos permitidos cerrada y versionada; las conexiones de workers no pueden acceder a ningún controlador de eventos de nodos heredado.

Identidad y credenciales: el aprovisionamiento genera una credencial de worker de corta duración vinculada al identificador del entorno, la clave del worker, el hash del paquete, la única sesión permitida, el conjunto de RPC permitido y una fecha de caducidad. El emparejamiento verificado mediante SSH sigue aplicándose (hemos aprovisionado la máquina y poseemos la clave), pero la autorización procede de la credencial generada, no de la superficie de nodo declarada.

Semántica de las operaciones duraderas (forma tomada del entorno de ejecución de ACP existente y su registro de eventos: identificadores estables, serialización por sesión y reproducción duradera mediante `(session, seq)`):

- Cada operación se delimita mediante `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Las épocas de propiedad aíslan a los workers obsoletos: un worker de sustitución incrementa la época; los resultados tardíos de la época anterior se rechazan de forma determinista.
- Entrega al menos una vez, con cursores de confirmación persistentes y resultados terminales almacenados en caché en SQLite; la deduplicación es determinista. No se garantiza la entrega exactamente una vez.
- Tramas explícitas para cancelar, cerrar, reanudar y comunicar resultados terminales; control de flujo en las transmisiones basado en créditos/ventanas.
- La negociación de funciones del protocolo es independiente de la versión general del protocolo de nodos.

### 5. RPC del backend de sesiones

Dos contratos distintos: la base de código actual separa las mutaciones duraderas de la transcripción (propiedad del administrador de sesiones, árbol JSONL con estado de padre/hoja) de los eventos activos locales del proceso (deltas de transmisión, ciclo de vida de herramientas, aprobaciones), y el protocolo del trabajador debe preservar esa separación:

- Confirmaciones duraderas de la transcripción: el trabajador envía lotes de anexión semántica con `runEpoch` + comparación e intercambio de la hoja base; el administrador de sesiones del Gateway genera los identificadores de entrada y de padre. El trabajador nunca puede proporcionar filas de transcripción de confianza, identificadores de entrada, identificadores de padre ni identificadores de sesiones ajenas.
- Eventos activos reproducibles: una unión de eventos tipada con números de secuencia del trabajador, ACK del Gateway, retención acotada y aislamiento de eventos tardíos, que alimenta la distribución existente de eventos del agente para que la vista del chat, las filas de herramientas y la lógica de no leídos/estado se comporten de manera idéntica a las sesiones locales.

Proxy de inferencia: reutilizar el vocabulario de eventos del cliente de flujo del proxy de ejecución existente (`src/agents/runtime/proxy.ts`), pero trasladar el límite de confianza. El trabajador envía únicamente la identidad de la sesión/ejecución, una referencia de modelo aprobada, el contexto y opciones de generación restringidas; el Gateway resuelve el proveedor, el endpoint, la autenticación, los encabezados, el enrutamiento y la política de costes desde su propio catálogo. Se rechaza un objeto de modelo suministrado por el trabajador (por ejemplo, un `baseUrl` controlado por un atacante). Se aplican límites de tamaño de solicitud, cancelación, auditoría y reproducción del resultado terminal. Las herramientas residentes en el Gateway (websearch) se ejecutan en el Gateway y devuelven los resultados por el mismo canal.

### 6. Sincronización del espacio de trabajo

El punto de anclaje de la sincronización es un espacio de trabajo local del Gateway con propiedad exclusiva de la asignación: para espacios de trabajo git, un árbol de trabajo administrado dedicado (los metadatos existentes del árbol de trabajo administrado —rama, base, propiedad de la instantánea— constituyen la base); para espacios de trabajo sin git, un directorio de destino propiedad del Gateway. Nunca el checkout activo del usuario. La propiedad exclusiva mientras la sesión está asignada remotamente es lo que hace que la sincronización entrante esté libre de conflictos por diseño.

División de responsabilidades: confirmar frente a publicar:

- El agente del lado del trabajador crea confirmaciones normalmente en su copia (`git commit` es una operación local que no requiere credenciales; la identidad del autor se proyecta desde la configuración del Gateway). Esas confirmaciones son objetos inertes hasta que el Gateway las adopta.
- El Gateway realiza todo lo que requiere confianza: verificar que las confirmaciones entrantes se basan en la base registrada, adelantar el árbol de trabajo local mediante avance rápido, hacer push, crear el PR y, opcionalmente, firmar o volver a firmar; todo ello con credenciales locales del Gateway. El trabajador nunca posee credenciales de git ni de la plataforma de alojamiento y nunca accede a un remoto.

Dos modos de sincronización, seleccionados según si el espacio de trabajo es un repositorio git:

- Modo git. Salida: sincronizar mediante rsync el árbol de trabajo (incluidos los archivos sin confirmar y los archivos sin seguimiento aptos; inclusión/exclusión al estilo de crabbox, respetando `.worktreeinclude`) a través de la identidad SSH del túnel, registrado como un manifiesto base inmutable (hashes de contenido + confirmación base). Entrada: las nuevas confirmaciones regresan como un paquete git o una referencia temporal respecto de la base registrada; los artefactos sin seguimiento regresan mediante un manifiesto explícito con comprobaciones de tamaño, tipo y contención de enlaces simbólicos. La adopción verifica la ascendencia de la base y se detiene ante una divergencia: nada sobrescribe silenciosamente ninguno de los lados. Las eliminaciones, los cambios de nombre, los submódulos y los escapes mediante enlaces simbólicos se gestionan mediante las reglas del manifiesto, no mediante heurísticas de rsync.
- Modo simple (sin git; por ejemplo, al crear un proyecto desde cero en la máquina). La salida usa el mismo rsync + manifiesto base. La entrada es un reflejo calculado mediante diferencias de manifiesto hacia el directorio de destino propiedad del Gateway, con propagación de eliminaciones. Es seguro por la misma razón que el modo git: la propiedad exclusiva significa que no existen ediciones locales simultáneas con las que entrar en conflicto; el manifiesto base aún detecta cambios locales inesperados y se detiene en lugar de sobrescribirlos.

Los puntos de control protegen las sesiones de varios días frente a la pérdida de la concesión: puntos de control entrantes periódicos (confirmaciones en la rama de la sesión en modo git, instantáneas del manifiesto en modo simple); la periodicidad es una política del perfil (por turnos de forma predeterminada).

### 7. Máquina de estados de asignación, sesiones e interfaz de usuario

La asignación en tiempo de ejecución es una máquina de estados propiedad de SQLite vinculada a la sesión, no un par de campos de fila independientes:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Almacena el identificador del entorno, la generación de la transición, la época del propietario activo, el manifiesto base del espacio de trabajo, el hash del paquete del trabajador y los últimos cursores ACK. La admisión de turnos reclama atómicamente la asignación antes de que cualquiera de los bucles inicie un turno, por lo que un mensaje local admitido a partir de una instantánea obsoleta nunca puede competir con un turno del trabajador: exactamente un bucle es propietario de la sesión en cada momento.

Interfaz de usuario:

- Una sesión de trabajador es una fila de sesión ordinaria con metadatos de asignación. Reside en el almacén normal, se enumera mediante `sessions.list` y se transmite mediante las suscripciones existentes; la barra lateral y el chat no necesitan una nueva ruta de datos, solo presentación: una insignia de trabajador y el estado de asignación/entorno (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Experiencia de creación: la barra de destino de la sesión (rediseño de la barra lateral de sesiones) incorpora un destino de trabajador en la nube junto al Gateway y al Node. Requiere un perfil de proveedor configurado; la función permanece invisible hasta que se configure.
- Delegación del agente: una herramienta de sesión permite que un agente delegue trabajo a un trabajador en la nube del mismo modo que lo hace una persona (subsesión respaldada por un trabajador, al estilo de un subagente). Se publica en el mismo hito que la delegación humana, condicionada por la misma configuración opcional del proveedor. La recursión se limita estructuralmente (las sesiones de trabajador no pueden delegar en otros trabajadores en la v1); el control del gasto se realiza mediante contabilidad/auditoría por entorno, no mediante mecanismos de cuotas.

## Delegación y traspaso

La v1 es deliberadamente asimétrica:

- Local → trabajador (delegación): superar la barrera de migración descrita a continuación, aprovisionar o reutilizar un trabajador, sincronizar, cambiar la asignación; el siguiente turno se ejecuta remotamente.
- Trabajador → local (recuperación): detener la sesión (drenar el trabajador conforme a la misma barrera), completar la reconciliación entrante y cambiar la asignación a local. No es una migración en vivo.
- Traspaso simétrico en vivo (mover una sesión que está trabajando activamente en ambas direcciones sin detenerla): reutiliza la misma barrera y el mismo mecanismo de reconciliación, y se publica después de que las pruebas de inyección de fallos validen la barrera.

Barrera de migración («límite de turno» por sí solo es insuficiente: las aprobaciones, los procesos en segundo plano y las fusiones de transcripciones con bloqueos liberados pueden atravesarlo):

1. Detener la admisión de nuevos turnos (reclamación de la asignación).
2. Cancelar o drenar las ejecuciones activas.
3. Revocar las aprobaciones de ejecución y las concesiones de ejecución pendientes.
4. Drenar las escrituras laterales de la transcripción y los ACK de eventos activos.
5. Terminar los procesos secundarios del trabajador.
6. Aislar al antiguo propietario avanzando la época del propietario.
7. Reconciliar el espacio de trabajo (entrante, teniendo en cuenta los conflictos).
8. Activar al nuevo propietario.

Afinidad de caché: dado que las solicitudes al proveedor se originan en el Gateway en ambas asignaciones, la afinidad de caché se conserva cuando la solicitud serializada al proveedor permanece equivalente: mismo orden de herramientas, instrucciones del sistema, envoltorios del proveedor y metadatos de caché (que permanecen en el lado del Gateway). Esta es una propiedad comprobable, no una suposición: las pruebas de equivalencia byte a byte entre la asignación local y la del trabajador para cada transporte de proveedor compatible forman parte del hito que introduce el bucle del trabajador.

## Modelo de seguridad

En términos precisos: el trabajador no tiene salida directa a la red ni credenciales permanentes del proveedor o de la plataforma de alojamiento. No es «salida cero»: la inferencia y las herramientas ejecutadas por el Gateway son canales de salida controlados (un trabajador afectado por una inyección de instrucciones aún puede introducir bytes del espacio de trabajo en el contexto del modelo o en consultas de websearch). En consecuencia:

- Contabilidad de salida controlada: auditoría por entorno y contabilidad visible para el operador en el proxy de inferencia y las herramientas del Gateway. Los límites de velocidad/bytes existen como control de flujo del protocolo (capacidad), no como mecanismos de cuotas de gasto.
- La entrada del trabajador al Gateway es la lista de elementos permitidos cerrada del protocolo del trabajador; las escrituras de la transcripción están restringidas estructuralmente (identificadores generados por el Gateway, una única sesión vinculada).
- La ejecución del trabajador tiene permisos completos dentro de la máquina. La máquina es desechable y no contiene credenciales, por lo que la aprobación por comando añade fricción sin proteger nada; el límite protegido es la reconciliación entrante y la auditoría. La ejecución nunca atraviesa la ruta de aprobación del Node del Gateway.
- La política de Internet es una decisión del proveedor durante el aprovisionamiento: el perfil del entorno decide en el momento de crear la máquina (cortafuegos/grupo de seguridad/red sin salida), opcionalmente con una fase de configuración con acceso a la red que el proveedor cierra antes de la fase del agente. El núcleo no implementa un interruptor de red en tiempo de ejecución.
- Higiene de la máquina durante el aprovisionamiento: endpoint de metadatos de la nube bloqueado o cuya ausencia se ha verificado, sin perfil de instancia, sin agente SSH heredado, sin socket de Docker, entorno/directorio personal limpios. Las claves de host SSH se fijan a partir de la salida del aprovisionamiento.
- Las aprobaciones y políticas de todo lo que se ejecuta en el lado del Gateway (push, PR, llamadas al proveedor) continúan ejecutándose en el Gateway.

Radio de impacto de una sesión de trabajador comprometida: la copia sincronizada del espacio de trabajo más lo que permitan los canales de proxy auditados; sin credenciales, sin red directa y sin acceso a superficies del Gateway fuera de la lista de elementos permitidos.

## Capacidad

El Gateway retransmite cada instrucción y flujo de tokens para N trabajadores, por lo que la v1 establece un modelo de capacidad en lugar de descubrirlo en producción: límites de trabajadores simultáneos por Gateway, ventanas de crédito por flujo (la cola actual del flujo de eventos no está acotada y el límite del búfer del socket del Node fuerza el cierre para consumidores lentos; ninguno de los dos resulta adecuado sin modificaciones), almacenamiento temporal acotado en disco para ráfagas y reducción de carga con estados visibles de contrapresión en la interfaz de usuario. La transferencia del espacio de trabajo permanece en su propio canal SSH.

## Ciclo de vida

- La detención automática por inactividad y el TTL son políticas del perfil del proveedor, no constantes fijas. Los valores predeterminados son generosos y cuentan con mantenimiento de actividad explícito; el trabajo de varios días es de primera clase (existe `renew` del proveedor para backends basados en concesiones); nunca se recupera una sesión con un turno en curso o actividad reciente.
- Ante la muerte o recuperación del trabajador: la asignación pasa a `reclaimed`, la fila de la sesión permanece y el siguiente mensaje aprovisiona un trabajador nuevo y vuelve a sincronizar desde el último punto de control. La conversación nunca se pierde (almacén en el lado del Gateway); los cambios del espacio de trabajo posteriores al último punto de control se pierden y la interfaz de usuario lo indica.
- Reutilización de concesiones activas desde el primer día (para proveedores compatibles); la instantánea de imagen posterior al arranque es la ruta de inicio rápido de la v2.

## Superficie de configuración

Mínima y opcional: un bloque de perfil del proveedor (identificador del proveedor, referencia de credenciales/CLI, reglas de sincronización, política de duración, presupuestos, fase de configuración opcional) más la selección de asignación por sesión. No se añaden variables de entorno. Las instalaciones sin configurar no muestran nada.

## Hitos

La implementación se incorpora como PR pequeños que pueden fusionarse de forma independiente; cada hito siguiente es una serie de PR, no un único cambio.

1. Fundamentos: máquina de estados del entorno + contrato del proveedor + proveedor con forma de crabbox (SSH estático como arnés de desarrollo), arranque del paquete del trabajador + protocolo de enlace de admisión, túnel SSH + fijación de claves de host, instantánea del árbol de trabajo administrado + sincronización saliente (modos git + simple). Barrido de huérfanos + adopción tras reinicio.
2. Protocolo del trabajador + bucle del trabajador: rol de trabajador autenticado, operaciones/épocas/cursores ACK duraderos, contratos de confirmación de transcripciones + eventos activos, proxy de inferencia con modelos resueltos por el Gateway, control de flujo. Un proveedor, delegación humana únicamente de sesiones nuevas, sin traspaso. Las pruebas de inyección de fallos (partición del túnel, reinicio del Gateway, muerte del trabajador) condicionan la finalización.
3. Delegación + recuperación + delegación del agente: barrera de migración, máquina de estados de asignación conectada a la barra de destino de la interfaz de usuario, reconciliación entrante + puntos de control, auditoría por entorno, límites de capacidad, herramienta de delegación del agente (las sesiones de trabajador no pueden recurrir). Pruebas de equivalencia byte a byte de la caché de instrucciones.
4. Traspaso simétrico en vivo, después de la validación mediante inyección de fallos del hito 3.

Más adelante: arneses ACP en los trabajadores como opción de hidratación de credenciales por entorno; inicio rápido mediante instantáneas/imágenes activas; distribución en abanico (N concesiones, misma instrucción); aislamiento del sistema operativo dentro de la máquina; captura de artefactos más completa mediante el esquema de artefactos.

## Preguntas abiertas

- Disponibilidad de plugins/Skills en los workers: las Skills incluidas en el repositorio se sincronizan con el espacio de trabajo sin coste adicional; las Skills/plugins del agente configurados en el Gateway requieren una decisión explícita de sincronización o exclusión (en ambos casos, el manifiesto de herramientas/plugins forma parte del protocolo de admisión).
- Cadencia predeterminada de los puntos de control: basada en turnos frente a basada en tiempo para sesiones muy conversacionales.
- Cómo interactúan los perfiles de entorno con el enrutamiento multiagente (perfiles predeterminados por agente frente a selección únicamente por sesión).
