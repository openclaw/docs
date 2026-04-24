---
read_when:
    - Quieres que los agentes conviertan correcciones o procedimientos reutilizables en Skills del espacio de trabajo
    - Estás configurando memoria procedural de Skills
    - Estás depurando el comportamiento de la herramienta `skill_workshop`
    - Estás decidiendo si habilitar la creación automática de Skills
summary: Captura experimental de procedimientos reutilizables como Skills del espacio de trabajo con revisión, aprobación, cuarentena y actualización en caliente de Skills
title: Plugin de taller de Skills
x-i18n:
    generated_at: "2026-04-24T05:42:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop es **experimental**. Está deshabilitado de forma predeterminada, sus heurísticas de captura y prompts de revisor pueden cambiar entre versiones, y las escrituras automáticas solo deberían usarse en espacios de trabajo de confianza después de revisar primero la salida en modo pendiente.

Skill Workshop es memoria procedural para Skills del espacio de trabajo. Permite que un agente convierta flujos de trabajo reutilizables, correcciones del usuario, soluciones costosas y errores recurrentes en archivos `SKILL.md` bajo:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Esto es distinto de la memoria a largo plazo:

- **Memoria** almacena hechos, preferencias, entidades y contexto pasado.
- **Skills** almacenan procedimientos reutilizables que el agente debería seguir en tareas futuras.
- **Skill Workshop** es el puente desde un turno útil hasta un Skill duradero del espacio de trabajo, con comprobaciones de seguridad y aprobación opcional.

Skill Workshop es útil cuando el agente aprende un procedimiento como:

- cómo validar recursos GIF animados obtenidos externamente
- cómo reemplazar recursos de capturas de pantalla y verificar dimensiones
- cómo ejecutar un escenario de QA específico de un repositorio
- cómo depurar un fallo recurrente de proveedor
- cómo reparar una nota obsoleta de flujo de trabajo local

No está pensado para:

- hechos como «al usuario le gusta el azul»
- memoria autobiográfica amplia
- archivado sin procesar de transcripciones
- secretos, credenciales o texto oculto del prompt
- instrucciones puntuales que no se repetirán

## Estado predeterminado

El Plugin incluido es **experimental** y está **deshabilitado por defecto** a menos que se
habilite explícitamente en `plugins.entries.skill-workshop`.

El manifiesto del Plugin no establece `enabledByDefault: true`. El valor predeterminado `enabled: true`
dentro del esquema de configuración del Plugin se aplica solo después de que la entrada del Plugin ya haya sido seleccionada y cargada.

Experimental significa:

- el Plugin está lo bastante soportado para pruebas opt-in y dogfooding
- el almacenamiento de propuestas, los umbrales del revisor y las heurísticas de captura pueden evolucionar
- la aprobación pendiente es el modo inicial recomendado
- la aplicación automática es para configuraciones de confianza personales/del espacio de trabajo, no para entornos compartidos u hostiles con mucha entrada

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
- las pasadas del revisor basadas en umbral pueden proponer actualizaciones de Skills
- no se escribe ningún archivo de Skill hasta que se aplique una propuesta pendiente

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

`approvalPolicy: "auto"` sigue usando el mismo escáner y la misma ruta de cuarentena. No
aplica propuestas con hallazgos críticos.

## Configuración

| Clave                | Predeterminado | Rango / valores                              | Significado                                                          |
| -------------------- | -------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`         | boolean                                      | Habilita el Plugin después de cargar la entrada del Plugin.          |
| `autoCapture`        | `true`         | boolean                                      | Habilita captura/revisión posterior al turno en turnos exitosos del agente. |
| `approvalPolicy`     | `"pending"`    | `"pending"`, `"auto"`                        | Poner propuestas en cola o escribir automáticamente propuestas seguras. |
| `reviewMode`         | `"hybrid"`     | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | Elige captura explícita de correcciones, revisor LLM, ambos o ninguno. |
| `reviewInterval`     | `15`           | `1..200`                                     | Ejecutar el revisor después de este número de turnos exitosos.       |
| `reviewMinToolCalls` | `8`            | `1..500`                                     | Ejecutar el revisor después de este número de llamadas a herramientas observadas. |
| `reviewTimeoutMs`    | `45000`        | `5000..180000`                               | Timeout para la ejecución integrada del revisor.                     |
| `maxPending`         | `50`           | `1..200`                                     | Máximo de propuestas pendientes/en cuarentena conservadas por espacio de trabajo. |
| `maxSkillBytes`      | `40000`        | `1024..200000`                               | Tamaño máximo del Skill generado/archivo de soporte.                 |

Perfiles recomendados:

```json5
// Conservador: solo uso explícito de herramientas, sin captura automática.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Revisar primero: capturar automáticamente, pero requerir aprobación.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Automatización de confianza: escribir propuestas seguras inmediatamente.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Bajo costo: sin llamada LLM del revisor, solo frases explícitas de corrección.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Rutas de captura

Skill Workshop tiene tres rutas de captura.

### Sugerencias de herramientas

El modelo puede llamar a `skill_workshop` directamente cuando vea un procedimiento reutilizable
o cuando el usuario le pida guardar/actualizar un Skill.

Esta es la ruta más explícita y funciona incluso con `autoCapture: false`.

### Captura heurística

Cuando `autoCapture` está habilitado y `reviewMode` es `heuristic` o `hybrid`, el
Plugin analiza los turnos exitosos en busca de frases explícitas de corrección del usuario:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

La heurística crea una propuesta a partir de la última instrucción coincidente del usuario. Usa sugerencias de tema para elegir nombres de Skills para flujos de trabajo comunes:

- tareas de GIF animado -> `animated-gif-workflow`
- tareas de capturas de pantalla o recursos -> `screenshot-asset-workflow`
- tareas de QA o escenarios -> `qa-scenario-workflow`
- tareas de PR de GitHub -> `github-pr-workflow`
- fallback -> `learned-workflows`

La captura heurística es intencionalmente limitada. Está pensada para correcciones claras y
notas de proceso repetibles, no para resumen general de transcripciones.

### Revisor LLM

Cuando `autoCapture` está habilitado y `reviewMode` es `llm` o `hybrid`, el Plugin
ejecuta un revisor integrado compacto cuando se alcanzan los umbrales.

El revisor recibe:

- el texto reciente de la transcripción, limitado a los últimos 12.000 caracteres
- hasta 12 Skills existentes del espacio de trabajo
- hasta 2.000 caracteres de cada Skill existente
- instrucciones solo JSON

El revisor no tiene herramientas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

El revisor devuelve o bien `{ "action": "none" }` o bien una propuesta. El campo `action` es `create`, `append` o `replace`; prefiere `append`/`replace` cuando ya exista un Skill relevante; usa `create` solo cuando ningún Skill existente encaje.

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

`append` agrega `section` + `body`. `replace` intercambia `oldText` por `newText` en el Skill nombrado.

## Ciclo de vida de la propuesta

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

Estados de la propuesta:

- `pending` - en espera de aprobación
- `applied` - escrito en `<workspace>/skills`
- `rejected` - rechazado por operador/modelo
- `quarantined` - bloqueado por hallazgos críticos del escáner

El estado se almacena por espacio de trabajo bajo el directorio de estado del Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Las propuestas pendientes y en cuarentena se desduplican por nombre de Skill y carga
del cambio. El almacén conserva las propuestas pendientes/en cuarentena más recientes hasta
`maxPending`.

## Referencia de la herramienta

El Plugin registra una herramienta de agente:

```text
skill_workshop
```

### `status`

Cuenta propuestas por estado para el espacio de trabajo activo.

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

Usa esto cuando la captura automática parece no hacer nada y los registros mencionan
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

Crea una propuesta. Con `approvalPolicy: "pending"` (predeterminado), esto pone en cola en lugar de escribir.

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
  <Accordion title="Forzar una escritura segura (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Forzar pendiente bajo política auto (apply: false)">

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

  <Accordion title="Agregar a una sección nombrada">

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

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` rechaza propuestas en cuarentena:

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

Escribe un archivo de soporte dentro de un directorio de Skill existente o propuesto.

Directorios de soporte de nivel superior permitidos:

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

Los archivos de soporte tienen alcance de espacio de trabajo, se comprueba su ruta, se limitan en bytes mediante
`maxSkillBytes`, se analizan y se escriben de forma atómica.

## Escrituras de Skills

Skill Workshop escribe solo bajo:

```text
<workspace>/skills/<normalized-skill-name>/
```

Los nombres de Skills se normalizan:

- en minúsculas
- las secuencias no `[a-z0-9_-]` se convierten en `-`
- se eliminan caracteres no alfanuméricos al principio y al final
- la longitud máxima es de 80 caracteres
- el nombre final debe coincidir con `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- si el Skill no existe, Skill Workshop escribe un nuevo `SKILL.md`
- si ya existe, Skill Workshop agrega el cuerpo a `## Workflow`

Para `append`:

- si el Skill existe, Skill Workshop agrega a la sección solicitada
- si no existe, Skill Workshop crea un Skill mínimo y luego agrega

Para `replace`:

- el Skill debe existir ya
- `oldText` debe estar presente exactamente
- solo se reemplaza la primera coincidencia exacta

Todas las escrituras son atómicas y actualizan inmediatamente la instantánea de Skills en memoria, de modo
que el Skill nuevo o actualizado pueda hacerse visible sin reiniciar el Gateway.

## Modelo de seguridad

Skill Workshop tiene un escáner de seguridad sobre el contenido generado de `SKILL.md` y los archivos
de soporte.

Los hallazgos críticos ponen propuestas en cuarentena:

| Id de regla                            | Bloquea contenido que...                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dice al agente que ignore instrucciones previas/superiores              |
| `prompt-injection-system`              | hace referencia a prompts del sistema, mensajes de desarrollador o instrucciones ocultas |
| `prompt-injection-tool`                | fomenta omitir permisos/aprobaciones de herramientas                    |
| `shell-pipe-to-shell`                  | incluye `curl`/`wget` canalizado a `sh`, `bash` o `zsh`                 |
| `secret-exfiltration`                  | parece enviar datos de env/proceso por la red                           |

Los hallazgos de advertencia se conservan, pero no bloquean por sí solos:

| Id de regla          | Advierte sobre...                    |
| -------------------- | ------------------------------------ |
| `destructive-delete` | comandos amplios estilo `rm -rf`     |
| `unsafe-permissions` | uso de permisos estilo `chmod 777`   |

Las propuestas en cuarentena:

- conservan `scanFindings`
- conservan `quarantineReason`
- aparecen en `list_quarantine`
- no pueden aplicarse mediante `apply`

Para recuperarte de una propuesta en cuarentena, crea una nueva propuesta segura con el
contenido inseguro eliminado. No edites a mano el JSON del almacén.

## Guía del prompt

Cuando está habilitado, Skill Workshop inyecta una breve sección de prompt que le dice al agente
que use `skill_workshop` para memoria procedural duradera.

La guía enfatiza:

- procedimientos, no hechos/preferencias
- correcciones del usuario
- procedimientos exitosos no obvios
- errores recurrentes
- reparación de Skills obsoletos/escasos/incorrectos mediante append/replace
- guardar procedimientos reutilizables tras bucles largos de herramientas o correcciones difíciles
- texto breve e imperativo del Skill
- sin volcado de transcripciones

El texto del modo de escritura cambia con `approvalPolicy`:

- modo pending: poner sugerencias en cola; aplicar solo tras aprobación explícita
- modo auto: aplicar actualizaciones seguras de Skills del espacio de trabajo cuando sean claramente reutilizables

## Costes y comportamiento en runtime

La captura heurística no llama a ningún modelo.

La revisión LLM usa una ejecución integrada con el modelo del agente activo/predeterminado. Está
basada en umbrales, por lo que no se ejecuta en cada turno por defecto.

El revisor:

- usa el mismo contexto de proveedor/modelo configurado cuando está disponible
- recurre a los valores predeterminados del agente en runtime
- tiene `reviewTimeoutMs`
- usa contexto bootstrap ligero
- no tiene herramientas
- no escribe nada directamente
- solo puede emitir una propuesta que pasa por el escáner normal y la
  ruta de aprobación/cuarentena

Si el revisor falla, agota el tiempo o devuelve JSON no válido, el Plugin registra un
mensaje de advertencia/depuración y omite esa pasada de revisión.

## Patrones operativos

Usa Skill Workshop cuando el usuario diga:

- «la próxima vez, haz X»
- «a partir de ahora, prefiere Y»
- «asegúrate de verificar Z»
- «guarda esto como flujo de trabajo»
- «esto llevó un rato; recuerda el proceso»
- «actualiza el Skill local para esto»

Buen texto de Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Mal texto de Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Razones por las que la versión mala no debería guardarse:

- tiene forma de transcripción
- no es imperativa
- incluye detalles puntuales ruidosos
- no le dice al siguiente agente qué hacer

## Depuración

Comprueba si el Plugin está cargado:

```bash
openclaw plugins list --enabled
```

Comprueba los conteos de propuestas desde un contexto de agente/herramienta:

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

| Síntoma                               | Causa probable                                                                      | Comprobar                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| La herramienta no está disponible     | La entrada del Plugin no está habilitada                                            | `plugins.entries.skill-workshop.enabled` y `openclaw plugins list`   |
| No aparece ninguna propuesta automática | `autoCapture: false`, `reviewMode: "off"` o no se alcanzaron los umbrales         | Configuración, estado de propuestas, registros del Gateway           |
| La heurística no capturó              | La redacción del usuario no coincidía con los patrones de corrección                | Usa `skill_workshop.suggest` explícito o habilita el revisor LLM     |
| El revisor no creó una propuesta      | El revisor devolvió `none`, JSON no válido o agotó el tiempo                        | Registros del Gateway, `reviewTimeoutMs`, umbrales                   |
| La propuesta no se aplica             | `approvalPolicy: "pending"`                                                         | `list_pending`, luego `apply`                                        |
| La propuesta desapareció de pendientes | Se reutilizó una propuesta duplicada, poda por máximo de pendientes o fue aplicada/rechazada/en cuarentena | `status`, `list_pending` con filtros de estado, `list_quarantine` |
| El archivo de Skill existe, pero el modelo no lo detecta | La instantánea del Skill no se actualizó o la restricción del Skill lo excluye | estado de `openclaw skills` y elegibilidad del Skill del espacio de trabajo |

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

El escenario del revisor es intencionalmente separado porque habilita
`reviewMode: "llm"` y ejercita la pasada del revisor integrado.

## Cuándo no habilitar auto apply

Evita `approvalPolicy: "auto"` cuando:

- el espacio de trabajo contiene procedimientos sensibles
- el agente está trabajando con entrada no confiable
- los Skills se comparten con un equipo amplio
- sigues ajustando prompts o reglas del escáner
- el modelo gestiona con frecuencia contenido hostil de web/correo

Usa primero el modo pending. Cambia a modo auto solo después de revisar el tipo de
Skills que el agente propone en ese espacio de trabajo.

## Documentación relacionada

- [Skills](/es/tools/skills)
- [Plugins](/es/tools/plugin)
- [Pruebas](/es/reference/test)
