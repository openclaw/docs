---
read_when:
    - Uso o modificación de la herramienta exec
    - Depuración del comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos de stdin y compatibilidad con TTY
title: Herramienta de ejecución
x-i18n:
    generated_at: "2026-07-19T02:07:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 096260e5a5a657682797c00430519f2b664bc7ae9dc682970494fd63a061f227
    source_path: tools/exec.md
    workflow: 16
---

Ejecuta comandos de shell en el espacio de trabajo. `exec` es una superficie de shell con capacidad de modificación: los comandos pueden crear, editar o eliminar archivos donde lo permita el sistema de archivos del host o sandbox seleccionado. Deshabilitar herramientas del sistema de archivos de OpenClaw como `write`, `edit` o `apply_patch` no hace que `exec` sea de solo lectura.

Admite la ejecución en primer plano y en segundo plano mediante `process`. Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`. Las sesiones en segundo plano están aisladas por agente; `process` solo ve las sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se ejecutará.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo del comando.
</ParamField>

<ParamField path="env" type="object">
Modificaciones de entorno de clave/valor que se combinan con el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Envía automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Envía el comando a segundo plano inmediatamente en lugar de esperar a `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sustituye el tiempo de espera de ejecución configurado para esta llamada, en segundos. Se aplica a la ejecución en primer plano, en segundo plano, de `yieldMs`, del Gateway, del sandbox y de `system.run` del Node. `timeout: 0` deshabilita el tiempo de espera del proceso de ejecución para esa llamada.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta en un pseudoterminal cuando esté disponible. Se utiliza para CLI que solo funcionan con TTY, agentes de programación e interfaces de usuario de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Indica dónde ejecutar. `auto` se resuelve como `sandbox` cuando hay un entorno de ejecución de sandbox activo y como `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Se ignora en las llamadas normales a herramientas. La seguridad de `gateway`/`node` está controlada por `tools.exec.security` y el archivo de aprobaciones del host; el modo elevado solo puede forzar `security=full` cuando el operador concede explícitamente acceso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
El modo de solicitud de referencia procede de `tools.exec.ask` y de las aprobaciones del host. En las llamadas al modelo originadas en un canal, el valor `ask` por llamada se ignora cuando la solicitud efectiva del host es `off`; de lo contrario, solo puede reforzarse a un modo más estricto. Los llamadores internos o de API de confianza que crean herramientas de ejecución con un valor `ask` explícito no cambian.
</ParamField>

<ParamField path="node" type="string">
Id/nombre del Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita el modo elevado: sale del entorno aislado hacia la ruta configurada del host. `security=full` se fuerza solo cuando el modo elevado se resuelve como `full`.
</ParamField>

Notas:

- `host` solo acepta `auto`, `sandbox`, `gateway` o `node`. No es un selector de nombres de host; los valores con formato de nombre de host se rechazan antes de ejecutar el comando.
- Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay ningún entorno de ejecución aislado activo.
- Sin configuración adicional, `host=auto` sigue «funcionando sin más»: si no hay entorno aislado, se resuelve como `gateway`; si hay un entorno aislado activo, permanece en él.
- `elevated` sale del entorno aislado hacia la ruta configurada del host: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión o el proveedor actuales.
- Las aprobaciones de `gateway`/`node` se controlan mediante el archivo de aprobaciones del host.
- `node` requiere un Node emparejado (una aplicación complementaria o un host de Node sin interfaz). Si hay varios Nodes disponibles, establezca `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para los Nodes; se ha eliminado el contenedor heredado `nodes.run`.
- En hosts que no sean Windows, exec utiliza `SHELL` cuando está definido; si `SHELL` es `fish`, da preferencia a `bash` (o `sh`) de `PATH` para evitar construcciones de bash incompatibles con fish y, si ninguno existe, recurre a `SHELL`.
- En hosts Windows, exec prioriza la detección de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y, después, PATH) y, a continuación, recurre a Windows PowerShell 5.1.
- En hosts del Gateway que no sean Windows, los comandos exec de bash y zsh utilizan una instantánea de inicio. OpenClaw captura los alias y las funciones que se pueden cargar mediante source, así como un pequeño conjunto seguro de variables de entorno de los archivos de inicio del shell, en `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`; después, carga esa instantánea mediante source antes de cada comando exec. Se excluyen las variables que parecen contener secretos; la ejecución en entornos aislados y Nodes no utiliza esta instantánea. Defina `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso del Gateway para deshabilitar esta ruta de instantáneas.
- La ejecución en el host (`gateway`/`node`) rechaza `env.PATH` y las sobrescrituras del cargador (`LD_*`/`DYLD_*`) para evitar el secuestro de binarios o la inyección de código.
- OpenClaw define `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluidas la ejecución con PTY y en entornos aislados) para que las reglas del shell o del perfil puedan detectar el contexto de la herramienta exec.
- En las ejecuciones originadas en un canal, OpenClaw también expone en `OPENCLAW_CHANNEL_CONTEXT` una carga JSON limitada con la identidad del remitente y del chat cuando el canal proporciona esos identificadores.
- `exec` no puede ejecutar los comandos de shell `openclaw channels login` ni `/approve`: `openclaw channels login` es un flujo interactivo de autenticación del canal y `/approve` debe pasar por el controlador de comandos de aprobación, no por un shell. Inicie sesión en el canal desde un terminal del host del Gateway o utilice una herramienta de agente de inicio de sesión específica del canal cuando exista (por ejemplo, `whatsapp_login`).
- Importante: el aislamiento está **desactivado de forma predeterminada**. Si está desactivado, el valor implícito `host=auto` se resuelve como `gateway`. El valor explícito `host=sandbox` sigue aplicando un cierre seguro en lugar de ejecutarse silenciosamente en el host del Gateway. Habilite el aislamiento o utilice `host=gateway` con aprobaciones.
- Las comprobaciones preliminares de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan los archivos incluidos en el límite efectivo de `workdir`. Si la ruta de un script se resuelve fuera de `workdir`, se omite la comprobación preliminar de ese archivo. La comprobación preliminar también se omite por completo cuando `host=gateway` y la política efectiva es `security=full` con `ask=off`.
- Para trabajos de larga duración que comienzan ahora, inícielos una sola vez y confíe en la reactivación automática al completarse cuando esté habilitada y el comando genere una salida o falle. Utilice `process` para consultar registros o el estado, proporcionar entradas o intervenir; no emule la programación con bucles de suspensión, bucles de tiempo de espera ni sondeos repetidos.
- Los comandos en segundo plano iniciados por el agente aparecen en las vistas de tareas en segundo plano de la Web, iOS y Android hasta que finalizan. El registro de tareas se finaliza antes de que el Heartbeat de finalización vuelva a activar al agente.
- Para trabajos que deban realizarse más adelante o según una programación, utilice Cron en lugar de patrones de suspensión o retraso de `exec`.

## Configuración

| Clave                                | Valor predeterminado                                   | Notas                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Tiempo de espera predeterminado de ejecución por comando, en segundos. El valor `timeout` por llamada lo sustituye; `timeout: 0` por llamada desactiva el tiempo de espera del proceso de ejecución.                  |
| `tools.exec.host`                    | `auto`                                                 | Se resuelve como `sandbox` cuando hay un entorno de ejecución aislado activo; de lo contrario, como `gateway`.                                                                            |
| `tools.exec.security`                | `deny` para el entorno aislado, `full` para el gateway/nodo cuando no se establece |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | sin establecer                                          | Parámetro de política normalizado. Consulte [Modos](#modes) a continuación. No se puede combinar con `tools.exec.security`/`tools.exec.ask`.                                      |
| `tools.exec.reviewer.model`          | modelo principal del agente configurado                 | Sustitución opcional del proveedor/modelo para la revisión de `mode=auto`.                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Tiempo de espera por etapa para la preparación y finalización del modelo revisor antes de recurrir a una persona.                                                                  |
| `tools.exec.node`                    | sin establecer                                          |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Cuando es verdadero, las sesiones de ejecución en segundo plano ponen en cola un evento del sistema y solicitan un Heartbeat al finalizar.                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Emite una única notificación de «en ejecución» cuando una ejecución sujeta a aprobación dura más de este tiempo (`0` lo desactiva).                                                        |
| `tools.exec.strictInlineEval`        | `false`                                                | Consulte [Evaluación en línea](#inline-eval-strictinlineeval).                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | Cuando es verdadero, las solicitudes de aprobación pueden resaltar en el texto del comando los segmentos derivados por el analizador. Se establece globalmente o por agente; no cambia la política de aprobación. |
| `tools.exec.pathPrepend`             | sin establecer                                          | Lista de directorios que se anteponen a `PATH` para las ejecuciones (solo gateway + entorno aislado).                                                                        |
| `tools.exec.safeBins`                | sin establecer                                          | Binarios seguros que solo usan stdin y pueden ejecutarse sin entradas explícitas en la lista de permitidos. Consulte [Binarios seguros](/es/tools/exec-approvals-advanced#safe-bins-stdin-only).         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Directorios explícitos adicionales de confianza para las comprobaciones de rutas de `safeBins`. Las entradas de `PATH` nunca se consideran de confianza automáticamente.                                              |
| `tools.exec.safeBinProfiles`         | sin establecer                                          | Política de argumentos personalizada opcional por binario seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                        |

De forma predeterminada, la ejecución en el host no requiere aprobación para el gateway ni el nodo (`security=full`, `ask=off`); esto proviene de los valores predeterminados de la política del host, no de `host=auto`. Si se desea un comportamiento basado en aprobaciones/listas de permitidos, deben restringirse tanto `tools.exec.*` como el archivo de aprobaciones del host; consulte [Aprobaciones de ejecución](/es/tools/exec-approvals#yolo-mode-no-approval). Para forzar el enrutamiento por el gateway o el nodo independientemente del estado del entorno aislado, establezca `tools.exec.host` o utilice `/exec host=...`.

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

`tools.exec.mode` es el parámetro de política normalizado. Al establecerlo, se derivan `security`/`ask`, y no puede combinarse con valores explícitos de `tools.exec.security`/`tools.exec.ask`.

| Modo        | seguridad   | preguntar | Comportamiento                                                                                                                |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Se deniega la ejecución.                                                                                                      |
| `allowlist` | `allowlist` | `off`     | Solo se ejecutan los comandos incluidos en la lista de permitidos o considerados binarios seguros; no se solicita aprobación para ningún otro. |
| `ask`       | `allowlist` | `on-miss` | Las coincidencias con la lista de permitidos se ejecutan directamente; para todo lo demás se solicita aprobación a una persona. |
| `auto`      | `allowlist` | `on-miss` | Las coincidencias con la lista de permitidos o los binarios seguros se ejecutan directamente; todo lo demás pasa por el revisor automático nativo de OpenClaw antes de solicitar aprobación a una persona. |
| `full`      | `full`      | `off`     | Sin control de aprobación.                                                                                                    |

`ask`/`ask=always` sigue solicitando aprobación a una persona cada vez, independientemente del modo.

La aprobación de la revisión automática es de un solo uso. En el gateway, OpenClaw proporciona al revisor la ruta resuelta del ejecutable y fija la ejecución a esa misma ruta. Los comandos que no pueden reducirse a un único plan de ejecución aplicable —como los heredocs, las expansiones del shell o el entrecomillado no compatible de envoltorios— recurren a la aprobación humana aunque el modelo los permitiera en otras circunstancias.

Las aprobaciones de comandos del servidor de aplicaciones de Codex que aún no estén decididas por una política explícita del entorno de ejecución o una política nativa utilizan la vía de aprobación humana. OpenClaw no ejecuta su revisor de ejecución configurado para estas solicitudes porque Codex no expone un ejecutable resuelto aplicable que permita vincular la decisión de revisión al comando que ejecuta Codex.

### Evaluación en línea (`strictInlineEval`)

Cuando `tools.exec.strictInlineEval` es `true`, las formas de evaluación en línea del intérprete requieren revisión o aprobación explícita: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` y formas similares en otros intérpretes y portadores de comandos compatibles (`awk`, `find -exec`, `make`, `sed`, `xargs` y otros). En `mode=auto`, la vía normal de aprobación de ejecución puede permitir que el revisor automático nativo apruebe un comando puntual claramente de bajo riesgo; las llamadas directas de `system.run` en el host del nodo siguen requiriendo aprobación explícita porque no pueden transferir el comando a una vía de aprobación humana. Si el revisor solicita aprobación, la solicitud se envía a una persona. `allow-always` aún puede conservar invocaciones benignas de intérpretes/scripts, pero las formas de evaluación en línea no se convierten en reglas de autorización persistentes.

### Gestión de PATH

- `host=gateway`: combina el `PATH` del shell de inicio de sesión con el entorno de ejecución. Las sustituciones de `env.PATH` se rechazan para la ejecución en el host. El propio daemon sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Para evitar que la configuración del shell del usuario (como `~/.zshenv` o `/etc/zshenv`) sustituya las rutas prioritarias durante el inicio, las entradas de `tools.exec.pathPrepend` se anteponen de forma segura al `PATH` final dentro del comando del shell justo antes de la ejecución.
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`. OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación del shell); `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al nodo las sustituciones de entorno no bloqueadas que se proporcionen. Las sustituciones de `env.PATH` se rechazan para la ejecución en el host y los hosts de nodo las ignoran. Si se necesitan entradas de PATH adicionales en un nodo, configure el entorno del servicio del host de nodo (systemd/launchd) o instale las herramientas en ubicaciones estándar.

Vinculación de nodos por agente (utilice el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Interfaz de control: la página **Dispositivos** incluye un pequeño panel «Vinculación de nodo de ejecución» para la misma configuración.

## Sustituciones de sesión (`/exec`)

Utilice `/exec` para establecer los valores predeterminados **por sesión** de `host`, `security`, `ask` y `node`. Envíe `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` solo se respeta para **remitentes autorizados** (listas de permitidos/vinculación de canales más `commands.useAccessGroups`). Solo actualiza el **estado de la sesión** y no escribe en la configuración. Los remitentes autorizados de canales externos pueden establecer estos valores predeterminados de sesión. Los clientes internos del gateway/chat web necesitan `operator.admin` para conservarlos.

Para desactivar completamente la ejecución, deniéguela mediante la política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones del host siguen aplicándose, salvo que se establezcan explícitamente `security=full` y `ask=off`.

## Aprobaciones de ejecución (aplicación complementaria / host de nodo)

Los agentes en entornos aislados pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el gateway o en el host de nodo. Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals) para conocer la política, la lista de permitidos y el flujo de la interfaz.

Cuando se requiere aprobación humana, los flujos del host de nodo y los flujos no nativos del gateway devuelven inmediatamente `status: "approval-pending"` y un identificador de aprobación. En cambio, los flujos de chat nativo y de la interfaz web del gateway pueden esperar en línea y devolver el resultado final del comando tras la aprobación. Un resultado `approval-pending` significa que el comando no se ha iniciado, por lo que las advertencias de ejecución alternativa en primer plano solo aparecen si el comando aprobado se ejecuta realmente en línea. Las ejecuciones asíncronas aprobadas emiten eventos del sistema de progreso y finalización del comando (`Exec running` / `Exec finished`); las aprobaciones denegadas o agotadas son definitivas y no reactivan la sesión del agente con un evento del sistema de denegación.

En canales con tarjetas o botones de aprobación nativos, el agente debe recurrir primero a esa interfaz de usuario nativa e incluir un comando manual `/approve` únicamente cuando el resultado de la herramienta indique explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

## Lista de permitidos y binarios seguros

La aplicación manual de la lista de permitidos compara patrones glob de rutas de binarios resueltas y patrones glob de nombres de comandos sin ruta. Los nombres sin ruta solo coinciden con comandos invocados mediante PATH, por lo que `rg` puede coincidir con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.

Cuando `security=allowlist`, los comandos de shell se permiten automáticamente solo si cada segmento de la canalización figura en la lista de permitidos o es un binario seguro. El encadenamiento (`;`, `&&`, `||`) y las redirecciones se rechazan en el modo de lista de permitidos, salvo que cada segmento de nivel superior cumpla la lista de permitidos (incluidos los binarios seguros). Las redirecciones siguen sin ser compatibles. La confianza duradera de `allow-always` no elude esa regla: un comando encadenado sigue requiriendo que cada segmento de nivel superior coincida.

`autoAllowSkills` es una vía práctica independiente en las aprobaciones de ejecución, no equivale a las entradas manuales de rutas de la lista de permitidos. Para una confianza explícita estricta, mantenga `autoAllowSkills` deshabilitado.

Utilice los dos controles para fines distintos:

- `tools.exec.safeBins`: filtros de flujo pequeños que solo usan stdin.
- `tools.exec.safeBinTrustedDirs`: directorios de confianza adicionales explícitos para rutas de ejecutables de binarios seguros.
- `tools.exec.safeBinProfiles`: política de argv explícita para binarios seguros personalizados.
- allowlist: confianza explícita para rutas de ejecutables.

No trate `safeBins` como una lista de permitidos genérica ni añada binarios de intérpretes o entornos de ejecución (por ejemplo, `python3`, `node`, `ruby`, `bash`). Si los necesita, utilice entradas explícitas en la lista de permitidos y mantenga habilitadas las solicitudes de aprobación.

`openclaw security audit` advierte cuando faltan perfiles explícitos para las entradas de intérpretes o entornos de ejecución `safeBins`, y `openclaw doctor --fix` puede generar la estructura inicial de las entradas personalizadas `safeBinProfiles` que falten. `openclaw security audit` y `openclaw doctor` también advierten cuando se vuelven a añadir explícitamente binarios de comportamiento amplio, como `jq`, a `safeBins` (`jq` puede leer datos del entorno y cargar código jq desde módulos o archivos de inicio, por lo que se deben preferir entradas explícitas en la lista de permitidos o ejecuciones sujetas a aprobación). `jq` se deniega como binario seguro incluso cuando aparece explícitamente en la lista. Si incluye intérpretes explícitamente en la lista de permitidos, habilite `tools.exec.strictInlineEval` para que las formas de evaluación de código en línea sigan requiriendo la aprobación de un revisor o una aprobación explícita.

Para consultar todos los detalles y ejemplos de la política, véanse [Aprobaciones de ejecución](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Binarios seguros frente a lista de permitidos](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ejemplos

En primer plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

En segundo plano y consulta:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

La consulta sirve para comprobar el estado bajo demanda, no para bucles de espera. Si está habilitada la reactivación automática al finalizar, el comando puede reactivar la sesión cuando genera una salida o falla.

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

Pegar (entre delimitadores de forma predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para realizar ediciones estructuradas en varios archivos. Está habilitada de forma predeterminada y disponible para cualquier proveedor de modelos; `allowModels` puede restringirla. Utilice la configuración únicamente cuando quiera deshabilitarla o restringirla a modelos específicos:

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

- La política de herramientas sigue siendo aplicable; `allow: ["write"]` permite implícitamente `apply_patch`.
- `deny: ["write"]` no deniega `apply_patch`; deniegue `apply_patch` explícitamente o utilice `deny: ["group:fs"]` cuando también deban bloquearse las escrituras de parches.
- La configuración se encuentra en `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` tiene como valor predeterminado `true`; establézcalo en `false` para deshabilitar la herramienta.
- `tools.exec.applyPatch.workspaceOnly` tiene como valor predeterminado `true` (restringido al espacio de trabajo). Establézcalo en `false` únicamente si desea deliberadamente que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo.
- `tools.exec.applyPatch.allowModels` es una lista de permitidos opcional de identificadores de modelos (sin procesar, como `gpt-5.4`, o completos, como `openai/gpt-5.4`). Cuando se establece, solo los modelos coincidentes obtienen la herramienta; cuando no se establece, todos los modelos la obtienen.

## Temas relacionados

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — controles de aprobación para comandos de shell
- [Aislamiento](/es/gateway/sandboxing) — ejecución de comandos en entornos aislados
- [Proceso en segundo plano](/es/gateway/background-process) — herramientas de ejecución y proceso de larga duración
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
