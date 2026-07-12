---
read_when:
    - Quieres una rama y un directorio de trabajo aislados para una tarea de agente
    - Estás configurando tarjetas de Workboard con espacios de trabajo de worktree
    - Necesitas restaurar o limpiar un árbol de trabajo gestionado por OpenClaw.
summary: Ejecuta tareas de agentes en checkouts de git aislados con instantáneas y limpieza automáticas
title: Árboles de trabajo administrados
x-i18n:
    generated_at: "2026-07-11T23:03:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los árboles de trabajo administrados proporcionan a la tarea de un agente su propia rama y checkout de git sin colocar directorios temporales dentro del repositorio de código fuente. OpenClaw los crea en su directorio de estado, los registra en la base de datos de estado compartida y toma una instantánea de su contenido con seguimiento y de su contenido sin seguimiento no ignorado antes de eliminarlos.

## Estructura y nombres

Cada árbol de trabajo se encuentra en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella digital del repositorio consta de los primeros 16 caracteres hexadecimales de un hash SHA-256 calculado a partir del directorio común canónico de git y la URL de origen. El nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Si no se proporciona un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la referencia base solicitada. Si no se especifica una referencia base, obtiene `origin`, utiliza la rama predeterminada remota cuando está disponible y recurre al `HEAD` local cuando el repositorio está sin conexión o no tiene un remoto utilizable.

## Aprovisionamiento de archivos ignorados

Añada `.worktreeinclude` en la raíz del repositorio de código fuente para copiar determinados archivos ignorados y sin seguimiento en un nuevo árbol de trabajo. El archivo utiliza la sintaxis de patrones de gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son aptos los archivos que git identifica simultáneamente como ignorados y sin seguimiento. Los archivos con seguimiento ya están presentes mediante git y nunca se copian en este paso. OpenClaw no sobrescribe los archivos de destino ni sigue directorios que sean enlaces simbólicos, y conserva los modos de los archivos copiados.

## Ejecución de la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de código fuente y es ejecutable, OpenClaw lo ejecuta con el nuevo árbol de trabajo como directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Una salida distinta de cero interrumpe la creación y elimina el nuevo árbol de trabajo y la rama. Este es un contrato local del repositorio; no existe ninguna clave de configuración de OpenClaw para él.

## Árboles de trabajo de sesión

Inicie un chat aislado desde el espacio de trabajo git del agente activo mediante una sesión respaldada por un árbol de trabajo: habilite **Árbol de trabajo** en la página Nueva sesión de la interfaz de control (que también ofrece un selector de rama base y un nombre opcional para el árbol de trabajo), o use el menú de acciones del chat en iOS o la acción del menú adicional junto a Nuevo chat en Android. La opción solo está disponible para un agente respaldado por git cuando el cliente tiene esa capacidad; los clientes que no pueden realizar la comprobación previa muestran en su lugar el error del Gateway.

Los agentes de programación también pueden llamar a `spawn_task` cuando detectan trabajo de seguimiento confirmado que queda fuera de la tarea actual. La interfaz de control muestra una sugerencia sin iniciar nada, mientras que una TUI respaldada por el Gateway muestra un mensaje interactivo con las mismas acciones. Al seleccionar **Iniciar en un árbol de trabajo**, se crea un nuevo árbol de trabajo propiedad de la sesión a partir del proyecto sugerido y se envía la instrucción autocontenida como su primer turno; descartar la sugerencia deja el repositorio intacto. Las sugerencias y sus identificadores son efímeros y no persisten tras reiniciar el Gateway.

OpenClaw expone estas herramientas únicamente a las sesiones de operador con una interfaz de usuario de Gateway que permita realizar acciones. Las sesiones de canal y las sesiones TUI locales o integradas no las reciben hasta que esas superficies dispongan de un contrato portátil y tipado para acciones de tareas.

El árbol de trabajo administrado resultante pertenece a la sesión, y cada ejecución del agente en esa sesión utiliza su checkout. Cuando el espacio de trabajo es un subdirectorio del repositorio, el árbol de trabajo se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación de árboles de trabajo de sesión utiliza el ámbito `operator.write` del método, pero el paso `.openclaw/worktree-setup.sh` solo se ejecuta para quienes llaman con `operator.admin`, ya que ejecuta código del repositorio; el aprovisionamiento mediante `.worktreeinclude` sigue aplicándose a todos los llamadores. Al eliminar la sesión, el árbol de trabajo solo se elimina si se puede hacer sin pérdida. Los árboles de trabajo con cambios sin confirmar o las ramas con commits sin enviar permanecen disponibles; la limpieza horaria toma instantáneas de los árboles de trabajo de sesión tras 7 días de inactividad y considera la actividad reciente de la sesión como actividad del árbol de trabajo. Los árboles de trabajo eliminados se pueden restaurar desde sus instantáneas como se describe a continuación.

`sessions.create` puede incluir un `cwd` absoluto junto con `worktree: true` cuando una tarea está dirigida a un proyecto distinto del espacio de trabajo configurado del agente. Esa ruta explícita del host requiere `operator.admin`; la creación ordinaria de chats con árbol de trabajo sigue requiriendo `operator.write` y permanece anclada al espacio de trabajo configurado.

`sessions.create` también acepta `worktreeBaseRef` y `worktreeName` junto con `worktree: true` para elegir la referencia base y el nombre del árbol de trabajo (la rama pasa a ser `openclaw/<name>`); ambos permanecen en `operator.write`. El árbol de trabajo creado se devuelve en el resultado de la creación y se conserva en la fila de la sesión como `worktree: { id, branch, repoRoot }`, para que las listas de sesiones puedan mostrar el checkout y la rama. Al eliminar una sesión, un checkout con cambios que se haya conservado se informa como `worktreePreserved` en lugar de dejarlo atrás silenciosamente.

## Instantáneas, limpieza y restauración

Antes de eliminar, se crea un commit sintético que contiene los archivos con seguimiento y los archivos sin seguimiento no ignorados, y se fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados por git se excluyen de la base de datos de objetos del repositorio; los archivos seleccionados mediante `.worktreeinclude` se vuelven a copiar durante la restauración. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al finalizar una ejecución, elimina un árbol de trabajo solo cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra commits sin enviar. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza horaria toma instantáneas y elimina los árboles de trabajo desbloqueados propiedad de Workboard y de sesiones que lleven más de 7 días inactivos, incluso si tienen cambios. Los árboles de trabajo manuales nunca se eliminan automáticamente.
- Los registros de instantáneas se pueden restaurar durante 30 días. Después, la limpieza elimina la referencia de la instantánea y la fila del registro.
- Un bloqueo activo de un proceso de OpenClaw y cualquier bloqueo de árbol de trabajo de git externo o no reconocido protegen el árbol de trabajo frente a la recolección de elementos sin uso.

La restauración vuelve a crear `openclaw/<name>` en el commit original anterior a la instantánea y, después, reconstruye las diferencias de la instantánea como modificaciones no preparadas y archivos sin seguimiento. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La referencia de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Árboles de trabajo** de la interfaz de control, situada en Configuración, proporciona las mismas acciones y además permite crear árboles de trabajo mediante un selector de rama base, muestra el propietario de cada árbol de trabajo (manual, Workboard o la sesión propietaria con un enlace a su chat) y ofrece un reintento forzado cuando una eliminación informa de un fallo en la instantánea.

## Métodos del Gateway

| Método                | Finalidad                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `worktrees.list`      | Enumerar los registros de árboles de trabajo activos y restaurables.                              |
| `worktrees.branches`  | Enumerar las ramas locales y remotas de un repositorio para los selectores de referencia base.    |
| `worktrees.create`    | Crear o reutilizar un árbol de trabajo administrado con nombre.                                   |
| `worktrees.remove`    | Tomar una instantánea y eliminar un árbol de trabajo. Las eliminaciones forzadas informan de `snapshotError`. |
| `worktrees.restore`   | Restaurar un árbol de trabajo eliminado desde su instantánea.                                     |
| `worktrees.gc`        | Ejecutar ahora la limpieza de elementos inactivos, huérfanos y sujetos a retención.                |

`worktrees.list` requiere `operator.read`, y los métodos que realizan modificaciones requieren `operator.admin`. `worktrees.branches` necesita `operator.write` para los espacios de trabajo de agentes configurados, mientras que cualquier otra ruta del host requiere `operator.admin` (de acuerdo con el requisito de `cwd` de `sessions.create`). Solo lee las referencias existentes y nunca realiza una obtención, y las ramas que solo existen en el remoto se devuelven con el remoto especificado (`origin/feature-a`) para que cada nombre devuelto se pueda resolver como referencia base.

## Espacios de trabajo de Workboard

El [Plugin Workboard](/es/plugins/workboard) incluido puede materializar el espacio de trabajo de una tarjeta como un árbol de trabajo administrado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica el checkout de git de origen. `branch` es opcional y se convierte en la referencia base. Cuando el despacho inicia el proceso de trabajo de la tarjeta, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con el checkout administrado como directorio de trabajo y escribe de nuevo en la tarjeta la ruta y la rama resueltas. La materialización iniciada mediante el Gateway requiere `operator.admin`. Al finalizar una ejecución, Workboard elimina el checkout solo cuando se puede demostrar que no habrá pérdida; el trabajo con cambios o los commits sin enviar permanecen disponibles.

Actualmente, los agentes integrados que se ejecutan en un entorno aislado rechazan un directorio de trabajo de tareas situado fuera del espacio de trabajo configurado del agente. Use un agente de destino sin entorno aislado para las tarjetas de Workboard con árboles de trabajo administrados hasta que el entorno de ejecución aislado admita un montaje de checkout adicional.
