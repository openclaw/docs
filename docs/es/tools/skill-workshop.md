---
read_when:
    - Quieres que el agente cree o actualice una Skill desde el chat
    - Debes revisar, aplicar, rechazar o poner en cuarentena un borrador de skill generado
    - Estás configurando la aprobación, la autonomía, el almacenamiento o los límites de Skill Workshop
sidebarTitle: Skill Workshop
summary: Crea y actualiza Skills del espacio de trabajo mediante la revisión de Skill Workshop
title: Taller de Skills
x-i18n:
    generated_at: "2026-07-11T23:35:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop es la vía regida de OpenClaw para crear y actualizar Skills del espacio de trabajo. Los agentes y operadores nunca escriben `SKILL.md` directamente mediante esta vía: crean una **propuesta** (un borrador pendiente con contenido, vinculación de destino, estado del analizador, hashes y metadatos de reversión) que solo se convierte en una Skill activa cuando se aplica.

Skill Workshop solo escribe Skills del espacio de trabajo. Nunca modifica Skills incluidas, de plugins, de ClawHub, de raíces adicionales, gestionadas, de agentes personales ni del sistema.

## Cómo funciona

- **Primero la propuesta:** el contenido generado se almacena como `PROPOSAL.md`, no como `SKILL.md`.
- **Aplicar es la única escritura activa:** crear, actualizar y revisar nunca modifican las Skills activas.
- **Limitado al espacio de trabajo:** las creaciones tienen como destino la raíz `skills/` del espacio de trabajo; las actualizaciones solo se permiten para Skills editables del espacio de trabajo.
- **Sin sobrescritura:** la creación falla si la Skill de destino ya existe.
- **Vinculación por hash:** las propuestas de actualización se vinculan al hash actual del destino y pasan a `stale` si la Skill activa cambia antes de aplicarlas.
- **Sujeto al analizador:** al aplicar, se vuelve a ejecutar el analizador de seguridad antes de escribir.
- **Recuperable:** al aplicar, se escriben metadatos de reversión antes de modificar los archivos activos.
- **Interfaces coherentes:** el chat, la CLI y el Gateway llaman al mismo servicio.

## Ciclo de vida

```text
crear/actualizar -> pendiente
revisar          -> pendiente
aplicar          -> aplicada
rechazar         -> rechazada
poner en cuarentena -> en cuarentena
cambio de destino -> obsoleta
```

Solo se puede revisar, aplicar, rechazar o poner en cuarentena una propuesta `pending`.

## Gestión del ciclo de vida

El Gateway registra el uso agregado de Skills en la base de datos de estado compartida. Una vez al día, revisa las Skills creadas y aplicadas por Skill Workshop. Las Skills que no se hayan usado durante más de 30 días pasan a `stale`; después de 90 días pasan a `archived` y se excluyen de las nuevas instantáneas de Skills de los agentes. Los archivos de las Skills archivadas permanecen sin cambios en el disco. Las Skills creadas manualmente nunca se gestionan; solo las creadas mediante propuestas de Skill Workshop entran en la gestión del ciclo de vida.

Las Skills fijadas omiten las transiciones del ciclo de vida. Una Skill obsoleta vuelve a `active` después de usarse y de que se ejecute la siguiente revisión. Las Skills archivadas solo vuelven mediante una restauración explícita:

Las transiciones del ciclo de vida y las restauraciones se aplican a las sesiones nuevas; las sesiones en ejecución conservan su instantánea actual de Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Todos los comandos del gestor aceptan `--json`. El estado también informa de candidatos deterministas a solapamiento solo como sugerencias; nunca fusiona Skills ni llama a un modelo.

## Chat

Pide al agente la Skill que quieras; este llama a `skill_workshop` y devuelve un identificador de propuesta.

### Aprender del trabajo reciente

Usa `/learn` para convertir la conversación actual o fuentes específicas en una propuesta de Skill guiada por estándares:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Sin una solicitud, `/learn` pide al agente que extraiga de la conversación actual el flujo de trabajo reutilizable. Con una solicitud, el agente trata las rutas, las URL, las notas pegadas y las referencias a la conversación como fuentes, respetando los requisitos de enfoque, alcance y nomenclatura. Recopila las fuentes con sus herramientas existentes y después llama a `skill_workshop` con `action: "create"`.

La propuesta resultante permanece en estado `pending`; `/learn` nunca la aplica. Revísala y aplícala mediante el flujo de aprobación normal o con `openclaw skills workshop`.

Crear:

```text
Crea una Skill llamada morning-catchup que ejecute mi rutina de la bandeja de entrada de los lunes.
```

Actualizar una Skill existente del espacio de trabajo:

```text
Actualiza trip-planning para que también compruebe los mapas de asientos antes de reservar.
```

Iterar sobre una propuesta pendiente:

```text
Muéstrame la propuesta morning-catchup.
Revísala para que también marque todo lo señalado como urgente.
Aplica la propuesta morning-catchup.
```

Las acciones `apply`, `reject` y `quarantine` iniciadas por el agente muestran de forma predeterminada una solicitud de aprobación. Establece `skills.workshop.approvalPolicy` en `"auto"` para omitirla en entornos de confianza.

La solicitud identifica el id. de la propuesta y la Skill de destino, y muestra la descripción de la propuesta, el número de archivos auxiliares y el tamaño del cuerpo. Las solicitudes de aprobación están limitadas para que finalicen antes que el mecanismo de supervisión de herramientas del agente. Si no se recibe ninguna decisión antes de que caduque la solicitud, la acción del ciclo de vida no se ejecuta: la propuesta permanece pendiente y sin cambios. Decide más tarde en la interfaz de Skill Workshop o ejecuta `openclaw skills workshop apply|reject|quarantine <proposal-id>`. Los agentes no deben volver a intentar en bucle una acción del ciclo de vida caducada.

## CLI

```bash
# Crear
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# Actualizar una Skill existente del espacio de trabajo
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Listar e inspeccionar
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisar antes de la aprobación
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Cerrar
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Cada subcomando acepta `--agent <id>` (espacio de trabajo de destino; de forma predeterminada, el inferido a partir del directorio de trabajo actual y, después, el agente predeterminado) y `--json` (salida estructurada). `propose-create`, `propose-update` y `revise` también aceptan `--goal <text>` y `--evidence <text>` para registrar el contexto de la propuesta junto con `--proposal`.

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

Al aplicarla, Skill Workshop escribe el archivo `SKILL.md` activo y elimina los campos exclusivos de la propuesta: `status`, la `version` de la propuesta y la `date` de la propuesta.

## Archivos auxiliares

Usa `--proposal-dir` cuando la Skill propuesta necesite archivos junto a `PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

El directorio debe contener `PROPOSAL.md`. Los archivos auxiliares deben estar en `assets/`, `examples/`, `references/`, `scripts/` o `templates/`. Skill Workshop los analiza, calcula sus hashes y los almacena con la propuesta; solo al aplicarla los escribe junto al archivo `SKILL.md` activo.

Rutas de archivos auxiliares rechazadas: rutas absolutas, segmentos de ruta ocultos, recorridos de directorios, rutas solapadas, archivos ejecutables, texto que no sea UTF-8, bytes nulos y rutas fuera de las carpetas auxiliares estándar.

## Herramienta del agente

El modelo usa `skill_workshop` con una `action` obligatoria:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Los demás parámetros se aplican según la acción:

| Parámetro                  | Usado por                                             | Notas                                                                         |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                         | Obligatorio para `create`; en los demás casos, resuelve una propuesta pendiente por nombre |
| `description`              | `create`, `update`, `revise`                          | Máximo de 160 bytes                                                           |
| `skill_name`               | `update`                                              | Nombre o clave de una Skill existente                                         |
| `proposal_content`         | `create`, `update`, `revise`                          | Se almacena como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes`  |
| `support_files`            | `create`, `update`, `revise`                          | Matriz de `{ path, content }`                                                  |
| `goal`, `evidence`         | `create`, `update`, `revise`                          | Contexto de texto libre                                                       |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`  | Propuesta de destino                                                          |
| `reason`                   | `apply`, `reject`, `quarantine`                       | Opcional                                                                      |
| `query`, `status`, `limit` | `list`                                                | Filtra/pagina; máximo de 50 para `limit`, valor predeterminado de 20          |

Los agentes deben usar `skill_workshop` para el trabajo generado sobre Skills. No deben crear ni modificar archivos de propuestas mediante `write`, `edit`, `exec`, comandos de shell ni operaciones directas del sistema de archivos.

<Note>
`skill_workshop` es una herramienta integrada del agente y está incluida en `tools.profile: "coding"`. Si una política más estricta la oculta, añade `skill_workshop` a la lista activa `tools.allow` o usa `tools.alsoAllow: ["skill_workshop"]` cuando el ámbito utilice un perfil sin un `tools.allow` explícito. Las ejecuciones en entornos aislados no construyen la herramienta Skill Workshop del lado del host, por lo que las acciones de revisión de propuestas deben ejecutarse desde una sesión normal del agente en el host o mediante la CLI.
</Note>

## Skills sugeridas

OpenClaw detecta instrucciones duraderas como «la próxima vez», «recuerda» y correcciones reactivas cuando finaliza un turno interactivo, incluidos los turnos fallidos. En el siguiente turno, el agente ofrece guardar el flujo de trabajo detectado más reciente mediante `skill_workshop`; el usuario decide si crea una propuesta. Esta sugerencia integrada no crea ni modifica ninguna Skill por sí sola. Activa `skills.workshop.autonomous.enabled` para crear directamente propuestas pendientes.

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

| Configuración               | Valor predeterminado | Efecto                                                                                                                                                                             |
| --------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`        | `false`              | Crea directamente propuestas pendientes en lugar de ofrecer el flujo de trabajo detectado más reciente en el siguiente turno.                                                      |
| `allowSymlinkTargetWrites`  | `false`              | Permite que la aplicación escriba a través de enlaces simbólicos de Skills del espacio de trabajo cuyo destino real figure en `skills.load.allowSymlinkTargets`.                    |
| `approvalPolicy`            | `"pending"`          | `"pending"` requiere una solicitud de aprobación antes de que el agente inicie `apply`, `reject` o `quarantine`. `"auto"` omite la solicitud (el agente aún debe llamar a la acción). |
| `maxPending`                | `50`                 | Limita las propuestas pendientes y en cuarentena por espacio de trabajo (1-200).                                                                                                    |
| `maxSkillBytes`             | `40000`              | Limita el tamaño del cuerpo de la propuesta en bytes (1024-200000).                                                                                                                 |

La captura autónoma reconoce reglas prospectivas (por ejemplo, «a partir de ahora») y correcciones reactivas (por ejemplo, «eso no es lo que pedí»). Agrupa las instrucciones nuevas por tema en un máximo de tres propuestas por turno, dirige las coincidencias de vocabulario a Skills editables existentes del espacio de trabajo y revisa su propia propuesta pendiente cuando otra corrección se dirige a la misma Skill.

Las descripciones de las propuestas siempre están limitadas a 160 bytes, independientemente de `maxSkillBytes`.

## Métodos del Gateway

| Método                             | Ámbito           |
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
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` solo está disponible en el Gateway (no existe un equivalente en la CLI ni en las herramientas del agente): reenvía instrucciones de revisión en texto libre a la sesión de chat del agente propietario, en lugar de reemplazar directamente `PROPOSAL.md`, para interfaces de usuario que solicitan al agente que revise la propuesta en vez de enviar literalmente contenido nuevo.

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
- `proposals.json`: índice para listados rápidos, que se puede reconstruir a partir de las carpetas de propuestas.
- `PROPOSAL.md`: propuesta de skill pendiente.
- `rollback.json`: metadatos de recuperación escritos antes de aplicar cambios a los archivos activos.

## Límites

| Límite                          | Valor                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Descripción                     | 160 bytes                                                                      |
| Cuerpo de la propuesta          | `skills.workshop.maxSkillBytes` (valor predeterminado: 40 000; máximo: 1 MiB) |
| Archivos auxiliares             | 64 por propuesta                                                               |
| Tamaño de archivo auxiliar      | 256 KiB cada uno, 2 MiB en total                                               |
| Propuestas pendientes + aisladas | `skills.workshop.maxPending` por espacio de trabajo (valor predeterminado: 50) |

## Solución de problemas

| Problema                                       | Resolución                                                                                                                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Reduzca `description` a 160 bytes o menos.                                                                                                                                                                                                                     |
| `Skill proposal content is too large`          | Reduzca el cuerpo de la propuesta o aumente `skills.workshop.maxSkillBytes`.                                                                                                                                                                                   |
| `Target skill changed after proposal creation` | Revise la propuesta con respecto al destino actual o cree una propuesta nueva.                                                                                                                                                                                 |
| `Proposal scan failed`                         | Examine los hallazgos del escáner y, a continuación, revise o aísle la propuesta.                                                                                                                                                                              |
| `untrusted symlink target`                     | Configure `skills.load.allowSymlinkTargets` y habilite `skills.workshop.allowSymlinkTargetWrites` únicamente para raíces compartidas de skills configuradas de forma intencional.                                                                               |
| `Support file paths must be under one of...`   | Mueva los archivos auxiliares a `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                                                                              |
| La propuesta no aparece en la lista            | Compruebe el espacio de trabajo seleccionado mediante `--agent` y `OPENCLAW_STATE_DIR`.                                                                                                                                                                        |
| El agente no puede llamar a `skill_workshop`   | Compruebe la política de herramientas activa y el modo de ejecución. `coding` incluye la herramienta; las políticas restrictivas de `tools.allow` deben incluirla explícitamente y las ejecuciones en entornos aislados deben usar una sesión normal del agente en el host o la CLI. |

### Diagnóstico de la política de herramientas

Cuando la captura autónoma está habilitada, `openclaw doctor` ejecuta la comprobación `core/doctor/skill-workshop-tool-policy` para el agente predeterminado. Si la política oculta `skill_workshop`, la advertencia indica la primera capa de configuración que la excluye y el cambio exacto que debe realizarse en `allow` o `alsoAllow`. Los manuales operativos antiguos todavía pueden usar `openclaw plugins inspect skill-workshop`; ahora ese comando explica que Skill Workshop está integrado y muestra la misma sugerencia sobre la política cuando corresponde.

## Contenido relacionado

- [Skills](/es/tools/skills) para conocer el orden de carga, la precedencia y la visibilidad
- [Creación de skills](/es/tools/creating-skills) para conocer los fundamentos de la escritura manual de `SKILL.md`
- [Configuración de Skills](/es/tools/skills-config) para consultar el esquema completo de `skills.workshop`
- [CLI de Skills](/es/cli/skills) para conocer los comandos de `openclaw skills`
