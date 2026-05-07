---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuwe iOS-/Android-Node koppelen
    - De beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je privéberichten mag sturen + welke nodes mogen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-05-07T01:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

"Koppelen" is de expliciete stap voor toegangsgoedkeuring van OpenClaw.
Het wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes aan het gatewaynetwerk mogen deelnemen)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je goedkeuring geeft.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-toelatingslijst `"*"` bevat.
Voor installatie en validatie is die jokertekenvermelding vereist voor openbaar-open configuraties. Als bestaande
status `open` bevat met concrete `allowFrom`-vermeldingen, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de koppelingsopslag verbreden de `open`-toegang niet.

Koppelingscodes:

- 8 tekens, hoofdletters, geen verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot verzendt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer één keer per uur per afzender).
- Openstaande DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; extra verzoeken worden genegeerd totdat er één verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen commando-eigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-koppelingscode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste installaties een expliciete eigenaar voor bevoorrechte commando's en prompts voor exec-goedkeuring.
Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-toegang;
ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op het hoogste niveau wanneer dezelfde set vertrouwde afzenders moet gelden voor
meerdere berichtkanalen of voor zowel DM- als groepstoelatingslijsten.

Statische groepen gebruiken `type: "message.senders"` en worden vanuit kanaaltoelatingslijsten verwezen met
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

Toegangsgroepen zijn hier gedetailleerd gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de status staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Openstaande verzoeken: `<channel>-pairing.json`
- Opslag voor goedgekeurde toelatingslijst:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor accountscoping:

- Niet-standaardaccounts lezen/schrijven alleen hun gescopete toelatingslijstbestand.
- Standaardaccount gebruikt het ongescopete toelatingslijstbestand op kanaalniveau.

Behandel deze als gevoelig (ze bepalen toegang tot je assistent).

<Note>
De opslag voor de koppelings-toelatingslijst is voor DM-toegang. Groepsautorisatie is afzonderlijk.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groepscommando's uit te voeren
of de bot in groepen te bedienen. Initialisatie van de eerste eigenaar is afzonderlijke configuratiestatus
in `commands.ownerAllowFrom`, en bezorging in groepschats volgt nog steeds de
groepstoelatingslijsten van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of overrides per groep
of per onderwerp, afhankelijk van het kanaal).
</Note>

## 2) Koppelen van Node-apparaten (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een koppelingsverzoek voor een apparaat aan dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair` Plugin gebruikt, kun je eerste apparaatkoppeling volledig vanuit Telegram uitvoeren:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een afzonderlijk bericht met **installatiecode** (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Scan de QR-code of plak de installatiecode en maak verbinding.
5. Terug in Telegram: `/pair pending` (controleer verzoek-ID's, rol en scopes), en keur daarna goed.

De installatiecode is een base64-gecodeerde JSON-payload die het volgende bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat, gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token bevat het ingebouwde koppelings-bootstrapprofiel:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft beperkt tot de bootstrap-toelatingslijst:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- controles op bootstrap-scopes zijn rolgeprefixd, geen enkele platte scope-pool:
  operatorscope-vermeldingen voldoen alleen aan operatorverzoeken, en niet-operatorrollen
  moeten nog steeds scopes aanvragen onder hun eigen rolprefix
- latere tokenrotatie/intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operatorscopes van de aanroepende sessie

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

Gebruik voor Tailscale, openbare of andere mobiele koppeling op afstand Tailscale Serve/Funnel
of een andere `wss://` Gateway-URL. Platte-tekst `ws://`-installatiecodes worden alleen geaccepteerd
voor loopback, privé-LAN-adressen, `.local` Bonjour-hosts en de Android
emulatorhost. Tailnet-CGNAT-adressen, `.ts.net`-namen en openbare hosts
falen nog steeds gesloten voordat QR-/installatiecode-uitgifte plaatsvindt.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppelde-apparaatsessie
is geopend met alleen-koppelingsscope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Hierdoor kan een bestaand gekoppeld apparaat met adminmogelijkheden een nieuwe
Control UI-/browserkoppeling herstellen zonder `devices/paired.json` met de hand te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere authenticatiegegevens (bijvoorbeeld andere
rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt een nieuwe
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, behoudt OpenClaw de bestaande goedkeuring zoals die is en maakt het een nieuw openstaand upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van Node via vertrouwde CIDR

Apparaatkoppeling blijft standaard handmatig. Voor strikt beheerde nodenetwerken
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

Dit geldt alleen voor nieuwe koppelingsverzoeken met `role: node` zonder aangevraagde
scopes. Operator-, browser-, Control UI- en WebChat-clients vereisen nog steeds handmatige
goedkeuring. Wijzigingen in rol, scope, metadata en openbare sleutel vereisen nog steeds handmatige
goedkeuring.

### Statusopslag voor Node-koppeling

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; openstaande verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Notities

- De verouderde `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  afzonderlijke koppelingsopslag die eigendom is van de gateway. WS-nodes vereisen nog steeds apparaatkoppeling.
- Het koppelingsrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een losse tokenvermelding
  buiten de goedgekeurde rollen creëert geen nieuwe toegang.

## Gerelateerde docs

- Beveiligingsmodel + promptinjectie: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (doctor uitvoeren): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - iMessage: [iMessage](/nl/channels/imessage)
  - BlueBubbles (verouderde iMessage-bridge): [BlueBubbles](/nl/channels/bluebubbles)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
