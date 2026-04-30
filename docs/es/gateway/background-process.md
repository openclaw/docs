---
read_when:
    - Añadir o modificar el comportamiento de ejecución en segundo plano
    - Depuración de tareas exec de larga duración
summary: Ejecución de exec en segundo plano y gestión de procesos
title: Herramienta de ejecución en segundo plano y de procesos
x-i18n:
    generated_at: "2026-04-30T05:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Ejecución en segundo plano + herramienta de procesos

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y mantiene en memoria las tareas de larga duración. La herramienta `process` administra esas sesiones en segundo plano.

## Herramienta exec

Parámetros clave:

- `command` (obligatorio)
- `yieldMs` (predeterminado 10000): pasa automáticamente a segundo plano tras esta demora
- `background` (bool): pasa a segundo plano de inmediato
- `timeout` (segundos, predeterminado `tools.exec.timeoutSec`): finaliza el proceso después de este tiempo de espera; configura `timeout: 0` solo para desactivar el tiempo de espera del proceso exec para esa llamada
- `elevated` (bool): ejecuta fuera del sandbox si el modo elevado está habilitado/permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`)
- ¿Necesitas un TTY real? Configura `pty: true`.
- `workdir`, `env`

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando se pasa a segundo plano (explícitamente o por tiempo de espera), la herramienta devuelve `status: "running"` + `sessionId` y una cola breve.
- Las ejecuciones en segundo plano y con `yieldMs` heredan `tools.exec.timeoutSec` salvo que la llamada proporcione un `timeout` explícito.
- La salida se mantiene en memoria hasta que se consulta o se borra la sesión.
- Si la herramienta `process` no está permitida, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec generados reciben `OPENCLAW_SHELL=exec` para reglas de shell/perfil conscientes del contexto.
- Para trabajos de larga duración que comienzan ahora, inícialos una vez y confía en la activación automática
  al completarse cuando esté habilitada y el comando emita salida o falle.
- Si la activación automática al completarse no está disponible, o necesitas confirmar
  un éxito silencioso para un comando que terminó limpiamente sin salida, usa `process`
  para confirmar la finalización.
- No emules recordatorios ni seguimientos diferidos con bucles `sleep` o sondeos
  repetidos; usa cron para trabajo futuro.

## Puenteo de procesos secundarios

Al generar procesos secundarios de larga duración fuera de las herramientas exec/process (por ejemplo, reinicios de CLI o ayudantes de gateway), adjunta el ayudante de puente de procesos secundarios para que las señales de terminación se reenvíen y los listeners se desacoplen al salir/error. Esto evita procesos huérfanos en systemd y mantiene un comportamiento de apagado coherente entre plataformas.

Sobrescrituras de entorno:

- `PI_BASH_YIELD_MS`: espera predeterminada (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: límite de salida en memoria (caracteres)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: límite de stdout/stderr pendiente por flujo (caracteres)
- `PI_BASH_JOB_TTL_MS`: TTL para sesiones finalizadas (ms, limitado a 1m–3h)

Configuración (preferida):

- `tools.exec.backgroundMs` (predeterminado 10000)
- `tools.exec.timeoutSec` (predeterminado 1800)
- `tools.exec.cleanupMs` (predeterminado 1800000)
- `tools.exec.notifyOnExit` (predeterminado true): pone en cola un evento del sistema + solicita Heartbeat cuando sale un exec en segundo plano.
- `tools.exec.notifyOnExitEmptySuccess` (predeterminado false): cuando es true, también pone en cola eventos de finalización para ejecuciones en segundo plano correctas que no produjeron salida.

## Herramienta process

Acciones:

- `list`: sesiones en ejecución + finalizadas
- `poll`: drena la salida nueva de una sesión (también informa el estado de salida)
- `log`: lee la salida agregada (admite `offset` + `limit`)
- `write`: envía stdin (`data`, `eof` opcional)
- `send-keys`: envía tokens de tecla o bytes explícitos a una sesión respaldada por PTY
- `submit`: envía Enter / retorno de carro a una sesión respaldada por PTY
- `paste`: envía texto literal, opcionalmente envuelto en modo de pegado con corchetes
- `kill`: termina una sesión en segundo plano
- `clear`: elimina una sesión finalizada de la memoria
- `remove`: finaliza si está en ejecución; si no, borra si finalizó

Notas:

- Solo las sesiones en segundo plano se listan/persisten en memoria.
- Las sesiones se pierden al reiniciar el proceso (sin persistencia en disco).
- Los registros de sesión solo se guardan en el historial del chat si ejecutas `process poll/log` y el resultado de la herramienta se registra.
- `process` está acotado por agente; solo ve las sesiones iniciadas por ese agente.
- Usa `poll` / `log` para estado, registros, confirmación de éxito silencioso o
  confirmación de finalización cuando la activación automática al completarse no esté disponible.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` cuando necesites entrada
  o intervención.
- `process list` incluye un `name` derivado (verbo del comando + destino) para revisiones rápidas.
- `process log` usa `offset`/`limit` basados en líneas.
- Cuando se omiten tanto `offset` como `limit`, devuelve las últimas 200 líneas e incluye una sugerencia de paginación.
- Cuando se proporciona `offset` y se omite `limit`, devuelve desde `offset` hasta el final (sin limitar a 200).
- El sondeo es para estado bajo demanda, no para programar bucles de espera. Si el trabajo debe
  ocurrir más tarde, usa cron en su lugar.

## Ejemplos

Ejecutar una tarea larga y consultarla más tarde:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Iniciar inmediatamente en segundo plano:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Enviar stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Enviar teclas PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Enviar la línea actual:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pegar texto literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Relacionado

- [Herramienta exec](/es/tools/exec)
- [Aprobaciones exec](/es/tools/exec-approvals)
