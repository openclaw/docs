---
read_when:
    - Je wilt automatische Compaction en /compact begrijpen
    - Je debugt lange sessies die contextlimieten bereiken
summary: Hoe OpenClaw lange gesprekken samenvat om binnen modellimieten te blijven
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Elk model heeft een contextvenster: het maximale aantal tokens dat het kan verwerken. Wanneer een gesprek die limiet nadert, maakt OpenClaw **Compaction** van oudere berichten tot een samenvatting, zodat de chat kan doorgaan.

## Hoe het werkt

1. Oudere gespreksbeurten worden samengevat tot een compacte invoer.
2. De samenvatting wordt opgeslagen in het sessietranscript.
3. Recente berichten blijven intact.

Wanneer OpenClaw de geschiedenis opsplitst in Compaction-chunks, houdt het assistant-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-items. Als een splitspunt binnen een toolblok valt, verplaatst OpenClaw de grens zodat het paar bij elkaar blijft en de huidige niet-samengevatte staart behouden blijft.

De volledige gespreksgeschiedenis blijft op schijf staan. Compaction wijzigt alleen wat het model ziet bij de volgende beurt.

## Automatische Compaction

Automatische Compaction is standaard ingeschakeld. Deze wordt uitgevoerd wanneer de sessie de contextlimiet nadert, of wanneer het model een context-overflowfout retourneert (in dat geval voert OpenClaw Compaction uit en probeert het opnieuw).

Je ziet:

- `embedded run auto-compaction start` / `complete` in normale Gateway-logboeken.
- `🧹 Auto-compaction complete` in uitgebreide modus.
- `/status` met `🧹 Compactions: <count>`.

<Info>
Voordat Compaction wordt uitgevoerd, herinnert OpenClaw de agent er automatisch aan om belangrijke notities op te slaan in [geheugen](/nl/concepts/memory)-bestanden. Dit voorkomt contextverlies.
</Info>

<AccordionGroup>
  <Accordion title="Herkende overflow-handtekeningen">
    OpenClaw detecteert context-overflow op basis van deze foutpatronen van providers:

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

Wanneer `agents.defaults.compaction.keepRecentTokens` is ingesteld, respecteert handmatige Compaction dat Pi-knippunt en behoudt het de recente staart in de opnieuw opgebouwde context. Zonder expliciet bewaarb​​udget gedraagt handmatige Compaction zich als een hard controlepunt en gaat het alleen verder vanaf de nieuwe samenvatting.

## Configuratie

Configureer Compaction onder `agents.defaults.compaction` in je `openclaw.json`. De meest gebruikte knoppen staan hieronder; zie voor de volledige referentie [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction).

### Een ander model gebruiken

Standaard gebruikt Compaction het primaire model van de agent. Stel `agents.defaults.compaction.model` in om samenvatting te delegeren aan een krachtiger of gespecialiseerder model. De override accepteert elke `provider/model-id`-string:

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

Dit werkt ook met lokale modellen, bijvoorbeeld een tweede Ollama-model dat is toegewezen aan samenvatting:

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

Wanneer dit niet is ingesteld, start Compaction met het actieve sessiemodel. Als samenvatting mislukt met een providerfout die in aanmerking komt voor model-fallback, probeert OpenClaw die Compaction-poging opnieuw via de bestaande model-fallbackketen van de sessie. De fallbackkeuze is tijdelijk en wordt niet teruggeschreven naar de sessiestatus. Een expliciete override voor `agents.defaults.compaction.model` blijft exact en erft de sessie-fallbackketen niet.

### Behoud van identificatoren

Compaction-samenvatting behoudt standaard ondoorzichtige identificatoren (`identifierPolicy: "strict"`). Override met `identifierPolicy: "off"` om dit uit te schakelen, of met `identifierPolicy: "custom"` plus `identifierInstructions` voor aangepaste richtlijnen.

### Bytebewaking voor actief transcript

Wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld, activeert OpenClaw normale lokale Compaction vóór een run als de actieve JSONL die grootte bereikt. Dit is nuttig voor langlopende sessies waarin contextbeheer aan providerzijde de modelcontext gezond kan houden terwijl het lokale transcript blijft groeien. Het splitst geen ruwe JSONL-bytes; het vraagt de normale Compaction-pijplijn om een semantische samenvatting te maken.

<Warning>
De bytebewaking vereist `truncateAfterCompaction: true`. Zonder transcriptrotatie zou het actieve bestand niet krimpen en blijft de bewaking inactief.
</Warning>

### Opvolgende transcripts

Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld, herschrijft OpenClaw het bestaande transcript niet ter plekke. Het maakt een nieuw actief opvolgend transcript op basis van de Compaction-samenvatting, behouden status en niet-samengevatte staart, en bewaart vervolgens de vorige JSONL als gearchiveerde controlepuntbron.
Opvolgende transcripts verwijderen ook exacte dubbele lange gebruikersbeurten die binnen een kort retryvenster binnenkomen, zodat kanaal-retrystormen niet worden meegenomen naar het volgende actieve transcript na Compaction.

Pre-Compaction-controlepunten worden alleen behouden zolang ze onder de controlepuntgroottelimiet van OpenClaw blijven; te grote actieve transcripts worden nog steeds samengevat met Compaction, maar OpenClaw slaat de grote debug-snapshot over in plaats van het schijfgebruik te verdubbelen.

### Compaction-meldingen

Standaard draait Compaction stil. Stel `notifyUser` in om korte statusberichten te tonen wanneer Compaction start en is voltooid:

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

De override voor het geheugenflushmodel is exact en erft de actieve sessie-fallbackketen niet. Zie [Geheugen](/nl/concepts/memory) voor details en configuratie.

## Inplugbare Compaction-providers

Plugins kunnen een aangepaste Compaction-provider registreren via `registerCompactionProvider()` op de plugin-API. Wanneer een provider is geregistreerd en geconfigureerd, delegeert OpenClaw samenvatting daaraan in plaats van aan de ingebouwde LLM-pijplijn.

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

Het instellen van een `provider` forceert automatisch `mode: "safeguard"`. Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor behoud van identificatoren als het ingebouwde pad, en OpenClaw behoudt nog steeds recente-beurt- en gesplitste-beurt-achtervoegselcontext na provideruitvoer.

<Note>
Als de provider mislukt of een leeg resultaat retourneert, valt OpenClaw terug op ingebouwde LLM-samenvatting.
</Note>

## Compaction versus pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Wat het doet** | Vat ouder gesprek samen       | Kort oude toolresultaten in      |
| **Opgeslagen?**  | Ja (in sessietranscript)      | Nee (alleen in geheugen, per request) |
| **Bereik**       | Volledig gesprek              | Alleen toolresultaten            |

[Sessiepruning](/nl/concepts/session-pruning) is een lichter complement dat tooluitvoer inkort zonder samen te vatten.

## Probleemoplossing

**Te vaak Compaction?** Het contextvenster van het model is mogelijk klein, of tooluitvoer kan groot zijn. Probeer [sessiepruning](/nl/concepts/session-pruning) in te schakelen.

**Voelt de context verouderd na Compaction?** Gebruik `/compact Focus on <topic>` om de samenvatting te sturen, of schakel de [geheugenflush](/nl/concepts/memory) in zodat notities behouden blijven.

**Een schone lei nodig?** `/new` start een nieuwe sessie zonder Compaction.

Zie voor geavanceerde configuratie (reservetokens, behoud van identificatoren, aangepaste context-engines, OpenAI-serverzijdige Compaction) de [diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction).

## Gerelateerd

- [Sessie](/nl/concepts/session): sessiebeheer en levenscyclus.
- [Sessiepruning](/nl/concepts/session-pruning): toolresultaten inkorten.
- [Context](/nl/concepts/context): hoe context wordt opgebouwd voor agentbeurten.
- [Hooks](/nl/automation/hooks): Compaction-levenscyclushooks (`before_compaction`, `after_compaction`).
