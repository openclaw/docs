---
read_when:
    - Quieres una rama y un checkout aislados para una tarea de agente
    - Está configurando tarjetas de Workboard con espacios de trabajo worktree
    - Necesita restaurar o limpiar un árbol de trabajo gestionado por OpenClaw
summary: Ejecuta tareas de agentes en checkouts aislados de git con instantáneas y limpieza automáticas
title: Worktrees administrados
x-i18n:
    generated_at: "2026-07-19T01:55:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ea2627869b2bdae70afd312f02ce26cd5c8caf72a15ce4416584103c65a7dcf
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Los árboles de trabajo administrados proporcionan a la tarea de un agente su propia rama y copia de trabajo de git sin colocar directorios temporales dentro del repositorio de origen. OpenClaw los crea en su directorio de estado, los registra en la base de datos de estado compartida y toma una instantánea de su contenido con seguimiento y sin seguimiento no ignorado antes de eliminarlos.

## Diseño y nombres

Cada árbol de trabajo se encuentra en:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

La huella digital del repositorio son los primeros 16 caracteres hexadecimales de un hash SHA-256 del directorio común canónico de git y la URL de origen. Un nombre proporcionado debe coincidir con `[a-z0-9][a-z0-9-]{0,63}`. Sin un nombre, OpenClaw genera `wt-` seguido de ocho caracteres hexadecimales aleatorios.

OpenClaw crea la rama `openclaw/<name>` en la referencia base solicitada. Sin una referencia base, obtiene `origin`, utiliza la rama predeterminada remota cuando está disponible y recurre a la rama local `HEAD` cuando el repositorio está sin conexión o no tiene un remoto utilizable.

## Aprovisionar archivos ignorados

Añada `.worktreeinclude` en la raíz del repositorio de origen para copiar archivos seleccionados ignorados y sin seguimiento a un nuevo árbol de trabajo. El archivo utiliza la sintaxis de patrones de gitignore, un patrón por línea, con comentarios `#`:

```gitignore
.env.local
fixtures/generated/**
```

Solo son aptos los archivos que git indique como ignorados y sin seguimiento. Los archivos con seguimiento ya están presentes mediante git y nunca se copian en este paso. OpenClaw no sobrescribe ni modifica los archivos de destino que ya existen, no sigue directorios con enlaces simbólicos y conserva los modos de los archivos copiados. Registra únicamente las rutas que realmente crea, por lo que las ediciones posteriores del manifiesto no pueden hacer que esos archivos pierdan la protección durante la limpieza.

## Ejecutar la configuración del repositorio

Si `.openclaw/worktree-setup.sh` existe en el repositorio de origen y es ejecutable, OpenClaw lo ejecuta con el nuevo árbol de trabajo como directorio actual. El script recibe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Una salida distinta de cero cancela la creación y elimina el nuevo árbol de trabajo y la rama. Este es un contrato local del repositorio; no existe ninguna clave de configuración de OpenClaw para él.

## Árboles de trabajo de sesión

Inicie un chat aislado desde el espacio de trabajo git del agente activo con una sesión respaldada por un árbol de trabajo: active **Árbol de trabajo** en la página Nueva sesión de la Interfaz de Control (que también ofrece un selector de rama base y un nombre opcional para el árbol de trabajo), o utilice el menú de acciones del chat en iOS o la acción de desbordamiento junto a Nuevo chat en Android. La opción solo está disponible para un agente respaldado por git cuando el cliente dispone de esa capacidad; los clientes que no pueden comprobarla previamente muestran en su lugar el error del Gateway.

Los agentes de programación también pueden llamar a `spawn_task` cuando descubren trabajo posterior confirmado fuera de la tarea actual. La Interfaz de Control muestra una sugerencia sin iniciar nada, mientras que una TUI respaldada por un Gateway muestra un mensaje interactivo con las mismas acciones. Seleccionar **Iniciar en un árbol de trabajo** crea un árbol de trabajo nuevo propiedad de la sesión a partir del proyecto sugerido y envía la indicación autocontenida como su primer turno; descartar la sugerencia deja el repositorio intacto. Las sugerencias y sus identificadores son efímeros y no sobreviven a un reinicio del Gateway.

OpenClaw expone estas herramientas únicamente a sesiones de operador con una interfaz de usuario del Gateway que permita actuar. Las sesiones de canal y las sesiones de TUI locales o integradas no las reciben hasta que esas superficies dispongan de un contrato portátil de acciones de tarea con tipos.

El árbol de trabajo administrado resultante pertenece a la sesión, y cada ejecución de agente en esa sesión utiliza su copia de trabajo. Cuando el espacio de trabajo es un subdirectorio del repositorio, el árbol de trabajo se ancla en la raíz del repositorio y la sesión se ejecuta desde el subdirectorio correspondiente dentro de él. La creación del árbol de trabajo de la sesión utiliza el ámbito `operator.write` del método, pero los hooks de la copia de trabajo del repositorio y el paso `.openclaw/worktree-setup.sh` solo se ejecutan para llamadores `operator.admin` porque ejecutan código del repositorio; el aprovisionamiento `.worktreeinclude` sigue aplicándose a todos los llamadores. Al eliminar la sesión, el árbol de trabajo solo se elimina cuando hacerlo no supone pérdida alguna. Los árboles de trabajo con cambios o las ramas con commits sin enviar permanecen disponibles; la limpieza por hora toma instantáneas de los árboles de trabajo de sesión después de 7 días de inactividad, considerando la actividad reciente de la sesión como actividad del árbol de trabajo. Los árboles de trabajo eliminados siguen siendo restaurables desde sus instantáneas como se describe a continuación.

`sessions.create` puede incluir una ruta absoluta `cwd` junto con `worktree: true` cuando una tarea se dirige a un proyecto distinto del espacio de trabajo configurado del agente. Esa ruta explícita del host requiere `operator.admin`; la creación ordinaria de chats con árboles de trabajo permanece en `operator.write` y sigue anclada al espacio de trabajo configurado.

`sessions.create` también acepta `worktreeBaseRef` y `worktreeName` junto con `worktree: true` para elegir la referencia base y el nombre del árbol de trabajo (la rama se convierte en `openclaw/<name>`); ambos permanecen en `operator.write`. El árbol de trabajo creado se devuelve en el resultado de creación y se conserva en la fila de la sesión como `worktree: { id, branch, repoRoot }`, por lo que las listas de sesiones pueden mostrar la copia de trabajo y la rama. Al eliminar una sesión, se informa de una copia de trabajo con cambios conservada como `worktreePreserved` en lugar de dejarla atrás silenciosamente.

## Instantáneas, limpieza y restauración

La eliminación crea primero un commit sintético que contiene los archivos con seguimiento y los archivos sin seguimiento no ignorados, y después lo fija en `refs/openclaw/snapshots/<id>`. Los archivos ignorados nunca entran en la base de datos de objetos del repositorio. OpenClaw almacena únicamente los archivos ignorados que realmente aprovisionó en filas fragmentadas de la base de datos de estado compartida; el conjunto de rutas registrado sigue siendo la fuente autoritativa aunque `.worktreeinclude` cambie posteriormente o desaparezca. La restauración lee esos bytes de la instantánea inmutable y vuelve a aplicar sus modos completos. La limpieza automática conserva un árbol de trabajo activo cuando ya no se puede crear de forma segura una instantánea de una ruta registrada. Si falla la creación de la instantánea, la eliminación se detiene. Una eliminación forzada explícita puede continuar sin una instantánea.

OpenClaw aplica estas reglas de limpieza:

- Al finalizar la ejecución, elimina un árbol de trabajo únicamente cuando `git status --porcelain` está vacío y `git log HEAD --not --remotes --oneline` no encuentra commits sin enviar. De lo contrario, solo libera el bloqueo de actividad.
- La limpieza por hora toma instantáneas y elimina los árboles de trabajo desbloqueados propiedad de Workboard y de sesiones que lleven más de 7 días inactivos, incluso cuando tengan cambios. Los árboles de trabajo manuales nunca se eliminan automáticamente.
- Cuando se configura `worktrees.cleanup.maxCount` o `worktrees.cleanup.maxTotalSizeGb`, la limpieza también toma instantáneas y elimina los árboles de trabajo propiedad de Workboard y de sesiones con actividad menos reciente hasta que el recuento total y el tamaño en disco se ajusten a los límites. Todos los árboles de trabajo administrados cuentan para los totales, pero los árboles de trabajo manuales y los protegidos por otros motivos nunca se expulsan por límites, por lo que un límite puede seguir superándose hasta que existan árboles de trabajo aptos. 0 o un valor sin configurar desactiva un límite.
- Los registros de instantáneas permanecen restaurables durante 30 días. Después, la limpieza elimina la referencia de la instantánea y la fila del registro.
- Un bloqueo de un proceso activo de OpenClaw y cualquier bloqueo de árbol de trabajo git ajeno o no reconocido protegen un árbol de trabajo frente a la recolección de elementos no utilizados.

La restauración vuelve a crear `openclaw/<name>` en el commit original anterior a la instantánea y después reconstruye las diferencias de la instantánea como modificaciones no preparadas y archivos sin seguimiento. Esto mantiene el commit sintético de la instantánea fuera del historial de la rama. La referencia de la instantánea permanece registrada como procedencia.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La página **Árboles de trabajo** de la Interfaz de Control, en Configuración, proporciona las mismas acciones, además de la creación con un selector de rama base; muestra el propietario de cada árbol de trabajo (manual, Workboard o la sesión propietaria con un enlace a su chat) y ofrece un reintento forzado cuando una eliminación informa de un error en la instantánea. Su sección **Limpieza** permite editar los límites de retención `worktrees.cleanup` descritos en la [referencia de configuración](/es/gateway/configuration-reference#worktrees).

## Métodos del Gateway

| Método               | Finalidad                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Enumera los registros de árboles de trabajo activos y restaurables.                            |
| `worktrees.branches` | Enumera las ramas locales y remotas de un repositorio para los selectores de referencia base.    |
| `worktrees.create`   | Crea o reutiliza un árbol de trabajo administrado con nombre.                               |
| `worktrees.remove`   | Toma una instantánea y elimina un árbol de trabajo. Las eliminaciones forzadas informan de `snapshotError`. |
| `worktrees.restore`  | Restaura un árbol de trabajo eliminado desde su instantánea.                           |
| `worktrees.gc`       | Ejecuta inmediatamente la limpieza por inactividad, elementos huérfanos y retención.                            |

`worktrees.list` requiere `operator.read`, y los métodos que realizan modificaciones requieren `operator.admin`. `worktrees.branches` necesita `operator.write` para los espacios de trabajo de agentes configurados, mientras que cualquier otra ruta del host requiere `operator.admin` (en consonancia con el requisito de cwd de `sessions.create`). Solo lee referencias existentes y nunca realiza una obtención, y las ramas que solo existen en el remoto se devuelven calificadas con el remoto (`origin/feature-a`) para que cada nombre devuelto se resuelva como una referencia base.

## Espacios de trabajo de Workboard

El [Plugin Workboard](/es/plugins/workboard) incluido puede materializar el espacio de trabajo de una tarjeta como un árbol de trabajo administrado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica la copia de trabajo git de origen. `branch` es opcional y se convierte en la referencia base. Para un llamador con acceso completo al host, Workboard crea o reutiliza `wb-<card-id>`, ejecuta el subagente con la copia de trabajo administrada como directorio de trabajo y vuelve a escribir en la tarjeta la ruta y la rama resueltas. Los clientes del Gateway necesitan `operator.admin` para la materialización con acceso completo al host. Al finalizar la ejecución, Workboard elimina la copia de trabajo únicamente cuando se puede demostrar que no habrá pérdidas; el trabajo con cambios o los commits sin enviar permanecen disponibles.

Para un llamador limitado al espacio de trabajo, `path` y la raíz del repositorio deben coincidir exactamente con el espacio de trabajo del agente de destino. Workboard se ejecuta entonces directamente en ese directorio y registra un espacio de trabajo de directorio en lugar de materializar en el host un árbol de trabajo administrado. El destino debe utilizar un entorno aislado de Docker con escritura y no compartido para el mismo espacio de trabajo, el hash de su contenedor activo debe coincidir con los montajes y la política solicitados, y no debe exponer ejecución elevada, control del host, sesiones de todo el host, ejecución persistente en el host o Node, ni herramientas de Plugin y MCP sin clasificar. Si la política de destino o el contenedor activo tienen un alcance más amplio, el envío deja la tarjeta sin reclamar e informa del estado incompatible.
