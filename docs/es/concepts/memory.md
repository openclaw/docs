---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo recuerda OpenClaw las cosas entre sesiones
title: Descripción general de la memoria
x-i18n:
    generated_at: "2026-07-11T22:59:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw recuerda cosas escribiendo archivos Markdown sin formato en el espacio de trabajo de tu agente (de forma predeterminada, `~/.openclaw/workspace`). El modelo solo recuerda lo que se guarda en el disco; no existe ningún estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`** — memoria a largo plazo. Hechos duraderos, preferencias y decisiones. Se carga al inicio de una sesión.
- **`memory/YYYY-MM-DD.md`** (o `memory/YYYY-MM-DD-<slug>.md`) — notas diarias. Contexto continuo y observaciones. Las notas fechadas de hoy y ayer se cargan automáticamente con un `/new` o `/reset` sin argumentos; las variantes con identificador, como las escritas por el hook de memoria de sesión incluido, se recogen junto con el archivo que solo contiene la fecha.
- **`DREAMS.md`** (opcional) — Diario de sueños y resúmenes de las revisiones de Dreaming para revisión humana, incluidas entradas fundamentadas de recuperación histórica.

<Tip>
Si quieres que tu agente recuerde algo, solo pídeselo: «Recuerda que prefiero TypeScript». Escribirá la nota en el archivo correspondiente.
</Tip>

## Qué se guarda en cada lugar

`MEMORY.md` es la capa compacta y seleccionada: hechos duraderos, preferencias, decisiones vigentes y resúmenes breves que deben estar disponibles al inicio de una sesión. No es una transcripción sin procesar, un registro diario ni un archivo exhaustivo.

Los archivos `memory/YYYY-MM-DD.md` son la capa de trabajo: notas diarias detalladas, observaciones, resúmenes de sesiones y contexto sin procesar que todavía podría resultar útil más adelante. Se indexan para `memory_search` y `memory_get`, pero no se insertan en el prompt de arranque en cada turno.

Con el tiempo, el agente extrae material útil de las notas diarias y lo incorpora a `MEMORY.md`, además de eliminar las entradas obsoletas de la memoria a largo plazo. Las instrucciones generadas del espacio de trabajo y el flujo de Heartbeat lo hacen periódicamente; no necesitas editar manualmente `MEMORY.md` para cada detalle.

Si `MEMORY.md` supera el presupuesto de archivos de arranque, OpenClaw mantiene intacto el archivo en el disco, pero trunca la copia que se inserta en el contexto. Considéralo una señal para trasladar el material detallado a `memory/*.md`, conservar en `MEMORY.md` solo un resumen duradero o aumentar los límites de arranque si quieres dedicar más presupuesto del prompt. Usa `/context list`, `/context detail` u `openclaw doctor` para consultar los tamaños sin procesar e insertados, así como el estado de truncamiento.

## Memorias que condicionan acciones

La mayoría de las memorias son notas Markdown normales. Algunas afectan a lo que el agente debe hacer más adelante; en esos casos, registra cuándo es seguro actuar según la nota, no solo el hecho en sí.

Registra ese límite de actuación cuando una nota incluya:

- requisitos de aprobación o permiso,
- restricciones temporales,
- transferencias a otra sesión, hilo o persona,
- condiciones de vencimiento,
- el momento en que es seguro actuar,
- la autoridad de la fuente o del responsable,
- instrucciones para evitar una acción tentadora.

Una memoria útil que condicione acciones deja claro:

- qué cambia el comportamiento futuro,
- cuándo o bajo qué condición se aplica,
- cuándo vence o qué permite actuar,
- qué debe evitar hacer el agente,
- quién es la fuente o el responsable, si eso afecta a la confianza o la autoridad.

La memoria puede conservar el contexto de aprobación, pero no aplica políticas. Usa la configuración de aprobaciones de OpenClaw, el aislamiento y las tareas programadas para establecer controles operativos estrictos.

Ejemplo:

```md
La migración de la API se está diseñando en otra sesión. Los turnos futuros no
deben editar la implementación de la API desde este hilo; usa los hallazgos de
aquí únicamente como información de diseño hasta que se publique el plan de
migración.
```

Otro ejemplo:

```md
Un informe de una fuente no fiable necesita revisión antes de promoverse. Los
turnos futuros deben tratarlo únicamente como evidencia; no lo guardes como
memoria duradera hasta que un revisor de confianza confirme el contenido.
```

Este esquema no es obligatorio para todas las memorias; los hechos sencillos pueden ser concisos. Usa límites que condicionen acciones cuando perder el contexto temporal, de autoridad, de vencimiento o de seguridad para actuar pueda hacer que el agente realice una acción incorrecta más adelante.

Usa [compromisos](/es/concepts/commitments) para seguimientos inferidos de corta duración. Usa [tareas programadas](/es/automation/cron-jobs) para recordatorios exactos, comprobaciones temporizadas y trabajo recurrente. La memoria puede seguir resumiendo el contexto duradero en torno a cualquiera de estas opciones.

## Compromisos inferidos

Algunos seguimientos futuros no son hechos duraderos. Si mencionas una entrevista para mañana, la memoria útil podría ser «preguntar cómo fue después de la entrevista», no «guardar esto para siempre en `MEMORY.md`».

Los [compromisos](/es/concepts/commitments) son memorias de seguimiento opcionales y de corta duración para ese caso. OpenClaw los infiere mediante un proceso oculto en segundo plano, limita su alcance al mismo agente y canal, y entrega las consultas pendientes mediante Heartbeat. Los recordatorios explícitos siguen usando [tareas programadas](/es/automation/cron-jobs).

## Herramientas de memoria

El agente dispone de dos herramientas para trabajar con la memoria:

- **`memory_search`** — busca notas relevantes mediante búsqueda semántica, incluso cuando la redacción difiere de la original.
- **`memory_get`** — lee un archivo de memoria o un intervalo de líneas específico.

Ambas herramientas las proporciona el Plugin de memoria activo (de forma predeterminada, `memory-core`).

## Búsqueda en la memoria

Cuando hay un proveedor de incrustaciones configurado, `memory_search` usa búsqueda híbrida: similitud vectorial (significado semántico) combinada con coincidencia de palabras clave (términos exactos como identificadores y símbolos de código). Funciona de forma inmediata con una clave de API de cualquier proveedor compatible.

<Info>
OpenClaw usa las incrustaciones de OpenAI de forma predeterminada. Configura
`agents.defaults.memorySearch.provider` explícitamente para usar Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF local, Ollama, LM Studio, GitHub Copilot o
un endpoint genérico compatible con OpenAI.
</Info>

Consulta [Búsqueda en la memoria](/es/concepts/memory-search) para saber cómo funciona la búsqueda, conocer las opciones de ajuste y configurar proveedores.

## Motores de memoria

<CardGroup cols={3}>
<Card title="Integrado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de forma inmediata con búsqueda por palabras clave, similitud vectorial y búsqueda híbrida. No requiere dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Proceso auxiliar con prioridad local que incluye reclasificación, expansión de consultas y la capacidad de indexar directorios externos al espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuarios, búsqueda semántica y reconocimiento de múltiples agentes. Instalación mediante Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/es/plugins/memory-lancedb">
Memoria basada en LanceDB con incrustaciones compatibles con OpenAI, recuperación automática, captura automática y compatibilidad con incrustaciones locales de Ollama. Instalación mediante Plugin.
</Card>
</CardGroup>

## Capa de wiki de conocimiento

Si quieres que la memoria duradera se comporte más como una base de conocimiento mantenida que como notas sin procesar, usa el Plugin `memory-wiki` incluido. Compila el conocimiento duradero en un repositorio wiki con una estructura de páginas determinista, afirmaciones y evidencias estructuradas, seguimiento de contradicciones y vigencia, paneles generados, resúmenes compilados y herramientas nativas de wiki (`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` no sustituye al Plugin de memoria activo; este sigue siendo responsable de la recuperación, la promoción y Dreaming. `memory-wiki` añade a su lado una capa de conocimiento rica en procedencia.

<CardGroup cols={1}>
<Card title="Wiki de memoria" icon="book" href="/es/plugins/memory-wiki">
Compila la memoria duradera en un repositorio wiki rico en procedencia con afirmaciones, paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de la memoria

Antes de que [Compaction](/es/concepts/compaction) resuma tu conversación, OpenClaw ejecuta un turno silencioso que recuerda al agente que debe guardar el contexto importante en los archivos de memoria. Está activado de forma predeterminada; configura `agents.defaults.compaction.memoryFlush.enabled: false` para desactivarlo.

Para mantener ese turno de mantenimiento en un modelo local, configura una anulación exacta que se aplique únicamente al turno de vaciado de memoria (no hereda la cadena de modelos alternativos de la sesión activa):

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

<Tip>
El vaciado de memoria evita la pérdida de contexto durante Compaction. Si tu agente tiene hechos importantes en la conversación que todavía no se han escrito en un archivo, se guardan automáticamente antes de que se genere el resumen.
</Tip>

## Dreaming

Dreaming es un proceso opcional de consolidación de memoria en segundo plano. Recopila señales de recuperación a corto plazo, puntúa los candidatos y solo promueve los elementos que cumplen los requisitos a la memoria a largo plazo (`MEMORY.md`):

- **Opcional**: desactivado de forma predeterminada.
- **Programado**: cuando se activa, `memory-core` administra automáticamente un trabajo Cron recurrente para realizar una revisión completa de Dreaming.
- **Sujeto a umbrales**: las promociones deben superar los umbrales de puntuación, frecuencia de recuperación y diversidad de consultas.
- **Revisable**: los resúmenes de fases y las entradas del diario se escriben en `DREAMS.md` para su revisión humana.

Consulta [Dreaming](/es/concepts/dreaming) para obtener detalles sobre el comportamiento de las fases, las señales de puntuación y el Diario de sueños.

## Recuperación histórica fundamentada y promoción en tiempo real

El sistema de Dreaming tiene dos vías de revisión relacionadas:

- **Dreaming en tiempo real** trabaja con el almacén de Dreaming a corto plazo ubicado en `memory/.dreams/` y es lo que usa la fase profunda normal para decidir qué pasa a `MEMORY.md`.
- **Recuperación histórica fundamentada** lee las notas históricas `memory/YYYY-MM-DD.md` como archivos diarios independientes y escribe resultados de revisión estructurados en `DREAMS.md`.

La recuperación histórica fundamentada resulta útil para reproducir notas antiguas e inspeccionar qué considera duradero el sistema, sin editar manualmente `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

La opción `--stage-short-term` incorpora los candidatos duraderos fundamentados al mismo almacén de Dreaming a corto plazo que ya utiliza la fase profunda normal; no los promueve directamente. Por tanto:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- El almacén a corto plazo sigue siendo la superficie de clasificación destinada a la máquina.
- `MEMORY.md` continúa escribiéndose únicamente mediante la promoción profunda.

Para deshacer una reproducción sin modificar las entradas ordinarias del diario ni el estado normal de recuperación:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Comprobar el estado del índice y el proveedor
openclaw memory search "query"  # Buscar desde la línea de comandos
openclaw memory index --force   # Reconstruir el índice
```

## Lecturas adicionales

- [Búsqueda en la memoria](/es/concepts/memory-search): proceso de búsqueda, proveedores y ajustes.
- [Motor de memoria integrado](/es/concepts/memory-builtin): motor SQLite predeterminado.
- [Motor de memoria QMD](/es/concepts/memory-qmd): proceso auxiliar avanzado con prioridad local.
- [Memoria Honcho](/es/concepts/memory-honcho): memoria entre sesiones nativa de IA.
- [Memoria LanceDB](/es/plugins/memory-lancedb): Plugin basado en LanceDB con incrustaciones compatibles con OpenAI.
- [Wiki de memoria](/es/plugins/memory-wiki): repositorio de conocimiento compilado y herramientas nativas de wiki.
- [Dreaming](/es/concepts/dreaming): promoción en segundo plano desde la recuperación a corto plazo hasta la memoria a largo plazo.
- [Referencia de configuración de memoria](/es/reference/memory-config): todas las opciones de configuración.
- [Compaction](/es/concepts/compaction): cómo interactúa Compaction con la memoria.
- [Active Memory](/es/concepts/active-memory): memoria de subagentes para sesiones de chat interactivas.
