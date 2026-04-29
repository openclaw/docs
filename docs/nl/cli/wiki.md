---
read_when:
    - Je wilt de memory-wiki CLI gebruiken
    - Je documenteert of wijzigt `openclaw wiki`
summary: CLI-referentie voor `openclaw wiki` (memory-wiki-kluisstatus, zoeken, compileren, linten, toepassen, bridge en Obsidian-helpers)
title: Wiki
x-i18n:
    generated_at: "2026-04-29T22:36:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecteer en onderhoud de `memory-wiki`-kluis.

Geleverd door de gebundelde `memory-wiki`-Plugin.

Gerelateerd:

- [Geheugenwiki-Plugin](/nl/plugins/memory-wiki)
- [Geheugenoverzicht](/nl/concepts/memory)
- [CLI: geheugen](/nl/cli/memory)

## Waarvoor het is

Gebruik `openclaw wiki` wanneer je een gecompileerde kenniskluis wilt met:

- wiki-eigen zoeken en pagina's lezen
- syntheses met rijke herkomstinformatie
- rapporten over tegenstrijdigheden en actualiteit
- brugimports vanuit de actieve geheugen-Plugin
- optionele Obsidian CLI-helpers

## Veelgebruikte opdrachten

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

Inspecteer de huidige kluismodus, gezondheid en beschikbaarheid van de Obsidian CLI.

Gebruik dit eerst wanneer je niet zeker weet of de kluis is geïnitialiseerd, de brugmodus gezond is, of Obsidian-integratie beschikbaar is.

Wanneer de brugmodus actief is en is geconfigureerd om geheugenartefacten te lezen, bevraagt deze opdracht de actieve Gateway zodat deze dezelfde actieve geheugen-Plugin-context ziet als agent/runtime-geheugen.

### `wiki doctor`

Voer wiki-gezondheidscontroles uit en toon configuratie- of kluisproblemen.

Wanneer de brugmodus actief is en is geconfigureerd om geheugenartefacten te lezen, bevraagt deze opdracht de actieve Gateway voordat het rapport wordt opgebouwd. Uitgeschakelde brugimports en brugconfiguraties die geen geheugenartefacten lezen, blijven lokaal/offline.

Typische problemen zijn onder meer:

- brugmodus ingeschakeld zonder openbare geheugenartefacten
- ongeldige of ontbrekende kluisindeling
- ontbrekende externe Obsidian CLI wanneer Obsidian-modus wordt verwacht

### `wiki init`

Maak de wiki-kluisindeling en startpagina's aan.

Dit initialiseert de rootstructuur, inclusief topniveau-indexen en cachedirectory's.

### `wiki ingest <path-or-url>`

Importeer inhoud in de bronlaag van de wiki.

Opmerkingen:

- URL-import wordt beheerd door `ingest.allowUrlIngest`
- geïmporteerde bronpagina's bewaren herkomstinformatie in frontmatter
- automatisch compileren kan na import worden uitgevoerd wanneer dit is ingeschakeld

### `wiki compile`

Bouw indexen, gerelateerde blokken, dashboards en gecompileerde samenvattingen opnieuw op.

Dit schrijft stabiele machinegerichte artefacten onder:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Als `render.createDashboards` is ingeschakeld, vernieuwt compile ook rapportpagina's.

### `wiki lint`

Lint de kluis en rapporteer:

- structurele problemen
- hiaten in herkomstinformatie
- tegenstrijdigheden
- open vragen
- pagina's/claims met lage betrouwbaarheid
- verouderde pagina's/claims

Voer dit uit na betekenisvolle wiki-updates.

### `wiki search <query>`

Doorzoek wiki-inhoud.

Gedrag hangt af van de configuratie:

- `search.backend`: `shared` of `local`
- `search.corpus`: `wiki`, `memory` of `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` of
  `raw-claim`

Gebruik `wiki search` wanneer je wiki-specifieke rangschikking of herkomstdetails wilt. Voor één brede gedeelde herinneringspassage heeft `openclaw memory search` de voorkeur wanneer de actieve geheugen-Plugin gedeeld zoeken beschikbaar maakt.

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

Tekstuitvoer bevat `Claim:`- en `Evidence:`-regels wanneer een resultaat overeenkomt met een gestructureerde claim. JSON-uitvoer geeft daarnaast `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` en `evidenceSourceIds` vrij voor drilldown aan agentzijde.

### `wiki get <lookup>`

Lees een wikipagina op id of relatief pad.

Voorbeelden:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Pas beperkte mutaties toe zonder vrije paginabewerking.

Ondersteunde flows zijn onder meer:

- een synthesepagina maken/bijwerken
- paginametadata bijwerken
- bron-id's koppelen
- vragen toevoegen
- tegenstrijdigheden toevoegen
- betrouwbaarheid/status bijwerken
- gestructureerde claims schrijven

Deze opdracht bestaat zodat de wiki veilig kan evolueren zonder beheerde blokken handmatig te bewerken.

### `wiki bridge import`

Importeer openbare geheugenartefacten vanuit de actieve geheugen-Plugin naar door de brug ondersteunde bronpagina's.

Gebruik dit in `bridge`-modus wanneer je de nieuwste geëxporteerde geheugenartefacten in de wiki-kluis wilt binnenhalen.

Voor actieve lezing van brugartefacten routeert de CLI de import via Gateway RPC, zodat de import de runtime-geheugen-Plugin-context gebruikt. Als brugimports zijn uitgeschakeld of artefactlezingen zijn uitgezet, behoudt de opdracht het lokale/offline nul-importgedrag.

### `wiki unsafe-local import`

Importeer vanuit expliciet geconfigureerde lokale paden in `unsafe-local`-modus.

Dit is bewust experimenteel en alleen voor dezelfde machine.

### `wiki obsidian ...`

Obsidian-helperopdrachten voor kluizen die in Obsidian-vriendelijke modus draaien.

Subopdrachten:

- `status`
- `search`
- `open`
- `command`
- `daily`

Deze vereisen de officiële `obsidian` CLI op `PATH` wanneer `obsidian.useOfficialCli` is ingeschakeld.

## Praktische gebruiksrichtlijnen

- Gebruik `wiki search` + `wiki get` wanneer herkomstinformatie en pagina-identiteit belangrijk zijn.
- Gebruik `wiki apply` in plaats van beheerde gegenereerde secties met de hand te bewerken.
- Gebruik `wiki lint` voordat je tegenstrijdige inhoud of inhoud met lage betrouwbaarheid vertrouwt.
- Gebruik `wiki compile` na bulkimports of bronwijzigingen wanneer je direct frisse dashboards en gecompileerde samenvattingen wilt.
- Gebruik `wiki bridge import` wanneer de brugmodus afhangt van nieuw geëxporteerde geheugenartefacten.

## Configuratiekoppelingen

Het gedrag van `openclaw wiki` wordt bepaald door:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Zie [Geheugenwiki-Plugin](/nl/plugins/memory-wiki) voor het volledige configuratiemodel.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geheugenwiki](/nl/plugins/memory-wiki)
