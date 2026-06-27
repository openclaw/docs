---
read_when:
    - Je wilt OpenClaw verbinden met sms via Twilio
    - Je hebt SMS-webhook- of allowlist-configuratie nodig
summary: Instellen van het Twilio SMS-kanaal, toegangscontroles en Webhook-configuratie
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:13:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw kan SMS ontvangen en verzenden via een Twilio-telefoonnummer of Messaging Service. De Gateway registreert een inkomende webhook-route, valideert standaard Twilio-aanvraaghandtekeningen en stuurt antwoorden terug via Twilio's Messages API.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid voor SMS is koppelen.
  </Card>
  <Card title="Gateway-beveiliging" icon="shield" href="/nl/gateway/security">
    Controleer webhook-blootstelling en toegangscontroles voor afzenders.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek en reparatiedraaiboeken voor meerdere kanalen.
  </Card>
</CardGroup>

## Voordat je begint

Je hebt nodig:

- De officiële SMS-Plugin geïnstalleerd met `openclaw plugins install @openclaw/sms`.
- Een Twilio-account met een telefoonnummer dat SMS ondersteunt, of een Twilio Messaging Service.
- De Twilio Account SID en Auth Token.
- Een openbare HTTPS-URL die je OpenClaw Gateway bereikt.
- Een keuze voor afzenderbeleid: `pairing` voor privégebruik, `allowlist` voor vooraf goedgekeurde telefoonnummers, of `open` alleen voor bewust openbare SMS-toegang.

Gebruik één Twilio-nummer voor zowel SMS als Voice Call als het nummer beide mogelijkheden heeft. Configureer de SMS-webhook en Voice-webhook afzonderlijk in Twilio; deze pagina behandelt alleen de SMS-webhook.

## Snelle installatie

<Steps>
  <Step title="Installeer de Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Maak of kies een Twilio-afzender">
    Open in Twilio **Phone Numbers > Manage > Active numbers** en kies een nummer dat SMS ondersteunt. Sla op:

    - Account SID, bijvoorbeeld `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Telefoonnummer van afzender, bijvoorbeeld `+15551234567`

    Als je een Messaging Service gebruikt in plaats van een vast afzendernummer, sla dan de Messaging Service SID op, bijvoorbeeld `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configureer het SMS-kanaal">

Sla dit op als `sms.patch.json5` en wijzig de placeholders:

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

  <Step title="Laat Twilio naar de Gateway-webhook wijzen">
    Open in de instellingen van het Twilio-telefoonnummer **Messaging** en stel **A message comes in** in op:

```text
https://gateway.example.com/webhooks/sms
```

    Gebruik HTTP `POST`. Het standaard lokale pad is `/webhooks/sms`; wijzig `channels.sms.webhookPath` als je een andere route nodig hebt.

  </Step>

  <Step title="Maak het exacte SMS-webhookpad beschikbaar">
    Je openbare URL moet het SMS-pad naar het Gateway-proces routeren. Als je Tailscale Funnel gebruikt voor lokale tests, maak `/webhooks/sms` expliciet beschikbaar:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call en SMS gebruiken afzonderlijke webhookpaden. Als hetzelfde Twilio-nummer beide afhandelt, houd dan beide routes geconfigureerd in Twilio en in je tunnel.

  </Step>

  <Step title="Start de Gateway en keur de eerste afzender goed">

```bash
openclaw gateway
```

Stuur een tekstbericht naar het Twilio-nummer. Het eerste bericht maakt een koppelingsaanvraag. Keur die goed:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Koppelingscodes verlopen na 1 uur.

  </Step>
</Steps>

## Configuratievoorbeelden

### Configuratiebestand

Gebruik installatie via een configuratiebestand wanneer je wilt dat de kanaaldefinitie met de Gateway-configuratie meereist:

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

Gebruik env-installatie voor implementaties met één account waarbij geheimen uit de hostomgeving komen:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Schakel daarna het kanaal in de configuratie in:

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

`TWILIO_SMS_FROM` wordt geaccepteerd als alias voor `TWILIO_PHONE_NUMBER`. Gebruik `TWILIO_MESSAGING_SERVICE_SID` in plaats van een telefoonnummer-afzender wanneer Twilio de afzender uit een Messaging Service moet kiezen.

### SecretRef-authenticatietoken

`authToken` kan een SecretRef zijn. Gebruik dit wanneer de Gateway de Twilio Auth Token moet ophalen uit de OpenClaw-geheimenruntime in plaats van platte-tekstconfiguratie op te slaan:

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

De gerefereerde omgevingsvariabele of geheimenprovider moet zichtbaar zijn voor de Gateway-runtime. Start beheerde Gateway-processen opnieuw na het wijzigen van hostomgevingsvariabelen.

### Privénummer met alleen allowlist

Gebruik `allowlist` wanneer alleen bekende telefoonnummers met de agent mogen praten:

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

Als zowel `fromNumber` als `messagingServiceSid` aanwezig zijn na het oplossen van configuratie en env, wordt `fromNumber` gebruikt.

### Standaard uitgaand doel

Stel `defaultTo` in wanneer automatisering of door de agent geïnitieerde aflevering een standaardbestemming moet hebben als een verzendflow geen expliciet doel opgeeft:

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

`channels.sms.dmPolicy` bepaalt directe SMS-toegang:

- `pairing` (standaard)
- `allowlist` (vereist ten minste één afzender in `allowFrom`)
- `open` (vereist dat `allowFrom` `"*"` bevat)
- `disabled`

`allowFrom`-vermeldingen moeten E.164-telefoonnummers zijn, zoals `+15551234567`. `sms:`-voorvoegsels worden geaccepteerd en genormaliseerd. Geef voor een privéassistent de voorkeur aan `dmPolicy: "allowlist"` met expliciete telefoonnummers.

## SMS verzenden

Uitgaande SMS-doelen gebruiken het servicevoorvoegsel `sms:` met het SMS-kanaal geselecteerd:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Wanneer kanaalselectie impliciet is, selecteert `twilio-sms:+15551234567` dit kanaal zonder het bestaande kanaal-eigen `sms:`-servicevoorvoegsel over te nemen dat door iMessage wordt gebruikt.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

De CLI vereist een expliciete `--target`. `defaultTo` is bedoeld voor automatisering en door de agent geïnitieerde afleverpaden waarbij het doel uit kanaalconfiguratie kan worden opgelost.

Agentantwoorden uit inkomende SMS-gesprekken gaan automatisch terug naar de afzender via de geconfigureerde Twilio-afzender.

SMS-uitvoer is platte tekst. OpenClaw verwijdert markdown, vlakt omheinde codeblokken af, behoudt leesbare links en splitst lange antwoorden op voordat ze via Twilio worden verzonden.

## Installatie verifiëren

Nadat de Gateway is gestart:

1. Controleer of het Gateway-log de SMS-webhook-route toont.
2. Voer een Twilio-side probe uit:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Stuur vanaf je telefoon een SMS naar het Twilio-nummer.
4. Voer `openclaw pairing list sms` uit.
5. Keur de koppelingscode goed met `openclaw pairing approve sms <CODE>`.
6. Stuur nog een SMS en bevestig dat de agent antwoordt.

Gebruik voor tests met alleen uitgaand verkeer:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### End-to-end-test vanuit macOS iMessage/SMS

Op een Mac die carrier-SMS via Berichten kan verzenden, kun je `imsg` gebruiken om de afzenderkant aan te sturen zonder je telefoon aan te raken:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Het eerste bericht moet een koppelingsaanvraag maken. Het tweede bericht moet het antwoord van de agent via Twilio ontvangen.

## Webhook-beveiliging

Standaard valideert OpenClaw `X-Twilio-Signature` met `publicWebhookUrl` en `authToken`. Houd `publicWebhookUrl` byte-voor-byte gelijk aan de URL die in Twilio is geconfigureerd, inclusief schema, host, pad en querystring.

Alleen voor lokale tunneltests kun je instellen:

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

Elk account moet een afzonderlijk `webhookPath` gebruiken.

## Problemen oplossen

### Twilio retourneert 403 of OpenClaw weigert de webhook

Controleer of `publicWebhookUrl` exact overeenkomt met de URL die in Twilio is geconfigureerd, inclusief schema, host, pad en querystring. Twilio ondertekent de openbare URL-tekenreeks, dus proxy-herschrijvingen en alternatieve hostnamen kunnen handtekeningvalidatie breken.

### Er verschijnt geen koppelingsaanvraag

Controleer de **Messaging**-webhook-URL en -methode van het Twilio-nummer. Deze moet naar de SMS-webhook-URL wijzen en `POST` gebruiken. Bevestig ook dat de Gateway bereikbaar is vanaf het openbare internet of via je tunnel.

Als het Twilio-berichtlog fout `11200` toont, heeft Twilio de inkomende SMS geaccepteerd maar kon het je webhook niet bereiken. Controleer:

- Twilio **Messaging > A message comes in** wijst naar `publicWebhookUrl`.
- De methode is `POST`.
- De tunnel of reverse proxy maakt het exacte `webhookPath` beschikbaar; voer voor Tailscale Funnel `tailscale funnel status` uit en bevestig dat `/webhooks/sms` wordt vermeld.
- `publicWebhookUrl` gebruikt hetzelfde schema, dezelfde host, hetzelfde pad en dezelfde querystring die Twilio verzendt, zodat handtekeningvalidatie de ondertekende URL kan reproduceren.

### Uitgaande verzendingen mislukken

Bevestig dat `accountSid`, `authToken` en ofwel `fromNumber` of `messagingServiceSid` worden opgelost. Als je een Twilio-proefaccount gebruikt, moet het bestemmingsnummer mogelijk in Twilio worden geverifieerd voordat uitgaande SMS wordt verzonden.

### Berichten komen aan, maar de agent antwoordt niet

Controleer `dmPolicy` en `allowFrom`. Met het standaardbeleid `pairing` moet de afzender zijn goedgekeurd voordat normale agentbeurten worden verwerkt.
