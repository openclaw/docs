---
read_when:
    - Je wilt OpenClaw verbinden met LINE
    - Je moet de LINE-Webhook en referenties instellen
    - Je wilt LINE-specifieke berichtopties
summary: Installatie, configuratie en gebruik van de LINE Messaging API Plugin
title: REGEL
x-i18n:
    generated_at: "2026-05-02T11:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE maakt verbinding met OpenClaw via de LINE Messaging API. De Plugin draait als een Webhook
ontvanger op de Gateway en gebruikt je channel access token + channel secret voor
authenticatie.

Status: downloadbare Plugin. Directe berichten, groepschats, media, locaties, Flex
messages, template messages en quick replies worden ondersteund. Reacties en threads
worden niet ondersteund.

## Installeren

Installeer LINE voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/line
```

Lokale checkout (wanneer je vanuit een git-repo werkt):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Instellen

1. Maak een LINE Developers-account aan en open de Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Maak (of kies) een Provider en voeg een **Messaging API**-kanaal toe.
3. Kopieer de **Channel access token** en **Channel secret** uit de kanaalinstellingen.
4. Schakel **Use webhook** in bij de Messaging API-instellingen.
5. Stel de Webhook-URL in op je Gateway-eindpunt (HTTPS vereist):

```
https://gateway-host/line/webhook
```

De Gateway reageert op LINE's Webhook-verificatie (GET) en inkomende gebeurtenissen (POST).
Als je een aangepast pad nodig hebt, stel dan `channels.line.webhookPath` of
`channels.line.accounts.<id>.webhookPath` in en werk de URL overeenkomstig bij.

Beveiligingsopmerking:

- LINE-handtekeningverificatie is afhankelijk van de body (HMAC over de raw body), dus OpenClaw past strikte pre-auth bodylimieten en een timeout toe vóór verificatie.
- OpenClaw verwerkt Webhook-gebeurtenissen uit de geverifieerde ruwe request-bytes. Door upstream middleware getransformeerde `req.body`-waarden worden genegeerd voor veiligheid van de handtekeningintegriteit.

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

Env vars (alleen standaardaccount):

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

`tokenFile` en `secretFile` moeten naar gewone bestanden verwijzen. Symlinks worden geweigerd.

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

## Toegangscontrole

Directe berichten gebruiken standaard koppeling. Onbekende afzenders krijgen een koppelingscode en hun
berichten worden genegeerd totdat ze zijn goedgekeurd.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists en beleidsregels:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: toegestane LINE-gebruikers-ID's voor DM's
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: toegestane LINE-gebruikers-ID's voor groepen
- Per-groep overrides: `channels.line.groups.<groupId>.allowFrom`
- Runtime-opmerking: als `channels.line` volledig ontbreekt, valt de runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien er als volgt uit:

- Gebruiker: `U` + 32 hex-tekens
- Groep: `C` + 32 hex-tekens
- Kamer: `R` + 32 hex-tekens

## Berichtgedrag

- Tekst wordt opgesplitst bij 5000 tekens.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet in Flex
  cards.
- Streamingantwoorden worden gebufferd; LINE ontvangt volledige stukken met een laadanimatie
  terwijl de agent werkt.
- Mediadownloads worden begrensd door `channels.line.mediaMaxMb` (standaard 10).
- Inkomende media worden opgeslagen onder `~/.openclaw/media/inbound/` voordat ze worden doorgegeven
  aan de agent, overeenkomstig de gedeelde mediaopslag die door andere gebundelde kanaal-Plugins
  wordt gebruikt.

## Kanaalgegevens (rijke berichten)

Gebruik `channelData.line` om quick replies, locaties, Flex cards of template
messages te verzenden.

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

De LINE-Plugin levert ook een `/card`-opdracht voor Flex message-voorinstellingen:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt ACP-conversatiebindingen (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindt de huidige LINE-chat aan een ACP-sessie zonder een onderliggende thread te maken.
- Geconfigureerde ACP-bindingen en actieve conversatiegebonden ACP-sessies werken op LINE net als op andere conversatiekanalen.

Zie [ACP-agents](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE-Plugin ondersteunt het verzenden van afbeeldingen, video's en audiobestanden via de berichttool van de agent. Media worden verzonden via het LINE-specifieke leveringspad met passende preview- en trackingafhandeling:

- **Afbeeldingen**: verzonden als LINE-afbeeldingsberichten met automatische previewgeneratie.
- **Video's**: verzonden met expliciete preview- en content-type-afhandeling.
- **Audio**: verzonden als LINE-audioberichten.

Uitgaande media-URL's moeten openbare HTTPS-URL's zijn. OpenClaw valideert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert local loopback-, link-local- en private-network-doelen.

Generieke mediaverzendingen vallen terug op de bestaande route voor alleen afbeeldingen wanneer er geen LINE-specifiek pad beschikbaar is.

## Problemen oplossen

- **Webhook-verificatie mislukt:** zorg dat de Webhook-URL HTTPS gebruikt en dat
  `channelSecret` overeenkomt met de LINE-console.
- **Geen inkomende gebeurtenissen:** bevestig dat het Webhook-pad overeenkomt met `channels.line.webhookPath`
  en dat de Gateway bereikbaar is vanuit LINE.
- **Fouten bij mediadownloads:** verhoog `channels.line.mediaMaxMb` als media de
  standaardlimiet overschrijden.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
