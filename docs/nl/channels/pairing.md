---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuwe iOS-/Android-Node koppelen
    - De beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je rechtstreeks kan berichten + welke nodes kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-05-06T09:03:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5543c10868418234714b175cd4bd373818be8dd40327121ac6c44819ed7519b2
    source_path: channels/pairing.md
    workflow: 16
---

“Koppelen” is de expliciete stap voor toegangsgoedkeuring van OpenClaw.
Het wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes mogen deelnemen aan het Gateway-netwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je het goedkeurt.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-toelatingslijst `"*"` bevat.
Setup en validatie vereisen die wildcard voor openbare-open configuraties. Als bestaande
state `open` bevat met concrete `allowFrom`-vermeldingen, laat runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de pairing-store verbreden `open`-toegang niet.

Koppelingscodes:

- 8 tekens, hoofdletters, geen verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot verstuurt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer eenmaal per uur per afzender).
- Wachtende DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; extra verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen command-eigenaar is geconfigureerd, bootstrapt het goedkeuren van een DM-koppelingscode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft initiële setups een expliciete eigenaar voor bevoorrechte commands en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik top-level `accessGroups` wanneer dezelfde set vertrouwde afzenders moet gelden voor
meerdere berichtkanalen of voor zowel DM- als groepstoelatingslijsten.

Statische groepen gebruiken `type: "message.senders"` en worden vanuit kanaaltoelatingslijsten
verwezen met `accessGroup:<name>`:

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

Toegangsgroepen zijn hier uitgebreid gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de state staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Wachtende verzoeken: `<channel>-pairing.json`
- Goedgekeurde toelatingslijst-store:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Account-scopinggedrag:

- Niet-standaardaccounts lezen/schrijven alleen hun gescopete toelatingslijstbestand.
- Standaardaccount gebruikt het kanaalgescopete, ongescopete toelatingslijstbestand.

Behandel deze als gevoelig (ze bewaken toegang tot je assistent).

<Note>
De pairing-toelatingslijst-store is voor DM-toegang. Groepsautorisatie staat los.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groeps-
commands uit te voeren of de bot in groepen te bedienen. Bootstrap van de eerste eigenaar is aparte configuratie-
state in `commands.ownerAllowFrom`, en levering in groepschats volgt nog steeds de
groepstoelatingslijsten van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-topic overrides, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek aan dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair` plugin gebruikt, kun je initiële apparaatkoppeling volledig vanuit Telegram doen:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een apart **setupcode**-bericht (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Scan de QR-code of plak de setupcode en maak verbinding.
5. Terug in Telegram: `/pair pending` (controleer verzoek-ID's, rol en scopes), en keur daarna goed.

De setupcode is een base64-gecodeerde JSON-payload die het volgende bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat, gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token draagt het ingebouwde pairing-bootstrapprofiel:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft begrensd tot de bootstrap-toelatingslijst:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap-scopecontroles zijn rolgeprefixet, geen enkele platte scope-pool:
  operator-scopevermeldingen voldoen alleen aan operator-verzoeken, en niet-operatorrollen
  moeten nog steeds scopes aanvragen onder hun eigen rolprefix
- latere tokenrotatie/-intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepende sessie

Behandel de setupcode als een wachtwoord zolang die geldig is.

Gebruik voor Tailscale, openbare of andere mobiele koppeling op afstand Tailscale Serve/Funnel
of een andere `wss://` Gateway-URL. Plaintext `ws://`-setupcodes worden alleen geaccepteerd
voor loopback, privé-LAN-adressen, `.local` Bonjour-hosts en de Android-
emulatorhost. Tailnet CGNAT-adressen, `.ts.net`-namen en openbare hosts
falen nog steeds gesloten vóór uitgifte van QR-/setupcode.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppelde-apparaatsessie
is geopend met alleen pairing-scope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Hierdoor kan een bestaand admin-capabel gekoppeld apparaat een nieuwe
Control UI/browser-koppeling herstellen zonder `devices/paired.json` handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat het opnieuw probeert met andere auth-gegevens (bijvoorbeeld andere
rol/scopes/publieke sleutel), wordt het vorige wachtende verzoek vervangen en wordt een nieuwe
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, houdt OpenClaw de bestaande goedkeuring ongewijzigd en maakt het een nieuw wachtend upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele vertrouwde-CIDR automatische Node-goedkeuring

Apparaatkoppeling blijft standaard handmatig. Voor strikt gecontroleerde node-netwerken
kun je kiezen voor automatische eerste Node-goedkeuring met expliciete CIDR's of exacte IP's:

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
goedkeuring. Wijzigingen in rol, scope, metadata en publieke sleutel vereisen nog steeds handmatige
goedkeuring.

### Opslag van Node-koppelingsstate

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; wachtende verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De legacy `node.pair.*` API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  aparte, door de Gateway beheerde pairing-store. WS-nodes vereisen nog steeds apparaatkoppeling.
- Het pairing-record is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een verdwaalde tokenvermelding
  buiten de goedgekeurde rollen creëert geen nieuwe toegang.

## Gerelateerde docs

- Beveiligingsmodel + prompt injection: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (doctor uitvoeren): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/nl/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/nl/channels/imessage)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
