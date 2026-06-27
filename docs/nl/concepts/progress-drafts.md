---
read_when:
    - Zichtbare voortgangsupdates configureren voor langlopende chatbeurten
    - Kiezen tussen partial-, block- en progress-streamingmodi
    - Uitleg over hoe OpenClaw één kanaalbericht bijwerkt terwijl werk wordt uitgevoerd
    - Problemen oplossen met voortgangsconcepten, zelfstandige voortgangsberichten of terugval bij finalisatie
summary: 'Voortgangsconcepten: één zichtbaar werk-in-uitvoering-bericht dat wordt bijgewerkt terwijl een agent draait'
title: Voortgangsconcepten
x-i18n:
    generated_at: "2026-06-27T17:28:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Voortgangsconcepten laten langdurige agentbeurten levend aanvoelen in chat zonder
het gesprek te veranderen in een stapel tijdelijke statusantwoorden.

Wanneer voortgangsconcepten zijn ingeschakeld, maakt OpenClaw pas één zichtbaar
werk-in-uitvoering-bericht aan nadat de beurt laat zien dat er echt werk wordt
gedaan, werkt het dit bij terwijl de agent leest, plant, tools aanroept of wacht
op goedkeuring, en zet het dat concept daarna om in het definitieve antwoord
wanneer het kanaal dat veilig kan doen.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Gebruik voortgangsconcepten wanneer je één nette statusmelding wilt tijdens
toolintensief werk en het definitieve antwoord zodra de beurt klaar is.

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
tot werk minstens vijf seconden duurt of een tweede werkgebeurtenis uitzendt,
voegt compacte voortgangsregels toe terwijl nuttig werk plaatsvindt, en
onderdrukt dubbele afzonderlijke voortgangspraat voor die beurt.

## Wat gebruikers zien

Een voortgangsconcept bestaat uit twee delen:

| Deel             | Doel                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Label            | Een korte start-/statusregel zoals `Working` of `Shelling`.                              |
| Voortgangsregels | Compacte run-updates met dezelfde toolpictogrammen en detailformatter als uitvoer in verbose-modus. |

Het label verschijnt nadat de agent betekenisvol werk start en ofwel vijf
seconden bezig blijft of een tweede werkgebeurtenis uitzendt. Het maakt deel uit
van de doorlopende lijst met voortgangsregels, zodat de startstatus wegscrollt
zodra er genoeg concreet werk verschijnt. Antwoorden met alleen platte tekst
tonen geen voortgangsconcept. Voortgangsregels worden alleen toegevoegd wanneer
de agent nuttige werkupdates uitzendt, bijvoorbeeld `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` of `✍️ Write: to /tmp/file`.
Standaard gebruiken ze dezelfde compacte uitlegmethode als `/verbose`; stel
`agents.defaults.toolProgressDetail: "raw"` in tijdens debugging wanneer je ook
ruwe opdrachten/details wilt laten toevoegen.
Het definitieve antwoord vervangt waar mogelijk het concept; anders verstuurt
OpenClaw het definitieve antwoord normaal en ruimt het concept op of stopt het
met bijwerken volgens het transport van het kanaal.

## Kies een modus

`channels.<channel>.streaming.mode` bepaalt het zichtbare gedrag tijdens de uitvoering:

| Modus      | Best voor                         | Wat in chat verschijnt                              |
| ---------- | --------------------------------- | --------------------------------------------------- |
| `off`      | Stille kanalen                    | Alleen het definitieve antwoord.                    |
| `partial`  | Antwoordtekst zien verschijnen    | Eén concept dat wordt bijgewerkt met de nieuwste antwoordtekst. |
| `block`    | Grotere antwoordvoorbeeldblokken  | Eén voorbeeld dat wordt bijgewerkt of aangevuld in grotere blokken. |
| `progress` | Toolintensieve of langdurige beurten | Eén statusconcept, daarna het definitieve antwoord. |

Kies `progress` wanneer gebruikers meer geven om "wat er gebeurt" dan om het
antwoord token voor token te zien streamen.

Kies `partial` wanneer het antwoord zelf het voortgangssignaal is.

Kies `block` wanneer je conceptvoorbeeldupdates in grotere tekstblokken wilt.
Op Discord en Telegram is `streaming.mode: "block"` nog steeds
voorbeeldstreaming, geen normale bloklevering. Gebruik `streaming.block.enabled`
of de verouderde `blockStreaming` wanneer je normale blokantwoorden wilt.

## Labels configureren

Voortgangslabels staan onder `channels.<channel>.streaming.progress`.

Het standaardlabel is `auto`, dat kiest uit OpenClaw's ingebouwde pool met
labels van één woord:

```text
Working
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

## Voortgangsregels beheren

Voortgangsregels zijn standaard ingeschakeld in voortgangsmodus. Ze komen uit
echte run-gebeurtenissen: toolstarts, itemupdates, taakplannen, goedkeuringen,
opdrachtuitvoer, patchsamenvattingen en vergelijkbare agentactiviteit.

Tools kunnen ook getypeerde voortgang uitzenden terwijl één toolaanroep nog
loopt. Zo kan een trage fetch of zoekactie het zichtbare concept bijwerken
voordat de tool het definitieve resultaat teruggeeft. De voortgangsupdate is een
gedeeltelijk toolresultaat met lege modelinhoud en expliciete metadata voor het
openbare kanaal:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw rendert alleen de `progress.text` in de voortgangs-UI van het kanaal.
Het normale toolresultaat komt later nog steeds binnen als `content` en
`details`, en is het enige deel dat naar het model wordt teruggestuurd.

Wanneer je voortgang aan een tool toevoegt, gebruik dan een kort, generiek
bericht en stel het uit totdat de bewerking lang genoeg in behandeling is om
nuttig te zijn:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Dit patroon betekent dat snelle aanroepen geen voortgangsregel tonen, langdurige
aanroepen er één tonen terwijl ze nog in behandeling zijn, en geannuleerde
aanroepen de timer wissen voordat verouderde voortgang kan verschijnen.
Voortgangstekst is een openbaar UI-zijkanaal, dus deze mag geen geheimen, ruwe
argumenten, opgehaalde inhoud, opdrachtuitvoer of paginatekst bevatten.

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
`🛠️ check JS syntax for /tmp/app.js`. `"raw"` voegt de onderliggende
opdracht/detail toe wanneer beschikbaar, wat nuttig is tijdens debugging maar
meer ruis geeft in chat.

Dezelfde opdracht verschijnt bijvoorbeeld anders, afhankelijk van de detailmodus:

| Modus     | Voortgangsregel                                               |
| --------- | ------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                          |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Voortgangsregels worden automatisch samengevouwen om herindeling van chatballonnen te beperken terwijl het concept wordt bewerkt.

OpenClaw kapt lange voortgangsregels standaard af, zodat herhaalde
conceptbewerkingen niet bij elke update anders afbreken. Het standaardbudget per
regel is 120 tekens. Proza wordt afgekapt op een woordgrens, terwijl lange
details zoals paden of ruwe opdrachten worden ingekort met een ellips in het
midden, zodat het achtervoegsel zichtbaar blijft.

Stem het budget per regel af:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack kan voortgangsregels renderen als gestructureerde Block Kit-velden in
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

Rijke rendering behoudt dezelfde fallback in platte tekst, zodat kanalen en
clients die de rijkere vorm niet ondersteunen nog steeds de compacte
voortgangstekst kunnen tonen.

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

Met `toolProgress: false` onderdrukt OpenClaw nog steeds de oudere afzonderlijke
toolvoortgangsberichten voor die beurt. Het kanaal blijft visueel rustig tot het
definitieve antwoord, behalve het label als er één is geconfigureerd.

## Kanaalgedrag

Elk kanaal gebruikt het schoonste transport dat het ondersteunt:

| Kanaal          | Voortgangstransport                  | Opmerkingen                                                           |
| --------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Discord         | Verstuur één bericht en bewerk het daarna. | Definitieve tekst wordt ter plekke bewerkt wanneer die in één veilig voorbeeldbericht past. |
| Matrix          | Verstuur één gebeurtenis en bewerk die daarna. | Streamingconfiguratie op accountniveau beheert concepten op accountniveau. |
| Microsoft Teams | Native Teams-stream in persoonlijke chats. | `streaming.mode: "block"` wordt gekoppeld aan Teams-bloklevering.     |
| Slack           | Native stream of bewerkbare conceptpost. | Threadbeschikbaarheid beïnvloedt of native streaming kan worden gebruikt. |
| Telegram        | Verstuur één bericht en bewerk het daarna. | Oudere zichtbare concepten kunnen worden vervangen zodat definitieve tijdstempels nuttig blijven. |
| Mattermost      | Bewerkbare conceptpost.              | Toolactiviteit wordt samengevouwen in dezelfde conceptachtige post.   |

Kanalen zonder veilige bewerkingsondersteuning vallen meestal terug op
typindicatoren of levering alleen van het definitieve antwoord.

## Afronding

Wanneer het definitieve antwoord klaar is, probeert OpenClaw de chat schoon te houden:

- Als het concept veilig het definitieve antwoord kan worden, bewerkt OpenClaw het ter plekke.
- Als het kanaal native voortgangsstreaming gebruikt, rondt OpenClaw die stream
  af wanneer het native transport de definitieve tekst accepteert.
- Als het definitieve antwoord media, een goedkeuringsprompt, een expliciet
  antwoorddoel, te veel chunks of een mislukte bewerking/verzending heeft,
  verstuurt OpenClaw het definitieve antwoord via het normale leveringspad van
  het kanaal.

Het fallbackpad is bewust. Het is beter om een nieuw definitief antwoord te
versturen dan tekst te verliezen, een antwoord in de verkeerde thread te zetten,
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
Slack-threaddoelen, verwijderde voorbeeldberichten of mislukte afronding van een
native stream.

**Ik zie nog steeds afzonderlijke voortgangsberichten.**

De voortgangsmodus onderdrukt standaard afzonderlijke
toolvoortgangsberichten wanneer een concept actief is. Als afzonderlijke
berichten nog steeds verschijnen, controleer dan of de beurt daadwerkelijk
voortgangsmodus gebruikt en niet `streaming.mode: "off"` of een kanaalpad dat
geen concept voor dat bericht kan maken.

**Teams gedraagt zich anders dan Discord of Telegram.**

Microsoft Teams gebruikt een native stream in persoonlijke chats in plaats van het generieke
previewtransport voor verzenden-en-bewerken. Teams behandelt `streaming.mode: "block"` ook als
Teams-bloklevering, omdat het niet dezelfde blokmodus voor conceptpreviews heeft
die Discord en Telegram gebruiken.

## Gerelateerd

- [Streaming en chunking](/nl/concepts/streaming)
- [Berichten](/nl/concepts/messages)
- [Kanaalconfiguratie](/nl/gateway/config-channels)
- [Discord](/nl/channels/discord)
- [Matrix](/nl/channels/matrix)
- [Microsoft Teams](/nl/channels/msteams)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
