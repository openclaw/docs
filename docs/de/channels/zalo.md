---
read_when:
    - Arbeiten an Zalo-Funktionen oder Webhooks
summary: Status, Fähigkeiten und Konfiguration der Zalo-Bot-Unterstützung
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Status: experimentell. DMs werden unterstützt. Der Abschnitt [Fähigkeiten](#capabilities) unten spiegelt das aktuelle Verhalten von Marketplace-Bots wider.

## Gebündeltes Plugin

Zalo wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte
Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation ohne Zalo verwenden, installieren Sie es
manuell:

- Installation per CLI: `openclaw plugins install @openclaw/zalo`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Zalo-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den oben genannten Befehlen manuell hinzufügen.
2. Setzen Sie das Token:
   - Umgebungsvariable: `ZALO_BOT_TOKEN=...`
   - Oder Konfiguration: `channels.zalo.accounts.default.botToken: "..."`.
3. Starten Sie das Gateway neu (oder schließen Sie das Setup ab).
4. DM-Zugriff verwendet standardmäßig Kopplung; genehmigen Sie beim ersten Kontakt den Kopplungscode.

Minimale Konfiguration:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Was es ist

Zalo ist eine Messaging-App mit Fokus auf Vietnam; ihre Bot-API ermöglicht es dem Gateway, einen Bot für 1:1-Unterhaltungen zu betreiben.
Sie eignet sich gut für Support oder Benachrichtigungen, wenn Sie deterministisches Routing zurück zu Zalo möchten.

Diese Seite beschreibt das aktuelle OpenClaw-Verhalten für **Zalo Bot Creator / Marketplace-Bots**.
**Zalo Official Account (OA)-Bots** sind eine andere Zalo-Produktoberfläche und können sich anders verhalten.

- Ein Zalo-Bot-API-Kanal, der dem Gateway gehört.
- Deterministisches Routing: Antworten gehen zurück an Zalo; das Modell wählt niemals Kanäle.
- DMs teilen sich die Hauptsitzung des Agenten.
- Der Abschnitt [Fähigkeiten](#capabilities) unten zeigt die aktuelle Unterstützung für Marketplace-Bots.

## Einrichtung (schneller Pfad)

### 1) Ein Bot-Token erstellen (Zalo Bot Platform)

1. Gehen Sie zu [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) und melden Sie sich an.
2. Erstellen Sie einen neuen Bot und konfigurieren Sie seine Einstellungen.
3. Kopieren Sie das vollständige Bot-Token (typischerweise `numeric_id:secret`). Bei Marketplace-Bots kann das verwendbare Laufzeit-Token nach der Erstellung in der Willkommensnachricht des Bots erscheinen.

### 2) Das Token konfigurieren (Umgebungsvariable oder Konfiguration)

Beispiel:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Wenn Sie später zu einer Zalo-Bot-Oberfläche wechseln, bei der Gruppen verfügbar sind, können Sie explizit gruppenspezifische Konfigurationen wie `groupPolicy` und `groupAllowFrom` hinzufügen. Für das aktuelle Verhalten von Marketplace-Bots siehe [Fähigkeiten](#capabilities).

Option per Umgebungsvariable: `ZALO_BOT_TOKEN=...` (funktioniert nur für das Standardkonto).

Unterstützung für mehrere Konten: Verwenden Sie `channels.zalo.accounts` mit kontospezifischen Tokens und optionalem `name`.

3. Starten Sie das Gateway neu. Zalo startet, sobald ein Token aufgelöst wird (Umgebungsvariable oder Konfiguration).
4. DM-Zugriff verwendet standardmäßig Kopplung. Genehmigen Sie den Code, wenn der Bot zum ersten Mal kontaktiert wird.

## Funktionsweise (Verhalten)

- Eingehende Nachrichten werden mit Platzhaltern für Medien in den gemeinsamen Kanal-Umschlag normalisiert.
- Antworten werden immer zurück in denselben Zalo-Chat geroutet.
- Standardmäßig Long-Polling; Webhook-Modus ist mit `channels.zalo.webhookUrl` verfügbar.

## Einschränkungen

- Ausgehender Text wird auf 2000 Zeichen gechunkt (Limit der Zalo-API).
- Downloads/Uploads von Medien sind durch `channels.zalo.mediaMaxMb` begrenzt (Standard 5).
- Streaming ist standardmäßig blockiert, da das 2000-Zeichen-Limit Streaming weniger nützlich macht.

## Zugriffskontrolle (DMs)

### DM-Zugriff

- Standard: `channels.zalo.dmPolicy = "pairing"`. Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden ignoriert, bis sie genehmigt sind (Codes laufen nach 1 Stunde ab).
- Genehmigung über:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Kopplung ist der Standard-Tokenaustausch. Details: [Kopplung](/de/channels/pairing)
- `channels.zalo.allowFrom` akzeptiert numerische Benutzer-IDs (kein Lookup von Benutzernamen verfügbar).

## Zugriffskontrolle (Gruppen)

Für **Zalo Bot Creator / Marketplace-Bots** war Gruppenunterstützung in der Praxis nicht verfügbar, weil der Bot überhaupt nicht zu einer Gruppe hinzugefügt werden konnte.

Das bedeutet, dass die unten stehenden gruppenbezogenen Konfigurationsschlüssel im Schema zwar existieren, für Marketplace-Bots aber nicht nutzbar waren:

- `channels.zalo.groupPolicy` steuert die Behandlung eingehender Gruppennachrichten: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` beschränkt, welche Absender-IDs den Bot in Gruppen auslösen können.
- Wenn `groupAllowFrom` nicht gesetzt ist, greift Zalo für Absenderprüfungen auf `allowFrom` zurück.
- Hinweis zur Laufzeit: Wenn `channels.zalo` vollständig fehlt, verwendet die Laufzeit aus Sicherheitsgründen dennoch `groupPolicy="allowlist"` als Fallback.

Die Werte der Gruppenrichtlinie sind (wenn Gruppenzugriff auf Ihrer Bot-Oberfläche verfügbar ist):

- `groupPolicy: "disabled"` — blockiert alle Gruppennachrichten.
- `groupPolicy: "open"` — erlaubt jedes Gruppenmitglied (mit Steuerung über Erwähnungen).
- `groupPolicy: "allowlist"` — standardmäßig fail-closed; nur erlaubte Absender werden akzeptiert.

Wenn Sie eine andere Zalo-Bot-Produktoberfläche verwenden und funktionierendes Gruppenverhalten verifiziert haben, dokumentieren Sie dies separat, statt anzunehmen, dass es dem Marketplace-Bot-Ablauf entspricht.

## Long-Polling vs Webhook

- Standard: Long-Polling (keine öffentliche URL erforderlich).
- Webhook-Modus: Setzen Sie `channels.zalo.webhookUrl` und `channels.zalo.webhookSecret`.
  - Das Webhook-Secret muss 8–256 Zeichen lang sein.
  - Die Webhook-URL muss HTTPS verwenden.
  - Zalo sendet Ereignisse mit dem Header `X-Bot-Api-Secret-Token` zur Verifizierung.
  - Gateway HTTP verarbeitet Webhook-Anfragen unter `channels.zalo.webhookPath` (standardmäßig der Pfad der Webhook-URL).
  - Anfragen müssen `Content-Type: application/json` verwenden (oder Medientypen mit `+json`).
  - Doppelte Ereignisse (`event_name + message_id`) werden für ein kurzes Replay-Fenster ignoriert.
  - Burst-Traffic wird pro Pfad/Quelle ratenbegrenzt und kann HTTP 429 zurückgeben.

**Hinweis:** `getUpdates` (Polling) und Webhook schließen sich laut Zalo-API-Dokumentation gegenseitig aus.

## Unterstützte Nachrichtentypen

Für einen schnellen Überblick zur Unterstützung siehe [Fähigkeiten](#capabilities). Die Hinweise unten ergänzen Details, wo das Verhalten zusätzlichen Kontext erfordert.

- **Textnachrichten**: Vollständig unterstützt mit 2000-Zeichen-Chunking.
- **Einfache URLs im Text**: Verhalten sich wie normale Texteingaben.
- **Linkvorschauen / Rich-Link-Karten**: Siehe den Status für Marketplace-Bots unter [Fähigkeiten](#capabilities); sie lösten nicht zuverlässig eine Antwort aus.
- **Bildnachrichten**: Siehe den Status für Marketplace-Bots unter [Fähigkeiten](#capabilities); die Verarbeitung eingehender Bilder war unzuverlässig (Tippindikator ohne endgültige Antwort).
- **Sticker**: Siehe den Status für Marketplace-Bots unter [Fähigkeiten](#capabilities).
- **Sprachnachrichten / Audiodateien / Video / allgemeine Dateianhänge**: Siehe den Status für Marketplace-Bots unter [Fähigkeiten](#capabilities).
- **Nicht unterstützte Typen**: Werden protokolliert (zum Beispiel Nachrichten von geschützten Benutzern).

## Fähigkeiten

Diese Tabelle fasst das aktuelle Verhalten von **Zalo Bot Creator / Marketplace-Bots** in OpenClaw zusammen.

| Feature                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Direktnachrichten           | ✅ Unterstützt                          |
| Gruppen                     | ❌ Für Marketplace-Bots nicht verfügbar |
| Medien (eingehende Bilder)  | ⚠️ Begrenzt / in Ihrer Umgebung prüfen  |
| Medien (ausgehende Bilder)  | ⚠️ Für Marketplace-Bots nicht erneut getestet |
| Einfache URLs im Text       | ✅ Unterstützt                          |
| Linkvorschauen              | ⚠️ Unzuverlässig für Marketplace-Bots   |
| Reaktionen                  | ❌ Nicht unterstützt                    |
| Sticker                     | ⚠️ Keine Agentenantwort für Marketplace-Bots |
| Sprachnachrichten / Audio / Video | ⚠️ Keine Agentenantwort für Marketplace-Bots |
| Dateianhänge                | ⚠️ Keine Agentenantwort für Marketplace-Bots |
| Threads                     | ❌ Nicht unterstützt                    |
| Umfragen                    | ❌ Nicht unterstützt                    |
| Native Befehle              | ❌ Nicht unterstützt                    |
| Streaming                   | ⚠️ Blockiert (2000-Zeichen-Limit)       |

## Zustellungsziele (CLI/Cron)

- Verwenden Sie eine Chat-ID als Ziel.
- Beispiel: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Fehlerbehebung

**Bot antwortet nicht:**

- Prüfen Sie, ob das Token gültig ist: `openclaw channels status --probe`
- Verifizieren Sie, dass der Absender genehmigt ist (Kopplung oder `allowFrom`)
- Prüfen Sie die Gateway-Logs: `openclaw logs --follow`

**Webhook empfängt keine Ereignisse:**

- Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet
- Verifizieren Sie, dass das Secret-Token 8–256 Zeichen lang ist
- Bestätigen Sie, dass der Gateway-HTTP-Endpunkt unter dem konfigurierten Pfad erreichbar ist
- Prüfen Sie, dass `getUpdates`-Polling nicht läuft (beides schließt sich gegenseitig aus)

## Konfigurationsreferenz (Zalo)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Die flachen Top-Level-Schlüssel (`channels.zalo.botToken`, `channels.zalo.dmPolicy` und ähnliche) sind ein veralteter Single-Account-Kurzschreibweise. Für neue Konfigurationen sollten Sie `channels.zalo.accounts.<id>.*` bevorzugen. Beide Formen werden hier weiterhin dokumentiert, weil sie im Schema existieren.

Provider-Optionen:

- `channels.zalo.enabled`: Start des Kanals aktivieren/deaktivieren.
- `channels.zalo.botToken`: Bot-Token von der Zalo Bot Platform.
- `channels.zalo.tokenFile`: Token aus einem regulären Dateipfad lesen. Symbolische Links werden abgelehnt.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.zalo.allowFrom`: DM-Allowlist (Benutzer-IDs). `open` erfordert `"*"`. Der Assistent fragt nach numerischen IDs.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist). In der Konfiguration vorhanden; siehe [Fähigkeiten](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) für das aktuelle Verhalten von Marketplace-Bots.
- `channels.zalo.groupAllowFrom`: Allowlist für Gruppensender (Benutzer-IDs). Greift auf `allowFrom` zurück, wenn nicht gesetzt.
- `channels.zalo.mediaMaxMb`: Obergrenze für eingehende/ausgehende Medien (MB, Standard 5).
- `channels.zalo.webhookUrl`: Webhook-Modus aktivieren (HTTPS erforderlich).
- `channels.zalo.webhookSecret`: Webhook-Secret (8–256 Zeichen).
- `channels.zalo.webhookPath`: Webhook-Pfad auf dem Gateway-HTTP-Server.
- `channels.zalo.proxy`: Proxy-URL für API-Anfragen.

Optionen für mehrere Konten:

- `channels.zalo.accounts.<id>.botToken`: kontospezifisches Token.
- `channels.zalo.accounts.<id>.tokenFile`: kontospezifische reguläre Token-Datei. Symbolische Links werden abgelehnt.
- `channels.zalo.accounts.<id>.name`: Anzeigename.
- `channels.zalo.accounts.<id>.enabled`: Konto aktivieren/deaktivieren.
- `channels.zalo.accounts.<id>.dmPolicy`: kontospezifische DM-Richtlinie.
- `channels.zalo.accounts.<id>.allowFrom`: kontospezifische Allowlist.
- `channels.zalo.accounts.<id>.groupPolicy`: kontospezifische Gruppenrichtlinie. In der Konfiguration vorhanden; siehe [Fähigkeiten](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) für das aktuelle Verhalten von Marketplace-Bots.
- `channels.zalo.accounts.<id>.groupAllowFrom`: kontospezifische Allowlist für Gruppensender.
- `channels.zalo.accounts.<id>.webhookUrl`: kontospezifische Webhook-URL.
- `channels.zalo.accounts.<id>.webhookSecret`: kontospezifisches Webhook-Secret.
- `channels.zalo.accounts.<id>.webhookPath`: kontospezifischer Webhook-Pfad.
- `channels.zalo.accounts.<id>.proxy`: kontospezifische Proxy-URL.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Steuerung von Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
