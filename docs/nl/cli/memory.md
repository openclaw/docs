---
read_when:
    - Je wilt semantisch geheugen indexeren of doorzoeken
    - Je debugt geheugenbeschikbaarheid of indexering
    - Je wilt opgehaald kortetermijngeheugen promoveren naar `MEMORY.md`
summary: CLI-referentie voor `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Geheugen
x-i18n:
    generated_at: "2026-06-27T17:20:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Beheer semantische geheugenindexering en zoeken.
Geleverd door de gebundelde `memory-core` Plugin. De opdracht is beschikbaar wanneer
`plugins.slots.memory` `memory-core` selecteert (de standaard); andere geheugen-Plugins
stellen hun eigen CLI-naamruimten beschikbaar.

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

- `--deep`: controleer gereedheid van de lokale vector-store, gereedheid van de embedding-provider en gereedheid van semantische vectorzoekacties. Gewone `memory status` blijft snel en voert geen live embedding- of provider discovery-werk uit; onbekende vector-store- of semantische-vectorstatus betekent dat die niet in die opdracht is geprobed. QMD lexical `searchMode: "search"` slaat semantische vectorprobes en embeddingonderhoud over, zelfs met `--deep`.
- `--index`: voer een herindexering uit als de store dirty is (impliceert `--deep`).
- `--fix`: herstel verouderde recall-locks en normaliseer promotiemetadata.
- `--json`: druk JSON-uitvoer af.

Als `memory status` `Dreaming status: blocked` toont, is de beheerde Dreaming-Cron ingeschakeld maar vuurt de Heartbeat die deze aandrijft niet voor de standaardagent. Zie [Dreaming wordt nooit uitgevoerd](/nl/concepts/dreaming#dreaming-never-runs-status-shows-blocked) voor de twee veelvoorkomende oorzaken.

`memory index`:

- `--force`: forceer een volledige herindexering.

`memory search`:

- Query-invoer: geef ofwel positionele `[query]` of `--query <text>` door.
- Als beide zijn opgegeven, wint `--query`.
- Als geen van beide is opgegeven, sluit de opdracht af met een fout.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--max-results <n>`: beperk het aantal geretourneerde resultaten.
- `--min-score <n>`: filter matches met een lage score weg.
- `--json`: druk JSON-resultaten af.

`memory promote`:

Bekijk en pas kortetermijngeheugenpromoties toe.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- schrijf promoties naar `MEMORY.md` (standaard: alleen voorbeeldweergave).
- `--limit <n>` -- beperk het aantal getoonde kandidaten.
- `--include-promoted` -- neem items op die al in eerdere cycli zijn gepromoveerd.

Volledige opties:

- Rangschikt kortetermijnkandidaten uit `memory/YYYY-MM-DD.md` met gewogen promotiesignalen (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Gebruikt kortetermijnsignalen van zowel geheugenrecalls als dagelijkse ingestion-passes, plus versterkingssignalen uit light/REM-fasen.
- Wanneer Dreaming is ingeschakeld, beheert `memory-core` automatisch één Cron-taak die op de achtergrond een volledige sweep uitvoert (`light -> REM -> deep`) (geen handmatige `openclaw cron add` vereist).
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--limit <n>`: maximaal aantal kandidaten om terug te geven/toe te passen.
- `--min-score <n>`: minimale gewogen promotiescore.
- `--min-recall-count <n>`: minimale recall-telling die vereist is voor een kandidaat.
- `--min-unique-queries <n>`: minimaal aantal verschillende query's dat vereist is voor een kandidaat.
- `--apply`: voeg geselecteerde kandidaten toe aan `MEMORY.md` en markeer ze als gepromoveerd.
- `--include-promoted`: neem al gepromoveerde kandidaten op in de uitvoer.
- `--json`: druk JSON-uitvoer af.

`memory promote-explain`:

Leg een specifieke promotiekandidaat en de score-uitsplitsing ervan uit.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: kandidaatsleutel, padfragment of snippetfragment om op te zoeken.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde kandidaten op.
- `--json`: druk JSON-uitvoer af.

`memory rem-harness`:

Bekijk REM-reflecties, kandidaatswaarheden en uitvoer voor deep-promotie zonder iets te schrijven.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde deep-kandidaten op.
- `--json`: druk JSON-uitvoer af.

## Dreaming

Dreaming is het achtergrondgeheugenconsolidatiesysteem met drie samenwerkende
fasen: **light** (kortetermijnmateriaal sorteren/faseren), **deep** (duurzame
feiten promoten naar `MEMORY.md`) en **REM** (reflecteren en thema's naar voren brengen).

- Schakel in met `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Schakel vanuit chat om met `/dreaming on|off` (of inspecteer met `/dreaming status`).
- Dreaming draait volgens één beheerd sweepschema (`dreaming.frequency`) en voert fasen op volgorde uit: light, REM, deep.
- Alleen de deep-fase schrijft duurzaam geheugen naar `MEMORY.md`.
- Voor mensen leesbare fase-uitvoer en dagboekitems worden geschreven naar `DREAMS.md` (of bestaande `dreams.md`), met optionele rapporten per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Rangschikking gebruikt gewogen signalen: recallfrequentie, retrievalrelevantie, querydiversiteit, temporele recentheid, consolidatie over meerdere dagen en afgeleide conceptrijkheid.
- Promotie leest de live dagelijkse notitie opnieuw voordat naar `MEMORY.md` wordt geschreven, zodat bewerkte of verwijderde kortetermijnsnippets niet worden gepromoveerd vanuit verouderde recall-store-snapshots.
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

Opmerkingen:

- `memory index --verbose` drukt details per fase af (provider, model, bronnen, batchactiviteit).
- `memory status` bevat alle extra paden die via `memorySearch.extraPaths` zijn geconfigureerd.
- Als effectief actieve externe API-sleutelvelden voor geheugen zijn geconfigureerd als SecretRefs, lost de opdracht die waarden op uit de actieve Gateway-snapshot. Als Gateway niet beschikbaar is, faalt de opdracht snel.
- Opmerking over Gateway-versiescheefstand: dit opdrachtpad vereist een gateway die `secrets.resolve` ondersteunt; oudere gateways geven een unknown-method-fout terug.
- Stem de geplande sweep-cadans af met `dreaming.frequency`. Het deep-promotiebeleid is verder intern, behalve `dreaming.phases.deep.maxPromotedSnippetTokens`, dat de lengte van gepromoveerde snippets begrenst terwijl herkomst zichtbaar blijft. Gebruik CLI-vlaggen op `memory promote` wanneer je eenmalige handmatige drempeloverschrijvingen nodig hebt.
- `memory rem-harness --path <file-or-dir> --grounded` toont gegronde `What Happened`, `Reflections` en `Possible Lasting Updates` uit historische dagelijkse notities zonder iets te schrijven.
- `memory rem-backfill --path <file-or-dir>` schrijft omkeerbare gegronde dagboekitems naar `DREAMS.md` voor UI-beoordeling.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` zaait ook gegronde duurzame kandidaten in de live kortetermijnpromotiestore, zodat de normale deep-fase ze kan rangschikken.
- `memory rem-backfill --rollback` verwijdert eerder geschreven gegronde dagboekitems, en `memory rem-backfill --rollback-short-term` verwijdert eerder gefaseerde gegronde kortetermijnkandidaten.
- Zie [Dreaming](/nl/concepts/dreaming) voor volledige fasebeschrijvingen en configuratiereferentie.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geheugenoverzicht](/nl/concepts/memory)
