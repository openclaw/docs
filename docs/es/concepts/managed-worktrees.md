---
read_when:
    - Se necesita una rama y un checkout aislados para una tarea de agente
    - Estás configurando tarjetas de Workboard con espacios de trabajo de worktree
    - Es necesario restaurar o limpiar un árbol de trabajo administrado por OpenClaw
summary: Ejecuta tareas de agentes en checkouts de git aislados con instantáneas y limpieza automáticas
title: Worktrees administrados
x-i18n:
    generated_at: "2026-07-22T10:30:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98ed2579b7243544dbdb550c4b8a292ccd4ab494fd4a45b2404256691c831401
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los worktrees gestionados proporcionan a una tarea de agente su propia rama y checkout de git sin colocar directorios temporales dentro del repositorio de origen. OpenClaw los crea en su directorio de estado, los registra en la base de datos de estado compartida y guarda una instantánea de su contenido con seguimiento y de su contenido sin seguimiento y no ignorado antes de eliminarlos.

## Diseño y nombres

Cada worktree se encuentra en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella digital del repositorio corresponde a los primeros 16 caracteres hexadecimales de un hash SHA-256 calculado sobre el directorio común canónico de git y la URL de origen. Un nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Si no se proporciona un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la referencia base solicitada. Sin una referencia base, obtiene `origin`, utiliza la rama predeterminada remota cuando está disponible y recurre a la rama local `HEAD` cuando el repositorio está sin conexión o no dispone de un remoto utilizable.

## Aprovisionamiento de archivos ignorados

Añada `.worktreeinclude` en la raíz del repositorio de origen para copiar determinados archivos ignorados y sin seguimiento en un worktree nuevo. El archivo utiliza la sintaxis de patrones de gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son aptos los archivos que git indica como ignorados y sin seguimiento. Los archivos con seguimiento ya están presentes mediante git y nunca se copian en este paso. OpenClaw no sobrescribe ni modifica los archivos de destino que ya existen, no sigue directorios enlazados simbólicamente y conserva los modos de los archivos copiados. Registra únicamente las rutas que realmente crea, por lo que las modificaciones posteriores del manifiesto no pueden hacer que esos archivos pierdan la protección durante la limpieza.

## Ejecución de la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de origen y es ejecutable, OpenClaw lo ejecuta con el worktree nuevo como directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Una salida distinta de cero cancela la creación y elimina el worktree y la rama nuevos. Este es un contrato local del repositorio; no existe ninguna clave de configuración de OpenClaw para él.

## Worktrees de sesión

Inicie un chat aislado desde una carpeta respaldada por Git con una sesión de worktree: en la página New session de la Control UI, utilice el selector **Place** para elegir una carpeta de origen del Gateway y, a continuación, seleccione **Worktree** (con una rama base y un nombre de worktree opcionales). La opción solo aparece después de que el Gateway confirme que la carpeta seleccionada es un checkout de Git; las carpetas normales se ejecutan directamente y no muestran ningún control de aislamiento de Git. iOS ofrece la misma opción desde Chat actions y Android la ofrece junto a New Chat cuando el espacio de trabajo del agente activo está respaldado por Git.

Los agentes de programación también pueden invocar `spawn_task` cuando detectan trabajo posterior confirmado fuera de la tarea actual. La Control UI muestra una ficha de sugerencia sin iniciar nada, mientras que una TUI respaldada por un Gateway muestra un mensaje interactivo con las mismas acciones. Al seleccionar **Start in worktree**, se crea un worktree nuevo propiedad de la sesión a partir del proyecto sugerido y se envía la instrucción autocontenida como su primer turno; descartar la sugerencia no modifica el repositorio. Las sugerencias y sus identificadores son efímeros y no sobreviven a un reinicio del Gateway.

OpenClaw expone estas herramientas únicamente a sesiones de operador con una interfaz de usuario del Gateway que permita actuar. Las sesiones de canal y las sesiones TUI locales o integradas no las reciben hasta que esas superficies dispongan de un contrato portátil y tipado de acciones de tareas.

El worktree gestionado resultante pertenece a la sesión y cada ejecución del agente en esa sesión utiliza su checkout. Cuando el espacio de trabajo es un subdirectorio del repositorio, el worktree se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación del worktree de sesión utiliza el ámbito `operator.write` del método, pero los hooks de checkout del repositorio y el paso `.openclaw/worktree-setup.sh` se ejecutan únicamente para los invocadores `operator.admin`, ya que ejecutan código del repositorio; el aprovisionamiento de `.worktreeinclude` se sigue aplicando a todos los invocadores. Al eliminar la sesión, el worktree solo se elimina si puede hacerse sin pérdidas. Los worktrees con cambios o las ramas con commits no enviados siguen disponibles; la limpieza cada hora crea instantáneas de los worktrees de sesión después de 7 días de inactividad y considera la actividad reciente de la sesión como actividad del worktree. Los worktrees eliminados pueden restaurarse desde sus instantáneas como se describe a continuación.

`sessions.create` puede incluir un `cwd` absoluto para ejecutarse directamente en otra carpeta del Gateway, elegir el checkout de origen junto con `worktree: true` o establecer el directorio de trabajo de un nodo emparejado. Toda ruta de host explícita requiere `operator.admin`; la creación normal de chats de worktree sigue siendo `operator.write` y permanece anclada al espacio de trabajo configurado.

`sessions.create` también acepta `worktreeBaseRef` y `worktreeName` junto con `worktree: true` para elegir la referencia base y el nombre del worktree (la rama pasa a ser `openclaw/<name>`); ambos permanecen en `operator.write`. El worktree creado se devuelve en el resultado de la creación y se conserva en la fila de la sesión como `worktree: { id, branch, repoRoot }`, de modo que las listas de sesiones puedan mostrar el checkout y la rama. Al eliminar una sesión, un checkout con cambios que se conserve se notifica como `worktreePreserved` en lugar de dejarlo atrás silenciosamente.

## Instantáneas, limpieza y restauración

La eliminación crea primero un commit sintético que contiene los archivos con seguimiento y los archivos sin seguimiento y no ignorados, y después lo fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados nunca entran en la base de datos de objetos del repositorio. OpenClaw almacena únicamente los archivos ignorados que realmente aprovisionó en filas fragmentadas de la base de datos de estado compartida; el conjunto de rutas registrado sigue siendo la fuente de autoridad incluso si `.worktreeinclude` cambia o desaparece posteriormente. La restauración lee esos bytes de la instantánea inmutable y vuelve a aplicar sus modos completos. La limpieza automática conserva un worktree activo cuando ya no es posible crear de forma segura una instantánea de una ruta registrada. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al finalizar la ejecución, elimina un worktree únicamente cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra commits sin enviar. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza cada hora crea instantáneas y elimina los worktrees desbloqueados pertenecientes a Workboard y a sesiones que lleven más de 7 días inactivos, incluso si tienen cambios. Los worktrees manuales nunca se eliminan automáticamente.
- Los registros de instantáneas pueden restaurarse durante 30 días. Después, la limpieza elimina la referencia de la instantánea y la fila del registro.
- Un bloqueo de un proceso activo de OpenClaw y cualquier bloqueo de worktree de git externo o no reconocido protegen un worktree frente a la recolección de elementos no utilizados.

La restauración vuelve a crear `openclaw/<name>` en el commit original anterior a la instantánea y, a continuación, reconstruye las diferencias de la instantánea como modificaciones sin preparar y archivos sin seguimiento. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La referencia de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Worktrees** de la Control UI, dentro de Settings, proporciona las mismas acciones, además de la creación con un selector de rama base; muestra el propietario de cada worktree (manual, Workboard o la sesión propietaria con un enlace a su chat) y ofrece un reintento forzado cuando una eliminación informa de un error al crear la instantánea.

## Métodos del Gateway

| Método               | Propósito                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Enumera los registros de worktrees activos y restaurables.                            |
| `worktrees.branches` | Enumera las ramas locales y remotas de un repositorio para los selectores de referencia base.    |
| `worktrees.create`   | Crea o reutiliza un worktree gestionado con nombre.                               |
| `worktrees.remove`   | Crea una instantánea de un worktree y lo elimina. Las eliminaciones forzadas notifican `snapshotError`. |
| `worktrees.restore`  | Restaura un worktree eliminado desde su instantánea.                           |
| `worktrees.gc`       | Ejecuta inmediatamente la limpieza por inactividad, elementos huérfanos y retención.                            |

`worktrees.list` requiere `operator.read`, y los métodos que realizan modificaciones requieren `operator.admin`. `worktrees.branches` necesita `operator.write` para los espacios de trabajo de agentes configurados, mientras que cualquier otra ruta de host requiere `operator.admin` (de acuerdo con el requisito de cwd de `sessions.create`). Solo lee las referencias existentes y nunca realiza una obtención; las ramas que solo existen en el remoto se devuelven calificadas con el remoto (`origin/feature-a`) para que cada nombre devuelto pueda resolverse como referencia base. New Session también puede solicitar a este método un estado tipado del repositorio; un directorio normal o un checkout no disponible no devuelve ninguna rama, en lugar de obligar a la interfaz de usuario a deducir la capacidad de Git a partir de una cadena de error.

## Espacios de trabajo de Workboard

El [Plugin Workboard](/es/plugins/workboard) incluido puede materializar el espacio de trabajo de una tarjeta como un worktree gestionado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica el checkout de git de origen. `branch` es opcional y se convierte en la referencia base. Para un invocador con acceso completo al host, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con el checkout gestionado como directorio de trabajo y escribe la ruta y la rama resueltas en la tarjeta. Los clientes del Gateway necesitan `operator.admin` para la materialización con acceso completo al host. Al finalizar la ejecución, Workboard elimina el checkout únicamente cuando se puede demostrar que no habrá pérdidas; el trabajo con cambios o los commits sin enviar siguen disponibles.

Para un invocador limitado al espacio de trabajo, `path` y la raíz del repositorio deben coincidir exactamente con el espacio de trabajo del agente de destino. A continuación, Workboard se ejecuta directamente en ese directorio y registra un espacio de trabajo de directorio en lugar de materializar un worktree gestionado en el host. El destino debe utilizar un sandbox de Docker escribible y no compartido para el mismo espacio de trabajo, el hash de su contenedor activo debe coincidir con los montajes y la política solicitados, y no debe exponer ejecución elevada, control del host, sesiones de ámbito global del host, ejecución persistente en el host o nodo, ni herramientas de Plugin y MCP sin clasificar. Si la política de destino o el contenedor activo tienen un ámbito más amplio, la asignación deja la tarjeta sin reclamar e informa del estado incompatible.
