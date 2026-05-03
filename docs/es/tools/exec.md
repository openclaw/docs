---
read_when:
    - Uso o modificación de la herramienta exec
    - Depuración del comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos de stdin y compatibilidad con TTY
title: Herramienta de ejecución
x-i18n:
    generated_at: "2026-05-03T21:38:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Ejecuta comandos de shell en el espacio de trabajo. Admite ejecución en primer plano y en segundo plano mediante `process`.
Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se debe ejecutar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo para el comando.
</ParamField>

<ParamField path="env" type="object">
Sobrescrituras de entorno de clave/valor combinadas sobre el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Enviar automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Enviar el comando a segundo plano inmediatamente en lugar de esperar a `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sobrescribe el tiempo de espera configurado de exec para esta llamada. Define `timeout: 0` solo cuando el comando deba ejecutarse sin el tiempo de espera del proceso exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta en un pseudoterminal cuando esté disponible. Úsalo para CLIs que solo funcionan con TTY, agentes de programación e interfaces de usuario de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dónde ejecutar. `auto` se resuelve como `sandbox` cuando hay un runtime de sandbox activo y como `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modo de aplicación para la ejecución en `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamiento de la solicitud de aprobación para la ejecución en `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nombre de Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita el modo elevado: sale del sandbox hacia la ruta del host configurado. `security=full` solo se fuerza cuando elevated se resuelve como `full`.
</ParamField>

Notas:

- `host` toma `auto` de forma predeterminada: sandbox cuando el runtime de sandbox está activo para la sesión; de lo contrario, Gateway.
- `host` solo acepta `auto`, `sandbox`, `gateway` o `node`. No es un selector de nombre de host; los valores con aspecto de nombre de host se rechazan antes de ejecutar el comando.
- `auto` es la estrategia de enrutamiento predeterminada, no un comodín. Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay un runtime de sandbox activo.
- Sin configuración adicional, `host=auto` sigue "simplemente funcionando": sin sandbox, se resuelve como `gateway`; con un sandbox activo, permanece en el sandbox.
- `elevated` sale del sandbox hacia la ruta del host configurado: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o cuando el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` se controlan mediante `~/.openclaw/exec-approvals.json`.
- `node` requiere un nodo emparejado (app complementaria o host de nodo headless).
- Si hay varios nodos disponibles, define `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para nodos; el wrapper heredado `nodes.run` se eliminó.
- `timeout` se aplica a la ejecución en primer plano, segundo plano, `yieldMs`, Gateway, sandbox y `system.run` de Node. Si se omite, OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` explícito deshabilita el tiempo de espera del proceso exec para esa llamada.
- En hosts que no son Windows, exec usa `SHELL` cuando está definido; si `SHELL` es `fish`, prefiere `bash` (o `sh`)
  desde `PATH` para evitar scripts incompatibles con fish, y luego recurre a `SHELL` si ninguno existe.
- En hosts Windows, exec prefiere el descubrimiento de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH),
  y después recurre a Windows PowerShell 5.1.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y las sobrescrituras de cargador (`LD_*`/`DYLD_*`) para
  evitar el secuestro de binarios o código inyectado.
- OpenClaw define `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluida la ejecución con PTY y sandbox) para que las reglas de shell/perfil puedan detectar el contexto de la herramienta exec.
- `openclaw channels login` está bloqueado desde `exec` porque es un flujo interactivo de autenticación de canal; ejecútalo en una terminal en el host Gateway, o usa la herramienta de inicio de sesión nativa del canal desde el chat cuando exista.
- Importante: el sandboxing está **desactivado de forma predeterminada**. Si el sandboxing está desactivado, `host=auto`
  implícito se resuelve como `gateway`. `host=sandbox` explícito sigue fallando de forma cerrada en lugar de ejecutarse silenciosamente
  en el host Gateway. Habilita el sandboxing o usa `host=gateway` con aprobaciones.
- Las comprobaciones previas de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro del
  límite efectivo de `workdir`. Si una ruta de script se resuelve fuera de `workdir`, se omite la comprobación previa para
  ese archivo.
- Para trabajos de larga duración que comienzan ahora, inícialos una vez y confía en la reactivación automática
  al completarse cuando esté habilitada y el comando emita salida o falle.
  Usa `process` para logs, estado, entrada o intervención; no emules
  programación con bucles de sleep, bucles de timeout o sondeos repetidos.
- Para trabajos que deban suceder más tarde o según una programación, usa cron en lugar de
  patrones de sleep/retraso con `exec`.

## Configuración

- `tools.exec.notifyOnExit` (predeterminado: true): cuando es true, las sesiones exec enviadas a segundo plano encolan un evento del sistema y solicitan un Heartbeat al salir.
- `tools.exec.approvalRunningNoticeMs` (predeterminado: 10000): emite un único aviso de “en ejecución” cuando un exec sujeto a aprobación se ejecuta durante más tiempo que esto (0 lo deshabilita).
- `tools.exec.timeoutSec` (predeterminado: 1800): tiempo de espera predeterminado por comando exec en segundos. `timeout` por llamada lo sobrescribe; `timeout: 0` por llamada deshabilita el tiempo de espera del proceso exec.
- `tools.exec.host` (predeterminado: `auto`; se resuelve como `sandbox` cuando el runtime de sandbox está activo, `gateway` en caso contrario)
- `tools.exec.security` (predeterminado: `deny` para sandbox, `full` para Gateway + Node cuando no está definido)
- `tools.exec.ask` (predeterminado: `off`)
- Exec en host sin aprobación es el valor predeterminado para Gateway + Node. Si quieres comportamiento de aprobaciones/lista de permitidos, restringe tanto `tools.exec.*` como el `~/.openclaw/exec-approvals.json` del host; consulta [Aprobaciones de exec](/es/tools/exec-approvals#yolo-mode-no-approval).
- YOLO proviene de los valores predeterminados de la política del host (`security=full`, `ask=off`), no de `host=auto`. Si quieres forzar el enrutamiento por Gateway o Node, define `tools.exec.host` o usa `/exec host=...`.
- En modo `security=full` más `ask=off`, exec en host sigue directamente la política configurada; no hay una capa adicional heurística de prefiltrado de ofuscación de comandos ni de rechazo de comprobación previa de scripts.
- `tools.exec.node` (predeterminado: sin definir)
- `tools.exec.strictInlineEval` (predeterminado: false): cuando es true, las formas de eval de intérprete en línea como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` y `osascript -e` siempre requieren aprobación explícita. `allow-always` aún puede persistir invocaciones benignas de intérprete/script, pero las formas de eval en línea siguen solicitando aprobación cada vez.
- `tools.exec.pathPrepend`: lista de directorios que se anteponen a `PATH` para ejecuciones exec (solo Gateway + sandbox).
- `tools.exec.safeBins`: binarios seguros solo por stdin que pueden ejecutarse sin entradas explícitas en la lista de permitidos. Para detalles de comportamiento, consulta [Binarios seguros](/es/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directorios explícitos adicionales en los que se confía para comprobaciones de rutas de `safeBins`. Las entradas de `PATH` nunca se confían automáticamente. Los valores predeterminados integrados son `/bin` y `/usr/bin`.
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

- `host=gateway`: combina el `PATH` de tu shell de login con el entorno de exec. Las sobrescrituras de `env.PATH` se
  rechazan para la ejecución en host. El daemon en sí sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: ejecuta `sh -lc` (shell de login) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`.
  OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación de shell);
  `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al nodo las sobrescrituras de entorno no bloqueadas que pases. Las sobrescrituras de `env.PATH` se
  rechazan para la ejecución en host y los hosts de nodo las ignoran. Si necesitas entradas de PATH adicionales en un nodo,
  configura el entorno del servicio del host de nodo (systemd/launchd) o instala las herramientas en ubicaciones estándar.

Vinculación de Node por agente (usa el índice de lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interfaz de control: la pestaña Nodes incluye un pequeño panel “Vinculación de nodo exec” para los mismos ajustes.

## Sobrescrituras de sesión (`/exec`)

Usa `/exec` para definir valores predeterminados **por sesión** de `host`, `security`, `ask` y `node`.
Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorización

`/exec` solo se acepta para **remitentes autorizados** (listas de permitidos/emparejamiento de canales más `commands.useAccessGroups`).
Actualiza **solo el estado de la sesión** y no escribe configuración. Para deshabilitar exec de forma estricta, deniégalo mediante la
política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones del host siguen aplicándose a menos que definas explícitamente
`security=full` y `ask=off`.

## Aprobaciones de exec (app complementaria / host de nodo)

Los agentes con sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el host Gateway o Node.
Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para la política, la lista de permitidos y el flujo de la UI.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente
`status: "approval-pending"` y un ID de aprobación. Una vez aprobada (o denegada / agotado el tiempo),
Gateway emite eventos del sistema (`Exec finished` / `Exec denied`). Si el comando sigue
ejecutándose después de `tools.exec.approvalRunningNoticeMs`, se emite un único aviso `Exec running`.
En canales con tarjetas/botones de aprobación nativos, el agente debe confiar primero en esa
UI nativa e incluir un comando manual `/approve` solo cuando el resultado de la herramienta
diga explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la
única ruta.

## Lista de permitidos + binarios seguros

La aplicación manual de listas de permitidos compara globs de rutas de binarios resueltas y globs
de nombres de comando simples. Los nombres simples solo coinciden con comandos invocados mediante PATH, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.
Cuando `security=allowlist`, los comandos de shell se permiten automáticamente solo si cada segmento de la tubería
está en la lista de permitidos o es un binario seguro. El encadenamiento (`;`, `&&`, `||`) y las redirecciones
se rechazan en modo de lista de permitidos a menos que cada segmento de nivel superior satisfaga la
lista de permitidos (incluidos los binarios seguros). Las redirecciones siguen sin estar admitidas.
La confianza duradera de `allow-always` no elude esa regla: un comando encadenado sigue requiriendo que cada
segmento de nivel superior coincida.

`autoAllowSkills` es una ruta de conveniencia separada en las aprobaciones de exec. No es lo mismo que
las entradas manuales de lista de permitidos por ruta. Para confianza explícita estricta, mantén `autoAllowSkills` deshabilitado.

Usa los dos controles para trabajos distintos:

- `tools.exec.safeBins`: filtros de flujo pequeños, solo por stdin.
- `tools.exec.safeBinTrustedDirs`: directorios de confianza adicionales explícitos para rutas ejecutables de binarios seguros.
- `tools.exec.safeBinProfiles`: política argv explícita para binarios seguros personalizados.
- lista de permitidos: confianza explícita para rutas ejecutables.

No trates `safeBins` como una lista de permitidos genérica, y no agregues binarios de intérprete/entorno de ejecución (por ejemplo, `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas explícitas de lista de permitidos y mantén activadas las solicitudes de aprobación.
`openclaw security audit` advierte cuando las entradas de intérprete/entorno de ejecución en `safeBins` no tienen perfiles explícitos, y `openclaw doctor --fix` puede generar la estructura de las entradas personalizadas faltantes de `safeBinProfiles`.
`openclaw security audit` y `openclaw doctor` también advierten cuando agregas explícitamente bins de comportamiento amplio, como `jq`, de nuevo a `safeBins`.
Si incluyes intérpretes explícitamente en la lista de permitidos, activa `tools.exec.strictInlineEval` para que las formas de evaluación de código en línea sigan requiriendo una nueva aprobación.

Para ver detalles completos de la política y ejemplos, consulta [Aprobaciones de Exec](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Safe bins frente a lista de permitidos](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

El sondeo es para el estado bajo demanda, no para bucles de espera. Si la reactivación automática al completarse
está activada, el comando puede reactivar la sesión cuando emite salida o falla.

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

Pegar (delimitado de forma predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas de varios archivos.
Está activada de forma predeterminada para los modelos de OpenAI y OpenAI Codex. Usa la configuración solo
cuando quieras desactivarla o restringirla a modelos específicos:

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
- `deny: ["write"]` no deniega `apply_patch`; deniega `apply_patch` explícitamente o usa `deny: ["group:fs"]` cuando también se deban bloquear las escrituras de parches.
- La configuración vive en `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` tiene `true` como valor predeterminado; establécelo en `false` para desactivar la herramienta en modelos de OpenAI.
- `tools.exec.applyPatch.workspaceOnly` tiene `true` como valor predeterminado (contenido en el espacio de trabajo). Establécelo en `false` solo si quieres intencionalmente que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo.

## Relacionado

- [Aprobaciones de Exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Aislamiento](/es/gateway/sandboxing) — ejecución de comandos en entornos aislados
- [Proceso en segundo plano](/es/gateway/background-process) — exec de larga duración y herramienta de proceso
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
