---
read_when:
    - Toegangsbeheer voor privéberichten instellen
    - Een nieuwe iOS-/Android-Node koppelen
    - De beveiligingsstatus van OpenClaw beoordelen
summary: 'Overzicht van koppelen: keur goed wie je een privébericht kan sturen en welke nodes kunnen deelnemen'
title: Koppelen
x-i18n:
    generated_at: "2026-07-16T15:12:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

"Koppelen" is de expliciete stap van OpenClaw voor toegangstoestemming.
Deze wordt op twee plaatsen gebruikt:

1. **DM-koppeling** (wie met de bot mag communiceren)
2. **Node-koppeling** (welke apparaten/Nodes zich bij het Gateway-netwerk mogen aansluiten)

Beveiligingscontext: [Beveiliging](/nl/gateway/security)

## 1) DM-koppeling (toegang tot inkomende chats)

Wanneer een kanaal is geconfigureerd met DM-beleid `pairing`, ontvangen onbekende afzenders een korte code en wordt hun bericht **niet verwerkt** totdat je toestemming geeft.

De standaard DM-beleidsregels zijn gedocumenteerd in: [Beveiliging](/nl/gateway/security)

`dmPolicy: "open"` is alleen openbaar wanneer de effectieve DM-toelatingslijst `"*"` bevat.
Voor configuraties met openbare toegang vereisen de installatie en validatie dit jokerteken. Als de bestaande
status `open` met concrete `allowFrom`-vermeldingen bevat, laat de runtime nog steeds
alleen die afzenders toe en verruimen goedkeuringen in het koppelingsarchief de toegang via `open` niet.

Koppelingscodes:

- 8 tekens, hoofdletters, zonder verwarrende tekens (`0O1I`).
- **Verlopen na 1 uur**. De bot stuurt het koppelingsbericht alleen wanneer een nieuw verzoek wordt aangemaakt (ongeveer eenmaal per uur per afzender).
- Openstaande DM-koppelingsverzoeken zijn beperkt tot **3 per kanaalaccount**; aanvullende verzoeken worden genegeerd totdat er één verloopt of wordt goedgekeurd.

### Een afzender goedkeuren

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Voeg `--notify` toe aan de goedkeuringsopdracht om de aanvrager via hetzelfde kanaal op de hoogte te stellen. Kanalen met meerdere accounts accepteren `--account <id>`.

Als er nog geen opdrachteigenaar is geconfigureerd, stelt de goedkeuring van een DM-koppelingscode ook
`commands.ownerAllowFrom` in op de goedgekeurde afzender, zoals `telegram:123456789`.
Daardoor krijgen nieuwe installaties een expliciete eigenaar voor geprivilegieerde opdrachten en
goedkeuringsprompts voor uitvoering. Nadat er een eigenaar bestaat, verlenen latere koppelingsgoedkeuringen alleen DM-
toegang; ze voegen geen extra eigenaars toe.

Ondersteunde kanalen (elke geïnstalleerde kanaalplugin die koppeling declareert; externe plugins zoals `openclaw-weixin` kunnen er meer toevoegen): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Herbruikbare afzendergroepen

Gebruik `accessGroups` op het hoogste niveau wanneer dezelfde set vertrouwde afzenders moet gelden voor
meerdere berichtkanalen of voor zowel DM- als groepstoelatingslijsten.

Statische groepen gebruiken `type: "message.senders"` en er wordt vanuit kanaaltoelatingslijsten naar verwezen met
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

Toegangsgroepen worden hier uitgebreid gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups)

### Waar de status wordt opgeslagen

Opgeslagen in de gedeelde SQLite-statusdatabase op
`~/.openclaw/state/openclaw.sqlite`:

- openstaande verzoeken in `channel_pairing_requests`
- goedgekeurde afzenders in `channel_pairing_allow_entries`

Gedrag voor accountafbakening:

- elk verzoek en elke goedgekeurde afzender wordt geïndexeerd op kanaal en account
- de runtime leest alleen de canonieke SQLite-rijen; oudere bestanden worden niet samengevoegd

Oudere Gateways schreven `<channel>-pairing.json` en
`<channel>-<accountId>-allowFrom.json` onder `~/.openclaw/credentials/`.
De opstartmigratie en `openclaw doctor --fix` importeren deze bestanden in SQLite en
verwijderen elke bron na een geslaagde import. Behandel de SQLite-database als
gevoelig, omdat deze rijen de toegang tot je assistent beheren.

<Note>
Het archief met de koppelings­toelatingslijst is bedoeld voor DM-toegang. Groepsautorisatie is afzonderlijk.
Het goedkeuren van een DM-koppelingscode staat die afzender niet automatisch toe om groepsopdrachten
uit te voeren of de bot in groepen te besturen. Het initialiseren van de eerste eigenaar is een afzonderlijke configuratiestatus
in `commands.ownerAllowFrom`, en de aflevering van groepschats volgt nog steeds de
groepstoelatingslijsten van het kanaal (bijvoorbeeld `groupAllowFrom`, `groups` of overschrijvingen per groep
of onderwerp, afhankelijk van het kanaal).
</Note>

## 2) Node-apparaatkoppeling (iOS-/Android-/macOS-/headless Nodes)

Nodes maken als **apparaten** verbinding met de Gateway via `role: node`. De Gateway
maakt een apparaatkoppelingsverzoek aan dat moet worden goedgekeurd.

### Koppelen via de Control UI (aanbevolen)

Gebruik een reeds verbonden Control UI-sessie met toegang via `operator.admin`:

1. Open de Control UI en ga naar **Settings → Devices**.
2. Klik op de pagina **Devices** op **Pair mobile device**.
3. Behoud **Full access (recommended)** of selecteer **Limited access** om
   administratieve Gateway-bedieningselementen weg te laten.
4. Klik op **Create setup code**.
5. Open op je telefoon de OpenClaw-app → **Settings** → **Gateway**.
6. Scan de QR-code of plak de installatiecode en maak vervolgens verbinding.

Officiële OpenClaw-apps voor iOS en Android worden automatisch goedgekeurd wanneer hun
metagegevens van de installatiecode overeenkomen. Als **Pending approval** een verzoek toont (bijvoorbeeld
voor een niet-officiële client of niet-overeenkomende metagegevens), controleer je de rol en
bereiken voordat je het goedkeurt.

De knop is uitgeschakeld wanneer de huidige Control UI-sessie geen
beheerderstoegang heeft. Gebruik in dat geval de onderstaande CLI-goedkeuringsprocedure vanaf de Gateway-host.

### Koppelen via Telegram

Als je de Plugin `device-pair` gebruikt, kun je de eerste apparaatkoppeling volledig vanuit Telegram uitvoeren:

1. Stuur je bot in Telegram het volgende bericht: `/pair`
2. De bot antwoordt met twee berichten: een instructiebericht en een afzonderlijk bericht met de **installatiecode** (eenvoudig te kopiëren en plakken in Telegram).
3. Open op je telefoon de OpenClaw-app voor iOS → Settings → Gateway.
4. Scan de QR-code (`/pair qr`) of plak de installatiecode en maak verbinding.
5. De officiële mobiele app maakt automatisch verbinding. Als `/pair pending` een
   verzoek toont, controleer je de rol en bereiken voordat je het goedkeurt.

De installatiecode is een met base64 gecodeerde JSON-payload die het volgende bevat:

- `url`: de WebSocket-URL van de Gateway (`ws://...` of `wss://...`)
- `urls`: indien beschikbaar, de geordende LAN-/Tailnet-routes die de mobiele app kan proberen
- `bootstrapToken`: een eenmalig bootstrap-token voor de eerste koppelingshandshake; de Gateway laat dit na 10 minuten verlopen

Voer `/pair cleanup` uit om ongebruikte installatiecodes ongeldig te maken zodra de koppeling is voltooid.

Dat bootstrap-token bevat het ingebouwde bootstrap-profiel voor koppeling:

- een veilige `wss://`-installatie (of loopback op dezelfde host) gebruikt standaard `node` plus volledige
  toegang via `operator` voor systeemeigen mobiele apps
- het overgedragen `node`-token blijft `scopes: []`
- het standaard overgedragen `operator`-token bevat `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` en
  `operator.write`
- Control UI **Limited access** en `openclaw qr --limited` laten
  `operator.admin` weg, maar behouden de andere operatorbereiken
- een LAN-installatie met platte tekst via `ws://` gebruikt automatisch hetzelfde beperkte profiel;
  configureer `wss://` of Tailscale Serve en genereer een nieuwe code voor volledige toegang
- latere rotatie/intrekking van tokens blijft begrensd door zowel het goedgekeurde
  rolcontract van het apparaat als de operatorbereiken van de sessie van de aanroeper

Behandel de installatiecode als een wachtwoord zolang deze geldig is.

De pagina's **Settings → Gateway** van iOS en Android tonen toegang als **Full** of **Limited**.
Als je een beperkte telefoon wilt upgraden, configureer je eerst een veilige `wss://`-route of
Tailscale Serve. Genereer vervolgens een nieuwe installatiecode voor volledige toegang, scan of plak
deze op die instellingenpagina en maak opnieuw verbinding.

Gebruik voor koppeling op afstand via Tailscale, openbare netwerken of andere mobiele verbindingen Tailscale Serve/Funnel
of een andere Gateway-URL via `wss://`. Installatiecodes via `ws://` met platte tekst worden alleen geaccepteerd
voor loopback, privé-LAN-adressen, Bonjour-hosts via `.local` en de Android-
emulatorhost. Niet-loopbackroutes met platte tekst krijgen beperkte toegang. Tailnet-
CGNAT-adressen, `.ts.net`-namen en openbare hosts worden nog steeds standaard geweigerd voordat
een QR-/installatiecode wordt uitgegeven.

Voor installatie-URL's via `gateway.bind=lan` detecteert OpenClaw permanente HTTPS-
hoofdroutes van Tailscale Serve die de loopbackpoort van de actieve Gateway proxyen en maakt deze
naast de LAN-route bekend. De installatieopdracht voegt deze terugvalroute alleen toe
voor `lan`; `custom` en `tailnet` behouden hun expliciet bekendgemaakte routes. De
iOS-app controleert de bekendgemaakte routes in volgorde en slaat het eerste bereikbare
eindpunt op.

### Een Node-apparaat goedkeuren

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wanneer een expliciete goedkeuring wordt geweigerd omdat de sessie van het goedkeurende gekoppelde apparaat
is geopend met een bereik dat alleen koppelen toestaat, probeert de CLI hetzelfde verzoek opnieuw met
`operator.admin`. Hierdoor kan een bestaand gekoppeld apparaat met beheerdersmogelijkheden een nieuwe
koppeling voor de Control UI/browser herstellen zonder het koppelingsarchief handmatig te bewerken. De
Gateway valideert de opnieuw geprobeerde verbinding nog steeds; tokens die zich niet kunnen verifiëren
met `operator.admin` blijven geblokkeerd.

Als hetzelfde apparaat het opnieuw probeert met andere verificatiegegevens (bijvoorbeeld een andere
rol, andere bereiken of openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt een nieuwe
`requestId` aangemaakt.

<Note>
Een reeds gekoppeld apparaat krijgt niet stilzwijgend ruimere toegang. Als het opnieuw verbinding maakt en om meer bereiken of een ruimere rol vraagt, behoudt OpenClaw de bestaande goedkeuring ongewijzigd en maakt het een nieuw openstaand upgradeverzoek aan. Gebruik `openclaw devices list` om de momenteel goedgekeurde toegang te vergelijken met de nieuw aangevraagde toegang voordat je goedkeuring geeft.
</Note>

### Optionele automatische goedkeuring van Nodes via vertrouwde CIDR

Apparaatkoppeling blijft standaard handmatig. Voor streng beheerde Node-netwerken
kun je automatische goedkeuring van de eerste Node-koppeling inschakelen met expliciete CIDR's of exacte IP-adressen:

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
bereiken. Clients voor operators, browsers, de Control UI en WebChat vereisen nog steeds handmatige
goedkeuring. Voor wijzigingen in rol, bereik, metagegevens en openbare sleutel blijft handmatige
goedkeuring vereist.

### Opslag van de Node-koppelingsstatus

Opgeslagen in de gedeelde SQLite-statusdatabase op `~/.openclaw/state/openclaw.sqlite`:

- openstaande apparaatkoppelingsverzoeken (van korte duur; ze verlopen na 5 minuten)
- gekoppelde apparaten + tokens

Oudere Gateways bewaarden deze status in `~/.openclaw/devices/*.json`; deze bestanden worden
bij het opstarten van de Gateway in SQLite geïmporteerd en met het achtervoegsel `.migrated` gearchiveerd.

### Opmerkingen

- De `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) beheert
  goedkeuringen voor Node-mogelijkheden die in dezelfde gekoppelde apparaatrecords zijn opgeslagen. WS-Nodes
  vereisen nog steeds apparaatkoppeling; zie [Node-koppeling](/nl/gateway/pairing).
- De koppelingsrecord is de duurzame bron van waarheid voor goedgekeurde rollen. Actieve
  apparaattokens blijven beperkt tot die goedgekeurde rollenset; een losstaande tokenvermelding
  buiten de goedgekeurde rollen verleent geen nieuwe toegang.

## Gerelateerde documentatie

- Beveiligingsmodel + promptinjectie: [Beveiliging](/nl/gateway/security)
- Veilig bijwerken (voer doctor uit): [Bijwerken](/nl/install/updating)
- Kanaalconfiguraties:
  - Telegram: [Telegram](/nl/channels/telegram)
  - WhatsApp: [WhatsApp](/nl/channels/whatsapp)
  - Signal: [Signal](/nl/channels/signal)
  - iMessage: [iMessage](/nl/channels/imessage)
  - Discord: [Discord](/nl/channels/discord)
  - Slack: [Slack](/nl/channels/slack)
