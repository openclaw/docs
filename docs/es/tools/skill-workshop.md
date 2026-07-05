---
read_when:
    - Quieres que el agente cree o actualice una Skill desde el chat
    - Necesitas revisar, aplicar, rechazar o poner en cuarentena un borrador de skill generado
    - Estás configurando la aprobación, autonomía, almacenamiento o límites de Skill Workshop
sidebarTitle: Skill Workshop
summary: Crear y actualizar Skills del espacio de trabajo mediante la revisión de Skill Workshop
title: Taller de Skills
x-i18n:
    generated_at: "2026-07-05T11:51:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f5c2c11d4a170c98cc91cfb522a4de26e1fe76eba57da3df8072708584ce179
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop es la ruta gobernada de OpenClaw para crear y actualizar Skills del espacio de trabajo. Los agentes y operadores nunca escriben `SKILL.md` directamente por esta ruta: crean una **propuesta** (borrador pendiente con contenido, vinculación de destino, estado del escáner, hashes y metadatos de reversión) que se convierte en un Skill activo solo cuando se aplica.

Skill Workshop escribe únicamente Skills del espacio de trabajo. Nunca toca Skills integrados, de Plugin, ClawHub, de raíz adicional, administrados, de agente personal ni del sistema.

## Cómo funciona

- **Primero la propuesta:** el contenido generado se almacena como `PROPOSAL.md`, no como `SKILL.md`.
- **Aplicar es la única escritura activa:** crear, actualizar y revisar nunca cambian los Skills activos.
- **Limitado al espacio de trabajo:** las creaciones apuntan a la raíz `skills/` del espacio de trabajo; las actualizaciones solo se permiten para Skills de espacio de trabajo con escritura habilitada.
- **Sin sobrescritura:** la creación falla si el Skill de destino ya existe.
- **Vinculado por hash:** las propuestas de actualización se vinculan al hash actual del destino y pasan a `stale` si el Skill activo cambia antes de aplicar.
- **Controlado por escáner:** al aplicar, se vuelve a ejecutar el escáner de seguridad antes de escribir.
- **Recuperable:** al aplicar, se escriben metadatos de reversión antes de tocar archivos activos.
- **Superficies coherentes:** chat, CLI y Gateway llaman al mismo servicio.

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

Pide al agente el Skill que quieres; este llama a `skill_workshop` y devuelve un id de propuesta.

Crear:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Actualizar un Skill existente del espacio de trabajo:

```text
Update trip-planning to also check seat maps before booking.
```

Iterar sobre una propuesta pendiente:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Las acciones `apply`, `reject` y `quarantine` iniciadas por el agente muestran una solicitud de aprobación de forma predeterminada. Configura `skills.workshop.approvalPolicy` en `"auto"` para omitirla en entornos de confianza.

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

Cada subcomando acepta `--agent <id>` (espacio de trabajo de destino; de forma predeterminada se infiere desde cwd y luego se usa el agente predeterminado) y `--json` (salida estructurada). `propose-create`, `propose-update` y `revise` también aceptan `--goal <text>` y `--evidence <text>` para registrar el contexto de la propuesta junto con `--proposal`.

## Contenido de la propuesta

Mientras está pendiente, la propuesta se almacena como `PROPOSAL.md` con frontmatter exclusivo de la propuesta:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Al aplicar, Skill Workshop escribe el `SKILL.md` activo y elimina los campos exclusivos de la propuesta: `status`, `version` de la propuesta y `date` de la propuesta.

## Archivos de soporte

Usa `--proposal-dir` cuando el Skill propuesto necesite archivos junto a `PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

El directorio debe contener `PROPOSAL.md`. Los archivos de soporte deben residir bajo `assets/`, `examples/`, `references/`, `scripts/` o `templates/`. Skill Workshop los escanea, calcula sus hashes y los almacena con la propuesta; luego los escribe junto al `SKILL.md` activo solo al aplicar.

Rutas de archivos de soporte rechazadas: rutas absolutas, segmentos de ruta ocultos, recorrido de rutas, rutas superpuestas, archivos ejecutables, texto que no sea UTF-8, bytes nulos y rutas fuera de las carpetas de soporte estándar.

## Herramienta del agente

El modelo usa `skill_workshop` con una `action` obligatoria:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Otros parámetros se aplican según la acción:

| Parámetro                  | Usado por                                             | Notas                                                                 |
| -------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Obligatorio para `create`; en otros casos resuelve una propuesta pendiente por nombre |
| `description`              | `create`, `update`, `revise`                         | Máximo 160 bytes                                                      |
| `skill_name`               | `update`                                             | Nombre o clave de Skill existente                                     |
| `proposal_content`         | `create`, `update`, `revise`                         | Se almacena como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Array de `{ path, content }`                                          |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contexto de texto libre                                               |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Propuesta de destino                                                  |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opcional                                                              |
| `query`, `status`, `limit` | `list`                                               | Filtrar/paginar; `limit` máximo 50, predeterminado 20                 |

Los agentes deben usar `skill_workshop` para el trabajo de Skills generados. No deben crear ni cambiar archivos de propuesta mediante `write`, `edit`, `exec`, comandos de shell u operaciones directas del sistema de archivos.

<Note>
`skill_workshop` es una herramienta integrada del agente y se incluye en `tools.profile: "coding"`. Si una política más estricta la oculta, agrega `skill_workshop` a la lista activa `tools.allow`, o usa `tools.alsoAllow: ["skill_workshop"]` cuando el alcance use un perfil sin un `tools.allow` explícito. Las ejecuciones en sandbox no construyen la herramienta Skill Workshop del lado del host, así que ejecuta las acciones de revisión de propuestas desde una sesión normal de agente del lado del host o desde la CLI.
</Note>

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

| Configuración              | Valor predeterminado | Efecto                                                                                                                                                                |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | Permite que OpenClaw cree propuestas pendientes a partir de señales duraderas de conversación después de un turno correcto.                                            |
| `allowSymlinkTargetWrites` | `false`     | Permite que aplicar escriba a través de enlaces simbólicos de Skills del espacio de trabajo cuyo destino real esté listado en `skills.load.allowSymlinkTargets`.       |
| `approvalPolicy`           | `"pending"` | `"pending"` exige una solicitud de aprobación antes de `apply`, `reject` o `quarantine` iniciados por el agente. `"auto"` omite la solicitud (el agente aún debe llamar a la acción). |
| `maxPending`               | `50`        | Limita las propuestas pendientes y en cuarentena por espacio de trabajo (1-200).                                                                                       |
| `maxSkillBytes`            | `40000`     | Limita el tamaño del cuerpo de la propuesta en bytes (1024-200000).                                                                                                    |

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

`requestRevision` es exclusivo de Gateway (sin equivalente en CLI ni en herramienta de agente): reenvía instrucciones de revisión de texto libre a la sesión de chat del agente propietario en lugar de reemplazar `PROPOSAL.md` directamente, para interfaces de usuario que piden al agente revisar en vez de enviar contenido nuevo literal.

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
- `rollback.json`: metadatos de recuperación escritos antes de que aplicar cambie archivos activos.

## Límites

| Límite                          | Valor                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Descripción                     | 160 bytes                                                            |
| Cuerpo de la propuesta          | `skills.workshop.maxSkillBytes` (predeterminado 40.000; techo estricto 1 MiB) |
| Archivos de soporte             | 64 por propuesta                                                     |
| Tamaño de archivo de soporte    | 256 KiB cada uno, 2 MiB en total                                     |
| Propuestas pendientes + en cuarentena | `skills.workshop.maxPending` por espacio de trabajo (predeterminado 50) |

## Solución de problemas

| Problema                                      | Resolución                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Skill proposal description is too large`      | Acorta `description` a 160 bytes o menos.                                                                                                                                                                          |
| `Skill proposal content is too large`          | Acorta el cuerpo de la propuesta o aumenta `skills.workshop.maxSkillBytes`.                                                                                                                                        |
| `Target skill changed after proposal creation` | Revisa la propuesta contra el destino actual o crea una propuesta nueva.                                                                                                                                            |
| `Proposal scan failed`                         | Inspecciona los hallazgos del escáner y luego revisa o pon en cuarentena la propuesta.                                                                                                                             |
| `untrusted symlink target`                     | Configura `skills.load.allowSymlinkTargets` y habilita `skills.workshop.allowSymlinkTargetWrites` solo para raíces de Skills compartidas intencionales.                                                            |
| `Support file paths must be under one of...`   | Mueve los archivos de soporte bajo `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                               |
| La propuesta no aparece en la lista            | Comprueba el espacio de trabajo `--agent` seleccionado y `OPENCLAW_STATE_DIR`.                                                                                                                                      |
| El agente no puede llamar a `skill_workshop`   | Comprueba la política de herramientas activa y el modo de ejecución. `coding` incluye la herramienta; las políticas restrictivas de `tools.allow` deben enumerarla explícitamente, y las ejecuciones en sandbox deben usar una sesión normal de agente del lado del host o la CLI. |

## Relacionado

- [Skills](/es/tools/skills) para el orden de carga, la precedencia y la visibilidad
- [Crear Skills](/es/tools/creating-skills) para los conceptos básicos de `SKILL.md`
  escritos a mano
- [Configuración de Skills](/es/tools/skills-config) para el esquema completo de `skills.workshop`
- [CLI de Skills](/es/cli/skills) para los comandos de `openclaw skills`
