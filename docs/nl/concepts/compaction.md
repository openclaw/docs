---
read_when:
    - Je wilt auto-Compaction en /compact begrijpen
    - Je debugt lange sessies die contextlimieten bereiken
summary: Hoe OpenClaw lange gesprekken samenvat om binnen modellimieten te blijven
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:25:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Elk model heeft een contextvenster: het maximale aantal tokens dat het kan verwerken. Wanneer een gesprek die limiet nadert, vat OpenClaw oudere berichten **samen via Compaction** zodat de chat kan doorgaan.

## Hoe het werkt

1. Oudere gespreksbeurten worden samengevat in een compacte vermelding.
2. De samenvatting wordt opgeslagen in het sessietranscript.
3. Recente berichten blijven intact.

Wanneer OpenClaw de geschiedenis opsplitst in Compaction-blokken, houdt het toolaanroepen van de assistant gekoppeld aan hun bijbehorende `toolResult`-vermeldingen. Als een splitspunt binnen een toolblok valt, verplaatst OpenClaw de grens zodat het paar bij elkaar blijft en het huidige niet-samengevatte staartdeel behouden blijft.

De volledige gespreksgeschiedenis blijft op schijf staan. Compaction verandert alleen wat het model in de volgende beurt ziet.

## Automatische Compaction

Automatische Compaction staat standaard aan. Deze wordt uitgevoerd wanneer de sessie de contextlimiet nadert, of wanneer het model een context-overflowfout retourneert (in dat geval voert OpenClaw Compaction uit en probeert het opnieuw).

Je ziet:

- `embedded run auto-compaction start` / `complete` in normale Gateway-logboeken.
- `🧹 Auto-compaction complete` in uitgebreide modus.
- `/status` met `🧹 Compactions: <count>`.

<Info>
Voordat Compaction wordt uitgevoerd, herinnert OpenClaw de agent er automatisch aan om belangrijke notities op te slaan in [geheugen](/nl/concepts/memory)-bestanden. Dit voorkomt contextverlies.
</Info>

<AccordionGroup>
  <Accordion title="Herkende overflowsignaturen">
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

Wanneer `agents.defaults.compaction.keepRecentTokens` is ingesteld, respecteert handmatige Compaction dat OpenClaw-knippunt en behoudt het het recente staartdeel in de opnieuw opgebouwde context. Zonder expliciet behoudsbudget gedraagt handmatige Compaction zich als een harde checkpoint en gaat het alleen verder vanaf de nieuwe samenvatting.

## Configuratie

Configureer Compaction onder `agents.defaults.compaction` in je `openclaw.json`. De meestgebruikte instellingen staan hieronder; zie voor de volledige referentie [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction).

### Een ander model gebruiken

Standaard gebruikt Compaction het primaire model van de agent. Stel `agents.defaults.compaction.model` in om samenvatting te delegeren aan een capabeler of gespecialiseerder model. De override accepteert een `provider/model-id`-tekenreeks of een kale alias die is geconfigureerd onder `agents.defaults.models`:

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

Kaal geconfigureerde aliassen worden herleid naar hun canonieke provider en model voordat Compaction start. Als een kale waarde zowel overeenkomt met een alias als met een geconfigureerde letterlijke model-ID, wint de letterlijke model-ID. Een niet-overeenkomende kale waarde blijft een model-ID op de actieve provider.

Dit werkt ook met lokale modellen, bijvoorbeeld een tweede Ollama-model dat is bedoeld voor samenvatting:

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

Wanneer dit niet is ingesteld, start Compaction met het actieve sessiemodel. Als samenvatting mislukt met een providerfout die in aanmerking komt voor modelfallback, probeert OpenClaw die Compaction-poging opnieuw via de bestaande modelfallbackketen van de sessie. De fallbackkeuze is tijdelijk en wordt niet teruggeschreven naar de sessiestatus. Een expliciete override van `agents.defaults.compaction.model` blijft exact en erft de sessiefallbackketen niet.

### Identificatoren behouden

Compaction-samenvatting behoudt standaard ondoorzichtige identificatoren (`identifierPolicy: "strict"`). Overschrijf dit met `identifierPolicy: "off"` om dit uit te schakelen, of met `identifierPolicy: "custom"` plus `identifierInstructions` voor aangepaste richtlijnen.

### Bytebewaking voor actief transcript

Wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld, activeert OpenClaw normale lokale Compaction vóór een run als de actieve JSONL die grootte bereikt. Dit is nuttig voor langlopende sessies waarbij contextbeheer aan providerzijde de modelcontext gezond kan houden terwijl het lokale transcript blijft groeien. Dit splitst geen ruwe JSONL-bytes; het vraagt de normale Compaction-pijplijn om een semantische samenvatting te maken.

<Warning>
De bytebewaking vereist `truncateAfterCompaction: true`. Zonder transcriptrotatie zou het actieve bestand niet krimpen en blijft de bewaking inactief.
</Warning>

### Opvolgertranscripten

Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld, herschrijft OpenClaw het bestaande transcript niet ter plekke. Het maakt een nieuw actief opvolgertranscript op basis van de Compaction-samenvatting, behouden status en het niet-samengevatte staartdeel, en registreert daarna checkpointmetadata die branch-/herstelflows naar die compacte opvolger verwijst.
Opvolgertranscripten verwijderen ook exacte dubbele lange gebruikersbeurten die binnen
een kort retryvenster binnenkomen, zodat retry-stormen van kanalen niet worden meegenomen naar het
volgende actieve transcript na Compaction.

OpenClaw schrijft niet langer afzonderlijke `.checkpoint.*.jsonl`-kopieën voor nieuwe
Compactions. Bestaande verouderde checkpointbestanden kunnen nog steeds worden gebruikt zolang ernaar wordt verwezen
en worden opgeschoond door normale sessieopschoning.

### Compaction-meldingen

Standaard wordt Compaction stil uitgevoerd. Stel `notifyUser` in om korte statusberichten te tonen wanneer Compaction start en voltooid is:

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

Vóór Compaction kan OpenClaw een **stille geheugenflush**-beurt uitvoeren om duurzame notities op schijf op te slaan. Stel `agents.defaults.compaction.memoryFlush.model` in wanneer deze onderhoudsbeurt een lokaal model moet gebruiken in plaats van het actieve gespreksmodel:

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

De override voor het geheugenflushmodel is exact en erft de actieve sessiefallbackketen niet. Zie [Geheugen](/nl/concepts/memory) voor details en configuratie.

## Inplugbare Compaction-providers

Plugins kunnen een aangepaste Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer een provider is geregistreerd en geconfigureerd, delegeert OpenClaw samenvatting daaraan in plaats van aan de ingebouwde LLM-pijplijn.

Stel de id ervan in je configuratie in om een geregistreerde provider te gebruiken:

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

Het instellen van een `provider` forceert automatisch `mode: "safeguard"`. Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor het behouden van identificatoren als het ingebouwde pad, en OpenClaw behoudt nog steeds recente-beurt- en gesplitste-beurt-achtervoegselcontext na provideruitvoer.

<Note>
Als de provider mislukt of een leeg resultaat retourneert, valt OpenClaw terug op ingebouwde LLM-samenvatting.
</Note>

## Compaction versus snoeien

|                  | Compaction                    | Snoeien                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Wat het doet** | Vat oudere gesprekken samen   | Kort oude toolresultaten in      |
| **Opgeslagen?**  | Ja (in sessietranscript)      | Nee (alleen in geheugen, per aanvraag) |
| **Bereik**       | Volledig gesprek              | Alleen toolresultaten            |

[Sessiesnoei](/nl/concepts/session-pruning) is een lichter aanvullend mechanisme dat tooluitvoer inkort zonder samen te vatten.

## Problemen oplossen

**Te vaak Compaction?** Het contextvenster van het model is mogelijk klein, of tooluitvoer is mogelijk groot. Probeer [sessiesnoei](/nl/concepts/session-pruning) in te schakelen.

**Voelt de context na Compaction verouderd aan?** Gebruik `/compact Focus on <topic>` om de samenvatting te sturen, of schakel de [geheugenflush](/nl/concepts/memory) in zodat notities behouden blijven.

**Een schone lei nodig?** `/new` start een nieuwe sessie zonder Compaction.

Zie voor geavanceerde configuratie (reserve-tokens, behoud van identificatoren, aangepaste context-engines, server-side Compaction van OpenAI) de [diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction).

## Gerelateerd

- [Sessie](/nl/concepts/session): sessiebeheer en levenscyclus.
- [Sessiesnoei](/nl/concepts/session-pruning): toolresultaten inkorten.
- [Context](/nl/concepts/context): hoe context wordt opgebouwd voor agentbeurten.
- [Hooks](/nl/automation/hooks): lifecycle-hooks voor Compaction (`before_compaction`, `after_compaction`).
