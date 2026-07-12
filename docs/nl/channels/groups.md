---
read_when:
    - Groepschatgedrag of vermeldingsfiltering wijzigen
    - mentionPatterns beperken tot specifieke groepsgesprekken
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende platforms (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-07-12T08:35:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw past dezelfde groepsregels toe op alle kanalen die groepen ondersteunen, waaronder Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp en Zalo.

Voor permanent actieve ruimtes die stille context moeten bieden tenzij de agent expliciet een zichtbaar bericht verzendt, zie [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events).

## Introductie voor beginners (2 minuten)

OpenClaw 'leeft' op je eigen berichtenaccounts. Er is geen afzonderlijke WhatsApp-botgebruiker: als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`); afzenders in groepen worden geblokkeerd totdat ze op de toelatingslijst staan.
- Voor antwoorden is een vermelding vereist, tenzij je de vermeldingsvereiste voor een groep uitschakelt.
- De definitieve antwoordtekst wordt automatisch in de ruimte geplaatst (`visibleReplies: "automatic"`).

Kort gezegd: afzenders op de toelatingslijst kunnen OpenClaw activeren door het te vermelden.

<Note>
**Kort samengevat**

- **Toegang tot privéberichten** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + toelatingslijsten (`*.groups`, `*.groupAllowFrom`).
- **Het activeren van antwoorden** wordt beheerd door de vermeldingsvereiste (`requireMention`, `/activation`).

</Note>

Beknopt verloop (wat er met een groepsbericht gebeurt):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Zichtbare antwoorden

Voor normale aanvragen in groepen en kanalen gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "automatic"`: de definitieve tekst van de assistent wordt als zichtbaar antwoord in de ruimte geplaatst.

Gebruik `messages.groupChat.visibleReplies: "message_tool"` wanneer de agent in een gedeelde ruimte zelf moet bepalen wanneer deze spreekt door `message(action=send)` aan te roepen. Dit werkt het best met modellen die hulpmiddelen betrouwbaar gebruiken (bijvoorbeeld GPT-5.6 Sol). Als het model het hulpmiddel niet gebruikt en inhoudelijke definitieve tekst retourneert, houdt OpenClaw die tekst privé in plaats van deze in de ruimte te plaatsen.

Gebruik `"automatic"` voor modellen of runtimes die bezorging uitsluitend via hulpmiddelen niet betrouwbaar volgen: normale definitieve tekst wordt rechtstreeks in de ruimte geplaatst en de agent kan nog steeds `message(action=send)` aanroepen voor bestanden, afbeeldingen of andere bijlagen die niet samen met de definitieve tekst kunnen worden verzonden.

Als het berichthulpmiddel volgens het actieve hulpmiddelenbeleid niet beschikbaar is, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van de reactie stilzwijgend te onderdrukken. `openclaw doctor` waarschuwt voor deze inconsistentie.

Voor directe chats en alle andere brongebeurtenissen past `messages.visibleReplies: "message_tool"` hetzelfde gedrag met uitsluitend hulpmiddelen globaal toe; `messages.groupChat.visibleReplies` blijft de specifiekere overschrijving voor groeps- en kanaalruimtes. Interne directe WebChat-beurten gebruiken standaard automatische bezorging van het definitieve antwoord, zodat Pi en Codex hetzelfde contract voor zichtbare antwoorden ontvangen.

De modus met uitsluitend hulpmiddelen vervangt het oude patroon waarbij het model voor de meeste beurten in de meeluistermodus gedwongen werd `NO_REPLY` te antwoorden. In de modus met uitsluitend hulpmiddelen definieert de prompt geen `NO_REPLY`-contract; niets zichtbaars doen betekent simpelweg dat het berichthulpmiddel niet wordt aangeroepen.

Door Plugins beheerde gesprekskoppelingen vormen de uitzondering. Zodra een Plugin een thread koppelt en de inkomende beurt claimt, is het door de Plugin geretourneerde antwoord de zichtbare reactie van de koppeling; hiervoor is geen `message(action=send)` nodig. Dat antwoord is uitvoer van de Plugin-runtime, geen privétekst van het definitieve modelantwoord.

Typindicatoren worden nog steeds verzonden voor directe groepsaanvragen. Permanente omgevingsgebeurtenissen in ruimtes blijven, wanneer ingeschakeld, strikt en stil tenzij de agent het berichthulpmiddel aanroept.

Sessies onderdrukken standaard uitgebreide samenvattingen van hulpmiddelen en voortgang. Gebruik `/verbose on` (of `/verbose full`) om deze tijdens het opsporen van fouten voor de huidige sessie weer te geven en `/verbose off` om terug te keren naar gedrag waarbij alleen het definitieve antwoord wordt getoond. De uitgebreide status geldt per sessie en werkt hetzelfde in directe chats, groepen, kanalen en forumonderwerpen.

Gebruik [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events) om niet-vermelde gesprekken in permanent actieve groepen als stille ruimtecontext in plaats van gebruikersaanvragen in te dienen:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

De standaardwaarde is `unmentionedInbound: "user_request"`. Berichten met vermeldingen, opdrachten, afbreekverzoeken en privéberichten blijven gebruikersaanvragen.

Om te vereisen dat zichtbare uitvoer voor groeps- en kanaalaanvragen via het berichthulpmiddel verloopt:

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

Opdrachtbeurten omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar: zowel systeemeigen slashopdrachten (Discord, Telegram en andere oppervlakken met systeemeigen opdrachtondersteuning) als geautoriseerde tekstuele `/...`-opdrachten plaatsen hun reactie in de bronchat. Niet-geautoriseerde tekstuele `/...`-beurten in groepen blijven uitsluitend via het berichthulpmiddel werken; gewone chatbeurten volgen de geconfigureerde standaardwaarde.

## Zichtbaarheid van context en toelatingslijsten

Bij groepsveiligheid zijn twee verschillende mechanismen betrokken:

- **Autorisatie voor activering**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke toelatingslijsten).
- **Zichtbaarheid van context**: welke aanvullende context in het model wordt ingevoegd (tekst van antwoorden/citaten, threadgeschiedenis, doorgestuurde metagegevens).

OpenClaw behoudt context standaard zoals deze is ontvangen: toelatingslijsten bepalen wie acties kan activeren, niet welke geciteerde of historische fragmenten het model ziet. Stel `contextVisibility` in om ook aanvullende context te filteren:

| Modus               | Gedrag                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `"all"` (standaard) | Behoud aanvullende context zoals deze is ontvangen.                                              |
| `"allowlist"`       | Voeg alleen geschiedenis-, thread-, citaat- en doorgestuurde context van toegestane afzenders in. |
| `"allowlist_quote"` | Zoals `allowlist`, maar behoud daarnaast het expliciet geciteerde of beantwoorde bericht van elke afzender. |

Stel dit per kanaal (`channels.<channel>.contextVisibility`), per account (`channels.<channel>.accounts.<accountId>.contextVisibility`) of globaal (`channels.defaults.contextVisibility`) in. Kanalen die aanvullende context ophalen (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) passen het beleid toe bij het opbouwen van inkomende context; onbekende beleidscombinaties worden uit veiligheid geweigerd en de context wordt weggelaten.

![Verloop van groepsberichten](/images/groups-flow.svg)

Als je het volgende wilt...

| Doel                                                    | In te stellen waarde                                       |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan, maar alleen op @vermeldingen antwoorden | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen                       | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                               | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)   |
| Alleen jij kunt de agent in groepen activeren            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eén vertrouwde afzenderset voor meerdere kanalen hergebruiken | `groupAllowFrom: ["accessGroup:operators"]`                |

Zie [Toegangsgroepen](/nl/channels/access-groups) voor herbruikbare toelatingslijsten voor afzenders.

## Sessiesleutels

- Groepssessies gebruiken sessiesleutels van de vorm `agent:<agentId>:<channel>:group:<id>` (ruimtes/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumonderwerpen voegen `:topic:<threadId>` toe aan de groeps-ID, zodat elk onderwerp een eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of sessies per afzender als `session.dmScope` is geconfigureerd).
- Heartbeats worden uitgevoerd in de geconfigureerde Heartbeat-sessie (standaard: de hoofdsessie van de agent); groepssessies voeren geen eigen Heartbeats uit.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke privéberichten + openbare groepen (één agent)

Ja — dit werkt goed als je 'persoonlijke' verkeer uit **privéberichten** bestaat en je 'openbare' verkeer uit **groepen**.

Waarom: in de modus met één agent komen privéberichten doorgaans terecht in de **hoofd**sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, worden die groepssessies uitgevoerd in de geconfigureerde sandboxbackend, terwijl je hoofdprivéberichtensessie op de host blijft. Docker is de standaardbackend als je geen backend kiest.

Dit geeft je één agent-'brein' (gedeelde werkruimte + geheugen), maar twee uitvoeringsprofielen:

- **Privéberichten**: volledige hulpmiddelen (host)
- **Groepen**: sandbox + beperkte hulpmiddelen

<Note>
Als je werkelijk afzonderlijke werkruimtes/persona's nodig hebt ('persoonlijk' en 'openbaar' mogen nooit worden vermengd), gebruik dan een tweede agent + koppelingen. Zie [Routering met meerdere agenten](/nl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Privéberichten op de host, groepen in een sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groepen/kanalen zijn niet-hoofd -> in sandbox
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
    Wil je dat 'groepen alleen map X kunnen zien' in plaats van 'geen toegang tot de host'? Behoud `workspaceAccess: "none"` en koppel alleen paden op de toelatingslijst aan de sandbox:

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
                // hostPath:containerPath:mode
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
- Opsporen waarom een hulpmiddel wordt geblokkeerd: [Sandbox versus hulpmiddelenbeleid versus verhoogde rechten](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details over bind-mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` indien beschikbaar, opgemaakt als `<channel>:<token>`.
- `#room` is gereserveerd voor ruimtes/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`). Zeer lange ondoorzichtige ID's worden ingekort tot een stabiel token, zodat volledige routerings-ID's niet in de UI worden getoond.

## Groepsbeleid

Bepaal per kanaal hoe berichten uit groepen en ruimtes worden verwerkt:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numerieke Telegram-gebruikers-ID (configuratie zet @username om)
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

| Beleid        | Gedrag                                                               |
| ------------- | -------------------------------------------------------------------- |
| `"open"`      | Groepen omzeilen toelatingslijsten; vermeldingsvereisten blijven gelden. |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                              |
| `"allowlist"` | Sta alleen groepen/ruimten toe die overeenkomen met de geconfigureerde toelatingslijst. |

<AccordionGroup>
  <Accordion title="Opmerkingen per kanaal">
    - `groupPolicy` staat los van vermeldingsvereisten (waarvoor @vermeldingen nodig zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (terugvaloptie: expliciete `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de ID van de inkomende Signal-groep of met het telefoonnummer/de UUID van de afzender.
    - Goedkeuringen voor DM-koppeling (vermeldingen in de `*-allowFrom`-opslag) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet via toelatingslijsten voor groepen.
    - Discord: de toelatingslijst gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: de toelatingslijst gebruikt `channels.slack.channels`.
    - Matrix: de toelatingslijst gebruikt `channels.matrix.groups`. Gebruik ruimte-ID's (`!room:server`) of aliassen (`#alias:server`); sleutels met ruimtenamen komen alleen overeen met `channels.matrix.dangerouslyAllowNameMatching: true` en niet-opgeloste vermeldingen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; toelatingslijsten met `users` per ruimte worden ook ondersteund.
    - Groeps-DM's worden afzonderlijk beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: toelatingslijsten voor afzenders accepteren alleen numerieke gebruikers-ID's (`"123456789"`; de voorvoegsels `telegram:`/`tg:` worden hoofdletterongevoelig verwijderd). Vermeldingen met `@username` komen tijdens runtime niet overeen en leveren een waarschuwing in het logboek op; de configuratie zet `@username` om in ID's. Negatieve chat-ID's horen onder `channels.telegram.groups`, niet in toelatingslijsten voor afzenders.
    - De standaardwaarde is `groupPolicy: "allowlist"`; als de toelatingslijst voor groepen leeg is, worden groepsberichten geblokkeerd.
    - Runtimeveiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` is afwezig), valt het groepsbeleid veilig terug op `allowlist` in plaats van `channels.defaults.groupPolicy` over te nemen, en registreert de Gateway de terugval eenmaal per account.

  </Accordion>
</AccordionGroup>

Snel denkmodel (evaluatievolgorde voor groepsberichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Toelatingslijsten voor groepen">
    Toelatingslijsten voor groepen (`*.groups`, `*.groupAllowFrom`, kanaalspecifieke toelatingslijst).
  </Step>
  <Step title="Vermeldingsvereisten">
    Vermeldingsvereisten (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingsvereisten (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep wordt overschreven. Standaardwaarden staan per subsysteem onder `*.groups."*"`.

Een antwoord op een botbericht geldt als een impliciete vermelding wanneer het kanaal antwoordmetadata beschikbaar stelt; het citeren van een botbericht kan ook meetellen op kanalen die citaatmetadata beschikbaar stellen. Huidige ingebouwde gevallen: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp en Zalo persoonlijk.

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

Geconfigureerde `mentionPatterns` zijn regex-terugvaltriggers. Gebruik ze wanneer het platform geen systeemeigen botvermelding beschikbaar stelt, of wanneer platte tekst zoals `openclaw:` als vermelding moet gelden. Systeemeigen platformvermeldingen staan hiervan los: wanneer Discord, Slack, Telegram, Matrix of een ander kanaal kan aantonen dat het bericht de bot expliciet vermeldde, activeert die systeemeigen vermelding nog steeds, ook wanneer geconfigureerde regex-patronen worden geweigerd.

Standaard zijn geconfigureerde vermeldingspatronen overal van toepassing waar het kanaal provider- en gespreksgegevens doorgeeft aan de vermeldingsdetectie. Om te voorkomen dat brede patronen de agent in elke groep activeren, beperkt u ze per kanaal met `channels.<channel>.mentionPatterns`.

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

Gebruik de standaardwaarde `mode: "allow"` (of laat `mode` weg) wanneer regex-vermeldingspatronen breed van toepassing moeten zijn en schakel ze vervolgens in rumoerige ruimten uit met `denyIn`:

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

| Veld            | Effect                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Regex-vermeldingspatronen zijn ingeschakeld, tenzij de gespreks-ID in `denyIn` staat. Dit is de standaardinstelling.           |
| `mode: "deny"`  | Regex-vermeldingspatronen zijn uitgeschakeld, tenzij de gespreks-ID in `allowIn` staat.                                        |
| `allowIn`       | Gespreks-ID's waarvoor regex-vermeldingspatronen in de weigeringsmodus zijn ingeschakeld.                                     |
| `denyIn`        | Gespreks-ID's waarvoor regex-vermeldingspatronen zijn uitgeschakeld. `denyIn` heeft voorrang op `allowIn` als beide dezelfde ID bevatten. |

Momenteel ondersteund beleid voor regex-bereiken:

| Kanaal   | ID's gebruikt in `allowIn` / `denyIn`                                 |
| -------- | --------------------------------------------------------------------- |
| Discord  | Discord-kanaal-ID's.                                                  |
| Matrix   | Matrix-ruimte-ID's.                                                    |
| Slack    | Slack-kanaal-ID's.                                                    |
| Telegram | Groepschat-ID's, of `chatId:topic:threadId` voor forumonderwerpen.    |
| WhatsApp | WhatsApp-gespreks-ID's zoals `123@g.us`.                              |

Kanaalconfiguraties op accountniveau kunnen hetzelfde beleid instellen onder `channels.<channel>.accounts.<accountId>.mentionPatterns` wanneer dat kanaal meerdere accounts ondersteunt. Het accountbeleid heeft voor dat account voorrang op het kanaalbeleid op het hoogste niveau.

<AccordionGroup>
  <Accordion title="Opmerkingen over vermeldingsvereisten">
    - `mentionPatterns` zijn veilige, hoofdletterongevoelige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd (met een waarschuwing).
    - Voorrang van patronen: `agents.list[].groupChat.mentionPatterns` (nuttig wanneer meerdere agents een groep delen) overschrijft `messages.groupChat.mentionPatterns`; wanneer geen van beide is ingesteld, worden patronen afgeleid van de naam/emoji van de agentidentiteit.
    - Vermeldingsvereisten worden alleen afgedwongen wanneer vermeldingsdetectie mogelijk is (systeemeigen vermeldingen of geconfigureerde `mentionPatterns`).
    - Het toelaten van een groep of afzender schakelt vermeldingsvereisten niet uit; stel `requireMention` voor die groep in op `false` wanneer alle berichten een activering moeten veroorzaken.
    - De automatische promptcontext voor groepschats bevat bij elke beurt de vastgestelde instructie voor stil antwoorden; werkruimtebestanden mogen de werking van `NO_REPLY` niet dupliceren.
    - Groepen waarin automatische stille antwoorden zijn toegestaan, behandelen volledig lege modelbeurten of modelbeurten met alleen redenering als stil, gelijkwaardig aan `NO_REPLY`. Rechtstreekse chats krijgen nooit instructies voor `NO_REPLY`, en groepsantwoorden die alleen berichttools gebruiken blijven stil doordat `message(action=send)` niet wordt aangeroepen.
    - Altijd actieve achtergrondgesprekken in groepen gebruiken standaard de semantiek van gebruikersverzoeken. Stel `messages.groupChat.unmentionedInbound: "room_event"` in om ze in plaats daarvan als stille context in te dienen. Zie [Omgevingsgebeurtenissen in ruimten](/nl/channels/ambient-room-events) voor configuratievoorbeelden.
    - Ruimtegebeurtenissen worden niet opgeslagen als fictieve gebruikersverzoeken, en privétekst van de assistent uit ruimtegebeurtenissen zonder berichttool wordt niet opnieuw afgespeeld als chatgeschiedenis.
    - Standaardwaarden voor Discord staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - De context van groepsgeschiedenis wordt op alle kanalen uniform verpakt. Groepen met vermeldingsvereisten bewaren overgeslagen berichten die nog in behandeling zijn; altijd actieve groepen kunnen ook recente verwerkte ruimteberichten bewaren wanneer het kanaal dit ondersteunt. Gebruik `messages.groupChat.historyLimit` voor de globale standaardwaarde en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overschrijvingen. Stel in op `0` om dit uit te schakelen.

  </Accordion>
</AccordionGroup>

## Toolbeperkingen voor groepen/kanalen (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van de tools die **binnen een specifieke groep/ruimte/kanaal** beschikbaar zijn.

- `tools`: tools voor de hele groep toestaan/weigeren (`allow`, `alsoAllow`, `deny`; weigeren heeft voorrang).
- `toolsBySender`: overschrijvingen per afzender binnen de groep. Gebruik expliciete sleutelvoorvoegsels: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en het jokerteken `"*"`. Kanaal-ID's gebruiken canonieke OpenClaw-kanaal-ID's; aliassen zoals `teams` worden genormaliseerd naar `msteams`. Verouderde sleutels zonder voorvoegsel worden nog steeds geaccepteerd, komen alleen overeen als `id:` en leveren een waarschuwing over veroudering in het logboek op.

Bepalingsvolgorde (meest specifiek heeft voorrang):

<Steps>
  <Step title="toolsBySender voor groep">
    Overeenkomst met `toolsBySender` voor groep/kanaal.
  </Step>
  <Step title="Tools voor groep">
    `tools` voor groep/kanaal.
  </Step>
  <Step title="Standaard-toolsBySender">
    Overeenkomst met standaard-`toolsBySender` (`"*"`).
  </Step>
  <Step title="Standaardtools">
    Standaard-`tools` (`"*"`).
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
Toolbeperkingen voor groepen/kanalen worden toegepast naast het globale toolbeleid en het toolbeleid van de agent (weigeren heeft nog steeds voorrang). Sommige kanalen gebruiken een andere nesting voor ruimten/kanalen (bijvoorbeeld Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Toelatingslijsten voor groepen

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de sleutels als toelatingslijst voor groepen. Gebruik `"*"` om alle groepen toe te staan en toch het standaardgedrag voor vermeldingen in te stellen.

<Warning>
Veelvoorkomende verwarring: goedkeuring van DM-koppeling is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt het koppelingsarchief alleen DM's. Groepsopdrachten vereisen nog steeds expliciete autorisatie van de afzender in de groep via configuratietoelatingslijsten zoals `groupAllowFrom` of de gedocumenteerde configuratieterugval voor dat kanaal.
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
  <Tab title="Alleen door de eigenaar geactiveerde triggers (WhatsApp)">
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

`/activation` is een kernopdracht die alleen voor eigenaren toegankelijk is en uitsluitend van toepassing is in groepschats. Eigenaar betekent dat de afzender overeenkomt met `allowFrom` / `commands.ownerAllowFrom` van het kanaal (wanneer er geen toelatingslijst is geconfigureerd, geldt de eigen id van het account als eigenaar). De opgeslagen modus overschrijft de `requireMention` van die groep voor kanalen die deze modus raadplegen (Google Chat, QQBot, Telegram, WhatsApp), en de introductie in de systeemprompt voor de groep weerspiegelt overal de actieve modus.

## Contextvelden

Inkomende groepspayloads stellen het volgende in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van de vermeldingscontrole)
- Telegram-forumonderwerpen bevatten ook `MessageThreadId` en `IsForum`.

De systeemprompt van de agent bevat een groepsintroductie bij de eerste beurt van een nieuwe groepssessie (en na wijzigingen met `/activation`). Deze herinnert het model eraan als een mens te antwoorden, lege regels te beperken, de normale chatspatiëring te volgen en geen letterlijke `\n`-reeksen te typen. Groepen buiten Telegram raden ook Markdown-tabellen af; richtlijnen voor rijke tekst in Telegram komen uit de prompt van het Telegram-kanaal. Groepsnamen en deelnemerslabels die van het kanaal afkomstig zijn, worden weergegeven als afgeschermde, niet-vertrouwde metadata en niet als ingebedde systeeminstructies.

## iMessage-specifieke informatie

- Geef bij routering of opname in een toelatingslijst de voorkeur aan `chat_id:<id>`.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke regels voor WhatsApp-systeemprompts, waaronder de verwerking van groeps- en directe prompts, jokertekengedrag en de semantiek van accountoverschrijvingen.

## WhatsApp-specifieke informatie

Zie [Groepsberichten](/nl/channels/group-messages) voor gedrag dat alleen voor WhatsApp geldt (geschiedenisinjectie en details over de verwerking van vermeldingen).

## Gerelateerd

- [Uitzendgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
