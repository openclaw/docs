---
read_when:
    - Je wilt blijvende kennis die verder gaat dan gewone MEMORY.md-notities
    - Je configureert de gebundelde memory-wiki Plugin
    - Je wilt wiki_search, wiki_get of brugmodus begrijpen
summary: 'memory-wiki: gecompileerde kennisopslag met herkomst, claims, dashboards en bridge-modus'
title: Geheugenwiki
x-i18n:
    generated_at: "2026-04-29T23:03:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` is een gebundelde Plugin die duurzame memory omzet in een gecompileerde
kennisvault.

Het vervangt de Active Memory Plugin **niet**. De Active Memory Plugin blijft
eigenaar van recall, promotie, indexering en Dreaming. `memory-wiki` staat ernaast
en compileert duurzame kennis naar een navigeerbare wiki met deterministische pagina's,
gestructureerde claims, herkomst, dashboards en machinaal leesbare digests.

Gebruik het wanneer je wilt dat memory zich meer gedraagt als een onderhouden kennislaag en
minder als een stapel Markdown-bestanden.

## Wat het toevoegt

- Een dedicated wiki-vault met deterministische pagina-indeling
- Gestructureerde claim- en bewijsmetadata, niet alleen proza
- Herkomst, vertrouwen, tegenstrijdigheden en open vragen op paginaniveau
- Gecompileerde digests voor agent-/runtime-consumenten
- Wiki-native zoek-/ophaal-/toepas-/lint-tools
- Optionele bridge-modus die publieke artefacten uit de Active Memory Plugin importeert
- Optionele Obsidian-vriendelijke render-modus en CLI-integratie

## Hoe het past bij memory

Zie de scheiding als volgt:

| Laag                                                    | Is eigenaar van                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin (`memory-core`, QMD, Honcho, enz.) | Recall, semantisch zoeken, promotie, Dreaming, memory-runtime                              |
| `memory-wiki`                                           | Gecompileerde wikipagina's, syntheses met rijke herkomst, dashboards, wiki-specifiek zoeken/ophalen/toepassen |

Als de Active Memory Plugin gedeelde recall-artefacten aanbiedt, kan OpenClaw
beide lagen in één keer doorzoeken met `memory_search corpus=all`.

Wanneer je wiki-specifieke rangschikking, herkomst of directe paginatoegang nodig hebt, gebruik je
in plaats daarvan de wiki-native tools.

## Aanbevolen hybride patroon

Een sterke standaard voor local-first setups is:

- QMD als Active Memory-backend voor recall en brede semantische zoekopdrachten
- `memory-wiki` in `bridge`-modus voor duurzame gesynthetiseerde kennispagina's

Die scheiding werkt goed omdat elke laag gefocust blijft:

- QMD houdt ruwe notities, sessie-exports en extra collecties doorzoekbaar
- `memory-wiki` compileert stabiele entiteiten, claims, dashboards en bronpagina's

Praktische regel:

- gebruik `memory_search` wanneer je één brede recall-pass over memory wilt
- gebruik `wiki_search` en `wiki_get` wanneer je wikiresultaten met herkomstbewustzijn wilt
- gebruik `memory_search corpus=all` wanneer je wilt dat gedeeld zoeken beide lagen omvat

Als bridge-modus nul geëxporteerde artefacten meldt, stelt de Active Memory Plugin
momenteel nog geen publieke bridge-inputs beschikbaar. Voer eerst `openclaw wiki doctor` uit
en bevestig daarna dat de Active Memory Plugin publieke artefacten ondersteunt.

Wanneer bridge-modus actief is en `bridge.readMemoryArtifacts` is ingeschakeld,
lezen `openclaw wiki status`, `openclaw wiki doctor` en `openclaw wiki bridge
import` via de draaiende Gateway. Dat houdt CLI-bridgecontroles afgestemd
op de runtimecontext van de memory-Plugin. Als bridge is uitgeschakeld of artefact-reads
zijn uitgeschakeld, behouden die commando's hun lokale/offline gedrag.

## Vault-modi

`memory-wiki` ondersteunt drie vault-modi:

### `isolated`

Eigen vault, eigen bronnen, geen afhankelijkheid van `memory-core`.

Gebruik dit wanneer je wilt dat de wiki zijn eigen gecureerde kennisopslag is.

### `bridge`

Leest publieke memory-artefacten en memory-events van de Active Memory Plugin
via publieke Plugin SDK-seams.

Gebruik dit wanneer je wilt dat de wiki de geëxporteerde artefacten van de memory-Plugin
compileert en organiseert zonder private Plugin-internals te benaderen.

Bridge-modus kan indexeren:

- geëxporteerde memory-artefacten
- droomrapporten
- dagelijkse notities
- memory-rootbestanden
- memory-eventlogs

### `unsafe-local`

Expliciete same-machine escape hatch voor lokale private paden.

Deze modus is bewust experimenteel en niet-portabel. Gebruik hem alleen wanneer je
de vertrouwensgrens begrijpt en specifiek lokale bestandssysteemtoegang nodig hebt die
bridge-modus niet kan bieden.

## Vault-indeling

De Plugin initialiseert een vault als volgt:

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

Beheerde inhoud blijft binnen gegenereerde blokken. Menselijke notitieblokken blijven behouden.

De belangrijkste paginagroepen zijn:

- `sources/` voor geïmporteerd ruw materiaal en bridge-ondersteunde pagina's
- `entities/` voor duurzame dingen, mensen, systemen, projecten en objecten
- `concepts/` voor ideeën, abstracties, patronen en beleid
- `syntheses/` voor gecompileerde samenvattingen en onderhouden rollups
- `reports/` voor gegenereerde dashboards

## Gestructureerde claims en bewijs

Pagina's kunnen gestructureerde `claims`-frontmatter bevatten, niet alleen vrije tekst.

Elke claim kan bevatten:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Bewijsitems kunnen bevatten:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Dit zorgt ervoor dat de wiki meer werkt als een overtuigingslaag dan als een passieve notitie-
dump. Claims kunnen worden gevolgd, gescoord, betwist en teruggevoerd naar bronnen.

## Entiteitsmetadata voor agents

Entiteitspagina's kunnen ook routeringsmetadata voor agentgebruik bevatten. Dit is generieke
frontmatter, dus het werkt voor mensen, teams, systemen, projecten of elk ander
entiteitstype.

Veelvoorkomende velden zijn:

- `entityType`: bijvoorbeeld `person`, `team`, `system` of `project`
- `canonicalId`: stabiele identiteitssleutel die over aliassen en imports heen wordt gebruikt
- `aliases`: namen, handles of labels die naar dezelfde pagina moeten verwijzen
- `privacyTier`: `public`, `local-private`, `sensitive` of `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: compacte routeringshints
- `lastRefreshedAt`: timestamp voor bronverversing, los van paginabewerkingstijd
- `personCard`: optionele persoonspecifieke routeringskaart met handles, socials,
  e-mails, tijdzone, lane, vraag-voor, niet-vragen-voor, vertrouwen en privacy
- `relationships`: getypeerde randen naar gerelateerde pagina's met target, soort, gewicht,
  vertrouwen, bewijssoort, privacyniveau en notitie

Voor een mensenwiki moet de agent meestal beginnen met
`reports/person-agent-directory.md`, en daarna de persoonspagina openen met `wiki_get`
voordat contactgegevens of afgeleide feiten worden gebruikt.

Voorbeeld:

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

## Compile-pipeline

De compile-stap leest wikipagina's, normaliseert samenvattingen en maakt stabiele
machinaal gerichte artefacten aan onder:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Deze digests bestaan zodat agents en runtimecode geen Markdown-pagina's hoeven te scrapen.

Gecompileerde output ondersteunt ook:

- eerste-pass wiki-indexering voor zoek-/ophaalflows
- claim-id-lookup terug naar eigenaarspagina's
- compacte promptaanvullingen
- generatie van rapporten/dashboards

## Dashboards en gezondheidsrapporten

Wanneer `render.createDashboards` is ingeschakeld, onderhoudt compile dashboards onder
`reports/`.

Ingebouwde rapporten zijn onder andere:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Deze rapporten volgen zaken zoals:

- clusters van tegenstrijdigheidsnotities
- concurrerende claimclusters
- claims zonder gestructureerd bewijs
- pagina's en claims met laag vertrouwen
- verouderde of onbekende versheid
- pagina's met onopgeloste vragen
- routeringskaarten voor personen/entiteiten
- gestructureerde relatieranden
- dekking van bewijsklassen
- niet-publieke privacyniveaus die vóór gebruik beoordeling vereisen

## Zoeken en ophalen

`memory-wiki` ondersteunt twee zoekbackends:

- `shared`: gebruik de gedeelde memory-zoekflow wanneer beschikbaar
- `local`: doorzoek de wiki lokaal

Het ondersteunt ook drie corpora:

- `wiki`
- `memory`
- `all`

Belangrijk gedrag:

- `wiki_search` en `wiki_get` gebruiken waar mogelijk gecompileerde digests als eerste pass
- claim-id's kunnen terugverwijzen naar de eigenaarspagina
- betwiste/verouderde/verse claims beïnvloeden rangschikking
- herkomstlabels kunnen in resultaten behouden blijven
- zoekmodus kan rangschikking sturen voor personenlookup, vraagroutering, bron-
  bewijs of ruwe claims

Praktische regel:

- gebruik `memory_search corpus=all` voor één brede recall-pass
- gebruik `wiki_search` + `wiki_get` wanneer wiki-specifieke rangschikking,
  herkomst of overtuigingsstructuur op paginaniveau belangrijk is

Zoekmodi:

- `auto`: gebalanceerde standaard
- `find-person`: boost persoonsachtige entiteiten, aliassen, handles, socials en
  canonical ID's
- `route-question`: boost agentkaarten, vraag-voor-hints, best-gebruikt-voor-hints en
  relatiecontext
- `source-evidence`: boost bronpagina's en gestructureerde bewijsmetadata
- `raw-claim`: boost overeenkomende gestructureerde claims en retourneer claim-/bewijs-
  metadata in resultaten

Wanneer een resultaat overeenkomt met een gestructureerde claim, kan `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` en `evidenceSourceIds` retourneren in de details-payload. Tekstoutput
bevat ook compacte `Claim:`- en `Evidence:`-regels wanneer beschikbaar.

## Agenttools

De Plugin registreert deze tools:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Wat ze doen:

- `wiki_status`: huidige vault-modus, gezondheid, beschikbaarheid van Obsidian CLI
- `wiki_search`: doorzoek wikipagina's en, wanneer geconfigureerd, gedeelde memory-corpora;
  accepteert `mode` voor personenlookup, vraagroutering, bronbewijs of ruwe
  claimdrilldown
- `wiki_get`: lees een wikipagina op id/pad of val terug op gedeelde memory-corpus
- `wiki_apply`: smalle synthese-/metadatamutaties zonder vrije paginachirurgie
- `wiki_lint`: structurele controles, herkomstgaten, tegenstrijdigheden, open vragen

De Plugin registreert ook een niet-exclusieve memory-corpusaanvulling, zodat gedeelde
`memory_search` en `memory_get` de wiki kunnen bereiken wanneer de Active Memory
Plugin corpusselectie ondersteunt.

## Prompt- en contextgedrag

Wanneer `context.includeCompiledDigestPrompt` is ingeschakeld, voegen memory-promptsecties
een compacte gecompileerde snapshot uit `agent-digest.json` toe.

Die snapshot is bewust klein en bevat veel signaal:

- alleen toppagina's
- alleen topclaims
- aantal tegenstrijdigheden
- aantal vragen
- kwalificaties voor vertrouwen/versheid

Dit is opt-in omdat het de promptvorm wijzigt en vooral nuttig is voor context-
engines of legacy promptassemblage die expliciet memory-aanvullingen consumeren.

## Configuratie

Plaats config onder `plugins.entries.memory-wiki.config`:

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

Belangrijke schakelaars:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` of `obsidian`
- `bridge.readMemoryArtifacts`: openbare artefacten van de Active Memory-Plugin importeren
- `bridge.followMemoryEvents`: gebeurtenislogs opnemen in bridge-modus
- `search.backend`: `shared` of `local`
- `search.corpus`: `wiki`, `memory` of `all`
- `context.includeCompiledDigestPrompt`: compacte digest-snapshot toevoegen aan geheugenpromptsecties
- `render.createBacklinks`: deterministische gerelateerde blokken genereren
- `render.createDashboards`: dashboardpagina's genereren

### Voorbeeld: QMD + bridge-modus

Gebruik dit wanneer u QMD wilt gebruiken voor recall en `memory-wiki` voor een onderhouden
kennislaag:

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

Dit houdt:

- QMD verantwoordelijk voor Active Memory-recall
- `memory-wiki` gericht op gecompileerde pagina's en dashboards
- promptvorm ongewijzigd totdat u opzettelijk gecompileerde digest-prompts inschakelt

## CLI

`memory-wiki` biedt ook een CLI-oppervlak op hoofdniveau:

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

Zie [CLI: wiki](/nl/cli/wiki) voor de volledige opdrachtreferentie.

## Obsidian-ondersteuning

Wanneer `vault.renderMode` `obsidian` is, schrijft de Plugin Obsidian-vriendelijke
Markdown en kan deze optioneel de officiële `obsidian` CLI gebruiken.

Ondersteunde workflows omvatten:

- statuscontrole
- vault-zoekopdracht
- een pagina openen
- een Obsidian-opdracht aanroepen
- naar de dagelijkse notitie springen

Dit is optioneel. De wiki werkt nog steeds in native modus zonder Obsidian.

## Aanbevolen workflow

1. Behoud uw Active Memory-Plugin voor recall/promotie/dreaming.
2. Schakel `memory-wiki` in.
3. Begin met de modus `isolated`, tenzij u expliciet bridge-modus wilt.
4. Gebruik `wiki_search` / `wiki_get` wanneer herkomst ertoe doet.
5. Gebruik `wiki_apply` voor gerichte syntheses of metadata-updates.
6. Voer `wiki_lint` uit na betekenisvolle wijzigingen.
7. Schakel dashboards in als u zichtbaarheid op verouderde gegevens/tegenstrijdigheden wilt.

## Gerelateerde documentatie

- [Geheugenoverzicht](/nl/concepts/memory)
- [CLI: memory](/nl/cli/memory)
- [CLI: wiki](/nl/cli/wiki)
- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
