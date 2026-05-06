---
read_when:
    - Uso o modificación de la herramienta exec
    - Depuración del comportamiento de stdin o TTY
summary: Uso de la herramienta Exec, modos de stdin y compatibilidad con TTY
title: Herramienta de ejecución
x-i18n:
    generated_at: "2026-05-06T05:51:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

Ejecuta comandos de shell en el espacio de trabajo. Admite ejecución en primer plano y en segundo plano mediante `process`.
Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se ejecutará.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo para el comando.
</ParamField>

<ParamField path="env" type="object">
Sobrescrituras de entorno clave/valor combinadas sobre el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Pasa automáticamente el comando a segundo plano después de esta demora (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Pasa el comando a segundo plano inmediatamente en lugar de esperar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sobrescribe el tiempo de espera de exec configurado para esta llamada. Establece `timeout: 0` solo cuando el comando deba ejecutarse sin el tiempo de espera del proceso exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta en una pseudoterminal cuando esté disponible. Úsalo para CLI solo TTY, agentes de codificación e interfaces de usuario de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dónde ejecutar. `auto` se resuelve a `sandbox` cuando un runtime de sandbox está activo y a `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modo de aplicación para la ejecución de `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamiento de solicitud de aprobación para la ejecución de `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nombre de Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado: escapa del sandbox hacia la ruta configurada del host. `security=full` se fuerza solo cuando elevated se resuelve a `full`.
</ParamField>

Notas:

- `host` usa `auto` de forma predeterminada: sandbox cuando el runtime de sandbox está activo para la sesión; en caso contrario, gateway.
- `host` solo acepta `auto`, `sandbox`, `gateway` o `node`. No es un selector de nombre de host; los valores parecidos a nombres de host se rechazan antes de ejecutar el comando.
- `auto` es la estrategia de enrutamiento predeterminada, no un comodín. Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay ningún runtime de sandbox activo.
- Sin configuración adicional, `host=auto` sigue funcionando sin más: si no hay sandbox, se resuelve a `gateway`; si hay un sandbox activo, permanece en el sandbox.
- `elevated` escapa del sandbox hacia la ruta configurada del host: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` se controlan mediante `~/.openclaw/exec-approvals.json`.
- `node` requiere un Node emparejado (aplicación complementaria o host Node sin interfaz).
- Si hay varios Nodes disponibles, establece `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para Nodes; el wrapper heredado `nodes.run` se eliminó.
- `timeout` se aplica a la ejecución en primer plano, en segundo plano, `yieldMs`, gateway, sandbox y `system.run` de Node. Si se omite, OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` explícito deshabilita el tiempo de espera del proceso exec para esa llamada.
- En hosts que no sean Windows, exec usa `SHELL` cuando está establecido; si `SHELL` es `fish`, prefiere `bash` (o `sh`)
  desde `PATH` para evitar scripts incompatibles con fish, y luego recurre a `SHELL` si ninguno existe.
- En hosts Windows, exec prefiere descubrir PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH),
  y luego recurre a Windows PowerShell 5.1.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y sobrescrituras de cargador (`LD_*`/`DYLD_*`) para
  evitar el secuestro de binarios o código inyectado.
- OpenClaw establece `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluidas la ejecución PTY y en sandbox) para que las reglas de shell/perfil puedan detectar el contexto de la herramienta exec.
- `openclaw channels login` está bloqueado desde `exec` porque es un flujo interactivo de autenticación de canal; ejecútalo en una terminal en el host gateway, o usa la herramienta de inicio de sesión nativa del canal desde el chat cuando exista.
- Importante: el sandboxing está **desactivado de forma predeterminada**. Si el sandboxing está desactivado, `host=auto`
  implícito se resuelve a `gateway`. `host=sandbox` explícito aún falla de forma cerrada en lugar de ejecutarse silenciosamente
  en el host gateway. Habilita el sandboxing o usa `host=gateway` con aprobaciones.
- Las comprobaciones previas de scripts (para errores comunes de sintaxis de shell Python/Node) solo inspeccionan archivos dentro del
  límite efectivo de `workdir`. Si una ruta de script se resuelve fuera de `workdir`, la comprobación previa se omite para
  ese archivo.
- Para trabajos de larga duración que empiezan ahora, inícialos una vez y confía en el despertar automático
  al completarse cuando esté habilitado y el comando emita salida o falle.
  Usa `process` para registros, estado, entrada o intervención; no emules
  programación con bucles de sleep, bucles de timeout o sondeos repetidos.
- Para trabajos que deban ocurrir más tarde o según una programación, usa cron en lugar de
  patrones de sleep/delay con `exec`.

## Configuración

- `tools.exec.notifyOnExit` (predeterminado: true): cuando es true, las sesiones exec en segundo plano encolan un evento del sistema y solicitan un Heartbeat al salir.
- `tools.exec.approvalRunningNoticeMs` (predeterminado: 10000): emite un único aviso de "en ejecución" cuando un exec sujeto a aprobación se ejecuta durante más tiempo que esto (0 lo deshabilita).
- `tools.exec.timeoutSec` (predeterminado: 1800): tiempo de espera exec predeterminado por comando en segundos. `timeout` por llamada lo sobrescribe; `timeout: 0` por llamada deshabilita el tiempo de espera del proceso exec.
- `tools.exec.host` (predeterminado: `auto`; se resuelve a `sandbox` cuando el runtime de sandbox está activo, y a `gateway` en caso contrario)
- `tools.exec.security` (predeterminado: `deny` para sandbox, `full` para gateway + node cuando no está establecido)
- `tools.exec.ask` (predeterminado: `off`)
- Exec en host sin aprobación es el valor predeterminado para gateway + node. Si quieres comportamiento de aprobaciones/allowlist, endurece tanto `tools.exec.*` como el `~/.openclaw/exec-approvals.json` del host; consulta [Aprobaciones de exec](/es/tools/exec-approvals#yolo-mode-no-approval).
- YOLO proviene de los valores predeterminados de la política del host (`security=full`, `ask=off`), no de `host=auto`. Si quieres forzar el enrutamiento a gateway o node, establece `tools.exec.host` o usa `/exec host=...`.
- En modo `security=full` más `ask=off`, exec en host sigue directamente la política configurada; no hay ninguna capa heurística adicional de prefiltro de ofuscación de comandos ni de rechazo por comprobación previa de scripts.
- `tools.exec.node` (predeterminado: sin establecer)
- `tools.exec.strictInlineEval` (predeterminado: false): cuando es true, las formas inline de evaluación de intérpretes como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` y `osascript -e` siempre requieren aprobación explícita. `allow-always` todavía puede persistir invocaciones benignas de intérpretes/scripts, pero las formas inline-eval siguen solicitando aprobación cada vez.
- `tools.exec.pathPrepend`: lista de directorios que se antepondrán a `PATH` para ejecuciones exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binarios seguros solo stdin que pueden ejecutarse sin entradas explícitas de allowlist. Para detalles de comportamiento, consulta [Binarios seguros](/es/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directorios explícitos adicionales de confianza para comprobaciones de rutas de `safeBins`. Las entradas de `PATH` nunca se consideran de confianza automáticamente. Los valores predeterminados integrados son `/bin` y `/usr/bin`.
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

- `host=gateway`: combina el `PATH` de tu shell de inicio de sesión en el entorno exec. Las sobrescrituras de `env.PATH` se
  rechazan para la ejecución en host. El daemon en sí sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`.
  OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación de shell);
  `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo las sobrescrituras de entorno no bloqueadas que pases se envían al Node. Las sobrescrituras de `env.PATH` se
  rechazan para la ejecución en host y los hosts Node las ignoran. Si necesitas entradas PATH adicionales en un Node,
  configura el entorno del servicio del host Node (systemd/launchd) o instala las herramientas en ubicaciones estándar.

Vinculación de Node por agente (usa el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI de control: la pestaña Nodes incluye un pequeño panel "Vinculación de Node exec" para la misma configuración.

## Sobrescrituras de sesión (`/exec`)

Usa `/exec` para establecer valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`.
Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorización

`/exec` solo se respeta para **remitentes autorizados** (allowlists/emparejamiento de canal más `commands.useAccessGroups`).
Actualiza **solo el estado de sesión** y no escribe configuración. Para deshabilitar exec de forma permanente, deniégalo mediante la política de herramientas
(`tools.deny: ["exec"]` o por agente). Las aprobaciones de host siguen aplicándose a menos que establezcas explícitamente
`security=full` y `ask=off`.

## Aprobaciones de exec (aplicación complementaria / host Node)

Los agentes en sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el host gateway o Node.
Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver la política, la allowlist y el flujo de UI.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente
`status: "approval-pending"` y un ID de aprobación. Una vez aprobado (o denegado / expirado),
el Gateway emite eventos del sistema (`Exec finished` / `Exec denied`). Si el comando sigue
ejecutándose después de `tools.exec.approvalRunningNoticeMs`, se emite un único aviso `Exec running`.
En canales con tarjetas/botones de aprobación nativos, el agente debe confiar primero en esa
UI nativa e incluir un comando manual `/approve` solo cuando el resultado de la herramienta
diga explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la
única ruta.

## Allowlist + binarios seguros

La aplicación manual de allowlist coincide con globs de rutas de binarios resueltas y globs de nombres
de comando sin ruta. Los nombres sin ruta solo coinciden con comandos invocados mediante PATH, por lo que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.
Cuando `security=allowlist`, los comandos de shell se permiten automáticamente solo si cada segmento de la canalización
está en la allowlist o es un binario seguro. El encadenamiento (`;`, `&&`, `||`) y las redirecciones
se rechazan en modo allowlist a menos que cada segmento de nivel superior satisfaga la
allowlist (incluidos los binarios seguros). Las redirecciones siguen sin estar admitidas.
La confianza durable de `allow-always` no omite esa regla: un comando encadenado aún requiere que cada
segmento de nivel superior coincida.

`autoAllowSkills` es una ruta de conveniencia separada en las aprobaciones de exec. No es lo mismo que
las entradas manuales de allowlist de rutas. Para confianza explícita estricta, mantén `autoAllowSkills` deshabilitado.

Usa los dos controles para trabajos distintos:

- `tools.exec.safeBins`: filtros de flujo pequeños, solo stdin.
- `tools.exec.safeBinTrustedDirs`: directorios adicionales explícitos de confianza para rutas ejecutables de binarios seguros.
- `tools.exec.safeBinProfiles`: política argv explícita para binarios seguros personalizados.
- allowlist: confianza explícita para rutas ejecutables.

No trates `safeBins` como una allowlist genérica, y no añadas binarios de intérprete/runtime (por ejemplo `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas de allowlist explícitas y mantén habilitadas las solicitudes de aprobación.
`openclaw security audit` advierte cuando faltan perfiles explícitos para entradas de `safeBins` de intérpretes/runtime, y `openclaw doctor --fix` puede generar la estructura de las entradas personalizadas de `safeBinProfiles` que falten.
`openclaw security audit` y `openclaw doctor` también advierten cuando vuelves a añadir explícitamente bins de comportamiento amplio, como `jq`, a `safeBins`.
Si incluyes intérpretes explícitamente en la allowlist, habilita `tools.exec.strictInlineEval` para que las formas de evaluación de código inline sigan requiriendo una nueva aprobación.

Para ver todos los detalles y ejemplos de la política, consulta [Aprobaciones de exec](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Bins seguros frente a allowlist](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

El sondeo es para consultar el estado bajo demanda, no para bucles de espera. Si la reactivación automática al completar
está habilitada, el comando puede reactivar la sesión cuando emite salida o falla.

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

Pegar (con bracketed paste de forma predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas de varios archivos.
Está habilitada de forma predeterminada para los modelos OpenAI y OpenAI Codex. Usa la configuración solo
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

- Solo disponible para modelos OpenAI/OpenAI Codex.
- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- `deny: ["write"]` no deniega `apply_patch`; deniega `apply_patch` explícitamente o usa `deny: ["group:fs"]` cuando las escrituras de parches también deban bloquearse.
- La configuración está en `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` tiene `true` como valor predeterminado; establécelo en `false` para deshabilitar la herramienta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` tiene `true` como valor predeterminado (contenido en el workspace). Establécelo en `false` solo si quieres intencionadamente que `apply_patch` escriba/elimine fuera del directorio del workspace.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — ejecución de comandos en entornos con sandbox
- [Proceso en segundo plano](/es/gateway/background-process) — exec y herramienta process de larga duración
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
