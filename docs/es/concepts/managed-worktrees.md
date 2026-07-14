---
read_when:
    - Se necesita una rama y un directorio de trabajo aislados para una tarea de agente
    - Está configurando tarjetas de Workboard con espacios de trabajo worktree
    - Necesita restaurar o limpiar un árbol de trabajo gestionado por OpenClaw
summary: Ejecuta tareas de agente en copias de trabajo aisladas de Git con instantáneas y limpieza automáticas
title: Árboles de trabajo administrados
x-i18n:
    generated_at: "2026-07-14T13:37:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6f9923f427be2afb507a5296c221b6ca6d2ae03a7a8c92f30755cf15b92c6806
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los árboles de trabajo gestionados proporcionan a una tarea de agente su propia rama y copia de trabajo de git sin colocar directorios temporales dentro del repositorio de origen. OpenClaw los crea en su directorio de estado, los registra en la base de datos de estado compartida y crea instantáneas de su contenido con seguimiento y de su contenido sin seguimiento no ignorado antes de eliminarlos.

## Diseño y nombres

Cada árbol de trabajo se encuentra en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella digital del repositorio consta de los primeros 16 caracteres hexadecimales de un hash SHA-256 calculado sobre el directorio común canónico de git y la URL de origen. El nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Si no se proporciona un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la referencia base solicitada. Si no se proporciona una referencia base, obtiene `origin`, utiliza la rama predeterminada remota cuando está disponible y recurre a la rama local `HEAD` cuando el repositorio está sin conexión o no tiene un remoto utilizable.

## Aprovisionamiento de archivos ignorados

Añada `.worktreeinclude` en la raíz del repositorio de origen para copiar archivos seleccionados ignorados y sin seguimiento en un árbol de trabajo nuevo. El archivo utiliza la sintaxis de patrones de gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son aptos los archivos que git identifica simultáneamente como ignorados y sin seguimiento. Los archivos con seguimiento ya están presentes mediante git y nunca se copian en este paso. OpenClaw no sobrescribe archivos de destino ni sigue directorios enlazados simbólicamente, y conserva los modos de los archivos copiados.

## Ejecución de la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de origen y es ejecutable, OpenClaw lo ejecuta con el nuevo árbol de trabajo como directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Un código de salida distinto de cero cancela la creación y elimina el nuevo árbol de trabajo y la rama. Este es un contrato local del repositorio; no existe ninguna clave de configuración de OpenClaw para él.

## Árboles de trabajo de sesión

Inicie un chat aislado desde el espacio de trabajo git del agente activo con una sesión respaldada por un árbol de trabajo: habilite **Árbol de trabajo** en la página Nueva sesión de la interfaz de control (que también ofrece un selector de rama base y un nombre opcional para el árbol de trabajo), o utilice el menú de acciones del chat en iOS o la acción adicional situada junto a Nuevo chat en Android. La opción solo está disponible para un agente respaldado por git cuando el cliente dispone de esa capacidad; los clientes que no pueden comprobarlo previamente muestran en su lugar el error del Gateway.

Los agentes de programación también pueden llamar a `spawn_task` cuando detectan trabajo de seguimiento confirmado fuera de la tarea actual. La interfaz de control muestra una sugerencia sin iniciar nada, mientras que una TUI respaldada por el Gateway muestra un mensaje interactivo con las mismas acciones. Al seleccionar **Iniciar en un árbol de trabajo**, se crea un árbol de trabajo nuevo propiedad de la sesión a partir del proyecto sugerido y se envía la instrucción autocontenida como su primer turno; al descartar la sugerencia, el repositorio permanece intacto. Las sugerencias y sus identificadores son efímeros y no sobreviven a un reinicio del Gateway.

OpenClaw expone estas herramientas únicamente a las sesiones de operador con una interfaz del Gateway que permita actuar. Las sesiones de canal y las sesiones de TUI locales o integradas no las reciben hasta que esas superficies dispongan de un contrato portátil y tipado para acciones de tareas.

El árbol de trabajo gestionado resultante pertenece a la sesión, y cada ejecución del agente en esa sesión utiliza su copia de trabajo. Cuando el espacio de trabajo es un subdirectorio del repositorio, el árbol de trabajo se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación del árbol de trabajo de sesión utiliza el ámbito `operator.write` del método, pero los hooks de copia de trabajo del repositorio y el paso `.openclaw/worktree-setup.sh` solo se ejecutan para los autores de llamadas `operator.admin`, porque ejecutan código del repositorio; el aprovisionamiento de `.worktreeinclude` sigue aplicándose a todos los autores de llamadas. Al eliminar la sesión, el árbol de trabajo solo se elimina si puede hacerse sin pérdidas. Los árboles de trabajo con cambios pendientes o las ramas con commits sin enviar permanecen disponibles; la limpieza horaria crea instantáneas de los árboles de trabajo de sesión después de 7 días de inactividad y considera la actividad reciente de la sesión como actividad del árbol de trabajo. Los árboles de trabajo eliminados pueden restaurarse desde sus instantáneas como se describe a continuación.

`sessions.create` puede incluir una `cwd` absoluta junto con `worktree: true` cuando una tarea se dirige a un proyecto distinto del espacio de trabajo configurado para el agente. Esa ruta explícita del host requiere `operator.admin`; la creación ordinaria de chats con árboles de trabajo sigue siendo `operator.write` y permanece anclada al espacio de trabajo configurado.

`sessions.create` también acepta `worktreeBaseRef` y `worktreeName` junto con `worktree: true` para seleccionar la referencia base y el nombre del árbol de trabajo (la rama pasa a ser `openclaw/<name>`); ambos permanecen en `operator.write`. El árbol de trabajo creado se devuelve en el resultado de creación y se conserva en la fila de la sesión como `worktree: { id, branch, repoRoot }`, de modo que las listas de sesiones puedan mostrar la copia de trabajo y la rama. Al eliminar una sesión, una copia de trabajo con cambios pendientes que se haya conservado se informa como `worktreePreserved` en lugar de dejarla atrás silenciosamente.

## Instantáneas, limpieza y restauración

La eliminación crea primero un commit sintético que contiene los archivos con seguimiento y los archivos sin seguimiento no ignorados, y lo fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados por git se excluyen de la base de datos de objetos del repositorio; los archivos seleccionados mediante `.worktreeinclude` se vuelven a copiar durante la restauración. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al finalizar la ejecución, elimina un árbol de trabajo únicamente cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra commits sin enviar. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza horaria crea instantáneas y elimina los árboles de trabajo desbloqueados propiedad de Workboard y de sesiones que lleven inactivos más de 7 días, incluso si tienen cambios pendientes. Los árboles de trabajo manuales nunca se eliminan automáticamente.
- Cuando se configura `worktrees.cleanup.maxCount` o `worktrees.cleanup.maxTotalSizeGb`, la limpieza también crea instantáneas y elimina los árboles de trabajo propiedad de Workboard y de sesiones con actividad menos reciente hasta que el recuento total y el tamaño en disco se ajustan a los límites. Todos los árboles de trabajo gestionados cuentan para los totales, pero los árboles de trabajo manuales y los protegidos por otros motivos nunca se expulsan por límites, por lo que un límite puede seguir excedido hasta que existan árboles de trabajo aptos. 0 o un valor sin configurar desactiva un límite.
- Los registros de instantáneas pueden restaurarse durante 30 días. Después, la limpieza elimina la referencia de la instantánea y la fila del registro.
- Un bloqueo de un proceso activo de OpenClaw y cualquier bloqueo de árbol de trabajo de git externo o no reconocido protegen un árbol de trabajo frente a la recolección de elementos no utilizados.

La restauración vuelve a crear `openclaw/<name>` en el commit original anterior a la instantánea y, después, reconstruye las diferencias de la instantánea como modificaciones no preparadas y archivos sin seguimiento. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La referencia de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Árboles de trabajo** de la interfaz de control, situada en Configuración, proporciona las mismas acciones, además de la creación con un selector de rama base; muestra el propietario de cada árbol de trabajo (manual, Workboard o la sesión propietaria con un enlace a su chat) y ofrece un reintento forzado cuando una eliminación informa de un error en la instantánea. Su sección **Limpieza** permite editar los límites de retención de `worktrees.cleanup` descritos en la [referencia de configuración](/es/gateway/configuration-reference#worktrees).

## Métodos del Gateway

| Método               | Finalidad                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Enumerar los registros de árboles de trabajo activos y restaurables.                            |
| `worktrees.branches` | Enumerar las ramas locales y remotas de un repositorio para los selectores de referencia base.    |
| `worktrees.create`   | Crear o reutilizar un árbol de trabajo gestionado con nombre.                               |
| `worktrees.remove`   | Crear una instantánea y eliminar un árbol de trabajo. Las eliminaciones forzadas informan de `snapshotError`. |
| `worktrees.restore`  | Restaurar un árbol de trabajo eliminado desde su instantánea.                           |
| `worktrees.gc`       | Ejecutar ahora la limpieza por inactividad, elementos huérfanos y retención.                            |

`worktrees.list` requiere `operator.read`, y los métodos que realizan cambios requieren `operator.admin`. `worktrees.branches` necesita `operator.write` para los espacios de trabajo de agentes configurados, mientras que cualquier otra ruta del host requiere `operator.admin` (de acuerdo con el requisito de cwd de `sessions.create`). Solo lee referencias existentes y nunca realiza una obtención, y las ramas que solo existen en el remoto se devuelven calificadas con el remoto (`origin/feature-a`), de modo que cada nombre devuelto pueda resolverse como referencia base.

## Espacios de trabajo de Workboard

El [plugin de Workboard](/es/plugins/workboard) incluido puede materializar el espacio de trabajo de una tarjeta como árbol de trabajo gestionado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica la copia de trabajo git de origen. `branch` es opcional y se convierte en la referencia base. Para un autor de llamadas con acceso completo al host, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con la copia de trabajo gestionada como directorio de trabajo y vuelve a escribir en la tarjeta la ruta y la rama resueltas. Los clientes del Gateway necesitan `operator.admin` para la materialización con acceso completo al host. Al finalizar la ejecución, Workboard elimina la copia de trabajo únicamente cuando puede demostrarse que no habrá pérdidas; los cambios pendientes o los commits sin enviar permanecen disponibles.

Para un autor de llamadas restringido al espacio de trabajo, `path` y la raíz del repositorio deben coincidir exactamente con el espacio de trabajo del agente de destino. A continuación, Workboard se ejecuta directamente en ese directorio y registra un espacio de trabajo de directorio en lugar de materializar un árbol de trabajo gestionado en el host. El destino debe utilizar un entorno aislado de Docker con permisos de escritura y no compartido para el mismo espacio de trabajo; el hash de su contenedor activo debe coincidir con los montajes y la política solicitados, y no debe exponer ejecución elevada, control del host, sesiones para todo el host, ejecución persistente en el host o Node, ni herramientas de plugins y MCP sin clasificar. Si la política de destino o el contenedor activo tienen un alcance más amplio, el envío deja la tarjeta sin reclamar e informa del estado incompatible.
