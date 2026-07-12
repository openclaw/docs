---
read_when:
    - Lokale betrouwbaarheidscontroles voor persoonlijke agents uitvoeren
    - De repo-ondersteunde catalogus met QA-scenario's uitbreiden
    - Verificatie van herinneringen, antwoorden, geheugen, anonimisering, veilige opvolging van tools, taakstatus, veilig deelbare diagnostiek, door bewijs gestaafde voltooiingsclaims en herstel na fouten
summary: Lokale qa-channel-scenario's voor controles van privacybeschermende workflows voor persoonlijke assistenten.
title: Benchmarkpakket voor persoonlijke agents
x-i18n:
    generated_at: "2026-07-12T08:48:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Het Personal Agent Benchmark Pack is een klein, door een repository ondersteund QA-scenariopakket voor
lokale workflows voor persoonlijke assistenten. Het is geen algemene modelbenchmark en
heeft geen nieuwe runner nodig: het hergebruikt de private QA-stack ([QA-overzicht](/nl/concepts/qa-e2e-automation)),
het synthetische [QA-kanaal](/nl/channels/qa-channel) en de bestaande
YAML-catalogus `qa/scenarios`.

## Scenario's

Tien scenario's, gedefinieerd in `qa/scenarios/personal/*.yaml`:

| Scenario-id                                | Controles                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Gesimuleerde persoonlijke herinneringen via lokale Cron-bezorging                                           |
| `personal-channel-thread-reply`            | Routering van gesimuleerde privéberichten en antwoorden in discussielijnen via `qa-channel`                 |
| `personal-memory-preference-recall`        | Ophalen van gesimuleerde voorkeuren uit de tijdelijke geheugenbestanden van de QA-werkruimte                |
| `personal-redaction-no-secret-leak`        | Controles dat gesimuleerde geheimen niet worden herhaald                                                    |
| `personal-tool-safety-followthrough`       | Veilige, door leesbewerkingen ondersteunde opvolging met tools na een korte goedkeuringsbeurt                |
| `personal-approval-denial-stop`            | Stopgedrag na geweigerde goedkeuring voor een gevoelige lokale leesaanvraag                                 |
| `personal-task-followthrough-status`       | Op bewijs gebaseerde rapportage van de taakstatus die openstaand, geblokkeerd en voltooid gescheiden houdt  |
| `personal-share-safe-diagnostics-artifact` | Veilig deelbare diagnostische artefacten die nuttige status behouden en onbewerkte persoonlijke inhoud weglaten |
| `personal-no-fake-progress`                | Op bewijs gebaseerde voltooiingsclaims die geen voortgang veinzen voordat lokaal bewijs beschikbaar is      |
| `personal-failure-recovery`                | Herstel na fouten dat een gedeeltelijke status rapporteert en de grenzen voor nieuwe pogingen duidelijk houdt |

De machineleesbare pakketmetadata (lijst met id's, titel en beschrijving) staat in
`extensions/qa-lab/src/scenario-packs.ts` als `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Voer het pakket uit met `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` is cumulatief met herhaalde `--scenario`-vlaggen. Expliciete scenario's worden
eerst uitgevoerd, waarna de pakketscenario's in de volgorde van
`QA_PERSONAL_AGENT_SCENARIO_IDS` worden uitgevoerd, waarbij duplicaten worden verwijderd.

Het pakket is gericht op `qa-channel` met `mock-openai` of een ander lokaal
QA-providertraject. Richt het niet op livechatdiensten of echte persoonlijke accounts.

## Privacymodel

Scenario's gebruiken uitsluitend gesimuleerde gebruikers, gesimuleerde voorkeuren, gesimuleerde geheimen en de
tijdelijke QA Gateway-werkruimte die door de suite wordt aangemaakt. Ze mogen geen echt
gebruikersgeheugen, sessies, referenties, startagents, globale configuraties of live
Gateway-status van OpenClaw lezen of schrijven.

Artefacten blijven in de bestaande artefactmap van de QA-suite en worden behandeld
als testuitvoer. Redactiecontroles gebruiken gesimuleerde markeringen, zodat fouten veilig kunnen worden
onderzocht en in issues kunnen worden vastgelegd.

## Het pakket uitbreiden

Voeg nieuwe `.yaml`-gevallen toe onder `qa/scenarios/personal/` en voeg vervolgens de scenario-id
toe aan `QA_PERSONAL_AGENT_SCENARIO_IDS`. Houd elk geval klein, lokaal en deterministisch
in `mock-openai`, en gericht op één gedrag van een persoonlijke assistent.

Goede kandidaten voor vervolgwerk: controles voor de export van geredigeerde trajecten, controles voor uitsluitend lokale
Plugin-workflows.

Voeg geen nieuwe runner, Plugin, afhankelijkheid, live transport of modelbeoordelaar
toe totdat de scenariocatalogus voldoende stabiele gevallen bevat om dat oppervlak te rechtvaardigen.
