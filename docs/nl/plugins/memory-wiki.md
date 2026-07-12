---
read_when:
    - Je wilt blijvende kennis die verder gaat dan gewone MEMORY.md-notities
    - Je configureert de meegeleverde memory-wiki-Plugin
    - Je hebt afzonderlijke wikikluisjes nodig voor agents in één Gateway
    - U wilt wiki_search, wiki_get of de bridge-modus begrijpen
summary: 'memory-wiki: gecompileerde kennisbank met herkomst, beweringen, dashboards en bridge-modus'
title: Geheugenwiki
x-i18n:
    generated_at: "2026-07-12T09:10:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` is een gebundelde plugin die duurzame kennis compileert tot een
navigeerbare wiki: deterministische pagina's, gestructureerde beweringen met bewijs,
herkomst, dashboards en machineleesbare samenvattingen.

Deze vervangt de Active Memory-plugin niet. Herinnering, promotie, indexering en
Dreaming blijven de verantwoordelijkheid van de geconfigureerde geheugenbackend
(`memory-core`, QMD, Honcho enzovoort). `memory-wiki` bevindt zich ernaast en compileert
kennis tot een onderhouden wikilaag.

| Laag                 | Verantwoordelijk voor                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| Active Memory-plugin | Herinnering, semantisch zoeken, promotie, Dreaming, geheugenruntime                  |
| `memory-wiki`        | Gecompileerde wikipagina's, herkomstrijke syntheses, dashboards, wiki zoeken/ophalen/toepassen |

Praktische regel:

- `memory_search` voor één brede herinneringsronde in alle geconfigureerde corpora
- `wiki_search` / `wiki_get` wanneer je wikispecifieke rangschikking, herkomst of een geloofsstructuur op paginaniveau wilt
- `memory_search corpus=all` om beide lagen in één aanroep te doorzoeken, wanneer de Active Memory-plugin corpusselectie ondersteunt

Een gebruikelijke local-first-configuratie: QMD als de Active Memory-backend voor herinnering en
`memory-wiki` in de modus `bridge` voor duurzame gesynthetiseerde pagina's. Zie het
voorbeeld voor QMD + bridge-modus onder [Configuratie](#configuration).

Als de bridge-modus nul geëxporteerde artefacten meldt, stelt de Active Memory-plugin
momenteel geen openbare bridge-invoer beschikbaar. Voer eerst `openclaw wiki doctor` uit
en controleer vervolgens of de Active Memory-plugin openbare artefacten ondersteunt.

## Kluismodi

- `isolated` (standaard): eigen kluis, eigen bronnen, geen afhankelijkheid van de Active Memory-plugin. Gebruik dit voor een zelfstandige, gecureerde kennisopslag.
- `bridge`: leest openbare geheugenartefacten en gebeurtenislogboeken van de Active Memory-plugin via openbare plugin-SDK-koppelingen. Gebruik dit om de geëxporteerde artefacten van de geheugenplugin te compileren zonder toegang tot interne privéonderdelen van de plugin.
- `unsafe-local`: expliciete ontsnappingsroute voor privépaden op dezelfde machine. Bewust experimenteel en niet-overdraagbaar; gebruik dit alleen wanneer je de vertrouwensgrens begrijpt en specifiek toegang tot het lokale bestandssysteem nodig hebt die de bridge-modus niet kan bieden.

Kluismodus en kluisbereik zijn afzonderlijke keuzes:

- `vaultMode` bepaalt waar wiki-invoer vandaan komt.
- `vault.scope` bepaalt of alle agents één kluis gebruiken of elke agent een onderliggende kluis krijgt.

`vault.scope: "global"` is de standaardinstelling en behoudt het bestaande gedrag met één kluis.
Gebruik `vault.scope: "agent"` met de modus `isolated` of `bridge` wanneer
agents geen wikipagina's, gecompileerde samenvattingen, zoekresultaten of schrijfbewerkingen
mogen delen. Agentbereik kan niet worden gecombineerd met de modus `unsafe-local`, omdat die
geconfigureerde privépaden geen invoer zijn waarvan de agent eigenaar is. Configuratievalidatie
wijst deze combinatie af.

De bridge-modus kan, afhankelijk van de schakelopties in de `bridge.*`-configuratie, het volgende indexeren:

- geëxporteerde geheugenartefacten (`indexMemoryRoot`)
- dagelijkse notities (`indexDailyNotes`)
- Dreaming-rapporten (`indexDreamReports`)
- geheugengebeurtenislogboeken (`followMemoryEvents`)

Wanneer de bridge-modus actief is en `bridge.readMemoryArtifacts` is ingeschakeld,
worden `openclaw wiki status`, `openclaw wiki doctor` en `openclaw wiki bridge
import` via de actieve Gateway geleid, zodat ze dezelfde context van de Active Memory-
plugin zien als het geheugen van agents en de runtime. Als bridge is uitgeschakeld of het
lezen van artefacten is uitgeschakeld, behouden deze opdrachten hun lokale/offlinegedrag.

## Kluisindeling

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

Beheerde inhoud blijft binnen gegenereerde blokken; blokken met menselijke notities
blijven bij regeneratie behouden.

- `sources/`: geïmporteerd bronmateriaal en pagina's die door bridge/unsafe-local worden ondersteund
- `entities/`: duurzame zaken, personen, systemen, projecten, objecten
- `concepts/`: ideeën, abstracties, patronen, beleid (ook de bestemming voor OKF-importen)
- `syntheses/`: gecompileerde samenvattingen en onderhouden totalen
- `reports/`: gegenereerde dashboards

## Importen in Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importeer een uitgepakte Open Knowledge Format-bundel in wiki-conceptpagina's. Dit is
geschikt wanneer een gegevenscatalogus, documentatiecrawler of verrijkingsagent al
OKF produceert: behoud OKF als het overdraagbare uitwisselingsartefact en laat `memory-wiki`
dit omzetten in systeemeigen OpenClaw-conceptpagina's en gecompileerde samenvattingen.

- niet-gereserveerde `.md`-bestanden zijn conceptdocumenten
- elk geïmporteerd concept vereist een niet-leeg frontmatter-veld `type`; een ontbrekend `type` veroorzaakt een waarschuwing `missing-type` en het bestand wordt overgeslagen
- onbekende waarden voor `type` worden geaccepteerd als generieke concepten
- `index.md` en `log.md` zijn gereserveerd en worden nooit als concepten geïmporteerd
- defecte of externe Markdown-koppelingen blijven ongewijzigd

Geïmporteerde pagina's worden rechtstreeks onder `concepts/` geplaatst, zodat bestaande processen
voor compileren, zoeken, ophalen en dashboards ze zonder een tweede wikiboom kunnen gebruiken.
Elke pagina behoudt de oorspronkelijke OKF-concept-ID, het bronpad, `type`, `resource`, `tags`, het
tijdstempel en de volledige frontmatter van de producent. Interne OKF-koppelingen worden herschreven
naar de gegenereerde wiki-conceptpagina's en leveren ook gestructureerde `relationships`-vermeldingen
op met `kind: okf-link`.

## Gestructureerde beweringen en bewijs

Pagina's bevatten gestructureerde `claims`-frontmatter, niet alleen vrije tekst. Elke
bewering kan `id`, `text`, `status`, `confidence`, `evidence[]` en
`updatedAt` bevatten. Elke bewijsvermelding kan `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` en `updatedAt` bevatten.

Hierdoor gedraagt de wiki zich als een geloofslaag en niet als een passieve verzameling notities.
Beweringen kunnen worden gevolgd, beoordeeld, betwist en teruggeleid naar bronnen.

## Entiteitsmetadata voor agents

Entiteitspagina's bevatten generieke routeringsmetadata die bruikbaar zijn voor personen, teams,
systemen, projecten of elk ander entiteitstype:

- `entityType`: bijvoorbeeld `person`, `team`, `system`, `project`
- `canonicalId`: stabiele identiteitssleutel voor aliassen en importen
- `aliases`: namen, gebruikersnamen of labels die naar dezelfde pagina verwijzen
- `privacyTier`: vrije tekenreeks; `public` wordt behandeld als geen beoordeling nodig, elke andere waarde (bijvoorbeeld `local-private`, `sensitive`, `confirm-before-use`) wordt gemarkeerd in `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: compacte routeringsaanwijzingen
- `lastRefreshedAt`: tijdstempel van bronvernieuwing, los van de bewerkingstijd van de pagina
- `personCard`: optionele persoonsgerichte routeringskaart (gebruikersnamen, sociale profielen, e-mailadressen, tijdzone, werkgebied, waarvoor te benaderen, waarvoor niet te benaderen, betrouwbaarheid, privacyniveau)
- `relationships`: getypeerde verbindingen naar gerelateerde pagina's (doel, soort, gewicht, betrouwbaarheid, bewijssoort, privacyniveau, notitie)

Begin voor een personenwiki met `reports/person-agent-directory.md` en open vervolgens
de persoonspagina met `wiki_get` voordat je contactgegevens of afgeleide
feiten gebruikt.

<Accordion title="Voorbeeld van een entiteitspagina">
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
  - Voorbeeldroutering voor ecosysteem
notEnoughFor:
  - juridische goedkeuring
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Voorbeeldecosysteem
  askFor:
    - Vragen over voorbeelduitrol
  avoidAskingFor:
    - niet-gerelateerde factureringsbeslissingen
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Andere persoon
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is nuttig voor routering binnen het voorbeeldecosysteem.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Compilatiepijplijn

Compile leest wikipagina's, normaliseert samenvattingen en genereert stabiele
machinegerichte artefacten onder:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Agents en runtimecode lezen deze samenvattingen in plaats van Markdown uit te lezen.
Gecompileerde uitvoer ondersteunt ook de eerste fase van wiki-indexering voor zoeken/ophalen,
het terugleiden van bewering-ID's naar de bijbehorende pagina's, compacte promptaanvullingen
en het genereren van rapporten.

## Dashboards en statusrapporten

Wanneer `render.createDashboards` is ingeschakeld, onderhoudt Compile dashboards onder
`reports/`:

| Rapport                             | Volgt                                              |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | pagina's met onopgeloste vragen                    |
| `reports/contradictions.md`         | clusters van notities over tegenstrijdigheden      |
| `reports/low-confidence.md`         | pagina's en beweringen met lage betrouwbaarheid    |
| `reports/claim-health.md`           | beweringen zonder gestructureerd bewijs            |
| `reports/stale-pages.md`            | verouderde of onbekende actualiteit                 |
| `reports/person-agent-directory.md` | routeringskaarten voor personen/entiteiten          |
| `reports/relationship-graph.md`     | gestructureerde relatieverbindingen                 |
| `reports/provenance-coverage.md`    | dekking van bewijsklassen                           |
| `reports/privacy-review.md`         | niet-openbare privacyniveaus die vóór gebruik moeten worden beoordeeld |

## Zoeken en ophalen

Twee zoekbackends:

- `shared`: gebruik de gedeelde geheugenzoekstroom wanneer deze beschikbaar is
- `local`: doorzoek de wiki lokaal

Drie corpora: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` gebruiken waar mogelijk gecompileerde samenvattingen als eerste fase
- bewering-ID's verwijzen terug naar de bijbehorende pagina
- betwiste/verouderde/actuele beweringen beïnvloeden de rangschikking
- herkomstlabels blijven behouden in resultaten

Zoekmodi (`--mode` / toolparameter `mode`):

| Modus             | Geeft voorrang aan                                              |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | evenwichtige standaard                                         |
| `find-person`     | persoonsachtige entiteiten, aliassen, gebruikersnamen, sociale profielen, canonieke ID's |
| `route-question`  | agentkaarten, aanwijzingen voor waarvoor te benaderen/waarvoor het best te gebruiken, relatiecontext |
| `source-evidence` | bronpagina's en gestructureerde bewijsmetadata                 |
| `raw-claim`       | overeenkomende gestructureerde beweringen; retourneert metadata van beweringen/bewijs |

Wanneer een resultaat overeenkomt met een gestructureerde bewering, retourneert `wiki_search`
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` en `evidenceSourceIds` in de detailpayload. Tekstuitvoer
bevat waar beschikbaar compacte regels `Bewering:` en `Bewijs:`.

## Agenttools

| Tool          | Doel                                                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | huidige kluismodus en bereik, herleide agent, status, beschikbaarheid van de Obsidian-CLI                                                                              |
| `wiki_search` | doorzoekt wikipagina's en, indien geconfigureerd, het gedeelde geheugencorpus; accepteert `mode` voor het opzoeken van personen, routeren van vragen, bronbewijs of gedetailleerde analyse van ruwe beweringen |
| `wiki_get`    | leest een wikipagina op id/pad, met terugval op het gedeelde geheugencorpus wanneer gedeeld zoeken is ingeschakeld en de zoekopdracht niets oplevert                    |
| `wiki_apply`  | gerichte wijzigingen aan syntheses/metagegevens zonder vrijevormbewerking van pagina's                                                                                 |
| `wiki_lint`   | structurele controles, hiaten in herkomstgegevens, tegenstrijdigheden, openstaande vragen                                                                              |

De plugin registreert ook een niet-exclusieve aanvulling op het geheugencorpus, zodat gedeelde
`memory_search` en `memory_get` de wiki kunnen bereiken wanneer de actieve geheugenplugin
corpusselectie ondersteunt.

## Gedrag van prompts en context

Wanneer `context.includeCompiledDigestPrompt` is ingeschakeld, voegen geheugenpromptsecties
een compacte gecompileerde momentopname uit `agent-digest.json` toe: alleen de belangrijkste pagina's,
alleen de belangrijkste beweringen, het aantal tegenstrijdigheden, het aantal vragen en kwalificaties
voor betrouwbaarheid/actualiteit. Dit is optioneel omdat het de promptstructuur wijzigt; het is vooral relevant
voor contextengines of promptassemblage die expliciet geheugenaanvullingen
gebruiken.

## Configuratie

Plaats de configuratie onder `plugins.entries.memory-wiki.config`:

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

Belangrijkste schakelaars:

| Sleutel                                    | Waarden / standaardwaarde                       | Opmerkingen                                                                                       |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (standaard), `bridge`, `unsafe-local` | kiest het invoer- en integratiegedrag                                                             |
| `vault.scope`                              | `global` (standaard), `agent`                  | één gedeelde kluis of één onderliggende kluis per agent                                           |
| `vault.path`                               | globale standaardwaarde `~/.openclaw/wiki/main` | exact globaal kluispad; bovenliggende map voor agentbereik is standaard `~/.openclaw/wiki`         |
| `vault.renderMode`                         | `native` (standaard), `obsidian`               |                                                                                                   |
| `bridge.readMemoryArtifacts`               | standaard `true`                               | importeert openbare artefacten van de actieve geheugenplugin                                      |
| `bridge.followMemoryEvents`                | standaard `true`                               | neemt gebeurtenislogboeken op in brugmodus                                                        |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | standaard `false`                              | vereist om imports in `unsafe-local` uit te voeren                                                |
| `unsafeLocal.paths`                        | standaard `[]`                                 | expliciete lokale paden om in de modus `unsafe-local` te importeren                               |
| `search.backend`                           | `shared` (standaard), `local`                  |                                                                                                   |
| `search.corpus`                            | `wiki` (standaard), `memory`, `all`            |                                                                                                   |
| `context.includeCompiledDigestPrompt`      | standaard `false`                              | voegt de compacte digestmomentopname van de geselecteerde agent toe aan geheugenpromptsecties     |
| `render.createBacklinks`                   | standaard `true`                               | genereert deterministische blokken met gerelateerde inhoud                                        |
| `render.createDashboards`                  | standaard `true`                               | genereert dashboardpagina's                                                                      |

### Kluizen per agent

Stel `vault.scope` in op `agent` om elke geconfigureerde agent een afzonderlijke wiki te geven.
Binnen dit bereik is `vault.path` een bovenliggende map en voegt OpenClaw de
genormaliseerde agent-id toe:

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

Dit wordt herleid tot `~/.openclaw/wiki/support` en
`~/.openclaw/wiki/marketing`. Als `vault.path` in agentbereik wordt weggelaten, is de
bovenliggende map standaard `~/.openclaw/wiki`. De standaardagent `main` behoudt daardoor
het bestaande pad `~/.openclaw/wiki/main`.

Agenttools, gecompileerde promptdigests en de wiki-aanvulling die via
`memory_search` / `memory_get` beschikbaar wordt gesteld, herleiden de kluis vanuit de context van de actieve agent.
Geef voor CLI- en Gateway-aanroepen in een configuratie met meerdere geconfigureerde agents
de agent expliciet op met `openclaw wiki --agent <agentId> ...` of via `agentId`
in de Gateway-aanvraag. Eén geconfigureerde agent blijft de standaard wanneer geen id wordt
opgegeven.

In brugmodus accepteren imports met agentbereik een openbaar geheugenartefact alleen wanneer
de geselecteerde agent in de bijbehorende `agentIds` staat. Artefacten die eigendom zijn van een andere agent,
geen eigendomsmetagegevens hebben of een onbekende eigenaar hebben, worden overgeslagen. Globaal bereik
behoudt het bestaande gedrag voor gedeelde artefacten.

<Warning>
Het wijzigen van `vault.scope` kopieert of splitst een bestaande kluis niet. Binnen agentbereik
wordt een expliciet geconfigureerd `vault.path` een bovenliggende map; verplaats of
importeer bestaande pagina's daarom doelbewust voordat je productieagents omschakelt. Maak eerst
een back-up van de kluis.

Kluizen per agent vormen een kennisgrens binnen hetzelfde proces, geen beveiligingsgrens
van het besturingssysteem. Plugins en tools zonder sandbox met toegang tot het bestandssysteem van de host kunnen
nog steeds de map van een andere agent lezen. Gebruik [sandboxing](/nl/gateway/sandboxing) of
[afzonderlijke Gateway-profielen](/nl/gateway/multiple-gateways) wanneer agents elkaar niet
vertrouwen.
</Warning>

### Voorbeeld: QMD + brugmodus

Gebruik dit wanneer je QMD wilt gebruiken voor het terughalen van informatie en `memory-wiki` voor een beheerde
kennislaag. Elke laag houdt een eigen focus: QMD houdt ruwe notities, sessie-exports
en aanvullende verzamelingen doorzoekbaar, terwijl `memory-wiki`
stabiele entiteiten, beweringen, dashboards en bronpagina's compileert.

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

Hierdoor blijft QMD verantwoordelijk voor het terughalen uit het actieve geheugen, blijft `memory-wiki` gericht op
gecompileerde pagina's en dashboards en blijft de promptstructuur ongewijzigd totdat je
gecompileerde digestprompts bewust inschakelt.

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

Zie [CLI: wiki](/nl/cli/wiki) voor de volledige opdrachtreferentie, waaronder
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` en de volledige reeks subopdrachten van `wiki obsidian`.

## Ondersteuning voor Obsidian

Wanneer `vault.renderMode` is ingesteld op `obsidian`, schrijft de plugin voor Obsidian geschikte
Markdown en kan deze optioneel de officiële `obsidian`-CLI gebruiken voor het
controleren van de status, doorzoeken van de kluis, openen van een pagina, aanroepen van een opdracht en navigeren naar de
dagelijkse notitie. Dit is optioneel; de wiki werkt ook zonder
Obsidian in de native modus.

Kluizen met agentbereik kunnen nog steeds voor Obsidian geschikte Markdown gebruiken, maar de configuratievalidatie
weigert `obsidian.useOfficialCli: true` in combinatie met `vault.scope: "agent"`.
De huidige instelling `obsidian.vaultName` is globaal en kan niet voor elke agent een afzonderlijke
Obsidian-kluis selecteren. Gebruik in plaats daarvan de wikitools en CLI-bewerkingen,
of houd een door Obsidian beheerde wiki binnen globaal bereik.

## Aanbevolen werkwijze

<Steps>
<Step title="Behoud de actieve geheugenplugin voor het terughalen van informatie">
Het terughalen, promoveren en dromen blijven de verantwoordelijkheid van de geconfigureerde geheugenbackend.
</Step>
<Step title="Schakel memory-wiki in">
Begin met de modus `isolated`, tenzij je expliciet de brugmodus wilt gebruiken.
</Step>
<Step title="Gebruik wiki_search / wiki_get wanneer herkomst belangrijk is">
Geef hieraan de voorkeur boven `memory_search` wanneer je wikispecifieke rangschikking of een geloofsstructuur op paginaniveau wilt.
</Step>
<Step title="Gebruik wiki_apply voor gerichte syntheses of updates van metagegevens">
Vermijd het handmatig bewerken van beheerde, gegenereerde blokken.
</Step>
<Step title="Voer wiki_lint uit na betekenisvolle wijzigingen">
Detecteert tegenstrijdigheden, openstaande vragen en hiaten in herkomstgegevens.
</Step>
<Step title="Schakel dashboards in om verouderde gegevens en tegenstrijdigheden zichtbaar te maken">
Stel `render.createDashboards: true` in (standaard).
</Step>
</Steps>

## Gerelateerde documentatie

- [Overzicht van geheugen](/nl/concepts/memory)
- [CLI: geheugen](/nl/cli/memory)
- [CLI: wiki](/nl/cli/wiki)
- [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview)
