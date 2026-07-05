---
read_when:
    - Quieres flujos de trabajo de varios pasos deterministas con aprobaciones explícitas
    - Necesitas reanudar un flujo de trabajo sin volver a ejecutar los pasos anteriores
summary: Runtime de flujo de trabajo tipado para OpenClaw con puertas de aprobación reanudables.
title: Langosta
x-i18n:
    generated_at: "2026-07-05T11:47:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster ejecuta canalizaciones de herramientas de varios pasos como una única llamada de herramienta determinista, con
puntos de control de aprobación explícitos y tokens de reanudación. Se ubica una capa por encima del
trabajo en segundo plano desvinculado: para orquestar flujos entre muchas tareas desvinculadas,
consulta [Task Flow](/es/automation/taskflow) (`openclaw tasks flow`); para el registro de
actividad de tareas, consulta [Tareas en segundo plano](/es/automation/tasks).

## Por qué

Sin Lobster, un trabajo de varios pasos implica muchas llamadas de herramienta de ida y vuelta, con el
modelo orquestando cada paso. Lobster mueve esa orquestación a un runtime tipado:

- **Una llamada en lugar de muchas**: una sola llamada de herramienta de Lobster devuelve un resultado
  estructurado para toda la canalización.
- **Aprobaciones integradas**: los efectos secundarios (enviar, publicar, eliminar) detienen el flujo de trabajo
  hasta que se aprueben explícitamente.
- **Reanudable**: un flujo de trabajo detenido devuelve un token; aprueba y reanuda sin
  volver a ejecutar pasos anteriores.

Lobster es un DSL pequeño y restringido en lugar de un lenguaje de scripting general:
aprobar/reanudar es una primitiva duradera e integrada; las canalizaciones son datos (fáciles de
registrar, comparar, reproducir, revisar); la gramática mínima limita las rutas de código "creativas" para que
la validación siga siendo realista; los tiempos de espera, los límites de salida, las comprobaciones de sandbox y las
listas de permitidos las aplica el runtime, no cada script. Cada paso todavía puede
llamar a cualquier CLI o script: genera archivos `.lobster` desde otras herramientas si
quieres un lenguaje de autoría más completo.

Sin Lobster, una clasificación recurrente de correo electrónico se ve así:

```text
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Con Lobster, el mismo trabajo es una llamada que se detiene para aprobación y se reanuda:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

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

## Cómo funciona

OpenClaw ejecuta flujos de trabajo de Lobster **en proceso** mediante el paquete
`@clawdbot/lobster` incluido como runner integrado. No se genera ningún subproceso
`lobster` externo; la llamada de herramienta devuelve directamente un sobre JSON. Si la
canalización se detiene para aprobación, el sobre lleva un token de reanudación (o un ID de
aprobación corto) para que puedas continuar más tarde.

## Habilitar

Lobster es una herramienta de Plugin **opcional**, no habilitada de forma predeterminada. Se distribuye
incluida, así que no se requiere ningún paso de instalación separado: solo permite la herramienta:

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

<Note>
`alsoAllow` agrega `lobster` encima del perfil de herramientas activo sin
restringir otras herramientas centrales. Usa `tools.allow` solo si quieres un modo de
lista de permitidos restrictivo en su lugar.
</Note>

La herramienta está completamente deshabilitada para contextos de herramienta en sandbox.

Si necesitas la CLI independiente de Lobster para desarrollo o canalizaciones externas
(fuera del runner de Gateway integrado), instálala desde el
[repositorio de Lobster](https://github.com/openclaw/lobster) y coloca `lobster` en
`PATH`.

## Patrón: CLI pequeña + tuberías JSON + aprobaciones

Crea comandos pequeños que hablen JSON y luego encadénalos en una llamada de Lobster.
(Nombres de comandos de ejemplo a continuación: sustitúyelos por los tuyos.)

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

Ejemplo: asignar elementos de entrada a llamadas de herramientas:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos LLM solo JSON (llm-task)

Para un **paso LLM estructurado** dentro de un flujo de trabajo, habilita la herramienta de Plugin
opcional `llm-task` y llámala desde Lobster:

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

### Limitación importante: Lobster integrado frente a `openclaw.invoke`

El Plugin de Lobster incluido ejecuta flujos de trabajo **en proceso** dentro del Gateway.
En ese modo integrado, `openclaw.invoke` **no** hereda automáticamente un
contexto de URL/autenticación de Gateway para llamadas anidadas de herramientas de la CLI de OpenClaw.

Eso significa que este patrón **actualmente no es fiable en el runner integrado**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Usa el ejemplo siguiente solo cuando ejecutes la **CLI independiente de Lobster** en un
entorno donde `openclaw.invoke` ya esté configurado con el contexto correcto de
Gateway/autenticación.

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

Si usas el Plugin de Lobster integrado hoy, prefiere una de estas opciones:

- una llamada directa a la herramienta `llm-task` fuera de Lobster, o
- pasos que no sean `openclaw.invoke` dentro de la canalización de Lobster hasta que se agregue un puente
  integrado compatible.

Consulta [LLM Task](/es/tools/llm-task) para obtener detalles y opciones de configuración.

## Archivos de flujo de trabajo (.lobster)

Lobster puede ejecutar archivos de flujo de trabajo YAML/JSON con campos `name`, `args`, `steps`, `env`,
`condition` y `approval`. Define `pipeline` como la ruta del archivo en la llamada de
herramienta.

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

## Parámetros de herramienta

### `run`

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

| Campo            | Predeterminado | Notas                                                                                                        |
| ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | obligatorio    | Cadena de canalización en línea, o una ruta terminada en `.lobster`/`.yaml`/`.yml`/`.json` para un archivo de flujo de trabajo. |
| `cwd`            | cwd del gateway | Directorio de trabajo relativo; debe resolverse dentro del directorio de trabajo del gateway (se rechazan las rutas absolutas). |
| `timeoutMs`      | `20000`        | Cancela la ejecución si se supera.                                                                          |
| `maxStdoutBytes` | `512000`       | Cancela la ejecución si stdout o stderr capturado supera este tamaño.                                       |
| `argsJson`       | -              | Cadena JSON de argumentos para un archivo de flujo de trabajo (se ignora para canalizaciones en línea).      |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` acepta `token` (el token de reanudación completo de `requiresApproval`)
o `approvalId` (el ID corto del mismo objeto): usa el que haya devuelto la ejecución
detenida. `approve` es obligatorio.

### Modo gestionado de Task Flow

Pasar `flowControllerId` y `flowGoal` en `run` (o `flowId` y
`flowExpectedRevision` en `resume`) dirige la llamada a través de la API gestionada de
[Task Flow](/es/automation/taskflow) del runtime del Plugin en lugar de devolver
un sobre simple: OpenClaw crea o reanuda un registro de flujo duradero, le aplica el
sobre de Lobster (`waiting` en aprobación, `succeeded`/`failed` al
completarse) y devuelve `{ ok, envelope, flow, mutation }`. Este modo requiere
un runtime de Task Flow vinculado y está pensado para código de Plugin/controlador que necesita
estado de flujo duradero entre reinicios del Gateway, no para el uso típico ad hoc de agentes.

## Sobre de salida

Lobster devuelve un sobre JSON con uno de tres estados:

- `ok` - finalizó correctamente
- `needs_approval` - pausado; `requiresApproval` lleva un `resumeToken` y un
  `approvalId` corto, cualquiera de los cuales puede reanudar la ejecución
- `cancelled` - denegado o cancelado explícitamente

La herramienta expone el sobre tanto en `content` (JSON con formato) como en `details`
(objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, inspecciona el prompt y decide:

- `approve: true` - reanudar y continuar con los efectos secundarios
- `approve: false` - cancelar y finalizar el flujo de trabajo

Usa `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a
solicitudes de aprobación sin pegamento jq/heredoc personalizado. El estado de reanudación se almacena como
pequeños archivos JSON bajo el directorio de estado de Lobster (`~/.lobster/state` de forma
predeterminada, sobrescribible con `LOBSTER_STATE_DIR`); el token en sí solo codifica un
puntero a ese estado, no el estado completo de la canalización.

## OpenProse

OpenProse combina bien con Lobster: usa `/prose` para orquestar la preparación multiagente
y luego ejecuta una canalización de Lobster para aprobaciones deterministas. Si un programa de Prose
necesita Lobster, permite la herramienta `lobster` para subagentes mediante
`tools.subagents.tools`. Consulta [OpenProse](/es/prose).

## Seguridad

- **Solo local en proceso**: los flujos de trabajo se ejecutan dentro del proceso del gateway; no hay
  llamadas de red desde el Plugin en sí.
- **Sin secretos**: Lobster no gestiona OAuth; llama a herramientas de OpenClaw que
  sí lo hacen.
- **Consciente del sandbox**: se deshabilita cuando el contexto de herramienta está en sandbox.
- **Endurecido**: tiempos de espera y límites de salida aplicados por el runner integrado.

## Solución de problemas

| Error                                                         | Causa / corrección                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | La canalización superó `timeoutMs`. Auméntalo o divide la canalización.          |
| `lobster stdout exceeded maxStdoutBytes` (o `stderr`)         | La salida capturada superó el límite. Aumenta `maxStdoutBytes` o reduce la salida. |
| `run --args-json must be valid JSON`                          | `argsJson` (ejecuciones de archivo de flujo de trabajo) no se pudo analizar. Corrige la cadena JSON. |
| `lobster runtime failed` (u otro mensaje `runtime_error`)     | El runtime integrado devolvió un sobre de error. Revisa los registros del gateway para más detalles. |

## Más información

- [Plugins](/es/tools/plugin)
- [Creación de herramientas de Plugin](/es/plugins/building-plugins#registering-agent-tools)

## Caso de estudio: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de "segundo cerebro" + canalizaciones de Lobster que gestionan tres
bóvedas de Markdown (personal, de la pareja, compartida). La CLI emite JSON para estadísticas,
listados de bandeja de entrada y escaneos de elementos obsoletos; Lobster encadena esos comandos en flujos de trabajo
como `weekly-review`, `inbox-triage`, `memory-consolidation` y
`shared-task-sync`, cada uno con puntos de aprobación. La IA se encarga del juicio
(categorización) cuando está disponible y recurre a reglas deterministas cuando
no lo está.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositorio: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automatización](/es/automation) - todos los mecanismos de automatización
- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
