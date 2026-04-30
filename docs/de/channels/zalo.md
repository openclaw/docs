---
read_when:
    - Arbeiten an Zalo-Funktionen oder Webhooks
summary: Supportstatus, Funktionen und Konfiguration des Zalo-Bots
title: Zalo
x-i18n:
    generated_at: "2026-04-30T06:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimentell. DMs werden unterstützt. Der Abschnitt [Fähigkeiten](#capabilities) unten spiegelt das aktuelle Verhalten von Marketplace-Bots wider.

## Gebündeltes Plugin

Zalo wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, sodass normale paketierte
Builds keine separate Installation benötigen.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Zalo ausschließt, installieren Sie ein
aktuelles npm-Paket, sobald eines veröffentlicht ist:

- Installation über die CLI: `openclaw plugins install @openclaw/zalo`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/de/tools/plugin)

Wenn npm das OpenClaw-eigene Paket als veraltet meldet, verwenden Sie einen aktuellen paketierten
OpenClaw-Build oder den lokalen Checkout-Pfad, bis ein neueres npm-Paket
veröffentlicht wird.

## Schnelle Einrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Zalo-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Legen Sie das Token fest:
   - Env: `ZALO_BOT_TOKEN=...`
   - Oder Konfiguration: `channels.zalo.accounts.default.botToken: "..."`.
3. Starten Sie den Gateway neu (oder schließen Sie die Einrichtung ab).
4. DM-Zugriff erfolgt standardmäßig über Pairing; genehmigen Sie den Pairing-Code beim ersten Kontakt.

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

Zalo ist eine auf Vietnam ausgerichtete Messaging-App; ihre Bot API ermöglicht dem Gateway, einen Bot für 1:1-Unterhaltungen auszuführen.
Sie eignet sich gut für Support oder Benachrichtigungen, wenn Sie deterministisches Routing zurück zu Zalo wünschen.

Diese Seite beschreibt das aktuelle OpenClaw-Verhalten für **Zalo Bot Creator / Marketplace-Bots**.
**Zalo Official Account (OA)-Bots** sind eine andere Zalo-Produktoberfläche und können sich anders verhalten.

- Ein Zalo-Bot-API-Kanal, der vom Gateway verwaltet wird.
- Deterministisches Routing: Antworten gehen zurück zu Zalo; das Modell wählt niemals Kanäle aus.
- DMs teilen sich die Hauptsitzung des Agenten.
- Der Abschnitt [Fähigkeiten](#capabilities) unten zeigt die aktuelle Unterstützung für Marketplace-Bots.

## Einrichtung (schneller Weg)

### 1) Bot-Token erstellen (Zalo Bot Platform)

1. Gehen Sie zu [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) und melden Sie sich an.
2. Erstellen Sie einen neuen Bot und konfigurieren Sie seine Einstellungen.
3. Kopieren Sie das vollständige Bot-Token (typischerweise `numeric_id:secret`). Bei Marketplace-Bots kann das nutzbare Laufzeit-Token nach der Erstellung in der Willkommensnachricht des Bots erscheinen.

### 2) Token konfigurieren (Env oder Konfiguration)

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

Wenn Sie später zu einer Zalo-Bot-Oberfläche wechseln, auf der Gruppen verfügbar sind, können Sie gruppenspezifische Konfigurationen wie `groupPolicy` und `groupAllowFrom` explizit hinzufügen. Zum aktuellen Verhalten von Marketplace-Bots siehe [Fähigkeiten](#capabilities).

Env-Option: `ZALO_BOT_TOKEN=...` (funktioniert nur für das Standardkonto).

Multi-Account-Unterstützung: Verwenden Sie `channels.zalo.accounts` mit Tokens pro Konto und optionalem `name`.

3. Starten Sie den Gateway neu. Zalo startet, wenn ein Token aufgelöst wird (Env oder Konfiguration).
4. DM-Zugriff verwendet standardmäßig Pairing. Genehmigen Sie den Code, wenn der Bot erstmals kontaktiert wird.

## Funktionsweise (Verhalten)

- Eingehende Nachrichten werden mit Medien-Platzhaltern in den gemeinsamen Kanal-Umschlag normalisiert.
- Antworten werden immer zurück in denselben Zalo-Chat geroutet.
- Standardmäßig Long-Polling; der Webhook-Modus ist mit `channels.zalo.webhookUrl` verfügbar.

## Grenzen

- Ausgehender Text wird in Blöcke mit 2000 Zeichen aufgeteilt (Limit der Zalo API).
- Medien-Downloads/-Uploads werden durch `channels.zalo.mediaMaxMb` begrenzt (Standard 5).
- Streaming ist standardmäßig blockiert, da das Limit von 2000 Zeichen Streaming weniger nützlich macht.

## Zugriffskontrolle (DMs)

### DM-Zugriff

- Standard: `channels.zalo.dmPolicy = "pairing"`. Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt sind (Codes laufen nach 1 Stunde ab).
- Genehmigen über:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing ist der standardmäßige Token-Austausch. Details: [Pairing](/de/channels/pairing)
- `channels.zalo.allowFrom` akzeptiert numerische Benutzer-IDs (keine Suche nach Benutzernamen verfügbar).

## Zugriffskontrolle (Gruppen)

Für **Zalo Bot Creator / Marketplace-Bots** war Gruppenunterstützung praktisch nicht verfügbar, da der Bot überhaupt keiner Gruppe hinzugefügt werden konnte.

Das bedeutet, dass die folgenden gruppenbezogenen Konfigurationsschlüssel im Schema existieren, aber für Marketplace-Bots nicht nutzbar waren:

- `channels.zalo.groupPolicy` steuert die Verarbeitung eingehender Gruppennachrichten: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` beschränkt, welche Absender-IDs den Bot in Gruppen auslösen können.
- Wenn `groupAllowFrom` nicht gesetzt ist, fällt Zalo für Absenderprüfungen auf `allowFrom` zurück.
- Laufzeithinweis: Wenn `channels.zalo` vollständig fehlt, fällt die Laufzeit aus Sicherheitsgründen weiterhin auf `groupPolicy="allowlist"` zurück.

Die Gruppenrichtlinienwerte (wenn Gruppenzugriff auf Ihrer Bot-Oberfläche verfügbar ist) sind:

- `groupPolicy: "disabled"` — blockiert alle Gruppennachrichten.
- `groupPolicy: "open"` — erlaubt jedes Gruppenmitglied (durch Erwähnung begrenzt).
- `groupPolicy: "allowlist"` — standardmäßig geschlossen; nur erlaubte Absender werden akzeptiert.

Wenn Sie eine andere Zalo-Bot-Produktoberfläche verwenden und funktionierendes Gruppenverhalten verifiziert haben, dokumentieren Sie dies separat, statt anzunehmen, dass es dem Marketplace-Bot-Ablauf entspricht.

## Long-Polling vs. Webhook

- Standard: Long-Polling (keine öffentliche URL erforderlich).
- Webhook-Modus: Setzen Sie `channels.zalo.webhookUrl` und `channels.zalo.webhookSecret`.
  - Das Webhook-Secret muss 8-256 Zeichen lang sein.
  - Die Webhook-URL muss HTTPS verwenden.
  - Zalo sendet Ereignisse zur Verifizierung mit dem Header `X-Bot-Api-Secret-Token`.
  - Gateway HTTP verarbeitet Webhook-Anfragen unter `channels.zalo.webhookPath` (standardmäßig der Pfad der Webhook-URL).
  - Anfragen müssen `Content-Type: application/json` (oder `+json`-Medientypen) verwenden.
  - Doppelte Ereignisse (`event_name + message_id`) werden für ein kurzes Replay-Fenster ignoriert.
  - Stoßweiser Traffic wird pro Pfad/Quelle ratenbegrenzt und kann HTTP 429 zurückgeben.

**Hinweis:** getUpdates (Polling) und Webhook schließen sich laut Zalo-API-Dokumentation gegenseitig aus.

## Unterstützte Nachrichtentypen

Eine kurze Übersicht zur Unterstützung finden Sie unter [Fähigkeiten](#capabilities). Die folgenden Hinweise ergänzen Details dort, wo das Verhalten zusätzlichen Kontext benötigt.

- **Textnachrichten**: Volle Unterstützung mit Aufteilung in Blöcke von 2000 Zeichen.
- **Einfache URLs im Text**: Verhalten sich wie normale Texteingabe.
- **Linkvorschauen / Rich-Link-Karten**: Siehe den Marketplace-Bot-Status unter [Fähigkeiten](#capabilities); sie lösten nicht zuverlässig eine Antwort aus.
- **Bildnachrichten**: Siehe den Marketplace-Bot-Status unter [Fähigkeiten](#capabilities); die Verarbeitung eingehender Bilder war unzuverlässig (Tippanzeige ohne finale Antwort).
- **Sticker**: Siehe den Marketplace-Bot-Status unter [Fähigkeiten](#capabilities).
- **Sprachnachrichten / Audiodateien / Video / generische Dateianhänge**: Siehe den Marketplace-Bot-Status unter [Fähigkeiten](#capabilities).
- **Nicht unterstützte Typen**: Werden protokolliert (zum Beispiel Nachrichten von geschützten Benutzern).

## Fähigkeiten

Diese Tabelle fasst das aktuelle Verhalten von **Zalo Bot Creator / Marketplace-Bots** in OpenClaw zusammen.

| Funktion                    | Status                                           |
| --------------------------- | ------------------------------------------------ |
| Direktnachrichten           | ✅ Unterstützt                                   |
| Gruppen                     | ❌ Für Marketplace-Bots nicht verfügbar          |
| Medien (eingehende Bilder)  | ⚠️ Eingeschränkt / in Ihrer Umgebung verifizieren |
| Medien (ausgehende Bilder)  | ⚠️ Für Marketplace-Bots nicht erneut getestet    |
| Einfache URLs im Text       | ✅ Unterstützt                                   |
| Linkvorschauen              | ⚠️ Für Marketplace-Bots unzuverlässig            |
| Reaktionen                  | ❌ Nicht unterstützt                             |
| Sticker                     | ⚠️ Keine Agent-Antwort für Marketplace-Bots      |
| Sprachnachrichten / Audio / Video | ⚠️ Keine Agent-Antwort für Marketplace-Bots |
| Dateianhänge                | ⚠️ Keine Agent-Antwort für Marketplace-Bots      |
| Threads                     | ❌ Nicht unterstützt                             |
| Umfragen                    | ❌ Nicht unterstützt                             |
| Native Befehle              | ❌ Nicht unterstützt                             |
| Streaming                   | ⚠️ Blockiert (Limit von 2000 Zeichen)            |

## Zustellziele (CLI/Cron)

- Verwenden Sie eine Chat-ID als Ziel.
- Beispiel: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Fehlerbehebung

**Bot antwortet nicht:**

- Prüfen Sie, ob das Token gültig ist: `openclaw channels status --probe`
- Verifizieren Sie, dass der Absender genehmigt ist (Pairing oder allowFrom)
- Prüfen Sie die Gateway-Logs: `openclaw logs --follow`

**Webhook empfängt keine Ereignisse:**

- Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet
- Verifizieren Sie, dass das Secret-Token 8-256 Zeichen lang ist
- Bestätigen Sie, dass der Gateway-HTTP-Endpunkt unter dem konfigurierten Pfad erreichbar ist
- Prüfen Sie, dass getUpdates-Polling nicht läuft (sie schließen sich gegenseitig aus)

## Konfigurationsreferenz (Zalo)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Die flachen Top-Level-Schlüssel (`channels.zalo.botToken`, `channels.zalo.dmPolicy` und ähnliche) sind eine Legacy-Kurzform für ein einzelnes Konto. Bevorzugen Sie für neue Konfigurationen `channels.zalo.accounts.<id>.*`. Beide Formen werden hier weiterhin dokumentiert, da sie im Schema existieren.

Provider-Optionen:

- `channels.zalo.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.zalo.botToken`: Bot-Token von der Zalo Bot Platform.
- `channels.zalo.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.zalo.allowFrom`: DM-Allowlist (Benutzer-IDs). `open` erfordert `"*"`. Der Assistent fragt nach numerischen IDs.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist). In der Konfiguration vorhanden; siehe [Fähigkeiten](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) zum aktuellen Marketplace-Bot-Verhalten.
- `channels.zalo.groupAllowFrom`: Allowlist für Gruppenabsender (Benutzer-IDs). Fällt auf `allowFrom` zurück, wenn nicht gesetzt.
- `channels.zalo.mediaMaxMb`: Limit für eingehende/ausgehende Medien (MB, Standard 5).
- `channels.zalo.webhookUrl`: Webhook-Modus aktivieren (HTTPS erforderlich).
- `channels.zalo.webhookSecret`: Webhook-Secret (8-256 Zeichen).
- `channels.zalo.webhookPath`: Webhook-Pfad auf dem Gateway-HTTP-Server.
- `channels.zalo.proxy`: Proxy-URL für API-Anfragen.

Multi-Account-Optionen:

- `channels.zalo.accounts.<id>.botToken`: Token pro Konto.
- `channels.zalo.accounts.<id>.tokenFile`: reguläre Token-Datei pro Konto. Symlinks werden abgelehnt.
- `channels.zalo.accounts.<id>.name`: Anzeigename.
- `channels.zalo.accounts.<id>.enabled`: Konto aktivieren/deaktivieren.
- `channels.zalo.accounts.<id>.dmPolicy`: DM-Richtlinie pro Konto.
- `channels.zalo.accounts.<id>.allowFrom`: Allowlist pro Konto.
- `channels.zalo.accounts.<id>.groupPolicy`: Gruppenrichtlinie pro Konto. In der Konfiguration vorhanden; siehe [Fähigkeiten](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) zum aktuellen Marketplace-Bot-Verhalten.
- `channels.zalo.accounts.<id>.groupAllowFrom`: Allowlist für Gruppenabsender pro Konto.
- `channels.zalo.accounts.<id>.webhookUrl`: Webhook-URL pro Konto.
- `channels.zalo.accounts.<id>.webhookSecret`: Webhook-Secret pro Konto.
- `channels.zalo.accounts.<id>.webhookPath`: Webhook-Pfad pro Konto.
- `channels.zalo.accounts.<id>.proxy`: Proxy-URL pro Konto.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Begrenzung durch Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
