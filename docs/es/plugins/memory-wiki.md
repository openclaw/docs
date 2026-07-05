---
read_when:
    - Quieres conocimiento persistente más allá de simples notas de MEMORY.md
    - Estás configurando el Plugin memory-wiki incluido
    - Quieres entender `wiki_search`, `wiki_get` o el modo puente
summary: 'memory-wiki: bóveda de conocimiento compilada con procedencia, afirmaciones, paneles y modo puente'
title: Wiki de memoria
x-i18n:
    generated_at: "2026-07-05T11:35:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e6233922483e0e858cb39cdeb2537e5f454e5b6df0c49ea5b89dc56da3e0bfe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` es un plugin incluido que compila conocimiento duradero en una
wiki navegable: páginas deterministas, afirmaciones estructuradas con evidencia,
procedencia, paneles y resúmenes legibles por máquina.

No reemplaza al plugin de memoria activa. La recuperación, promoción, indexación y
Dreaming siguen perteneciendo al backend de memoria que esté configurado
(`memory-core`, QMD, Honcho, etc.). `memory-wiki` se ubica junto a él y compila
conocimiento en una capa wiki mantenida.

| Capa                 | Posee                                                                             |
| -------------------- | --------------------------------------------------------------------------------- |
| Plugin de memoria activa | Recuperación, búsqueda semántica, promoción, Dreaming, runtime de memoria     |
| `memory-wiki`        | Páginas wiki compiladas, síntesis con procedencia enriquecida, paneles, búsqueda/obtención/aplicación de wiki |

Regla práctica:

- `memory_search` para una pasada amplia de recuperación en los corpus que estén configurados
- `wiki_search` / `wiki_get` cuando quieras ranking específico de wiki, procedencia o estructura de creencias a nivel de página
- `memory_search corpus=all` para abarcar ambas capas en una llamada, cuando el plugin de memoria activa admite selección de corpus

Una configuración local-first común: QMD como backend de memoria activa para recuperación y
`memory-wiki` en modo `bridge` para páginas sintetizadas duraderas. Consulta el
ejemplo de modo QMD + bridge en [Configuración](#configuration).

Si el modo bridge informa cero artefactos exportados, el plugin de memoria activa
no está exponiendo actualmente entradas bridge públicas. Ejecuta `openclaw wiki doctor` primero,
luego confirma que el plugin de memoria activa admita artefactos públicos.

## Modos de bóveda

- `isolated` (predeterminado): bóveda propia, fuentes propias, sin dependencia del plugin de memoria activa. Usa esto para un almacén de conocimiento curado autónomo.
- `bridge`: lee artefactos públicos de memoria y registros de eventos desde el plugin de memoria activa mediante puntos de unión públicos del SDK de plugins. Usa esto para compilar los artefactos exportados del plugin de memoria sin acceder a sus componentes internos privados.
- `unsafe-local`: vía de escape explícita en la misma máquina para rutas privadas locales. Intencionadamente experimental y no portable; úsala solo cuando entiendas el límite de confianza y necesites específicamente acceso al sistema de archivos local que el modo bridge no puede proporcionar.

El modo bridge puede indexar, según el selector de configuración `bridge.*`:

- artefactos de memoria exportados (`indexMemoryRoot`)
- notas diarias (`indexDailyNotes`)
- informes de sueños (`indexDreamReports`)
- registros de eventos de memoria (`followMemoryEvents`)

Cuando el modo bridge está activo y `bridge.readMemoryArtifacts` está habilitado,
`openclaw wiki status`, `openclaw wiki doctor` y `openclaw wiki bridge
import` se enrutan a través del Gateway en ejecución para que vean el mismo contexto del plugin de memoria activa
que la memoria de agente/runtime. Si bridge está deshabilitado o las
lecturas de artefactos están desactivadas, esos comandos mantienen el comportamiento local/sin conexión.

## Diseño de la bóveda

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

El contenido administrado permanece dentro de bloques generados; los bloques de notas humanas se
preservan entre regeneraciones.

- `sources/`: material bruto importado y páginas respaldadas por bridge/unsafe-local
- `entities/`: cosas, personas, sistemas, proyectos y objetos duraderos
- `concepts/`: ideas, abstracciones, patrones, políticas (también el destino de las importaciones OKF)
- `syntheses/`: resúmenes compilados y acumulaciones mantenidas
- `reports/`: paneles generados

## Importaciones de Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importa un paquete Open Knowledge Format desempaquetado en páginas de conceptos wiki. Encaja bien
cuando un catálogo de datos, rastreador de documentación o agente de enriquecimiento ya
produce OKF: conserva OKF como artefacto de intercambio portable, deja que `memory-wiki`
lo convierta en páginas de conceptos nativas de OpenClaw y resúmenes compilados.

- los archivos `.md` no reservados son documentos de concepto
- cada concepto importado requiere un campo de frontmatter `type` no vacío; si falta `type`, se produce una advertencia `missing-type` y se omite el archivo
- los valores de `type` desconocidos se aceptan como conceptos genéricos
- `index.md` y `log.md` están reservados y nunca se importan como conceptos
- los enlaces Markdown rotos o externos se dejan sin cambios

Las páginas importadas se aplanan bajo `concepts/` para que los flujos existentes de compilación, búsqueda, obtención y
paneles las vean sin un segundo árbol wiki. Cada página conserva el
ID de concepto OKF original, la ruta fuente, `type`, `resource`, `tags`, la marca de tiempo
y el frontmatter completo del productor. Los enlaces internos OKF se reescriben a las páginas de conceptos wiki
generadas y también emiten entradas estructuradas `relationships` con
`kind: okf-link`.

## Afirmaciones estructuradas y evidencia

Las páginas llevan frontmatter `claims` estructurado, no solo texto libre. Cada
afirmación puede incluir `id`, `text`, `status`, `confidence`, `evidence[]` y
`updatedAt`. Cada entrada de evidencia puede incluir `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` y `updatedAt`.

Esto hace que la wiki se comporte como una capa de creencias, no como un volcado pasivo de notas.
Las afirmaciones se pueden rastrear, puntuar, impugnar y resolver de vuelta a las fuentes.

## Metadatos de entidad orientados a agentes

Las páginas de entidad llevan metadatos de enrutamiento genéricos utilizables para personas, equipos,
sistemas, proyectos o cualquier otro tipo de entidad:

- `entityType`: por ejemplo `person`, `team`, `system`, `project`
- `canonicalId`: clave de identidad estable entre alias e importaciones
- `aliases`: nombres, identificadores o etiquetas que se resuelven a la misma página
- `privacyTier`: cadena de formato libre; `public` se trata como sin revisión, cualquier otro valor (por ejemplo `local-private`, `sensitive`, `confirm-before-use`) se marca en `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: pistas compactas de enrutamiento
- `lastRefreshedAt`: marca de tiempo de actualización de fuente, separada del momento de edición de la página
- `personCard`: tarjeta opcional de enrutamiento específica de persona (identificadores, redes sociales, correos, zona horaria, carril, pedir por, evitar pedir por, confianza, nivel de privacidad)
- `relationships`: aristas tipadas a páginas relacionadas (destino, tipo, peso, confianza, tipo de evidencia, nivel de privacidad, nota)

Para una wiki de personas, empieza con `reports/person-agent-directory.md`, luego abre
la página de la persona con `wiki_get` antes de usar datos de contacto o hechos
inferidos.

<Accordion title="Entity page example">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Canalización de compilación

La compilación lee páginas wiki, normaliza resúmenes y emite artefactos estables
orientados a máquinas bajo:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Los agentes y el código runtime leen estos resúmenes en lugar de raspar Markdown.
La salida compilada también impulsa la indexación wiki de primera pasada para búsqueda/obtención, la
búsqueda de ID de afirmación de vuelta a las páginas propietarias, suplementos compactos de prompt y generación de
informes.

## Paneles e informes de salud

Cuando `render.createDashboards` está habilitado, la compilación mantiene paneles bajo
`reports/`:

| Informe                             | Rastrea                                            |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | páginas con preguntas sin resolver                 |
| `reports/contradictions.md`         | clústeres de notas de contradicción                |
| `reports/low-confidence.md`         | páginas y afirmaciones de baja confianza           |
| `reports/claim-health.md`           | afirmaciones sin evidencia estructurada            |
| `reports/stale-pages.md`            | frescura obsoleta o desconocida                    |
| `reports/person-agent-directory.md` | tarjetas de enrutamiento de personas/entidades     |
| `reports/relationship-graph.md`     | aristas de relación estructuradas                  |
| `reports/provenance-coverage.md`    | cobertura de clases de evidencia                   |
| `reports/privacy-review.md`         | niveles de privacidad no públicos que necesitan revisión antes de usarse |

## Búsqueda y recuperación

Dos backends de búsqueda:

- `shared`: usa el flujo compartido de búsqueda de memoria cuando esté disponible
- `local`: busca la wiki localmente

Tres corpus: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` usan resúmenes compilados como primera pasada cuando es posible
- los ID de afirmación se resuelven de vuelta a la página propietaria
- las afirmaciones impugnadas/obsoletas/frescas influyen en el ranking
- las etiquetas de procedencia sobreviven en los resultados

Modos de búsqueda (`--mode` / parámetro de herramienta `mode`):

| Modo              | Potencia                                                       |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | valor predeterminado equilibrado                               |
| `find-person`     | entidades similares a personas, alias, identificadores, redes sociales, ID canónicos |
| `route-question`  | tarjetas de agente, pistas pedir-por/mejor-usado-para, contexto de relaciones |
| `source-evidence` | páginas fuente y metadatos de evidencia estructurada           |
| `raw-claim`       | afirmaciones estructuradas coincidentes; devuelve metadatos de afirmación/evidencia |

Cuando un resultado coincide con una afirmación estructurada, `wiki_search` devuelve
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` y `evidenceSourceIds` en su carga de detalles. La salida de texto
incluye líneas compactas `Claim:` y `Evidence:` cuando están disponibles.

## Herramientas orientadas a agentes

| Herramienta    | Propósito                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | modo de bóveda actual, salud, disponibilidad de la CLI de Obsidian                                                                                             |
| `wiki_search` | busca páginas wiki y, cuando está configurado, el corpus de memoria compartida; acepta `mode` para búsqueda de personas, enrutamiento de preguntas, evidencia fuente o desglose de afirmación bruta |
| `wiki_get`    | lee una página wiki por id/ruta, recurriendo al corpus de memoria compartida cuando la búsqueda compartida está habilitada y la búsqueda no encuentra nada     |
| `wiki_apply`  | mutaciones acotadas de síntesis/metadatos sin cirugía de página de formato libre                                                                              |
| `wiki_lint`   | comprobaciones estructurales, vacíos de procedencia, contradicciones, preguntas abiertas                                                                       |

El plugin también registra un suplemento de corpus de memoria no exclusivo, para que
`memory_search` y `memory_get` compartidos puedan alcanzar la wiki cuando el plugin de memoria activa
admita selección de corpus.

## Comportamiento de prompt y contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones del prompt de memoria
añaden una instantánea compilada compacta desde `agent-digest.json`: solo páginas principales,
solo afirmaciones principales, recuento de contradicciones, recuento de preguntas y
calificadores de confianza/frescura. Esto es opcional porque cambia la forma del prompt; importa principalmente
para motores de contexto o ensamblado de prompts que consumen explícitamente
suplementos de memoria.

## Configuración

Coloca la configuración bajo `plugins.entries.memory-wiki.config`:

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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

| Clave                                      | Valores / predeterminado                      | Notas                                                    |
| ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------- |
| `vaultMode`                                | `isolated` (predeterminado), `bridge`, `unsafe-local` |                                                          |
| `vault.path`                               | predeterminado `~/.openclaw/wiki/main`         |                                                          |
| `vault.renderMode`                         | `native` (predeterminado), `obsidian`          |                                                          |
| `bridge.readMemoryArtifacts`               | predeterminado `true`                          | importar artefactos públicos del Plugin de memoria activa |
| `bridge.followMemoryEvents`                | predeterminado `true`                          | incluir registros de eventos en modo puente              |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | predeterminado `false`                         | requerido para ejecutar importaciones `unsafe-local`     |
| `unsafeLocal.paths`                        | predeterminado `[]`                            | rutas locales explícitas para importar en modo `unsafe-local` |
| `search.backend`                           | `shared` (predeterminado), `local`             |                                                          |
| `search.corpus`                            | `wiki` (predeterminado), `memory`, `all`       |                                                          |
| `context.includeCompiledDigestPrompt`      | predeterminado `false`                         | añadir una instantánea de resumen compacta a las secciones del prompt de memoria |
| `render.createBacklinks`                   | predeterminado `true`                          | generar bloques relacionados deterministas               |
| `render.createDashboards`                  | predeterminado `true`                          | generar páginas de panel                                 |

### Ejemplo: QMD + modo puente

Usa esto cuando quieras QMD para recuperación y `memory-wiki` para una capa
de conocimiento mantenida. Cada capa se mantiene enfocada: QMD conserva notas sin procesar,
exportaciones de sesión y colecciones adicionales buscables, mientras que `memory-wiki` compila
entidades estables, afirmaciones, paneles y páginas fuente.

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

Esto mantiene a QMD a cargo de la recuperación de memoria activa, `memory-wiki` enfocado en
páginas compiladas y paneles, y la forma del prompt sin cambios hasta que
habilites intencionalmente los prompts de resumen compilado.

## CLI

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

Consulta [CLI: wiki](/es/cli/wiki) para la referencia completa de comandos, incluidos
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` y el conjunto completo de subcomandos
`wiki obsidian`.

## Compatibilidad con Obsidian

Cuando `vault.renderMode` es `obsidian`, el Plugin escribe Markdown compatible con Obsidian
y, opcionalmente, puede usar la CLI oficial `obsidian` para sondeos de estado,
búsqueda en la bóveda, apertura de una página, invocación de un comando y salto a la
nota diaria. Esto es opcional; la wiki sigue funcionando en modo nativo sin
Obsidian.

## Flujo de trabajo recomendado

<Steps>
<Step title="Mantén el Plugin de memoria activa para la recuperación">
La recuperación, la promoción y Dreaming siguen siendo propiedad del backend de memoria configurado.
</Step>
<Step title="Habilita memory-wiki">
Empieza con el modo `isolated`, salvo que quieras explícitamente el modo puente.
</Step>
<Step title="Usa wiki_search / wiki_get cuando importe la procedencia">
Prefiere estos sobre `memory_search` cuando quieras ranking específico de la wiki o estructura de creencias a nivel de página.
</Step>
<Step title="Usa wiki_apply para síntesis acotadas o actualizaciones de metadatos">
Evita editar manualmente bloques generados gestionados.
</Step>
<Step title="Ejecuta wiki_lint después de cambios significativos">
Detecta contradicciones, preguntas abiertas y brechas de procedencia.
</Step>
<Step title="Activa los paneles para visibilidad de obsolescencia/contradicciones">
Configura `render.createDashboards: true` (predeterminado).
</Step>
</Steps>

## Documentos relacionados

- [Descripción general de memoria](/es/concepts/memory)
- [CLI: memory](/es/cli/memory)
- [CLI: wiki](/es/cli/wiki)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
