---
read_when:
    - Añadir o modificar el comportamiento de ejecución en segundo plano
    - Depurar tareas exec de larga duración
summary: Ejecución en segundo plano y gestión de procesos
title: Ejecución en segundo plano y herramienta de procesos
x-i18n:
    generated_at: "2026-06-27T11:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y conserva las tareas de larga duración en memoria. La herramienta `process` gestiona esas sesiones en segundo plano.

## Herramienta exec

Parámetros clave:

- `command` (obligatorio)
- `yieldMs` (predeterminado 10000): pasa automáticamente a segundo plano después de este retraso
- `background` (bool): pasa a segundo plano inmediatamente
- `timeout` (segundos, predeterminado `tools.exec.timeoutSec`): finaliza el proceso después de este tiempo de espera; establece `timeout: 0` solo para desactivar el tiempo de espera del proceso exec en esa llamada
- `elevated` (bool): ejecuta fuera del sandbox si el modo elevado está habilitado/permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`)
- ¿Necesitas un TTY real? Establece `pty: true`.
- `workdir`, `env`

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando se pasa a segundo plano (explícitamente o por tiempo de espera), la herramienta devuelve `status: "running"` + `sessionId` y una breve cola de salida.
- Las ejecuciones en segundo plano y con `yieldMs` heredan `tools.exec.timeoutSec` salvo que la llamada proporcione un `timeout` explícito.
- La salida se conserva en memoria hasta que se consulte o se borre la sesión.
- Si la herramienta `process` no está permitida, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec iniciados reciben `OPENCLAW_SHELL=exec` para reglas de shell/perfil con reconocimiento de contexto.
- Para trabajos de larga duración que empiezan ahora, inícialos una vez y confía en la reactivación automática
  de finalización cuando esté habilitada y el comando emita salida o falle.
- Si la reactivación automática de finalización no está disponible, o necesitas confirmación de
  éxito silencioso para un comando que salió correctamente sin salida, usa `process`
  para confirmar la finalización.
- No emules recordatorios ni seguimientos diferidos con bucles `sleep` o sondeos
  repetidos; usa cron para trabajo futuro.

## Puente de procesos secundarios

Al iniciar procesos secundarios de larga duración fuera de las herramientas exec/process (por ejemplo, reinicios de CLI o ayudantes de gateway), adjunta el ayudante de puente de procesos secundarios para que las señales de terminación se reenvíen y los listeners se desvinculen al salir o producirse un error. Esto evita procesos huérfanos en systemd y mantiene un comportamiento de apagado coherente entre plataformas.

Sobrescrituras de entorno:

- `OPENCLAW_BASH_YIELD_MS`: espera predeterminada (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: límite de salida en memoria (caracteres)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: límite de stdout/stderr pendiente por flujo (caracteres)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL para sesiones finalizadas (ms, limitado a 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: umbral de salida inactiva antes de que las sesiones en segundo plano escribibles se marquen como probablemente esperando entrada (predeterminado 15000 ms)

Configuración (preferida):

- `tools.exec.backgroundMs` (predeterminado 10000)
- `tools.exec.timeoutSec` (predeterminado 1800)
- `tools.exec.cleanupMs` (predeterminado 1800000)
- `tools.exec.notifyOnExit` (predeterminado true): encola un evento del sistema + solicita Heartbeat cuando sale un exec en segundo plano.
- `tools.exec.notifyOnExitEmptySuccess` (predeterminado false): cuando es true, también encola eventos de finalización para ejecuciones en segundo plano correctas que no produjeron salida.

## Herramienta process

Acciones:

- `list`: sesiones en ejecución + finalizadas
- `poll`: drena nueva salida de una sesión (también informa el estado de salida)
- `log`: lee la salida agregada y muestra sugerencias de recuperación de entrada (admite `offset` + `limit`)
- `write`: envía stdin (`data`, `eof` opcional)
- `send-keys`: envía tokens de tecla o bytes explícitos a una sesión respaldada por PTY
- `submit`: envía Enter / retorno de carro a una sesión respaldada por PTY
- `paste`: envía texto literal, opcionalmente envuelto en modo de pegado entre corchetes
- `kill`: termina una sesión en segundo plano
- `clear`: elimina una sesión finalizada de la memoria
- `remove`: finaliza si está en ejecución; de lo contrario, borra si está finalizada

Notas:

- Solo las sesiones en segundo plano se listan/persisten en memoria.
- Las sesiones se pierden al reiniciar el proceso (sin persistencia en disco).
- Los registros de sesión solo se guardan en el historial del chat si ejecutas `process poll/log` y se registra el resultado de la herramienta.
- `process` tiene ámbito por agente; solo ve las sesiones iniciadas por ese agente.
- Usa `poll` / `log` para estado, registros, confirmación de éxito silencioso o
  confirmación de finalización cuando la reactivación automática de finalización no esté disponible.
- Usa `log` antes de recuperar una CLI interactiva para que la transcripción actual,
  el estado de stdin y la sugerencia de espera de entrada sean visibles juntos.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` cuando necesites entrada
  o intervención.
- `process list` incluye un `name` derivado (verbo del comando + destino) para revisiones rápidas.
- `process list`, `poll` y `log` informan `waitingForInput` solo
  cuando la sesión todavía tiene stdin escribible y ha estado inactiva más tiempo que el
  umbral de espera de entrada.
- `process log` usa `offset`/`limit` basados en líneas.
- Cuando se omiten tanto `offset` como `limit`, devuelve las últimas 200 líneas e incluye una sugerencia de paginación.
- Cuando se proporciona `offset` y se omite `limit`, devuelve desde `offset` hasta el final (sin limitar a 200).
- El sondeo es para estado bajo demanda, no para programar bucles de espera. Si el trabajo debe
  ocurrir más tarde, usa cron en su lugar.

## Ejemplos

Ejecuta una tarea larga y consúltala más tarde:

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

- [Herramienta exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)
