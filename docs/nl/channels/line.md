---
read_when:
    - Je wilt OpenClaw verbinden met LINE
    - Je moet de LINE-webhook en aanmeldgegevens instellen
    - Je wilt LINE-specifieke berichtopties
summary: Installatie, configuratie en gebruik van de LINE Messaging API-plugin
title: LINE
x-i18n:
    generated_at: "2026-07-16T15:18:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE maakt via de LINE Messaging API verbinding met OpenClaw. De plugin draait als webhook-
ontvanger op de Gateway en gebruikt je kanaaltoegangstoken + kanaalgeheim voor
authenticatie.

Status: officiële plugin, afzonderlijk geïnstalleerd. Directe berichten, groepschats, media,
locaties, Flex-berichten, sjabloonberichten en snelle antwoorden worden ondersteund.
Reacties en threads worden niet ondersteund.

## Installeren

Installeer LINE voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/line
```

Lokale checkout (bij uitvoering vanuit een git-repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Instellen

1. Maak een LINE Developers-account en open de Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Maak (of kies) een Provider en voeg een **Messaging API**-kanaal toe.
3. Kopieer de **Channel access token** en **Channel secret** uit de kanaalinstellingen.
4. Schakel **Use webhook** in bij de Messaging API-instellingen.
5. Stel de webhook-URL in op je Gateway-eindpunt (HTTPS vereist):

```text
https://gateway-host/line/webhook
```

De Gateway beantwoordt de webhookverificatie van LINE (GET) en bevestigt ondertekende
inkomende gebeurtenissen (POST) direct na validatie van de handtekening en payload; de verwerking
door de agent gaat asynchroon verder.
Als je een aangepast pad nodig hebt, stel je `channels.line.webhookPath` of
`channels.line.accounts.<id>.webhookPath` in en pas je de URL dienovereenkomstig aan.

Beveiligingsopmerkingen:

- De handtekeningverificatie van LINE is afhankelijk van de body (HMAC over de onbewerkte body), daarom past OpenClaw vóór authenticatie een strikte limiet voor de body (64 KB) en een leestime-out toe.
- OpenClaw verwerkt webhookgebeurtenissen vanuit de geverifieerde onbewerkte bytes van het verzoek. Door upstream-middleware getransformeerde `req.body`-waarden worden genegeerd om de integriteit van de handtekening te waarborgen.

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

Configuratie voor openbare directe berichten:

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

`tokenFile` en `secretFile` moeten naar gewone bestanden verwijzen. Symbolische koppelingen worden geweigerd.
Inline configuratiewaarden hebben voorrang op bestanden; omgevingsvariabelen zijn het laatste alternatief voor het standaardaccount.

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

Directe berichten gebruiken standaard koppeling. Onbekende afzenders krijgen een koppelingscode en hun
berichten worden genegeerd totdat ze zijn goedgekeurd:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Toelatingslijsten en beleidsregels:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (standaard `pairing`)
- `channels.line.allowFrom`: toegestane LINE-gebruikers-ID's voor directe berichten; `dmPolicy: "open"` vereist `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (standaard `allowlist`)
- `channels.line.groupAllowFrom`: toegestane LINE-gebruikers-ID's voor groepen; vermeldingen voor directe berichten in `allowFrom` verlenen groepsafzenders geen toegang
- Overschrijvingen per groep: `channels.line.groups.<groupId>.allowFrom` (plus `enabled`, `requireMention`, `systemPrompt`, `skills`). Stel bij
  `groupPolicy: "allowlist"` `groupAllowFrom` of `allowFrom` per groep in; een lege groepstoelatingslijst blokkeert groepsberichten, zelfs wanneer directe berichten openbaar zijn.
- Er kan vanuit `allowFrom`, `groupAllowFrom` en `allowFrom` per groep met `accessGroup:<name>` naar statische toegangsgroepen voor afzenders worden verwezen; zie [Toegangsgroepen](/nl/channels/access-groups).
- Runtime-opmerking: als `channels.line` volledig ontbreekt, valt de runtime voor groepscontroles terug op `groupPolicy="allowlist"` (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien er als volgt uit:

- Gebruiker: `U` + 32 hexadecimale tekens
- Groep: `C` + 32 hexadecimale tekens
- Ruimte: `R` + 32 hexadecimale tekens

## Berichtgedrag

- Tekst wordt opgesplitst in delen van 5000 tekens.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk
  omgezet in Flex-kaarten.
- Streamingreacties worden gebufferd; LINE ontvangt volledige delen met een laadanimatie
  terwijl de agent bezig is.
- Mediadownloads worden beperkt door `channels.line.mediaMaxMb` (standaard 10).
- Inkomende media worden opgeslagen onder `~/.openclaw/media/inbound/` voordat ze aan
  de agent worden doorgegeven, overeenkomstig de gedeelde mediaopslag die andere kanaalplugins gebruiken.

## Kanaalgegevens (uitgebreide berichten)

Gebruik `channelData.line` om snelle antwoorden, locaties, Flex-kaarten of
sjabloonberichten te verzenden.

```json5
{
  text: "Alsjeblieft",
  channelData: {
    line: {
      quickReplies: ["Status", "Hulp"],
      location: {
        title: "Kantoor",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Statuskaart",
        contents: {/* Flex-payload */},
      },
      templateMessage: {
        type: "confirm",
        text: "Doorgaan?",
        confirmLabel: "Ja",
        confirmData: "yes",
        cancelLabel: "Nee",
        cancelData: "no",
      },
    },
  },
}
```

De LINE-plugin bevat ook een `/card`-opdracht voor voorinstellingen van Flex-berichten:

```text
/card info "Welkom" "Bedankt voor je deelname!"
```

## ACP-ondersteuning

LINE ondersteunt gesprekskoppelingen via ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` koppelt de huidige LINE-chat aan een ACP-sessie zonder een onderliggende thread te maken.
- Geconfigureerde ACP-koppelingen en actieve, aan gesprekken gekoppelde ACP-sessies werken op LINE zoals op andere gesprekskanalen.

Zie [ACP-agents](/nl/tools/acp-agents) voor details.

## Uitgaande media

De LINE-plugin verzendt afbeeldingen, video's en audio via de berichtentool van de agent:

- **Afbeeldingen**: verzonden als LINE-afbeeldingsberichten; de voorbeeldafbeelding gebruikt standaard de media-URL.
- **Video's**: vereisen een voorbeeldafbeelding; stel `channelData.line.previewImageUrl` in op een afbeeldings-URL.
- **Audio**: verzonden als LINE-audioberichten; de duur is standaard 60 seconden, tenzij `channelData.line.durationMs` is ingesteld.

Het mediatype wordt overgenomen uit `channelData.line.mediaKind` wanneer dit is ingesteld; anders wordt het afgeleid
uit de overige LINE-opties of het bestandsachtervoegsel van de URL, waarbij afbeelding het standaardalternatief is.

URL's voor uitgaande media moeten openbare HTTPS-URL's van maximaal 2000 tekens zijn. OpenClaw
valideert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert loopback-,
link-local- en privénetwerkdoelen.

Algemene mediaverzendingen zonder LINE-specifieke opties gebruiken de afbeeldingsroute.

## Problemen oplossen

- **Webhookverificatie mislukt:** controleer of de webhook-URL HTTPS gebruikt en of
  `channelSecret` overeenkomt met de LINE-console.
- **Geen inkomende gebeurtenissen:** controleer of het webhookpad overeenkomt met `channels.line.webhookPath`
  en of de Gateway bereikbaar is vanuit LINE.
- **Fouten bij het downloaden van media:** verhoog `channels.line.mediaMaxMb` als media de
  standaardlimiet overschrijden.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — authenticatie van directe berichten en koppelingsproces
- [Groepen](/nl/channels/groups) — gedrag van groepschats en toegangscontrole via vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiligingsversterking
