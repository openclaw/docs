---
read_when:
    - Werken aan Nextcloud Talk-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie van Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-29T22:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: gebundelde Plugin (webhook-bot). Directe berichten, ruimtes, reacties en markdown-berichten worden ondersteund.

## Gebundelde Plugin

Nextcloud Talk wordt meegeleverd als gebundelde Plugin in huidige OpenClaw-releases, dus
normale verpakte builds hebben geen afzonderlijke installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Nextcloud Talk uitsluit,
installeer dan een huidig npm-pakket wanneer er een is gepubliceerd:

Installeren via CLI (npm-register, wanneer er een huidig pakket bestaat):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Als npm meldt dat het pakket van OpenClaw als verouderd is gemarkeerd, gebruik dan een huidige verpakte
OpenClaw-build of het lokale checkout-pad totdat er een nieuwer npm-pakket is
gepubliceerd.

Lokale checkout (bij uitvoeren vanuit een git-repo):

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

   Gelijkwaardige expliciete velden:

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

5. Herstart de Gateway (of rond de setup af).

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

- Bots kunnen geen DM's initiëren. De gebruiker moet de bot eerst een bericht sturen.
- Webhook-URL moet bereikbaar zijn voor de Gateway; stel `webhookPublicUrl` in als deze achter een proxy zit.
- Media-uploads worden niet ondersteund door de bot-API; media wordt als URL's verzonden.
- De Webhook-payload maakt geen onderscheid tussen DM's en ruimtes; stel `apiUser` + `apiPassword` in om ruimtetype-opzoekingen in te schakelen (anders worden DM's als ruimtes behandeld).

## Toegangscontrole (DM's)

- Standaard: `channels.nextcloud-talk.dmPolicy = "pairing"`. Onbekende afzenders krijgen een koppelingscode.
- Goedkeuren via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Openbare DM's: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` matcht alleen Nextcloud-gebruikers-ID's; weergavenamen worden genegeerd.

## Ruimtes (groepen)

- Standaard: `channels.nextcloud-talk.groupPolicy = "allowlist"` (vermelding vereist).
- Zet ruimtes op de allowlist met `channels.nextcloud-talk.rooms`:

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

- Als je geen ruimtes wilt toestaan, houd je de allowlist leeg of stel je `channels.nextcloud-talk.groupPolicy="disabled"` in.

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

- `channels.nextcloud-talk.enabled`: kanaalopstart in-/uitschakelen.
- `channels.nextcloud-talk.baseUrl`: URL van de Nextcloud-instantie.
- `channels.nextcloud-talk.botSecret`: gedeeld geheim van de bot.
- `channels.nextcloud-talk.botSecretFile`: geheim pad naar regulier bestand. Symlinks worden geweigerd.
- `channels.nextcloud-talk.apiUser`: API-gebruiker voor ruimte-opzoekingen (DM-detectie).
- `channels.nextcloud-talk.apiPassword`: API-/app-wachtwoord voor ruimte-opzoekingen.
- `channels.nextcloud-talk.apiPasswordFile`: bestandspad voor API-wachtwoord.
- `channels.nextcloud-talk.webhookPort`: luisterpoort voor Webhook (standaard: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook-host (standaard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook-pad (standaard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: extern bereikbare Webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM-allowlist (gebruikers-ID's). `open` vereist `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: groeps-allowlist (gebruikers-ID's).
- `channels.nextcloud-talk.rooms`: instellingen en allowlist per ruimte.
- `channels.nextcloud-talk.historyLimit`: limiet voor groepsgeschiedenis (0 schakelt uit).
- `channels.nextcloud-talk.dmHistoryLimit`: limiet voor DM-geschiedenis (0 schakelt uit).
- `channels.nextcloud-talk.dms`: overschrijvingen per DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: grootte van uitgaande tekstchunks (tekens).
- `channels.nextcloud-talk.chunkMode`: `length` (standaard) of `newline` om te splitsen op lege regels (alineagrenzen) vóór chunking op lengte.
- `channels.nextcloud-talk.blockStreaming`: blockstreaming voor dit kanaal uitschakelen.
- `channels.nextcloud-talk.blockStreamingCoalesce`: tuning voor samenvoeging van blockstreaming.
- `channels.nextcloud-talk.mediaMaxMb`: limiet voor inkomende media (MB).

## Gerelateerd

- [Kanaaloverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vereiste vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
