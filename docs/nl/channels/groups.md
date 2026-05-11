---
read_when:
    - Gedrag van groepschats of vermeldingsgating wijzigen
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende oppervlakken (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-05-11T20:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt groepschats consistent op alle oppervlakken: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introductie voor beginners (2 minuten)

OpenClaw "leeft" op je eigen messaging-accounts. Er is geen aparte WhatsApp-botgebruiker. Als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`).
- Antwoorden vereisen een vermelding, tenzij je mention gating expliciet uitschakelt.
- Normale eindantwoorden in groepen/kanalen zijn standaard privé. Zichtbare uitvoer in de ruimte gebruikt de `message`-tool.

Vertaling: toegestane afzenders kunnen OpenClaw activeren door het te vermelden.

<Note>
**TL;DR**

- **DM-toegang** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Antwoordactivering** wordt beheerd door mention gating (`requireMention`, `/activation`).

</Note>

Snelle flow (wat er met een groepsbericht gebeurt):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Zichtbare antwoorden

Voor groeps-/kanaalruimtes gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` schrijft deze standaardwaarde naar geconfigureerde kanaalconfiguraties waarin deze ontbreekt.
Dat betekent dat de agent de beurt nog steeds verwerkt en geheugen-/sessiestatus kan bijwerken, maar dat het normale eindantwoord niet automatisch terug in de ruimte wordt geplaatst. Om zichtbaar te spreken, gebruikt de agent `message(action=send)`.

Deze standaard hangt af van een model/runtime die tools betrouwbaar aanroept. Als logs
assistant-tekst tonen maar `didSendViaMessagingTool: false`, heeft het model
privé geantwoord in plaats van de berichtentool aan te roepen. Dat is geen
verzendfout van Discord/Slack/Telegram. Gebruik een model dat betrouwbaar tools aanroept voor
groeps-/kanaalsessies, of stel
`messages.groupChat.visibleReplies: "automatic"` in om verouderde zichtbare
eindantwoorden te herstellen.

Als de berichtentool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw
terug op automatische zichtbare antwoorden in plaats van de reactie stilzwijgend te onderdrukken.
`openclaw doctor` waarschuwt voor deze mismatch.

Voor directe chats en elke andere bronbeurt gebruik je `messages.visibleReplies: "message_tool"` om hetzelfde tool-only zichtbare-antwoordgedrag globaal toe te passen. Harnesses kunnen dit ook kiezen als hun niet-ingestelde standaard; de Codex-harness doet dit voor directe chats in Codex-modus. `messages.groupChat.visibleReplies` blijft de specifiekere override voor groeps-/kanaalruimtes.

Dit vervangt het oude patroon waarbij het model werd gedwongen om `NO_REPLY` te antwoorden voor de meeste lurk-modusbeurten. In tool-only modus betekent niets zichtbaar doen simpelweg dat de berichtentool niet wordt aangeroepen.

Typing-indicatoren worden nog steeds verzonden terwijl de agent in tool-only modus werkt. De standaard groeps-typingmodus wordt voor deze beurten opgewaardeerd van "message" naar "instant", omdat er mogelijk nooit normale assistant-berichttekst is voordat de agent beslist of hij de berichtentool aanroept. Expliciete typingmodusconfiguratie blijft voorrang hebben.

Om verouderde automatische eindantwoorden voor groeps-/kanaalruimtes te herstellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

De Gateway laadt de `messages`-configuratie hot-reload nadat het bestand is opgeslagen. Herstart alleen
wanneer file watching of config reload in de deployment is uitgeschakeld.

Om zichtbare uitvoer voor elke bronchat via de berichtentool te verplichten:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash-commando's (Discord, Telegram en andere oppervlakken met native commando-ondersteuning) omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar, zodat de kanaal-native commando-UI de reactie krijgt die deze verwacht. Dit geldt alleen voor gevalideerde native commandobeurten; als tekst getypte `/...`-commando's en gewone chatbeurten volgen nog steeds de geconfigureerde groepsstandaard.

## Contextzichtbaarheid en allowlists

Bij groepsveiligheid zijn twee verschillende controles betrokken:

- **Triggerautorisatie**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke allowlists).
- **Contextzichtbaarheid**: welke aanvullende context in het model wordt geïnjecteerd (antwoordtekst, citaten, threadgeschiedenis, doorgestuurde metadata).

Standaard geeft OpenClaw prioriteit aan normaal chatgedrag en houdt het context grotendeels zoals ontvangen. Dit betekent dat allowlists vooral bepalen wie acties kan activeren, en geen universele redactiegrens vormen voor elk geciteerd of historisch fragment.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Sommige kanalen passen al afzendergebaseerde filtering toe voor aanvullende context in specifieke paden (bijvoorbeeld Slack-thread seeding, Matrix-antwoord-/threadlookups).
    - Andere kanalen geven citaat-/antwoord-/doorstuurcontext nog steeds door zoals ontvangen.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (standaard) behoudt het huidige gedrag zoals ontvangen.
    - `contextVisibility: "allowlist"` filtert aanvullende context tot toegestane afzenders.
    - `contextVisibility: "allowlist_quote"` is `allowlist` plus één expliciete citaat-/antwoorduitzondering.

    Totdat dit hardening-model consistent over kanalen is geïmplementeerd, kun je verschillen per oppervlak verwachten.

  </Accordion>
</AccordionGroup>

![Groepsberichtenflow](/images/groups-flow.svg)

Als je wilt...

| Doel                                         | Wat je moet instellen                                      |
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
- Directe chats gebruiken de hoofdsessie (of per afzender indien geconfigureerd).
- Heartbeats worden overgeslagen voor groepssessies.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke DM's + openbare groepen (één agent)

Ja — dit werkt goed als je "persoonlijke" verkeer **DM's** is en je "openbare" verkeer **groepen** is.

Waarom: in single-agentmodus komen DM's meestal terecht in de **hoofd**sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, draaien die groepssessies in de geconfigureerde sandboxbackend terwijl je hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-"brein" (gedeelde workspace + geheugen), maar twee uitvoeringshoudingen:

- **DM's**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je echt gescheiden workspaces/persona's nodig hebt ("persoonlijk" en "openbaar" mogen nooit mengen), gebruik dan een tweede agent + bindings. Zie [Multi-Agent Routing](/nl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    Wil je "groepen kunnen alleen map X zien" in plaats van "geen hosttoegang"? Houd `workspaceAccess: "none"` aan en mount alleen toegestane paden in de sandbox:

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
- Debuggen waarom een tool wordt geblokkeerd: [Sandbox vs Toolbeleid vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details over bind mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` wanneer beschikbaar, geformatteerd als `<channel>:<token>`.
- `#room` is gereserveerd voor ruimtes/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`).

## Groepsbeleid

Bepaal hoe groeps-/ruimteberichten per kanaal worden verwerkt:

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
| `"open"`      | Groepen omzeilen allowlists; mention gating blijft van toepassing. |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                      |
| `"allowlist"` | Sta alleen groepen/ruimtes toe die overeenkomen met de geconfigureerde allowlist. |

<AccordionGroup>
  <Accordion title="Opmerkingen per kanaal">
    - `groupPolicy` staat los van vermeldingstoegang (waarvoor @mentions vereist zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (terugval: expliciete `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de inkomende Signal-groeps-id of met het telefoonnummer/de UUID van de afzender.
    - DM-koppelingsgoedkeuringen (`*-allowFrom`-opslagitems) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet via groepstoestaanlijsten.
    - Discord: de toestaanlijst gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: de toestaanlijst gebruikt `channels.slack.channels`.
    - Matrix: de toestaanlijst gebruikt `channels.matrix.groups`. Geef de voorkeur aan kamer-ID's of aliassen; zoeken op naam van een joined room gebeurt naar beste vermogen, en onopgeloste namen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; per-room `users`-toestaanlijsten worden ook ondersteund.
    - Groeps-DM's worden afzonderlijk beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - De Telegram-toestaanlijst kan overeenkomen met gebruikers-ID's (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) of gebruikersnamen (`"@alice"` of `"alice"`); prefixen zijn hoofdletterongevoelig.
    - De standaard is `groupPolicy: "allowlist"`; als je groepstoestaanlijst leeg is, worden groepsberichten geblokkeerd.
    - Runtime-veiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt groepsbeleid terug op een fail-closed-modus (meestal `allowlist`) in plaats van `channels.defaults.groupPolicy` te erven.

  </Accordion>
</AccordionGroup>

Snel mentaal model (evaluatievolgorde voor groepsberichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Groepstoestaanlijsten">
    Groepstoestaanlijsten (`*.groups`, `*.groupAllowFrom`, kanaalspecifieke toestaanlijst).
  </Step>
  <Step title="Vermeldingstoegang">
    Vermeldingstoegang (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingstoegang (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep wordt overschreven. Standaarden staan per subsysteem onder `*.groups."*"`.

Antwoorden op een botbericht telt als een impliciete vermelding wanneer het kanaal antwoordmetadata ondersteunt. Een botbericht citeren kan ook tellen als een impliciete vermelding op kanalen die citaatmetadata beschikbaar maken. Huidige ingebouwde gevallen zijn Telegram, WhatsApp, Slack, Discord, Microsoft Teams en ZaloUser.

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
  <Accordion title="Opmerkingen over vermeldingstoegang">
    - `mentionPatterns` zijn hoofdletterongevoelige veilige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd.
    - Oppervlakken die expliciete vermeldingen leveren, blijven slagen; patronen zijn een terugval.
    - Overschrijving per agent: `agents.list[].groupChat.mentionPatterns` (handig wanneer meerdere agents een groep delen).
    - Vermeldingstoegang wordt alleen afgedwongen wanneer detectie van vermeldingen mogelijk is (native vermeldingen of `mentionPatterns` zijn geconfigureerd).
    - Een groep of afzender opnemen in de toestaanlijst schakelt vermeldingstoegang niet uit; stel de `requireMention` van die groep in op `false` wanneer alle berichten moeten activeren.
    - De promptcontext voor groepschats bevat bij elke beurt de opgeloste instructie voor stil antwoorden; werkruimtebestanden mogen `NO_REPLY`-mechanismen niet dupliceren.
    - Groepen waar stille antwoorden zijn toegestaan behandelen schone lege of alleen-redenering modelbeurten als stil, gelijkwaardig aan `NO_REPLY`. Directe chats doen hetzelfde alleen wanneer directe stille antwoorden expliciet zijn toegestaan; anders blijven lege antwoorden mislukte agentbeurten.
    - Discord-standaarden staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - Groepsgeschiedeniscontext wordt uniform over kanalen heen verpakt. Groepen met vermeldingstoegang bewaren overgeslagen berichten die nog wachten; groepen die altijd aan staan kunnen ook recente verwerkte kamerberichten bewaren wanneer het kanaal dit ondersteunt. Gebruik `messages.groupChat.historyLimit` voor de globale standaard en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overschrijvingen. Stel `0` in om uit te schakelen.

  </Accordion>
</AccordionGroup>

## Beperkingen voor groeps-/kanaaltools (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken welke tools beschikbaar zijn **binnen een specifieke groep/kamer/kanaal**.

- `tools`: tools toestaan/weigeren voor de hele groep.
- `toolsBySender`: overschrijvingen per afzender binnen de groep. Gebruik expliciete sleutelprefixen: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en `"*"`-wildcard. Kanaal-id's gebruiken canonieke OpenClaw-kanaal-id's; aliassen zoals `teams` normaliseren naar `msteams`. Verouderde sleutels zonder prefix worden nog steeds geaccepteerd en alleen als `id:` gematcht.

Oplosvolgorde (meest specifiek wint):

<Steps>
  <Step title="Groep toolsBySender">
    Overeenkomst voor groep/kanaal `toolsBySender`.
  </Step>
  <Step title="Groep tools">
    Groep/kanaal `tools`.
  </Step>
  <Step title="Standaard toolsBySender">
    Standaard (`"*"`) `toolsBySender`-overeenkomst.
  </Step>
  <Step title="Standaard tools">
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
Beperkingen voor groeps-/kanaaltools worden toegepast naast globaal/agent-toolbeleid (weigeren wint nog steeds). Sommige kanalen gebruiken andere nesting voor kamers/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Groepstoestaanlijsten

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de sleutels als groepstoestaanlijst. Gebruik `"*"` om alle groepen toe te staan terwijl je nog steeds standaard vermeldingsgedrag instelt.

<Warning>
Veelvoorkomende verwarring: DM-koppelingsgoedkeuring is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt de koppelingsopslag alleen DM's. Groepscommando's vereisen nog steeds expliciete autorisatie van groepsafzenders uit configuratietoestaanlijsten zoals `groupAllowFrom` of de gedocumenteerde configuratieterugval voor dat kanaal.
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
  <Tab title="Alleen eigenaarstriggers (WhatsApp)">
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

Groepseigenaren kunnen activering per groep omschakelen:

- `/activation mention`
- `/activation always`

Eigenaar wordt bepaald door `channels.whatsapp.allowFrom` (of de eigen E.164 van de bot wanneer niet ingesteld). Verstuur het commando als een zelfstandig bericht. Andere oppervlakken negeren `/activation` momenteel.

## Contextvelden

Inkomende groepspayloads stellen in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van vermeldingstoegang)
- Telegram-forumtopics bevatten ook `MessageThreadId` en `IsForum`.

De systeemprompt van de agent bevat bij de eerste beurt van een nieuwe groepssessie een groepsintro. Die herinnert het model eraan om te reageren als een mens, Markdown-tabellen te vermijden, lege regels te beperken en normale chatafstand te volgen, en geen letterlijke `\n`-reeksen te typen. Groepsnamen en deelnemerslabels afkomstig van kanalen worden weergegeven als fenced niet-vertrouwde metadata, niet als inline systeeminstructies.

## iMessage-specifiek

- Geef de voorkeur aan `chat_id:<id>` bij routeren of opnemen in een toestaanlijst.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke regels voor WhatsApp-systeemprompts, inclusief oplossing van groeps- en directe prompts, wildcardgedrag en semantiek voor accountoverschrijvingen.

## WhatsApp-specifiek

Zie [Groepsberichten](/nl/channels/group-messages) voor gedrag dat alleen voor WhatsApp geldt (geschiedenisinjectie, details over vermeldingsafhandeling).

## Gerelateerd

- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
