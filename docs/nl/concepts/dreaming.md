---
read_when:
    - Je wilt dat geheugenpromotie automatisch wordt uitgevoerd
    - Je wilt begrijpen wat elke Dreaming-fase doet
    - Je wilt consolidatie afstemmen zonder MEMORY.md te vervuilen
sidebarTitle: Dreaming
summary: Achtergrondgeheugenconsolidatie met lichte, diepe en REM-fasen plus een Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:13:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming is het achtergrond­systeem voor geheugenconsolidatie in `memory-core`. Het helpt OpenClaw sterke kortetermijnsignalen naar duurzaam geheugen te verplaatsen, terwijl het proces uitlegbaar en controleerbaar blijft.

<Note>
Dreaming is **opt-in** en standaard uitgeschakeld.
</Note>

## Wat dreaming schrijft

Dreaming houdt twee soorten uitvoer bij:

- **Machinestatus** in `memory/.dreams/` (recall-opslag, fasesignalen, ingestiecheckpoints, locks).
- **Voor mensen leesbare uitvoer** in `DREAMS.md` (of bestaande `dreams.md`) en optionele faserapportbestanden onder `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langetermijnpromotie schrijft nog steeds alleen naar `MEMORY.md`.

## Fasemodel

Dreaming gebruikt drie samenwerkende fasen:

| Fase  | Doel                                             | Duurzame schrijfactie |
| ----- | ------------------------------------------------ | --------------------- |
| Light | Recent kortetermijnmateriaal sorteren en faseren | Nee                   |
| Deep  | Duurzame kandidaten scoren en promoveren         | Ja (`MEMORY.md`)      |
| REM   | Reflecteren op thema's en terugkerende ideeën    | Nee                   |

Deze fasen zijn interne implementatiedetails, geen afzonderlijke door gebruikers geconfigureerde "modi".

<AccordionGroup>
  <Accordion title="Light-fase">
    De Light-fase neemt recente dagelijkse geheugensignalen en recall-sporen op, dedupliceert ze en faseert kandidaatregels.

    - Leest uit kortetermijn-recallstatus, recente dagelijkse geheugenbestanden en geredigeerde sessietranscripten wanneer beschikbaar.
    - Schrijft een beheerd `## Light Sleep`-blok wanneer opslag inline-uitvoer bevat.
    - Registreert versterkingssignalen voor latere Deep-rangschikking.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep-fase">
    De Deep-fase bepaalt wat langetermijngeheugen wordt.

    - Rangschikt kandidaten met gewogen scores en drempelpoorten.
    - Vereist dat `minScore`, `minRecallCount` en `minUniqueQueries` slagen.
    - Hydrateert snippets opnieuw uit live dagelijkse bestanden voordat er wordt geschreven, zodat verouderde/verwijderde snippets worden overgeslagen.
    - Voegt gepromoveerde items toe aan `MEMORY.md`.
    - Schrijft een `## Deep Sleep`-samenvatting naar `DREAMS.md` en schrijft optioneel `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-fase">
    De REM-fase extraheert patronen en reflectieve signalen.

    - Bouwt thema- en reflectiesamenvattingen uit recente kortetermijnsporen.
    - Schrijft een beheerd `## REM Sleep`-blok wanneer opslag inline-uitvoer bevat.
    - Registreert REM-versterkingssignalen die door Deep-rangschikking worden gebruikt.
    - Schrijft nooit naar `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestie van sessietranscripten

Dreaming kan geredigeerde sessietranscripten opnemen in het dreaming-corpus. Wanneer transcripten beschikbaar zijn, worden ze naast dagelijkse geheugensignalen en recall-sporen aan de Light-fase gevoerd. Persoonlijke en gevoelige inhoud wordt vóór ingestie geredigeerd.

## Dream Diary

Dreaming houdt ook een narratief **Dream Diary** bij in `DREAMS.md`. Nadat elke fase genoeg materiaal heeft, voert `memory-core` best-effort een achtergrondbeurt met een subagent uit en voegt een kort dagboekitem toe. Het gebruikt het standaard runtimemodel tenzij `dreaming.model` is geconfigureerd. Als het geconfigureerde model niet beschikbaar is, probeert Dream Diary het eenmaal opnieuw met het standaardsessiemodel.

<Note>
Dit dagboek is bedoeld voor menselijke lezing in de Dreams-UI, niet als promotiebron. Door Dreaming gegenereerde dagboek-/rapportartefacten worden uitgesloten van kortetermijnpromotie. Alleen onderbouwde geheugensnippets komen in aanmerking voor promotie naar `MEMORY.md`.
</Note>

Er is ook een onderbouwde historische backfill-lane voor review- en herstelwerk:

<AccordionGroup>
  <Accordion title="Backfill-opdrachten">
    - `memory rem-harness --path ... --grounded` toont een preview van onderbouwde dagboekuitvoer uit historische `YYYY-MM-DD.md`-notities.
    - `memory rem-backfill --path ...` schrijft omkeerbare onderbouwde dagboekitems naar `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` faseert onderbouwde duurzame kandidaten in dezelfde kortetermijn-bewijsopslag die de normale Deep-fase al gebruikt.
    - `memory rem-backfill --rollback` en `--rollback-short-term` verwijderen die gefaseerde backfill-artefacten zonder gewone dagboekitems of live kortetermijn-recall aan te raken.

  </Accordion>
</AccordionGroup>

De Control-UI biedt dezelfde backfill-/resetflow voor het dagboek, zodat je resultaten in de Dreams-scène kunt inspecteren voordat je beslist of de onderbouwde kandidaten promotie verdienen. De Scene toont ook een aparte onderbouwde lane, zodat je kunt zien welke gefaseerde kortetermijnitems uit historische replay kwamen, welke gepromoveerde items door onderbouwing werden geleid, en alleen gefaseerde items kunt wissen die uitsluitend onderbouwd zijn zonder gewone live kortetermijnstatus aan te raken.

## Deep-rangschikkingssignalen

Deep-rangschikking gebruikt zes gewogen basissignalen plus faseversterking:

| Signaal              | Gewicht | Beschrijving                                                   |
| -------------------- | ------- | -------------------------------------------------------------- |
| Frequentie           | 0.24    | Hoeveel kortetermijnsignalen het item heeft verzameld          |
| Relevantie           | 0.30    | Gemiddelde ophaalkwaliteit voor het item                       |
| Querydiversiteit     | 0.15    | Afzonderlijke query-/dagcontexten waarin het naar voren kwam   |
| Recentheid           | 0.15    | Tijdvervalste versheidsscore                                   |
| Consolidatie         | 0.10    | Sterkte van herhaling over meerdere dagen                      |
| Conceptuele rijkdom  | 0.06    | Dichtheid van concepttags uit snippet/pad                      |

Hits in de Light- en REM-fase voegen een kleine, door recentheid vervallende boost toe vanuit `memory/.dreams/phase-signals.json`.

Schaduwproefresultaten kunnen bovenop die basisscore worden gelegd als reviewsignaal vóór een duurzame schrijfactie. Een nuttige proef geeft de kandidaat een kleine begrensde boost, een neutrale proef houdt hem uitgesteld, en een schadelijke proef markeert hem als afgewezen voor die scoreronde. Dit signaal is nog steeds alleen voor rapportage: het kan de volgorde van kandidaten of reviewmetadata wijzigen, maar schrijft niet naar `MEMORY.md` en promoveert de kandidaat niet zelfstandig.

## Rapportdekking voor QA-schaduwproef

QA Lab bevat een scenario dat alleen rapporteert om te verkennen hoe een toekomstige dreaming-schaduwproef een kandidaatgeheugen vóór promotie zou kunnen beoordelen. Het scenario vraagt een agent een basisantwoord te vergelijken met een antwoord dat het kandidaatgeheugen kan gebruiken, en vervolgens een lokaal rapport te schrijven met een oordeel, reden en risicovlaggen.

Deze dekking is bewust beperkt tot QA. Ze verifieert dat het rapportartefact gescheiden blijft van `MEMORY.md` en dat de agent niet claimt dat de kandidaat is gepromoveerd. Ze voegt geen productiegedrag voor schaduwproeven toe en wijzigt de promotie-engine van de Deep-fase niet.

De schaduwproefrunner van `memory-core` houdt hetzelfde alleen-rapportagecontract aan voor codepaden die een stabiel artefact nodig hebben. Hij accepteert de kandidaat, proefprompt, basisuitkomst, kandidaatuitkomst, oordeel, reden, risicovlaggen en bewijsreferenties, en schrijft vervolgens een rapport met `promotion action: report-only`. Nuttige oordelen mappen naar een aanbeveling `promote`, neutrale oordelen naar `defer`, en schadelijke oordelen naar `reject`; geen van die aanbevelingen schrijft naar `MEMORY.md` of past Deep-fasepromotie toe.

## Planning

Wanneer ingeschakeld beheert `memory-core` automatisch één cronjob voor een volledige dreaming-sweep. Elke sweep voert fasen op volgorde uit: Light → REM → Deep.

De sweep omvat de primaire runtimewerkruimte en alle geconfigureerde agentwerkruimten, gededupliceerd op pad, zodat fan-out naar subagentwerkruimten de `DREAMS.md` en geheugenstatus van de hoofdagent niet uitsluit.

Standaard cadansgedrag:

| Instelling           | Standaard       |
| -------------------- | --------------- |
| `dreaming.frequency` | `0 3 * * *`     |
| `dreaming.model`     | standaardmodel  |

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

## Slash-opdracht

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` en `/dreaming off` wijzigen gateway-brede configuratie. Kanaalaanroepers moeten eigenaren zijn, en Gateway-clients moeten `operator.admin` hebben. `/dreaming status` en `/dreaming help` blijven alleen-lezen.

## CLI-workflow

<Tabs>
  <Tab title="Promotiepreview / toepassen">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Handmatige `memory promote` gebruikt standaard Deep-fasedrempels, tenzij overschreven met CLI-vlaggen.

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
  Schakel de dreaming-sweep in of uit.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-cadans voor de volledige dreaming-sweep.
</ParamField>
<ParamField path="model" type="string">
  Optionele modeloverride voor de Dream Diary-subagent. Gebruik een canonieke `provider/model`-waarde wanneer je ook een subagent-allowlist `allowedModels` instelt.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maximaal geschat aantal tokens dat wordt behouden uit elke kortetermijn-recallsnippet die naar `MEMORY.md` wordt gepromoveerd. Rangschikkingsherkomst blijft zichtbaar.
</ParamField>

<Warning>
`dreaming.model` vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`. Om dit te beperken, stel je ook `plugins.entries.memory-core.subagent.allowedModels` in. Vertrouwens- of allowlistfouten blijven zichtbaar in plaats van stilzwijgend terug te vallen; de retry dekt alleen fouten waarbij het model niet beschikbaar is.
</Warning>

<Note>
De meeste fasebeleidsregels, drempels en opslaggedrag zijn interne implementatiedetails. Zie [Referentie voor geheugenconfiguratie](/nl/reference/memory-config#dreaming) voor de volledige lijst met keys.
</Note>

## Dreams-UI

Wanneer ingeschakeld toont het tabblad **Dreams** van de Gateway:

- huidige ingeschakelde dreaming-status
- status op faseniveau en aanwezigheid van beheerde sweep
- aantallen voor kortetermijn-, onderbouwde, signaal- en vandaag-gepromoveerde items
- timing van de volgende geplande uitvoering
- een aparte onderbouwde Scene-lane voor gefaseerde historische replay-items
- een uitklapbare Dream Diary-lezer ondersteund door `doctor.memory.dreamDiary`

## Dreaming wordt nooit uitgevoerd: status toont geblokkeerd

Als `openclaw memory status` `Dreaming status: blocked` rapporteert, bestaat de beheerde cron, maar vuurt de Heartbeat van de standaardagent niet. Controleer of Heartbeat is ingeschakeld voor de standaardagent en dat het doel niet `none` is, en voer daarna na het volgende Heartbeat-interval opnieuw `openclaw memory status --deep` uit.

## Gerelateerd

- [Geheugen](/nl/concepts/memory)
- [Geheugen-CLI](/nl/cli/memory)
- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config)
- [Geheugen zoeken](/nl/concepts/memory-search)
