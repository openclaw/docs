---
read_when:
    - iMessage-ondersteuning instellen
    - Foutopsporing bij iMessage verzenden/ontvangen
summary: Native iMessage-ondersteuning via imsg (JSON-RPC via stdio). Aanbevolen voor nieuwe OpenClaw iMessage-configuraties wanneer aan de hostvereisten wordt voldaan.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Voor nieuwe OpenClaw iMessage-implementaties begin je hier wanneer je `imsg` kunt uitvoeren op een ingelogde macOS Messages-host. BlueBubbles blijft beschikbaar als verouderde fallback voor bestaande setups die afhankelijk zijn van de HTTP-server, webhooks of uitgebreidere private-API-acties.
</Note>

Status: native externe CLI-integratie. Gateway start `imsg rpc` en communiceert via JSON-RPC op stdio (geen afzonderlijke daemon/poort).

<CardGroup cols={3}>
  <Card title="BlueBubbles (verouderde fallback)" icon="message-circle" href="/nl/channels/bluebubbles">
    Blijf dit gebruiken voor bestaande routering die door BlueBubbles wordt ondersteund; vermijd dit voor nieuwe setups wanneer imsg past.
  </Card>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    iMessage-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Configuratiereferentie" icon="settings" href="/nl/gateway/config-channels#imessage">
    Volledige iMessage-veldreferentie.
  </Card>
</CardGroup>

## Snelle setup

<Tabs>
  <Tab title="Lokale Mac (snel pad)">
    <Steps>
      <Step title="imsg installeren en verifiëren">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw configureren">

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

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>

      <Step title="Eerste DM-koppeling goedkeuren (standaard dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Koppelverzoeken verlopen na 1 uur.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Externe Mac via SSH">
    OpenClaw vereist alleen een stdio-compatibele `cliPath`, dus je kunt `cliPath` naar een wrapperscript laten verwijzen dat via SSH verbinding maakt met een externe Mac en `imsg` uitvoert.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Aanbevolen config wanneer bijlagen zijn ingeschakeld:

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
    OpenClaw gebruikt strikte host-key-controle voor SCP, dus de sleutel van de relay-host moet al bestaan in `~/.ssh/known_hosts`.
    Bijlagepaden worden gevalideerd tegen toegestane roots (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Vereisten en machtigingen (macOS)

- Messages moet ingelogd zijn op de Mac waarop `imsg` wordt uitgevoerd.
- Full Disk Access is vereist voor de procescontext waarin OpenClaw/`imsg` wordt uitgevoerd (toegang tot de Messages-database).
- Automatiseringsmachtiging is vereist om berichten via Messages.app te versturen.

<Tip>
Machtigingen worden per procescontext verleend. Als Gateway headless draait (LaunchAgent/SSH), voer dan een eenmalige interactieve opdracht uit in diezelfde context om prompts te activeren:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Toegangsbeheer en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.imessage.dmPolicy` beheert directe berichten:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Allowlist-veld: `channels.imessage.allowFrom`.

    Allowlist-items kunnen handles of chatdoelen zijn (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Groepsbeleid + vermeldingen">
    `channels.imessage.groupPolicy` beheert groepsafhandeling:

    - `allowlist` (standaard wanneer geconfigureerd)
    - `open`
    - `disabled`

    Allowlist voor groepsafzenders: `channels.imessage.groupAllowFrom`.

    Runtime-fallback: als `groupAllowFrom` niet is ingesteld, vallen iMessage-controles voor groepsafzenders terug op `allowFrom` wanneer beschikbaar.
    Runtime-opmerking: als `channels.imessage` volledig ontbreekt, valt de runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Vermeldingspoort voor groepen:

    - iMessage heeft geen native vermeldingsmetadata
    - vermeldingsdetectie gebruikt regex-patronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - zonder geconfigureerde patronen kan de vermeldingspoort niet worden afgedwongen

    Besturingsopdrachten van geautoriseerde afzenders kunnen de vermeldingspoort in groepen omzeilen.

  </Tab>

  <Tab title="Sessies en deterministische antwoorden">
    - DM's gebruiken directe routering; groepen gebruiken groepsroutering.
    - Met de standaard `session.dmScope=main` worden iMessage-DM's samengevoegd in de hoofdsessie van de agent.
    - Groepssessies zijn geïsoleerd (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antwoorden worden terug naar iMessage gerouteerd met metadata van het oorspronkelijke kanaal/doel.

    Groepsachtig threadgedrag:

    Sommige iMessage-threads met meerdere deelnemers kunnen binnenkomen met `is_group=false`.
    Als die `chat_id` expliciet is geconfigureerd onder `channels.imessage.groups`, behandelt OpenClaw dit als groepsverkeer (groepspoort + isolatie van groepssessies).

  </Tab>
</Tabs>

## ACP-gespreksbindingen

Verouderde iMessage-chats kunnen ook aan ACP-sessies worden gebonden.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit in de DM of toegestane groepschat.
- Toekomstige berichten in datzelfde iMessage-gesprek worden naar de gespawnde ACP-sessie gerouteerd.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie op zijn plek.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Geconfigureerde persistente bindingen worden ondersteund via top-level `bindings[]`-items met `type: "acp"` en `match.channel: "imessage"`.

`match.peer.id` kan gebruiken:

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

Zie [ACP-agents](/nl/tools/acp-agents) voor gedeeld gedrag van ACP-bindingen.

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Toegewijde macOS-botgebruiker (afzonderlijke iMessage-identiteit)">
    Gebruik een toegewijde Apple ID en macOS-gebruiker zodat botverkeer is geïsoleerd van je persoonlijke Messages-profiel.

    Typische flow:

    1. Maak een toegewijde macOS-gebruiker aan/log daarop in.
    2. Log in bij Messages met de Apple ID van de bot in die gebruiker.
    3. Installeer `imsg` in die gebruiker.
    4. Maak een SSH-wrapper zodat OpenClaw `imsg` in die gebruikerscontext kan uitvoeren.
    5. Laat `channels.imessage.accounts.<id>.cliPath` en `.dbPath` naar dat gebruikersprofiel verwijzen.

    De eerste run kan GUI-goedkeuringen vereisen (Automation + Full Disk Access) in die botgebruikerssessie.

  </Accordion>

  <Accordion title="Externe Mac via Tailscale (voorbeeld)">
    Veelgebruikte topologie:

    - Gateway draait op Linux/VM
    - iMessage + `imsg` draait op een Mac in je tailnet
    - `cliPath`-wrapper gebruikt SSH om `imsg` uit te voeren
    - `remoteHost` schakelt SCP-ophalen van bijlagen in

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
    Zorg dat de hostsleutel eerst wordt vertrouwd (bijvoorbeeld `ssh bot@mac-mini.tailnet-1234.ts.net`) zodat `known_hosts` wordt gevuld.

  </Accordion>

  <Accordion title="Multi-accountpatroon">
    iMessage ondersteunt configuratie per account onder `channels.imessage.accounts`.

    Elk account kan velden overschrijven zoals `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geschiedenisinstellingen en allowlists voor bijlageroots.

  </Accordion>
</AccordionGroup>

## Media, chunking en leveringsdoelen

<AccordionGroup>
  <Accordion title="Bijlagen en media">
    - verwerking van inkomende bijlagen is optioneel: `channels.imessage.includeAttachments`
    - externe bijlagepaden kunnen via SCP worden opgehaald wanneer `remoteHost` is ingesteld
    - bijlagepaden moeten overeenkomen met toegestane roots:
      - `channels.imessage.attachmentRoots` (lokaal)
      - `channels.imessage.remoteAttachmentRoots` (externe SCP-modus)
      - standaardrootpatroon: `/Users/*/Library/Messages/Attachments`
    - SCP gebruikt strikte host-key-controle (`StrictHostKeyChecking=yes`)
    - grootte van uitgaande media gebruikt `channels.imessage.mediaMaxMb` (standaard 16 MB)

  </Accordion>

  <Accordion title="Uitgaande chunking">
    - tekstchunklimiet: `channels.imessage.textChunkLimit` (standaard 4000)
    - chunkmodus: `channels.imessage.chunkMode`
      - `length` (standaard)
      - `newline` (eerst op alinea splitsen)

  </Accordion>

  <Accordion title="Adresseringsindelingen">
    Voorkeursdoelen met expliciete notatie:

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

## Config-schrijfacties

iMessage staat standaard door het kanaal geïnitieerde config-schrijfacties toe (voor `/config set|unset` wanneer `commands.config: true`).

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
    Valideer het binaire bestand en RPC-ondersteuning:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Als de probe meldt dat RPC niet wordt ondersteund, werk `imsg` dan bij.

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
    - leesbaarheid van het externe pad op de Mac waarop Messages draait

  </Accordion>

  <Accordion title="macOS-machtigingsprompts zijn gemist">
    Voer opnieuw uit in een interactieve GUI-terminal in dezelfde gebruikers-/sessiecontext en keur prompts goed:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Bevestig dat Full Disk Access + Automation zijn verleend voor de procescontext waarin OpenClaw/`imsg` draait.

  </Accordion>
</AccordionGroup>

## Verwijzingen naar configuratiereferentie

- [Configuratiereferentie - iMessage](/nl/gateway/config-channels#imessage)
- [Gateway-configuratie](/nl/gateway/configuration)
- [Koppelen](/nl/channels/pairing)
- [BlueBubbles](/nl/channels/bluebubbles)

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsstroom
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsfiltering
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiligingsversterking
