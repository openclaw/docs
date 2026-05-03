---
read_when:
    - Gedrag van groepschats of controle op vermeldingen wijzigen
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende oppervlakken (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-05-03T11:08:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt groepschats consistent op alle oppervlakken: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Intro voor beginners (2 minuten)

OpenClaw "leeft" op je eigen messaging-accounts. Er is geen aparte WhatsApp-botgebruiker. Als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`).
- Antwoorden vereisen een vermelding, tenzij je mention gating expliciet uitschakelt.
- Normale definitieve antwoorden in groepen/kanalen zijn standaard privé. Zichtbare kameruitvoer gebruikt de tool `message`.

Vertaling: toegestane afzenders kunnen OpenClaw activeren door het te vermelden.

<Note>
**TL;DR**

- **DM-toegang** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Antwoordactivering** wordt beheerd door mention gating (`requireMention`, `/activation`).

</Note>

Snelle flow (wat er gebeurt met een groepsbericht):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Zichtbare antwoorden

Voor groeps-/kanaalkamers gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` schrijft deze standaardwaarde naar geconfigureerde kanaalconfiguraties waarin deze ontbreekt.
Dat betekent dat de agent de beurt nog steeds verwerkt en geheugen-/sessiestatus kan bijwerken, maar het normale definitieve antwoord niet automatisch terug in de kamer wordt geplaatst. Om zichtbaar te spreken, gebruikt de agent `message(action=send)`.

Als de berichttool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van de reactie stilzwijgend te onderdrukken.
`openclaw doctor` waarschuwt voor deze mismatch.

Gebruik voor directe chats en elke andere bronbeurt `messages.visibleReplies: "message_tool"` om hetzelfde tool-only gedrag voor zichtbare antwoorden globaal toe te passen. Harnassen kunnen dit ook kiezen als hun niet-ingestelde standaard; het Codex-harnas doet dit voor directe chats in Codex-modus. `messages.groupChat.visibleReplies` blijft de specifiekere override voor groeps-/kanaalkamers.

Dit vervangt het oude patroon waarbij het model voor de meeste lurk-mode beurten werd gedwongen `NO_REPLY` te antwoorden. In tool-only modus betekent niets zichtbaars doen simpelweg dat de berichttool niet wordt aangeroepen.

Typindicatoren worden nog steeds verzonden terwijl de agent in tool-only modus werkt. De standaard groepsmodus voor typen wordt voor deze beurten opgewaardeerd van "message" naar "instant", omdat er mogelijk nooit normale assistentberichttekst komt voordat de agent beslist of hij de berichttool aanroept. Expliciete configuratie voor typmodus heeft nog steeds voorrang.

Om verouderde automatische definitieve antwoorden voor groeps-/kanaalkamers te herstellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

De Gateway herlaadt `messages`-configuratie live nadat het bestand is opgeslagen. Herstart alleen wanneer bestandsbewaking of configuratieherlaad is uitgeschakeld in de deployment.

Om zichtbare uitvoer voor elke bronchat via de berichttool te laten lopen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash-commands (Discord, Telegram en andere oppervlakken met native command-ondersteuning) omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar, zodat de kanaal-native command-UI de reactie krijgt die deze verwacht. Dit geldt alleen voor gevalideerde native command-beurten; als tekst getypte `/...`-commands en gewone chatbeurten volgen nog steeds de geconfigureerde groepsstandaard.

## Contextzichtbaarheid en allowlists

Bij groepsveiligheid zijn twee verschillende controles betrokken:

- **Activeringsautorisatie**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke allowlists).
- **Contextzichtbaarheid**: welke aanvullende context in het model wordt geïnjecteerd (antwoordtekst, citaten, threadgeschiedenis, doorgestuurde metadata).

Standaard geeft OpenClaw prioriteit aan normaal chatgedrag en houdt het context grotendeels zoals ontvangen. Dit betekent dat allowlists primair bepalen wie acties kan activeren, niet dat ze een universele redactiegrens zijn voor elk geciteerd of historisch fragment.

<AccordionGroup>
  <Accordion title="Huidig gedrag is kanaalspecifiek">
    - Sommige kanalen passen al afzendergebaseerde filtering toe voor aanvullende context in specifieke paden (bijvoorbeeld Slack-threadseeding, Matrix-antwoord-/threadopzoekingen).
    - Andere kanalen geven citaat-/antwoord-/doorstuurcontext nog steeds door zoals ontvangen.

  </Accordion>
  <Accordion title="Hardening-richting (gepland)">
    - `contextVisibility: "all"` (standaard) behoudt het huidige gedrag zoals ontvangen.
    - `contextVisibility: "allowlist"` filtert aanvullende context tot toegestane afzenders.
    - `contextVisibility: "allowlist_quote"` is `allowlist` plus één expliciete citaat-/antwoorduitzondering.

    Totdat dit hardeningmodel consistent in alle kanalen is geïmplementeerd, kun je verschillen per oppervlak verwachten.

  </Accordion>
</AccordionGroup>

![Groepsberichtflow](/images/groups-flow.svg)

Als je wilt...

| Doel                                         | Wat in te stellen                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan maar alleen antwoorden op @mentions | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen           | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                    | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)   |
| Alleen jij kunt in groepen activeren         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eén vertrouwde afzenderset hergebruiken over kanalen | `groupAllowFrom: ["accessGroup:operators"]`                |

Zie [Toegangsgroepen](/nl/channels/access-groups) voor herbruikbare afzender-allowlists.

## Sessiesleutels

- Groepssessies gebruiken sessiesleutels `agent:<agentId>:<channel>:group:<id>` (kamers/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumonderwerpen voegen `:topic:<threadId>` toe aan de groeps-id, zodat elk onderwerp een eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of per afzender indien geconfigureerd).
- Heartbeats worden overgeslagen voor groepssessies.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke DM's + openbare groepen (één agent)

Ja — dit werkt goed als je "persoonlijke" verkeer **DM's** is en je "openbare" verkeer **groepen** is.

Waarom: in één-agentmodus komen DM's meestal terecht in de **hoofd**sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, draaien die groepssessies in de geconfigureerde sandbox-backend terwijl je hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-"brein" (gedeelde werkruimte + geheugen), maar twee uitvoeringshoudingen:

- **DM's**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je echt gescheiden werkruimten/persona's nodig hebt ("persoonlijk" en "openbaar" mogen nooit mengen), gebruik dan een tweede agent + bindingen. Zie [Multi-Agent Routing](/nl/concepts/multi-agent).
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
  <Tab title="Groepen zien alleen een allowlisted map">
    Wil je "groepen kunnen alleen map X zien" in plaats van "geen hosttoegang"? Houd `workspaceAccess: "none"` en mount alleen allowlisted paden in de sandbox:

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
- Debuggen waarom een tool wordt geblokkeerd: [Sandbox vs Toolbeleid vs Verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details van bind mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

## Weergavelabels

- UI-labels gebruiken `displayName` wanneer beschikbaar, geformatteerd als `<channel>:<token>`.
- `#room` is gereserveerd voor kamers/kanalen; groepschats gebruiken `g-<slug>` (kleine letters, spaties -> `-`, behoud `#@+._-`).

## Groepsbeleid

Bepaal per kanaal hoe groeps-/kamerberichten worden afgehandeld:

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
| `"allowlist"` | Sta alleen groepen/kamers toe die overeenkomen met de geconfigureerde allowlist. |

<AccordionGroup>
  <Accordion title="Notities per kanaal">
    - `groupPolicy` staat los van mention gating (waarvoor @mentions vereist zijn).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (fallback: expliciete `allowFrom`).
    - Signal: `groupAllowFrom` kan overeenkomen met de inkomende Signal-groeps-id of met het telefoonnummer/de UUID van de afzender.
    - Goedkeuringen voor DM-koppeling (`*-allowFrom`-storevermeldingen) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet via groeps-allowlists.
    - Discord: allowlist gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist gebruikt `channels.slack.channels`.
    - Matrix: allowlist gebruikt `channels.matrix.groups`. Geef de voorkeur aan kamer-ID's of aliassen; lookup van namen van toegetreden kamers is best-effort, en niet-opgeloste namen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; `users`-allowlists per kamer worden ook ondersteund.
    - Groeps-DM's worden apart beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram-allowlist kan overeenkomen met gebruikers-ID's (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) of gebruikersnamen (`"@alice"` of `"alice"`); voorvoegsels zijn hoofdletterongevoelig.
    - Standaard is `groupPolicy: "allowlist"`; als je groeps-allowlist leeg is, worden groepsberichten geblokkeerd.
    - Runtimeveiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt groepsbeleid terug op een fail-closed modus (meestal `allowlist`) in plaats van `channels.defaults.groupPolicy` te erven.

  </Accordion>
</AccordionGroup>

Snel mentaal model (evaluatievolgorde voor groepsberichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/uitgeschakeld/allowlist).
  </Step>
  <Step title="Group allowlists">
    Allowlists voor groepen (`*.groups`, `*.groupAllowFrom`, kanaalspecifieke allowlist).
  </Step>
  <Step title="Mention gating">
    Vermeldingsgating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingsgating (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep wordt overschreven. Standaardwaarden staan per subsysteem onder `*.groups."*"`.

Antwoorden op een botbericht telt als impliciete vermelding wanneer het kanaal antwoordmetadata ondersteunt. Een botbericht citeren kan ook tellen als impliciete vermelding op kanalen die citaatmetadata beschikbaar maken. Huidige ingebouwde gevallen zijn onder meer Telegram, WhatsApp, Slack, Discord, Microsoft Teams en ZaloUser.

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
  <Accordion title="Mention gating notes">
    - `mentionPatterns` zijn hoofdletterongevoelige veilige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd.
    - Oppervlakken die expliciete vermeldingen leveren, slagen nog steeds; patronen zijn een terugvaloptie.
    - Overschrijving per agent: `agents.list[].groupChat.mentionPatterns` (handig wanneer meerdere agents een groep delen).
    - Vermeldingsgating wordt alleen afgedwongen wanneer detectie van vermeldingen mogelijk is (native vermeldingen of `mentionPatterns` zijn geconfigureerd).
    - Een groep of afzender op een allowlist zetten schakelt vermeldingsgating niet uit; stel `requireMention` voor die groep in op `false` wanneer alle berichten moeten activeren.
    - De promptcontext voor groepschats bevat elke beurt de opgeloste instructie voor stil antwoorden; werkruimtebestanden moeten de `NO_REPLY`-mechaniek niet dupliceren.
    - Groepen waarin stille antwoorden zijn toegestaan, behandelen schone lege of alleen-redeneerbeurten van het model als stil, gelijkwaardig aan `NO_REPLY`. Directe chats doen hetzelfde alleen wanneer directe stille antwoorden expliciet zijn toegestaan; anders blijven lege antwoorden mislukte agentbeurten.
    - Discord-standaardwaarden staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - Groepsgeschiedeniscontext wordt uniform over kanalen heen verpakt en is **alleen in afwachting** (berichten die door vermeldingsgating zijn overgeslagen); gebruik `messages.groupChat.historyLimit` voor de globale standaardwaarde en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overschrijvingen. Stel in op `0` om uit te schakelen.

  </Accordion>
</AccordionGroup>

## Toolbeperkingen voor groep/kanaal (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van welke tools **binnen een specifieke groep/ruimte/kanaal** beschikbaar zijn.

- `tools`: tools toestaan/weigeren voor de hele groep.
- `toolsBySender`: overschrijvingen per afzender binnen de groep. Gebruik expliciete sleutelprefixen: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en de joker `"*"`. Verouderde sleutels zonder prefix worden nog steeds geaccepteerd en alleen als `id:` gematcht.

Oplossingsvolgorde (meest specifiek wint):

<Steps>
  <Step title="Group toolsBySender">
    Overeenkomst met groeps-/kanaal-`toolsBySender`.
  </Step>
  <Step title="Group tools">
    Groeps-/kanaal-`tools`.
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
Toolbeperkingen voor groep/kanaal worden toegepast naast globaal/agent-toolbeleid (weigeren wint nog steeds). Sommige kanalen gebruiken andere nesting voor ruimtes/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlists voor groepen

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de sleutels als allowlist voor groepen. Gebruik `"*"` om alle groepen toe te staan terwijl je nog steeds standaard vermeldingsgedrag instelt.

<Warning>
Veelvoorkomende verwarring: goedkeuring voor DM-koppeling is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt de koppelingsopslag alleen DM's. Groepsopdrachten vereisen nog steeds expliciete groepsafzenderautorisatie vanuit configuratie-allowlists zoals `groupAllowFrom` of de gedocumenteerde configuratieterugval voor dat kanaal.
</Warning>

Veelvoorkomende bedoelingen (kopiëren/plakken):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  <Tab title="Allow all groups but require mention">
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
  <Tab title="Owner-only triggers (WhatsApp)">
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

De eigenaar wordt bepaald door `channels.whatsapp.allowFrom` (of de eigen E.164 van de bot wanneer niet ingesteld). Verstuur de opdracht als zelfstandig bericht. Andere oppervlakken negeren `/activation` momenteel.

## Contextvelden

Inkomende groepspayloads stellen in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van vermeldingsgating)
- Telegram-forumonderwerpen bevatten ook `MessageThreadId` en `IsForum`.

Kanaalspecifieke opmerkingen:

- BlueBubbles kan naamloze macOS-groepsdeelnemers optioneel verrijken vanuit de lokale Contacten-database voordat `GroupMembers` wordt gevuld. Dit staat standaard uit en draait alleen nadat normale groepsgating is geslaagd.

De systeemprompt van de agent bevat een groepsintro bij de eerste beurt van een nieuwe groepssessie. Die herinnert het model eraan te antwoorden als een mens, Markdown-tabellen te vermijden, lege regels te minimaliseren en normale chatafstand te volgen, en te vermijden letterlijke `\n`-reeksen te typen. Groepsnamen en deelnemerslabels afkomstig uit kanalen worden weergegeven als omheinde niet-vertrouwde metadata, niet als inline systeeminstructies.

## iMessage-specifiek

- Geef de voorkeur aan `chat_id:<id>` bij routering of allowlisting.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke regels voor WhatsApp-systeemprompts, inclusief oplossing van groeps- en directe prompts, jokerteken-gedrag en semantiek voor accountoverschrijvingen.

## WhatsApp-specifiek

Zie [Groepsberichten](/nl/channels/group-messages) voor alleen-WhatsApp-gedrag (geschiedenisinjectie, details over vermeldingsafhandeling).

## Gerelateerd

- [Uitzendgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppelen](/nl/channels/pairing)
