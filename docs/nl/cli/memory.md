---
read_when:
    - Je wilt semantisch geheugen indexeren of doorzoeken
    - Je debugt geheugenbeschikbaarheid of indexering
    - U wilt opgehaalde kortetermijngeheugen promoveren naar `MEMORY.md`
summary: CLI-referentie voor `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Geheugen
x-i18n:
    generated_at: "2026-06-30T14:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Beheer semantische geheugenindexering en zoeken.
Geleverd door de gebundelde `memory-core` plugin. De opdracht is beschikbaar wanneer
`plugins.slots.memory` `memory-core` selecteert (de standaard); andere geheugenplugins
bieden hun eigen CLI-naamruimten.

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
- `--verbose`: geef gedetailleerde logs tijdens controles en indexering.

`memory status`:

- `--deep`: controleer of de lokale vectoropslag gereed is, of de embedding-provider gereed is en of semantisch vectorzoeken gereed is. Gewone `memory status` blijft snel en voert geen live embedding- of providerontdekkingswerk uit; een onbekende vectoropslag- of semantische-vectorstatus betekent dat die in die opdracht niet is gecontroleerd. QMD lexicale `searchMode: "search"` slaat semantische vectorcontroles en embedding-onderhoud over, zelfs met `--deep`.
- `--index`: voer een herindexering uit als de opslag vuil is (impliceert `--deep`).
- `--fix`: herstel verouderde recall-vergrendelingen en normaliseer promotiemetadata.
- `--json`: druk JSON-uitvoer af.

Als `memory status` `Dreaming status: blocked` toont, is de beheerde dreaming-cron ingeschakeld, maar vuurt de Heartbeat die deze aandrijft niet voor de standaardagent. Zie [Dreaming wordt nooit uitgevoerd](/nl/concepts/dreaming#dreaming-never-runs-status-shows-blocked) voor de twee veelvoorkomende oorzaken.

`memory index`:

- `--force`: forceer een volledige herindexering.

`memory search`:

- Query-invoer: geef ofwel positioneel `[query]` of `--query <text>` door.
- Als beide zijn opgegeven, wint `--query`.
- Als geen van beide is opgegeven, sluit de opdracht af met een fout.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--max-results <n>`: beperk het aantal geretourneerde resultaten.
- `--min-score <n>`: filter overeenkomsten met een lage score weg.
- `--json`: druk JSON-resultaten af.

`memory promote`:

Bekijk en pas kortetermijngeheugenpromoties toe.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- schrijf promoties naar `MEMORY.md` (standaard: alleen voorbeeldweergave).
- `--limit <n>` -- beperk het aantal getoonde kandidaten.
- `--include-promoted` -- neem vermeldingen op die in eerdere cycli al zijn gepromoveerd.

Volledige opties:

- Rangschikt kortetermijnkandidaten uit `memory/YYYY-MM-DD.md` met gewogen promotiesignalen (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Gebruikt kortetermijnsignalen uit zowel geheugenrecalls als dagelijkse ingestiepasses, plus versterkingssignalen uit light/REM-fasen.
- Wanneer Dreaming is ingeschakeld, beheert `memory-core` automatisch één cronjob die op de achtergrond een volledige sweep uitvoert (`light -> REM -> deep`) (geen handmatige `openclaw cron add` vereist).
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--limit <n>`: maximaal aantal kandidaten om te retourneren/toe te passen.
- `--min-score <n>`: minimale gewogen promotiescore.
- `--min-recall-count <n>`: minimaal aantal recalls dat voor een kandidaat vereist is.
- `--min-unique-queries <n>`: minimaal aantal verschillende queries dat voor een kandidaat vereist is.
- `--apply`: voeg geselecteerde kandidaten toe aan `MEMORY.md` en markeer ze als gepromoveerd.
- `--include-promoted`: neem al gepromoveerde kandidaten op in de uitvoer.
- `--json`: druk JSON-uitvoer af.

`memory promote-explain`:

Leg een specifieke promotiekandidaat en de score-opbouw ervan uit.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: kandidaatsleutel, padfragment of snippetfragment om op te zoeken.
- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde kandidaten op.
- `--json`: druk JSON-uitvoer af.

`memory rem-harness`:

Bekijk REM-reflecties, kandidaatwaarheden en diepe promotie-uitvoer zonder iets te schrijven.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: beperk tot één agent (standaard: de standaardagent).
- `--include-promoted`: neem al gepromoveerde diepe kandidaten op.
- `--json`: druk JSON-uitvoer af.

## Dreaming

Dreaming is het achtergrondssysteem voor geheugenconsolidatie met drie samenwerkende
fasen: **light** (kortetermijnmateriaal sorteren/stagen), **deep** (duurzame
feiten naar `MEMORY.md` promoveren) en **REM** (reflecteren en thema's naar boven halen).

- Schakel in met `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Schakel vanuit chat om met `/dreaming on|off` (of inspecteer met `/dreaming status`).
  Kanaalaanroepers moeten eigenaar zijn om de instelling te wijzigen; Gateway-clients hebben
  `operator.admin` nodig. Alleen-lezen status en hulp blijven beschikbaar voor geautoriseerde
  opdrachtverzenders.
- Dreaming draait volgens één beheerd sweepschema (`dreaming.frequency`) en voert fasen in deze volgorde uit: light, REM, deep.
- Alleen de deep-fase schrijft duurzaam geheugen naar `MEMORY.md`.
- Menselijk leesbare fase-uitvoer en dagboekvermeldingen worden geschreven naar `DREAMS.md` (of bestaande `dreams.md`), met optionele rapporten per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Rangschikking gebruikt gewogen signalen: recallfrequentie, retrievalrelevantie, querydiversiteit, temporele recentheid, consolidatie over dagen heen en afgeleide conceptrijkdom.
- Promotie leest de live dagelijkse notitie opnieuw voordat naar `MEMORY.md` wordt geschreven, zodat bewerkte of verwijderde kortetermijnsnippets niet worden gepromoveerd vanuit verouderde snapshots van de recall-opslag.
- Geplande en handmatige `memory promote`-runs delen dezelfde standaardinstellingen voor de deep-fase, tenzij je CLI-drempeloverschrijvingen doorgeeft.
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
- Als effectief actieve remote API-sleutelvelden voor geheugen zijn geconfigureerd als SecretRefs, lost de opdracht die waarden op vanuit de actieve Gateway-snapshot. Als Gateway niet beschikbaar is, faalt de opdracht snel.
- Opmerking over Gateway-versieverschil: dit opdrachtpad vereist een Gateway die `secrets.resolve` ondersteunt; oudere gateways retourneren een fout voor een onbekende methode.
- Stem de geplande sweep-cadans af met `dreaming.frequency`. Deep-promotiebeleid is verder intern, behalve `dreaming.phases.deep.maxPromotedSnippetTokens`, dat de lengte van gepromoveerde snippets begrenst terwijl herkomst zichtbaar blijft. Gebruik CLI-vlaggen op `memory promote` wanneer je eenmalige handmatige drempeloverschrijvingen nodig hebt.
- `memory rem-harness --path <file-or-dir> --grounded` toont een voorbeeld van gegronde `What Happened`, `Reflections` en `Possible Lasting Updates` uit historische dagelijkse notities zonder iets te schrijven.
- `memory rem-backfill --path <file-or-dir>` schrijft omkeerbare gegronde dagboekvermeldingen naar `DREAMS.md` voor UI-beoordeling.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` zaait ook gegronde duurzame kandidaten in de live kortetermijnpromotieopslag, zodat de normale deep-fase ze kan rangschikken.
- `memory rem-backfill --rollback` verwijdert eerder geschreven gegronde dagboekvermeldingen, en `memory rem-backfill --rollback-short-term` verwijdert eerder gestagede gegronde kortetermijnkandidaten.
- Zie [Dreaming](/nl/concepts/dreaming) voor volledige fasebeschrijvingen en configuratiereferentie.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geheugenoverzicht](/nl/concepts/memory)
