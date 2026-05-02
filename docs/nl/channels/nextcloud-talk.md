---
read_when:
    - Werken aan functies voor het Nextcloud Talk-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: gebundelde Plugin (webhookbot). Directe berichten, ruimtes, reacties en markdownberichten worden ondersteund.

## Gebundelde Plugin

Nextcloud Talk wordt als gebundelde Plugin meegeleverd in huidige OpenClaw-releases, dus
normale pakketbuilds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Nextcloud Talk uitsluit,
installeer dan het npm-pakket rechtstreeks:

Installeren via CLI (npm-register):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Gebruik het kale pakket om de huidige officiële releasetag te volgen. Pin alleen een exacte
versie wanneer je een reproduceerbare installatie nodig hebt.

Lokale checkout (wanneer je vanuit een git-repo draait):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle setup (beginner)

1. Zorg dat de Nextcloud Talk-Plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
2. Maak op je Nextcloud-server een bot aan:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Schakel de bot in de instellingen van de doelruimte in.
4. Configureer OpenClaw:
   - Configuratie: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Of env: `NEXTCLOUD_TALK_BOT_SECRET` (alleen standaardaccount)

   CLI-setup:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Equivalente expliciete velden:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Bestandsgebaseerd geheim:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Herstart de Gateway (of voltooi de setup).

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

## Notities

- Bots kunnen geen DM's starten. De gebruiker moet eerst een bericht naar de bot sturen.
- De Webhook-URL moet bereikbaar zijn voor de Gateway; stel `webhookPublicUrl` in als deze achter een proxy zit.
- Media-uploads worden niet ondersteund door de bot-API; media wordt als URL's verzonden.
- De Webhook-payload maakt geen onderscheid tussen DM's en ruimtes; stel `apiUser` + `apiPassword` in om ruimtetype-opzoekingen in te schakelen (anders worden DM's als ruimtes behandeld).

## Toegangscontrole (DM's)

- Standaard: `channels.nextcloud-talk.dmPolicy = "pairing"`. Onbekende afzenders krijgen een koppelcode.
- Goedkeuren via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Openbare DM's: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` komt alleen overeen met Nextcloud-gebruikers-ID's; weergavenamen worden genegeerd.

## Ruimtes (groepen)

- Standaard: `channels.nextcloud-talk.groupPolicy = "allowlist"` (vermelding vereist).
- Zet ruimtes op de toelatingslijst met `channels.nextcloud-talk.rooms`:

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

- Houd de toelatingslijst leeg of stel `channels.nextcloud-talk.groupPolicy="disabled"` in om geen ruimtes toe te staan.

## Mogelijkheden

| Functie          | Status             |
| ---------------- | ------------------ |
| Directe berichten | Ondersteund        |
| Ruimtes          | Ondersteund        |
| Threads          | Niet ondersteund   |
| Media            | Alleen URL         |
| Reacties         | Ondersteund        |
| Native opdrachten | Niet ondersteund  |

## Configuratiereferentie (Nextcloud Talk)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.nextcloud-talk.enabled`: kanaalstart in-/uitschakelen.
- `channels.nextcloud-talk.baseUrl`: URL van de Nextcloud-instantie.
- `channels.nextcloud-talk.botSecret`: gedeeld geheim van de bot.
- `channels.nextcloud-talk.botSecretFile`: geheim pad naar regulier bestand. Symlinks worden geweigerd.
- `channels.nextcloud-talk.apiUser`: API-gebruiker voor ruimte-opzoekingen (DM-detectie).
- `channels.nextcloud-talk.apiPassword`: API-/app-wachtwoord voor ruimte-opzoekingen.
- `channels.nextcloud-talk.apiPasswordFile`: bestandspad voor API-wachtwoord.
- `channels.nextcloud-talk.webhookPort`: poort voor Webhook-listener (standaard: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook-host (standaard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook-pad (standaard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: extern bereikbare Webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM-toelatingslijst (gebruikers-ID's). `open` vereist `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: groepstoelatingslijst (gebruikers-ID's).
- `channels.nextcloud-talk.rooms`: instellingen en toelatingslijst per ruimte.
- `channels.nextcloud-talk.historyLimit`: limiet voor groepsgeschiedenis (0 schakelt uit).
- `channels.nextcloud-talk.dmHistoryLimit`: limiet voor DM-geschiedenis (0 schakelt uit).
- `channels.nextcloud-talk.dms`: overschrijvingen per DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: grootte van uitgaande tekstchunks (tekens).
- `channels.nextcloud-talk.chunkMode`: `length` (standaard) of `newline` om op lege regels (alineagrenzen) te splitsen vóór lengtechunking.
- `channels.nextcloud-talk.blockStreaming`: blockstreaming voor dit kanaal uitschakelen.
- `channels.nextcloud-talk.blockStreamingCoalesce`: afstemming voor samenvoegen van blockstreaming.
- `channels.nextcloud-talk.mediaMaxMb`: limiet voor inkomende media (MB).

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsvereiste
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
