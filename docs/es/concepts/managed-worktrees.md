---
read_when:
    - Se necesita una rama y un checkout aislados para una tarea de agente
    - Está configurando tarjetas de Workboard con espacios de trabajo de worktree
    - Necesita restaurar o limpiar un árbol de trabajo administrado por OpenClaw
summary: Ejecuta tareas de agentes en repositorios de trabajo de git aislados, con instantáneas y limpieza automáticas
title: Worktrees administrados
x-i18n:
    generated_at: "2026-07-20T00:47:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8541b95eb264950f6ff248da0a5c4ab5fa0881a90d5f782bc1e33edd0a0c5d2
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los worktrees administrados proporcionan a una tarea de agente su propia rama de git y su propio checkout sin colocar directorios temporales dentro del repositorio de origen. OpenClaw los crea en su directorio de estado, los registra en la base de datos de estado compartida y crea instantáneas de su contenido con seguimiento y de su contenido sin seguimiento no ignorado antes de eliminarlos.

## Diseño y nombres

Cada worktree se encuentra en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella digital del repositorio son los primeros 16 caracteres hexadecimales de un hash SHA-256 del directorio común canónico de git y la URL de origen. Un nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Sin un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la referencia base solicitada. Sin una referencia base, obtiene `origin`, usa la rama predeterminada remota cuando está disponible y recurre a `HEAD` local cuando el repositorio está sin conexión o no tiene ningún remoto utilizable.

## Aprovisionar archivos ignorados

Añada `.worktreeinclude` en la raíz del repositorio de origen para copiar determinados archivos ignorados y sin seguimiento a un worktree nuevo. El archivo usa la sintaxis de patrones de gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son aptos los archivos que git indica como ignorados y sin seguimiento. Los archivos con seguimiento ya están presentes mediante git y este paso nunca los copia. OpenClaw no sobrescribe ni modifica los archivos de destino que ya existen, no sigue directorios de enlaces simbólicos y conserva los modos de los archivos copiados. Solo registra las rutas que realmente crea, por lo que las modificaciones posteriores del manifiesto no pueden hacer que esos archivos pierdan la protección durante la limpieza.

## Ejecutar la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de origen y es ejecutable, OpenClaw lo ejecuta con el nuevo worktree como directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Una salida distinta de cero cancela la creación y elimina el nuevo worktree y la rama. Este es un contrato local del repositorio; no existe ninguna clave de configuración de OpenClaw para él.

## Worktrees de sesión

Inicie un chat aislado desde el espacio de trabajo git del agente activo con una sesión respaldada por un worktree: habilite **Worktree** en la página New session de la Control UI (que también ofrece un selector de rama base y un nombre opcional para el worktree), o use el menú Chat actions en iOS o la acción de desbordamiento junto a New Chat en Android. La opción solo está disponible para un agente respaldado por git cuando el cliente tiene esa capacidad; los clientes que no pueden realizar la comprobación previa muestran en su lugar el error del Gateway.

Los agentes de programación también pueden llamar a `spawn_task` cuando detectan trabajo de seguimiento confirmado fuera de la tarea actual. La Control UI muestra una sugerencia sin iniciar nada, mientras que una TUI respaldada por el Gateway muestra una indicación interactiva con las mismas acciones. Al seleccionar **Start in worktree**, se crea un worktree nuevo propiedad de la sesión a partir del proyecto sugerido y se envía la indicación autocontenida como su primer turno; descartar la sugerencia deja el repositorio intacto. Las sugerencias y sus identificadores son efímeros y no sobreviven a un reinicio del Gateway.

OpenClaw expone estas herramientas solo a las sesiones de operador con una interfaz de usuario del Gateway que permita actuar. Las sesiones de canal y las sesiones de TUI locales o integradas no las reciben hasta que esas superficies dispongan de un contrato portátil y tipado de acciones de tarea.

El worktree administrado resultante pertenece a la sesión, y cada ejecución del agente en esa sesión usa su checkout. Cuando el espacio de trabajo es un subdirectorio del repositorio, el worktree se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación de worktrees de sesión usa el ámbito `operator.write` del método, pero los hooks de checkout del repositorio y el paso `.openclaw/worktree-setup.sh` se ejecutan solo para los llamadores `operator.admin`, porque ejecutan código del repositorio; el aprovisionamiento `.worktreeinclude` sigue aplicándose a todos los llamadores. Al eliminar la sesión, el worktree solo se elimina cuando hacerlo no provoca pérdidas. Los worktrees con cambios o las ramas con commits no enviados permanecen disponibles; la limpieza horaria crea instantáneas de los worktrees de sesión después de 7 días de inactividad, considerando la actividad reciente de la sesión como actividad del worktree. Los worktrees eliminados se pueden restaurar a partir de sus instantáneas como se describe a continuación.

`sessions.create` puede incluir una ruta `cwd` absoluta junto con `worktree: true` cuando una tarea se dirige a un proyecto distinto del espacio de trabajo configurado del agente. Esa ruta explícita del host requiere `operator.admin`; la creación ordinaria de chats con worktree sigue siendo `operator.write` y permanece anclada al espacio de trabajo configurado.

`sessions.create` también acepta `worktreeBaseRef` y `worktreeName` junto con `worktree: true` para elegir la referencia base y el nombre del worktree (la rama pasa a ser `openclaw/<name>`); ambos permanecen en `operator.write`. El worktree creado se devuelve en el resultado de creación y se conserva en la fila de la sesión como `worktree: { id, branch, repoRoot }`, de modo que las listas de sesiones puedan mostrar el checkout y la rama. Al eliminar una sesión, un checkout con cambios conservado se notifica como `worktreePreserved` en lugar de dejarlo atrás silenciosamente.

## Instantáneas, limpieza y restauración

La eliminación crea primero un commit sintético que contiene los archivos con seguimiento y los archivos sin seguimiento no ignorados y, a continuación, lo fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados nunca entran en la base de datos de objetos del repositorio. OpenClaw almacena únicamente los archivos ignorados que realmente aprovisionó en filas fragmentadas de la base de datos de estado compartida; el conjunto de rutas registrado sigue siendo la fuente de autoridad incluso si `.worktreeinclude` cambia posteriormente o desaparece. La restauración lee esos bytes de la instantánea inmutable y vuelve a aplicar sus modos completos. La limpieza automática conserva un worktree activo cuando ya no se puede crear de forma segura una instantánea de una ruta registrada. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al finalizar la ejecución, elimina un worktree solo cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra ningún commit sin enviar. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza horaria crea instantáneas y elimina los worktrees desbloqueados propiedad de Workboard y de sesiones que lleven inactivos más de 7 días, incluso si tienen cambios. Los worktrees manuales nunca se eliminan automáticamente.
- Los registros de instantáneas se pueden restaurar durante 30 días. Después, la limpieza elimina la referencia de la instantánea y la fila del registro.
- El bloqueo de un proceso activo de OpenClaw y cualquier bloqueo de worktree de git externo o no reconocido protegen un worktree frente a la recolección de basura.

La restauración vuelve a crear `openclaw/<name>` en el commit original anterior a la instantánea y después reconstruye las diferencias de la instantánea como modificaciones sin preparar y archivos sin seguimiento. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La referencia de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Worktrees** de la Control UI, en Settings, proporciona las mismas acciones, además de la creación con un selector de rama base; muestra el propietario de cada worktree (manual, Workboard o la sesión propietaria con un enlace a su chat) y ofrece un reintento forzado cuando una eliminación informa de un error en la instantánea.

## Métodos del Gateway

| Método               | Finalidad                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Enumerar los registros de worktrees activos y restaurables.                            |
| `worktrees.branches` | Enumerar las ramas locales y remotas de un repositorio para los selectores de referencia base.    |
| `worktrees.create`   | Crear o reutilizar un worktree administrado con nombre.                               |
| `worktrees.remove`   | Crear una instantánea y eliminar un worktree. Las eliminaciones forzadas informan de `snapshotError`. |
| `worktrees.restore`  | Restaurar un worktree eliminado a partir de su instantánea.                           |
| `worktrees.gc`       | Ejecutar ahora la limpieza por inactividad, orfandad y retención.                            |

`worktrees.list` requiere `operator.read`, y los métodos que realizan modificaciones requieren `operator.admin`. `worktrees.branches` necesita `operator.write` para los espacios de trabajo de agentes configurados, mientras que cualquier otra ruta del host requiere `operator.admin` (de acuerdo con el requisito de cwd `sessions.create`). Solo lee las referencias existentes y nunca realiza una obtención; las ramas exclusivamente remotas se devuelven con calificación remota (`origin/feature-a`), por lo que todos los nombres devueltos se resuelven como una referencia base.

## Espacios de trabajo de Workboard

El [Plugin Workboard](/es/plugins/workboard) incluido puede materializar el espacio de trabajo de una tarjeta como un worktree administrado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica el checkout git de origen. `branch` es opcional y pasa a ser la referencia base. Para un llamador con acceso completo al host, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con el checkout administrado como directorio de trabajo y vuelve a escribir en la tarjeta la ruta y la rama resueltas. Los clientes del Gateway necesitan `operator.admin` para la materialización con acceso completo al host. Al finalizar la ejecución, Workboard elimina el checkout solo cuando se puede demostrar que no habrá pérdidas; el trabajo con cambios o los commits sin enviar permanecen disponibles.

Para un llamador limitado al espacio de trabajo, `path` y la raíz del repositorio deben coincidir exactamente con el espacio de trabajo del agente de destino. A continuación, Workboard se ejecuta directamente en ese directorio y registra un espacio de trabajo de directorio en lugar de materializar un worktree administrado en el host. El destino debe usar un sandbox de Docker escribible y no compartido para el mismo espacio de trabajo, el hash de su contenedor activo debe coincidir con los montajes y la política solicitados, y no debe exponer ejecución elevada, control del host, sesiones de todo el host, ejecución persistente en el host o Node, ni herramientas de plugins y MCP sin clasificar. Si la política del destino o el contenedor activo tienen un alcance más amplio, la asignación deja la tarjeta sin reclamar e informa del estado incompatible.
