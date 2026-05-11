---
read_when:
    - Agregar o modificar el comportamiento de exec en segundo plano
    - Depuración de tareas exec de larga duración
summary: Ejecución de exec en segundo plano y gestión de procesos
title: Herramienta de ejecución en segundo plano y de procesos
x-i18n:
    generated_at: "2026-05-11T20:33:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y mantiene las tareas de larga duración en memoria. La herramienta `process` gestiona esas sesiones en segundo plano.

## herramienta exec

Parámetros clave:

- `command` (obligatorio)
- `yieldMs` (predeterminado 10000): pasa automáticamente a segundo plano después de este retraso
- `background` (bool): pasa a segundo plano inmediatamente
- `timeout` (segundos, predeterminado `tools.exec.timeoutSec`): termina el proceso después de este tiempo de espera; establece `timeout: 0` solo para desactivar el tiempo de espera del proceso exec para esa llamada
- `elevated` (bool): ejecuta fuera del sandbox si el modo elevado está habilitado/permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`)
- ¿Necesitas una TTY real? Establece `pty: true`.
- `workdir`, `env`

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando se envía a segundo plano (explícitamente o por tiempo de espera), la herramienta devuelve `status: "running"` + `sessionId` y una cola breve.
- Las ejecuciones con segundo plano y `yieldMs` heredan `tools.exec.timeoutSec` salvo que la llamada proporcione un `timeout` explícito.
- La salida se conserva en memoria hasta que la sesión se consulta o se borra.
- Si la herramienta `process` no está permitida, `exec` se ejecuta sincrónicamente e ignora `yieldMs`/`background`.
- Los comandos exec generados reciben `OPENCLAW_SHELL=exec` para reglas de shell/perfil conscientes del contexto.
- Para trabajo de larga duración que comienza ahora, inícialo una vez y usa la activación
  de finalización automática cuando esté habilitada y el comando emita salida o falle.
- Si la activación de finalización automática no está disponible, o necesitas confirmación
  de éxito silencioso para un comando que salió limpiamente sin salida, usa `process`
  para confirmar la finalización.
- No emules recordatorios ni seguimientos retrasados con bucles `sleep` o sondeos
  repetidos; usa cron para trabajo futuro.

## Puenteo de procesos secundarios

Al generar procesos secundarios de larga duración fuera de las herramientas exec/process (por ejemplo, reinicios de CLI o ayudantes del gateway), adjunta el ayudante de puente de procesos secundarios para que las señales de terminación se reenvíen y los escuchas se desacoplen al salir/error. Esto evita procesos huérfanos en systemd y mantiene un comportamiento de apagado coherente entre plataformas.

Sobrescrituras de entorno:

- `PI_BASH_YIELD_MS`: rendimiento predeterminado (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: límite de salida en memoria (caracteres)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: límite de stdout/stderr pendiente por flujo (caracteres)
- `PI_BASH_JOB_TTL_MS`: TTL para sesiones finalizadas (ms, limitado a 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: umbral de salida inactiva antes de que las sesiones en segundo plano escribibles se marquen como probablemente esperando entrada (predeterminado 15000 ms)

Config (preferido):

- `tools.exec.backgroundMs` (predeterminado 10000)
- `tools.exec.timeoutSec` (predeterminado 1800)
- `tools.exec.cleanupMs` (predeterminado 1800000)
- `tools.exec.notifyOnExit` (predeterminado true): encola un evento del sistema + solicita heartbeat cuando un exec en segundo plano sale.
- `tools.exec.notifyOnExitEmptySuccess` (predeterminado false): cuando es true, también encola eventos de finalización para ejecuciones en segundo plano correctas que no produjeron salida.

## herramienta process

Acciones:

- `list`: sesiones en ejecución + finalizadas
- `poll`: drena la salida nueva de una sesión (también informa el estado de salida)
- `log`: lee la salida agregada y muestra pistas de recuperación de entrada (admite `offset` + `limit`)
- `write`: envía stdin (`data`, `eof` opcional)
- `send-keys`: envía tokens de tecla explícitos o bytes a una sesión respaldada por PTY
- `submit`: envía Enter / retorno de carro a una sesión respaldada por PTY
- `paste`: envía texto literal, opcionalmente envuelto en modo de pegado entre corchetes
- `kill`: termina una sesión en segundo plano
- `clear`: elimina una sesión finalizada de la memoria
- `remove`: termina si está en ejecución; de lo contrario, borra si finalizó

Notas:

- Solo las sesiones en segundo plano se listan/persisten en memoria.
- Las sesiones se pierden al reiniciar el proceso (sin persistencia en disco).
- Los registros de sesión solo se guardan en el historial de chat si ejecutas `process poll/log` y se registra el resultado de la herramienta.
- `process` tiene alcance por agente; solo ve sesiones iniciadas por ese agente.
- Usa `poll` / `log` para estado, registros, confirmación de éxito silencioso o
  confirmación de finalización cuando la activación de finalización automática no esté disponible.
- Usa `log` antes de recuperar una CLI interactiva para que la transcripción actual,
  el estado de stdin y la pista de espera de entrada sean visibles juntos.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` cuando necesites entrada
  o intervención.
- `process list` incluye un `name` derivado (verbo del comando + destino) para revisiones rápidas.
- `process list`, `poll` y `log` informan `waitingForInput` solo
  cuando la sesión todavía tiene stdin escribible y ha estado inactiva durante más tiempo que el
  umbral de espera de entrada.
- `process log` usa `offset`/`limit` basados en líneas.
- Cuando se omiten tanto `offset` como `limit`, devuelve las últimas 200 líneas e incluye una pista de paginación.
- Cuando se proporciona `offset` y se omite `limit`, devuelve desde `offset` hasta el final (sin limitar a 200).
- El sondeo es para estado bajo demanda, no para programar bucles de espera. Si el trabajo debe
  ocurrir más tarde, usa cron en su lugar.

## Ejemplos

Ejecuta una tarea larga y sondea más tarde:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspecciona una sesión interactiva antes de enviar entrada:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Inicia inmediatamente en segundo plano:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Envía stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envía teclas PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Envía la línea actual:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pega texto literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Relacionado

- [Herramienta Exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)
