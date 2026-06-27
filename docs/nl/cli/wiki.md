---
read_when:
    - Je wilt de memory-wiki-CLI gebruiken
    - Je documenteert of wijzigt `openclaw wiki`
summary: CLI-referentie voor `openclaw wiki` (memory-wiki-kluisstatus, zoeken, compileren, linten, toepassen, bridge en Obsidian-helpers)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T17:24:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecteer en onderhoud de `memory-wiki`-vault.

Geleverd door de gebundelde `memory-wiki`-plugin.

Gerelateerd:

- [Memory Wiki-plugin](/nl/plugins/memory-wiki)
- [Geheugenoverzicht](/nl/concepts/memory)
- [CLI: memory](/nl/cli/memory)

## Waarvoor het dient

Gebruik `openclaw wiki` wanneer je een samengestelde kennisvault wilt met:

- wiki-eigen zoeken en pagina's lezen
- syntheses met uitgebreide herkomstinformatie
- rapporten over tegenstrijdigheden en versheid
- brugimports vanuit de actieve geheugenplugin
- optionele Obsidian CLI-helpers

## Veelgebruikte opdrachten

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Opdrachten

### `wiki status`

Inspecteer de huidige vaultmodus, gezondheid en beschikbaarheid van de Obsidian CLI.

Gebruik dit eerst wanneer je niet zeker weet of de vault is geïnitialiseerd, de brugmodus
gezond is, of Obsidian-integratie beschikbaar is.

Wanneer de brugmodus actief is en is geconfigureerd om geheugenartefacten te lezen, voert deze opdracht
queries uit op de draaiende Gateway, zodat deze dezelfde context van de actieve geheugenplugin ziet als
agent-/runtimegeheugen.

### `wiki doctor`

Voer gezondheidscontroles voor de wiki uit en toon configuratie- of vaultproblemen.

Wanneer de brugmodus actief is en is geconfigureerd om geheugenartefacten te lezen, voert deze opdracht
queries uit op de draaiende Gateway voordat het rapport wordt opgebouwd. Uitgeschakelde brugimports
en brugconfiguraties die geen geheugenartefacten lezen, blijven lokaal/offline.

Typische problemen zijn onder meer:

- brugmodus ingeschakeld zonder openbare geheugenartefacten
- ongeldige of ontbrekende vaultindeling
- ontbrekende externe Obsidian CLI wanneer Obsidian-modus wordt verwacht

### `wiki init`

Maak de wiki-vaultindeling en startpagina's aan.

Dit initialiseert de hoofdstructuur, inclusief indexen op het hoogste niveau en cache-
mappen.

### `wiki ingest <path-or-url>`

Importeer content in de bronlaag van de wiki.

Opmerkingen:

- URL-ingest wordt beheerd door `ingest.allowUrlIngest`
- geïmporteerde bronpagina's behouden herkomst in frontmatter
- automatisch compileren kan na ingest worden uitgevoerd wanneer dit is ingeschakeld

### `wiki okf import <path>`

Importeer een uitgepakte Open Knowledge Format-bundel in wikiconceptpagina's.

De importer leest elk niet-gereserveerd `.md`-conceptdocument in de OKF-
mappenstructuur, vereist een niet-leeg `type`-veld, en behandelt onbekende OKF-
`type`-waarden als generieke concepten. Gereserveerde OKF-bestanden `index.md` en `log.md`
worden niet als concepten geïmporteerd.

Geïmporteerde pagina's worden afgevlakt onder `concepts/`, zodat bestaande wiki-flows voor compileren,
zoeken, ophalen, digest en dashboards ze direct zien. De oorspronkelijke OKF-
concept-ID, `type`, `resource`, `tags`, tijdstempel, bronpad en volledige
frontmatter blijven behouden in de frontmatter van de pagina. Interne OKF-markdownlinks
worden herschreven naar de gegenereerde wikipagina's; kapotte of externe links blijven
ongewijzigd.

Voorbeelden:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Bouw indexen, gerelateerde blokken, dashboards en samengestelde digests opnieuw op.

Dit schrijft stabiele machinegerichte artefacten onder:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Als `render.createDashboards` is ingeschakeld, ververst compileren ook rapportpagina's.

### `wiki lint`

Lint de vault en rapporteer:

- structurele problemen
- hiaten in herkomst
- tegenstrijdigheden
- open vragen
- pagina's/claims met lage betrouwbaarheid
- verouderde pagina's/claims

Voer dit uit na betekenisvolle wiki-updates.

### `wiki search <query>`

Doorzoek wikicontent.

Gedrag hangt af van de configuratie:

- `search.backend`: `shared` of `local`
- `search.corpus`: `wiki`, `memory` of `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` of
  `raw-claim`

Gebruik `wiki search` wanneer je wiki-specifieke rangschikking of herkomstdetails wilt.
Voor één brede gedeelde recall-pass geef je de voorkeur aan `openclaw memory search` wanneer de
actieve geheugenplugin gedeeld zoeken aanbiedt.

Zoekmodi helpen de agent het juiste oppervlak te kiezen:

- `find-person`: aliassen, handles, sociale profielen, canonieke ID's en persoonspagina's
- `route-question`: hints voor wie te vragen/waarvoor het best te gebruiken en relatiecontext
- `source-evidence`: bronpagina's en gestructureerde bewijsvelden
- `raw-claim`: gestructureerde claimtekst met claim-/bewijsmetadata

Voorbeelden:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Tekstuitvoer bevat regels `Claim:` en `Evidence:` wanneer een resultaat overeenkomt met een
gestructureerde claim. JSON-uitvoer toont daarnaast `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` en
`evidenceSourceIds` voor drilldown aan agentzijde.

### `wiki get <lookup>`

Lees een wikipagina op ID of relatief pad.

Voorbeelden:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Pas gerichte mutaties toe zonder vrije paginachirurgie.

Ondersteunde flows zijn onder meer:

- een synthesepagina maken/bijwerken
- paginametadata bijwerken
- bron-ID's koppelen
- vragen toevoegen
- tegenstrijdigheden toevoegen
- betrouwbaarheid/status bijwerken
- gestructureerde claims schrijven

Deze opdracht bestaat zodat de wiki veilig kan evolueren zonder beheerde blokken
handmatig te bewerken.

### `wiki bridge import`

Importeer openbare geheugenartefacten vanuit de actieve geheugenplugin in door de brug ondersteunde
bronpagina's.

Gebruik dit in `bridge`-modus wanneer je de nieuwste geëxporteerde geheugenartefacten
in de wiki-vault wilt ophalen.

Voor actieve leesacties van brugartefacten routeert de CLI de import via Gateway-RPC,
zodat de import de runtimecontext van de geheugenplugin gebruikt. Als brugimports zijn
uitgeschakeld of artefactleesacties zijn uitgezet, behoudt de opdracht het lokale/offline
nul-importgedrag.

### `wiki unsafe-local import`

Importeer uit expliciet geconfigureerde lokale paden in `unsafe-local`-modus.

Dit is bewust experimenteel en alleen voor dezelfde machine.

### `wiki obsidian ...`

Obsidian-helperopdrachten voor vaults die in Obsidian-vriendelijke modus draaien.

Subopdrachten:

- `status`
- `search`
- `open`
- `command`
- `daily`

Deze vereisen de officiële `obsidian` CLI op `PATH` wanneer
`obsidian.useOfficialCli` is ingeschakeld.

## Praktische gebruiksrichtlijnen

- Gebruik `wiki search` + `wiki get` wanneer herkomst en pagina-identiteit ertoe doen.
- Gebruik `wiki apply` in plaats van beheerde gegenereerde secties handmatig te bewerken.
- Gebruik `wiki lint` voordat je tegenstrijdige content of content met lage betrouwbaarheid vertrouwt.
- Gebruik `wiki compile` na bulkimports of bronwijzigingen wanneer je direct verse
  dashboards en samengestelde digests wilt.
- Gebruik `wiki okf import` wanneer een datacatalogus, documentatie-export of agent-
  verrijkingspipeline al OKF-markdownbundels uitstoot.
- Gebruik `wiki bridge import` wanneer brugmodus afhankelijk is van nieuw geëxporteerde geheugen-
  artefacten.

## Koppelingen met configuratie

Het gedrag van `openclaw wiki` wordt bepaald door:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Zie [Memory Wiki-plugin](/nl/plugins/memory-wiki) voor het volledige configuratiemodel.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Memory wiki](/nl/plugins/memory-wiki)
