---
read_when:
    - Je ziet een `.experimental`-configuratiesleutel en wilt weten of die stabiel is
    - Je wilt preview-runtimefuncties uitproberen zonder ze te verwarren met normale standaardinstellingen
    - Je wilt één plek om de momenteel gedocumenteerde experimentele flags te vinden
summary: Wat experimentele flags betekenen in OpenClaw en welke momenteel gedocumenteerd zijn
title: Experimentele functies
x-i18n:
    generated_at: "2026-06-27T17:26:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentele functies in OpenClaw zijn **opt-in previewoppervlakken**. Ze staan
achter expliciete flags omdat ze nog praktijkervaring nodig hebben voordat ze
een stabiele standaard of een langlevend openbaar contract verdienen.

Behandel ze anders dan normale configuratie:

- Houd ze **standaard uitgeschakeld**, tenzij de bijbehorende documentatie aangeeft dat je er een moet proberen.
- Verwacht dat **vorm en gedrag sneller veranderen** dan bij stabiele configuratie.
- Geef eerst de voorkeur aan het stabiele pad wanneer dat al bestaat.
- Als je OpenClaw breed uitrolt, test experimentele flags dan eerst in een kleinere
  omgeving voordat je ze in een gedeelde baseline opneemt.

## Momenteel gedocumenteerde flags

| Oppervlak                | Sleutel                                                                                    | Gebruik dit wanneer                                                                                                             | Meer                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokale modelruntime      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Een kleinere of striktere lokale backend vastloopt op OpenClaw's volledige standaard tool-oppervlak                             | [Lokale modellen](/nl/gateway/local-models)                                                       |
| Geheugenzoekfunctie      | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Je wilt dat `memory_search` eerdere sessietranscripten indexeert en accepteert de extra opslag- en indexeringskosten            | [Geheugenconfiguratiereferentie](/nl/reference/memory-config#session-memory-search-experimental) |
| Codex-harness            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Je wilt dat native Codex app-server 0.132.0 of nieuwer een OpenClaw sandbox-ondersteunde exec-server target in plaats van Code Mode uit te schakelen | [Codex-harnessreferentie](/nl/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Gestructureerde planningstool | `tools.experimental.planTool`                                                              | Je wilt de gestructureerde `update_plan`-tool beschikbaar maken voor het volgen van meerstapswerk in compatibele runtimes en UI's | [Gateway-configuratiereferentie](/nl/gateway/config-tools#toolsexperimental)                    |

## Lean-modus voor lokaal model

`agents.defaults.experimental.localModelLean: true` is een overdrukventiel voor zwakkere lokale-modelopstellingen. Wanneer dit is ingeschakeld, verwijdert OpenClaw drie standaardtools — `browser`, `cron` en `message` — uit het tool-oppervlak van de agent voor elke beurt. Het zet die run ook standaard op gestructureerde Tool Search-besturingen wanneer `tools.toolSearch` niet expliciet is geconfigureerd, zodat grotere plugin-, MCP- of clienttoolcatalogi achter `tool_search`, `tool_describe` en `tool_call` blijven in plaats van in de prompt te worden gedumpt. Runs die directe `message`-levering vereisen, houden die tool direct in plaats van de Tool Search-standaard van lean-modus in te schakelen. Gebruik `agents.list[].experimental.localModelLean` om hetzelfde gedrag voor één geconfigureerde agent in of uit te schakelen.

### Waarom deze drie tools

Deze drie tools hebben de langste beschrijvingen en de meeste parametervormen in de standaard OpenClaw-runtime. Op een backend met kleine context of een striktere OpenAI-compatibele backend is dat het verschil tussen:

- Tool-schema's die netjes in de prompt passen tegenover schema's die gespreksgeschiedenis verdringen.
- Het model dat de juiste tool kiest tegenover misvormde tool-aanroepen doordat er te veel vergelijkbaar ogende schema's zijn.
- De Chat Completions-adapter die binnen de gestructureerde-uitvoerlimieten van de server blijft tegenover een 400 door de payloadgrootte van tool-aanroepen.

Het verwijderen ervan bedraadt OpenClaw niet stilzwijgend opnieuw — het maakt alleen de directe toollijst korter. Het model heeft nog steeds `read`, `write`, `edit`, `exec`, `apply_patch`, webzoek-/ophaalfuncties (wanneer geconfigureerd), geheugen en sessie-/agenttools beschikbaar. Extra catalogi blijven aanroepbaar via Tool Search, tenzij je expliciet `tools.toolSearch: false` instelt.

### Wanneer je dit inschakelt

Schakel lean-modus in wanneer je al hebt bewezen dat het model met de Gateway kan praten, maar volledige agentbeurten zich verkeerd gedragen. De typische signaalketen is:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` slaagt.
2. Een normale agentbeurt mislukt met misvormde tool-aanroepen, te grote prompts of doordat het model zijn tools negeert.
3. Het omschakelen van `localModelLean: true` verhelpt de fout.

### Wanneer je dit uitgeschakeld laat

Als je backend de volledige standaardruntime netjes afhandelt, laat dit dan uitgeschakeld. Lean-modus is een tijdelijke oplossing, geen standaard. Deze bestaat omdat sommige lokale stacks een kleiner tool-oppervlak nodig hebben om goed te werken; gehoste modellen en goed uitgeruste lokale systemen niet.

Lean-modus vervangt ook niet `tools.profile`, `tools.allow`/`tools.deny` of de uitweg `compat.supportsTools: false` van het model. Als je een permanent smaller tool-oppervlak nodig hebt voor een specifieke agent, geef dan de voorkeur aan die stabiele knoppen boven de experimentele flag.

Als je Tool Search al globaal afstemt, laat OpenClaw die operatorconfiguratie met rust. Stel `tools.toolSearch: false` in om je af te melden voor de Tool Search-standaard van lean-modus.

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

Alleen voor één agent:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Start de Gateway opnieuw nadat je de flag hebt gewijzigd en bevestig daarna de ingekorte toollijst met:

```bash
openclaw status --deep
```

De diepe statusuitvoer toont de actieve agenttools; `browser`, `cron` en `message` zouden afwezig moeten zijn wanneer lean-modus is ingeschakeld, tenzij de huidige leveringsmodus directe `message`-antwoorden afdwingt.

## Experimenteel betekent niet verborgen

Als een functie experimenteel is, moet OpenClaw dat duidelijk zeggen in de documentatie en in het
configuratiepad zelf. Wat het **niet** moet doen, is previewgedrag binnensmokkelen in een
stabiel ogende standaardknop en doen alsof dat normaal is. Zo worden configuratieoppervlakken
rommelig.

## Gerelateerd

- [Functies](/nl/concepts/features)
- [Releasekanalen](/nl/install/development-channels)
