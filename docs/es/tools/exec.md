---
read_when:
    - Uso o modificación de la herramienta exec
    - Depuración del comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos de stdin y compatibilidad con TTY
title: Herramienta Exec
x-i18n:
    generated_at: "2026-07-12T14:53:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Ejecuta comandos de shell en el espacio de trabajo. `exec` es una superficie de shell con capacidad de modificación: los comandos pueden crear, editar o eliminar archivos donde lo permita el sistema de archivos del host o sandbox seleccionado. Deshabilitar las herramientas del sistema de archivos de OpenClaw, como `write`, `edit` o `apply_patch`, no convierte `exec` en una herramienta de solo lectura.

Admite la ejecución en primer plano y en segundo plano mediante `process`. Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`. Las sesiones en segundo plano tienen alcance por agente; `process` solo ve las sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se ejecutará.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo del comando.
</ParamField>

<ParamField path="env" type="object">
Sustituciones de entorno de clave/valor que se combinan con el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Pasa automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Pasa el comando a segundo plano inmediatamente en lugar de esperar a `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sustituye el tiempo de espera de exec configurado para esta llamada, en segundos. Se aplica a la ejecución en primer plano, en segundo plano, mediante `yieldMs`, en el gateway, en el sandbox y mediante `system.run` de Node. `timeout: 0` deshabilita el tiempo de espera del proceso exec para esa llamada.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta en una pseudoterminal cuando esté disponible. Se usa para CLI que solo funcionan con TTY, agentes de programación e interfaces de usuario de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dónde ejecutar. `auto` se resuelve como `sandbox` cuando hay un entorno de ejecución de sandbox activo y como `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Se ignora en las llamadas normales a herramientas. La seguridad de `gateway`/`node` se controla mediante `tools.exec.security` y el archivo de aprobaciones del host; el modo elevado solo puede forzar `security=full` cuando el operador concede explícitamente el acceso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
El modo de solicitud de referencia procede de `tools.exec.ask` y de las aprobaciones del host. Para las llamadas al modelo originadas en un canal, el valor de `ask` por llamada se ignora cuando el modo de solicitud efectivo del host es `off`; de lo contrario, solo puede reforzarse a un modo más estricto. Las llamadas internas o de API de confianza que construyen herramientas exec con un valor `ask` explícito no cambian.
</ParamField>

<ParamField path="node" type="string">
Id/nombre de Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita el modo elevado: sale del sandbox hacia la ruta configurada del host. `security=full` solo se fuerza cuando el modo elevado se resuelve como `full`.
</ParamField>

Notas:

- `host` solo acepta `auto`, `sandbox`, `gateway` o `node`. No es un selector de nombre de host; los valores similares a nombres de host se rechazan antes de ejecutar el comando.
- Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay un entorno de ejecución de sandbox activo.
- Sin configuración adicional, `host=auto` sigue «funcionando sin más»: si no hay sandbox, se resuelve como `gateway`; si hay un sandbox activo, permanece en el sandbox.
- `elevated` sale del sandbox hacia la ruta configurada del host: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión o el proveedor actuales.
- Las aprobaciones de `gateway`/`node` se controlan mediante el archivo de aprobaciones del host.
- `node` requiere un Node emparejado (aplicación complementaria u host de Node sin interfaz gráfica). Si hay varios Nodes disponibles, configura `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para Nodes; se eliminó el contenedor heredado `nodes.run`.
- En hosts que no sean Windows, exec usa `SHELL` cuando está definido; si `SHELL` es `fish`, prefiere `bash` (o `sh`) desde `PATH` para evitar construcciones de bash incompatibles con fish y, si ninguno está disponible, recurre a `SHELL`.
- En hosts Windows, exec prefiere detectar PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y después PATH) y, si no está disponible, recurre a Windows PowerShell 5.1.
- En hosts gateway que no sean Windows, los comandos exec de bash y zsh usan una instantánea de inicio. OpenClaw captura alias/funciones que pueden cargarse y un pequeño conjunto seguro de variables de entorno desde los archivos de inicio del shell en `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` y, después, carga esa instantánea antes de cada comando exec. Se excluyen las variables que parecen contener secretos; la ejecución exec en sandbox y Node no usa esta instantánea. Define `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso Gateway para deshabilitar esta ruta de instantáneas.
- La ejecución en el host (`gateway`/`node`) rechaza `env.PATH` y las sustituciones del cargador (`LD_*`/`DYLD_*`) para impedir el secuestro de binarios o la inyección de código.
- OpenClaw define `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluida la ejecución con PTY y en sandbox) para que las reglas del shell o del perfil puedan detectar el contexto de la herramienta exec.
- Para las ejecuciones originadas en un canal, OpenClaw también expone una carga JSON limitada con la identidad del remitente/chat en `OPENCLAW_CHANNEL_CONTEXT` cuando el canal proporciona esos identificadores.
- `exec` no puede ejecutar los comandos de shell `openclaw channels login` ni `/approve`: `openclaw channels login` es un flujo interactivo de autenticación de canal y `/approve` debe pasar por el controlador de comandos de aprobación, no por un shell. Ejecuta el inicio de sesión del canal en una terminal del host gateway o usa una herramienta de agente de inicio de sesión específica del canal cuando exista (por ejemplo, `whatsapp_login`).
- Importante: el aislamiento en sandbox está **desactivado de forma predeterminada**. Si está desactivado, el valor implícito `host=auto` se resuelve como `gateway`. El valor explícito `host=sandbox` sigue produciendo un fallo seguro en lugar de ejecutar silenciosamente en el host gateway. Habilita el aislamiento en sandbox o usa `host=gateway` con aprobaciones.
- Las comprobaciones preliminares de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro de los límites efectivos de `workdir`. Si la ruta de un script se resuelve fuera de `workdir`, se omite la comprobación preliminar de ese archivo. La comprobación preliminar también se omite por completo cuando `host=gateway` y la política efectiva es `security=full` con `ask=off`.
- Para trabajos de larga duración que comienzan ahora, inícialos una sola vez y confía en la activación automática al finalizar cuando esté habilitada y el comando produzca salida o falle. Usa `process` para los registros, el estado, la entrada o la intervención; no simules la programación con bucles de espera, bucles de tiempo de espera ni sondeos repetidos.
- Para trabajos que deban realizarse más tarde o según una programación, usa Cron en lugar de patrones de espera o retraso con `exec`.

## Configuración

| Clave                                | Valor predeterminado                                   | Notas                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Tiempo de espera predeterminado por comando exec, en segundos. El valor `timeout` por llamada lo sustituye; `timeout: 0` por llamada deshabilita el tiempo de espera del proceso exec. |
| `tools.exec.host`                    | `auto`                                                 | Se resuelve como `sandbox` cuando hay un entorno de ejecución de sandbox activo y como `gateway` en caso contrario.                                           |
| `tools.exec.security`                | `deny` para sandbox, `full` para gateway/node si no está definido |                                                                                                                                                     |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                                |
| `tools.exec.mode`                    | sin definir                                            | Opción de política normalizada. Consulta [Modos](#modes) más adelante. No puede combinarse con `tools.exec.security`/`tools.exec.ask`.                          |
| `tools.exec.reviewer.model`          | agente principal configurado                           | Sustitución opcional de proveedor/modelo para la revisión con `mode=auto`.                                                                                      |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Tiempo de espera por etapa para la preparación y finalización del modelo revisor antes de recurrir a una persona.                                              |
| `tools.exec.node`                    | sin definir                                            |                                                                                                                                                                |
| `tools.exec.notifyOnExit`            | `true`                                                 | Cuando es true, las sesiones exec en segundo plano ponen en cola un evento del sistema y solicitan un Heartbeat al finalizar.                                  |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Emite un único aviso de «en ejecución» cuando una ejecución exec sujeta a aprobación dura más que este valor (`0` lo deshabilita).                             |
| `tools.exec.strictInlineEval`        | `false`                                                | Consulta [Evaluación en línea](#inline-eval-strictinlineeval).                                                                                                 |
| `tools.exec.commandHighlighting`     | `false`                                                | Cuando es true, las solicitudes de aprobación pueden resaltar en el texto del comando los segmentos derivados del analizador. Puede definirse globalmente o por agente; no cambia la política de aprobación. |
| `tools.exec.pathPrepend`             | sin definir                                            | Lista de directorios que se anteponen a `PATH` para las ejecuciones exec (solo gateway + sandbox).                                                             |
| `tools.exec.safeBins`                | sin definir                                            | Binarios seguros que solo aceptan stdin y pueden ejecutarse sin entradas explícitas en la lista de permitidos. Consulta [Binarios seguros](/es/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Directorios explícitos adicionales de confianza para las comprobaciones de rutas de `safeBins`. Las entradas de `PATH` nunca se consideran de confianza automáticamente. |
| `tools.exec.safeBinProfiles`         | sin definir                                            | Política argv personalizada opcional por binario seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                               |

La ejecución exec en el host sin aprobación es el valor predeterminado para gateway y Node (`security=full`, `ask=off`); esto procede de los valores predeterminados de la política del host, no de `host=auto`. Si deseas un comportamiento con aprobaciones/lista de permitidos, restringe tanto `tools.exec.*` como el archivo de aprobaciones del host; consulta [Aprobaciones de exec](/es/tools/exec-approvals#yolo-mode-no-approval). Para forzar el enrutamiento a gateway o Node independientemente del estado del sandbox, configura `tools.exec.host` o usa `/exec host=...`.

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

`tools.exec.mode` es la opción de política normalizada. Al configurarla, se derivan `security`/`ask` y no puede combinarse con valores explícitos de `tools.exec.security`/`tools.exec.ask`.

| Modo        | security    | ask       | Comportamiento                                                                                                                 |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Se deniega la ejecución.                                                                                                       |
| `allowlist` | `allowlist` | `off`     | Solo se ejecutan los comandos incluidos en la lista de permitidos o considerados binarios seguros; no se solicita nada más.    |
| `ask`       | `allowlist` | `on-miss` | Las coincidencias con la lista de permitidos se ejecutan directamente; para todo lo demás se solicita aprobación humana.       |
| `auto`      | `allowlist` | `on-miss` | Las coincidencias con la lista de permitidos o los binarios seguros se ejecutan directamente; todo lo demás pasa por el revisor automático nativo de OpenClaw antes de solicitar aprobación humana. |
| `full`      | `full`      | `off`     | No hay ninguna puerta de aprobación.                                                                                           |

`ask`/`ask=always` sigue solicitando aprobación humana cada vez, independientemente del modo.

La aprobación mediante revisión automática es de un solo uso. En el Gateway, OpenClaw proporciona al revisor la ruta resuelta del ejecutable y fija la ejecución a esa misma ruta. Los comandos que no pueden reducirse a un único plan de ejecución exigible —como los heredocs, las expansiones del shell o el entrecomillado no compatible de envoltorios— recurren a la aprobación humana aunque, de otro modo, el modelo los permitiera.

Las aprobaciones de comandos del servidor de aplicaciones de Codex que no estén ya decididas por una política explícita del entorno de ejecución o una política nativa utilizan la vía de aprobación humana. OpenClaw no ejecuta su revisor de ejecución configurado para estas solicitudes porque Codex no expone un ejecutable resuelto exigible que permita vincular la decisión de revisión al comando que ejecuta Codex.

### Evaluación en línea (`strictInlineEval`)

Cuando `tools.exec.strictInlineEval` es `true`, las formas de evaluación en línea del intérprete requieren revisión o aprobación explícita: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` y formas similares en otros intérpretes y portadores de comandos compatibles (`awk`, `find -exec`, `make`, `sed`, `xargs` y más). En `mode=auto`, la vía normal de aprobación de ejecución puede permitir que el revisor automático nativo autorice un comando puntual claramente de bajo riesgo; las llamadas directas a `system.run` en el host Node siguen requiriendo aprobación explícita porque no pueden transferir el comando a una vía de aprobación humana. Si el revisor lo solicita, la petición pasa a una persona. `allow-always` puede seguir almacenando invocaciones benignas de intérpretes o scripts, pero las formas de evaluación en línea no se convierten en reglas de autorización permanentes.

### Gestión de PATH

- `host=gateway`: combina el `PATH` del shell de inicio de sesión con el entorno de ejecución. Las sobrescrituras de `env.PATH` se rechazan para la ejecución en el host. El propio daemon sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Para impedir que la configuración del shell del usuario (como `~/.zshenv` o `/etc/zshenv`) sobrescriba las rutas prioritarias durante el inicio, las entradas de `tools.exec.pathPrepend` se anteponen de forma segura al `PATH` final dentro del comando del shell justo antes de la ejecución.
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`. OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación del shell); `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al Node las sobrescrituras de entorno no bloqueadas que se proporcionen. Las sobrescrituras de `env.PATH` se rechazan para la ejecución en el host y los hosts Node las ignoran. Si se necesitan entradas adicionales en PATH en un Node, configure el entorno del servicio del host Node (systemd/launchd) o instale las herramientas en ubicaciones estándar.

Vinculación de Node por agente (use el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Interfaz de control: la página **Dispositivos** incluye un pequeño panel de «Vinculación del Node de ejecución» para los mismos ajustes.

## Sobrescrituras de sesión (`/exec`)

Use `/exec` para establecer valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`. Envíe `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` solo se admite para **remitentes autorizados** (listas de permitidos o emparejamiento del canal, además de `commands.useAccessGroups`). Actualiza **únicamente el estado de la sesión** y no escribe la configuración. Los remitentes autorizados de canales externos pueden establecer estos valores predeterminados de sesión. Los clientes internos del Gateway o del chat web necesitan `operator.admin` para conservarlos.

Para deshabilitar por completo la ejecución, deniéguela mediante la política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones del host siguen aplicándose, salvo que se establezcan explícitamente `security=full` y `ask=off`.

## Aprobaciones de ejecución (aplicación complementaria / host Node)

Los agentes en entornos aislados pueden requerir aprobación para cada solicitud antes de ejecutar `exec` en el Gateway o en el host Node. Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals) para conocer la política, la lista de permitidos y el flujo de la interfaz.

Cuando se requiere aprobación humana, los flujos del host Node y los flujos no nativos del Gateway devuelven inmediatamente `status: "approval-pending"` y un identificador de aprobación. En cambio, los flujos del chat nativo y de la interfaz web del Gateway pueden esperar en línea y devolver el resultado final del comando después de la aprobación. Un resultado `approval-pending` significa que el comando no se ha iniciado, por lo que las advertencias sobre la alternativa en primer plano solo aparecen si el comando aprobado llega a ejecutarse en línea. Las ejecuciones asíncronas aprobadas emiten eventos del sistema sobre el progreso y la finalización del comando (`Exec running` / `Exec finished`); las aprobaciones denegadas o caducadas son definitivas y no reactivan la sesión del agente con un evento del sistema de denegación.

En los canales con tarjetas o botones de aprobación nativos, el agente debe recurrir primero a esa interfaz nativa y solo incluir un comando manual `/approve` cuando el resultado de la herramienta indique explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

## Lista de permitidos y binarios seguros

La aplicación manual de la lista de permitidos busca coincidencias con patrones glob de rutas binarias resueltas y con patrones glob de nombres de comandos sin ruta. Los nombres sin ruta solo coinciden con comandos invocados mediante PATH, por lo que `rg` puede coincidir con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.

Cuando `security=allowlist`, los comandos del shell solo se permiten automáticamente si todos los segmentos de la canalización están incluidos en la lista de permitidos o son binarios seguros. El encadenamiento (`;`, `&&`, `||`) y las redirecciones se rechazan en el modo de lista de permitidos, salvo que todos los segmentos de nivel superior cumplan la lista de permitidos, incluidos los binarios seguros. Las redirecciones siguen sin ser compatibles. La confianza permanente de `allow-always` no elude esta regla: un comando encadenado sigue requiriendo que todos los segmentos de nivel superior coincidan.

`autoAllowSkills` es una vía de conveniencia independiente de las aprobaciones de ejecución y no equivale a las entradas manuales de rutas en la lista de permitidos. Para aplicar una confianza explícita estricta, mantenga `autoAllowSkills` deshabilitado.

Use los dos controles para funciones diferentes:

- `tools.exec.safeBins`: filtros pequeños de flujos que solo usan stdin.
- `tools.exec.safeBinTrustedDirs`: directorios de confianza adicionales y explícitos para las rutas de los ejecutables de binarios seguros.
- `tools.exec.safeBinProfiles`: política de argv explícita para binarios seguros personalizados.
- lista de permitidos: confianza explícita en rutas de ejecutables.

No trate `safeBins` como una lista de permitidos genérica ni añada binarios de intérpretes o entornos de ejecución (por ejemplo, `python3`, `node`, `ruby` o `bash`). Si los necesita, use entradas explícitas en la lista de permitidos y mantenga activadas las solicitudes de aprobación.

`openclaw security audit` advierte cuando las entradas de intérpretes o entornos de ejecución en `safeBins` carecen de perfiles explícitos, y `openclaw doctor --fix` puede generar la estructura inicial de las entradas personalizadas de `safeBinProfiles` que falten. `openclaw security audit` y `openclaw doctor` también advierten cuando se vuelven a añadir explícitamente binarios de comportamiento amplio como `jq` a `safeBins` (`jq` puede leer datos del entorno y cargar código jq desde módulos o archivos de inicio, por lo que es preferible usar entradas explícitas en la lista de permitidos o ejecuciones sujetas a aprobación). `jq` se deniega como binario seguro aunque aparezca explícitamente en la lista. Si incluye intérpretes explícitamente en la lista de permitidos, active `tools.exec.strictInlineEval` para que las formas de evaluación de código en línea sigan requiriendo revisión o aprobación explícita.

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

La consulta sirve para obtener el estado bajo demanda, no para crear bucles de espera. Si está activada la reactivación automática al finalizar, el comando puede reactivar la sesión cuando emita una salida o falle.

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

Pegar (con pegado entre corchetes de forma predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para realizar ediciones estructuradas en varios archivos. Está activada de forma predeterminada y disponible para cualquier proveedor de modelos; `allowModels` permite restringirla. Use la configuración solo cuando quiera deshabilitarla o limitarla a modelos específicos:

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
- `deny: ["write"]` no deniega `apply_patch`; deniegue `apply_patch` explícitamente o use `deny: ["group:fs"]` cuando también deban bloquearse las escrituras mediante parches.
- La configuración se encuentra en `tools.exec.applyPatch`.
- El valor predeterminado de `tools.exec.applyPatch.enabled` es `true`; establézcalo en `false` para deshabilitar la herramienta.
- El valor predeterminado de `tools.exec.applyPatch.workspaceOnly` es `true` (limitado al espacio de trabajo). Establézcalo en `false` únicamente si se pretende que `apply_patch` escriba o elimine contenido fuera del directorio del espacio de trabajo.
- `tools.exec.applyPatch.allowModels` es una lista de permitidos opcional de identificadores de modelos (sin calificar, como `gpt-5.4`, o completos, como `openai/gpt-5.4`). Cuando se establece, solo los modelos coincidentes reciben la herramienta; cuando no se establece, todos los modelos la reciben.

## Temas relacionados

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — puertas de aprobación para comandos del shell
- [Aislamiento](/es/gateway/sandboxing) — ejecución de comandos en entornos aislados
- [Proceso en segundo plano](/es/gateway/background-process) — herramienta de ejecución y procesos de larga duración
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
