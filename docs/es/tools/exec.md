---
read_when:
    - Usar o modificar la herramienta exec
    - Depuración del comportamiento de stdin o TTY
summary: Uso de la herramienta Exec, modos de stdin y compatibilidad con TTY
title: Herramienta Exec
x-i18n:
    generated_at: "2026-07-05T11:46:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64121c1affd7d44ebac49b2cd1986ad393e90a52ddc66d4ddefdfecb4bffa17b
    source_path: tools/exec.md
    workflow: 16
---

Ejecuta comandos de shell en el espacio de trabajo. `exec` es una superficie de shell mutante: los comandos pueden crear, editar o eliminar archivos donde lo permita el host seleccionado o el sistema de archivos del sandbox. Deshabilitar herramientas de sistema de archivos de OpenClaw como `write`, `edit` o `apply_patch` no hace que `exec` sea de solo lectura.

Admite ejecución en primer plano y en segundo plano mediante `process`. Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`. Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se ejecutará.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo para el comando.
</ParamField>

<ParamField path="env" type="object">
Anulaciones de entorno de clave/valor combinadas sobre el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Enviar automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Enviar el comando a segundo plano inmediatamente en lugar de esperar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Anula el tiempo de espera de exec configurado para esta llamada, en segundos. Se aplica a la ejecución en primer plano, en segundo plano, `yieldMs`, Gateway, sandbox y Node `system.run`. `timeout: 0` deshabilita el tiempo de espera del proceso exec para esa llamada.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecutar en una pseudoterminal cuando esté disponible. Úsalo para CLI solo TTY, agentes de programación e interfaces de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dónde ejecutar. `auto` se resuelve como `sandbox` cuando hay un runtime de sandbox activo y como `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Se ignora para llamadas normales a herramientas. La seguridad de `gateway`/`node` se controla mediante `tools.exec.security` y el archivo de aprobaciones del host; el modo elevado solo puede forzar `security=full` cuando el operador concede explícitamente acceso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
El modo de solicitud base proviene de `tools.exec.ask` y de las aprobaciones del host. Para llamadas de modelo originadas en canales, el `ask` por llamada se ignora cuando la solicitud efectiva del host es `off`; de lo contrario, solo puede endurecerse a un modo más estricto. Los llamadores internos/API de confianza que construyen herramientas exec con un valor `ask` explícito no cambian.
</ParamField>

<ParamField path="node" type="string">
Id/nombre de Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado: salir del sandbox hacia la ruta de host configurada. `security=full` se fuerza solo cuando elevated se resuelve como `full`.
</ParamField>

Notas:

- `host` solo acepta `auto`, `sandbox`, `gateway` o `node`. No es un selector de nombre de host; los valores con aspecto de nombre de host se rechazan antes de ejecutar el comando.
- Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay un runtime de sandbox activo.
- Sin configuración adicional, `host=auto` sigue "funcionando sin más": sin sandbox se resuelve como `gateway`; con un sandbox activo permanece en el sandbox.
- `elevated` sale del sandbox hacia la ruta de host configurada: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` se controlan mediante el archivo de aprobaciones del host.
- `node` requiere un nodo emparejado (aplicación complementaria o host de nodo sin interfaz). Si hay varios nodos disponibles, define `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para nodos; se eliminó el wrapper heredado `nodes.run`.
- En hosts que no son Windows, exec usa `SHELL` cuando está definido; si `SHELL` es `fish`, prefiere `bash` (o `sh`) desde `PATH` para evitar bashismos incompatibles con fish, y luego vuelve a `SHELL` si ninguno existe.
- En hosts Windows, exec prefiere descubrir PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH), y después vuelve a Windows PowerShell 5.1.
- En hosts Gateway que no son Windows, los comandos exec de bash y zsh usan una instantánea de inicio. OpenClaw captura alias/funciones que se pueden cargar con source y un pequeño conjunto de entorno seguro desde los archivos de inicio del shell en `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, y luego carga esa instantánea con source antes de cada comando exec. Las variables que parecen secretas se excluyen; exec en sandbox y node no usa esta instantánea. Define `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso Gateway para deshabilitar esta ruta de instantánea.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y anulaciones de cargador (`LD_*`/`DYLD_*`) para impedir el secuestro de binarios o código inyectado.
- OpenClaw establece `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluida la ejecución en PTY y sandbox) para que las reglas de shell/perfil puedan detectar el contexto de herramienta exec.
- Para ejecuciones originadas en canales, OpenClaw también expone una carga JSON estrecha de identidad de remitente/chat en `OPENCLAW_CHANNEL_CONTEXT` cuando el canal proporcionó esos ids.
- `exec` no puede ejecutar comandos de shell `openclaw channels login` ni `/approve`: `openclaw channels login` es un flujo interactivo de autenticación de canal, y `/approve` debe pasar por el manejador de comandos de aprobación, no por un shell. Ejecuta el inicio de sesión de canal en una terminal en el host Gateway, o usa una herramienta de agente de inicio de sesión específica del canal cuando exista (por ejemplo, `whatsapp_login`).
- Importante: el sandboxing está **desactivado de forma predeterminada**. Si el sandboxing está desactivado, el `host=auto` implícito se resuelve como `gateway`. El `host=sandbox` explícito aún falla de forma cerrada en lugar de ejecutarse silenciosamente en el host Gateway. Habilita el sandboxing o usa `host=gateway` con aprobaciones.
- Las comprobaciones previas de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro del límite efectivo de `workdir`. Si una ruta de script se resuelve fuera de `workdir`, se omite la comprobación previa para ese archivo. La comprobación previa también se omite por completo cuando `host=gateway` y la política efectiva es `security=full` con `ask=off`.
- Para trabajo de larga duración que comienza ahora, inícialo una vez y confía en la reactivación automática al completarse cuando esté habilitada y el comando emita salida o falle. Usa `process` para registros, estado, entrada o intervención; no emules la programación con bucles de suspensión, bucles de tiempo de espera ni sondeos repetidos.
- Para trabajo que deba ocurrir más tarde o según una programación, usa cron en lugar de patrones de suspensión/retraso con `exec`.

## Configuración

| Clave                                | Predeterminado                                        | Notas                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Tiempo de espera exec predeterminado por comando, en segundos. El `timeout` por llamada lo anula; `timeout: 0` por llamada deshabilita el tiempo de espera del proceso exec. |
| `tools.exec.host`                    | `auto`                                                 | Se resuelve como `sandbox` cuando hay un runtime de sandbox activo, y como `gateway` en caso contrario.                                                    |
| `tools.exec.security`                | `deny` para sandbox, `full` para gateway/node cuando no está definido |                                                                                                                                                            |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                            |
| `tools.exec.mode`                    | sin definir                                            | Perilla de política normalizada. Consulta [Modos](#modes) a continuación. No puede combinarse con `tools.exec.security`/`tools.exec.ask`.                  |
| `tools.exec.node`                    | sin definir                                            |                                                                                                                                                            |
| `tools.exec.notifyOnExit`            | `true`                                                 | Cuando es true, las sesiones exec enviadas a segundo plano encolan un evento del sistema y solicitan un Heartbeat al salir.                                |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Emite un único aviso de "en ejecución" cuando un exec bloqueado por aprobación se ejecuta durante más tiempo que esto (`0` lo deshabilita).                 |
| `tools.exec.strictInlineEval`        | `false`                                                | Consulta [Evaluación en línea](#inline-eval-strictinlineeval).                                                                                             |
| `tools.exec.commandHighlighting`     | `false`                                                | Cuando es true, las solicitudes de aprobación pueden resaltar fragmentos de comando derivados del analizador en el texto del comando. Defínelo globalmente o por agente; no cambia la política de aprobación. |
| `tools.exec.pathPrepend`             | sin definir                                            | Lista de directorios que se anteponen a `PATH` para ejecuciones exec (solo gateway + sandbox).                                                             |
| `tools.exec.safeBins`                | sin definir                                            | Binarios seguros solo de stdin que pueden ejecutarse sin entradas explícitas en la lista de permitidos. Consulta [Binarios seguros](/es/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Directorios explícitos adicionales de confianza para las comprobaciones de ruta de `safeBins`. Las entradas de `PATH` nunca son de confianza automáticamente. |
| `tools.exec.safeBinProfiles`         | sin definir                                            | Política argv personalizada opcional por binario seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                            |

Exec en host sin aprobación es el valor predeterminado para gateway y node (`security=full`, `ask=off`): esto proviene de los valores predeterminados de política de host, no de `host=auto`. Si quieres comportamiento de aprobaciones/lista de permitidos, endurece tanto `tools.exec.*` como el archivo de aprobaciones del host; consulta [Aprobaciones de exec](/es/tools/exec-approvals#yolo-mode-no-approval). Para forzar el enrutamiento de gateway o node sin importar el estado del sandbox, define `tools.exec.host` o usa `/exec host=...`.

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

`tools.exec.mode` es la perilla de política normalizada. Al definirla, deriva `security`/`ask` y no puede combinarse con `tools.exec.security`/`tools.exec.ask`.

| Modo        | security    | ask       | Comportamiento                                                                                                                     |
| ----------- | ----------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | `deny`      | `off`     | Exec se deniega.                                                                                                                   |
| `allowlist` | `allowlist` | `off`     | Solo se ejecutan comandos incluidos en la lista de permitidos/safe-bin; no se pregunta nada más.                                   |
| `ask`       | `allowlist` | `on-miss` | Las coincidencias de la lista de permitidos se ejecutan directamente; todo lo demás pregunta a un humano.                          |
| `auto`      | `allowlist` | `on-miss` | Las coincidencias de la lista de permitidos/safe-bin se ejecutan directamente; todo lo demás pasa por el revisor automático nativo de OpenClaw antes de preguntar a un humano. |
| `full`      | `full`      | `off`     | Sin puerta de aprobación.                                                                                                          |

`ask`/`ask=always` sigue preguntando a un humano cada vez, independientemente del modo.

### Eval en línea (`strictInlineEval`)

Cuando `tools.exec.strictInlineEval` es `true`, las formas de evaluación en línea de intérpretes requieren revisor o aprobación explícita: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` y formas similares en otros intérpretes y transportadores de comandos admitidos (`awk`, `find -exec`, `make`, `sed`, `xargs` y más). En `mode=auto`, la ruta normal de aprobación de exec puede permitir que el revisor automático nativo autorice un comando puntual claramente de bajo riesgo; las llamadas directas `system.run` del host de nodo siguen requiriendo aprobación explícita porque no pueden entregar el comando a una ruta de aprobación humana. Si el revisor pregunta, la solicitud va a un humano. `allow-always` todavía puede persistir invocaciones benignas de intérpretes/scripts, pero las formas de eval en línea no se convierten en reglas de permiso duraderas.

### Manejo de PATH

- `host=gateway`: fusiona el `PATH` de tu shell de inicio de sesión en el entorno de exec. Las sobrescrituras de `env.PATH` se rechazan para la ejecución en host. El daemon sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Para evitar que la configuración del shell del usuario (como `~/.zshenv` o `/etc/zshenv`) sobrescriba rutas prioritarias durante el inicio, las entradas de `tools.exec.pathPrepend` se anteponen de forma segura al `PATH` final dentro del comando de shell justo antes de la ejecución.
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`. OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación de shell); `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al nodo las sobrescrituras de entorno no bloqueadas que pases. Las sobrescrituras de `env.PATH` se rechazan para la ejecución en host y los hosts de nodo las ignoran. Si necesitas entradas de PATH adicionales en un nodo, configura el entorno del servicio del host de nodo (systemd/launchd) o instala herramientas en ubicaciones estándar.

Vinculación de nodo por agente (usa el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: la pestaña Nodes incluye un pequeño panel "Exec node binding" para la misma configuración.

## Sobrescrituras de sesión (`/exec`)

Usa `/exec` para definir valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`. Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` solo se respeta para **remitentes autorizados** (listas de permitidos/emparejamiento de canales más `commands.useAccessGroups`). Actualiza **solo el estado de la sesión** y no escribe configuración. Los remitentes autorizados de canales externos pueden definir estos valores predeterminados de sesión. Los clientes internos de gateway/webchat necesitan `operator.admin` para persistirlos.

Para desactivar exec de forma estricta, deniégalo mediante la política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones de host siguen aplicándose salvo que configures explícitamente `security=full` y `ask=off`.

## Aprobaciones de exec (aplicación complementaria / host de nodo)

Los agentes en sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el gateway o en el host de nodo. Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver la política, la lista de permitidos y el flujo de UI.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente `status: "approval-pending"` y un id de aprobación. Una vez aprobado (o denegado / agotado el tiempo), el Gateway emite eventos de sistema de progreso y finalización del comando solo para ejecuciones aprobadas (`Exec running` / `Exec finished`). Las aprobaciones denegadas o vencidas son terminales y no despiertan la sesión del agente con un evento de sistema de denegación.

En canales con tarjetas/botones de aprobación nativos, el agente debe confiar primero en esa UI nativa e incluir un comando manual `/approve` solo cuando el resultado de la herramienta diga explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.

## Lista de permitidos + safe bins

La aplicación manual de la lista de permitidos compara globs de rutas binarias resueltas y globs de nombres de comando sin ruta. Los nombres sin ruta solo coinciden con comandos invocados mediante PATH, por lo que `rg` puede coincidir con `/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.

Cuando `security=allowlist`, los comandos de shell se permiten automáticamente solo si cada segmento de la canalización está en la lista de permitidos o es un safe bin. El encadenamiento (`;`, `&&`, `||`) y las redirecciones se rechazan en modo de lista de permitidos salvo que cada segmento de nivel superior satisfaga la lista de permitidos (incluidos los safe bins). Las redirecciones siguen sin estar admitidas. La confianza duradera de `allow-always` no omite esa regla: un comando encadenado sigue requiriendo que cada segmento de nivel superior coincida.

`autoAllowSkills` es una ruta de conveniencia separada en las aprobaciones de exec, no lo mismo que las entradas manuales de lista de permitidos de rutas. Para confianza explícita estricta, mantén `autoAllowSkills` desactivado.

Usa los dos controles para tareas distintas:

- `tools.exec.safeBins`: filtros de flujo pequeños, solo stdin.
- `tools.exec.safeBinTrustedDirs`: directorios confiables adicionales explícitos para rutas de ejecutables safe-bin.
- `tools.exec.safeBinProfiles`: política argv explícita para safe bins personalizados.
- lista de permitidos: confianza explícita para rutas de ejecutables.

No trates `safeBins` como una lista de permitidos genérica, y no añadas binarios de intérpretes/runtimes (por ejemplo `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas explícitas de lista de permitidos y mantén activados los avisos de aprobación.

`openclaw security audit` advierte cuando a las entradas `safeBins` de intérpretes/runtimes les faltan perfiles explícitos, y `openclaw doctor --fix` puede generar un andamiaje para entradas `safeBinProfiles` personalizadas faltantes. `openclaw security audit` y `openclaw doctor` también advierten cuando añades explícitamente bins de comportamiento amplio como `jq` de vuelta a `safeBins` (`jq` admite programas y builtins amplios, así que prefiere entradas explícitas de lista de permitidos o ejecuciones con puerta de aprobación). Si incluyes intérpretes explícitamente en la lista de permitidos, activa `tools.exec.strictInlineEval` para que las formas de eval de código en línea sigan requiriendo revisor o aprobación explícita.

Para detalles completos de política y ejemplos, consulta [Aprobaciones de exec](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Safe bins frente a lista de permitidos](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ejemplos

Primer plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano + sondeo:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

El sondeo es para estado bajo demanda, no para bucles de espera. Si el despertar automático al completar está activado, el comando puede despertar la sesión cuando emite salida o falla.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (solo envía CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pegar (con bracketed de forma predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas de múltiples archivos. Está activada de forma predeterminada y disponible para cualquier proveedor de modelos; `allowModels` puede restringirla. Usa la configuración solo cuando quieras desactivarla o restringirla a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Notas:

- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- `deny: ["write"]` no deniega `apply_patch`; deniega `apply_patch` explícitamente o usa `deny: ["group:fs"]` cuando las escrituras de parches también deban bloquearse.
- La configuración vive bajo `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` tiene `true` como valor predeterminado; configúralo en `false` para desactivar la herramienta.
- `tools.exec.applyPatch.workspaceOnly` tiene `true` como valor predeterminado (contenido en el espacio de trabajo). Configúralo en `false` solo si quieres intencionalmente que `apply_patch` escriba/elimine fuera del directorio del espacio de trabajo.
- `tools.exec.applyPatch.allowModels` es una lista de permitidos opcional de ids de modelo (sin procesar, como `gpt-5.4`, o completos, como `openai/gpt-5.4`). Cuando se configura, solo los modelos coincidentes reciben la herramienta; cuando no se configura, todos los modelos la reciben.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — ejecución de comandos en entornos en sandbox
- [Proceso en segundo plano](/es/gateway/background-process) — exec de larga duración y herramienta de procesos
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
