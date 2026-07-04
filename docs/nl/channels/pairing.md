---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuw iOS-/Android-knooppunt koppelen
    - OpenClaw-beveiligingshouding beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een DM mag sturen + welke nodes mogen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-07-04T18:07:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

"Koppelen" is de expliciete stap voor toegangsgoedkeuring van OpenClaw.
Het wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes mogen deelnemen aan het gatewaynetwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je het goedkeurt.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-allowlist `"*"` bevat.
Setup en validatie vereisen die wildcard voor openbaar-open configuraties. Als bestaande
state `open` met concrete `allowFrom`-vermeldingen bevat, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de pairing-store verbreden `open`-toegang niet.

Koppelcodes:

- 8 tekens, hoofdletters, geen dubbelzinnige tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot verstuurt het koppelbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer eenmaal per uur per afzender).
- Openstaande DM-koppelverzoeken zijn standaard beperkt tot **3 per kanaal**; extra verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen commando-eigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-koppelcode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste setups een expliciete eigenaar voor bevoorrechte commando's en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, verlenen latere koppelgoedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op topniveau wanneer dezelfde vertrouwde afzenderset moet gelden voor
meerdere berichtkanalen of voor zowel DM- als groepsallowlists.

Statische groepen gebruiken `type: "message.senders"` en worden vanuit kanaalallowlists verwezen met
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

### Waar de state staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Openstaande verzoeken: `<channel>-pairing.json`
- Goedgekeurde allowlist-store:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor accountscoping:

- Niet-standaardaccounts lezen/schrijven alleen hun scoped allowlist-bestand.
- Standaardaccount gebruikt het kanaalbrede unscoped allowlist-bestand.

Behandel deze als gevoelig (ze regelen toegang tot je assistent).

<Note>
De pairing-allowlist-store is voor DM-toegang. Groepsautorisatie staat hier los van.
Het goedkeuren van een DM-koppelcode staat die afzender niet automatisch toe om groepscommando's
uit te voeren of de bot in groepen te besturen. Bootstrap van de eerste eigenaar is aparte configuratie-
state in `commands.ownerAllowFrom`, en groepschatbezorging blijft de
groepsallowlists van het kanaal volgen (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-topic-overschrijvingen afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelverzoek aan dat moet worden goedgekeurd.

### Koppelen vanuit de Control UI (aanbevolen)

Gebruik een al verbonden Control UI-sessie met `operator.admin`-toegang:

1. Open de Control UI en selecteer **Nodes**.
2. Klik in **Apparaten** op **Mobiel apparaat koppelen**.
3. Open op je telefoon de OpenClaw-app → **Instellingen** → **Gateway**.
4. Scan de QR-code of plak de installatiecode en maak vervolgens verbinding.

Officiële OpenClaw iOS- en Android-apps worden automatisch goedgekeurd wanneer hun
metadata voor de installatiecode overeenkomt. Als **Apparaten** een openstaand verzoek toont (bij
voorbeeld voor een niet-officiële client of niet-overeenkomende metadata), controleer dan de rol en
scopes voordat je het goedkeurt.

De knop is uitgeschakeld wanneer de huidige Control UI-sessie geen
beheerderstoegang heeft. Gebruik in dat geval de CLI-goedkeuringsflow hieronder vanaf de Gateway-host.

### Koppelen via Telegram

Als je de `device-pair`-Plugin gebruikt, kun je eerste apparaatkoppeling volledig vanuit Telegram doen:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een afzonderlijk **installatiecode**-bericht (eenvoudig te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Scan de QR-code of plak de installatiecode en maak verbinding.
5. De officiële mobiele app maakt automatisch verbinding. Als `/pair pending` een
   verzoek toont, controleer dan de rol en scopes voordat je het goedkeurt.

De installatiecode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat dat wordt gebruikt voor de initiële koppelhandshake

Dat bootstrap-token draagt het ingebouwde pairing-bootstrapprofiel:

- het ingebouwde setupprofiel staat alleen de verse QR-/installatiecodebasis toe:
  `node` plus een begrensde `operator`-overdracht
- het overgedragen `node`-token blijft `scopes: []`
- het overgedragen `operator`-token is beperkt tot `operator.approvals`,
  `operator.read`, `operator.talk.secrets` en `operator.write`
- `operator.admin` wordt niet verleend door QR-/installatiecode-bootstrap; daarvoor is een
  afzonderlijke goedgekeurde operator-koppeling of tokenflow vereist
- latere tokenrotatie/-intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepende sessie

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

Gebruik voor Tailscale, openbare of andere externe mobiele koppeling Tailscale Serve/Funnel
of een andere `wss://` Gateway-URL. Plaintext `ws://`-installatiecodes worden alleen geaccepteerd
voor loopback, privé-LAN-adressen, `.local` Bonjour-hosts en de Android-
emulatorhost. Tailnet CGNAT-adressen, `.ts.net`-namen en openbare hosts falen nog steeds
gesloten voordat QR-/installatiecode-uitgifte plaatsvindt.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende paired-device-sessie
is geopend met pairing-only scope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Hierdoor kan een bestaand admin-capable gekoppeld apparaat een nieuwe
Control UI-/browserkoppeling herstellen zonder `devices/paired.json` handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere auth-details (bijvoorbeeld een andere
rol/scopes/public key), wordt het vorige openstaande verzoek vervangen en wordt een nieuwe
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, houdt OpenClaw de bestaande goedkeuring ongewijzigd en maakt het een nieuw openstaand upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw gevraagde toegang voordat je goedkeurt.
</Note>

### Optionele vertrouwde-CIDR Node-auto-goedkeuring

Apparaatkoppeling blijft standaard handmatig. Voor strak gecontroleerde Node-netwerken
kun je je aanmelden voor automatische goedkeuring van eerste Node-koppelingen met expliciete CIDR's of exacte IP's:

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

Dit geldt alleen voor verse `role: node`-koppelverzoeken zonder aangevraagde
scopes. Operator-, browser-, Control UI- en WebChat-clients vereisen nog steeds handmatige
goedkeuring. Wijzigingen in rol, scope, metadata en public key vereisen nog steeds handmatige
goedkeuring.

### Opslag van Node-koppelstate

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; openstaande verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De legacy `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  afzonderlijke gateway-owned pairing-store. WS-nodes vereisen nog steeds apparaatkoppeling.
- Het pairing-record is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een verdwaalde tokenvermelding
  buiten de goedgekeurde rollen creëert geen nieuwe toegang.

## Gerelateerde docs

- Beveiligingsmodel + promptinjectie: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (doctor uitvoeren): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - iMessage: [iMessage](/nl/channels/imessage)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
