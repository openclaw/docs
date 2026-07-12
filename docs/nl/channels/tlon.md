---
read_when:
    - Werken aan functies voor het Tlon/Urbit-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-12T08:37:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon is een gedecentraliseerde messenger die op Urbit is gebouwd. OpenClaw maakt verbinding met je Urbit-ship en
reageert op privéberichten en groepschatberichten. Voor groepsantwoorden is standaard een @-vermelding vereist, met
daarbovenop autorisatieregels en een goedkeuringsproces door de eigenaar.

Status: gebundelde plugin. Privéberichten, groepsvermeldingen, threads, opgemaakte tekst, uploaden/downloaden van afbeeldingen en een
goedkeuringssysteem voor de eigenaar worden ondersteund. Reacties en peilingen niet.

## Gebundelde plugin

Tlon wordt gebundeld meegeleverd in huidige OpenClaw-releases; voor verpakte builds is geen afzonderlijke installatie nodig.

Installeer bij een oudere build of aangepaste installatie waarin deze niet is opgenomen vanuit npm:

```bash
openclaw plugins install @openclaw/tlon
```

Gebruik alleen de pakketnaam om de huidige releasetag te volgen. Zet een versie vast (`@openclaw/tlon@x.y.z`)
uitsluitend voor reproduceerbare installaties.

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Configuratie

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Of bewerk de configuratie rechtstreeks:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // aanbevolen: je ship, altijd geautoriseerd
    },
  },
}
```

Start de Gateway opnieuw nadat je de configuratie rechtstreeks hebt bewerkt. Stuur de bot vervolgens een privébericht of vermeld deze met @ in een
groepskanaal.

## Privé-/LAN-ships

OpenClaw blokkeert standaard privé/interne hostnamen en IP-bereiken ter bescherming tegen SSRF. Als je
ship op een privénetwerk draait (localhost, LAN-IP, interne hostnaam), moet je dit expliciet inschakelen:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Dit geldt voor doelen zoals `http://localhost:8080`, `http://192.168.x.x:8080` en
`http://my-ship.local:8080`. Schakel dit alleen in voor een ship-URL die je vertrouwt; hierdoor wordt de SSRF-
bescherming voor de HTTP-verzoeken van dat account uitgeschakeld.

<Note>
`channels.tlon.allowPrivateNetwork` (platte sleutel) is buiten gebruik gesteld. `openclaw doctor --fix` verplaatst deze automatisch naar
`channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Groepskanalen

Zet kanalen handmatig vast of schakel automatische detectie in:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

`autoDiscoverChannels` is standaard `false` wanneer deze niet in de configuratie is ingesteld; de configuratiewizard stelt bij de
vraag standaard ja voor en schrijft expliciet `true`. Wanneer dit is ingeschakeld, bevraagt OpenClaw bij het opstarten de groepen waarvan het lid is,
volgt het nieuwe kanalen wanneer groepsuitnodigingen worden geaccepteerd en controleert het deze elke 2 minuten opnieuw.

## Toegangsbeheer

Toegestane afzenders voor privéberichten (leeg = geen privéberichten toegestaan, tenzij de afzender `ownerShip` is):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Groepsautorisatie is standaard per kanaal ingesteld op `restricted`. Stel `defaultAuthorizedShips` in als
basis en overschrijf dit per kanaalnest:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

Zodra de bot binnen een thread heeft geantwoord, blijft deze op latere berichten in die thread reageren
zonder dat een nieuwe vermelding nodig is.

## Eigenaar en goedkeuringssysteem

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

De ship van de eigenaar is overal geautoriseerd: uitnodigingen voor privéberichten worden altijd automatisch geaccepteerd, groepsuitnodigingen worden
altijd automatisch geaccepteerd en kanaalberichten doorstaan altijd de autorisatie. De eigenaar hoeft niet in
`dmAllowlist`, `defaultAuthorizedShips` of `groupInviteAllowlist` te staan.

Wanneer `ownerShip` is ingesteld, worden ongeautoriseerde verzoeken niet simpelweg genegeerd — ze worden als wachtende
goedkeuring in de wachtrij geplaatst en de eigenaar ontvangt een privébericht:

- Privéberichtverzoeken van ships die niet in `dmAllowlist` staan
- Vermeldingen in kanalen waar de afzender niet door de autorisatie komt
- Groepsuitnodigingen van ships die niet in `groupInviteAllowlist` staan (wanneer automatisch accepteren is uitgeschakeld, of ingeschakeld maar de
  uitnodiger niet op de lijst staat)

De eigenaar antwoordt via een privébericht om een verzoek af te handelen:

| Antwoord van eigenaar         | Effect                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| `approve` / `deny` / `block` | Handelt de meest recente wachtende goedkeuring af             |
| `approve <id>` / `deny <id>` | Handelt een specifieke goedkeuring op basis van id af         |
| `block`                      | Blokkeert de ship ook systeemeigen, zodat deze niet opnieuw verbinding kan maken |
| `unblock ~ship`              | Maakt een systeemeigen blokkering ongedaan                    |
| `blocked`                    | Toont de momenteel geblokkeerde ships                         |
| `pending`                    | Toont wachtende goedkeuringsverzoeken                         |

Zonder een geconfigureerde `ownerShip` worden ongeautoriseerde privéberichten en kanaalvermeldingen simpelweg genegeerd en gelogd;
er verschijnt geen goedkeuringsverzoek.

## Instellingen voor automatisch accepteren

Accepteer uitnodigingen voor privéberichten automatisch van ships die al in `dmAllowlist` staan (de eigenaar wordt altijd automatisch geaccepteerd,
ongeacht deze vlag):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Accepteer groepsuitnodigingen automatisch op basis van een lijst met toegestane ships (weigert standaard: met `autoAcceptGroupInvites: true` en
een lege `groupInviteAllowlist` wordt geen uitnodiging van een niet-eigenaar geaccepteerd):

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Opnieuw laden zonder herstart via de Urbit-instellingenopslag

De meeste bovenstaande instellingen (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) worden bij de eerste uitvoering gespiegeld naar de
`%settings`-agent van de ship (desk `moltbot`, bucket `tlon`) en daarna rechtstreeks daaruit gelezen,
zodat wijzigingen via een Landscape-client of de instellingenopdrachten van de gebundelde Skill worden toegepast zonder dat de
Gateway opnieuw hoeft te worden gestart. `channelRules` en wachtende goedkeuringen worden daar ook als JSON opgeslagen. De
bestandsconfiguratie blijft de bron van waarheid voor waarden die nooit naar de instellingenopslag zijn geschreven.

## Afleverdoelen (CLI/Cron)

Gebruik met `openclaw message send` of aflevering via Cron:

- Privébericht: `~sampel-palnet` of `dm/~sampel-palnet`
- Groep: `chat/~host-ship/channel` of `group:~host-ship/channel`

## Gebundelde Skill

De plugin bundelt [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), een CLI voor
rechtstreekse Urbit-bewerkingen die automatisch beschikbaar is zodra de plugin is geïnstalleerd:

- **Activiteit**: vermeldingen, antwoorden, ongelezen berichten
- **Kanalen**: weergeven, maken, hernoemen
- **Contacten**: profielen weergeven/ophalen/bijwerken
- **Groepen**: maken, deelnemen, uitnodigings-/aanvraagprocessen, rollen
- **Hooks**: kanaalhooks beheren
- **Berichten**: geschiedenis, zoeken
- **Privéberichten**: verzenden, reageren, accepteren/afwijzen
- **Berichten**: reageren, verwijderen
- **Notitieboek**: publiceren in dagboekkanalen
- **Instellingen**: pluginconfiguratie zonder herstart opnieuw laden via de bovenstaande instellingenopslag

## Mogelijkheden

| Functie            | Status                                               |
| ------------------ | ---------------------------------------------------- |
| Privéberichten      | Ondersteund                                          |
| Groepen/kanalen     | Ondersteund (standaard alleen na een vermelding)     |
| Threads             | Ondersteund (blijft antwoorden zodra de bot deelneemt) |
| Opgemaakte tekst    | Markdown wordt naar de systeemeigen indeling van Tlon geconverteerd |
| Afbeeldingen        | Inkomend gedownload, uitgaand geüpload               |
| Reacties            | Alleen via de [gebundelde Skill](#bundled-skill)     |
| Peilingen           | Niet ondersteund                                     |
| Systeemeigen opdrachten | Standaard alleen voor de eigenaar                |

## Probleemoplossing

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Veelvoorkomende fouten:

- **Privéberichten worden genegeerd**: de afzender staat niet in `dmAllowlist` en er is geen `ownerShip` geconfigureerd voor het goedkeuringsproces.
- **Groepsberichten worden genegeerd**: het kanaal is niet gedetecteerd/vastgezet, of de afzender komt niet door de autorisatie en er is geen
  `ownerShip` om een goedkeuring in de wachtrij te plaatsen.
- **Verbindingsfouten**: controleer of de ship-URL bereikbaar is; stel
  `network.dangerouslyAllowPrivateNetwork` in voor lokale ships.
- **Authenticatiefouten**: aanmeldcodes rouleren — kopieer de huidige code van je ship.

## Configuratiereferentie

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

| Sleutel                                                | Betekenis                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Opstarten van het kanaal in-/uitschakelen.                     |
| `channels.tlon.ship`                                   | Urbit-shipnaam van de bot (bijv. `~sampel-palnet`).            |
| `channels.tlon.url`                                    | Ship-URL (bijv. `https://sampel-palnet.tlon.network`).         |
| `channels.tlon.code`                                   | Aanmeldcode van de ship.                                       |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Ship-URL's voor localhost/LAN toestaan (expliciete SSRF-toestemming). |
| `channels.tlon.ownerShip`                              | Ship van de eigenaar: altijd geautoriseerd, ontvangt goedkeuringsverzoeken. |
| `channels.tlon.dmAllowlist`                            | Ships die privéberichten mogen sturen (leeg = geen behalve de eigenaar). |
| `channels.tlon.autoAcceptDmInvites`                    | Privéberichten van ships in `dmAllowlist` automatisch accepteren. |
| `channels.tlon.autoAcceptGroupInvites`                 | Groepsuitnodigingen van `groupInviteAllowlist` automatisch accepteren. |
| `channels.tlon.groupInviteAllowlist`                   | Ships waarvan groepsuitnodigingen automatisch worden geaccepteerd. |
| `channels.tlon.autoDiscoverChannels`                   | Groepskanalen waarvan de bot lid is automatisch detecteren (standaard: `false`). |
| `channels.tlon.groupChannels`                          | Handmatig vastgezette kanaalnesten.                            |
| `channels.tlon.defaultAuthorizedShips`                 | Ships die voor alle kanalen zijn geautoriseerd (gebruikt wanneer geen regel overeenkomt). |
| `channels.tlon.authorization.channelRules`             | Autorisatiemodus en lijst met toegestane ships per kanaalnest. |
| `channels.tlon.showModelSignature`                     | Voeg `_[Generated by <model>]_` toe aan antwoorden.            |
| `channels.tlon.responsePrefix`                         | Statisch voorvoegsel dat vóór uitgaande antwoorden wordt geplaatst. |
| `channels.tlon.accounts.<id>`                          | Aanvullende benoemde accounts (configuraties met meerdere ships). |

## Opmerkingen

- Voor groepsantwoorden is een @-vermelding nodig (bijv. `~your-bot-ship`), tenzij de bot al aan die thread deelneemt.
- Threadantwoorden worden binnen de thread geplaatst; de bot krijgt ook de laatste 10 berichten uit de threadcontext vooraf
  toegevoegd voor de agent.
- Opgemaakte tekst (vet, cursief, code, koppen, lijsten) wordt naar de systeemeigen indeling van Tlon geconverteerd.
- Het verzenden van een inkomend bericht waarin om een kanaalsamenvatting wordt gevraagd (bijvoorbeeld "vat dit
  kanaal samen") activeert een ingebouwde samenvatting van de geschiedenis in plaats van het normale antwoordproces.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — authenticatie en koppelingsproces voor privéberichten
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vereiste vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiliging
