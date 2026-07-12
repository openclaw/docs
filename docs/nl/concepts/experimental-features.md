---
read_when:
    - Je ziet een configuratiesleutel ``.experimental`` en wilt weten of deze stabiel is
    - U wilt runtimefuncties in voorvertoning uitproberen zonder ze te verwarren met de normale standaardinstellingen
    - U wilt één plek waar u de momenteel gedocumenteerde experimentele vlaggen kunt vinden
summary: Wat experimentele vlaggen in OpenClaw betekenen en welke momenteel zijn gedocumenteerd
title: Experimentele functies
x-i18n:
    generated_at: "2026-07-12T08:45:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentele functies zijn previewmogelijkheden waarvoor u zich expliciet moet aanmelden via specifieke vlaggen. Ze moeten zich verder in de praktijk bewijzen voordat ze een stabiele standaardinstelling of langdurig contract krijgen.

- Standaard uitgeschakeld, tenzij documentatie aangeeft dat u er een moet inschakelen.
- Vorm en gedrag kunnen sneller veranderen dan stabiele configuratie.
- Geef de voorkeur aan een stabiele aanpak als die al bestaat.
- Rol pas breed uit nadat u eerst in een kleinere omgeving hebt getest.

## Momenteel gedocumenteerde vlaggen

| Onderdeel                | Sleutel                                                                                    | Gebruik dit wanneer                                                                                                                          | Meer                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokale modelruntime      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Een kleinere of strengere lokale backend vastloopt op het volledige standaardaanbod aan tools van OpenClaw                                  | [Lokale modellen](/nl/gateway/local-models)                                                      |
| Geheugen doorzoeken      | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | U wilt dat `memory_search` transcripties van eerdere sessies indexeert en accepteert de extra kosten voor opslag en indexering                | [Naslag voor geheugenconfiguratie](/nl/reference/memory-config#session-memory-search-experimental) |
| Codex-harnas             | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | U wilt dat de native Codex-appserver 0.132.0 of nieuwer een door een OpenClaw-sandbox ondersteunde exec-server gebruikt in plaats van Code Mode uit te schakelen | [Naslag voor het Codex-harnas](/nl/plugins/codex-harness-reference#sandboxed-native-execution)    |
| Tool voor gestructureerde planning | `tools.experimental.planTool`                                                     | U wilt de gestructureerde tool `update_plan` beschikbaar stellen voor het volgen van werk met meerdere stappen in compatibele runtimes en UI's | [Naslag voor Gateway-configuratie](/nl/gateway/config-tools#toolsexperimental)                    |

## Lichtgewicht modus voor lokale modellen

`agents.defaults.experimental.localModelLean: true` verwijdert bij elke beurt zware optionele tools uit het directe aanbod van de agent: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` en `pdf`. Expliciet toegestane tools of tools die vereist zijn voor aflevering blijven beschikbaar, hoewel Tool Search ze mogelijk catalogiseert in plaats van rechtstreeks beschikbaar te stellen. De lichtgewicht modus stelt catalogi van plugins, MCP en clients ook standaard in op gestructureerde Tool Search (`tool_search`, `tool_describe`, `tool_call`) wanneer `tools.toolSearch` nog niet is ingesteld. Gebruik `agents.list[].experimental.localModelLean` om dit tot één agent te beperken.

Als u Tool Search al globaal afstemt, laat OpenClaw die configuratie ongewijzigd. Stel `tools.toolSearch: false` in om de standaardinstelling voor Tool Search van de lichtgewicht modus uit te schakelen.

In de gestructureerde `tools`-modus houden lichtgewicht uitvoeringen `exec` rechtstreeks zichtbaar naast de bedieningselementen van Tool Search, zodat lokale modellen die op programmeren zijn afgestemd nog steeds hun vertrouwde shell-route kunnen kiezen. Dit verandert alleen de zichtbaarheid van het schema: normaal toolbeleid, sandboxing en goedkeuringen voor `exec` blijven van toepassing. Expliciete modi `code` en `directory` behouden hun normale Compaction-gedrag.

### Waarom deze tools

Deze tools hebben de grootste beschrijvingen, de breedste parameterstructuren of de grootste kans dat ze een klein model afleiden van het normale programmeer- en gesprekspad. Bij een backend met een kleine context of een strengere OpenAI-compatibele backend maakt dat het verschil tussen:

- Toolschema's die in de prompt passen tegenover schema's die de gespreksgeschiedenis verdringen.
- Het model dat de juiste tool kiest tegenover ongeldige toolaanroepen door te veel vergelijkbare schema's.
- De Chat Completions-adapter die binnen de limieten voor gestructureerde uitvoer blijft tegenover een 400-fout vanwege de grootte van de payload voor toolaanroepen.

Door ze te verwijderen, wordt alleen de directe lijst met tools korter. Het model beschikt nog steeds over `read`, `write`, `edit`, `exec`, `apply_patch`, beeldbegrip, zoeken en ophalen op het web (indien geconfigureerd), geheugen en tools voor sessies en agents. Aanvullende catalogi blijven bereikbaar via Tool Search, tenzij u `tools.toolSearch: false` instelt; met expliciete toestemmingen voor tools kan een lichtgewicht agent opnieuw deelnemen aan een afgeslankte workflow.

### Wanneer u dit inschakelt

Schakel de lichtgewicht modus in zodra u hebt aangetoond dat het model met de Gateway kan communiceren, maar volledige agentbeurten niet goed werken:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` slaagt.
2. Een normale agentbeurt mislukt door ongeldige toolaanroepen, te grote prompts of doordat het model zijn tools negeert.
3. Het instellen van `localModelLean: true` verhelpt de fout.

### Wanneer u dit uitgeschakeld laat

Als uw backend de volledige standaardruntime probleemloos afhandelt, laat u dit uitgeschakeld. Het is een tijdelijke oplossing voor lokale stacks die een kleiner toolaanbod nodig hebben, geen standaardinstelling voor gehoste modellen of lokale systemen met voldoende middelen.

De lichtgewicht modus vervangt `tools.profile`, `tools.allow`/`tools.deny` of de uitweg via `compat.supportsTools: false` van het model niet. Voor een permanent kleiner toolaanbod voor een specifieke agent geeft u de voorkeur aan deze stabiele instellingen.

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

Start de Gateway opnieuw nadat u de vlag hebt gewijzigd. Lichtgewicht filtering verwijdert `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` en `pdf`, tenzij u ze expliciet behoudt met `tools.allow` of `tools.alsoAllow`; Tool Search kan behouden tools nog steeds catalogiseren in plaats van ze rechtstreeks beschikbaar te stellen.

## Experimenteel betekent niet verborgen

Bij een experimentele functie moet dit duidelijk in de documentatie en in het configuratiepad zelf worden vermeld, in plaats van deze te verbergen achter een standaardinstelling die er stabiel uitziet.

## Gerelateerd

- [Functies](/nl/concepts/features)
- [Releasekanalen](/nl/install/development-channels)
