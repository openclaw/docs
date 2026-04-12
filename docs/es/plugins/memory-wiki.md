---
read_when:
    - Quieres conocimiento persistente más allá de simples notas en `MEMORY.md`
    - Estás configurando el Plugin memory-wiki incluido
    - Quieres entender `wiki_search`, `wiki_get` o el modo bridge
summary: 'memory-wiki: bóveda de conocimiento compilada con procedencia, afirmaciones, paneles y modo bridge'
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-12T23:29:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Memory Wiki

`memory-wiki` es un Plugin incluido que convierte la memoria duradera en una bóveda de conocimiento compilada.

**No** reemplaza el Plugin de Active Memory. El Plugin de Active Memory sigue encargándose de la recuperación, la promoción, la indexación y Dreaming. `memory-wiki` se sitúa a su lado y compila el conocimiento duradero en una wiki navegable con páginas deterministas, afirmaciones estructuradas, procedencia, paneles y resúmenes legibles por máquina.

Úsalo cuando quieras que la memoria se comporte más como una capa de conocimiento mantenida y menos como un montón de archivos Markdown.

## Qué agrega

- Una bóveda wiki dedicada con un diseño de página determinista
- Metadatos estructurados de afirmaciones y evidencia, no solo prosa
- Procedencia, confianza, contradicciones y preguntas abiertas a nivel de página
- Resúmenes compilados para consumidores de agente/runtime
- Herramientas nativas de wiki para buscar/obtener/aplicar/lint
- Modo bridge opcional que importa artefactos públicos del Plugin de Active Memory
- Modo de renderizado opcional compatible con Obsidian e integración con la CLI

## Cómo encaja con la memoria

Piensa en la división así:

| Capa                                                    | Se encarga de                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin de Active Memory (`memory-core`, QMD, Honcho, etc.) | Recuperación, búsqueda semántica, promoción, Dreaming, runtime de memoria                  |
| `memory-wiki`                                           | Páginas wiki compiladas, síntesis ricas en procedencia, paneles, búsqueda/obtención/aplicación específicas de wiki |

Si el Plugin de Active Memory expone artefactos de recuperación compartidos, OpenClaw puede buscar en ambas capas en una sola pasada con `memory_search corpus=all`.

Cuando necesites clasificación específica de wiki, procedencia o acceso directo a páginas, usa en su lugar las herramientas nativas de wiki.

## Patrón híbrido recomendado

Un valor predeterminado sólido para configuraciones local-first es:

- QMD como backend de memoria activa para recuperación y búsqueda semántica amplia
- `memory-wiki` en modo `bridge` para páginas de conocimiento duradero sintetizadas

Esta división funciona bien porque cada capa sigue enfocada:

- QMD mantiene buscables las notas sin procesar, las exportaciones de sesión y las colecciones adicionales
- `memory-wiki` compila entidades estables, afirmaciones, paneles y páginas fuente

Regla práctica:

- usa `memory_search` cuando quieras una pasada amplia de recuperación en toda la memoria
- usa `wiki_search` y `wiki_get` cuando quieras resultados de wiki con conciencia de procedencia
- usa `memory_search corpus=all` cuando quieras que la búsqueda compartida abarque ambas capas

Si el modo bridge informa cero artefactos exportados, el Plugin de Active Memory no está exponiendo todavía entradas bridge públicas. Ejecuta primero `openclaw wiki doctor` y luego confirma que el Plugin de Active Memory admita artefactos públicos.

## Modos de bóveda

`memory-wiki` admite tres modos de bóveda:

### `isolated`

Bóveda propia, fuentes propias, sin dependencia de `memory-core`.

Usa esto cuando quieras que la wiki sea su propio almacén de conocimiento curado.

### `bridge`

Lee artefactos de memoria públicos y eventos de memoria desde el Plugin de Active Memory a través de interfaces públicas del Plugin SDK.

Usa esto cuando quieras que la wiki compile y organice los artefactos exportados del Plugin de memoria sin acceder a internals privados del Plugin.

El modo bridge puede indexar:

- artefactos de memoria exportados
- reportes de Dreaming
- notas diarias
- archivos raíz de memoria
- registros de eventos de memoria

### `unsafe-local`

Vía de escape explícita en la misma máquina para rutas privadas locales.

Este modo es intencionalmente experimental y no portable. Úsalo solo cuando entiendas el límite de confianza y necesites específicamente acceso al sistema de archivos local que el modo bridge no puede proporcionar.

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

El contenido administrado permanece dentro de bloques generados. Los bloques de notas humanas se conservan.

Los grupos principales de páginas son:

- `sources/` para material sin procesar importado y páginas respaldadas por bridge
- `entities/` para cosas, personas, sistemas, proyectos y objetos duraderos
- `concepts/` para ideas, abstracciones, patrones y políticas
- `syntheses/` para resúmenes compilados y consolidaciones mantenidas
- `reports/` para paneles generados

## Afirmaciones y evidencia estructuradas

Las páginas pueden incluir frontmatter de `claims` estructurado, no solo texto libre.

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

Esto es lo que hace que la wiki actúe más como una capa de creencias que como un simple volcado pasivo de notas. Las afirmaciones pueden rastrearse, puntuarse, refutarse y resolverse de vuelta a las fuentes.

## Canalización de compilación

El paso de compilación lee las páginas wiki, normaliza los resúmenes y emite artefactos estables orientados a máquina en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Estos resúmenes existen para que los agentes y el código de runtime no tengan que extraer información de páginas Markdown.

La salida compilada también alimenta:

- la indexación inicial de la wiki para los flujos de búsqueda/obtención
- la búsqueda por id de afirmación de vuelta a las páginas propietarias
- suplementos compactos de prompt
- la generación de reportes/paneles

## Paneles y reportes de estado

Cuando `render.createDashboards` está habilitado, la compilación mantiene paneles en `reports/`.

Los reportes integrados incluyen:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Estos reportes rastrean cosas como:

- clústeres de notas de contradicciones
- clústeres de afirmaciones en competencia
- afirmaciones sin evidencia estructurada
- páginas y afirmaciones de baja confianza
- antigüedad o frescura desconocida
- páginas con preguntas sin resolver

## Búsqueda y recuperación

`memory-wiki` admite dos backends de búsqueda:

- `shared`: usa el flujo compartido de búsqueda en memoria cuando está disponible
- `local`: busca la wiki localmente

También admite tres corpus:

- `wiki`
- `memory`
- `all`

Comportamiento importante:

- `wiki_search` y `wiki_get` usan resúmenes compilados como primera pasada cuando es posible
- los ids de afirmación pueden resolverse de vuelta a la página propietaria
- las afirmaciones discutidas/antiguas/recientes influyen en la clasificación
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

- `wiki_status`: modo actual de la bóveda, estado, disponibilidad de la CLI de Obsidian
- `wiki_search`: busca páginas wiki y, cuando está configurado, corpus de memoria compartida
- `wiki_get`: lee una página wiki por id/ruta o recurre al corpus de memoria compartida
- `wiki_apply`: mutaciones acotadas de síntesis/metadatos sin cirugía libre sobre la página
- `wiki_lint`: comprobaciones estructurales, huecos de procedencia, contradicciones, preguntas abiertas

El Plugin también registra un suplemento no exclusivo de corpus de memoria, para que `memory_search` y `memory_get` compartidos puedan acceder a la wiki cuando el Plugin de Active Memory admita selección de corpus.

## Comportamiento de prompt y contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones del prompt de memoria agregan una instantánea compilada compacta desde `agent-digest.json`.

Esa instantánea es intencionalmente pequeña y de alta señal:

- solo las páginas principales
- solo las afirmaciones principales
- recuento de contradicciones
- recuento de preguntas
- calificadores de confianza/frescura

Esto es opt-in porque cambia la forma del prompt y resulta útil principalmente para motores de contexto o ensamblado heredado de prompts que consumen explícitamente suplementos de memoria.

## Configuración

Pon la configuración en `plugins.entries.memory-wiki.config`:

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

Interruptores clave:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` o `obsidian`
- `bridge.readMemoryArtifacts`: importa artefactos públicos del Plugin de Active Memory
- `bridge.followMemoryEvents`: incluye registros de eventos en modo bridge
- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `context.includeCompiledDigestPrompt`: agrega una instantánea compacta del resumen a las secciones del prompt de memoria
- `render.createBacklinks`: genera bloques relacionados deterministas
- `render.createDashboards`: genera páginas de panel

### Ejemplo: QMD + modo bridge

Usa esto cuando quieras QMD para recuperación y `memory-wiki` para una capa de conocimiento mantenida:

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

- a QMD a cargo de la recuperación de Active Memory
- a `memory-wiki` enfocado en páginas compiladas y paneles
- la forma del prompt sin cambios hasta que habilites intencionalmente los prompts de resumen compilado

## CLI

`memory-wiki` también expone una superficie de CLI de nivel superior:

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

Consulta [CLI: wiki](/cli/wiki) para la referencia completa de comandos.

## Compatibilidad con Obsidian

Cuando `vault.renderMode` es `obsidian`, el Plugin escribe Markdown compatible con Obsidian y puede usar opcionalmente la CLI oficial `obsidian`.

Los flujos compatibles incluyen:

- sondeo de estado
- búsqueda en la bóveda
- apertura de una página
- invocación de un comando de Obsidian
- salto a la nota diaria

Esto es opcional. La wiki sigue funcionando en modo nativo sin Obsidian.

## Flujo de trabajo recomendado

1. Conserva tu Plugin de Active Memory para recuperación/promoción/Dreaming.
2. Habilita `memory-wiki`.
3. Comienza con el modo `isolated`, salvo que quieras explícitamente el modo bridge.
4. Usa `wiki_search` / `wiki_get` cuando importe la procedencia.
5. Usa `wiki_apply` para síntesis acotadas o actualizaciones de metadatos.
6. Ejecuta `wiki_lint` después de cambios significativos.
7. Activa los paneles si quieres visibilidad sobre antigüedad/contradicciones.

## Documentación relacionada

- [Memory Overview](/es/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Plugin SDK overview](/es/plugins/sdk-overview)
