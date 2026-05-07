---
read_when:
    - Quieres que los agentes conviertan correcciones o procedimientos reutilizables en Skills del espacio de trabajo
    - Está configurando la memoria procedimental de habilidades
    - Está depurando el comportamiento de la herramienta skill_workshop
    - Estás decidiendo si habilitar la creación automática de Skills
summary: Captura experimental de procedimientos reutilizables como Skills del espacio de trabajo con revisión, aprobación, cuarentena y recarga en caliente de Skills
title: Plugin de taller de Skills
x-i18n:
    generated_at: "2026-05-07T13:23:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop es **experimental**. Está deshabilitado de forma predeterminada, sus heurísticas de captura y prompts de revisión pueden cambiar entre versiones, y las escrituras automáticas deben usarse solo en espacios de trabajo de confianza después de revisar primero la salida en modo pendiente.

Skill Workshop es memoria procedimental para Skills del espacio de trabajo. Permite que un agente convierta flujos de trabajo reutilizables, correcciones del usuario, soluciones obtenidas con esfuerzo y problemas recurrentes en archivos `SKILL.md` en:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Esto es distinto de la memoria a largo plazo:

- **Memoria** almacena hechos, preferencias, entidades y contexto pasado.
- **Skills** almacenan procedimientos reutilizables que el agente debe seguir en tareas futuras.
- **Skill Workshop** es el puente entre un turno útil y una Skill duradera del espacio de trabajo, con comprobaciones de seguridad y aprobación opcional.

Skill Workshop resulta útil cuando el agente aprende un procedimiento como:

- cómo validar recursos GIF animados de origen externo
- cómo reemplazar recursos de captura de pantalla y verificar dimensiones
- cómo ejecutar un escenario de QA específico del repositorio
- cómo depurar un fallo recurrente de proveedor
- cómo reparar una nota obsoleta de flujo de trabajo local

No está pensado para:

- hechos como "al usuario le gusta el azul"
- memoria autobiográfica amplia
- archivado sin procesar de transcripciones
- secretos, credenciales o texto oculto de prompts
- instrucciones puntuales que no se repetirán

## Estado predeterminado

El Plugin incluido es **experimental** y está **deshabilitado de forma predeterminada**, a menos que se habilite explícitamente en `plugins.entries.skill-workshop`.

El manifiesto del Plugin no establece `enabledByDefault: true`. El valor predeterminado `enabled: true` dentro del esquema de configuración del Plugin se aplica solo después de que la entrada del Plugin ya se haya seleccionado y cargado.

Experimental significa:

- el Plugin tiene soporte suficiente para pruebas con activación explícita y pruebas internas en uso real
- el almacenamiento de propuestas, los umbrales del revisor y las heurísticas de captura pueden evolucionar
- la aprobación pendiente es el modo inicial recomendado
- la aplicación automática es para configuraciones personales/de espacio de trabajo de confianza, no para entornos compartidos u hostiles con mucho contenido de entrada

## Habilitar

Configuración mínima segura:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Con esta configuración:

- la herramienta `skill_workshop` está disponible
- las correcciones reutilizables explícitas se ponen en cola como propuestas pendientes
- las revisiones basadas en umbrales pueden proponer actualizaciones de Skills
- no se escribe ningún archivo de Skill hasta que se aplica una propuesta pendiente

Usa escrituras automáticas solo en espacios de trabajo de confianza:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` sigue usando el mismo escáner y la misma ruta de cuarentena. No aplica propuestas con hallazgos críticos.

## Configuración

| Clave                | Valor predeterminado | Rango / valores                            | Significado                                                          |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Habilita el Plugin después de que se carga la entrada del Plugin.    |
| `autoCapture`        | `true`      | boolean                                     | Habilita la captura/revisión posterior al turno en turnos de agente correctos. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Pone propuestas en cola o escribe automáticamente propuestas seguras. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Elige captura explícita de correcciones, revisor LLM, ambos o ninguno. |
| `reviewInterval`     | `15`        | `1..200`                                    | Ejecuta el revisor después de esta cantidad de turnos correctos.     |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Ejecuta el revisor después de esta cantidad de llamadas a herramientas observadas. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Tiempo de espera para la ejecución del revisor integrado.            |
| `maxPending`         | `50`        | `1..200`                                    | Máximo de propuestas pendientes/en cuarentena conservadas por espacio de trabajo. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Tamaño máximo del archivo de Skill/soporte generado.                 |

Perfiles recomendados:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Rutas de captura

Skill Workshop tiene tres rutas de captura.

### Sugerencias de herramientas

El modelo puede llamar a `skill_workshop` directamente cuando ve un procedimiento reutilizable o cuando el usuario le pide guardar/actualizar una Skill.

Esta es la ruta más explícita y funciona incluso con `autoCapture: false`.

### Captura heurística

Cuando `autoCapture` está habilitado y `reviewMode` es `heuristic` o `hybrid`, el Plugin analiza los turnos correctos en busca de frases explícitas de corrección del usuario:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

La heurística crea una propuesta a partir de la instrucción de usuario coincidente más reciente. Usa pistas de tema para elegir nombres de Skills para flujos de trabajo comunes:

- tareas de GIF animados -> `animated-gif-workflow`
- tareas de capturas de pantalla o recursos -> `screenshot-asset-workflow`
- tareas de QA o escenarios -> `qa-scenario-workflow`
- tareas de PR de GitHub -> `github-pr-workflow`
- alternativa -> `learned-workflows`

La captura heurística es intencionalmente limitada. Está pensada para correcciones claras y notas de procesos repetibles, no para resumir transcripciones generales.

### Revisor LLM

Cuando `autoCapture` está habilitado y `reviewMode` es `llm` o `hybrid`, el Plugin ejecuta un revisor integrado compacto después de alcanzar los umbrales.

El revisor recibe:

- el texto reciente de la transcripción, limitado a los últimos 12.000 caracteres
- hasta 12 Skills existentes del espacio de trabajo
- hasta 2.000 caracteres de cada Skill existente
- instrucciones solo en JSON

El revisor no tiene herramientas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

El revisor devuelve `{ "action": "none" }` o una propuesta. El campo `action` es `create`, `append` o `replace`: prefiere `append`/`replace` cuando ya existe una Skill relevante; usa `create` solo cuando no encaja ninguna Skill existente.

Ejemplo de `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` añade `section` + `body`. `replace` sustituye `oldText` por `newText` en la Skill indicada.

## Ciclo de vida de las propuestas

Cada actualización generada se convierte en una propuesta con:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` opcional
- `sessionId` opcional
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` o `reviewer`
- `status`
- `change`
- `scanFindings` opcional
- `quarantineReason` opcional

Estados de las propuestas:

- `pending`: esperando aprobación
- `applied`: escrito en `<workspace>/skills`
- `rejected`: rechazado por el operador/modelo
- `quarantined`: bloqueado por hallazgos críticos del escáner

El estado se almacena por espacio de trabajo en el directorio de estado de Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Las propuestas pendientes y en cuarentena se deduplican por nombre de habilidad y carga útil
de cambio. El almacén conserva las propuestas pendientes/en cuarentena más recientes hasta
`maxPending`.

## Referencia de herramientas

El Plugin registra una herramienta de agente:

```text
skill_workshop
```

### `status`

Cuenta las propuestas por estado para el espacio de trabajo activo.

```json
{ "action": "status" }
```

Forma del resultado:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Enumera las propuestas pendientes.

```json
{ "action": "list_pending" }
```

Para enumerar otro estado:

```json
{ "action": "list_pending", "status": "applied" }
```

Valores válidos de `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Enumera las propuestas en cuarentena.

```json
{ "action": "list_quarantine" }
```

Usa esto cuando la captura automática parezca no hacer nada y los registros mencionen
`skill-workshop: quarantined <skill>`.

### `inspect`

Obtiene una propuesta por id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Crea una propuesta. Con `approvalPolicy: "pending"` (predeterminado), esto la pone en cola en lugar de escribir.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Solicitar escritura inmediata en modo automático (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Con `approvalPolicy: "pending"`, `apply: true` sigue poniendo la propuesta en cola. Revísala y luego usa
la acción `apply` después de aprobarla.

  </Accordion>

  <Accordion title="Forzar pendiente con política automática (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Anexar a una sección con nombre">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Reemplazar texto exacto">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Aplica una propuesta pendiente.

Con `approvalPolicy: "pending"`, esta acción solicita aprobación del operador antes de escribir la
habilidad del espacio de trabajo.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` rechaza las propuestas en cuarentena:

```text
quarantined proposal cannot be applied
```

### `reject`

Marca una propuesta como rechazada.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Escribe un archivo de apoyo dentro de un directorio de habilidad existente o propuesto.

Directorios de apoyo de nivel superior permitidos:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Ejemplo:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Los archivos de soporte tienen alcance de espacio de trabajo, se comprueban por ruta, están limitados en bytes por
`maxSkillBytes`, se escanean y se escriben de forma atómica.

## Escrituras de Skill

Skill Workshop escribe solo bajo:

```text
<workspace>/skills/<normalized-skill-name>/
```

Los nombres de Skill se normalizan:

- se convierten a minúsculas
- las secuencias que no sean `[a-z0-9_-]` pasan a ser `-`
- se eliminan los caracteres no alfanuméricos iniciales/finales
- la longitud máxima es de 80 caracteres
- el nombre final debe coincidir con `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- si la Skill no existe, Skill Workshop escribe un nuevo `SKILL.md`
- si ya existe, Skill Workshop añade el cuerpo a `## Workflow`

Para `append`:

- si la Skill existe, Skill Workshop añade contenido a la sección solicitada
- si no existe, Skill Workshop crea una Skill mínima y luego añade contenido

Para `replace`:

- la Skill ya debe existir
- `oldText` debe estar presente exactamente
- solo se reemplaza la primera coincidencia exacta

Todas las escrituras son atómicas y actualizan inmediatamente la instantánea de Skills en memoria, de modo que
la Skill nueva o actualizada puede hacerse visible sin reiniciar el Gateway.

## Modelo de seguridad

Skill Workshop tiene un escáner de seguridad para el contenido generado de `SKILL.md` y los archivos de soporte.

Los hallazgos críticos ponen las propuestas en cuarentena:

| Id. de regla                          | Bloquea contenido que...                                              |
| ------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | indica al agente que ignore instrucciones anteriores/superiores       |
| `prompt-injection-system`             | hace referencia a prompts del sistema, mensajes de desarrollador o instrucciones ocultas |
| `prompt-injection-tool`               | anima a eludir permisos/aprobaciones de herramientas                  |
| `shell-pipe-to-shell`                 | incluye `curl`/`wget` canalizado a `sh`, `bash` o `zsh`               |
| `secret-exfiltration`                 | parece enviar datos de env/proceso env por la red                     |

Los hallazgos de advertencia se conservan, pero no bloquean por sí solos:

| Id. de regla          | Advierte sobre...                 |
| --------------------- | --------------------------------- |
| `destructive-delete`  | comandos amplios de estilo `rm -rf` |
| `unsafe-permissions`  | uso de permisos de estilo `chmod 777` |

Las propuestas en cuarentena:

- conservan `scanFindings`
- conservan `quarantineReason`
- aparecen en `list_quarantine`
- no se pueden aplicar mediante `apply`

Para recuperarte de una propuesta en cuarentena, crea una nueva propuesta segura con el
contenido inseguro eliminado. No edites manualmente el JSON del almacén.

## Guía de prompt

Cuando está habilitado, Skill Workshop inyecta una breve sección de prompt que indica al agente
que use `skill_workshop` para memoria procedimental duradera.

La guía enfatiza:

- procedimientos, no datos/preferencias
- correcciones del usuario
- procedimientos exitosos no evidentes
- errores recurrentes
- reparación de Skills obsoletas/superficiales/incorrectas mediante append/replace
- guardar procedimientos reutilizables después de bucles largos con herramientas o arreglos difíciles
- texto breve e imperativo para Skills
- sin volcados de transcripciones

El texto del modo de escritura cambia con `approvalPolicy`:

- modo pendiente: poner sugerencias en cola; usar `apply` tras aprobación explícita
- modo automático: aplicar actualizaciones seguras de Skills del espacio de trabajo salvo que `apply: false` las ponga en cola

## Costos y comportamiento en tiempo de ejecución

La captura heurística no llama a un modelo.

La revisión con LLM usa una ejecución incrustada en el modelo activo/predeterminado del agente. Está
basada en umbrales, por lo que no se ejecuta en cada turno de forma predeterminada.

El revisor:

- usa el mismo contexto configurado de proveedor/modelo cuando está disponible
- recurre a los valores predeterminados del agente en tiempo de ejecución
- tiene `reviewTimeoutMs`
- usa un contexto de arranque ligero
- no tiene herramientas
- no escribe nada directamente
- solo puede emitir una propuesta que pasa por el escáner normal y la ruta de
  aprobación/cuarentena

Si el revisor falla, agota el tiempo de espera o devuelve JSON no válido, el Plugin registra un
mensaje de advertencia/depuración y omite esa pasada de revisión.

## Patrones operativos

Usa Skill Workshop cuando el usuario diga:

- "la próxima vez, haz X"
- "de ahora en adelante, prefiere Y"
- "asegúrate de verificar Z"
- "guarda esto como un flujo de trabajo"
- "esto llevó un tiempo; recuerda el proceso"
- "actualiza la Skill local para esto"

Buen texto de Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Texto de Skill deficiente:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Razones por las que no se debe guardar la versión deficiente:

- tiene forma de transcripción
- no es imperativa
- incluye detalles ruidosos de una sola vez
- no indica al siguiente agente qué hacer

## Depuración

Comprueba si el Plugin está cargado:

```bash
openclaw plugins list --enabled
```

Comprueba los recuentos de propuestas desde un contexto de agente/herramienta:

```json
{ "action": "status" }
```

Inspecciona propuestas pendientes:

```json
{ "action": "list_pending" }
```

Inspecciona propuestas en cuarentena:

```json
{ "action": "list_quarantine" }
```

Síntomas comunes:

| Síntoma                               | Causa probable                                                                      | Comprobación                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| La herramienta no está disponible     | La entrada del Plugin no está habilitada                                            | `plugins.entries.skill-workshop.enabled` y `openclaw plugins list` |
| No aparece ninguna propuesta automática | `autoCapture: false`, `reviewMode: "off"` o no se alcanzaron los umbrales           | Configuración, estado de propuestas, registros del Gateway         |
| La heurística no capturó              | La redacción del usuario no coincidió con patrones de corrección                    | Usa `skill_workshop.suggest` explícito o habilita el revisor LLM   |
| El revisor no creó una propuesta      | El revisor devolvió `none`, JSON no válido o agotó el tiempo de espera              | Registros del Gateway, `reviewTimeoutMs`, umbrales                 |
| La propuesta no se aplica             | `approvalPolicy: "pending"`                                                        | `list_pending`, luego `apply`                                      |
| La propuesta desapareció de pendientes | Se reutilizó una propuesta duplicada, se podó por máximo de pendientes, o fue aplicada/rechazada/puesta en cuarentena | `status`, `list_pending` con filtros de estado, `list_quarantine` |
| El archivo de Skill existe, pero el modelo lo omite | La instantánea de Skill no se actualizó o la compuerta de Skill la excluye          | estado de `openclaw skills` y elegibilidad de Skill del espacio de trabajo |

Registros relevantes:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Escenarios de QA

Escenarios de QA respaldados por el repositorio:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Ejecuta la cobertura determinista:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Ejecuta la cobertura del revisor:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

El escenario del revisor está separado intencionadamente porque habilita
`reviewMode: "llm"` y ejercita la pasada del revisor incrustado.

## Cuándo no habilitar la aplicación automática

Evita `approvalPolicy: "auto"` cuando:

- el espacio de trabajo contiene procedimientos sensibles
- el agente trabaja con entrada no confiable
- las Skills se comparten en un equipo amplio
- todavía estás ajustando prompts o reglas del escáner
- el modelo maneja con frecuencia contenido web/correo hostil

Usa primero el modo pendiente. Cambia al modo automático solo después de revisar el tipo de
Skills que propone el agente en ese espacio de trabajo.

## Documentos relacionados

- [Skills](/es/tools/skills)
- [Plugins](/es/tools/plugin)
- [Pruebas](/es/reference/test)
