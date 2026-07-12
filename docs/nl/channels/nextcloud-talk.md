---
read_when:
    - Werken aan functies voor het Nextcloud Talk-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T08:36:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk is een downloadbare kanaalplugin (`@openclaw/nextcloud-talk`) die OpenClaw via een Talk-webhookbot verbindt met een zelfgehoste Nextcloud-instantie. Directe berichten, ruimtes, reacties en markdown-berichten worden ondersteund; media worden als URL's verzonden.

## Installatie

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Gebruik de kale pakketspecificatie om de huidige officiële releasetag te volgen. Zet alleen een exacte versie vast wanneer je een reproduceerbare installatie nodig hebt.

Vanuit een lokale checkout (ontwikkelworkflows):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Start de Gateway opnieuw na de installatie. Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie (beginners)

1. Installeer de plugin (hierboven).
2. Maak op je Nextcloud-server een bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Behoud `--feature response`: zonder deze optie mislukken uitgaande antwoorden met 401. Herstel een bestaande bot met `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Schakel de bot in via de instellingen van de doelruimte.
4. Configureer OpenClaw:
   - Configuratie: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Of omgevingsvariabele: `NEXTCLOUD_TALK_BOT_SECRET` (alleen voor het standaardaccount)

   CLI-configuratie (`--url`/`--token` zijn aliassen voor de expliciete velden; `nc-talk` en `nc` werken als kanainaliassen):

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

- Bots kunnen geen directe berichten initiëren. De gebruiker moet eerst een bericht naar de bot sturen.
- De webhook-URL moet bereikbaar zijn vanaf de Nextcloud-server; stel `webhookPublicUrl` in wanneer de Gateway zich achter een proxy bevindt. Webhookverzoeken worden met HMAC-SHA256 en het botgeheim ondertekend; ongeldige handtekeningen worden geweigerd en onderworpen aan snelheidsbeperking.
- Media-uploads worden niet ondersteund door de bot-API; uitgaande media worden toegevoegd als een regel `Attachment: <url>`.
- De webhookpayload maakt geen onderscheid tussen directe berichten en ruimtes; stel `apiUser` + `apiPassword` in om opzoekacties voor ruimtetypen in te schakelen (ongeveer 5 minuten in de cache). Zonder deze instellingen wordt elk gesprek als een ruimte behandeld.
- Uitgaande verzoeken lopen via de SSRF-beveiliging. Voor een Nextcloud-host op een vertrouwd privé- of intern netwerk kun je dit toestaan met `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Wanneer `apiUser`/`apiPassword` en `webhookPublicUrl` zijn ingesteld, controleert `openclaw channels status` de bot en waarschuwt het wanneer de functie `response` ontbreekt.

## Toegangsbeheer (directe berichten)

- Standaard: `channels.nextcloud-talk.dmPolicy = "pairing"`. Onbekende afzenders ontvangen een koppelcode.
- Goedkeuren via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Openbare directe berichten: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` komt alleen overeen met Nextcloud-gebruikers-ID's (in kleine letters); weergavenamen worden genegeerd.

## Ruimtes (groepen)

- Standaard: `channels.nextcloud-talk.groupPolicy = "allowlist"` (alleen bij vermelding).
- Sta ruimtes toe via `channels.nextcloud-talk.rooms`, met het ruimtetoken als sleutel; `"*"` stelt een standaardjokerteken in:

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

- Sleutels per ruimte: `requireMention` (standaard true), `enabled` (false schakelt de ruimte uit), `allowFrom` (toegestane afzenders per ruimte), `tools` (overschrijvingen voor het toestaan/weigeren van hulpmiddelen), `skills` (beperk geladen Skills), `systemPrompt`.
- Om geen ruimtes toe te staan, laat je de lijst met toegestane ruimtes leeg of stel je `channels.nextcloud-talk.groupPolicy="disabled"` in.

## Mogelijkheden

| Functie             | Status               |
| ------------------- | -------------------- |
| Directe berichten   | Ondersteund          |
| Ruimtes             | Ondersteund          |
| Threads             | Niet ondersteund     |
| Media               | Alleen URL's         |
| Reacties            | Ondersteund          |
| Systeemeigen opdrachten | Niet ondersteund |

## Configuratiereferentie (Nextcloud Talk)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.nextcloud-talk.enabled`: het opstarten van het kanaal in- of uitschakelen.
- `channels.nextcloud-talk.baseUrl`: URL van de Nextcloud-instantie.
- `channels.nextcloud-talk.botSecret`: gedeeld botgeheim (tekenreeks of verwijzing naar een geheim).
- `channels.nextcloud-talk.botSecretFile`: pad naar een gewoon bestand met het geheim. Symbolische koppelingen worden geweigerd.
- `channels.nextcloud-talk.apiUser`: API-gebruiker voor het opzoeken van ruimtes (detectie van directe berichten) en de statuscontrole.
- `channels.nextcloud-talk.apiPassword`: API-/appwachtwoord voor het opzoeken van ruimtes.
- `channels.nextcloud-talk.apiPasswordFile`: bestandspad voor het API-wachtwoord.
- `channels.nextcloud-talk.webhookPort`: poort van de webhooklistener (standaard: 8788).
- `channels.nextcloud-talk.webhookHost`: webhookhost (standaard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: webhookpad (standaard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: extern bereikbare webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing). `open` vereist `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: lijst met toegestane afzenders voor directe berichten (gebruikers-ID's).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (standaard: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: lijst met toegestane afzenders in ruimtes (gebruikers-ID's); valt terug op `allowFrom` wanneer dit niet is ingesteld.
- `channels.nextcloud-talk.rooms`: instellingen en lijst met toegestane afzenders per ruimte (zie hierboven).
- Vanuit `allowFrom` en `groupAllowFrom` kan met `accessGroup:<name>` naar statische afzendertoegangsgroepen worden verwezen.
- `channels.nextcloud-talk.historyLimit`: limiet voor groepsgeschiedenis (0 schakelt dit uit).
- `channels.nextcloud-talk.dmHistoryLimit`: limiet voor de geschiedenis van directe berichten (0 schakelt dit uit).
- `channels.nextcloud-talk.dms`: overschrijvingen per direct bericht, met gebruikers-ID als sleutel (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: grootte van uitgaande tekstsegmenten in tekens (standaard: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (standaard) of `newline` om eerst op lege regels (alineagrenzen) te splitsen en daarna op lengte.
- `channels.nextcloud-talk.blockStreaming`: blokstreaming voor dit kanaal uitschakelen.
- `channels.nextcloud-talk.blockStreamingCoalesce`: afstemming voor het samenvoegen van blokstreaming.
- `channels.nextcloud-talk.responsePrefix`: voorvoegsel voor uitgaande antwoorden.
- `channels.nextcloud-talk.markdown.tables`: weergavemodus voor markdown-tabellen (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: limiet voor inkomende media (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: privé-/interne Nextcloud-hosts door de SSRF-beveiliging toelaten.
- `channels.nextcloud-talk.accounts.<id>`: overschrijvingen per account (dezelfde sleutels); `defaultAccount` selecteert het standaardaccount. De omgevingsvariabelen `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` zijn alleen van toepassing op het standaardaccount.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — authenticatie van directe berichten en koppelproces
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vereiste vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiligingsversterking
