---
read_when:
    - U wilt de memory-wiki-CLI gebruiken
    - U documenteert of wijzigt `openclaw wiki`
summary: CLI-referentie voor `openclaw wiki` (status van memory-wiki-kluis, zoeken, compileren, linten, toepassen, bridge, ChatGPT-import en Obsidian-hulpmiddelen)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T08:44:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecteer en beheer de `memory-wiki`-kluis. Wordt geleverd door de gebundelde Plugin `memory-wiki`.

Gerelateerd: [Memory Wiki-Plugin](/nl/plugins/memory-wiki), [Overzicht van geheugen](/nl/concepts/memory), [CLI: geheugen](/nl/cli/memory)

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
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Agentselectie

Wanneer `plugins.entries.memory-wiki.config.vault.scope` is ingesteld op `agent`, selecteert u de
kluis met de optie `--agent <id>` op het hoogste niveau:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

In een configuratie met meerdere geconfigureerde agents is `--agent` vereist voor CLI-
bewerkingen, zodat een opdracht niet een willekeurige standaardkluis kan lezen of beschrijven. Als
slechts één agent is geconfigureerd, blijft die agent de standaard. Onbekende agent-id's
veroorzaken een fout voordat de kluisbewerking begint. De optie wijzigt het geselecteerde
pad niet wanneer `vault.scope` is ingesteld op `global`.

Gateway-clients volgen dezelfde regel: geef `agentId` door bij kluisgebaseerde `wiki.*`-
verzoeken in een agentgebonden configuratie met meerdere agents. Een ontbrekend of onbekend id is een
fout. Agentbeurten, wiki-tools, aanvullingen op de geheugencorpus en gecompileerde prompt-
samenvattingen bevatten al de actieve runtimecontext van de agent.

## Opdrachten

### `wiki status`

Toon de modus en het bereik van de kluis, de herleide agent, de status en de beschikbaarheid van de Obsidian-CLI. Gebruik dit eerst om te controleren of de beoogde kluis is geïnitialiseerd, de brugmodus correct werkt of Obsidian-integratie beschikbaar is.

Wanneer de brugmodus actief is en is geconfigureerd om geheugenartefacten te lezen, ondervraagt deze opdracht de actieve Gateway, zodat dezelfde actieve context van de geheugen-Plugin wordt gebruikt als voor het geheugen van de agent/runtime.

### `wiki doctor`

Voer statuscontroles voor de wiki uit en rapporteer uitvoerbare oplossingen. Eindigt met een niet-nulcode wanneer de wiki niet in orde is.

Wanneer de brugmodus actief is en is geconfigureerd om geheugenartefacten te lezen, ondervraagt deze opdracht de actieve Gateway voordat het rapport wordt samengesteld. Uitgeschakelde brugimports en brugconfiguraties die geen geheugenartefacten lezen, blijven lokaal/offline.

Veelvoorkomende problemen:

- brugmodus ingeschakeld zonder openbare geheugenartefacten
- ongeldige of ontbrekende kluisindeling
- ontbrekende externe Obsidian-CLI wanneer de Obsidian-modus wordt verwacht

### `wiki init`

Maak de indeling en startpagina's van de wikikluis, inclusief indexen op het hoogste niveau en cachemappen.

### `wiki ingest <path>`

Importeer een lokaal Markdown- of tekstbestand als bronpagina in de map `sources/` van de wiki. `<path>` moet een lokaal bestandspad zijn; importeren vanaf een URL wordt momenteel niet ondersteund. Binaire bestanden worden geweigerd.

Geïmporteerde bronpagina's bevatten frontmatter over de herkomst (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Na het importeren wordt de kluis altijd opnieuw gecompileerd.

Vlaggen: `--title <title>` overschrijft de brontitel (standaard: afgeleid van de bestandsnaam).

### `wiki okf import <path>`

Importeer een uitgepakt Open Knowledge Format-pakket in conceptpagina's van de wiki.

De importfunctie leest elk niet-gereserveerd `.md`-conceptdocument in de OKF-mappenstructuur, vereist een niet-leeg veld `type` en behandelt onbekende OKF-waarden voor `type` als algemene concepten. Gereserveerde OKF-bestanden `index.md` en `log.md` worden niet als concepten geïmporteerd.

Geïmporteerde pagina's worden onder `concepts/` afgevlakt, zodat bestaande processen voor compilatie, zoeken, ophalen, samenvattingen en dashboards van de wiki ze onmiddellijk kunnen verwerken. De oorspronkelijke OKF-concept-id, `type`, `resource`, `tags`, tijdstempel, het bronpad en de volledige frontmatter blijven behouden in de frontmatter van de pagina. Interne OKF-Markdown-koppelingen worden herschreven naar de gegenereerde wikipagina's; defecte of externe koppelingen blijven ongewijzigd. Na het importeren wordt de kluis altijd opnieuw gecompileerd.

Voorbeelden:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Bouw indexen, gerelateerde blokken, dashboards en gecompileerde samenvattingen opnieuw op. Schrijft stabiele, machinegerichte artefacten naar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Als `render.createDashboards` is ingeschakeld, vernieuwt de compilatie ook rapportpagina's.

### `wiki lint`

Controleer de kluis en schrijf een rapport over:

- structurele problemen (defecte koppelingen, ontbrekende/dubbele id's, ontbrekend paginatype of ontbrekende titel, ongeldige frontmatter)
- hiaten in herkomstgegevens (ontbrekende bron-id's, ontbrekende importherkomst)
- tegenstrijdigheden (gemarkeerde tegenstrijdigheden, conflicterende beweringen)
- openstaande vragen
- pagina's en beweringen met lage betrouwbaarheid
- verouderde pagina's en beweringen

Voer dit uit na betekenisvolle wiki-updates.

### `wiki search <query>`

Doorzoek de wiki-inhoud. Het gedrag is afhankelijk van de configuratie:

- `search.backend`: `shared` of `local`
- `search.corpus`: `wiki`, `memory` of `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` of `raw-claim`

Gebruik `wiki search` voor wikispecifieke rangschikking en herkomstgegevens. Geef voor één brede, gedeelde zoekopdracht de voorkeur aan `openclaw memory search` wanneer de actieve geheugen-Plugin gedeeld zoeken beschikbaar stelt.

Zoekmodi:

- `find-person`: aliassen, gebruikersnamen, sociale profielen, canonieke id's en persoonspagina's
- `route-question`: aanwijzingen voor wie te vragen/waarvoor het meest geschikt en relationele context
- `source-evidence`: bronpagina's en gestructureerde bewijsvelden
- `raw-claim`: tekst van gestructureerde beweringen met metadata over bewering/bewijs

Voorbeelden:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Tekstuitvoer bevat regels `Claim:` en `Evidence:` wanneer een resultaat overeenkomt met een gestructureerde bewering. JSON-uitvoer stelt daarnaast `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` en `evidenceSourceIds` beschikbaar voor verdere analyse door de agent.

### `wiki get <lookup>`

Lees een wikipagina op basis van id of relatief pad.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Pas gerichte wijzigingen toe zonder vrijevormbewerking van pagina's:

- `apply synthesis <title>`: maak of vernieuw een synthese-pagina met een beheerde samenvattingstekst
- `apply metadata <lookup>`: werk metadata op een bestaande pagina bij

Beide accepteren `--source-id`, `--contradiction`, `--question` (elk herhaalbaar), `--confidence <n>` (0-1) en `--status <status>`. `apply metadata` accepteert ook `--clear-confidence` om een opgeslagen betrouwbaarheidswaarde te verwijderen. Dit is de ondersteunde manier om wikipagina's verder te ontwikkelen, zodat beheerde, gegenereerde blokken intact blijven.

### `wiki bridge import`

Importeer openbare geheugenartefacten van de actieve geheugen-Plugin in bronpagina's met brugondersteuning. Gebruik dit in de modus `bridge` om de nieuwste geëxporteerde geheugenartefacten in de wikikluis op te nemen.

Voor het lezen van actieve brugartefacten routeert de CLI de import via Gateway-RPC, zodat de context van de runtime-geheugen-Plugin wordt gebruikt. Als brugimports zijn uitgeschakeld of het lezen van artefacten is uitgeschakeld, behoudt de opdracht het lokale/offline gedrag waarbij niets wordt geïmporteerd. Het vernieuwen van de index na het importeren wordt bepaald door `ingest.autoCompile`.

### `wiki unsafe-local import`

Importeer vanuit expliciet geconfigureerde lokale paden (`unsafeLocal.paths`) in de modus `unsafe-local`. Bewust experimenteel en uitsluitend voor gebruik op dezelfde machine. Het vernieuwen van de index na het importeren wordt bepaald door `ingest.autoCompile`.

### `wiki chatgpt import`

Importeer een ChatGPT-export in conceptbronpagina's van de wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Vlag              | Standaard   | Beschrijving                                                        |
| ----------------- | ----------- | ------------------------------------------------------------------- |
| `--export <path>` | (vereist)   | ChatGPT-exportmap of pad naar `conversations.json`.                 |
| `--dry-run`       | `false`     | Bekijk aantallen aangemaakte/bijgewerkte/overgeslagen pagina's zonder pagina's te schrijven. |

Een import die geen droge uitvoering is en pagina's wijzigt, registreert een importuitvoerings-id. Deze wordt in de samenvatting weergegeven en is nodig om de import terug te draaien.

### `wiki chatgpt rollback <run-id>`

Draai een eerder toegepaste ChatGPT-importuitvoering terug, waarbij aangemaakte pagina's worden verwijderd en overschreven pagina's worden hersteld. Doet niets (en rapporteert `alreadyRolledBack`) als de uitvoering al was teruggedraaid.

### `wiki obsidian ...`

Obsidian-hulpopdrachten voor kluizen die in een Obsidian-vriendelijke modus draaien: `status`, `search`, `open`, `command`, `daily`. Hiervoor is de officiële `obsidian`-CLI op `PATH` vereist wanneer `obsidian.useOfficialCli` is ingeschakeld.

Configuratievalidatie weigert `obsidian.useOfficialCli: true` wanneer
`vault.scope` is ingesteld op `agent`, omdat `obsidian.vaultName` één algemene instelling is
en geen toewijzing per agent. Obsidian-vriendelijke Markdown-weergave blijft
beschikbaar.

## Praktische gebruiksrichtlijnen

- Gebruik `wiki search` + `wiki get` wanneer herkomst en pagina-identiteit belangrijk zijn.
- Gebruik `wiki apply` in plaats van beheerde, gegenereerde secties handmatig te bewerken.
- Gebruik `wiki lint` voordat u tegenstrijdige inhoud of inhoud met lage betrouwbaarheid vertrouwt.
- Gebruik `wiki compile` na bulkimports of wijzigingen aan bronnen wanneer u onmiddellijk bijgewerkte dashboards en gecompileerde samenvattingen wilt.
- Gebruik `wiki okf import` wanneer een gegevenscatalogus, documentatie-export of verrijkingspijplijn voor agents al OKF-Markdown-pakketten produceert.
- Gebruik `wiki bridge import` wanneer de brugmodus afhankelijk is van nieuw geëxporteerde geheugenartefacten.

## Gerelateerde configuratie

Het gedrag van `openclaw wiki` wordt bepaald door:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Zie [Memory Wiki-Plugin](/nl/plugins/memory-wiki) voor het volledige configuratiemodel.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Memory Wiki](/nl/plugins/memory-wiki)
