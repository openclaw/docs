---
read_when:
    - Quieres conocimiento persistente más allá de simples notas de MEMORY.md
    - Está configurando el Plugin memory-wiki incluido
    - Quieres entender wiki_search, wiki_get o el modo puente
summary: 'memory-wiki: bóveda de conocimiento compilada con procedencia, afirmaciones, paneles y modo puente'
title: Wiki de memoria
x-i18n:
    generated_at: "2026-05-04T02:25:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` es un Plugin incluido que convierte la memoria duradera en una
bóveda de conocimiento compilada.

**No** reemplaza al Plugin Active Memory. El Plugin Active Memory sigue
encargándose de la recuperación, la promoción, la indexación y Dreaming. `memory-wiki` se sitúa junto a él
y compila el conocimiento duradero en una wiki navegable con páginas deterministas,
declaraciones estructuradas, procedencia, paneles y resúmenes legibles por máquina.

Úsalo cuando quieras que la memoria se comporte más como una capa de conocimiento mantenida y
menos como un montón de archivos Markdown.

## Qué añade

- Una bóveda wiki dedicada con diseño de página determinista
- Metadatos estructurados de declaraciones y evidencia, no solo prosa
- Procedencia, confianza, contradicciones y preguntas abiertas a nivel de página
- Resúmenes compilados para consumidores de agentes/runtime
- Herramientas nativas de wiki para buscar/obtener/aplicar/analizar
- Modo de puente opcional que importa artefactos públicos desde el Plugin Active Memory
- Modo de renderizado compatible con Obsidian e integración con CLI opcionales

## Cómo encaja con la memoria

Piensa en la división así:

| Capa                                                   | Encargada de                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, etc.) | Recuperación, búsqueda semántica, promoción, Dreaming, runtime de memoria                               |
| `memory-wiki`                                           | Páginas wiki compiladas, síntesis con procedencia enriquecida, paneles, búsqueda/obtención/aplicación específicas de wiki |

Si el Plugin Active Memory expone artefactos de recuperación compartidos, OpenClaw puede buscar
en ambas capas en una sola pasada con `memory_search corpus=all`.

Cuando necesites ranking específico de wiki, procedencia o acceso directo a páginas, usa las
herramientas nativas de wiki en su lugar.

## Patrón híbrido recomendado

Un valor predeterminado sólido para configuraciones local-first es:

- QMD como backend de Active Memory para recuperación y búsqueda semántica amplia
- `memory-wiki` en modo `bridge` para páginas de conocimiento sintetizado duradero

Esa división funciona bien porque cada capa se mantiene enfocada:

- QMD mantiene notas sin procesar, exportaciones de sesiones y colecciones adicionales buscables
- `memory-wiki` compila entidades estables, declaraciones, paneles y páginas fuente

Regla práctica:

- usa `memory_search` cuando quieras una sola pasada amplia de recuperación en la memoria
- usa `wiki_search` y `wiki_get` cuando quieras resultados de wiki conscientes de la procedencia
- usa `memory_search corpus=all` cuando quieras que la búsqueda compartida abarque ambas capas

Si el modo de puente informa cero artefactos exportados, el Plugin Active Memory no
está exponiendo actualmente entradas públicas de puente todavía. Ejecuta `openclaw wiki doctor` primero,
luego confirma que el Plugin Active Memory admite artefactos públicos.

Cuando el modo de puente está activo y `bridge.readMemoryArtifacts` está habilitado,
`openclaw wiki status`, `openclaw wiki doctor` y `openclaw wiki bridge
import` leen a través del Gateway en ejecución. Eso mantiene las comprobaciones de puente de la CLI alineadas
con el contexto runtime del Plugin de memoria. Si el puente está deshabilitado o las lecturas de artefactos
están desactivadas, esos comandos conservan su comportamiento local/sin conexión.

## Modos de bóveda

`memory-wiki` admite tres modos de bóveda:

### `isolated`

Bóveda propia, fuentes propias, sin dependencia de `memory-core`.

Usa esto cuando quieras que la wiki sea su propio almacén de conocimiento curado.

### `bridge`

Lee artefactos de memoria públicos y eventos de memoria desde el Plugin Active Memory
a través de interfaces públicas del SDK de Plugin.

Usa esto cuando quieras que la wiki compile y organice los artefactos exportados del Plugin de memoria
sin acceder a elementos internos privados del Plugin.

El modo de puente puede indexar:

- artefactos de memoria exportados
- informes de Dreaming
- notas diarias
- archivos raíz de memoria
- registros de eventos de memoria

### `unsafe-local`

Vía de escape explícita de la misma máquina para rutas privadas locales.

Este modo es intencionalmente experimental y no portable. Úsalo solo cuando
entiendas el límite de confianza y necesites específicamente acceso al sistema de archivos local que
el modo de puente no puede proporcionar.

## Diseño de bóveda

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

El contenido administrado permanece dentro de bloques generados. Los bloques de notas humanas se preservan.

Los grupos principales de páginas son:

- `sources/` para material sin procesar importado y páginas respaldadas por puente
- `entities/` para cosas, personas, sistemas, proyectos y objetos duraderos
- `concepts/` para ideas, abstracciones, patrones y políticas
- `syntheses/` para resúmenes compilados y acumulaciones mantenidas
- `reports/` para paneles generados

## Declaraciones estructuradas y evidencia

Las páginas pueden llevar frontmatter `claims` estructurado, no solo texto libre.

Cada declaración puede incluir:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Las entradas de evidencia pueden incluir:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Esto es lo que hace que la wiki actúe más como una capa de creencias que como un volcado pasivo de notas.
Las declaraciones pueden rastrearse, puntuarse, disputarse y resolverse de vuelta a las fuentes.

## Metadatos de entidades orientados a agentes

Las páginas de entidad también pueden llevar metadatos de enrutamiento para uso de agentes. Esto es frontmatter
genérico, así que funciona para personas, equipos, sistemas, proyectos o cualquier otro
tipo de entidad.

Los campos comunes incluyen:

- `entityType`: por ejemplo `person`, `team`, `system` o `project`
- `canonicalId`: clave de identidad estable usada en alias e importaciones
- `aliases`: nombres, identificadores o etiquetas que deben resolverse a la misma página
- `privacyTier`: `public`, `local-private`, `sensitive` o `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: pistas compactas de enrutamiento
- `lastRefreshedAt`: marca de tiempo de actualización de fuente separada de la hora de edición de la página
- `personCard`: tarjeta opcional de enrutamiento específica de persona con identificadores, redes sociales,
  correos electrónicos, zona horaria, línea, preguntar por, evitar preguntar por, confianza y privacidad
- `relationships`: aristas tipadas a páginas relacionadas con destino, tipo, peso,
  confianza, tipo de evidencia, nivel de privacidad y nota

Para una wiki de personas, el agente normalmente debe empezar con
`reports/person-agent-directory.md`, luego abrir la página de la persona con `wiki_get`
antes de usar datos de contacto o hechos inferidos.

Ejemplo:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Canalización de compilación

El paso de compilación lee páginas wiki, normaliza resúmenes y emite artefactos estables
orientados a máquina en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Estos resúmenes existen para que los agentes y el código runtime no tengan que extraer datos de páginas
Markdown.

La salida compilada también impulsa:

- indexación wiki de primera pasada para flujos de búsqueda/obtención
- búsqueda de id de declaración de vuelta a las páginas propietarias
- suplementos compactos de prompts
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
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Estos informes rastrean cosas como:

- clústeres de notas de contradicción
- clústeres de declaraciones en competencia
- declaraciones sin evidencia estructurada
- páginas y declaraciones de baja confianza
- frescura obsoleta o desconocida
- páginas con preguntas sin resolver
- tarjetas de enrutamiento de persona/entidad
- aristas de relación estructuradas
- cobertura de clases de evidencia
- niveles de privacidad no públicos que necesitan revisión antes de su uso

## Búsqueda y recuperación

`memory-wiki` admite dos backends de búsqueda:

- `shared`: usa el flujo de búsqueda de memoria compartida cuando esté disponible
- `local`: busca en la wiki localmente

También admite tres corpus:

- `wiki`
- `memory`
- `all`

Comportamiento importante:

- `wiki_search` y `wiki_get` usan resúmenes compilados como primera pasada cuando es posible
- los ids de declaraciones pueden resolverse de vuelta a la página propietaria
- las declaraciones disputadas/obsoletas/actuales influyen en el ranking
- las etiquetas de procedencia pueden sobrevivir en los resultados
- el modo de búsqueda puede sesgar el ranking para búsqueda de personas, enrutamiento de preguntas, evidencia
  de fuentes o declaraciones sin procesar

Regla práctica:

- usa `memory_search corpus=all` para una sola pasada amplia de recuperación
- usa `wiki_search` + `wiki_get` cuando te importe el ranking específico de wiki,
  la procedencia o la estructura de creencias a nivel de página

Modos de búsqueda:

- `auto`: valor predeterminado equilibrado
- `find-person`: impulsa entidades similares a personas, alias, identificadores, redes sociales e
  ids canónicos
- `route-question`: impulsa tarjetas de agente, pistas de preguntar por, pistas de mejor uso y
  contexto de relaciones
- `source-evidence`: impulsa páginas fuente y metadatos de evidencia estructurada
- `raw-claim`: impulsa declaraciones estructuradas coincidentes y devuelve metadatos de declaración/evidencia
  en los resultados

Cuando un resultado coincide con una declaración estructurada, `wiki_search` puede devolver
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` y `evidenceSourceIds` en su carga de detalles. La salida de texto
también incluye líneas compactas `Claim:` y `Evidence:` cuando están disponibles.

## Herramientas de agente

El Plugin registra estas herramientas:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Qué hacen:

- `wiki_status`: modo de bóveda actual, estado, disponibilidad de la CLI de Obsidian
- `wiki_search`: busca páginas wiki y, cuando está configurado, corpus de memoria compartida;
  acepta `mode` para búsqueda de personas, enrutamiento de preguntas, evidencia de fuentes o desglose de declaraciones
  sin procesar
- `wiki_get`: lee una página wiki por id/ruta o recurre al corpus de memoria compartida
- `wiki_apply`: mutaciones estrechas de síntesis/metadatos sin cirugía libre de página
- `wiki_lint`: comprobaciones estructurales, vacíos de procedencia, contradicciones, preguntas abiertas

El Plugin también registra un suplemento no exclusivo de corpus de memoria, de modo que
`memory_search` y `memory_get` compartidos puedan llegar a la wiki cuando el Plugin Active Memory
admita selección de corpus.

## Comportamiento de prompt y contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones de prompt de memoria
añaden una instantánea compilada compacta desde `agent-digest.json`.

Esa instantánea es intencionalmente pequeña y de alta señal:

- solo páginas principales
- solo declaraciones principales
- recuento de contradicciones
- recuento de preguntas
- calificadores de confianza/frescura

Esto es opcional porque cambia la forma del prompt y es útil principalmente para motores de contexto
o ensamblaje heredado de prompts que consumen explícitamente suplementos de memoria.

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

Opciones clave:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` u `obsidian`
- `bridge.readMemoryArtifacts`: importar artefactos públicos del Plugin de Active Memory
- `bridge.followMemoryEvents`: incluir registros de eventos en modo bridge
- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `context.includeCompiledDigestPrompt`: anexar una instantánea compacta del compendio a las secciones del prompt de memoria
- `render.createBacklinks`: generar bloques relacionados deterministas
- `render.createDashboards`: generar páginas de panel

### Ejemplo: QMD + modo bridge

Usa esto cuando quieras QMD para recuperación y `memory-wiki` para una capa de
conocimiento mantenida:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

- QMD a cargo de la recuperación de Active Memory
- `memory-wiki` centrado en páginas compiladas y paneles
- la forma del prompt sin cambios hasta que habilites intencionalmente los prompts de compendio compilado

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

Consulta [CLI: wiki](/es/cli/wiki) para ver la referencia completa de comandos.

## Compatibilidad con Obsidian

Cuando `vault.renderMode` es `obsidian`, el Plugin escribe Markdown compatible
con Obsidian y, opcionalmente, puede usar la CLI oficial `obsidian`.

Los flujos de trabajo compatibles incluyen:

- sondeo de estado
- búsqueda en el almacén
- apertura de una página
- invocación de un comando de Obsidian
- salto a la nota diaria

Esto es opcional. La wiki sigue funcionando en modo nativo sin Obsidian.

## Flujo de trabajo recomendado

1. Conserva tu Plugin de Active Memory para recuperación/promoción/Dreaming.
2. Habilita `memory-wiki`.
3. Empieza con el modo `isolated`, salvo que quieras explícitamente el modo bridge.
4. Usa `wiki_search` / `wiki_get` cuando la procedencia sea importante.
5. Usa `wiki_apply` para síntesis acotadas o actualizaciones de metadatos.
6. Ejecuta `wiki_lint` después de cambios significativos.
7. Activa los paneles si quieres visibilidad de obsolescencia/contradicciones.

## Documentación relacionada

- [Resumen de memoria](/es/concepts/memory)
- [CLI: memory](/es/cli/memory)
- [CLI: wiki](/es/cli/wiki)
- [Resumen del Plugin SDK](/es/plugins/sdk-overview)
