---
read_when:
    - DM-toegangscontrole instellen
    - Een nieuw iOS/Android-knooppunt koppelen
    - OpenClaw-beveiligingshouding beoordelen
summary: 'Koppelingsoverzicht: keur goed wie je een DM kan sturen + welke nodes kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-06-27T17:11:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" is de expliciete stap voor toegangsgoedkeuring van OpenClaw.
Deze wordt op twee plekken gebruikt:

1. **DM-pairing** (wie met de bot mag praten)
2. **Node-pairing** (welke apparaten/nodes mogen deelnemen aan het Gateway-netwerk)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-pairing (inkomende chattoegang)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, krijgen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je het goedkeurt.

Standaard DM-beleidsregels zijn gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-allowlist `"*"` bevat.
Setup en validatie vereisen die wildcard voor openbaar-open configuraties. Als bestaande
status `open` bevat met concrete `allowFrom`-items, laat runtime nog steeds
alleen die afzenders toe, en goedkeuringen in de pairing-store verbreden `open`-toegang niet.

Pairing-codes:

- 8 tekens, hoofdletters, geen verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het pairing-bericht alleen wanneer een nieuwe aanvraag wordt gemaakt (ongeveer eenmaal per uur per afzender).
- Wachtende DM-pairingaanvragen zijn standaard beperkt tot **3 per kanaal**; extra aanvragen worden genegeerd totdat er een verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Als er nog geen opdracht-eigenaar is geconfigureerd, initialiseert het goedkeuren van een DM-pairingcode ook
`commands.ownerAllowFrom` naar de goedgekeurde afzender, zoals `telegram:123456789`.
Dat geeft eerste setups een expliciete eigenaar voor bevoorrechte opdrachten en exec-
goedkeuringsprompts. Nadat er een eigenaar bestaat, verlenen latere pairing-goedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaren toe.

Ondersteunde kanalen: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op topniveau wanneer dezelfde set vertrouwde afzenders moet gelden voor
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

Toegangsgroepen zijn hier uitgebreid gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de status zich bevindt

Opgeslagen onder `~/.openclaw/credentials/`:

- Wachtende aanvragen: `<channel>-pairing.json`
- Goedgekeurde allowlist-store:
  - Standaardaccount: `<channel>-allowFrom.json`
  - Niet-standaardaccount: `<channel>-<accountId>-allowFrom.json`

Gedrag voor accountscoping:

- Niet-standaardaccounts lezen/schrijven alleen hun gescopete allowlist-bestand.
- Standaardaccount gebruikt het kanaalgescopete ongescopete allowlist-bestand.

Behandel deze als gevoelig (ze regelen toegang tot je assistent).

<Note>
De pairing-allowlist-store is voor DM-toegang. Groepsautorisatie staat los daarvan.
Het goedkeuren van een DM-pairingcode staat die afzender niet automatisch toe om groeps-
opdrachten uit te voeren of de bot in groepen te bedienen. Bootstrap van de eerste eigenaar is aparte configuratie-
status in `commands.ownerAllowFrom`, en groepschatbezorging volgt nog steeds de
groeps-allowlists van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups`, of per-groep-
of per-onderwerp-overschrijvingen, afhankelijk van het kanaal).
</Note>

## 2) Pairing van Node-apparaten (iOS/Android/macOS/headless nodes)

Nodes maken verbinding met de Gateway als **apparaten** met `role: node`. De Gateway
maakt een apparaat-pairingaanvraag die moet worden goedgekeurd.

### Pairen via Telegram (aanbevolen voor iOS)

Als je de `device-pair`-Plugin gebruikt, kun je eerste apparaat-pairing volledig vanuit Telegram doen:

1. Stuur in Telegram een bericht naar je bot: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een apart **setup-code**bericht (gemakkelijk te kopiëren/plakken in Telegram).
3. Open op je telefoon de OpenClaw iOS-app → Instellingen → Gateway.
4. Scan de QR-code of plak de setup-code en maak verbinding.
5. Terug in Telegram: `/pair pending` (bekijk aanvraag-ID's, rol en scopes), keur daarna goed.

De setup-code is een base64-gecodeerde JSON-payload die bevat:

- `url`: de Gateway WebSocket-URL (`ws://...` of `wss://...`)
- `bootstrapToken`: een kortlevend bootstrap-token voor één apparaat dat wordt gebruikt voor de initiële pairing-handshake

Dat bootstrap-token draagt het ingebouwde pairing-bootstrapprofiel:

- het ingebouwde setup-profiel staat alleen de nieuwe QR/setup-code-baseline toe:
  `node` plus een begrensde `operator`-overdracht
- het overgedragen `node`-token blijft `scopes: []`
- het overgedragen `operator`-token is beperkt tot `operator.approvals`,
  `operator.read` en `operator.write`
- `operator.admin` en `operator.pairing` worden niet verleend door QR/setup-code-
  bootstrap; ze vereisen een aparte goedgekeurde operator-pairing of tokenstroom
- latere tokenrotatie/-intrekking blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operator-scopes van de aanroepsessie

Behandel de setup-code als een wachtwoord zolang deze geldig is.

Gebruik voor Tailscale, openbare of andere mobiele pairing op afstand Tailscale Serve/Funnel
of een andere `wss://` Gateway-URL. Plaintext `ws://` setup-codes worden alleen geaccepteerd
voor loopback, privé-LAN-adressen, `.local` Bonjour-hosts en de Android-
emulatorhost. Tailnet-CGNAT-adressen, `.ts.net`-namen en openbare hosts blijven
fail-closed voordat QR/setup-code wordt uitgegeven.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de goedkeurende gekoppelde-apparaatsessie
was geopend met alleen-pairing-scope, probeert de CLI dezelfde aanvraag opnieuw met
`operator.admin`. Hierdoor kan een bestaand gekoppeld apparaat met adminrechten een nieuwe
Control UI/browser-pairing herstellen zonder `devices/paired.json` handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die niet kunnen authenticeren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat opnieuw probeert met andere auth-gegevens (bijvoorbeeld een andere
rol/scopes/openbare sleutel), wordt de vorige wachtende aanvraag vervangen en wordt een nieuwe
`requestId` gemaakt.

<Note>
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang. Als het opnieuw verbinding maakt en om meer scopes of een bredere rol vraagt, laat OpenClaw de bestaande goedkeuring ongewijzigd en maakt het een nieuwe wachtende upgradeaanvraag. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeurt.
</Note>

### Optionele vertrouwde-CIDR automatische goedkeuring van Nodes

Apparaat-pairing blijft standaard handmatig. Voor streng gecontroleerde Node-netwerken
kun je je aanmelden voor automatische goedkeuring van eerste Nodes met expliciete CIDR's of exacte IP's:

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

Dit geldt alleen voor nieuwe `role: node`-pairingaanvragen zonder aangevraagde
scopes. Operator-, browser-, Control UI- en WebChat-clients vereisen nog steeds handmatige
goedkeuring. Wijzigingen in rol, scope, metadata en openbare sleutel vereisen nog steeds handmatige
goedkeuring.

### Opslag van Node-pairingstatus

Opgeslagen onder `~/.openclaw/devices/`:

- `pending.json` (kortlevend; wachtende aanvragen verlopen)
- `paired.json` (gekoppelde apparaten + tokens)

### Opmerkingen

- De verouderde `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) is een
  aparte pairing-store die eigendom is van de Gateway. WS-nodes vereisen nog steeds apparaat-pairing.
- Het pairing-record is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven begrensd tot die goedgekeurde rollenset; een los token-item
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
