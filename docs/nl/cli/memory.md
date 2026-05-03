---
read_when:
    - Je wilt semantisch geheugen indexeren of doorzoeken
    - Je debugt geheugenbeschikbaarheid of indexering
    - Je wilt opgehaald kortetermijngeheugen promoveren naar `MEMORY.md`
summary: CLI-referentie voor `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Geheugen
x-i18n:
    generated_at: "2026-05-03T21:28:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Beheer semantische geheugenindexering en zoeken.
Geleverd door de Active Memory-Plugin (standaard: `memory-core`; stel `plugins.slots.memory = "none"` in om uit te schakelen).

Gerelateerd:

- Geheugenconcept: [Geheugen](/nl/concepts/memory)
- Geheugenwiki: [Geheugenwiki](/nl/plugins/memory-wiki)
- Wiki-CLI: [wiki](/nl/cli/wiki)
- Plugins: [Plugins](/nl/tools/plugin)

## Voorbeelden

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opties

`memory status` en `memory index`:

- `--agent <id>`: beperk tot één agent. Zonder deze optie worden deze opdrachten uitgevoerd voor elke geconfigureerde agent; als er geen agentlijst is geconfigureerd, vallen ze terug op de standaardagent.
- `--verbose`: geef gedetailleerde logs weer tijdens probes en indexering.

`memory status`:

- `--deep`: test de gereedheid van de lokale vectorstore, embedding-provider en semantische vectorzoekfunctie. Gewoon `memory status` blijft snel en voert geen live embedding- of providerdetectiewerk uit; een onbekende vectorstore- of semantische-vectorstatus betekent dat die in die opdracht niet is getest. QMD-lexicaal `searchMode: "search"` slaat semantische vectorprobes en embedding-onderhoud over, zelfs met `--deep`.
- `--index`: voer een herindexering uit als de store dirty is (impliceert `--deep`).
- `--fix`: herstel verouderde recall-locks en normaliseer promotiemetadata.
- `--json`: druk JSON-uitvoer af.

Als `memory status` `Dreaming status: blocked` toont, is de beheerde Dreaming-Cron ingeschakeld, maar wordt de Heartbeat die deze aandrijft niet geactiveerd voor de standaardagent. Zie [Dreaming wordt nooit uitgevoerd](/nl/concepts/dreaming#dreaming-never-runs-status-shows-blocked) voor de twee veelvoorkomende oorzaken.

`memory index`:

- `--force`: forceer een volledige herindexering.

`memory search`:

- Query-invoer: geef ofwel positioneel `[query]` door, of `--query <text>`.
- Als beide zijn opgegeven, wint `--query`.
- Als geen van beide is opgegeven, sluit de opdracht af met een fout.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--max-results <n>`: beperk het aantal geretourneerde resultaten.
- `--min-score <n>`: filter matches met een lage score weg.
- `--json`: druk JSON-resultaten af.

`memory promote`:

Bekijk kortetermijngeheugenpromoties vooraf en pas ze toe.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- schrijf promoties naar `MEMORY.md` (standaard: alleen voorbeeldweergave).
- `--limit <n>` -- begrens het aantal getoonde kandidaten.
- `--include-promoted` -- neem items op die in eerdere cycli al zijn gepromoveerd.

Volledige opties:

- Rangschikt kortetermijnkandidaten uit `memory/YYYY-MM-DD.md` met gewogen promotiesignalen (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Gebruikt kortetermijnsignalen uit zowel geheugenrecalls als dagelijkse ingestion-passes, plus versterkingssignalen uit de light/REM-fase.
- Wanneer Dreaming is ingeschakeld, beheert `memory-core` automatisch één Cron-taak die op de achtergrond een volledige sweep uitvoert (`light -> REM -> deep`) (geen handmatige `openclaw cron add` vereist).
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--limit <n>`: maximaal aantal kandidaten om te retourneren/toe te passen.
- `--min-score <n>`: minimale gewogen promotiescore.
- `--min-recall-count <n>`: minimaal vereist aantal recalls voor een kandidaat.
- `--min-unique-queries <n>`: minimaal vereist aantal verschillende queries voor een kandidaat.
- `--apply`: voeg geselecteerde kandidaten toe aan `MEMORY.md` en markeer ze als gepromoveerd.
- `--include-promoted`: neem al gepromoveerde kandidaten op in uitvoer.
- `--json`: druk JSON-uitvoer af.

`memory promote-explain`:

Leg een specifieke promotiekandidaat en de score-uitsplitsing daarvan uit.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: kandidaatsleutel, padfragment of snippetfragment om op te zoeken.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde kandidaten op.
- `--json`: druk JSON-uitvoer af.

`memory rem-harness`:

Bekijk REM-reflecties, kandidaatwaarheden en deep promotie-uitvoer vooraf zonder iets te schrijven.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde deep kandidaten op.
- `--json`: druk JSON-uitvoer af.

## Dreaming

Dreaming is het geheugensysteem voor achtergrondconsolidatie met drie samenwerkende
fasen: **light** (kortetermijnmateriaal sorteren/voorbereiden), **deep** (duurzame
feiten promoten naar `MEMORY.md`) en **REM** (reflecteren en thema's naar voren brengen).

- Schakel in met `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Schakel vanuit chat om met `/dreaming on|off` (of inspecteer met `/dreaming status`).
- Dreaming draait op één beheerd sweep-schema (`dreaming.frequency`) en voert fasen in deze volgorde uit: light, REM, deep.
- Alleen de deep fase schrijft duurzaam geheugen naar `MEMORY.md`.
- Voor mensen leesbare fase-uitvoer en dagboekitems worden geschreven naar `DREAMS.md` (of bestaande `dreams.md`), met optionele rapporten per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Rangschikking gebruikt gewogen signalen: recall-frequentie, ophaalrelevantie, querydiversiteit, temporele recentheid, consolidatie over dagen heen en afgeleide conceptrijkdom.
- Promotie leest de live dagelijkse notitie opnieuw voordat naar `MEMORY.md` wordt geschreven, zodat bewerkte of verwijderde kortetermijnsnippets niet vanuit verouderde recall-store-snapshots worden gepromoveerd.
- Geplande en handmatige `memory promote`-runs delen dezelfde standaardwaarden voor de deep fase, tenzij je CLI-drempeloverschrijvingen doorgeeft.
- Automatische runs waaieren uit over geconfigureerde geheugenwerkruimten.

Standaardplanning:

- **Sweep-cadans**: `dreaming.frequency = 0 3 * * *`
- **Deep drempels**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Voorbeeld:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Notities:

- `memory index --verbose` drukt details per fase af (provider, model, bronnen, batchactiviteit).
- `memory status` bevat eventuele extra paden die via `memorySearch.extraPaths` zijn geconfigureerd.
- Als effectief actieve remote API-sleutelvelden voor geheugen zijn geconfigureerd als SecretRefs, lost de opdracht die waarden op uit de actieve Gateway-snapshot. Als Gateway niet beschikbaar is, faalt de opdracht snel.
- Opmerking over Gateway-versiescheefstand: dit opdrachtpad vereist een Gateway die `secrets.resolve` ondersteunt; oudere Gateways retourneren een fout voor een onbekende methode.
- Stem de geplande sweep-cadans af met `dreaming.frequency`. Het promotiebeleid voor deep is verder intern; gebruik CLI-vlaggen op `memory promote` wanneer je eenmalige handmatige overrides nodig hebt.
- `memory rem-harness --path <file-or-dir> --grounded` toont vooraf gegronde `What Happened`, `Reflections` en `Possible Lasting Updates` uit historische dagelijkse notities zonder iets te schrijven.
- `memory rem-backfill --path <file-or-dir>` schrijft omkeerbare gegronde dagboekitems naar `DREAMS.md` voor UI-beoordeling.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` seedt ook gegronde duurzame kandidaten in de live kortetermijnpromotiestore, zodat de normale deep fase ze kan rangschikken.
- `memory rem-backfill --rollback` verwijdert eerder geschreven gegronde dagboekitems, en `memory rem-backfill --rollback-short-term` verwijdert eerder gestagede gegronde kortetermijnkandidaten.
- Zie [Dreaming](/nl/concepts/dreaming) voor volledige fasebeschrijvingen en configuratiereferentie.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geheugenoverzicht](/nl/concepts/memory)
