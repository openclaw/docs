---
read_when:
    - Quieres una rama y una copia de trabajo aisladas para una tarea de agente
    - Estás configurando tarjetas de Workboard con espacios de trabajo de worktree
    - Necesitas restaurar o limpiar un árbol de trabajo administrado por OpenClaw
summary: Ejecuta tareas de agente en checkouts de git aislados con instantáneas y limpieza automáticas
title: Worktrees gestionados
x-i18n:
    generated_at: "2026-07-06T10:49:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d0933ab3d3bf7235fa42365fd2db9f20e7e78192fb378c5ea0776ab10a9152
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los worktrees administrados dan a una tarea de agente su propia rama de git y checkout sin colocar directorios temporales dentro del repositorio de origen. OpenClaw los crea bajo su directorio de estado, los registra en la base de datos de estado compartida y toma instantáneas de sus contenidos rastreados y no rastreados no ignorados antes de eliminarlos.

## Diseño y nombres

Cada worktree reside en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella del repositorio son los primeros 16 caracteres hexadecimales de un hash SHA-256 sobre el directorio común canónico de git y la URL de origen. Un nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Sin un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la ref base solicitada. Sin una ref base, obtiene `origin`, usa la rama predeterminada remota cuando está disponible y recurre al `HEAD` local cuando el repositorio está sin conexión o no tiene un remoto utilizable.

## Aprovisionar archivos ignorados

Añade `.worktreeinclude` en la raíz del repositorio de origen para copiar archivos ignorados y no rastreados seleccionados en un nuevo worktree. El archivo usa sintaxis de patrones gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son elegibles los archivos que git informa como ignorados y no rastreados a la vez. Los archivos rastreados ya están presentes mediante git y este paso nunca los copia. OpenClaw no sobrescribe archivos de destino ni sigue directorios con symlinks, y conserva los modos de archivo copiados.

## Ejecutar la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de origen y es ejecutable, OpenClaw lo ejecuta con el nuevo worktree como su directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Una salida distinta de cero aborta la creación y elimina el nuevo worktree y la rama. Este es un contrato local del repositorio; no hay ninguna clave de configuración de OpenClaw para él.

## Worktrees de sesión

Inicia un chat aislado desde el espacio de trabajo git del agente activo con **Nuevo chat en worktree**: usa la acción secundaria Nuevo chat en la barra lateral de la IU de Control, el menú de acciones de Chat en iOS o la acción de desbordamiento junto a Nuevo chat en Android. La acción solo está disponible para un agente respaldado por git donde el cliente tenga esa capacidad; los clientes que no pueden comprobarla previamente muestran en su lugar el error del Gateway.

El worktree administrado resultante pertenece a la sesión, y cada ejecución de agente en esa sesión usa su checkout. Cuando el espacio de trabajo es un subdirectorio del repositorio, el worktree se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación de worktrees de sesión usa el alcance `operator.write` del método, pero el paso `.openclaw/worktree-setup.sh` se ejecuta solo para llamadores `operator.admin` porque ejecuta código del repositorio; el aprovisionamiento de `.worktreeinclude` sigue aplicándose a todos los llamadores. Eliminar la sesión elimina el worktree solo cuando hacerlo no provoca pérdida de datos. Los worktrees sucios o las ramas con commits no enviados permanecen disponibles; la limpieza horaria toma instantáneas de los worktrees de sesión tras 7 días de inactividad, tratando la actividad reciente de la sesión como actividad del worktree. Los worktrees eliminados siguen siendo restaurables desde sus instantáneas como se describe a continuación.

## Instantáneas, limpieza y restauración

La eliminación primero crea un commit sintético que contiene archivos rastreados y no rastreados no ignorados, y lo fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados por git se excluyen de la base de datos de objetos del repositorio; los archivos seleccionados por `.worktreeinclude` se copian de nuevo durante la restauración. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al final de la ejecución, elimina un worktree solo cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra commits no enviados. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza horaria toma instantáneas y elimina worktrees desbloqueados propiedad de Workboard y de sesión inactivos durante más de 7 días, incluso cuando están sucios. Los worktrees manuales nunca se eliminan automáticamente.
- Los registros de instantáneas permanecen restaurables durante 30 días. Después, la limpieza elimina la ref de la instantánea y la fila del registro.
- Un bloqueo de proceso de OpenClaw en vivo y cualquier bloqueo de worktree de git ajeno o no reconocido protegen un worktree de la recolección de basura.

La restauración recrea `openclaw/<name>` en el commit original previo a la instantánea y luego reconstruye las diferencias de la instantánea como modificaciones no preparadas y archivos no rastreados. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La ref de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Worktrees** de la IU de Control proporciona las mismas acciones de listar, eliminar, restaurar y limpiar.

## Métodos de Gateway

| Método              | Propósito                                        |
| ------------------- | ----------------------------------------------- |
| `worktrees.list`    | Lista registros de worktree activos y restaurables. |
| `worktrees.create`  | Crea o reutiliza un worktree administrado con nombre. |
| `worktrees.remove`  | Toma una instantánea y elimina un worktree.      |
| `worktrees.restore` | Restaura un worktree eliminado desde su instantánea. |
| `worktrees.gc`      | Ejecuta ahora la limpieza de inactivos, huérfanos y retención. |

`worktrees.list` requiere `operator.read`. Los métodos mutadores requieren `operator.admin`.

## Espacios de trabajo de Workboard

El [Plugin de Workboard](/es/plugins/workboard) incluido puede materializar un espacio de trabajo de tarjeta como un worktree administrado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica el checkout git de origen. `branch` es opcional y se convierte en la ref base. Cuando el despacho inicia el worker de la tarjeta, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con el checkout administrado como su directorio de trabajo y escribe la ruta y la rama resueltas de vuelta en la tarjeta. La materialización activada por Gateway requiere `operator.admin`. Al final de la ejecución, Workboard elimina el checkout solo cuando se puede demostrar que no hay pérdida de datos; el trabajo sucio o los commits no enviados permanecen disponibles.

Actualmente, los agentes incrustados en sandbox rechazan un directorio de trabajo de tarea fuera de su espacio de trabajo de agente configurado. Usa un agente de destino sin sandbox para tarjetas de Workboard con worktree administrado hasta que el runtime de sandbox admita un montaje de checkout aditivo.
