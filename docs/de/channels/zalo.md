---
read_when:
    - Arbeiten an Zalo-Funktionen oder Webhooks
summary: Supportstatus, Funktionen und Konfiguration des Zalo-Bots
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimentell. Direktnachrichten werden unterstützt. Der Abschnitt [Funktionen](#capabilities) unten spiegelt das aktuelle Verhalten von Marketplace-Bots wider.

## Gebündeltes Plugin

Zalo wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.

Wenn Sie eine ältere Version oder eine benutzerdefinierte Installation verwenden, die Zalo ausschließt, installieren Sie das npm-Paket direkt:

- Installation über die CLI: `openclaw plugins install @openclaw/zalo`
- Fixierte Version: `openclaw plugins install @openclaw/zalo@2026.5.2`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Zalo-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den Befehlen oben hinzufügen.
2. Legen Sie das Token fest:
   - Env: `ZALO_BOT_TOKEN=...`
   - Oder Konfiguration: `channels.zalo.accounts.default.botToken: "..."`.
3. Starten Sie den Gateway neu (oder schließen Sie die Einrichtung ab).
4. Der Zugriff auf Direktnachrichten erfolgt standardmäßig per Pairing; genehmigen Sie den Pairing-Code beim ersten Kontakt.

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

Zalo ist eine Messaging-App mit Fokus auf Vietnam; ihre Bot API ermöglicht es dem Gateway, einen Bot für 1:1-Unterhaltungen auszuführen.
Sie eignet sich gut für Support oder Benachrichtigungen, wenn Sie deterministisches Routing zurück zu Zalo wünschen.

Diese Seite beschreibt das aktuelle OpenClaw-Verhalten für **Zalo Bot Creator / Marketplace-Bots**.
**Zalo Official Account (OA)-Bots** sind eine andere Zalo-Produktoberfläche und können sich anders verhalten.

- Ein Zalo Bot API-Kanal, der dem Gateway gehört.
- Deterministisches Routing: Antworten gehen zurück an Zalo; das Modell wählt niemals Kanäle aus.
- Direktnachrichten teilen sich die Hauptsitzung des Agenten.
- Der Abschnitt [Funktionen](#capabilities) unten zeigt die aktuelle Unterstützung für Marketplace-Bots.

## Einrichtung (schneller Weg)

### 1) Ein Bot-Token erstellen (Zalo Bot Platform)

1. Gehen Sie zu [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) und melden Sie sich an.
2. Erstellen Sie einen neuen Bot und konfigurieren Sie seine Einstellungen.
3. Kopieren Sie das vollständige Bot-Token (typischerweise `numeric_id:secret`). Bei Marketplace-Bots kann das nutzbare Laufzeit-Token nach der Erstellung in der Willkommensnachricht des Bots erscheinen.

### 2) Das Token konfigurieren (Env oder Konfiguration)

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

Wenn Sie später zu einer Zalo-Bot-Oberfläche wechseln, auf der Gruppen verfügbar sind, können Sie gruppenspezifische Konfigurationen wie `groupPolicy` und `groupAllowFrom` explizit hinzufügen. Zum aktuellen Verhalten von Marketplace-Bots siehe [Funktionen](#capabilities).

Env-Option: `ZALO_BOT_TOKEN=...` (funktioniert nur für das Standardkonto).

Mehrkontenunterstützung: Verwenden Sie `channels.zalo.accounts` mit Token pro Konto und optionalem `name`.

3. Starten Sie den Gateway neu. Zalo startet, wenn ein Token aufgelöst wurde (Env oder Konfiguration).
4. Der Zugriff auf Direktnachrichten ist standardmäßig auf Pairing eingestellt. Genehmigen Sie den Code, wenn der Bot zum ersten Mal kontaktiert wird.

## Funktionsweise (Verhalten)

- Eingehende Nachrichten werden mit Medienplatzhaltern in den gemeinsamen Kanal-Umschlag normalisiert.
- Antworten werden immer zurück an denselben Zalo-Chat geroutet.
- Standardmäßig Long-Polling; Webhook-Modus ist mit `channels.zalo.webhookUrl` verfügbar.

## Limits

- Ausgehender Text wird in Abschnitte von 2000 Zeichen aufgeteilt (Limit der Zalo API).
- Medien-Downloads/-Uploads sind durch `channels.zalo.mediaMaxMb` begrenzt (Standard 5).
- Streaming ist standardmäßig blockiert, da das Limit von 2000 Zeichen Streaming weniger nützlich macht.

## Zugriffskontrolle (Direktnachrichten)

### Zugriff auf Direktnachrichten

- Standard: `channels.zalo.dmPolicy = "pairing"`. Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt wurden (Codes laufen nach 1 Stunde ab).
- Genehmigen über:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing ist der standardmäßige Token-Austausch. Details: [Pairing](/de/channels/pairing)
- `channels.zalo.allowFrom` akzeptiert numerische Benutzer-IDs (keine Benutzernamensuche verfügbar).

## Zugriffskontrolle (Gruppen)

Für **Zalo Bot Creator / Marketplace-Bots** war Gruppenunterstützung praktisch nicht verfügbar, da der Bot überhaupt nicht zu einer Gruppe hinzugefügt werden konnte.

Das bedeutet, dass die gruppenbezogenen Konfigurationsschlüssel unten im Schema existieren, aber für Marketplace-Bots nicht nutzbar waren:

- `channels.zalo.groupPolicy` steuert die Verarbeitung eingehender Gruppennachrichten: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` beschränkt, welche Absender-IDs den Bot in Gruppen auslösen können.
- Wenn `groupAllowFrom` nicht gesetzt ist, fällt Zalo für Absenderprüfungen auf `allowFrom` zurück.
- Laufzeithinweis: Wenn `channels.zalo` vollständig fehlt, fällt die Laufzeit aus Sicherheitsgründen weiterhin auf `groupPolicy="allowlist"` zurück.

Die Gruppenrichtlinienwerte (wenn Gruppenzugriff auf Ihrer Bot-Oberfläche verfügbar ist) sind:

- `groupPolicy: "disabled"` — blockiert alle Gruppennachrichten.
- `groupPolicy: "open"` — erlaubt jedes Gruppenmitglied (nur bei Erwähnung).
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
  - Doppelte Ereignisse (`event_name + message_id`) werden für ein kurzes Wiederholungsfenster ignoriert.
  - Burst-Traffic wird pro Pfad/Quelle ratenbegrenzt und kann HTTP 429 zurückgeben.

**Hinweis:** getUpdates (Polling) und Webhook schließen sich laut Zalo API-Dokumentation gegenseitig aus.

## Unterstützte Nachrichtentypen

Eine schnelle Übersicht zur Unterstützung finden Sie unter [Funktionen](#capabilities). Die Hinweise unten ergänzen Details, wo das Verhalten zusätzlichen Kontext benötigt.

- **Textnachrichten**: Vollständige Unterstützung mit Aufteilung in 2000-Zeichen-Abschnitte.
- **Einfache URLs im Text**: Verhalten sich wie normale Texteingabe.
- **Linkvorschauen / Rich-Link-Karten**: Siehe Marketplace-Bot-Status unter [Funktionen](#capabilities); sie lösten nicht zuverlässig eine Antwort aus.
- **Bildnachrichten**: Siehe Marketplace-Bot-Status unter [Funktionen](#capabilities); die Verarbeitung eingehender Bilder war unzuverlässig (Tippanzeige ohne abschließende Antwort).
- **Sticker**: Siehe Marketplace-Bot-Status unter [Funktionen](#capabilities).
- **Sprachnotizen / Audiodateien / Video / generische Dateianhänge**: Siehe Marketplace-Bot-Status unter [Funktionen](#capabilities).
- **Nicht unterstützte Typen**: Werden protokolliert (zum Beispiel Nachrichten von geschützten Benutzern).

## Funktionen

Diese Tabelle fasst das aktuelle Verhalten von **Zalo Bot Creator / Marketplace-Bots** in OpenClaw zusammen.

| Funktion                    | Status                                          |
| --------------------------- | ----------------------------------------------- |
| Direktnachrichten           | ✅ Unterstützt                                  |
| Gruppen                     | ❌ Für Marketplace-Bots nicht verfügbar         |
| Medien (eingehende Bilder)  | ⚠️ Eingeschränkt / in Ihrer Umgebung verifizieren |
| Medien (ausgehende Bilder)  | ⚠️ Für Marketplace-Bots nicht erneut getestet   |
| Einfache URLs im Text       | ✅ Unterstützt                                  |
| Linkvorschauen              | ⚠️ Unzuverlässig für Marketplace-Bots           |
| Reaktionen                  | ❌ Nicht unterstützt                            |
| Sticker                     | ⚠️ Keine Agent-Antwort für Marketplace-Bots     |
| Sprachnotizen / Audio / Video | ⚠️ Keine Agent-Antwort für Marketplace-Bots   |
| Dateianhänge                | ⚠️ Keine Agent-Antwort für Marketplace-Bots     |
| Threads                     | ❌ Nicht unterstützt                            |
| Umfragen                    | ❌ Nicht unterstützt                            |
| Native Befehle              | ❌ Nicht unterstützt                            |
| Streaming                   | ⚠️ Blockiert (2000-Zeichen-Limit)               |

## Zustellziele (CLI/Cron)

- Verwenden Sie eine Chat-ID als Ziel.
- Beispiel: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Fehlerbehebung

**Bot antwortet nicht:**

- Prüfen Sie, ob das Token gültig ist: `openclaw channels status --probe`
- Verifizieren Sie, dass der Absender genehmigt ist (Pairing oder allowFrom)
- Prüfen Sie Gateway-Protokolle: `openclaw logs --follow`

**Webhook empfängt keine Ereignisse:**

- Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet
- Verifizieren Sie, dass das Secret-Token 8-256 Zeichen lang ist
- Bestätigen Sie, dass der HTTP-Endpunkt des Gateway unter dem konfigurierten Pfad erreichbar ist
- Prüfen Sie, dass getUpdates-Polling nicht läuft (sie schließen sich gegenseitig aus)

## Konfigurationsreferenz (Zalo)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Die flachen Schlüssel auf oberster Ebene (`channels.zalo.botToken`, `channels.zalo.dmPolicy` und ähnliche) sind eine Legacy-Kurzform für ein einzelnes Konto. Bevorzugen Sie für neue Konfigurationen `channels.zalo.accounts.<id>.*`. Beide Formen sind hier weiterhin dokumentiert, da sie im Schema existieren.

Provider-Optionen:

- `channels.zalo.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.zalo.botToken`: Bot-Token von Zalo Bot Platform.
- `channels.zalo.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.zalo.allowFrom`: Allowlist für Direktnachrichten (Benutzer-IDs). `open` erfordert `"*"`. Der Assistent fragt nach numerischen IDs.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist). In der Konfiguration vorhanden; siehe [Funktionen](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) zum aktuellen Verhalten von Marketplace-Bots.
- `channels.zalo.groupAllowFrom`: Allowlist für Gruppenabsender (Benutzer-IDs). Fällt auf `allowFrom` zurück, wenn nicht gesetzt.
- `channels.zalo.mediaMaxMb`: Limit für eingehende/ausgehende Medien (MB, Standard 5).
- `channels.zalo.webhookUrl`: Webhook-Modus aktivieren (HTTPS erforderlich).
- `channels.zalo.webhookSecret`: Webhook-Secret (8-256 Zeichen).
- `channels.zalo.webhookPath`: Webhook-Pfad auf dem HTTP-Server des Gateway.
- `channels.zalo.proxy`: Proxy-URL für API-Anfragen.

Mehrkontenoptionen:

- `channels.zalo.accounts.<id>.botToken`: Token pro Konto.
- `channels.zalo.accounts.<id>.tokenFile`: Reguläre Token-Datei pro Konto. Symlinks werden abgelehnt.
- `channels.zalo.accounts.<id>.name`: Anzeigename.
- `channels.zalo.accounts.<id>.enabled`: Konto aktivieren/deaktivieren.
- `channels.zalo.accounts.<id>.dmPolicy`: Richtlinie für Direktnachrichten pro Konto.
- `channels.zalo.accounts.<id>.allowFrom`: Allowlist pro Konto.
- `channels.zalo.accounts.<id>.groupPolicy`: Gruppenrichtlinie pro Konto. In der Konfiguration vorhanden; siehe [Funktionen](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) zum aktuellen Verhalten von Marketplace-Bots.
- `channels.zalo.accounts.<id>.groupAllowFrom`: Allowlist für Gruppenabsender pro Konto.
- `channels.zalo.accounts.<id>.webhookUrl`: Webhook-URL pro Konto.
- `channels.zalo.accounts.<id>.webhookSecret`: Webhook-Secret pro Konto.
- `channels.zalo.accounts.<id>.webhookPath`: Webhook-Pfad pro Konto.
- `channels.zalo.accounts.<id>.proxy`: Proxy-URL pro Konto.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — Authentifizierung und Pairing-Ablauf für Direktnachrichten
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
