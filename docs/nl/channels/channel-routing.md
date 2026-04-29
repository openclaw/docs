---
read_when:
    - Kanaalroutering of inboxgedrag wijzigen
summary: Routeringsregels per kanaal (WhatsApp, Telegram, Discord, Slack) en gedeelde context
title: Kanaalroutering
x-i18n:
    generated_at: "2026-04-29T22:24:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanalen en routering

OpenClaw routeert antwoorden **terug naar het kanaal waar een bericht vandaan kwam**. Het
model kiest geen kanaal; routering is deterministisch en wordt geregeld door de
hostconfiguratie.

## Belangrijke termen

- **Kanaal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus Plugin-kanalen. `webchat` is het interne WebChat-UI-kanaal en is geen configureerbaar uitgaand kanaal.
- **AccountId**: accountinstantie per kanaal (wanneer ondersteund).
- Optioneel standaardaccount voor kanaal: `channels.<channel>.defaultAccount` kiest
  welk account wordt gebruikt wanneer een uitgaand pad geen `accountId` opgeeft.
  - Stel in configuraties met meerdere accounts een expliciete standaard in (`defaultAccount` of `accounts.default`) wanneer twee of meer accounts zijn geconfigureerd. Zonder dit kan fallback-routering de eerste genormaliseerde account-ID kiezen.
- **AgentId**: een geïsoleerde werkruimte + sessieopslag (“brein”).
- **SessionKey**: de bucketsleutel die wordt gebruikt om context op te slaan en gelijktijdigheid te regelen.

## Vormen van sessiesleutels (voorbeelden)

Directe berichten worden standaard samengevoegd in de **main**-sessie van de agent:

- `agent:<agentId>:<mainKey>` (standaard: `agent:main:main`)

Zelfs wanneer gespreksgeschiedenis van directe berichten wordt gedeeld met main, gebruiken sandbox- en
toolbeleid een afgeleide runtime-sleutel per account voor externe DM's,
zodat berichten die uit een kanaal komen niet worden behandeld als lokale main-sessieruns.

Groepen en kanalen blijven per kanaal geïsoleerd:

- Groepen: `agent:<agentId>:<channel>:group:<id>`
- Kanalen/ruimtes: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack/Discord-threads voegen `:thread:<threadId>` toe aan de basissleutel.
- Telegram-forumonderwerpen voegen `:topic:<topicId>` in in de groepssleutel.

Voorbeelden:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Routevastzetting voor main-DM

Wanneer `session.dmScope` `main` is, kunnen directe berichten één main-sessie delen.
Om te voorkomen dat de `lastRoute` van de sessie wordt overschreven door DM's van niet-eigenaren,
leidt OpenClaw een vastgezette eigenaar af uit `allowFrom` wanneer al het volgende waar is:

- `allowFrom` heeft precies één niet-wildcarditem.
- Het item kan worden genormaliseerd naar een concrete afzender-ID voor dat kanaal.
- De inkomende DM-afzender komt niet overeen met die vastgezette eigenaar.

In dat geval van mismatch legt OpenClaw nog steeds inkomende sessiemetadata vast, maar het
slaat het bijwerken van `lastRoute` van de main-sessie over.

## Beveiligde inkomende registratie

Kanaal-plugins kunnen een inkomend sessierecord markeren als `createIfMissing: false`
wanneer een beveiligd pad geen nieuwe OpenClaw-sessie mag maken. In die modus
kan OpenClaw metadata en `lastRoute` voor een bestaande sessie bijwerken, maar het
maakt geen route-only sessie-item alleen omdat er een bericht is waargenomen.

## Routeringsregels (hoe een agent wordt gekozen)

Routering kiest **één agent** voor elk inkomend bericht:

1. **Exacte peer-overeenkomst** (`bindings` met `peer.kind` + `peer.id`).
2. **Overeenkomst met bovenliggende peer** (thread-overerving).
3. **Guild + rollen-overeenkomst** (Discord) via `guildId` + `roles`.
4. **Guild-overeenkomst** (Discord) via `guildId`.
5. **Team-overeenkomst** (Slack) via `teamId`.
6. **Accountovereenkomst** (`accountId` op het kanaal).
7. **Kanaalovereenkomst** (elk account op dat kanaal, `accountId: "*"`).
8. **Standaardagent** (`agents.list[].default`, anders het eerste item in de lijst, fallback naar `main`).

Wanneer een binding meerdere matchvelden bevat (`peer`, `guildId`, `teamId`, `roles`), **moeten alle opgegeven velden overeenkomen** voordat die binding van toepassing is.

De overeenkomende agent bepaalt welke werkruimte en sessieopslag worden gebruikt.

## Broadcastgroepen (meerdere agents uitvoeren)

Met broadcastgroepen kun je **meerdere agents** uitvoeren voor dezelfde peer **wanneer OpenClaw normaal zou antwoorden** (bijvoorbeeld: in WhatsApp-groepen, na mention-/activatiecontrole).

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

- `agents.list`: benoemde agentdefinities (werkruimte, model, enz.).
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

Sessieopslag staat onder de statusmap (standaard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-transcripten staan naast de opslag

Je kunt het opslagpad overschrijven via `session.store` en `{agentId}`-templates.

Gateway- en ACP-sessiedetectie scant ook schijfgebaseerde agentopslag onder de
standaardhoofdmap `agents/` en onder `session.store`-hoofdmappen met templates. Gedetecteerde
opslag moet binnen die opgeloste agenthoofdmap blijven en een normaal
`sessions.json`-bestand gebruiken. Symlinks en paden buiten de hoofdmap worden genegeerd.

## WebChat-gedrag

WebChat koppelt aan de **geselecteerde agent** en gebruikt standaard de main-sessie
van de agent. Hierdoor kun je met WebChat kanaaloverschrijdende context voor die
agent op één plek zien.

## Antwoordcontext

Inkomende antwoorden bevatten:

- `ReplyToId`, `ReplyToBody` en `ReplyToSender` wanneer beschikbaar.
- Geciteerde context wordt toegevoegd aan `Body` als een `[Replying to ...]`-blok.

Dit is consistent in alle kanalen.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Koppelen](/nl/channels/pairing)
