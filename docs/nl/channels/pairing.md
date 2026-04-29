---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuwe iOS-/Android-Node koppelen
    - De beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een privébericht mag sturen + welke knooppunten kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-04-29T22:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

“Pairing” is de expliciete stap voor toegangsgoedkeuring van OpenClaw.
Het wordt op twee plaatsen gebruikt:

1. **DM-pairing** (wie met de bot mag praten)
2. **Node-pairing** (welke apparaten/nodes mogen deelnemen aan het gatewaynetwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-pairing (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je goedkeurt.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-allowlist `"*"` bevat.
Setup en validatie vereisen die wildcard voor openbaar-open configuraties. Als bestaande
status `open` met concrete `allowFrom`-vermeldingen bevat, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de pairing-store verbreden `open`-toegang niet.

Pairing-codes:

- 8 tekens, hoofdletters, geen dubbelzinnige tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het pairing-bericht alleen wanneer een nieuw verzoek wordt gemaakt (ongeveer eenmaal per uur per afzender).
- Openstaande DM-pairingverzoeken zijn standaard beperkt tot **3 per kanaal**; extra verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen commando-eigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-pairingcode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste setups een expliciete eigenaar voor bevoorrechte commando's en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, verlenen latere pairing-goedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Waar de status staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Openstaande verzoeken: `<channel>-pairing.json`
- Goedgekeurde allowlist-opslag:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor account-scoping:

- Niet-standaardaccounts lezen/schrijven alleen hun scoped allowlist-bestand.
- Standaardaccount gebruikt het kanaal-scoped ongescopete allowlist-bestand.

Behandel deze als gevoelig (ze beheren toegang tot je assistent).

<Note>
De pairing-allowlist-opslag is voor DM-toegang. Groepsautorisatie staat daar los van.
Het goedkeuren van een DM-pairingcode staat die afzender niet automatisch toe om groepscommando's
uit te voeren of de bot in groepen te besturen. De first-owner-bootstrap is afzonderlijke configuratie-
status in `commands.ownerAllowFrom`, en aflevering in groepschats volgt nog steeds de
groepsallowlists van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-topic-overschrijvingen, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatpairing (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatpairingverzoek dat moet worden goedgekeurd.

### Pair via Telegram (aanbevolen voor iOS)

Als je de `device-pair` Plugin gebruikt, kun je eerste apparaatpairing volledig vanuit Telegram doen:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een apart **setupcode**-bericht (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Plak de setupcode en maak verbinding.
5. Terug in Telegram: `/pair pending` (controleer verzoek-ID's, rol en scopes), en keur daarna goed.

De setupcode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat dat wordt gebruikt voor de initiële pairing-handshake

Dat bootstrap-token draagt het ingebouwde pairing-bootstrapprofiel:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft begrensd tot de bootstrap-allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap-scopecontroles zijn rolgeprefixd, geen enkele vlakke scopepool:
  operator-scopevermeldingen voldoen alleen aan operatorverzoeken, en niet-operatorrollen
  moeten nog steeds scopes aanvragen onder hun eigen rolprefix
- latere tokenrotatie/intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepende sessie

Behandel de setupcode als een wachtwoord zolang deze geldig is.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Als hetzelfde apparaat opnieuw probeert met andere auth-gegevens (bijvoorbeeld andere
rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt een nieuw
`requestId` gemaakt.

<Note>
Een al gepaird apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, houdt OpenClaw de bestaande goedkeuring zoals die is en maakt een nieuw openstaand upgradeverzoek. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van vertrouwde-CIDR-nodes

Apparaatpairing blijft standaard handmatig. Voor strak beheerde node-netwerken
kun je first-time automatische goedkeuring van nodes inschakelen met expliciete CIDR's of exacte IP's:

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

Dit geldt alleen voor nieuwe `role: node`-pairingverzoeken zonder aangevraagde
scopes. Operator-, browser-, Control UI- en WebChat-clients vereisen nog steeds handmatige
goedkeuring. Wijzigingen in rol, scope, metadata en openbare sleutel vereisen nog steeds handmatige
goedkeuring.

### Opslag van Node-pairingstatus

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; openstaande verzoeken verlopen)
- `paired.json` (gepairde apparaten + tokens)

### Opmerkingen

- De legacy `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  afzonderlijke pairing-store die eigendom is van de gateway. WS-nodes vereisen nog steeds apparaatpairing.
- Het pairingrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een verdwaalde tokenvermelding
  buiten de goedgekeurde rollen creëert geen nieuwe toegang.

## Gerelateerde docs

- Beveiligingsmodel + promptinjectie: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (voer doctor uit): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/nl/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/nl/channels/imessage)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
