---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuwe iOS-/Android-node koppelen
    - OpenClaw-beveiligingshouding beoordelen
summary: 'Overzicht van koppelen: keur goed wie je een DM kan sturen + welke nodes kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-07-03T17:28:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

"Koppelen" is de expliciete stap voor toegangsgoedkeuring van OpenClaw.
Het wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes mogen deelnemen aan het gateway-netwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je goedkeuring geeft.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-toestemmingslijst `"*"` bevat.
Setup en validatie vereisen die wildcard voor openbaar-open configuraties. Als bestaande
status `open` bevat met concrete `allowFrom`-items, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de koppelingsopslag verbreden `open`-toegang niet.

Koppelingscodes:

- 8 tekens, hoofdletters, geen verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het koppelingsbericht alleen wanneer er een nieuw verzoek wordt gemaakt (ongeveer eenmaal per uur per afzender).
- Openstaande DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; extra verzoeken worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen commando-eigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-koppelingscode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste setups een expliciete eigenaar voor bevoorrechte commando's en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op topniveau wanneer dezelfde vertrouwde afzenderset van toepassing moet zijn op
meerdere berichtkanalen of op zowel DM- als groepstoestemmingslijsten.

Statische groepen gebruiken `type: "message.senders"` en worden vanuit kanaaltoestemmingslijsten verwezen met
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
- Goedgekeurde toestemmingslijstopslag:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor accountafbakening:

- Niet-standaardaccounts lezen/schrijven alleen hun afgebakende toestemmingslijstbestand.
- Het standaardaccount gebruikt het kanaalgebonden niet-afgebakende toestemmingslijstbestand.

Behandel deze als gevoelig (ze bewaken toegang tot je assistent).

<Note>
De koppelings-toestemmingslijstopslag is voor DM-toegang. Groepsautorisatie is apart.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groepscommando's uit te voeren
of de bot in groepen te bedienen. Initialisatie van de eerste eigenaar is aparte configuratiestatus
in `commands.ownerAllowFrom`, en bezorging in groepschats volgt nog steeds de
groepstoestemmingslijsten van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-onderwerp-overschrijvingen, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair`-Plugin gebruikt, kun je de eerste apparaatkoppeling volledig vanuit Telegram uitvoeren:

1. Stuur je bot in Telegram een bericht: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een apart **setupcode**-bericht (makkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Settings → Gateway.
4. Scan de QR-code of plak de setupcode en maak verbinding.
5. Terug in Telegram: `/pair pending` (bekijk verzoek-ID's, rol en scopes), en keur daarna goed.

De setupcode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat dat wordt gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token draagt het ingebouwde bootstrap-profiel voor koppelen:

- het ingebouwde setupprofiel staat alleen de verse QR-/setupcode-basislijn toe:
  `node` plus een begrensde `operator`-overdracht
- het overgedragen `node`-token blijft `scopes: []`
- het overgedragen `operator`-token is beperkt tot `operator.approvals`,
  `operator.read`, `operator.talk.secrets` en `operator.write`
- `operator.admin` wordt niet toegekend door QR-/setupcode-bootstrap; dit vereist een
  aparte goedgekeurde operator-koppeling of tokenflow
- latere tokenrotatie/-intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepende sessie

Behandel de setupcode als een wachtwoord zolang die geldig is.

Voor Tailscale, openbare of andere externe mobiele koppeling gebruik je Tailscale Serve/Funnel
of een andere `wss://` Gateway-URL. Platte tekst `ws://`-setupcodes worden alleen geaccepteerd
voor local loopback, privé-LAN-adressen, `.local` Bonjour-hosts en de Android-
emulatorhost. Tailnet-CGNAT-adressen, `.ts.net`-namen en openbare hosts
falen nog steeds gesloten voordat QR-/setupcode-uitgifte plaatsvindt.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppelde-apparaatsessie
is geopend met alleen koppelingsscope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Hierdoor kan een bestaand, admin-capabel gekoppeld apparaat een nieuwe
Control UI-/browserkoppeling herstellen zonder `devices/paired.json` handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere auth-gegevens (bijvoorbeeld andere
rol/scopes/openbare sleutel), wordt het eerdere openstaande verzoek vervangen en wordt er een nieuwe
`requestId` gemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, houdt OpenClaw de bestaande goedkeuring zoals die is en maakt een nieuw openstaand upgradeverzoek. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van vertrouwde CIDR-Nodes

Apparaatkoppeling blijft standaard handmatig. Voor strak beheerde Node-netwerken
kun je je expliciet aanmelden voor automatische goedkeuring van eerste Node-koppelingen met expliciete CIDR's of exacte IP's:

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

Dit is alleen van toepassing op verse `role: node`-koppelingsverzoeken zonder aangevraagde
scopes. Operator-, browser-, Control UI- en WebChat-clients vereisen nog steeds handmatige
goedkeuring. Wijzigingen in rol, scope, metadata en openbare sleutel vereisen nog steeds handmatige
goedkeuring.

### Statusopslag voor Node-koppeling

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; openstaande verzoeken verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De legacy `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  aparte gateway-eigen koppelingsopslag. WS-nodes vereisen nog steeds apparaatkoppeling.
- Het koppelingsrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een losse tokenvermelding
  buiten de goedgekeurde rollen maakt geen nieuwe toegang aan.

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
