---
read_when:
    - Werken aan functies voor het Nextcloud Talk-kanaal
summary: Nextcloud Talk-ondersteuningsstatus, mogelijkheden en configuratie
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:22:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Status: gebundelde Plugin (Webhook-bot). Direct messages, ruimtes, reacties en markdown-berichten worden ondersteund.

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

Lokale checkout (bij uitvoeren vanuit een git-repo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle setup (beginner)

1. Zorg dat de Nextcloud Talk-Plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande commando's.
2. Maak op je Nextcloud-server een bot aan:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
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

   Bestandsgesteund geheim:

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

- Bots kunnen geen DM's initiëren. De gebruiker moet eerst een bericht naar de bot sturen.
- De Webhook-URL moet bereikbaar zijn voor de Gateway; stel `webhookPublicUrl` in als deze zich achter een proxy bevindt.
- Media-uploads worden niet ondersteund door de bot-API; media wordt als URL's verzonden.
- De Webhook-payload maakt geen onderscheid tussen DM's en ruimtes; stel `apiUser` + `apiPassword` in om opzoekacties voor ruimtetypes in te schakelen (anders worden DM's als ruimtes behandeld).

## Toegangsbeheer (DM's)

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

- Om geen ruimtes toe te staan, laat je de allowlist leeg of stel je `channels.nextcloud-talk.groupPolicy="disabled"` in.

## Mogelijkheden

| Functie         | Status                |
| --------------- | --------------------- |
| Direct messages | Ondersteund           |
| Ruimtes         | Ondersteund           |
| Threads         | Niet ondersteund      |
| Media           | Alleen URL's          |
| Reacties        | Ondersteund           |
| Native commands | Niet ondersteund      |

## Configuratiereferentie (Nextcloud Talk)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.nextcloud-talk.enabled`: inschakelen/uitschakelen van kanaalopstart.
- `channels.nextcloud-talk.baseUrl`: URL van de Nextcloud-instantie.
- `channels.nextcloud-talk.botSecret`: gedeeld botgeheim.
- `channels.nextcloud-talk.botSecretFile`: geheim pad naar regulier bestand. Symlinks worden geweigerd.
- `channels.nextcloud-talk.apiUser`: API-gebruiker voor opzoekacties van ruimtes (DM-detectie).
- `channels.nextcloud-talk.apiPassword`: API-/app-wachtwoord voor opzoekacties van ruimtes.
- `channels.nextcloud-talk.apiPasswordFile`: bestandspad voor API-wachtwoord.
- `channels.nextcloud-talk.webhookPort`: listenerpoort voor Webhooks (standaard: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook-host (standaard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook-pad (standaard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: extern bereikbare Webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM-allowlist (gebruikers-ID's). `open` vereist `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: groeps-allowlist (gebruikers-ID's).
- `channels.nextcloud-talk.rooms`: instellingen en allowlist per ruimte.
- Statische toegangsgroepen voor afzenders kunnen vanuit `allowFrom` en `groupAllowFrom` worden gerefereerd met `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: geschiedenisluit voor groepen (0 schakelt uit).
- `channels.nextcloud-talk.dmHistoryLimit`: geschiedenisluit voor DM's (0 schakelt uit).
- `channels.nextcloud-talk.dms`: overschrijvingen per DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: chunkgrootte voor uitgaande tekst (tekens).
- `channels.nextcloud-talk.chunkMode`: `length` (standaard) of `newline` om te splitsen op lege regels (alineagrenzen) vóór chunking op lengte.
- `channels.nextcloud-talk.blockStreaming`: block-streaming uitschakelen voor dit kanaal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: afstemming voor coalescing van block-streaming.
- `channels.nextcloud-talk.mediaMaxMb`: limiet voor inkomende media (MB).

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en gating op vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
