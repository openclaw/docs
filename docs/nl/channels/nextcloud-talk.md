---
read_when:
    - Werken aan functies voor het Nextcloud Talk-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T15:10:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk is een downloadbare kanaalplugin (`@openclaw/nextcloud-talk`) die OpenClaw via een Talk-webhookbot verbindt met een zelfgehoste Nextcloud-instantie. Directe berichten, ruimtes, reacties en Markdown-berichten worden ondersteund; media worden als URL's verzonden.

## Installeren

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Gebruik de kale pakketspecificatie om de huidige officiële releasetag te volgen. Zet alleen een exacte versie vast als je een reproduceerbare installatie nodig hebt.

Vanuit een lokale checkout (ontwikkelworkflows):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Start de Gateway na de installatie opnieuw. Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie (beginners)

1. Installeer de plugin (hierboven).
2. Maak op je Nextcloud-server een bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Behoud `--feature response`: zonder dit mislukken uitgaande antwoorden met 401. Herstel een bestaande bot met `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Schakel de bot in via de instellingen van de doelruimte.
4. Configureer OpenClaw:
   - Configuratie: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Of omgeving: `NEXTCLOUD_TALK_BOT_SECRET` (alleen standaardaccount)

   CLI-configuratie (`--url`/`--token` zijn aliassen voor de expliciete velden; `nc-talk` en `nc` werken als kana308liassen):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Gelijkwaardige expliciete velden:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Geheim uit een bestand:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Start de Gateway opnieuw (of rond de configuratie af).

Minimale configuratie:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Opmerkingen

- Bots kunnen geen directe berichten starten. De gebruiker moet de bot eerst een bericht sturen.
- De webhook-URL moet bereikbaar zijn vanaf de Nextcloud-server; stel `webhookPublicUrl` in wanneer de Gateway zich achter een proxy bevindt. Webhook-verzoeken worden met het botgeheim ondertekend via HMAC-SHA256; ongeldige handtekeningen worden geweigerd en beperkt op basis van de aanvraagsnelheid.
- Media-uploads worden niet ondersteund door de bot-API; uitgaande media worden toegevoegd als een `Attachment: <url>`-regel.
- De webhook-payload maakt geen onderscheid tussen directe berichten en ruimtes; stel `apiUser` + `apiPassword` in om opzoekingen van het ruimtetype in te schakelen (ongeveer 5 minuten gecachet). Zonder deze instellingen wordt elk gesprek als een ruimte behandeld.
- Uitgaande verzoeken lopen via de SSRF-beveiliging. Meld je met `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` expliciet aan voor een Nextcloud-host op een vertrouwd privé/intern netwerk.
- Als `apiUser`/`apiPassword` en `webhookPublicUrl` zijn ingesteld, controleert `openclaw channels status` de bot en waarschuwt deze wanneer de functie `response` ontbreekt.

## Toegangsbeheer (directe berichten)

- Standaard: `channels.nextcloud-talk.dmPolicy = "pairing"`. Onbekende afzenders krijgen een koppelingscode.
- Goedkeuren via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Openbare directe berichten: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` komt alleen overeen met Nextcloud-gebruikers-ID's (in kleine letters); weergavenamen worden genegeerd.

## Ruimtes (groepen)

- Standaard: `channels.nextcloud-talk.groupPolicy = "allowlist"` (vermelding vereist).
- Sta ruimtes toe met `channels.nextcloud-talk.rooms`, met het ruimtetoken als sleutel; `"*"` stelt een standaardwaarde met jokerteken in:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Sleutels per ruimte: `requireMention` (standaard true), `enabled` (false schakelt de ruimte uit), `allowFrom` (lijst met toegestane afzenders per ruimte), `tools` (overschrijvingen voor toestaan/weigeren van tools), `skills` (beperk geladen Skills), `systemPrompt`.
- Houd de lijst met toegestane ruimtes leeg of stel `channels.nextcloud-talk.groupPolicy="disabled"` in om geen ruimtes toe te staan.

## Mogelijkheden

| Functie             | Status             |
| ------------------- | ------------------ |
| Directe berichten   | Ondersteund        |
| Ruimtes             | Ondersteund        |
| Threads             | Niet ondersteund   |
| Media               | Alleen URL's       |
| Reacties            | Ondersteund        |
| Systeemeigen opdrachten | Niet ondersteund |

## Configuratiereferentie (Nextcloud Talk)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.nextcloud-talk.enabled`: het opstarten van het kanaal in-/uitschakelen.
- `channels.nextcloud-talk.baseUrl`: URL van de Nextcloud-instantie.
- `channels.nextcloud-talk.botSecret`: gedeeld botgeheim (tekenreeks of verwijzing naar een geheim).
- `channels.nextcloud-talk.botSecretFile`: pad naar een regulier bestand met het geheim. Symbolische koppelingen worden geweigerd.
- `channels.nextcloud-talk.apiUser`: API-gebruiker voor ruimteopzoekingen (detectie van directe berichten) en de statuscontrole.
- `channels.nextcloud-talk.apiPassword`: API-/app-wachtwoord voor ruimteopzoekingen.
- `channels.nextcloud-talk.apiPasswordFile`: bestandspad voor het API-wachtwoord.
- `channels.nextcloud-talk.webhookPort`: poort voor de webhook-listener (standaard: 8788).
- `channels.nextcloud-talk.webhookHost`: webhook-host (standaard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: webhook-pad (standaard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: extern bereikbare webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: koppelen). `open` vereist `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: lijst met toegestane directe berichten (gebruikers-ID's).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (standaard: lijst met toegestane waarden).
- `channels.nextcloud-talk.groupAllowFrom`: lijst met toegestane afzenders in ruimtes (gebruikers-ID's); valt terug op `allowFrom` wanneer niet ingesteld.
- `channels.nextcloud-talk.rooms`: instellingen en lijst met toegestane waarden per ruimte (zie hierboven).
- Er kan vanuit `allowFrom` en `groupAllowFrom` met `accessGroup:<name>` worden verwezen naar statische toegangsgroepen voor afzenders.
- `channels.nextcloud-talk.historyLimit`: limiet voor groepsgeschiedenis (0 schakelt dit uit).
- `channels.nextcloud-talk.dmHistoryLimit`: limiet voor de geschiedenis van directe berichten (0 schakelt dit uit).
- `channels.nextcloud-talk.dms`: overschrijvingen per direct bericht, met gebruikers-ID als sleutel (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: grootte van uitgaande tekstsegmenten in tekens (standaard: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (standaard) of `newline` om op lege regels (alineagrenzen) te splitsen voordat op lengte wordt gesegmenteerd.
- `channels.nextcloud-talk.streaming.block.enabled`: blokstreaming voor dit kanaal in- of uitschakelen.
- `channels.nextcloud-talk.streaming.block.coalesce`: afstemming van het samenvoegen bij blokstreaming.
- `channels.nextcloud-talk.responsePrefix`: voorvoegsel voor uitgaande antwoorden.
- `channels.nextcloud-talk.markdown.tables`: weergavemodus voor Markdown-tabellen (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: limiet voor inkomende media (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: privé/interne Nextcloud-hosts door de SSRF-beveiliging toestaan.
- `channels.nextcloud-talk.accounts.<id>`: overschrijvingen per account (dezelfde sleutels); `defaultAccount` kiest de standaardwaarde. Omgevingsvariabelen `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` gelden alleen voor het standaardaccount.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — authenticatie van directe berichten en koppelingsproces
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vereiste vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en versterking
