---
read_when:
    - Quieres flujos de trabajo deterministas de varios pasos con aprobaciones explícitas
    - Debe reanudar un flujo de trabajo sin volver a ejecutar los pasos anteriores
summary: Entorno de ejecución de flujos de trabajo tipado para OpenClaw con controles de aprobación reanudables.
title: Langosta
x-i18n:
    generated_at: "2026-05-04T02:25:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster es un shell de flujos de trabajo que permite a OpenClaw ejecutar secuencias de herramientas de varios pasos como una operación única y determinista, con puntos de aprobación explícitos.

Lobster es una capa de autoría por encima del trabajo en segundo plano desacoplado. Para la orquestación de flujos por encima de tareas individuales, consulta [Flujo de tareas](/es/automation/taskflow) (`openclaw tasks flow`). Para el registro de actividad de tareas, consulta [`openclaw tasks`](/es/automation/tasks).

## Hook

Tu asistente puede construir las herramientas que se gestionan a sí mismas. Pide un flujo de trabajo y, 30 minutos después, tendrás una CLI más pipelines que se ejecutan con una sola llamada. Lobster es la pieza que faltaba: pipelines deterministas, aprobaciones explícitas y estado reanudable.

## Por qué

Hoy, los flujos de trabajo complejos requieren muchas llamadas de herramientas de ida y vuelta. Cada llamada consume tokens, y el LLM tiene que orquestar cada paso. Lobster traslada esa orquestación a un runtime tipado:

- **Una llamada en lugar de muchas**: OpenClaw ejecuta una llamada de herramienta de Lobster y obtiene un resultado estructurado.
- **Aprobaciones integradas**: Los efectos secundarios (enviar correo, publicar comentario) detienen el flujo de trabajo hasta que se aprueban explícitamente.
- **Reanudable**: Los flujos de trabajo detenidos devuelven un token; aprueba y reanuda sin volver a ejecutar todo.

## ¿Por qué un DSL en lugar de programas comunes?

Lobster es intencionalmente pequeño. El objetivo no es "un nuevo lenguaje", sino una especificación de pipeline predecible y apta para IA, con aprobaciones de primera clase y tokens de reanudación.

- **Aprobar/reanudar está integrado**: Un programa normal puede pedir confirmación a una persona, pero no puede _pausarse y reanudarse_ con un token duradero sin que inventes tú mismo ese runtime.
- **Determinismo + auditabilidad**: Los pipelines son datos, así que son fáciles de registrar, comparar, reproducir y revisar.
- **Superficie restringida para IA**: Una gramática pequeña + tuberías JSON reducen las rutas de código “creativas” y hacen realista la validación.
- **Política de seguridad incorporada**: Los tiempos de espera, límites de salida, comprobaciones de sandbox y listas de permitidos los aplica el runtime, no cada script.
- **Sigue siendo programable**: Cada paso puede llamar cualquier CLI o script. Si quieres JS/TS, genera archivos `.lobster` desde código.

## Cómo funciona

OpenClaw ejecuta flujos de trabajo de Lobster **dentro del proceso** mediante un runner integrado. No se inicia ningún subproceso de CLI externo; el motor de flujos de trabajo se ejecuta dentro del proceso del Gateway y devuelve directamente un sobre JSON.
Si el pipeline se pausa para aprobación, la herramienta devuelve un `resumeToken` para que puedas continuar más tarde.

## Patrón: CLI pequeña + tuberías JSON + aprobaciones

Construye comandos pequeños que hablen JSON y luego encadénalos en una sola llamada de Lobster. (Nombres de comandos de ejemplo a continuación; sustitúyelos por los tuyos.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Si el pipeline solicita aprobación, reanuda con el token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

La IA activa el flujo de trabajo; Lobster ejecuta los pasos. Las compuertas de aprobación mantienen los efectos secundarios explícitos y auditables.

Ejemplo: asignar elementos de entrada a llamadas de herramientas:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos de LLM solo JSON (llm-task)

Para flujos de trabajo que necesitan un **paso LLM estructurado**, habilita la herramienta opcional de plugin
`llm-task` y llámala desde Lobster. Esto mantiene el flujo de trabajo
determinista sin dejar de permitirte clasificar/resumir/redactar con un modelo.

Habilita la herramienta:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

Úsala en un pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Consulta [Tarea LLM](/es/tools/llm-task) para ver detalles y opciones de configuración.

## Archivos de flujo de trabajo (.lobster)

Lobster puede ejecutar archivos de flujo de trabajo YAML/JSON con campos `name`, `args`, `steps`, `env`, `condition` y `approval`. En llamadas de herramientas de OpenClaw, establece `pipeline` en la ruta del archivo.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Notas:

- `stdin: $step.stdout` y `stdin: $step.json` pasan la salida de un paso anterior.
- `condition` (o `when`) puede condicionar pasos según `$step.approved`.

## Instalar Lobster

Los flujos de trabajo de Lobster incluidos se ejecutan dentro del proceso; no se requiere un binario `lobster` separado. El runner integrado se distribuye con el plugin de Lobster.

Si necesitas la CLI independiente de Lobster para desarrollo o pipelines externos, instálala desde el [repo de Lobster](https://github.com/openclaw/lobster) y asegúrate de que `lobster` esté en `PATH`.

## Habilitar la herramienta

Lobster es una herramienta de plugin **opcional** (no habilitada de forma predeterminada).

Recomendado (aditivo, seguro):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

O por agente:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Evita usar `tools.allow: ["lobster"]` a menos que pretendas ejecutarlo en modo restrictivo de lista de permitidos.

<Note>
Las listas de permitidos son opcionales para plugins opcionales. `alsoAllow` habilita solo las herramientas de plugin opcionales nombradas, conservando el conjunto normal de herramientas del núcleo. Para restringir las herramientas del núcleo, usa `tools.allow` con las herramientas o grupos del núcleo que quieras.
</Note>

## Ejemplo: triaje de correo electrónico

Sin Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Con Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Devuelve un sobre JSON (truncado):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

El usuario aprueba → reanudar:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Un flujo de trabajo. Determinista. Seguro.

## Parámetros de la herramienta

### `run`

Ejecuta un pipeline en modo herramienta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Ejecuta un archivo de flujo de trabajo con args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continúa un flujo de trabajo detenido después de la aprobación.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionales

- `cwd`: Directorio de trabajo relativo para el pipeline (debe permanecer dentro del directorio de trabajo del gateway).
- `timeoutMs`: Aborta el flujo de trabajo si supera esta duración (predeterminado: 20000).
- `maxStdoutBytes`: Aborta el flujo de trabajo si la salida supera este tamaño (predeterminado: 512000).
- `argsJson`: Cadena JSON pasada a `lobster run --args-json` (solo archivos de flujo de trabajo).

## Sobre de salida

Lobster devuelve un sobre JSON con uno de tres estados:

- `ok` → finalizó correctamente
- `needs_approval` → pausado; `requiresApproval.resumeToken` es necesario para reanudar
- `cancelled` → denegado o cancelado explícitamente

La herramienta expone el sobre tanto en `content` (JSON formateado) como en `details` (objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, inspecciona el prompt y decide:

- `approve: true` → reanudar y continuar con los efectos secundarios
- `approve: false` → cancelar y finalizar el flujo de trabajo

Usa `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a las solicitudes de aprobación sin pegamento personalizado con jq/heredoc. Los tokens de reanudación ahora son compactos: Lobster almacena el estado de reanudación del flujo de trabajo en su directorio de estado y devuelve una pequeña clave de token.

## OpenProse

OpenProse combina bien con Lobster: usa `/prose` para orquestar la preparación multiagente y luego ejecuta un pipeline de Lobster para aprobaciones deterministas. Si un programa de Prose necesita Lobster, permite la herramienta `lobster` para subagentes mediante `tools.subagents.tools`. Consulta [OpenProse](/es/prose).

## Seguridad

- **Solo local dentro del proceso**: los flujos de trabajo se ejecutan dentro del proceso del gateway; no hay llamadas de red desde el propio plugin.
- **Sin secretos**: Lobster no gestiona OAuth; llama a las herramientas de OpenClaw que sí lo hacen.
- **Consciente del sandbox**: se deshabilita cuando el contexto de la herramienta está en sandbox.
- **Endurecido**: el runner integrado aplica tiempos de espera y límites de salida.

## Solución de problemas

- **`lobster timed out`** → aumenta `timeoutMs` o divide un pipeline largo.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o reduce el tamaño de la salida.
- **`lobster returned invalid JSON`** → asegúrate de que el pipeline se ejecute en modo herramienta e imprima solo JSON.
- **`lobster failed`** → revisa los registros del gateway para ver los detalles del error del runner integrado.

## Más información

- [Plugins](/es/tools/plugin)
- [Autoría de herramientas de plugin](/es/plugins/building-plugins#registering-agent-tools)

## Caso de estudio: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de “segundo cerebro” + pipelines de Lobster que gestionan tres bóvedas Markdown (personal, pareja, compartida). La CLI emite JSON para estadísticas, listados de bandeja de entrada y escaneos de contenido obsoleto; Lobster encadena esos comandos en flujos de trabajo como `weekly-review`, `inbox-triage`, `memory-consolidation` y `shared-task-sync`, cada uno con compuertas de aprobación. La IA se encarga del juicio (categorización) cuando está disponible y recurre a reglas deterministas cuando no.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automatización y tareas](/es/automation) — programación de flujos de trabajo de Lobster
- [Resumen de automatización](/es/automation) — todos los mecanismos de automatización
- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
