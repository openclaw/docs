---
read_when:
    - Groepschatgedrag of vermeldingsvereisten wijzigen
sidebarTitle: Groups
summary: Gedrag van groepschats op verschillende platforms (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groepen
x-i18n:
    generated_at: "2026-04-29T22:25:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt groepschats consistent op alle oppervlakken: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introductie voor beginners (2 minuten)

OpenClaw "leeft" op je eigen berichtenaccounts. Er is geen aparte WhatsApp-botgebruiker. Als **jij** in een groep zit, kan OpenClaw die groep zien en daar reageren.

Standaardgedrag:

- Groepen zijn beperkt (`groupPolicy: "allowlist"`).
- Antwoorden vereisen een vermelding, tenzij je vermeldingsfiltering expliciet uitschakelt.
- Normale eindantwoorden in groepen/kanalen zijn standaard privé. Zichtbare uitvoer in de ruimte gebruikt de `message`-tool.

Vertaling: toegestane afzenders kunnen OpenClaw activeren door het te vermelden.

<Note>
**Kort gezegd**

- **DM-toegang** wordt beheerd door `*.allowFrom`.
- **Groepstoegang** wordt beheerd door `*.groupPolicy` + toelatingslijsten (`*.groups`, `*.groupAllowFrom`).
- **Antwoordactivering** wordt beheerd door vermeldingsfiltering (`requireMention`, `/activation`).

</Note>

Snelle stroom (wat er met een groepsbericht gebeurt):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Zichtbare antwoorden

Voor groeps-/kanaalruimtes gebruikt OpenClaw standaard `messages.groupChat.visibleReplies: "message_tool"`.
Dit betekent dat de agent de beurt nog steeds verwerkt en geheugen-/sessiestatus kan bijwerken, maar dat het normale eindantwoord niet automatisch terug in de ruimte wordt geplaatst. Om zichtbaar te spreken, gebruikt de agent `message(action=send)`.

Gebruik voor directe chats en elke andere bronbeurt `messages.visibleReplies: "message_tool"` om hetzelfde gedrag voor alleen via tools zichtbare antwoorden globaal toe te passen. `messages.groupChat.visibleReplies` blijft de specifiekere override voor groeps-/kanaalruimtes.

Dit vervangt het oude patroon waarbij het model voor de meeste luistermodusbeurten gedwongen werd `NO_REPLY` te antwoorden. In de modus alleen via tools betekent niets zichtbaars doen simpelweg dat de berichtentool niet wordt aangeroepen.

Typindicatoren worden nog steeds verzonden terwijl de agent in de modus alleen via tools werkt. De standaard typmodus voor groepen wordt voor deze beurten opgewaardeerd van "message" naar "instant", omdat er mogelijk nooit normale assistentberichttekst komt voordat de agent beslist of de berichtentool moet worden aangeroepen. Expliciete configuratie voor de typmodus blijft leidend.

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

Om te vereisen dat zichtbare uitvoer voor elke bronchat via de berichtentool loopt:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash-opdrachten (Discord, Telegram en andere oppervlakken met native opdrachtondersteuning) omzeilen `visibleReplies: "message_tool"` en antwoorden altijd zichtbaar, zodat de kanaaleigen opdracht-UI de verwachte respons krijgt. Dit geldt alleen voor gevalideerde native opdrachtbeurten; als tekst getypte `/...`-opdrachten en gewone chatbeurten volgen nog steeds de geconfigureerde groepsstandaard.

## Contextzichtbaarheid en toelatingslijsten

Bij groepsveiligheid zijn twee verschillende besturingen betrokken:

- **Activeringsautorisatie**: wie de agent kan activeren (`groupPolicy`, `groups`, `groupAllowFrom`, kanaalspecifieke toelatingslijsten).
- **Contextzichtbaarheid**: welke aanvullende context in het model wordt geïnjecteerd (antwoordtekst, citaten, threadgeschiedenis, doorgestuurde metadata).

Standaard geeft OpenClaw prioriteit aan normaal chatgedrag en houdt context grotendeels zoals ontvangen. Dit betekent dat toelatingslijsten vooral bepalen wie acties kan activeren, niet een universele redactiegrens voor elk geciteerd of historisch fragment.

<AccordionGroup>
  <Accordion title="Huidig gedrag is kanaalspecifiek">
    - Sommige kanalen passen al afzendergebaseerde filtering toe op aanvullende context in specifieke paden (bijvoorbeeld Slack-threadseeding, Matrix-antwoord-/threadopzoekingen).
    - Andere kanalen geven citaat-/antwoord-/doorstuurcontext nog steeds door zoals ontvangen.

  </Accordion>
  <Accordion title="Hardingsrichting (gepland)">
    - `contextVisibility: "all"` (standaard) behoudt het huidige gedrag zoals ontvangen.
    - `contextVisibility: "allowlist"` filtert aanvullende context tot toegestane afzenders.
    - `contextVisibility: "allowlist_quote"` is `allowlist` plus één expliciete citaat-/antwoorduitzondering.

    Totdat dit hardingsmodel consistent over kanalen is geïmplementeerd, kun je verschillen per oppervlak verwachten.

  </Accordion>
</AccordionGroup>

![Groepsberichtenstroom](/images/groups-flow.svg)

Als je wilt...

| Doel                                         | Wat je moet instellen                                     |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle groepen toestaan maar alleen antwoorden op @vermeldingen | `groups: { "*": { requireMention: true } }`                |
| Alle groepsantwoorden uitschakelen           | `groupPolicy: "disabled"`                                  |
| Alleen specifieke groepen                    | `groups: { "<group-id>": { ... } }` (geen `"*"`-sleutel)   |
| Alleen jij kunt in groepen activeren         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sessiesleutels

- Groepssessies gebruiken `agent:<agentId>:<channel>:group:<id>`-sessiesleutels (ruimtes/kanalen gebruiken `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-forumonderwerpen voegen `:topic:<threadId>` toe aan de groeps-id, zodat elk onderwerp een eigen sessie heeft.
- Directe chats gebruiken de hoofdsessie (of per afzender als dat is geconfigureerd).
- Heartbeats worden overgeslagen voor groepssessies.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patroon: persoonlijke DM's + openbare groepen (één agent)

Ja — dit werkt goed als je "persoonlijke" verkeer **DM's** is en je "openbare" verkeer **groepen** is.

Waarom: in de modus met één agent komen DM's doorgaans terecht in de **hoofd**sessiesleutel (`agent:main:main`), terwijl groepen altijd **niet-hoofd**sessiesleutels gebruiken (`agent:main:<channel>:group:<id>`). Als je sandboxing inschakelt met `mode: "non-main"`, draaien die groepssessies in de geconfigureerde sandbox-backend terwijl je hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest.

Dit geeft je één agent-"brein" (gedeelde werkruimte + geheugen), maar twee uitvoeringshoudingen:

- **DM's**: volledige tools (host)
- **Groepen**: sandbox + beperkte tools

<Note>
Als je echt gescheiden werkruimtes/persona's nodig hebt ("persoonlijk" en "openbaar" mogen nooit mengen), gebruik dan een tweede agent + bindingen. Zie [Multi-Agent-routering](/nl/concepts/multi-agent).
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
  <Tab title="Groepen zien alleen een toegestane map">
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

- Configuratiesleutels en standaarden: [Gateway-configuratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- Debuggen waarom een tool wordt geblokkeerd: [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details van bind mounts: [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts)

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
| `"open"`      | Groepen omzeilen toelatingslijsten; vermeldingsfiltering blijft van toepassing. |
| `"disabled"`  | Blokkeer alle groepsberichten volledig.                      |
| `"allowlist"` | Sta alleen groepen/ruimtes toe die overeenkomen met de geconfigureerde toelatingslijst. |

<AccordionGroup>
  <Accordion title="Opmerkingen per kanaal">
    - `groupPolicy` staat los van vermeldingsfiltering (die @vermeldingen vereist).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gebruik `groupAllowFrom` (fallback: expliciete `allowFrom`).
    - Goedkeuringen voor DM-koppeling (`*-allowFrom`-storevermeldingen) gelden alleen voor DM-toegang; autorisatie van groepsafzenders blijft expliciet voor groepstoelatingslijsten.
    - Discord: de toelatingslijst gebruikt `channels.discord.guilds.<id>.channels`.
    - Slack: de toelatingslijst gebruikt `channels.slack.channels`.
    - Matrix: de toelatingslijst gebruikt `channels.matrix.groups`. Geef de voorkeur aan ruimte-ID's of aliassen; naamopzoeking voor toegetreden ruimtes is best-effort, en onopgeloste namen worden tijdens runtime genegeerd. Gebruik `channels.matrix.groupAllowFrom` om afzenders te beperken; per-ruimte `users`-toelatingslijsten worden ook ondersteund.
    - Groeps-DM's worden apart beheerd (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - De Telegram-toelatingslijst kan overeenkomen met gebruikers-ID's (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) of gebruikersnamen (`"@alice"` of `"alice"`); voorvoegsels zijn niet hoofdlettergevoelig.
    - Standaard is `groupPolicy: "allowlist"`; als je groepstoelatingslijst leeg is, worden groepsberichten geblokkeerd.
    - Runtimeveiligheid: wanneer een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt groepsbeleid terug op een fail-closed modus (doorgaans `allowlist`) in plaats van `channels.defaults.groupPolicy` te erven.

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
  <Step title="Vermeldingsfiltering">
    Vermeldingsfiltering (`requireMention`, `/activation`).
  </Step>
</Steps>

## Vermeldingsfiltering (standaard)

Groepsberichten vereisen een vermelding, tenzij dit per groep is overschreven. Standaarden staan per subsysteem onder `*.groups."*"`.

Antwoorden op een botbericht telt als een impliciete vermelding wanneer het kanaal antwoordmetadata ondersteunt. Een botbericht citeren kan ook als een impliciete vermelding tellen op kanalen die citaatmetadata beschikbaar stellen. Huidige ingebouwde gevallen zijn Telegram, WhatsApp, Slack, Discord, Microsoft Teams en ZaloUser.

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
  <Accordion title="Opmerkingen over vermeldingspoort">
    - `mentionPatterns` zijn hoofdletterongevoelige veilige regex-patronen; ongeldige patronen en onveilige vormen met geneste herhaling worden genegeerd.
    - Oppervlakken die expliciete vermeldingen bieden, komen nog steeds door; patronen zijn een fallback.
    - Overschrijving per agent: `agents.list[].groupChat.mentionPatterns` (handig wanneer meerdere agents een groep delen).
    - Vermeldingspoort wordt alleen afgedwongen wanneer vermeldingsdetectie mogelijk is (native vermeldingen of `mentionPatterns` zijn geconfigureerd).
    - Groepschat-promptcontext bevat bij elke beurt de opgeloste instructie voor stil antwoorden; workspace-bestanden moeten `NO_REPLY`-mechanica niet dupliceren.
    - Groepen waar stille antwoorden zijn toegestaan, behandelen schone lege of alleen-redenering modelbeurten als stil, gelijk aan `NO_REPLY`. Directe chats doen hetzelfde alleen wanneer directe stille antwoorden expliciet zijn toegestaan; anders blijven lege antwoorden mislukte agentbeurten.
    - Discord-standaarden staan in `channels.discord.guilds."*"` (overschrijfbaar per guild/kanaal).
    - Groepsgeschiedeniscontext wordt uniform over kanalen heen ingepakt en is **alleen in behandeling** (berichten overgeslagen vanwege vermeldingspoort); gebruik `messages.groupChat.historyLimit` voor de globale standaard en `channels.<channel>.historyLimit` (of `channels.<channel>.accounts.*.historyLimit`) voor overschrijvingen. Stel `0` in om uit te schakelen.

  </Accordion>
</AccordionGroup>

## Toolbeperkingen voor groepen/kanalen (optioneel)

Sommige kanaalconfiguraties ondersteunen het beperken van welke tools beschikbaar zijn **binnen een specifieke groep/ruimte/kanaal**.

- `tools`: tools toestaan/weigeren voor de hele groep.
- `toolsBySender`: overschrijvingen per afzender binnen de groep. Gebruik expliciete sleutelprefixen: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` en `"*"` wildcard. Verouderde sleutels zonder prefix worden nog steeds geaccepteerd en alleen als `id:` gematcht.

Resolutievolgorde (meest specifiek wint):

<Steps>
  <Step title="Groep toolsBySender">
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
Toolbeperkingen voor groepen/kanalen worden toegepast naast globaal/agent-toolbeleid (weigeren wint nog steeds). Sommige kanalen gebruiken andere nesting voor ruimtes/kanalen (bijv. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Groepstoegestane lijsten

Wanneer `channels.whatsapp.groups`, `channels.telegram.groups` of `channels.imessage.groups` is geconfigureerd, fungeren de sleutels als een toegestane lijst voor groepen. Gebruik `"*"` om alle groepen toe te staan terwijl nog steeds standaard vermeldingsgedrag wordt ingesteld.

<Warning>
Veelvoorkomende verwarring: DM-koppelingsgoedkeuring is niet hetzelfde als groepsautorisatie. Voor kanalen die DM-koppeling ondersteunen, ontgrendelt de koppelingsopslag alleen DM's. Groepsopdrachten vereisen nog steeds expliciete groepsafzenderautorisatie vanuit configuratietoegestane lijsten zoals `groupAllowFrom` of de gedocumenteerde configuratiefallback voor dat kanaal.
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
  <Tab title="Alleen-eigenaar triggers (WhatsApp)">
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

Eigenaar wordt bepaald door `channels.whatsapp.allowFrom` (of de eigen E.164 van de bot wanneer niet ingesteld). Stuur de opdracht als een zelfstandig bericht. Andere oppervlakken negeren momenteel `/activation`.

## Contextvelden

Binnenkomende groepspayloads stellen in:

- `ChatType=group`
- `GroupSubject` (indien bekend)
- `GroupMembers` (indien bekend)
- `WasMentioned` (resultaat van vermeldingspoort)
- Telegram-forumonderwerpen bevatten ook `MessageThreadId` en `IsForum`.

Kanaalspecifieke opmerkingen:

- BlueBubbles kan naamloze macOS-groepsdeelnemers optioneel verrijken vanuit de lokale Contacten-database voordat `GroupMembers` wordt ingevuld. Dit staat standaard uit en wordt alleen uitgevoerd nadat normale groepspoortcontrole is geslaagd.

De systeemprompt van de agent bevat een groepsintro bij de eerste beurt van een nieuwe groepssessie. Deze herinnert het model eraan te reageren als een mens, Markdown-tabellen te vermijden, lege regels te minimaliseren en normale chatspatiëring te volgen, en te vermijden letterlijke `\n`-reeksen te typen. Groepsnamen en deelnemerslabels afkomstig uit kanalen worden weergegeven als afgeschermde niet-vertrouwde metadata, niet als inline systeeminstructies.

## iMessage-specifiek

- Geef de voorkeur aan `chat_id:<id>` bij routering of toelating.
- Chats weergeven: `imsg chats --limit 20`.
- Groepsantwoorden gaan altijd terug naar dezelfde `chat_id`.

## WhatsApp-systeemprompts

Zie [WhatsApp](/nl/channels/whatsapp#system-prompts) voor de canonieke WhatsApp-systeempromptregels, inclusief resolutie van groeps- en directe prompts, wildcardgedrag en semantiek voor accountoverschrijvingen.

## WhatsApp-specifiek

Zie [Groepsberichten](/nl/channels/group-messages) voor WhatsApp-specifiek gedrag (geschiedenisinjectie, details voor vermeldingsafhandeling).

## Gerelateerd

- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepsberichten](/nl/channels/group-messages)
- [Koppeling](/nl/channels/pairing)
