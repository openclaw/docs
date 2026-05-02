---
read_when:
    - Arbeiten an Funktionen für den Nextcloud Talk-Kanal
summary: Supportstatus, Funktionen und Konfiguration für Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: gebündeltes Plugin (Webhook-Bot). Direktnachrichten, Räume, Reaktionen und Markdown-Nachrichten werden unterstützt.

## Gebündeltes Plugin

Nextcloud Talk wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen
normale paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Nextcloud Talk ausschließt,
installieren Sie das npm-Paket direkt:

Installation über CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur dann, wenn Sie eine reproduzierbare Installation benötigen.

Lokaler Checkout (wenn Sie aus einem Git-Repo ausführen):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Nextcloud Talk-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie auf Ihrem Nextcloud-Server einen Bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Aktivieren Sie den Bot in den Einstellungen des Zielraums.
4. Konfigurieren Sie OpenClaw:
   - Konfiguration: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oder env: `NEXTCLOUD_TALK_BOT_SECRET` (nur Standardkonto)

   CLI-Einrichtung:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Entsprechende explizite Felder:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Dateibasierter Secret:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Starten Sie den Gateway neu (oder schließen Sie die Einrichtung ab).

Minimale Konfiguration:

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

## Hinweise

- Bots können keine DMs initiieren. Der Benutzer muss dem Bot zuerst eine Nachricht senden.
- Die Webhook-URL muss vom Gateway erreichbar sein; setzen Sie `webhookPublicUrl`, wenn Sie sich hinter einem Proxy befinden.
- Medien-Uploads werden von der Bot-API nicht unterstützt; Medien werden als URLs gesendet.
- Die Webhook-Nutzlast unterscheidet nicht zwischen DMs und Räumen; setzen Sie `apiUser` + `apiPassword`, um Raumtyp-Abfragen zu aktivieren (andernfalls werden DMs als Räume behandelt).

## Zugriffskontrolle (DMs)

- Standard: `channels.nextcloud-talk.dmPolicy = "pairing"`. Unbekannte Absender erhalten einen Kopplungscode.
- Genehmigen über:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Öffentliche DMs: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` gleicht nur Nextcloud-Benutzer-IDs ab; Anzeigenamen werden ignoriert.

## Räume (Gruppen)

- Standard: `channels.nextcloud-talk.groupPolicy = "allowlist"` (erwähnungsgesteuert).
- Räume mit `channels.nextcloud-talk.rooms` auf die Allowlist setzen:

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

- Um keine Räume zuzulassen, lassen Sie die Allowlist leer oder setzen Sie `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funktionen

| Funktion        | Status                 |
| --------------- | ---------------------- |
| Direktnachrichten | Unterstützt          |
| Räume           | Unterstützt            |
| Threads         | Nicht unterstützt      |
| Medien          | Nur URL                |
| Reaktionen      | Unterstützt            |
| Native Befehle  | Nicht unterstützt      |

## Konfigurationsreferenz (Nextcloud Talk)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.nextcloud-talk.enabled`: Start des Kanals aktivieren/deaktivieren.
- `channels.nextcloud-talk.baseUrl`: URL der Nextcloud-Instanz.
- `channels.nextcloud-talk.botSecret`: gemeinsam genutzter Bot-Secret.
- `channels.nextcloud-talk.botSecretFile`: Secret-Pfad zu einer regulären Datei. Symlinks werden abgelehnt.
- `channels.nextcloud-talk.apiUser`: API-Benutzer für Raumabfragen (DM-Erkennung).
- `channels.nextcloud-talk.apiPassword`: API-/App-Passwort für Raumabfragen.
- `channels.nextcloud-talk.apiPasswordFile`: Dateipfad für das API-Passwort.
- `channels.nextcloud-talk.webhookPort`: Port des Webhook-Listeners (Standard: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook-Host (Standard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook-Pfad (Standard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: extern erreichbare Webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM-Allowlist (Benutzer-IDs). `open` erfordert `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: Gruppen-Allowlist (Benutzer-IDs).
- `channels.nextcloud-talk.rooms`: Einstellungen und Allowlist pro Raum.
- `channels.nextcloud-talk.historyLimit`: Verlaufslimit für Gruppen (0 deaktiviert).
- `channels.nextcloud-talk.dmHistoryLimit`: Verlaufslimit für DMs (0 deaktiviert).
- `channels.nextcloud-talk.dms`: Überschreibungen pro DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: Größe ausgehender Text-Chunks (Zeichen).
- `channels.nextcloud-talk.chunkMode`: `length` (Standard) oder `newline`, um vor dem Aufteilen nach Länge an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.nextcloud-talk.blockStreaming`: Block-Streaming für diesen Kanal deaktivieren.
- `channels.nextcloud-talk.blockStreamingCoalesce`: Coalesce-Abstimmung für Block-Streaming.
- `channels.nextcloud-talk.mediaMaxMb`: Obergrenze für eingehende Medien (MB).

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungssteuerung
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
