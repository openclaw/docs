---
read_when:
    - Quieres conocimiento persistente más allá de las notas simples de MEMORY.md
    - Está configurando el plugin memory-wiki incluido.
    - Necesitas bóvedas wiki separadas para los agentes en un Gateway
    - Quiere comprender wiki_search, wiki_get o el modo puente
summary: 'memory-wiki: bóveda de conocimiento compilado con procedencia, afirmaciones, paneles y modo puente'
title: Wiki de memoria
x-i18n:
    generated_at: "2026-07-12T14:40:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` es un plugin incluido que compila conocimiento duradero en una
wiki navegable: páginas deterministas, afirmaciones estructuradas con pruebas,
procedencia, paneles y resúmenes legibles por máquinas.

No sustituye al plugin de Active Memory. La recuperación, la promoción, la indexación y
Dreaming siguen siendo responsabilidad del backend de memoria que esté configurado
(`memory-core`, QMD, Honcho, etc.). `memory-wiki` funciona junto a él y compila
el conocimiento en una capa wiki mantenida.

| Capa                    | Responsabilidad                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Plugin de Active Memory | Recuperación, búsqueda semántica, promoción, Dreaming, entorno de ejecución de memoria               |
| `memory-wiki`           | Páginas wiki compiladas, síntesis con procedencia detallada, paneles, búsqueda/consulta/aplicación wiki |

Regla práctica:

- `memory_search` para una única pasada amplia de recuperación en todos los corpus configurados
- `wiki_search` / `wiki_get` cuando se necesita una clasificación específica de la wiki, procedencia o una estructura de creencias a nivel de página
- `memory_search corpus=all` para abarcar ambas capas en una sola llamada, cuando el plugin de Active Memory admite la selección de corpus

Una configuración habitual que prioriza el entorno local: QMD como backend de Active Memory para la recuperación y
`memory-wiki` en modo `bridge` para páginas sintetizadas duraderas. Consulte el
ejemplo de QMD + modo bridge en [Configuración](#configuration).

Si el modo bridge informa de cero artefactos exportados, el plugin de Active Memory
no está exponiendo actualmente entradas públicas para el puente. Ejecute primero `openclaw wiki doctor`
y, después, confirme que el plugin de Active Memory admite artefactos públicos.

## Modos del almacén

- `isolated` (predeterminado): almacén propio, fuentes propias, sin dependencia del plugin de Active Memory. Use este modo para disponer de un almacén de conocimiento seleccionado y autónomo.
- `bridge`: lee artefactos públicos de memoria y registros de eventos del plugin de Active Memory mediante interfaces públicas del SDK de plugins. Use este modo para compilar los artefactos exportados por el plugin de memoria sin acceder a sus componentes internos privados.
- `unsafe-local`: vía de escape explícita en la misma máquina para rutas locales privadas. Es intencionadamente experimental y no portátil; úsela únicamente cuando comprenda el límite de confianza y necesite específicamente un acceso al sistema de archivos local que el modo bridge no pueda proporcionar.

El modo y el ámbito del almacén son opciones independientes:

- `vaultMode` determina de dónde proceden las entradas de la wiki.
- `vault.scope` determina si todos los agentes usan un único almacén o si cada agente obtiene un almacén secundario.

`vault.scope: "global"` es el valor predeterminado y conserva el comportamiento
existente de un único almacén. Use `vault.scope: "agent"` con el modo `isolated`
o `bridge` cuando los agentes no deban compartir páginas wiki, resúmenes compilados,
resultados de búsqueda ni escrituras. El ámbito de agente no se puede combinar con
el modo `unsafe-local`, ya que esas rutas privadas configuradas no son entradas
propiedad del agente. La validación de la configuración rechaza esta combinación.

El modo bridge puede indexar, según cada opción de configuración `bridge.*`:

- artefactos de memoria exportados (`indexMemoryRoot`)
- notas diarias (`indexDailyNotes`)
- informes de Dreaming (`indexDreamReports`)
- registros de eventos de memoria (`followMemoryEvents`)

Cuando el modo bridge está activo y `bridge.readMemoryArtifacts` está habilitado,
`openclaw wiki status`, `openclaw wiki doctor` y `openclaw wiki bridge
import` se enrutan mediante el Gateway en ejecución para que vean el mismo contexto
del plugin de Active Memory que la memoria del agente o del entorno de ejecución.
Si el puente está deshabilitado o las lecturas de artefactos están desactivadas,
esos comandos mantienen el comportamiento local o sin conexión.

## Estructura del almacén

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

El contenido administrado permanece dentro de los bloques generados; los bloques
de notas humanas se conservan durante la regeneración.

- `sources/`: material sin procesar importado y páginas respaldadas por bridge/unsafe-local
- `entities/`: elementos duraderos, personas, sistemas, proyectos y objetos
- `concepts/`: ideas, abstracciones, patrones y políticas (también es el destino de las importaciones de OKF)
- `syntheses/`: resúmenes compilados y recopilaciones mantenidas
- `reports/`: paneles generados

## Importaciones de Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importe un paquete de Open Knowledge Format descomprimido en páginas de conceptos
de la wiki. Resulta adecuado cuando un catálogo de datos, rastreador de documentación
o agente de enriquecimiento ya produce OKF: mantenga OKF como artefacto portátil
de intercambio y deje que `memory-wiki` lo convierta en páginas de conceptos
nativas de OpenClaw y resúmenes compilados.

- los archivos `.md` no reservados son documentos de conceptos
- cada concepto importado requiere un campo de frontmatter `type` no vacío; si falta `type`, se genera una advertencia `missing-type` y se omite el archivo
- los valores de `type` desconocidos se aceptan como conceptos genéricos
- `index.md` y `log.md` están reservados y nunca se importan como conceptos
- los enlaces Markdown rotos o externos se dejan sin cambios

Las páginas importadas se aplanan dentro de `concepts/` para que los flujos existentes
de compilación, búsqueda, consulta y paneles las detecten sin un segundo árbol wiki.
Cada página conserva el ID original del concepto OKF, la ruta de origen, `type`,
`resource`, `tags`, la marca de tiempo y todo el frontmatter del productor. Los
enlaces internos de OKF se reescriben para apuntar a las páginas de conceptos wiki
generadas y también producen entradas estructuradas de `relationships` con
`kind: okf-link`.

## Afirmaciones estructuradas y evidencia

Las páginas contienen metadatos estructurados `claims` en el frontmatter, no solo texto de formato libre. Cada
afirmación puede incluir `id`, `text`, `status`, `confidence`, `evidence[]` y
`updatedAt`. Cada entrada de evidencia puede incluir `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` y `updatedAt`.

Esto hace que la wiki funcione como una capa de creencias, no como un repositorio pasivo de notas.
Las afirmaciones pueden rastrearse, puntuarse, cuestionarse y resolverse consultando las fuentes.

## Metadatos de entidades para agentes

Las páginas de entidades contienen metadatos genéricos de enrutamiento utilizables para personas, equipos,
sistemas, proyectos o cualquier otro tipo de entidad:

- `entityType`: por ejemplo, `person`, `team`, `system`, `project`
- `canonicalId`: clave de identidad estable entre alias e importaciones
- `aliases`: nombres, identificadores o etiquetas que remiten a la misma página
- `privacyTier`: cadena de formato libre; `public` se trata como exenta de revisión, mientras que cualquier otro valor (por ejemplo, `local-private`, `sensitive`, `confirm-before-use`) se marca en `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: indicaciones compactas de enrutamiento
- `lastRefreshedAt`: marca de tiempo de actualización de la fuente, independiente de la hora de edición de la página
- `personCard`: tarjeta opcional de enrutamiento específica de una persona (identificadores, redes sociales, correos electrónicos, zona horaria, área, asuntos que consultar, asuntos que evitar consultar, confianza y nivel de privacidad)
- `relationships`: enlaces tipados a páginas relacionadas (destino, tipo, peso, confianza, tipo de evidencia, nivel de privacidad y nota)

Para una wiki de personas, comience por `reports/person-agent-directory.md` y después abra
la página de la persona con `wiki_get` antes de utilizar datos de contacto o hechos
inferidos.

<Accordion title="Ejemplo de página de entidad">
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
  - Enrutamiento del ecosistema de ejemplo
notEnoughFor:
  - aprobación legal
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Ecosistema de ejemplo
  askFor:
    - Preguntas sobre el despliegue de ejemplo
  avoidAskingFor:
    - decisiones de facturación no relacionadas
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Otra persona
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex es útil para el enrutamiento del ecosistema de ejemplo.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Proceso de compilación

La compilación lee las páginas de la wiki, normaliza los resúmenes y genera artefactos estables
orientados a máquinas en:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Los agentes y el código en tiempo de ejecución leen estos compendios en lugar de extraer información de Markdown.
La salida compilada también permite la indexación inicial de la wiki para búsqueda/obtención, la
resolución de identificadores de afirmaciones a sus páginas propietarias, suplementos compactos para prompts y la
generación de informes.

## Paneles e informes de estado

Cuando `render.createDashboards` está habilitado, la compilación mantiene paneles en
`reports/`:

| Informe                             | Elementos supervisados                                      |
| ----------------------------------- | ----------------------------------------------------------- |
| `reports/open-questions.md`         | páginas con preguntas sin resolver                          |
| `reports/contradictions.md`         | grupos de notas contradictorias                             |
| `reports/low-confidence.md`         | páginas y afirmaciones de baja confianza                    |
| `reports/claim-health.md`           | afirmaciones sin evidencia estructurada                     |
| `reports/stale-pages.md`            | contenido desactualizado o cuya actualidad se desconoce     |
| `reports/person-agent-directory.md` | tarjetas de enrutamiento de personas y entidades            |
| `reports/relationship-graph.md`     | enlaces de relaciones estructurados                         |
| `reports/provenance-coverage.md`    | cobertura de clases de evidencia                            |
| `reports/privacy-review.md`         | niveles de privacidad no públicos que deben revisarse antes de su uso |

## Búsqueda y recuperación

Dos backends de búsqueda:

- `shared`: utiliza el flujo compartido de búsqueda en memoria cuando está disponible
- `local`: busca localmente en la wiki

Tres corpus: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` utilizan los compendios compilados como primera fase cuando es posible
- los identificadores de afirmaciones remiten a la página propietaria
- las afirmaciones cuestionadas, obsoletas o recientes influyen en la clasificación
- las etiquetas de procedencia se conservan en los resultados

Modos de búsqueda (parámetro `--mode` / `mode` de la herramienta):

| Modo              | Potencia                                                               |
| ----------------- | ---------------------------------------------------------------------- |
| `auto`            | valor predeterminado equilibrado                                       |
| `find-person`     | entidades similares a personas, alias, identificadores, redes sociales e identificadores canónicos |
| `route-question`  | tarjetas de agentes, indicaciones de asuntos que consultar o usos recomendados y contexto de relaciones |
| `source-evidence` | páginas de fuentes y metadatos de evidencia estructurada               |
| `raw-claim`       | afirmaciones estructuradas coincidentes; devuelve metadatos de afirmaciones y evidencia |

Cuando un resultado coincide con una afirmación estructurada, `wiki_search` devuelve
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` y `evidenceSourceIds` en su carga de detalles. La salida de texto
incluye líneas compactas `Claim:` y `Evidence:` cuando están disponibles.

## Herramientas para agentes

| Herramienta   | Propósito                                                                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | modo y ámbito actuales del almacén, agente resuelto, estado, disponibilidad de la CLI de Obsidian                                                                                                                       |
| `wiki_search` | busca páginas de la wiki y, cuando está configurado, el corpus de memoria compartida; acepta `mode` para buscar personas, enrutar preguntas, obtener evidencia de fuentes o examinar afirmaciones sin procesar           |
| `wiki_get`    | lee una página de la wiki por id/ruta y recurre al corpus de memoria compartida cuando la búsqueda compartida está habilitada y la consulta no encuentra resultados                                                       |
| `wiki_apply`  | mutaciones específicas de síntesis/metadatos sin modificar libremente las páginas                                                                                                                                       |
| `wiki_lint`   | comprobaciones estructurales, carencias de procedencia, contradicciones, preguntas abiertas                                                                                                                             |

El Plugin también registra un complemento de corpus de memoria no exclusivo, por lo que
`memory_search` y `memory_get` compartidos pueden acceder a la wiki cuando el Plugin de
memoria activo admite la selección de corpus.

## Comportamiento del prompt y del contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones del prompt
de memoria anexan una instantánea compilada compacta de `agent-digest.json`: solo las
páginas principales, solo las afirmaciones principales, recuento de contradicciones,
recuento de preguntas y calificadores de confianza/actualidad. Esto es opcional porque
cambia la estructura del prompt; resulta relevante principalmente para los motores de
contexto o el ensamblado de prompts que consumen explícitamente complementos de memoria.

## Configuración

Coloque la configuración en `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
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

Opciones principales:

| Clave                                      | Valores / valor predeterminado                 | Notas                                                                                           |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (predeterminado), `bridge`, `unsafe-local` | elige el comportamiento de entrada e integración                                          |
| `vault.scope`                              | `global` (predeterminado), `agent`              | un almacén compartido o un almacén secundario por agente                                        |
| `vault.path`                               | valor global predeterminado `~/.openclaw/wiki/main` | almacén global exacto; el directorio principal del ámbito de agente es `~/.openclaw/wiki` por defecto |
| `vault.renderMode`                         | `native` (predeterminado), `obsidian`           |                                                                                                 |
| `bridge.readMemoryArtifacts`               | predeterminado `true`                           | importa artefactos públicos del Plugin de memoria activo                                        |
| `bridge.followMemoryEvents`                | predeterminado `true`                           | incluye registros de eventos en modo puente                                                     |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | predeterminado `false`                          | obligatorio para ejecutar importaciones `unsafe-local`                                          |
| `unsafeLocal.paths`                        | predeterminado `[]`                             | rutas locales explícitas que se importarán en modo `unsafe-local`                               |
| `search.backend`                           | `shared` (predeterminado), `local`              |                                                                                                 |
| `search.corpus`                            | `wiki` (predeterminado), `memory`, `all`        |                                                                                                 |
| `context.includeCompiledDigestPrompt`      | predeterminado `false`                          | anexa la instantánea compacta del resumen del agente seleccionado a las secciones del prompt de memoria |
| `render.createBacklinks`                   | predeterminado `true`                           | genera bloques relacionados deterministas                                                       |
| `render.createDashboards`                  | predeterminado `true`                           | genera páginas de panel                                                                         |

### Almacenes por agente

Establezca `vault.scope` en `agent` para proporcionar una wiki separada a cada agente
configurado. En este ámbito, `vault.path` es un directorio principal y OpenClaw anexa
el id normalizado del agente:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Esto se resuelve como `~/.openclaw/wiki/support` y
`~/.openclaw/wiki/marketing`. Si se omite `vault.path` en el ámbito de agente, el
directorio principal predeterminado es `~/.openclaw/wiki`. Por tanto, el agente `main`
predeterminado conserva la ruta existente `~/.openclaw/wiki/main`.

Las herramientas del agente, los resúmenes de prompt compilados y el complemento de
wiki expuesto mediante `memory_search` / `memory_get` resuelven el almacén a partir del
contexto del agente activo. Para llamadas de la CLI y del Gateway en una configuración
con varios agentes configurados, proporcione el agente explícitamente mediante
`openclaw wiki --agent <agentId> ...` o el `agentId` de la solicitud del Gateway. Un
único agente configurado sigue siendo el predeterminado cuando no se proporciona
ningún id.

En modo puente, las importaciones con ámbito de agente aceptan un artefacto público de
memoria solo cuando su `agentIds` incluye al agente seleccionado. Se omiten los
artefactos propiedad de otro agente, sin metadatos de propiedad o con un propietario
desconocido. El ámbito global conserva el comportamiento existente de artefactos
compartidos.

<Warning>
Cambiar `vault.scope` no copia ni divide un almacén existente. En el ámbito de agente,
un `vault.path` configurado explícitamente se convierte en un directorio principal, por
lo que debe mover o importar deliberadamente las páginas existentes antes de cambiar
los agentes de producción. Haga primero una copia de seguridad del almacén.

Los almacenes por agente constituyen un límite de conocimiento dentro del mismo proceso,
no un límite de seguridad del sistema operativo. Los Plugins y las herramientas sin
aislamiento que tengan acceso al sistema de archivos del host aún pueden leer el
directorio de otro agente. Utilice el [aislamiento](/es/gateway/sandboxing) o
[perfiles de Gateway separados](/es/gateway/multiple-gateways) cuando los agentes no
confíen entre sí.
</Warning>

### Ejemplo: QMD + modo puente

Utilice esta configuración cuando desee usar QMD para la recuperación y `memory-wiki`
como capa de conocimiento mantenida. Cada capa conserva su enfoque: QMD mantiene
consultables las notas sin procesar, las exportaciones de sesiones y las colecciones
adicionales, mientras que `memory-wiki` compila entidades estables, afirmaciones,
paneles y páginas de fuentes.

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

Esto mantiene a QMD a cargo de la recuperación de memoria activa, a `memory-wiki`
centrado en las páginas compiladas y los paneles, y la estructura del prompt sin
cambios hasta que habilite intencionadamente los prompts de resumen compilado.

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

Consulte [CLI: wiki](/es/cli/wiki) para obtener la referencia completa de comandos, incluidos
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` y el conjunto completo de subcomandos
`wiki obsidian`.

## Compatibilidad con Obsidian

Cuando `vault.renderMode` es `obsidian`, el Plugin escribe Markdown compatible con
Obsidian y puede utilizar opcionalmente la CLI oficial `obsidian` para consultar el
estado, buscar en el almacén, abrir una página, invocar un comando y saltar a la nota
diaria. Esto es opcional; la wiki sigue funcionando en modo nativo sin Obsidian.

Los almacenes con ámbito de agente también pueden utilizar Markdown compatible con
Obsidian, pero la validación de la configuración rechaza `obsidian.useOfficialCli: true`
con `vault.scope: "agent"`. La configuración actual `obsidian.vaultName` es global y no
puede seleccionar un almacén de Obsidian distinto para cada agente. Utilice en su lugar
las herramientas de la wiki y las operaciones de la CLI, o mantenga una wiki gestionada
mediante Obsidian en el ámbito global.

## Flujo de trabajo recomendado

<Steps>
<Step title="Conserve el Plugin de memoria activo para la recuperación">
La recuperación, la promoción y Dreaming siguen siendo responsabilidad del backend de memoria configurado.
</Step>
<Step title="Habilite memory-wiki">
Comience con el modo `isolated`, salvo que desee explícitamente el modo puente.
</Step>
<Step title="Utilice wiki_search / wiki_get cuando importe la procedencia">
Prefiera estas opciones a `memory_search` cuando necesite una clasificación específica de la wiki o una estructura de creencias a nivel de página.
</Step>
<Step title="Utilice wiki_apply para síntesis específicas o actualizaciones de metadatos">
Evite editar manualmente los bloques generados y gestionados.
</Step>
<Step title="Ejecute wiki_lint después de cambios significativos">
Detecta contradicciones, preguntas abiertas y carencias de procedencia.
</Step>
<Step title="Active los paneles para ver contenido obsoleto y contradicciones">
Establezca `render.createDashboards: true` (predeterminado).
</Step>
</Steps>

## Documentación relacionada

- [Descripción general de la memoria](/es/concepts/memory)
- [CLI: memoria](/es/cli/memory)
- [CLI: wiki](/es/cli/wiki)
- [Descripción general del SDK de Plugins](/es/plugins/sdk-overview)
