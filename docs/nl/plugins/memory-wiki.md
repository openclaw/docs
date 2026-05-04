---
read_when:
    - Je wilt blijvende kennis die verder gaat dan gewone MEMORY.md-notities
    - Je configureert de meegeleverde memory-wiki Plugin
    - Je wilt wiki_search, wiki_get of de bridge-modus begrijpen
summary: 'memory-wiki: samengestelde kennisopslag met herkomst, beweringen, overzichtspanelen en brugmodus'
title: Geheugenwiki
x-i18n:
    generated_at: "2026-05-04T07:07:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` is een gebundelde plugin die duurzame memory omzet in een gecompileerde
kennisvault.

Deze vervangt de Active Memory-plugin **niet**. De Active Memory-plugin blijft
eigenaar van recall, promotie, indexering en Dreaming. `memory-wiki` staat ernaast
en compileert duurzame kennis tot een navigeerbare wiki met deterministische pagina's,
gestructureerde claims, herkomst, dashboards en machineleesbare digests.

Gebruik deze wanneer je wilt dat memory zich meer gedraagt als een onderhouden kennislaag en
minder als een stapel Markdown-bestanden.

## Wat het toevoegt

- Een dedicated wiki-vault met deterministische pagina-indeling
- Gestructureerde claim- en evidence-metadata, niet alleen proza
- Herkomst, vertrouwen, tegenstrijdigheden en open vragen op paginaniveau
- Gecompileerde digests voor agent-/runtimeconsumenten
- Wiki-native zoek-/ophaal-/toepas-/lint-tools
- Optionele bridge-modus die publieke artefacten importeert uit de Active Memory-plugin
- Optionele Obsidian-vriendelijke rendermodus en CLI-integratie

## Hoe het past bij memory

Zie de splitsing zo:

| Laag                                                    | Is eigenaar van                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory-plugin (`memory-core`, QMD, Honcho, enz.) | Recall, semantisch zoeken, promotie, Dreaming, memory-runtime                              |
| `memory-wiki`                                           | Gecompileerde wikipagina's, syntheses met rijke herkomst, dashboards, wiki-specifiek zoeken/ophalen/toepassen |

Als de Active Memory-plugin gedeelde recall-artefacten beschikbaar stelt, kan OpenClaw
beide lagen in één doorgang doorzoeken met `memory_search corpus=all`.

Wanneer je wiki-specifieke ranking, herkomst of directe paginatoegang nodig hebt, gebruik je
in plaats daarvan de wiki-native tools.

## Aanbevolen hybride patroon

Een sterke standaard voor local-first setups is:

- QMD als de Active Memory-backend voor recall en brede semantische zoekopdrachten
- `memory-wiki` in `bridge`-modus voor duurzame, gesynthetiseerde kennispagina's

Die splitsing werkt goed omdat elke laag gefocust blijft:

- QMD houdt ruwe notities, sessie-exports en extra collecties doorzoekbaar
- `memory-wiki` compileert stabiele entiteiten, claims, dashboards en bronpagina's

Praktische regel:

- gebruik `memory_search` wanneer je één brede recall-doorgang over memory wilt
- gebruik `wiki_search` en `wiki_get` wanneer je wikiresultaten met herkomstbewustzijn wilt
- gebruik `memory_search corpus=all` wanneer je gedeeld zoeken over beide lagen wilt laten lopen

Als bridge-modus nul geëxporteerde artefacten meldt, stelt de Active Memory-plugin
momenteel nog geen publieke bridge-invoer beschikbaar. Voer eerst `openclaw wiki doctor` uit,
en bevestig daarna dat de Active Memory-plugin publieke artefacten ondersteunt.

Wanneer bridge-modus actief is en `bridge.readMemoryArtifacts` is ingeschakeld,
lezen `openclaw wiki status`, `openclaw wiki doctor` en `openclaw wiki bridge
import` via de draaiende Gateway. Dat houdt CLI-bridgecontroles afgestemd op
de runtimecontext van de memory-plugin. Als bridge is uitgeschakeld of artefactlezingen
uitstaan, behouden die opdrachten hun lokale/offline gedrag.

## Vault-modi

`memory-wiki` ondersteunt drie vault-modi:

### `isolated`

Eigen vault, eigen bronnen, geen afhankelijkheid van `memory-core`.

Gebruik dit wanneer je wilt dat de wiki zijn eigen gecureerde kennisopslag is.

### `bridge`

Leest publieke memory-artefacten en memory-events uit de Active Memory-plugin
via publieke plugin-SDK-seams.

Gebruik dit wanneer je wilt dat de wiki de geëxporteerde artefacten van de memory-plugin
compileert en organiseert zonder in private plugin-internals te grijpen.

Bridge-modus kan indexeren:

- geëxporteerde memory-artefacten
- Dreaming-rapporten
- dagelijkse notities
- memory-rootbestanden
- memory-eventlogs

### `unsafe-local`

Expliciete escape hatch op dezelfde machine voor lokale private paden.

Deze modus is opzettelijk experimenteel en niet-portabel. Gebruik deze alleen wanneer je
de vertrouwensgrens begrijpt en specifiek lokale bestandssysteemtoegang nodig hebt die
bridge-modus niet kan bieden.

## Vault-indeling

De plugin initialiseert een vault als volgt:

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
- `entities/` voor duurzame dingen, personen, systemen, projecten en objecten
- `concepts/` voor ideeën, abstracties, patronen en beleid
- `syntheses/` voor gecompileerde samenvattingen en onderhouden rollups
- `reports/` voor gegenereerde dashboards

## Gestructureerde claims en evidence

Pagina's kunnen gestructureerde `claims`-frontmatter bevatten, niet alleen vrije tekst.

Elke claim kan bevatten:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Evidence-vermeldingen kunnen bevatten:

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
frontmatter, dus het werkt voor personen, teams, systemen, projecten of elk ander
entiteitstype.

Veelvoorkomende velden zijn:

- `entityType`: bijvoorbeeld `person`, `team`, `system` of `project`
- `canonicalId`: stabiele identiteitssleutel die wordt gebruikt voor aliassen en imports
- `aliases`: namen, handles of labels die naar dezelfde pagina moeten verwijzen
- `privacyTier`: `public`, `local-private`, `sensitive` of `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: compacte routeringshints
- `lastRefreshedAt`: tijdstempel voor bronverversing, los van de bewerktijd van de pagina
- `personCard`: optionele persoonspecifieke routeringskaart met handles, socials,
  e-mails, tijdzone, lane, ask-for, avoid-asking-for, vertrouwen en privacy
- `relationships`: getypeerde verbindingen naar gerelateerde pagina's met doel, soort, gewicht,
  vertrouwen, evidence-soort, privacylaag en notitie

Voor een personenwiki moet de agent meestal beginnen met
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

De compileerstap leest wikipagina's, normaliseert samenvattingen en schrijft stabiele
machinegerichte artefacten onder:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Deze digests bestaan zodat agents en runtimecode geen Markdown-pagina's hoeven te scrapen.

Gecompileerde uitvoer voedt ook:

- eerste-doorgang-wiki-indexering voor zoek-/ophaalflows
- claim-id-lookup terug naar de eigenaarspagina's
- compacte promptaanvullingen
- rapport-/dashboardgeneratie

## Dashboards en statusrapporten

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

- clusters met tegenstrijdigheidsnotities
- concurrerende claimclusters
- claims zonder gestructureerde evidence
- pagina's en claims met laag vertrouwen
- verouderde of onbekende versheid
- pagina's met onopgeloste vragen
- routeringskaarten voor personen/entiteiten
- gestructureerde relatieverbindingen
- dekking van evidence-klassen
- niet-publieke privacylagen die vóór gebruik beoordeling nodig hebben

## Zoeken en ophalen

`memory-wiki` ondersteunt twee zoekbackends:

- `shared`: gebruik de gedeelde memory-zoekflow wanneer beschikbaar
- `local`: doorzoek de wiki lokaal

Het ondersteunt ook drie corpora:

- `wiki`
- `memory`
- `all`

Belangrijk gedrag:

- `wiki_search` en `wiki_get` gebruiken gecompileerde digests waar mogelijk als eerste doorgang
- claim-id's kunnen terug worden herleid naar de eigenaarspagina
- betwiste/verouderde/verse claims beïnvloeden ranking
- herkomstlabels kunnen in resultaten behouden blijven
- zoekmodus kan ranking sturen voor personenlookup, vraagroutering, bron-evidence
  of ruwe claims

Praktische regel:

- gebruik `memory_search corpus=all` voor één brede recall-doorgang
- gebruik `wiki_search` + `wiki_get` wanneer wiki-specifieke ranking,
  herkomst of geloofsstructuur op paginaniveau belangrijk is

Zoekmodi:

- `auto`: gebalanceerde standaard
- `find-person`: versterk persoonsachtige entiteiten, aliassen, handles, socials en
  canonieke ID's
- `route-question`: versterk agentkaarten, ask-for-hints, best-used-for-hints en
  relatiecontext
- `source-evidence`: versterk bronpagina's en gestructureerde evidence-metadata
- `raw-claim`: versterk overeenkomende gestructureerde claims en retourneer claim-/evidence-
  metadata in resultaten

Wanneer een resultaat overeenkomt met een gestructureerde claim, kan `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` en `evidenceSourceIds` retourneren in zijn details-payload. Tekstuitvoer
bevat ook compacte `Claim:`- en `Evidence:`-regels wanneer beschikbaar.

## Agenttools

De plugin registreert deze tools:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Wat ze doen:

- `wiki_status`: huidige vault-modus, gezondheid, beschikbaarheid van Obsidian CLI
- `wiki_search`: doorzoek wikipagina's en, wanneer geconfigureerd, gedeelde memory-corpora;
  accepteert `mode` voor personenlookup, vraagroutering, bron-evidence of ruwe
  claim-drilldown
- `wiki_get`: lees een wikipagina op id/pad of val terug op gedeeld memory-corpus
- `wiki_apply`: beperkte synthese-/metadatamutaties zonder vrije pagina-ingrepen
- `wiki_lint`: structurele controles, herkomstgaten, tegenstrijdigheden, open vragen

De plugin registreert ook een niet-exclusieve memory-corpusaanvulling, zodat gedeelde
`memory_search` en `memory_get` de wiki kunnen bereiken wanneer de Active Memory-plugin
corpusselectie ondersteunt.

## Prompt- en contextgedrag

Wanneer `context.includeCompiledDigestPrompt` is ingeschakeld, voegen memory-promptsecties
een compacte gecompileerde snapshot uit `agent-digest.json` toe.

Die snapshot is bewust klein en signaalrijk:

- alleen toppagina's
- alleen topclaims
- aantal tegenstrijdigheden
- aantal vragen
- kwalificaties voor vertrouwen/versheid

Dit is opt-in omdat het de promptvorm verandert en vooral nuttig is voor context-
engines of legacy promptassemblage die expliciet memory-aanvullingen consumeren.

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
- `bridge.readMemoryArtifacts`: importeer openbare artefacten van de active memory-Plugin
- `bridge.followMemoryEvents`: neem eventlogs op in bridge-modus
- `search.backend`: `shared` of `local`
- `search.corpus`: `wiki`, `memory` of `all`
- `context.includeCompiledDigestPrompt`: voeg compacte digest-snapshot toe aan geheugensecties van de prompt
- `render.createBacklinks`: genereer deterministische gerelateerde blokken
- `render.createDashboards`: genereer dashboardpagina's

### Voorbeeld: QMD + bridge-modus

Gebruik dit wanneer je QMD wilt voor recall en `memory-wiki` voor een onderhouden
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

Dit houdt:

- QMD verantwoordelijk voor active memory-recall
- `memory-wiki` gericht op gecompileerde pagina's en dashboards
- promptvorm ongewijzigd totdat je gecompileerde digest-prompts bewust inschakelt

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

Zie [CLI: wiki](/nl/cli/wiki) voor de volledige commandoreferentie.

## Obsidian-ondersteuning

Wanneer `vault.renderMode` `obsidian` is, schrijft de Plugin Obsidian-vriendelijke
Markdown en kan optioneel de officiële `obsidian` CLI gebruiken.

Ondersteunde workflows zijn onder andere:

- statuscontrole
- zoeken in de vault
- een pagina openen
- een Obsidian-commando aanroepen
- naar de dagelijkse notitie springen

Dit is optioneel. De wiki werkt nog steeds in native modus zonder Obsidian.

## Aanbevolen workflow

1. Behoud je active memory-Plugin voor recall/promotie/dreaming.
2. Schakel `memory-wiki` in.
3. Begin met de modus `isolated`, tenzij je expliciet bridge-modus wilt.
4. Gebruik `wiki_search` / `wiki_get` wanneer herkomst belangrijk is.
5. Gebruik `wiki_apply` voor gerichte syntheses of metadata-updates.
6. Voer `wiki_lint` uit na betekenisvolle wijzigingen.
7. Schakel dashboards in als je zichtbaarheid op verouderde informatie/tegenstrijdigheden wilt.

## Gerelateerde docs

- [Memory-overzicht](/nl/concepts/memory)
- [CLI: memory](/nl/cli/memory)
- [CLI: wiki](/nl/cli/wiki)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
