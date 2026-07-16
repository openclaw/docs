---
read_when:
    - Je wilt OpenClaw via Twilio verbinden met sms
    - Je moet een sms-Webhook of acceptatielijst instellen
summary: Instellen van het Twilio-sms-kanaal, toegangsbeheer en Webhook-configuratie
title: SMS
x-i18n:
    generated_at: "2026-07-16T15:14:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw ontvangt en verzendt sms-berichten via een Twilio-telefoonnummer of Messaging Service. De Gateway registreert een route voor inkomende webhooks (standaard `/webhooks/sms`), valideert standaard Twilio-aanvraaghandtekeningen en stuurt antwoorden terug via Twilio's Messages API.

Status: officiële plugin, afzonderlijk geïnstalleerd. Alleen tekst: geen MMS/media, alleen directe berichten.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid voor sms is koppelen.
  </Card>
  <Card title="Gateway-beveiliging" icon="shield" href="/nl/gateway/security">
    Controleer de blootstelling van webhooks en de toegangscontroles voor afzenders.
  </Card>
  <Card title="Probleemoplossing voor kanalen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek en reparatiedraaiboeken voor meerdere kanalen.
  </Card>
</CardGroup>

## Voordat je begint

Je hebt het volgende nodig:

- De officiële sms-plugin, geïnstalleerd met `openclaw plugins install @openclaw/sms`.
- Een Twilio-account met een telefoonnummer dat sms ondersteunt, of een Twilio Messaging Service.
- De Twilio Account SID en Auth Token.
- Een openbare HTTPS-URL die je OpenClaw Gateway bereikt.
- Een keuze voor het afzenderbeleid: `pairing` (standaard) voor privégebruik, `allowlist` voor vooraf goedgekeurde telefoonnummers, of `open` alleen voor opzettelijk openbare sms-toegang.

Eén Twilio-nummer kan zowel sms als [spraakoproepen](/nl/plugins/voice-call) afhandelen als het beide mogelijkheden heeft. De sms-webhook en spraakwebhook worden afzonderlijk geconfigureerd in Twilio en gebruiken afzonderlijke Gateway-paden; deze pagina behandelt alleen de sms-webhook.

## Snelle installatie

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Maak of kies een Twilio-afzender">
    Open in Twilio **Phone Numbers > Manage > Active numbers** en kies een nummer dat sms ondersteunt. Bewaar:

    - Account SID, bijvoorbeeld `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Telefoonnummer van de afzender, bijvoorbeeld `+15551234567`

    Als je een Messaging Service gebruikt in plaats van een vast afzendernummer, bewaar dan de Messaging Service SID, bijvoorbeeld `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

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

  <Step title="Laat Twilio naar de Gateway-webhook verwijzen">
    Open in de instellingen van het Twilio-telefoonnummer **Messaging** en stel **A message comes in** in op:

```text
https://gateway.example.com/webhooks/sms
```

    Gebruik HTTP `POST`. Het standaard lokale pad is `/webhooks/sms`; wijzig `channels.sms.webhookPath` als je een andere route nodig hebt.

  </Step>

  <Step title="Stel het exacte sms-webhookpad beschikbaar">
    Je openbare URL moet het sms-pad naar het Gateway-proces routeren (standaardpoort `18789`). Als je Tailscale Funnel gebruikt voor lokale tests, stel `/webhooks/sms` dan expliciet beschikbaar:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Spraakoproepen en sms gebruiken afzonderlijke webhookpaden. Als hetzelfde Twilio-nummer beide afhandelt, houd je beide routes geconfigureerd in Twilio en in je tunnel.

  </Step>

  <Step title="Start de Gateway en keur de eerste afzender goed">

```bash
openclaw gateway
```

Stuur een sms-bericht naar het Twilio-nummer. Het eerste bericht maakt een koppelingsverzoek. Keur het goed:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Koppelingscodes verlopen na 1 uur.

  </Step>
</Steps>

## Configuratievoorbeelden

Alle sleutels staan onder `channels.sms` (en per account onder `channels.sms.accounts.<id>`):

| Sleutel                                  | Standaard       | Doel                                                                |
| ---------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                      | `true` | Schakel het kanaal/account in of uit.                                |
| `accountSid`                      | —               | Twilio Account SID (`AC...`).                             |
| `authToken`                      | —               | Twilio Auth Token; tekenreeks met tekst zonder opmaak of SecretRef. |
| `fromNumber`                      | —               | E.164-afzendernummer.                                                |
| `messagingServiceSid`                      | —               | Messaging Service SID (`MG...`) die wordt gebruikt wanneer geen `fromNumber` wordt gevonden. |
| `defaultTo`                      | —               | Standaardbestemming wanneer een verzendstroom geen expliciet doel opgeeft. |
| `webhookPath`                      | `/webhooks/sms` | Gateway-HTTP-pad voor inkomende Twilio-webhooks.                     |
| `publicWebhookUrl`                      | —               | Openbare URL die in Twilio is geconfigureerd; vereist voor handtekeningvalidatie. |
| `dangerouslyDisableSignatureValidation`                      | `false` | Sla `X-Twilio-Signature`-controles over; alleen voor lokale tunneltests. |
| `dmPolicy`                      | `"pairing"` | `pairing`, `allowlist`, `open` of `disabled`. |
| `allowFrom`                      | `[]` | Toegestane afzendernummers in E.164, of `"*"` met `dmPolicy: "open"`. |
| `textChunkLimit`                      | `1500` | Maximaal aantal tekens per uitgaand sms-segment.                     |
| `accounts`, `defaultAccount`  | —               | Toewijzing voor meerdere accounts en standaardaccount-id.           |

### Configuratiebestand

Gebruik installatie via een configuratiebestand wanneer je wilt dat de kanaaldefinitie met de Gateway-configuratie meegaat:

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

Omgevingsvariabelen gelden alleen voor het standaardaccount; configuratiewaarden hebben voorrang op omgevingswaarden.

| Variabele                                      | Komt overeen met                                    |
| ---------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                             | `accountSid`                                  |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                  |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`)  | `fromNumber`                                  |
| `TWILIO_MESSAGING_SERVICE_SID`                             | `messagingServiceSid`                                  |
| `SMS_PUBLIC_WEBHOOK_URL`                             | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                             | `webhookPath`                                  |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (door komma's gescheiden)        |
| `SMS_TEXT_CHUNK_LIMIT`                             | `textChunkLimit`                                  |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`                             | `dangerouslyDisableSignatureValidation` (`"true"`)             |

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

### SecretRef-authenticatietoken

`authToken` kan een SecretRef (`source: "env" | "file" | "exec"`) zijn. Gebruik dit wanneer de Gateway de Twilio Auth Token via de OpenClaw-secretsruntime moet ophalen in plaats van configuratie als platte tekst op te slaan:

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

De omgevingsvariabele of geheimprovider waarnaar wordt verwezen, moet zichtbaar zijn voor de Gateway-runtime. Start beheerde Gateway-processen opnieuw nadat je omgevingsvariabelen van de host hebt gewijzigd.

### Messaging Service-afzender

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

Stel `defaultTo` in wanneer automatisering of door een agent geïnitieerde bezorging een standaardbestemming moet hebben als een verzendstroom geen expliciet doel opgeeft:

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

## Toegangscontrole

`channels.sms.dmPolicy` beheert directe sms-toegang:

- `pairing` (standaard): onbekende afzenders krijgen een koppelingscode; keur deze goed met `openclaw pairing approve sms <CODE>`.
- `allowlist`: alleen afzenders in `allowFrom` worden verwerkt. Een lege `allowFrom` weigert elke afzender (de Gateway registreert een waarschuwing bij het opstarten).
- `open`: configuratievalidatie vereist dat `allowFrom` `"*"` bevat. Zonder het jokerteken kunnen alleen vermelde nummers chatten.
- `disabled`: alle inkomende DM's worden verwijderd.

Vermeldingen in `allowFrom` moeten E.164-telefoonnummers zijn, zoals `+15551234567`. De voorvoegsels `sms:` en `twilio-sms:` worden geaccepteerd en genormaliseerd. Geef voor een privéassistent de voorkeur aan `dmPolicy: "allowlist"` met expliciete telefoonnummers:

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

## Sms verzenden

Als het sms-kanaal is geselecteerd, accepteren doelen kale E.164-nummers of het voorvoegsel `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Wanneer de kanaalselectie impliciet is, selecteert het voorvoegsel `twilio-sms:` dit kanaal zonder het servicevoorvoegsel `sms:` over te nemen, dat iMessage gebruikt om sms-bezorging via de provider voor zijn eigen doelen te selecteren:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

De CLI vereist een expliciete `--target`. `defaultTo` is bedoeld voor automatisering en door een agent geïnitieerde bezorgingspaden waarbij het doel uit de kanaalconfiguratie kan worden afgeleid.

Antwoorden van de agent op inkomende sms-gesprekken worden automatisch via de geconfigureerde Twilio-afzender teruggestuurd naar de afzender.

Sms-uitvoer is platte tekst. OpenClaw verwijdert Markdown, maakt omheinde codeblokken plat, herschrijft links als `label (url)` en splitst lange antwoorden in delen van maximaal `textChunkLimit` tekens (standaard 1500) voordat ze via Twilio worden verzonden.

## Installatie verifiëren

Nadat de Gateway is gestart:

1. Controleer of het Gateway-logboek de sms-Webhook-route toont.
2. Voer een controle vanuit Twilio uit (controleert de geconfigureerde Twilio-Webhook-URL/-methode en recente fouten bij inkomende berichten):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Stuur vanaf je telefoon een sms naar het Twilio-nummer.
4. Voer `openclaw pairing list sms` uit.
5. Keur de koppelingscode goed met `openclaw pairing approve sms <CODE>`.
6. Stuur nog een sms en controleer of de agent antwoordt.

Gebruik voor tests met alleen uitgaande berichten:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### End-to-endtest vanuit macOS iMessage/sms

Op een Mac die via Berichten sms-berichten via de provider kan versturen, kun je `imsg` gebruiken om de afzender aan te sturen zonder je telefoon aan te raken:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Het eerste bericht moet een koppelingsverzoek aanmaken. Het tweede bericht moet via Twilio het antwoord van de agent ontvangen.

## Webhook-beveiliging

OpenClaw valideert standaard `X-Twilio-Signature` met `publicWebhookUrl` en `authToken`. Zorg dat het eindpuntgedeelte van `publicWebhookUrl` byte voor byte overeenkomt met de in Twilio geconfigureerde URL, inclusief schema, host, pad en querytekenreeks. OpenClaw sluit Twilio-[verbindingsoverschrijvings](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides)fragmenten (`#...`) uit van de handtekeningberekening, zoals Twilio vereist.

De Webhook-route dwingt bovendien, onafhankelijk van de handtekeningvalidatie, het volgende af:

- Alleen `POST`.
- Een budget voor mislukte verzoeken van 300 verzoeken per minuut per sms-account, Webhook-route en herleid clientadres. Alle verzoeken tellen mee voor dit budget, maar HTTP 429 wordt pas toegepast nadat het parseren van de aanvraagtekst, de Twilio-validatie of de AccountSid-controle van een verzoek mislukt.
- Een snelheidslimiet voor doorstuurbare callbacks van 30 geaccepteerde callbacks per minuut per sms-account, Webhook-route en herleid clientadres nadat die controles zijn geslaagd (daarboven HTTP 429). Als handtekeningvalidatie is uitgeschakeld, is deze limiet van 30/min de limiet voor niet-geverifieerde doorsturing.
- Clientadressen worden herleid via de gedeelde regels voor vertrouwde proxy's van de Gateway. Als `gateway.trustedProxies` de reverse proxy bevat die Twilio-callbacks doorstuurt, baseert OpenClaw deze limieten op het doorgestuurde clientadres; anders wordt teruggevallen op het rechtstreekse socketadres.
- De `AccountSid` van de payload moet overeenkomen met de geconfigureerde `accountSid` (anders HTTP 403).
- Opnieuw afgespeelde `MessageSid`-waarden worden gedurende 10 minuten gededupliceerd.
- De replaycache van elk sms-account bewaart maximaal 10,000 actieve bericht-SID's. Wanneer elke plek bezet is, worden nieuwe Webhooks voor dat account fail-closed geweigerd met HTTP 429 en een `Retry-After`-header totdat de oudste plek verloopt.
- Aanvraagteksten groter dan 32 KB worden geweigerd.

Twilio probeert HTTP 429 standaard niet opnieuw en documenteert geen ondersteuning voor `Retry-After`. De verbindingsoverschrijvingen `#rp=4xx` en `#rp=all` schakelen nieuwe pogingen bij 4xx-fouten in, maar Twilio beperkt de volledige transactie met nieuwe pogingen tot 15 seconden. Daardoor kunnen de pogingen nog steeds eindigen voordat een plek in de replaycache verloopt. Configureer een terugval-URL wanneer een andere handler mislukte afleveringen moet ontvangen; behandel een 429 als een fail-closed weigering, niet als betrouwbare tegendruk.

Alleen voor lokale tunneltests kun je het volgende instellen:

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

## Configuratie met meerdere accounts

Gebruik `accounts` wanneer je meer dan één Twilio-nummer beheert:

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

Elk account moet een afzonderlijke `webhookPath` gebruiken; de Gateway weigert een Webhook-route te registreren waarvan het pad al eigendom is van een ander account. De omgevingsterugvalwaarden `TWILIO_*`/`SMS_*` gelden alleen voor het standaardaccount; stel `defaultAccount` in om te wijzigen welk account dat is.

## Problemen oplossen

### Twilio retourneert 403 of OpenClaw weigert de Webhook

Controleer of `publicWebhookUrl` exact overeenkomt met de in Twilio geconfigureerde URL, inclusief schema, host, pad en querytekenreeks. Twilio ondertekent de openbare URL-tekenreeks, waardoor herschrijvingen door proxy's en alternatieve hostnamen de handtekeningvalidatie kunnen verstoren.

Een 403 met `Invalid account` betekent dat de `AccountSid` van de inkomende payload niet overeenkomt met de geconfigureerde `accountSid`; controleer of de Webhook verwijst naar het account dat eigenaar is van het nummer.

### Er verschijnt geen koppelingsverzoek

Controleer de **Messaging**-Webhook-URL en -methode van het Twilio-nummer. Deze moet naar de sms-Webhook-URL verwijzen en `POST` gebruiken. Controleer ook of de Gateway bereikbaar is vanaf het openbare internet of via je tunnel.

Als het Twilio-berichtenlogboek fout `11200` toont, heeft Twilio de inkomende sms geaccepteerd, maar kon het je Webhook niet bereiken. Controleer het volgende:

- Twilio **Messaging > A message comes in** verwijst naar `publicWebhookUrl`.
- De methode is `POST`.
- De tunnel of reverse proxy stelt exact `webhookPath` beschikbaar; voer voor Tailscale Funnel `tailscale funnel status` uit en controleer of `/webhooks/sms` wordt vermeld.
- `publicWebhookUrl` gebruikt hetzelfde schema, dezelfde host, hetzelfde pad en dezelfde querytekenreeks als Twilio verzendt, zodat de handtekeningvalidatie de ondertekende URL kan reproduceren.

`openclaw channels status --channel sms --probe` toont zowel niet-overeenkomende Twilio-Webhook-instellingen als recente `11200`-fouten.

### Uitgaande verzendingen mislukken

Controleer of `accountSid`, `authToken` en `fromNumber` of `messagingServiceSid` zijn herleid. Als je een Twilio-proefaccount gebruikt, moet het bestemmingsnummer mogelijk in Twilio worden geverifieerd voordat uitgaande sms-berichten kunnen worden verzonden.

### Berichten komen aan, maar de agent antwoordt niet

Controleer `dmPolicy` en `allowFrom`. Met het standaardbeleid `pairing` moet de afzender worden goedgekeurd voordat normale agentbeurten worden verwerkt.
