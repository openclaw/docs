---
read_when:
    - Je wilt OpenClaw via Twilio met sms verbinden
    - Je moet een SMS-webhook of allowlist instellen
summary: Instelling van het Twilio-sms-kanaal, toegangsbeheer en Webhook-configuratie
title: Sms
x-i18n:
    generated_at: "2026-07-12T08:37:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw ontvangt en verzendt sms-berichten via een Twilio-telefoonnummer of Messaging Service. De Gateway registreert een inkomende Webhook-route (standaard `/webhooks/sms`), valideert standaard Twilio-aanvraaghandtekeningen en verzendt antwoorden terug via de Messages API van Twilio.

Status: officiële Plugin, afzonderlijk geïnstalleerd. Alleen tekst: geen mms/media, alleen directe berichten.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaardbeleid voor directe sms-berichten is koppelen.
  </Card>
  <Card title="Gateway-beveiliging" icon="shield" href="/nl/gateway/security">
    Controleer de blootstelling van de Webhook en de toegangscontroles voor afzenders.
  </Card>
  <Card title="Problemen met kanalen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnose- en herstelprocedures voor meerdere kanalen.
  </Card>
</CardGroup>

## Voordat u begint

U hebt het volgende nodig:

- De officiële sms-Plugin, geïnstalleerd met `openclaw plugins install @openclaw/sms`.
- Een Twilio-account met een telefoonnummer dat sms ondersteunt, of een Twilio Messaging Service.
- De Twilio Account SID en Auth Token.
- Een openbare HTTPS-URL die uw OpenClaw Gateway bereikt.
- Een keuze voor het afzenderbeleid: `pairing` (standaard) voor privégebruik, `allowlist` voor vooraf goedgekeurde telefoonnummers, of `open` uitsluitend voor bewust openbare sms-toegang.

Eén Twilio-nummer kan zowel sms als [spraakoproepen](/nl/plugins/voice-call) verwerken als het over beide mogelijkheden beschikt. De sms-Webhook en spraak-Webhook worden afzonderlijk geconfigureerd in Twilio en gebruiken afzonderlijke Gateway-paden; deze pagina behandelt alleen de sms-Webhook.

## Snelle installatie

<Steps>
  <Step title="Installeer de Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Maak of kies een Twilio-afzender">
    Open in Twilio **Phone Numbers > Manage > Active numbers** en kies een nummer dat sms ondersteunt. Bewaar:

    - Account SID, bijvoorbeeld `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Telefoonnummer van de afzender, bijvoorbeeld `+15551234567`

    Als u een Messaging Service gebruikt in plaats van een vast afzendernummer, bewaar dan de Messaging Service SID, bijvoorbeeld `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configureer het sms-kanaal">

Sla dit op als `sms.patch.json5` en wijzig de tijdelijke aanduidingen:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Pas het toe:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Verwijs Twilio naar de Gateway-Webhook">
    Open in de instellingen van het Twilio-telefoonnummer **Messaging** en stel **A message comes in** in op:

```text
https://gateway.example.com/webhooks/sms
```

    Gebruik HTTP `POST`. Het standaard lokale pad is `/webhooks/sms`; wijzig `channels.sms.webhookPath` als u een andere route nodig hebt.

  </Step>

  <Step title="Stel het exacte sms-Webhookpad beschikbaar">
    Uw openbare URL moet het sms-pad naar het Gateway-proces routeren (standaardpoort `18789`). Als u Tailscale Funnel gebruikt voor lokale tests, stel `/webhooks/sms` dan expliciet beschikbaar:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Spraakoproepen en sms gebruiken afzonderlijke Webhookpaden. Als hetzelfde Twilio-nummer beide verwerkt, behoudt u beide routes in Twilio en in uw tunnelconfiguratie.

  </Step>

  <Step title="Start de Gateway en keur de eerste afzender goed">

```bash
openclaw gateway
```

Stuur een sms-bericht naar het Twilio-nummer. Het eerste bericht maakt een koppelingsverzoek aan. Keur het goed:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Koppelingscodes verlopen na 1 uur.

  </Step>
</Steps>

## Configuratievoorbeelden

Alle sleutels bevinden zich onder `channels.sms` (en per account onder `channels.sms.accounts.<id>`):

| Sleutel                                 | Standaard       | Doel                                                                |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | Het kanaal/account in- of uitschakelen.                             |
| `accountSid`                            | —               | Twilio Account SID (`AC...`).                                       |
| `authToken`                             | —               | Twilio Auth Token; tekenreeks met leesbare tekst of SecretRef.      |
| `fromNumber`                            | —               | E.164-afzendernummer.                                               |
| `messagingServiceSid`                   | —               | Messaging Service SID (`MG...`), gebruikt als geen `fromNumber` kan worden bepaald. |
| `defaultTo`                             | —               | Standaardbestemming wanneer een verzendstroom geen expliciet doel opgeeft. |
| `webhookPath`                           | `/webhooks/sms` | HTTP-pad van de Gateway voor inkomende Twilio-Webhooks.             |
| `publicWebhookUrl`                      | —               | Openbare URL die in Twilio is geconfigureerd; vereist voor handtekeningvalidatie. |
| `dangerouslyDisableSignatureValidation` | `false`         | Controles van `X-Twilio-Signature` overslaan; uitsluitend voor tests met een lokale tunnel. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` of `disabled`.                       |
| `allowFrom`                             | `[]`            | Toegestane afzendernummers in E.164, of `"*"` met `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Maximaal aantal tekens per uitgaand sms-segment.                    |
| `accounts`, `defaultAccount`            | —               | Toewijzing van meerdere accounts en standaardaccount-id.            |

### Configuratiebestand

Gebruik configuratie via een bestand als u wilt dat de kanaaldefinitie onderdeel is van de Gateway-configuratie:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Omgevingsvariabelen

Omgevingsvariabelen zijn alleen van toepassing op het standaardaccount; configuratiewaarden hebben voorrang op omgevingswaarden.

| Variabele                                       | Komt overeen met                                    |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (door komma's gescheiden)              |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Schakel vervolgens het kanaal in de configuratie in:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### SecretRef voor het authenticatietoken

`authToken` kan een SecretRef zijn (`source: "env" | "file" | "exec"`). Gebruik dit wanneer de Gateway het Twilio Auth Token via de OpenClaw-runtime voor geheimen moet ophalen in plaats van configuratie als leesbare tekst op te slaan:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

De omgevingsvariabele of provider van geheimen waarnaar wordt verwezen, moet zichtbaar zijn voor de Gateway-runtime. Start beheerde Gateway-processen opnieuw nadat u omgevingsvariabelen van de host hebt gewijzigd.

### Afzender via Messaging Service

Gebruik `messagingServiceSid` in plaats van `fromNumber` wanneer Twilio de afzender via een Messaging Service moet kiezen:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Als zowel `fromNumber` als `messagingServiceSid` aanwezig zijn nadat de configuratie en omgevingsvariabelen zijn verwerkt, wordt `fromNumber` gebruikt.

### Standaarddoel voor uitgaande berichten

Stel `defaultTo` in wanneer automatisering of door een agent geïnitieerde aflevering een standaardbestemming moet hebben als een verzendstroom geen expliciet doel opgeeft:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Toegangsbeheer

`channels.sms.dmPolicy` beheert directe sms-toegang:

- `pairing` (standaard): onbekende afzenders krijgen een koppelingscode; keur deze goed met `openclaw pairing approve sms <CODE>`.
- `allowlist`: alleen afzenders in `allowFrom` worden verwerkt. Een lege `allowFrom` weigert elke afzender (de Gateway registreert een waarschuwing bij het opstarten).
- `open`: configuratievalidatie vereist dat `allowFrom` `"*"` bevat. Zonder het jokerteken kunnen alleen vermelde nummers chatten.
- `disabled`: alle inkomende directe berichten worden genegeerd.

Vermeldingen in `allowFrom` moeten E.164-telefoonnummers zijn, zoals `+15551234567`. De voorvoegsels `sms:` en `twilio-sms:` worden geaccepteerd en genormaliseerd. Gebruik voor een privéassistent bij voorkeur `dmPolicy: "allowlist"` met expliciete telefoonnummers:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Sms-berichten verzenden

Als het sms-kanaal is geselecteerd, accepteren doelen gewone E.164-nummers of het voorvoegsel `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Wanneer de kanaalselectie impliciet is, selecteert het voorvoegsel `twilio-sms:` dit kanaal zonder het servicevoorvoegsel `sms:` over te nemen, dat iMessage gebruikt om sms-aflevering via de mobiele provider voor zijn eigen doelen te selecteren:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

De CLI vereist een expliciete `--target`. `defaultTo` is bestemd voor automatisering en door een agent geïnitieerde afleveringspaden waarbij het doel uit de kanaalconfiguratie kan worden bepaald.

Antwoorden van agents op inkomende sms-gesprekken worden automatisch via de geconfigureerde Twilio-afzender teruggestuurd naar de afzender.

Sms-uitvoer is platte tekst. OpenClaw verwijdert Markdown, maakt omheinde codeblokken plat, herschrijft koppelingen als `label (url)` en splitst lange antwoorden in segmenten van maximaal `textChunkLimit` tekens (standaard 1500) voordat ze via Twilio worden verzonden.

## Installatie verifiëren

Nadat de Gateway is gestart:

1. Controleer of het Gateway-logboek de SMS-Webhook-route weergeeft.
2. Voer een controle aan de Twilio-zijde uit (controleert de geconfigureerde Twilio-Webhook-URL/-methode en recente fouten bij inkomende berichten):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Stuur vanaf uw telefoon een sms naar het Twilio-nummer.
4. Voer `openclaw pairing list sms` uit.
5. Keur de koppelingscode goed met `openclaw pairing approve sms <CODE>`.
6. Stuur nog een sms en controleer of de agent antwoordt.

Gebruik voor tests met alleen uitgaande berichten:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw-sms-test"
```

### End-to-endtest vanuit macOS iMessage/SMS

Op een Mac die via Messages sms-berichten over het mobiele netwerk kan verzenden, kunt u `imsg` gebruiken om de verzendende kant aan te sturen zonder uw telefoon aan te raken:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Het eerste bericht hoort een koppelingsverzoek te maken. Het tweede bericht hoort via Twilio het antwoord van de agent te ontvangen.

## Webhook-beveiliging

OpenClaw valideert standaard `X-Twilio-Signature` met `publicWebhookUrl` en `authToken`. Zorg dat het eindpuntgedeelte van `publicWebhookUrl` byte voor byte overeenkomt met de in Twilio geconfigureerde URL, inclusief schema, host, pad en querytekenreeks. OpenClaw sluit Twilio-fragmenten voor [verbindingsoverschrijvingen](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) (`#...`) uit van de handtekeningberekening, zoals Twilio vereist.

De Webhook-route dwingt daarnaast, onafhankelijk van handtekeningvalidatie, het volgende af:

- Alleen `POST`.
- Een limiet van 30 verzoeken per minuut per bron-IP-adres (daarboven HTTP 429).
- `AccountSid` in de payload moet overeenkomen met de geconfigureerde `accountSid` (anders HTTP 403).
- Opnieuw afgespeelde `MessageSid`-waarden worden gedurende 10 minuten gededupliceerd.
- De replaycache van elk sms-account bewaart maximaal 10.000 actieve bericht-SID's. Wanneer elke positie actief is, worden nieuwe Webhooks voor dat account standaard geweigerd met HTTP 429 en een `Retry-After`-header totdat de oudste positie verloopt.
- Verzoeklichamen groter dan 32 KB worden geweigerd.

Twilio probeert HTTP 429 standaard niet opnieuw en documenteert geen ondersteuning voor `Retry-After`. De verbindingsoverschrijvingen `#rp=4xx` en `#rp=all` schakelen nieuwe pogingen voor 4xx-fouten in, maar Twilio beperkt de volledige transactie met nieuwe pogingen tot 15 seconden. Daardoor kunnen de pogingen nog steeds eindigen voordat een positie in de replaycache verloopt. Configureer een terugval-URL wanneer een andere afhandelaar mislukte leveringen moet ontvangen; behandel een 429 als een standaardweigering, niet als betrouwbare tegendruk.

Alleen voor lokale tests via een tunnel kunt u het volgende instellen:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Gebruik uitgeschakelde handtekeningvalidatie niet op een openbare Gateway.

## Configuratie voor meerdere accounts

Gebruik `accounts` wanneer u meer dan één Twilio-nummer beheert:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Elk account moet een afzonderlijk `webhookPath` gebruiken; de Gateway weigert een Webhook-route te registreren waarvan het pad al eigendom is van een ander account. Terugvalwaarden uit de omgevingsvariabelen `TWILIO_*`/`SMS_*` zijn alleen van toepassing op het standaardaccount; stel `defaultAccount` in om te wijzigen welk account dat is.

## Probleemoplossing

### Twilio retourneert 403 of OpenClaw weigert de Webhook

Controleer of `publicWebhookUrl` exact overeenkomt met de in Twilio geconfigureerde URL, inclusief schema, host, pad en querytekenreeks. Twilio ondertekent de openbare URL-tekenreeks, waardoor herschrijvingen door proxy's en alternatieve hostnamen de handtekeningvalidatie kunnen verstoren.

Een 403 met `Invalid account` betekent dat de `AccountSid` van de inkomende payload niet overeenkomt met de geconfigureerde `accountSid`; controleer of de Webhook verwijst naar het account dat eigenaar is van het nummer.

### Er verschijnt geen koppelingsverzoek

Controleer de Webhook-URL en -methode onder **Messaging** voor het Twilio-nummer. Deze moet verwijzen naar de SMS-Webhook-URL en `POST` gebruiken. Controleer ook of de Gateway bereikbaar is vanaf het openbare internet of via uw tunnel.

Als het Twilio-berichtenlogboek fout `11200` weergeeft, heeft Twilio de inkomende sms geaccepteerd, maar kon het uw Webhook niet bereiken. Controleer het volgende:

- Twilio **Messaging > A message comes in** verwijst naar `publicWebhookUrl`.
- De methode is `POST`.
- De tunnel of reverse proxy stelt het exacte `webhookPath` beschikbaar; voer voor Tailscale Funnel `tailscale funnel status` uit en controleer of `/webhooks/sms` wordt vermeld.
- `publicWebhookUrl` gebruikt hetzelfde schema, dezelfde host, hetzelfde pad en dezelfde querytekenreeks als Twilio verzendt, zodat de handtekeningvalidatie de ondertekende URL kan reproduceren.

`openclaw channels status --channel sms --probe` toont zowel niet-overeenkomende Twilio-Webhook-instellingen als recente `11200`-fouten.

### Uitgaande verzendingen mislukken

Controleer of `accountSid`, `authToken` en `fromNumber` of `messagingServiceSid` zijn herleid. Als u een proefaccount van Twilio gebruikt, moet het bestemmingsnummer mogelijk in Twilio worden geverifieerd voordat uitgaande sms-berichten kunnen worden verzonden.

### Berichten komen aan, maar de agent antwoordt niet

Controleer `dmPolicy` en `allowFrom`. Met het standaardbeleid `pairing` moet de afzender zijn goedgekeurd voordat normale agentinteracties worden verwerkt.
