---
read_when:
    - Kanaalroutering of inboxgedrag wijzigen
summary: Routeringsregels per kanaal (WhatsApp, Telegram, Discord, Slack) en gedeelde context
title: Kanaalroutering
x-i18n:
    generated_at: "2026-05-02T11:08:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanalen en routing

OpenClaw routeert antwoorden **terug naar het kanaal waar een bericht vandaan kwam**. Het
model kiest geen kanaal; de routing is deterministisch en wordt bepaald door de
hostconfiguratie.

## Kernbegrippen

- **Kanaal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus Plugin-kanalen. `webchat` is het interne WebChat-UI-kanaal en is geen configureerbaar uitgaand kanaal.
- **AccountId**: accountinstantie per kanaal (wanneer ondersteund).
- Optioneel standaardaccount voor kanaal: `channels.<channel>.defaultAccount` kiest
  welk account wordt gebruikt wanneer een uitgaand pad geen `accountId` opgeeft.
  - Stel in configuraties met meerdere accounts een expliciete standaardwaarde in (`defaultAccount` of `accounts.default`) wanneer twee of meer accounts zijn geconfigureerd. Zonder deze waarde kan fallback-routing de eerste genormaliseerde account-ID kiezen.
- **AgentId**: een geisoleerde werkruimte + sessieopslag ("brein").
- **SessionKey**: de bucket-sleutel die wordt gebruikt om context op te slaan en concurrency te beheren.

## Prefixen voor uitgaande doelen

Expliciete uitgaande doelen kunnen een providerprefix bevatten, zoals `telegram:123` of `tg:123`. Core behandelt die prefix alleen als hint voor kanaalselectie wanneer het geselecteerde kanaal `last` is of anderszins niet is opgelost, en alleen wanneer de geladen Plugin die prefix adverteert. Als de aanroeper al een expliciet kanaal heeft geselecteerd, moet de providerprefix overeenkomen met dat kanaal; kanaaloverschrijdende combinaties, zoals WhatsApp-bezorging naar `telegram:123`, mislukken voordat Plugin-specifieke doelnormalisatie plaatsvindt.

Doelsoort- en serviceprefixen zoals `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` en `sms:<number>` blijven binnen de grammatica van het geselecteerde kanaal. Ze selecteren de provider niet zelf.

## Vormen van sessiesleutels (voorbeelden)

Directe berichten vallen standaard samen in de **main**-sessie van de agent:

- `agent:<agentId>:<mainKey>` (standaard: `agent:main:main`)

Zelfs wanneer de gespreksgeschiedenis van directe berichten met main wordt gedeeld, gebruiken sandbox en
toolbeleid een afgeleide runtime-sleutel per account voor externe directe chats,
zodat berichten die vanuit een kanaal komen niet worden behandeld als lokale main-sessieruns.

Groepen en kanalen blijven per kanaal geisoleerd:

- Groepen: `agent:<agentId>:<channel>:group:<id>`
- Kanalen/ruimten: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack/Discord-threads voegen `:thread:<threadId>` toe aan de basissleutel.
- Telegram-forumonderwerpen nemen `:topic:<topicId>` op in de groepssleutel.

Voorbeelden:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Vastzetten van main-DM-route

Wanneer `session.dmScope` `main` is, kunnen directe berichten een main-sessie delen.
Om te voorkomen dat de `lastRoute` van de sessie wordt overschreven door DM's van niet-eigenaars,
leidt OpenClaw een vastgezette eigenaar af uit `allowFrom` wanneer al het volgende waar is:

- `allowFrom` heeft precies een niet-wildcardvermelding.
- De vermelding kan worden genormaliseerd naar een concrete afzender-ID voor dat kanaal.
- De inkomende DM-afzender komt niet overeen met die vastgezette eigenaar.

In dat geval van een mismatch registreert OpenClaw nog steeds inkomende sessiemetadata, maar het
slaat het bijwerken van de main-sessie `lastRoute` over.

## Bewaakte inkomende registratie

Kanaal-Plugins kunnen een inkomend sessierecord markeren als `createIfMissing: false`
wanneer een bewaakt pad geen nieuwe OpenClaw-sessie mag maken. In die modus
kan OpenClaw metadata en `lastRoute` voor een bestaande sessie bijwerken, maar het
maakt geen sessievermelding met alleen een route aan alleen omdat een bericht is waargenomen.

## Routingregels (hoe een agent wordt gekozen)

Routing kiest **een agent** voor elk inkomend bericht:

1. **Exacte peer-overeenkomst** (`bindings` met `peer.kind` + `peer.id`).
2. **Bovenliggende peer-overeenkomst** (thread-overerving).
3. **Guild + rollen-overeenkomst** (Discord) via `guildId` + `roles`.
4. **Guild-overeenkomst** (Discord) via `guildId`.
5. **Teamovereenkomst** (Slack) via `teamId`.
6. **Accountovereenkomst** (`accountId` op het kanaal).
7. **Kanaalovereenkomst** (elk account op dat kanaal, `accountId: "*"`).
8. **Standaardagent** (`agents.list[].default`, anders eerste lijstvermelding, fallback naar `main`).

Wanneer een binding meerdere matchvelden bevat (`peer`, `guildId`, `teamId`, `roles`), **moeten alle opgegeven velden overeenkomen** voordat die binding van toepassing is.

De gematchte agent bepaalt welke werkruimte en sessieopslag worden gebruikt.

## Broadcastgroepen (meerdere agents uitvoeren)

Met broadcastgroepen kun je **meerdere agents** uitvoeren voor dezelfde peer **wanneer OpenClaw normaal gesproken zou antwoorden** (bijvoorbeeld: in WhatsApp-groepen, na gating op vermelding/activatie).

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

- `agents.list`: benoemde agentdefinities (werkruimte, model, enzovoort).
- `bindings`: koppel inkomende kanalen/accounts/peers aan agents.

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

Sessieopslagen bevinden zich onder de statusmap (standaard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-transcripten bevinden zich naast de opslag

Je kunt het opslagpad overschrijven via `session.store` en `{agentId}`-templating.

Gateway- en ACP-sessieontdekking scant ook schijfgebaseerde agentopslagen onder de
standaardroot `agents/` en onder getemplate `session.store`-roots. Ontdekte
opslagen moeten binnen die opgeloste agentroot blijven en een regulier
`sessions.json`-bestand gebruiken. Symlinks en paden buiten de root worden genegeerd.

## WebChat-gedrag

WebChat koppelt aan de **geselecteerde agent** en gebruikt standaard de main-sessie
van de agent. Hierdoor kun je met WebChat kanaaloverschrijdende context voor die
agent op een plek zien.

## Antwoordcontext

Inkomende antwoorden bevatten:

- `ReplyToId`, `ReplyToBody` en `ReplyToSender` wanneer beschikbaar.
- Geciteerde context wordt toegevoegd aan `Body` als een `[Replying to ...]`-blok.

Dit is consistent tussen kanalen.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Koppelen](/nl/channels/pairing)
