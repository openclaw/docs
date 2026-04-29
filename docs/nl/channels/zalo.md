---
read_when:
    - Werken aan Zalo-functies of Webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor Zalo-bots
title: Zalo
x-i18n:
    generated_at: "2026-04-29T22:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimenteel. DM's worden ondersteund. De sectie [Mogelijkheden](#capabilities) hieronder weerspiegelt het huidige gedrag van Marketplace-bots.

## Gebundelde Plugin

Zalo wordt meegeleverd als een gebundelde Plugin in huidige OpenClaw-releases, dus normale verpakte
builds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Zalo uitsluit, installeer dan een
actueel npm-pakket zodra dat is gepubliceerd:

- Installeren via CLI: `openclaw plugins install @openclaw/zalo`
- Of vanuit een source-checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/nl/tools/plugin)

Als npm meldt dat het pakket dat eigendom is van OpenClaw is verouderd, gebruik dan een actuele verpakte
OpenClaw-build of het lokale checkout-pad totdat een nieuwer npm-pakket is
gepubliceerd.

## Snelle setup (beginner)

1. Zorg dat de Zalo-Plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
2. Stel het token in:
   - Env: `ZALO_BOT_TOKEN=...`
   - Of configuratie: `channels.zalo.accounts.default.botToken: "..."`.
3. Herstart de Gateway (of voltooi de setup).
4. DM-toegang gebruikt standaard koppeling; keur de koppelcode goed bij het eerste contact.

Minimale configuratie:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Wat het is

Zalo is een berichtenapp gericht op Vietnam; de Bot API laat de Gateway een bot uitvoeren voor 1-op-1-gesprekken.
Dit past goed bij ondersteuning of meldingen waarbij je deterministische routering terug naar Zalo wilt.

Deze pagina weerspiegelt het huidige OpenClaw-gedrag voor **Zalo Bot Creator / Marketplace-bots**.
**Zalo Official Account (OA)-bots** zijn een ander Zalo-productoppervlak en kunnen zich anders gedragen.

- Een Zalo Bot API-kanaal dat eigendom is van de Gateway.
- Deterministische routering: antwoorden gaan terug naar Zalo; het model kiest nooit kanalen.
- DM's delen de hoofdsessie van de agent.
- De sectie [Mogelijkheden](#capabilities) hieronder toont de huidige ondersteuning voor Marketplace-bots.

## Setup (snel pad)

### 1) Maak een bottoken aan (Zalo Bot Platform)

1. Ga naar [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) en log in.
2. Maak een nieuwe bot aan en configureer de instellingen.
3. Kopieer het volledige bottoken (meestal `numeric_id:secret`). Voor Marketplace-bots kan het bruikbare runtime-token na aanmaak in het welkomstbericht van de bot verschijnen.

### 2) Configureer het token (env of configuratie)

Voorbeeld:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Als je later overstapt naar een Zalo-botoppervlak waar groepen beschikbaar zijn, kun je expliciet groepsspecifieke configuratie toevoegen, zoals `groupPolicy` en `groupAllowFrom`. Zie [Mogelijkheden](#capabilities) voor het huidige gedrag van Marketplace-bots.

Env-optie: `ZALO_BOT_TOKEN=...` (werkt alleen voor het standaardaccount).

Ondersteuning voor meerdere accounts: gebruik `channels.zalo.accounts` met tokens per account en optioneel `name`.

3. Herstart de Gateway. Zalo start wanneer een token wordt gevonden (env of configuratie).
4. DM-toegang gebruikt standaard koppeling. Keur de code goed wanneer de bot voor het eerst wordt gecontacteerd.

## Hoe het werkt (gedrag)

- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met mediaplaatshouders.
- Antwoorden routeren altijd terug naar dezelfde Zalo-chat.
- Standaard long-polling; Webhook-modus is beschikbaar met `channels.zalo.webhookUrl`.

## Limieten

- Uitgaande tekst wordt opgesplitst in stukken van 2000 tekens (Zalo API-limiet).
- Media-downloads/uploads worden begrensd door `channels.zalo.mediaMaxMb` (standaard 5).
- Streaming is standaard geblokkeerd omdat de limiet van 2000 tekens streaming minder nuttig maakt.

## Toegangsbeheer (DM's)

### DM-toegang

- Standaard: `channels.zalo.dmPolicy = "pairing"`. Onbekende afzenders ontvangen een koppelcode; berichten worden genegeerd totdat ze zijn goedgekeurd (codes verlopen na 1 uur).
- Goedkeuren via:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Koppeling is de standaard tokenuitwisseling. Details: [Koppeling](/nl/channels/pairing)
- `channels.zalo.allowFrom` accepteert numerieke gebruikers-ID's (geen gebruikersnaamlookup beschikbaar).

## Toegangsbeheer (groepen)

Voor **Zalo Bot Creator / Marketplace-bots** was groepsondersteuning in de praktijk niet beschikbaar, omdat de bot helemaal niet aan een groep kon worden toegevoegd.

Dat betekent dat de onderstaande groepsgerelateerde configuratiesleutels in het schema bestaan, maar niet bruikbaar waren voor Marketplace-bots:

- `channels.zalo.groupPolicy` bepaalt de verwerking van inkomende groepsberichten: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` beperkt welke afzender-ID's de bot in groepen kunnen activeren.
- Als `groupAllowFrom` niet is ingesteld, valt Zalo terug op `allowFrom` voor afzendercontroles.
- Runtime-opmerking: als `channels.zalo` volledig ontbreekt, valt de runtime voor veiligheid nog steeds terug op `groupPolicy="allowlist"`.

De groepsbeleidswaarden (wanneer groepstoegang beschikbaar is op je botoppervlak) zijn:

- `groupPolicy: "disabled"` — blokkeert alle groepsberichten.
- `groupPolicy: "open"` — staat elk groepslid toe (vermelding vereist).
- `groupPolicy: "allowlist"` — fail-closed standaard; alleen toegestane afzenders worden geaccepteerd.

Als je een ander Zalo-botproductoppervlak gebruikt en werkend groepsgedrag hebt geverifieerd, documenteer dat dan apart in plaats van aan te nemen dat het overeenkomt met de Marketplace-botflow.

## Long-polling versus Webhook

- Standaard: long-polling (geen openbare URL vereist).
- Webhook-modus: stel `channels.zalo.webhookUrl` en `channels.zalo.webhookSecret` in.
  - Het Webhook-geheim moet 8-256 tekens lang zijn.
  - De Webhook-URL moet HTTPS gebruiken.
  - Zalo verzendt gebeurtenissen met de header `X-Bot-Api-Secret-Token` voor verificatie.
  - Gateway HTTP verwerkt Webhook-verzoeken op `channels.zalo.webhookPath` (standaard het pad van de Webhook-URL).
  - Verzoeken moeten `Content-Type: application/json` gebruiken (of `+json`-mediatypen).
  - Dubbele gebeurtenissen (`event_name + message_id`) worden gedurende een kort replay-venster genegeerd.
  - Burstverkeer wordt per pad/bron rate-limited en kan HTTP 429 retourneren.

**Opmerking:** getUpdates (polling) en Webhook sluiten elkaar uit volgens de Zalo API-documentatie.

## Ondersteunde berichttypen

Zie [Mogelijkheden](#capabilities) voor een snelle ondersteuningssamenvatting. De opmerkingen hieronder voegen details toe waar het gedrag extra context nodig heeft.

- **Tekstberichten**: Volledige ondersteuning met opsplitsing in stukken van 2000 tekens.
- **Platte URL's in tekst**: Gedragen zich als normale tekstinvoer.
- **Linkvoorbeelden / rijke linkkaarten**: Zie de Marketplace-botstatus in [Mogelijkheden](#capabilities); ze activeerden niet betrouwbaar een antwoord.
- **Afbeeldingsberichten**: Zie de Marketplace-botstatus in [Mogelijkheden](#capabilities); verwerking van inkomende afbeeldingen was onbetrouwbaar (typindicator zonder definitief antwoord).
- **Stickers**: Zie de Marketplace-botstatus in [Mogelijkheden](#capabilities).
- **Spraaknotities / audiobestanden / video / generieke bestandsbijlagen**: Zie de Marketplace-botstatus in [Mogelijkheden](#capabilities).
- **Niet-ondersteunde typen**: Gelogd (bijvoorbeeld berichten van beschermde gebruikers).

## Mogelijkheden

Deze tabel vat het huidige gedrag van **Zalo Bot Creator / Marketplace-bots** in OpenClaw samen.

| Functie                     | Status                                            |
| --------------------------- | ------------------------------------------------- |
| Directe berichten           | ✅ Ondersteund                                    |
| Groepen                     | ❌ Niet beschikbaar voor Marketplace-bots         |
| Media (inkomende afbeeldingen) | ⚠️ Beperkt / verifieer in je omgeving          |
| Media (uitgaande afbeeldingen) | ⚠️ Niet opnieuw getest voor Marketplace-bots    |
| Platte URL's in tekst       | ✅ Ondersteund                                    |
| Linkvoorbeelden             | ⚠️ Onbetrouwbaar voor Marketplace-bots            |
| Reacties                    | ❌ Niet ondersteund                               |
| Stickers                    | ⚠️ Geen agentantwoord voor Marketplace-bots       |
| Spraaknotities / audio / video | ⚠️ Geen agentantwoord voor Marketplace-bots    |
| Bestandsbijlagen            | ⚠️ Geen agentantwoord voor Marketplace-bots       |
| Threads                     | ❌ Niet ondersteund                               |
| Polls                       | ❌ Niet ondersteund                               |
| Native opdrachten           | ❌ Niet ondersteund                               |
| Streaming                   | ⚠️ Geblokkeerd (limiet van 2000 tekens)           |

## Bezorgdoelen (CLI/Cron)

- Gebruik een chat-id als doel.
- Voorbeeld: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Probleemoplossing

**Bot reageert niet:**

- Controleer of het token geldig is: `openclaw channels status --probe`
- Controleer of de afzender is goedgekeurd (koppeling of allowFrom)
- Controleer Gateway-logs: `openclaw logs --follow`

**Webhook ontvangt geen gebeurtenissen:**

- Zorg dat de Webhook-URL HTTPS gebruikt
- Controleer of het geheime token 8-256 tekens lang is
- Bevestig dat het Gateway HTTP-eindpunt bereikbaar is op het geconfigureerde pad
- Controleer dat getUpdates-polling niet actief is (ze sluiten elkaar uit)

## Configuratiereferentie (Zalo)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

De platte sleutels op topniveau (`channels.zalo.botToken`, `channels.zalo.dmPolicy` en vergelijkbare) zijn een verouderde verkorte notatie voor één account. Geef voor nieuwe configuraties de voorkeur aan `channels.zalo.accounts.<id>.*`. Beide vormen zijn hier nog gedocumenteerd omdat ze in het schema bestaan.

Provideropties:

- `channels.zalo.enabled`: kanaalstart inschakelen/uitschakelen.
- `channels.zalo.botToken`: bottoken van Zalo Bot Platform.
- `channels.zalo.tokenFile`: token lezen uit een regulier bestandspad. Symlinks worden geweigerd.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing).
- `channels.zalo.allowFrom`: DM-allowlist (gebruikers-ID's). `open` vereist `"*"`. De wizard vraagt om numerieke ID's.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (standaard: allowlist). Aanwezig in configuratie; zie [Mogelijkheden](#capabilities) en [Toegangsbeheer (groepen)](#access-control-groups) voor het huidige gedrag van Marketplace-bots.
- `channels.zalo.groupAllowFrom`: groepsafzender-allowlist (gebruikers-ID's). Valt terug op `allowFrom` wanneer niet ingesteld.
- `channels.zalo.mediaMaxMb`: limiet voor inkomende/uitgaande media (MB, standaard 5).
- `channels.zalo.webhookUrl`: Webhook-modus inschakelen (HTTPS vereist).
- `channels.zalo.webhookSecret`: Webhook-geheim (8-256 tekens).
- `channels.zalo.webhookPath`: Webhook-pad op de Gateway HTTP-server.
- `channels.zalo.proxy`: proxy-URL voor API-verzoeken.

Opties voor meerdere accounts:

- `channels.zalo.accounts.<id>.botToken`: token per account.
- `channels.zalo.accounts.<id>.tokenFile`: regulier tokenbestand per account. Symlinks worden geweigerd.
- `channels.zalo.accounts.<id>.name`: weergavenaam.
- `channels.zalo.accounts.<id>.enabled`: account inschakelen/uitschakelen.
- `channels.zalo.accounts.<id>.dmPolicy`: DM-beleid per account.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist per account.
- `channels.zalo.accounts.<id>.groupPolicy`: groepsbeleid per account. Aanwezig in configuratie; zie [Mogelijkheden](#capabilities) en [Toegangsbeheer (groepen)](#access-control-groups) voor het huidige gedrag van Marketplace-bots.
- `channels.zalo.accounts.<id>.groupAllowFrom`: groepsafzender-allowlist per account.
- `channels.zalo.accounts.<id>.webhookUrl`: Webhook-URL per account.
- `channels.zalo.accounts.<id>.webhookSecret`: Webhook-geheim per account.
- `channels.zalo.accounts.<id>.webhookPath`: Webhook-pad per account.
- `channels.zalo.accounts.<id>.proxy`: proxy-URL per account.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en gating via vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
