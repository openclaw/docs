---
read_when:
    - Zichtbare voortgangsupdates configureren voor langlopende chatbeurten
    - Kiezen tussen gedeeltelijke, blok- en voortgangsstreamingmodi
    - Uitleg over hoe OpenClaw één kanaalbericht bijwerkt terwijl het werk wordt uitgevoerd
    - Problemen oplossen met voortgangsconcepten, zelfstandige voortgangsberichten of het terugvalmechanisme voor finalisatie
summary: 'Voortgangsconcepten: één zichtbaar bericht in uitvoering dat wordt bijgewerkt terwijl een agent draait'
title: Voortgangsconcepten
x-i18n:
    generated_at: "2026-05-06T09:10:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Voortgangsconcepten laten langlopende agentbeurten levendig aanvoelen in chat zonder de conversatie te veranderen in een stapel tijdelijke statusantwoorden.

Wanneer voortgangsconcepten zijn ingeschakeld, maakt OpenClaw pas één zichtbaar onderhanden-bericht aan nadat de beurt aantoont dat er echt werk wordt uitgevoerd, werkt dit bij terwijl de agent leest, plant, tools aanroept of op goedkeuring wacht, en zet dat concept daarna om in het definitieve antwoord wanneer het kanaal dat veilig kan doen.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Gebruik voortgangsconcepten wanneer je één nette statusmelding wilt tijdens tool-intensief werk en het definitieve antwoord wanneer de beurt klaar is.

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

Dat is meestal voldoende. OpenClaw kiest automatisch een label van één woord, wacht totdat werk minstens vijf seconden duurt of een tweede werkgebeurtenis uitzendt, voegt compacte voortgangsregels toe terwijl nuttig werk plaatsvindt, en onderdrukt dubbele losse voortgangspraat voor die beurt.

## Wat gebruikers zien

Een voortgangsconcept heeft twee onderdelen:

| Onderdeel       | Doel                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| Label           | Een korte titel zoals `Thinking...` of `Shelling...`.                       |
| Voortgangsregels | Compacte uitvoeringsupdates met dezelfde toollabels en pictogrammen als uitgebreide uitvoer. |

Het label verschijnt nadat de agent betekenisvol werk start en ofwel vijf seconden bezig blijft, ofwel een tweede werkgebeurtenis uitzendt. Antwoorden met alleen platte tekst tonen geen voortgangsconcept. Voortgangsregels worden alleen toegevoegd wanneer de agent nuttige werkupdates uitzendt, bijvoorbeeld `🛠️ Exec`, `🔎 Web Search` of `✍️ Write: to /tmp/file`.
Standaard gebruiken ze dezelfde compacte uitlegmodus als `/verbose`; stel
`agents.defaults.toolProgressDetail: "raw"` in bij debuggen wanneer je ook ruwe opdrachten/details toegevoegd wilt hebben.
Het definitieve antwoord vervangt het concept wanneer dat mogelijk is; anders verzendt
OpenClaw het definitieve antwoord normaal en ruimt het concept op of stopt met bijwerken volgens het transport van het kanaal.

## Kies een modus

`channels.<channel>.streaming.mode` bepaalt het zichtbare onderhanden-gedrag:

| Modus      | Beste voor                         | Wat verschijnt in chat                             |
| ---------- | ---------------------------------- | -------------------------------------------------- |
| `off`      | Stille kanalen                     | Alleen het definitieve antwoord.                   |
| `partial`  | Antwoordtekst zien verschijnen     | Eén concept dat wordt bewerkt met de nieuwste antwoordtekst. |
| `block`    | Grotere antwoordvoorbeeldblokken   | Eén voorbeeld dat wordt bijgewerkt of aangevuld in grotere blokken. |
| `progress` | Tool-intensieve of langlopende beurten | Eén statusconcept, daarna het definitieve antwoord. |

Kies `progress` wanneer gebruikers meer geven om "wat er gebeurt" dan om het token voor token zien streamen van de antwoordtekst.

Kies `partial` wanneer het antwoord zelf het voortgangssignaal is.

Kies `block` wanneer je conceptvoorbeeldupdates in grotere tekstblokken wilt. Op
Discord en Telegram is `streaming.mode: "block"` nog steeds voorbeeldstreaming, geen normale bloklevering. Gebruik `streaming.block.enabled` of legacy
`blockStreaming` wanneer je normale blokantwoorden wilt.

## Labels configureren

Voortgangslabels staan onder `channels.<channel>.streaming.progress`.

Het standaardlabel is `auto`, dat kiest uit de ingebouwde labelpool van OpenClaw met één woord en puntjes:

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
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` voegt de onderliggende opdracht/detail toe wanneer beschikbaar, wat nuttig is tijdens debuggen maar rumoeriger is in chat.

Dezelfde opdracht verschijnt bijvoorbeeld anders afhankelijk van de detailmodus:

| Modus     | Voortgangsregel                                                     |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
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

Voortgangsregels worden automatisch gecomprimeerd om herschikking van chatballonnen te beperken terwijl het concept wordt bewerkt.

OpenClaw kapt lange voortgangsregels standaard af zodat herhaalde conceptbewerkingen niet bij elke update anders afbreken. Het voorvoegsel blijft leesbaar, en lange details zoals paden of ruwe opdrachten worden ingekort met een ellips.

Slack kan voortgangsregels weergeven als gestructureerde Block Kit-velden in plaats van één enkele tekstinhoud:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

Rijke weergave behoudt dezelfde platte-tekstterugval zodat kanalen en clients die de rijkere vorm niet ondersteunen nog steeds de compacte voortgangstekst kunnen tonen.

Behoud het ene voortgangsconcept maar verberg tool- en taakregels:

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

Met `toolProgress: false` onderdrukt OpenClaw nog steeds de oudere losse tool-voortgangsberichten voor die beurt. Het kanaal blijft visueel stil tot het definitieve antwoord, behalve het label als er een is geconfigureerd.

## Kanaalgedrag

Elk kanaal gebruikt het schoonste transport dat het ondersteunt:

| Kanaal          | Voortgangstransport                  | Opmerkingen                                                           |
| --------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Discord         | Eén bericht verzenden en daarna bewerken. | Definitieve tekst wordt ter plekke bewerkt wanneer die in één veilig voorbeeldbericht past. |
| Matrix          | Eén gebeurtenis verzenden en daarna bewerken. | Streamingconfiguratie op accountniveau beheert concepten op accountniveau. |
| Microsoft Teams | Native Teams-stream in persoonlijke chats. | `streaming.mode: "block"` wordt gekoppeld aan Teams-bloklevering.     |
| Slack           | Native stream of bewerkbaar conceptbericht. | Threadbeschikbaarheid beïnvloedt of native streaming kan worden gebruikt. |
| Telegram        | Eén bericht verzenden en daarna bewerken. | Oudere zichtbare concepten kunnen worden vervangen zodat definitieve tijdstempels nuttig blijven. |
| Mattermost      | Bewerkbaar conceptbericht.           | Toolactiviteit wordt samengevouwen in hetzelfde conceptachtige bericht. |

Kanalen zonder veilige bewerkingsondersteuning vallen meestal terug op typindicatoren of levering alleen van het definitieve antwoord.

## Afronding

Wanneer het definitieve antwoord klaar is, probeert OpenClaw de chat schoon te houden:

- Als het concept veilig het definitieve antwoord kan worden, bewerkt OpenClaw het ter plekke.
- Als het kanaal native voortgangsstreaming gebruikt, rondt OpenClaw die stream af wanneer het native transport de definitieve tekst accepteert.
- Als het definitieve antwoord media, een goedkeuringsprompt, een expliciet antwoorddoel, te veel chunks of een mislukte bewerking/verzending heeft, verzendt OpenClaw het definitieve antwoord via het normale leveringspad van het kanaal.

Het terugvalpad is opzettelijk. Het is beter om een nieuw definitief antwoord te verzenden dan tekst kwijt te raken, een antwoord in de verkeerde thread te plaatsen of een concept te overschrijven met een payload die het kanaal niet veilig kan weergeven.

## Probleemoplossing

**Ik zie alleen het definitieve antwoord.**

Controleer of `channels.<channel>.streaming.mode` is ingesteld op `progress` voor het account of kanaal dat het bericht heeft verwerkt. Sommige groeps- of quote-reply-paden kunnen conceptvoorbeelden voor een beurt uitschakelen wanneer het kanaal het juiste bericht niet veilig kan bewerken.

**Ik zie het label maar geen toolregels.**

Controleer `streaming.progress.toolProgress`. Als dit `false` is, behoudt OpenClaw het gedrag met één concept maar verbergt het tool- en taakvoortgangsregels.

**Ik zie een nieuw definitief bericht in plaats van een bewerkt concept.**

Dat is een veiligheidsterugval. Dit kan gebeuren bij media-antwoorden, lange antwoorden, expliciete antwoorddoelen, oude Telegram-concepten, ontbrekende Slack-threaddoelen, verwijderde voorbeeldberichten of mislukte afronding van native streams.

**Ik zie nog steeds losse voortgangsberichten.**

Voortgangsmodus onderdrukt standaard losse tool-voortgangsberichten wanneer een concept actief is. Als losse berichten nog steeds verschijnen, controleer dan of de beurt daadwerkelijk voortgangsmodus gebruikt en niet `streaming.mode: "off"` of een kanaalpad dat geen concept voor dat bericht kan maken.

**Teams gedraagt zich anders dan Discord of Telegram.**

Microsoft Teams gebruikt een native stream in persoonlijke chats in plaats van het generieke transport voor verzenden-en-bewerken van voorbeelden. Teams behandelt `streaming.mode: "block"` ook als Teams-bloklevering omdat het niet dezelfde conceptvoorbeeld-blokmodus heeft die Discord en Telegram gebruiken.

## Gerelateerd

- [Streamen en opdelen in chunks](/nl/concepts/streaming)
- [Berichten](/nl/concepts/messages)
- [Kanaalconfiguratie](/nl/gateway/config-channels)
- [Discord](/nl/channels/discord)
- [Matrix](/nl/channels/matrix)
- [Microsoft Teams](/nl/channels/msteams)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
