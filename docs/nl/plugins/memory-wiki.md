---
read_when:
    - Je wilt blijvende kennis naast gewone MEMORY.md-notities
    - Je configureert de meegeleverde memory-wiki-plugin
    - Je wilt wiki_search, wiki_get of bridge-modus begrijpen
summary: 'memory-wiki: gecompileerde kennisbank met herkomst, beweringen, dashboards en brugmodus'
title: Geheugenwiki
x-i18n:
    generated_at: "2026-06-27T17:55:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` is een gebundelde Plugin die duurzame memory omzet in een gecompileerde
kennisvault.

Het vervangt de Active Memory-Plugin **niet**. De Active Memory-Plugin blijft
eigenaar van recall, promotion, indexing en Dreaming. `memory-wiki` staat ernaast
en compileert duurzame kennis naar een navigeerbare wiki met deterministische pagina's,
gestructureerde claims, herkomst, dashboards en machineleesbare digests.

Gebruik het wanneer je wilt dat memory zich meer gedraagt als een onderhouden kennislaag en
minder als een stapel Markdown-bestanden.

## Wat het toevoegt

- Een dedicated wikivault met deterministische pagina-indeling
- Gestructureerde claim- en evidence-metadata, niet alleen proza
- Herkomst, vertrouwen, tegenspraken en open vragen op paginaniveau
- Gecompileerde digests voor agent-/runtime-consumenten
- Wiki-native search/get/apply/lint-tools
- Open Knowledge Format-imports naar gecompileerde wikiconcepten
- Optionele bridge-modus die publieke artefacten uit de Active Memory-Plugin importeert
- Optionele Obsidian-vriendelijke render-modus en CLI-integratie

## Hoe het past bij memory

Zie de splitsing als volgt:

| Laag                                                    | Is eigenaar van                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory-Plugin (`memory-core`, QMD, Honcho, etc.) | Recall, semantisch zoeken, promotion, Dreaming, memory-runtime                             |
| `memory-wiki`                                           | Gecompileerde wikipagina's, syntheses met rijke herkomst, dashboards, wiki-specifieke search/get/apply |

Als de Active Memory-Plugin gedeelde recall-artefacten beschikbaar maakt, kan OpenClaw
beide lagen in een keer doorzoeken met `memory_search corpus=all`.

Wanneer je wiki-specifieke ranking, herkomst of directe paginatoegang nodig hebt, gebruik dan
in plaats daarvan de wiki-native tools.

## Aanbevolen hybride patroon

Een sterke standaard voor local-first setups is:

- QMD als de Active Memory-backend voor recall en brede semantische zoekopdrachten
- `memory-wiki` in `bridge`-modus voor duurzame gesynthetiseerde kennispagina's

Die splitsing werkt goed omdat elke laag gefocust blijft:

- QMD houdt ruwe notities, sessie-exports en extra collecties doorzoekbaar
- `memory-wiki` compileert stabiele entiteiten, claims, dashboards en bronpagina's

Praktische regel:

- gebruik `memory_search` wanneer je een brede recall-pass over memory wilt
- gebruik `wiki_search` en `wiki_get` wanneer je wikiresultaten met herkomstbewustzijn wilt
- gebruik `memory_search corpus=all` wanneer je gedeelde zoekopdrachten over beide lagen wilt laten lopen

Als bridge-modus nul geëxporteerde artefacten meldt, stelt de Active Memory-Plugin
momenteel nog geen publieke bridge-inputs beschikbaar. Voer eerst `openclaw wiki doctor` uit
en bevestig daarna dat de Active Memory-Plugin publieke artefacten ondersteunt.

Wanneer bridge-modus actief is en `bridge.readMemoryArtifacts` is ingeschakeld,
lezen `openclaw wiki status`, `openclaw wiki doctor` en `openclaw wiki bridge
import` via de draaiende Gateway. Daardoor blijven CLI-bridgechecks afgestemd
op de runtimecontext van de Memory-Plugin. Als bridge is uitgeschakeld of artefactlezingen
zijn uitgezet, behouden die commando's hun lokale/offline gedrag.

## Vault-modi

`memory-wiki` ondersteunt drie vault-modi:

### `isolated`

Eigen vault, eigen bronnen, geen afhankelijkheid van `memory-core`.

Gebruik dit wanneer je wilt dat de wiki een eigen gecureerde kennisopslag is.

### `bridge`

Leest publieke memory-artefacten en memory-events uit de Active Memory-Plugin
via publieke Plugin SDK-seams.

Gebruik dit wanneer je wilt dat de wiki de geëxporteerde artefacten van de Memory-Plugin
compileert en organiseert zonder in private Plugin-internals te grijpen.

Bridge-modus kan indexeren:

- geëxporteerde memory-artefacten
- dream-rapporten
- dagelijkse notities
- memory-rootbestanden
- memory-eventlogs

### `unsafe-local`

Expliciet same-machine escape hatch voor lokale private paden.

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

Beheerde content blijft binnen gegenereerde blokken. Menselijke notitieblokken blijven behouden.

De belangrijkste paginagroepen zijn:

- `sources/` voor geïmporteerd ruw materiaal en bridge-backed pagina's
- `entities/` voor duurzame dingen, mensen, systemen, projecten en objecten
- `concepts/` voor ideeën, abstracties, patronen en beleid
- `syntheses/` voor gecompileerde samenvattingen en onderhouden rollups
- `reports/` voor gegenereerde dashboards

## Open Knowledge Format-imports

`memory-wiki` kan uitgepakte Open Knowledge Format-bundels importeren met:

```bash
openclaw wiki okf import ./bundles/ga4
```

Dit past het best wanneer een datacatalogus, documentatiecrawler of
verrijkingsagent al OKF produceert: houd OKF als het draagbare uitwisselingsartefact
en laat `memory-wiki` het vervolgens omzetten naar OpenClaw-native conceptpagina's en
gecompileerde digests.

De importer volgt de OKF v0.1-vorm:

- niet-gereserveerde `.md`-bestanden zijn conceptdocumenten
- elk geïmporteerd concept heeft een niet-leeg `type`-frontmatterveld nodig
- onbekende OKF-`type`-waarden worden geaccepteerd
- gereserveerde `index.md`- en `log.md`-bestanden worden niet als concepten geïmporteerd
- kapotte of externe markdownlinks blijven behouden

Geïmporteerde conceptpagina's worden afgevlakt onder `concepts/`, zodat de bestaande compile-,
search-, get-, dashboard- en prompt-digestpaden ze zien zonder een tweede
wikitree toe te voegen. Elke pagina behoudt de oorspronkelijke OKF-concept-ID, het bronpad, `type`,
`resource`, `tags`, timestamp en volledige producer-frontmatter. Interne OKF-links
worden herschreven naar de gegenereerde wikiconceptpagina's en ook uitgegeven als gestructureerde
`relationships`-entries met `kind: okf-link`.

## Gestructureerde claims en evidence

Pagina's kunnen gestructureerde `claims`-frontmatter bevatten, niet alleen vrije tekst.

Elke claim kan bevatten:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Evidence-entries kunnen bevatten:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Dit zorgt ervoor dat de wiki meer als een overtuigingslaag werkt dan als een passieve
notitiedump. Claims kunnen worden gevolgd, gescoord, betwist en teruggeleid naar bronnen.

## Agentgerichte entiteitsmetadata

Entiteitspagina's kunnen ook routeringsmetadata voor agentgebruik bevatten. Dit is generieke
frontmatter, dus het werkt voor mensen, teams, systemen, projecten of elk ander
entiteitstype.

Veelvoorkomende velden zijn:

- `entityType`: bijvoorbeeld `person`, `team`, `system` of `project`
- `canonicalId`: stabiele identiteitssleutel die over aliassen en imports heen wordt gebruikt
- `aliases`: namen, handles of labels die naar dezelfde pagina moeten resolveren
- `privacyTier`: `public`, `local-private`, `sensitive` of `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: compacte routeringshints
- `lastRefreshedAt`: bronverversingstimestamp los van de paginabewerkingstijd
- `personCard`: optionele persoonspecifieke routeringskaart met handles, socials,
  e-mails, tijdzone, lane, ask-for, avoid-asking-for, confidence en privacy
- `relationships`: getypeerde edges naar gerelateerde pagina's met target, kind, weight,
  confidence, evidence-kind, privacy-tier en note

Voor een people-wiki moet de agent meestal beginnen met
`reports/person-agent-directory.md` en daarna de persoons pagina openen met `wiki_get`
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

De compile-stap leest wikipagina's, normaliseert samenvattingen en schrijft stabiele
machinegerichte artefacten weg onder:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Deze digests bestaan zodat agents en runtimecode geen Markdown-pagina's hoeven te scrapen.

Gecompileerde output voedt ook:

- first-pass wiki-indexing voor search/get-flows
- claim-ID lookup terug naar eigenaarspagina's
- compacte prompt-supplementen
- rapport-/dashboardgeneratie

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

- clusters met tegenspraaknotities
- concurrerende claimclusters
- claims zonder gestructureerde evidence
- pagina's en claims met laag vertrouwen
- verouderde of onbekende versheid
- pagina's met onopgeloste vragen
- person-/entity-routeringskaarten
- gestructureerde relationship-edges
- dekking van evidence-klassen
- niet-publieke privacy-tiers die voor gebruik review nodig hebben

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
- claim-ID's kunnen terugresolveren naar de eigenaarspagina
- betwiste/verouderde/verse claims beïnvloeden ranking
- herkomstlabels kunnen in resultaten behouden blijven
- de zoekmodus kan ranking sturen voor personenopzoeking, vraagroutering, bron-
  evidence of ruwe claims

Praktische regel:

- gebruik `memory_search corpus=all` voor een brede recall-pass
- gebruik `wiki_search` + `wiki_get` wanneer je geeft om wiki-specifieke ranking,
  herkomst of overtuigingsstructuur op paginaniveau

Zoekmodi:

- `auto`: gebalanceerde standaard
- `find-person`: boost person-like entiteiten, aliassen, handles, socials en
  canonical ID's
- `route-question`: boost agentkaarten, ask-for-hints, best-used-for-hints en
  relationship-context
- `source-evidence`: boost bronpagina's en gestructureerde evidence-metadata
- `raw-claim`: boost overeenkomende gestructureerde claims en retourneer claim-/evidence-
  metadata in resultaten

Wanneer een resultaat overeenkomt met een gestructureerde claim, kan `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` en `evidenceSourceIds` retourneren in zijn detailpayload. Tekstoutput
bevat ook compacte `Claim:`- en `Evidence:`-regels wanneer beschikbaar.

## Agent-tools

De Plugin registreert deze tools:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Wat ze doen:

- `wiki_status`: huidige vault-modus, gezondheid, beschikbaarheid van Obsidian CLI
- `wiki_search`: doorzoek wikipagina's en, indien geconfigureerd, gedeelde memory-corpora;
  accepteert `mode` voor personenopzoeking, vraagroutering, bron-evidence of ruwe
  claim-drilldown
- `wiki_get`: lees een wikipagina op ID/pad of val terug op de gedeelde memory-corpus
- `wiki_apply`: gerichte synthese-/metadatamutaties zonder vrije paginachirurgie
- `wiki_lint`: structurele checks, herkomstgaten, tegenspraken, open vragen

De Plugin registreert ook een niet-exclusieve aanvulling op het geheugencorpus, zodat gedeelde
`memory_search` en `memory_get` de wiki kunnen bereiken wanneer de actieve-geheugen-Plugin
corpusselectie ondersteunt.

## Gedrag van prompt en context

Wanneer `context.includeCompiledDigestPrompt` is ingeschakeld, voegen geheugenpromptsecties
een compacte gecompileerde momentopname uit `agent-digest.json` toe.

Die momentopname is bewust klein en rijk aan signalen:

- alleen toppagina's
- alleen topclaims
- aantal tegenstrijdigheden
- aantal vragen
- kwalificaties voor vertrouwen/actualiteit

Dit is opt-in omdat het de promptvorm wijzigt en vooral nuttig is voor context-engines
of legacy promptopbouw die expliciet geheugenaanvullingen gebruiken.

## Configuratie

Plaats configuratie onder `plugins.entries.memory-wiki.config`:

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
- `bridge.readMemoryArtifacts`: openbare artefacten van de actieve-geheugen-Plugin importeren
- `bridge.followMemoryEvents`: gebeurtenislogs opnemen in bridge-modus
- `search.backend`: `shared` of `local`
- `search.corpus`: `wiki`, `memory`, of `all`
- `context.includeCompiledDigestPrompt`: compacte digest-momentopname toevoegen aan geheugenpromptsecties
- `render.createBacklinks`: deterministische gerelateerde blokken genereren
- `render.createDashboards`: dashboardpagina's genereren

### Voorbeeld: QMD + bridge-modus

Gebruik dit wanneer je QMD wilt voor herinnering en `memory-wiki` voor een onderhouden
kennislaag:

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

Dit behoudt:

- QMD als verantwoordelijke voor actieve-geheugenherinnering
- `memory-wiki` gericht op gecompileerde pagina's en dashboards
- promptvorm ongewijzigd totdat je bewust gecompileerde digest-prompts inschakelt

## CLI

`memory-wiki` biedt ook een CLI-oppervlak op topniveau:

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
- zoeken in de vault
- een pagina openen
- een Obsidian-opdracht aanroepen
- naar de dagelijkse notitie springen

Dit is optioneel. De wiki werkt nog steeds in native modus zonder Obsidian.

## Aanbevolen workflow

1. Behoud je actieve-geheugen-Plugin voor herinnering/promotie/Dreaming.
2. Schakel `memory-wiki` in.
3. Begin met `isolated`-modus, tenzij je expliciet bridge-modus wilt.
4. Gebruik `wiki_search` / `wiki_get` wanneer herkomst belangrijk is.
5. Gebruik `wiki_apply` voor beperkte syntheses of metadata-updates.
6. Voer `wiki_lint` uit na betekenisvolle wijzigingen.
7. Schakel dashboards in als je zichtbaarheid wilt op veroudering/tegenstrijdigheden.

## Gerelateerde documentatie

- [Geheugenoverzicht](/nl/concepts/memory)
- [CLI: memory](/nl/cli/memory)
- [CLI: wiki](/nl/cli/wiki)
- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
