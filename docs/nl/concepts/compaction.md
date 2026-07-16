---
read_when:
    - Je wilt auto-compaction en /compact begrijpen
    - Je debugt lange sessies die tegen de contextlimieten aanlopen
summary: Hoe OpenClaw lange gesprekken samenvat om binnen de modellimieten te blijven
title: Compaction
x-i18n:
    generated_at: "2026-07-16T15:40:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Elk model heeft een contextvenster: het maximale aantal tokens dat het kan verwerken. Wanneer een gesprek die limiet nadert, **compacteert** OpenClaw oudere berichten tot een samenvatting, zodat de chat kan doorgaan.

## Hoe het werkt

1. Oudere gespreksbeurten worden samengevat tot een compacte vermelding.
2. De samenvatting wordt opgeslagen in het sessietranscript.
3. Recente berichten blijven intact.

OpenClaw houdt toolaanroepen van de assistent gekoppeld aan de bijbehorende `toolResult`-vermeldingen wanneer het een splitsingspunt voor Compaction kiest. Als het punt binnen een toolblok valt, verplaatst OpenClaw de grens zodat het paar bij elkaar blijft en het huidige niet-samengevatte uiteinde behouden blijft.

De volledige gespreksgeschiedenis blijft op schijf staan. Compaction verandert alleen wat het model bij de volgende beurt ziet.

<Note>
Nieuwe configuraties stellen `agents.defaults.compaction.mode` standaard in op `"safeguard"` (strengere beveiligingsmaatregelen, kwaliteitscontroles van samenvattingen). Stel `mode: "default"` expliciet in om dit uit te schakelen.
</Note>

## Automatische Compaction

Automatische Compaction is standaard ingeschakeld. Deze wordt uitgevoerd wanneer de sessie de contextlimiet nadert of wanneer het model een fout wegens contextoverschrijding retourneert (in dat geval voert OpenClaw Compaction uit en probeert het opnieuw).

Je ziet:

- `embedded run auto-compaction start` / `complete` in normale Gateway-logboeken.
- `🧹 Auto-compaction complete` in uitgebreide modus.
- `/status` met `🧹 Compactions: <count>`.

<Info>
Vóór Compaction herinnert OpenClaw de agent er automatisch aan belangrijke notities in [geheugenbestanden](/nl/concepts/memory) op te slaan. Dit voorkomt contextverlies.
</Info>

<AccordionGroup>
  <Accordion title="Patronen voor overloopfouten die OpenClaw herkent">
    OpenClaw herkent tientallen providerspecifieke foutmeldingen voor contextoverschrijding (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter en meer). Veelvoorkomende voorbeelden:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Handmatige Compaction

Typ `/compact` in een chat om Compaction af te dwingen. Voeg instructies toe om de samenvatting te sturen:

```text
/compact Focus op de ontwerpbeslissingen voor de API
```

Wanneer `agents.defaults.compaction.keepRecentTokens` is ingesteld (standaard: 20,000), respecteert handmatige Compaction dat afkappunt en blijft het recente uiteinde in de opnieuw opgebouwde context behouden. Zonder een expliciet behoudbudget werkt handmatige Compaction als een hard controlepunt en gaat deze alleen verder vanaf de nieuwe samenvatting.

## Configuratie

Configureer Compaction onder `agents.defaults.compaction` in je `openclaw.json`. De meestgebruikte instellingen staan hieronder; zie [Uitgebreide uitleg over sessiebeheer](/nl/reference/session-management-compaction) voor de volledige referentie.

### Een ander model gebruiken

Compaction gebruikt standaard het primaire model van de agent. Stel `agents.defaults.compaction.model` in om het samenvatten aan een krachtiger of gespecialiseerd model te delegeren. De overschrijving accepteert een `provider/model-id`-tekenreeks of een kale alias die onder `agents.defaults.models` is geconfigureerd:

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

Kale geconfigureerde aliassen worden vóór het begin van Compaction omgezet naar hun canonieke provider en model. Als een kale waarde overeenkomt met zowel een alias als een geconfigureerde letterlijke model-ID, krijgt de letterlijke model-ID voorrang. Een niet-overeenkomende kale waarde blijft een model-ID bij de actieve provider.

Dit werkt ook met lokale modellen, bijvoorbeeld een tweede Ollama-model dat specifiek voor samenvattingen wordt gebruikt:

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

Wanneer dit niet is ingesteld, begint Compaction met het actieve sessiemodel. Als het samenvatten mislukt met een providerfout die voor modelterugval in aanmerking komt, probeert OpenClaw die Compaction-poging opnieuw via de bestaande modelterugvalketen van de sessie. De terugvalkeuze is tijdelijk en wordt niet naar de sessiestatus teruggeschreven. Een expliciete overschrijving met `agents.defaults.compaction.model` blijft exact en neemt de terugvalketen van de sessie niet over.

### Behoud van identificatoren

Compaction-samenvattingen behouden standaard ondoorzichtige identificatoren (`identifierPolicy: "strict"`). Overschrijf dit met `identifierPolicy: "off"` om het uit te schakelen, of met `identifierPolicy: "custom"` plus `identifierInstructions` voor aangepaste instructies.

### Bytebeveiliging voor actieve transcripties

Wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld, activeert OpenClaw
normale lokale Compaction vóór een uitvoering als de transcriptgeschiedenis
die grootte bereikt. Dit is nuttig voor langlopende sessies waarbij contextbeheer
aan de providerzijde de modelcontext gezond kan houden terwijl de opgeslagen
transcriptgeschiedenis blijft groeien. Het splitst geen onbewerkte bytes; het vraagt
de normale Compaction-pijplijn om een semantische samenvatting te maken.

<Warning>
De bytebeveiliging is van toepassing op de actieve SQLite-transcriptgeschiedenis. Verouderde JSONL-
controlepuntartefacten zijn niet het actieve doel voor Compaction.
</Warning>

### Opvolgende transcripties

Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld, herschrijft OpenClaw het bestaande transcript niet ter plaatse. Het maakt een nieuw actief opvolgend transcript op basis van de Compaction-samenvatting, de behouden status en het niet-samengevatte uiteinde. Vervolgens registreert het controlepuntmetadata die vertakkings- en herstelstromen naar die gecompacteerde opvolger verwijzen.
Opvolgende transcripties verwijderen ook exact dubbele lange gebruikersbeurten die
binnen een kort venster voor nieuwe pogingen binnenkomen, zodat stormen van nieuwe kanaalpogingen
na Compaction niet naar het volgende actieve transcript worden meegenomen.

OpenClaw schrijft niet langer afzonderlijke `.checkpoint.*.jsonl`-kopieën voor nieuwe
Compaction-bewerkingen. Bestaande verouderde controlepuntbestanden kunnen nog steeds worden gebruikt zolang ernaar wordt verwezen
en worden verwijderd door de normale sessieopschoning.

### Compaction-meldingen

Compaction wordt standaard stil uitgevoerd. Stel `notifyUser` in om korte statusberichten weer te geven wanneer Compaction begint en voltooid is, en om een melding over verminderde werking te tonen wanneer een geheugenspoeling vóór Compaction is uitgeput maar het antwoord toch doorgaat:

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

### Geheugenspoeling

Vóór Compaction kan OpenClaw een **stille geheugenspoelingsbeurt** uitvoeren om duurzame notities op schijf op te slaan. Stel `agents.defaults.compaction.memoryFlush.model` in wanneer deze onderhoudsbeurt een lokaal model moet gebruiken in plaats van het actieve gespreksmodel:

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

De overschrijving van het geheugenspoelingsmodel is exact en neemt de terugvalketen van de actieve sessie niet over. Zie [Geheugen](/nl/concepts/memory) voor details en configuratie.

## Verwisselbare Compaction-providers

Plugins kunnen via `registerCompactionProvider()` in de Plugin-API een aangepaste Compaction-provider registreren. Wanneer een provider is geregistreerd en geconfigureerd, delegeert OpenClaw het samenvatten eraan in plaats van aan de ingebouwde LLM-pijplijn.

Stel de ID van een geregistreerde provider in je configuratie in om deze te gebruiken:

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

Het instellen van een `provider` dwingt automatisch `mode: "safeguard"` af. Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor het behoud van identificatoren als het ingebouwde pad, en OpenClaw behoudt na de provideruitvoer nog steeds de suffixcontext van recente en gesplitste beurten.

<Note>
Als de provider mislukt of een leeg resultaat retourneert, valt OpenClaw terug op ingebouwde LLM-samenvatting.
</Note>

## Compaction versus opschonen

|                  | Compaction                           | Opschonen                              |
| ---------------- | ------------------------------------ | -------------------------------------- |
| **Wat het doet** | Vat oudere gesprekken samen          | Kort oude toolresultaten in            |
| **Opgeslagen?**  | Ja (in het sessietranscript)          | Nee (alleen in het geheugen, per verzoek) |
| **Bereik**       | Het volledige gesprek                 | Alleen toolresultaten                   |

[Sessieopschoning](/nl/concepts/session-pruning) is een lichtere aanvulling die tooluitvoer inkort zonder deze samen te vatten.

## Probleemoplossing

**Te vaak Compaction?** Het contextvenster van het model kan klein zijn of de tooluitvoer kan groot zijn. Probeer [sessieopschoning](/nl/concepts/session-pruning) in te schakelen.

**Voelt de context na Compaction verouderd aan?** Gebruik `/compact Focus on <topic>` om de samenvatting te sturen, of schakel de [geheugenspoeling](/nl/concepts/memory) in zodat notities behouden blijven.

**Een schone lei nodig?** `/new` start een nieuwe sessie zonder Compaction.

Zie de [Uitgebreide uitleg over sessiebeheer](/nl/reference/session-management-compaction) voor geavanceerde configuratie (gereserveerde tokens, behoud van identificatoren, aangepaste contextengines, OpenAI Compaction aan de serverzijde).

## Gerelateerd

- [Sessie](/nl/concepts/session): sessiebeheer en levenscyclus.
- [Sessieopschoning](/nl/concepts/session-pruning): toolresultaten inkorten.
- [Context](/nl/concepts/context): hoe context voor agentbeurten wordt opgebouwd.
- [Hooks](/nl/automation/hooks): levenscyclus-hooks voor Compaction (`before_compaction`, `after_compaction`).
