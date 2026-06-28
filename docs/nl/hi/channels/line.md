---
read_when:
    - U wilt OpenClaw verbinden met LINE
    - Je hebt LINE Webhook + configuratie van referentiegegevens nodig
    - U wilt LINE-specifieke berichtopties
summary: LINE Messaging API Plugin instellen, configureren en gebruiken
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE maakt via de LINE Messaging API verbinding met OpenClaw. De Plugin draait als Webhook-ontvanger op de Gateway en gebruikt uw channel access token + channel secret voor authenticatie.

Status: downloadbare Plugin. Directe berichten, groepschats, media, locaties, Flex-berichten, sjabloonberichten en snelle antwoorden worden ondersteund. Reacties en threads worden niet ondersteund.

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
2. Maak (of kies) een Provider en voeg een **Messaging API**-kanaal toe.
3. Kopieer de **Channel access token** en **Channel secret** uit de channel settings.
4. Schakel **Use webhook** in de Messaging API settings in.
5. Stel de Webhook URL in op uw Gateway endpoint (HTTPS is vereist):

```
https://gateway-host/line/webhook
```

De Gateway beantwoordt de Webhook-verificatie (GET) van LINE en accepteert signed inbound events (POST) direct na validatie van signature en payload; agentverwerking gaat asynchroon door.
Als u een aangepast pad nodig hebt, stel dan `channels.line.webhookPath` of
`channels.line.accounts.<id>.webhookPath` in en werk de URL overeenkomstig bij.

Beveiligingsopmerking:

- LINE signature verification is afhankelijk van de body (HMAC op de raw body), daarom past OpenClaw strikte pre-auth body limits en time-outs toe vóór verificatie.
- OpenClaw verwerkt Webhook events vanuit geverifieerde raw request bytes. Voor signature-integrity safety worden door upstream middleware getransformeerde `req.body`-waarden genegeerd.

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

Public DM-config:

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

Env vars (alleen default account):

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

Directe berichten staan standaard op pairing. Onbekende afzenders krijgen een pairing-code en hun berichten worden genegeerd totdat ze zijn goedgekeurd.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists en beleid:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: allowlisted LINE-gebruikers-ID's voor DM's; voor `dmPolicy: "open"` is `["*"]` vereist
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: allowlisted LINE-gebruikers-ID's voor groepen
- Per-groep overrides: `channels.line.groups.<groupId>.allowFrom`
- Statische sender access groups kunnen met `accessGroup:<name>` worden gerefereerd vanuit `allowFrom`, `groupAllowFrom` en per-groep `allowFrom`.
- Runtime-opmerking: als `channels.line` volledig ontbreekt, valt de runtime voor group checks terug op `groupPolicy="allowlist"` (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien er zo uit:

- Gebruiker: `U` + 32 hextekens
- Groep: `C` + 32 hextekens
- Room: `R` + 32 hextekens

## Berichtgedrag

- Tekst wordt in chunks van 5000 tekens opgesplitst.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet naar Flex-kaarten.
- Streaming responses worden gebufferd; terwijl de agent werkt, ontvangt LINE volledige chunks met een laadanimatie.
- Media-downloads zijn begrensd door `channels.line.mediaMaxMb` (standaard 10).
- Inbound media worden opgeslagen onder `~/.openclaw/media/inbound/` voordat ze aan de agent worden doorgegeven,
  wat overeenkomt met de shared media store die door andere bundled channel
  plugins wordt gebruikt.

## Kanaalgegevens (rijke berichten)

Gebruik `channelData.line` om snelle antwoorden, locaties, Flex-kaarten of sjabloonberichten te verzenden.

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

De LINE Plugin levert ook de opdracht `/card` voor Flex message presets:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt ACP (Agent Communication Protocol) conversation bindings:

- `/acp spawn <agent> --bind here` bindt de huidige LINE-chat aan de ACP-sessie zonder een child thread aan te maken.
- Geconfigureerde ACP bindings en actieve conversation-bound ACP sessions werken op LINE zoals andere conversation channels.

Zie [ACP-agents](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE Plugin ondersteunt het verzenden van afbeeldingen, video's en audiobestanden via de agent message tool. Media worden via het LINE-specifieke delivery path verzonden met passende preview- en tracking-afhandeling:

- **Afbeeldingen**: worden als LINE image messages verzonden met automatische previewgeneratie.
- **Video's**: worden verzonden met expliciete preview- en content-type-afhandeling.
- **Audio**: wordt verzonden als LINE audio messages.

Uitgaande media-URL's moeten openbare HTTPS-URL's zijn. OpenClaw valideert de target hostname voordat de URL aan LINE wordt doorgegeven en weigert loopback-, link-local- en private-network targets.

Generieke media sends vallen terug op de bestaande image-only route wanneer het LINE-specifieke pad niet beschikbaar is.

## Probleemoplossing

- **Webhook verification fails:** Zorg ervoor dat de Webhook URL HTTPS gebruikt en dat
  `channelSecret` overeenkomt met de LINE console.
- **No inbound events:** Bevestig dat het Webhook-pad overeenkomt met `channels.line.webhookPath`
  en dat de Gateway bereikbaar is vanaf LINE.
- **Media download errors:** Verhoog `channels.line.mediaMaxMb` als media de standaardlimiet overschrijden.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Pairing](/nl/channels/pairing) — DM-authenticatie en pairing-flow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en mention gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
