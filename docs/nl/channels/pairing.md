---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuwe iOS/Android-node koppelen
    - De beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een DM mag sturen + welke nodes kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-05-10T19:23:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

"Koppelen" is de expliciete stap voor toegangstoestemming van OpenClaw.
Het wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/Nodes mogen deelnemen aan het Gateway-netwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je dit goedkeurt.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-allowlist `"*"` bevat.
Installatie en validatie vereisen die wildcard voor openbaar-open configuraties. Als bestaande
status `open` bevat met concrete `allowFrom`-vermeldingen, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de koppelingsopslag verbreden `open`-toegang niet.

Koppelcodes:

- 8 tekens, hoofdletters, geen verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer eenmaal per uur per afzender).
- Wachtende DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; extra verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen opdrachteigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-koppelcode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste installaties een expliciete eigenaar voor bevoorrechte opdrachten en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op het hoogste niveau wanneer dezelfde vertrouwde set afzenders moet gelden voor
meerdere berichtkanalen of voor zowel DM- als groeps-allowlists.

Statische groepen gebruiken `type: "message.senders"` en worden vanuit kanaal-allowlists verwezen met
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

- Wachtende verzoeken: `<channel>-pairing.json`
- Goedgekeurde allowlist-opslag:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor accountafbakening:

- Niet-standaardaccounts lezen/schrijven alleen hun afgebakende allowlist-bestand.
- Het standaardaccount gebruikt het niet-afgebakende allowlist-bestand met kanaalbereik.

Behandel deze als gevoelig (ze regelen toegang tot je assistent).

<Note>
De koppelings-allowlist-opslag is voor DM-toegang. Groepsautorisatie is afzonderlijk.
Het goedkeuren van een DM-koppelcode geeft die afzender niet automatisch toestemming om groeps-
opdrachten uit te voeren of de bot in groepen te beheren. De initialisatie van de eerste eigenaar is afzonderlijke configuratie-
status in `commands.ownerAllowFrom`, en groepschatbezorging volgt nog steeds de
groeps-allowlists van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-onderwerp-overschrijvingen, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless Nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek aan dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair` Plugin gebruikt, kun je eerste apparaatkoppeling volledig vanuit Telegram doen:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een afzonderlijk bericht met **installatiecode** (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Settings → Gateway.
4. Scan de QR-code of plak de installatiecode en maak verbinding.
5. Terug in Telegram: `/pair pending` (controleer verzoek-ID's, rol en scopes), keur daarna goed.

De installatiecode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat dat wordt gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token draagt het ingebouwde bootstrap-profiel voor koppeling:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft begrensd tot de bootstrap-allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap-scopecontroles zijn rol-geprefixt, niet één platte scopepool:
  operator-scopevermeldingen voldoen alleen aan operator-verzoeken, en niet-operatorrollen
  moeten nog steeds scopes aanvragen onder hun eigen rolprefix
- latere tokenrotatie/intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepersessie

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

Gebruik voor Tailscale, openbare of andere mobiele koppeling op afstand Tailscale Serve/Funnel
of een andere `wss://` Gateway-URL. Platte tekst `ws://`-installatiecodes worden alleen geaccepteerd
voor loopback, privé-LAN-adressen, `.local` Bonjour-hosts en de Android-
emulatorhost. Tailnet-CGNAT-adressen, `.ts.net`-namen en openbare hosts falen nog steeds
gesloten voordat QR-/installatiecodes worden uitgegeven.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppeld-apparaat-sessie
is geopend met alleen-koppelingsscope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Zo kan een bestaand gekoppeld apparaat met adminmogelijkheden een nieuwe
Control UI-/browserkoppeling herstellen zonder `devices/paired.json` handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere auth-gegevens (bijvoorbeeld andere
rol/scopes/openbare sleutel), wordt het vorige wachtende verzoek vervangen en wordt een nieuw
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, behoudt OpenClaw de bestaande goedkeuring ongewijzigd en maakt het een nieuw wachtend upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van vertrouwde-CIDR Nodes

Apparaatkoppeling blijft standaard handmatig. Voor strak beheerde Node-netwerken
kun je je aanmelden voor automatische eerste goedkeuring van Nodes met expliciete CIDR's of exacte IP's:

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

### Statusopslag voor Node-koppeling

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; wachtende verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De verouderde `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  afzonderlijke koppelingsopslag die door de Gateway wordt beheerd. WS-Nodes vereisen nog steeds apparaatkoppeling.
- Het koppelingsrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een losse tokenvermelding
  buiten de goedgekeurde rollen creëert geen nieuwe toegang.

## Gerelateerde documentatie

- Beveiligingsmodel + promptinjectie: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (doctor uitvoeren): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - iMessage: [iMessage](/nl/channels/imessage)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
