---
read_when:
    - Quieres flujos de trabajo deterministas de varios pasos con aprobaciones explícitas
    - Necesita reanudar un flujo de trabajo sin volver a ejecutar los pasos anteriores
summary: Entorno de ejecución de flujos de trabajo tipados para OpenClaw con puertas de aprobación reanudables.
title: Lobster
x-i18n:
    generated_at: "2026-07-19T02:15:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85b7900f86bfedc9d73fcc91c3d0dac37b81f7413b1e68c54dd8a797b70f79fc
    source_path: tools/lobster.md
    workflow: 16
---

Lobster ejecuta pipelines de herramientas de varios pasos como una única llamada de herramienta determinista, con
puntos de control de aprobación explícitos y tokens de reanudación. Se sitúa una capa por encima
del trabajo en segundo plano desacoplado: para orquestar flujos entre muchas tareas desacopladas,
consulte [TaskFlow](/es/automation/taskflow) (`openclaw tasks flow`); para el registro de
actividad de tareas, consulte [Tareas en segundo plano](/es/automation/tasks).

## Por qué

Sin Lobster, un trabajo de varios pasos implica muchas llamadas de herramienta de ida y vuelta, con el
modelo orquestando cada paso. Lobster traslada esa orquestación a un entorno de ejecución
tipado:

- **Una llamada en lugar de muchas**: una sola llamada a la herramienta Lobster devuelve un resultado
  estructurado para todo el pipeline.
- **Aprobaciones integradas**: los efectos secundarios (enviar, publicar, eliminar) detienen el flujo de trabajo
  hasta que se aprueban explícitamente.
- **Reanudable**: un flujo de trabajo detenido devuelve un token; apruébelo y reanúdelo sin
  volver a ejecutar los pasos anteriores.

Lobster es un DSL pequeño y restringido, no un lenguaje de scripting de propósito general:
aprobar/reanudar es una primitiva duradera e integrada; los pipelines son datos (fáciles de
registrar, comparar, reproducir y revisar); la gramática reducida limita las rutas de código "creativas", de modo que
la validación sigue siendo realista; los tiempos de espera, los límites de salida, las comprobaciones del entorno aislado y
las listas de permitidos los aplica el entorno de ejecución, no cada script. Cada paso aún puede
llamar a cualquier CLI o script; genere archivos `.lobster` desde otras herramientas si
desea un lenguaje de creación más completo.

Sin Lobster, una clasificación recurrente de correo electrónico tiene este aspecto:

```text
Usuario: "Revisa mi correo electrónico y redacta respuestas"
→ openclaw llama a gmail.list
→ El LLM resume
→ Usuario: "redacta respuestas para el n.º 2 y el n.º 5"
→ El LLM redacta
→ Usuario: "envía el n.º 2"
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
  "output": [{ "summary": "5 necesitan respuesta, 2 requieren una acción" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "¿Enviar 2 borradores de respuesta?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Cómo funciona

OpenClaw ejecuta los flujos de trabajo de Lobster **dentro del proceso** mediante el paquete
`@clawdbot/lobster` incluido como ejecutor integrado. No se inicia ningún subproceso
`lobster` externo; la llamada de herramienta devuelve directamente un sobre JSON. Si el
pipeline se detiene para solicitar aprobación, el sobre contiene un token de reanudación (o un
ID de aprobación corto) para poder continuar más adelante.

## Habilitación

Lobster es una herramienta de Plugin **opcional**, no habilitada de forma predeterminada. Se distribuye
incluida, por lo que no se requiere un paso de instalación independiente; solo hay que permitir la herramienta:

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
restringir otras herramientas principales. Use `tools.allow` solo si desea un modo restrictivo
de lista de permitidos.
</Note>

La herramienta está completamente deshabilitada en contextos de herramientas aislados.

Si necesita la CLI independiente de Lobster para desarrollo o pipelines externos
(fuera del ejecutor integrado del Gateway), instálela desde el
[repositorio de Lobster](https://github.com/openclaw/lobster) y coloque `lobster` en
`PATH`.

## Patrón: CLI pequeña + canalizaciones JSON + aprobaciones

Cree comandos pequeños que se comuniquen mediante JSON y, después, encadénelos en una sola llamada de Lobster.
(Los nombres de comandos siguientes son ejemplos; sustitúyalos por los suyos).

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt '¿Aplicar los cambios?'",
  "timeoutMs": 30000
}
```

Si el pipeline solicita aprobación, reanúdelo con el token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Ejemplo: asignación de elementos de entrada a llamadas de herramienta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos de LLM exclusivamente JSON (llm-task)

Para incluir un **paso de LLM estructurado** en un flujo de trabajo, habilite la herramienta de Plugin
opcional `llm-task` y llámela desde Lobster:

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

El Plugin de Lobster incluido ejecuta los flujos de trabajo **dentro del proceso** en el Gateway.
En ese modo integrado, `openclaw.invoke` **no** hereda automáticamente un
contexto de URL/autenticación del Gateway para llamadas anidadas a herramientas de la CLI de OpenClaw.

Esto significa que este patrón **no es fiable actualmente en el ejecutor integrado**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Use el ejemplo siguiente únicamente cuando ejecute la **CLI independiente de Lobster** en un
entorno donde `openclaw.invoke` ya esté configurado con el contexto correcto
del Gateway y de autenticación.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "A partir del correo electrónico de entrada, devuelve la intención y un borrador.",
  "thinking": "low",
  "input": { "subject": "Hola", "body": "¿Puedes ayudarme?" },
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

Si utiliza actualmente el Plugin de Lobster integrado, es preferible usar:

- una llamada directa a la herramienta `llm-task` fuera de Lobster, o
- pasos que no sean de `openclaw.invoke` dentro del pipeline de Lobster hasta que se añada un puente
  integrado compatible.

Consulte [Tarea de LLM](/es/tools/llm-task) para obtener información detallada y opciones de configuración.

## Archivos de flujo de trabajo (.lobster)

Lobster puede ejecutar archivos de flujo de trabajo YAML/JSON con los campos `name`, `args`, `steps`, `env`,
`condition` y `approval`. Establezca `pipeline` en la ruta del archivo en la llamada de
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
- `condition` (o `when`) puede condicionar los pasos en función de `$step.approved`.

### Variables de entorno inyectadas

Cada shell de paso hereda el entorno principal, además de estas variables
inyectadas por Lobster, de modo que los comandos puedan hacer referencia a los argumentos resueltos del flujo de trabajo sin insertar
valores sin procesar en la cadena del comando:

- `LOBSTER_ARG_<NAME>`: una por argumento del flujo de trabajo. El nombre se convierte a mayúsculas y cada
  secuencia de caracteres no alfanuméricos se sustituye por `_`, por lo que el argumento `user-id` se convierte en
  `LOBSTER_ARG_USER_ID`.
- `LOBSTER_ARGS_JSON`: todos los argumentos resueltos como una única cadena JSON.

Ese es el conjunto completo de variables inyectadas. **No** existen variables de salida por paso
como `LOBSTER_STEP_<id>_STDOUT` o `LOBSTER_STEP_<id>_JSON_<field>`; los shells
tratan esos nombres como no definidos, por lo que los valores predeterminados de expansión de parámetros pueden ocultar el error.
Lea la salida de un paso anterior mediante referencias de pasos —`$step.stdout`,
`$step.json` o `$step.json.<field>`— en un valor `stdin:`, `env:` o `condition:`.
(`LOBSTER_STATE_DIR` es una configuración independiente del entorno de ejecución para el directorio
de estado, no un argumento por ejecución).

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

Ejecute un archivo de flujo de trabajo con argumentos:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Campo            | Valor predeterminado | Notas                                                                                                        |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | obligatorio         | Cadena de pipeline en línea o una ruta que termine en `.lobster`/`.yaml`/`.yml`/`.json` para un archivo de flujo de trabajo.           |
| `cwd`            | cwd del Gateway     | Directorio de trabajo relativo; debe resolverse dentro del directorio de trabajo del Gateway (se rechazan las rutas absolutas). |
| `timeoutMs`      | `20000`     | Cancela la ejecución si se supera.                                                                                  |
| `maxStdoutBytes` | `512000`    | Cancela la ejecución si stdout o stderr capturados superan este tamaño.                                               |
| `argsJson`       | -                   | Cadena JSON de argumentos para un archivo de flujo de trabajo (se ignora en los pipelines en línea).                                      |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` acepta `token` (el token de reanudación completo de `requiresApproval`)
o `approvalId` (el ID corto del mismo objeto); use el que haya devuelto la ejecución
detenida. `approve` es obligatorio.

### Modo administrado de TaskFlow

Al pasar `flowControllerId` y `flowGoal` en `run` (o `flowId` y
`flowExpectedRevision` en `resume`), la llamada se procesa mediante la API administrada de
[TaskFlow](/es/automation/taskflow) del entorno de ejecución del Plugin, en lugar de devolver
un sobre simple: OpenClaw crea o reanuda un registro de flujo duradero, le aplica el
sobre de Lobster (`waiting` al aprobar, `succeeded`/`failed` al
completar) y devuelve `{ ok, envelope, flow, mutation }`. Este modo requiere
un entorno de ejecución de TaskFlow vinculado y está diseñado para código de Plugin/controlador que necesita
un estado de flujo duradero entre reinicios del Gateway, no para el uso ad hoc habitual por parte de agentes.

## Sobre de salida

Lobster devuelve un sobre JSON con uno de tres estados:

- `ok`: finalizó correctamente
- `needs_approval`: en pausa; `requiresApproval` contiene un `resumeToken` y un
  `approvalId` corto, cualquiera de los cuales puede reanudar la ejecución
- `cancelled`: denegado o cancelado explícitamente

La herramienta expone el sobre tanto en `content` (JSON con formato legible) como en `details`
(objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, inspeccione el mensaje y decida:

- `approve: true`: reanudar y continuar con los efectos secundarios
- `approve: false`: cancelar y finalizar el flujo de trabajo

Use `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a las
solicitudes de aprobación sin lógica de enlace personalizada con jq/heredoc. El estado de reanudación se almacena como
pequeños archivos JSON en el directorio de estado de Lobster (`~/.lobster/state` de forma
predeterminada; se puede sustituir con `LOBSTER_STATE_DIR`); el propio token solo codifica un
puntero a ese estado, no el estado completo del pipeline.

## OpenProse

OpenProse se complementa bien con Lobster: use `/prose` para orquestar la preparación
multiagente y, después, ejecute un pipeline de Lobster para obtener aprobaciones deterministas. Si un programa
Prose necesita Lobster, permita la herramienta `lobster` para los subagentes mediante
`tools.subagents.tools`. Consulte [OpenProse](/es/prose).

## Seguridad

- **Solo local y en proceso** - los flujos de trabajo se ejecutan dentro del proceso del Gateway; el propio plugin no realiza
  llamadas de red.
- **Sin secretos** - Lobster no gestiona OAuth; llama a las herramientas de OpenClaw que
  sí lo hacen.
- **Compatible con el entorno aislado** - se desactiva cuando el contexto de la herramienta está aislado.
- **Reforzado** - el ejecutor integrado aplica límites de tiempo y de salida.

## Solución de problemas

| Error                                                         | Causa / solución                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | El pipeline superó `timeoutMs`. Aumente el límite o divida el pipeline.                |
| `lobster stdout exceeded maxStdoutBytes` (o `stderr`)        | La salida capturada superó el límite. Aumente `maxStdoutBytes` o reduzca la salida.       |
| `run --args-json must be valid JSON`                          | No se pudo analizar `argsJson` (ejecuciones desde archivos de flujo de trabajo). Corrija la cadena JSON.            |
| `lobster runtime failed` (u otro mensaje `runtime_error`) | El entorno de ejecución integrado devolvió un sobre de error. Consulte los registros del Gateway para obtener más detalles. |

## Más información

- [Plugins](/es/tools/plugin)
- [Creación de herramientas de plugins](/es/plugins/building-plugins#registering-agent-tools)

## Caso práctico: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de «segundo cerebro» y pipelines de Lobster que gestionan tres
almacenes de Markdown (personal, de la pareja y compartido). La CLI emite JSON con estadísticas,
listas de la bandeja de entrada y análisis de elementos obsoletos; Lobster encadena esos comandos en flujos de trabajo
como `weekly-review`, `inbox-triage`, `memory-consolidation` y
`shared-task-sync`, cada uno con controles de aprobación. La IA se encarga de las decisiones
(categorización) cuando está disponible y recurre a reglas deterministas cuando
no lo está.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositorio: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Contenido relacionado

- [Automatización](/es/automation) - todos los mecanismos de automatización
- [Descripción general de las herramientas](/es/tools) - todas las herramientas de agente disponibles
