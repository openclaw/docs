---
read_when:
    - Zichtbare voortgangsupdates configureren voor langlopende chatbeurten
    - Kiezen tussen gedeeltelijke, blok- en voortgangsstreamingmodi
    - Uitleg over hoe OpenClaw één kanaalbericht bijwerkt terwijl het werk wordt uitgevoerd
    - Problemen oplossen met voortgangsconcepten, zelfstandige voortgangsberichten of terugval bij finalisatie
summary: 'Voortgangsconcepten: één zichtbaar bericht over lopend werk dat wordt bijgewerkt terwijl een agent draait'
title: Voortgangsconcepten
x-i18n:
    generated_at: "2026-05-03T21:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Voortgangsconcepten laten langlopende agentbeurten levendig aanvoelen in chat zonder
het gesprek te veranderen in een stapel tijdelijke statusantwoorden.

Wanneer voortgangsconcepten zijn ingeschakeld, maakt OpenClaw één zichtbaar
werk-in-uitvoeringbericht aan, werkt het bij terwijl de agent leest, plant,
tools aanroept of op goedkeuring wacht, en zet dat concept vervolgens om in het
definitieve antwoord wanneer het kanaal dat veilig kan doen.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Gebruik voortgangsconcepten wanneer je één nette statusmelding wilt tijdens
tool-intensief werk en het definitieve antwoord wanneer de beurt klaar is.

## Snel Aan De Slag

Schakel voortgangsconcepten per kanaal in met `streaming.mode: "progress"`:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Dat is meestal genoeg. OpenClaw kiest automatisch een label van één woord, voegt
compacte voortgangsregels toe terwijl nuttig werk gebeurt, en onderdrukt
dubbele losse voortgangspraat voor die beurt.

## Wat Gebruikers Zien

Een voortgangsconcept heeft twee delen:

| Deel              | Doel                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Label             | Een korte titel zoals `Thinking` of `Shelling`.                      |
| Voortgangsregels  | Compacte run-updates zoals toolaanroepen, taakstappen of goedkeuringen. |

Het label verschijnt direct wanneer de agent begint te antwoorden. Voortgangsregels
worden alleen toegevoegd wanneer de agent nuttige werkupdates uitstuurt. Het
definitieve antwoord vervangt het concept wanneer dat mogelijk is; anders stuurt
OpenClaw het definitieve antwoord normaal en ruimt het concept op of stopt het
met bijwerken ervan volgens het transport van het kanaal.

## Kies Een Modus

`channels.<channel>.streaming.mode` bepaalt het zichtbare gedrag tijdens werk in uitvoering:

| Modus      | Beste voor                         | Wat verschijnt in chat                              |
| ---------- | ---------------------------------- | --------------------------------------------------- |
| `off`      | Stille kanalen                     | Alleen het definitieve antwoord.                    |
| `partial`  | Antwoordtekst zien verschijnen     | Eén concept dat wordt bewerkt met de nieuwste antwoordtekst. |
| `block`    | Grotere antwoordvoorbeeldblokken   | Eén voorbeeld dat wordt bijgewerkt of aangevuld in grotere blokken. |
| `progress` | Tool-intensieve of langlopende beurten | Eén statusconcept, daarna het definitieve antwoord. |

Kies `progress` wanneer gebruikers meer geven om "wat er gebeurt" dan om het
antwoord token voor token te zien streamen.

Kies `partial` wanneer het antwoord zelf het voortgangssignaal is.

Kies `block` wanneer je conceptvoorbeeldupdates in grotere tekstblokken wilt. Op
Discord en Telegram is `streaming.mode: "block"` nog steeds voorbeeldstreaming,
niet normale bloklevering. Gebruik `streaming.block.enabled` of legacy
`blockStreaming` wanneer je normale blokantwoorden wilt.

## Labels Configureren

Voortgangslabels staan onder `channels.<channel>.streaming.progress`.

Het standaardlabel is `auto`, dat kiest uit OpenClaw's ingebouwde pool met
labels van één woord:

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

Gebruik een vast label:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Gebruik je eigen automatische labelpool:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Verberg het label en toon alleen voortgangsregels:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Voortgangsregels Beheren

Voortgangsregels zijn standaard ingeschakeld in voortgangsmodus. Ze komen uit
echte run-events: toolstarts, itemupdates, taakplannen, goedkeuringen,
commando-uitvoer, patchsamenvattingen en vergelijkbare agentactiviteit.

Beperk hoeveel regels zichtbaar blijven:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Behoud het enkele voortgangsconcept maar verberg tool- en taakregels:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Met `toolProgress: false` onderdrukt OpenClaw nog steeds de oudere losse
toolvoortgangsberichten voor die beurt. Het kanaal blijft visueel rustig tot het
definitieve antwoord, behalve het label als er een is geconfigureerd.

## Kanaalgedrag

Elk kanaal gebruikt het schoonste transport dat het ondersteunt:

| Kanaal          | Voortgangstransport                 | Opmerkingen                                                           |
| --------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Discord         | Stuur één bericht en bewerk het daarna. | Definitieve tekst wordt ter plekke bewerkt wanneer die in één veilig voorbeeldbericht past. |
| Matrix          | Stuur één event en bewerk het daarna. | Streamingconfiguratie op accountniveau beheert concepten op accountniveau. |
| Microsoft Teams | Native Teams-stream in persoonlijke chats. | `streaming.mode: "block"` wordt toegewezen aan Teams-bloklevering.    |
| Slack           | Native stream of bewerkbaar conceptbericht. | Beschikbaarheid van threads beïnvloedt of native streaming kan worden gebruikt. |
| Telegram        | Stuur één bericht en bewerk het daarna. | Oudere zichtbare concepten kunnen worden vervangen zodat definitieve tijdstempels nuttig blijven. |
| Mattermost      | Bewerkbaar conceptbericht.          | Toolactiviteit wordt samengevoegd in hetzelfde conceptachtige bericht. |

Kanalen zonder veilige ondersteuning voor bewerken vallen meestal terug op
typindicatoren of levering van alleen het definitieve antwoord.

## Afronding

Wanneer het definitieve antwoord klaar is, probeert OpenClaw de chat schoon te houden:

- Als het concept veilig het definitieve antwoord kan worden, bewerkt OpenClaw het ter plekke.
- Als het kanaal native voortgangsstreaming gebruikt, rondt OpenClaw die stream af
  wanneer het native transport de definitieve tekst accepteert.
- Als het definitieve antwoord media, een goedkeuringsprompt, een expliciet antwoorddoel,
  te veel chunks, of een mislukte bewerking/verzending heeft, stuurt OpenClaw het
  definitieve antwoord via het normale leveringspad van het kanaal.

Het fallbackpad is opzettelijk. Het is beter om een nieuw definitief antwoord te
sturen dan tekst kwijt te raken, een antwoord in de verkeerde thread te plaatsen,
of een concept te overschrijven met een payload die het kanaal niet veilig kan
weergeven.

## Probleemoplossing

**Ik zie alleen het definitieve antwoord.**

Controleer of `channels.<channel>.streaming.mode` is ingesteld op `progress` voor
het account of kanaal dat het bericht heeft verwerkt. Sommige groeps- of
quote-reply-paden kunnen conceptvoorbeelden voor een beurt uitschakelen wanneer
het kanaal het juiste bericht niet veilig kan bewerken.

**Ik zie het label maar geen toolregels.**

Controleer `streaming.progress.toolProgress`. Als dit `false` is, behoudt
OpenClaw het gedrag met één concept maar verbergt het tool- en
taakvoortgangsregels.

**Ik zie een nieuw definitief bericht in plaats van een bewerkt concept.**

Dat is een veiligheidsfallback. Dit kan gebeuren bij media-antwoorden, lange
antwoorden, expliciete antwoorddoelen, oude Telegram-concepten, ontbrekende
Slack-threaddoelen, verwijderde voorbeeldberichten of mislukte native
streamafronding.

**Ik zie nog steeds losse voortgangsberichten.**

Voortgangsmodus onderdrukt standaard losse toolvoortgangsberichten wanneer een
concept actief is. Als losse berichten nog steeds verschijnen, controleer dan of
de beurt daadwerkelijk voortgangsmodus gebruikt en niet `streaming.mode: "off"`
of een kanaalpad dat geen concept voor dat bericht kan maken.

**Teams gedraagt zich anders dan Discord of Telegram.**

Microsoft Teams gebruikt een native stream in persoonlijke chats in plaats van
het generieke transport voor verzenden-en-bewerken van voorbeelden. Teams
behandelt `streaming.mode: "block"` ook als Teams-bloklevering omdat het niet
dezelfde conceptvoorbeeldblokmodus heeft die Discord en Telegram gebruiken.

## Gerelateerd

- [Streaming en chunking](/nl/concepts/streaming)
- [Berichten](/nl/concepts/messages)
- [Kanaalconfiguratie](/nl/gateway/config-channels)
- [Discord](/nl/channels/discord)
- [Matrix](/nl/channels/matrix)
- [Microsoft Teams](/nl/channels/msteams)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
