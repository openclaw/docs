---
read_when:
    - Quieres que las sesiones de Codex Desktop o de la CLI aparezcan en OpenClaw
    - Necesita crear una rama a partir de una sesión local almacenada o inactiva de Codex, o archivarla
    - Estás exponiendo las sesiones de Codex y el historial de transcripciones de los nodos emparejados
sidebarTitle: Codex supervision
summary: Explora sesiones nativas de Codex no archivadas y transcripciones paginadas en los nodos de OpenClaw
title: Supervisar sesiones de Codex
x-i18n:
    generated_at: "2026-07-19T02:00:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f365e3207dff092c3dfd8f7588d60d70a16f0cce484991eb4ab3fc0bd15f8051
    source_path: plugins/codex-supervision.md
    workflow: 16
---

La supervisión de Codex es una capacidad opcional del Plugin oficial `codex`. Muestra
las sesiones de origen no archivadas de Codex CLI, VS Code, Atlas y ChatGPT del
equipo del Gateway y de los equipos emparejados que hayan habilitado esta opción
en la barra lateral normal de sesiones y en el panel de chat.

La versión inicial mantiene deliberadamente una propiedad limitada:

- Una sesión local almacenada o inactiva puede crear un chat de OpenClaw bloqueado a un modelo a partir
  de su historial persistente limitado de mensajes del usuario y del asistente. El primer mensaje inicia una
  bifurcación de instantánea nativa y, a continuación, inicia el hilo completo del entorno de Codex exactamente con
  el modelo y el proveedor que Codex App Server seleccionó para esa bifurcación. Los turnos posteriores
  restauran el par persistente del hilo nativo canónico, mientras que la
  vinculación supervisada impide que OpenClaw sustituya el entorno de ejecución,
  el modelo o el mecanismo alternativo. Un control nativo independiente de Codex aún puede cambiar ese
  par persistente. Una rama ya creada abre su chat existente.
- Una sesión almacenada descubierta desde otro proceso de Codex tiene una actividad
  en curso desconocida. Puede bifurcarse o archivarse únicamente después de que el operador
  confirme que ningún otro cliente de Codex la está utilizando.
- Un origen activo permanece visible, pero no puede crear una rama ni archivarse hasta que
  finalice su turno actual. Si ya tiene un chat supervisado, **Abrir chat**
  permanece disponible.
- Una sesión en un Node emparejado expone su transcripción persistente mediante lecturas limitadas
  y paginadas por cursor de App Server. La continuación remota
  requiere un futuro puente de streaming para nodos; el archivado remoto requiere además
  un arrendamiento de propiedad del ejecutor o un mecanismo de aislamiento equivalente.
- Las sesiones archivadas no se muestran. Una sesión local almacenada o inactiva solo puede
  archivarse después de que el operador confirme que ningún otro cliente de Codex la está utilizando.

## Antes de comenzar

- Instale el Plugin oficial `@openclaw/codex` en el Gateway. La aplicación de OpenClaw para
  macOS puede instalarlo al habilitar las funciones de Codex; las instalaciones mediante la CLI pueden
  ejecutar `openclaw plugins install @openclaw/codex`.
- Instale e inicie sesión en Codex Desktop o Codex CLI en cada equipo cuyas
  sesiones desee mostrar.
- Empareje los equipos remotos como nodos de OpenClaw. Cada equipo debe habilitar la opción localmente;
  habilitar la supervisión únicamente en el Gateway no autoriza a otro Node.
- Utilice un Gateway controlado por el propietario. Los títulos de las sesiones, los directorios de trabajo y las ramas de Git
  pueden revelar información confidencial de los proyectos.

## Habilitar la supervisión

La configuración guiada de `openclaw onboard` y la configuración inicial de macOS intentan instalar y
habilitar la supervisión de Codex después de detectar una instalación nativa de Codex y
activar correctamente el backend de inferencia seleccionado. Codex no tiene que ser
el backend principal. La supervisión pasa a estar disponible cuando se completa correctamente esa activación
oportunista del Plugin. La disponibilidad de App Server se comprueba cuando
la supervisión se conecta por primera vez. Una desactivación explícita del Plugin de Codex o un bloqueo por políticas
impiden la activación oportunista, y un valor explícito existente de
`supervision.enabled: false` deshabilita las herramientas de supervisión orientadas al agente; el
catálogo del operador permanece registrado siempre que el Plugin de Codex esté activo, salvo que
`sessionCatalog.enabled: false` lo deshabilite. Este interruptor independiente mantiene sin cambios
el proveedor de Codex, el entorno y la política de supervisión orientada al agente, a la vez que
elimina de este host los comandos para mostrar y leer el catálogo de nodos emparejados.
Las instalaciones existentes pueden habilitar manualmente la misma capacidad:

Habilite el Plugin `codex` y su capacidad de supervisión en `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Si `plugins.allow` está presente, incluya `codex`. Reinicie el Gateway después de
cambiar la activación del Plugin.

Sin una configuración explícita de conexión en `appServer`, la supervisión utiliza una conexión
stdio administrada e independiente contra el directorio personal nativo de Codex del usuario. El
entorno ordinario de Codex permanece limitado al agente de forma predeterminada. Esto permite que las
sesiones nativas sean visibles en ambas aplicaciones sin hacer que los turnos ordinarios de OpenClaw
compartan el estado nativo de Codex. Establezca explícitamente `appServer.homeScope: "user"` si el entorno
también debe compartir ese estado. La supervisión respeta la configuración explícita de conexión de `appServer`
en lugar de sustituirla por su valor predeterminado del directorio personal del usuario local.

Un chat adoptado desde el grupo **Codex** de la barra lateral no es una sesión ordinaria del entorno.
Su vinculación de supervisión privada utiliza la conexión de supervisión para leer
el origen, crear la rama canónica, inyectar el historial y procesar cada turno posterior. Con
la conexión local predeterminada, esto conserva el directorio personal nativo de Codex del usuario, la autenticación
y la configuración del proveedor sin cambiar el valor predeterminado de otras sesiones.
Los chats adoptados y observados también participan en el [conocimiento del estado de la sesión](/es/concepts/session-state).

Para la conexión local de supervisión predeterminada, el almacén se comparte con los clientes
nativos de Codex. OpenClaw no presupone que otro cliente comparta el mismo proceso activo de
App Server, y la propiedad del estado nativo es local al proceso. Por tanto,
trata un hilo que su App Server de supervisión notifica como `notLoaded` como
**Almacenado / actividad desconocida**, no como inactivo.

Aplique la misma habilitación opcional en cada host de Node sin interfaz cuyas sesiones deban aparecer.
La aplicación nativa de OpenClaw para macOS lee la misma configuración local cuando anuncia
su catálogo de Codex al Gateway emparejado. Ese catálogo de Mac nativo emparejado solo admite
el valor predeterminado o un valor explícito de `appServer.transport: "stdio"` con `appServer.homeScope: "user"` sin establecer o
establecido explícitamente. `command`, `args` y `clearEnv` se
respetan para ese proceso stdio. Si la configuración del Mac selecciona `"unix"`,
`"websocket"` o `homeScope: "agent"`, la aplicación no anuncia la capacidad ni el comando
del catálogo, y una invocación directa obsoleta falla en lugar de exponer
el directorio personal de Codex del usuario o iniciar un App Server stdio local diferente.

Un comando de Node anunciado recientemente cambia la superficie de comandos aprobada del Node.
Apruebe la actualización desde el host del Gateway:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Las sesiones de Codex no archivadas también aparecen en la barra lateral principal de la interfaz de control, agrupadas
por host. Seleccione una para leer su transcripción persistente. El visor utiliza la API más reciente
de Codex `thread/turns/list` con `itemsView: "full"` y carga como máximo 20 turnos
por solicitud; **Cargar elementos anteriores de la transcripción** sigue el cursor opaco de App Server desde la página más reciente.
Las páginas cargadas se muestran en orden cronológico. El visor nunca carga un historial
`thread/read` sin límites. Una página que supere el límite de seguridad de transporte de 20 MiB falla
de forma cerrada en lugar de poner en riesgo la conexión del Node o del Gateway.

Abra el grupo **Codex** en la barra lateral normal de sesiones. Muestra las mismas sesiones
agrupadas por host. **Cargar más sesiones** añade la página siguiente de cada host que
tenga filas anteriores, y esas filas añadidas se conservan durante la actualización periódica de la barra lateral.
Cada host aparece en cuanto finaliza su propio listado nativo. La página visible
se reconcilia tras cambios en la conectividad de los nodos, cuando recupera el foco y, como máximo,
cada 30 segundos; un resultado modificado activa una pasada de seguimiento más rápida. Por tanto, las sesiones creadas
en Codex Desktop, la CLI u otro cliente nativo aparecen sin
necesidad de recargar toda la página. La primera página sigue el orden de actualización más reciente del propio Codex,
por lo que una sesión nativa recién creada puede aparecer inmediatamente.
Cada página de resultados devuelta examina un número limitado de páginas nativas por host en lugar
de enviar la consulta a App Server, ya que la búsqueda nativa también puede encontrar
coincidencias en las vistas previas de las transcripciones.

La disponibilidad del host y el estado del hilo son independientes. **Sin conexión** o **No disponible**
describe una actualización del host; un host no disponible no devuelve filas de sesiones nuevas ni
cambia el estado nativo de un hilo a `offline`. Las filas de sesiones utilizan estados de Codex
como `idle`, `active`, `notLoaded` o error. El fallo de un host no
oculta los resultados de los hosts en buen estado.

La advertencia de la barra lateral incluye el código de error del catálogo y el error subyacente seguro
del Gateway. Abra **Configuración > Automatización > Plugins > Codex > Detección de sesiones
nativas** para deshabilitar la detección sin deshabilitar Codex. Para
`NODE_LIST_FAILED`, compare `openclaw nodes list` y **Configuración > Dispositivos**;
la causa detallada identifica el fallo del almacén de emparejamientos, el registro de nodos, los permisos o
el ciclo de vida del Gateway que debe repararse.

## Usar la CLI del operador

La CLI del terminal expone el mismo catálogo no archivado y las acciones locales del Gateway para bifurcar
y archivar:

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Opciones de `openclaw codex sessions`:

- `--search <text>` busca en los títulos de las sesiones sin distinguir entre mayúsculas y minúsculas.
- `--host <id>` limita la respuesta a un único host estable del catálogo, como
  `gateway:local` o `node:<node-id>`.
- `--limit <count>` establece entre 1 y 100 filas por host; el valor predeterminado es 50.
- `--cursor <cursor>` continúa una página de un host y, por tanto, requiere `--host`.
- `--json` imprime la respuesta estructurada del Gateway.

Los tres comandos heredan `--url`, `--token` y `--timeout <ms>` del
cliente del Gateway. El listado de sesiones utiliza de forma predeterminada 75,000 ms para que los catálogos
de nodos emparejados con un inicio en frío puedan completarse; la continuación y el archivado utilizan de forma predeterminada 30,000 ms. También exponen el interruptor compartido
`--expect-final`, que no modifica estas RPC de supervisión unarias.
Cada comando requiere el ámbito `operator.write` del Gateway.
La salida estándar de `-h, --help` está disponible en cada subcomando.
No existe ninguna opción para sesiones archivadas ni para incluirlas. `sessions` puede mostrar los hosts
emparejados, pero `continue` y `archive` siempre se dirigen a `gateway:local`; las filas emparejadas
son solo de lectura. El archivado siempre requiere `--confirm-no-other-runner`.

Estos comandos del shell son distintos de los comandos del entorno `/codex` dentro del chat.
`/codex threads [filter]` muestra los hilos de App Server disponibles para la conexión de la
conversación actual. `/codex sessions --host <node>` muestra los archivos reanudables de sesiones de
Codex CLI en un Node, no el catálogo de la flota de supervisión. `/codex
resume` y `/codex bind`
adjuntan la conversación actual en lugar de crear una rama supervisada segura,
y un chat supervisado bloqueado a un modelo rechaza esas modificaciones de vinculación.
No existe ningún comando del entorno `/codex continue` ni `/codex archive`.

## Bifurcar desde una sesión local

Seleccione **Continuar como rama** en una fila almacenada o inactiva del equipo del Gateway.
OpenClaw crea una entrada de chat normal, replica el historial limitado del usuario y del asistente
hasta el último turno terminal persistente del origen (completado, interrumpido o
fallido), registra una bifurcación pendiente del entorno y abre el chat. El selector genérico de modelos
queda bloqueado, pero todavía no se ha seleccionado ningún modelo ni proveedor concreto. El
origen no se reanuda y el hilo canónico del entorno todavía no se inicia.
Si se repite la acción, se abre el chat existente en lugar de crear otra
rama.

La réplica conserva la parte visible más reciente que cumple los tres límites: como máximo 200
mensajes del usuario o del asistente, 512 KiB de texto UTF-8 en total y 64 KiB por
mensaje. Los mensajes demasiado grandes se truncan con un marcador y los mensajes anteriores se
omiten cuando se alcanza un límite. Una entrada de imagen o de imagen local se convierte en el marcador de posición literal
`[Image attachment]`; no se copian los datos de la imagen ni las rutas locales.

Envía el primer mensaje normal de Chat para comenzar a trabajar. El arnés de Codex instala los
controladores reales de aprobación, obtención de información, eventos y entrega. Utiliza una bifurcación
nativa temporal en la conexión de supervisión para fijar la instantánea de origen sin
proporcionar una anulación de modelo o proveedor. Codex App Server selecciona ambos desde su
configuración nativa actual y devuelve la selección real. En esa misma
conexión, OpenClaw inicia el hilo canónico completo del arnés con origen `appServer`
en su directorio de trabajo y con su política de ejecución utilizando exactamente el par devuelto, inserta el
historial visible acotado y archiva la bifurcación temporal. El hilo canónico
dispone de toda la superficie de herramientas del arnés de OpenClaw. Esta es una rama de historial visible, no
un clon completo de la ejecución nativa: se omiten el razonamiento del origen, las llamadas a herramientas
y los resultados de las herramientas. Este turno y todos los posteriores permanecen en la conexión supervisada de Codex
en lugar de usar otro entorno de ejecución de modelos de OpenClaw o el arnés habitual del directorio de inicio del agente.

La selección devuelta no demuestra cuál era el modelo histórico del origen. Si la
configuración nativa actual difiere del modelo registrado para el último turno del
origen, Codex emite su advertencia normal de diferencia de modelo. OpenClaw utiliza el
par devuelto para iniciar el hilo canónico. Codex conserva el modelo y el
proveedor nativos de ese hilo canónico, y las reanudaciones posteriores los mantienen porque
OpenClaw omite las anulaciones de modelo y proveedor. Si el hilo canónico se modifica
mediante un control nativo independiente de Codex, OpenClaw acepta la
selección conservada por Codex. OpenClaw nunca sustituye esta selección por su modelo externo ni por su cadena de respaldo.

El Chat supervisado con modelo bloqueado no puede eliminarse, cambiar de modelo, usar `/new`
o `/reset`, invocar la acción de restablecimiento de sesión del Gateway ni usar la acción genérica
**Bifurcar sesión**. También se rechazan las modificaciones de `/codex model <model>`, `/codex
bind`, `/codex resume` (incluida una sesión de nodo con `--bind here`) y
`/codex detach` o `/codex unbind`, porque reemplazarían
o borrarían la vinculación nativa bloqueada. La consulta `/codex model` y `/codex fast`,
`/codex permissions` y `/codex threads` siguen disponibles. Inicia otra
sesión normal cuando se necesite un modelo distinto o un hilo nuevo.

Mantén habilitada la supervisión para este Chat. Si se deshabilita la supervisión o su
vinculación de conexión almacenada deja de estar disponible o pasa a ser incoherente, el turno falla
de forma cerrada en lugar de trasladarse a una sesión normal del directorio de inicio del agente.

Deshabilitar o desinstalar el Plugin `codex` no libera esa propiedad ni
hace que el Chat pueda utilizar otro modelo. El Chat bloqueado se conserva, pero
no está disponible; reinstala o vuelve a habilitar el mismo Plugin y reinicia el Gateway para
reanudarlo. Este comportamiento deliberadamente cerrado ante fallos evita que la limpieza de retención o una
interrupción temporal del Plugin deje huérfana silenciosamente la vinculación nativa.

La herramienta de agente `codex_threads` sigue el mismo límite. No puede adjuntar una
bifurcación distinta ni archivar el hilo nativo vinculado al Chat. Las lecturas de lista y solo metadatos
siguen disponibles. Las lecturas de transcripciones sin procesar requieren `allowRawTranscripts`.
Cuando el acceso sin procesar está deshabilitado, `codex_threads` también rechaza la búsqueda en listas porque
la búsqueda nativa incluye vistas previas de transcripciones; la interfaz de control y la CLI del operador
siguen proporcionando una búsqueda acotada solo por título. El cambio de nombre, la desarchivación, la bifurcación independiente y
el archivado de un hilo no relacionado y sin propietario requieren
`allowWriteControls`. Ninguna opción elude la vinculación bloqueada.

OpenClaw no se suscribe a solicitudes de aprobación ni las responde mientras solo
enumera el hilo de origen o muestra el Chat pendiente. Iniciar un hilo canónico
distinto del arnés en el primer turno permite que otro proceso de Codex siga siendo propietario del
origen sin crear escritores de ejecución que compitan entre sí.

El origen original de la CLI, VS Code, Atlas o ChatGPT sigue siendo visible para los clientes
nativos y el catálogo de OpenClaw. La rama canónica se almacena como un hilo nativo
de Codex, pero su tipo de origen es `appServer`; Codex Desktop u otro
cliente nativo puede filtrar ese tipo de origen, por lo que no se garantiza que la propia rama
aparezca en todas las vistas del historial nativo.

Una fila activa notificada por App Server de OpenClaw no puede iniciar una rama nueva. Espera
a que finalice el turno actual y actualiza el catálogo. Codex App Server
serializa las mutaciones dentro de un proceso, pero no proporciona un ejecutor exclusivo
entre procesos ni un arrendamiento del propietario de las aprobaciones.

Para una fila **Almacenada / actividad desconocida**, el espejo del Chat y la fijación de la instantánea
del primer turno utilizan el estado de Codex hasta el último turno terminal conservado. El hilo de
origen no se reanuda, interrumpe ni archiva. Si otro proceso tiene un
turno en curso, es posible que su trabajo más reciente aún en ejecución no esté presente en la rama.

## Archivar una sesión local

Selecciona **Archivar** en una fila almacenada o inactiva local del Gateway y, a continuación, confirma que ningún
otro cliente de Codex ni ejecutor de OpenClaw utiliza ese hilo ni sus descendientes
generados. OpenClaw vuelve a leer el estado local del proceso, continúa solo para
`idle` o `notLoaded`, llama a la operación nativa de archivado de Codex y elimina la
sesión de la lista de elementos no archivados. Codex nativo también intenta archivar los
descendientes generados por el hilo.

El archivado no está disponible cuando la nueva lectura indica que la sesión está activa o en
estado de error, cuando pertenece a un nodo emparejado o mientras un Chat supervisado
recién creado aún tiene pendiente una rama de ese origen. Envía el primer mensaje del Chat
para materializar su rama canónica antes de archivar el origen.
El archivado también se bloquea cuando OpenClaw sabe que una vinculación activa posee el
hilo de destino exacto o cualquier descendiente generado que no esté archivado. OpenClaw sigue la
consulta experimental de descendientes de Codex a través de todas las páginas; una respuesta no válida,
un fallo de solicitud, un cursor o hilo repetido, o el agotamiento del límite de seguridad hacen que se rechace
el archivado.

Las solicitudes de lectura, enumeración de descendientes y archivado no constituyen una única operación
condicional, por lo que aún puede comenzar un turno entre ellas. El estado de App Server tampoco
se comparte entre procesos independientes. Por tanto, la confirmación es el
límite de seguridad frente a clientes desconocidos y esa condición de carrera: cierra o verifica de otro modo
todos los demás clientes antes de confirmar. Restaura un hilo archivado con Codex
Desktop, la CLI de Codex o un flujo nativo de administración de hilos autorizado por el propietario;
volverá a aparecer después de desarchivarlo.

```bash
codex unarchive <thread-id>
```

## Comprender los límites de los nodos emparejados

Los nodos emparejados exponen los comandos de solo lectura con versión
`codex.appServer.threads.list.v1` y
`codex.appServer.thread.turns.list.v1`. Los hosts de nodos nativos que tienen disponible la
CLI de Codex también exponen el comando incluido en la lista de permitidos `codex.terminal.resume.v1`.
El Gateway recibe metadatos normalizados y páginas acotadas de transcripciones solicitadas
explícitamente, nunca endpoints sin procesar de App Server. Al abrir una fila en el terminal del operador se ejecuta `codex resume <thread-id>`
en el host propietario y se retransmite la PTY de ese comando; no se expone un shell general
ni argumentos argv proporcionados por el Gateway.

La retransmisión del terminal no proporciona los contratos de continuación del arnés ni de propiedad
del archivado. Por tanto, las filas remotas siguen visibles, pero no ofrecen **Continuar** ni
**Archivar**, incluso cuando el hilo remoto está inactivo. Usa Codex en ese equipo
mediante **Abrir en terminal**, o utiliza un futuro flujo de continuación con un límite seguro
de propiedad del ejecutor.

## Metadatos y permisos

Las filas del catálogo pueden incluir:

- identificadores de hilo y sesión
- título y directorio de trabajo
- estado actual e indicadores de espera activa
- marcas de tiempo de creación, actualización y actividad
- origen, proveedor del modelo, versión de la CLI de Codex y rama de Git

La proyección del catálogo excluye las vistas previas de transcripciones, los turnos, las rutas de ejecución,
la ruta del directorio de inicio de Codex, los remotos de Git, los SHA de commits y los errores sin procesar de App Server. El acceso
al catálogo y las lecturas de transcripciones de la interfaz de control requieren el ámbito `operator.write` del Gateway
porque la agregación de la flota utiliza la ruta estándar `node.invoke`, aunque
ambos comandos de nodo son de solo lectura.

`supervision.allowRawTranscripts` y `supervision.allowWriteControls` controlan
las herramientas de agentes autónomos y MCP independientes. Ambos tienen como valor predeterminado `false`. Con
la supervisión habilitada, `codex_threads` elimina las vistas previas de transcripciones y los turnos de
los resultados de lista y lectura de solo metadatos, a menos que se permitan transcripciones sin procesar; una
lectura que incluya turnos falla de forma cerrada. Cada bifurcación, cambio de nombre, archivado y desarchivado
requiere controles de escritura. Estas opciones no restringen la visualización autenticada de transcripciones en la interfaz de control
ni eluden las comprobaciones de vinculación, host, estado o confirmación.

### Herramientas de compatibilidad

El Plugin oficial `codex` conserva los cinco nombres de herramientas de Supervisor distribuidos para
los clientes existentes de agentes y MCP independientes:

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` utiliza de forma predeterminada solo los elementos cargados; no existe el parámetro `loaded_only`.
Establece `include_stored: true` para leer también las filas almacenadas y no archivadas de
la base de datos de estado de Codex. El límite opcional `max_stored_sessions` tiene un valor predeterminado de 200
y acepta entre 1 y 1,000 filas por endpoint. No limita las filas cargadas.
Sin permiso para transcripciones sin procesar, los resultados de la lista omiten los nombres derivados de transcripciones,
las vistas previas y los errores detallados de endpoints.
`codex_session_read` requiere `allowRawTranscripts`; `include_turns: true`
también solicita turnos a Codex.

`codex_session_send` y `codex_session_interrupt` requieren
`allowWriteControls`. El envío acepta `mode: "auto" | "start" | "steer"`, pero
`"start"` siempre se rechaza, y tanto `"auto"` como `"steer"` solo pueden dirigir un
turno activo legible. Un hilo inactivo se rechaza con indicaciones para usar **Sesiones de Codex**,
donde el arnés completo instala los controladores de aprobación y herramientas antes
de continuar. La interrupción también requiere un turno activo legible. Estas herramientas
no reanudan ni inician un hilo de origen inactivo.

`openclaw doctor --fix` traslada una entrada retirada `codex-supervisor`, sus campos de endpoint
y permisos, y las referencias de política de permitir/denegar Plugins al Plugin oficial
`codex` sin sobrescribir la configuración canónica explícita. El adaptador de compatibilidad
MCP independiente sigue cargando las mismas cinco herramientas desde ese
Plugin; las variables de entorno de políticas heredadas solo se aplican dentro de ese adaptador
de confianza.

Para conocer todos los campos de configuración de supervisión, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference#supervision).

## Solución de problemas

**No aparece ninguna sesión:** verifica que `@openclaw/codex` esté instalado, que tanto el
Plugin como `supervision.enabled` sean true, que la lista de Plugins permitidos actual permita
`codex` y que las sesiones no estén archivadas. Reinicia el Gateway o el nodo después
de cambiar la activación.

**Continuar está deshabilitado:** una fila sin asignar está activa, pertenece a un nodo emparejado,
su host está desconectado o hay otra acción pendiente. Las filas almacenadas e inactivas locales del Gateway
ofrecen **Continuar como rama** en lugar de una toma de control insegura del hilo exacto. Una fila
que ya tiene un Chat supervisado ofrece **Abrir Chat**.

**Archivar está deshabilitado:** el archivado está disponible para filas almacenadas/con actividad desconocida e
inactivas locales del Gateway después de confirmar que no hay otro ejecutor. Las filas activas, con errores,
desconectadas, de nodos emparejados, con ramas pendientes y con un propietario conocido de la vinculación exacta siguen
siendo de solo lectura para el archivado.

**Ha desaparecido una sesión archivada:** es el comportamiento esperado. La página de supervisión no tiene
una vista de elementos archivados. Ejecuta `codex unarchive <thread-id>` o usa Codex Desktop para mostrarla
de nuevo.

**Permanece la configuración antigua de `codex-supervisor`:** ejecuta `openclaw doctor --fix`. Doctor
traslada la entrada retirada del Plugin y las referencias relacionadas de políticas de Plugins a
`plugins.entries.codex.config.supervision` sin sobrescribir la configuración explícita de Codex.

## Temas relacionados

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Arquitectura de supervisión de Codex](/es/specs/codex-supervision)
- [Nodos](/es/nodes)
- [Seguridad del Gateway](/es/gateway/security)
