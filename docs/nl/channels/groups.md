---
read_when:
    - Groepschatgedrag of vermeldingsgating wijzigen
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende interfaces (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-04-30T16:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt groepschats consistent op alle oppervlakken: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Beginnersintroductie (2 minuten)

OpenClaw "leeft" op je eigen berichtenaccounts. Er is geen aparte WhatsApp-botgebruiker. Als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`).
- Antwoorden vereisen een vermelding, tenzij je vermeldingsvereisten expliciet uitschakelt.
- Normale eindantwoorden in groepen/kanalen zijn standaard privé. Zichtbare kameruitvoer gebruikt de `message`-tool.

Vertaling: afzenders op de toelatingslijst kunnen OpenClaw activeren door het te vermelden.

<Note>
**Kort gezegd**

- **DM-toegang** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + toelatingslijsten (`*.groups`, `*.groupAllowFrom`).
- **Antwoordactivering** wordt beheerd door vermeldingsvereisten (`requireMention`, `/activation`).

</Note>

Snelle flow (wat er met een groepsbericht gebeurt):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Zichtbare antwoorden

Voor groeps-/kanaalkamers gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "message_tool"`.
Dat betekent dat de agent de beurt nog steeds verwerkt en geheugen-/sessiestatus kan bijwerken, maar dat het normale eindantwoord niet automatisch terug in de kamer wordt geplaatst. Om zichtbaar te spreken gebruikt de agent `message(action=send)`.

Voor directe chats en elke andere bronbeurt gebruik je `messages.visibleReplies: "message_tool"` om hetzelfde tool-only zichtbare-antwoordgedrag globaal toe te passen. `messages.groupChat.visibleReplies` blijft de specifiekere overschrijving voor groeps-/kanaalkamers.

Dit vervangt het oude patroon waarbij het model voor de meeste lurk-modusbeurten werd gedwongen `NO_REPLY` te antwoorden. In tool-only-modus betekent niets zichtbaars doen simpelweg dat de message-tool niet wordt aangeroepen.

Typindicatoren worden nog steeds verzonden terwijl de agent in tool-only-modus werkt. De standaard groeps-typmodus wordt voor deze beurten opgewaardeerd van "message" naar "instant", omdat er mogelijk nooit normale assistentberichttekst is voordat de agent beslist of de message-tool moet worden aangeroepen. Expliciete typmodusconfiguratie heeft nog steeds voorrang.

Om oude automatische eindantwoorden voor groeps-/kanaalkamers te herstellen:

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
wanneer bestandsbewaking of configuratieherlading in de deployment is uitgeschakeld.

Om zichtbare uitvoer voor elke bronchat via de message-tool te laten verlopen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash-opdrachten (Discord, Telegram en andere oppervlakken met native opdrachtsteun) omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar, zodat de kanaaleigen opdracht-UI de reactie krijgt die die verwacht. Dit geldt alleen voor gevalideerde native opdrachtbeurten; als tekst getypte `/...`-opdrachten en gewone chatbeurten volgen nog steeds de geconfigureerde groepsstandaard.

## Contextzichtbaarheid en toelatingslijsten

Bij groepsveiligheid zijn twee verschillende controles betrokken:

- **Triggerautorisatie**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke toelatingslijsten).
- **Contextzichtbaarheid**: welke aanvullende context in het model wordt geïnjecteerd (antwoordtekst, citaten, threadgeschiedenis, doorgestuurde metadata).

Standaard geeft OpenClaw prioriteit aan normaal chatgedrag en houdt het context grotendeels zoals ontvangen. Dit betekent dat toelatingslijsten vooral bepalen wie acties kan activeren, niet een universele redactiegrens voor elk geciteerd of historisch fragment.

<AccordionGroup>
  <Accordion title="Huidig gedrag is kanaalspecifiek">
    - Sommige kanalen passen al afzendergebaseerde filtering toe voor aanvullende context in specifieke paden (bijvoorbeeld Slack-threadseeding, Matrix-antwoord-/threadopzoekingen).
    - Andere kanalen geven citaat-/antwoord-/doorstuurcontext nog steeds door zoals ontvangen.

  </Accordion>
  <Accordion title="Verhardingsrichting (gepland)">
    - `contextVisibility: "all"` (standaard) behoudt het huidige gedrag zoals ontvangen.
    - `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders op de toelatingslijst.
    - `contextVisibility: "allowlist_quote"` is `allowlist` plus één expliciete citaat-/antwoorduitzondering.

    Totdat dit verhardingsmodel consistent over kanalen is geïmplementeerd, kun je verschillen per oppervlak verwachten.

  </Accordion>
</AccordionGroup>

![Groepsberichtflow](/images/groups-flow.svg)

Als je wilt...

| Doel                                         | Wat je moet instellen                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan maar alleen antwoorden op @vermeldingen | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen           | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                    | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)   |
| Alleen jij kunt in groepen activeren         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sessiesleutels

- Groepssessies gebruiken `agent:<agentId>:<channel>:group:<id>`-sessiesleutels (kamers/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumtopics voegen `:topic:<threadId>` toe aan de groeps-ID, zodat elk topic een eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of per afzender als dat is geconfigureerd).
- Heartbeats worden overgeslagen voor groepssessies.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke DM's + openbare groepen (één agent)

Ja, dit werkt goed als je "persoonlijke" verkeer **DM's** is en je "openbare" verkeer **groepen** is.

Waarom: in één-agentmodus komen DM's meestal terecht in de **hoofd**sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, draaien die groepssessies in de geconfigureerde sandbox-backend terwijl je hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-"brein" (gedeelde werkruimte + geheugen), maar twee uitvoeringshoudingen:

- **DM's**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je echt gescheiden werkruimten/persona's nodig hebt ("persoonlijk" en "openbaar" mogen nooit mengen), gebruik dan een tweede agent + koppelingen. Zie [Multi-Agent Routing](/nl/concepts/multi-agent).
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
    Wil je dat "groepen alleen map X kunnen zien" in plaats van "geen hosttoegang"? Houd `workspaceAccess: "none"` aan en mount alleen toegelaten paden in de sandbox:

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
- Debuggen waarom een tool wordt geblokkeerd: [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details van bind mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` wanneer beschikbaar, geformatteerd als `<channel>:<token>`.
- `#room` is gereserveerd voor kamers/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`).

## Groepsbeleid

Beheer per kanaal hoe groeps-/kamerberichten worden afgehandeld:

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

| Beleid       | Gedrag                                                       |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Groepen omzeilen toelatingslijsten; vermeldingsvereisten blijven gelden. |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                      |
| `"allowlist"` | Sta alleen groepen/kamers toe die met de geconfigureerde toelatingslijst overeenkomen. |

<AccordionGroup>
  <Accordion title="Opmerkingen per kanaal">
    - `groupPolicy` staat los van vermeldingsvereisten (waarvoor @vermeldingen nodig zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (fallback: expliciet `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de inkomende Signal-groeps-ID of met het telefoonnummer/de UUID van de afzender.
    - Goedkeuringen voor DM-koppeling (`*-allowFrom`-storevermeldingen) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet aan groepstoelatingslijsten gekoppeld.
    - Discord: de toelatingslijst gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: de toelatingslijst gebruikt `channels.slack.channels`.
    - Matrix: de toelatingslijst gebruikt `channels.matrix.groups`. Geef de voorkeur aan kamer-ID's of aliassen; opzoeken van namen van gekoppelde kamers gebeurt best-effort, en onopgeloste namen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; per-kamer `users`-toelatingslijsten worden ook ondersteund.
    - Groeps-DM's worden afzonderlijk beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - De Telegram-toelatingslijst kan overeenkomen met gebruikers-ID's (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) of gebruikersnamen (`"@alice"` of `"alice"`); prefixen zijn niet hoofdlettergevoelig.
    - Standaard is `groupPolicy: "allowlist"`; als je groepstoelatingslijst leeg is, worden groepsberichten geblokkeerd.
    - Runtime-veiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt groepsbeleid terug naar een fail-closed-modus (meestal `allowlist`) in plaats van `channels.defaults.groupPolicy` te erven.

  </Accordion>
</AccordionGroup>

Snel mentaal model (evaluatievolgorde voor groepsberichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Groepstoelatingslijsten (`*.groups`, `*.groupAllowFrom`, kanaalspecifieke toelatingslijst).
  </Step>
  <Step title="Mention gating">
    Vermeldingsvereisten (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingsvereisten (standaard)

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
  <Accordion title="Opmerkingen over vermeldingsgating">
    - `mentionPatterns` zijn hoofdletterongevoelige veilige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd.
    - Oppervlakken die expliciete vermeldingen leveren, blijven slagen; patronen zijn een fallback.
    - Per-agent override: `agents.list[].groupChat.mentionPatterns` (handig wanneer meerdere agents een groep delen).
    - Vermeldingsgating wordt alleen afgedwongen wanneer vermeldingsdetectie mogelijk is (native vermeldingen of `mentionPatterns` zijn geconfigureerd).
    - Het allowlisten van een groep of afzender schakelt vermeldingsgating niet uit; stel `requireMention` van die groep in op `false` wanneer alle berichten moeten triggeren.
    - Promptcontext voor groepschats draagt elke beurt de opgeloste instructie voor stil antwoorden; workspacebestanden mogen de `NO_REPLY`-mechanica niet dupliceren.
    - Groepen waar stille antwoorden zijn toegestaan, behandelen schone lege of alleen-redeneerbeurten van het model als stil, gelijkwaardig aan `NO_REPLY`. Directe chats doen hetzelfde alleen wanneer directe stille antwoorden expliciet zijn toegestaan; anders blijven lege antwoorden mislukte agentbeurten.
    - Discord-standaarden staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - Groepsgeschiedeniscontext wordt uniform over kanalen heen verpakt en is **alleen in behandeling** (berichten die zijn overgeslagen vanwege vermeldingsgating); gebruik `messages.groupChat.historyLimit` voor de globale standaard en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overrides. Stel `0` in om uit te schakelen.

  </Accordion>
</AccordionGroup>

## Toolbeperkingen voor groep/kanaal (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van welke tools beschikbaar zijn **binnen een specifieke groep/ruimte/kanaal**.

- `tools`: tools toestaan/weigeren voor de hele groep.
- `toolsBySender`: overrides per afzender binnen de groep. Gebruik expliciete key-voorvoegsels: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en de wildcard `"*"`. Verouderde keys zonder voorvoegsel worden nog steeds geaccepteerd en alleen als `id:` gematcht.

Oplossingsvolgorde (meest specifiek wint):

<Steps>
  <Step title="Group toolsBySender">
    Match voor `toolsBySender` van groep/kanaal.
  </Step>
  <Step title="Group tools">
    `tools` van groep/kanaal.
  </Step>
  <Step title="Default toolsBySender">
    Match voor standaard (`"*"`) `toolsBySender`.
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
Toolbeperkingen voor groep/kanaal worden toegepast naast globaal/agent-toolbeleid (weigeren wint nog steeds). Sommige kanalen gebruiken andere nesting voor ruimtes/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Groep-allowlists

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de keys als een allowlist voor groepen. Gebruik `"*"` om alle groepen toe te staan terwijl je nog steeds standaard vermeldingsgedrag instelt.

<Warning>
Veelvoorkomende verwarring: goedkeuring voor DM-koppeling is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt de koppelingsopslag alleen DM's. Groepscommando's vereisen nog steeds expliciete autorisatie van groepsafzenders via configuratie-allowlists zoals `groupAllowFrom` of de gedocumenteerde configuratiefallback voor dat kanaal.
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
  <Tab title="Alleen-owner triggers (WhatsApp)">
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

## Activering (alleen owner)

Groepseigenaars kunnen activering per groep aan- of uitzetten:

- `/activation mention`
- `/activation always`

De owner wordt bepaald door `channels.whatsapp.allowFrom` (of de eigen E.164 van de bot wanneer dit niet is ingesteld). Stuur het commando als een afzonderlijk bericht. Andere oppervlakken negeren momenteel `/activation`.

## Contextvelden

Inkomende groepspayloads stellen in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van vermeldingsgating)
- Telegram-forumtopics bevatten ook `MessageThreadId` en `IsForum`.

Kanaalspecifieke opmerkingen:

- BlueBubbles kan naamloze macOS-groepsdeelnemers optioneel verrijken vanuit de lokale Contacten-database voordat `GroupMembers` wordt gevuld. Dit staat standaard uit en wordt alleen uitgevoerd nadat normale groepsgating is geslaagd.

De agent-systeemprompt bevat een groepsintro bij de eerste beurt van een nieuwe groepssessie. Die herinnert het model eraan om te antwoorden als een mens, Markdown-tabellen te vermijden, lege regels te minimaliseren, normale chatafstand te volgen en te vermijden letterlijke `\n`-reeksen te typen. Groepsnamen en deelnemerlabels uit kanalen worden weergegeven als fenced niet-vertrouwde metadata, niet als inline systeeminstructies.

## iMessage-specifiek

- Geef de voorkeur aan `chat_id:<id>` bij routeren of allowlisten.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke WhatsApp-regels voor systeemprompts, inclusief oplossing van groeps- en directe prompts, wildcardgedrag en semantiek voor accountoverrides.

## WhatsApp-specifiek

Zie [Groepsberichten](/nl/channels/group-messages) voor gedrag dat alleen voor WhatsApp geldt (geschiedenisinjectie, details over vermeldingsafhandeling).

## Gerelateerd

- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
