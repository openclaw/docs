---
read_when:
    - Zichtbare voortgangsupdates configureren voor langdurige chatbeurten
    - Kiezen tussen streamingmodi voor gedeeltelijke updates, blokken en voortgang
    - Uitleg over hoe OpenClaw één kanaalbericht bijwerkt terwijl werk wordt uitgevoerd
    - Probleemoplossing voor voortgangsconcepten, zelfstandige voortgangsberichten of terugval bij afronding
summary: 'Voortgangsconcepten: één zichtbaar bericht over werk in uitvoering dat wordt bijgewerkt terwijl een agent draait'
title: Voortgangsconcepten
x-i18n:
    generated_at: "2026-05-04T07:03:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Voortgangsconcepten laten langlopende agentbeurten levendig aanvoelen in chat zonder
het gesprek te veranderen in een stapel tijdelijke statusantwoorden.

Wanneer voortgangsconcepten zijn ingeschakeld, maakt OpenClaw pas een zichtbaar
werk-in-uitvoeringbericht aan nadat de beurt bewijst dat er echt werk wordt gedaan,
werkt het bij terwijl de agent leest, plant, tools aanroept of op goedkeuring
wacht, en zet dat concept daarna om in het definitieve antwoord wanneer het kanaal
dat veilig kan doen.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Gebruik voortgangsconcepten wanneer je één net statusbericht wilt tijdens
toolintensief werk en het definitieve antwoord wanneer de beurt klaar is.

## Snelstart

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

Dat is meestal genoeg. OpenClaw kiest automatisch een label van één woord, wacht
tot het werk minstens vijf seconden duurt of een tweede werkgebeurtenis uitstoot,
voegt compacte voortgangsregels toe terwijl nuttig werk plaatsvindt, en onderdrukt
dubbele losse voortgangspraat voor die beurt.

## Wat gebruikers zien

Een voortgangsconcept heeft twee onderdelen:

| Onderdeel        | Doel                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| Label            | Een korte titel zoals `Thinking...` of `Shelling...`.                       |
| Voortgangsregels | Compacte run-updates met dezelfde toollabels en pictogrammen als uitgebreide uitvoer. |

Het label verschijnt nadat de agent betekenisvol werk start en ofwel vijf
seconden bezig blijft of een tweede werkgebeurtenis uitstoot. Antwoorden met
alleen platte tekst tonen geen voortgangsconcept. Voortgangsregels worden alleen
toegevoegd wanneer de agent nuttige werkupdates uitstoot, bijvoorbeeld
`🛠️ Exec`, `🔎 Web Search` of `✍️ Write: to /tmp/file`. Standaard gebruiken ze
dezelfde compacte uitlegmodus als `/verbose`; stel
`agents.defaults.toolProgressDetail: "raw"` in wanneer je aan het debuggen bent
en ook ruwe opdrachten/details toegevoegd wilt hebben.
Het definitieve antwoord vervangt het concept waar mogelijk; anders verzendt
OpenClaw het definitieve antwoord normaal en ruimt het het concept op of stopt
het met bijwerken volgens het transport van het kanaal.

## Kies een modus

`channels.<channel>.streaming.mode` bepaalt het zichtbare gedrag tijdens werk in uitvoering:

| Modus      | Beste voor                       | Wat er in chat verschijnt                         |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Stille kanalen                   | Alleen het definitieve antwoord.                  |
| `partial`  | Antwoordtekst zien verschijnen   | Eén concept bewerkt met de nieuwste antwoordtekst. |
| `block`    | Grotere voorbeeldchunks van antwoorden | Eén voorbeeld dat in grotere chunks wordt bijgewerkt of aangevuld. |
| `progress` | Toolintensieve of langlopende beurten | Eén statusconcept, daarna het definitieve antwoord. |

Kies `progress` wanneer gebruikers meer geven om "wat er gebeurt" dan om de
antwoordtekst token voor token te zien streamen.

Kies `partial` wanneer het antwoord zelf het voortgangssignaal is.

Kies `block` wanneer je conceptvoorbeeldupdates in grotere tekstchunks wilt. Op
Discord en Telegram is `streaming.mode: "block"` nog steeds voorbeeldstreaming,
geen normale bloklevering. Gebruik `streaming.block.enabled` of legacy
`blockStreaming` wanneer je normale blokantwoorden wilt.

## Labels configureren

Voortgangslabels staan onder `channels.<channel>.streaming.progress`.

Het standaardlabel is `auto`, dat kiest uit de ingebouwde labelpool van OpenClaw
met één woord en een beletselteken:

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

Voortgangsregels zijn standaard ingeschakeld in voortgangsmodus. Ze komen uit
echte run-gebeurtenissen: toolstarts, itemupdates, taakplannen, goedkeuringen,
opdrachtuitvoer, patchsamenvattingen en vergelijkbare agentactiviteit.

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
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` voegt de onderliggende
opdracht/detail toe wanneer beschikbaar, wat handig is tijdens debuggen maar
drukker is in chat.

Dezelfde opdracht verschijnt bijvoorbeeld anders, afhankelijk van de detailmodus:

| Modus     | Voortgangsregel                                                    |
| --------- | ------------------------------------------------------------------ |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                         |
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

Voortgangsregels worden automatisch gecompacteerd om herschikking van chatballonnen te verminderen terwijl het concept wordt bewerkt.

OpenClaw kapt lange voortgangsregels standaard af zodat herhaalde conceptbewerkingen
niet bij elke update anders teruglopen. Het voorvoegsel blijft leesbaar, en lange
details zoals paden of ruwe opdrachten worden ingekort met een beletselteken.

Slack kan voortgangsregels weergeven als gestructureerde Block Kit-velden in
plaats van één tekstbody:

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

Rijke weergave behoudt dezelfde plattetekstfallback zodat kanalen en clients die
de rijkere vorm niet ondersteunen nog steeds de compacte voortgangstekst kunnen tonen.

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

Met `toolProgress: false` onderdrukt OpenClaw nog steeds de oudere losse
toolvoortgangsberichten voor die beurt. Het kanaal blijft visueel rustig tot het
definitieve antwoord, behalve het label als er een is geconfigureerd.

## Kanaalgedrag

Elk kanaal gebruikt het schoonste transport dat het ondersteunt:

| Kanaal          | Voortgangstransport                  | Opmerkingen                                                           |
| --------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Discord         | Eén bericht verzenden en daarna bewerken. | Definitieve tekst wordt ter plekke bewerkt wanneer die in één veilig voorbeeldbericht past. |
| Matrix          | Eén gebeurtenis verzenden en daarna bewerken. | Streamingconfiguratie op accountniveau beheert concepten op accountniveau. |
| Microsoft Teams | Native Teams-stream in persoonlijke chats. | `streaming.mode: "block"` wordt gekoppeld aan Teams-bloklevering.     |
| Slack           | Native stream of bewerkbare conceptpost. | Beschikbaarheid van threads beïnvloedt of native streaming kan worden gebruikt. |
| Telegram        | Eén bericht verzenden en daarna bewerken. | Oudere zichtbare concepten kunnen worden vervangen zodat definitieve tijdstempels nuttig blijven. |
| Mattermost      | Bewerkbare conceptpost.              | Toolactiviteit wordt samengevoegd in dezelfde conceptachtige post.    |

Kanalen zonder veilige bewerkingsondersteuning vallen meestal terug op
typindicatoren of levering met alleen het definitieve antwoord.

## Finalisatie

Wanneer het definitieve antwoord klaar is, probeert OpenClaw de chat schoon te houden:

- Als het concept veilig het definitieve antwoord kan worden, bewerkt OpenClaw het ter plekke.
- Als het kanaal native voortgangsstreaming gebruikt, finaliseert OpenClaw die stream
  wanneer het native transport de definitieve tekst accepteert.
- Als het definitieve antwoord media, een goedkeuringsprompt, een expliciet antwoorddoel,
  te veel chunks of een mislukte bewerking/verzending heeft, verzendt OpenClaw het
  definitieve antwoord via het normale leveringspad van het kanaal.

Het fallbackpad is opzettelijk. Het is beter om een vers definitief antwoord te
verzenden dan tekst kwijt te raken, een antwoord in de verkeerde thread te plaatsen
of een concept te overschrijven met een payload die het kanaal niet veilig kan weergeven.

## Probleemoplossing

**Ik zie alleen het definitieve antwoord.**

Controleer of `channels.<channel>.streaming.mode` is ingesteld op `progress` voor
het account of kanaal dat het bericht heeft verwerkt. Sommige groeps- of
quote-reply-paden kunnen conceptvoorbeelden voor een beurt uitschakelen wanneer
het kanaal niet veilig het juiste bericht kan bewerken.

**Ik zie het label maar geen toolregels.**

Controleer `streaming.progress.toolProgress`. Als dit `false` is, behoudt
OpenClaw het gedrag met één concept maar verbergt het tool- en taakvoortgangsregels.

**Ik zie een nieuw definitief bericht in plaats van een bewerkt concept.**

Dat is een veiligheidsfallback. Dit kan gebeuren bij media-antwoorden, lange
antwoorden, expliciete antwoorddoelen, oude Telegram-concepten, ontbrekende
Slack-threaddoelen, verwijderde voorbeeldberichten of mislukte finalisatie van
native streams.

**Ik zie nog steeds losse voortgangsberichten.**

Voortgangsmodus onderdrukt standaard losse toolvoortgangsberichten wanneer een
concept actief is. Als losse berichten nog steeds verschijnen, controleer dan of
de beurt daadwerkelijk voortgangsmodus gebruikt en niet `streaming.mode: "off"`
of een kanaalpad dat geen concept voor dat bericht kan aanmaken.

**Teams gedraagt zich anders dan Discord of Telegram.**

Microsoft Teams gebruikt een native stream in persoonlijke chats in plaats van
het generieke voorbeeldtransport met verzenden en bewerken. Teams behandelt
`streaming.mode: "block"` ook als Teams-bloklevering omdat het niet dezelfde
blokmodus voor conceptvoorbeelden heeft die Discord en Telegram gebruiken.

## Gerelateerd

- [Streamen en chunken](/nl/concepts/streaming)
- [Berichten](/nl/concepts/messages)
- [Kanaalconfiguratie](/nl/gateway/config-channels)
- [Discord](/nl/channels/discord)
- [Matrix](/nl/channels/matrix)
- [Microsoft Teams](/nl/channels/msteams)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
