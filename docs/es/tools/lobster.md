---
read_when:
    - Quieres flujos de trabajo deterministas de varios pasos con aprobaciones explícitas
    - Debes reanudar un flujo de trabajo sin volver a ejecutar los pasos anteriores
summary: Entorno de ejecución de flujos de trabajo tipados para OpenClaw con puertas de aprobación reanudables.
title: Langosta
x-i18n:
    generated_at: "2026-04-30T06:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster es un shell de flujo de trabajo que permite a OpenClaw ejecutar secuencias de herramientas de varios pasos como una única operación determinista con puntos de aprobación explícitos.

Lobster es una capa de autoría por encima del trabajo en segundo plano desacoplado. Para la orquestación de flujos por encima de tareas individuales, consulta [TaskFlow](/es/automation/taskflow) (`openclaw tasks flow`). Para el registro de actividad de tareas, consulta [`openclaw tasks`](/es/automation/tasks).

## Gancho

Tu asistente puede crear las herramientas que lo gestionan a sí mismo. Pide un flujo de trabajo y, 30 minutos después, tienes una CLI más canalizaciones que se ejecutan como una sola llamada. Lobster es la pieza que falta: canalizaciones deterministas, aprobaciones explícitas y estado reanudable.

## Por qué

Hoy, los flujos de trabajo complejos requieren muchas llamadas de herramienta de ida y vuelta. Cada llamada cuesta tokens y el LLM tiene que orquestar cada paso. Lobster traslada esa orquestación a un runtime tipado:

- **Una llamada en lugar de muchas**: OpenClaw ejecuta una llamada de herramienta de Lobster y obtiene un resultado estructurado.
- **Aprobaciones integradas**: Los efectos secundarios (enviar correo electrónico, publicar comentario) detienen el flujo de trabajo hasta que se aprueban explícitamente.
- **Reanudable**: Los flujos de trabajo detenidos devuelven un token; aprueba y reanuda sin volver a ejecutar todo.

## ¿Por qué un DSL en lugar de programas simples?

Lobster es intencionadamente pequeño. El objetivo no es "un lenguaje nuevo", sino una especificación de canalización predecible y amigable para IA, con aprobaciones de primera clase y tokens de reanudación.

- **Aprobar/reanudar está integrado**: Un programa normal puede pedir confirmación a una persona, pero no puede _pausar y reanudar_ con un token duradero sin que inventes tú mismo ese runtime.
- **Determinismo + auditabilidad**: Las canalizaciones son datos, así que son fáciles de registrar, comparar, reproducir y revisar.
- **Superficie acotada para IA**: Una gramática diminuta + canalización JSON reduce rutas de código “creativas” y hace realista la validación.
- **Política de seguridad integrada**: Los tiempos de espera, límites de salida, comprobaciones de sandbox y listas de permitidos los aplica el runtime, no cada script.
- **Aún programable**: Cada paso puede llamar a cualquier CLI o script. Si quieres JS/TS, genera archivos `.lobster` desde código.

## Cómo funciona

OpenClaw ejecuta flujos de trabajo Lobster **en proceso** usando un ejecutor embebido. No se lanza ningún subproceso de CLI externo; el motor de flujo de trabajo se ejecuta dentro del proceso del Gateway y devuelve directamente un sobre JSON.
Si la canalización se pausa para aprobación, la herramienta devuelve un `resumeToken` para que puedas continuar más tarde.

## Patrón: CLI pequeña + tuberías JSON + aprobaciones

Crea comandos diminutos que hablen JSON y luego encadénalos en una única llamada de Lobster. (Nombres de comandos de ejemplo abajo: sustitúyelos por los tuyos).

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

Si la canalización solicita aprobación, reanuda con el token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

La IA dispara el flujo de trabajo; Lobster ejecuta los pasos. Las puertas de aprobación mantienen los efectos secundarios explícitos y auditables.

Ejemplo: asignar elementos de entrada a llamadas de herramientas:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos de LLM solo JSON (llm-task)

Para flujos de trabajo que necesitan un **paso de LLM estructurado**, habilita la herramienta opcional de Plugin
`llm-task` y llámala desde Lobster. Esto mantiene el flujo de trabajo
determinista y aun así te permite clasificar/resumir/redactar con un modelo.

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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Úsala en una canalización:

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

Consulta [Tarea de LLM](/es/tools/llm-task) para detalles y opciones de configuración.

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

Los flujos de trabajo Lobster incluidos se ejecutan en proceso; no se requiere un binario `lobster` separado. El ejecutor embebido se distribuye con el Plugin de Lobster.

Si necesitas la CLI independiente de Lobster para desarrollo o canalizaciones externas, instálala desde el [repositorio de Lobster](https://github.com/openclaw/lobster) y asegúrate de que `lobster` esté en `PATH`.

## Habilitar la herramienta

Lobster es una herramienta de Plugin **opcional** (no habilitada por defecto).

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

Evita usar `tools.allow: ["lobster"]` salvo que tengas intención de ejecutar en modo restrictivo de lista de permitidos.

<Note>
Las listas de permitidos son de inclusión explícita para plugins opcionales. Si tu lista de permitidos solo nombra herramientas de plugin (como `lobster`), OpenClaw mantiene habilitadas las herramientas principales. Para restringir las herramientas principales, incluye también en la lista de permitidos las herramientas o grupos principales que quieras.
</Note>

## Ejemplo: clasificación de correo electrónico

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

## Parámetros de herramienta

### `run`

Ejecuta una canalización en modo herramienta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Ejecuta un archivo de flujo de trabajo con argumentos:

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

- `cwd`: Directorio de trabajo relativo para la canalización (debe permanecer dentro del directorio de trabajo del Gateway).
- `timeoutMs`: Aborta el flujo de trabajo si supera esta duración (por defecto: 20000).
- `maxStdoutBytes`: Aborta el flujo de trabajo si la salida supera este tamaño (por defecto: 512000).
- `argsJson`: Cadena JSON pasada a `lobster run --args-json` (solo archivos de flujo de trabajo).

## Sobre de salida

Lobster devuelve un sobre JSON con uno de tres estados:

- `ok` → finalizado correctamente
- `needs_approval` → pausado; `requiresApproval.resumeToken` es necesario para reanudar
- `cancelled` → denegado o cancelado explícitamente

La herramienta expone el sobre tanto en `content` (JSON legible) como en `details` (objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, inspecciona el mensaje y decide:

- `approve: true` → reanudar y continuar los efectos secundarios
- `approve: false` → cancelar y finalizar el flujo de trabajo

Usa `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a las solicitudes de aprobación sin pegamento personalizado de jq/heredoc. Los tokens de reanudación ahora son compactos: Lobster almacena el estado de reanudación del flujo de trabajo en su directorio de estado y devuelve una pequeña clave de token.

## OpenProse

OpenProse combina bien con Lobster: usa `/prose` para orquestar preparación multiagente y luego ejecuta una canalización de Lobster para aprobaciones deterministas. Si un programa Prose necesita Lobster, permite la herramienta `lobster` para subagentes mediante `tools.subagents.tools`. Consulta [OpenProse](/es/prose).

## Seguridad

- **Solo local en proceso** — los flujos de trabajo se ejecutan dentro del proceso del Gateway; no hay llamadas de red desde el propio plugin.
- **Sin secretos** — Lobster no gestiona OAuth; llama a herramientas de OpenClaw que sí lo hacen.
- **Consciente del sandbox** — se deshabilita cuando el contexto de la herramienta está en sandbox.
- **Endurecido** — el ejecutor embebido aplica tiempos de espera y límites de salida.

## Solución de problemas

- **`lobster timed out`** → aumenta `timeoutMs` o divide una canalización larga.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o reduce el tamaño de salida.
- **`lobster returned invalid JSON`** → asegúrate de que la canalización se ejecute en modo herramienta e imprima solo JSON.
- **`lobster failed`** → revisa los registros del Gateway para ver los detalles del error del ejecutor embebido.

## Más información

- [Plugins](/es/tools/plugin)
- [Autoría de herramientas de Plugin](/es/plugins/building-plugins#registering-agent-tools)

## Caso práctico: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de “segundo cerebro” + canalizaciones de Lobster que gestionan tres bóvedas Markdown (personal, pareja, compartida). La CLI emite JSON para estadísticas, listados de bandeja de entrada y análisis de elementos obsoletos; Lobster encadena esos comandos en flujos de trabajo como `weekly-review`, `inbox-triage`, `memory-consolidation` y `shared-task-sync`, cada uno con puertas de aprobación. La IA se encarga del juicio (categorización) cuando está disponible y recurre a reglas deterministas cuando no.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositorio: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automatización y tareas](/es/automation) — programar flujos de trabajo de Lobster
- [Descripción general de la automatización](/es/automation) — todos los mecanismos de automatización
- [Descripción general de herramientas](/es/tools) — todas las herramientas de agente disponibles
