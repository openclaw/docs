---
read_when:
    - Gedrag van groepschats of vermeldingsgating wijzigen
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende interfaces (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-05-01T11:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt groepschats consistent op alle interfaces: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introductie voor beginners (2 minuten)

OpenClaw "leeft" op je eigen messagingaccounts. Er is geen aparte WhatsApp-botgebruiker. Als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`).
- Antwoorden vereisen een vermelding, tenzij je mention-gating expliciet uitschakelt.
- Normale definitieve antwoorden in groepen/kanalen zijn standaard privé. Zichtbare uitvoer in de ruimte gebruikt de `message`-tool.

Vertaling: afzenders op de allowlist kunnen OpenClaw activeren door het te vermelden.

<Note>
**TL;DR**

- **DM-toegang** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Antwoordactivering** wordt beheerd door mention-gating (`requireMention`, `/activation`).

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
Dat betekent dat de agent de beurt nog steeds verwerkt en geheugen-/sessiestatus kan bijwerken, maar dat het normale definitieve antwoord niet automatisch terug in de ruimte wordt geplaatst. Om zichtbaar te spreken gebruikt de agent `message(action=send)`.

Als de message-tool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw
terug op automatische zichtbare antwoorden in plaats van de reactie stilzwijgend te onderdrukken.
`openclaw doctor` waarschuwt voor deze mismatch.

Voor directe chats en elke andere bronbeurt gebruik je `messages.visibleReplies: "message_tool"` om hetzelfde gedrag voor zichtbare antwoorden alleen via tools globaal toe te passen. `messages.groupChat.visibleReplies` blijft de specifiekere override voor groeps-/kanaalruimtes.

Dit vervangt het oude patroon waarbij het model voor de meeste lurk-modusbeurten werd gedwongen `NO_REPLY` te antwoorden. In tool-only-modus betekent niets zichtbaars doen simpelweg dat de message-tool niet wordt aangeroepen.

Typindicatoren worden nog steeds verzonden terwijl de agent in tool-only-modus werkt. De standaard typmodus voor groepen wordt voor deze beurten opgewaardeerd van "message" naar "instant", omdat er mogelijk nooit normale assistentberichttekst is voordat de agent beslist of de message-tool moet worden aangeroepen. Expliciete typmodusconfiguratie blijft leidend.

Om verouderde automatische definitieve antwoorden voor groeps-/kanaalruimtes te herstellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

De Gateway hot-reloadt de `messages`-configuratie nadat het bestand is opgeslagen. Herstart alleen
wanneer bestandsbewaking of configuratieherladen is uitgeschakeld in de deployment.

Om te vereisen dat zichtbare uitvoer voor elke bronchat via de message-tool gaat:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash-commando's (Discord, Telegram en andere interfaces met native commandosupport) omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar, zodat de kanaal-native commando-UI het verwachte antwoord krijgt. Dit geldt alleen voor gevalideerde native commandobeurten; als tekst getypte `/...`-commando's en gewone chatbeurten volgen nog steeds de geconfigureerde groepsstandaard.

## Contextzichtbaarheid en allowlists

Bij groepsveiligheid zijn twee verschillende controles betrokken:

- **Triggerautorisatie**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke allowlists).
- **Contextzichtbaarheid**: welke aanvullende context in het model wordt geïnjecteerd (antwoordtekst, citaten, threadgeschiedenis, doorgestuurde metadata).

Standaard geeft OpenClaw prioriteit aan normaal chatgedrag en houdt het context grotendeels zoals ontvangen. Dit betekent dat allowlists vooral bepalen wie acties kan activeren, en geen universele redactiegrens vormen voor elk geciteerd of historisch fragment.

<AccordionGroup>
  <Accordion title="Huidig gedrag is kanaalspecifiek">
    - Sommige kanalen passen al op afzender gebaseerde filtering toe voor aanvullende context in specifieke paden (bijvoorbeeld Slack-threadseeding, Matrix-antwoord-/threadopzoekingen).
    - Andere kanalen geven citaat-/antwoord-/doorstuurcontext nog steeds door zoals ontvangen.

  </Accordion>
  <Accordion title="Hardening-richting (gepland)">
    - `contextVisibility: "all"` (standaard) behoudt het huidige zoals-ontvangen gedrag.
    - `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders op de allowlist.
    - `contextVisibility: "allowlist_quote"` is `allowlist` plus één expliciete citaat-/antwoorduitzondering.

    Totdat dit hardeningmodel consistent over kanalen is geïmplementeerd, kun je verschillen per interface verwachten.

  </Accordion>
</AccordionGroup>

![Groepsberichtflow](/images/groups-flow.svg)

Als je wilt...

| Doel                                         | Wat je moet instellen                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan maar alleen op @mentions antwoorden | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen           | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                    | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)   |
| Alleen jij kunt in groepen activeren         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sessiesleutels

- Groepssessies gebruiken sessiesleutels met `agent:<agentId>:<channel>:group:<id>` (ruimtes/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumonderwerpen voegen `:topic:<threadId>` toe aan de groeps-id, zodat elk onderwerp zijn eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of per afzender als dat is geconfigureerd).
- Heartbeats worden overgeslagen voor groepssessies.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke DM's + openbare groepen (één agent)

Ja — dit werkt goed als je "persoonlijke" verkeer **DM's** is en je "openbare" verkeer **groepen** is.

Waarom: in single-agent-modus komen DM's doorgaans terecht in de **hoofd**sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, draaien die groepssessies in de geconfigureerde sandboxbackend terwijl je hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-"brein" (gedeelde werkruimte + geheugen), maar twee uitvoeringshoudingen:

- **DM's**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je echt aparte werkruimtes/persona's nodig hebt ("persoonlijk" en "openbaar" mogen nooit mengen), gebruik dan een tweede agent + bindings. Zie [Multi-Agent Routing](/nl/concepts/multi-agent).
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
- Debuggen waarom een tool wordt geblokkeerd: [Sandbox vs Toolbeleid vs Verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details van bindmounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` wanneer beschikbaar, geformatteerd als `<channel>:<token>`.
- `#room` is gereserveerd voor ruimtes/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`).

## Groepsbeleid

Bepaal per kanaal hoe groeps-/ruimteberichten worden verwerkt:

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
| `"open"`      | Groepen omzeilen allowlists; mention-gating blijft van toepassing. |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                      |
| `"allowlist"` | Sta alleen groepen/ruimtes toe die overeenkomen met de geconfigureerde allowlist. |

<AccordionGroup>
  <Accordion title="Opmerkingen per kanaal">
    - `groupPolicy` staat los van mention-gating (waarvoor @mentions nodig zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (fallback: expliciete `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de inkomende Signal-groeps-id of met het telefoonnummer/de UUID van de afzender.
    - DM-koppelingsgoedkeuringen (`*-allowFrom`-storevermeldingen) gelden alleen voor DM-toegang; afzenderautorisatie in groepen blijft expliciet gekoppeld aan groepsallowlists.
    - Discord: allowlist gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist gebruikt `channels.slack.channels`.
    - Matrix: allowlist gebruikt `channels.matrix.groups`. Geef de voorkeur aan ruimte-ID's of aliassen; lookup van namen van joined rooms is best-effort, en niet-opgeloste namen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; per-ruimte `users`-allowlists worden ook ondersteund.
    - Groeps-DM's worden apart beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram-allowlist kan overeenkomen met gebruikers-ID's (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) of gebruikersnamen (`"@alice"` of `"alice"`); prefixen zijn hoofdletterongevoelig.
    - Standaard is `groupPolicy: "allowlist"`; als je groepsallowlist leeg is, worden groepsberichten geblokkeerd.
    - Runtimeveiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt groepsbeleid terug op een fail-closed-modus (meestal `allowlist`) in plaats van `channels.defaults.groupPolicy` over te nemen.

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
  <Step title="Vermeldingsfiltering">
    Vermeldingsfiltering (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingsfiltering (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep wordt overschreven. Standaardwaarden staan per subsysteem onder `*.groups."*"`.

Antwoorden op een botbericht telt als een impliciete vermelding wanneer het kanaal antwoordmetadata ondersteunt. Een botbericht citeren kan ook tellen als een impliciete vermelding op kanalen die citaatmetadata beschikbaar maken. Huidige ingebouwde gevallen omvatten Telegram, WhatsApp, Slack, Discord, Microsoft Teams en ZaloUser.

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
  <Accordion title="Opmerkingen over vermeldingsfiltering">
    - `mentionPatterns` zijn hoofdletterongevoelige veilige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd.
    - Oppervlakken die expliciete vermeldingen leveren, worden nog steeds doorgelaten; patronen zijn een fallback.
    - Override per agent: `agents.list[].groupChat.mentionPatterns` (handig wanneer meerdere agents een groep delen).
    - Vermeldingsfiltering wordt alleen afgedwongen wanneer vermeldingsdetectie mogelijk is (native vermeldingen of `mentionPatterns` zijn geconfigureerd).
    - Het toelaten van een groep of afzender schakelt vermeldingsfiltering niet uit; stel de `requireMention` van die groep in op `false` wanneer alle berichten moeten triggeren.
    - Promptcontext voor groepschats bevat in elke beurt de opgeloste instructie voor stil antwoorden; werkruimtebestanden mogen `NO_REPLY`-mechanica niet dupliceren.
    - Groepen waarin stille antwoorden zijn toegestaan, behandelen schone lege of alleen-redeneringsmodelbeurten als stil, equivalent aan `NO_REPLY`. Directe chats doen hetzelfde alleen wanneer directe stille antwoorden expliciet zijn toegestaan; anders blijven lege antwoorden mislukte agentbeurten.
    - Discord-standaardwaarden staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - Groepsgeschiedeniscontext wordt uniform over kanalen verpakt en is **alleen pending** (berichten die vanwege vermeldingsfiltering zijn overgeslagen); gebruik `messages.groupChat.historyLimit` voor de globale standaardwaarde en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overrides. Stel `0` in om uit te schakelen.

  </Accordion>
</AccordionGroup>

## Toolbeperkingen voor groep/kanaal (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van welke tools **binnen een specifieke groep/ruimte/kanaal** beschikbaar zijn.

- `tools`: tools toestaan/weigeren voor de hele groep.
- `toolsBySender`: overrides per afzender binnen de groep. Gebruik expliciete sleutelprefixen: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en `"*"`-wildcard. Legacy sleutels zonder prefix worden nog steeds geaccepteerd en alleen als `id:` gematcht.

Oplossingsvolgorde (meest specifiek wint):

<Steps>
  <Step title="Group toolsBySender">
    Groep/kanaal `toolsBySender` match.
  </Step>
  <Step title="Groepstools">
    Groep/kanaal `tools`.
  </Step>
  <Step title="Standaard toolsBySender">
    Standaard (`"*"`) `toolsBySender` match.
  </Step>
  <Step title="Standaardtools">
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
Toolbeperkingen voor groep/kanaal worden toegepast bovenop globaal/agent-toolbeleid (weigeren wint nog steeds). Sommige kanalen gebruiken andere nesting voor ruimten/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Groeps-allowlists

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de sleutels als een groeps-allowlist. Gebruik `"*"` om alle groepen toe te staan terwijl standaard vermeldingsgedrag nog steeds wordt ingesteld.

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
  <Tab title="Alleen eigenaar-triggers (WhatsApp)">
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

Groepseigenaren kunnen activatie per groep omschakelen:

- `/activation mention`
- `/activation always`

De eigenaar wordt bepaald door `channels.whatsapp.allowFrom` (of de eigen E.164 van de bot wanneer niet ingesteld). Verstuur de opdracht als een zelfstandig bericht. Andere oppervlakken negeren momenteel `/activation`.

## Contextvelden

Inkomende groepspayloads stellen in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van vermeldingsfiltering)
- Telegram-forumonderwerpen bevatten ook `MessageThreadId` en `IsForum`.

Kanaalspecifieke opmerkingen:

- BlueBubbles kan naamloze macOS-groepsdeelnemers optioneel verrijken vanuit de lokale Contacten-database voordat `GroupMembers` wordt gevuld. Dit staat standaard uit en wordt alleen uitgevoerd nadat normale groepsfiltering slaagt.

De systeemprompt van de agent bevat een groepsintro bij de eerste beurt van een nieuwe groepssessie. Die herinnert het model eraan te reageren als een mens, Markdown-tabellen te vermijden, lege regels te minimaliseren en normale chatafstand te volgen, en te voorkomen dat letterlijke `\n`-reeksen worden getypt. Groepsnamen en deelnemerlabels uit kanalen worden weergegeven als omheinde niet-vertrouwde metadata, niet als inline systeeminstructies.

## iMessage-specifiek

- Geef de voorkeur aan `chat_id:<id>` bij routeren of toelaten.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke WhatsApp-systeempromptregels, inclusief oplossing van groeps- en directe prompts, wildcardgedrag en semantiek voor accountoverrides.

## WhatsApp-specifiek

Zie [Groepsberichten](/nl/channels/group-messages) voor WhatsApp-only gedrag (geschiedenisinjectie, details over vermeldingsafhandeling).

## Gerelateerd

- [Uitzendgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
