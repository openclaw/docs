---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuwe iOS/Android-Node koppelen
    - De beveiligingshouding van OpenClaw beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een DM mag sturen + welke nodes kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-05-04T02:21:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

“Pairing” is de expliciete stap van OpenClaw voor toegangstoestemming.
Deze wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag praten)
2. **Node-koppeling** (welke apparaten/nodes mogen deelnemen aan het Gateway-netwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je goedkeuring geeft.

Standaard DM-beleid is gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-toelatingslijst `"*"` bevat.
Voor installatie en validatie is die wildcard vereist voor openbaar-open configuraties. Als bestaande
status `open` bevat met concrete `allowFrom`-vermeldingen, laat de runtime nog steeds
alleen die afzenders toe, en goedkeuringen uit de pairing-store verbreden `open`-toegang niet.

Koppelingscodes:

- 8 tekens, hoofdletters, geen dubbelzinnige tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer één keer per uur per afzender).
- Openstaande DM-koppelingsverzoeken zijn standaard beperkt tot **3 per kanaal**; aanvullende verzoeken worden genegeerd totdat er één verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen opdracht-eigenaar is geconfigureerd, bootstrappt het goedkeuren van een DM-koppelingscode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste installaties een expliciete eigenaar voor bevoorrechte opdrachten en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, geven latere koppelingsgoedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaars toe.

Ondersteunde kanalen: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op topniveau wanneer dezelfde vertrouwde set afzenders moet gelden voor
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

Toegangsgroepen worden hier in detail gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de status staat

Opgeslagen onder `~/.openclaw/credentials/`:

- Openstaande verzoeken: `<channel>-pairing.json`
- Goedgekeurde toelatingslijst-store:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor account-scoping:

- Niet-standaardaccounts lezen/schrijven alleen hun gescopete toelatingslijstbestand.
- Standaardaccount gebruikt het ongescopete toelatingslijstbestand op kanaalniveau.

Behandel deze als gevoelig (ze bewaken de toegang tot je assistent).

<Note>
De pairing-toelatingslijst-store is voor DM-toegang. Groepsautorisatie staat los daarvan.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groeps-
opdrachten uit te voeren of de bot in groepen te besturen. Bootstrap van de eerste eigenaar is afzonderlijke configuratie-
status in `commands.ownerAllowFrom`, en aflevering in groepschats volgt nog steeds de
groepstoelatingslijsten van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-topic overrides, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)

Nodes verbinden met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek aan dat moet worden goedgekeurd.

### Koppelen via Telegram (aanbevolen voor iOS)

Als je de `device-pair`-Plugin gebruikt, kun je eerste apparaatkoppeling volledig vanuit Telegram doen:

1. Stuur in Telegram je bot een bericht: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een apart **installatiecode**-bericht (eenvoudig te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Plak de installatiecode en maak verbinding.
5. Terug in Telegram: `/pair pending` (bekijk verzoek-ID's, rol en scopes), en keur daarna goed.

De installatiecode is een base64-gecodeerde JSON-payload die bevat:

- `url`: de WebSocket-URL van de Gateway (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat, gebruikt voor de initiële koppelingshandshake

Dat bootstrap-token draagt het ingebouwde bootstrap-profiel voor koppeling:

- primair overgedragen `node`-token blijft `scopes: []`
- elk overgedragen `operator`-token blijft begrensd tot de bootstrap-toelatingslijst:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap-scopecontroles zijn rolgeprefixt, niet één platte scope-pool:
  operator-scopevermeldingen voldoen alleen aan operator-verzoeken, en niet-operatorrollen
  moeten nog steeds scopes aanvragen onder hun eigen rolprefix
- latere tokenrotatie/-intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepersessie

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppelde-apparaatsessie
is geopend met alleen koppelingsscope, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Hierdoor kan een bestaand, admin-geschikt gekoppeld apparaat een nieuwe
Control UI-/browserkoppeling herstellen zonder `devices/paired.json` handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere auth-gegevens (bijvoorbeeld een andere
rol/scopes/publieke sleutel), wordt het vorige openstaande verzoek vervangen en wordt een nieuwe
`requestId` aangemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, houdt OpenClaw de bestaande goedkeuring zoals die is en maakt het een nieuw openstaand upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele automatische goedkeuring van Node via vertrouwde CIDR

Apparaatkoppeling blijft standaard handmatig. Voor strak beheerde Node-netwerken
kun je je aanmelden voor automatische eerste goedkeuring van Node met expliciete CIDR's of exacte IP's:

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
  aparte pairing-store die eigendom is van de Gateway. WS-nodes vereisen nog steeds apparaatkoppeling.
- Het koppelingsrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een los tokenitem
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
