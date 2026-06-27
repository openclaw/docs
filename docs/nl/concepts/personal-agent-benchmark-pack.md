---
read_when:
    - Lokale betrouwbaarheidscontroles voor persoonlijke agents uitvoeren
    - De repo-ondersteunde QA-scenariocatalogus uitbreiden
    - Herinnering, antwoord, geheugen, redactie, veilige opvolging van tools, taakstatus, deelveilige diagnostiek, met bewijs onderbouwde voltooiingsclaims en foutherstel verifiëren
summary: Lokale qa-channel-scenario's voor workflowcontroles van privacybehoudende persoonlijke assistenten.
title: Benchmarkpakket voor persoonlijke agents
x-i18n:
    generated_at: "2026-06-27T17:28:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Het Personal Agent Benchmark Pack is een klein, door een repo ondersteund QA-scenariopakket voor
lokale workflows voor persoonlijke assistenten. Het is geen generieke modelbenchmark en
vereist geen nieuwe runner. Het pakket hergebruikt de private QA-stack die wordt beschreven in
[QA-overzicht](/nl/concepts/qa-e2e-automation), het synthetische
[QA-kanaal](/nl/channels/qa-channel) en de bestaande YAML-catalogus `qa/scenarios`.

Het eerste pakket is bewust smal:

- nep-persoonlijke herinneringen via lokale Cron-bezorging
- nep-DM- en thread-antwoordroutering via `qa-channel`
- nep-voorkeursherinnering vanuit de tijdelijke geheugenbestanden van de QA-werkruimte
- nep-controles dat geheimen niet worden herhaald
- veilige, door leesbewijs ondersteunde toolopvolging na een korte goedkeuringsachtige beurt
- stopgedrag bij geweigerde goedkeuring voor een gevoelige lokale leesaanvraag
- door bewijs ondersteunde taakstatusrapportage die in behandeling, geblokkeerd en voltooid gescheiden houdt
- deelveilige diagnostische artefacten die nuttige status behouden en ruwe persoonlijke inhoud weglaten
- door bewijs ondersteunde voltooiingsclaims die nepvoortgang vermijden voordat lokaal bewijs bestaat
- foutherstel dat gedeeltelijke status rapporteert en retry-grenzen duidelijk houdt

## Scenario's

De machineleesbare pakketmetadata staat in
`extensions/qa-lab/src/scenario-packs.ts`. Voer het pakket uit met
`--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` is additief met herhaalde `--scenario`-vlaggen. Expliciete scenario's worden
eerst uitgevoerd, daarna worden de pakketscenario's uitgevoerd in de volgorde van `QA_PERSONAL_AGENT_SCENARIO_IDS`, met
duplicaten verwijderd.

Het pakket is ontworpen voor `qa-channel` met `mock-openai` of een andere lokale QA
provider-lane. Het mag niet worden gericht op live chatservices of echte persoonlijke
accounts.

## Privacymodel

De scenario's gebruiken alleen nepgebruikers, nepvoorkeuren, nepgeheimen en de
tijdelijke QA-Gateway-werkruimte die door de suite wordt gemaakt. Ze mogen geen echt
OpenClaw-gebruikersgeheugen, sessies, referenties, launch agents, globale configuraties
of live Gateway-status lezen of schrijven.

Artefacten blijven onder de bestaande artefactmap van de QA-suite en moeten worden
behandeld als testuitvoer. Redactiecontroles gebruiken nepmarkeringen, zodat fouten veilig
kunnen worden geïnspecteerd en in issues kunnen worden vastgelegd.

## Het Pakket Uitbreiden

Voeg nieuwe `.yaml`-cases toe onder `qa/scenarios/personal/` en voeg daarna de scenario-id
toe aan `QA_PERSONAL_AGENT_SCENARIO_IDS`. Houd elke case klein, lokaal, deterministisch
in `mock-openai` en gericht op één gedrag van een persoonlijke assistent.

Goede kandidaten voor vervolgwerk:

- controles voor geredigeerde trajectexport
- controles voor lokale-only Plugin-workflows

Voeg geen nieuwe runner, Plugin, afhankelijkheid, live transport of modelbeoordelaar toe
totdat de scenariocatalogus genoeg stabiele cases heeft om dat oppervlak te rechtvaardigen.
