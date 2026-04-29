---
read_when:
    - Je ziet een `.experimental`-configuratiesleutel en wilt weten of die stabiel is
    - Je wilt preview-runtimefuncties uitproberen zonder ze te verwarren met normale standaardwaarden
    - Je wilt één plek waar je de momenteel gedocumenteerde experimentele vlaggen kunt vinden
summary: Wat experimentele vlaggen betekenen in OpenClaw en welke momenteel gedocumenteerd zijn
title: Experimentele functies
x-i18n:
    generated_at: "2026-04-29T22:38:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentele functies in OpenClaw zijn **preview-oppervlakken die je expliciet inschakelt**. Ze staan
achter expliciete vlaggen omdat ze nog praktijkervaring nodig hebben voordat ze
een stabiele standaardinstelling of een langdurig publiek contract verdienen.

Behandel ze anders dan normale configuratie:

- Houd ze **standaard uitgeschakeld**, tenzij het gerelateerde document zegt dat je er een moet proberen.
- Verwacht dat **vorm en gedrag sneller veranderen** dan stabiele configuratie.
- Geef eerst de voorkeur aan het stabiele pad wanneer dat al bestaat.
- Als je OpenClaw breed uitrolt, test experimentele vlaggen dan eerst in een kleinere
  omgeving voordat je ze in een gedeelde basislijn opneemt.

## Momenteel gedocumenteerde vlaggen

| Oppervlak                | Sleutel                                                   | Gebruik het wanneer                                                                                           | Meer                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokale modelruntime      | `agents.defaults.experimental.localModelLean`             | Een kleinere of striktere lokale backend vastloopt op OpenClaw's volledige standaardoppervlak voor tools       | [Lokale modellen](/nl/gateway/local-models)                                                       |
| Geheugenzoekfunctie      | `agents.defaults.memorySearch.experimental.sessionMemory` | Je wilt dat `memory_search` eerdere sessietranscripten indexeert en accepteert de extra opslag-/indexeringskosten | [Referentie voor geheugenconfiguratie](/nl/reference/memory-config#session-memory-search-experimental) |
| Gestructureerde planningstool | `tools.experimental.planTool`                             | Je wilt dat de gestructureerde `update_plan`-tool beschikbaar is voor het volgen van meerstapswerk in compatibele runtimes en UI's | [Referentie voor Gateway-configuratie](/nl/gateway/config-tools#toolsexperimental)                |

## Lean-modus voor lokale modellen

`agents.defaults.experimental.localModelLean: true` is een overdrukventiel
voor zwakkere lokale-modelopstellingen. Het snoeit zware standaardtools zoals
`browser`, `cron` en `message`, zodat de promptvorm kleiner en minder broos is
voor backends met kleine context of strengere OpenAI-compatibele backends.

Dat is bewust **niet** het normale pad. Als je backend de volledige
runtime probleemloos afhandelt, laat dit dan uitgeschakeld.

## Experimenteel betekent niet verborgen

Als een functie experimenteel is, moet OpenClaw dat duidelijk zeggen in docs en in het
configuratiepad zelf. Wat het **niet** moet doen, is previewgedrag binnensmokkelen in een
stabiel ogende standaardknop en doen alsof dat normaal is. Zo worden configuratie-
oppervlakken rommelig.

## Gerelateerd

- [Functies](/nl/concepts/features)
- [Releasekanalen](/nl/install/development-channels)
