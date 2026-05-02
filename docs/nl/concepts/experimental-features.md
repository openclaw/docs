---
read_when:
    - Je ziet een `.experimental`-configuratiesleutel en wilt weten of die stabiel is
    - Je wilt preview-runtimefuncties uitproberen zonder ze te verwarren met normale standaardwaarden
    - Je wilt één plek om de momenteel gedocumenteerde experimentele vlaggen te vinden
summary: Wat experimentele vlaggen in OpenClaw betekenen en welke momenteel zijn gedocumenteerd
title: Experimentele functies
x-i18n:
    generated_at: "2026-05-02T22:18:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentele functies in OpenClaw zijn **opt-in preview-oppervlakken**. Ze zitten
achter expliciete vlaggen omdat ze nog praktijkervaring nodig hebben voordat ze
een stabiele standaard of een langlopend openbaar contract verdienen.

Behandel ze anders dan normale configuratie:

- Laat ze **standaard uit** tenzij de gerelateerde documentatie je vertelt er een te proberen.
- Verwacht dat **vorm en gedrag sneller veranderen** dan bij stabiele configuratie.
- Geef eerst de voorkeur aan het stabiele pad wanneer dat al bestaat.
- Als je OpenClaw breed uitrolt, test experimentele vlaggen dan in een kleinere
  omgeving voordat je ze in een gedeelde basislijn opneemt.

## Momenteel gedocumenteerde vlaggen

| Oppervlak                | Sleutel                                                   | Gebruik dit wanneer                                                                                           | Meer                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokale modelruntime      | `agents.defaults.experimental.localModelLean`             | Een kleinere of strengere lokale backend vastloopt op OpenClaw's volledige standaard tool-oppervlak            | [Lokale modellen](/nl/gateway/local-models)                                                       |
| Geheugenzoekfunctie      | `agents.defaults.memorySearch.experimental.sessionMemory` | Je wilt dat `memory_search` eerdere sessietranscripten indexeert en accepteert de extra opslag-/indexeringskosten | [Referentie voor geheugenconfiguratie](/nl/reference/memory-config#session-memory-search-experimental) |
| Tool voor gestructureerde planning | `tools.experimental.planTool`                    | Je wilt de gestructureerde `update_plan`-tool beschikbaar maken voor het volgen van meerstapswerk in compatibele runtimes en UI's | [Referentie voor Gateway-configuratie](/nl/gateway/config-tools#toolsexperimental)                |

## Lean-modus voor lokale modellen

`agents.defaults.experimental.localModelLean: true` is een drukontlastingsventiel voor zwakkere lokale-modelopstellingen. Wanneer dit is ingeschakeld, verwijdert OpenClaw drie standaardtools — `browser`, `cron` en `message` — uit het tool-oppervlak van de agent voor elke beurt. Verder verandert er niets.

### Waarom deze drie tools

Deze drie tools hebben de grootste beschrijvingen en de meeste parametervormen in de standaard OpenClaw-runtime. Op een backend met kleine context of een strengere OpenAI-compatibele backend is dat het verschil tussen:

- Toolschema's die netjes in de prompt passen versus gesprekshistorie verdringen.
- Het model dat de juiste tool kiest versus misvormde tool-calls uitsturen omdat er te veel op elkaar lijkende schema's zijn.
- De Chat Completions-adapter die binnen de structured-output-limieten van de server blijft versus een 400 veroorzaakt door de payloadgrootte van tool-calls.

Het verwijderen ervan bedraadt OpenClaw niet stilzwijgend opnieuw — het maakt alleen de lijst met tools korter. Het model heeft nog steeds `read`, `write`, `edit`, `exec`, `apply_patch`, zoeken/ophalen op het web (wanneer geconfigureerd), geheugen en sessie-/agenttools beschikbaar.

### Wanneer je dit inschakelt

Schakel lean-modus in wanneer je al hebt bewezen dat het model met de Gateway kan praten, maar volledige agentbeurten zich verkeerd gedragen. De typische signaalketen is:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` slaagt.
2. Een normale agentbeurt faalt met misvormde tool-calls, te grote prompts, of het model negeert zijn tools.
3. Het omschakelen van `localModelLean: true` verhelpt de fout.

### Wanneer je dit uit laat

Als je backend de volledige standaardruntime netjes afhandelt, laat dit dan uit. Lean-modus is een workaround, geen standaard. Het bestaat omdat sommige lokale stacks een kleiner tool-oppervlak nodig hebben om zich goed te gedragen; gehoste modellen en lokale installaties met voldoende resources hebben dat niet nodig.

Lean-modus vervangt ook niet `tools.profile`, `tools.allow`/`tools.deny` of de escape hatch `compat.supportsTools: false` van het model. Als je een permanent smaller tool-oppervlak nodig hebt voor een specifieke agent, geef dan de voorkeur aan die stabiele knoppen boven de experimentele vlag.

### Inschakelen

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Herstart de Gateway nadat je de vlag hebt gewijzigd en bevestig daarna de verkleinde lijst met tools met:

```bash
openclaw status --deep
```

De deep-statusuitvoer toont de actieve agenttools; `browser`, `cron` en `message` zouden afwezig moeten zijn wanneer lean-modus is ingeschakeld.

## Experimenteel betekent niet verborgen

Als een functie experimenteel is, moet OpenClaw dat duidelijk zeggen in de documentatie en in het
configuratiepad zelf. Wat het **niet** moet doen, is preview-gedrag een
stabiel ogende standaardknop binnensmokkelen en doen alsof dat normaal is. Zo worden
configuratie-oppervlakken rommelig.

## Gerelateerd

- [Functies](/nl/concepts/features)
- [Releasekanalen](/nl/install/development-channels)
