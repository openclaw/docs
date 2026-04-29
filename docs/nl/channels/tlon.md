---
read_when:
    - Werken aan kanaalfuncties voor Tlon/Urbit
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-29T22:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon is een gedecentraliseerde messenger gebouwd op Urbit. OpenClaw maakt verbinding met je Urbit-ship en kan
reageren op DM's en groepschatberichten. Groepsreacties vereisen standaard een @-vermelding en kunnen
verder worden beperkt via allowlists.

Status: gebundelde plugin. DM's, groepsvermeldingen, thread-antwoorden, rich text-opmaak en
afbeeldingsuploads worden ondersteund. Reacties en polls worden nog niet ondersteund.

## Gebundelde plugin

Tlon wordt meegeleverd als gebundelde plugin in huidige OpenClaw-releases, dus normale verpakte
builds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie waarin Tlon ontbreekt, installeer dan een
actueel npm-pakket zodra dat is gepubliceerd:

Installeren via CLI (npm-register, wanneer er een actueel pakket bestaat):

```bash
openclaw plugins install @openclaw/tlon
```

Als npm meldt dat het OpenClaw-pakket is verouderd, gebruik dan een huidige verpakte
OpenClaw-build of het lokale checkout-pad totdat een nieuwer npm-pakket is
gepubliceerd.

Lokale checkout (bij uitvoering vanuit een git-repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Configuratie

1. Zorg dat de Tlon-plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
2. Verzamel je ship-URL en inlogcode.
3. Configureer `channels.tlon`.
4. Herstart de gateway.
5. Stuur de bot een DM of vermeld hem in een groepskanaal.

Minimale configuratie (één account):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Privé-/LAN-ships

Standaard blokkeert OpenClaw privé/interne hostnamen en IP-bereiken voor SSRF-bescherming.
Als je ship op een privénetwerk draait (localhost, LAN-IP of interne hostnaam),
moet je dit expliciet inschakelen:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Dit geldt voor URL's zoals:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Schakel dit alleen in als je je lokale netwerk vertrouwt. Deze instelling schakelt SSRF-bescherming uit
voor verzoeken naar je ship-URL.

## Groepskanalen

Automatische ontdekking is standaard ingeschakeld. Je kunt kanalen ook handmatig vastzetten:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Automatische ontdekking uitschakelen:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Toegangscontrole

DM-allowlist (leeg = geen DM's toegestaan, gebruik `ownerShip` voor de goedkeuringsflow):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Groepsautorisatie (standaard beperkt):

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

## Eigenaar en goedkeuringssysteem

Stel een eigenaar-ship in om goedkeuringsverzoeken te ontvangen wanneer onbevoegde gebruikers proberen te communiceren:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Het eigenaar-ship is **automatisch overal geautoriseerd** — DM-uitnodigingen worden automatisch geaccepteerd en
kanaalberichten zijn altijd toegestaan. Je hoeft de eigenaar niet toe te voegen aan `dmAllowlist` of
`defaultAuthorizedShips`.

Wanneer dit is ingesteld, ontvangt de eigenaar DM-meldingen voor:

- DM-verzoeken van ships die niet in de allowlist staan
- Vermeldingen in kanalen zonder autorisatie
- Groepsuitnodigingsverzoeken

## Instellingen voor automatisch accepteren

DM-uitnodigingen automatisch accepteren (voor ships in dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Groepsuitnodigingen automatisch accepteren:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Afleverdoelen (CLI/cron)

Gebruik deze met `openclaw message send` of cron-aflevering:

- DM: `~sampel-palnet` of `dm/~sampel-palnet`
- Groep: `chat/~host-ship/channel` of `group:~host-ship/channel`

## Gebundelde skill

De Tlon-plugin bevat een gebundelde skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
die CLI-toegang biedt tot Tlon-bewerkingen:

- **Contacten**: profielen ophalen/bijwerken, contacten tonen
- **Kanalen**: tonen, maken, berichten plaatsen, geschiedenis ophalen
- **Groepen**: tonen, maken, leden beheren
- **DM's**: berichten verzenden, op berichten reageren
- **Reacties**: emoji-reacties toevoegen aan/verwijderen van posts en DM's
- **Instellingen**: pluginmachtigingen beheren via slash-opdrachten

De skill is automatisch beschikbaar wanneer de plugin is geïnstalleerd.

## Mogelijkheden

| Functie          | Status                                              |
| ---------------- | --------------------------------------------------- |
| Directe berichten | ✅ Ondersteund                                      |
| Groepen/kanalen  | ✅ Ondersteund (standaard vereist vermelding)       |
| Threads          | ✅ Ondersteund (automatische antwoorden in thread)  |
| Rich text        | ✅ Markdown geconverteerd naar Tlon-formaat         |
| Afbeeldingen     | ✅ Geüpload naar Tlon-opslag                        |
| Reacties         | ✅ Via [gebundelde skill](#bundled-skill)           |
| Polls            | ❌ Nog niet ondersteund                             |
| Native opdrachten | ✅ Ondersteund (standaard alleen eigenaar)          |

## Probleemoplossing

Voer eerst deze ladder uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Veelvoorkomende fouten:

- **DM's genegeerd**: afzender staat niet in `dmAllowlist` en er is geen `ownerShip` geconfigureerd voor de goedkeuringsflow.
- **Groepsberichten genegeerd**: kanaal niet ontdekt of afzender niet geautoriseerd.
- **Verbindingsfouten**: controleer of de ship-URL bereikbaar is; schakel `allowPrivateNetwork` in voor lokale ships.
- **Authenticatiefouten**: controleer of de inlogcode actueel is (codes roteren).

## Configuratiereferentie

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.tlon.enabled`: opstarten van kanaal in-/uitschakelen.
- `channels.tlon.ship`: Urbit-shipnaam van de bot (bijv. `~sampel-palnet`).
- `channels.tlon.url`: ship-URL (bijv. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: inlogcode van ship.
- `channels.tlon.allowPrivateNetwork`: localhost-/LAN-URL's toestaan (SSRF-bypass).
- `channels.tlon.ownerShip`: eigenaar-ship voor goedkeuringssysteem (altijd geautoriseerd).
- `channels.tlon.dmAllowlist`: ships die mogen DM'en (leeg = geen).
- `channels.tlon.autoAcceptDmInvites`: DM's van ships in de allowlist automatisch accepteren.
- `channels.tlon.autoAcceptGroupInvites`: alle groepsuitnodigingen automatisch accepteren.
- `channels.tlon.autoDiscoverChannels`: groepskanalen automatisch ontdekken (standaard: true).
- `channels.tlon.groupChannels`: handmatig vastgezette kanaalnests.
- `channels.tlon.defaultAuthorizedShips`: ships die voor alle kanalen zijn geautoriseerd.
- `channels.tlon.authorization.channelRules`: authenticatieregels per kanaal.
- `channels.tlon.showModelSignature`: modelnaam toevoegen aan berichten.

## Opmerkingen

- Groepsantwoorden vereisen een vermelding (bijv. `~your-bot-ship`) om te reageren.
- Thread-antwoorden: als het inkomende bericht in een thread staat, antwoordt OpenClaw in de thread.
- Rich text: Markdown-opmaak (vet, cursief, code, koppen, lijsten) wordt geconverteerd naar het native formaat van Tlon.
- Afbeeldingen: URL's worden geüpload naar Tlon-opslag en ingesloten als afbeeldingsblokken.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingsbeperking
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
