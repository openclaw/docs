---
read_when:
    - Quieres que el agente cree o actualice una skill desde el chat
    - Es necesario revisar, aplicar, rechazar o poner en cuarentena un borrador de skill generado
    - Está configurando la aprobación, la autonomía, el almacenamiento o los límites de Skill Workshop
    - Quieres saber dónde se revisan las propuestas de autoaprendizaje
sidebarTitle: Skill Workshop
summary: Crea y actualiza Skills del espacio de trabajo mediante la revisión de Skill Workshop
title: Taller de Skills
x-i18n:
    generated_at: "2026-07-16T12:13:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop es la ruta regida de OpenClaw para crear y actualizar Skills del espacio de trabajo. Los agentes y operadores nunca escriben `SKILL.md` directamente mediante esta ruta: crean una **propuesta** (un borrador pendiente con contenido, vinculación de destino, estado del escáner, hashes y metadatos de reversión) que se convierte en una Skill activa solo cuando se aplica.

Skill Workshop solo escribe Skills del espacio de trabajo. Nunca modifica Skills incluidas, de plugins, de ClawHub, de raíces adicionales, gestionadas, de agentes personales ni del sistema.

## Cómo funciona

- **Primero la propuesta:** el contenido generado se almacena como `PROPOSAL.md`, no como
  `SKILL.md`.
- **La aplicación es la única escritura activa:** crear, actualizar y revisar nunca modifican
  las Skills activas.
- **Limitado al espacio de trabajo:** las creaciones tienen como destino la raíz `skills/` del espacio de trabajo; las actualizaciones
  solo se permiten para las Skills editables del espacio de trabajo.
- **Sin sobrescritura:** la creación falla si la Skill de destino ya existe.
- **Vinculación por hash:** las propuestas de actualización se vinculan al hash actual del destino y pasan a
  `stale` si la Skill activa cambia antes de aplicarlas.
- **Controlado por el escáner:** al aplicar, se vuelve a ejecutar el escáner de seguridad antes de escribir.
- **Recuperable:** al aplicar, se escriben los metadatos de reversión antes de modificar los archivos activos.
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

Solo se puede revisar, aplicar, rechazar o poner en cuarentena una propuesta `pending`.

## Curación del ciclo de vida

El Gateway registra el uso agregado de las Skills en la base de datos de estado compartida. Una vez al
día, revisa las Skills creadas y aplicadas mediante Skill Workshop. Las Skills sin usar durante
más de 30 días pasan a `stale`; después de 90 días pasan a `archived` y se
excluyen de las nuevas instantáneas de Skills de los agentes. Los archivos de las Skills archivadas permanecen sin cambios en
el disco. Las Skills creadas manualmente nunca se someten a curación; solo las Skills creadas mediante propuestas de Skill
Workshop entran en la curación del ciclo de vida.

Las Skills fijadas omiten las transiciones del ciclo de vida. Una Skill obsoleta vuelve a `active`
después de utilizarse y de que se ejecute el siguiente barrido. Las Skills archivadas solo vuelven mediante una
restauración explícita:

Las transiciones y restauraciones del ciclo de vida se aplican a las sesiones nuevas; las sesiones en ejecución conservan
su instantánea actual de Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Todos los comandos del curador aceptan `--json`. El estado también informa de candidatos deterministas de solapamiento
solo como sugerencias; nunca fusiona Skills ni llama a un modelo.

## Chat

Se solicita al agente la Skill deseada; este llama a `skill_workshop` y devuelve un
id. de propuesta.

### Aprender del trabajo reciente

Use `/learn` para convertir la conversación actual o fuentes especificadas en una
propuesta de Skill guiada por estándares:

```text
/learn
/learn docs/runbook.md y https://example.com/guide; céntrate en la recuperación
```

Sin una solicitud, `/learn` pide al agente que extraiga el flujo de trabajo reutilizable de
la conversación actual. Con una solicitud, el agente trata las rutas, las URL, las
notas pegadas y las referencias a conversaciones como fuentes, respetando los requisitos de enfoque, alcance y
nomenclatura. Recopila las fuentes con sus herramientas existentes y después llama a
`skill_workshop` con `action: "create"`.

La propuesta resultante permanece `pending`; `/learn` nunca la aplica. Revísela y
aplíquela mediante el flujo de aprobación normal o con `openclaw skills workshop`.

Crear:

```text
Crea una Skill llamada morning-catchup que ejecute mi rutina de los lunes para la bandeja de entrada.
```

Actualizar una Skill existente del espacio de trabajo:

```text
Actualiza trip-planning para que también compruebe los mapas de asientos antes de reservar.
```

Iterar sobre una propuesta pendiente:

```text
Muéstrame la propuesta morning-catchup.
Revísala para que también marque todo lo etiquetado como urgente.
Aplica la propuesta morning-catchup.
```

Las operaciones `apply`, `reject` y `quarantine` iniciadas por el agente se ejecutan sin una solicitud de
aprobación adicional de forma predeterminada. Establezca `skills.workshop.approvalPolicy` en `"pending"`
para exigir la aprobación del operador antes de esas acciones.

Cuando se requiere aprobación, la solicitud identifica el id. de la propuesta y la Skill de
destino, y muestra la descripción de la propuesta, el número de archivos auxiliares y el tamaño del cuerpo.
Las solicitudes de aprobación tienen un límite para finalizar antes que el supervisor de herramientas del agente. Si no
se recibe una decisión antes de que venza la solicitud, la acción del ciclo de vida no se ejecuta:
la propuesta permanece pendiente y sin cambios. Decida más adelante en la interfaz de Skill Workshop o ejecute
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Los agentes no deben
reintentar en bucle una acción del ciclo de vida que haya vencido.

## CLI

```bash
# Crear
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Puesta al día diaria de la bandeja de entrada: clasificar, archivar, destacar, redactar, planificar" \
  --proposal ./PROPOSAL.md

# Actualizar una Skill existente del espacio de trabajo
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Enumerar e inspeccionar
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisar antes de la aprobación
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Finalizar
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicada"
openclaw skills workshop quarantine <proposal-id> --reason "Necesita una revisión de seguridad"
```

Cada subcomando acepta `--agent <id>` (espacio de trabajo de destino; de forma predeterminada,
primero se deduce del directorio de trabajo actual y después se usa el agente predeterminado) y `--json` (salida estructurada).
`propose-create`, `propose-update` y `revise` también aceptan `--goal <text>` y
`--evidence <text>` para registrar el contexto de la propuesta junto con `--proposal`.

## Contenido de la propuesta

Mientras está pendiente, la propuesta se almacena como `PROPOSAL.md` con frontmatter exclusivo de la
propuesta:

```markdown
---
name: "morning-catchup"
description: "Puesta al día diaria de la bandeja de entrada: clasificar, archivar, destacar, redactar, planificar"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Al aplicarla, Skill Workshop escribe el `SKILL.md` activo y elimina los
campos exclusivos de la propuesta: `status`, `version` de la propuesta y `date` de la propuesta.

## Archivos auxiliares

Use `--proposal-dir` cuando la Skill propuesta necesite archivos junto a
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Resumen del viernes: estadísticas, aspectos destacados y las tres prioridades de la próxima semana" \
  --proposal-dir ./weekly-update-proposal
```

El directorio debe contener `PROPOSAL.md`. Los archivos auxiliares deben residir en
`assets/`, `examples/`, `references/`, `scripts/` o `templates/`. Skill
Workshop los escanea, calcula sus hashes y los almacena con la propuesta; después los escribe
junto al `SKILL.md` activo solo al aplicar.

Rutas de archivos auxiliares rechazadas: rutas absolutas, segmentos de ruta ocultos, recorridos
de directorios, rutas solapadas, archivos ejecutables, texto que no sea UTF-8, bytes nulos
y rutas fuera de las carpetas auxiliares estándar.

## Herramienta del agente

El modelo usa `skill_workshop` con un `action` obligatorio:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Los demás parámetros se aplican según la acción:

| Parámetro                  | Usado por                                             | Notas                                                                |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Obligatorio para `create`; de lo contrario, resuelve una propuesta pendiente por nombre |
| `description`              | `create`, `update`, `revise`                         | Máx. 160 bytes                                                       |
| `skill_name`               | `update`                                             | Nombre o clave de una Skill existente                                |
| `proposal_content`         | `create`, `update`, `revise`                         | Se almacena como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Matriz de `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contexto de texto libre                                              |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Propuesta de destino                                                 |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opcional                                                             |
| `query`, `status`, `limit` | `list`                                               | Filtrar/paginar; `limit` máx. 50, valor predeterminado 20 |

Los agentes deben usar `skill_workshop` para el trabajo generado con Skills. No deben
crear ni modificar archivos de propuestas mediante `write`, `edit`, `exec`, comandos de shell
ni operaciones directas del sistema de archivos.

<Note>
`skill_workshop` es una herramienta integrada del agente y se incluye en
`tools.profile: "coding"`. Si una política más estricta la oculta, añada
`skill_workshop` a la lista `tools.allow` activa o use
`tools.alsoAllow: ["skill_workshop"]` cuando el ámbito utilice un perfil sin un
`tools.allow` explícito. Las ejecuciones en entornos aislados no construyen la herramienta Skill Workshop
del lado del host, así que ejecute las acciones de revisión de propuestas desde una sesión normal del agente
del lado del host o desde la CLI.
</Note>

## Skills sugeridas

OpenClaw detecta instrucciones duraderas como «la próxima vez», «recuerda» y correcciones reactivas
cuando finaliza un turno interactivo, incluidos los turnos fallidos. En el turno siguiente, el agente ofrece guardar
el flujo de trabajo detectado más reciente mediante `skill_workshop`; el usuario decide si quiere crear una
propuesta. Esta sugerencia integrada no crea ni modifica ninguna Skill por sí sola. Active
`skills.workshop.autonomous.enabled` para crear directamente propuestas pendientes. En la interfaz de
control, la pestaña Workshop ofrece la misma opción mediante un interruptor **Self-learning** en el encabezado de la página y
un botón de activación en el tablero de propuestas vacío.

### Analizar sesiones anteriores

La interfaz de control puede revisar trabajos anteriores sin activar el autoaprendizaje autónomo.
Abra **Plugins → Workshop** y seleccione **Find skill ideas**. El análisis comienza por
las sesiones aptas más recientes y revisa una ventana limitada de trabajo sustancial.
Omite las sesiones de Cron, Heartbeat, hooks, subagentes, ACP, pertenecientes a plugins y de revisión
interna, además de las conversaciones con menos de seis turnos del modelo.

El revisor utiliza el modelo configurado del agente seleccionado y recibe un
conjunto de transcripciones con los secretos ocultos y un tamaño limitado. Aplica el mismo criterio conservador
que la revisión de experiencias: un patrón concreto de recuperación o un procedimiento estable que
eliminaría al menos dos futuras llamadas al modelo o a herramientas. El trabajo rutinario y los hechos puntuales
no deberían generar ninguna propuesta.

Un análisis puede crear o revisar como máximo tres propuestas pendientes. No puede aplicar,
rechazar, poner en cuarentena ni editar una Skill activa. Workshop muestra la cobertura acumulada,
por ejemplo, **20 sesiones revisadas · 18 de junio–hoy · 2 ideas encontradas**. Seleccione
**Scan earlier work** para continuar desde el cursor persistente de la sesión más antigua. Cuando
se agota el historial disponible, la acción pasa a ser **Scan new work**.

La revisión histórica es manual incluso cuando
`skills.workshop.autonomous.enabled` es `false`. Cada clic inicia una ejecución del modelo,
por lo que se aplican los precios y las condiciones de tratamiento de datos del proveedor. El cursor y los recuentos de cobertura
se almacenan en la base de datos de estado compartida de OpenClaw; el contenido de la transcripción no se copia
en el estado del análisis.

Con la captura autónoma habilitada, OpenClaw también puede realizar una revisión conservadora tras completar
correctamente un trabajo sustancial y después de que todo el sistema de agentes quede inactivo. Esa revisión aislada puede crear o
revisar como máximo una propuesta pendiente. No puede actualizar una skill activa ni aplicar, rechazar o poner en cuarentena una
propuesta, incluso cuando `approvalPolicy` es `"auto"`.

Consulte [Autoaprendizaje](/es/tools/self-learning) para obtener información sobre la habilitación, los requisitos, la privacidad y los costes,
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
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Configuración                | Valor predeterminado | Efecto                                                                                                                                                              |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Crea propuestas pendientes a partir de correcciones explícitas y, tras un periodo de inactividad, de trabajos sustanciales completados con una recuperación reutilizable o ahorros significativos en el ciclo completo.   |
| `allowSymlinkTargetWrites` | `false`  | Permite que la aplicación escriba mediante enlaces simbólicos de skills del espacio de trabajo cuyo destino real figure en `skills.load.allowSymlinkTargets`.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` omite una solicitud de confirmación adicional para `apply`, `reject` o `quarantine` iniciados por el agente (el agente aún debe invocar la acción). `"pending"` requiere aprobación. |
| `maxPending`               | `50`     | Limita las propuestas pendientes y en cuarentena por espacio de trabajo (1-200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | Limita el tamaño del cuerpo de la propuesta en bytes (1024-200000).                                                                                                                     |

La captura autónoma reconoce reglas prospectivas (por ejemplo, «a partir de ahora») y
correcciones reactivas (por ejemplo, «eso no es lo que pedí»). Agrupa las nuevas instrucciones por tema en
hasta tres propuestas por turno, dirige las coincidencias de vocabulario a las skills existentes del espacio de trabajo con permiso de escritura y
revisa su propia propuesta pendiente cuando otra corrección se refiere a la misma skill.

En los trabajos sustanciales completados correctamente sin una corrección explícita, una ejecución aislada del modelo
seleccionado decide si la trayectoria completada supera el umbral conservador de las propuestas. No se solicita al
modelo en primer plano que aprenda antes de responder. El revisor en segundo plano conserva la ejecución en
primer plano como procedencia de la propuesta, no puede acceder a las herramientas generales del agente ni tomar decisiones sobre el ciclo de
vida. La revisión solo comienza cuando el entorno de ejecución en primer plano informa tanto de su modelo resuelto exacto
como de que `skill_workshop` estaba realmente disponible. Por tanto, una política de herramientas restrictiva o desconocida
produce un fallo seguro y no crea ninguna propuesta.

Consulte [Autoaprendizaje](/es/tools/self-learning) para conocer el comportamiento completo de la revisión autónoma y su modelo de
seguridad.

Las descripciones de las propuestas siempre se limitan a 160 bytes, independientemente de
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

`requestRevision` solo está disponible en el Gateway (no existe un equivalente en la CLI ni en las herramientas del agente): 
reenvía instrucciones de revisión en texto libre a la sesión de chat del agente propietario
en lugar de sustituir `PROPOSAL.md` directamente, para las interfaces de usuario que solicitan al agente
que revise el contenido en vez de enviar literalmente contenido nuevo.

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
- `proposals.json`: índice de listado rápido que puede reconstruirse a partir de las carpetas de propuestas.
- `PROPOSAL.md`: propuesta de skill pendiente.
- `rollback.json`: metadatos de recuperación escritos antes de que la aplicación modifique los archivos activos.

## Límites

| Límite                          | Valor                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Descripción                     | 160 bytes                                                            |
| Cuerpo de la propuesta          | `skills.workshop.maxSkillBytes` (valor predeterminado: 40,000; límite máximo: 1 MiB) |
| Archivos auxiliares             | 64 por propuesta                                                     |
| Tamaño de los archivos auxiliares | 256 KiB cada uno, 2 MiB en total                                   |
| Propuestas pendientes + en cuarentena | `skills.workshop.maxPending` por espacio de trabajo (valor predeterminado: 50) |

## Solución de problemas

| Problema                                       | Solución                                                                                                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Reduzca `description` a 160 bytes o menos.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Reduzca el cuerpo de la propuesta o aumente `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Revise la propuesta tomando como referencia el destino actual o cree una propuesta nueva.                                                                                                                                   |
| `Proposal scan failed`                         | Inspeccione los hallazgos del analizador y, a continuación, revise la propuesta o póngala en cuarentena.                                                                                                                                           |
| `untrusted symlink target`                     | Configure `skills.load.allowSymlinkTargets` y habilite `skills.workshop.allowSymlinkTargetWrites` únicamente para raíces de skills compartidas intencionadamente.                                                                  |
| `Support file paths must be under one of...`   | Mueva los archivos auxiliares a `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                                |
| La propuesta no aparece en la lista           | Compruebe el espacio de trabajo `--agent` seleccionado y `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| El agente no puede invocar `skill_workshop`             | Compruebe la política de herramientas activa y el modo de ejecución. `coding` incluye la herramienta; las políticas restrictivas de `tools.allow` deben incluirla explícitamente y las ejecuciones aisladas deben utilizar una sesión normal del agente en el host o la CLI. |

### Diagnóstico de la política de herramientas

Cuando la captura autónoma está habilitada, `openclaw doctor` ejecuta la
comprobación `core/doctor/skill-workshop-tool-policy` para el agente predeterminado. Si la política
oculta `skill_workshop`, la advertencia indica la primera capa de configuración que lo excluye y
el cambio exacto que debe realizarse en `allow` o `alsoAllow`. Es posible que los manuales de operaciones antiguos aún utilicen
`openclaw plugins inspect skill-workshop`; ahora ese comando explica que Skill
Workshop está integrado e imprime la misma indicación sobre la política cuando corresponde.

## Contenido relacionado

- [Skills](/es/tools/skills) para consultar el orden de carga, la precedencia y la visibilidad
- [Autoaprendizaje](/es/tools/self-learning) para consultar las propuestas conservadoras de skills posteriores a la ejecución
- [Creación de skills](/es/tools/creating-skills) para conocer los fundamentos de `SKILL.md`
  escritas manualmente
- [Configuración de Skills](/es/tools/skills-config) para consultar el esquema completo de `skills.workshop`
- [CLI de Skills](/es/cli/skills) para consultar los comandos `openclaw skills`
