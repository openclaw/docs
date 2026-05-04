---
read_when:
    - Gedrag van groepschats of vermeldingsgating wijzigen
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende interfaces (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-05-04T02:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt groepschats consistent op alle oppervlakken: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introductie voor beginners (2 minuten)

OpenClaw "leeft" op je eigen messaging-accounts. Er is geen aparte WhatsApp-botgebruiker. Als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`).
- Antwoorden vereisen een vermelding, tenzij je vermeldingscontrole expliciet uitschakelt.
- Normale eindantwoorden in groepen/kanalen zijn standaard privé. Zichtbare kameruitvoer gebruikt de `message`-tool.

Vertaling: afzenders op de allowlist kunnen OpenClaw activeren door het te vermelden.

<Note>
**Kort samengevat**

- **DM-toegang** wordt geregeld door `*.allowFrom`.
- **Groepstoegang** wordt geregeld door `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Antwoordactivering** wordt geregeld door vermeldingscontrole (`requireMention`, `/activation`).

</Note>

Snelle stroom (wat er met een groepsbericht gebeurt):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Zichtbare antwoorden

Voor groeps-/kanaalkamers gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` schrijft deze standaardwaarde naar configuraties van geconfigureerde kanalen die deze weglaten.
Dat betekent dat de agent de beurt nog steeds verwerkt en geheugen-/sessiestatus kan bijwerken, maar dat het normale eindantwoord niet automatisch terug in de kamer wordt geplaatst. Om zichtbaar te spreken gebruikt de agent `message(action=send)`.

Deze standaard is afhankelijk van een model/runtimeomgeving die tools betrouwbaar aanroept. Als logs
assistant-tekst tonen maar `didSendViaMessagingTool: false`, antwoordde het model
privé in plaats van de berichtentool aan te roepen. Dat is geen
Discord/Slack/Telegram-verzendfout. Gebruik een model dat betrouwbaar toolaanroepen doet voor
groeps-/kanaalsessies, of stel
`messages.groupChat.visibleReplies: "automatic"` in om legacy zichtbare
eindantwoorden te herstellen.

Als de berichtentool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw
terug op automatische zichtbare antwoorden in plaats van het antwoord stilzwijgend te onderdrukken.
`openclaw doctor` waarschuwt voor deze mismatch.

Voor directe chats en elke andere bronbeurt gebruik je `messages.visibleReplies: "message_tool"` om hetzelfde tool-only zichtbare-antwoordgedrag globaal toe te passen. Harnesses kunnen dit ook als hun niet-ingestelde standaard kiezen; de Codex-harness doet dit voor directe chats in Codex-modus. `messages.groupChat.visibleReplies` blijft de specifiekere override voor groeps-/kanaalkamers.

Dit vervangt het oude patroon waarbij het model voor de meeste lurk-mode-beurten gedwongen werd `NO_REPLY` te antwoorden. In tool-only-modus betekent niets zichtbaar doen simpelweg dat de berichtentool niet wordt aangeroepen.

Typindicatoren worden nog steeds verzonden terwijl de agent in tool-only-modus werkt. De standaard typmodus voor groepen wordt voor deze beurten opgewaardeerd van "message" naar "instant", omdat er mogelijk nooit normale assistant-berichttekst is voordat de agent beslist of de berichtentool wordt aangeroepen. Expliciete typmodusconfiguratie blijft leidend.

Om legacy automatische eindantwoorden voor groeps-/kanaalkamers te herstellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

De Gateway herlaadt de `messages`-configuratie hot nadat het bestand is opgeslagen. Herstart alleen
wanneer bestandbewaking of configuratieherlaad in de deployment is uitgeschakeld.

Om zichtbare uitvoer voor elke bronchat via de berichtentool te verplichten:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash-commando's (Discord, Telegram en andere oppervlakken met native commandondersteuning) omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar, zodat de kanaal-native command-UI het antwoord krijgt dat die verwacht. Dit geldt alleen voor gevalideerde native command-beurten; als tekst getypte `/...`-commando's en gewone chatbeurten volgen nog steeds de geconfigureerde groepsstandaard.

## Contextzichtbaarheid en allowlists

Bij groepsveiligheid zijn twee verschillende controles betrokken:

- **Triggerautorisatie**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke allowlists).
- **Contextzichtbaarheid**: welke aanvullende context in het model wordt geïnjecteerd (antwoordtekst, citaten, threadgeschiedenis, doorgestuurde metadata).

Standaard geeft OpenClaw prioriteit aan normaal chatgedrag en houdt het context grotendeels zoals ontvangen. Dit betekent dat allowlists vooral bepalen wie acties kan activeren, niet een universele redactiegrens voor elk geciteerd of historisch fragment.

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

![Groepsberichtstroom](/images/groups-flow.svg)

Als je wilt...

| Doel                                         | Wat je moet instellen                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan maar alleen antwoorden op @vermeldingen | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen           | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                    | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)   |
| Alleen jij kunt activeren in groepen         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eén vertrouwde afzenderset hergebruiken over kanalen | `groupAllowFrom: ["accessGroup:operators"]`                |

Voor herbruikbare allowlists voor afzenders, zie [Toegangsgroepen](/nl/channels/access-groups).

## Sessiesleutels

- Groepssessies gebruiken sessiesleutels `agent:<agentId>:<channel>:group:<id>` (kamers/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumonderwerpen voegen `:topic:<threadId>` toe aan de groeps-id, zodat elk onderwerp een eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of per afzender indien geconfigureerd).
- Heartbeats worden overgeslagen voor groepssessies.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke privéberichten + openbare groepen (één agent)

Ja — dit werkt goed als je "persoonlijke" verkeer **privéberichten** zijn en je "openbare" verkeer **groepen** zijn.

Waarom: in één-agentmodus komen privéberichten meestal terecht in de **hoofd**sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, draaien die groepssessies in de geconfigureerde sandbox-backend, terwijl je hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-"brein" (gedeelde werkruimte + geheugen), maar twee uitvoeringshoudingen:

- **Privéberichten**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je echt gescheiden werkruimtes/persona's nodig hebt ("persoonlijk" en "openbaar" mogen nooit mengen), gebruik dan een tweede agent + bindings. Zie [Multi-agentroutering](/nl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Privéberichten op host, groepen in sandbox">
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
    Wil je "groepen kunnen alleen map X zien" in plaats van "geen hosttoegang"? Houd `workspaceAccess: "none"` aan en mount alleen paden op de allowlist in de sandbox:

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
- Debuggen waarom een tool is geblokkeerd: [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details van bind mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` wanneer beschikbaar, geformatteerd als `<channel>:<token>`.
- `#room` is gereserveerd voor kamers/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`).

## Groepsbeleid

Bepaal hoe groeps-/kamerberichten per kanaal worden afgehandeld:

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
| `"open"`      | Groepen omzeilen allowlists; vermeldingscontrole blijft van toepassing. |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                      |
| `"allowlist"` | Sta alleen groepen/kamers toe die overeenkomen met de geconfigureerde allowlist. |

<AccordionGroup>
  <Accordion title="Opmerkingen per kanaal">
    - `groupPolicy` staat los van vermelding-gating (waarvoor @mentions vereist zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (fallback: expliciete `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de binnenkomende Signal-groeps-id of met de telefoon/UUID van de afzender.
    - DM-koppelingsgoedkeuringen (`*-allowFrom`-opslagitems) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet voor groeps-allowlists.
    - Discord: de allowlist gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: de allowlist gebruikt `channels.slack.channels`.
    - Matrix: de allowlist gebruikt `channels.matrix.groups`. Geef de voorkeur aan kamer-ID's of aliassen; naamopzoeking van deelnemende kamers is naar beste vermogen, en niet-opgeloste namen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; per-kamer-allowlists met `users` worden ook ondersteund.
    - Groeps-DM's worden apart beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - De Telegram-allowlist kan overeenkomen met gebruikers-ID's (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) of gebruikersnamen (`"@alice"` of `"alice"`); prefixes zijn hoofdletterongevoelig.
    - Standaard is `groupPolicy: "allowlist"`; als je groeps-allowlist leeg is, worden groepsberichten geblokkeerd.
    - Runtime-veiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` ontbreekt), valt groepsbeleid terug op een fail-closed-modus (meestal `allowlist`) in plaats van `channels.defaults.groupPolicy` te erven.

  </Accordion>
</AccordionGroup>

Snel mentaal model (evaluatievolgorde voor groepsberichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Groeps-allowlists">
    Groeps-allowlists (`*.groups`, `*.groupAllowFrom`, kanaalspecifieke allowlist).
  </Step>
  <Step title="Vermelding-gating">
    Vermelding-gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermelding-gating (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep wordt overschreven. Standaarden staan per subsysteem onder `*.groups."*"`.

Antwoorden op een botbericht telt als een impliciete vermelding wanneer het kanaal antwoordmetadata ondersteunt. Een botbericht citeren kan ook tellen als een impliciete vermelding op kanalen die citatiemetadata beschikbaar maken. Huidige ingebouwde gevallen omvatten Telegram, WhatsApp, Slack, Discord, Microsoft Teams en ZaloUser.

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

<AccordionGroup>
  <Accordion title="Opmerkingen over vermelding-gating">
    - `mentionPatterns` zijn hoofdletterongevoelige veilige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd.
    - Oppervlakken die expliciete vermeldingen leveren, blijven werken; patronen zijn een fallback.
    - Per-agent-overschrijving: `agents.list[].groupChat.mentionPatterns` (handig wanneer meerdere agents een groep delen).
    - Vermelding-gating wordt alleen afgedwongen wanneer vermeldingsdetectie mogelijk is (native vermeldingen of geconfigureerde `mentionPatterns`).
    - Een groep of afzender allowlisten schakelt vermelding-gating niet uit; zet de `requireMention` van die groep op `false` wanneer alle berichten moeten triggeren.
    - Promptcontext voor groepschats bevat bij elke beurt de opgeloste instructie voor stil antwoorden; workspacebestanden mogen `NO_REPLY`-mechanica niet dupliceren.
    - Groepen waar stille antwoorden zijn toegestaan, behandelen schone lege of alleen-redenerende modelbeurten als stil, gelijk aan `NO_REPLY`. Directe chats doen hetzelfde alleen wanneer directe stille antwoorden expliciet zijn toegestaan; anders blijven lege antwoorden mislukte agentbeurten.
    - Discord-standaarden staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - Groepsgeschiedeniscontext wordt uniform over kanalen heen verpakt en is **alleen in behandeling** (berichten die zijn overgeslagen door vermelding-gating); gebruik `messages.groupChat.historyLimit` voor de globale standaard en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overschrijvingen. Stel `0` in om uit te schakelen.

  </Accordion>
</AccordionGroup>

## Toolbeperkingen voor groep/kanaal (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van welke tools **binnen een specifieke groep/kamer/kanaal** beschikbaar zijn.

- `tools`: tools toestaan/weigeren voor de hele groep.
- `toolsBySender`: per-afzender-overschrijvingen binnen de groep. Gebruik expliciete key-prefixes: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en `"*"`-jokerteken. Verouderde keys zonder prefix worden nog steeds geaccepteerd en alleen als `id:` gematcht.

Oplossingsvolgorde (meest specifiek wint):

<Steps>
  <Step title="Group toolsBySender">
    Overeenkomst met groeps-/kanaal-`toolsBySender`.
  </Step>
  <Step title="Group tools">
    Groeps-/kanaal-`tools`.
  </Step>
  <Step title="Default toolsBySender">
    Standaard (`"*"`) overeenkomst met `toolsBySender`.
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
Toolbeperkingen voor groep/kanaal worden toegepast naast globaal/agent-toolbeleid (weigeren wint nog steeds). Sommige kanalen gebruiken andere nesting voor kamers/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Groeps-allowlists

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, werken de keys als een groeps-allowlist. Gebruik `"*"` om alle groepen toe te staan terwijl je nog steeds standaard vermeldingsgedrag instelt.

<Warning>
Veelvoorkomende verwarring: DM-koppelingsgoedkeuring is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt de koppelingsopslag alleen DM's. Groepsopdrachten vereisen nog steeds expliciete autorisatie van groepsafzenders via configuratie-allowlists zoals `groupAllowFrom` of de gedocumenteerde configuratiefallback voor dat kanaal.
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
  <Tab title="Alleen-eigenaar-triggers (WhatsApp)">
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

## Activatie (alleen eigenaar)

Groepseigenaren kunnen activatie per groep schakelen:

- `/activation mention`
- `/activation always`

Eigenaar wordt bepaald door `channels.whatsapp.allowFrom` (of de eigen E.164 van de bot wanneer niet ingesteld). Verstuur de opdracht als een op zichzelf staand bericht. Andere oppervlakken negeren `/activation` momenteel.

## Contextvelden

Binnenkomende groepspayloads stellen in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van vermelding-gating)
- Telegram-forumonderwerpen bevatten ook `MessageThreadId` en `IsForum`.

Kanaalspecifieke opmerkingen:

- BlueBubbles kan optioneel naamloze macOS-groepsdeelnemers verrijken vanuit de lokale Contacts-database voordat `GroupMembers` wordt ingevuld. Dit staat standaard uit en draait alleen nadat normale groeps-gating is geslaagd.

De systeemprompt van de agent bevat een groepsintro bij de eerste beurt van een nieuwe groepssessie. Die herinnert het model eraan te antwoorden als een mens, Markdown-tabellen te vermijden, lege regels te minimaliseren en normale chatafstand te volgen, en te vermijden letterlijke `\n`-reeksen te typen. Groepsnamen en deelnemerslabels afkomstig van kanalen worden weergegeven als afgeschermde niet-vertrouwde metadata, niet als inline systeeminstructies.

## iMessage-specifiek

- Geef de voorkeur aan `chat_id:<id>` bij routeren of allowlisten.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke WhatsApp-systeempromptregels, inclusief resolutie van groeps- en directe prompts, jokertekengedrag en semantiek voor accountoverschrijvingen.

## WhatsApp-specifiek

Zie [Groepsberichten](/nl/channels/group-messages) voor WhatsApp-only gedrag (geschiedenisinjectie, details over vermeldingsafhandeling).

## Gerelateerd

- [Uitzendgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
