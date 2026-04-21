---
read_when:
    - Uso o modificación de la herramienta exec
    - Depuración del comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos de stdin y compatibilidad con TTY
title: Herramienta exec
x-i18n:
    generated_at: "2026-04-21T13:38:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Herramienta exec

Ejecuta comandos de shell en el espacio de trabajo. Admite ejecución en primer plano + en segundo plano mediante `process`.
Si `process` no está permitido, `exec` se ejecuta sincrónicamente e ignora `yieldMs`/`background`.
Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

- `command` (obligatorio)
- `workdir` (por defecto es cwd)
- `env` (anulaciones clave/valor)
- `yieldMs` (valor predeterminado 10000): pasa automáticamente a segundo plano tras el retraso
- `background` (bool): pasa a segundo plano inmediatamente
- `timeout` (segundos, valor predeterminado 1800): mata el proceso al expirar
- `pty` (bool): ejecuta en un pseudo-terminal cuando está disponible (CLI solo-TTY, agentes de coding, interfaces de terminal)
- `host` (`auto | sandbox | gateway | node`): dónde ejecutar
- `security` (`deny | allowlist | full`): modo de aplicación para `gateway`/`node`
- `ask` (`off | on-miss | always`): solicitudes de aprobación para `gateway`/`node`
- `node` (string): id/nombre del node para `host=node`
- `elevated` (bool): solicita modo elevado (escapa del sandbox hacia la ruta de host configurada); `security=full` solo se fuerza cuando elevated se resuelve a `full`

Notas:

- `host` usa por defecto `auto`: sandbox cuando el runtime sandbox está activo para la sesión; en caso contrario, gateway.
- `auto` es la estrategia de enrutamiento predeterminada, no un comodín. Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay un runtime sandbox activo.
- Sin configuración adicional, `host=auto` sigue “simplemente funcionando”: si no hay sandbox, se resuelve a `gateway`; si hay un sandbox activo, permanece en el sandbox.
- `elevated` escapa del sandbox hacia la ruta de host configurada: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` se controlan mediante `~/.openclaw/exec-approvals.json`.
- `node` requiere un node emparejado (app complementaria o host de node sin interfaz).
- Si hay varios nodes disponibles, establece `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para nodes; el envoltorio heredado `nodes.run` se ha eliminado.
- En hosts que no son Windows, exec usa `SHELL` si está definido; si `SHELL` es `fish`, prefiere `bash` (o `sh`)
  de `PATH` para evitar scripts incompatibles con fish, y luego recurre a `SHELL` si ninguno existe.
- En hosts Windows, exec prefiere el descubrimiento de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH),
  y después recurre a Windows PowerShell 5.1.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y las anulaciones de cargador (`LD_*`/`DYLD_*`) para
  evitar el secuestro de binarios o la inyección de código.
- OpenClaw establece `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluida la ejecución con PTY y sandbox) para que las reglas de shell/perfil puedan detectar el contexto de la herramienta exec.
- Importante: el sandboxing está **desactivado de forma predeterminada**. Si el sandboxing está desactivado, `host=auto`
  implícito se resuelve a `gateway`. `host=sandbox` explícito sigue fallando de forma cerrada en lugar de ejecutarse silenciosamente
  en el host del gateway. Habilita el sandboxing o usa `host=gateway` con aprobaciones.
- Las comprobaciones previas de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro del
  límite efectivo de `workdir`. Si la ruta de un script se resuelve fuera de `workdir`, se omite la comprobación previa para
  ese archivo.
- Para trabajo de larga duración que comienza ahora, inícialo una vez y confía en la
  reactivación automática por finalización cuando esté habilitada y el comando emita salida o falle.
  Usa `process` para registros, estado, entrada o intervención; no emules
  planificación con bucles de espera, bucles de timeout ni sondeo repetido.
- Para trabajo que deba ocurrir más tarde o según una programación, usa Cron en lugar de
  patrones de espera/retraso con `exec`.

## Configuración

- `tools.exec.notifyOnExit` (predeterminado: true): cuando es true, las sesiones exec en segundo plano encolan un evento del sistema y solicitan un Heartbeat al salir.
- `tools.exec.approvalRunningNoticeMs` (predeterminado: 10000): emite un único aviso de “en ejecución” cuando un exec con aprobación tarda más de esto (0 lo desactiva).
- `tools.exec.host` (predeterminado: `auto`; se resuelve a `sandbox` cuando el runtime sandbox está activo, `gateway` en caso contrario)
- `tools.exec.security` (predeterminado: `deny` para sandbox, `full` para gateway + node cuando no está definido)
- `tools.exec.ask` (predeterminado: `off`)
- La ejecución en host sin aprobación es el valor predeterminado para gateway + node. Si quieres comportamiento con aprobaciones/lista de permitidos, ajusta tanto `tools.exec.*` como el `~/.openclaw/exec-approvals.json` del host; consulta [Exec approvals](/es/tools/exec-approvals#no-approval-yolo-mode).
- El modo YOLO proviene de los valores predeterminados de la política del host (`security=full`, `ask=off`), no de `host=auto`. Si quieres forzar el enrutamiento por gateway o node, establece `tools.exec.host` o usa `/exec host=...`.
- En modo `security=full` más `ask=off`, la ejecución en host sigue directamente la política configurada; no hay una capa adicional de prefiltro heurístico de ofuscación de comandos ni de rechazo de comprobación previa de scripts.
- `tools.exec.node` (predeterminado: sin definir)
- `tools.exec.strictInlineEval` (predeterminado: false): cuando es true, las formas de evaluación inline del intérprete como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` y `osascript -e` siempre requieren aprobación explícita. `allow-always` aún puede persistir invocaciones benignas de intérpretes/scripts, pero las formas inline-eval siguen solicitando aprobación cada vez.
- `tools.exec.pathPrepend`: lista de directorios que se anteponen a `PATH` para ejecuciones de exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binarios seguros solo-stdin que pueden ejecutarse sin entradas explícitas en la lista de permitidos. Para detalles del comportamiento, consulta [Safe bins](/es/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directorios explícitos adicionales de confianza para comprobaciones de ruta ejecutable de `safeBins`. Las entradas de `PATH` nunca se consideran automáticamente de confianza. Los valores predeterminados integrados son `/bin` y `/usr/bin`.
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

- `host=gateway`: fusiona tu `PATH` del shell de inicio de sesión en el entorno de exec. Las anulaciones de `env.PATH`
  se rechazan para ejecución en host. El demonio en sí sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, así que `/etc/profile` puede restablecer `PATH`.
  OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación de shell);
  `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al node las anulaciones de entorno no bloqueadas que proporciones. Las anulaciones de `env.PATH`
  se rechazan para ejecución en host y los hosts node las ignoran. Si necesitas entradas PATH adicionales en un node,
  configura el entorno del servicio del host node (systemd/launchd) o instala herramientas en ubicaciones estándar.

Vinculación de node por agente (usa el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI de control: la pestaña Nodes incluye un pequeño panel “Exec node binding” para los mismos ajustes.

## Anulaciones de sesión (`/exec`)

Usa `/exec` para establecer valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`.
Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorización

`/exec` solo se respeta para **remitentes autorizados** (listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`).
Actualiza **solo el estado de la sesión** y no escribe configuración. Para desactivar exec por completo, deniégalo mediante la
política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones de host siguen aplicándose salvo que establezcas explícitamente
`security=full` y `ask=off`.

## Exec approvals (app complementaria / host node)

Los agentes en sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el host gateway o node.
Consulta [Exec approvals](/es/tools/exec-approvals) para la política, la lista de permitidos y el flujo de UI.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente
`status: "approval-pending"` y un id de aprobación. Una vez aprobada (o denegada / expirada),
el Gateway emite eventos del sistema (`Exec finished` / `Exec denied`). Si el comando sigue
ejecutándose después de `tools.exec.approvalRunningNoticeMs`, se emite un único aviso `Exec running`.
En canales con tarjetas/botones de aprobación nativos, el agente debe apoyarse primero en esa
UI nativa e incluir un comando manual `/approve` solo cuando el resultado de la
herramienta diga explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la
única vía.

## Lista de permitidos + safe bins

La aplicación manual de lista de permitidos coincide **solo con rutas resueltas de binarios** (sin coincidencias por nombre base). Cuando
`security=allowlist`, los comandos de shell se permiten automáticamente solo si cada segmento de la canalización está
en la lista de permitidos o es un safe bin. El encadenamiento (`;`, `&&`, `||`) y las redirecciones se rechazan en
modo allowlist a menos que cada segmento de nivel superior cumpla la lista de permitidos (incluidos los safe bins).
Las redirecciones siguen sin ser compatibles.
La confianza duradera `allow-always` no evita esa regla: un comando encadenado sigue requiriendo que cada
segmento de nivel superior coincida.

`autoAllowSkills` es una ruta de conveniencia separada en exec approvals. No es lo mismo que
las entradas manuales de lista de permitidos por ruta. Para una confianza estricta y explícita, mantén `autoAllowSkills` desactivado.

Usa los dos controles para trabajos distintos:

- `tools.exec.safeBins`: pequeños filtros de flujo solo-stdin.
- `tools.exec.safeBinTrustedDirs`: directorios explícitos adicionales de confianza para rutas ejecutables de safe bins.
- `tools.exec.safeBinProfiles`: política explícita de argv para safe bins personalizados.
- allowlist: confianza explícita para rutas ejecutables.

No trates `safeBins` como una lista de permitidos genérica y no añadas binarios de intérprete/runtime (por ejemplo `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas explícitas en la lista de permitidos y mantén habilitadas las solicitudes de aprobación.
`openclaw security audit` advierte cuando faltan perfiles explícitos para entradas `safeBins` de intérprete/runtime, y `openclaw doctor --fix` puede generar las entradas `safeBinProfiles` personalizadas que falten.
`openclaw security audit` y `openclaw doctor` también advierten cuando vuelves a añadir explícitamente a `safeBins` binarios de comportamiento amplio como `jq`.
Si permites explícitamente intérpretes, habilita `tools.exec.strictInlineEval` para que las formas de evaluación inline de código sigan requiriendo una aprobación nueva.

Para conocer todos los detalles y ejemplos de la política, consulta [Exec approvals](/es/tools/exec-approvals#safe-bins-stdin-only) y [Safe bins versus allowlist](/es/tools/exec-approvals#safe-bins-versus-allowlist).

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

El sondeo es para consultar el estado bajo demanda, no para bucles de espera. Si la reactivación automática por finalización
está habilitada, el comando puede reactivar la sesión cuando emite salida o falla.

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

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas en varios archivos.
Está habilitada de forma predeterminada para los modelos OpenAI y OpenAI Codex. Usa configuración solo
cuando quieras desactivarla o restringirla a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Notas:

- Solo está disponible para modelos OpenAI/OpenAI Codex.
- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- La configuración se encuentra en `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` usa `true` de forma predeterminada; establécelo en `false` para desactivar la herramienta en modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa `true` de forma predeterminada (limitado al espacio de trabajo). Establécelo en `false` solo si intencionalmente quieres que `apply_patch` escriba/elimine fuera del directorio del espacio de trabajo.

## Relacionado

- [Exec Approvals](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — ejecución de comandos en entornos aislados
- [Background Process](/es/gateway/background-process) — exec de larga duración y herramienta process
- [Security](/es/gateway/security) — política de herramientas y acceso elevado
