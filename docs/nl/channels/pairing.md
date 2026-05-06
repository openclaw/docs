---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuwe iOS-/Android-Node koppelen
    - Beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een DM mag sturen + welke nodes kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-05-06T17:52:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

"Koppeling" is de expliciete stap voor toegangstoestemming in OpenClaw.
Deze wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes aan het Gateway-netwerk mogen deelnemen)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je dit goedkeurt.

Standaard-DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-toelatingslijst `"*"` bevat.
Voor installatie en validatie is die wildcard vereist voor openbaar-open configuraties. Als bestaande
status `open` bevat met concrete `allowFrom`-vermeldingen, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen uit de koppelingsopslag verruimen `open`-toegang niet.

Koppelingscodes:

- 8 tekens, hoofdletters, geen verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer eenmaal per uur per afzender).
- Wachtende DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; aanvullende verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen opdracht-eigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-koppelingscode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste installaties een expliciete eigenaar voor bevoorrechte opdrachten en prompts voor exec-goedkeuring.
Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-toegang;
ze voegen geen extra eigenaars toe.

Ondersteunde kanalen: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op topniveau wanneer dezelfde set vertrouwde afzenders moet gelden voor
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

Toegangsgroepen worden hier uitgebreid gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de status staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Wachtende verzoeken: `<channel>-pairing.json`
- Goedgekeurde toelatingslijstopslag:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor accountscoping:

- Niet-standaardaccounts lezen/schrijven alleen hun gescopete toelatingslijstbestand.
- Standaardaccount gebruikt het kanaalgescopete, ongescopete toelatingslijstbestand.

Behandel deze als gevoelig (ze regelen toegang tot je assistent).

<Note>
De opslag voor de koppelings-toelatingslijst is voor DM-toegang. Groepsautorisatie staat daarvan los.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groepsopdrachten
uit te voeren of de bot in groepen te besturen. Initialisatie van de eerste eigenaar is aparte configuratiestatus
in `commands.ownerAllowFrom`, en aflevering in groepschats volgt nog steeds de
groepstoelatingslijsten van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-onderwerpoverschrijvingen, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek aan dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair`-Plugin gebruikt, kun je een eerste apparaatkoppeling volledig vanuit Telegram uitvoeren:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een afzonderlijk bericht met **installatiecode** (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Scan de QR-code of plak de installatiecode en maak verbinding.
5. Terug in Telegram: `/pair pending` (controleer verzoek-ID's, rol en scopes), keur daarna goed.

De installatiecode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway-WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat dat wordt gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token draagt het ingebouwde koppelings-bootstrapprofiel:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft beperkt tot de bootstrap-toelatingslijst:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- controles van bootstrap-scopes hebben een rolprefix en gebruiken niet één platte scopepool:
  operatorscope-vermeldingen voldoen alleen aan operatorverzoeken, en niet-operatorrollen
  moeten nog steeds scopes aanvragen onder hun eigen rolprefix
- latere tokenrotatie/intrekking blijft beperkt door zowel het goedgekeurde
  rolcontract van het apparaat als de operatorscopes van de aanroepende sessie

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

Voor Tailscale, openbare of andere externe mobiele koppeling gebruik je Tailscale Serve/Funnel
of een andere `wss://` Gateway-URL. Platte-tekst `ws://`-installatiecodes worden alleen geaccepteerd
voor loopback, privé-LAN-adressen, `.local` Bonjour-hosts en de host van de Android-
emulator. Tailnet-CGNAT-adressen, `.ts.net`-namen en openbare hosts falen nog steeds
gesloten voordat QR-/installatiecode-uitgifte plaatsvindt.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppelde-apparaatsessie
is geopend met alleen-koppeling-scope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Hierdoor kan een bestaand admin-geschikt gekoppeld apparaat een nieuwe
Control UI/browser-koppeling herstellen zonder `devices/paired.json` met de hand te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere authenticatiedetails (bijvoorbeeld een andere
rol/scopes/publieke sleutel), wordt het vorige wachtende verzoek vervangen en wordt een nieuw
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, laat OpenClaw de bestaande goedkeuring ongewijzigd en maakt een nieuw wachtend upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van nodes op basis van vertrouwde CIDR

Apparaatkoppeling blijft standaard handmatig. Voor strikt beheerde node-netwerken
kun je je aanmelden voor automatische eerste node-goedkeuring met expliciete CIDR's of exacte IP's:

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
goedkeuring. Wijzigingen aan rol, scope, metadata en publieke sleutel vereisen nog steeds handmatige
goedkeuring.

### Statusopslag voor Node-koppeling

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; wachtende verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De verouderde `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  afzonderlijke koppelingsopslag die eigendom is van de Gateway. WS-nodes vereisen nog steeds apparaatkoppeling.
- De koppelingsrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven beperkt tot die goedgekeurde rollenset; een losse tokenvermelding
  buiten de goedgekeurde rollen maakt geen nieuwe toegang aan.

## Gerelateerde documentatie

- Beveiligingsmodel + promptinjectie: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (doctor uitvoeren): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/nl/channels/bluebubbles)
  - iMessage (verouderd): [iMessage](/nl/channels/imessage)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
