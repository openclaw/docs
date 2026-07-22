---
read_when:
    - Uso o modificación de la herramienta exec
    - Depuración del comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos de stdin y compatibilidad con TTY
title: Herramienta de ejecución
x-i18n:
    generated_at: "2026-07-22T10:49:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c16b5122c527c069a4d1a0c1649726073339e95b9084100c1a0f45ebcae759d
    source_path: tools/exec.md
    workflow: 16
---

Ejecuta comandos de shell en el espacio de trabajo. `exec` es una superficie de shell con capacidad de modificación: los comandos pueden crear, editar o eliminar archivos donde lo permita el sistema de archivos del host o sandbox seleccionado. Deshabilitar las herramientas del sistema de archivos de OpenClaw, como `write`, `edit` o `apply_patch`, no convierte `exec` en una herramienta de solo lectura.

Admite la ejecución en primer plano y en segundo plano mediante `process`. Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`. Las sesiones en segundo plano se limitan por agente; `process` solo ve las sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se debe ejecutar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo del comando.
</ParamField>

<ParamField path="env" type="object">
Sobrescrituras de variables de entorno en forma de pares clave/valor que se combinan con el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Pasa automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Pasa el comando a segundo plano inmediatamente en lugar de esperar a `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSeconds">
Sobrescribe para esta llamada el tiempo de espera de ejecución configurado, en segundos. Se aplica a la ejecución en primer plano, en segundo plano, de `yieldMs`, en el Gateway, en el sandbox y de `system.run` en Node. `timeout: 0` deshabilita el tiempo de espera del proceso de ejecución para esa llamada.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta el comando en un seudoterminal cuando esté disponible. Se utiliza para CLI que solo funcionan con TTY, agentes de programación e interfaces de usuario de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Lugar de ejecución. `auto` se resuelve como `sandbox` cuando hay un entorno de ejecución de sandbox activo y como `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Se ignora en las llamadas normales a herramientas. La seguridad de `gateway`/`node` se deriva de `tools.exec.mode` y del archivo de aprobaciones del host; el modo elevado solo puede forzar el acceso completo cuando el operador concede explícitamente acceso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
El modo de solicitud de referencia se deriva de `tools.exec.mode` y de las aprobaciones del host. Para las llamadas al modelo originadas en canales, se ignora `ask` por llamada cuando la solicitud efectiva del host es `off`; de lo contrario, solo puede reforzarse a un modo más estricto.
</ParamField>

<ParamField path="node" type="string">
Id./nombre del Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita el modo elevado: sale del entorno aislado hacia la ruta del host configurada. `security=full` solo se fuerza cuando el modo elevado se resuelve como `full`.
</ParamField>

Notas:

- `host` solo acepta `auto`, `sandbox`, `gateway` o `node`. No es un selector de nombre de host; los valores con apariencia de nombre de host se rechazan antes de ejecutar el comando.
- Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay ningún entorno de ejecución aislado activo.
- Sin configuración adicional, `host=auto` sigue «funcionando sin más»: si no hay entorno aislado, se resuelve como `gateway`; si hay un entorno aislado activo, permanece en él.
- `elevated` sale del entorno aislado hacia la ruta del host configurada: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión o el proveedor actuales.
- Las aprobaciones de `gateway`/`node` se controlan mediante el archivo de aprobaciones del host.
- `node` requiere un Node emparejado (aplicación complementaria o host de Node sin interfaz gráfica). Si hay varios Nodes disponibles, configure `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para los Nodes; se ha eliminado el contenedor heredado `nodes.run`.
- En hosts que no sean Windows, exec utiliza `SHELL` cuando está definido; si `SHELL` es `fish`, prefiere `bash` (o `sh`) de `PATH` para evitar construcciones de bash incompatibles con fish y, si ninguno existe, recurre a `SHELL`.
- En hosts Windows, exec prioriza la detección de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y, a continuación, PATH) y después recurre a Windows PowerShell 5.1.
- En hosts del Gateway que no sean Windows, los comandos exec de bash y zsh utilizan una instantánea de inicio. OpenClaw captura los alias y las funciones que pueden cargarse mediante source, así como un pequeño conjunto seguro de variables de entorno, desde los archivos de inicio del shell en `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` y, a continuación, carga esa instantánea mediante source antes de cada comando exec. Se excluyen las variables que parecen contener secretos; la ejecución en entornos aislados y Nodes no utiliza esta instantánea. Defina `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso del Gateway para deshabilitar esta ruta de instantánea.
- La ejecución en el host (`gateway`/`node`) rechaza `env.PATH` y las sustituciones del cargador (`LD_*`/`DYLD_*`) para impedir el secuestro de binarios o la inyección de código.
- OpenClaw define `OPENCLAW_SHELL=exec` en el entorno del comando iniciado (incluidas las ejecuciones mediante PTY y en entornos aislados) para que las reglas del shell o del perfil puedan detectar el contexto de la herramienta exec.
- Para las ejecuciones originadas en canales, OpenClaw también expone en `OPENCLAW_CHANNEL_CONTEXT` una carga JSON limitada con la identidad del remitente y del chat cuando el canal proporcionó esos identificadores.
- `exec` no puede ejecutar los comandos de shell `openclaw channels login` ni `/approve`: `openclaw channels login` es un flujo interactivo de autenticación del canal y `/approve` debe pasar por el controlador de comandos de aprobación, no por un shell. Ejecute el inicio de sesión del canal en una terminal del host del Gateway o utilice una herramienta de agente específica del canal para iniciar sesión cuando exista (por ejemplo, `whatsapp_login`).
- Importante: el aislamiento está **desactivado de forma predeterminada**. Si el aislamiento está desactivado, `host=auto` implícito se resuelve como `gateway`. `host=sandbox` explícito sigue fallando de forma segura en lugar de ejecutarse silenciosamente en el host del Gateway. Habilite el aislamiento o utilice `host=gateway` con aprobaciones.
- Las comprobaciones preliminares de scripts (para detectar errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro del límite efectivo de `workdir`. Si la ruta de un script se resuelve fuera de `workdir`, se omite la comprobación preliminar de ese archivo. La comprobación preliminar también se omite por completo cuando `host=gateway` y la política efectiva es `security=full` con `ask=off`.
- Para trabajos de larga duración que comiencen ahora, inícielos una sola vez y utilice la reactivación automática al completarse cuando esté habilitada y el comando genere salida o falle. Utilice `process` para consultar registros o el estado, proporcionar entradas o intervenir; no emule la programación mediante bucles de espera, bucles de tiempo de espera ni sondeos repetidos.
- Los comandos en segundo plano iniciados por el agente aparecen en las vistas de tareas en segundo plano de la Web, iOS y Android hasta que terminan. El registro de tareas se finaliza antes de que el Heartbeat de finalización reactive de nuevo al agente.
- Para los trabajos que deban realizarse más adelante o según una programación, utilice Cron en lugar de patrones de espera o retraso con `exec`.

## Configuración

| Clave                                | Valor predeterminado     | Notas                                                                                                                                                   |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSeconds`          | `1800`                   | Tiempo de espera predeterminado de ejecución por comando, en segundos. El valor por llamada `timeout` lo anula; el valor por llamada `timeout: 0` desactiva el tiempo de espera del proceso de ejecución.                  |
| `tools.exec.host`                    | `auto`                   | Se resuelve como `sandbox` cuando hay un entorno de ejecución de sandbox activo; de lo contrario, como `gateway`.                                                                            |
| `tools.exec.mode`                    | derivado del host        | Opción de política canónica. Consulte [Modos](#modes) más adelante.                                                                                                       |
| `tools.exec.reviewer.model`          | modelo principal configurado del agente | Sustitución opcional del proveedor/modelo para la revisión de `mode=auto`.                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                  | Tiempo de espera por etapa para la preparación y finalización del modelo revisor antes de recurrir a una persona.                                                                  |
| `tools.exec.node`                    | sin establecer           |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                   | Cuando es verdadero, las sesiones de ejecución en segundo plano ponen en cola un evento del sistema y solicitan un Heartbeat al finalizar.                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                  | Emite un único aviso de «en ejecución» cuando una ejecución sujeta a aprobación dura más que este valor (`0` lo desactiva).                                                        |
| `tools.exec.strictInlineEval`        | `false`                  | Consulte [Evaluación en línea](#inline-eval-strictinlineeval).                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                  | Cuando es verdadero, las solicitudes de aprobación pueden resaltar en el texto del comando los segmentos de comando derivados del analizador. Se establece globalmente o por agente; no cambia la política de aprobación. |
| `tools.exec.pathPrepend`             | sin establecer           | Lista de directorios que se antepondrán a `PATH` para las ejecuciones (solo Gateway y sandbox).                                                                        |
| `tools.exec.safeBins`                | sin establecer           | Binarios seguros que solo usan la entrada estándar y pueden ejecutarse sin entradas explícitas en la lista de permitidos. Consulte [Binarios seguros](/es/tools/exec-approvals-advanced#safe-bins-stdin-only).         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`       | Directorios explícitos adicionales de confianza para las comprobaciones de rutas de `safeBins`. Las entradas de `PATH` nunca se consideran de confianza automáticamente.                                              |
| `tools.exec.safeBinProfiles`         | sin establecer           | Política argv personalizada opcional por binario seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                        |

La ejecución en el host sin aprobación es el valor predeterminado para Gateway y Node (`mode=full`); esto proviene de los valores predeterminados de la política del host, no de `host=auto`. Para usar aprobaciones o una lista de permitidos, establezca `tools.exec.mode` y restrinja el archivo de aprobaciones del host; consulte [Aprobaciones de ejecución](/es/tools/exec-approvals#yolo-mode-no-approval). Para forzar el enrutamiento mediante Gateway o Node independientemente del estado del sandbox, establezca `tools.exec.host` o use `/exec host=...`.

Ejemplo:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Modos

`tools.exec.mode` es la opción de política persistente canónica. El comportamiento de seguridad y aprobación del entorno de ejecución se deriva de ella.

| Modo        | seguridad    | solicitud       | Comportamiento                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Se deniega la ejecución.                                                                                                                |
| `allowlist` | `allowlist` | `off`     | Solo se ejecutan los comandos incluidos en la lista de permitidos o que sean binarios seguros; no se solicita nada más.                                                                 |
| `ask`       | `allowlist` | `on-miss` | Las coincidencias con la lista de permitidos se ejecutan directamente; todo lo demás requiere consultar a una persona.                                                                  |
| `auto`      | `allowlist` | `on-miss` | Las coincidencias con la lista de permitidos o los binarios seguros se ejecutan directamente; todo lo demás pasa por el revisor automático nativo de OpenClaw antes de consultar a una persona. |
| `full`      | `full`      | `off`     | No hay barrera de aprobación.                                                                                                              |

El valor `/exec ask=always` por sesión sigue consultando a una persona cada vez, independientemente del modo persistente.

La aprobación de la revisión automática es de un solo uso. En el Gateway, OpenClaw proporciona al revisor la ruta resuelta del ejecutable y fija la ejecución a esa misma ruta. Los comandos que no puedan reducirse a un único plan de ejecución aplicable —como los documentos «here», las expansiones del shell o las comillas no admitidas en envoltorios— recurren a la aprobación humana, incluso si el modelo los permitiría en otras circunstancias.

Las aprobaciones de comandos del servidor de aplicaciones de Codex que no estén ya decididas por una política explícita del entorno de ejecución o una política nativa utilizan la vía de aprobación humana. OpenClaw no ejecuta su revisor de ejecución configurado para estas solicitudes porque Codex no expone un ejecutable resuelto aplicable que permita vincular la decisión de revisión al comando que ejecuta Codex.

### Evaluación en línea (`strictInlineEval`)

Cuando `tools.exec.strictInlineEval` es `true`, las formas de evaluación en línea del intérprete requieren revisión o aprobación explícita: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` y formas similares en otros intérpretes y portadores de comandos compatibles (`awk`, `find -exec`, `make`, `sed`, `xargs` y más). En `mode=auto`, la vía normal de aprobación de ejecución puede permitir que el revisor automático nativo autorice un comando puntual claramente de bajo riesgo; las llamadas directas `system.run` al host de Node siguen requiriendo una aprobación explícita porque no pueden remitir el comando a una vía de aprobación humana. Si el revisor lo solicita, la petición se envía a una persona. `allow-always` aún puede conservar invocaciones benignas de intérpretes o scripts, pero las formas de evaluación en línea no se convierten en reglas de autorización permanentes.

### Gestión de PATH

- `host=gateway`: combina el `PATH` del shell de inicio de sesión con el entorno de ejecución. Se rechazan las sustituciones de `env.PATH` para la ejecución en el host. El propio daemon sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Para impedir que la configuración del shell del usuario (como `~/.zshenv` o `/etc/zshenv`) sustituya las rutas prioritarias durante el inicio, las entradas de `tools.exec.pathPrepend` se anteponen de forma segura al `PATH` final dentro del comando del shell justo antes de la ejecución.
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`. OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación del shell); `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al Node las sustituciones de entorno no bloqueadas que se proporcionen. Se rechazan las sustituciones de `env.PATH` para la ejecución en el host y los hosts de Node las ignoran. Si se necesitan entradas de PATH adicionales en un Node, se debe configurar el entorno del servicio del host de Node (systemd/launchd) o instalar las herramientas en ubicaciones estándar.

Vinculación de Node por agente (use en la configuración el ID de agente que sirve como clave):

```bash
openclaw config get agents.entries
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
```

Interfaz de control: la página **Dispositivos** incluye un pequeño panel «Vinculación del Node de ejecución» para la misma configuración.

## Sustituciones de sesión (`/exec`)

Use `/exec` para establecer los valores predeterminados **por sesión** de `host`, `security`, `ask` y `node`. Envíe `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` solo se respeta para **remitentes autorizados** mediante listas de permitidos de canales, emparejamiento y grupos de acceso. La aplicación de los grupos de acceso está siempre activada. Solo actualiza el **estado de la sesión** y no escribe en la configuración. Los remitentes autorizados de canales externos pueden establecer estos valores predeterminados de sesión. Los clientes internos del Gateway o del chat web necesitan `operator.admin` para conservarlos.

Para desactivar por completo la ejecución, deniéguela mediante la política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones del host siguen aplicándose salvo que se establezcan explícitamente `security=full` y `ask=off`.

## Aprobaciones de ejecución (aplicación complementaria / host de Node)

Los agentes en entornos aislados pueden requerir aprobación para cada solicitud antes de que `exec` se ejecute en el Gateway o en el host de Node. Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals) para conocer la política, la lista de permitidos y el flujo de la interfaz.

Cuando se requiere aprobación humana, los flujos del host de Node y los flujos no nativos del Gateway devuelven inmediatamente `status: "approval-pending"` y un ID de aprobación. En cambio, los flujos del chat nativo y de la interfaz web del Gateway pueden esperar en línea y devolver el resultado final del comando tras la aprobación. Un resultado `approval-pending` significa que el comando no se ha iniciado, por lo que las advertencias sobre la ejecución alternativa en primer plano solo aparecen si el comando aprobado llega a ejecutarse en línea. Las ejecuciones asíncronas aprobadas emiten eventos del sistema sobre el progreso y la finalización del comando (`Exec running` / `Exec finished`); las aprobaciones denegadas o que agotan el tiempo de espera son terminales y no reactivan la sesión del agente con un evento del sistema de denegación.

En los canales con tarjetas o botones de aprobación nativos, el agente debe utilizar primero esa interfaz nativa y solo incluir un comando manual `/approve` cuando el resultado de la herramienta indique explícitamente que las aprobaciones mediante chat no están disponibles o que la aprobación manual es la única vía.

## Lista de permitidos y binarios seguros

La aplicación manual de la lista de permitidos compara patrones glob de rutas de binarios resueltas y patrones glob de nombres de comandos sin ruta. Los nombres sin ruta solo coinciden con comandos invocados mediante PATH, por lo que `rg` puede coincidir con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.

Cuando `security=allowlist`, los comandos del shell solo se autorizan automáticamente si todos los segmentos de la canalización están incluidos en la lista de permitidos o son binarios seguros. El encadenamiento (`;`, `&&`, `||`) y las redirecciones se rechazan en el modo de lista de permitidos, salvo que cada segmento de nivel superior cumpla la lista de permitidos (incluidos los binarios seguros). Las redirecciones siguen sin ser compatibles. La confianza permanente de `allow-always` no omite esta regla: un comando encadenado sigue requiriendo que cada segmento de nivel superior coincida.

`autoAllowSkills` es una vía de conveniencia independiente en las aprobaciones de ejecución, no lo mismo que las entradas manuales de rutas en la lista de permitidos. Para una confianza explícita estricta, mantenga `autoAllowSkills` desactivado.

Utilice los dos controles para fines distintos:

- `tools.exec.safeBins`: filtros de flujo pequeños que solo usan la entrada estándar.
- `tools.exec.safeBinTrustedDirs`: directorios adicionales de confianza explícitos para las rutas de ejecutables de binarios seguros.
- `tools.exec.safeBinProfiles`: política de argv explícita para binarios seguros personalizados.
- lista de permitidos: confianza explícita en rutas de ejecutables.

No trate `safeBins` como una lista de permitidos genérica ni añada binarios de intérpretes o entornos de ejecución (por ejemplo, `python3`, `node`, `ruby`, `bash`). Si se necesitan, utilice entradas explícitas en la lista de permitidos y mantenga activadas las solicitudes de aprobación.

`openclaw security audit` advierte cuando faltan perfiles explícitos para las entradas `safeBins` de intérpretes o entornos de ejecución, y `openclaw doctor --fix` puede generar la estructura inicial de las entradas personalizadas `safeBinProfiles` que falten. `openclaw security audit` y `openclaw doctor` también advierten cuando se vuelven a añadir explícitamente binarios con comportamiento amplio, como `jq`, a `safeBins` (`jq` puede leer datos del entorno y cargar código jq desde módulos o archivos de inicio, por lo que se recomienda utilizar en su lugar entradas explícitas en la lista de permitidos o ejecuciones sujetas a aprobación). `jq` se deniega como binario seguro incluso si aparece explícitamente en la lista. Si se incluyen intérpretes explícitamente en la lista de permitidos, active `tools.exec.strictInlineEval` para que las formas de evaluación de código en línea sigan requiriendo revisión o aprobación explícita.

Para obtener todos los detalles y ejemplos de la política, consulte [Aprobaciones de ejecución](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Binarios seguros frente a lista de permitidos](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ejemplos

Primer plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano y consulta:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

La consulta sirve para obtener el estado a petición, no para crear bucles de espera. Si está activada la reactivación automática al finalizar, el comando puede reactivar la sesión cuando emite salida o falla.

Enviar teclas (al estilo de tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (solo envía CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pegar (delimitado de forma predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para realizar ediciones estructuradas en varios archivos. Está activada de forma predeterminada y disponible para cualquier proveedor de modelos; `allowModels` puede restringirla. Utilice la configuración únicamente cuando desee desactivarla o restringirla a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Notas:

- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- `deny: ["write"]` no deniega `apply_patch`; deniegue `apply_patch` explícitamente o utilice `deny: ["group:fs"]` cuando también deban bloquearse las escrituras de parches.
- La configuración se encuentra en `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` tiene como valor predeterminado `true`; establézcalo en `false` para desactivar la herramienta.
- `tools.exec.applyPatch.workspaceOnly` tiene como valor predeterminado `true` (limitado al espacio de trabajo). Establézcalo en `false` únicamente si se desea expresamente que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo.
- `tools.exec.applyPatch.allowModels` es una lista de permitidos opcional de ID de modelos (sin procesar, como `gpt-5.4`, o completos, como `openai/gpt-5.4`). Cuando está establecida, solo los modelos coincidentes reciben la herramienta; cuando no está establecida, todos los modelos la reciben.

## Temas relacionados

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — barreras de aprobación para comandos del shell
- [Aislamiento](/es/gateway/sandboxing) — ejecución de comandos en entornos aislados
- [Proceso en segundo plano](/es/gateway/background-process) — herramientas de ejecución y procesos de larga duración
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
