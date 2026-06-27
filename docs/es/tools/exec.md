---
read_when:
    - Usar o modificar la herramienta exec
    - Depurar el comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos stdin y compatibilidad con TTY
title: Herramienta de ejecución
x-i18n:
    generated_at: "2026-06-27T13:04:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Ejecuta comandos de shell en el espacio de trabajo. `exec` es una superficie de shell mutante: los comandos pueden crear, editar o eliminar archivos donde lo permita el sistema de archivos del host o sandbox seleccionado. Deshabilitar herramientas de sistema de archivos de OpenClaw como `write`, `edit` o `apply_patch` no convierte a `exec` en solo lectura.

Admite ejecución en primer plano y en segundo plano mediante `process`. Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se debe ejecutar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo para el comando.
</ParamField>

<ParamField path="env" type="object">
Sobrescrituras de entorno de clave/valor fusionadas sobre el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Pasa automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Pasa el comando a segundo plano inmediatamente en lugar de esperar a `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sobrescribe el tiempo de espera de exec configurado para esta llamada. Establece `timeout: 0` solo cuando el comando deba ejecutarse sin el tiempo de espera del proceso exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta en una pseudoterminal cuando esté disponible. Úsalo para CLI que solo funcionan con TTY, agentes de código e interfaces de usuario de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dónde ejecutar. `auto` se resuelve como `sandbox` cuando hay un runtime de sandbox activo y como `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Se ignora para las llamadas normales a herramientas. La seguridad de `gateway` / `node` se controla mediante
`tools.exec.security` y el archivo de aprobaciones del host; el modo elevado puede
forzar `security=full` solo cuando el operador concede explícitamente acceso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
El modo de solicitud base proviene de `tools.exec.ask` y de las aprobaciones del host.
Para llamadas de modelo originadas en canales, el `ask` por llamada se ignora cuando el
ask efectivo del host es `off`; de lo contrario, solo puede endurecerse a un modo más
estricto. Los llamadores internos/API de confianza que construyen herramientas exec con un
valor `ask` explícito no cambian.
</ParamField>

<ParamField path="node" type="string">
Id/nombre del Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado: escapa del sandbox hacia la ruta de host configurada. `security=full` se fuerza solo cuando elevated se resuelve como `full`.
</ParamField>

Notas:

- `host` tiene `auto` como valor predeterminado: sandbox cuando el runtime de sandbox está activo para la sesión; de lo contrario, gateway.
- `host` solo acepta `auto`, `sandbox`, `gateway` o `node`. No es un selector de nombre de host; los valores con aspecto de nombre de host se rechazan antes de que se ejecute el comando.
- `auto` es la estrategia de enrutamiento predeterminada, no un comodín. Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay un runtime de sandbox activo.
- `tools.exec.mode` es el control de política normalizado. Los valores son `deny`, `allowlist`, `ask`, `auto` y `full`. `auto` ejecuta directamente las coincidencias deterministas de allowlist/safe-bin y enruta todos los demás casos de aprobación de exec a través del revisor automático nativo de OpenClaw antes de preguntar a un humano. `ask` / `ask=always` sigue preguntando a un humano cada vez.
- Sin configuración adicional, `host=auto` sigue "funcionando sin más": sin sandbox se resuelve como `gateway`; con un sandbox activo permanece en el sandbox.
- `elevated` escapa del sandbox hacia la ruta de host configurada: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` se controlan mediante el archivo de aprobaciones del host.
- `node` requiere un nodo emparejado (aplicación complementaria o host de nodo sin interfaz).
- Si hay varios nodos disponibles, establece `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para nodos; se eliminó el contenedor heredado `nodes.run`.
- `timeout` se aplica a la ejecución en primer plano, en segundo plano, con `yieldMs`, gateway, sandbox y `system.run` de node. Si se omite, OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` explícito deshabilita el tiempo de espera del proceso exec para esa llamada.
- En hosts que no son Windows, exec usa `SHELL` cuando está definido; si `SHELL` es `fish`, prefiere `bash` (o `sh`)
  desde `PATH` para evitar scripts incompatibles con fish, y luego recurre a `SHELL` si no existe ninguno.
- En hosts Windows, exec prefiere el descubrimiento de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH),
  y luego recurre a Windows PowerShell 5.1.
- En hosts gateway que no son Windows, los comandos exec de bash y zsh usan una instantánea de inicio. OpenClaw captura
  aliases/funciones que se pueden cargar con source y un pequeño conjunto de entorno seguro desde los archivos de inicio de shell en
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, y luego carga esa instantánea antes de cada comando exec.
  Se excluyen las variables que parecen secretos; exec de sandbox y node no usa esta instantánea. Establece
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso Gateway para deshabilitar esta ruta de instantánea.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y sobrescrituras del cargador (`LD_*`/`DYLD_*`) para
  evitar secuestro de binarios o código inyectado.
- OpenClaw establece `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluidas la ejecución con PTY y sandbox) para que las reglas de shell/perfil puedan detectar el contexto de la herramienta exec.
- Para ejecuciones originadas en canales, OpenClaw también expone una carga JSON limitada de identidad de remitente/chat en
  `OPENCLAW_CHANNEL_CONTEXT` cuando el canal proporcionó esos ids.
- `openclaw channels login` está bloqueado desde `exec` porque es un flujo interactivo de autenticación de canal; ejecútalo en una terminal en el host gateway, o usa la herramienta de inicio de sesión nativa del canal desde el chat cuando exista.
- Importante: el sandbox está **desactivado de forma predeterminada**. Si el sandbox está desactivado, `host=auto` implícito
  se resuelve como `gateway`. `host=sandbox` explícito sigue fallando de forma cerrada en lugar de ejecutarse silenciosamente
  en el host gateway. Habilita el sandbox o usa `host=gateway` con aprobaciones.
- Las comprobaciones previas de scripts (para errores comunes de sintaxis de shell de Python/Node) solo inspeccionan archivos dentro del
  límite efectivo de `workdir`. Si una ruta de script se resuelve fuera de `workdir`, se omite la comprobación previa para
  ese archivo.
- Para trabajos de larga duración que comienzan ahora, inícialos una vez y confía en el
  despertar automático al completarse cuando esté habilitado y el comando emita salida o falle.
  Usa `process` para logs, estado, entrada o intervención; no emules
  planificación con bucles de sleep, bucles de timeout o sondeos repetidos.
- Para trabajos que deban ocurrir más tarde o según una programación, usa Cron en lugar de
  patrones de sleep/delay con `exec`.

## Configuración

- `tools.exec.notifyOnExit` (valor predeterminado: true): cuando es true, las sesiones exec en segundo plano encolan un evento de sistema y solicitan un Heartbeat al salir.
- `tools.exec.approvalRunningNoticeMs` (valor predeterminado: 10000): emite un único aviso de "en ejecución" cuando un exec sujeto a aprobación se ejecuta durante más tiempo que esto (0 lo deshabilita).
- `tools.exec.timeoutSec` (valor predeterminado: 1800): tiempo de espera exec predeterminado por comando en segundos. `timeout` por llamada lo sobrescribe; `timeout: 0` por llamada deshabilita el tiempo de espera del proceso exec.
- `tools.exec.host` (valor predeterminado: `auto`; se resuelve como `sandbox` cuando el runtime de sandbox está activo, `gateway` en caso contrario)
- `tools.exec.security` (valor predeterminado: `deny` para sandbox, `full` para gateway + node cuando no está definido)
- `tools.exec.ask` (valor predeterminado: `off`)
- Exec en host sin aprobación es el valor predeterminado para gateway + node. Si quieres comportamiento de aprobaciones/allowlist, endurece tanto `tools.exec.*` como el archivo de aprobaciones del host; consulta [Aprobaciones de exec](/es/tools/exec-approvals#yolo-mode-no-approval).
- YOLO proviene de los valores predeterminados de la política del host (`security=full`, `ask=off`), no de `host=auto`. Si quieres forzar el enrutamiento a gateway o node, establece `tools.exec.host` o usa `/exec host=...`.
- En modo `security=full` más `ask=off`, exec de host sigue directamente la política configurada; no hay una capa adicional de prefiltro heurístico de ofuscación de comandos ni de rechazo por comprobación previa de scripts.
- `tools.exec.node` (valor predeterminado: sin definir)
- `tools.exec.strictInlineEval` (valor predeterminado: false): cuando es true, las formas eval de intérprete en línea como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` y `osascript -e` requieren revisor o aprobación explícita. En `mode=auto`, la ruta normal de aprobación de exec puede permitir que el revisor automático nativo autorice un comando puntual claramente de bajo riesgo; las llamadas directas `system.run` de host node siguen requiriendo una aprobación explícita porque no pueden entregar el comando a una ruta de aprobación humana. Si el revisor pregunta, la solicitud va a un humano. `allow-always` aún puede conservar invocaciones benignas de intérprete/script, pero las formas inline-eval no se convierten en reglas allow duraderas.
- `tools.exec.commandHighlighting` (valor predeterminado: false): cuando es true, las solicitudes de aprobación pueden resaltar fragmentos de comandos derivados del parser en el texto del comando. Establécelo en `true` globalmente o por agente para habilitar el resaltado del texto del comando sin cambiar la política de aprobación de exec.
- `tools.exec.pathPrepend`: lista de directorios que se anteponen a `PATH` para ejecuciones exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binarios seguros solo por stdin que pueden ejecutarse sin entradas explícitas de allowlist. Para detalles de comportamiento, consulta [Binarios seguros](/es/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directorios explícitos adicionales de confianza para comprobaciones de ruta de `safeBins`. Las entradas de `PATH` nunca son de confianza automáticamente. Los valores predeterminados integrados son `/bin` y `/usr/bin`.
- `tools.exec.safeBinProfiles`: política argv personalizada opcional por binario seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

### Manejo de PATH

- `host=gateway`: fusiona el `PATH` de tu shell de inicio de sesión en el entorno exec. Las sobrescrituras de `env.PATH` se
  rechazan para la ejecución en host. El daemon en sí sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Para impedir que la configuración de shell del usuario (como `~/.zshenv` o `/etc/zshenv`) sobrescriba rutas prioritarias durante el inicio, las entradas de `tools.exec.pathPrepend` se anteponen de forma segura al `PATH` final dentro del comando de shell justo antes de la ejecución.
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`.
  OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación de shell);
  `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al nodo las sobrescrituras de entorno no bloqueadas que pases. Las sobrescrituras de `env.PATH` se
  rechazan para la ejecución en host y los hosts node las ignoran. Si necesitas entradas adicionales de PATH en un nodo,
  configura el entorno del servicio del host node (systemd/launchd) o instala herramientas en ubicaciones estándar.

Vinculación de node por agente (usa el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: la pestaña Nodes incluye un pequeño panel "Vinculación de node exec" para la misma configuración.

## Sobrescrituras de sesión (`/exec`)

Usa `/exec` para establecer valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`.
Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorización

`/exec` solo se respeta para **remitentes autorizados** (listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`).
Actualiza **solo el estado de la sesión** y no escribe configuración. Los remitentes autorizados de canales externos pueden
definir estos valores predeterminados de sesión. Los clientes internos de Gateway/webchat necesitan `operator.admin` para persistirlos.
Para deshabilitar exec por completo, deniégalo mediante la política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones del host
siguen aplicándose salvo que establezcas explícitamente `security=full` y `ask=off`.

## Aprobaciones de exec (aplicación complementaria / host de Node)

Los agentes en sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el Gateway o en el host de Node.
Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver la política, la lista de permitidos y el flujo de la UI.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente
`status: "approval-pending"` y un id de aprobación. Una vez aprobado (o denegado / agotado el tiempo),
el Gateway emite eventos del sistema de progreso y finalización de comandos solo para ejecuciones aprobadas
(`Exec running` / `Exec finished`). Las aprobaciones denegadas o agotadas son terminales y no
despiertan la sesión del agente con un evento del sistema de denegación.
En canales con tarjetas/botones de aprobación nativos, el agente debe confiar primero en esa
UI nativa y solo incluir un comando manual `/approve` cuando el resultado de la herramienta
diga explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la
única vía.

## Lista de permitidos + bins seguros

La aplicación manual de la lista de permitidos compara globs de rutas de binarios resueltas y globs
de nombres de comando simples. Los nombres simples solo coinciden con comandos invocados mediante PATH, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.
Cuando `security=allowlist`, los comandos de shell se permiten automáticamente solo si cada segmento
de la canalización está en la lista de permitidos o es un bin seguro. El encadenamiento (`;`, `&&`, `||`) y las redirecciones
se rechazan en modo de lista de permitidos salvo que cada segmento de nivel superior satisfaga la
lista de permitidos (incluidos los bins seguros). Las redirecciones siguen sin ser compatibles.
La confianza duradera `allow-always` no omite esa regla: un comando encadenado todavía requiere que cada
segmento de nivel superior coincida.

`autoAllowSkills` es una vía de conveniencia separada en las aprobaciones de exec. No es lo mismo que
las entradas manuales de lista de permitidos por ruta. Para confianza explícita estricta, mantén `autoAllowSkills` deshabilitado.

Usa los dos controles para trabajos distintos:

- `tools.exec.safeBins`: filtros de flujo pequeños, solo stdin.
- `tools.exec.safeBinTrustedDirs`: directorios de confianza adicionales explícitos para rutas ejecutables de bins seguros.
- `tools.exec.safeBinProfiles`: política argv explícita para bins seguros personalizados.
- lista de permitidos: confianza explícita para rutas ejecutables.

No trates `safeBins` como una lista de permitidos genérica, y no agregues binarios de intérprete/runtime (por ejemplo `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas explícitas de lista de permitidos y mantén habilitadas las solicitudes de aprobación.
`openclaw security audit` advierte cuando faltan perfiles explícitos en entradas `safeBins` de intérprete/runtime, y `openclaw doctor --fix` puede crear la estructura de entradas `safeBinProfiles` personalizadas faltantes.
`openclaw security audit` y `openclaw doctor` también advierten cuando agregas explícitamente bins de comportamiento amplio como `jq` de vuelta a `safeBins`.
Si incluyes intérpretes explícitamente en la lista de permitidos, habilita `tools.exec.strictInlineEval` para que las formas de evaluación de código en línea sigan requiriendo revisor o aprobación explícita.

Para ver detalles completos de la política y ejemplos, consulta [Aprobaciones de exec](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Bins seguros frente a lista de permitidos](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

El sondeo es para estado bajo demanda, no para bucles de espera. Si el despertar automático al finalizar
está habilitado, el comando puede despertar la sesión cuando emite salida o falla.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (solo enviar CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pegar (entre delimitadores de forma predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas de varios archivos.
Está habilitada de forma predeterminada para los modelos de OpenAI y OpenAI Codex. Usa configuración solo
cuando quieras deshabilitarla o restringirla a modelos específicos:

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

- Solo disponible para modelos de OpenAI/OpenAI Codex.
- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- `deny: ["write"]` no deniega `apply_patch`; deniega `apply_patch` explícitamente o usa `deny: ["group:fs"]` cuando las escrituras de parches también deban bloquearse.
- La configuración vive bajo `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` se establece en `true` de forma predeterminada; establécelo en `false` para deshabilitar la herramienta para modelos de OpenAI.
- `tools.exec.applyPatch.workspaceOnly` se establece en `true` de forma predeterminada (contenido dentro del workspace). Establécelo en `false` solo si quieres intencionalmente que `apply_patch` escriba/elimine fuera del directorio del workspace.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — barreras de aprobación para comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — ejecutar comandos en entornos en sandbox
- [Proceso en segundo plano](/es/gateway/background-process) — exec de larga duración y herramienta de proceso
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
