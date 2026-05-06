---
read_when:
    - Añadir o modificar el comportamiento de ejecución en segundo plano
    - Depuración de tareas de ejecución de larga duración
summary: Ejecución de exec en segundo plano y gestión de procesos
title: Herramienta de ejecución en segundo plano y de procesos
x-i18n:
    generated_at: "2026-05-06T09:03:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y mantiene en memoria las tareas de larga duración. La herramienta `process` gestiona esas sesiones en segundo plano.

## herramienta exec

Parámetros clave:

- `command` (obligatorio)
- `yieldMs` (predeterminado 10000): pasa automáticamente a segundo plano después de este retraso
- `background` (bool): pasa a segundo plano de inmediato
- `timeout` (segundos, predeterminado `tools.exec.timeoutSec`): finaliza el proceso después de este tiempo de espera; establece `timeout: 0` solo para desactivar el tiempo de espera del proceso exec para esa llamada
- `elevated` (bool): ejecuta fuera del sandbox si el modo elevado está habilitado/permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`)
- ¿Necesitas una TTY real? Establece `pty: true`.
- `workdir`, `env`

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando pasa a segundo plano (de forma explícita o por tiempo de espera), la herramienta devuelve `status: "running"` + `sessionId` y una cola breve.
- Las ejecuciones en segundo plano y con `yieldMs` heredan `tools.exec.timeoutSec` salvo que la llamada proporcione un `timeout` explícito.
- La salida se conserva en memoria hasta que la sesión se consulta o se borra.
- Si la herramienta `process` no está permitida, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec generados reciben `OPENCLAW_SHELL=exec` para reglas de shell/perfil conscientes del contexto.
- Para trabajo de larga duración que empieza ahora, inícialo una vez y depende de la activación automática por finalización cuando esté habilitada y el comando emita salida o falle.
- Si la activación automática por finalización no está disponible, o necesitas confirmación de éxito silencioso para un comando que terminó limpiamente sin salida, usa `process` para confirmar la finalización.
- No emules recordatorios ni seguimientos diferidos con bucles `sleep` o sondeos repetidos; usa cron para trabajo futuro.

## Puente de procesos secundarios

Al generar procesos secundarios de larga duración fuera de las herramientas exec/process (por ejemplo, reinicios de CLI o auxiliares del gateway), adjunta el auxiliar de puente de procesos secundarios para que se reenvíen las señales de terminación y los listeners se desconecten al salir o al producirse un error. Esto evita procesos huérfanos en systemd y mantiene un comportamiento de apagado coherente entre plataformas.

Sobrescrituras de entorno:

- `PI_BASH_YIELD_MS`: yield predeterminado (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: límite de salida en memoria (caracteres)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: límite de stdout/stderr pendiente por stream (caracteres)
- `PI_BASH_JOB_TTL_MS`: TTL para sesiones finalizadas (ms, acotado a 1m–3h)

Configuración (preferida):

- `tools.exec.backgroundMs` (predeterminado 10000)
- `tools.exec.timeoutSec` (predeterminado 1800)
- `tools.exec.cleanupMs` (predeterminado 1800000)
- `tools.exec.notifyOnExit` (predeterminado true): encola un evento del sistema + solicita Heartbeat cuando sale un exec en segundo plano.
- `tools.exec.notifyOnExitEmptySuccess` (predeterminado false): cuando es true, también encola eventos de finalización para ejecuciones correctas en segundo plano que no produjeron salida.

## herramienta process

Acciones:

- `list`: sesiones en ejecución + finalizadas
- `poll`: drena la nueva salida de una sesión (también informa el estado de salida)
- `log`: lee la salida agregada (admite `offset` + `limit`)
- `write`: envía stdin (`data`, `eof` opcional)
- `send-keys`: envía tokens de tecla explícitos o bytes a una sesión respaldada por PTY
- `submit`: envía Enter / retorno de carro a una sesión respaldada por PTY
- `paste`: envía texto literal, opcionalmente envuelto en modo de pegado con corchetes
- `kill`: termina una sesión en segundo plano
- `clear`: elimina de la memoria una sesión finalizada
- `remove`: finaliza si está en ejecución; de lo contrario, borra si está finalizada

Notas:

- Solo las sesiones en segundo plano se listan/persisten en memoria.
- Las sesiones se pierden al reiniciar el proceso (sin persistencia en disco).
- Los logs de sesión solo se guardan en el historial de chat si ejecutas `process poll/log` y se registra el resultado de la herramienta.
- `process` tiene alcance por agente; solo ve sesiones iniciadas por ese agente.
- Usa `poll` / `log` para estado, logs, confirmación de éxito silencioso o confirmación de finalización cuando la activación automática por finalización no esté disponible.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` cuando necesites entrada o intervención.
- `process list` incluye un `name` derivado (verbo de comando + destino) para revisiones rápidas.
- `process log` usa `offset`/`limit` basados en líneas.
- Cuando se omiten tanto `offset` como `limit`, devuelve las últimas 200 líneas e incluye una pista de paginación.
- Cuando se proporciona `offset` y se omite `limit`, devuelve desde `offset` hasta el final (sin limitar a 200).
- El sondeo es para estado bajo demanda, no para programar bucles de espera. Si el trabajo debe ocurrir más tarde, usa cron en su lugar.

## Ejemplos

Ejecuta una tarea larga y consúltala más tarde:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inicia de inmediato en segundo plano:

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
- [Aprobaciones de Exec](/es/tools/exec-approvals)
