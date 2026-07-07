---
read_when:
    - Quieres una rama y un checkout aislados para una tarea de agente
    - Estás configurando tarjetas de Workboard con espacios de trabajo de worktree
    - Necesitas restaurar o limpiar un árbol de trabajo gestionado por OpenClaw
summary: Ejecuta tareas de agentes en checkouts de git aislados con snapshots automáticos y limpieza
title: Worktrees gestionados
x-i18n:
    generated_at: "2026-07-06T21:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 10c6522017df3b4a6ac04d6e2493c226c34547ed686b526c29d01cfd34dc5524
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los worktrees administrados dan a una tarea de agente su propia rama y checkout de git sin colocar directorios temporales dentro del repositorio de origen. OpenClaw los crea bajo su directorio de estado, los registra en la base de datos de estado compartida y toma instantáneas de su contenido rastreado y no rastreado no ignorado antes de eliminarlos.

## Diseño y nombres

Cada worktree reside en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella del repositorio son los primeros 16 caracteres hexadecimales de un hash SHA-256 sobre el directorio común canónico de git y la URL de origen. Un nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Sin un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la referencia base solicitada. Sin una referencia base, obtiene `origin`, usa la rama predeterminada remota cuando está disponible y recurre al `HEAD` local cuando el repositorio está sin conexión o no tiene un remoto utilizable.

## Aprovisionar archivos ignorados

Agrega `.worktreeinclude` en la raíz del repositorio de origen para copiar archivos ignorados y no rastreados seleccionados en un worktree nuevo. El archivo usa sintaxis de patrones gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son elegibles los archivos que git informa como ignorados y no rastreados a la vez. Los archivos rastreados ya están presentes mediante git y nunca se copian en este paso. OpenClaw no sobrescribe archivos de destino ni sigue directorios con symlink, y conserva los modos de archivo copiados.

## Ejecutar la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de origen y es ejecutable, OpenClaw lo ejecuta con el nuevo worktree como su directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Una salida distinta de cero aborta la creación y elimina el nuevo worktree y la rama. Este es un contrato local del repositorio; no hay ninguna clave de configuración de OpenClaw para él.

## Worktrees de sesión

Inicia un chat aislado desde el workspace de git del agente activo con **Nuevo chat en worktree**: usa la acción secundaria Nuevo chat en la barra lateral de la UI de Control, el menú de acciones de Chat en iOS o la acción de desbordamiento junto a Nuevo chat en Android. La acción solo está disponible para un agente respaldado por git cuando el cliente tiene esa capacidad; los clientes que no pueden comprobarla previamente muestran en su lugar el error del Gateway.

El worktree administrado resultante pertenece a la sesión, y cada ejecución de agente en esa sesión usa su checkout. Cuando el workspace es un subdirectorio del repositorio, el worktree se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación de worktrees de sesión usa el alcance `operator.write` del método, pero el paso `.openclaw/worktree-setup.sh` solo se ejecuta para llamadores `operator.admin` porque ejecuta código del repositorio; el aprovisionamiento de `.worktreeinclude` sigue aplicándose a todos los llamadores. Eliminar la sesión elimina el worktree solo cuando hacerlo no implica pérdida. Los worktrees con cambios sin confirmar o ramas con commits sin enviar permanecen disponibles; la limpieza horaria toma instantáneas de los worktrees de sesión después de 7 días de inactividad, tratando la actividad reciente de la sesión como actividad del worktree. Los worktrees eliminados siguen siendo restaurables desde sus instantáneas como se describe a continuación.

## Instantáneas, limpieza y restauración

La eliminación primero crea un commit sintético que contiene archivos rastreados y no rastreados no ignorados, y lo fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados por git se excluyen de la base de datos de objetos del repositorio; los archivos seleccionados por `.worktreeinclude` se copian de nuevo durante la restauración. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al finalizar la ejecución, elimina un worktree solo cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra commits sin enviar. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza horaria toma instantáneas y elimina worktrees desbloqueados propiedad de Workboard y de sesiones que lleven inactivos más de 7 días, incluso con cambios sin confirmar. Los worktrees manuales nunca se eliminan automáticamente.
- Los registros de instantáneas siguen siendo restaurables durante 30 días. Después, la limpieza elimina la referencia de la instantánea y la fila del registro.
- Un bloqueo de proceso activo de OpenClaw y cualquier bloqueo de git worktree externo o no reconocido protegen un worktree de la recolección de basura.

La restauración recrea `openclaw/<name>` en el commit original anterior a la instantánea y luego reconstruye las diferencias de la instantánea como modificaciones no preparadas y archivos no rastreados. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La referencia de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Worktrees** de la UI de Control en Configuración proporciona las mismas acciones de listar, eliminar, restaurar y limpiar.

## Métodos del Gateway

| Método              | Propósito                                            |
| ------------------- | ---------------------------------------------------- |
| `worktrees.list`    | Listar registros de worktrees activos y restaurables. |
| `worktrees.create`  | Crear o reutilizar un worktree administrado con nombre. |
| `worktrees.remove`  | Tomar una instantánea y eliminar un worktree.        |
| `worktrees.restore` | Restaurar un worktree eliminado desde su instantánea. |
| `worktrees.gc`      | Ejecutar ahora la limpieza de inactivos, huérfanos y retención. |

`worktrees.list` requiere `operator.read`. Los métodos que mutan requieren `operator.admin`.

## Workspaces de Workboard

El [Plugin Workboard](/es/plugins/workboard) incluido puede materializar un workspace de tarjeta como un worktree administrado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica el checkout de git de origen. `branch` es opcional y se convierte en la referencia base. Cuando el despacho inicia el worker de la tarjeta, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con el checkout administrado como su directorio de trabajo y escribe la ruta y la rama resueltas de vuelta en la tarjeta. La materialización activada por el Gateway requiere `operator.admin`. Al finalizar la ejecución, Workboard elimina el checkout solo cuando se puede probar que no implica pérdida; el trabajo con cambios sin confirmar o los commits sin enviar permanecen disponibles.

Actualmente, los agentes integrados en sandbox rechazan un directorio de trabajo de tarea fuera de su workspace de agente configurado. Usa un agente de destino sin sandbox para tarjetas de Workboard con worktree administrado hasta que el runtime del sandbox admita un montaje de checkout aditivo.
