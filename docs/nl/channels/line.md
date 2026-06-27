---
read_when:
    - Je wilt OpenClaw verbinden met LINE
    - Je hebt LINE Webhook en configuratie van referentiegegevens nodig
    - U wilt LINE-specifieke berichtopties
summary: Installatie, configuratie en gebruik van de LINE Messaging API-Plugin
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:11:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE maakt verbinding met OpenClaw via de LINE Messaging API. De Plugin draait als Webhook
receiver op de Gateway en gebruikt je channel access token + channel secret voor
authenticatie.

Status: downloadbare Plugin. Directe berichten, groepschats, media, locaties, Flex
messages, template messages en quick replies worden ondersteund. Reacties en threads
worden niet ondersteund.

## Installeren

Installeer LINE voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/line
```

Lokale checkout (wanneer je vanuit een git-repo draait):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Instellen

1. Maak een LINE Developers-account aan en open de Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Maak (of kies) een Provider en voeg een **Messaging API**-kanaal toe.
3. Kopieer de **Channel access token** en **Channel secret** uit de kanaalinstellingen.
4. Schakel **Use webhook** in de Messaging API-instellingen in.
5. Stel de Webhook-URL in op je Gateway-eindpunt (HTTPS vereist):

```
https://gateway-host/line/webhook
```

De Gateway reageert op de Webhook-verificatie (GET) van LINE en bevestigt ondertekende
inkomende events (POST) direct na validatie van handtekening en payload; agentverwerking
gaat asynchroon verder.
Als je een aangepast pad nodig hebt, stel dan `channels.line.webhookPath` of
`channels.line.accounts.<id>.webhookPath` in en werk de URL overeenkomstig bij.

Beveiligingsopmerking:

- LINE-handtekeningverificatie is afhankelijk van de body (HMAC over de ruwe body), dus OpenClaw past strikte bodylimieten en een timeout vóór authenticatie toe voordat verificatie plaatsvindt.
- OpenClaw verwerkt Webhook-events vanuit de geverifieerde ruwe aanvraagbytes. Door upstream middleware getransformeerde `req.body`-waarden worden genegeerd voor de veiligheid van handtekeningintegriteit.

## Configureren

Minimale configuratie:

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

Openbare DM-configuratie:

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

Omgevingsvariabelen (alleen standaardaccount):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token-/secretbestanden:

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

Directe berichten gebruiken standaard pairing. Onbekende afzenders krijgen een pairingcode en hun
berichten worden genegeerd totdat ze zijn goedgekeurd.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists en beleidsregels:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: toegestane LINE-gebruikers-ID's voor DM's; `dmPolicy: "open"` vereist `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: toegestane LINE-gebruikers-ID's voor groepen
- Overrides per groep: `channels.line.groups.<groupId>.allowFrom`
- Statische afzendertoegangsgroepen kunnen worden verwezen vanuit `allowFrom`, `groupAllowFrom` en per-groep `allowFrom` met `accessGroup:<name>`.
- Runtime-opmerking: als `channels.line` volledig ontbreekt, valt de runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien er zo uit:

- Gebruiker: `U` + 32 hextekens
- Groep: `C` + 32 hextekens
- Room: `R` + 32 hextekens

## Berichtgedrag

- Tekst wordt opgesplitst op 5000 tekens.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet naar Flex
  cards.
- Streamingreacties worden gebufferd; LINE ontvangt volledige chunks met een laadanimatie
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

De LINE-Plugin levert ook een `/card`-commando mee voor Flex message-presets:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt ACP-conversatiebindingen (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindt de huidige LINE-chat aan een ACP-sessie zonder een child thread te maken.
- Geconfigureerde ACP-bindingen en actieve conversatiegebonden ACP-sessies werken op LINE zoals op andere conversatiekanalen.

Zie [ACP-agents](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE-Plugin ondersteunt het verzenden van afbeeldingen, video's en audiobestanden via de agentberichttool. Media worden verzonden via het LINE-specifieke afleverpad met passende preview- en trackingafhandeling:

- **Afbeeldingen**: verzonden als LINE-afbeeldingsberichten met automatische previewgeneratie.
- **Video's**: verzonden met expliciete afhandeling van preview en contenttype.
- **Audio**: verzonden als LINE-audioberichten.

Uitgaande media-URL's moeten openbare HTTPS-URL's zijn. OpenClaw valideert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert loopback-, link-local- en privé-netwerkdoelen.

Generieke mediaverzendingen vallen terug op de bestaande route voor alleen afbeeldingen wanneer er geen LINE-specifiek pad beschikbaar is.

## Probleemoplossing

- **Webhook-verificatie mislukt:** zorg dat de Webhook-URL HTTPS gebruikt en dat
  `channelSecret` overeenkomt met de LINE-console.
- **Geen inkomende events:** controleer of het Webhook-pad overeenkomt met `channels.line.webhookPath`
  en of de Gateway bereikbaar is vanaf LINE.
- **Mediadownloadfouten:** verhoog `channels.line.mediaMaxMb` als media de
  standaardlimiet overschrijden.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Pairing](/nl/channels/pairing) — DM-authenticatie en pairingflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en mention gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
