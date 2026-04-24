---
read_when:
    - Quieres conocimiento persistente más allá de simples notas en MEMORY.md
    - Estás configurando el Plugin integrado memory-wiki
    - Quieres entender wiki_search, wiki_get o el modo bridge
summary: 'memory-wiki: bóveda de conocimiento compilada con procedencia, afirmaciones, paneles y modo bridge'
title: Wiki de memoria
x-i18n:
    generated_at: "2026-04-24T05:40:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` es un Plugin incluido que convierte la memoria duradera en una
bóveda de conocimiento compilada.

No reemplaza al Plugin de memoria activo. El Plugin de memoria activo sigue
siendo responsable de la recuperación, promoción, indexación y Dreaming. `memory-wiki` se sitúa a su lado
y compila el conocimiento duradero en una wiki navegable con páginas deterministas,
afirmaciones estructuradas, procedencia, paneles y resúmenes legibles por máquina.

Úsalo cuando quieras que la memoria se comporte más como una capa de conocimiento mantenida y
menos como una pila de archivos Markdown.

## Qué añade

- Una bóveda wiki dedicada con diseño determinista de páginas
- Metadatos estructurados de afirmaciones y evidencia, no solo prosa
- Procedencia a nivel de página, confianza, contradicciones y preguntas abiertas
- Resúmenes compilados para consumidores de agente/tiempo de ejecución
- Herramientas nativas de wiki para search/get/apply/lint
- Modo bridge opcional que importa artefactos públicos del Plugin de memoria activo
- Modo de renderizado compatible con Obsidian e integración CLI opcionales

## Cómo encaja con Memoria

Piensa en la división así:

| Capa                                                    | Es responsable de                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin de memoria activo (`memory-core`, QMD, Honcho, etc.) | Recuperación, búsqueda semántica, promoción, Dreaming, tiempo de ejecución de memoria |
| `memory-wiki`                                           | Páginas wiki compiladas, síntesis ricas en procedencia, paneles, search/get/apply específicos de wiki |

Si el Plugin de memoria activo expone artefactos compartidos de recuperación, OpenClaw puede buscar
en ambas capas en una sola pasada con `memory_search corpus=all`.

Cuando necesites clasificación específica de wiki, procedencia o acceso directo a páginas, usa
las herramientas nativas de wiki en su lugar.

## Patrón híbrido recomendado

Un valor predeterminado sólido para configuraciones local-first es:

- QMD como backend de memoria activo para recuperación y búsqueda semántica amplia
- `memory-wiki` en modo `bridge` para páginas de conocimiento duradero sintetizado

Esa división funciona bien porque cada capa permanece centrada:

- QMD mantiene buscables notas sin procesar, exportaciones de sesiones y colecciones extra
- `memory-wiki` compila entidades estables, afirmaciones, paneles y páginas fuente

Regla práctica:

- usa `memory_search` cuando quieras una pasada amplia de recuperación a través de la memoria
- usa `wiki_search` y `wiki_get` cuando quieras resultados de wiki conscientes de la procedencia
- usa `memory_search corpus=all` cuando quieras que la búsqueda compartida abarque ambas capas

Si el modo bridge informa cero artefactos exportados, el Plugin de memoria activo no está
exponiendo todavía entradas públicas de bridge. Ejecuta primero `openclaw wiki doctor`,
luego confirma que el Plugin de memoria activo admite artefactos públicos.

## Modos de bóveda

`memory-wiki` admite tres modos de bóveda:

### `isolated`

Bóveda propia, fuentes propias, sin dependencia de `memory-core`.

Úsalo cuando quieras que la wiki sea su propio almacén de conocimiento curado.

### `bridge`

Lee artefactos públicos de memoria y eventos de memoria del Plugin de memoria activo
a través de interfaces públicas del SDK de Plugins.

Úsalo cuando quieras que la wiki compile y organice los
artefactos exportados del Plugin de memoria sin acceder a internals privados del Plugin.

El modo bridge puede indexar:

- artefactos de memoria exportados
- informes de sueños
- notas diarias
- archivos raíz de memoria
- registros de eventos de memoria

### `unsafe-local`

Vía de escape explícita para la misma máquina y rutas privadas locales.

Este modo es intencionadamente experimental y no portable. Úsalo solo cuando
entiendas el límite de confianza y necesites específicamente acceso al sistema de archivos local que
el modo bridge no puede proporcionar.

## Diseño de la bóveda

El Plugin inicializa una bóveda así:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

El contenido gestionado permanece dentro de bloques generados. Los bloques de notas humanas se conservan.

Los principales grupos de páginas son:

- `sources/` para material sin procesar importado y páginas respaldadas por bridge
- `entities/` para cosas duraderas, personas, sistemas, proyectos y objetos
- `concepts/` para ideas, abstracciones, patrones y políticas
- `syntheses/` para resúmenes compilados y acumulaciones mantenidas
- `reports/` para paneles generados

## Afirmaciones estructuradas y evidencia

Las páginas pueden incluir frontmatter estructurado `claims`, no solo texto libre.

Cada afirmación puede incluir:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Las entradas de evidencia pueden incluir:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Esto es lo que hace que la wiki actúe más como una capa de creencias que como un volcado pasivo
de notas. Las afirmaciones pueden seguirse, puntuarse, discutirse y resolverse de vuelta a las fuentes.

## Flujo de compilación

El paso de compilación lee páginas wiki, normaliza resúmenes y emite artefactos
estables orientados a máquina bajo:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Estos resúmenes existen para que los agentes y el código de tiempo de ejecución no tengan que raspar páginas Markdown.

La salida compilada también impulsa:

- indexación inicial de la wiki para flujos search/get
- búsqueda por id de afirmación hasta las páginas propietarias
- suplementos compactos de prompt
- generación de informes/paneles

## Paneles e informes de estado

Cuando `render.createDashboards` está habilitado, compile mantiene paneles bajo
`reports/`.

Los informes integrados incluyen:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Estos informes hacen seguimiento de cosas como:

- clústeres de notas de contradicción
- clústeres de afirmaciones en competencia
- afirmaciones sin evidencia estructurada
- páginas y afirmaciones de baja confianza
- contenido obsoleto o con antigüedad desconocida
- páginas con preguntas no resueltas

## Búsqueda y recuperación

`memory-wiki` admite dos backends de búsqueda:

- `shared`: usar el flujo compartido de búsqueda de memoria cuando esté disponible
- `local`: buscar localmente en la wiki

También admite tres corpora:

- `wiki`
- `memory`
- `all`

Comportamiento importante:

- `wiki_search` y `wiki_get` usan resúmenes compilados como primera pasada cuando es posible
- los id de afirmaciones pueden resolverse de vuelta a la página propietaria
- las afirmaciones discutidas/obsoletas/recientes influyen en la clasificación
- las etiquetas de procedencia pueden mantenerse en los resultados

Regla práctica:

- usa `memory_search corpus=all` para una pasada amplia de recuperación
- usa `wiki_search` + `wiki_get` cuando te importe la clasificación específica de wiki,
  la procedencia o la estructura de creencias a nivel de página

## Herramientas del agente

El Plugin registra estas herramientas:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Qué hacen:

- `wiki_status`: modo actual de bóveda, estado, disponibilidad de CLI de Obsidian
- `wiki_search`: buscar páginas wiki y, cuando esté configurado, corpora compartidos de memoria
- `wiki_get`: leer una página wiki por id/ruta o recurrir al corpus compartido de memoria
- `wiki_apply`: mutaciones limitadas de síntesis/metadatos sin cirugía libre de páginas
- `wiki_lint`: comprobaciones estructurales, huecos de procedencia, contradicciones, preguntas abiertas

El Plugin también registra un suplemento no exclusivo de corpus de memoria, para que
`memory_search` y `memory_get` compartidos puedan alcanzar la wiki cuando el Plugin de memoria activo
admita selección de corpus.

## Comportamiento de prompt y contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones del prompt de memoria
agregan una instantánea compacta compilada desde `agent-digest.json`.

Esa instantánea es intencionadamente pequeña y de alta señal:

- solo páginas principales
- solo afirmaciones principales
- recuento de contradicciones
- recuento de preguntas
- calificadores de confianza/antigüedad

Esto es opt-in porque cambia la forma del prompt y es principalmente útil para motores de
contexto o ensamblado heredado de prompts que consuman explícitamente suplementos de memoria.

## Configuración

Pon la configuración bajo `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Alternancias clave:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` o `obsidian`
- `bridge.readMemoryArtifacts`: importar artefactos públicos del Plugin de memoria activo
- `bridge.followMemoryEvents`: incluir registros de eventos en modo bridge
- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `context.includeCompiledDigestPrompt`: agregar instantánea compacta del resumen a las secciones del prompt de memoria
- `render.createBacklinks`: generar bloques relacionados deterministas
- `render.createDashboards`: generar páginas de panel

### Ejemplo: QMD + modo bridge

Usa esto cuando quieras QMD para recuperación y `memory-wiki` para una capa
de conocimiento mantenida:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Esto mantiene:

- QMD a cargo de la recuperación de memoria activa
- `memory-wiki` centrado en páginas compiladas y paneles
- la forma del prompt sin cambios hasta que habilites intencionadamente prompts de resumen compilado

## CLI

`memory-wiki` también expone una superficie CLI de nivel superior:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Consulta [CLI: wiki](/es/cli/wiki) para ver la referencia completa de comandos.

## Compatibilidad con Obsidian

Cuando `vault.renderMode` es `obsidian`, el Plugin escribe
Markdown compatible con Obsidian y puede usar opcionalmente la CLI oficial `obsidian`.

Los flujos compatibles incluyen:

- comprobación de estado
- búsqueda en bóveda
- apertura de una página
- invocación de un comando de Obsidian
- salto a la nota diaria

Esto es opcional. La wiki sigue funcionando en modo nativo sin Obsidian.

## Flujo de trabajo recomendado

1. Mantén tu Plugin de memoria activo para recuperación/promoción/Dreaming.
2. Habilita `memory-wiki`.
3. Empieza con el modo `isolated` salvo que quieras explícitamente el modo bridge.
4. Usa `wiki_search` / `wiki_get` cuando importe la procedencia.
5. Usa `wiki_apply` para síntesis limitadas o actualizaciones de metadatos.
6. Ejecuta `wiki_lint` después de cambios significativos.
7. Activa paneles si quieres visibilidad de contenido obsoleto/contradicciones.

## Documentación relacionada

- [Descripción general de Memoria](/es/concepts/memory)
- [CLI: memory](/es/cli/memory)
- [CLI: wiki](/es/cli/wiki)
- [Descripción general del SDK de Plugins](/es/plugins/sdk-overview)
