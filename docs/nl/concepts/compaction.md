---
read_when:
    - Je wilt automatische Compaction en /compact begrijpen
    - Je debugt lange sessies die tegen contextlimieten aanlopen
summary: Hoe OpenClaw lange gesprekken samenvat om binnen modellimieten te blijven
title: Compaction
x-i18n:
    generated_at: "2026-05-02T11:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

Elk model heeft een contextvenster: het maximale aantal tokens dat het kan verwerken. Wanneer een gesprek die limiet nadert, **compacteert** OpenClaw oudere berichten tot een samenvatting zodat de chat kan doorgaan.

## Hoe het werkt

1. Oudere gespreksrondes worden samengevat tot een compacte invoer.
2. De samenvatting wordt opgeslagen in het sessietranscript.
3. Recente berichten blijven intact.

Wanneer OpenClaw de geschiedenis splitst in Compaction-fragmenten, houdt het toolaanroepen van de assistent gekoppeld aan hun bijbehorende `toolResult`-items. Als een splitspunt binnen een toolblok valt, verplaatst OpenClaw de grens zodat het paar bij elkaar blijft en de huidige niet-samengevatte staart behouden blijft.

De volledige gespreksgeschiedenis blijft op schijf staan. Compaction verandert alleen wat het model bij de volgende beurt ziet.

## Auto-compaction

Auto-compaction is standaard ingeschakeld. Dit wordt uitgevoerd wanneer de sessie de contextlimiet nadert, of wanneer het model een context-overflowfout retourneert (in dat geval compacteert OpenClaw en probeert het opnieuw).

Je ziet:

- `🧹 Auto-compaction complete` in uitgebreide modus.
- `/status` toont `🧹 Compactions: <count>`.

<Info>
Voordat er wordt gecompacteerd, herinnert OpenClaw de agent er automatisch aan om belangrijke notities op te slaan in [geheugen](/nl/concepts/memory)-bestanden. Dit voorkomt contextverlies.
</Info>

<AccordionGroup>
  <Accordion title="Herkende overflowhandtekeningen">
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

Typ `/compact` in een chat om Compaction te forceren. Voeg instructies toe om de samenvatting te sturen:

```
/compact Focus on the API design decisions
```

Wanneer `agents.defaults.compaction.keepRecentTokens` is ingesteld, respecteert handmatige Compaction dat Pi-snijpunt en behoudt het de recente staart in de opnieuw opgebouwde context. Zonder een expliciet behoudsbudget gedraagt handmatige Compaction zich als een harde checkpoint en gaat verder vanaf alleen de nieuwe samenvatting.

## Configuratie

Configureer Compaction onder `agents.defaults.compaction` in je `openclaw.json`. De meestgebruikte knoppen staan hieronder; zie [diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction) voor de volledige referentie.

### Een ander model gebruiken

Standaard gebruikt Compaction het primaire model van de agent. Stel `agents.defaults.compaction.model` in om samenvatting uit te besteden aan een capabeler of gespecialiseerder model. De overschrijving accepteert elke `provider/model-id`-tekenreeks:

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

Wanneer dit niet is ingesteld, start Compaction met het actieve sessiemodel. Als samenvatting mislukt met een providerfout die in aanmerking komt voor model-fallback, probeert OpenClaw die Compaction-poging opnieuw via de bestaande model-fallbackketen van de sessie. De fallbackkeuze is tijdelijk en wordt niet teruggeschreven naar de sessiestatus. Een expliciete overschrijving van `agents.defaults.compaction.model` blijft exact en erft de sessie-fallbackketen niet.

### Behoud van identifiers

Compaction-samenvatting behoudt standaard ondoorzichtige identifiers (`identifierPolicy: "strict"`). Overschrijf met `identifierPolicy: "off"` om dit uit te schakelen, of met `identifierPolicy: "custom"` plus `identifierInstructions` voor aangepaste richtlijnen.

### Bytebewaking voor actief transcript

Wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld, activeert OpenClaw normale lokale Compaction vóór een run als de actieve JSONL die grootte bereikt. Dit is nuttig voor langlopende sessies waarbij contextbeheer aan providerzijde de modelcontext gezond kan houden terwijl het lokale transcript blijft groeien. Het splitst geen ruwe JSONL-bytes; het vraagt de normale Compaction-pijplijn om een semantische samenvatting te maken.

<Warning>
De bytebewaking vereist `truncateAfterCompaction: true`. Zonder transcriptrotatie zou het actieve bestand niet krimpen en blijft de bewaking inactief.
</Warning>

### Opvolgende transcripties

Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld, herschrijft OpenClaw het bestaande transcript niet op zijn plek. Het maakt een nieuw actief opvolgend transcript op basis van de Compaction-samenvatting, behouden status en niet-samengevatte staart, en behoudt vervolgens de vorige JSONL als de gearchiveerde checkpointbron.
Opvolgende transcripties verwijderen ook exacte dubbele lange gebruikersbeurten die binnen een kort retryvenster binnenkomen, zodat kanaal-retrystormen niet worden meegenomen naar het volgende actieve transcript na Compaction.

Pre-Compaction-checkpoints worden alleen bewaard zolang ze onder de checkpointgroottelimiet van OpenClaw blijven; te grote actieve transcripties worden nog steeds gecompacteerd, maar OpenClaw slaat de grote debugsnapshot over in plaats van het schijfgebruik te verdubbelen.

### Compaction-meldingen

Standaard draait Compaction stil. Stel `notifyUser` in om korte statusberichten te tonen wanneer Compaction start en wordt voltooid:

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

Voor Compaction kan OpenClaw een **stille geheugenflush**-beurt uitvoeren om duurzame notities op schijf op te slaan. Stel `agents.defaults.compaction.memoryFlush.model` in wanneer deze onderhoudsbeurt een lokaal model moet gebruiken in plaats van het actieve gespreksmodel:

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

De modeloverschrijving voor geheugenflush is exact en erft de fallbackketen van de actieve sessie niet. Zie [Geheugen](/nl/concepts/memory) voor details en configuratie.

## Inplugbare Compaction-providers

Plugins kunnen een aangepaste Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer een provider is geregistreerd en geconfigureerd, besteedt OpenClaw samenvatting daaraan uit in plaats van aan de ingebouwde LLM-pijplijn.

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

Het instellen van een `provider` forceert automatisch `mode: "safeguard"`. Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor identifierbehoud als het ingebouwde pad, en OpenClaw behoudt nog steeds recente-beurt- en split-beurt-achtervoegselcontext na provideruitvoer.

<Note>
Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw terug op ingebouwde LLM-samenvatting.
</Note>

## Compaction versus pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Wat het doet** | Vat oudere conversatie samen | Kort oude toolresultaten in      |
| **Opgeslagen?**  | Ja (in sessietranscript)      | Nee (alleen in geheugen, per verzoek) |
| **Bereik**       | Volledige conversatie         | Alleen toolresultaten            |

[Sessiepruning](/nl/concepts/session-pruning) is een lichtere aanvulling die tooluitvoer inkort zonder samen te vatten.

## Probleemoplossing

**Te vaak compacten?** Het contextvenster van het model is mogelijk klein, of tooluitvoer is mogelijk groot. Probeer [sessiepruning](/nl/concepts/session-pruning) in te schakelen.

**Context voelt verouderd na Compaction?** Gebruik `/compact Focus on <topic>` om de samenvatting te sturen, of schakel de [geheugenflush](/nl/concepts/memory) in zodat notities behouden blijven.

**Een schone lei nodig?** `/new` start een nieuwe sessie zonder te compacten.

Zie de [diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction) voor geavanceerde configuratie (gereserveerde tokens, identifierbehoud, aangepaste context-engines, server-side Compaction van OpenAI).

## Gerelateerd

- [Sessie](/nl/concepts/session): sessiebeheer en levenscyclus.
- [Sessiepruning](/nl/concepts/session-pruning): toolresultaten inkorten.
- [Context](/nl/concepts/context): hoe context wordt opgebouwd voor agentbeurten.
- [Hooks](/nl/automation/hooks): Compaction-levenscyclushooks (`before_compaction`, `after_compaction`).
