---
read_when:
    - Necesitas responder quién ejecutó un agente o una herramienta, cuándo se ejecutó y cómo terminó
    - Necesitas una exportación de actividad acotada y segura para la redacción
summary: Referencia de la CLI para registros de auditoría de ejecuciones de agente solo con metadatos y acciones de herramientas
title: Registros de auditoría
x-i18n:
    generated_at: "2026-07-06T21:47:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f3163f5fe4d1e15c2364d71927299caad4fd8a2b0101347cecab5d4d97f11c0
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Consulta el registro de auditoría de solo metadatos del Gateway para ejecuciones de agentes y acciones de herramientas.

La grabación está activada de forma predeterminada; establece [`audit.enabled: false`](/es/gateway/configuration-reference#audit)
para detener nuevas escrituras. Los registros existentes siguen consultables hasta que caducan (30 días).
El registro es independiente de las transcripciones de conversaciones: registra identidad,
orden, procedencia, acción, estado y códigos de error normalizados, pero nunca
almacena prompts, mensajes, argumentos de herramientas, resultados de herramientas, salida de comandos ni texto
de error sin procesar.

El Gateway escribe registros en la base de datos de estado compartida de OpenClaw mediante un
escritor en segundo plano acotado. Las consultas nunca devuelven registros anteriores a 30 días,
y el registro está limitado a 100.000 filas. Las filas caducadas se eliminan durante
el inicio del Gateway, el mantenimiento horario y las escrituras posteriores.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
```

## Filtros

- `--agent <id>`: id exacto del agente
- `--session <key>`: clave de sesión exacta
- `--run <id>`: id exacto de ejecución
- `--kind <kind>`: `agent_run` o `tool_action`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` o `unknown`
- `--after <timestamp>` / `--before <timestamp>`: marca de tiempo ISO inclusiva o
  milisegundos Unix
- `--limit <count>`: tamaño de página de 1 a 500; predeterminado `100`
- `--cursor <sequence>`: continúa una consulta anterior de más reciente a más antigua
- `--json`: imprime la página acotada como JSON

La salida de texto muestra la hora, el tipo, el estado, el agente, la ejecución y la acción. Las acciones de herramientas también
muestran el nombre de la herramienta. La salida JSON es una exportación acotada segura de los mismos metadatos
e incluye `nextCursor` cuando existe otra página. Pasa ese valor a
`--cursor` para continuar sin reordenar los registros que llegan durante la paginación.

## Eventos registrados

El Gateway proyecta los flujos existentes de eventos de agente en cuatro acciones:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`

Cada registro tiene un id de evento estable, una secuencia de registro que aumenta monótonamente,
la secuencia original del evento de ejecución, marca de tiempo del ciclo de vida cuando el runtime proporciona
una (de lo contrario, hora de observación), procedencia de agente/ejecución, actor y un
marcador `redaction: "metadata_only"`. Los registros terminales distinguen éxito,
fallo, cancelación, tiempo de espera y bloqueos de política con estados y códigos de error
cerrados. `unknown` es un resultado explícito sin éxito cuando un runtime ascendente
no expone un resultado terminal autoritativo. Los id de llamadas de herramientas se exportan
solo como huellas digitales unidireccionales estables. Los nombres de herramientas deben coincidir con el contrato compacto
de nombres orientados al modelo; otros valores se convierten en `unknown`. Los id de sesión, las claves de sesión, los id de ejecución y los nombres de herramientas conservados son metadatos de operador; protege las exportaciones
como registros operativos.

El registro de auditoría no sustituye transcripciones, historial de tareas, historial de ejecuciones de Cron
ni logs. Proporciona un pequeño índice entre ejecuciones para preguntas del operador sin
copiar contenido de conversaciones a otro almacén.

## RPC del Gateway

`audit.list` requiere `operator.read` y acepta los mismos filtros. Ejemplo:

```bash
openclaw gateway call audit.list --params '{"agentId":"main","status":"failed","limit":50}'
```

El resultado es `{ "events": AuditEvent[], "nextCursor"?: string }`. Los resultados se ordenan
de más reciente a más antiguo y están limitados a 500 registros por solicitud.

## Relacionado

- [Protocolo del Gateway](/es/gateway/protocol#audit-ledger-rpc)
- [Sesiones](/es/cli/sessions)
- [Tareas](/es/cli/tasks)
- [Trabajos de Cron](/es/automation/cron-jobs)
