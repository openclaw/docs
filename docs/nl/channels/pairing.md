---
read_when:
    - Toegangscontrole voor DM's instellen
    - Een nieuwe iOS/Android-Node koppelen
    - De beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een DM mag sturen + welke nodes mogen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-05-02T11:09:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

“Koppelen” is de expliciete stap voor toegangsgoedkeuring in OpenClaw.
Het wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes tot het gateway-netwerk mogen toetreden)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je dit goedkeurt.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-allowlist `"*"` bevat.
Voor installatie en validatie is die wildcard vereist voor openbaar-open configuraties. Als bestaande
status `open` bevat met concrete `allowFrom`-items, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de pairing-store verbreden `open`-toegang niet.

Koppelingscodes:

- 8 tekens, hoofdletters, geen verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer eenmaal per uur per afzender).
- Openstaande DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; aanvullende verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen opdracht-eigenaar is geconfigureerd, bootstrapt het goedkeuren van een DM-koppelingscode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste installaties een expliciete eigenaar voor bevoorrechte opdrachten en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik top-level `accessGroups` wanneer dezelfde set vertrouwde afzenders van toepassing moet zijn op
meerdere berichtkanalen of op zowel DM- als groeps-allowlists.

Statische groepen gebruiken `type: "message.senders"` en worden vanuit kanaal-allowlists
aangeroepen met `accessGroup:<name>`:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Toegangsgroepen zijn hier in detail gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de status staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Openstaande verzoeken: `<channel>-pairing.json`
- Goedgekeurde allowlist-opslag:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Accountscopinggedrag:

- Niet-standaardaccounts lezen/schrijven alleen hun gescopete allowlist-bestand.
- Standaardaccount gebruikt het kanaalgescopete ongescopete allowlist-bestand.

Behandel deze als gevoelig (ze bewaken toegang tot je assistent).

<Note>
De pairing-allowlist-opslag is voor DM-toegang. Groepsautorisatie staat daar los van.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groeps-
opdrachten uit te voeren of de bot in groepen te bedienen. Bootstrap van de eerste eigenaar is aparte configuratie-
status in `commands.ownerAllowFrom`, en levering in groepschats volgt nog steeds de
groeps-allowlists van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-onderwerp-overschrijvingen, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)

Nodes maken verbinding met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek aan dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair`-Plugin gebruikt, kun je de eerste apparaatkoppeling volledig vanuit Telegram doen:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een apart bericht met een **installatiecode** (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Plak de installatiecode en maak verbinding.
5. Terug in Telegram: `/pair pending` (controleer verzoek-ID's, rol en scopes), en keur daarna goed.

De installatiecode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor een enkel apparaat dat wordt gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token draagt het ingebouwde bootstrap-profiel voor koppeling:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft begrensd tot de bootstrap-allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap-scopecontroles zijn rol-geprefixt, niet een enkele platte scope-pool:
  operator-scope-items voldoen alleen aan operator-verzoeken, en niet-operatorrollen
  moeten nog steeds scopes onder hun eigen rolprefix aanvragen
- latere tokenrotatie/intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepende sessie

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Als hetzelfde apparaat opnieuw probeert met andere authenticatiegegevens (bijvoorbeeld een andere
rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt een nieuwe
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, houdt OpenClaw de bestaande goedkeuring ongewijzigd en maakt het een nieuw openstaand upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van vertrouwde-CIDR-nodes

Apparaatkoppeling blijft standaard handmatig. Voor strak beheerde node-netwerken
kun je je expliciet aanmelden voor automatische eerste-goedkeuring van nodes met expliciete CIDR's of exacte IP's:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dit geldt alleen voor nieuwe `role: node`-koppelingsverzoeken zonder aangevraagde
scopes. Operator-, browser-, Control UI- en WebChat-clients vereisen nog steeds handmatige
goedkeuring. Wijzigingen in rol, scope, metadata en openbare sleutel vereisen nog steeds handmatige
goedkeuring.

### Opslag van Node-koppelingsstatus

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; openstaande verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De legacy `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  aparte pairing-store in beheer van de gateway. WS-nodes vereisen nog steeds apparaatkoppeling.
- Het koppelingsrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een los token-item
  buiten de goedgekeurde rollen creëert geen nieuwe toegang.

## Gerelateerde documentatie

- Beveiligingsmodel + promptinjectie: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (doctor uitvoeren): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/nl/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/nl/channels/imessage)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
