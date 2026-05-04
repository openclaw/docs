---
read_when:
    - Toegangscontrole voor privéberichten instellen
    - Een nieuwe iOS/Android-Node koppelen
    - De beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een DM mag sturen + welke Nodes mogen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-05-04T09:37:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

“Koppeling” is de expliciete stap voor toegangsgoedkeuring van OpenClaw.
Deze wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes mogen deelnemen aan het gateway-netwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je goedkeuring geeft.

Standaard DM-beleidsregels zijn gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-toestaanlijst `"*"` bevat.
Voor installatie en validatie is die jokertekenwaarde vereist voor publiek-open configuraties. Als bestaande
status `open` met concrete `allowFrom`-vermeldingen bevat, laat runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de pairing-store verbreden `open`-toegang niet.

Koppelingscodes:

- 8 tekens, hoofdletters, geen dubbelzinnige tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot verstuurt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer eenmaal per uur per afzender).
- Openstaande DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; aanvullende verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen opdracht-eigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-koppelingscode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste installaties een expliciete eigenaar voor bevoorrechte opdrachten en prompts voor exec-goedkeuring.
Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-toegang;
ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op topniveau wanneer dezelfde set vertrouwde afzenders moet gelden voor
meerdere berichtkanalen of voor zowel DM- als groepstoestaanlijsten.

Statische groepen gebruiken `type: "message.senders"` en worden vanuit kanaaltoestaanlijsten verwezen met
`accessGroup:<name>`:

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

Toegangsgroepen worden hier in detail gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de status staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Openstaande verzoeken: `<channel>-pairing.json`
- Goedgekeurde toestaanlijst-store:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor accountscoping:

- Niet-standaardaccounts lezen/schrijven alleen hun gescopete toestaanlijstbestand.
- Het standaardaccount gebruikt het ongescopete toestaanlijstbestand op kanaalniveau.

Behandel deze als gevoelig (ze beheren toegang tot je assistent).

<Note>
De pairing-toestaanlijst-store is voor DM-toegang. Groepsautorisatie staat daar los van.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groepsopdrachten
uit te voeren of de bot in groepen te beheren. Initialisatie van de eerste eigenaar is afzonderlijke configuratiestatus
in `commands.ownerAllowFrom`, en groepschatbezorging volgt nog steeds de
groepstoestaanlijsten van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-topic-overschrijvingen, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek aan dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair`-Plugin gebruikt, kun je eerste apparaatkoppeling volledig vanuit Telegram doen:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een afzonderlijk bericht met **installatiecode** (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Scan de QR-code of plak de installatiecode en maak verbinding.
5. Terug in Telegram: `/pair pending` (controleer verzoek-ID's, rol en scopes), en keur daarna goed.

De installatiecode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat dat wordt gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token draagt het ingebouwde pairing-bootstrapprofiel:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft begrensd tot de bootstrap-toestaanlijst:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap-scopecontroles zijn rolgeprefixt, geen enkele platte scopepool:
  operator-scopevermeldingen voldoen alleen aan operator-verzoeken, en niet-operatorrollen
  moeten nog steeds scopes aanvragen onder hun eigen rolprefix
- latere tokenrotatie/-intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepende sessie

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

Gebruik voor Tailscale, publieke of andere niet-loopback mobiele koppeling Tailscale
Serve/Funnel of een andere `wss://` Gateway-URL. Directe niet-loopback `ws://`-installatie-
URL's worden afgewezen voordat QR-/installatiecode-uitgifte plaatsvindt. Platte-tekst `ws://`-installatiecodes
zijn beperkt tot loopback-URL's; private-network `ws://`-clients vereisen nog steeds de expliciete
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` break-glass die wordt beschreven in de externe
Gateway-gids.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppelde-apparaatsessie
is geopend met alleen-koppeling-scope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Daardoor kan een bestaand gekoppeld apparaat met adminmogelijkheden een nieuwe
Control UI-/browserkoppeling herstellen zonder `devices/paired.json` handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere auth-details (bijvoorbeeld andere
rol/scopes/publieke sleutel), wordt het vorige openstaande verzoek vervangen en wordt een nieuwe
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, behoudt OpenClaw de bestaande goedkeuring zoals die is en maakt het een nieuw openstaand upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van vertrouwde-CIDR-Nodes

Apparaatkoppeling blijft standaard handmatig. Voor strikt beheerde Node-netwerken
kun je je aanmelden voor automatische goedkeuring van eerste Node-koppeling met expliciete CIDR's of exacte IP's:

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

### Opslag van Node-koppelingsstatus

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; openstaande verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De legacy `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  afzonderlijke pairing-store die eigendom is van de gateway. WS-Nodes vereisen nog steeds apparaatkoppeling.
- Het pairing-record is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een losse tokenvermelding
  buiten de goedgekeurde rollen maakt geen nieuwe toegang aan.

## Gerelateerde docs

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
