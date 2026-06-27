---
read_when:
    - Quieres conocimiento persistente más allá de simples notas en MEMORY.md
    - Estás configurando el plugin memory-wiki incluido
    - Quieres entender wiki_search, wiki_get o el modo puente
summary: 'memory-wiki: bóveda de conocimiento compilado con procedencia, afirmaciones, paneles y modo puente'
title: Wiki de memoria
x-i18n:
    generated_at: "2026-06-27T12:15:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` es un plugin incluido que convierte la memoria durable en una bóveda de conocimiento compilada.

No reemplaza al plugin de memoria activa. El plugin de memoria activa sigue siendo responsable de la recuperación, promoción, indexación y Dreaming. `memory-wiki` se coloca a su lado y compila el conocimiento durable en una wiki navegable con páginas deterministas, afirmaciones estructuradas, procedencia, paneles y resúmenes legibles por máquina.

Úsalo cuando quieras que la memoria se comporte más como una capa de conocimiento mantenida y menos como un montón de archivos Markdown.

## Qué añade

- Una bóveda de wiki dedicada con diseño de página determinista
- Metadatos estructurados de afirmaciones y evidencia, no solo prosa
- Procedencia, confianza, contradicciones y preguntas abiertas a nivel de página
- Resúmenes compilados para consumidores de agente/runtime
- Herramientas nativas de wiki para buscar/obtener/aplicar/verificar
- Importaciones de Open Knowledge Format a conceptos de wiki compilados
- Modo puente opcional que importa artefactos públicos desde el plugin de memoria activa
- Modo de renderizado compatible con Obsidian e integración con CLI opcionales

## Cómo encaja con la memoria

Piensa en la separación así:

| Capa                                                    | Es responsable de                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin de memoria activa (`memory-core`, QMD, Honcho, etc.) | Recuperación, búsqueda semántica, promoción, Dreaming, runtime de memoria                  |
| `memory-wiki`                                           | Páginas wiki compiladas, síntesis con mucha procedencia, paneles, búsqueda/obtención/aplicación específica de wiki |

Si el plugin de memoria activa expone artefactos de recuperación compartidos, OpenClaw puede buscar en ambas capas en una sola pasada con `memory_search corpus=all`.

Cuando necesites clasificación específica de wiki, procedencia o acceso directo a páginas, usa las herramientas nativas de wiki.

## Patrón híbrido recomendado

Un buen valor predeterminado para configuraciones locales primero es:

- QMD como backend de memoria activa para recuperación y búsqueda semántica amplia
- `memory-wiki` en modo `bridge` para páginas de conocimiento sintetizado durable

Esa separación funciona bien porque cada capa se mantiene enfocada:

- QMD mantiene buscables las notas sin procesar, las exportaciones de sesión y las colecciones adicionales
- `memory-wiki` compila entidades estables, afirmaciones, paneles y páginas fuente

Regla práctica:

- usa `memory_search` cuando quieras una pasada amplia de recuperación en la memoria
- usa `wiki_search` y `wiki_get` cuando quieras resultados de wiki conscientes de la procedencia
- usa `memory_search corpus=all` cuando quieras que la búsqueda compartida abarque ambas capas

Si el modo puente informa cero artefactos exportados, el plugin de memoria activa aún no está exponiendo entradas públicas de puente. Ejecuta primero `openclaw wiki doctor` y luego confirma que el plugin de memoria activa admita artefactos públicos.

Cuando el modo puente está activo y `bridge.readMemoryArtifacts` está habilitado, `openclaw wiki status`, `openclaw wiki doctor` y `openclaw wiki bridge
import` leen a través del Gateway en ejecución. Eso mantiene las comprobaciones de puente de la CLI alineadas con el contexto del plugin de memoria en runtime. Si el puente está deshabilitado o las lecturas de artefactos están desactivadas, esos comandos mantienen su comportamiento local/sin conexión.

## Modos de bóveda

`memory-wiki` admite tres modos de bóveda:

### `isolated`

Bóveda propia, fuentes propias, sin dependencia de `memory-core`.

Usa esto cuando quieras que la wiki sea su propio almacén de conocimiento curado.

### `bridge`

Lee artefactos públicos de memoria y eventos de memoria desde el plugin de memoria activa a través de puntos de unión públicos del SDK de plugins.

Usa esto cuando quieras que la wiki compile y organice los artefactos exportados del plugin de memoria sin acceder a elementos internos privados del plugin.

El modo puente puede indexar:

- artefactos de memoria exportados
- informes de sueños
- notas diarias
- archivos raíz de memoria
- registros de eventos de memoria

### `unsafe-local`

Vía de escape explícita en la misma máquina para rutas privadas locales.

Este modo es intencionalmente experimental y no portable. Úsalo solo cuando entiendas el límite de confianza y necesites específicamente acceso al sistema de archivos local que el modo puente no puede proporcionar.

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

El contenido administrado permanece dentro de bloques generados. Los bloques de notas humanas se conservan.

Los grupos principales de páginas son:

- `sources/` para material sin procesar importado y páginas respaldadas por puente
- `entities/` para cosas, personas, sistemas, proyectos y objetos durables
- `concepts/` para ideas, abstracciones, patrones y políticas
- `syntheses/` para resúmenes compilados y acumulados mantenidos
- `reports/` para paneles generados

## Importaciones de Open Knowledge Format

`memory-wiki` puede importar paquetes Open Knowledge Format desempaquetados con:

```bash
openclaw wiki okf import ./bundles/ga4
```

Este es el encaje más limpio cuando un catálogo de datos, rastreador de documentación o agente de enriquecimiento ya produce OKF: conserva OKF como artefacto de intercambio portable y deja que `memory-wiki` lo convierta en páginas de conceptos nativas de OpenClaw y resúmenes compilados.

El importador sigue la forma de OKF v0.1:

- los archivos `.md` no reservados son documentos de concepto
- cada concepto importado necesita un campo de frontmatter `type` no vacío
- se aceptan valores OKF `type` desconocidos
- los archivos reservados `index.md` y `log.md` no se importan como conceptos
- los enlaces Markdown rotos o externos se conservan

Las páginas de conceptos importadas se aplanan bajo `concepts/` para que las rutas existentes de compilación, búsqueda, obtención, panel y resumen de prompts las vean sin añadir un segundo árbol de wiki. Cada página conserva el ID de concepto OKF original, la ruta fuente, `type`, `resource`, `tags`, la marca de tiempo y todo el frontmatter del productor. Los enlaces OKF internos se reescriben a las páginas de concepto de wiki generadas y también se emiten como entradas estructuradas `relationships` con `kind: okf-link`.

## Afirmaciones y evidencia estructuradas

Las páginas pueden llevar frontmatter `claims` estructurado, no solo texto libre.

Cada afirmación puede incluir:

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

Esto es lo que hace que la wiki actúe más como una capa de creencias que como un volcado pasivo de notas. Las afirmaciones pueden rastrearse, puntuarse, disputarse y resolverse hasta sus fuentes.

## Metadatos de entidad orientados al agente

Las páginas de entidad también pueden llevar metadatos de enrutamiento para uso del agente. Esto es frontmatter genérico, por lo que funciona para personas, equipos, sistemas, proyectos o cualquier otro tipo de entidad.

Los campos comunes incluyen:

- `entityType`: por ejemplo `person`, `team`, `system` o `project`
- `canonicalId`: clave de identidad estable usada entre alias e importaciones
- `aliases`: nombres, identificadores o etiquetas que deberían resolverse a la misma página
- `privacyTier`: `public`, `local-private`, `sensitive` o `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: pistas compactas de enrutamiento
- `lastRefreshedAt`: marca de tiempo de actualización de fuente separada del tiempo de edición de la página
- `personCard`: tarjeta de enrutamiento opcional específica de persona con identificadores, redes sociales,
  correos electrónicos, zona horaria, carril, pedir por, evitar pedir por, confianza y privacidad
- `relationships`: aristas tipadas a páginas relacionadas con destino, tipo, peso,
  confianza, tipo de evidencia, nivel de privacidad y nota

Para una wiki de personas, el agente normalmente debería empezar con `reports/person-agent-directory.md` y luego abrir la página de la persona con `wiki_get` antes de usar datos de contacto o hechos inferidos.

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

El paso de compilación lee páginas wiki, normaliza resúmenes y emite artefactos estables orientados a máquinas bajo:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Estos resúmenes existen para que los agentes y el código de runtime no tengan que extraer información de páginas Markdown.

La salida compilada también impulsa:

- indexación wiki de primera pasada para flujos de búsqueda/obtención
- búsqueda de ID de afirmación de vuelta a las páginas propietarias
- suplementos compactos de prompts
- generación de informes/paneles

## Paneles e informes de salud

Cuando `render.createDashboards` está habilitado, la compilación mantiene paneles bajo `reports/`.

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
- clústeres de afirmaciones en competencia
- afirmaciones sin evidencia estructurada
- páginas y afirmaciones de baja confianza
- frescura obsoleta o desconocida
- páginas con preguntas sin resolver
- tarjetas de enrutamiento de personas/entidades
- aristas de relación estructuradas
- cobertura de clases de evidencia
- niveles de privacidad no públicos que necesitan revisión antes de usarse

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
- los ID de afirmación pueden resolverse de vuelta a la página propietaria
- las afirmaciones disputadas/obsoletas/frescas influyen en la clasificación
- las etiquetas de procedencia pueden sobrevivir en los resultados
- el modo de búsqueda puede sesgar la clasificación para búsqueda de personas, enrutamiento de preguntas, evidencia de fuentes o afirmaciones sin procesar

Regla práctica:

- usa `memory_search corpus=all` para una pasada amplia de recuperación
- usa `wiki_search` + `wiki_get` cuando te importe la clasificación específica de wiki, la procedencia o la estructura de creencias a nivel de página

Modos de búsqueda:

- `auto`: valor predeterminado equilibrado
- `find-person`: potencia entidades tipo persona, alias, identificadores, redes sociales e ID canónicos
- `route-question`: potencia tarjetas de agente, pistas ask-for, pistas best-used-for y contexto de relaciones
- `source-evidence`: potencia páginas fuente y metadatos de evidencia estructurada
- `raw-claim`: potencia afirmaciones estructuradas coincidentes y devuelve metadatos de afirmación/evidencia en los resultados

Cuando un resultado coincide con una afirmación estructurada, `wiki_search` puede devolver `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` y `evidenceSourceIds` en su carga de detalles. La salida de texto también incluye líneas compactas `Claim:` y `Evidence:` cuando están disponibles.

## Herramientas para agentes

El plugin registra estas herramientas:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Qué hacen:

- `wiki_status`: modo de bóveda actual, salud, disponibilidad de la CLI de Obsidian
- `wiki_search`: busca páginas wiki y, cuando está configurado, corpus de memoria compartida;
  acepta `mode` para búsqueda de personas, enrutamiento de preguntas, evidencia de fuentes o desglose de afirmaciones sin procesar
- `wiki_get`: lee una página wiki por ID/ruta o recurre al corpus de memoria compartida
- `wiki_apply`: mutaciones acotadas de síntesis/metadatos sin cirugía libre de páginas
- `wiki_lint`: comprobaciones estructurales, vacíos de procedencia, contradicciones, preguntas abiertas

El Plugin también registra un suplemento de corpus de memoria no exclusivo, por lo que
`memory_search` y `memory_get` compartidos pueden alcanzar la wiki cuando el Plugin
de memoria activa admite la selección de corpus.

## Comportamiento de prompt y contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones de prompt de memoria
añaden una instantánea compilada compacta desde `agent-digest.json`.

Esa instantánea es intencionalmente pequeña y de alta señal:

- solo páginas principales
- solo afirmaciones principales
- recuento de contradicciones
- recuento de preguntas
- calificadores de confianza/frescura

Esto es optativo porque cambia la forma del prompt y es principalmente útil para motores
de contexto o ensamblado de prompts heredado que consumen explícitamente suplementos de memoria.

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

Alternadores clave:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` u `obsidian`
- `bridge.readMemoryArtifacts`: importar artefactos públicos del Plugin de memoria activa
- `bridge.followMemoryEvents`: incluir registros de eventos en modo puente
- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `context.includeCompiledDigestPrompt`: añadir una instantánea de resumen compacta a las secciones de prompt de memoria
- `render.createBacklinks`: generar bloques relacionados deterministas
- `render.createDashboards`: generar páginas de panel

### Ejemplo: modo QMD + puente

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

- QMD a cargo de la recuperación de memoria activa
- `memory-wiki` enfocado en páginas compiladas y paneles
- la forma del prompt sin cambios hasta que habilites intencionalmente los prompts de resumen compilado

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

Consulta [CLI: wiki](/es/cli/wiki) para la referencia completa de comandos.

## Compatibilidad con Obsidian

Cuando `vault.renderMode` es `obsidian`, el Plugin escribe Markdown compatible con Obsidian
y opcionalmente puede usar la CLI oficial `obsidian`.

Los flujos de trabajo compatibles incluyen:

- sondeo de estado
- búsqueda en bóveda
- apertura de una página
- invocación de un comando de Obsidian
- salto a la nota diaria

Esto es opcional. La wiki sigue funcionando en modo nativo sin Obsidian.

## Flujo de trabajo recomendado

1. Conserva tu Plugin de memoria activa para recuperación/promoción/Dreaming.
2. Habilita `memory-wiki`.
3. Empieza con el modo `isolated` a menos que quieras explícitamente el modo puente.
4. Usa `wiki_search` / `wiki_get` cuando la procedencia importe.
5. Usa `wiki_apply` para síntesis acotadas o actualizaciones de metadatos.
6. Ejecuta `wiki_lint` después de cambios significativos.
7. Activa los paneles si quieres visibilidad de obsolescencia/contradicciones.

## Documentación relacionada

- [Resumen de memoria](/es/concepts/memory)
- [CLI: memory](/es/cli/memory)
- [CLI: wiki](/es/cli/wiki)
- [Resumen del SDK de Plugin](/es/plugins/sdk-overview)
