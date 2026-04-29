---
read_when:
    - iMessage-ondersteuning instellen
    - iMessage-verzenden/-ontvangen debuggen
summary: Verouderde iMessage-ondersteuning via imsg (JSON-RPC via stdio). Nieuwe installaties moeten BlueBubbles gebruiken.
title: iMessage
x-i18n:
    generated_at: "2026-04-29T22:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
Gebruik voor nieuwe iMessage-implementaties <a href="/nl/channels/bluebubbles">BlueBubbles</a>.

De `imsg`-integratie is verouderd en kan in een toekomstige release worden verwijderd.
</Warning>

Status: verouderde externe CLI-integratie. Gateway start `imsg rpc` en communiceert via JSON-RPC op stdio (geen aparte daemon/poort).

<CardGroup cols={3}>
  <Card title="BlueBubbles (aanbevolen)" icon="message-circle" href="/nl/channels/bluebubbles">
    Voorkeurspad voor iMessage bij nieuwe configuraties.
  </Card>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    iMessage-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Configuratiereferentie" icon="settings" href="/nl/gateway/config-channels#imessage">
    Volledige veldreferentie voor iMessage.
  </Card>
</CardGroup>

## Snelle configuratie

<Tabs>
  <Tab title="Lokale Mac (snel pad)">
    <Steps>
      <Step title="Installeer en verifieer imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configureer OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Keur eerste DM-koppeling goed (standaard dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Koppelingsverzoeken verlopen na 1 uur.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Externe Mac via SSH">
    OpenClaw vereist alleen een stdio-compatibele `cliPath`, dus je kunt `cliPath` laten verwijzen naar een wrapperscript dat via SSH verbinding maakt met een externe Mac en `imsg` uitvoert.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Aanbevolen configuratie wanneer bijlagen zijn ingeschakeld:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Als `remoteHost` niet is ingesteld, probeert OpenClaw dit automatisch te detecteren door het SSH-wrapperscript te parsen.
    `remoteHost` moet `host` of `user@host` zijn (geen spaties of SSH-opties).
    OpenClaw gebruikt strikte host-sleutelcontrole voor SCP, dus de hostsleutel van de relay moet al bestaan in `~/.ssh/known_hosts`.
    Paden naar bijlagen worden gevalideerd tegen toegestane roots (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Vereisten en rechten (macOS)

- Messages moet zijn aangemeld op de Mac waarop `imsg` draait.
- Volledige schijftoegang is vereist voor de procescontext waarin OpenClaw/`imsg` draait (toegang tot de Messages-database).
- Automatiseringsrecht is vereist om berichten via Messages.app te verzenden.

<Tip>
Rechten worden per procescontext verleend. Als Gateway headless draait (LaunchAgent/SSH), voer dan een eenmalige interactieve opdracht uit in diezelfde context om prompts te activeren:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Toegangscontrole en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.imessage.dmPolicy` beheert directe berichten:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Allowlist-veld: `channels.imessage.allowFrom`.

    Allowlist-vermeldingen kunnen handles of chatdoelen zijn (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Groepsbeleid + vermeldingen">
    `channels.imessage.groupPolicy` beheert groepsafhandeling:

    - `allowlist` (standaard wanneer geconfigureerd)
    - `open`
    - `disabled`

    Allowlist voor groepsafzenders: `channels.imessage.groupAllowFrom`.

    Runtime-fallback: als `groupAllowFrom` niet is ingesteld, vallen iMessage-controles voor groepsafzenders terug op `allowFrom` wanneer beschikbaar.
    Runtime-opmerking: als `channels.imessage` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Vermeldingsgating voor groepen:

    - iMessage heeft geen native metadata voor vermeldingen
    - detectie van vermeldingen gebruikt regexpatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - zonder geconfigureerde patronen kan vermeldingsgating niet worden afgedwongen

    Besturingsopdrachten van geautoriseerde afzenders kunnen vermeldingsgating in groepen omzeilen.

  </Tab>

  <Tab title="Sessies en deterministische antwoorden">
    - DM's gebruiken directe routering; groepen gebruiken groepsroutering.
    - Met de standaard `session.dmScope=main` worden iMessage-DM's samengevoegd in de hoofdsessie van de agent.
    - Groepssessies zijn geïsoleerd (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antwoorden worden teruggeleid naar iMessage met metadata van het oorspronkelijke kanaal/doel.

    Gedrag van groepachtige threads:

    Sommige iMessage-threads met meerdere deelnemers kunnen binnenkomen met `is_group=false`.
    Als die `chat_id` expliciet is geconfigureerd onder `channels.imessage.groups`, behandelt OpenClaw dit als groepsverkeer (groepsgating + isolatie van groepssessies).

  </Tab>
</Tabs>

## ACP-gespreksbindingen

Verouderde iMessage-chats kunnen ook aan ACP-sessies worden gebonden.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit in de DM of toegestane groepschat.
- Toekomstige berichten in datzelfde iMessage-gesprek worden naar de gespawnde ACP-sessie gerouteerd.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie ter plaatse.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Geconfigureerde persistente bindingen worden ondersteund via top-level `bindings[]`-vermeldingen met `type: "acp"` en `match.channel: "imessage"`.

`match.peer.id` kan het volgende gebruiken:

- genormaliseerde DM-handle zoals `+15555550123` of `user@example.com`
- `chat_id:<id>` (aanbevolen voor stabiele groepsbindingen)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Voorbeeld:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Zie [ACP Agents](/nl/tools/acp-agents) voor gedeeld gedrag van ACP-bindingen.

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Toegewijde macOS-gebruiker voor de bot (aparte iMessage-identiteit)">
    Gebruik een toegewijde Apple ID en macOS-gebruiker zodat botverkeer is geïsoleerd van je persoonlijke Messages-profiel.

    Typische flow:

    1. Maak een toegewijde macOS-gebruiker aan/log daarmee in.
    2. Meld je in die gebruiker aan bij Messages met de Apple ID van de bot.
    3. Installeer `imsg` in die gebruiker.
    4. Maak een SSH-wrapper zodat OpenClaw `imsg` kan uitvoeren in die gebruikerscontext.
    5. Laat `channels.imessage.accounts.<id>.cliPath` en `.dbPath` verwijzen naar dat gebruikersprofiel.

    De eerste uitvoering kan GUI-goedkeuringen vereisen (Automatisering + Volledige schijftoegang) in die botgebruikerssessie.

  </Accordion>

  <Accordion title="Externe Mac via Tailscale (voorbeeld)">
    Veelgebruikte topologie:

    - Gateway draait op Linux/VM
    - iMessage + `imsg` draait op een Mac in je tailnet
    - `cliPath`-wrapper gebruikt SSH om `imsg` uit te voeren
    - `remoteHost` maakt het ophalen van bijlagen via SCP mogelijk

    Voorbeeld:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Gebruik SSH-sleutels zodat zowel SSH als SCP niet-interactief zijn.
    Zorg ervoor dat de hostsleutel eerst wordt vertrouwd (bijvoorbeeld `ssh bot@mac-mini.tailnet-1234.ts.net`), zodat `known_hosts` wordt gevuld.

  </Accordion>

  <Accordion title="Patroon voor meerdere accounts">
    iMessage ondersteunt configuratie per account onder `channels.imessage.accounts`.

    Elk account kan velden overschrijven zoals `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geschiedenisinstellingen en allowlists voor bijlagenroots.

  </Accordion>
</AccordionGroup>

## Media, chunking en bezorgdoelen

<AccordionGroup>
  <Accordion title="Bijlagen en media">
    - inkomende bijlage-inname is optioneel: `channels.imessage.includeAttachments`
    - paden naar externe bijlagen kunnen via SCP worden opgehaald wanneer `remoteHost` is ingesteld
    - paden naar bijlagen moeten overeenkomen met toegestane roots:
      - `channels.imessage.attachmentRoots` (lokaal)
      - `channels.imessage.remoteAttachmentRoots` (externe SCP-modus)
      - standaard rootpatroon: `/Users/*/Library/Messages/Attachments`
    - SCP gebruikt strikte host-sleutelcontrole (`StrictHostKeyChecking=yes`)
    - grootte van uitgaande media gebruikt `channels.imessage.mediaMaxMb` (standaard 16 MB)

  </Accordion>

  <Accordion title="Uitgaande chunking">
    - limiet voor tekstchunks: `channels.imessage.textChunkLimit` (standaard 4000)
    - chunkmodus: `channels.imessage.chunkMode`
      - `length` (standaard)
      - `newline` (splitsing met alinea's eerst)

  </Accordion>

  <Accordion title="Adresseringsindelingen">
    Voorkeur voor expliciete doelen:

    - `chat_id:123` (aanbevolen voor stabiele routering)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle-doelen worden ook ondersteund:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Configuratiewijzigingen

iMessage staat standaard door kanalen geïnitieerde configuratiewijzigingen toe (voor `/config set|unset` wanneer `commands.config: true`).

Uitschakelen:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="imsg niet gevonden of RPC niet ondersteund">
    Valideer de binary en RPC-ondersteuning:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Als de probe meldt dat RPC niet wordt ondersteund, werk `imsg` bij.

  </Accordion>

  <Accordion title="DM's worden genegeerd">
    Controleer:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - koppelingsgoedkeuringen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Groepsberichten worden genegeerd">
    Controleer:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - allowlist-gedrag van `channels.imessage.groups`
    - configuratie van vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Externe bijlagen mislukken">
    Controleer:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-sleutelauthenticatie vanaf de Gateway-host
    - hostsleutel bestaat in `~/.ssh/known_hosts` op de Gateway-host
    - leesbaarheid van extern pad op de Mac waarop Messages draait

  </Accordion>

  <Accordion title="macOS-rechtenprompts zijn gemist">
    Voer opnieuw uit in een interactieve GUI-terminal in dezelfde gebruikers-/sessiecontext en keur prompts goed:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Bevestig dat Volledige schijftoegang + Automatisering zijn verleend voor de procescontext waarin OpenClaw/`imsg` draait.

  </Accordion>
</AccordionGroup>

## Verwijzingen naar configuratiereferentie

- [Configuratiereferentie - iMessage](/nl/gateway/config-channels#imessage)
- [Gateway-configuratie](/nl/gateway/configuration)
- [Koppelen](/nl/channels/pairing)
- [BlueBubbles](/nl/channels/bluebubbles)

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
