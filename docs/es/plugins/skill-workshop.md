---
read_when:
    - Quieres que los agentes conviertan correcciones o procedimientos reutilizables en Skills del espacio de trabajo
    - Estás configurando la memoria de habilidades procedimentales
    - Estás depurando el comportamiento de la herramienta skill_workshop
    - Estás decidiendo si activar la creación automática de Skills
summary: Captura experimental de procedimientos reutilizables como Skills de espacio de trabajo con revisión, aprobación, cuarentena y actualización en caliente de Skills
title: Plugin del taller de Skills
x-i18n:
    generated_at: "2026-05-06T05:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop es **experimental**. Está deshabilitado de forma predeterminada, sus heurísticas de captura y prompts de revisor pueden cambiar entre versiones, y las escrituras automáticas deben usarse solo en espacios de trabajo de confianza tras revisar primero la salida del modo pendiente.

Skill Workshop es memoria procedimental para Skills del espacio de trabajo. Permite que un agente convierta flujos de trabajo reutilizables, correcciones de usuario, soluciones arduamente conseguidas y obstáculos recurrentes en archivos `SKILL.md` en:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Esto es distinto de la memoria a largo plazo:

- **Memoria** almacena hechos, preferencias, entidades y contexto pasado.
- **Skills** almacena procedimientos reutilizables que el agente debe seguir en tareas futuras.
- **Skill Workshop** es el puente entre un turno útil y una skill duradera del espacio de trabajo, con comprobaciones de seguridad y aprobación opcional.

Skill Workshop es útil cuando el agente aprende un procedimiento como:

- cómo validar recursos GIF animados de origen externo
- cómo reemplazar recursos de capturas de pantalla y verificar dimensiones
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

El plugin incluido es **experimental** y está **deshabilitado de forma predeterminada** salvo que se habilite explícitamente en `plugins.entries.skill-workshop`.

El manifiesto del plugin no establece `enabledByDefault: true`. El valor predeterminado `enabled: true` dentro del esquema de configuración del plugin se aplica solo después de que la entrada del plugin ya se haya seleccionado y cargado.

Experimental significa:

- el plugin tiene soporte suficiente para pruebas opcionales y uso interno
- el almacenamiento de propuestas, los umbrales de revisor y las heurísticas de captura pueden evolucionar
- la aprobación pendiente es el modo inicial recomendado
- la aplicación automática es para configuraciones personales/de espacio de trabajo de confianza, no para entornos compartidos u hostiles con gran cantidad de entradas

## Habilitar

Configuración segura mínima:

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
- las pasadas de revisor basadas en umbrales pueden proponer actualizaciones de Skills
- no se escribe ningún archivo de skill hasta que se aplica una propuesta pendiente

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

| Clave                | Predeterminado | Rango / valores                            | Significado                                                          |
| -------------------- | -------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `enabled`            | `true`         | boolean                                    | Habilita el plugin después de cargar la entrada del plugin.          |
| `autoCapture`        | `true`         | boolean                                    | Habilita la captura/revisión posterior al turno en turnos de agente correctos. |
| `approvalPolicy`     | `"pending"`    | `"pending"`, `"auto"`                      | Pone propuestas en cola o escribe propuestas seguras automáticamente. |
| `reviewMode`         | `"hybrid"`     | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Elige captura de correcciones explícitas, revisor LLM, ambos o ninguno. |
| `reviewInterval`     | `15`           | `1..200`                                   | Ejecuta el revisor después de esta cantidad de turnos correctos.     |
| `reviewMinToolCalls` | `8`            | `1..500`                                   | Ejecuta el revisor después de esta cantidad de llamadas a herramientas observadas. |
| `reviewTimeoutMs`    | `45000`        | `5000..180000`                             | Tiempo de espera para la ejecución del revisor integrado.            |
| `maxPending`         | `50`           | `1..200`                                   | Máximo de propuestas pendientes/en cuarentena conservadas por espacio de trabajo. |
| `maxSkillBytes`      | `40000`        | `1024..200000`                             | Tamaño máximo de archivo generado de skill/soporte.                  |

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

### Sugerencias de herramienta

El modelo puede llamar a `skill_workshop` directamente cuando ve un procedimiento reutilizable o cuando el usuario le pide que guarde/actualice una skill.

Esta es la ruta más explícita y funciona incluso con `autoCapture: false`.

### Captura heurística

Cuando `autoCapture` está habilitado y `reviewMode` es `heuristic` o `hybrid`, el plugin escanea turnos correctos en busca de frases explícitas de corrección del usuario:

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

La captura heurística es deliberadamente estrecha. Está pensada para correcciones claras y notas de proceso repetibles, no para resumir transcripciones en general.

### Revisor LLM

Cuando `autoCapture` está habilitado y `reviewMode` es `llm` o `hybrid`, el plugin ejecuta un revisor integrado compacto después de alcanzar los umbrales.

El revisor recibe:

- el texto de la transcripción reciente, limitado a los últimos 12.000 caracteres
- hasta 12 Skills existentes del espacio de trabajo
- hasta 2.000 caracteres de cada skill existente
- instrucciones solo en JSON

El revisor no tiene herramientas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

El revisor devuelve `{ "action": "none" }` o una propuesta. El campo `action` es `create`, `append` o `replace`: prefiere `append`/`replace` cuando ya existe una skill relevante; usa `create` solo cuando no encaja ninguna skill existente.

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

`append` añade `section` + `body`. `replace` sustituye `oldText` por `newText` en la skill indicada.

## Ciclo de vida de propuestas

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

Estados de propuesta:

- `pending` - esperando aprobación
- `applied` - escrito en `<workspace>/skills`
- `rejected` - rechazado por el operador/modelo
- `quarantined` - bloqueado por hallazgos críticos del escáner

El estado se almacena por espacio de trabajo bajo el directorio de estado de Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Las propuestas pendientes y en cuarentena se deduplican por nombre de skill y carga útil
del cambio. El almacén conserva las propuestas pendientes/en cuarentena más recientes hasta
`maxPending`.

## Referencia de herramientas

El plugin registra una herramienta de agente:

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

Lista las propuestas pendientes.

```json
{ "action": "list_pending" }
```

Para listar otro estado:

```json
{ "action": "list_pending", "status": "applied" }
```

Valores válidos de `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Lista las propuestas en cuarentena.

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

  <Accordion title="Forzar pendiente bajo política automática (apply: false)">

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

  <Accordion title="Agregar a una sección con nombre">

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

Escribe un archivo de apoyo dentro de un directorio de skill existente o propuesto.

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

Los archivos de soporte tienen alcance de workspace, se verifican por ruta, están limitados en bytes por
`maxSkillBytes`, se escanean y se escriben de forma atómica.

## Escrituras de Skill

Skill Workshop escribe únicamente bajo:

```text
<workspace>/skills/<normalized-skill-name>/
```

Los nombres de Skill se normalizan:

- se convierten a minúsculas
- las secuencias que no sean `[a-z0-9_-]` se convierten en `-`
- se eliminan los caracteres no alfanuméricos iniciales/finales
- la longitud máxima es de 80 caracteres
- el nombre final debe coincidir con `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- si el Skill no existe, Skill Workshop escribe un nuevo `SKILL.md`
- si ya existe, Skill Workshop añade el cuerpo a `## Workflow`

Para `append`:

- si el Skill existe, Skill Workshop añade a la sección solicitada
- si no existe, Skill Workshop crea un Skill mínimo y luego añade

Para `replace`:

- el Skill ya debe existir
- `oldText` debe estar presente exactamente
- solo se reemplaza la primera coincidencia exacta

Todas las escrituras son atómicas y actualizan inmediatamente la instantánea de Skills en memoria, por lo que
el Skill nuevo o actualizado puede hacerse visible sin reiniciar el Gateway.

## Modelo de seguridad

Skill Workshop tiene un escáner de seguridad para el contenido generado de `SKILL.md` y los archivos de soporte.

Los hallazgos críticos ponen en cuarentena las propuestas:

| ID de regla                            | Bloquea contenido que...                                             |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | indica al agente que ignore instrucciones previas/superiores          |
| `prompt-injection-system`              | hace referencia a prompts del sistema, mensajes de desarrollador o instrucciones ocultas |
| `prompt-injection-tool`                | fomenta eludir permisos/aprobaciones de herramientas                  |
| `shell-pipe-to-shell`                  | incluye `curl`/`wget` canalizado a `sh`, `bash` o `zsh`               |
| `secret-exfiltration`                  | parece enviar datos de env/process env por la red                     |

Los hallazgos de advertencia se conservan, pero no bloquean por sí solos:

| ID de regla          | Advierte sobre...                    |
| -------------------- | ------------------------------------ |
| `destructive-delete` | comandos amplios de estilo `rm -rf`  |
| `unsafe-permissions` | uso de permisos de estilo `chmod 777` |

Las propuestas en cuarentena:

- conservan `scanFindings`
- conservan `quarantineReason`
- aparecen en `list_quarantine`
- no pueden aplicarse mediante `apply`

Para recuperarte de una propuesta en cuarentena, crea una nueva propuesta segura con el
contenido inseguro eliminado. No edites manualmente el JSON del almacén.

## Guía de prompt

Cuando está habilitado, Skill Workshop inyecta una breve sección de prompt que indica al agente
que use `skill_workshop` para memoria procedimental duradera.

La guía enfatiza:

- procedimientos, no hechos/preferencias
- correcciones del usuario
- procedimientos exitosos no obvios
- dificultades recurrentes
- reparación de Skills obsoletos/superficiales/incorrectos mediante append/replace
- guardar procedimientos reutilizables después de bucles largos de herramientas o arreglos difíciles
- texto de Skill breve e imperativo
- sin volcados de transcripción

El texto del modo de escritura cambia con `approvalPolicy`:

- modo pendiente: poner sugerencias en cola; aplicar solo después de aprobación explícita
- modo automático: aplicar actualizaciones seguras de Skills de workspace cuando sean claramente reutilizables

## Costos y comportamiento en tiempo de ejecución

La captura heurística no llama a un modelo.

La revisión con LLM usa una ejecución incrustada en el modelo de agente activo/predeterminado. Está
basada en umbrales, por lo que no se ejecuta en cada turno de forma predeterminada.

El revisor:

- usa el mismo contexto de proveedor/modelo configurado cuando está disponible
- recurre a los valores predeterminados del agente en tiempo de ejecución
- tiene `reviewTimeoutMs`
- usa un contexto de arranque ligero
- no tiene herramientas
- no escribe nada directamente
- solo puede emitir una propuesta que pasa por la ruta normal de escáner y
  aprobación/cuarentena

Si el revisor falla, agota el tiempo de espera o devuelve JSON no válido, el Plugin registra un
mensaje de advertencia/depuración y omite esa pasada de revisión.

## Patrones operativos

Usa Skill Workshop cuando el usuario diga:

- "la próxima vez, haz X"
- "de ahora en adelante, prefiere Y"
- "asegúrate de verificar Z"
- "guarda esto como un flujo de trabajo"
- "esto tomó un tiempo; recuerda el proceso"
- "actualiza el Skill local para esto"

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

Razones por las que la versión deficiente no debería guardarse:

- tiene forma de transcripción
- no es imperativa
- incluye detalles ruidosos de una sola ocasión
- no le indica al siguiente agente qué hacer

## Depuración

Comprueba si el Plugin está cargado:

```bash
openclaw plugins list --enabled
```

Comprueba los conteos de propuestas desde un contexto de agente/herramienta:

```json
{ "action": "status" }
```

Inspecciona las propuestas pendientes:

```json
{ "action": "list_pending" }
```

Inspecciona las propuestas en cuarentena:

```json
{ "action": "list_quarantine" }
```

Síntomas comunes:

| Síntoma                               | Causa probable                                                                      | Comprobación                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| La herramienta no está disponible     | La entrada del Plugin no está habilitada                                             | `plugins.entries.skill-workshop.enabled` y `openclaw plugins list`  |
| No aparece ninguna propuesta automática | `autoCapture: false`, `reviewMode: "off"` o no se alcanzaron los umbrales          | Configuración, estado de propuestas, registros del Gateway          |
| La heurística no capturó              | La redacción del usuario no coincidió con patrones de corrección                    | Usa `skill_workshop.suggest` explícito o habilita el revisor LLM    |
| El revisor no creó una propuesta      | El revisor devolvió `none`, JSON no válido o agotó el tiempo de espera              | Registros del Gateway, `reviewTimeoutMs`, umbrales                  |
| La propuesta no se aplica             | `approvalPolicy: "pending"`                                                         | `list_pending`, luego `apply`                                       |
| La propuesta desapareció de pendientes | Se reutilizó una propuesta duplicada, se podó por máximo de pendientes o fue aplicada/rechazada/puesta en cuarentena | `status`, `list_pending` con filtros de estado, `list_quarantine`   |
| El archivo de Skill existe, pero el modelo no lo ve | La instantánea de Skill no se actualizó o el filtrado de Skill lo excluye          | estado de `openclaw skills` y elegibilidad de Skill de workspace    |

Registros relevantes:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Escenarios de QA

Escenarios de QA respaldados por el repo:

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

El escenario del revisor está separado intencionalmente porque habilita
`reviewMode: "llm"` y ejercita la pasada incrustada del revisor.

## Cuándo no habilitar la aplicación automática

Evita `approvalPolicy: "auto"` cuando:

- el workspace contiene procedimientos sensibles
- el agente está trabajando con entradas no confiables
- los Skills se comparten en un equipo amplio
- todavía estás ajustando prompts o reglas del escáner
- el modelo maneja con frecuencia contenido web/de correo hostil

Usa primero el modo pendiente. Cambia al modo automático solo después de revisar el tipo de
Skills que el agente propone en ese workspace.

## Documentos relacionados

- [Skills](/es/tools/skills)
- [Plugins](/es/tools/plugin)
- [Pruebas](/es/reference/test)
