---
read_when:
    - U wilt OpenClaw verbinden met LINE
    - Je hebt LINE Webhook + configuratie van referentiegegevens nodig
    - U wilt LINE-specifieke berichtopties
summary: LINE Messaging API Plugin instellen, configureren en gebruiken
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE verbindt met OpenClaw via de LINE Messaging API. De Plugin draait als Webhook
receiver op de Gateway en gebruikt uw channel access token + channel secret voor
authenticatie.

Status: downloadbare Plugin. Directe berichten, groepschats, media, locaties, Flex-
berichten, templateberichten en snelle antwoorden worden ondersteund. Reacties en threads
worden niet ondersteund.

## Installeren

Installeer LINE voordat u het kanaal configureert:

```bash
openclaw plugins install @openclaw/line
```

Lokale checkout (wanneer u vanuit een git-repo draait):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Instellen

1. Maak een LINE Developers-account aan en open de Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Maak (of selecteer) een Provider en voeg een **Messaging API**-kanaal toe.
3. Kopieer de **Channel access token** en **Channel secret** uit de kanaalinstellingen.
4. Schakel **Use webhook** in bij de Messaging API-instellingen.
5. Stel de Webhook-URL in op uw Gateway-eindpunt (HTTPS is vereist):

```
https://gateway-host/line/webhook
```

De Gateway beantwoordt LINE's Webhook-verificatie (GET) en accepteert signed
inbound events (POST) direct na signature- en payloadvalidatie; agent-
verwerking gaat asynchroon door.
Als u een aangepast pad nodig hebt, stelt u `channels.line.webhookPath` of
`channels.line.accounts.<id>.webhookPath` in en werkt u de URL dienovereenkomstig bij.

Beveiligingsopmerking:

- LINE signature verification is body-afhankelijk (HMAC over de raw body), daarom past OpenClaw vóór verificatie strikte pre-auth bodylimieten en time-outs toe.
- OpenClaw verwerkt Webhook-events uit verified raw request bytes. Voor signature-integrity safety worden upstream middleware-getransformeerde `req.body`-waarden genegeerd.

## Configureren

Minimale config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Publieke DM-config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Env-vars (alleen default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token-/secret-bestanden:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` en `secretFile` moeten naar reguliere bestanden wijzen. Symlinks worden geweigerd.

Meerdere accounts:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Toegangsbeheer

Directe berichten staan standaard op pairing. Onbekende afzenders krijgen een pairingcode en hun
berichten worden genegeerd totdat ze zijn goedgekeurd.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists en beleidsregels:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: allowlisted LINE-gebruikers-ID's voor DM's; voor `dmPolicy: "open"` is `["*"]` vereist
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: allowlisted LINE-gebruikers-ID's voor groepen
- Per-groep overrides: `channels.line.groups.<groupId>.allowFrom`
- Statische sender access groups kunnen vanuit `allowFrom`, `groupAllowFrom` en per-groep `allowFrom` worden verwezen met `accessGroup:<name>`.
- Runtime-opmerking: als `channels.line` volledig ontbreekt, valt de runtime voor groepscontroles terug op `groupPolicy="allowlist"` (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien er zo uit:

- Gebruiker: `U` + 32 hex-tekens
- Groep: `C` + 32 hex-tekens
- Room: `R` + 32 hex-tekens

## Berichtgedrag

- Tekst wordt in chunks van 5000 tekens verdeeld.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet naar Flex-
  cards.
- Streaming responses worden gebufferd; terwijl de agent werkt, ontvangt LINE volledige chunks
  met een laadanimatie.
- Mediadownloads zijn beperkt door `channels.line.mediaMaxMb` (standaard 10).
- Inbound media worden opgeslagen onder `~/.openclaw/media/inbound/` voordat ze aan de agent worden doorgegeven,
  wat overeenkomt met de shared media store die door andere bundled channel
  plugins wordt gebruikt.

## Kanaalgegevens (rijke berichten)

Gebruik `channelData.line` om snelle antwoorden, locaties, Flex-cards of template-
berichten te verzenden.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

De LINE Plugin levert ook de opdracht `/card` mee voor Flex message-presets:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt ACP (Agent Communication Protocol)-conversation bindings:

- `/acp spawn <agent> --bind here` bindt de huidige LINE-chat aan de ACP-sessie zonder een child thread te maken.
- Geconfigureerde ACP-bindings en actieve conversation-bound ACP-sessies werken op LINE net als andere conversation channels.

Zie [ACP-agents](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE Plugin ondersteunt het verzenden van afbeeldingen, video's en audiobestanden via de agent message tool. Media worden verzonden via het LINE-specifieke delivery path met passende preview- en trackingafhandeling:

- **Afbeeldingen**: worden verzonden als LINE-afbeeldingsberichten met automatische previewgeneratie.
- **Video's**: worden verzonden met expliciete preview- en content-type-afhandeling.
- **Audio**: wordt verzonden als LINE-audioberichten.

Uitgaande media-URL's moeten publieke HTTPS-URL's zijn. OpenClaw valideert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert loopback-, link-local- en private-network-doelen.

Generieke mediaverzendingen vallen terug op de bestaande image-only route wanneer het LINE-specifieke pad niet beschikbaar is.

## Probleemoplossing

- **Webhook-verificatie mislukt:** zorg ervoor dat de Webhook-URL HTTPS gebruikt en dat
  `channelSecret` overeenkomt met de LINE-console.
- **Geen inbound events:** controleer of het Webhook-pad overeenkomt met `channels.line.webhookPath`
  en of de Gateway bereikbaar is voor LINE.
- **Mediadownloadfouten:** verhoog `channels.line.mediaMaxMb` als media groter zijn dan de standaardlimiet.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Pairing](/nl/channels/pairing) — DM-authenticatie en pairingflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en mention gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
