---
read_when:
    - Quieres flujos de trabajo deterministas de varios pasos con aprobaciones explícitas
    - Necesitas reanudar un flujo de trabajo sin volver a ejecutar los pasos anteriores
summary: Runtime de flujos de trabajo tipado para OpenClaw con puertas de aprobación reanudables.
title: Langosta
x-i18n:
    generated_at: "2026-05-12T00:59:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster es un shell de flujo de trabajo que permite a OpenClaw ejecutar secuencias de herramientas de varios pasos como una única operación determinista con puntos de control de aprobación explícitos.

Lobster es una capa de autoría por encima del trabajo en segundo plano desacoplado. Para la orquestación de flujos por encima de tareas individuales, consulta [Task Flow](/es/automation/taskflow) (`openclaw tasks flow`). Para el registro de actividad de tareas, consulta [`openclaw tasks`](/es/automation/tasks).

## Hook

Tu asistente puede crear las herramientas que se gestionan a sí mismas. Pide un flujo de trabajo y, 30 minutos después, tendrás una CLI más pipelines que se ejecutan como una sola llamada. Lobster es la pieza que faltaba: pipelines deterministas, aprobaciones explícitas y estado reanudable.

## Por qué

Hoy, los flujos de trabajo complejos requieren muchas llamadas de herramienta de ida y vuelta. Cada llamada consume tokens, y el LLM tiene que orquestar cada paso. Lobster traslada esa orquestación a un runtime tipado:

- **Una llamada en lugar de muchas**: OpenClaw ejecuta una llamada de herramienta Lobster y obtiene un resultado estructurado.
- **Aprobaciones integradas**: Los efectos secundarios (enviar un correo electrónico, publicar un comentario) detienen el flujo de trabajo hasta que se aprueban explícitamente.
- **Reanudable**: Los flujos de trabajo detenidos devuelven un token; aprueba y reanuda sin volver a ejecutar todo.

## ¿Por qué un DSL en lugar de programas normales?

Lobster es intencionadamente pequeño. El objetivo no es "un lenguaje nuevo", sino una especificación de pipeline predecible y apta para IA, con aprobaciones y tokens de reanudación de primera clase.

- **Aprobar/reanudar está integrado**: Un programa normal puede pedir confirmación a una persona, pero no puede _pausarse y reanudarse_ con un token duradero sin que inventes ese runtime tú mismo.
- **Determinismo + auditabilidad**: Los pipelines son datos, por lo que son fáciles de registrar, comparar, reproducir y revisar.
- **Superficie acotada para IA**: Una gramática diminuta + tuberías JSON reducen las rutas de código "creativas" y hacen realista la validación.
- **Política de seguridad incorporada**: Los tiempos de espera, límites de salida, comprobaciones de sandbox y listas de permitidos los aplica el runtime, no cada script.
- **Sigue siendo programable**: Cada paso puede llamar a cualquier CLI o script. Si quieres JS/TS, genera archivos `.lobster` desde código.

## Cómo funciona

OpenClaw ejecuta flujos de trabajo Lobster **en el proceso** mediante un ejecutor embebido. No se genera ningún subproceso de CLI externo; el motor de flujo de trabajo se ejecuta dentro del proceso del Gateway y devuelve directamente un sobre JSON.
Si el pipeline se pausa para aprobación, la herramienta devuelve un `resumeToken` para que puedas continuar más tarde.

## Patrón: CLI pequeña + tuberías JSON + aprobaciones

Crea comandos diminutos que hablen JSON y luego encadénalos en una única llamada Lobster. (Los nombres de comando siguientes son ejemplos: sustitúyelos por los tuyos.)

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

La IA activa el flujo de trabajo; Lobster ejecuta los pasos. Las puertas de aprobación mantienen los efectos secundarios explícitos y auditables.

Ejemplo: asignar elementos de entrada a llamadas de herramienta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos LLM solo JSON (llm-task)

Para flujos de trabajo que necesitan un **paso LLM estructurado**, habilita la herramienta Plugin opcional
`llm-task` y llámala desde Lobster. Esto mantiene el flujo de trabajo
determinista y, aun así, te permite clasificar/resumir/redactar con un modelo.

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

### Limitación importante: Lobster embebido frente a `openclaw.invoke`

El Plugin Lobster incluido ejecuta flujos de trabajo **en el proceso** dentro del Gateway. En ese modo embebido, `openclaw.invoke` **no** hereda automáticamente una URL de Gateway ni un contexto de autenticación para llamadas de herramienta CLI de OpenClaw anidadas.

Eso significa que este patrón **no es fiable actualmente en el ejecutor embebido**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Usa el ejemplo siguiente solo al ejecutar la **CLI Lobster independiente** en un entorno donde `openclaw.invoke` ya esté configurado con el contexto correcto de Gateway/autenticación.

Úsalo en un pipeline de CLI Lobster independiente:

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

Si hoy estás usando el Plugin Lobster embebido, prefiere una de estas opciones:

- una llamada directa a la herramienta `llm-task` fuera de Lobster, o
- pasos que no usen `openclaw.invoke` dentro del pipeline Lobster hasta que se añada un puente embebido compatible.

Consulta [LLM Task](/es/tools/llm-task) para obtener detalles y opciones de configuración.

## Archivos de flujo de trabajo (.lobster)

Lobster puede ejecutar archivos de flujo de trabajo YAML/JSON con campos `name`, `args`, `steps`, `env`, `condition` y `approval`. En llamadas de herramienta de OpenClaw, establece `pipeline` en la ruta del archivo.

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

Los flujos de trabajo Lobster incluidos se ejecutan en el proceso; no se requiere un binario `lobster` independiente. El ejecutor embebido se incluye con el Plugin Lobster.

Si necesitas la CLI Lobster independiente para desarrollo o pipelines externos, instálala desde el [repo de Lobster](https://github.com/openclaw/lobster) y asegúrate de que `lobster` esté en `PATH`.

## Habilitar la herramienta

Lobster es una herramienta Plugin **opcional** (no habilitada de forma predeterminada).

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
Las listas de permitidos son opcionales para plugins opcionales. `alsoAllow` habilita solo las herramientas Plugin opcionales nombradas y preserva el conjunto normal de herramientas principales. Para restringir las herramientas principales, usa `tools.allow` con las herramientas o grupos principales que quieras.
</Note>

## Ejemplo: Triaje de correo electrónico

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

- `cwd`: Directorio de trabajo relativo para el pipeline (debe permanecer dentro del directorio de trabajo del Gateway).
- `timeoutMs`: Aborta el flujo de trabajo si supera esta duración (valor predeterminado: 20000).
- `maxStdoutBytes`: Aborta el flujo de trabajo si la salida supera este tamaño (valor predeterminado: 512000).
- `argsJson`: Cadena JSON pasada a `lobster run --args-json` (solo archivos de flujo de trabajo).

## Sobre de salida

Lobster devuelve un sobre JSON con uno de tres estados:

- `ok` → finalizado correctamente
- `needs_approval` → pausado; `requiresApproval.resumeToken` es necesario para reanudar
- `cancelled` → denegado o cancelado explícitamente

La herramienta expone el sobre tanto en `content` (JSON con formato) como en `details` (objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, inspecciona el prompt y decide:

- `approve: true` → reanudar y continuar con los efectos secundarios
- `approve: false` → cancelar y finalizar el flujo de trabajo

Usa `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a las solicitudes de aprobación sin pegamento personalizado con jq/heredoc. Los tokens de reanudación ahora son compactos: Lobster almacena el estado de reanudación del flujo de trabajo en su directorio de estado y devuelve una pequeña clave de token.

## OpenProse

OpenProse combina bien con Lobster: usa `/prose` para orquestar la preparación multiagente y luego ejecuta un pipeline Lobster para aprobaciones deterministas. Si un programa Prose necesita Lobster, permite la herramienta `lobster` para subagentes mediante `tools.subagents.tools`. Consulta [OpenProse](/es/prose).

## Seguridad

- **Solo local en el proceso** - los flujos de trabajo se ejecutan dentro del proceso del Gateway; el Plugin en sí no realiza llamadas de red.
- **Sin secretos** - Lobster no gestiona OAuth; llama a herramientas de OpenClaw que sí lo hacen.
- **Consciente del sandbox** - deshabilitado cuando el contexto de herramienta está en sandbox.
- **Endurecido** - tiempos de espera y límites de salida aplicados por el ejecutor embebido.

## Solución de problemas

- **`lobster timed out`** → aumenta `timeoutMs` o divide un pipeline largo.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o reduce el tamaño de la salida.
- **`lobster returned invalid JSON`** → asegúrate de que el pipeline se ejecute en modo herramienta e imprima solo JSON.
- **`lobster failed`** → revisa los registros del Gateway para ver los detalles del error del ejecutor embebido.

## Más información

- [Plugins](/es/tools/plugin)
- [Autoría de herramientas Plugin](/es/plugins/building-plugins#registering-agent-tools)

## Caso práctico: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de "segundo cerebro" + pipelines Lobster que gestionan tres bóvedas Markdown (personal, pareja, compartida). La CLI emite JSON para estadísticas, listados de bandeja de entrada y escaneos de contenido obsoleto; Lobster encadena esos comandos en flujos de trabajo como `weekly-review`, `inbox-triage`, `memory-consolidation` y `shared-task-sync`, cada uno con puertas de aprobación. La IA se encarga del juicio (categorización) cuando está disponible y recurre a reglas deterministas cuando no.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automatización](/es/automation) - programación de flujos de trabajo Lobster
- [Resumen de automatización](/es/automation) - todos los mecanismos de automatización
- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
