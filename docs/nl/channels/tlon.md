---
read_when:
    - Werken aan Tlon/Urbit-kanaalfuncties
summary: Tlon/Urbit-ondersteuningsstatus, mogelijkheden en configuratie
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
---

Tlon is een gedecentraliseerde messenger die is gebouwd op Urbit. OpenClaw maakt verbinding met je Urbit-ship en kan
reageren op DM's en groepschatberichten. Groepsantwoorden vereisen standaard een @-vermelding en kunnen
verder worden beperkt via allowlists.

Status: gebundelde Plugin. DM's, groepsvermeldingen, threadantwoorden, rich-text-opmaak en
afbeeldingsuploads worden ondersteund. Reacties en polls worden nog niet ondersteund.

## Gebundelde Plugin

Tlon wordt meegeleverd als gebundelde Plugin in huidige OpenClaw-releases, dus normale verpakte
builds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie waarin Tlon is uitgesloten, installeer dan een
huidig npm-pakket:

Installeren via CLI (npm-register):

```bash
openclaw plugins install @openclaw/tlon
```

Gebruik het kale pakket om de huidige officiële releasetag te volgen. Pin alleen een exacte
versie wanneer je een reproduceerbare installatie nodig hebt.

Lokale checkout (wanneer je vanuit een git-repo draait):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Instellen

1. Zorg dat de Tlon-Plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
2. Verzamel je ship-URL en logincode.
3. Configureer `channels.tlon`.
4. Herstart de gateway.
5. Stuur de bot een DM of vermeld deze in een groepskanaal.

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

Standaard blokkeert OpenClaw privé/interne hostnamen en IP-bereiken ter bescherming tegen SSRF.
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

Automatische detectie is standaard ingeschakeld. Je kunt kanalen ook handmatig vastzetten:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Automatische detectie uitschakelen:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Toegangsbeheer

DM-allowlist (leeg = geen DM's toegestaan, gebruik `ownerShip` voor goedkeuringsflow):

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

Stel een owner-ship in om goedkeuringsverzoeken te ontvangen wanneer niet-geautoriseerde gebruikers proberen te interacteren:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

De owner-ship is **overal automatisch geautoriseerd** — DM-uitnodigingen worden automatisch geaccepteerd en
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

Groepsuitnodigingen van vertrouwde ships automatisch accepteren:

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

`autoAcceptGroupInvites` faalt gesloten wanneer `groupInviteAllowlist` leeg is. Stel de
allowlist in op de ships waarvan groepsuitnodigingen automatisch moeten worden geaccepteerd.

## Bezorgdoelen (CLI/cron)

Gebruik deze met `openclaw message send` of cron-bezorging:

- DM: `~sampel-palnet` of `dm/~sampel-palnet`
- Groep: `chat/~host-ship/channel` of `group:~host-ship/channel`

## Gebundelde skill

De Tlon-Plugin bevat een gebundelde skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
die CLI-toegang tot Tlon-bewerkingen biedt:

- **Contacten**: profielen ophalen/bijwerken, contacten weergeven
- **Kanalen**: weergeven, maken, berichten plaatsen, geschiedenis ophalen
- **Groepen**: weergeven, maken, leden beheren
- **DM's**: berichten verzenden, op berichten reageren
- **Reacties**: emoji-reacties toevoegen aan/verwijderen van posts en DM's
- **Instellingen**: Plugin-machtigingen beheren via slash-opdrachten

De skill is automatisch beschikbaar wanneer de Plugin is geïnstalleerd.

## Mogelijkheden

| Functie           | Status                                             |
| ----------------- | -------------------------------------------------- |
| Directe berichten | ✅ Ondersteund                                     |
| Groepen/kanalen   | ✅ Ondersteund (standaard achter vermeldingspoort) |
| Threads           | ✅ Ondersteund (automatische antwoorden in thread) |
| Rich text         | ✅ Markdown omgezet naar Tlon-formaat              |
| Afbeeldingen      | ✅ Geüpload naar Tlon-opslag                       |
| Reacties          | ✅ Via [gebundelde skill](#bundled-skill)          |
| Polls             | ❌ Nog niet ondersteund                            |
| Native opdrachten | ✅ Ondersteund (standaard alleen eigenaar)         |

## Problemen oplossen

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
- **Authenticatiefouten**: controleer of de logincode actueel is (codes roteren).

## Configuratiereferentie

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.tlon.enabled`: kanaalstart in-/uitschakelen.
- `channels.tlon.ship`: Urbit-shipnaam van de bot (bijv. `~sampel-palnet`).
- `channels.tlon.url`: ship-URL (bijv. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: ship-logincode.
- `channels.tlon.allowPrivateNetwork`: localhost-/LAN-URL's toestaan (SSRF-bypass).
- `channels.tlon.ownerShip`: owner-ship voor goedkeuringssysteem (altijd geautoriseerd).
- `channels.tlon.dmAllowlist`: ships die een DM mogen sturen (leeg = geen).
- `channels.tlon.autoAcceptDmInvites`: DM's van ships op de allowlist automatisch accepteren.
- `channels.tlon.autoAcceptGroupInvites`: groepsuitnodigingen van ships op de allowlist automatisch accepteren.
- `channels.tlon.groupInviteAllowlist`: ships waarvan groepsuitnodigingen automatisch mogen worden geaccepteerd.
- `channels.tlon.autoDiscoverChannels`: groepskanalen automatisch ontdekken (standaard: true).
- `channels.tlon.groupChannels`: handmatig vastgezette kanaalnests.
- `channels.tlon.defaultAuthorizedShips`: ships die voor alle kanalen zijn geautoriseerd.
- `channels.tlon.authorization.channelRules`: auth-regels per kanaal.
- `channels.tlon.showModelSignature`: modelnaam aan berichten toevoegen.

## Opmerkingen

- Groepsantwoorden vereisen een vermelding (bijv. `~your-bot-ship`) om te reageren.
- Threadantwoorden: als het inkomende bericht in een thread staat, antwoordt OpenClaw in de thread.
- Rich text: Markdown-opmaak (vet, cursief, code, koppen, lijsten) wordt omgezet naar de native indeling van Tlon.
- Afbeeldingen: URL's worden geüpload naar Tlon-opslag en ingesloten als afbeeldingsblokken.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingspoort
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
