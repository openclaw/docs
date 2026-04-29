---
read_when:
    - Je wilt semantisch geheugen indexeren of doorzoeken
    - Je lost problemen met geheugenbeschikbaarheid of indexering op
    - Je wilt opgehaald kortetermijngeheugen promoveren naar `MEMORY.md`
summary: CLI-referentie voor `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Geheugen
x-i18n:
    generated_at: "2026-04-29T22:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Beheer semantische geheugenindexering en zoekopdrachten.
Geleverd door de actieve geheugen-Plugin (standaard: `memory-core`; stel `plugins.slots.memory = "none"` in om uit te schakelen).

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

- `--agent <id>`: beperk tot één agent. Zonder deze optie worden deze opdrachten uitgevoerd voor elke geconfigureerde agent; als er geen agentenlijst is geconfigureerd, vallen ze terug op de standaardagent.
- `--verbose`: geef gedetailleerde logs weer tijdens probes en indexering.

`memory status`:

- `--deep`: controleer beschikbaarheid van vectoren en embeddings. Gewoon `memory status` blijft snel en voert geen live embedding-ping uit. QMD lexicale `searchMode: "search"` slaat semantische vectorprobes en embeddingonderhoud over, zelfs met `--deep`.
- `--index`: voer een herindexering uit als de store vuil is (impliceert `--deep`).
- `--fix`: herstel verouderde recall-locks en normaliseer promotiemetadata.
- `--json`: print JSON-uitvoer.

Als `memory status` `Dreaming status: blocked` toont, is de beheerde Dreaming-cron ingeschakeld, maar vuurt de Heartbeat die deze aanstuurt niet voor de standaardagent. Zie [Dreaming wordt nooit uitgevoerd](/nl/concepts/dreaming#dreaming-never-runs-status-shows-blocked) voor de twee veelvoorkomende oorzaken.

`memory index`:

- `--force`: forceer een volledige herindexering.

`memory search`:

- Query-invoer: geef positioneel `[query]` of `--query <text>` door.
- Als beide worden opgegeven, wint `--query`.
- Als geen van beide wordt opgegeven, eindigt de opdracht met een fout.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--max-results <n>`: beperk het aantal geretourneerde resultaten.
- `--min-score <n>`: filter matches met een lage score weg.
- `--json`: print JSON-resultaten.

`memory promote`:

Bekijk en pas promoties van kortetermijngeheugen toe.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- schrijf promoties naar `MEMORY.md` (standaard: alleen voorbeeldweergave).
- `--limit <n>` -- beperk het aantal getoonde kandidaten.
- `--include-promoted` -- neem items op die al in eerdere cycli zijn gepromoveerd.

Volledige opties:

- Rangschikt kortetermijnkandidaten uit `memory/YYYY-MM-DD.md` met gewogen promotiesignalen (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Gebruikt kortetermijnsignalen uit zowel geheugenrecalls als dagelijkse ingestiepassen, plus versterkingssignalen uit de lichte/REM-fase.
- Wanneer Dreaming is ingeschakeld, beheert `memory-core` automatisch één cron-taak die op de achtergrond een volledige sweep uitvoert (`light -> REM -> deep`) (geen handmatige `openclaw cron add` vereist).
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--limit <n>`: maximaal aantal kandidaten om te retourneren/toe te passen.
- `--min-score <n>`: minimale gewogen promotiescore.
- `--min-recall-count <n>`: minimale recalltelling vereist voor een kandidaat.
- `--min-unique-queries <n>`: minimaal aantal verschillende query's vereist voor een kandidaat.
- `--apply`: voeg geselecteerde kandidaten toe aan `MEMORY.md` en markeer ze als gepromoveerd.
- `--include-promoted`: neem al gepromoveerde kandidaten op in de uitvoer.
- `--json`: print JSON-uitvoer.

`memory promote-explain`:

Leg een specifieke promotiekandidaat en de scoreopbouw ervan uit.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: kandidaatsleutel, padfragment of snippetfragment om op te zoeken.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde kandidaten op.
- `--json`: print JSON-uitvoer.

`memory rem-harness`:

Bekijk REM-reflecties, kandidaatwaarheden en diepe promotie-uitvoer zonder iets te schrijven.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde diepe kandidaten op.
- `--json`: print JSON-uitvoer.

## Dreaming

Dreaming is het achtergrondgeheugenconsolidatiesysteem met drie samenwerkende
fasen: **light** (kortetermijnmateriaal sorteren/stagen), **deep** (duurzame
feiten naar `MEMORY.md` promoveren) en **REM** (reflecteren en thema's naar voren halen).

- Schakel in met `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Schakel vanuit chat met `/dreaming on|off` (of inspecteer met `/dreaming status`).
- Dreaming draait op één beheerd sweep-schema (`dreaming.frequency`) en voert fasen op volgorde uit: light, REM, deep.
- Alleen de deep-fase schrijft duurzaam geheugen naar `MEMORY.md`.
- Menselijk leesbare fase-uitvoer en dagboekvermeldingen worden geschreven naar `DREAMS.md` (of bestaande `dreams.md`), met optionele rapporten per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Rangschikking gebruikt gewogen signalen: recallfrequentie, ophaalrelevantie, querydiversiteit, temporele recentheid, consolidatie over dagen heen en afgeleide conceptuele rijkheid.
- Promotie leest de live dagelijkse notitie opnieuw voordat naar `MEMORY.md` wordt geschreven, zodat bewerkte of verwijderde kortetermijnsnippets niet worden gepromoveerd vanuit verouderde snapshots van de recall-store.
- Geplande en handmatige `memory promote`-runs delen dezelfde standaardwaarden voor de deep-fase, tenzij je CLI-drempeloverschrijvingen doorgeeft.
- Automatische runs waaieren uit over geconfigureerde geheugenwerkruimten.

Standaardplanning:

- **Sweep-cadans**: `dreaming.frequency = 0 3 * * *`
- **Deep-drempels**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` print details per fase (provider, model, bronnen, batchactiviteit).
- `memory status` bevat eventuele extra paden die via `memorySearch.extraPaths` zijn geconfigureerd.
- Als effectief actieve geheugenvelden voor externe API-sleutels als SecretRefs zijn geconfigureerd, lost de opdracht die waarden op uit de actieve Gateway-snapshot. Als de Gateway niet beschikbaar is, faalt de opdracht snel.
- Opmerking over Gateway-versiescheefstand: dit opdrachtpad vereist een Gateway die `secrets.resolve` ondersteunt; oudere gateways retourneren een onbekende-methodefout.
- Stem de geplande sweep-cadans af met `dreaming.frequency`. Deep-promotiebeleid is verder intern; gebruik CLI-vlaggen op `memory promote` wanneer je eenmalige handmatige overschrijvingen nodig hebt.
- `memory rem-harness --path <file-or-dir> --grounded` toont een voorbeeld van gegronde `What Happened`, `Reflections` en `Possible Lasting Updates` uit historische dagelijkse notities zonder iets te schrijven.
- `memory rem-backfill --path <file-or-dir>` schrijft omkeerbare gegronde dagboekvermeldingen naar `DREAMS.md` voor UI-beoordeling.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` seedt ook gegronde duurzame kandidaten in de live promotie-store voor kortetermijngeheugen, zodat de normale deep-fase ze kan rangschikken.
- `memory rem-backfill --rollback` verwijdert eerder geschreven gegronde dagboekvermeldingen, en `memory rem-backfill --rollback-short-term` verwijdert eerder gestagede gegronde kortetermijnkandidaten.
- Zie [Dreaming](/nl/concepts/dreaming) voor volledige fasebeschrijvingen en configuratiereferentie.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geheugenoverzicht](/nl/concepts/memory)
