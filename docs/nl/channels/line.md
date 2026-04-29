---
read_when:
    - Je wilt OpenClaw verbinden met LINE
    - Je hebt LINE Webhook + referentieconfiguratie nodig
    - Je wilt LINE-specifieke berichtopties
summary: Installatie, configuratie en gebruik van de LINE Messaging API-Plugin
title: REGEL
x-i18n:
    generated_at: "2026-04-29T22:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE maakt verbinding met OpenClaw via de LINE Messaging API. De Plugin draait als Webhook-ontvanger op de Gateway en gebruikt je channel access token + channel secret voor authenticatie.

Status: gebundelde Plugin. Directe berichten, groepschats, media, locaties, Flex-berichten, sjabloonberichten en snelle antwoorden worden ondersteund. Reacties en threads worden niet ondersteund.

## Gebundelde Plugin

LINE wordt geleverd als gebundelde Plugin in huidige OpenClaw-releases, dus normale verpakte builds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die LINE uitsluit, installeer dan een huidig npm-pakket zodra er een is gepubliceerd:

```bash
openclaw plugins install @openclaw/line
```

Als npm meldt dat het pakket van OpenClaw is verouderd of ontbreekt, gebruik dan een huidige verpakte OpenClaw-build of een lokale checkout totdat de npm-pakkettrein is bijgewerkt.

Lokale checkout (bij uitvoering vanuit een git-repo):

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

De Gateway reageert op LINE’s Webhook-verificatie (GET) en inkomende gebeurtenissen (POST). Als je een aangepast pad nodig hebt, stel dan `channels.line.webhookPath` of `channels.line.accounts.<id>.webhookPath` in en werk de URL dienovereenkomstig bij.

Beveiligingsopmerking:

- LINE-handtekeningverificatie is afhankelijk van de body (HMAC over de onbewerkte body), dus OpenClaw past strikte bodylimieten en een time-out toe vóór authenticatie en vóór verificatie.
- OpenClaw verwerkt Webhook-gebeurtenissen vanuit de geverifieerde onbewerkte request-bytes. Door upstream-middleware getransformeerde `req.body`-waarden worden genegeerd voor veiligheid van handtekeningintegriteit.

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

## Toegangsbeheer

Directe berichten gebruiken standaard koppeling. Onbekende afzenders krijgen een koppelingscode en hun berichten worden genegeerd totdat ze zijn goedgekeurd.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Toelatingslijsten en beleid:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: toegestane LINE-gebruikers-ID’s voor DM’s
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: toegestane LINE-gebruikers-ID’s voor groepen
- Overschrijvingen per groep: `channels.line.groups.<groupId>.allowFrom`
- Runtime-opmerking: als `channels.line` volledig ontbreekt, valt de runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID’s zijn hoofdlettergevoelig. Geldige ID’s zien er zo uit:

- Gebruiker: `U` + 32 hex-tekens
- Groep: `C` + 32 hex-tekens
- Ruimte: `R` + 32 hex-tekens

## Berichtgedrag

- Tekst wordt opgesplitst in stukken van 5000 tekens.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet naar Flex-kaarten.
- Streaming-antwoorden worden gebufferd; LINE ontvangt volledige stukken met een laadanimatie terwijl de agent werkt.
- Mediadownloads worden begrensd door `channels.line.mediaMaxMb` (standaard 10).
- Inkomende media worden opgeslagen onder `~/.openclaw/media/inbound/` voordat ze aan de agent worden doorgegeven, in overeenstemming met de gedeelde mediaopslag die door andere gebundelde kanaal-Plugins wordt gebruikt.

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

De LINE-Plugin levert ook een `/card`-opdracht voor Flex-berichtpresets:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt ACP-conversatiebindingen (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindt de huidige LINE-chat aan een ACP-sessie zonder een child-thread te maken.
- Geconfigureerde ACP-bindingen en actieve conversatiegebonden ACP-sessies werken op LINE zoals op andere conversatiekanalen.

Zie [ACP-agenten](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE-Plugin ondersteunt het verzenden van afbeeldingen, video’s en audiobestanden via de berichttool van de agent. Media worden verzonden via het LINE-specifieke afleverpad met passende afhandeling van previews en tracking:

- **Afbeeldingen**: verzonden als LINE-afbeeldingsberichten met automatische previewgeneratie.
- **Video’s**: verzonden met expliciete afhandeling van preview en contenttype.
- **Audio**: verzonden als LINE-audioberichten.

Uitgaande media-URL’s moeten openbare HTTPS-URL’s zijn. OpenClaw valideert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert local loopback-, link-local- en private-network-doelen.

Algemene mediaverzending valt terug op de bestaande route voor alleen afbeeldingen wanneer er geen LINE-specifiek pad beschikbaar is.

## Probleemoplossing

- **Webhook-verificatie mislukt:** zorg ervoor dat de Webhook-URL HTTPS gebruikt en dat de `channelSecret` overeenkomt met de LINE-console.
- **Geen inkomende gebeurtenissen:** controleer of het Webhook-pad overeenkomt met `channels.line.webhookPath` en of de Gateway bereikbaar is vanaf LINE.
- **Fouten bij mediadownloads:** verhoog `channels.line.mediaMaxMb` als media de standaardlimiet overschrijden.

## Gerelateerd

- [Kanaaloverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsstroom
- [Groepen](/nl/channels/groups) — gedrag van groepschats en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
