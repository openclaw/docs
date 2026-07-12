---
read_when:
    - Je wilt OpenClaw verbinden met LINE
    - Je moet de LINE Webhook en referenties instellen
    - Je wilt LINE-specifieke berichtopties
summary: Installatie, configuratie en gebruik van de LINE Messaging API-plugin
title: LINE
x-i18n:
    generated_at: "2026-07-12T08:37:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE maakt verbinding met OpenClaw via de LINE Messaging API. De plugin draait als Webhook-ontvanger op de Gateway en gebruikt je kanaaltoegangstoken + kanaalgeheim voor authenticatie.

Status: officiële plugin, afzonderlijk geïnstalleerd. Directe berichten, groepschats, media, locaties, Flex-berichten, sjabloonberichten en snelle antwoorden worden ondersteund. Reacties en threads worden niet ondersteund.

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
3. Kopieer het **Channel access token** en **Channel secret** uit de kanaalinstellingen.
4. Schakel **Use webhook** in bij de Messaging API-instellingen.
5. Stel de Webhook-URL in op je Gateway-eindpunt (HTTPS vereist):

```text
https://gateway-host/line/webhook
```

De Gateway beantwoordt de Webhook-verificatie van LINE (GET) en bevestigt ondertekende inkomende gebeurtenissen (POST) onmiddellijk na validatie van de handtekening en payload; de verwerking door de agent gaat asynchroon verder.
Als je een aangepast pad nodig hebt, stel je `channels.line.webhookPath` of `channels.line.accounts.<id>.webhookPath` in en werk je de URL dienovereenkomstig bij.

Beveiligingsopmerkingen:

- De handtekeningverificatie van LINE is afhankelijk van de berichttekst (HMAC over de onbewerkte berichttekst), daarom past OpenClaw vóór authenticatie een strikte limiet voor de berichttekst (64 KB) en een leestime-out toe.
- OpenClaw verwerkt Webhook-gebeurtenissen vanuit de geverifieerde onbewerkte aanvraagbytes. Door upstream-middleware getransformeerde `req.body`-waarden worden genegeerd om de integriteit van de handtekening te waarborgen.

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

`tokenFile` en `secretFile` moeten naar gewone bestanden verwijzen. Symbolische koppelingen worden geweigerd.
Inline-configuratiewaarden hebben voorrang op bestanden; omgevingsvariabelen zijn de laatste terugvaloptie voor het standaardaccount.

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

Directe berichten gebruiken standaard koppeling. Onbekende afzenders krijgen een koppelingscode en hun berichten worden genegeerd totdat ze zijn goedgekeurd:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Toelatingslijsten en beleidsregels:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (standaard `pairing`)
- `channels.line.allowFrom`: toegestane LINE-gebruikers-ID's voor DM's; `dmPolicy: "open"` vereist `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (standaard `allowlist`)
- `channels.line.groupAllowFrom`: toegestane LINE-gebruikers-ID's voor groepen
- Overschrijvingen per groep: `channels.line.groups.<groupId>.allowFrom` (plus `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Naar statische afzendertoegangsgroepen kan vanuit `allowFrom`, `groupAllowFrom` en `allowFrom` per groep worden verwezen met `accessGroup:<name>`; zie [Toegangsgroepen](/nl/channels/access-groups).
- Opmerking over de uitvoering: als `channels.line` volledig ontbreekt, valt de uitvoering voor groepscontroles terug op `groupPolicy="allowlist"` (zelfs als `channels.defaults.groupPolicy` is ingesteld).

LINE-ID's zijn hoofdlettergevoelig. Geldige ID's zien er als volgt uit:

- Gebruiker: `U` + 32 hexadecimale tekens
- Groep: `C` + 32 hexadecimale tekens
- Ruimte: `R` + 32 hexadecimale tekens

## Berichtgedrag

- Tekst wordt opgesplitst in delen van 5000 tekens.
- Markdown-opmaak wordt verwijderd; codeblokken en tabellen worden waar mogelijk omgezet in Flex-kaarten.
- Streamingantwoorden worden gebufferd; LINE ontvangt volledige delen met een laadanimatie terwijl de agent werkt.
- Mediadownloads worden beperkt door `channels.line.mediaMaxMb` (standaard 10).
- Inkomende media worden opgeslagen onder `~/.openclaw/media/inbound/` voordat ze aan de agent worden doorgegeven, overeenkomstig de gedeelde mediaopslag die door andere kanaalplugins wordt gebruikt.

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
        contents: {/* Flex payload */},
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

De LINE-plugin levert ook een `/card`-opdracht voor voorinstellingen van Flex-berichten:

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP-ondersteuning

LINE ondersteunt gesprekskoppelingen met ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` koppelt de huidige LINE-chat aan een ACP-sessie zonder een onderliggende thread te maken.
- Geconfigureerde ACP-koppelingen en actieve, aan gesprekken gekoppelde ACP-sessies werken op LINE net als op andere gesprekskanalen.

Zie [ACP-agenten](/nl/tools/acp-agents) voor meer informatie.

## Uitgaande media

De LINE-plugin verzendt afbeeldingen, video's en audio via het berichtgereedschap van de agent:

- **Afbeeldingen**: verzonden als LINE-afbeeldingsberichten; de voorbeeldafbeelding gebruikt standaard de media-URL.
- **Video's**: vereisen een voorbeeldafbeelding; stel `channelData.line.previewImageUrl` in op een afbeeldings-URL.
- **Audio**: verzonden als LINE-audioberichten; de duur is standaard 60 seconden, tenzij `channelData.line.durationMs` is ingesteld.

Het mediatype wordt overgenomen uit `channelData.line.mediaKind` wanneer dit is ingesteld, en anders afgeleid uit de overige LINE-opties of het bestandsachtervoegsel van de URL, met afbeelding als terugvaloptie.

URL's voor uitgaande media moeten openbare HTTPS-URL's van maximaal 2000 tekens zijn. OpenClaw valideert de doelhostnaam voordat de URL aan LINE wordt doorgegeven en weigert local loopback-, link-local- en privénetwerkdoelen.

Algemene mediaverzendingen zonder LINE-specifieke opties gebruiken de afbeeldingsroute.

## Problemen oplossen

- **Webhook-verificatie mislukt:** zorg dat de Webhook-URL HTTPS gebruikt en dat `channelSecret` overeenkomt met de LINE Console.
- **Geen inkomende gebeurtenissen:** controleer of het Webhook-pad overeenkomt met `channels.line.webhookPath` en of de Gateway bereikbaar is vanuit LINE.
- **Fouten bij het downloaden van media:** verhoog `channels.line.mediaMaxMb` als media de standaardlimiet overschrijden.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsproces
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vereiste vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiliging aanscherpen
