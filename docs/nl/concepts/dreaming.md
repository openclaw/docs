---
read_when:
    - Je wilt dat geheugenpromotie automatisch wordt uitgevoerd
    - Je wilt begrijpen wat elke Dreaming-fase doet
    - Je wilt consolidatie afstemmen zonder MEMORY.md te vervuilen
sidebarTitle: Dreaming
summary: Achtergrondgeheugenconsolidatie met lichte, diepe en REM-fasen plus een Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:25:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming is het geheugenconsolidatiesysteem op de achtergrond in `memory-core`. Het helpt OpenClaw sterke kortetermijnsignalen naar duurzaam geheugen te verplaatsen, terwijl het proces uitlegbaar en controleerbaar blijft.

<Note>
Dreaming is **opt-in** en standaard uitgeschakeld.
</Note>

## Wat Dreaming schrijft

Dreaming bewaart twee soorten uitvoer:

- **Machinestatus** in `memory/.dreams/` (opslag voor herinneringen, fasesignalen, ingestiecheckpoints, locks).
- **Menselijk leesbare uitvoer** in `DREAMS.md` (of bestaande `dreams.md`) en optionele faserapportbestanden onder `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langetermijnpromotie schrijft nog steeds alleen naar `MEMORY.md`.

## Fasemodel

Dreaming gebruikt drie samenwerkende fasen:

| Fase  | Doel                                             | Duurzame schrijfactie |
| ----- | ------------------------------------------------ | --------------------- |
| Licht | Recent kortetermijnmateriaal sorteren en stagen  | Nee                   |
| Diep  | Duurzame kandidaten scoren en promoveren         | Ja (`MEMORY.md`)      |
| REM   | Reflecteren op thema's en terugkerende ideeën    | Nee                   |

Deze fasen zijn interne implementatiedetails, geen afzonderlijke door de gebruiker geconfigureerde "modi."

<AccordionGroup>
  <Accordion title="Lichte fase">
    De lichte fase neemt recente dagelijkse geheugensignalen en herinneringssporen op, dedupliceert ze en staget kandidaatregels.

    - Leest uit kortetermijnherinneringsstatus, recente dagelijkse geheugenbestanden en geredigeerde sessietranscripten wanneer beschikbaar.
    - Schrijft een beheerd `## Light Sleep`-blok wanneer opslag inline uitvoer bevat.
    - Legt versterkingssignalen vast voor latere diepe rangschikking.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
  <Accordion title="Diepe fase">
    De diepe fase beslist wat langetermijngeheugen wordt.

    - Rangschikt kandidaten met gewogen scoring en drempelpoorten.
    - Vereist dat `minScore`, `minRecallCount` en `minUniqueQueries` slagen.
    - Herhydrateert snippets uit live dagelijkse bestanden vóór het schrijven, zodat verouderde/verwijderde snippets worden overgeslagen.
    - Voegt gepromoveerde items toe aan `MEMORY.md`.
    - Schrijft een `## Deep Sleep`-samenvatting naar `DREAMS.md` en schrijft optioneel `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-fase">
    De REM-fase extraheert patronen en reflectieve signalen.

    - Bouwt thema- en reflectiesamenvattingen uit recente kortetermijnsporen.
    - Schrijft een beheerd `## REM Sleep`-blok wanneer opslag inline uitvoer bevat.
    - Legt REM-versterkingssignalen vast die door diepe rangschikking worden gebruikt.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestie van sessietranscripten

Dreaming kan geredigeerde sessietranscripten opnemen in het Dreaming-corpus. Wanneer transcripten beschikbaar zijn, worden ze naast dagelijkse geheugensignalen en herinneringssporen aan de lichte fase gevoerd. Persoonlijke en gevoelige inhoud wordt vóór ingestie geredigeerd.

## Droomdagboek

Dreaming houdt ook een narratief **Droomdagboek** bij in `DREAMS.md`. Nadat elke fase genoeg materiaal heeft, voert `memory-core` naar beste vermogen een subagent-beurt op de achtergrond uit en voegt het een korte dagboekvermelding toe. Het gebruikt het standaard runtimemodel, tenzij `dreaming.model` is geconfigureerd. Als het geconfigureerde model niet beschikbaar is, probeert Droomdagboek het eenmaal opnieuw met het standaardmodel van de sessie.

<Note>
Dit dagboek is bedoeld voor menselijke lezing in de Dreams-UI, niet als promotiebron. Door Dreaming gegenereerde dagboek-/rapportartefacten zijn uitgesloten van kortetermijnpromotie. Alleen onderbouwde geheugensnippets komen in aanmerking voor promotie naar `MEMORY.md`.
</Note>

Er is ook een onderbouwde historische backfill-lane voor review- en herstelwerk:

<AccordionGroup>
  <Accordion title="Backfill-opdrachten">
    - `memory rem-harness --path ... --grounded` toont een preview van onderbouwde dagboekuitvoer uit historische `YYYY-MM-DD.md`-notities.
    - `memory rem-backfill --path ...` schrijft omkeerbare onderbouwde dagboekvermeldingen naar `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` staget onderbouwde duurzame kandidaten in dezelfde kortetermijnbewijssopslag die de normale diepe fase al gebruikt.
    - `memory rem-backfill --rollback` en `--rollback-short-term` verwijderen die gestagede backfill-artefacten zonder gewone dagboekvermeldingen of live kortetermijnherinneringen aan te raken.

  </Accordion>
</AccordionGroup>

De Control UI biedt dezelfde backfill-/resetflow voor het dagboek, zodat je resultaten in de Dreams-scène kunt inspecteren voordat je beslist of de onderbouwde kandidaten promotie verdienen. De Scène toont ook een aparte onderbouwde lane, zodat je kunt zien welke gestagede kortetermijnitems uit historische replay kwamen, welke gepromoveerde items door onderbouwing werden geleid, en alleen onderbouwde gestagede items kunt wissen zonder gewone live kortetermijnstatus aan te raken.

## Signalen voor diepe rangschikking

Diepe rangschikking gebruikt zes gewogen basissignalen plus faseversterking:

| Signaal              | Gewicht | Beschrijving                                             |
| -------------------- | ------- | -------------------------------------------------------- |
| Frequentie           | 0.24    | Hoeveel kortetermijnsignalen het item heeft verzameld    |
| Relevantie           | 0.30    | Gemiddelde retrievalkwaliteit voor het item              |
| Querydiversiteit     | 0.15    | Afzonderlijke query-/dagcontexten waarin het opdook      |
| Recentheid           | 0.15    | Tijdvervallen versheidsscore                             |
| Consolidatie         | 0.10    | Sterkte van herhaling over meerdere dagen                |
| Conceptuele rijkheid | 0.06    | Concepttagdichtheid uit snippet/pad                      |

Hits uit de lichte en REM-fase voegen een kleine, door recentheid vervallen boost toe vanuit `memory/.dreams/phase-signals.json`.

Shadow-trialresultaten kunnen boven op die basisscore worden gelegd als een reviewsignaal vóór een duurzame schrijfactie. Een nuttige trial geeft de kandidaat een kleine begrensde boost, een neutrale trial houdt hem uitgesteld, en een schadelijke trial markeert hem als afgewezen voor die scoringsronde. Dit signaal blijft alleen rapportage: het kan de kandidaatvolgorde of reviewmetadata wijzigen, maar schrijft niet naar `MEMORY.md` en promoveert de kandidaat niet zelfstandig.

## QA-rapportdekking voor shadow trial

QA Lab bevat een scenario dat alleen rapporteert, om te verkennen hoe een toekomstige Dreaming-shadow trial een kandidaat-geheugen vóór promotie zou kunnen beoordelen. Het scenario vraagt een agent een baseline-antwoord te vergelijken met een antwoord dat het kandidaat-geheugen kan gebruiken, en daarna een lokaal rapport te schrijven met een oordeel, reden en risicovlaggen.

Deze dekking is bewust beperkt tot QA. Ze verifieert dat het rapportartefact gescheiden blijft van `MEMORY.md` en dat de agent niet beweert dat de kandidaat is gepromoveerd. Ze voegt geen production shadow-trialgedrag toe en wijzigt de promotie-engine van de diepe fase niet.

De shadow-trialrunner van `memory-core` behoudt hetzelfde contract van alleen rapportage voor codepaden die een stabiel artefact nodig hebben. Hij accepteert de kandidaat, trialprompt, baseline-uitkomst, kandidaatuitkomst, oordeel, reden, risicovlaggen en bewijsreferenties, en schrijft daarna een rapport met `promotion action: report-only`. Nuttige oordelen mappen naar een `promote`-aanbeveling, neutrale oordelen naar `defer`, en schadelijke oordelen naar `reject`; geen van die aanbevelingen schrijft naar `MEMORY.md` of past promotie in de diepe fase toe.

## Planning

Wanneer ingeschakeld, beheert `memory-core` automatisch één cronjob voor een volledige Dreaming-sweep. Elke sweep voert fasen op volgorde uit: licht → REM → diep.

De sweep bevat de primaire runtimewerkruimte en eventuele geconfigureerde agentwerkruimten, gededupliceerd op pad, zodat uitwaaiering naar subagentwerkruimten de `DREAMS.md` en geheugenstatus van de hoofdagent niet uitsluit.

Standaard cadansgedrag:

| Instelling           | Standaard        |
| -------------------- | ---------------- |
| `dreaming.frequency` | `0 3 * * *`      |
| `dreaming.model`     | standaardmodel   |

## Snelstart

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

    Handmatige `memory promote` gebruikt standaard drempels van de diepe fase, tenzij overschreven met CLI-vlaggen.

  </Tab>
  <Tab title="Promotie uitleggen">
    Leg uit waarom een specifieke kandidaat wel of niet zou promoveren:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM-harnesspreview">
    Bekijk een preview van REM-reflecties, kandidaatwaarheden en diepe promotie-uitvoer zonder iets te schrijven:

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
  Optionele modeloverride voor de Droomdagboek-subagent. Gebruik een canonieke `provider/model`-waarde wanneer je ook een `allowedModels`-allowlist voor subagents instelt.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maximaal geschat aantal tokens dat behouden blijft uit elke kortetermijnherinneringssnippet die naar `MEMORY.md` wordt gepromoveerd. Herkomst van rangschikking blijft zichtbaar.
</ParamField>

<Warning>
`dreaming.model` vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`. Stel ook `plugins.entries.memory-core.subagent.allowedModels` in om dit te beperken. Fouten in vertrouwen of allowlist blijven zichtbaar in plaats van stil terug te vallen; de retry dekt alleen fouten waarbij het model niet beschikbaar is.
</Warning>

<Note>
Het meeste fasebeleid, drempels en opslaggedrag zijn interne implementatiedetails. Zie [Referentie voor geheugenconfiguratie](/nl/reference/memory-config#dreaming) voor de volledige sleutellijst.
</Note>

## Dreams-UI

Wanneer ingeschakeld, toont het tabblad **Dreams** in de Gateway:

- huidige ingeschakelde Dreaming-status
- status per fase en aanwezigheid van beheerde sweep
- aantallen voor kortetermijn, onderbouwd, signaal en vandaag gepromoveerd
- timing van de volgende geplande uitvoering
- een aparte onderbouwde Scène-lane voor gestagede historische replay-items
- een uitklapbare Droomdagboeklezer ondersteund door `doctor.memory.dreamDiary`

## Dreaming wordt nooit uitgevoerd: status toont geblokkeerd

Als `openclaw memory status` `Dreaming status: blocked` rapporteert, bestaat de beheerde cron, maar vuurt de Heartbeat van de standaardagent niet. Controleer dat Heartbeat is ingeschakeld voor de standaardagent en dat het doel niet `none` is, en voer daarna `openclaw memory status --deep` opnieuw uit na het volgende Heartbeat-interval.

## Gerelateerd

- [Geheugen](/nl/concepts/memory)
- [Geheugen-CLI](/nl/cli/memory)
- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config)
- [Geheugen zoeken](/nl/concepts/memory-search)
