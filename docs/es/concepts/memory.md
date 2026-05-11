---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo OpenClaw recuerda información entre sesiones
title: Descripción general de la memoria
x-i18n:
    generated_at: "2026-05-11T20:30:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw recuerda cosas escribiendo **archivos Markdown simples** en el espacio de
trabajo de tu agente. El modelo solo "recuerda" lo que se guarda en disco; no
hay estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`**: memoria a largo plazo. Datos duraderos, preferencias y
  decisiones. Se carga al inicio de cada sesión de MD.
- **`memory/YYYY-MM-DD.md`**: notas diarias. Contexto continuo y observaciones.
  Las notas de hoy y de ayer se cargan automáticamente.
- **`DREAMS.md`** (opcional): diario de Dreaming y resúmenes de barridos de
  Dreaming para revisión humana, incluidas entradas fundamentadas de relleno
  histórico.

Estos archivos viven en el espacio de trabajo del agente (valor predeterminado:
`~/.openclaw/workspace`).

## Qué va dónde

`MEMORY.md` es la capa compacta y curada. Úsalo para datos duraderos,
preferencias, decisiones permanentes y resúmenes breves que deben estar
disponibles al inicio de una sesión privada principal. No está pensado para ser
una transcripción sin procesar, un registro diario ni un archivo exhaustivo.

Los archivos `memory/YYYY-MM-DD.md` son la capa de trabajo. Úsalos para notas
diarias detalladas, observaciones, resúmenes de sesión y contexto sin procesar
que todavía podría ser útil más adelante. Estos archivos se indexan para
`memory_search` y `memory_get`, pero no se inyectan en el prompt de arranque
normal en cada turno.

Con el tiempo, se espera que el agente destile material útil de las notas
diarias en `MEMORY.md` y elimine entradas obsoletas de largo plazo. Las
instrucciones generadas del espacio de trabajo y el flujo de Heartbeat pueden
hacerlo periódicamente; no necesitas editar manualmente `MEMORY.md` para cada
detalle recordado.

Si `MEMORY.md` supera el presupuesto del archivo de arranque, OpenClaw mantiene
intacto el archivo en disco, pero trunca la copia inyectada en el contexto del
modelo. Tómalo como una señal para devolver el material detallado a
`memory/*.md`, mantener solo el resumen duradero en `MEMORY.md` o aumentar los
límites de arranque si quieres gastar explícitamente más presupuesto de prompt.
Usa `/context list`, `/context detail` u `openclaw doctor` para ver los tamaños
sin procesar frente a los inyectados y el estado de truncamiento.

<Tip>
Si quieres que tu agente recuerde algo, simplemente pídeselo: "Recuerda que
prefiero TypeScript". Lo escribirá en el archivo apropiado.
</Tip>

## Compromisos inferidos

Algunos seguimientos futuros no son datos duraderos. Si mencionas una entrevista
mañana, la memoria útil puede ser "hacer seguimiento después de la entrevista",
no "guardar esto para siempre en `MEMORY.md`".

Los [compromisos](/es/concepts/commitments) son memorias de seguimiento
opcionales y de corta duración para ese caso. OpenClaw los infiere en una pasada
oculta en segundo plano, los acota al mismo agente y canal, y entrega los
seguimientos vencidos mediante Heartbeat. Los recordatorios explícitos siguen
usando [tareas programadas](/es/automation/cron-jobs).

## Herramientas de memoria

El agente tiene dos herramientas para trabajar con la memoria:

- **`memory_search`**: encuentra notas relevantes usando búsqueda semántica,
  incluso cuando la redacción difiere del original.
- **`memory_get`**: lee un archivo de memoria específico o un rango de líneas.

Ambas herramientas las proporciona el plugin de Active Memory (predeterminado:
`memory-core`).

## Plugin complementario Memory Wiki

Si quieres que la memoria duradera se comporte más como una base de conocimiento
mantenida que como simples notas sin procesar, usa el plugin incluido
`memory-wiki`.

`memory-wiki` compila conocimiento duradero en una bóveda wiki con:

- estructura de páginas determinista
- afirmaciones y evidencia estructuradas
- seguimiento de contradicciones y frescura
- paneles generados
- resúmenes compilados para consumidores de agente/runtime
- herramientas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` y `wiki_lint`

No reemplaza el plugin de Active Memory. El plugin de Active Memory sigue siendo
responsable de la recuperación, la promoción y Dreaming. `memory-wiki` añade una
capa de conocimiento rica en procedencia junto a él.

Consulta [Memory Wiki](/es/plugins/memory-wiki).

## Búsqueda de memoria

Cuando se configura un proveedor de embeddings, `memory_search` usa **búsqueda
híbrida**: combina similitud vectorial (significado semántico) con coincidencia
de palabras clave (términos exactos como IDs y símbolos de código). Esto
funciona de inmediato una vez que tienes una clave de API para cualquier
proveedor compatible.

<Info>
OpenClaw detecta automáticamente tu proveedor de embeddings a partir de las
claves de API disponibles. Si tienes configurada una clave de OpenAI, Gemini,
Voyage o Mistral, la búsqueda de memoria se habilita automáticamente.
</Info>

Para detalles sobre cómo funciona la búsqueda, opciones de ajuste y configuración
de proveedores, consulta [Búsqueda de memoria](/es/concepts/memory-search).

## Backends de memoria

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de inmediato con búsqueda por palabras clave,
similitud vectorial y búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reranking, expansión de consultas y la capacidad de
indexar directorios fuera del espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuario, búsqueda semántica
y conciencia multiagente. Instalación de plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/es/plugins/memory-lancedb">
Memoria incluida respaldada por LanceDB con embeddings compatibles con OpenAI,
recuperación automática, captura automática y compatibilidad con embeddings
locales de Ollama.
</Card>
</CardGroup>

## Capa de wiki de conocimiento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/es/plugins/memory-wiki">
Compila memoria duradera en una bóveda wiki rica en procedencia con
afirmaciones, paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de memoria

Antes de que [Compaction](/es/concepts/compaction) resuma tu conversación, OpenClaw
ejecuta un turno silencioso que recuerda al agente guardar contexto importante
en archivos de memoria. Esto está activado de forma predeterminada; no necesitas
configurar nada.

Para mantener ese turno de mantenimiento en un modelo local, define una
anulación exacta del modelo de vaciado de memoria:

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

La anulación se aplica solo al turno de vaciado de memoria y no hereda la cadena
de alternativas de la sesión activa.

<Tip>
El vaciado de memoria evita la pérdida de contexto durante Compaction. Si tu
agente tiene datos importantes en la conversación que aún no se han escrito en
un archivo, se guardarán automáticamente antes de que ocurra el resumen.
</Tip>

## Dreaming

Dreaming es una pasada opcional de consolidación en segundo plano para la
memoria. Recopila señales de corto plazo, puntúa candidatos y promueve solo los
elementos calificados a la memoria de largo plazo (`MEMORY.md`).

Está diseñado para mantener la memoria de largo plazo con alta señal:

- **Opcional**: deshabilitado de forma predeterminada.
- **Programado**: cuando está habilitado, `memory-core` administra
  automáticamente una tarea Cron recurrente para un barrido completo de Dreaming.
- **Con umbrales**: las promociones deben superar puertas de puntuación,
  frecuencia de recuperación y diversidad de consultas.
- **Revisable**: los resúmenes de fases y las entradas de diario se escriben en
  `DREAMS.md` para revisión humana.

Para el comportamiento de fases, señales de puntuación y detalles del diario de
Dreaming, consulta [Dreaming](/es/concepts/dreaming).

## Relleno fundamentado y promoción en vivo

El sistema de Dreaming ahora tiene dos carriles de revisión estrechamente
relacionados:

- **Dreaming en vivo** trabaja desde el almacén de Dreaming de corto plazo bajo
  `memory/.dreams/` y es lo que usa la fase profunda normal al decidir qué puede
  graduarse a `MEMORY.md`.
- **Relleno fundamentado** lee notas históricas `memory/YYYY-MM-DD.md` como
  archivos de día independientes y escribe salida de revisión estructurada en
  `DREAMS.md`.

El relleno fundamentado es útil cuando quieres reproducir notas antiguas e
inspeccionar qué considera duradero el sistema sin editar manualmente
`MEMORY.md`.

Cuando usas:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

los candidatos duraderos fundamentados no se promueven directamente. Se preparan
en el mismo almacén de Dreaming de corto plazo que ya usa la fase profunda
normal. Eso significa que:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- el almacén de corto plazo sigue siendo la superficie de clasificación orientada a la máquina.
- `MEMORY.md` sigue escribiéndose solo mediante promoción profunda.

Si decides que la reproducción no fue útil, puedes eliminar los artefactos
preparados sin tocar entradas ordinarias del diario ni el estado normal de
recuperación:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Lecturas adicionales

- [Motor de memoria integrado](/es/concepts/memory-builtin): backend SQLite predeterminado.
- [Motor de memoria QMD](/es/concepts/memory-qmd): sidecar local-first avanzado.
- [Memoria Honcho](/es/concepts/memory-honcho): memoria entre sesiones nativa de IA.
- [Memory LanceDB](/es/plugins/memory-lancedb): plugin respaldado por LanceDB con embeddings compatibles con OpenAI.
- [Memory Wiki](/es/plugins/memory-wiki): bóveda de conocimiento compilada y herramientas nativas de wiki.
- [Búsqueda de memoria](/es/concepts/memory-search): canalización de búsqueda, proveedores y ajuste.
- [Dreaming](/es/concepts/dreaming): promoción en segundo plano desde la recuperación de corto plazo a la memoria de largo plazo.
- [Referencia de configuración de memoria](/es/reference/memory-config): todos los controles de configuración.
- [Compaction](/es/concepts/compaction): cómo Compaction interactúa con la memoria.

## Relacionado

- [Active Memory](/es/concepts/active-memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
- [Memoria Honcho](/es/concepts/memory-honcho)
- [Memory LanceDB](/es/plugins/memory-lancedb)
- [Compromisos](/es/concepts/commitments)
