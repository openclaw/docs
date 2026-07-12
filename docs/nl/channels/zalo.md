---
read_when:
    - Werken aan Zalo-functies of webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Zalo-bot
title: Zalo
x-i18n:
    generated_at: "2026-07-12T08:38:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimenteel. Zowel directe berichten als groepschats zijn geïmplementeerd; de onderstaande tabel [Mogelijkheden](#capabilities) geeft het geverifieerde gedrag van Zalo Bot Creator-/Marketplace-bots weer.

## Meegeleverde Plugin

Zalo wordt in huidige OpenClaw-releases als meegeleverde Plugin geleverd, zodat voor verpakte builds geen afzonderlijke installatie nodig is.

Installeer bij een oudere build of een aangepaste installatie zonder Zalo het npm-pakket rechtstreeks:

- Installeren: `openclaw plugins install @openclaw/zalo`
- Vastgezette versie: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Vanuit een lokale checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie

1. Maak een bottoken aan op [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (meld u aan, maak een bot aan en configureer de instellingen). Het token heeft de vorm `numeric_id:secret`; voor Marketplace-bots kan het bruikbare runtime-token in het welkomstbericht van de bot staan.
2. Stel het token in via de omgevingsvariabele `ZALO_BOT_TOKEN=...` (alleen voor het standaardaccount) of in de configuratie.
3. Start de Gateway opnieuw.
4. Keur bij het eerste contact via een direct bericht de koppelingscode goed (het standaardbeleid voor directe berichten is koppeling).

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

Meerdere accounts: voeg meer vermeldingen toe onder `channels.zalo.accounts.<id>`, elk met een eigen `botToken`/`name`. `channels.zalo.botToken` (vlak, zonder `accounts`) is een verouderde verkorte notatie voor één account; geef voor nieuwe configuraties de voorkeur aan `accounts.<id>.*`.

## Wat het is

Zalo is een berichtenapp die zich op Vietnam richt. Met de Bot API kan de Gateway een bot uitvoeren voor zowel één-op-ééngesprekken als groepschats, met deterministische routering terug naar Zalo (het model kiest nooit kanalen).

Deze pagina behandelt **Zalo Bot Creator-/Marketplace-bots**. **Zalo Official Account-bots (OA-bots)** vormen een ander productoppervlak en kunnen zich anders gedragen; deze pagina behandelt ze niet.

## Hoe het werkt

- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met tijdelijke aanduidingen voor media.
- Antwoorden worden altijd teruggestuurd naar dezelfde Zalo-chat; antwoorden met citaat worden niet gebruikt (`replyToMode` staat permanent uit).
- Standaard wordt long-polling (`getUpdates`) gebruikt; de webhookmodus is beschikbaar via `channels.zalo.webhookUrl`.
- In groepen is een @vermelding vereist om de bot te activeren; dit kan niet per kanaal worden geconfigureerd.

## Limieten

| Limiet                               | Waarde                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Segmentgrootte voor uitgaande tekst  | 2000 tekens (limiet van de Zalo API)                                                    |
| Mediagrootte (inkomend/uitgaand)     | `channels.zalo.mediaMaxMb`, standaard `5` MB                                            |
| Aanvraagtekst van Webhook            | 1 MB, leestime-out van 30 seconden                                                      |
| Snelheidslimiet van Webhook          | 120 aanvragen / 60 seconden per pad+client-IP, daarna HTTP 429                          |
| Venster voor dubbele Webhook-events  | 5 minuten (op basis van pad + account + eventnaam + chat + afzender + bericht-ID)       |

## Toegangsbeheer

### Directe berichten

- `channels.zalo.dmPolicy`: `pairing` (standaard) | `allowlist` | `open` | `disabled`.
- Koppeling: onbekende afzenders ontvangen een koppelingscode; berichten worden genegeerd totdat deze is goedgekeurd. Codes verlopen na 1 uur.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Details: [Koppeling](/nl/channels/pairing)
- `channels.zalo.allowFrom` accepteert numerieke Zalo-gebruikers-ID's (geen opzoeking op gebruikersnaam). Voor `open` is `"*"` vereist.

### Groepen

Groepschats worden door de Plugin ondersteund (`chatTypes: ["direct", "group"]`) en worden beperkt door een vermelding en het groepsbeleid:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` beperkt welke afzender-ID's de bot in groepen kunnen activeren; als deze instelling ontbreekt, wordt teruggevallen op `allowFrom`.
- Standaardresolutie: wanneer `channels.zalo` is geconfigureerd, wordt een niet-ingesteld `groupPolicy` omgezet naar `open`. Wanneer `channels.zalo` volledig ontbreekt, schakelt de runtime veilig terug naar `allowlist`.
- Gemelde beperking uit de praktijk: bij sommige configuraties van Marketplace-bots kon de bot helemaal niet aan een groep worden toegevoegd. Als dit gebeurt, controleer dan de instellingen van uw bot op Zalo Bot Platform; dit is een beperking van het platform en geen beleid van OpenClaw.

## Long-polling versus Webhook

- Standaard: long-polling (geen openbare URL vereist).
- Webhookmodus: stel `channels.zalo.webhookUrl` en `channels.zalo.webhookSecret` in.
  - De Webhook-URL moet HTTPS gebruiken.
  - Het Webhook-geheim moet 8-256 tekens lang zijn.
  - Zalo verzendt events met een `X-Bot-Api-Secret-Token`-header, die wordt gecontroleerd met een vergelijking met constante uitvoeringstijd.
  - Gateway HTTP verwerkt Webhook-aanvragen op `channels.zalo.webhookPath` (standaard het pad van de Webhook-URL).
  - Aanvragen moeten `Content-Type: application/json` (of een mediatype met `+json`) gebruiken.
  - Volgens de documentatie van de Zalo API sluiten `getUpdates`-polling en Webhook elkaar uit.

## Ondersteunde berichttypen

- Tekst: volledige ondersteuning, opgesplitst in segmenten van 2000 tekens.
- Media: inkomend/uitgaand, begrensd door `mediaMaxMb`.
- Reacties, threads, peilingen en systeemeigen opdrachten: niet ondersteund door de Plugin.
- Streaming: de Plugin declareert ondersteuning voor blokstreaming, maar Zalo heeft geen specifieke afstelopties voor een uitgaande wachtrij of het samenvoegen van tekst (in tegenstelling tot sommige andere regionale kanalen); verifieer het huidige gedrag in uw omgeving als dit belangrijk is voor uw gebruiksscenario.

## Mogelijkheden

| Functie                   | Status                                  |
| ------------------------- | --------------------------------------- |
| Directe berichten         | Ondersteund                             |
| Groepen                   | Ondersteund (vermelding vereist)        |
| Media (inkomend/uitgaand) | Ondersteund, begrensd door `mediaMaxMb` |
| Reacties                  | Niet ondersteund                        |
| Threads                   | Niet ondersteund                        |
| Peilingen                 | Niet ondersteund                        |
| Systeemeigen opdrachten   | Niet ondersteund                        |
| Antwoord op / citaat      | Niet gebruikt (permanent uitgeschakeld) |

## Afleveringsdoelen (CLI/Cron)

Gebruik een chat-ID als doel:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Probleemoplossing

**Bot reageert niet:**

- Controleer het token: `openclaw channels status --probe`
- Controleer of de afzender is goedgekeurd (koppeling of `allowFrom`)
- Controleer de Gateway-logboeken: `openclaw logs --follow`

**Webhook ontvangt geen events:**

- Controleer of de Webhook-URL HTTPS gebruikt
- Controleer of het geheim 8-256 tekens lang is
- Controleer of het HTTP-eindpunt van de Gateway bereikbaar is via het geconfigureerde pad
- Controleer of `getUpdates`-polling niet ook actief is (ze sluiten elkaar uit)
- Een piek in aanvragen kan HTTP 429 opleveren (120 aanvragen / 60 seconden per pad+IP); wacht langer en probeer het opnieuw

## Configuratiereferentie

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

| Instelling                                    | Beschrijving                                                   | Standaard                 |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| `channels.zalo.enabled`                       | Opstarten van kanaal in-/uitschakelen                          | `true`                    |
| `channels.zalo.accounts.<id>.botToken`        | Bottoken van Zalo Bot Platform                                 | -                         |
| `channels.zalo.accounts.<id>.tokenFile`       | Token uit een bestand lezen (symbolische koppelingen geweigerd)| -                         |
| `channels.zalo.accounts.<id>.name`            | Weergavenaam                                                   | -                         |
| `channels.zalo.accounts.<id>.enabled`         | Dit account in-/uitschakelen                                   | `true`                    |
| `channels.zalo.accounts.<id>.dmPolicy`        | Beleid voor directe berichten per account                      | `pairing`                 |
| `channels.zalo.accounts.<id>.allowFrom`       | Toegestane afzenders voor directe berichten (gebruikers-ID's)  | -                         |
| `channels.zalo.accounts.<id>.groupPolicy`     | Groepsbeleid per account                                       | zie [Groepen](#groups)    |
| `channels.zalo.accounts.<id>.groupAllowFrom`  | Toegestane groepsafzenders; valt terug op `allowFrom`           | -                         |
| `channels.zalo.accounts.<id>.mediaMaxMb`      | Limiet voor inkomende/uitgaande media (MB)                      | `5`                       |
| `channels.zalo.accounts.<id>.webhookUrl`      | Webhookmodus inschakelen (HTTPS vereist)                        | -                         |
| `channels.zalo.accounts.<id>.webhookSecret`   | Webhook-geheim (8-256 tekens)                                  | -                         |
| `channels.zalo.accounts.<id>.webhookPath`     | Webhookpad op de HTTP-server van de Gateway                     | pad van de Webhook-URL    |
| `channels.zalo.accounts.<id>.proxy`           | Proxy-URL voor API-aanvragen                                   | -                         |
| `channels.zalo.accounts.<id>.responsePrefix`  | Overschrijving van voorvoegsel voor uitgaande antwoorden       | -                         |
| `channels.zalo.defaultAccount`                | Standaardaccount wanneer meerdere accounts zijn geconfigureerd | `default`                 |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` en andere vlakke sleutels op het hoogste niveau zijn de verouderde verkorte notatie voor één account voor de bovenstaande velden; beide vormen worden ondersteund.

Omgevingsoptie: `ZALO_BOT_TOKEN=...` wordt alleen gebruikt als token voor het standaardaccount.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) - authenticatie van directe berichten en koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en activering via vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiliging
