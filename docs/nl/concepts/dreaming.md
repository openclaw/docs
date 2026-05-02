---
read_when:
    - Je wilt geheugenpromotie automatisch laten uitvoeren
    - Je wilt begrijpen wat elke Dreaming-fase doet
    - Je wilt consolidatie afstemmen zonder MEMORY.md te vervuilen
sidebarTitle: Dreaming
summary: Geheugenconsolidatie op de achtergrond met lichte, diepe en REM-fasen plus een Droomdagboek
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T11:14:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming is het achtergrondproces voor geheugenconsolidatie in `memory-core`. Het helpt OpenClaw sterke kortetermijnsignalen naar duurzaam geheugen te verplaatsen, terwijl het proces uitlegbaar en controleerbaar blijft.

<Note>
Dreaming is **opt-in** en standaard uitgeschakeld.
</Note>

## Wat Dreaming schrijft

Dreaming bewaart twee soorten uitvoer:

- **Machinestatus** in `memory/.dreams/` (recall-store, fasesignalen, ingestiecheckpoints, locks).
- **Menselijk leesbare uitvoer** in `DREAMS.md` (of bestaande `dreams.md`) en optionele faserapportbestanden onder `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langetermijnpromotie schrijft nog steeds alleen naar `MEMORY.md`.

## Fasemodel

Dreaming gebruikt drie samenwerkende fasen:

| Fase  | Doel                                           | Duurzame schrijfactie |
| ----- | ---------------------------------------------- | --------------------- |
| Light | Recent kortetermijnmateriaal sorteren en stagen | Nee                   |
| Deep  | Duurzame kandidaten scoren en promoveren        | Ja (`MEMORY.md`)      |
| REM   | Reflecteren op thema's en terugkerende ideeën   | Nee                   |

Deze fasen zijn interne implementatiedetails, geen afzonderlijke door de gebruiker geconfigureerde "modi."

<AccordionGroup>
  <Accordion title="Light-fase">
    De Light-fase neemt recente dagelijkse geheugensignalen en recall-sporen op, dedupliceert ze en staget kandidaatregels.

    - Leest uit kortetermijn-recallstatus, recente dagelijkse geheugenbestanden en geredigeerde sessietranscripten wanneer beschikbaar.
    - Schrijft een beheerd `## Light Sleep`-blok wanneer opslag inline uitvoer bevat.
    - Registreert versterkingssignalen voor latere Deep-ranking.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep-fase">
    De Deep-fase beslist wat langetermijngeheugen wordt.

    - Rangschikt kandidaten met gewogen scoring en drempelpoorten.
    - Vereist dat `minScore`, `minRecallCount` en `minUniqueQueries` slagen.
    - Hydrateert snippets opnieuw vanuit live dagelijkse bestanden voordat er wordt geschreven, zodat verouderde/verwijderde snippets worden overgeslagen.
    - Voegt gepromoveerde vermeldingen toe aan `MEMORY.md`.
    - Schrijft een `## Deep Sleep`-samenvatting naar `DREAMS.md` en schrijft optioneel `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-fase">
    De REM-fase extraheert patronen en reflectieve signalen.

    - Bouwt thema- en reflectiesamenvattingen uit recente kortetermijnsporen.
    - Schrijft een beheerd `## REM Sleep`-blok wanneer opslag inline uitvoer bevat.
    - Registreert REM-versterkingssignalen die door Deep-ranking worden gebruikt.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestie van sessietranscripten

Dreaming kan geredigeerde sessietranscripten opnemen in de Dreaming-corpus. Wanneer transcripten beschikbaar zijn, worden ze aan de Light-fase gevoerd naast dagelijkse geheugensignalen en recall-sporen. Persoonlijke en gevoelige inhoud wordt vóór ingestie geredigeerd.

## Dream Diary

Dreaming houdt ook een verhalend **Dream Diary** bij in `DREAMS.md`. Nadat elke fase genoeg materiaal heeft, voert `memory-core` naar beste vermogen een achtergrond-subagentbeurt uit en voegt het een korte dagboekvermelding toe. Het gebruikt het standaard runtime-model tenzij `dreaming.model` is geconfigureerd. Als het geconfigureerde model niet beschikbaar is, probeert Dream Diary het één keer opnieuw met het standaardsessiemodel.

<Note>
Dit dagboek is bedoeld om door mensen te worden gelezen in de Dreams-UI, niet als promotiebron. Door Dreaming gegenereerde dagboek-/rapportartefacten worden uitgesloten van kortetermijnpromotie. Alleen onderbouwde geheugensnippets komen in aanmerking voor promotie naar `MEMORY.md`.
</Note>

Er is ook een onderbouwde historische backfill-lane voor review- en herstelwerk:

<AccordionGroup>
  <Accordion title="Backfill-opdrachten">
    - `memory rem-harness --path ... --grounded` toont een preview van onderbouwde dagboekuitvoer uit historische `YYYY-MM-DD.md`-notities.
    - `memory rem-backfill --path ...` schrijft omkeerbare onderbouwde dagboekvermeldingen naar `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` staget onderbouwde duurzame kandidaten in dezelfde kortetermijn-evidence-store die de normale Deep-fase al gebruikt.
    - `memory rem-backfill --rollback` en `--rollback-short-term` verwijderen die gestagede backfill-artefacten zonder gewone dagboekvermeldingen of live kortetermijn-recall aan te raken.

  </Accordion>
</AccordionGroup>

De Control-UI biedt dezelfde backfill-/resetflow voor het dagboek, zodat je resultaten in de Dreams-scène kunt inspecteren voordat je beslist of de onderbouwde kandidaten promotie verdienen. De Scene toont ook een afzonderlijke onderbouwde lane, zodat je kunt zien welke gestagede kortetermijnvermeldingen uit historische replay kwamen, welke gepromoveerde items onderbouwd geleid waren, en alleen onderbouwde gestagede vermeldingen kunt wissen zonder gewone live kortetermijnstatus aan te raken.

## Deep-rankingsignalen

Deep-ranking gebruikt zes gewogen basissignalen plus faseversterking:

| Signaal              | Gewicht | Beschrijving                                           |
| -------------------- | ------- | ------------------------------------------------------ |
| Frequentie           | 0.24    | Hoeveel kortetermijnsignalen de vermelding verzamelde  |
| Relevantie           | 0.30    | Gemiddelde ophaalkwaliteit voor de vermelding          |
| Querydiversiteit     | 0.15    | Afzonderlijke query-/dagcontexten die het lieten zien  |
| Recentheid           | 0.15    | Tijdvervallende versheidsscore                         |
| Consolidatie         | 0.10    | Sterkte van herhaling over meerdere dagen              |
| Conceptuele rijkdom  | 0.06    | Dichtheid van concepttags uit snippet/pad              |

Hits in de Light- en REM-fase voegen een kleine, met recentheid vervallende boost toe vanuit `memory/.dreams/phase-signals.json`.

## Planning

Wanneer ingeschakeld, beheert `memory-core` automatisch één Cron-job voor een volledige Dreaming-sweep. Elke sweep voert fasen in volgorde uit: Light → REM → Deep.

De sweep omvat de primaire runtime-workspace en alle geconfigureerde agent-workspaces, gededupliceerd op pad, zodat fan-out van subagent-workspaces de `DREAMS.md` en geheugenstatus van de hoofdagent niet uitsluit.

Standaard cadence-gedrag:

| Instelling           | Standaard      |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
| `dreaming.model`     | standaardmodel |

## Snel aan de slag

<Tabs>
  <Tab title="Dreaming inschakelen">
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
  </Tab>
  <Tab title="Aangepaste sweep-cadence">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Slash-opdracht

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI-workflow

<Tabs>
  <Tab title="Promotiepreview / toepassen">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Handmatige `memory promote` gebruikt standaard Deep-fasedrempels, tenzij overschreven met CLI-flags.

  </Tab>
  <Tab title="Promotie uitleggen">
    Leg uit waarom een specifieke kandidaat wel of niet zou promoveren:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM-harnesspreview">
    Bekijk een preview van REM-reflecties, kandidaatwaarheden en Deep-promotie-uitvoer zonder iets te schrijven:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Belangrijkste standaardwaarden

Alle instellingen staan onder `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Schakel de Dreaming-sweep in of uit.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-cadence voor de volledige Dreaming-sweep.
</ParamField>
<ParamField path="model" type="string">
  Optionele modeloverride voor de Dream Diary-subagent. Gebruik een canonieke `provider/model`-waarde wanneer je ook een subagent-allowlist `allowedModels` instelt.
</ParamField>

<Warning>
`dreaming.model` vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`. Stel ook `plugins.entries.memory-core.subagent.allowedModels` in om dit te beperken. Vertrouwens- of allowlist-fouten blijven zichtbaar in plaats van stil terug te vallen; de retry dekt alleen fouten waarbij het model niet beschikbaar is.
</Warning>

<Note>
Fasebeleid, drempels en opslaggedrag zijn interne implementatiedetails (geen gebruikersgerichte configuratie). Zie [Referentie voor geheugenconfiguratie](/nl/reference/memory-config#dreaming) voor de volledige lijst met keys.
</Note>

## Dreams-UI

Wanneer ingeschakeld toont het tabblad **Dreams** in de Gateway:

- huidige ingeschakelde Dreaming-status
- fasestatus en aanwezigheid van beheerde sweep
- tellingen voor kortetermijn, onderbouwd, signaal en vandaag gepromoveerd
- timing van de volgende geplande run
- een afzonderlijke onderbouwde Scene-lane voor gestagede historische replay-vermeldingen
- een uitklapbare Dream Diary-lezer, ondersteund door `doctor.memory.dreamDiary`

## Gerelateerd

- [Geheugen](/nl/concepts/memory)
- [Geheugen-CLI](/nl/cli/memory)
- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config)
- [Geheugen zoeken](/nl/concepts/memory-search)
