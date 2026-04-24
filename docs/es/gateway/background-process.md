---
read_when:
    - Añadir o modificar el comportamiento de exec en segundo plano
    - Depurar tareas largas de exec en ejecución
summary: Ejecución de exec en segundo plano y gestión de procesos
title: Exec en segundo plano y herramienta de procesos
x-i18n:
    generated_at: "2026-04-24T05:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# Exec en segundo plano + herramienta de procesos

OpenClaw ejecuta comandos de shell mediante la herramienta `exec` y mantiene las tareas de larga duración en memoria. La herramienta `process` gestiona esas sesiones en segundo plano.

## Herramienta exec

Parámetros principales:

- `command` (obligatorio)
- `yieldMs` (predeterminado 10000): pasa automáticamente a segundo plano después de este retraso
- `background` (bool): pasar a segundo plano inmediatamente
- `timeout` (segundos, predeterminado 1800): termina el proceso al superar este tiempo
- `elevated` (bool): ejecutar fuera del sandbox si el modo elevado está habilitado/permitido (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`)
- ¿Necesitas un TTY real? Configura `pty: true`.
- `workdir`, `env`

Comportamiento:

- Las ejecuciones en primer plano devuelven la salida directamente.
- Cuando se pasan a segundo plano (explícitamente o por tiempo), la herramienta devuelve `status: "running"` + `sessionId` y una cola corta.
- La salida se mantiene en memoria hasta que la sesión se consulte o se limpie.
- Si la herramienta `process` no está permitida, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
- Los comandos exec generados reciben `OPENCLAW_SHELL=exec` para reglas de shell/perfil sensibles al contexto.
- Para trabajo de larga duración que comienza ahora, inícialo una sola vez y confía en la activación automática por finalización cuando esté habilitada y el comando emita salida o falle.
- Si la activación automática por finalización no está disponible, o necesitas confirmación silenciosa de éxito para un comando que salió correctamente sin salida, usa `process` para confirmar la finalización.
- No simules recordatorios o seguimientos diferidos con bucles de `sleep` ni sondeo repetido; usa Cron para trabajo futuro.

## Puente de procesos hijo

Al generar procesos hijo de larga duración fuera de las herramientas exec/process (por ejemplo, reinicios de CLI o ayudantes del gateway), adjunta el helper de puente de procesos hijo para que las señales de terminación se reenvíen y los listeners se desacoplen al salir/con error. Esto evita procesos huérfanos en systemd y mantiene un comportamiento de apagado consistente entre plataformas.

Sobrescrituras por entorno:

- `PI_BASH_YIELD_MS`: yield predeterminado (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: límite de salida en memoria (caracteres)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: límite de stdout/stderr pendiente por flujo (caracteres)
- `PI_BASH_JOB_TTL_MS`: TTL para sesiones finalizadas (ms, limitado entre 1m y 3h)

Configuración (preferida):

- `tools.exec.backgroundMs` (predeterminado 10000)
- `tools.exec.timeoutSec` (predeterminado 1800)
- `tools.exec.cleanupMs` (predeterminado 1800000)
- `tools.exec.notifyOnExit` (predeterminado true): pone en cola un evento del sistema + solicita Heartbeat cuando un exec en segundo plano finaliza.
- `tools.exec.notifyOnExitEmptySuccess` (predeterminado false): cuando es true, también pone en cola eventos de finalización para ejecuciones correctas en segundo plano que no produjeron salida.

## Herramienta process

Acciones:

- `list`: sesiones en ejecución + finalizadas
- `poll`: drena salida nueva de una sesión (también informa del estado de salida)
- `log`: lee la salida agregada (admite `offset` + `limit`)
- `write`: envía stdin (`data`, `eof` opcional)
- `send-keys`: envía tokens de teclas explícitos o bytes a una sesión respaldada por PTY
- `submit`: envía Enter / retorno de carro a una sesión respaldada por PTY
- `paste`: envía texto literal, opcionalmente envuelto en modo de pegado entre corchetes
- `kill`: termina una sesión en segundo plano
- `clear`: elimina una sesión finalizada de la memoria
- `remove`: mata si está en ejecución; en caso contrario limpia si ya terminó

Notas:

- Solo las sesiones en segundo plano se listan/persisten en memoria.
- Las sesiones se pierden al reiniciar el proceso (sin persistencia en disco).
- Los registros de sesión solo se guardan en el historial del chat si ejecutas `process poll/log` y se registra el resultado de la herramienta.
- `process` tiene alcance por agente; solo ve sesiones iniciadas por ese agente.
- Usa `poll` / `log` para estado, registros, confirmación silenciosa de éxito o confirmación de finalización cuando la activación automática por finalización no esté disponible.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` cuando necesites entrada o intervención.
- `process list` incluye un `name` derivado (verbo del comando + objetivo) para revisiones rápidas.
- `process log` usa `offset`/`limit` basados en líneas.
- Cuando se omiten tanto `offset` como `limit`, devuelve las últimas 200 líneas e incluye una indicación de paginación.
- Cuando se proporciona `offset` y se omite `limit`, devuelve desde `offset` hasta el final (sin límite de 200).
- El sondeo es para estado bajo demanda, no para programación con bucles de espera. Si el trabajo debe ocurrir más tarde, usa Cron en su lugar.

## Ejemplos

Ejecutar una tarea larga y consultar después:

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
- [Aprobaciones de exec](/es/tools/exec-approvals)
