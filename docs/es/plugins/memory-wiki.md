---
read_when:
    - Se busca conocimiento persistente más allá de las notas simples de MEMORY.md
    - Está configurando el plugin memory-wiki incluido
    - Se necesitan bóvedas de wiki separadas para los agentes en un mismo Gateway
    - Quiere comprender wiki_search, wiki_get o el modo bridge
summary: 'memory-wiki: bóveda de conocimiento compilado con procedencia, afirmaciones, paneles y modo puente'
title: Wiki de memoria
x-i18n:
    generated_at: "2026-07-19T02:01:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cba1a17dc6a6021df51ebc8028663034bb82909aafd9e8e5716fca3a8ea3d03a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` es un plugin incluido que compila conocimiento duradero en una
wiki navegable: páginas deterministas, afirmaciones estructuradas con evidencia,
procedencia, paneles y resúmenes legibles por máquina.

No sustituye al plugin de Active Memory. La recuperación, la promoción, la indexación y
Dreaming siguen siendo responsabilidad del backend de memoria que esté configurado
(`memory-core`, QMD, Honcho, etc.). `memory-wiki` funciona junto a él y compila
el conocimiento en una capa de wiki mantenida.

| Capa                  | Responsabilidad                                                                      |
| --------------------- | ------------------------------------------------------------------------------------ |
| Plugin de Active Memory | Recuperación, búsqueda semántica, promoción, Dreaming, entorno de ejecución de memoria |
| `memory-wiki`        | Páginas wiki compiladas, síntesis con abundante procedencia, paneles, búsqueda/obtención/aplicación en la wiki |

Regla práctica:

- `memory_search` para una única pasada amplia de recuperación en todos los corpus configurados
- `wiki_search` / `wiki_get` cuando se necesita clasificación específica de la wiki, procedencia o una estructura de creencias a nivel de página
- `memory_search corpus=all` para abarcar ambas capas en una sola llamada, cuando el plugin de Active Memory admite la selección de corpus

Una configuración común que prioriza el entorno local: QMD como backend de Active Memory para la recuperación y
`memory-wiki` en modo `bridge` para páginas sintetizadas duraderas. Consulte el
ejemplo de QMD + modo puente en [Configuración](#configuration).

Si el modo puente indica cero artefactos exportados, el plugin de Active Memory
no está exponiendo actualmente entradas públicas del puente. Ejecute primero `openclaw wiki doctor`
y, a continuación, confirme que el plugin de Active Memory admite artefactos públicos.

## Modos de la bóveda

- `isolated` (predeterminado): bóveda propia, fuentes propias, sin dependencia del plugin de Active Memory. Utilice este modo para un almacén de conocimiento seleccionado y autónomo.
- `bridge`: lee artefactos públicos de memoria y registros de eventos del plugin de Active Memory mediante interfaces públicas del SDK de plugins. Utilice este modo para compilar los artefactos exportados del plugin de memoria sin acceder a sus elementos internos privados.
- `unsafe-local`: vía de escape explícita para rutas locales privadas en el mismo equipo. Es intencionadamente experimental y no portátil; utilícela solo si comprende el límite de confianza y necesita específicamente acceso al sistema de archivos local que el modo puente no puede proporcionar.

El modo y el ámbito de la bóveda son opciones independientes:

- `vaultMode` elige de dónde proceden las entradas de la wiki.
- `vault.scope` elige si todos los agentes utilizan una sola bóveda o si cada agente recibe una bóveda secundaria.

`vault.scope: "global"` es el valor predeterminado y conserva el comportamiento existente
de una sola bóveda. Utilice `vault.scope: "agent"` con el modo `isolated` o `bridge` cuando
los agentes no deban compartir páginas wiki, resúmenes compilados, resultados de búsqueda ni escrituras.
El ámbito de agente no puede combinarse con el modo `unsafe-local`, porque esas rutas
privadas configuradas no son entradas propiedad de los agentes. La validación de la configuración rechaza esta
combinación.

El modo puente puede indexar, según el ajuste de configuración `bridge.*`:

- artefactos de memoria exportados (`indexMemoryRoot`)
- notas diarias (`indexDailyNotes`)
- informes de sueños (`indexDreamReports`)
- registros de eventos de memoria (`followMemoryEvents`)

Cuando el modo puente está activo y `bridge.readMemoryArtifacts` está habilitado,
`openclaw wiki status`, `openclaw wiki doctor` y `openclaw wiki bridge
import` se enrutan mediante el Gateway en ejecución para que vean el mismo contexto del plugin de Active Memory
que la memoria del agente o del entorno de ejecución. Si el puente está deshabilitado o las lecturas de
artefactos están desactivadas, esos comandos mantienen el comportamiento local/sin conexión.

## Estructura de la bóveda

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

El contenido gestionado permanece dentro de los bloques generados; los bloques de notas humanas se
conservan entre regeneraciones.

- `sources/`: material original importado y páginas respaldadas por el puente o por el modo local no seguro
- `entities/`: elementos duraderos, personas, sistemas, proyectos y objetos
- `concepts/`: ideas, abstracciones, patrones y políticas (también el destino de las importaciones de OKF)
- `syntheses/`: resúmenes compilados y consolidaciones mantenidas
- `reports/`: paneles generados

## Importaciones de Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importe un paquete de Open Knowledge Format desempaquetado en páginas de conceptos de la wiki. Resulta
adecuado cuando un catálogo de datos, un rastreador de documentación o un agente de enriquecimiento ya
produce OKF: mantenga OKF como artefacto portátil de intercambio y permita que `memory-wiki`
lo convierta en páginas de conceptos nativas de OpenClaw y resúmenes compilados.

- los archivos `.md` no reservados son documentos de conceptos
- cada concepto importado requiere un campo de frontmatter `type` que no esté vacío; si falta `type`, se genera una advertencia `missing-type` y se omite el archivo
- los valores `type` desconocidos se aceptan como conceptos genéricos
- `index.md` y `log.md` están reservados y nunca se importan como conceptos
- los enlaces Markdown rotos o externos se dejan sin cambios

Las páginas importadas se aplanan bajo `concepts/` para que los flujos existentes de compilación, búsqueda, obtención y
paneles puedan verlas sin un segundo árbol de wiki. Cada página conserva el
ID original del concepto de OKF, la ruta de origen, `type`, `resource`, `tags`, la marca de tiempo
y todo el frontmatter del productor. Los enlaces internos de OKF se reescriben para apuntar a las páginas
de conceptos generadas de la wiki y también emiten entradas estructuradas `relationships` con
`kind: okf-link`.

## Afirmaciones estructuradas y evidencia

Las páginas contienen frontmatter estructurado `claims`, no solo texto libre. Cada
afirmación puede incluir `id`, `text`, `status`, `confidence`, `evidence[]` y
`updatedAt`. Cada entrada de evidencia puede incluir `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` y `updatedAt`.

Esto hace que la wiki se comporte como una capa de creencias, no como un depósito pasivo de notas.
Las afirmaciones pueden rastrearse, puntuarse, impugnarse y resolverse con referencia a las fuentes.

## Metadatos de entidades orientados a agentes

Las páginas de entidades contienen metadatos genéricos de enrutamiento utilizables para personas, equipos,
sistemas, proyectos o cualquier otro tipo de entidad:

- `entityType`: por ejemplo, `person`, `team`, `system`, `project`
- `canonicalId`: clave de identidad estable entre alias e importaciones
- `aliases`: nombres, identificadores o etiquetas que se resuelven en la misma página
- `privacyTier`: cadena de formato libre; `public` se considera que no requiere revisión, mientras que cualquier otro valor (por ejemplo, `local-private`, `sensitive`, `confirm-before-use`) se marca en `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: indicaciones compactas de enrutamiento
- `lastRefreshedAt`: marca de tiempo de actualización de la fuente, independiente de la hora de edición de la página
- `personCard`: tarjeta opcional de enrutamiento específica de una persona (identificadores, redes sociales, correos electrónicos, zona horaria, área, asuntos que consultar, asuntos que evitar consultar, confianza y nivel de privacidad)
- `relationships`: aristas tipadas hacia páginas relacionadas (destino, tipo, peso, confianza, tipo de evidencia, nivel de privacidad y nota)

Para una wiki de personas, comience con `reports/person-agent-directory.md` y, a continuación, abra
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
    text: Alex resulta útil para el enrutamiento del ecosistema de ejemplo.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Pipeline de compilación

La compilación lee las páginas de la wiki, normaliza los resúmenes y conserva una
instantánea orientada a máquinas en el estado SQLite compartido de los plugins de OpenClaw. El código del entorno de ejecución utiliza la
instantánea del propietario gestionada por el ciclo de vida para cargar SQLite durante la preparación asíncrona de prompts;
el ensamblado síncrono de prompts nunca extrae contenido de Markdown ni lee archivos de caché.
La salida compilada también sirve para la indexación inicial de la wiki para la búsqueda/obtención, la
resolución de identificadores de afirmaciones a sus páginas propietarias, los complementos compactos para prompts y la
generación de informes.

Las modificaciones de las fuentes y las restauraciones de la bóveda solo se hacen visibles para las máquinas después de la siguiente
compilación. Al reiniciar o actualizar el ciclo de vida del plugin, se compara la publicación
de compilación de la bóveda, encadenada causalmente, con SQLite y se rechaza una instantánea procedente de un
estado posterior que se haya revertido. Un compilador iniciado antes de la reversión no puede
publicar sobre el estado predecesor restaurado. La preparación de prompts no sondea la
bóveda ni instala observadores de archivos.
Tras la cuarentena por reversión, una compilación en el proceso en ejecución restablece el propietario
inmediatamente; un proceso de compilación independiente requiere actualizar el ciclo de vida del plugin para que
el daemon pueda confirmar la nueva publicación duradera.
Las cachés compiladas pueden reconstruirse: las filas de caché anteriores a las épocas de publicación se
tratan como ausencias y se sustituyen en la siguiente compilación; no se migran.

## Paneles e informes de estado

Cuando `render.createDashboards` está habilitado, la compilación mantiene paneles en
`reports/`:

| Informe                             | Rastrea                                            |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | páginas con preguntas sin resolver                 |
| `reports/contradictions.md`         | grupos de notas contradictorias                    |
| `reports/low-confidence.md`         | páginas y afirmaciones con poca confianza          |
| `reports/claim-health.md`           | afirmaciones sin evidencia estructurada            |
| `reports/stale-pages.md`            | vigencia obsoleta o desconocida                    |
| `reports/person-agent-directory.md` | tarjetas de enrutamiento de personas/entidades     |
| `reports/relationship-graph.md`     | aristas estructuradas de relaciones                |
| `reports/provenance-coverage.md`    | cobertura de clases de evidencia                   |
| `reports/privacy-review.md`         | niveles de privacidad no públicos que requieren revisión antes de su uso |

## Búsqueda y recuperación

Dos backends de búsqueda:

- `shared`: utiliza el flujo compartido de búsqueda en memoria cuando esté disponible
- `local`: busca localmente en la wiki

Tres corpus: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` utilizan resúmenes compilados como primera pasada cuando es posible
- los identificadores de afirmaciones se resuelven en la página propietaria
- las afirmaciones impugnadas/obsoletas/vigentes influyen en la clasificación
- las etiquetas de procedencia se conservan en los resultados

Modos de búsqueda (parámetro `--mode` / `mode` de la herramienta):

| Modo              | Mejoras                                                         |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | valor predeterminado equilibrado                                               |
| `find-person`     | entidades similares a personas, alias, identificadores, redes sociales e ID canónicos |
| `route-question`  | fichas de agentes, indicaciones sobre qué preguntar o para qué se usa mejor, contexto de relaciones |
| `source-evidence` | páginas de origen y metadatos estructurados de evidencias                  |
| `raw-claim`       | afirmaciones estructuradas coincidentes; devuelve metadatos de afirmaciones y evidencias    |

Cuando un resultado coincide con una afirmación estructurada, `wiki_search` devuelve
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` y `evidenceSourceIds` en su carga útil de detalles. La salida de texto
incluye líneas compactas de `Claim:` y `Evidence:` cuando están disponibles.

## Herramientas del agente

| Herramienta          | Finalidad                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | modo y ámbito actuales del almacén, agente resuelto, estado, disponibilidad de la CLI de Obsidian                                                                               |
| `wiki_search` | busca páginas wiki y, cuando está configurado, el corpus de memoria compartida; acepta `mode` para buscar personas, enrutar preguntas, consultar evidencias de origen o examinar afirmaciones sin procesar |
| `wiki_get`    | lee una página wiki por ID/ruta y recurre al corpus de memoria compartida cuando la búsqueda compartida está habilitada y la consulta no encuentra resultados                                     |
| `wiki_apply`  | mutaciones específicas de síntesis/metadatos sin modificar páginas libremente                                                                                             |
| `wiki_lint`   | comprobaciones estructurales, lagunas de procedencia, contradicciones y preguntas abiertas                                                                                            |

El plugin también registra un complemento no exclusivo del corpus de memoria, por lo que las
funciones compartidas `memory_search` y `memory_get` pueden acceder a la wiki cuando el plugin de Active Memory
admite la selección de corpus.

## Comportamiento del prompt y del contexto

Cuando `context.includeCompiledDigestPrompt` está habilitado, las secciones de memoria del prompt
añaden una instantánea compilada y compacta del estado del plugin: solo las páginas
principales, solo las afirmaciones principales, el número de contradicciones, el número de preguntas y
calificadores de confianza/actualidad. Es opcional porque cambia la estructura del prompt; resulta relevante
principalmente para motores de contexto o ensamblajes de prompts que consumen explícitamente
complementos de memoria.

## Configuración

Coloque la configuración bajo `plugins.entries.memory-wiki.config`:

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

| Clave                                        | Valores / valor predeterminado                               | Notas                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (predeterminado), `bridge`, `unsafe-local` | elige el comportamiento de entrada e integración                                        |
| `vault.scope`                              | `global` (predeterminado), `agent`                    | un almacén compartido o un almacén secundario por agente                                 |
| `vault.path`                               | valor predeterminado global `~/.openclaw/wiki/main`         | almacén exacto globalmente; el directorio principal del ámbito de agente usa de forma predeterminada `~/.openclaw/wiki`       |
| `vault.renderMode`                         | `native` (predeterminado), `obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | valor predeterminado `true`                                 | importa los artefactos públicos del plugin de Active Memory activo                                  |
| `bridge.followMemoryEvents`                | valor predeterminado `true`                                 | incluye registros de eventos en el modo puente                                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | valor predeterminado `false`                                | necesario para ejecutar importaciones de `unsafe-local`                                        |
| `unsafeLocal.paths`                        | valor predeterminado `[]`                                   | rutas locales explícitas que se importarán en el modo `unsafe-local`                         |
| `search.backend`                           | `shared` (predeterminado), `local`                    |                                                                               |
| `search.corpus`                            | `wiki` (predeterminado), `memory`, `all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | valor predeterminado `false`                                | añade la instantánea compacta del resumen del agente seleccionado a las secciones de memoria del prompt |
| `render.createBacklinks`                   | valor predeterminado `true`                                 | genera bloques relacionados deterministas                                         |
| `render.createDashboards`                  | valor predeterminado `true`                                 | genera páginas de paneles                                                      |

### Almacenes por agente

Establezca `vault.scope` en `agent` para proporcionar una wiki independiente a cada agente configurado.
En este ámbito, `vault.path` es un directorio principal y OpenClaw añade el
ID normalizado del agente:

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
`~/.openclaw/wiki/marketing`. Si `vault.path` se omite en el ámbito de agente, el
directorio principal usa de forma predeterminada `~/.openclaw/wiki`. Por tanto, el agente `main` predeterminado conserva
la ruta `~/.openclaw/wiki/main` existente.

Las herramientas del agente, los resúmenes compilados del prompt y el complemento de la wiki expuesto mediante
`memory_search` / `memory_get` resuelven el almacén a partir del contexto del agente activo.
Para llamadas de la CLI y del Gateway en una configuración con varios agentes configurados, proporcione
el agente explícitamente mediante `openclaw wiki --agent <agentId> ...` o el valor `agentId` de la
solicitud del Gateway. Un único agente configurado sigue siendo el predeterminado cuando no se
proporciona ningún ID.

En el modo puente, las importaciones con ámbito de agente aceptan un artefacto público de memoria solo cuando
su `agentIds` incluye al agente seleccionado. Se omiten los artefactos que pertenecen a otro agente,
que no contienen metadatos de propiedad o cuyo propietario es desconocido. El ámbito global
mantiene el comportamiento existente para los artefactos compartidos.

<Warning>
Cambiar `vault.scope` no copia ni divide un almacén existente. En el ámbito de agente,
un `vault.path` configurado explícitamente se convierte en un directorio principal, por lo que se deben mover o
importar deliberadamente las páginas existentes antes de cambiar los agentes de producción. Haga primero una copia de seguridad
del almacén.

Los almacenes por agente constituyen un límite de conocimiento dentro del mismo proceso, no un límite de seguridad
del sistema operativo. Los plugins y las herramientas sin aislamiento que tienen acceso al sistema de archivos del host
aún pueden leer el directorio de otro agente. Use el [aislamiento](/es/gateway/sandboxing) o
[perfiles de Gateway independientes](/es/gateway/multiple-gateways) cuando los agentes no confíen
entre sí.
</Warning>

### Ejemplo: QMD + modo puente

Use esta configuración cuando desee utilizar QMD para la recuperación y `memory-wiki` como una capa de
conocimiento mantenida. Cada capa conserva su función específica: QMD mantiene disponibles para búsqueda las notas sin procesar, las
exportaciones de sesiones y las colecciones adicionales, mientras que `memory-wiki` compila
entidades estables, afirmaciones, paneles y páginas de origen.

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

Esto mantiene a QMD a cargo de la recuperación de Active Memory, centra `memory-wiki` en
las páginas compiladas y los paneles, y conserva sin cambios la estructura del prompt hasta que se
habiliten intencionadamente los prompts con resúmenes compilados.

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

Consulte [CLI: wiki](/es/cli/wiki) para obtener la referencia completa de los comandos, incluidos
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` y el conjunto completo de subcomandos de `wiki obsidian`.

## Compatibilidad con Obsidian

Cuando `vault.renderMode` es `obsidian`, el plugin escribe Markdown compatible con Obsidian
y puede usar opcionalmente la CLI oficial `obsidian` para consultar el
estado, buscar en el almacén, abrir una página, invocar un comando y acceder a la
nota diaria. Es opcional; la wiki sigue funcionando en modo nativo sin
Obsidian.

Los almacenes con ámbito de agente pueden seguir usando Markdown compatible con Obsidian, pero la validación de la
configuración rechaza `obsidian.useOfficialCli: true` con `vault.scope: "agent"`.
La configuración actual de `obsidian.vaultName` es global y no puede seleccionar un almacén de
Obsidian distinto para cada agente. Use en su lugar las herramientas de la wiki y las operaciones de la CLI,
o mantenga una wiki gestionada mediante Obsidian en el ámbito global.

## Flujo de trabajo recomendado

<Steps>
<Step title="Mantener el plugin de memoria activa para la recuperación">
La recuperación, la promoción y Dreaming siguen siendo responsabilidad del backend de memoria configurado.
</Step>
<Step title="Habilitar memory-wiki">
Comience con el modo `isolated`, a menos que desee explícitamente el modo puente.
</Step>
<Step title="Usar wiki_search / wiki_get cuando importe la procedencia">
Prefiéralos a `memory_search` cuando desee una clasificación específica de la wiki o una estructura de creencias a nivel de página.
</Step>
<Step title="Usar wiki_apply para síntesis acotadas o actualizaciones de metadatos">
Evite editar manualmente los bloques generados administrados.
</Step>
<Step title="Ejecutar wiki_lint después de cambios significativos">
Detecta contradicciones, preguntas abiertas y lagunas de procedencia.
</Step>
<Step title="Activar los paneles para dar visibilidad al contenido obsoleto y las contradicciones">
Establezca `render.createDashboards: true` (valor predeterminado).
</Step>
</Steps>

## Documentación relacionada

- [Descripción general de la memoria](/es/concepts/memory)
- [CLI: memoria](/es/cli/memory)
- [CLI: wiki](/es/cli/wiki)
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
