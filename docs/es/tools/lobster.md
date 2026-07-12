---
read_when:
    - Quieres flujos de trabajo deterministas de varios pasos con aprobaciones explícitas
    - Necesitas reanudar un flujo de trabajo sin volver a ejecutar los pasos anteriores
summary: Entorno de ejecución de flujos de trabajo tipados para OpenClaw con puertas de aprobación reanudables.
title: Langosta
x-i18n:
    generated_at: "2026-07-11T23:35:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster ejecuta canalizaciones de herramientas de varios pasos como una única llamada determinista a una herramienta, con
puntos de control de aprobación explícitos y tokens de reanudación. Se sitúa una capa por encima
del trabajo desacoplado en segundo plano: para orquestar flujos entre muchas tareas desacopladas,
consulta [Task Flow](/es/automation/taskflow) (`openclaw tasks flow`); para el registro de
actividad de las tareas, consulta [Tareas en segundo plano](/es/automation/tasks).

## Por qué

Sin Lobster, un trabajo de varios pasos implica muchas llamadas de ida y vuelta a herramientas, con el
modelo orquestando cada paso. Lobster traslada esa orquestación a un entorno de ejecución
tipado:

- **Una llamada en lugar de muchas**: una única llamada a la herramienta Lobster devuelve un resultado
  estructurado para toda la canalización.
- **Aprobaciones integradas**: los efectos secundarios (enviar, publicar, eliminar) detienen el flujo de trabajo
  hasta que se aprueban explícitamente.
- **Reanudable**: un flujo de trabajo detenido devuelve un token; apruébalo y reanúdalo sin
  volver a ejecutar los pasos anteriores.

Lobster es un DSL pequeño y restringido, no un lenguaje de scripting de propósito general:
aprobar/reanudar es una primitiva duradera e integrada; las canalizaciones son datos (fáciles de
registrar, comparar, reproducir y revisar); la gramática reducida limita las rutas de código «creativas» para que
la validación siga siendo realista; los tiempos de espera, los límites de salida, las comprobaciones del entorno aislado y
las listas de permitidos los impone el entorno de ejecución, no cada script. Cada paso aún puede
llamar a cualquier CLI o script; genera archivos `.lobster` desde otras herramientas si
quieres un lenguaje de autoría más completo.

Sin Lobster, una clasificación recurrente del correo electrónico se ve así:

```text
Usuario: "Revisa mi correo electrónico y redacta respuestas"
→ openclaw llama a gmail.list
→ El LLM resume
→ Usuario: "redacta respuestas para #2 y #5"
→ El LLM redacta
→ Usuario: "envía #2"
→ openclaw llama a gmail.send
(se repite a diario, sin memoria de lo que se clasificó)
```

Con Lobster, el mismo trabajo es una llamada que se detiene para solicitar aprobación y luego se reanuda:

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

OpenClaw ejecuta los flujos de trabajo de Lobster **dentro del proceso** mediante el paquete incluido
`@clawdbot/lobster` como ejecutor integrado. No se inicia ningún subproceso externo
`lobster`; la llamada a la herramienta devuelve directamente un contenedor JSON. Si la
canalización se detiene para solicitar aprobación, el contenedor incluye un token de reanudación (o un
identificador corto de aprobación) para que puedas continuar más adelante.

## Activación

Lobster es una herramienta de plugin **opcional**, desactivada de forma predeterminada. Se distribuye
incluida, por lo que no requiere un paso de instalación separado; solo tienes que permitir la herramienta:

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
`alsoAllow` añade `lobster` al perfil de herramientas activo sin
restringir otras herramientas principales. Usa `tools.allow` solo si quieres un modo restrictivo
de lista de permitidos.
</Note>

La herramienta está totalmente desactivada en contextos de herramientas aislados.

Si necesitas la CLI independiente de Lobster para desarrollo o canalizaciones externas
(fuera del ejecutor integrado del Gateway), instálala desde el
[repositorio de Lobster](https://github.com/openclaw/lobster) y añade `lobster` a
`PATH`.

## Patrón: CLI pequeña + canalizaciones JSON + aprobaciones

Crea comandos pequeños que se comuniquen mediante JSON y después encadénalos en una sola llamada a Lobster.
(Los nombres de comandos siguientes son ejemplos; sustitúyelos por los tuyos).

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

Si la canalización solicita aprobación, reanúdala con el token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Ejemplo: asignar elementos de entrada a llamadas a herramientas:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos de LLM solo con JSON (llm-task)

Para incluir un **paso estructurado de LLM** dentro de un flujo de trabajo, activa la herramienta de plugin opcional
`llm-task` y llámala desde Lobster:

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

El plugin de Lobster incluido ejecuta los flujos de trabajo **dentro del proceso** en el Gateway.
En ese modo integrado, `openclaw.invoke` **no** hereda automáticamente una
URL del Gateway ni un contexto de autenticación para las llamadas anidadas a herramientas de la CLI de OpenClaw.

Eso significa que este patrón **no es fiable actualmente en el ejecutor integrado**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Usa el ejemplo siguiente solo cuando ejecutes la **CLI independiente de Lobster** en un
entorno donde `openclaw.invoke` ya esté configurado con el contexto correcto
del Gateway y de autenticación.

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

Si actualmente usas el plugin de Lobster integrado, prefiere:

- una llamada directa a la herramienta `llm-task` fuera de Lobster, o
- pasos que no usen `openclaw.invoke` dentro de la canalización de Lobster hasta que se añada un
  puente integrado compatible.

Consulta [Tarea de LLM](/es/tools/llm-task) para obtener más información y conocer las opciones de configuración.

## Archivos de flujo de trabajo (.lobster)

Lobster puede ejecutar archivos de flujo de trabajo YAML/JSON con los campos `name`, `args`, `steps`, `env`,
`condition` y `approval`. Establece `pipeline` en la ruta del archivo en la llamada a la
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
- `condition` (o `when`) puede condicionar los pasos según `$step.approved`.

## Parámetros de la herramienta

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

| Campo            | Valor predeterminado | Notas                                                                                                        |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | obligatorio          | Cadena de canalización en línea o una ruta que termine en `.lobster`/`.yaml`/`.yml`/`.json` para un archivo de flujo de trabajo. |
| `cwd`            | cwd del Gateway      | Directorio de trabajo relativo; debe resolverse dentro del directorio de trabajo del Gateway (se rechazan las rutas absolutas). |
| `timeoutMs`      | `20000`              | Cancela la ejecución si se supera.                                                                           |
| `maxStdoutBytes` | `512000`             | Cancela la ejecución si stdout o stderr capturados superan este tamaño.                                      |
| `argsJson`       | -                    | Cadena JSON de argumentos para un archivo de flujo de trabajo (se ignora en canalizaciones en línea).       |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` acepta `token` (el token de reanudación completo de `requiresApproval`)
o `approvalId` (el identificador corto del mismo objeto); usa el que haya devuelto la ejecución
detenida. `approve` es obligatorio.

### Modo administrado de Task Flow

Pasar `flowControllerId` y `flowGoal` en `run` (o `flowId` y
`flowExpectedRevision` en `resume`) dirige la llamada a través de la API administrada de
[Task Flow](/es/automation/taskflow) del entorno de ejecución del plugin, en lugar de devolver
un contenedor simple: OpenClaw crea o reanuda un registro de flujo duradero, le aplica el
contenedor de Lobster (`waiting` durante la aprobación, `succeeded`/`failed` al
completarse) y devuelve `{ ok, envelope, flow, mutation }`. Este modo requiere
un entorno de ejecución de Task Flow vinculado y está pensado para código de plugins/controladores que necesita
un estado de flujo duradero entre reinicios del Gateway, no para el uso ocasional habitual de agentes.

## Contenedor de salida

Lobster devuelve un contenedor JSON con uno de tres estados:

- `ok`: finalizó correctamente
- `needs_approval`: está en pausa; `requiresApproval` incluye un `resumeToken` y un
  `approvalId` corto, cualquiera de los cuales puede reanudar la ejecución
- `cancelled`: se denegó o canceló explícitamente

La herramienta expone el contenedor tanto en `content` (JSON con formato legible) como en `details`
(objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, revisa la solicitud y decide:

- `approve: true`: reanudar y continuar con los efectos secundarios
- `approve: false`: cancelar y finalizar el flujo de trabajo

Usa `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a las
solicitudes de aprobación sin código de enlace personalizado con jq/heredoc. El estado de reanudación se almacena como
pequeños archivos JSON en el directorio de estado de Lobster (`~/.lobster/state` de forma
predeterminada; se puede cambiar con `LOBSTER_STATE_DIR`); el token solo codifica un
puntero a ese estado, no el estado completo de la canalización.

## OpenProse

OpenProse se complementa bien con Lobster: usa `/prose` para orquestar la preparación con varios agentes
y después ejecuta una canalización de Lobster para obtener aprobaciones deterministas. Si un programa de Prose
necesita Lobster, permite la herramienta `lobster` para los subagentes mediante
`tools.subagents.tools`. Consulta [OpenProse](/es/prose).

## Seguridad

- **Solo local y dentro del proceso**: los flujos de trabajo se ejecutan dentro del proceso del Gateway; el
  propio plugin no realiza llamadas de red.
- **Sin secretos**: Lobster no gestiona OAuth; llama a las herramientas de OpenClaw que
  sí lo hacen.
- **Compatible con el entorno aislado**: se desactiva cuando el contexto de la herramienta está aislado.
- **Reforzado**: el ejecutor integrado aplica tiempos de espera y límites de salida.

## Solución de problemas

| Error                                                         | Causa/solución                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | La canalización superó `timeoutMs`. Auméntalo o divide la canalización.          |
| `lobster stdout exceeded maxStdoutBytes` (o `stderr`)        | La salida capturada superó el límite. Aumenta `maxStdoutBytes` o reduce la salida. |
| `run --args-json must be valid JSON`                          | No se pudo analizar `argsJson` (en ejecuciones de archivos de flujo de trabajo). Corrige la cadena JSON. |
| `lobster runtime failed` (u otro mensaje `runtime_error`)    | El entorno de ejecución integrado devolvió un contenedor de error. Consulta los registros del Gateway para obtener más información. |

## Más información

- [Plugins](/es/tools/plugin)
- [Creación de herramientas de plugins](/es/plugins/building-plugins#registering-agent-tools)

## Caso práctico: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de «segundo cerebro» junto con canalizaciones de Lobster que gestionan tres
bóvedas de Markdown (personal, de la pareja y compartida). La CLI genera JSON con estadísticas,
listados de la bandeja de entrada y análisis de elementos obsoletos; Lobster encadena esos comandos en flujos de trabajo
como `weekly-review`, `inbox-triage`, `memory-consolidation` y
`shared-task-sync`, cada uno con puntos de aprobación. La IA se encarga de las decisiones
(categorización) cuando está disponible y recurre a reglas deterministas cuando
no lo está.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositorio: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Contenido relacionado

- [Automatización](/es/automation) - todos los mecanismos de automatización
- [Descripción general de las herramientas](/es/tools) - todas las herramientas de agente disponibles
