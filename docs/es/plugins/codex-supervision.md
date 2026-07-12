---
read_when:
    - Quieres que las sesiones de Codex Desktop o de la CLI aparezcan en OpenClaw
    - Necesita crear una rama a partir de una sesión local de Codex almacenada o inactiva, o archivarla.
    - Estás exponiendo las sesiones de Codex y el historial de transcripciones de los nodos emparejados
sidebarTitle: Codex supervision
summary: Explora sesiones nativas de Codex no archivadas y transcripciones paginadas en los nodos de OpenClaw
title: Supervisar sesiones de Codex
x-i18n:
    generated_at: "2026-07-12T14:43:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e9378214df3f400b793b4a2c7bd91fb607a73910d4046f69d26debe308869df6
    source_path: plugins/codex-supervision.md
    workflow: 16
---

La supervisión de Codex es una capacidad opcional del Plugin oficial `codex`. Muestra
las sesiones de origen no archivadas de Codex Desktop y la CLI del equipo del Gateway
y de los equipos emparejados que hayan habilitado esta opción en la barra lateral habitual de sesiones y en el panel Chat.

La versión inicial mantiene deliberadamente un ámbito de responsabilidad limitado:

- Una sesión local almacenada o inactiva puede crear un Chat de OpenClaw bloqueado al modelo a partir
  de su historial persistente y acotado de usuario y asistente. El primer mensaje inicia una
  bifurcación de instantánea nativa y, a continuación, inicia el hilo completo del entorno de Codex exactamente
  con el modelo y el proveedor que Codex App Server seleccionó para esa bifurcación. Los turnos
  posteriores restauran el par persistente del hilo nativo canónico, mientras que la
  vinculación supervisada impide que OpenClaw sustituya el entorno de ejecución,
  el modelo o el mecanismo alternativo por otros. Un control nativo de Codex independiente puede seguir cambiando ese
  par persistente. Una rama ya creada abre su Chat existente.
- Una sesión almacenada detectada desde otro proceso de Codex tiene una actividad
  en curso desconocida. Puede bifurcarse o archivarse únicamente después de que el operador
  confirme que ningún otro cliente de Codex la está utilizando.
- Un origen activo permanece visible, pero no puede crear una rama ni archivarse hasta que
  finalice su turno actual. Si ya tiene un Chat supervisado, **Abrir Chat**
  sigue disponible.
- Una sesión en un Node emparejado expone su transcripción persistente mediante lecturas acotadas
  y paginadas por cursor de App Server. La continuación remota
  requiere un futuro puente de Node con transmisión continua; el archivado remoto también requiere
  un arrendamiento de propiedad del ejecutor o un mecanismo de aislamiento equivalente.
- Las sesiones archivadas no aparecen en la lista. Una sesión local almacenada o inactiva solo puede
  archivarse después de que el operador confirme que ningún otro cliente de Codex la está utilizando.

## Antes de comenzar

- Instale el Plugin oficial `@openclaw/codex` en el Gateway. La aplicación de OpenClaw
  para macOS puede instalarlo al habilitar las funciones de Codex; las instalaciones mediante la CLI pueden
  ejecutar `openclaw plugins install @openclaw/codex`.
- Instale e inicie sesión en Codex Desktop o la CLI de Codex en cada equipo cuyas
  sesiones desee mostrar.
- Empareje los equipos remotos como Nodes de OpenClaw. Cada equipo debe habilitar esta opción localmente;
  habilitar la supervisión únicamente en el Gateway no autoriza a otro Node.
- Utilice un Gateway controlado por el propietario. Los títulos de las sesiones, los directorios de trabajo y las ramas de Git
  pueden revelar información confidencial del proyecto.

## Habilitar la supervisión

La configuración guiada de `openclaw onboard` y la configuración inicial de macOS intentan instalar y
habilitar la supervisión de Codex después de detectar una instalación nativa de Codex y
activar correctamente el backend de inferencia seleccionado. No es necesario que Codex sea
el backend principal. La supervisión pasa a estar disponible cuando esa activación oportunista
del Plugin se completa correctamente. La disponibilidad de App Server se comprueba cuando
la supervisión se conecta por primera vez. La deshabilitación explícita del Plugin de Codex o un bloqueo de política
impiden la activación oportunista, y una configuración explícita existente
`supervision.enabled: false` deshabilita las herramientas de supervisión orientadas al agente; el
catálogo del operador permanece registrado siempre que el Plugin de Codex esté activo.
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

Si no hay una configuración de conexión explícita de `appServer`, la supervisión utiliza una conexión de supervisión
stdio administrada e independiente con el directorio principal nativo del usuario de Codex. El
entorno habitual de Codex permanece limitado al agente de forma predeterminada. Esto hace que las sesiones
nativas sean visibles en ambas aplicaciones sin que los turnos habituales de OpenClaw compartan
el estado nativo de Codex. Establezca explícitamente `appServer.homeScope: "user"` si el entorno
también debe compartir ese estado. La supervisión respeta la configuración de conexión explícita de `appServer`
en lugar de sustituirla por su valor predeterminado del directorio principal del usuario local.

Un Chat adoptado desde el grupo **Codex** de la barra lateral no es una sesión habitual del entorno.
Su vinculación privada de supervisión utiliza la conexión de supervisión para las lecturas del origen,
la creación de ramas canónicas, la inserción del historial y todos los turnos posteriores. Con
la conexión local predeterminada, esto conserva el directorio principal nativo del usuario de Codex, la autenticación
y la configuración del proveedor sin cambiar el valor predeterminado de las demás sesiones.

Para la conexión de supervisión local predeterminada, el almacén se comparte con los clientes
nativos de Codex. OpenClaw no presupone que otro cliente comparta el mismo proceso activo de
App Server, y la propiedad del estado nativo es local al proceso. Por tanto,
trata un hilo que su App Server de supervisión presenta como `notLoaded` como
**Almacenado / actividad desconocida**, no como inactivo.

Aplique la misma habilitación opcional en cada host de Node sin interfaz cuyas sesiones deban aparecer.
La aplicación nativa de OpenClaw para macOS lee la misma configuración local cuando anuncia
su catálogo de Codex al Gateway emparejado. Ese catálogo del Mac nativo emparejado admite
únicamente la configuración predeterminada o `appServer.transport: "stdio"` explícito con
`appServer.homeScope: "user"` sin establecer o explícito. `command`, `args` y `clearEnv` se
respetan para ese proceso stdio. Si la configuración del Mac selecciona `"unix"`,
`"websocket"` o `homeScope: "agent"`, la aplicación no anuncia la capacidad
ni el comando del catálogo, y una invocación directa obsoleta falla en lugar de exponer
el directorio principal del usuario de Codex o iniciar un App Server stdio local diferente.

Un comando de Node anunciado recientemente cambia la superficie de comandos aprobada del Node.
Apruebe la actualización desde el host del Gateway:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Las sesiones de Codex no archivadas también aparecen en la barra lateral principal de la interfaz de control, agrupadas
por host. Seleccione una para leer su transcripción persistente. El visor utiliza la API más reciente de
Codex `thread/turns/list` con `itemsView: "full"` y carga como máximo 20 turnos
por solicitud; **Cargar elementos anteriores de la transcripción** sigue el cursor opaco de App Server de la página más reciente.
Las páginas cargadas se muestran en orden cronológico. El visor nunca carga un historial
`thread/read` sin límites. Una página que supere el límite máximo de seguridad de transporte de 20 MiB
falla de forma cerrada en lugar de poner en riesgo la conexión del Node o el Gateway.

Abra el grupo **Codex** en la barra lateral habitual de sesiones. Muestra las mismas sesiones
agrupadas por host. **Cargar más sesiones** agrega la página siguiente de cada host que
tenga filas anteriores, y esas filas agregadas se conservan durante la actualización periódica de la barra lateral.
Cada página de búsqueda devuelta examina un número limitado de páginas nativas por host, en lugar
de enviar la consulta a App Server, porque la búsqueda nativa también puede encontrar coincidencias
en las vistas previas de las transcripciones.

La disponibilidad del host y el estado del hilo son conceptos distintos. **Sin conexión** o **No disponible**
describe una actualización del host; un host no disponible no devuelve filas de sesión nuevas ni
cambia el estado nativo de un hilo a `offline`. Las filas de sesión utilizan estados de Codex
como `idle`, `active`, `notLoaded` o error. Un host con errores no
oculta los resultados de los hosts operativos.

## Usar la CLI del operador

La CLI del terminal expone el mismo catálogo de elementos no archivados y las acciones locales del Gateway
para crear ramas y archivar:

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Opciones de `openclaw codex sessions`:

- `--search <text>` busca títulos de sesiones sin distinguir entre mayúsculas y minúsculas.
- `--host <id>` limita la respuesta a un único host estable del catálogo, como
  `gateway:local` o `node:<node-id>`.
- `--limit <count>` establece entre 1 y 100 filas por host; el valor predeterminado es 50.
- `--cursor <cursor>` continúa una página de un host y, por tanto, requiere `--host`.
- `--json` imprime la respuesta estructurada del Gateway.

Los tres comandos heredan `--url`, `--token` y `--timeout <ms>` del
cliente del Gateway. El listado de sesiones utiliza de forma predeterminada 75,000 ms para que los catálogos
de nodos emparejados que aún no se han iniciado puedan completarse; las acciones de continuar y archivar usan de forma predeterminada 30,000 ms. También exponen el modificador compartido
`--expect-final`, que no cambia estas RPC unarias de supervisión.
Cada comando requiere el ámbito `operator.write` del Gateway.
La salida estándar de `-h, --help` está disponible en cada subcomando.
No existe ninguna opción para elementos archivados ni para incluirlos. `sessions` puede mostrar hosts
emparejados, pero `continue` y `archive` siempre se dirigen a `gateway:local`; las filas emparejadas
solo pueden consultarse. Archivar siempre requiere `--confirm-no-other-runner`.

Estos comandos del shell son distintos de los comandos de tiempo de ejecución `/codex` del chat.
`/codex threads [filter]` muestra los hilos de App Server disponibles para la conexión de la
conversación actual. `/codex sessions --host <node>` muestra archivos de sesión reanudables de la CLI de Codex
en un Node, no el catálogo de la flota de supervisión. `/codex
resume` y `/codex bind` vinculan la conversación actual en lugar de crear una
rama supervisada segura, y un Chat supervisado bloqueado a un modelo rechaza esas
mutaciones de vinculación. No existe ningún comando de tiempo de ejecución
`/codex continue` ni `/codex archive`.

## Crear una rama desde una sesión local

Elija **Continuar como rama** en una fila almacenada o inactiva del equipo del Gateway.
OpenClaw crea una entrada normal de Chat, refleja un historial limitado del usuario y del asistente
hasta el último turno terminal persistido de la fuente (completado, interrumpido o
con errores), registra una rama pendiente del entorno de ejecución y abre el Chat. El selector genérico de modelos
queda bloqueado, pero aún no se ha seleccionado ningún modelo ni proveedor concreto. La
fuente no se reanuda y el hilo canónico del entorno de ejecución aún no se inicia.
Al repetir la acción, se abre el Chat existente en lugar de crear otra
rama.

El reflejo conserva la parte visible más reciente que se ajuste a los tres límites: como máximo 200
mensajes del usuario o del asistente, 512 KiB de texto UTF-8 en total y 64 KiB por
mensaje. Los mensajes que superan el tamaño se truncan con un marcador y los mensajes más antiguos se
omiten cuando se alcanza un límite. Una entrada de imagen o imagen local se convierte en el marcador de posición literal
`[Image attachment]`; los datos de la imagen y las rutas locales no se copian.

Envíe el primer mensaje normal de Chat para comenzar a trabajar. El entorno de ejecución de Codex instala los
controladores reales de aprobación, obtención de información, eventos y entrega. Utiliza una bifurcación
nativa temporal en la conexión de supervisión para fijar la instantánea de la fuente sin
proporcionar una sustitución del modelo ni del proveedor. Codex App Server selecciona ambos a partir de su
configuración nativa actual y devuelve la selección real. En esa misma
conexión, OpenClaw inicia el hilo completo canónico del entorno de ejecución cuyo origen es `appServer`
conforme a su cwd y su política de tiempo de ejecución, exactamente con ese par devuelto, inyecta el
historial visible limitado y archiva la bifurcación temporal. El hilo canónico
dispone de toda la superficie de herramientas del entorno de ejecución de OpenClaw. Esta es una rama del historial visible, no
un clon completo de la ejecución nativa: se omiten el razonamiento, las llamadas a herramientas y los resultados
de las herramientas de la fuente. Este turno y todos los posteriores permanecen en la conexión supervisada de Codex,
en lugar de usar otro tiempo de ejecución de modelos de OpenClaw o el entorno de ejecución habitual del directorio de inicio del agente.

La selección devuelta no demuestra cuál era el modelo histórico de la fuente. Si la
configuración nativa actual difiere del modelo registrado en el último turno de la fuente,
Codex emite su advertencia habitual de diferencia de modelo. OpenClaw utiliza el
par devuelto para iniciar el hilo canónico. Codex persiste el modelo y el proveedor nativos
de ese hilo canónico, y las reanudaciones posteriores los conservan porque
OpenClaw omite las sustituciones del modelo y del proveedor. Si el hilo canónico se modifica
mediante un control nativo independiente de Codex, OpenClaw acepta la selección persistida de
Codex. OpenClaw nunca la sustituye por su modelo externo ni por su cadena de alternativas.

El Chat supervisado bloqueado a un modelo no se puede eliminar, cambiar de modelo, usar `/new`
o `/reset`, invocar la acción de restablecimiento de sesión del Gateway ni usar la acción genérica
**Bifurcar sesión**. También se rechazan las operaciones de modificación `/codex model <model>`, `/codex
bind`, `/codex resume` (incluida una sesión de nodo con `--bind here`) y
`/codex detach` o `/codex unbind`, porque reemplazarían o borrarían la vinculación
nativa bloqueada. La consulta `/codex model` y `/codex fast`,
`/codex permissions` y `/codex threads` siguen disponibles. Inicie otra
sesión normal cuando desee otro modelo o un hilo nuevo.

Mantenga habilitada la supervisión para este Chat. Si se deshabilita la supervisión o su
vinculación de conexión almacenada deja de estar disponible o se vuelve incoherente, el turno se
bloquea de forma segura en lugar de trasladarse a una sesión normal del directorio principal del agente.

Deshabilitar o desinstalar el plugin `codex` no libera esa propiedad ni
hace que el Chat pueda usar otro modelo. El Chat bloqueado se conserva, pero
no está disponible; reinstale o vuelva a habilitar el mismo plugin y reinicie el Gateway para
reanudarlo. Este comportamiento deliberado de bloqueo seguro evita que la limpieza por retención o una
interrupción temporal del plugin deje huérfana silenciosamente la vinculación nativa.

La herramienta de agente `codex_threads` sigue el mismo límite. No puede adjuntar una
bifurcación diferente ni archivar el hilo nativo vinculado al Chat. La lista y la lectura
exclusiva de metadatos siguen disponibles. Las lecturas de transcripciones sin procesar requieren `allowRawTranscripts`.
Cuando el acceso sin procesar está deshabilitado, `codex_threads` también rechaza la búsqueda en listas porque
la búsqueda nativa incluye vistas previas de las transcripciones; la interfaz de control y la CLI del operador
siguen proporcionando una búsqueda limitada únicamente a títulos. Cambiar el nombre, desarchivar, realizar una bifurcación separada y
archivar un hilo no relacionado y sin propietario requieren
`allowWriteControls`. Ninguna de las opciones elude la vinculación bloqueada.

OpenClaw no se suscribe a solicitudes de aprobación ni las responde mientras solo enumera
el hilo de origen o muestra el Chat pendiente. Iniciar un hilo canónico distinto
del entorno en el primer turno permite que otro proceso de Codex siga siendo propietario del
origen sin crear escritores de ejecución en competencia.

El origen original de la CLI o VS Code sigue siendo visible para los clientes nativos y el
catálogo de OpenClaw. La rama canónica se almacena como un hilo nativo de Codex, pero
su tipo de origen es `appServer`; Codex Desktop u otro cliente nativo puede filtrar
ese tipo de origen, por lo que no se garantiza que la propia rama aparezca en todas las
vistas del historial nativo.

Una fila activa informada por el servidor de aplicaciones de OpenClaw no puede iniciar una rama nueva. Espere
a que termine el turno actual y actualice el catálogo. Codex App Server
serializa las modificaciones dentro de un proceso, pero no proporciona un ejecutor exclusivo
entre procesos ni un arrendamiento del propietario de las aprobaciones.

Para una fila **Almacenada / actividad desconocida**, el reflejo del Chat y la instantánea
fijada del primer turno usan el estado de Codex hasta el último turno terminal persistido. El hilo de
origen no se reanuda, interrumpe ni archiva. Si otro proceso tiene un turno
en curso, es posible que su trabajo en ejecución más reciente no esté presente en la rama.

## Archivar una sesión local

Elija **Archivar** en una fila local del Gateway almacenada o inactiva y, después, confirme que ningún
otro cliente de Codex ni ejecutor de OpenClaw esté usando ese hilo o sus
descendientes generados. OpenClaw vuelve a leer el estado local del proceso, continúa únicamente si es
`idle` o `notLoaded`, llama a la operación nativa de archivado de Codex y elimina la
sesión de la lista de elementos no archivados. Codex nativo también intenta archivar los
descendientes generados del hilo.

El archivado no está disponible cuando la lectura nueva indica que la sesión está activa o en
estado de error, cuando pertenece a un nodo emparejado o mientras un Chat supervisado
recién creado aún tenga pendiente una rama procedente de ese origen. Envíe el primer mensaje del Chat
para materializar su rama canónica antes de archivar el origen.
El archivado también se bloquea cuando OpenClaw sabe que una vinculación activa posee el
hilo de destino exacto o cualquier descendiente generado no archivado. OpenClaw sigue la
consulta experimental de descendientes de Codex a través de todas las páginas; una respuesta no válida,
un error de solicitud, un cursor o hilo repetido, o el agotamiento del límite de seguridad
hacen que se rechace el archivado.

Las solicitudes de lectura, enumeración de descendientes y archivado no constituyen una única operación
condicional, por lo que aún puede iniciarse un turno entre ellas. El estado del servidor de aplicaciones tampoco
se comparte entre procesos independientes. Por lo tanto, la confirmación es el
límite de seguridad para clientes desconocidos y para esa condición de carrera: cierre o verifique de otro modo
todos los demás clientes antes de confirmar. Restaure un hilo archivado con Codex
Desktop, la CLI de Codex o un flujo nativo de administración de hilos autorizado por el propietario;
volverá a aparecer después de desarchivarlo.

```bash
codex unarchive <thread-id>
```

## Comprender los límites de los nodos emparejados

Los nodos emparejados exponen los comandos versionados de solo lectura
`codex.appServer.threads.list.v1` y
`codex.appServer.thread.turns.list.v1`. El Gateway recibe metadatos normalizados
y páginas limitadas de transcripciones solicitadas explícitamente, nunca endpoints sin procesar del servidor de aplicaciones.
El transporte actual de invocación de nodos es solo de solicitud/respuesta, por lo que no puede transportar
el ciclo de vida prolongado de eventos, aprobaciones y transmisión requerido por el entorno de Codex.

Por ese motivo, las filas remotas siguen visibles, pero no ofrecen **Continuar** ni
**Archivar**, incluso cuando el hilo remoto está inactivo. Use Codex en ese equipo
hasta que exista un puente ejecutor de transmisión en el nodo para la continuación y un
límite seguro de propiedad del ejecutor para el archivado.

## Metadatos y permisos

Las filas del catálogo pueden incluir:

- identificadores de hilo y sesión
- título y directorio de trabajo
- estado actual e indicadores de espera activa
- marcas de tiempo de creación, actualización y actividad
- origen, proveedor del modelo, versión de la CLI de Codex y rama de Git

La proyección del catálogo excluye las vistas previas de transcripciones, los turnos, las rutas de ejecución,
la ruta del directorio principal de Codex, los remotos de Git, los SHA de confirmaciones y los errores sin procesar del servidor de aplicaciones. El acceso al catálogo
y las lecturas de transcripciones de la interfaz de control requieren el ámbito `operator.write` del Gateway
porque la agregación de la flota usa la ruta estándar `node.invoke`, aunque
ambos comandos de nodo sean de solo lectura.

`supervision.allowRawTranscripts` y `supervision.allowWriteControls` controlan
las herramientas autónomas de agentes y las herramientas MCP independientes. Ambas tienen como valor predeterminado `false`. Con
la supervisión habilitada, `codex_threads` elimina las vistas previas y los turnos de las transcripciones de
los resultados de lista y lectura exclusiva de metadatos, salvo que se permitan las transcripciones sin procesar;
una lectura que incluya turnos se bloquea de forma segura. Cada bifurcación, cambio de nombre, archivado y desarchivado
requiere controles de escritura. Estas opciones no restringen la visualización autenticada de transcripciones en la interfaz de control
ni eluden las comprobaciones de vinculación, host, estado o confirmación.

### Herramientas de compatibilidad

El plugin oficial `codex` conserva los cinco nombres de herramientas de Supervisor publicados para
los clientes existentes de agentes y MCP independientes:

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

De forma predeterminada, `codex_sessions_list` solo incluye elementos cargados; no existe ningún parámetro `loaded_only`.
Establezca `include_stored: true` para leer también las filas almacenadas y no archivadas de la
base de datos de estado de Codex. El límite opcional `max_stored_sessions` tiene como valor predeterminado 200
y acepta de 1 a 1,000 filas por endpoint. No limita las filas cargadas.
Sin permiso para transcripciones sin procesar, los resultados de la lista omiten nombres derivados de transcripciones,
vistas previas y errores detallados de endpoints.
`codex_session_read` requiere `allowRawTranscripts`; `include_turns: true`
también solicita los turnos a Codex.

`codex_session_send` y `codex_session_interrupt` requieren
`allowWriteControls`. El envío acepta `mode: "auto" | "start" | "steer"`, pero
`"start"` siempre se rechaza, y tanto `"auto"` como `"steer"` solo pueden dirigir un
turno activo legible. Un hilo inactivo se rechaza con indicaciones para usar **Sesiones de Codex**,
donde el entorno completo instala los controladores de aprobaciones y herramientas antes
de continuar. La interrupción también requiere un turno activo legible. Estas herramientas
no reanudan ni inician un hilo de origen inactivo.

`openclaw doctor --fix` traslada una entrada retirada `codex-supervisor`, sus campos de
endpoint y permisos, y las referencias de las políticas de autorización y denegación del plugin al plugin oficial
`codex` sin sobrescribir la configuración canónica explícita. El adaptador MCP de compatibilidad
independiente continúa cargando las mismas cinco herramientas desde ese
plugin; las variables de entorno de políticas heredadas solo se aplican dentro de ese adaptador
de confianza.

Para consultar todos los campos de configuración de supervisión, consulte
[Referencia del entorno de Codex](/es/plugins/codex-harness-reference#supervision).

## Solución de problemas

**No aparece ninguna sesión:** verifique que `@openclaw/codex` esté instalado, que tanto el
plugin como `supervision.enabled` sean verdaderos, que la lista actual de plugins permitidos admita
`codex` y que las sesiones no estén archivadas. Reinicie el Gateway o el nodo después
de cambiar la activación.

**Continuar está deshabilitado:** una fila sin asignar está activa, pertenece a un nodo emparejado,
su host está desconectado o hay otra acción pendiente. Las filas locales del Gateway almacenadas e inactivas
ofrecen **Continuar como rama** en lugar de una toma de control insegura del hilo exacto. Una fila
que ya tiene un Chat supervisado ofrece **Abrir Chat**.

**Archivar está deshabilitado:** el archivado está disponible para las filas locales del Gateway almacenadas/con actividad desconocida e
inactivas después de confirmar que no existe ningún otro ejecutor. Las filas activas, con errores,
desconectadas, de nodos emparejados, con ramas pendientes o con un propietario conocido de la vinculación exacta siguen
siendo de solo lectura para el archivado.

**Una sesión archivada desapareció:** este comportamiento es el esperado. La página de supervisión no tiene
una vista de elementos archivados. Ejecute `codex unarchive <thread-id>` o use Codex Desktop para
volver a mostrarla.

**La configuración antigua de `codex-supervisor` permanece:** ejecute `openclaw doctor --fix`. Doctor
traslada la entrada del plugin retirado y las referencias relacionadas de las políticas de plugins a
`plugins.entries.codex.config.supervision` sin sobrescribir la configuración explícita de Codex.

## Contenido relacionado

- [Entorno de Codex](/es/plugins/codex-harness)
- [Referencia del entorno de Codex](/es/plugins/codex-harness-reference)
- [Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime)
- [Arquitectura de supervisión de Codex](/specs/codex-supervision)
- [Nodos](/es/nodes)
- [Seguridad del Gateway](/es/gateway/security)
