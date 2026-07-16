---
read_when:
    - Zichtbare voortgangsupdates configureren voor langlopende chatbeurten
    - Kiezen tussen gedeeltelijke, blok- en voortgangsstreamingmodi
    - Uitleg over hoe OpenClaw één kanaalbericht bijwerkt terwijl het werk wordt uitgevoerd
    - Concepten voor voortgang bij probleemoplossing, zelfstandige voortgangsberichten of terugvaloptie voor afronding
summary: 'Voortgangsconcepten: één zichtbaar bericht over werk in uitvoering dat wordt bijgewerkt terwijl een agent actief is'
title: Voortgangsconcepten
x-i18n:
    generated_at: "2026-07-16T15:31:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Voortgangsconcepten veranderen één kanaalbericht in een live statusregel terwijl een
agent werkt, in plaats van een reeks tijdelijke antwoorden als "nog bezig". Stel
`channels.<channel>.streaming.mode: "progress"` in en OpenClaw maakt het
bericht aan zodra het echte werk begint, bewerkt het terwijl de agent leest, plant, tools
aanroept of op goedkeuring wacht, en verandert het vervolgens in het definitieve antwoord.

```text
Bezig...
📖 uit docs/concepts/progress-drafts.md
🔎 Zoeken op internet: naar "discord edit message"
🛠️ Bash: tests uitvoeren
```

<Note>
  Discord gebruikt al standaard `streaming.mode: "progress"` wanneer
  `channels.discord.streaming` niet is ingesteld, zodat voortgangsconcepten
  daar zonder configuratie verschijnen. Elk ander kanaal gebruikt standaard `partial`
  of `off`; zie [Streamen en opdelen](/nl/concepts/streaming#channel-mapping)
  voor de volledige tabel met standaardwaarden per kanaal.
</Note>

## Snel aan de slag

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

Vanaf hier gelden de volgende standaardwaarden: een startvertraging van 5 seconden, compacte voortgangsregels terwijl
nuttig werk wordt uitgevoerd en onderdrukking van de oudere afzonderlijke voortgangsberichten
voor die beurt. Concepten met onbewerkte toolregels gebruiken
een automatisch label van één woord; een statuskop laat die overbodige titel weg,
tenzij je er expliciet een configureert.

Deze pagina behandelt de ervaring met voortgangsconcepten en de bijbehorende configuratieopties. Zie voor de
volledige matrix met streamingmodi, runtime-opmerkingen per kanaal en migratie van verouderde sleutels
[Streamen en opdelen](/nl/concepts/streaming).

## Wat gebruikers zien

| Onderdeel       | Doel                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| Statuskop       | Op Discord en Telegram: de inleiding van het model; Discord voegt een aanvullende tekst toe. |
| Label           | Optionele begin-/statusregel, zoals `Working`.                           |
| Voortgangsregels | Compacte uitvoeringsupdates die dezelfde toolpictogrammen en detailformatter gebruiken als `/verbose`. |

Bij onbewerkte toolvoortgang verschijnt het label zodra de agent zinvol werk begint
en gedurende de aanvankelijke vertraging bezig blijft.
Het staat bovenaan de doorlopende lijst met voortgangsregels en verdwijnt dus uit beeld zodra
er genoeg concrete werkregels verschijnen. Een statuskop toont alleen de
status van de agent in gewone taal, tenzij expliciet een label is geconfigureerd. Antwoorden die alleen
uit platte tekst bestaan, tonen nooit een voortgangsconcept; een regel verschijnt alleen bij echte werkupdates,
bijvoorbeeld `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
of `✍️ Write: to /tmp/file`.

Het definitieve antwoord vervangt het concept ter plaatse wanneer het kanaal dat veilig kan
doen; anders verzendt OpenClaw het definitieve antwoord via de normale levering en
ruimt het concept op of stopt het bijwerken ervan (zie [Voltooiing](#finalization)).

## Een modus kiezen

`channels.<channel>.streaming.mode` bepaalt het zichtbare gedrag tijdens de uitvoering:

| Modus      | Het meest geschikt voor             | Wat in de chat verschijnt                         |
| ---------- | ----------------------------------- | ------------------------------------------------- |
| `off` | Stille kanalen               | Alleen het definitieve antwoord.                  |
| `partial` | Antwoordtekst zien verschijnen | Eén concept dat met de nieuwste antwoordtekst wordt bijgewerkt. |
| `block` | Grotere voorbeeldfragmenten van antwoorden | Eén voorbeeld dat in grotere fragmenten wordt bijgewerkt of aangevuld. |
| `progress` | Beurten met veel tools of een lange looptijd | Eén statusconcept en daarna het definitieve antwoord. |

Kies `progress` wanneer gebruikers meer belang hechten aan "wat er gebeurt" dan aan het
token voor token zien streamen van antwoordtekst; `partial` wanneer de antwoordtekst zelf
het voortgangssignaal is; `block` voor grotere voorbeeldfragmenten. Op Discord en
Telegram is `streaming.mode: "block"` nog steeds voorbeeldstreaming en geen normale
levering van antwoorden in blokken — gebruik daarvoor `streaming.block.enabled`.

## Labels configureren

Voortgangslabels staan onder `channels.<channel>.streaming.progress`. Het standaardlabel
voor onbewerkte toolregels is `"auto"`, dat het eenvoudige ingebouwde label `Working`
gebruikt. Een statuskop verbergt dat impliciete label; stel
`label: "auto"` expliciet in als je er ook een label boven wilt:

```text
Bezig
```

Gebruik een vast label:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Onderzoeken",
        },
      },
    },
  },
}
```

Gebruik je eigen verzameling labels (nog steeds willekeurig/op basis van de seed gekozen wanneer `label: "auto"`):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Controleren", "Lezen", "Testen", "Afronden"],
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

Voortgangsregels zijn afkomstig van echte uitvoeringsgebeurtenissen: het starten van tools, itemupdates, taakplannen,
goedkeuringen, opdrachtuitvoer, patchsamenvattingen en vergelijkbare agentactiviteit.
Ze zijn standaard ingeschakeld (`progress.toolProgress`, standaard `true`).

Tools kunnen ook getypeerde voortgang verzenden terwijl één aanroep nog wordt uitgevoerd. Zo
werkt een trage ophaal- of zoekactie het zichtbare concept bij voordat de tool
het definitieve resultaat retourneert. De voortgangsupdate is een gedeeltelijk toolresultaat met
lege modelinhoud en expliciete openbare kanaalmetadata:

```json
{
  "content": [],
  "progress": {
    "text": "Pagina-inhoud ophalen...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw rendert alleen `progress.text` in de voortgangsinterface van het kanaal. Het normale
toolresultaat arriveert later nog steeds als `content`/`details` en is het enige onderdeel
dat aan het model wordt geretourneerd.

Wanneer je voortgang aan een tool toevoegt, verzend je een kort, algemeen bericht en stel je dit uit
totdat de bewerking lang genoeg in behandeling is om nuttig te zijn. `web_fetch`
doet precies dit met een vertraging van 5 seconden:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Pagina-inhoud ophalen...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Snelle aanroepen tonen geen voortgangsregel; langdurige aanroepen tonen er één zolang ze nog in behandeling zijn;
geannuleerde aanroepen wissen de timer voordat verouderde voortgang kan verschijnen. Voortgangstekst
is een openbaar nevenkanaal van de gebruikersinterface en mag daarom nooit geheimen, onbewerkte argumenten,
opgehaalde inhoud, opdrachtuitvoer of paginatekst bevatten.

### Detailmodus

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

`"explain"` is de standaardwaarde en houdt concepten stabiel met beknopte labels.
`"raw"` voegt waar mogelijk de onderliggende opdracht toe. Dat is nuttig bij
foutopsporing, maar zorgt voor meer ruis in de chat. Een aanroep van `node --check /tmp/app.js`
wordt bijvoorbeeld per modus anders gerenderd:

| Modus     | Voortgangsregel                                                |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                                  |
| `raw` | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js`                                  |

### Opdracht-/uitvoeringstekst

`streaming.progress.commandText` (standaard `"raw"`) bepaalt hoeveel opdrachtdetails
naast voortgangsregels voor exec/bash worden weergegeven, onafhankelijk van de bovenstaande detailmodus.
Stel dit in op `"status"` om een toolvoortgangsregel zichtbaar te houden en tegelijkertijd
de opdrachttekst volledig te verbergen:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Commentaarbaan

`streaming.progress.commentary` (standaard `false`) voegt het commentaar/de inleidende toelichting van het model
vóór toolgebruik (💬, bijvoorbeeld "Ik controleer... en daarna
...") tussen de toolregels in het concept in. Zie
[Streamen en opdelen](/nl/concepts/streaming#commentary-progress-lane) voor de
gedeelde configuratiestructuur voor alle kanalen.

Als de commentaarbaan is ingeschakeld, worden inleidingen alleen als die tussengevoegde
💬-regels gerenderd; de onderstaande statuskop blijft uit beeld, zodat de baan zijn
gedocumenteerde vorm behoudt.

### Statuskop

Op Discord en Telegram wordt in de voortgangsmodus de getypeerde inleiding van het model
vóór toolgebruik de statuskop van het concept zodra deze beschikbaar is. Andere
kanalen in de voortgangsmodus behouden hun bestaande statusgedrag. De kop is
standaard ingeschakeld en omzeilt de normale activiteitsdrempel voor korte beurten niet;
door `streaming.progress.commentary` in te schakelen, worden inleidingen in plaats daarvan aan de tussengevoegde
commentaarbaan doorgegeven.

Wanneer op Discord een hulpmiddelmodel voor de agent beschikbaar is — een expliciet
[`utilityModel`](/nl/gateway/config-agents#utilitymodel), of het opgegeven standaardmodel
voor kleine modellen van de primaire provider (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — levert het een korte aanvullende tekst in gewone taal
wanneer het model geen inleiding verzendt of ongeveer 20 seconden stil is geweest
(de kop van Telegram gebruikt momenteel alleen de inleiding):

```text
Het standaardmodel in je configuratie wordt bijgewerkt. Daarna wordt de Gateway
opnieuw gestart om de wijziging toe te passen. Eén aanroep om agents weer te geven is mislukt en wordt opnieuw geprobeerd.
```

Hulpmiddelnarratie is standaard ingeschakeld (`streaming.progress.narration`, standaard
`true`) en valt nooit terug op het primaire model: deze wordt alleen uitgevoerd met een expliciet
`utilityModel` of een door de provider opgegeven standaardwaarde voor de primaire
provider van de agent. Stel `utilityModel: ""` in om routering via hulpmiddelmodellen volledig uit te schakelen. Toolregels
blijven eronder worden verzameld en keren terug als beide statusbronnen stoppen. Bewerkingen van het concept
wachten nog steeds op de normale activiteitsdrempel en een daadwerkelijke
tekstwijziging. Dit voorkomt flitsen bij snelle beurten en vermindert het aantal bewerkingen in drukke
kanalen. Stel `narration: false` in om alleen de aanvullende tekst van het hulpmiddelmodel uit te schakelen; statuskoppen
met modelinleidingen blijven ingeschakeld:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

De invoer voor narratie is begrensd en geredigeerd: het hulpmiddelmodel ontvangt de
tekst van het binnenkomende verzoek plus dezelfde compacte, geredigeerde toolsamenvattingen die het concept
zou renderen — nooit onbewerkte opdrachtuitvoer of toolresultaten. Met
`commandText: "status"` laat de narratie-invoer ook opdrachttekst voor exec/bash weg,
overeenkomstig wat het concept toont.

### Regellimieten

Beperk hoeveel regels zichtbaar blijven (standaard 8):

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

Voortgangsregels worden automatisch compacter gemaakt om het opnieuw indelen van chatballonnen te beperken terwijl
het concept wordt bewerkt. OpenClaw kapt lange regels af, zodat herhaalde bewerkingen van het concept
niet bij elke update anders worden afgebroken. Het standaardbudget per regel is 120
tekens; lopende tekst wordt op een woordgrens afgekapt, terwijl lange details zoals paden of
onbewerkte opdrachten met een beletselteken in het midden worden ingekort, zodat het achtervoegsel zichtbaar blijft.

Pas het budget per regel aan:

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

### Uitgebreide weergave (Slack)

Slack kan voortgangsregels als gestructureerde Block Kit-velden renderen in plaats van
platte tekst:

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

Bij uitgebreide weergave wordt naast de Block Kit-velden altijd dezelfde plattetekstinhoud
verzonden, zodat clients die de uitgebreidere structuur niet kunnen renderen toch de compacte
voortgangstekst tonen.

### Tool-/taakregels verbergen

Behoud het enkele voortgangsconcept, maar verberg tool- en taakregels:

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

Met `toolProgress: false` onderdrukt OpenClaw voor die beurt nog steeds de oudere zelfstandige
berichten over toolvoortgang — het kanaal blijft visueel rustig tot
het definitieve antwoord, met uitzondering van het label als er een is geconfigureerd.

## Kanaalgedrag

| Kanaal          | Voortgangstransport                     | Opmerkingen                                                                                                                                                     |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Eén bericht verzenden en daarna bewerken. | Standaard wordt de modus `progress` gebruikt; het definitieve antwoord bevat een `-#`-activiteitenoverzicht en het statusconcept wordt verwijderd nadat het antwoord is geplaatst. |
| Matrix          | Eén gebeurtenis verzenden en daarna bewerken. | Streamingconfiguratie op accountniveau beheert concepten op accountniveau.                                                                                       |
| Microsoft Teams | Native Teams-stream in persoonlijke chats. | `streaming.mode: "block"` wordt in plaats daarvan toegewezen aan bloklevering van Teams.                                                                                 |
| Slack           | Native stream of bewerkbaar conceptbericht. | Vereist een doelantwoordthread; DM's op het hoogste niveau zonder zo'n thread krijgen nog steeds conceptvoorbeelden die worden geplaatst en bewerkt.             |
| Telegram        | Eén bericht verzenden en daarna bewerken. | Als er een bericht tussen het voortgangsconcept en het antwoord wordt geplaatst, wordt het concept eronder opnieuw geplaatst (eerst nieuw plaatsen, dan oud verwijderen) in plaats van de client te laten verspringen. |
| Mattermost      | Bewerkbaar conceptbericht.               | De modus `block` wisselt tussen voltooide tekst en berichten over toolactiviteit; andere modi nemen toolactiviteit op in hetzelfde conceptachtige bericht. |

Kanalen zonder veilige ondersteuning voor bewerken vallen terug op typindicatoren of
levering van alleen het definitieve antwoord. Zie [Streaming en segmentering](/nl/concepts/streaming) voor het
volledige overzicht van het runtimegedrag per kanaal.

## Afronding

Wanneer het definitieve antwoord klaar is, probeert OpenClaw de chat overzichtelijk te houden:

- In de modus `progress` op Discord wordt het definitieve antwoord als een nieuw bericht verzonden
  met een klein `-#`-activiteitenoverzicht erachter (bijvoorbeeld
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`) en wordt het statusconcept
  verwijderd zodra dat antwoord is afgeleverd. In drukke kanalen blijft er geen verweesd logboek van toolactiviteiten
  boven het antwoord staan; bij definitieve foutmeldingen blijft het concept zichtbaar als registratie van
  de mislukte beurt.
- Als het concept veilig het definitieve antwoord kan worden (modi `partial`/`block`),
  bewerkt OpenClaw het ter plaatse.
- Als het kanaal native voortgangsstreaming gebruikt, rondt OpenClaw die
  stream af wanneer het native transport de definitieve tekst accepteert.
- Anders (media, een goedkeuringsprompt, een expliciet antwoorddoel, te veel
  segmenten of een mislukte bewerking/verzending) verzendt OpenClaw het definitieve antwoord via het
  normale leveringspad van het kanaal in plaats van het concept te overschrijven.

De terugval is opzettelijk: een nieuw definitief antwoord verzenden is beter dan tekst verliezen,
een antwoord in de verkeerde thread plaatsen of een concept overschrijven met een payload die het kanaal
niet veilig kan weergeven.

## Probleemoplossing

**Ik zie alleen het definitieve antwoord.**

Controleer of `channels.<channel>.streaming.mode` is ingesteld op `progress` voor het account
of kanaal dat het bericht heeft verwerkt. Sommige paden voor groepen of antwoorden op citaten schakelen
conceptvoorbeelden voor een beurt uit wanneer het kanaal niet veilig het juiste
bericht kan bewerken.

**Ik zie het label, maar geen toolregels.**

Controleer `streaming.progress.toolProgress`. Als dit is ingesteld op `false`, behoudt OpenClaw het
gedrag met één concept, maar verbergt het de voortgangsregels voor tools en taken.

**Ik zie een nieuw definitief bericht in plaats van een bewerkt concept.**

Dat is de veiligheidsterugval die wordt beschreven in [Afronding](#finalization). Dit kan
gebeuren bij antwoorden met media, lange antwoorden, expliciete antwoorddoelen, oude Telegram-
concepten, ontbrekende Slack-threaddoelen, verwijderde voorbeeldberichten of een mislukte
afronding van de native stream.

**Ik zie nog steeds zelfstandige voortgangsberichten.**

De voortgangsmodus onderdrukt standaard zelfstandige berichten over toolvoortgang wanneer een
concept actief is. Als er nog steeds zelfstandige berichten verschijnen, controleer dan of de beurt
daadwerkelijk de modus `progress` gebruikt en niet `streaming.mode: "off"` of een kanaalpad
dat geen concept voor dat bericht kan maken.

**Teams gedraagt zich anders dan Discord of Telegram.**

Microsoft Teams gebruikt in persoonlijke chats een native stream in plaats van het algemene
transport voor voorbeelden via verzenden en bewerken, en wijst `streaming.mode: "block"` toe aan
bloklevering van Teams omdat het geen blokmodus voor conceptvoorbeelden heeft zoals Discord en
Telegram.

## Gerelateerd

- [Streaming en segmentering](/nl/concepts/streaming)
- [Berichten](/nl/concepts/messages)
- [Kanaalconfiguratie](/nl/gateway/config-channels)
- [Discord](/nl/channels/discord)
- [Matrix](/nl/channels/matrix)
- [Microsoft Teams](/nl/channels/msteams)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
- [Mattermost](/nl/channels/mattermost)
