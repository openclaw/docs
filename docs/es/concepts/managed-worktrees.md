---
read_when:
    - Quiere una rama y un directorio de trabajo aislados para una tarea de agente
    - Está configurando tarjetas de Workboard con espacios de trabajo de worktree
    - Necesita restaurar o limpiar un árbol de trabajo administrado por OpenClaw
summary: Ejecuta tareas de agentes en checkouts aislados de git con instantáneas y limpieza automáticas
title: Árboles de trabajo administrados
x-i18n:
    generated_at: "2026-07-12T14:28:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los árboles de trabajo administrados proporcionan a una tarea de agente su propia rama de git y su propio directorio de trabajo, sin colocar directorios temporales dentro del repositorio de origen. OpenClaw los crea en su directorio de estado, los registra en la base de datos de estado compartida y crea una instantánea de su contenido con seguimiento y de su contenido sin seguimiento no ignorado antes de eliminarlos.

## Disposición y nombres

Cada árbol de trabajo se encuentra en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella digital del repositorio son los primeros 16 caracteres hexadecimales de un hash SHA-256 calculado sobre el directorio común canónico de git y la URL de origen. Un nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Si no se proporciona un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la referencia base solicitada. Si no se proporciona una referencia base, obtiene los datos de `origin`, usa la rama predeterminada remota cuando está disponible y recurre al `HEAD` local cuando el repositorio está sin conexión o no tiene un remoto utilizable.

## Aprovisionar archivos ignorados

Añada `.worktreeinclude` en la raíz del repositorio de origen para copiar archivos seleccionados ignorados y sin seguimiento en un nuevo árbol de trabajo. El archivo utiliza la sintaxis de patrones de gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son aptos los archivos que git indica como ignorados y sin seguimiento. Los archivos con seguimiento ya están presentes mediante git y nunca se copian en este paso. OpenClaw no sobrescribe los archivos de destino ni sigue directorios enlazados simbólicamente, y conserva los modos de los archivos copiados.

## Ejecutar la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de origen y es ejecutable, OpenClaw lo ejecuta con el nuevo árbol de trabajo como directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
```
```text
OPENCLAW_WORKTREE_PATH=<managed worktree>
```
Una salida distinta de cero cancela la creación y elimina el nuevo árbol de trabajo y la rama. Este es un contrato local del repositorio; no existe ninguna clave de configuración de OpenClaw para ello.

## Árboles de trabajo de sesión

Inicie un chat aislado desde el espacio de trabajo de git del agente activo con una sesión respaldada por un árbol de trabajo: habilite **Árbol de trabajo** en la página Nueva sesión de la interfaz de control (que también ofrece un selector de rama base y un nombre opcional para el árbol de trabajo), o use el menú de acciones del chat en iOS o la acción de desbordamiento junto a Nuevo chat en Android. La opción solo está disponible para un agente respaldado por git cuando el cliente dispone de esa capacidad; los clientes que no pueden realizar la comprobación previa muestran en su lugar el error del Gateway.

Los agentes de programación también pueden llamar a `spawn_task` cuando detectan trabajo de seguimiento confirmado fuera de la tarea actual. La interfaz de control muestra una sugerencia sin iniciar nada, mientras que una TUI respaldada por el Gateway muestra un mensaje interactivo con las mismas acciones. Al seleccionar **Iniciar en un árbol de trabajo**, se crea un nuevo árbol de trabajo propiedad de la sesión a partir del proyecto sugerido y se envía la instrucción autocontenida como su primer turno; si se descarta la sugerencia, el repositorio permanece intacto. Las sugerencias y sus identificadores son efímeros y no persisten tras un reinicio del Gateway.

OpenClaw expone estas herramientas únicamente a las sesiones de operador con una interfaz de usuario de Gateway que permita actuar. Las sesiones de canal y las sesiones de TUI locales o integradas no las reciben hasta que esas superficies dispongan de un contrato portátil y tipado de acciones de tareas.

El worktree gestionado resultante pertenece a la sesión, y cada ejecución de agente en esa sesión utiliza su checkout. Cuando el espacio de trabajo es un subdirectorio de un repositorio, el worktree se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación del worktree de la sesión utiliza el ámbito `operator.write` del método, pero el paso `.openclaw/worktree-setup.sh` solo se ejecuta para quienes llaman con `operator.admin`, ya que ejecuta código del repositorio; el aprovisionamiento mediante `.worktreeinclude` sigue aplicándose a todos los llamantes. Al eliminar la sesión, el worktree solo se elimina cuando hacerlo no provoca pérdidas. Los worktrees con cambios sin confirmar o las ramas con commits sin enviar permanecen disponibles; la limpieza por hora crea instantáneas de los worktrees de sesión después de 7 días de inactividad y considera la actividad reciente de la sesión como actividad del worktree. Los worktrees eliminados siguen pudiendo restaurarse desde sus instantáneas, como se describe a continuación.

`sessions.create` puede incluir un `cwd` absoluto junto con `worktree: true` cuando una tarea tiene como destino un proyecto distinto del espacio de trabajo del agente configurado. Esa ruta explícita del host requiere `operator.admin`; la creación ordinaria de chats con worktree sigue requiriendo `operator.write` y permanece anclada al espacio de trabajo configurado.

`sessions.create` también acepta `worktreeBaseRef` y `worktreeName` junto con `worktree: true` para elegir la referencia base y el nombre del worktree (la rama pasa a ser `openclaw/<name>`); ambos permanecen en `operator.write`. El worktree creado se devuelve en el resultado de creación y se conserva en la fila de la sesión como `worktree: { id, branch, repoRoot }`, de modo que las listas de sesiones puedan mostrar el checkout y la rama. Al eliminar una sesión, un checkout con cambios que se haya conservado se informa como `worktreePreserved`, en lugar de dejarlo atrás silenciosamente.

## Instantáneas, limpieza y restauración

La eliminación crea primero un commit sintético que contiene los archivos con seguimiento y los archivos sin seguimiento que no estén ignorados, y lo fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados por Git se excluyen de la base de datos de objetos del repositorio; los archivos seleccionados mediante `.worktreeinclude` se vuelven a copiar durante la restauración. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al finalizar la ejecución, elimina un worktree solo cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra commits sin enviar. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza por hora crea instantáneas y elimina los worktrees desbloqueados que pertenecen a Workboard y a sesiones y que llevan más de 7 días inactivos, incluso cuando tienen cambios sin confirmar. Los worktrees manuales nunca se eliminan automáticamente.
- Los registros de instantáneas pueden restaurarse durante 30 días. Después, la limpieza elimina la referencia de la instantánea y la fila del registro.
- Un bloqueo de un proceso activo de OpenClaw y cualquier bloqueo de worktree de Git externo o no reconocido protegen al worktree de la recolección de basura.

La restauración vuelve a crear `openclaw/<name>` en el commit original anterior a la instantánea y, a continuación, reconstruye las diferencias de la instantánea como modificaciones no preparadas y archivos sin seguimiento. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La referencia de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Worktrees** de la interfaz de control, en Settings, proporciona las mismas acciones, además de la creación con un selector de rama base; muestra el propietario de cada árbol de trabajo (manual, Workboard o la sesión propietaria, con un enlace a su chat) y ofrece un reintento forzado cuando una eliminación informa de un fallo en la instantánea.

## Métodos del Gateway

| Método               | Propósito                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `worktrees.list`     | Enumera los registros de árboles de trabajo activos y restaurables.                        |
| `worktrees.branches` | Enumera las ramas locales y remotas de un repositorio para los selectores de referencia base. |
| `worktrees.create`   | Crea o reutiliza un árbol de trabajo administrado con nombre.                              |
| `worktrees.remove`   | Crea una instantánea y elimina un árbol de trabajo. Las eliminaciones forzadas informan de `snapshotError`. |
| `worktrees.restore`  | Restaura un árbol de trabajo eliminado a partir de su instantánea.                         |
| `worktrees.gc`       | Ejecuta de inmediato la limpieza por inactividad, elementos huérfanos y retención.         |

`worktrees.list` requiere `operator.read`, y los métodos que realizan modificaciones requieren `operator.admin`. `worktrees.branches` necesita `operator.write` para los espacios de trabajo de agentes configurados, mientras que cualquier otra ruta del host requiere `operator.admin` (de acuerdo con el requisito de cwd de `sessions.create`). Solo lee las referencias existentes y nunca realiza una obtención; además, las ramas que solo existen en remoto se devuelven con el remoto incluido (`origin/feature-a`), de modo que cada nombre devuelto se resuelva como una referencia base.

## Espacios de trabajo de Workboard

El [Plugin Workboard](/es/plugins/workboard) incluido puede materializar el espacio de trabajo de una tarjeta como un árbol de trabajo administrado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica el checkout de Git de origen. `branch` es opcional y se convierte en la referencia base. Cuando el despacho inicia el trabajador de la tarjeta, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con el checkout administrado como directorio de trabajo y vuelve a escribir en la tarjeta la ruta y la rama resueltas. La materialización activada por el Gateway requiere `operator.admin`. Al finalizar la ejecución, Workboard elimina el checkout únicamente cuando puede demostrarse que no habrá pérdidas; el trabajo sin confirmar o los commits sin enviar permanecen disponibles.

Actualmente, los agentes integrados en un entorno aislado rechazan un directorio de trabajo de tarea situado fuera de su espacio de trabajo de agente configurado. Use un agente de destino sin aislamiento para las tarjetas de árboles de trabajo administrados por Workboard hasta que el entorno de ejecución aislado admita un montaje de checkout adicional.
