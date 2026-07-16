---
read_when:
    - Kanaalroutering of inboxgedrag wijzigen
summary: Routeringsregels per kanaal (WhatsApp, Telegram, Discord, Slack) en gedeelde context
title: Kanaalroutering
x-i18n:
    generated_at: "2026-07-16T15:17:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanalen en routering

OpenClaw routeert antwoorden **terug naar het kanaal waar een bericht vandaan kwam**. Het
model kiest geen kanaal; de routering is deterministisch en wordt beheerd door de
hostconfiguratie.

## Belangrijke termen

- **Kanaal**: een meegeleverde kanaalplugin zoals `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` of `whatsapp`, plus geïnstalleerde pluginkanalen. `webchat` is het interne WebChat-UI-kanaal en is geen configureerbaar uitgaand kanaal.
- **AccountId**: accountinstantie per kanaal (indien ondersteund).
- Optioneel standaardaccount voor het kanaal: `channels.<channel>.defaultAccount` bepaalt
  welk account wordt gebruikt wanneer een uitgaand pad geen `accountId` opgeeft.
  - Stel in configuraties met meerdere accounts een expliciete standaard in (`defaultAccount` of een account met de naam `default`) wanneer twee of meer accounts zijn geconfigureerd. Zonder deze instelling kan terugvalroutering de eerste genormaliseerde account-ID kiezen.
- **AgentId**: een geïsoleerde werkruimte + sessieopslag ("brein").
- **SessionKey**: de sleutel voor de bucket waarin context wordt opgeslagen en gelijktijdigheid wordt beheerd.

## Voorvoegsels voor uitgaande doelen

Expliciete uitgaande doelen kunnen een providervoorvoegsel bevatten, zoals `telegram:123` of `tg:123`. Core behandelt dat voorvoegsel alleen als aanwijzing voor kanaalselectie wanneer het geselecteerde kanaal `last` is of anderszins niet is opgelost, en alleen wanneer de geladen plugin dat voorvoegsel aanbiedt. Als de aanroeper al een expliciet kanaal heeft geselecteerd, moet het providervoorvoegsel met dat kanaal overeenkomen; kanaaloverschrijdende combinaties zoals WhatsApp-bezorging bij `telegram:123` mislukken vóór de pluginspecifieke normalisatie van het doel.

Voorvoegsels voor doelsoorten en services, zoals `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` en `sms:<number>`, blijven binnen de grammatica van het geselecteerde kanaal. Ze selecteren niet zelfstandig de provider.

## Vormen van sessiesleutels (voorbeelden)

Directe berichten worden standaard samengevoegd in de **hoofdsessie** van de agent:

- `agent:<agentId>:<mainKey>` (standaard: `agent:main:main`)

`session.dmScope` beheert het samenvoegen van privéberichten: `main` (standaard) deelt één hoofdsessie,
terwijl `per-peer`, `per-channel-peer` en `per-account-channel-peer`
privéberichten in afzonderlijke sessies houden. Een routebinding kan het bereik voor de
overeenkomende peers overschrijven via `bindings[].session.dmScope`.

Zelfs wanneer de gespreksgeschiedenis van directe berichten met de hoofdsessie wordt gedeeld, gebruiken het sandbox- en
toolbeleid een afgeleide runtimesleutel per account voor externe directe chats,
zodat berichten die vanuit kanalen afkomstig zijn niet worden behandeld als lokale uitvoeringen van de hoofdsessie.

Groepen en kanalen blijven per kanaal geïsoleerd:

- Groepen: `agent:<agentId>:<channel>:group:<id>`
- Kanalen/ruimten: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-threads voegen `:thread:<threadId>` toe aan de basissleutel.
- Telegram-forumonderwerpen nemen `:topic:<topicId>` op in de groepssleutel.

Voorbeelden:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Vastzetten van de hoofdroute voor privéberichten

Wanneer `session.dmScope` gelijk is aan `main`, kunnen directe berichten één hoofdsessie delen.
Om te voorkomen dat de `lastRoute` van de sessie wordt overschreven door privéberichten van niet-eigenaren,
leidt OpenClaw een vastgezette eigenaar af uit `allowFrom` wanneer aan al deze voorwaarden wordt voldaan:

- `allowFrom` bevat precies één vermelding die geen jokerteken is.
- De vermelding kan voor dat kanaal worden genormaliseerd tot een concrete afzender-ID.
- De afzender van het inkomende privébericht komt niet overeen met die vastgezette eigenaar.

Bij zo'n afwijking legt OpenClaw nog steeds de metadata van de inkomende sessie vast, maar
wordt het bijwerken van `lastRoute` van de hoofdsessie overgeslagen.

## Beveiligde registratie van inkomende berichten

Kanaalplugins kunnen een inkomende sessieregistratie markeren als `createIfMissing: false`
wanneer een beveiligd pad geen nieuwe OpenClaw-sessie mag aanmaken. In die modus
kan OpenClaw metadata en `lastRoute` voor een bestaande sessie bijwerken, maar
wordt er niet alleen omdat een bericht is waargenomen een sessievermelding uitsluitend voor de route aangemaakt.

## Routeringsregels (hoe een agent wordt gekozen)

De routering kiest **één agent** voor elk inkomend bericht:

1. **Exacte peer-overeenkomst** (`bindings` met `peer.kind` + `peer.id`).
2. **Overeenkomst met bovenliggende peer** (overerving van threads).
3. **Peer-overeenkomst met jokerteken** (`peer.id: "*"` voor een peersoort).
4. **Overeenkomst met server + rollen** (Discord) via `guildId` + `roles`.
5. **Serverovereenkomst** (Discord) via `guildId`.
6. **Teamovereenkomst** (Slack) via `teamId`.
7. **Accountovereenkomst** (`accountId` op het kanaal).
8. **Kanaalovereenkomst** (elk account op dat kanaal, `accountId: "*"`).
9. **Standaardagent** (`agents.list[].default`, anders de eerste vermelding in de lijst, met terugval naar `main`).

Wanneer een binding meerdere overeenkomstvelden bevat (`peer`, `guildId`, `teamId`, `roles`), **moeten alle opgegeven velden overeenkomen** voordat die binding wordt toegepast.

De overeenkomende agent bepaalt welke werkruimte en sessieopslag worden gebruikt.

## Broadcastgroepen (meerdere agents uitvoeren)

Met broadcastgroepen kun je **meerdere agents** uitvoeren voor dezelfde peer **wanneer OpenClaw normaal gesproken zou antwoorden** (bijvoorbeeld: in WhatsApp-groepen, na controle op vermelding/activering).

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

- `agents.list`: agentdefinities met een naam (werkruimte, model enz.).
- `bindings`: inkomende kanalen/accounts/peers aan agents koppelen.

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

Runtime-sessierijen bevinden zich in de SQLite-database van elke agent onder de statusmap
(standaard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Oudere installaties kunnen verouderde JSONL-transcriptbestanden en een `sessions.json`-rijenopslag
onder `~/.openclaw/agents/<agentId>/sessions/` bevatten. Bij het starten van de Gateway en met
`openclaw doctor --fix` worden actieve verouderde rijen/geschiedenis automatisch in SQLite
geïmporteerd. Gebruik `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` en de
validatiereeks van [Doctor](/nl/cli/doctor#session-sqlite-migration) wanneer je
expliciet bewijs van migratie nodig hebt.
Je kunt nog steeds een verouderd opslagpad selecteren via sjablonen met `session.store` en `{agentId}`
voor migratie- en offlineonderhoudswerkstromen.

De sessiedetectie van Gateway en ACP scant ook schijfgebaseerde agentopslag onder de
standaardhoofdmap `agents/` en onder hoofdmapsjablonen met `session.store`. Gedetecteerde
opslag moet binnen die opgeloste agenthoofdmap blijven en een regulier verouderd
`sessions.json`-bestand gebruiken. Symbolische koppelingen en paden buiten de hoofdmap worden genegeerd.

## Gedrag van WebChat

WebChat wordt gekoppeld aan de **geselecteerde agent** en gebruikt standaard de hoofdsessie
van de agent. Hierdoor kun je in WebChat de kanaaloverschrijdende context voor die
agent op één plek bekijken.

## Antwoordcontext

Inkomende antwoorden bevatten:

- `ReplyToId`, `ReplyToBody` en `ReplyToSender` indien beschikbaar.
- Aangehaalde context wordt als een `[Replying to ...]`-blok toegevoegd aan `Body`.

Dit is consistent voor alle kanalen.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Broadcastgroepen](/nl/channels/broadcast-groups)
- [Koppelen](/nl/channels/pairing)
