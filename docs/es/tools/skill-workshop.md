---
read_when:
    - Se quiere que el agente cree o actualice una skill desde el chat
    - Se debe revisar, aplicar, rechazar o poner en cuarentena un borrador de skill generado
    - Se está configurando la aprobación, la autonomía, el almacenamiento o los límites de Skill Workshop
    - Quiere saber dónde se revisan las propuestas de autoaprendizaje
sidebarTitle: Skill Workshop
summary: Crea y actualiza Skills del espacio de trabajo mediante la revisión de Skill Workshop
title: Taller de Skills
x-i18n:
    generated_at: "2026-07-14T14:04:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7f9a223104b6335a15c853bffda4a159668db24c397656d2aadbd403eceeaa72
    source_path: tools/skill-workshop.md
    workflow: 16
---

El Taller de Skills es la ruta gobernada de OpenClaw para crear y actualizar
skills del espacio de trabajo. Los agentes y operadores nunca escriben `SKILL.md` directamente mediante esta
ruta: crean una **propuesta** (un borrador pendiente con contenido, vinculación
de destino, estado del escáner, hashes y metadatos de reversión) que solo se convierte en una
skill activa cuando se aplica.

El Taller de Skills solo escribe skills del espacio de trabajo. Nunca modifica skills
integradas, de plugins, de ClawHub, de raíces adicionales, gestionadas, de agentes personales ni del sistema.

## Cómo funciona

- **Primero la propuesta:** el contenido generado se almacena como `PROPOSAL.md`, no como
  `SKILL.md`.
- **Aplicar es la única escritura activa:** crear, actualizar y revisar nunca modifican
  las skills activas.
- **Limitado al espacio de trabajo:** las creaciones tienen como destino la raíz `skills/` del espacio de trabajo; las actualizaciones
  solo se permiten para skills escribibles del espacio de trabajo.
- **Sin sobrescritura:** la creación falla si la skill de destino ya existe.
- **Vinculación por hash:** las propuestas de actualización se vinculan al hash actual del destino y pasan a
  `stale` si la skill activa cambia antes de aplicarlas.
- **Controlado por el escáner:** al aplicar, se vuelve a ejecutar el escáner de seguridad antes de escribir.
- **Recuperable:** al aplicar, se escriben metadatos de reversión antes de modificar los archivos activos.
- **Superficies coherentes:** el chat, la CLI y el Gateway llaman al mismo servicio.

## Ciclo de vida

```text
crear/actualizar -> pendiente
revisar          -> pendiente
aplicar          -> aplicada
rechazar         -> rechazada
poner en cuarentena -> en cuarentena
cambio de destino -> obsoleta
```

Solo una propuesta `pending` puede revisarse, aplicarse, rechazarse o ponerse en cuarentena.

## Gestión del ciclo de vida

El Gateway registra el uso agregado de las skills en la base de datos de estado compartida. Una vez al
día, revisa las skills creadas y aplicadas por el Taller de Skills. Las skills sin usar durante
más de 30 días pasan a `stale`; después de 90 días pasan a `archived` y quedan
fuera de las nuevas instantáneas de skills de los agentes. Los archivos de las skills archivadas permanecen sin cambios en
el disco. Las skills creadas manualmente nunca se gestionan; solo las skills creadas mediante propuestas del Taller de
Skills entran en la gestión del ciclo de vida.

Las skills fijadas omiten las transiciones del ciclo de vida. Una skill obsoleta vuelve a `active`
después de utilizarse y de que se ejecute el siguiente barrido. Las skills archivadas solo regresan mediante una
restauración explícita:

Las transiciones del ciclo de vida y las restauraciones se aplican a las sesiones nuevas; las sesiones en ejecución conservan
su instantánea actual de skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Todos los comandos del gestor aceptan `--json`. El estado también informa de candidatos deterministas
con solapamientos únicamente como sugerencias; nunca fusiona skills ni llama a un modelo.

## Chat

Solicite al agente la skill deseada; este llama a `skill_workshop` y devuelve un
identificador de propuesta.

### Aprender del trabajo reciente

Use `/learn` para convertir la conversación actual o las fuentes indicadas en una
propuesta de skill guiada por estándares:

```text
/learn
/learn docs/runbook.md y https://example.com/guide; centrarse en la recuperación
```

Sin una solicitud, `/learn` pide al agente que extraiga de la conversación actual el flujo de trabajo
reutilizable. Con una solicitud, el agente trata las rutas, las URL, las notas pegadas y las
referencias a conversaciones como fuentes, respetando los requisitos de enfoque, alcance y
nomenclatura. Recopila las fuentes con sus herramientas existentes y después llama a
`skill_workshop` con `action: "create"`.

La propuesta resultante permanece `pending`; `/learn` nunca la aplica. Revísela y
aplíquela mediante el flujo de aprobación normal o con `openclaw skills workshop`.

Crear:

```text
Crea una skill llamada morning-catchup que ejecute mi rutina de los lunes para la bandeja de entrada.
```

Actualizar una skill existente del espacio de trabajo:

```text
Actualiza trip-planning para que también compruebe los mapas de asientos antes de reservar.
```

Iterar sobre una propuesta pendiente:

```text
Muéstrame la propuesta morning-catchup.
Revísala para que también marque todo lo que figure como urgente.
Aplica la propuesta morning-catchup.
```

Las acciones `apply`, `reject` y `quarantine` iniciadas por el agente muestran una solicitud de aprobación de forma
predeterminada. Establezca `skills.workshop.approvalPolicy` en `"auto"` para omitirla en
entornos de confianza.

La solicitud identifica el id. de la propuesta y la skill de destino, y muestra la descripción
de la propuesta, el número de archivos auxiliares y el tamaño del cuerpo. Las solicitudes de aprobación tienen un plazo
limitado para finalizar antes del supervisor de herramientas del agente. Si no se recibe ninguna decisión antes de que
caduque la solicitud, la acción del ciclo de vida no se ejecuta: la propuesta permanece pendiente
y sin cambios. Decida más tarde en la interfaz del Taller de Skills o ejecute
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Los agentes no deben
reintentar en bucle una acción del ciclo de vida caducada.

## CLI

```bash
# Crear
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# Actualizar una skill existente del espacio de trabajo
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Enumerar e inspeccionar
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisar antes de la aprobación
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Finalizar
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Cada subcomando acepta `--agent <id>` (espacio de trabajo de destino; de forma predeterminada se
infiere del directorio de trabajo actual y después del agente predeterminado) y `--json` (salida estructurada).
`propose-create`, `propose-update` y `revise` también aceptan `--goal <text>` y
`--evidence <text>` para registrar el contexto de la propuesta junto con `--proposal`.

## Contenido de la propuesta

Mientras está pendiente, la propuesta se almacena como `PROPOSAL.md` con frontmatter exclusivo
de la propuesta:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Al aplicarla, el Taller de Skills escribe la `SKILL.md` activa y elimina los
campos exclusivos de la propuesta: `status`, `version` de la propuesta y `date` de la propuesta.

## Archivos auxiliares

Use `--proposal-dir` cuando la skill propuesta necesite archivos junto a
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

El directorio debe contener `PROPOSAL.md`. Los archivos auxiliares deben encontrarse en
`assets/`, `examples/`, `references/`, `scripts/` o `templates/`. El Taller de
Skills los analiza, calcula sus hashes y los almacena con la propuesta; después, solo al aplicar,
los escribe junto a la `SKILL.md` activa.

Rutas de archivos auxiliares rechazadas: rutas absolutas, segmentos de ruta ocultos, recorridos
de directorios, rutas solapadas, archivos ejecutables, texto que no sea UTF-8, bytes nulos
y rutas fuera de las carpetas auxiliares estándar.

## Herramienta del agente

El modelo utiliza `skill_workshop` con un `action` obligatorio:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Se aplican otros parámetros según la acción:

| Parámetro                  | Utilizado por                                         | Notas                                                                |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Obligatorio para `create`; de lo contrario, resuelve una propuesta pendiente por nombre |
| `description`              | `create`, `update`, `revise`                         | Máximo de 160 bytes                                                   |
| `skill_name`               | `update`                                             | Nombre o clave de una skill existente                                |
| `proposal_content`         | `create`, `update`, `revise`                         | Se almacena como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Matriz de `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contexto de texto libre                                              |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Propuesta de destino                                                  |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opcional                                                             |
| `query`, `status`, `limit` | `list`                                               | Filtrar/paginar; `limit` máximo 50, predeterminado 20     |

Los agentes deben usar `skill_workshop` para el trabajo de generación de skills. No deben
crear ni modificar archivos de propuestas mediante `write`, `edit`, `exec`, comandos del shell
ni operaciones directas del sistema de archivos.

<Note>
`skill_workshop` es una herramienta integrada del agente y está incluida en
`tools.profile: "coding"`. Si una política más estricta la oculta, añada
`skill_workshop` a la lista `tools.allow` activa o use
`tools.alsoAllow: ["skill_workshop"]` cuando el ámbito utilice un perfil sin un
`tools.allow` explícito. Las ejecuciones en entornos aislados no construyen la herramienta
del Taller de Skills del host, por lo que las acciones de revisión de propuestas deben ejecutarse desde una sesión
normal del agente en el host o desde la CLI.
</Note>

## Skills sugeridas

OpenClaw detecta instrucciones duraderas como «la próxima vez», «recuerda» y correcciones reactivas
cuando termina un turno interactivo, incluidos los turnos fallidos. En el turno siguiente, el agente ofrece guardar
el flujo de trabajo detectado más reciente mediante `skill_workshop`; el usuario decide si desea crear una
propuesta. Esta sugerencia integrada no crea ni modifica ninguna skill por sí sola. Active
`skills.workshop.autonomous.enabled` para crear directamente propuestas pendientes. En la interfaz de
control, la pestaña del Taller ofrece el mismo ajuste como un selector **Autoaprendizaje** en el encabezado de la página y
como un botón de activación en el tablero de propuestas vacío.

### Analizar sesiones anteriores

La interfaz de control puede revisar trabajos anteriores sin activar el autoaprendizaje autónomo.
Abra **Plugins → Taller** y seleccione **Buscar ideas de skills**. El análisis comienza por
las sesiones aptas más recientes y revisa una ventana limitada de trabajo sustancial.
Omite sesiones de Cron, Heartbeat, hooks, subagentes, ACP, pertenecientes a plugins y de revisión
interna, además de conversaciones con menos de seis turnos del modelo.

El revisor utiliza el modelo configurado del agente seleccionado y recibe un paquete de transcripciones
con los secretos ocultos y un tamaño limitado. Aplica el mismo criterio conservador
que la revisión de experiencias: un patrón concreto de recuperación o un procedimiento estable que
eliminaría al menos dos llamadas futuras al modelo o a herramientas. El trabajo rutinario y los hechos
puntuales no deberían generar ninguna propuesta.

Un análisis puede crear o revisar como máximo tres propuestas pendientes. No puede aplicar,
rechazar, poner en cuarentena ni editar una skill activa. El Taller muestra la cobertura acumulada,
por ejemplo, **20 sesiones revisadas · 18 de jun.–hoy · 2 ideas encontradas**. Seleccione
**Analizar trabajo anterior** para continuar desde el cursor persistente de la sesión más antigua. Cuando
se agota el historial disponible, la acción pasa a ser **Analizar trabajo nuevo**.

La revisión histórica es manual incluso cuando
`skills.workshop.autonomous.enabled` es `false`. Cada clic inicia una ejecución del modelo,
por lo que se aplican los precios y las condiciones de tratamiento de datos del proveedor. El cursor y los recuentos de cobertura
se almacenan en la base de datos de estado compartida de OpenClaw; el contenido de las transcripciones no se copia
al estado del análisis.

Con la captura autónoma habilitada, OpenClaw también puede realizar una revisión conservadora después de un trabajo
sustancial realizado correctamente y cuando todo el sistema de agentes queda inactivo. Esa revisión aislada puede crear o
revisar como máximo una propuesta pendiente. No puede actualizar una skill activa ni aplicar, rechazar o poner en cuarentena una
propuesta, incluso cuando `approvalPolicy` es `"auto"`.

Consulte [Autoaprendizaje](/tools/self-learning) para obtener detalles sobre la habilitación, los criterios de elegibilidad, la privacidad y los costes,
el umbral de las propuestas y la solución de problemas.

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

| Configuración                | Valor predeterminado | Efecto                                                                                                                                                                 |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | Crea propuestas pendientes a partir de correcciones explícitas y, tras un periodo de inactividad, de trabajos sustanciales completados con una recuperación reutilizable o un ahorro significativo en operaciones de ida y vuelta. |
| `allowSymlinkTargetWrites` | `false`     | Permite que la aplicación escriba a través de enlaces simbólicos de skills del espacio de trabajo cuyo destino real figure en `skills.load.allowSymlinkTargets`. |
| `approvalPolicy`           | `"pending"` | `"pending"` requiere una solicitud de aprobación antes de `apply`, `reject` o `quarantine` iniciados por el agente. `"auto"` omite la solicitud (el agente aún debe invocar la acción). |
| `maxPending`               | `50`        | Limita las propuestas pendientes y en cuarentena por espacio de trabajo (1-200). |
| `maxSkillBytes`            | `40000`     | Limita el tamaño del cuerpo de las propuestas en bytes (1024-200000). |

La captura autónoma reconoce reglas prospectivas (por ejemplo, «a partir de ahora») y
correcciones reactivas (por ejemplo, «eso no es lo que pedí»). Agrupa las instrucciones nuevas por tema en
hasta tres propuestas por turno, dirige las coincidencias de vocabulario a las skills existentes con permiso de escritura en el espacio de trabajo y
revisa su propia propuesta pendiente cuando otra corrección se dirige a la misma skill.

Para trabajos sustanciales completados correctamente sin una corrección explícita, una ejecución aislada del
modelo seleccionado decide si la trayectoria completada supera el umbral conservador de las propuestas. No se
solicita al modelo en primer plano que aprenda antes de responder. El revisor en segundo plano conserva la
ejecución en primer plano como procedencia de la propuesta, no puede acceder a las herramientas generales del agente ni tomar decisiones sobre el ciclo
de vida. La revisión comienza únicamente cuando el entorno de ejecución en primer plano comunica tanto su modelo exacto resuelto
como que `skill_workshop` estaba realmente disponible. Por lo tanto, una política de herramientas restrictiva o desconocida
falla de forma segura y no crea ninguna propuesta.

Consulte [Autoaprendizaje](/tools/self-learning) para conocer el comportamiento completo de la revisión autónoma y el modelo de
seguridad.

Las descripciones de las propuestas siempre tienen un límite de 160 bytes, independientemente de
`maxSkillBytes`.

## Métodos del Gateway

| Método                             | Ámbito            |
| ---------------------------------- | ----------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
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

`requestRevision` solo está disponible en el Gateway (no tiene equivalente en la CLI ni en las herramientas del agente):
reenvía instrucciones de revisión en texto libre a la sesión de chat del agente propietario
en lugar de sustituir directamente `PROPOSAL.md`, para interfaces de usuario que solicitan al agente
una revisión en vez de enviar contenido nuevo literal.

`historyStatus` y `historyScan` son métodos auxiliares de la interfaz de control. `historyScan`
acepta `direction: "older" | "newer"`; siempre deja los resultados como
propuestas pendientes.

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
- `proposals.json`: índice de listado rápido, reconstruible a partir de las carpetas de propuestas.
- `PROPOSAL.md`: propuesta de skill pendiente.
- `rollback.json`: metadatos de recuperación escritos antes de que la aplicación modifique los archivos activos.

## Límites

| Límite                          | Valor                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Descripción                     | 160 bytes                                                            |
| Cuerpo de la propuesta          | `skills.workshop.maxSkillBytes` (valor predeterminado: 40,000; límite máximo estricto: 1 MiB) |
| Archivos auxiliares             | 64 por propuesta                                                     |
| Tamaño de archivo auxiliar      | 256 KiB cada uno, 2 MiB en total                                     |
| Propuestas pendientes + en cuarentena | `skills.workshop.maxPending` por espacio de trabajo (valor predeterminado: 50) |

## Solución de problemas

| Problema                                       | Solución                                                                                                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Acorte `description` a 160 bytes o menos. |
| `Skill proposal content is too large`          | Acorte el cuerpo de la propuesta o aumente `skills.workshop.maxSkillBytes`. |
| `Target skill changed after proposal creation` | Revise la propuesta con respecto al destino actual o cree una propuesta nueva. |
| `Proposal scan failed`                         | Inspeccione los hallazgos del analizador y, a continuación, revise o ponga en cuarentena la propuesta. |
| `untrusted symlink target`                     | Configure `skills.load.allowSymlinkTargets` y habilite `skills.workshop.allowSymlinkTargetWrites` únicamente para raíces de skills compartidas de forma intencionada. |
| `Support file paths must be under one of...`   | Mueva los archivos auxiliares a `assets/`, `examples/`, `references/`, `scripts/` o `templates/`. |
| La propuesta no aparece en la lista           | Compruebe el espacio de trabajo `--agent` seleccionado y `OPENCLAW_STATE_DIR`. |
| El agente no puede invocar `skill_workshop`             | Compruebe la política de herramientas activa y el modo de ejecución. `coding` incluye la herramienta; las políticas restrictivas `tools.allow` deben enumerarla explícitamente y las ejecuciones en un entorno aislado deben usar una sesión normal del agente en el host o la CLI. |

### Diagnóstico de la política de herramientas

Cuando la captura autónoma está habilitada, `openclaw doctor` ejecuta la
comprobación `core/doctor/skill-workshop-tool-policy` para el agente predeterminado. Si la política
oculta `skill_workshop`, la advertencia indica la primera capa de configuración que lo excluye y
el cambio exacto en `allow` o `alsoAllow` que debe realizarse. Los manuales de procedimientos antiguos aún pueden utilizar
`openclaw plugins inspect skill-workshop`; ahora ese comando explica que Skill
Workshop está integrado y muestra la misma indicación sobre la política cuando corresponde.

## Contenido relacionado

- [Skills](/es/tools/skills) para conocer el orden de carga, la precedencia y la visibilidad
- [Autoaprendizaje](/tools/self-learning) para conocer las propuestas conservadoras de skills posteriores a la ejecución
- [Creación de skills](/es/tools/creating-skills) para conocer los fundamentos de `SKILL.md`
  escritas manualmente
- [Configuración de Skills](/es/tools/skills-config) para consultar el esquema completo de `skills.workshop`
- [CLI de Skills](/es/cli/skills) para consultar los comandos de `openclaw skills`
