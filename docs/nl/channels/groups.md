---
read_when:
    - Groepschatgedrag of vermeldingsfiltering wijzigen
    - mentionPatterns beperken tot specifieke groepsgesprekken
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende platforms (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-07-16T15:17:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw past dezelfde groepsregels toe op alle kanalen die groepen ondersteunen, waaronder Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp en Zalo.

Zie [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events) voor permanent actieve ruimtes die stille context moeten bieden, tenzij de agent expliciet een zichtbaar bericht verzendt.

## Introductie voor beginners (2 minuten)

OpenClaw 'leeft' in je eigen berichtenaccounts. Er is geen afzonderlijke WhatsApp-botgebruiker: als **je** lid bent van een groep, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`); afzenders in groepen worden geblokkeerd totdat ze aan de toelatingslijst zijn toegevoegd.
- Reacties vereisen een vermelding, tenzij je de vermeldingscontrole voor een groep uitschakelt.
- De tekst van het definitieve antwoord wordt automatisch in de ruimte geplaatst (`visibleReplies: "automatic"`).

Kortom: toegestane afzenders kunnen OpenClaw activeren door het te vermelden.

<Note>
**Kort samengevat**

- **Toegang tot privéberichten** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + toelatingslijsten (`*.groups`, `*.groupAllowFrom`).
- **Activering van antwoorden** wordt beheerd door vermeldingscontrole (`requireMention`, `/activation`).

</Note>

Beknopt verloop (wat er met een groepsbericht gebeurt):

```text
groupPolicy? uitgeschakeld -> negeren
groupPolicy? toelatingslijst -> groep toegestaan? nee -> negeren
requireMention? ja -> vermeld? nee -> alleen opslaan als context
vermelding/antwoord/opdracht/privébericht -> gebruikersverzoek
gesprekken in permanent actieve groepen -> gebruikersverzoek, of ruimtegebeurtenis indien geconfigureerd
```

## Zichtbare antwoorden

Voor normale verzoeken in groepen/kanalen gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "automatic"`: de definitieve tekst van de assistent wordt als zichtbaar antwoord in de ruimte geplaatst.

Gebruik `messages.groupChat.visibleReplies: "message_tool"` wanneer de agent in een gedeelde ruimte zelf moet kunnen bepalen wanneer deze spreekt door `message(action=send)` aan te roepen. Dit werkt het best met modellen die betrouwbaar tools gebruiken (bijvoorbeeld GPT-5.6 Sol). Als het model de tool niet gebruikt en inhoudelijke definitieve tekst retourneert, houdt OpenClaw die tekst privé in plaats van deze in de ruimte te plaatsen.

Gebruik `"automatic"` voor modellen of runtimes die aflevering uitsluitend via tools niet betrouwbaar volgen: normale definitieve tekst wordt rechtstreeks in de ruimte geplaatst en de agent kan nog steeds `message(action=send)` aanroepen voor bestanden, afbeeldingen of andere bijlagen die niet samen met de definitieve tekst kunnen worden verzonden.

Als de berichtentool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van de reactie stilzwijgend te onderdrukken. `openclaw doctor` waarschuwt voor deze discrepantie.

Voor directe chats en elke andere brongebeurtenis past `messages.visibleReplies: "message_tool"` hetzelfde gedrag waarbij uitsluitend tools worden gebruikt globaal toe; `messages.groupChat.visibleReplies` blijft de specifiekere overschrijving voor ruimtes van groepen/kanalen. Interne directe WebChat-beurten gebruiken standaard automatische aflevering van het definitieve antwoord, zodat Pi en Codex hetzelfde contract voor zichtbare antwoorden ontvangen.

De modus waarbij uitsluitend tools worden gebruikt vervangt het oude patroon waarbij het model voor de meeste beurten in de meeleesmodus werd gedwongen `NO_REPLY` te antwoorden. In deze modus definieert de prompt geen `NO_REPLY`-contract; niets zichtbaars doen betekent simpelweg dat de berichtentool niet wordt aangeroepen.

Door plugins beheerde gespreksbindingen vormen de uitzondering. Zodra een plugin een thread bindt en de binnenkomende beurt claimt, is het door de plugin geretourneerde antwoord de zichtbare bindingsreactie; hiervoor is `message(action=send)` niet nodig. Dat antwoord is uitvoer van de pluginruntime, geen privétekst van het definitieve modelantwoord.

Typindicatoren worden nog steeds verzonden voor directe groepsverzoeken. Omgevingsgebeurtenissen van permanent actieve ruimtes blijven, indien ingeschakeld, strikt en stil tenzij de agent de berichtentool aanroept.

Sessies onderdrukken standaard uitgebreide tool- en voortgangssamenvattingen. Gebruik `/verbose on` (of `/verbose full`) om deze tijdens foutopsporing voor de huidige sessie weer te geven en `/verbose off` om terug te keren naar gedrag waarbij alleen het definitieve antwoord wordt weergegeven. De uitgebreide status geldt per sessie en werkt hetzelfde in directe chats, groepen, kanalen en forumonderwerpen.

Gebruik [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events) om niet-vermelde gesprekken in permanent actieve groepen als stille ruimtecontext in plaats van gebruikersverzoeken in te dienen:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

De standaardwaarde is `unmentionedInbound: "user_request"`. Vermelde berichten, opdrachten, afbreekverzoeken en privéberichten blijven gebruikersverzoeken.

Om te vereisen dat zichtbare uitvoer voor verzoeken in groepen/kanalen via de berichtentool verloopt:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Om dit voor elke bronchat te vereisen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

De Gateway neemt wijzigingen in de `messages`-configuratie zonder herstart over nadat het bestand is opgeslagen. Herstart alleen wanneer het opnieuw laden van de configuratie is uitgeschakeld (`gateway.reload.mode: "off"`).

Opdrachtbeurten omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar: zowel systeemeigen slashopdrachten (Discord, Telegram en andere omgevingen met systeemeigen opdrachtondersteuning) als geautoriseerde tekstuele `/...`-opdrachten plaatsen hun antwoord in de bronchat. Niet-geautoriseerde tekstuele `/...`-beurten in groepen blijven uitsluitend via de berichtentool verlopen; gewone chatbeurten volgen de geconfigureerde standaard.

## Zichtbaarheid van context en toelatingslijsten

Voor groepsveiligheid zijn twee verschillende beheermechanismen van toepassing:

- **Autorisatie voor activering**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke toelatingslijsten).
- **Zichtbaarheid van context**: welke aanvullende context in het model wordt ingevoegd (antwoord-/citaattekst, threadgeschiedenis, doorgestuurde metagegevens).

OpenClaw behoudt context standaard zoals deze is ontvangen: toelatingslijsten bepalen wie acties kan activeren, niet welke geciteerde of historische fragmenten het model ziet. Stel `contextVisibility` in om ook aanvullende context te filteren:

| Modus                | Gedrag                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (standaard)   | Behoud aanvullende context zoals deze is ontvangen.                                           |
| `"allowlist"`       | Voeg alleen geschiedenis, threads, citaten en doorgestuurde context van toegestane afzenders in.     |
| `"allowlist_quote"` | `allowlist`, en behoud bovendien het expliciet geciteerde bericht of het bericht waarop wordt geantwoord, ongeacht de afzender. |

Stel dit per kanaal (`channels.<channel>.contextVisibility`), per account (`channels.<channel>.accounts.<accountId>.contextVisibility`) of globaal (`channels.defaults.contextVisibility`) in. Kanalen die aanvullende context ophalen (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) passen het beleid toe bij het opbouwen van binnenkomende context; bij onbekende beleidscombinaties wordt uit veiligheidsoverwegingen de context weggelaten.

![Verloop van groepsberichten](/images/groups-flow.svg)

Als je het volgende wilt...

| Doel                                         | In te stellen waarde                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan, maar alleen antwoorden op @vermeldingen | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen                    | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                         | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)         |
| Alleen jij kunt de agent in groepen activeren               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eén set vertrouwde afzenders voor meerdere kanalen hergebruiken | `groupAllowFrom: ["accessGroup:operators"]`                |

Zie [Toegangsgroepen](/nl/channels/access-groups) voor herbruikbare toelatingslijsten voor afzenders.

## Sessiesleutels

- Groepssessies gebruiken `agent:<agentId>:<channel>:group:<id>`-sessiesleutels (ruimtes/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumonderwerpen voegen `:topic:<threadId>` toe aan de groeps-id, zodat elk onderwerp een eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of sessies per afzender als `session.dmScope` is geconfigureerd).
- Heartbeats worden uitgevoerd in de geconfigureerde heartbeat-sessie (standaard: de hoofdsessie van de agent); groepssessies voeren geen eigen heartbeats uit.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke privéberichten + openbare groepen (één agent)

Ja — dit werkt goed als je 'persoonlijke' verkeer uit **privéberichten** bestaat en je 'openbare' verkeer uit **groepen**.

Reden: in de modus met één agent komen privéberichten doorgaans terecht onder de sessiesleutel van de **hoofdsessie** (`agent:main:main`), terwijl groepen altijd **niet-hoofd**-sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, worden die groepssessies uitgevoerd in de geconfigureerde sandboxbackend, terwijl je primaire privéberichtsessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-'brein' (gedeelde werkruimte + geheugen), maar twee uitvoeringsprofielen:

- **Privéberichten**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je werkelijk afzonderlijke werkruimten/persona's nodig hebt ('persoonlijk' en 'openbaar' mogen nooit worden vermengd), gebruik dan een tweede agent + bindingen. Zie [Routering met meerdere agents](/nl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Privéberichten op de host, groepen in een sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groepen/kanalen zijn niet-hoofd -> in een sandbox
            scope: "session", // sterkste isolatie (één container per groep/kanaal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Als allow niet leeg is, wordt al het overige geblokkeerd (deny heeft nog steeds voorrang).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Groepen zien alleen een map op de toelatingslijst">
    Wil je dat 'groepen alleen map X kunnen zien' in plaats van 'geen toegang tot de host'? Behoud `workspaceAccess: "none"` en koppel alleen toegestane paden aan de sandbox:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:modus
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

Gerelateerd:

- Configuratiesleutels en standaardwaarden: [Gateway-configuratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- Fouten opsporen wanneer een tool wordt geblokkeerd: [Sandbox versus toolbeleid versus verhoogde rechten](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details over bind-mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` indien beschikbaar, opgemaakt als `<channel>:<token>`.
- `#room` is gereserveerd voor ruimtes/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`). Zeer lange ondoorzichtige id's worden ingekort tot een stabiel token in plaats van volledige route-id's in de UI prijs te geven.

## Groepsbeleid

Bepaal per kanaal hoe berichten in groepen/ruimtes worden verwerkt:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numerieke Telegram-gebruikers-ID (installatie zet @username om)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Beleid        | Gedrag                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Groepen omzeilen toelatingslijsten; vermeldingsvereisten blijven van toepassing.      |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                           |
| `"allowlist"` | Sta alleen groepen/ruimten toe die overeenkomen met de geconfigureerde toelatingslijst. |

<AccordionGroup>
  <Accordion title="Opmerkingen per kanaal">
    - `groupPolicy` staat los van vermeldingsvereisten (waarvoor @vermeldingen nodig zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (terugvaloptie: expliciete `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de ID van de inkomende Signal-groep of met het telefoonnummer/de UUID van de afzender.
    - Goedkeuringen voor DM-koppeling (vermeldingen in de `*-allowFrom`-opslag) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet via groepstoelatingslijsten.
    - Discord: de toelatingslijst gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: de toelatingslijst gebruikt `channels.slack.channels`.
    - Matrix: de toelatingslijst gebruikt `channels.matrix.groups`. Gebruik ruimte-ID's (`!room:server`) of aliassen (`#alias:server`); sleutels met ruimtenamen komen alleen overeen met `channels.matrix.dangerouslyAllowNameMatching: true`, en niet-opgeloste vermeldingen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; `users`-toelatingslijsten per ruimte worden ook ondersteund.
    - Groeps-DM's worden afzonderlijk beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: toelatingslijsten voor afzenders accepteren alleen numerieke gebruikers-ID's (`"123456789"`; voorvoegsels `telegram:`/`tg:` worden hoofdletterongevoelig verwijderd). `@username`-vermeldingen komen tijdens runtime niet overeen en genereren een waarschuwing in het logboek; de installatie zet `@username` om naar ID's. Negatieve chat-ID's horen onder `channels.telegram.groups`, niet in toelatingslijsten voor afzenders.
    - De standaardwaarde is `groupPolicy: "allowlist"`; als je groepstoelatingslijst leeg is, worden groepsberichten geblokkeerd.
    - Runtimeveiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` ontbreekt), wordt het groepsbeleid gesloten teruggezet op `allowlist` in plaats van `channels.defaults.groupPolicy` over te nemen, en registreert de Gateway de terugvaloptie eenmaal per account.

  </Accordion>
</AccordionGroup>

Snel mentaal model (evaluatievolgorde voor groepsberichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Groepstoelatingslijsten">
    Groepstoelatingslijsten (`*.groups`, `*.groupAllowFrom`, kanaalspecifieke toelatingslijst).
  </Step>
  <Step title="Vermeldingsvereisten">
    Vermeldingsvereisten (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingsvereisten (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep wordt overschreven. Standaardwaarden staan per subsysteem onder `*.groups."*"`.

Antwoorden op een botbericht gelden als impliciete vermelding wanneer het kanaal antwoordmetadata beschikbaar stelt; het citeren van een botbericht kan ook meetellen op kanalen die citaatmetadata beschikbaar stellen. Huidige ingebouwde gevallen: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp en Zalo Personal.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## Bereik van geconfigureerde vermeldingspatronen

Geconfigureerde `mentionPatterns` zijn regex-terugvaltriggers. Gebruik ze wanneer het
platform geen systeemeigen botvermelding beschikbaar stelt, of wanneer je wilt dat platte tekst zoals
`openclaw:` als vermelding geldt. Systeemeigen platformvermeldingen staan hiervan los:
wanneer Discord, Slack, Telegram, Matrix, Signal of een ander kanaal kan aantonen dat het bericht
de bot expliciet vermeldde, activeert die systeemeigen vermelding nog steeds, zelfs als
geconfigureerde regex-patronen worden geweigerd.

Standaard zijn geconfigureerde vermeldingspatronen overal van toepassing waar het kanaal provider- en gespreksgegevens doorgeeft aan de vermeldingsdetectie. Om te voorkomen dat brede patronen de agent in elke groep activeren, beperk je ze per kanaal met `channels.<channel>.mentionPatterns`.

Gebruik `mode: "deny"` wanneer regex-vermeldingspatronen standaard uitgeschakeld moeten zijn voor een kanaal en schakel ze vervolgens voor specifieke ruimten in met `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Gebruik de standaardwaarde `mode: "allow"` (of laat `mode` weg) wanneer regex-vermeldingspatronen breed moeten worden toegepast en schakel ze vervolgens uit in rumoerige ruimten met `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Beleidsbepaling:

| Veld           | Effect                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Regex-vermeldingspatronen zijn ingeschakeld, tenzij de gespreks-ID in `denyIn` staat. Dit is de standaardwaarde.                    |
| `mode: "deny"`  | Regex-vermeldingspatronen zijn uitgeschakeld, tenzij de gespreks-ID in `allowIn` staat.                                       |
| `allowIn`       | Gespreks-ID's waarvoor regex-vermeldingspatronen in de weigeringsmodus zijn ingeschakeld.                                               |
| `denyIn`        | Gespreks-ID's waarvoor regex-vermeldingspatronen zijn uitgeschakeld. `denyIn` heeft voorrang op `allowIn` als beide dezelfde ID bevatten. |

Momenteel ondersteund beleid voor regex-bereiken:

| Kanaal  | ID's gebruikt in `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord-kanaal-ID's.                                         |
| Matrix   | Matrix-ruimte-ID's.                                             |
| Slack    | Slack-kanaal-ID's.                                           |
| Telegram | Groepschat-ID's, of `chatId:topic:threadId` voor forumonderwerpen. |
| WhatsApp | WhatsApp-gespreks-ID's zoals `123@g.us`.                |

Kanaalconfiguraties op accountniveau kunnen hetzelfde beleid instellen onder `channels.<channel>.accounts.<accountId>.mentionPatterns` wanneer dat kanaal meerdere accounts ondersteunt. Het accountbeleid heeft voor dat account voorrang op het kanaalbeleid op het hoogste niveau.

<AccordionGroup>
  <Accordion title="Opmerkingen over vermeldingsvereisten">
    - `mentionPatterns` zijn hoofdletterongevoelige, veilige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd (met een waarschuwing).
    - Patroonprioriteit: `agents.list[].groupChat.mentionPatterns` (nuttig wanneer meerdere agents een groep delen) overschrijft `messages.groupChat.mentionPatterns`; wanneer geen van beide is ingesteld, worden patronen afgeleid van de naam/emoji van de agentidentiteit.
    - Vermeldingsvereisten worden alleen afgedwongen wanneer vermeldingsdetectie mogelijk is (systeemeigen vermeldingen of geconfigureerde `mentionPatterns`).
    - Het opnemen van een groep of afzender in een toelatingslijst schakelt vermeldingsvereisten niet uit; stel `requireMention` van die groep in op `false` wanneer alle berichten een activering moeten veroorzaken.
    - Automatische promptcontext voor groepschats bevat bij elke beurt de vastgestelde instructie voor stil antwoorden; werkruimtebestanden mogen de werking van `NO_REPLY` niet dupliceren.
    - Groepen waarin automatische stille antwoorden zijn toegestaan, behandelen lege modelbeurten of modelbeurten met alleen redenering als stil, gelijkwaardig aan `NO_REPLY`. Directe chats ontvangen nooit `NO_REPLY`-instructies, en groepsantwoorden die alleen berichttools gebruiken blijven stil doordat `message(action=send)` niet wordt aangeroepen.
    - Voortdurende achtergrondgesprekken in groepen gebruiken standaard de semantiek van gebruikersverzoeken. Stel `messages.groupChat.unmentionedInbound: "room_event"` in om ze in plaats daarvan als stille context in te dienen. Zie [Omgevingsgebeurtenissen in ruimten](/nl/channels/ambient-room-events) voor installatievoorbeelden.
    - Ruimtegebeurtenissen worden niet opgeslagen als nagebootste gebruikersverzoeken, en privétekst van de assistent uit ruimtegebeurtenissen zonder berichttool wordt niet opnieuw afgespeeld als chatgeschiedenis.
    - Standaardwaarden voor Discord staan in `channels.discord.guilds."*"` (overschrijfbaar per server/kanaal).
    - Context van groepsgeschiedenis wordt uniform verpakt voor alle kanalen. Groepen met vermeldingsvereisten bewaren overgeslagen berichten die nog in behandeling zijn; altijd actieve groepen kunnen ook recente verwerkte ruimteberichten bewaren wanneer het kanaal dit ondersteunt. Gebruik `messages.groupChat.historyLimit` voor de algemene standaardwaarde en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overschrijvingen. Stel `0` in om dit uit te schakelen.

  </Accordion>
</AccordionGroup>

## Beperkingen voor groeps-/kanaaltools (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van de tools die **binnen een specifieke groep/ruimte/kanaal** beschikbaar zijn.

- `tools`: tools toestaan/weigeren voor de hele groep (`allow`, `alsoAllow`, `deny`; weigeren heeft voorrang).
- `toolsBySender`: overschrijvingen per afzender binnen de groep. Gebruik expliciete sleutelvoorvoegsels: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en het jokerteken `"*"`. Kanaal-ID's gebruiken canonieke OpenClaw-kanaal-ID's; aliassen zoals `teams` worden genormaliseerd naar `msteams`. Verouderde sleutels zonder voorvoegsel worden nog steeds geaccepteerd, komen alleen overeen als `id:` en genereren een verouderingswaarschuwing in het logboek.

Bepalingsvolgorde (meest specifiek heeft voorrang):

<Steps>
  <Step title="Groeps-toolsBySender">
    Overeenkomst met `toolsBySender` van groep/kanaal.
  </Step>
  <Step title="Groepstools">
    `tools` van groep/kanaal.
  </Step>
  <Step title="Standaard-toolsBySender">
    Overeenkomst met `toolsBySender` van de standaardwaarde (`"*"`).
  </Step>
  <Step title="Standaardtools">
    `tools` van de standaardwaarde (`"*"`).
  </Step>
</Steps>

Voorbeeld (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Beperkingen voor tools in groepen/kanalen worden toegepast naast het globale/agentbeleid voor tools (weigeren heeft nog steeds voorrang). Sommige kanalen gebruiken een andere nesting voor ruimten/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Toelatingslijsten voor groepen

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de sleutels als toelatingslijst voor groepen. Gebruik `"*"` om alle groepen toe te staan en toch het standaardgedrag voor vermeldingen in te stellen.

<Warning>
Veelvoorkomende verwarring: goedkeuring van DM-koppeling is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt de koppelingsopslag alleen DM's. Groepsopdrachten vereisen nog steeds expliciete autorisatie van de afzender in de groep via toelatingslijsten in de configuratie, zoals `groupAllowFrom`, of via de gedocumenteerde configuratieterugval voor dat kanaal.
</Warning>

Veelvoorkomende doelen (kopiëren/plakken):

<Tabs>
  <Tab title="Alle groepsantwoorden uitschakelen">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Alleen specifieke groepen toestaan (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Alle groepen toestaan, maar een vermelding vereisen">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Triggers alleen voor de eigenaar (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Activering (alleen eigenaar)

Groepseigenaren kunnen de activering per groep omschakelen met een afzonderlijk bericht:

- `/activation mention`
- `/activation always`

`/activation` is een kernopdracht die alleen voor eigenaren toegankelijk is en alleen van toepassing is in groepschats. Eigenaar betekent dat de afzender overeenkomt met `commands.ownerAllowFrom`; lijsten met `allowFrom` van het kanaal regelen alleen de normale toegang tot het kanaal en opdrachten. De opgeslagen modus overschrijft de `requireMention` van die groep op kanalen die deze raadplegen (Google Chat, QQBot, Telegram, WhatsApp), en de inleiding van de systeemprompt voor de groep weerspiegelt overal de actieve modus.

## Contextvelden

Inkomende groepspayloads stellen het volgende in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van de vermeldingscontrole)
- Telegram-forumonderwerpen bevatten ook `MessageThreadId` en `IsForum`.

De systeemprompt van de agent bevat bij de eerste beurt van een nieuwe groepssessie (en nadat `/activation` verandert) een groepsinleiding. Deze herinnert het model eraan als een mens te reageren, lege regels te beperken en de normale witruimte van chats te volgen, en te voorkomen dat letterlijke `\n`-reeksen worden getypt. Kanalen waarvan de opgegeven tabelmodus systeemeigen of onbewerkte tabellen niet behoudt, raden Markdown-tabellen eveneens af. Uit het kanaal afkomstige groepsnamen en deelnemerslabels worden weergegeven als afgeschermde, niet-vertrouwde metagegevens en niet als inline systeeminstructies.

## Bijzonderheden van iMessage

- Geef de voorkeur aan `chat_id:<id>` voor routering of opname in toelatingslijsten.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke regels voor WhatsApp-systeemprompts, waaronder de verwerking van groeps- en directe prompts, jokertekengedrag en de semantiek van accountoverschrijvingen.

## Bijzonderheden van WhatsApp

Zie [Groepsberichten](/nl/channels/group-messages) voor gedrag dat alleen voor WhatsApp geldt (geschiedenisinjectie en details over de verwerking van vermeldingen).

## Gerelateerd

- [Uitzendgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
