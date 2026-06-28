---
read_when:
    - Kanaalroutering of inboxgedrag wijzigen
summary: Routeringsregels per kanaal (WhatsApp, Telegram, Discord, Slack) en gedeelde context
title: Kanaalroutering
x-i18n:
    generated_at: "2026-05-06T09:02:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Kanalen en routering

OpenClaw routeert antwoorden **terug naar het kanaal waar een bericht vandaan kwam**. Het
model kiest geen kanaal; routering is deterministisch en wordt gestuurd door de
hostconfiguratie.

## Kernbegrippen

- **Kanaal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus Plugin-kanalen. `webchat` is het interne WebChat-UI-kanaal en is geen configureerbaar uitgaand kanaal.
- **AccountId**: accountinstantie per kanaal (wanneer ondersteund).
- Optioneel standaardaccount voor kanaal: `channels.<channel>.defaultAccount` kiest
  welk account wordt gebruikt wanneer een uitgaand pad geen `accountId` opgeeft.
  - Stel in configuraties met meerdere accounts een expliciete standaard in (`defaultAccount` of `accounts.default`) wanneer twee of meer accounts zijn geconfigureerd. Zonder die instelling kan fallback-routering de eerste genormaliseerde account-ID kiezen.
- **AgentId**: een geïsoleerde werkruimte + sessieopslag ("brein").
- **SessionKey**: de bucketsleutel die wordt gebruikt om context op te slaan en gelijktijdigheid te beheren.

## Voorvoegsels voor uitgaande doelen

Expliciete uitgaande doelen kunnen een providervoorvoegsel bevatten, zoals `telegram:123` of `tg:123`. Core behandelt dat voorvoegsel alleen als hint voor kanaalselectie wanneer het geselecteerde kanaal `last` is of anderszins onopgelost, en alleen wanneer de geladen Plugin dat voorvoegsel adverteert. Als de aanroeper al een expliciet kanaal heeft geselecteerd, moet het providervoorvoegsel overeenkomen met dat kanaal; kanaaloverschrijdende combinaties zoals WhatsApp-bezorging naar `telegram:123` mislukken vóór Plugin-specifieke doelnormalisatie.

Doelsoort- en servicevoorvoegsels zoals `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` en `sms:<number>` blijven binnen de grammatica van het geselecteerde kanaal. Ze selecteren de provider niet zelfstandig.

## Vormen van sessiesleutels (voorbeelden)

Directe berichten vallen standaard samen met de **main**-sessie van de agent:

- `agent:<agentId>:<mainKey>` (standaard: `agent:main:main`)

Zelfs wanneer gespreksgeschiedenis van directe berichten wordt gedeeld met main, gebruiken sandbox en
toolbeleid een afgeleide runtime-sleutel per account voor directe chats voor externe DM's,
zodat berichten die uit kanalen afkomstig zijn niet worden behandeld als lokale main-sessie-uitvoeringen.

Groepen en kanalen blijven per kanaal geïsoleerd:

- Groepen: `agent:<agentId>:<channel>:group:<id>`
- Kanalen/ruimten: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack/Discord-threads voegen `:thread:<threadId>` toe aan de basissleutel.
- Telegram-forumonderwerpen nemen `:topic:<topicId>` op in de groepssleutel.

Voorbeelden:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Routeringspinning voor main-DM's

Wanneer `session.dmScope` `main` is, kunnen directe berichten één main-sessie delen.
Om te voorkomen dat de `lastRoute` van de sessie wordt overschreven door DM's van niet-eigenaren,
leidt OpenClaw een vastgepinde eigenaar af uit `allowFrom` wanneer al het volgende waar is:

- `allowFrom` heeft precies één niet-wildcardvermelding.
- De vermelding kan worden genormaliseerd naar een concrete afzender-ID voor dat kanaal.
- De inkomende DM-afzender komt niet overeen met die vastgepinde eigenaar.

In dat geval van niet-overeenstemming registreert OpenClaw nog steeds inkomende sessiemetadata, maar het
slaat het bijwerken van `lastRoute` voor de main-sessie over.

## Bewaakte inkomende registratie

Kanaal-Plugins kunnen een inkomend sessierecord markeren als `createIfMissing: false`
wanneer een bewaakt pad geen nieuwe OpenClaw-sessie mag maken. In die modus kan
OpenClaw metadata en `lastRoute` voor een bestaande sessie bijwerken, maar het
maakt geen routeringsloze sessievermelding aan alleen omdat er een bericht is waargenomen.

## Routeringsregels (hoe een agent wordt gekozen)

Routering kiest **één agent** voor elk inkomend bericht:

1. **Exacte peer-overeenkomst** (`bindings` met `peer.kind` + `peer.id`).
2. **Overeenkomst met bovenliggende peer** (thread-overerving).
3. **Guild + rollen-overeenkomst** (Discord) via `guildId` + `roles`.
4. **Guild-overeenkomst** (Discord) via `guildId`.
5. **Teamovereenkomst** (Slack) via `teamId`.
6. **Accountovereenkomst** (`accountId` op het kanaal).
7. **Kanaalovereenkomst** (elk account op dat kanaal, `accountId: "*"`).
8. **Standaardagent** (`agents.list[].default`, anders eerste lijstvermelding, fallback naar `main`).

Wanneer een binding meerdere matchvelden bevat (`peer`, `guildId`, `teamId`, `roles`), moeten **alle opgegeven velden overeenkomen** voordat die binding van toepassing is.

De overeenkomende agent bepaalt welke werkruimte en sessieopslag worden gebruikt.

## Broadcastgroepen (meerdere agents uitvoeren)

Met broadcastgroepen kun je **meerdere agents** uitvoeren voor dezelfde peer **wanneer OpenClaw normaal zou antwoorden** (bijvoorbeeld: in WhatsApp-groepen, na vermelding-/activeringscontrole).

Configuratie:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Zie: [Broadcastgroepen](/nl/channels/broadcast-groups).

## Configuratieoverzicht

- `agents.list`: definities van benoemde agents (werkruimte, model, enz.).
- `bindings`: koppelt inkomende kanalen/accounts/peers aan agents.

Voorbeeld:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Sessieopslag

Sessieopslagen bevinden zich onder de statusdirectory (standaard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-transcripten staan naast de opslag

Je kunt het opslagpad overschrijven via `session.store` en `{agentId}`-templating.

Gateway- en ACP-sessieontdekking scant ook schijfgebonden agentopslagen onder de
standaardroot `agents/` en onder getemplate `session.store`-roots. Ontdekte
opslagen moeten binnen die opgeloste agentroot blijven en een normaal
`sessions.json`-bestand gebruiken. Symlinks en paden buiten de root worden genegeerd.

## WebChat-gedrag

WebChat koppelt aan de **geselecteerde agent** en gebruikt standaard de main-sessie
van de agent. Hierdoor kun je met WebChat context uit meerdere kanalen voor die
agent op één plek zien.

## Antwoordcontext

Inkomende antwoorden bevatten:

- `ReplyToId`, `ReplyToBody` en `ReplyToSender` wanneer beschikbaar.
- Geciteerde context wordt aan `Body` toegevoegd als een blok `[Replying to ...]`.

Dit is consistent over kanalen heen.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Koppeling](/nl/channels/pairing)
