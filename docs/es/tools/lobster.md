---
read_when:
    - Quieres flujos de trabajo deterministas de varios pasos con aprobaciones explícitas
    - Necesitas reanudar un flujo de trabajo sin volver a ejecutar los pasos anteriores
summary: Entorno de ejecución de flujos de trabajo tipados para OpenClaw con puertas de aprobación reanudables.
title: Langosta
x-i18n:
    generated_at: "2026-05-07T13:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster es un shell de flujo de trabajo que permite que OpenClaw ejecute secuencias de herramientas de varios pasos como una sola operación determinista con puntos de control de aprobación explícitos.

Lobster es una capa de autoría por encima del trabajo en segundo plano desacoplado. Para la orquestación de flujos por encima de tareas individuales, consulta [Task Flow](/es/automation/taskflow) (`openclaw tasks flow`). Para el registro de actividad de tareas, consulta [`openclaw tasks`](/es/automation/tasks).

## Hook

Tu asistente puede crear las herramientas que se administran a sí mismas. Pide un flujo de trabajo y 30 minutos después tienes una CLI más pipelines que se ejecutan como una sola llamada. Lobster es la pieza que faltaba: pipelines deterministas, aprobaciones explícitas y estado reanudable.

## Por qué

Hoy, los flujos de trabajo complejos requieren muchas llamadas de herramientas de ida y vuelta. Cada llamada cuesta tokens, y el LLM tiene que orquestar cada paso. Lobster traslada esa orquestación a un runtime tipado:

- **Una llamada en lugar de muchas**: OpenClaw ejecuta una llamada de herramienta de Lobster y obtiene un resultado estructurado.
- **Aprobaciones integradas**: Los efectos secundarios (enviar correo electrónico, publicar comentario) detienen el flujo de trabajo hasta que se aprueben explícitamente.
- **Reanudable**: Los flujos de trabajo detenidos devuelven un token; aprueba y reanuda sin volver a ejecutar todo.

## ¿Por qué un DSL en lugar de programas normales?

Lobster es intencionalmente pequeño. El objetivo no es "un nuevo lenguaje", sino una especificación de pipeline predecible y apta para IA con aprobaciones de primera clase y tokens de reanudación.

- **Aprobar/reanudar está integrado**: Un programa normal puede pedir confirmación a una persona, pero no puede _pausar y reanudar_ con un token durable sin que inventes tú mismo ese runtime.
- **Determinismo + auditabilidad**: Los pipelines son datos, así que son fáciles de registrar, comparar, reproducir y revisar.
- **Superficie restringida para la IA**: Una gramática pequeña + canalización JSON reduce las rutas de código "creativas" y hace que la validación sea realista.
- **Política de seguridad integrada**: Los tiempos de espera, límites de salida, comprobaciones de sandbox y listas de permitidos se aplican desde el runtime, no desde cada script.
- **Sigue siendo programable**: Cada paso puede llamar a cualquier CLI o script. Si quieres JS/TS, genera archivos `.lobster` desde código.

## Cómo funciona

OpenClaw ejecuta flujos de trabajo de Lobster **en proceso** con un runner integrado. No se crea ningún subproceso de CLI externo; el motor de flujo de trabajo se ejecuta dentro del proceso del gateway y devuelve directamente un sobre JSON.
Si el pipeline se pausa para aprobación, la herramienta devuelve un `resumeToken` para que puedas continuar más tarde.

## Patrón: CLI pequeña + pipes JSON + aprobaciones

Crea comandos pequeños que hablen JSON y luego encadénalos en una sola llamada de Lobster. (Los nombres de comandos de ejemplo aparecen abajo; sustitúyelos por los tuyos.)

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

Ejemplo: asignar elementos de entrada a llamadas de herramientas:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos LLM solo JSON (llm-task)

Para flujos de trabajo que necesitan un **paso LLM estructurado**, habilita la herramienta opcional del Plugin
`llm-task` y llámala desde Lobster. Esto mantiene el flujo de trabajo
determinista mientras te permite clasificar/resumir/redactar con un modelo.

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

### Limitación importante: Lobster integrado frente a `openclaw.invoke`

El Plugin de Lobster incluido ejecuta flujos de trabajo **en proceso** dentro del gateway. En ese modo integrado, `openclaw.invoke` **no** hereda automáticamente un contexto de URL/autenticación del gateway para llamadas anidadas de herramientas de la CLI de OpenClaw.

Eso significa que este patrón **actualmente no es fiable en el runner integrado**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Usa el ejemplo siguiente solo cuando ejecutes la **CLI independiente de Lobster** en un entorno donde `openclaw.invoke` ya esté configurado con el contexto correcto de gateway/autenticación.

Úsalo en un pipeline independiente de la CLI de Lobster:

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

Si hoy usas el Plugin integrado de Lobster, prefiere una de estas opciones:

- una llamada directa a la herramienta `llm-task` fuera de Lobster, o
- pasos que no sean `openclaw.invoke` dentro del pipeline de Lobster hasta que se añada un puente integrado compatible.

Consulta [LLM Task](/es/tools/llm-task) para obtener detalles y opciones de configuración.

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

Los flujos de trabajo incluidos de Lobster se ejecutan en proceso; no se requiere ningún binario `lobster` separado. El runner integrado se incluye con el Plugin de Lobster.

Si necesitas la CLI independiente de Lobster para desarrollo o pipelines externos, instálala desde el [repositorio de Lobster](https://github.com/openclaw/lobster) y asegúrate de que `lobster` esté en `PATH`.

## Habilitar la herramienta

Lobster es una herramienta de Plugin **opcional** (no está habilitada de forma predeterminada).

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

Evita usar `tools.allow: ["lobster"]` a menos que tengas intención de ejecutarlo en modo restrictivo de lista de permitidos.

<Note>
Las listas de permitidos son optativas para Plugins opcionales. `alsoAllow` habilita solo las herramientas de Plugin opcionales nombradas mientras conserva el conjunto normal de herramientas principales. Para restringir herramientas principales, usa `tools.allow` con las herramientas o grupos principales que quieras.
</Note>

## Ejemplo: triaje de correo electrónico

Sin Lobster:

```
Usuario: "Revisa mi correo electrónico y redacta respuestas"
→ openclaw llama a gmail.list
→ LLM resume
→ Usuario: "redacta respuestas para #2 y #5"
→ LLM redacta
→ Usuario: "envía #2"
→ openclaw llama a gmail.send
(se repite a diario, sin memoria de lo que se trió)
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

- `cwd`: Directorio de trabajo relativo para el pipeline (debe permanecer dentro del directorio de trabajo del gateway).
- `timeoutMs`: Aborta el flujo de trabajo si supera esta duración (predeterminado: 20000).
- `maxStdoutBytes`: Aborta el flujo de trabajo si la salida supera este tamaño (predeterminado: 512000).
- `argsJson`: Cadena JSON pasada a `lobster run --args-json` (solo archivos de flujo de trabajo).

## Sobre de salida

Lobster devuelve un sobre JSON con uno de tres estados:

- `ok` → finalizado correctamente
- `needs_approval` → pausado; `requiresApproval.resumeToken` es necesario para reanudar
- `cancelled` → denegado o cancelado explícitamente

La herramienta expone el sobre tanto en `content` (JSON legible) como en `details` (objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, inspecciona el mensaje y decide:

- `approve: true` → reanudar y continuar con los efectos secundarios
- `approve: false` → cancelar y finalizar el flujo de trabajo

Usa `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a las solicitudes de aprobación sin pegamento personalizado de jq/heredoc. Los tokens de reanudación ahora son compactos: Lobster almacena el estado de reanudación del flujo de trabajo en su directorio de estado y devuelve una pequeña clave de token.

## OpenProse

OpenProse encaja bien con Lobster: usa `/prose` para orquestar preparación multiagente y luego ejecuta un pipeline de Lobster para aprobaciones deterministas. Si un programa Prose necesita Lobster, permite la herramienta `lobster` para subagentes mediante `tools.subagents.tools`. Consulta [OpenProse](/es/prose).

## Seguridad

- **Solo local en proceso** - los flujos de trabajo se ejecutan dentro del proceso del gateway; no hay llamadas de red desde el Plugin en sí.
- **Sin secretos** - Lobster no administra OAuth; llama a herramientas de OpenClaw que lo hacen.
- **Consciente del sandbox** - deshabilitado cuando el contexto de herramienta está en sandbox.
- **Endurecido** - los tiempos de espera y límites de salida los aplica el runner integrado.

## Solución de problemas

- **`lobster timed out`** → aumenta `timeoutMs` o divide un pipeline largo.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o reduce el tamaño de la salida.
- **`lobster returned invalid JSON`** → asegúrate de que el pipeline se ejecute en modo herramienta e imprima solo JSON.
- **`lobster failed`** → revisa los registros del gateway para ver los detalles del error del runner integrado.

## Más información

- [Plugins](/es/tools/plugin)
- [Autoría de herramientas de Plugin](/es/plugins/building-plugins#registering-agent-tools)

## Caso práctico: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de "segundo cerebro" + pipelines de Lobster que administran tres bóvedas Markdown (personal, pareja, compartida). La CLI emite JSON para estadísticas, listados de bandeja de entrada y análisis de elementos obsoletos; Lobster encadena esos comandos en flujos de trabajo como `weekly-review`, `inbox-triage`, `memory-consolidation` y `shared-task-sync`, cada uno con puertas de aprobación. La IA se encarga del juicio (categorización) cuando está disponible y recurre a reglas deterministas cuando no.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositorio: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automation & Tasks](/es/automation) - programar flujos de trabajo de Lobster
- [Resumen de Automation](/es/automation) - todos los mecanismos de automatización
- [Resumen de Tools](/es/tools) - todas las herramientas de agente disponibles
