---
read_when:
    - Quieres conocimiento persistente más allá de simples notas en MEMORY.md
    - Estás configurando el plugin empaquetado memory-wiki
    - Quieres entender wiki_search, wiki_get o el modo puente
summary: 'memory-wiki: bóveda de conocimiento compilada con procedencia, afirmaciones, paneles y modo puente'
title: Wiki de Memoria
x-i18n:
    generated_at: "2026-04-08T05:03:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: b78dd6a4ef4451dae6b53197bf0c7c2a2ba846b08e4a3a93c1026366b1598d82
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Wiki de Memoria

`memory-wiki` es un plugin empaquetado que convierte la memoria duradera en una
bóveda de conocimiento compilada.

**No** reemplaza al plugin de memoria activo. El plugin de memoria activo sigue
encargándose de la recuperación, promoción, indexación y dreaming. `memory-wiki`
se sitúa junto a él y compila el conocimiento duradero en una wiki navegable con páginas deterministas,
afirmaciones estructuradas, procedencia, paneles y resúmenes legibles por máquina.

Úsalo cuando quieras que la memoria se comporte más como una capa de conocimiento mantenida y
menos como una pila de archivos Markdown.

## Qué añade

- Una bóveda wiki dedicada con un diseño de páginas determinista
- Metadatos estructurados de afirmaciones y evidencia, no solo prosa
- Procedencia, confianza, contradicciones y preguntas abiertas a nivel de página
- Resúmenes compilados para consumidores de agente/runtime
- Herramientas nativas de wiki para search/get/apply/lint
- Modo puente opcional que importa artefactos públicos desde el plugin de memoria activo
- Modo de renderizado opcional compatible con Obsidian e integración con la CLI

## Cómo encaja con la memoria

Piensa en la división de esta manera:

| Capa                                                    | Se encarga de                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin de memoria activo (`memory-core`, QMD, Honcho, etc.) | Recuperación, búsqueda semántica, promoción, dreaming, runtime de memoria                  |
| `memory-wiki`                                           | Páginas wiki compiladas, síntesis con procedencia enriquecida, paneles, wiki-specific search/get/apply |

Si el plugin de memoria activo expone artefactos de recuperación compartidos, OpenClaw puede buscar
en ambas capas en una sola pasada con `memory_search corpus=all`.

Cuando necesites clasificación específica de la wiki, procedencia o acceso directo a páginas, usa en su lugar las
herramientas nativas de la wiki.

## Modos de bóveda

`memory-wiki` admite tres modos de bóveda:

### `isolated`

Bóveda propia, fuentes propias, sin dependencia de `memory-core`.

Úsalo cuando quieras que la wiki sea su propia tienda de conocimiento curada.

### `bridge`

Lee artefactos públicos de memoria y eventos de memoria del plugin de memoria activo
a través de interfaces públicas del plugin SDK.

Úsalo cuando quieras que la wiki compile y organice los
artefactos exportados por el plugin de memoria sin acceder a elementos internos privados del plugin.

El modo puente puede indexar:

- artefactos de memoria exportados
- informes de sueños
- notas diarias
- archivos raíz de memoria
- registros de eventos de memoria

### `unsafe-local`

Vía de escape explícita en la misma máquina para rutas privadas locales.

Este modo es intencionalmente experimental y no portable. Úsalo solo cuando
entiendas el límite de confianza y necesites específicamente acceso al sistema de archivos local que
el modo puente no puede proporcionar.

## Diseño de la bóveda

El plugin inicializa una bóveda así:

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

Los grupos principales de páginas son:

- `sources/` para material bruto importado y páginas respaldadas por puente
- `entities/` para cosas, personas, sistemas, proyectos y objetos duraderos
- `concepts/` para ideas, abstracciones, patrones y políticas
- `syntheses/` para resúmenes compilados y consolidaciones mantenidas
- `reports/` para paneles generados

## Afirmaciones estructuradas y evidencia

Las páginas pueden llevar frontmatter de `claims` estructurado, no solo texto libre.

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

Esto es lo que hace que la wiki actúe más como una capa de creencias que como un simple
volcado de notas. Las afirmaciones pueden rastrearse, puntuarse, debatirse y resolverse de vuelta a las fuentes.

## Canalización de compilación

El paso de compilación lee las páginas de la wiki, normaliza los resúmenes y emite artefactos estables
orientados a máquina en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Estos resúmenes existen para que los agentes y el código de runtime no tengan que extraer datos de las
páginas Markdown.

La salida compilada también impulsa:

- indexación inicial de la wiki para flujos de search/get
- búsqueda por id de afirmación hasta la página propietaria
- complementos de prompt compactos
- generación de informes/paneles

## Paneles e informes de estado

Cuando `render.createDashboards` está habilitado, la compilación mantiene paneles en
`reports/`.

Los informes integrados incluyen:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Estos informes rastrean aspectos como:

- grupos de notas de contradicción
- grupos de afirmaciones en competencia
- afirmaciones sin evidencia estructurada
- páginas y afirmaciones con baja confianza
- antigüedad o frescura desconocida
- páginas con preguntas sin resolver

## Búsqueda y recuperación

`memory-wiki` admite dos backends de búsqueda:

- `shared`: usar el flujo de búsqueda de memoria compartida cuando esté disponible
- `local`: buscar en la wiki localmente

También admite tres corpus:

- `wiki`
- `memory`
- `all`

Comportamiento importante:

- `wiki_search` y `wiki_get` usan resúmenes compilados como primera pasada cuando es posible
- los id de afirmación pueden resolverse de vuelta a la página propietaria
- las afirmaciones debatidas/antiguas/frescas influyen en la clasificación
- las etiquetas de procedencia pueden mantenerse en los resultados

Regla práctica:

- usa `memory_search corpus=all` para una pasada amplia de recuperación
- usa `wiki_search` + `wiki_get` cuando te importe la clasificación específica de la wiki,
  la procedencia o la estructura de creencias a nivel de página

## Herramientas del agente

El plugin registra estas herramientas:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Qué hacen:

- `wiki_status`: modo de bóveda actual, estado, disponibilidad de la CLI de Obsidian
- `wiki_search`: buscar páginas wiki y, cuando esté configurado, corpus de memoria compartida
- `wiki_get`: leer una página wiki por id/ruta o recurrir al corpus de memoria compartida
- `wiki_apply`: mutaciones acotadas de síntesis/metadatos sin cirugía libre de páginas
- `wiki_lint`: comprobaciones estructurales, huecos de procedencia, contradicciones, preguntas abiertas

El plugin también registra un suplemento de corpus de memoria no exclusivo, por lo que
`memory_search` y `memory_get` compartidos pueden acceder a la wiki cuando el plugin de memoria activo
admite selección de corpus.

## Comportamiento de prompt y contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones de prompt de memoria
agregan una instantánea compilada compacta desde `agent-digest.json`.

Esa instantánea es intencionalmente pequeña y de alta señal:

- solo páginas principales
- solo afirmaciones principales
- conteo de contradicciones
- conteo de preguntas
- calificadores de confianza/frescura

Esto es opcional porque cambia la forma del prompt y resulta principalmente útil para
motores de contexto o ensamblado heredado de prompts que consumen explícitamente complementos de memoria.

## Configuración

Coloca la configuración en `plugins.entries.memory-wiki.config`:

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
- `vault.renderMode`: `native` u `obsidian`
- `bridge.readMemoryArtifacts`: importar artefactos públicos del plugin de memoria activo
- `bridge.followMemoryEvents`: incluir registros de eventos en modo puente
- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `context.includeCompiledDigestPrompt`: agregar una instantánea compacta del resumen a las secciones de prompt de memoria
- `render.createBacklinks`: generar bloques relacionados deterministas
- `render.createDashboards`: generar páginas de panel

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

Cuando `vault.renderMode` es `obsidian`, el plugin escribe Markdown compatible con Obsidian
y puede usar opcionalmente la CLI oficial `obsidian`.

Los flujos de trabajo compatibles incluyen:

- sondeo de estado
- búsqueda en la bóveda
- apertura de una página
- invocación de un comando de Obsidian
- salto a la nota diaria

Esto es opcional. La wiki sigue funcionando en modo nativo sin Obsidian.

## Flujo de trabajo recomendado

1. Mantén tu plugin de memoria activo para recuperación/promoción/dreaming.
2. Habilita `memory-wiki`.
3. Comienza con el modo `isolated` a menos que quieras explícitamente el modo puente.
4. Usa `wiki_search` / `wiki_get` cuando la procedencia importe.
5. Usa `wiki_apply` para síntesis acotadas o actualizaciones de metadatos.
6. Ejecuta `wiki_lint` después de cambios significativos.
7. Activa los paneles si quieres visibilidad sobre antigüedad/contradicciones.

## Documentación relacionada

- [Resumen de memoria](/es/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Resumen del Plugin SDK](/es/plugins/sdk-overview)
