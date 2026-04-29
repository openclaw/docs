---
read_when:
    - Je wilt automatische Compaction en /compact begrijpen
    - Je debugt lange sessies die contextlimieten bereiken
summary: Hoe OpenClaw lange gesprekken samenvat om binnen de modellimieten te blijven
title: Compaction
x-i18n:
    generated_at: "2026-04-29T22:37:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Elk model heeft een contextvenster: het maximale aantal tokens dat het kan verwerken. Wanneer een gesprek die limiet nadert, **compacteert** OpenClaw oudere berichten tot een samenvatting zodat de chat kan doorgaan.

## Hoe het werkt

1. Oudere gespreksbeurten worden samengevat tot een compacte vermelding.
2. De samenvatting wordt opgeslagen in het sessietranscript.
3. Recente berichten blijven intact.

Wanneer OpenClaw de geschiedenis opsplitst in Compaction-chunks, houdt het toolaanroepen van de assistent gekoppeld aan hun bijbehorende `toolResult`-vermeldingen. Als een splitsingspunt binnen een toolblok valt, verplaatst OpenClaw de grens zodat het paar bij elkaar blijft en de huidige niet-samengevatte staart behouden blijft.

De volledige gespreksgeschiedenis blijft op schijf staan. Compaction verandert alleen wat het model bij de volgende beurt ziet.

## Automatische Compaction

Automatische Compaction staat standaard aan. Deze wordt uitgevoerd wanneer de sessie de contextlimiet nadert, of wanneer het model een context-overflowfout retourneert (in dat geval compacteert OpenClaw en probeert het opnieuw).

Je ziet:

- `🧹 Auto-compaction complete` in uitgebreide modus.
- `/status` toont `🧹 Compactions: <count>`.

<Info>
Vóór het compacteren herinnert OpenClaw de agent er automatisch aan om belangrijke notities op te slaan in [memory](/nl/concepts/memory)-bestanden. Dit voorkomt contextverlies.
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw detecteert context-overflow aan de hand van deze foutpatronen van providers:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Handmatige Compaction

Typ `/compact` in een chat om Compaction af te dwingen. Voeg instructies toe om de samenvatting te sturen:

```
/compact Focus on the API design decisions
```

Wanneer `agents.defaults.compaction.keepRecentTokens` is ingesteld, respecteert handmatige Compaction dat Pi-afkappunt en behoudt deze de recente staart in de opnieuw opgebouwde context. Zonder expliciet behoudsbudget gedraagt handmatige Compaction zich als een hard checkpoint en gaat deze alleen verder vanaf de nieuwe samenvatting.

## Configuratie

Configureer Compaction onder `agents.defaults.compaction` in je `openclaw.json`. De meest gebruikte knoppen staan hieronder; zie voor de volledige referentie [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction).

### Een ander model gebruiken

Standaard gebruikt Compaction het primaire model van de agent. Stel `agents.defaults.compaction.model` in om samenvatten te delegeren aan een krachtiger of gespecialiseerder model. De override accepteert elke `provider/model-id`-string:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Dit werkt ook met lokale modellen, bijvoorbeeld een tweede Ollama-model dat is toegewezen aan samenvatten:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Als dit niet is ingesteld, gebruikt Compaction het primaire model van de agent.

### Behoud van identifiers

Compaction-samenvatting behoudt standaard ondoorzichtige identifiers (`identifierPolicy: "strict"`). Overschrijf dit met `identifierPolicy: "off"` om dit uit te schakelen, of met `identifierPolicy: "custom"` plus `identifierInstructions` voor aangepaste richtlijnen.

### Bytebewaking voor actief transcript

Wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld, triggert OpenClaw normale lokale Compaction vóór een run als de actieve JSONL die grootte bereikt. Dit is nuttig voor langlopende sessies waarbij contextbeheer aan providerzijde de modelcontext gezond kan houden terwijl het lokale transcript blijft groeien. Het splitst geen ruwe JSONL-bytes; het vraagt de normale Compaction-pijplijn om een semantische samenvatting te maken.

<Warning>
De bytebewaking vereist `truncateAfterCompaction: true`. Zonder transcriptrotatie zou het actieve bestand niet krimpen en blijft de bewaking inactief.
</Warning>

### Opvolgende transcripts

Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld, herschrijft OpenClaw het bestaande transcript niet ter plekke. Het maakt een nieuw actief opvolgend transcript op basis van de Compaction-samenvatting, behouden status en niet-samengevatte staart, en bewaart vervolgens de vorige JSONL als de gearchiveerde checkpointbron.
Opvolgende transcripts laten ook exacte dubbele lange gebruikersbeurten vallen die binnen een kort retryvenster binnenkomen, zodat retry-stormen van kanalen niet worden meegenomen naar het volgende actieve transcript na Compaction.

Pre-Compaction-checkpoints worden alleen bewaard zolang ze onder de checkpointgroottelimiet van OpenClaw blijven; te grote actieve transcripts worden nog steeds gecompacteerd, maar OpenClaw slaat de grote debug-snapshot over in plaats van het schijfgebruik te verdubbelen.

### Compaction-meldingen

Standaard draait Compaction stil. Stel `notifyUser` in om korte statusberichten te tonen wanneer Compaction start en voltooid is:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Geheugenflush

Vóór Compaction kan OpenClaw een **stille geheugenflush**-beurt uitvoeren om duurzame notities op schijf op te slaan. Stel `agents.defaults.compaction.memoryFlush.model` in wanneer deze huishoudelijke beurt een lokaal model moet gebruiken in plaats van het actieve gespreksmodel:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

De modeloverride voor geheugenflush is exact en erft de fallbackketen van de actieve sessie niet. Zie [Geheugen](/nl/concepts/memory) voor details en configuratie.

## Inplugbare Compaction-providers

Plugins kunnen een aangepaste Compaction-provider registreren via `registerCompactionProvider()` in de Plugin-API. Wanneer een provider is geregistreerd en geconfigureerd, delegeert OpenClaw samenvatten hieraan in plaats van aan de ingebouwde LLM-pijplijn.

Stel de id in je configuratie in om een geregistreerde provider te gebruiken:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Het instellen van een `provider` forceert automatisch `mode: "safeguard"`. Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor identifierbehoud als het ingebouwde pad, en OpenClaw behoudt nog steeds recente-beurt- en gesplitste-beurt-suffixcontext na provideruitvoer.

<Note>
Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw terug op ingebouwde LLM-samenvatting.
</Note>

## Compaction versus snoeien

|                  | Compaction                   | Snoeien                               |
| ---------------- | ---------------------------- | ------------------------------------- |
| **Wat het doet** | Vat ouder gesprek samen      | Kort oude toolresultaten in           |
| **Opgeslagen?**  | Ja (in sessietranscript)     | Nee (alleen in geheugen, per verzoek) |
| **Scope**        | Volledig gesprek             | Alleen toolresultaten                 |

[Sessiesnoei](/nl/concepts/session-pruning) is een lichtere aanvulling die tooluitvoer inkort zonder samen te vatten.

## Problemen oplossen

**Te vaak compacteren?** Het contextvenster van het model is mogelijk klein, of tooluitvoer is mogelijk groot. Probeer [sessiesnoei](/nl/concepts/session-pruning) in te schakelen.

**Context voelt verouderd na Compaction?** Gebruik `/compact Focus on <topic>` om de samenvatting te sturen, of schakel de [geheugenflush](/nl/concepts/memory) in zodat notities behouden blijven.

**Een schone lei nodig?** `/new` start een nieuwe sessie zonder te compacteren.

Zie voor geavanceerde configuratie (reserve-tokens, identifierbehoud, aangepaste contextengines, OpenAI-server-side Compaction) de [diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction).

## Gerelateerd

- [Sessie](/nl/concepts/session): sessiebeheer en levenscyclus.
- [Sessiesnoei](/nl/concepts/session-pruning): toolresultaten inkorten.
- [Context](/nl/concepts/context): hoe context wordt opgebouwd voor agentbeurten.
- [Hooks](/nl/automation/hooks): levenscyclushooks voor Compaction (`before_compaction`, `after_compaction`).
