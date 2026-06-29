---
read_when:
    - U wilt OpenClaw verbinden met LINE
    - U moet de LINE Webhook en inloggegevens configureren
    - U hebt LINE-specifieke berichtparameters nodig
summary: Installatie, configuratie en gebruik van de Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE maakt verbinding met OpenClaw via de LINE Messaging API. De Plugin werkt als webhook-ontvanger
op de Gateway en gebruikt uw channel access token + channel secret voor
authenticatie.

Status: laadbare Plugin. Privéberichten, groepschats, media, locaties, Flex
messages, template messages en snelle antwoorden worden ondersteund. Reacties en threads
worden niet ondersteund.

## Installatie

Installeer LINE voordat u het kanaal configureert:

```bash
openclaw plugins install @openclaw/line
```

Lokale werkkopie (bij uitvoeren vanuit een git-repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuratie

1. Maak een LINE Developers-account aan en open de Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Maak (of selecteer) een Provider en voeg een **Messaging API**-kanaal toe.
3. Kopieer **Channel access token** en **Channel secret** uit de kanaalinstellingen.
4. Schakel **Use webhook** in de Messaging API-instellingen in.
5. Stel de webhook-URL in voor uw Gateway-eindpunt (HTTPS vereist):

```
https://gateway-host/line/webhook
```

De Gateway beantwoordt de webhook-verificatie van LINE (GET) en bevestigt ondertekende
binnenkomende gebeurtenissen (POST) direct na controle van handtekening en payload; verwerking
door de agent gaat asynchroon verder.
Als een aangepast pad nodig is, stelt u `channels.line.webhookPath` of
`channels.line.accounts.<id>.webhookPath` in en werkt u de URL overeenkomstig bij.

Beveiligingsopmerking:

- LINE-handtekeningverificatie hangt af van de aanvraagbody (HMAC over de ruwe body), daarom past OpenClaw strikte beperkingen op bodygrootte en een time-out vóór authenticatie toe vóór de verificatie.
- OpenClaw verwerkt webhook-gebeurtenissen uit geverifieerde ruwe aanvraagbytes. `req.body`-waarden die door upstream-middleware zijn getransformeerd, worden genegeerd om de integriteit van de handtekening te behouden.

## Configuratie

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

Configuratie voor open privéberichten:

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

`tokenFile` en `secretFile` moeten naar gewone bestanden verwijzen. Symbolische links worden geweigerd.

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

Privéberichten vereisen standaard koppeling. Onbekende afzenders ontvangen een koppelingscode en hun
berichten worden genegeerd tot goedkeuring.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Toelatingslijsten en beleidsregels:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: toegestane LINE-gebruikers-ID's voor privéberichten; `dmPolicy: "open"` vereist `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: toegestane LINE-gebruikers-ID's voor groepen
- Overschrijvingen per groep: `channels.line.groups.<groupId>.allowFrom`
- Statische toegangsgroepen voor afzenders kunnen vanuit `allowFrom`, `groupAllowFrom` en groepsspecifieke `allowFrom` worden gerefereerd via `accessGroup:<name>`.
- Opmerking over runtime: als `channels.line` volledig ontbreekt, valt de runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien er zo uit:

- Gebruiker: `U` + 32 hexadecimale tekens
- Groep: `C` + 32 hexadecimale tekens
- Ruimte: `R` + 32 hexadecimale tekens

## Berichtgedrag

- Tekst wordt opgesplitst in fragmenten van 5000 tekens.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet naar Flex
  cards.
- Streaming-antwoorden worden gebufferd; LINE ontvangt volledige fragmenten met een laadanimatie
  terwijl de agent actief is.
- Mediadownloads zijn beperkt door `channels.line.mediaMaxMb` (standaard 10).
- Binnenkomende media worden opgeslagen in `~/.openclaw/media/inbound/` voordat ze aan de
  agent worden doorgegeven, in overeenstemming met de algemene mediaopslag die door andere ingebouwde kanaal-Plugins
  wordt gebruikt.

## Kanaalgegevens (uitgebreide berichten)

Gebruik `channelData.line` om snelle antwoorden, locaties, Flex cards of template
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

De LINE-Plugin wordt ook geleverd met de opdracht `/card` voor Flex messages-presets:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt ACP-bindingen voor gesprekken (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindt de huidige LINE-chat aan een ACP-sessie zonder een child thread te maken.
- Geconfigureerde ACP-bindingen en actieve ACP-sessies die aan een gesprek zijn gebonden, werken in LINE hetzelfde als in andere gesprekskanalen.

Zie [ACP-agenten](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE-Plugin ondersteunt het verzenden van afbeeldingen, video's en audiobestanden via de berichtentool van de agent. Media wordt verzonden via het LINE-specifieke afleverpad met passende verwerking van previews en tracking:

- **Afbeeldingen**: verzonden als LINE-afbeeldingsberichten met automatische previewgeneratie.
- **Video**: verzonden met expliciete verwerking van preview en contenttype.
- **Audio**: verzonden als LINE-audioberichten.

URL's voor uitgaande media moeten openbare HTTPS-URL's zijn. OpenClaw controleert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert local loopback-, link-local- en particuliere netwerkdoelen.

Algemene mediaverzendingen vallen terug op de bestaande route alleen voor afbeeldingen wanneer het LINE-specifieke pad niet beschikbaar is.

## Probleemoplossing

- **Webhook-verificatie mislukt:** zorg ervoor dat de webhook-URL HTTPS gebruikt en
  `channelSecret` overeenkomt met de LINE console.
- **Geen binnenkomende gebeurtenissen:** bevestig dat het webhook-pad overeenkomt met `channels.line.webhookPath`
  en dat de Gateway bereikbaar is vanuit LINE.
- **Fouten bij het downloaden van media:** verhoog `channels.line.mediaMaxMb` als media de
  standaardlimiet overschrijdt.

## Zie ook

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — authenticatie van privéberichten en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en beperking op vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en versterking van beveiliging
