---
read_when:
    - Usando o modificando la herramienta exec
    - Depurando el comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos de stdin y compatibilidad con TTY
title: Herramienta exec
x-i18n:
    generated_at: "2026-04-24T05:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Ejecuta comandos de shell en el espacio de trabajo. Admite ejecución en primer plano y en segundo plano mediante `process`.
Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se va a ejecutar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo para el comando.
</ParamField>

<ParamField path="env" type="object">
Anulaciones de entorno clave/valor que se fusionan sobre el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Envía automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Envía el comando inmediatamente a segundo plano en lugar de esperar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Finaliza el comando después de este número de segundos.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta en un pseudo-terminal cuando esté disponible. Úsalo para CLI que solo funcionan con TTY, agentes de programación e interfaces de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dónde ejecutar. `auto` se resuelve a `sandbox` cuando hay un entorno sandbox activo y a `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modo de aplicación para ejecución `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamiento del prompt de aprobación para ejecución `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nombre del node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado — escapa del sandbox a la ruta del host configurada. `security=full` solo se fuerza cuando elevated se resuelve a `full`.
</ParamField>

Notas:

- `host` usa por defecto `auto`: sandbox cuando el entorno sandbox está activo para la sesión, en caso contrario gateway.
- `auto` es la estrategia de enrutamiento predeterminada, no un comodín. Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay un entorno sandbox activo.
- Sin configuración adicional, `host=auto` sigue “simplemente funcionando”: sin sandbox se resuelve a `gateway`; con un sandbox activo permanece en el sandbox.
- `elevated` escapa del sandbox a la ruta del host configurada: `gateway` por defecto, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` se controlan mediante `~/.openclaw/exec-approvals.json`.
- `node` requiere un node emparejado (app complementaria o host node sin interfaz).
- Si hay varios nodes disponibles, establece `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para nodes; el wrapper heredado `nodes.run` se ha eliminado.
- En hosts no Windows, exec usa `SHELL` cuando está configurado; si `SHELL` es `fish`, prefiere `bash` (o `sh`)
  desde `PATH` para evitar scripts incompatibles con fish, y luego recurre a `SHELL` si no existe ninguno de los dos.
- En hosts Windows, exec prefiere descubrir PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH),
  y después recurre a Windows PowerShell 5.1.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y anulaciones de cargador (`LD_*`/`DYLD_*`) para
  evitar secuestro de binarios o código inyectado.
- OpenClaw establece `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluyendo ejecución PTY y sandbox) para que las reglas de shell/perfil puedan detectar el contexto de la herramienta exec.
- Importante: el sandboxing está **desactivado por defecto**. Si el sandboxing está desactivado, `host=auto` implícito
  se resuelve a `gateway`. `host=sandbox` explícito sigue fallando en modo cerrado en lugar de ejecutarse silenciosamente
  en el host del gateway. Habilita sandboxing o usa `host=gateway` con aprobaciones.
- Las comprobaciones previas de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro del
  límite efectivo de `workdir`. Si una ruta de script se resuelve fuera de `workdir`, la comprobación previa se omite para
  ese archivo.
- Para trabajo de larga duración que empieza ahora, inícialo una vez y confía en el
  aviso automático de finalización cuando esté habilitado y el comando emita salida o falle.
  Usa `process` para registros, estado, entrada o intervención; no emules
  programación con bucles de sleep, bucles de timeout o sondeos repetidos.
- Para trabajo que deba ocurrir más tarde o en un horario, usa Cron en lugar de
  patrones de sleep/delay con `exec`.

## Configuración

- `tools.exec.notifyOnExit` (predeterminado: true): cuando es true, las sesiones exec enviadas a segundo plano encolan un evento del sistema y solicitan un Heartbeat al finalizar.
- `tools.exec.approvalRunningNoticeMs` (predeterminado: 10000): emite un único aviso “running” cuando una ejecución controlada por aprobación dura más que esto (0 lo desactiva).
- `tools.exec.host` (predeterminado: `auto`; se resuelve a `sandbox` cuando el entorno sandbox está activo, y a `gateway` en caso contrario)
- `tools.exec.security` (predeterminado: `deny` para sandbox, `full` para gateway + node cuando no está configurado)
- `tools.exec.ask` (predeterminado: `off`)
- La ejecución en host sin aprobación es el valor predeterminado para gateway + node. Si quieres comportamiento de aprobaciones/lista de permitidos, restringe tanto `tools.exec.*` como la política del host `~/.openclaw/exec-approvals.json`; consulta [Aprobaciones de ejecución](/es/tools/exec-approvals#no-approval-yolo-mode).
- YOLO proviene de los valores predeterminados de la política del host (`security=full`, `ask=off`), no de `host=auto`. Si quieres forzar enrutamiento a gateway o node, establece `tools.exec.host` o usa `/exec host=...`.
- En modo `security=full` más `ask=off`, la ejecución en host sigue directamente la política configurada; no hay una capa adicional de prefiltro heurístico de ofuscación de comandos ni de rechazo de comprobación previa de scripts.
- `tools.exec.node` (predeterminado: sin establecer)
- `tools.exec.strictInlineEval` (predeterminado: false): cuando es true, las formas de evaluación inline de intérprete como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` y `osascript -e` siempre requieren aprobación explícita. `allow-always` todavía puede persistir invocaciones benignas de intérprete/script, pero las formas de evaluación inline siguen pidiendo prompt cada vez.
- `tools.exec.pathPrepend`: lista de directorios que se anteponen a `PATH` para ejecuciones exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binarios seguros solo para stdin que pueden ejecutarse sin entradas explícitas en la lista de permitidos. Para detalles de comportamiento, consulta [Safe bins](/es/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directorios adicionales explícitos de confianza para comprobaciones de ruta de ejecutables `safeBins`. Las entradas de `PATH` nunca se consideran de confianza automáticamente. Los valores integrados predeterminados son `/bin` y `/usr/bin`.
- `tools.exec.safeBinProfiles`: política opcional personalizada de argv por safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

### Gestión de PATH

- `host=gateway`: fusiona tu `PATH` del shell de inicio de sesión en el entorno exec. Las anulaciones `env.PATH`
  se rechazan para la ejecución en host. El propio daemon sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: ejecuta `sh -lc` (shell de login) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`.
  OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación de shell);
  `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al node las anulaciones de entorno no bloqueadas que pases. Las anulaciones `env.PATH`
  se rechazan para la ejecución en host y los hosts node las ignoran. Si necesitas entradas PATH adicionales en un node,
  configura el entorno del servicio del host node (systemd/launchd) o instala herramientas en ubicaciones estándar.

Enlace de node por agente (usa el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: la pestaña Nodes incluye un pequeño panel “Exec node binding” para la misma configuración.

## Anulaciones de sesión (`/exec`)

Usa `/exec` para establecer valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`.
Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorización

`/exec` solo se respeta para **remitentes autorizados** (listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`).
Solo actualiza el **estado de la sesión** y no escribe configuración. Para desactivar completamente exec, deniégalo mediante la política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones de host siguen aplicándose salvo que establezcas explícitamente `security=full` y `ask=off`.

## Aprobaciones de ejecución (app complementaria / host node)

Los agentes en sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el host gateway o node.
Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals) para ver la política, lista de permitidos y flujo de UI.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente
`status: "approval-pending"` y un id de aprobación. Una vez aprobada (o denegada / agotado el tiempo),
el Gateway emite eventos del sistema (`Exec finished` / `Exec denied`). Si el comando sigue
en ejecución después de `tools.exec.approvalRunningNoticeMs`, se emite un único aviso `Exec running`.
En canales con tarjetas/botones de aprobación nativos, el agente debería confiar primero en esa
UI nativa e incluir un comando manual `/approve` solo cuando el
resultado de la herramienta indique explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

## Allowlist + safe bins

La aplicación manual de listas de permitidos coincide solo con **rutas resueltas de binarios** (sin coincidencias por nombre base). Cuando
`security=allowlist`, los comandos de shell solo se permiten automáticamente si cada segmento del pipeline está
en la lista de permitidos o es un safe bin. El encadenamiento (`;`, `&&`, `||`) y las redirecciones se rechazan en
modo allowlist a menos que cada segmento de nivel superior satisfaga la lista de permitidos (incluidos safe bins).
Las redirecciones siguen sin ser compatibles.
La confianza duradera `allow-always` no evita esa regla: un comando encadenado sigue requiriendo que cada
segmento de nivel superior coincida.

`autoAllowSkills` es una vía de conveniencia independiente en aprobaciones de ejecución. No es lo mismo que
las entradas manuales de lista de permitidos por ruta. Para confianza explícita estricta, mantén `autoAllowSkills` desactivado.

Usa los dos controles para trabajos distintos:

- `tools.exec.safeBins`: pequeños filtros de flujo solo por stdin.
- `tools.exec.safeBinTrustedDirs`: directorios adicionales explícitos de confianza para rutas ejecutables de safe bin.
- `tools.exec.safeBinProfiles`: política explícita de argv para safe bins personalizados.
- allowlist: confianza explícita para rutas ejecutables.

No trates `safeBins` como una lista de permitidos genérica y no añadas binarios de intérprete/entorno de ejecución (por ejemplo `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas explícitas de allowlist y mantén habilitados los prompts de aprobación.
`openclaw security audit` advierte cuando faltan perfiles explícitos en entradas `safeBins` de intérprete/entorno de ejecución, y `openclaw doctor --fix` puede generar entradas `safeBinProfiles` personalizadas que falten.
`openclaw security audit` y `openclaw doctor` también advierten cuando vuelves a añadir explícitamente bins de comportamiento amplio como `jq` a `safeBins`.
Si añades explícitamente intérpretes a la allowlist, habilita `tools.exec.strictInlineEval` para que las formas de evaluación inline sigan requiriendo una nueva aprobación.

Para detalles completos de política y ejemplos, consulta [Aprobaciones de ejecución](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Safe bins frente a allowlist](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

El sondeo es para estado bajo demanda, no para bucles de espera. Si la activación automática por finalización
está habilitada, el comando puede reactivar la sesión cuando emita salida o falle.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pegar (entre corchetes por defecto):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas de varios archivos.
Está habilitada por defecto para modelos OpenAI y OpenAI Codex. Usa configuración solo
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

- Solo está disponible para modelos OpenAI/OpenAI Codex.
- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- La configuración vive bajo `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` usa `true` de forma predeterminada; establécelo en `false` para deshabilitar la herramienta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa `true` de forma predeterminada (contenido dentro del espacio de trabajo). Establécelo en `false` solo si quieres intencionadamente que `apply_patch` escriba/elimine fuera del directorio del espacio de trabajo.

## Relacionado

- [Aprobaciones de ejecución](/es/tools/exec-approvals) — barreras de aprobación para comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — ejecutar comandos en entornos sandbox
- [Proceso en segundo plano](/es/gateway/background-process) — ejecución prolongada y herramienta process
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
