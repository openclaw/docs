---
read_when:
    - Je wilt OpenClaw verbinden met LINE
    - Je hebt LINE Webhook + configuratie van referentiegegevens nodig
    - Je wilt LINE-specifieke berichtopties
summary: Installatie, configuratie en gebruik van de LINE Messaging API Plugin
title: REGEL
x-i18n:
    generated_at: "2026-05-06T09:03:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE maakt verbinding met OpenClaw via de LINE Messaging API. De plugin draait als Webhook
ontvanger op de Gateway en gebruikt je kanaaltoegangstoken + kanaalgeheim voor
authenticatie.

Status: downloadbare plugin. Directe berichten, groepschats, media, locaties, Flex
berichten, templateberichten en snelle antwoorden worden ondersteund. Reacties en threads
worden niet ondersteund.

## Installeren

Installeer LINE voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/line
```

Lokale checkout (bij uitvoeren vanuit een git-repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Instellen

1. Maak een LINE Developers-account en open de Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Maak (of kies) een Provider en voeg een **Messaging API**-kanaal toe.
3. Kopieer het **Channel access token** en **Channel secret** uit de kanaalinstellingen.
4. Schakel **Use webhook** in de Messaging API-instellingen in.
5. Stel de Webhook-URL in op je Gateway-eindpunt (HTTPS vereist):

```
https://gateway-host/line/webhook
```

De Gateway reageert op LINE's Webhook-verificatie (GET) en inkomende gebeurtenissen (POST).
Als je een aangepast pad nodig hebt, stel dan `channels.line.webhookPath` of
`channels.line.accounts.<id>.webhookPath` in en werk de URL overeenkomstig bij.

Beveiligingsopmerking:

- LINE-handtekeningverificatie is afhankelijk van de body (HMAC over de ruwe body), dus OpenClaw past strikte bodylimieten vóór authenticatie en een timeout toe vóór verificatie.
- OpenClaw verwerkt Webhook-gebeurtenissen vanuit de geverifieerde ruwe verzoekbytes. Door upstream-middleware getransformeerde `req.body`-waarden worden genegeerd voor veiligheid van handtekeningintegriteit.

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

Token-/geheimbestanden:

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

`tokenFile` en `secretFile` moeten naar reguliere bestanden verwijzen. Symlinks worden geweigerd.

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

Toelatingslijsten en beleidsregels:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE-gebruikers-ID's op de toelatingslijst voor DM's; `dmPolicy: "open"` vereist `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE-gebruikers-ID's op de toelatingslijst voor groepen
- Overschrijvingen per groep: `channels.line.groups.<groupId>.allowFrom`
- Runtime-opmerking: als `channels.line` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien eruit als:

- Gebruiker: `U` + 32 hextekens
- Groep: `C` + 32 hextekens
- Ruimte: `R` + 32 hextekens

## Berichtgedrag

- Tekst wordt opgesplitst bij 5000 tekens.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet naar Flex
  kaarten.
- Streamingreacties worden gebufferd; LINE ontvangt volledige stukken met een laadanimatie
  terwijl de agent werkt.
- Mediadownloads worden begrensd door `channels.line.mediaMaxMb` (standaard 10).
- Inkomende media wordt opgeslagen onder `~/.openclaw/media/inbound/` voordat deze wordt doorgegeven
  aan de agent, overeenkomstig de gedeelde mediaopslag die door andere gebundelde kanaalplugins
  wordt gebruikt.

## Kanaalgegevens (rijke berichten)

Gebruik `channelData.line` om snelle antwoorden, locaties, Flex-kaarten of templateberichten
te verzenden.

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

De LINE-plugin levert ook een `/card`-opdracht voor Flex-berichtpresets:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt ACP-conversatiebindingen (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindt de huidige LINE-chat aan een ACP-sessie zonder een child thread te maken.
- Geconfigureerde ACP-bindingen en actieve conversatiegebonden ACP-sessies werken op LINE zoals op andere conversatiekanalen.

Zie [ACP-agenten](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE-plugin ondersteunt het verzenden van afbeeldingen, video's en audiobestanden via de berichttool van de agent. Media wordt verzonden via het LINE-specifieke afleverpad met passende verwerking voor preview en tracking:

- **Afbeeldingen**: verzonden als LINE-afbeeldingsberichten met automatische previewgeneratie.
- **Video's**: verzonden met expliciete verwerking van preview en contenttype.
- **Audio**: verzonden als LINE-audioberichten.

Uitgaande media-URL's moeten openbare HTTPS-URL's zijn. OpenClaw valideert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert loopback-, link-local- en privé-netwerkdoelen.

Algemene mediaverzendingen vallen terug op de bestaande route voor alleen afbeeldingen wanneer er geen LINE-specifiek pad beschikbaar is.

## Probleemoplossing

- **Webhook-verificatie mislukt:** zorg ervoor dat de Webhook-URL HTTPS gebruikt en dat het
  `channelSecret` overeenkomt met de LINE-console.
- **Geen inkomende gebeurtenissen:** bevestig dat het Webhook-pad overeenkomt met `channels.line.webhookPath`
  en dat de Gateway bereikbaar is vanuit LINE.
- **Mediadownloadfouten:** verhoog `channels.line.mediaMaxMb` als media de
  standaardlimiet overschrijdt.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsstroom
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingscontrole
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
