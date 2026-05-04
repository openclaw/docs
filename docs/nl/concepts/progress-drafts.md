---
read_when:
    - Zichtbare voortgangsupdates configureren voor langlopende chatbeurten
    - Kiezen tussen gedeeltelijke, blok- en voortgangsstreamingmodi
    - Uitleg over hoe OpenClaw één kanaalbericht bijwerkt terwijl er werk wordt uitgevoerd
    - Problemen oplossen met voortgangsconcepten, zelfstandige voortgangsberichten of finalisatie-fallback
summary: 'Voortgangsconcepten: één zichtbaar bericht voor werk in uitvoering dat wordt bijgewerkt terwijl een agent draait'
title: Voortgangsconcepten
x-i18n:
    generated_at: "2026-05-04T02:23:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Voortgangsconcepten laten langlopende agentbeurten levendig aanvoelen in chat zonder het gesprek te veranderen in een stapel tijdelijke statusantwoorden.

Wanneer voortgangsconcepten zijn ingeschakeld, maakt OpenClaw pas één zichtbaar werk-in-uitvoering-bericht nadat de beurt bewijst dat er echt werk wordt gedaan, werkt het dit bij terwijl de agent leest, plant, tools aanroept of op goedkeuring wacht, en zet het dat concept daarna om in het definitieve antwoord wanneer het kanaal dat veilig kan doen.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Gebruik voortgangsconcepten wanneer je één nette statusmelding wilt tijdens toolintensief werk en het definitieve antwoord wanneer de beurt klaar is.

## Snel starten

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

Dat is meestal genoeg. OpenClaw kiest automatisch een label van één woord, wacht totdat werk minstens vijf seconden duurt of een tweede werkgebeurtenis uitzendt, voegt compacte voortgangsregels toe terwijl nuttig werk plaatsvindt, en onderdrukt dubbele losse voortgangspraat voor die beurt.

## Wat gebruikers zien

Een voortgangsconcept heeft twee delen:

| Deel              | Doel                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| Label             | Een korte titel zoals `Thinking...` of `Shelling...`.                        |
| Voortgangsregels  | Compacte uitvoeringsupdates met dezelfde toollabels en pictogrammen als uitgebreide uitvoer. |

Het label verschijnt nadat de agent betekenisvol werk start en ofwel vijf seconden bezig blijft of een tweede werkgebeurtenis uitzendt. Antwoorden met alleen platte tekst tonen geen voortgangsconcept. Voortgangsregels worden alleen toegevoegd wanneer de agent nuttige werkupdates uitzendt, bijvoorbeeld `🛠️ Exec`, `🔎 Web Search`, of `✍️ Write: to /tmp/file`.
Standaard gebruiken ze dezelfde compacte uitlegmodus als `/verbose`; stel
`agents.defaults.toolProgressDetail: "raw"` in bij het debuggen en wanneer je ook ruwe opdrachten/details toegevoegd wilt hebben.
Het definitieve antwoord vervangt het concept wanneer dat mogelijk is; anders stuurt
OpenClaw het definitieve antwoord normaal en ruimt het het concept op of stopt het met bijwerken volgens het transport van het kanaal.

## Kies een modus

`channels.<channel>.streaming.mode` bepaalt het zichtbare gedrag tijdens uitvoering:

| Modus      | Het meest geschikt voor           | Wat in chat verschijnt                            |
| ---------- | --------------------------------- | ------------------------------------------------- |
| `off`      | Stille kanalen                    | Alleen het definitieve antwoord.                  |
| `partial`  | Antwoordtekst zien verschijnen    | Eén concept dat wordt bewerkt met de nieuwste antwoordtekst. |
| `block`    | Grotere antwoordvoorbeeldblokken  | Eén voorbeeld dat wordt bijgewerkt of aangevuld in grotere blokken. |
| `progress` | Toolintensieve of langlopende beurten | Eén statusconcept, daarna het definitieve antwoord. |

Kies `progress` wanneer gebruikers meer geven om "wat er gebeurt" dan om de antwoordtekst token voor token te zien streamen.

Kies `partial` wanneer het antwoord zelf het voortgangssignaal is.

Kies `block` wanneer je conceptvoorbeeldupdates in grotere tekstblokken wilt. Op
Discord en Telegram is `streaming.mode: "block"` nog steeds voorbeeldstreaming, geen normale bloklevering. Gebruik `streaming.block.enabled` of de verouderde
`blockStreaming` wanneer je normale blokantwoorden wilt.

## Labels configureren

Voortgangslabels staan onder `channels.<channel>.streaming.progress`.

Het standaardlabel is `auto`, dat kiest uit OpenClaw's ingebouwde labelverzameling van één woord met ellips:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

Gebruik je eigen automatische labelverzameling:

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

## Voortgangsregels beheren

Voortgangsregels zijn standaard ingeschakeld in voortgangsmodus. Ze komen uit echte uitvoeringsgebeurtenissen: toolstarts, itemupdates, taakplannen, goedkeuringen, opdrachtuitvoer, patchsamenvattingen en vergelijkbare agentactiviteit.

OpenClaw gebruikt dezelfde formatter voor voortgangsconcepten en `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` is de standaard en houdt concepten stabiel met beknopte labels zoals
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` voegt de onderliggende opdracht/detail toe wanneer beschikbaar, wat nuttig is tijdens het debuggen maar rumoeriger is in chat.

Dezelfde opdracht verschijnt bijvoorbeeld anders afhankelijk van de detailmodus:

| Modus     | Voortgangsregel                                                     |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                          |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Met `toolProgress: false` onderdrukt OpenClaw nog steeds de oudere losse toolvoortgangsberichten voor die beurt. Het kanaal blijft visueel rustig tot het definitieve antwoord, behalve het label als er een is geconfigureerd.

## Kanaalgedrag

Elk kanaal gebruikt het schoonste transport dat het ondersteunt:

| Kanaal          | Voortgangstransport                    | Opmerkingen                                                           |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Stuur één bericht en bewerk het daarna. | Definitieve tekst wordt ter plekke bewerkt wanneer die in één veilig voorbeeldbericht past. |
| Matrix          | Stuur één gebeurtenis en bewerk die daarna. | Streamingconfiguratie op accountniveau beheert concepten op accountniveau. |
| Microsoft Teams | Native Teams-stream in persoonlijke chats. | `streaming.mode: "block"` wordt toegewezen aan Teams-bloklevering.     |
| Slack           | Native stream of bewerkbaar conceptbericht. | Beschikbaarheid van threads beïnvloedt of native streaming kan worden gebruikt. |
| Telegram        | Stuur één bericht en bewerk het daarna. | Oudere zichtbare concepten kunnen worden vervangen zodat definitieve tijdstempels nuttig blijven. |
| Mattermost      | Bewerkbaar conceptbericht.             | Toolactiviteit wordt samengevouwen in hetzelfde conceptachtige bericht. |

Kanalen zonder veilige bewerkingsondersteuning vallen meestal terug op typindicatoren of levering met alleen het definitieve antwoord.

## Afronding

Wanneer het definitieve antwoord klaar is, probeert OpenClaw de chat schoon te houden:

- Als het concept veilig het definitieve antwoord kan worden, bewerkt OpenClaw het ter plekke.
- Als het kanaal native voortgangsstreaming gebruikt, rondt OpenClaw die stream af wanneer het native transport de definitieve tekst accepteert.
- Als het definitieve antwoord media, een goedkeuringsprompt, een expliciet antwoorddoel, te veel chunks of een mislukte bewerking/verzending heeft, stuurt OpenClaw het definitieve antwoord via het normale leveringspad van het kanaal.

Het terugvalpad is opzettelijk. Het is beter om een nieuw definitief antwoord te sturen dan tekst te verliezen, een antwoord in de verkeerde thread te plaatsen of een concept te overschrijven met een payload die het kanaal niet veilig kan weergeven.

## Problemen oplossen

**Ik zie alleen het definitieve antwoord.**

Controleer of `channels.<channel>.streaming.mode` is ingesteld op `progress` voor het account of kanaal dat het bericht heeft verwerkt. Sommige groeps- of citaatantwoordpaden kunnen conceptvoorbeelden voor een beurt uitschakelen wanneer het kanaal het juiste bericht niet veilig kan bewerken.

**Ik zie het label maar geen toolregels.**

Controleer `streaming.progress.toolProgress`. Als dit `false` is, behoudt OpenClaw het gedrag met één concept maar verbergt het tool- en taakvoortgangsregels.

**Ik zie een nieuw definitief bericht in plaats van een bewerkt concept.**

Dat is een veiligheidsterugval. Dit kan gebeuren bij media-antwoorden, lange antwoorden, expliciete antwoorddoelen, oude Telegram-concepten, ontbrekende Slack-threaddoelen, verwijderde voorbeeldberichten of mislukte afronding van native streams.

**Ik zie nog steeds losse voortgangsberichten.**

Voortgangsmodus onderdrukt standaard losse toolvoortgangsberichten wanneer een concept actief is. Als losse berichten nog steeds verschijnen, controleer dan of de beurt daadwerkelijk voortgangsmodus gebruikt en niet `streaming.mode: "off"` of een kanaalpad dat geen concept voor dat bericht kan maken.

**Teams gedraagt zich anders dan Discord of Telegram.**

Microsoft Teams gebruikt een native stream in persoonlijke chats in plaats van het generieke transport voor verzenden-en-bewerken van voorbeelden. Teams behandelt `streaming.mode: "block"` ook als Teams-bloklevering omdat het niet dezelfde blokmodus voor conceptvoorbeelden heeft die Discord en Telegram gebruiken.

## Gerelateerd

- [Streaming en chunking](/nl/concepts/streaming)
- [Berichten](/nl/concepts/messages)
- [Kanaalconfiguratie](/nl/gateway/config-channels)
- [Discord](/nl/channels/discord)
- [Matrix](/nl/channels/matrix)
- [Microsoft Teams](/nl/channels/msteams)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
