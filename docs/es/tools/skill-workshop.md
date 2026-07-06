---
read_when:
    - Quieres que el agente cree o actualice una habilidad desde el chat
    - Necesitas revisar, aplicar, rechazar o poner en cuarentena un borrador de habilidad generado
    - Estás configurando la aprobación, la autonomía, el almacenamiento o los límites de Skill Workshop
sidebarTitle: Skill Workshop
summary: Crea y actualiza Skills del espacio de trabajo mediante la revisión de Skill Workshop
title: Taller de Skills
x-i18n:
    generated_at: "2026-07-06T10:54:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6effd3b4fdaff4d8c087343cf67012d52663a0a8b0536677ac1de8aefc1dcc39
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop es la ruta gobernada de OpenClaw para crear y actualizar skills del espacio de trabajo. Los agentes y operadores nunca escriben `SKILL.md` directamente mediante esta ruta: crean una **propuesta** (borrador pendiente con contenido, enlace de destino, estado del escáner, hashes y metadatos de reversión) que solo se convierte en una skill activa cuando se aplica.

Skill Workshop escribe solo skills del espacio de trabajo. Nunca toca skills empaquetadas, de plugin, de ClawHub, de raíz adicional, administradas, de agente personal ni del sistema.

## Cómo funciona

- **Primero la propuesta:** el contenido generado se almacena como `PROPOSAL.md`, no como `SKILL.md`.
- **Aplicar es la única escritura activa:** crear, actualizar y revisar nunca cambian las skills activas.
- **Limitado al espacio de trabajo:** las creaciones apuntan a la raíz `skills/` del espacio de trabajo; las actualizaciones solo se permiten para skills escribibles del espacio de trabajo.
- **Sin sobrescritura:** la creación falla si la skill de destino ya existe.
- **Vinculado por hash:** las propuestas de actualización se vinculan al hash actual del destino y pasan a `stale` si la skill activa cambia antes de aplicar.
- **Controlado por escáner:** aplicar vuelve a ejecutar el escáner de seguridad antes de escribir.
- **Recuperable:** aplicar escribe metadatos de reversión antes de tocar archivos activos.
- **Superficies coherentes:** chat, CLI y Gateway llaman todos al mismo servicio.

## Ciclo de vida

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Solo una propuesta `pending` se puede revisar, aplicar, rechazar o poner en cuarentena.

## Chat

Pide al agente la skill que quieres; llama a `skill_workshop` y devuelve un id de propuesta.

### Aprender del trabajo reciente

Usa `/learn` para convertir la conversación actual o fuentes nombradas en una propuesta de skill guiada por estándares:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Sin una solicitud, `/learn` pide al agente que destile el flujo de trabajo reutilizable de la conversación actual. Con una solicitud, el agente trata rutas, URL, notas pegadas y referencias de conversación como fuentes, respetando requisitos de foco, alcance y nombres. Reúne las fuentes con sus herramientas existentes y luego llama a `skill_workshop` con `action: "create"`.

La propuesta resultante permanece `pending`; `/learn` nunca la aplica. Revísala y aplícala mediante el flujo de aprobación normal o con `openclaw skills workshop`.

Crear:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Actualizar una skill existente del espacio de trabajo:

```text
Update trip-planning to also check seat maps before booking.
```

Iterar sobre una propuesta pendiente:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Las acciones `apply`, `reject` y `quarantine` iniciadas por el agente muestran un aviso de aprobación de forma predeterminada. Define `skills.workshop.approvalPolicy` como `"auto"` para omitirlo en entornos de confianza.

El aviso identifica el id de propuesta y la skill de destino, y muestra la descripción de la propuesta, el recuento de archivos de soporte y el tamaño del cuerpo. Las solicitudes de aprobación están acotadas para terminar antes del vigilante de herramientas del agente. Si no llega ninguna decisión antes de que caduque el aviso, la acción de ciclo de vida no se ejecuta: la propuesta sigue pendiente y sin cambios. Decide más tarde en la UI de Skill Workshop o ejecuta `openclaw skills workshop apply|reject|quarantine <proposal-id>`. Los agentes no deberían reintentar en bucle una acción de ciclo de vida caducada.

## CLI

```bash
# Create
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# Update an existing workspace skill
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# List and inspect
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revise before approval
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Close out
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Cada subcomando acepta `--agent <id>` (espacio de trabajo de destino; por defecto se infiere desde cwd y luego usa el agente predeterminado) y `--json` (salida estructurada). `propose-create`, `propose-update` y `revise` también aceptan `--goal <text>` y `--evidence <text>` para registrar contexto de la propuesta junto con `--proposal`.

## Contenido de la propuesta

Mientras está pendiente, la propuesta se almacena como `PROPOSAL.md` con frontmatter exclusivo de propuesta:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Al aplicar, Skill Workshop escribe el `SKILL.md` activo y elimina los campos exclusivos de propuesta: `status`, `version` de la propuesta y `date` de la propuesta.

## Archivos de soporte

Usa `--proposal-dir` cuando la skill propuesta necesita archivos junto a `PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

El directorio debe contener `PROPOSAL.md`. Los archivos de soporte deben vivir bajo `assets/`, `examples/`, `references/`, `scripts/` o `templates/`. Skill Workshop los escanea, genera hashes y los almacena con la propuesta; luego los escribe junto al `SKILL.md` activo solo al aplicar.

Rutas de archivos de soporte rechazadas: rutas absolutas, segmentos de ruta ocultos, recorrido de rutas, rutas superpuestas, archivos ejecutables, texto que no sea UTF-8, bytes nulos y rutas fuera de las carpetas estándar de soporte.

## Herramienta del agente

El modelo usa `skill_workshop` con una `action` obligatoria:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Otros parámetros se aplican según la acción:

| Parámetro                  | Usado por                                             | Notas                                                                      |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                         | Obligatorio para `create`; en caso contrario, resuelve una propuesta pendiente por nombre |
| `description`              | `create`, `update`, `revise`                          | Máximo 160 bytes                                                           |
| `skill_name`               | `update`                                              | Nombre o clave de skill existente                                          |
| `proposal_content`         | `create`, `update`, `revise`                          | Almacenado como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                          | Matriz de `{ path, content }`                                              |
| `goal`, `evidence`         | `create`, `update`, `revise`                          | Contexto de texto libre                                                    |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`  | Propuesta de destino                                                       |
| `reason`                   | `apply`, `reject`, `quarantine`                       | Opcional                                                                   |
| `query`, `status`, `limit` | `list`                                                | Filtrar/paginar; `limit` máximo 50, predeterminado 20                      |

Los agentes deben usar `skill_workshop` para el trabajo de skills generadas. No deben crear ni cambiar archivos de propuesta mediante `write`, `edit`, `exec`, comandos de shell u operaciones directas del sistema de archivos.

<Note>
`skill_workshop` es una herramienta de agente integrada y se incluye en
`tools.profile: "coding"`. Si una política más estricta la oculta, añade
`skill_workshop` a la lista activa `tools.allow`, o usa
`tools.alsoAllow: ["skill_workshop"]` cuando el alcance usa un perfil sin un
`tools.allow` explícito. Las ejecuciones en sandbox no construyen la
herramienta Skill Workshop del lado del host, así que ejecuta las acciones de revisión de propuestas desde una sesión normal de agente del lado del host o desde la CLI.
</Note>

## Skills sugeridas

OpenClaw detecta instrucciones duraderas como “la próxima vez”, “recuerda” y correcciones reactivas cuando termina un turno interactivo, incluidos los turnos fallidos. En el siguiente turno, el agente ofrece guardar el flujo de trabajo detectado más reciente mediante `skill_workshop`; el usuario decide si crear una propuesta. Esta sugerencia integrada no crea ni cambia una skill por sí sola. Habilita `skills.workshop.autonomous.enabled` para crear propuestas pendientes directamente en su lugar.

## Aprobación y autonomía

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Configuración              | Predeterminado | Efecto                                                                                                                                                                 |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`        | Crea propuestas pendientes directamente en lugar de ofrecer el flujo de trabajo detectado más reciente en el siguiente turno.                                           |
| `allowSymlinkTargetWrites` | `false`        | Permite que aplicar escriba a través de enlaces simbólicos de skills del espacio de trabajo cuyo destino real aparece en `skills.load.allowSymlinkTargets`.             |
| `approvalPolicy`           | `"pending"`    | `"pending"` requiere un aviso de aprobación antes de acciones `apply`, `reject` o `quarantine` iniciadas por el agente. `"auto"` omite el aviso (el agente aún debe llamar a la acción). |
| `maxPending`               | `50`           | Limita propuestas pendientes y en cuarentena por espacio de trabajo (1-200).                                                                                           |
| `maxSkillBytes`            | `40000`        | Limita el tamaño del cuerpo de la propuesta en bytes (1024-200000).                                                                                                    |

La captura autónoma reconoce reglas prospectivas (por ejemplo, “de ahora en adelante”) y correcciones reactivas (por ejemplo, “eso no es lo que pedí”). Agrupa instrucciones nuevas por tema en hasta tres propuestas por turno, enruta coincidencias de vocabulario a skills existentes escribibles del espacio de trabajo y revisa su propia propuesta pendiente cuando otra corrección apunta a la misma skill.

Las descripciones de propuestas siempre están limitadas a 160 bytes, independientemente de `maxSkillBytes`.

## Métodos de Gateway

| Método                             | Alcance          |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |

`requestRevision` es solo de Gateway (sin equivalente de CLI ni de herramienta de agente): reenvía instrucciones de revisión de texto libre a la sesión de chat del agente propietario en lugar de reemplazar `PROPOSAL.md` directamente, para las UI que piden al agente revisar en lugar de enviar contenido nuevo literal.

## Almacenamiento

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Directorio de estado predeterminado: `~/.openclaw`.

- `proposal.json`: registro canónico de la propuesta.
- `proposals.json`: índice de listado rápido, reconstruible desde las carpetas de propuestas.
- `PROPOSAL.md`: propuesta de Skill pendiente.
- `rollback.json`: metadatos de recuperación escritos antes de aplicar cambios a archivos activos.

## Límites

| Límite                          | Valor                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Descripción                     | 160 bytes                                                            |
| Cuerpo de la propuesta          | `skills.workshop.maxSkillBytes` (predeterminado 40,000; límite máximo estricto 1 MiB) |
| Archivos de soporte             | 64 por propuesta                                                     |
| Tamaño de archivo de soporte    | 256 KiB cada uno, 2 MiB en total                                     |
| Propuestas pendientes + en cuarentena | `skills.workshop.maxPending` por espacio de trabajo (predeterminado 50) |

## Solución de problemas

| Problema                                       | Solución                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Acorta `description` a 160 bytes o menos.                                                                                                                                                                  |
| `Skill proposal content is too large`          | Acorta el cuerpo de la propuesta o aumenta `skills.workshop.maxSkillBytes`.                                                                                                                                 |
| `Target skill changed after proposal creation` | Revisa la propuesta contra el destino actual o crea una propuesta nueva.                                                                                                                                    |
| `Proposal scan failed`                         | Inspecciona los hallazgos del escáner y luego revisa o pon en cuarentena la propuesta.                                                                                                                      |
| `untrusted symlink target`                     | Configura `skills.load.allowSymlinkTargets` y habilita `skills.workshop.allowSymlinkTargetWrites` solo para raíces de Skills compartidas intencionales.                                                     |
| `Support file paths must be under one of...`   | Mueve los archivos de soporte bajo `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                       |
| La propuesta no aparece en la lista            | Comprueba el espacio de trabajo `--agent` seleccionado y `OPENCLAW_STATE_DIR`.                                                                                                                              |
| El agente no puede llamar a `skill_workshop`   | Comprueba la política de herramientas activa y el modo de ejecución. `coding` incluye la herramienta; las políticas restrictivas de `tools.allow` deben enumerarla explícitamente, y las ejecuciones en sandbox deben usar una sesión normal de agente del lado del host o la CLI. |

### Diagnóstico de política de herramientas

Cuando la captura autónoma está habilitada, `openclaw doctor` ejecuta la
comprobación `core/doctor/skill-workshop-tool-policy` para el agente
predeterminado. Si la política oculta `skill_workshop`, la advertencia nombra la
primera capa de configuración excluyente y el cambio exacto de `allow` o
`alsoAllow` que se debe hacer. Los runbooks antiguos aún pueden usar
`openclaw plugins inspect skill-workshop`; ese comando ahora explica que Skill
Workshop está integrado e imprime la misma sugerencia de política cuando
corresponde.

## Relacionado

- [Skills](/es/tools/skills) para el orden de carga, la precedencia y la visibilidad
- [Crear Skills](/es/tools/creating-skills) para los conceptos básicos de `SKILL.md`
  escrito a mano
- [Configuración de Skills](/es/tools/skills-config) para el esquema completo de `skills.workshop`
- [CLI de Skills](/es/cli/skills) para los comandos `openclaw skills`
