---
read_when:
    - Je wilt dat geheugenpromotie automatisch wordt uitgevoerd
    - Je wilt begrijpen wat elke Dreaming-fase doet
    - Je wilt consolidatie afstemmen zonder MEMORY.md te vervuilen
sidebarTitle: Dreaming
summary: Geheugenconsolidatie op de achtergrond met lichte, diepe en REM-fasen plus een Droomdagboek
title: Dreaming
x-i18n:
    generated_at: "2026-04-29T22:37:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming is het systeem voor geheugenconsolidatie op de achtergrond in `memory-core`. Het helpt OpenClaw sterke kortetermijnsignalen naar duurzaam geheugen te verplaatsen, terwijl het proces uitlegbaar en controleerbaar blijft.

<Note>
Dreaming is **opt-in** en standaard uitgeschakeld.
</Note>

## Wat Dreaming schrijft

Dreaming houdt twee soorten uitvoer bij:

- **Machinestatus** in `memory/.dreams/` (recall-store, fasesignalen, ingestiecheckpoints, locks).
- **Menselijk leesbare uitvoer** in `DREAMS.md` (of bestaande `dreams.md`) en optionele faserapportbestanden onder `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langetermijnpromotie schrijft nog steeds alleen naar `MEMORY.md`.

## Fasemodel

Dreaming gebruikt drie samenwerkende fasen:

| Fase  | Doel                                           | Duurzame schrijfactie |
| ----- | ---------------------------------------------- | --------------------- |
| Light | Recent kortetermijnmateriaal sorteren en klaarzetten | Nee                   |
| Deep  | Duurzame kandidaten scoren en promoveren       | Ja (`MEMORY.md`)      |
| REM   | Reflecteren op thema's en terugkerende ideeën  | Nee                   |

Deze fasen zijn interne implementatiedetails, geen afzonderlijke door de gebruiker geconfigureerde "modi."

<AccordionGroup>
  <Accordion title="Light-fase">
    De Light-fase neemt recente dagelijkse geheugensignalen en recall-sporen op, ontdubbelt ze en zet kandidaatregels klaar.

    - Leest uit kortetermijn-recallstatus, recente dagelijkse geheugenbestanden en geredigeerde sessietranscripten wanneer beschikbaar.
    - Schrijft een beheerd `## Light Sleep`-blok wanneer opslag inline uitvoer bevat.
    - Registreert versterkingssignalen voor latere Deep-rangschikking.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep-fase">
    De Deep-fase bepaalt wat langetermijngeheugen wordt.

    - Rangschikt kandidaten met gewogen scoring en drempelpoorten.
    - Vereist dat `minScore`, `minRecallCount` en `minUniqueQueries` slagen.
    - Herlaadt fragmenten uit live dagelijkse bestanden voordat er wordt geschreven, zodat verouderde/verwijderde fragmenten worden overgeslagen.
    - Voegt gepromoveerde vermeldingen toe aan `MEMORY.md`.
    - Schrijft een `## Deep Sleep`-samenvatting naar `DREAMS.md` en schrijft optioneel `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-fase">
    De REM-fase extraheert patronen en reflectieve signalen.

    - Bouwt thema- en reflectiesamenvattingen uit recente kortetermijnsporen.
    - Schrijft een beheerd `## REM Sleep`-blok wanneer opslag inline uitvoer bevat.
    - Registreert REM-versterkingssignalen die door Deep-rangschikking worden gebruikt.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestie van sessietranscripten

Dreaming kan geredigeerde sessietranscripten opnemen in de Dreaming-corpus. Wanneer transcripten beschikbaar zijn, worden ze samen met dagelijkse geheugensignalen en recall-sporen aan de Light-fase gevoed. Persoonlijke en gevoelige inhoud wordt vóór ingestie geredigeerd.

## Dream Diary

Dreaming houdt ook een verhalend **Dream Diary** bij in `DREAMS.md`. Nadat elke fase genoeg materiaal heeft, voert `memory-core` een best-effort subagentbeurt op de achtergrond uit en voegt het een korte dagboekvermelding toe. Het gebruikt het standaard runtime-model tenzij `dreaming.model` is geconfigureerd. Als het geconfigureerde model niet beschikbaar is, probeert Dream Diary het één keer opnieuw met het standaardmodel van de sessie.

<Note>
Dit dagboek is bedoeld om door mensen te worden gelezen in de Dreams UI, niet als promotiebron. Door Dreaming gegenereerde dagboek-/rapportartefacten worden uitgesloten van kortetermijnpromotie. Alleen onderbouwde geheugenfragmenten komen in aanmerking voor promotie naar `MEMORY.md`.
</Note>

Er is ook een onderbouwde historische backfill-lane voor beoordelings- en herstelwerk:

<AccordionGroup>
  <Accordion title="Backfill-commando's">
    - `memory rem-harness --path ... --grounded` toont een preview van onderbouwde dagboekuitvoer uit historische `YYYY-MM-DD.md`-notities.
    - `memory rem-backfill --path ...` schrijft omkeerbare onderbouwde dagboekvermeldingen naar `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` zet onderbouwde duurzame kandidaten klaar in dezelfde kortetermijn-evidence-store die de normale Deep-fase al gebruikt.
    - `memory rem-backfill --rollback` en `--rollback-short-term` verwijderen die klaargezette backfill-artefacten zonder gewone dagboekvermeldingen of live kortetermijn-recall aan te raken.

  </Accordion>
</AccordionGroup>

De Control UI biedt dezelfde backfill-/resetflow voor dagboeken, zodat je resultaten in de Dreams-scène kunt inspecteren voordat je beslist of de onderbouwde kandidaten promotie verdienen. De Scene toont ook een afzonderlijke onderbouwde lane, zodat je kunt zien welke klaargezette kortetermijnvermeldingen uit historische replay kwamen, welke gepromoveerde items door onderbouwde invoer werden geleid, en alleen onderbouwde klaargezette vermeldingen kunt wissen zonder de gewone live kortetermijnstatus aan te raken.

## Deep-rangschikkingssignalen

Deep-rangschikking gebruikt zes gewogen basissignalen plus faseversterking:

| Signaal              | Gewicht | Beschrijving                                      |
| -------------------- | ------- | ------------------------------------------------- |
| Frequentie           | 0.24    | Hoeveel kortetermijnsignalen de vermelding heeft verzameld |
| Relevantie           | 0.30    | Gemiddelde ophaalkwaliteit voor de vermelding     |
| Querydiversiteit     | 0.15    | Afzonderlijke query-/dagcontexten waarin deze naar voren kwam |
| Recentheid           | 0.15    | Tijdvervallen versheidsscore                      |
| Consolidatie         | 0.10    | Sterkte van terugkeer over meerdere dagen         |
| Conceptuele rijkdom  | 0.06    | Concepttagdichtheid uit fragment/pad              |

Hits in de Light- en REM-fase voegen een kleine, op recentheid vervallen boost toe vanuit `memory/.dreams/phase-signals.json`.

## Planning

Wanneer ingeschakeld, beheert `memory-core` automatisch één cronjob voor een volledige Dreaming-sweep. Elke sweep voert fasen op volgorde uit: light → REM → deep.

Standaard cadansgedrag:

| Instelling           | Standaard      |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
| `dreaming.model`     | standaardmodel |

## Snel starten

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
  <Tab title="Aangepaste sweep-cadans">
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

## Slash-commando

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

    Handmatige `memory promote` gebruikt standaard Deep-fasedrempels, tenzij deze met CLI-flags worden overschreven.

  </Tab>
  <Tab title="Promotie uitleggen">
    Leg uit waarom een specifieke kandidaat wel of niet zou promoveren:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM-harnesspreview">
    Bekijk een preview van REM-reflecties, kandidaatwaarheden en Deep-promotieuitvoer zonder iets te schrijven:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Belangrijke standaardwaarden

Alle instellingen staan onder `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Schakel de Dreaming-sweep in of uit.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-cadans voor de volledige Dreaming-sweep.
</ParamField>
<ParamField path="model" type="string">
  Optionele modeloverride voor de Dream Diary-subagent. Gebruik een canonieke `provider/model`-waarde wanneer je ook een subagent-allowlist `allowedModels` instelt.
</ParamField>

<Warning>
`dreaming.model` vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`. Stel ook `plugins.entries.memory-core.subagent.allowedModels` in om dit te beperken. Vertrouwens- of allowlist-fouten blijven zichtbaar in plaats van stil terug te vallen; de retry dekt alleen fouten waarbij het model niet beschikbaar is.
</Warning>

<Note>
Fasebeleid, drempels en opslaggedrag zijn interne implementatiedetails (geen gebruikersgerichte configuratie). Zie [Memory-configuratiereferentie](/nl/reference/memory-config#dreaming) voor de volledige lijst met sleutels.
</Note>

## Dreams UI

Wanneer ingeschakeld toont het tabblad **Dreams** van de Gateway:

- huidige ingeschakelde status van Dreaming
- fasestatus en aanwezigheid van beheerde sweep
- aantallen kortetermijn-, onderbouwde, signaal- en vandaag-gepromoveerde items
- timing van de volgende geplande run
- een afzonderlijke onderbouwde Scene-lane voor klaargezette historische replay-vermeldingen
- een uitklapbare Dream Diary-lezer ondersteund door `doctor.memory.dreamDiary`

## Gerelateerd

- [Memory](/nl/concepts/memory)
- [Memory CLI](/nl/cli/memory)
- [Memory-configuratiereferentie](/nl/reference/memory-config)
- [Memory search](/nl/concepts/memory-search)
