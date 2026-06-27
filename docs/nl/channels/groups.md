---
read_when:
    - Gedrag van groepschats of vermeldingsgating wijzigen
    - mentionPatterns beperken tot specifieke groepsgesprekken
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende oppervlakken (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-06-27T17:10:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt groepschats consistent op alle oppervlakken: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Voor altijd actieve ruimtes die stille context moeten bieden tenzij de agent expliciet een zichtbaar bericht verstuurt, zie [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events).

## Intro voor beginners (2 minuten)

OpenClaw "leeft" op je eigen berichtenaccounts. Er is geen aparte WhatsApp-botgebruiker. Als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`).
- Antwoorden vereisen een vermelding, tenzij je vermeldingsafscherming expliciet uitschakelt.
- Zichtbare antwoorden in groepen/kanalen gebruiken standaard de `message`-tool.

Vertaling: afzenders op de allowlist kunnen OpenClaw activeren door het te vermelden.

<Note>
**Kort samengevat**

- **DM-toegang** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Antwoordactivering** wordt beheerd door vermeldingsafscherming (`requireMention`, `/activation`).

</Note>

Snelle flow (wat er met een groepsbericht gebeurt):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Zichtbare antwoorden

Voor normale groeps-/kanaalverzoeken gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "automatic"`. Definitieve assistenttekst wordt via het oude pad voor zichtbare antwoorden geplaatst, tenzij je de ruimte instelt op uitvoer alleen via de message-tool.

Gebruik `messages.groupChat.visibleReplies: "message_tool"` wanneer een gedeelde ruimte de agent moet laten beslissen wanneer die spreekt door `message(action=send)` aan te roepen. Dit werkt het best voor groepsruimtes die worden ondersteund door nieuwste-generatie modellen met betrouwbare toolaanroepen, zoals GPT 5.5. Als het model die tool mist en inhoudelijke definitieve tekst teruggeeft, houdt OpenClaw die definitieve tekst privé in plaats van die in de ruimte te plaatsen.

Gebruik `"automatic"` voor zwakkere modellen of runtimes die levering alleen via tools niet betrouwbaar begrijpen. In automatische modus is de definitieve assistenttekst van de agent het zichtbare bronantwoordpad, zodat een model dat `message(action=send)` niet consequent kan aanroepen nog steeds normaal kan antwoorden.

In automatische modus worden normale definitieve tekstantwoorden direct in de ruimte geplaatst. Als het zichtbare antwoord bestanden, afbeeldingen of andere bijlagen nodig heeft, kan de agent nog steeds `message(action=send)` gebruiken voor die bijlage in plaats van te proberen die via het definitieve tekstantwoord te forceren.

Als de message-tool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van de reactie stilzwijgend te onderdrukken. `openclaw doctor` waarschuwt voor deze mismatch.

Voor directe chats en elke andere brongebeurtenis gebruik je `messages.visibleReplies: "message_tool"` om hetzelfde gedrag voor zichtbare antwoorden alleen via tools globaal toe te passen. Interne directe WebChat-beurten gebruiken standaard automatische levering van definitieve antwoorden, zodat Pi en Codex hetzelfde contract voor zichtbare antwoorden ontvangen. Stel `messages.visibleReplies: "message_tool"` in om bewust `message(action=send)` te vereisen voor zichtbare uitvoer. `messages.groupChat.visibleReplies` blijft de specifiekere override voor groeps-/kanaalruimtes.

Dit vervangt het oude patroon waarbij het model voor de meeste lurk-modusbeurten gedwongen werd `NO_REPLY` te antwoorden. In modus alleen via tools definieert de prompt geen `NO_REPLY`-contract. Niets zichtbaars doen betekent simpelweg de message-tool niet aanroepen.

Plugin-eigen gespreksbindingen zijn de uitzondering. Zodra een Plugin een thread bindt en de inkomende beurt claimt, is het antwoord dat de Plugin teruggeeft de zichtbare bindingsreactie; daarvoor is geen `message(action=send)` nodig. Dat antwoord is uitvoer van de Plugin-runtime, geen privé definitieve modeltekst.

Type-indicatoren worden nog steeds verzonden voor directe groepsverzoeken. Altijd actieve omgevingsgebeurtenissen in ruimtes blijven, wanneer ingeschakeld, strikt en stil tenzij de agent de message-tool aanroept.

Sessies onderdrukken standaard uitgebreide tool-/voortgangssamenvattingen. Gebruik `/verbose on` om die samenvattingen tijdens het debuggen voor de huidige sessie te tonen, en `/verbose off` om terug te keren naar gedrag met alleen definitieve antwoorden. Dezelfde uitgebreide status geldt voor directe chats, groepen, kanalen en forumonderwerpen.

Om niet-vermelde altijd actieve groepsgesprekken in te dienen als stille ruimtecontext in plaats van gebruikersverzoeken, gebruik je [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

De standaard is `unmentionedInbound: "user_request"`.

Vermelde berichten, opdrachten, afbreekverzoeken en DM's blijven gebruikersverzoeken.

Om zichtbare uitvoer voor groeps-/kanaalverzoeken via de message-tool te laten lopen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

De Gateway laadt de `messages`-configuratie hot-reload nadat het bestand is opgeslagen. Herstart alleen wanneer bestandsbewaking of configuratieherladen in de deployment is uitgeschakeld.

Om zichtbare uitvoer voor elke bronchat via de message-tool te laten lopen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash-opdrachten (Discord, Telegram en andere oppervlakken met native opdrachtsteun) omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar, zodat de kanaal-native opdracht-UI de reactie krijgt die die verwacht. Dit geldt alleen voor gevalideerde native opdrachtbeurten; tekstueel getypte `/...`-opdrachten en gewone chatbeurten volgen nog steeds de geconfigureerde groepsstandaard.

## Contextzichtbaarheid en allowlists

Bij groepsveiligheid zijn twee verschillende controles betrokken:

- **Activeringsautorisatie**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke allowlists).
- **Contextzichtbaarheid**: welke aanvullende context in het model wordt geïnjecteerd (antwoordtekst, citaten, threadgeschiedenis, doorgestuurde metadata).

Standaard geeft OpenClaw prioriteit aan normaal chatgedrag en houdt het context grotendeels zoals ontvangen. Dit betekent dat allowlists vooral bepalen wie acties kan activeren, niet een universele redactielimiet voor elk geciteerd of historisch fragment.

<AccordionGroup>
  <Accordion title="Huidig gedrag is kanaalspecifiek">
    - Sommige kanalen passen al afzendergebaseerde filtering toe voor aanvullende context in specifieke paden (bijvoorbeeld Slack-threadseeding, Matrix-antwoord-/threadlookups).
    - Andere kanalen geven citaat-/antwoord-/doorstuurcontext nog steeds door zoals ontvangen.

  </Accordion>
  <Accordion title="Hardening-richting (gepland)">
    - `contextVisibility: "all"` (standaard) behoudt het huidige gedrag zoals ontvangen.
    - `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders op de allowlist.
    - `contextVisibility: "allowlist_quote"` is `allowlist` plus één expliciete citaat-/antwoorduitzondering.

    Totdat dit hardening-model consistent over kanalen is geïmplementeerd, kun je verschillen per oppervlak verwachten.

  </Accordion>
</AccordionGroup>

![Groepsberichtflow](/images/groups-flow.svg)

Als je wilt...

| Doel                                         | Wat je instelt                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan maar alleen antwoorden op @vermeldingen | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen           | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                    | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)   |
| Alleen jij kunt in groepen activeren         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eén vertrouwde afzenderset hergebruiken over kanalen | `groupAllowFrom: ["accessGroup:operators"]`                |

Voor herbruikbare afzender-allowlists, zie [Toegangsgroepen](/nl/channels/access-groups).

## Sessiesleutels

- Groepssessies gebruiken `agent:<agentId>:<channel>:group:<id>`-sessiesleutels (ruimtes/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumonderwerpen voegen `:topic:<threadId>` toe aan de groeps-id, zodat elk onderwerp een eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of per afzender, indien geconfigureerd).
- Heartbeats worden overgeslagen voor groepssessies.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke DM's + openbare groepen (één agent)

Ja — dit werkt goed als je "persoonlijke" verkeer **DM's** is en je "openbare" verkeer **groepen** is.

Waarom: in modus met één agent komen DM's meestal terecht in de **hoofd**-sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**-sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, draaien die groepssessies in de geconfigureerde sandboxbackend terwijl je hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-"brein" (gedeelde werkruimte + geheugen), maar twee uitvoeringshoudingen:

- **DM's**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je echt gescheiden werkruimtes/persona's nodig hebt ("persoonlijk" en "openbaar" mogen nooit mengen), gebruik dan een tweede agent + bindingen. Zie [Multi-Agent Routing](/nl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM's op host, groepen in sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Groepen zien alleen een map op de allowlist">
    Wil je dat "groepen alleen map X kunnen zien" in plaats van "geen hosttoegang"? Houd `workspaceAccess: "none"` aan en mount alleen paden op de allowlist in de sandbox:

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

- Configuratiesleutels en standaarden: [Gateway-configuratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- Debuggen waarom een tool is geblokkeerd: [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details over bind mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` wanneer beschikbaar, geformatteerd als `<channel>:<token>`.
- `#room` is gereserveerd voor ruimtes/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`).

## Groepsbeleid

Bepaal hoe groeps-/ruimteberichten per kanaal worden afgehandeld:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
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

| Beleid        | Gedrag                                                       |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Groepen omzeilen toegestane lijsten; vermeldingscontrole blijft gelden. |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                      |
| `"allowlist"` | Sta alleen groepen/ruimtes toe die overeenkomen met de geconfigureerde toegestane lijst. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` staat los van vermeldingscontrole (waarvoor @vermeldingen vereist zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (fallback: expliciete `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de inkomende Signal-groeps-ID of met het telefoonnummer/de UUID van de afzender.
    - Goedkeuringen voor DM-koppeling (`*-allowFrom`-storevermeldingen) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet via toegestane lijsten voor groepen.
    - Discord: de toegestane lijst gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: de toegestane lijst gebruikt `channels.slack.channels`.
    - Matrix: de toegestane lijst gebruikt `channels.matrix.groups`. Geef de voorkeur aan ruimte-ID's of aliassen; naamopzoeking voor toegetreden ruimtes is best-effort, en niet-opgeloste namen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; toegestane lijsten per ruimte met `users` worden ook ondersteund.
    - Groeps-DM's worden apart beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - De Telegram-toegestane lijst kan overeenkomen met gebruikers-ID's (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) of gebruikersnamen (`"@alice"` of `"alice"`); prefixes zijn niet hoofdlettergevoelig.
    - Standaard is `groupPolicy: "allowlist"`; als je toegestane lijst voor groepen leeg is, worden groepsberichten geblokkeerd.
    - Runtime-veiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt groepsbeleid terug op een fail-closed-modus (meestal `allowlist`) in plaats van `channels.defaults.groupPolicy` te erven.

  </Accordion>
</AccordionGroup>

Snel mentaal model (evaluatievolgorde voor groepsberichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Toegestane lijsten voor groepen (`*.groups`, `*.groupAllowFrom`, kanaalspecifieke toegestane lijst).
  </Step>
  <Step title="Mention gating">
    Vermeldingscontrole (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingscontrole (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep wordt overschreven. Standaarden staan per subsysteem onder `*.groups."*"`.

Antwoorden op een botbericht telt als een impliciete vermelding wanneer het kanaal antwoordmetadata ondersteunt. Een botbericht citeren kan ook als impliciete vermelding tellen op kanalen die citaatmetadata blootstellen. Huidige ingebouwde gevallen omvatten Telegram, WhatsApp, Slack, Discord, Microsoft Teams en ZaloUser.

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

## Geconfigureerde vermeldingspatronen beperken

Geconfigureerde `mentionPatterns` zijn regex-fallbacktriggers. Gebruik ze wanneer het platform geen native botvermelding blootstelt, of wanneer je wilt dat platte tekst zoals `openclaw:` als vermelding telt. Native platformvermeldingen staan hier los van: wanneer Discord, Slack, Telegram, Matrix of een ander kanaal kan bewijzen dat het bericht de bot expliciet heeft vermeld, triggert die native vermelding nog steeds, zelfs als geconfigureerde regexpatronen worden geweigerd.

Standaard gelden geconfigureerde vermeldingspatronen overal waar dat kanaal provider- en conversatiegegevens doorgeeft aan vermeldingsdetectie. Beperk ze per kanaal met `channels.<channel>.mentionPatterns` om te voorkomen dat brede patronen de agent in elke groep wekken.

Gebruik `mode: "deny"` wanneer regex-vermeldingspatronen standaard uit moeten staan voor een kanaal, en meld specifieke ruimtes vervolgens aan met `allowIn`:

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

Gebruik de standaard `mode: "allow"` (of laat `mode` weg) wanneer regex-vermeldingspatronen breed moeten gelden, en schakel ze vervolgens uit in drukke ruimtes met `denyIn`:

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

Beleidsresolutie:

| Veld            | Effect                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Regex-vermeldingspatronen zijn ingeschakeld, tenzij de conversatie-ID in `denyIn` staat. Dit is de standaard.          |
| `mode: "deny"`  | Regex-vermeldingspatronen zijn uitgeschakeld, tenzij de conversatie-ID in `allowIn` staat.                            |
| `allowIn`       | Conversatie-ID's waarvoor regex-vermeldingspatronen in deny-modus zijn ingeschakeld.                                  |
| `denyIn`        | Conversatie-ID's waarvoor regex-vermeldingspatronen zijn uitgeschakeld. `denyIn` wint van `allowIn` als beide dezelfde ID bevatten. |

Ondersteund beleid voor scoped regex vandaag:

| Kanaal   | ID's gebruikt in `allowIn` / `denyIn`                     |
| -------- | --------------------------------------------------------- |
| Discord  | Discord-kanaal-ID's.                                      |
| Matrix   | Matrix-ruimte-ID's.                                       |
| Slack    | Slack-kanaal-ID's.                                        |
| Telegram | Groepschat-ID's, of `chatId:topic:threadId` voor forumonderwerpen. |
| WhatsApp | WhatsApp-conversatie-ID's zoals `123@g.us`.               |

Kanaalconfiguraties op accountniveau kunnen hetzelfde beleid instellen onder `channels.<channel>.accounts.<accountId>.mentionPatterns` wanneer dat kanaal meerdere accounts ondersteunt. Accountbeleid heeft voorrang op het kanaalbeleid op topniveau voor dat account.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` zijn veilige regexpatronen die niet hoofdlettergevoelig zijn; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd.
    - Oppervlakken die expliciete vermeldingen bieden, blijven passeren; geconfigureerde regexpatronen zijn een fallback.
    - `channels.<channel>.mentionPatterns.mode: "deny"` schakelt geconfigureerde vermeldingspatronen standaard uit voor dat kanaal; meld geselecteerde conversaties weer aan met `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` schakelt geconfigureerde vermeldingspatronen uit voor specifieke conversatie-ID's, terwijl native platform-@vermeldingen blijven passeren.
    - Overschrijving per agent: `agents.list[].groupChat.mentionPatterns` (handig wanneer meerdere agents een groep delen).
    - Vermeldingscontrole wordt alleen afgedwongen wanneer vermeldingsdetectie mogelijk is (native vermeldingen of `mentionPatterns` zijn geconfigureerd).
    - Een groep of afzender toestaan schakelt vermeldingscontrole niet uit; zet `requireMention` van die groep op `false` wanneer alle berichten moeten triggeren.
    - Automatische promptcontext voor groepschats draagt de opgeloste instructie voor stil antwoorden bij elke beurt mee; werkruimtebestanden mogen `NO_REPLY`-mechanica niet dupliceren.
    - Groepen waar automatische stille antwoorden zijn toegestaan, behandelen schone lege modelbeurten of modelbeurten met alleen redenering als stil, equivalent aan `NO_REPLY`. Directe chats ontvangen nooit `NO_REPLY`-begeleiding, en groepsantwoorden met alleen message-tools blijven stil door `message(action=send)` niet aan te roepen.
    - Omgevingsruis uit altijd-aan groepschats gebruikt standaard semantiek voor gebruikersverzoeken. Stel `messages.groupChat.unmentionedInbound: "room_event"` in om dit in plaats daarvan als stille context in te dienen. Zie [Omgevingsruimtegebeurtenissen](/nl/channels/ambient-room-events) voor configuratievoorbeelden.
    - Ruimtegebeurtenissen worden niet opgeslagen als nep-gebruikersverzoeken, en private assistenttekst van ruimtegebeurtenissen zonder message-tool wordt niet opnieuw afgespeeld als chatgeschiedenis.
    - Discord-standaarden staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - Groepsgeschiedeniscontext wordt uniform over kanalen heen verpakt. Groepen met vermeldingscontrole bewaren overgeslagen berichten die nog wachten; altijd-aan groepen kunnen ook recente verwerkte ruimteberichten bewaren wanneer het kanaal dit ondersteunt. Gebruik `messages.groupChat.historyLimit` voor de globale standaard en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overschrijvingen. Stel `0` in om uit te schakelen.

  </Accordion>
</AccordionGroup>

## Toolbeperkingen voor groepen/kanalen (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van welke tools **binnen een specifieke groep/ruimte/kanaal** beschikbaar zijn.

- `tools`: tools toestaan/weigeren voor de hele groep.
- `toolsBySender`: overschrijvingen per afzender binnen de groep. Gebruik expliciete key-prefixes: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en `"*"`-wildcard. Kanaal-ID's gebruiken canonieke OpenClaw-kanaal-ID's; aliassen zoals `teams` normaliseren naar `msteams`. Verouderde keys zonder prefix worden nog steeds geaccepteerd en alleen als `id:` gematcht.

Resolutievolgorde (meest specifiek wint):

<Steps>
  <Step title="Group toolsBySender">
    Overeenkomst met `toolsBySender` voor groep/kanaal.
  </Step>
  <Step title="Group tools">
    `tools` voor groep/kanaal.
  </Step>
  <Step title="Default toolsBySender">
    Overeenkomst met standaard (`"*"`) `toolsBySender`.
  </Step>
  <Step title="Default tools">
    Standaard (`"*"`) `tools`.
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
Toolbeperkingen voor groepen/kanalen worden toegepast naast globaal/agent-toolbeleid (weigeren wint nog steeds). Sommige kanalen gebruiken andere nesting voor ruimtes/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Toegestane lijsten voor groepen

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de keys als een toegestane lijst voor groepen. Gebruik `"*"` om alle groepen toe te staan en tegelijk standaard vermeldingsgedrag in te stellen.

<Warning>
Veelvoorkomende verwarring: goedkeuring voor DM-koppeling is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt de koppelingsopslag alleen DM's. Groepsopdrachten vereisen nog steeds expliciete autorisatie van groepsafzenders via configuratie-allowlists zoals `groupAllowFrom` of de gedocumenteerde configuratie-fallback voor dat kanaal.
</Warning>

Veelvoorkomende intenties (kopiëren/plakken):

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
  <Tab title="Alle groepen toestaan maar vermelding vereisen">
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
  <Tab title="Triggers alleen voor eigenaar (WhatsApp)">
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

Groepseigenaren kunnen activering per groep in- of uitschakelen:

- `/activation mention`
- `/activation always`

De eigenaar wordt bepaald door `channels.whatsapp.allowFrom` (of de eigen E.164 van de bot wanneer niet ingesteld). Verstuur de opdracht als een zelfstandig bericht. Andere oppervlakken negeren `/activation` momenteel.

## Contextvelden

Inkomende groepspayloads stellen het volgende in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van vermeldingsgating)
- Telegram-forumonderwerpen bevatten ook `MessageThreadId` en `IsForum`.

De systeemprompt van de agent bevat bij de eerste beurt van een nieuwe groepssessie een groepsintro. Deze herinnert het model eraan om als een mens te reageren, lege regels te beperken, normale chatspatiëring te volgen en geen letterlijke `\n`-reeksen te typen. Niet-Telegram-groepen ontmoedigen ook Markdown-tabellen; richtlijnen voor rich text in Telegram komen uit de prompt van het Telegram-kanaal. Kanaalafkomstige groepsnamen en deelnemerslabels worden weergegeven als fenced niet-vertrouwde metadata, niet als inline systeeminstructies.

## iMessage-specifiek

- Geef de voorkeur aan `chat_id:<id>` bij routering of allowlisting.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke regels voor WhatsApp-systeemprompts, inclusief resolutie van groeps- en directe prompts, wildcardgedrag en semantiek voor account-override.

## WhatsApp-specifiek

Zie [Groepsberichten](/nl/channels/group-messages) voor WhatsApp-specifiek gedrag (geschiedenisinjectie, details over vermeldingsafhandeling).

## Gerelateerd

- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
