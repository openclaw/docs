---
read_when:
    - Quiere que el agente cree o actualice una skill desde el chat
    - Debe revisar, aplicar, rechazar o poner en cuarentena un borrador de habilidad generado
    - Estás configurando la aprobación, la autonomía, el almacenamiento o los límites de Skill Workshop
sidebarTitle: Skill Workshop
summary: Crear y actualizar Skills del espacio de trabajo mediante la revisión de Skill Workshop
title: Taller de Skills
x-i18n:
    generated_at: "2026-06-27T13:08:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Taller de habilidades es la ruta gobernada de OpenClaw para crear y actualizar habilidades del espacio de trabajo.

Los agentes y operadores no escriben archivos `SKILL.md` activos directamente mediante esta ruta. Primero crean una **propuesta**. Una propuesta es un borrador pendiente que contiene el contenido de habilidad propuesto, la vinculación de destino, el estado del escáner, hashes, metadatos de archivos de soporte y metadatos de reversión. Se convierte en una habilidad activa solo cuando se aplica.

Taller de habilidades solo escribe habilidades del espacio de trabajo. No modifica habilidades incluidas, de plugin, ClawHub, raíz adicional, administradas, de agente personal ni del sistema.

## Cómo funciona

- **Primero la propuesta:** el contenido de habilidad generado se almacena como `PROPOSAL.md`, no como `SKILL.md`.
- **Aplicar es la única escritura activa:** crear, actualizar y revisar no cambian habilidades activas.
- **Con alcance de espacio de trabajo:** las creaciones tienen como destino la raíz `skills/` del espacio de trabajo. Las actualizaciones solo se permiten para habilidades del espacio de trabajo editables.
- **Sin sobrescritura:** la creación falla si la habilidad de destino ya existe.
- **Vinculada por hash:** las propuestas de actualización se vinculan al hash actual del destino y quedan obsoletas si la habilidad activa cambia antes de aplicar.
- **Controlada por escáner:** aplicar vuelve a ejecutar el escaneo antes de escribir.
- **Recuperable:** aplicar escribe metadatos de reversión antes de cambiar archivos activos.
- **Superficies coherentes:** chat, CLI y Gateway llaman todos al mismo servicio de Taller de habilidades.

## Ciclo de vida

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Solo las propuestas `pending` pueden revisarse, aplicarse, rechazarse o ponerse en cuarentena.

## Chat

Pide al agente la habilidad que quieres. El agente llama a `skill_workshop` y devuelve un id de propuesta.

Crear:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Actualizar una habilidad existente del espacio de trabajo:

```text
Update trip-planning to also check seat maps before booking.
```

Iterar sobre una propuesta pendiente:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

De forma predeterminada, `apply`, `reject` y `quarantine` iniciados por el agente muestran una solicitud de aprobación antes de ejecutarse. Establece `skills.workshop.approvalPolicy` en `"auto"` para omitir la solicitud en entornos de confianza.

## CLI

Crear una nueva propuesta de habilidad:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Crear una propuesta de actualización para una habilidad existente del espacio de trabajo:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Listar e inspeccionar:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Revisar antes de la aprobación:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Cerrar la propuesta:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

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

Al aplicar, el Taller de Skills escribe el `SKILL.md` activo y elimina los
campos exclusivos de la propuesta: `status`, `version` de propuesta y `date` de propuesta.

## Archivos auxiliares

Usa `--proposal-dir` cuando la skill propuesta necesite archivos junto a `PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

El directorio debe contener `PROPOSAL.md`. Los archivos auxiliares deben estar en:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

El Taller de Skills escanea, genera hashes y almacena los archivos auxiliares con la propuesta. Se
escriben junto al `SKILL.md` activo solo al aplicar.

Las rutas de archivos auxiliares rechazadas incluyen rutas absolutas, segmentos
ocultos de ruta, recorrido de rutas, rutas superpuestas, archivos ejecutables de directorios de propuesta,
texto que no sea UTF-8, bytes nulos y archivos fuera de las carpetas auxiliares estándar.

## Herramienta de agente

El modelo usa `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Los agentes deben usar `skill_workshop` para el trabajo de Skills generadas. No deben crear
ni cambiar archivos de propuesta mediante `write`, `edit`, `exec`, comandos de shell ni
operaciones directas del sistema de archivos.

<Note>
`skill_workshop` es una herramienta de agente integrada y está incluida en
`tools.profile: "coding"`. Si una política más estricta la oculta, añade
`skill_workshop` a la lista activa `tools.allow`, o usa
`tools.alsoAllow: ["skill_workshop"]` cuando el alcance use un perfil sin un
`tools.allow` explícito. Las ejecuciones en sandbox no construyen la herramienta
Taller de Skills del lado del host, así que ejecuta las acciones de revisión de propuestas desde una sesión
normal de agente del lado del host o desde la CLI.
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

- `autonomous.enabled`: permite que OpenClaw cree propuestas pendientes a partir de señales
  duraderas de conversación después de turnos correctos. Valor predeterminado: `false`.
- `allowSymlinkTargetWrites`: permite que apply escriba a través de enlaces simbólicos de Skills del workspace
  cuyo destino real esté listado en `skills.load.allowSymlinkTargets`.
  Valor predeterminado: `false`.
- `approvalPolicy: "pending"`: requiere una solicitud de aprobación antes de
  `apply`, `reject` o `quarantine` iniciados por el agente.
- `approvalPolicy: "auto"`: omite esa solicitud de aprobación. El agente aún debe
  llamar a la acción.
- `maxPending`: limita las propuestas pendientes y en cuarentena por workspace.
- `maxSkillBytes`: limita el tamaño del cuerpo de la propuesta. Valor predeterminado: `40000`.

Las descripciones de propuestas siempre tienen un límite de 160 bytes.

## Métodos de Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Los métodos de solo lectura requieren `operator.read`. Los métodos que modifican requieren
`operator.admin`.

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
- `PROPOSAL.md`: propuesta de skill pendiente.
- `rollback.json`: metadatos de recuperación escritos antes de aplicar cambios a archivos activos.

## Límites

- Descripción: 160 bytes.
- Cuerpo de la propuesta: `skills.workshop.maxSkillBytes` (valor predeterminado 40,000).
- Archivos auxiliares: 64 por propuesta.
- Tamaño de archivo auxiliar: 256 KB cada uno, 2 MB en total.
- Propuestas pendientes y en cuarentena: `skills.workshop.maxPending` por workspace
  (valor predeterminado 50).

## Solución de problemas

| Problema                                       | Resolución                                                                                                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Acorta `description` a 160 bytes o menos.                                                                                                                                                                  |
| `Skill proposal content is too large`          | Acorta el cuerpo de la propuesta o aumenta `skills.workshop.maxSkillBytes`.                                                                                                                                |
| `Target skill changed after proposal creation` | Revisa la propuesta contra el destino actual, o crea una propuesta nueva.                                                                                                                                  |
| `Proposal scan failed`                         | Inspecciona los hallazgos del escáner y luego revisa o pon en cuarentena la propuesta.                                                                                                                     |
| `untrusted symlink target`                     | Configura `skills.load.allowSymlinkTargets` y habilita `skills.workshop.allowSymlinkTargetWrites` solo para raíces de Skills compartidas intencionales.                                                    |
| `Support file paths must be under one of...`   | Mueve los archivos auxiliares a `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                          |
| La propuesta no aparece en la lista            | Comprueba el workspace `--agent` seleccionado y `OPENCLAW_STATE_DIR`.                                                                                                                                      |
| El agente no puede llamar a `skill_workshop`   | Comprueba la política de herramientas activa y el modo de ejecución. `coding` incluye la herramienta; las políticas restrictivas de `tools.allow` deben listarla explícitamente, y las ejecuciones en sandbox deben usar una sesión normal de agente del lado del host o la CLI. |

## Relacionado

- [Skills](/es/tools/skills) para el orden de carga, la precedencia y la visibilidad
- [Crear Skills](/es/tools/creating-skills) para los conceptos básicos de `SKILL.md`
  escritos a mano
- [Configuración de Skills](/es/tools/skills-config) para el esquema completo de `skills.workshop`
- [CLI de Skills](/es/cli/skills) para comandos `openclaw skills`
