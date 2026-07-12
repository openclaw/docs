---
read_when:
    - U wilt semantisch geheugen indexeren of doorzoeken
    - Je onderzoekt problemen met de beschikbaarheid of indexering van het geheugen
    - U wilt teruggehaald kortetermijngeheugen promoveren naar `MEMORY.md`
summary: CLI-referentie voor `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Geheugen
x-i18n:
    generated_at: "2026-07-12T08:42:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Beheer de indexering en doorzoeking van semantisch geheugen en de promotie naar `MEMORY.md`.
Deze functionaliteit wordt geleverd door de gebundelde Plugin `memory-core` en is beschikbaar wanneer
`plugins.slots.memory` `memory-core` selecteert (de standaardinstelling). Andere geheugenplugins
bieden hun eigen CLI-naamruimten.

Gerelateerd: het concept [Geheugen](/nl/concepts/memory), [Dreaming](/nl/concepts/dreaming),
[Configuratiereferentie voor geheugen](/nl/reference/memory-config), [Geheugenwiki](/nl/plugins/memory-wiki),
[wiki](/nl/cli/wiki), [Plugins](/nl/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Zonder `--agent` wordt de opdracht uitgevoerd voor elke agent in `agents.list`; als er geen agentlijst is
geconfigureerd, wordt teruggevallen op de standaardagent.

| Vlag        | Effect                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Controleer of de vectoropslag, embeddingprovider en semantische zoekfunctie gereed zijn (dit brengt extra provideraanroepen met zich mee). Een gewone `memory status` blijft snel en slaat dit over; een onbekende vector-/semantische status betekent dat deze niet is gecontroleerd. De lexicale QMD-zoekmodus `searchMode: "search"` slaat semantische vectorcontroles altijd over, zelfs met `--deep`. |
| `--index`   | Indexeer opnieuw als de opslag wijzigingen bevat. Impliceert `--deep`.                                                                                                                                                                                                                                     |
| `--fix`     | Herstel verouderde opzoekvergrendelingen en normaliseer promotiemetagegevens.                                                                                                                                                                                                                              |
| `--json`    | Geef JSON weer.                                                                                                                                                                                                                                                                                            |
| `--verbose` | Geef gedetailleerde logboeken per fase weer.                                                                                                                                                                                                                                                              |

Als de regel `Dreaming` zelfs met `dreaming.enabled: true` op `off` blijft staan, of
geplande verwerkingsrondes nooit lijken te worden uitgevoerd, is de beheerde Cron voor Dreaming afhankelijk van
het afgaan van de Heartbeat van de standaardagent om afstemming te activeren. Zie
[Dreaming](/nl/concepts/dreaming) voor planningsdetails.

De status vermeldt ook eventuele extra zoekpaden uit `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Dezelfde afbakening per agent als bij `status`. Met `--force` wordt een volledige herindexering uitgevoerd in plaats van
een incrementele. `--verbose` geeft per agent de provider, het model, de bronnen en
details over extra paden weer voordat de voortgang van de indexering wordt getoond.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Zoekopdracht: positionele `[query]` of `--query <text>`. Als beide zijn ingesteld, heeft `--query`
  voorrang. Als geen van beide is ingesteld, retourneert de opdracht een fout.
- `--agent <id>`: gebruikt standaard de standaardagent (niet de volledige agentlijst).
- `--max-results <n>`: beperk het aantal resultaten (positief geheel getal).
- `--min-score <n>`: filter overeenkomsten onder deze score uit.

## `memory promote`

Rangschik kortetermijnkandidaten uit `memory/YYYY-MM-DD.md` en voeg de
hoogst scorende vermeldingen optioneel toe aan `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Vlag                       | Standaard           | Effect                                                                 |
| -------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `--limit <n>`              |                     | Maximumaantal kandidaten om te retourneren/toe te passen.              |
| `--min-score <n>`          | `0.75`              | Minimale gewogen promotiescore.                                        |
| `--min-recall-count <n>`   | `3`                 | Minimaal vereist aantal opvragingen.                                   |
| `--min-unique-queries <n>` | `2`                 | Minimaal vereist aantal verschillende zoekopdrachten.                  |
| `--apply`                  | alleen voorvertoning | Voeg geselecteerde kandidaten toe aan `MEMORY.md` en markeer ze als gepromoveerd. |
| `--include-promoted`       |                     | Neem kandidaten op die al in eerdere cycli zijn gepromoveerd.          |
| `--json`                   |                     | Geef JSON weer.                                                        |

Deze CLI-standaardwaarden verschillen van de drempelwaarden voor de diepe fase van de geplande
Dreaming-verwerkingsronde (zie [Dreaming](#dreaming) hieronder); geef expliciete vlaggen door om
het gedrag van de verwerkingsronde te evenaren voor een eenmalige handmatige uitvoering.

Rangschikkingssignalen: opvraagfrequentie, relevantie bij het ophalen, diversiteit van zoekopdrachten,
temporele recentheid, consolidatie over meerdere dagen en rijkdom van afgeleide concepten, verkregen
uit zowel geheugenopvragingen als dagelijkse verwerkingsrondes, plus een lichte versterkingsbonus
uit de lichte/REM-fase bij herhaalde bezoeken tijdens Dreaming. Vóór het schrijven leest het
promotieproces de actuele dagelijkse notitie opnieuw, zodat bewerkingen of verwijderingen van
kortetermijnfragmenten sinds de rangschikking worden gerespecteerd in plaats van promotie
op basis van een verouderde momentopname.

## `memory promote-explain`

Leg de opbouw van de score van één promotiekandidaat uit.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` komt overeen met de sleutel (exact of als deeltekenreeks), het pad of de
fragmenttekst van een kandidaat.

## `memory rem-harness`

Bekijk een voorvertoning van REM-reflecties, kandidaatwaarheden en promotie-uitvoer uit de diepe fase
zonder iets te schrijven.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: voorzie de testomgeving van historische dagelijkse
  `YYYY-MM-DD.md`-bestanden in plaats van de actieve werkruimte.
- `--grounded`: geef ook een op historische notities gebaseerde voorvertoning weer van `Wat is er gebeurd` / `Reflecties` /
  `Mogelijke blijvende updates`.

## `memory rem-backfill`

Schrijf op historische gegevens gebaseerde REM-samenvattingen naar `DREAMS.md` voor beoordeling in de gebruikersinterface.
Omkeerbaar.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: vereist tenzij `--rollback`/`--rollback-short-term`
  is ingesteld. Historische dagelijkse geheugenbestanden of map waaruit gegevens moeten worden aangevuld.
- `--stage-short-term`: plaats ook op historische gegevens gebaseerde duurzame kandidaten in de actieve
  kortetermijnopslag voor promotie, zodat de normale diepe fase ze kan rangschikken.
- `--rollback`: verwijder eerder geschreven, op historische gegevens gebaseerde dagboekvermeldingen uit
  `DREAMS.md`.
- `--rollback-short-term`: verwijder eerder klaargezette, op historische gegevens gebaseerde
  kortetermijnkandidaten.

## Dreaming

Dreaming is het achtergrondsysteem voor geheugenconsolidatie met drie samenwerkende
fasen, die op volgorde volgens één planning worden uitgevoerd: **licht** (kortetermijnmateriaal sorteren/klaarzetten),
**REM** (reflecteren en thema's zichtbaar maken), **diep** (duurzame
feiten promoveren naar `MEMORY.md`). Alleen de diepe fase schrijft naar `MEMORY.md`.

- Schakel dit in met `plugins.entries.memory-core.config.dreaming.enabled: true`
  (standaard `false`); `memory-core` beheert de Cron-taak voor de verwerkingsronde automatisch, waardoor handmatig
  `openclaw cron add` uitvoeren niet nodig is.
- Schakel dit vanuit de chat in of uit met `/dreaming on|off`; controleer het met `/dreaming status`
  (of `/dreaming`/`/dreaming help`). `on`/`off` vereist de status van kanaaleigenaar
  of `operator.admin` voor de Gateway; `status` en help blijven beschikbaar voor iedereen die
  de opdracht kan aanroepen.
- Leesbare fase-uitvoer wordt naar `DREAMS.md` geschreven (of naar een bestaand `dreams.md`).
  Standaard (`dreaming.storage.mode: "separate"`) schrijft elke fase ook een
  afzonderlijk rapport naar `memory/dreaming/<phase>/YYYY-MM-DD.md`; stel `mode:
"inline"` in om rapporten in plaats daarvan in het dagelijkse geheugenbestand op te nemen, of `"both"`
  voor beide.
- Geplande uitvoeringen en handmatige uitvoeringen van `memory promote` gebruiken dezelfde
  rangschikkingssignalen voor de diepe fase; alleen de standaarddrempelwaarden verschillen (zie de tabel hierboven tegenover
  de geplande standaardwaarden hieronder).
- Geplande uitvoeringen worden verspreid over de geheugenwerkruimten van alle geconfigureerde agenten.

Geplande standaardwaarden (`plugins.entries.memory-core.config.dreaming`):

| Sleutel                                 | Standaard   |
| --------------------------------------- | ----------- |
| `frequency`                             | `0 3 * * *` |
| `phases.deep.minScore`                  | `0.8`       |
| `phases.deep.minRecallCount`            | `3`         |
| `phases.deep.minUniqueQueries`          | `3`         |
| `phases.deep.recencyHalfLifeDays`       | `14`        |
| `phases.deep.maxAgeDays`                | `30`        |
| `phases.deep.maxPromotedSnippetTokens`  | `160`       |

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

Volledige lijst met sleutels en details per fase: [Dreaming](/nl/concepts/dreaming),
[Configuratiereferentie voor geheugen](/nl/reference/memory-config#dreaming).

## Gateway-afhankelijkheid voor SecretRef

Als externe API-sleutelvelden voor Active Memory zijn geconfigureerd als SecretRefs, lossen `memory`-
opdrachten deze op vanuit de actieve momentopname van de Gateway; als de Gateway
niet beschikbaar is, mislukt de opdracht onmiddellijk. Hiervoor is een Gateway vereist die de
methode `secrets.resolve` ondersteunt; oudere Gateways retourneren een fout voor een onbekende methode.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Overzicht van geheugen](/nl/concepts/memory)
