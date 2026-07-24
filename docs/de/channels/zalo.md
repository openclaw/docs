---
read_when:
    - Arbeiten an Zalo-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Zalo-Bot-Unterstützung
title: Zalo
x-i18n:
    generated_at: "2026-07-24T04:25:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f3e0bfe6003d3b2f38411fcc5a4e82266733b042693c7853d0b3c8a3864273c5
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimentell. Direktnachrichten und Gruppenchats sind beide implementiert; die nachstehende Tabelle [Funktionen](#capabilities) gibt das verifizierte Verhalten von Zalo Bot Creator-/Marketplace-Bots wieder.

## Mitgeliefertes Plugin

Zalo wird in aktuellen OpenClaw-Versionen als mitgeliefertes Plugin ausgeliefert, sodass paketierte Builds keine separate Installation benötigen.

Installieren Sie bei einem älteren Build oder einer benutzerdefinierten Installation, die Zalo ausschließt, das npm-Paket direkt:

- Installation: `openclaw plugins install @openclaw/zalo`
- Festgelegte Version: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Aus einem lokalen Checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

1. Erstellen Sie unter [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) ein Bot-Token (anmelden, einen Bot erstellen, Einstellungen konfigurieren). Das Token lautet `numeric_id:secret`; bei Marketplace-Bots kann das verwendbare Laufzeit-Token in der Willkommensnachricht des Bots erscheinen.
2. Legen Sie das Token entweder über die Umgebungsvariable `ZALO_BOT_TOKEN=...` (nur Standardkonto) oder in der Konfiguration fest.
3. Starten Sie das Gateway neu.
4. Bestätigen Sie beim ersten Kontakt per Direktnachricht den Kopplungscode (die standardmäßige Richtlinie für Direktnachrichten ist die Kopplung).

Minimalkonfiguration:

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

Mehrere Konten: Fügen Sie unter `channels.zalo.accounts.<id>` weitere Einträge hinzu, jeweils mit eigenem `botToken`/`name`. `channels.zalo.botToken` (flach, ohne `accounts`) ist eine veraltete Kurzform für ein einzelnes Konto; verwenden Sie für neue Konfigurationen vorzugsweise `accounts.<id>.*`.

## Was es ist

Zalo ist eine auf Vietnam ausgerichtete Messaging-App. Über ihre Bot-API kann das Gateway einen Bot sowohl für 1:1-Unterhaltungen als auch für Gruppenchats betreiben, wobei Antworten deterministisch an Zalo zurückgeleitet werden (das Modell wählt niemals Kanäle aus).

Diese Seite behandelt **Zalo Bot Creator-/Marketplace-Bots**. **Zalo Official Account (OA)-Bots** bilden eine andere Produktoberfläche und können sich anders verhalten; sie werden auf dieser Seite nicht behandelt.

## Funktionsweise

- Eingehende Nachrichten werden mit Medienplatzhaltern in den gemeinsamen Kanal-Umschlag normalisiert.
- Antworten werden immer an denselben Zalo-Chat zurückgeleitet; Antworten mit Zitat werden nicht verwendet (`replyToMode` ist fest deaktiviert).
- Standardmäßig wird Long-Polling (`getUpdates`) verwendet; der Webhook-Modus ist über `channels.zalo.webhookUrl` verfügbar.
- In Gruppen ist eine @Erwähnung erforderlich, um den Bot auszulösen; dies kann nicht pro Kanal konfiguriert werden.

## Grenzwerte

| Grenzwert                     | Wert                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| Segmentgröße für ausgehenden Text | 2000 Zeichen (Grenzwert der Zalo-API)                                |
| Mediengröße (eingehend/ausgehend) | `channels.zalo.mediaMaxMb`, standardmäßig `5` MB              |
| Webhook-Anfragetext           | 1 MB, 30s Lesezeitüberschreitung                                         |
| Webhook-Ratenbegrenzung       | 120 Anfragen / 60s pro Pfad+Client-IP, danach HTTP 429                   |
| Webhook-Wiederholungsmarkierungen | 30 Tage, bis zu 20.000 abgeschlossene Ereignisse pro Konto (nach Nachrichten-ID indiziert) |

## Zugriffskontrolle

### Direktnachrichten

- `channels.zalo.dmPolicy`: `pairing` (Standard) | `allowlist` | `open` | `disabled`.
- Kopplung: Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden bis zur Bestätigung ignoriert. Codes laufen nach 1 Stunde ab.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Details: [Kopplung](/de/channels/pairing)
- `channels.zalo.allowFrom` akzeptiert numerische Zalo-Benutzer-IDs (keine Suche nach Benutzernamen). `open` erfordert `"*"`.

### Gruppen

Gruppenchats werden vom Plugin unterstützt (`chatTypes: ["direct", "group"]`) und durch Erwähnung sowie die Gruppenrichtlinie gesteuert:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` beschränkt, welche Absender-IDs den Bot in Gruppen auslösen können; wenn nicht festgelegt, wird auf `allowFrom` zurückgegriffen.
- Standardauflösung: Wenn `channels.zalo` konfiguriert ist, wird ein nicht festgelegtes `groupPolicy` als `open` aufgelöst. Wenn `channels.zalo` vollständig fehlt, verwendet die Laufzeit aus Sicherheitsgründen `allowlist`.
- Aus der Praxis gemeldete Einschränkung: Bei einigen Marketplace-Bot-Konfigurationen konnte der Bot überhaupt nicht zu einer Gruppe hinzugefügt werden. Falls dies auftritt, überprüfen Sie die Zalo-Bot-Platform-Einstellungen Ihres Bots; es handelt sich um eine plattformseitige Einschränkung, nicht um eine OpenClaw-Richtlinie.

## Long-Polling im Vergleich zu Webhook

- Standard: Long-Polling (keine öffentliche URL erforderlich).
- Webhook-Modus: Legen Sie `channels.zalo.webhookUrl` und `channels.zalo.webhookSecret` fest.
  - Die Webhook-URL muss HTTPS verwenden.
  - Das Webhook-Secret muss 8-256 Zeichen lang sein.
  - Zalo sendet Ereignisse mit einem `X-Bot-Api-Secret-Token`-Header, der mittels eines zeitkonstanten Vergleichs geprüft wird.
  - Gateway HTTP verarbeitet Webhook-Anfragen unter `channels.zalo.webhookPath` (standardmäßig der Pfad der Webhook-URL).
  - Anfragen müssen `Content-Type: application/json` (oder einen `+json`-Medientyp) verwenden.
  - HTTP 200 wird erst zurückgegeben, nachdem das Rohereignis dauerhaft gespeichert wurde; Speicherfehler führen zu HTTP 500.
  - getUpdates-Polling und Webhook schließen sich gemäß der Zalo-API-Dokumentation gegenseitig aus.

## Unterstützte Nachrichtentypen

- Text: vollständig unterstützt, auf Segmente von 2000 Zeichen aufgeteilt.
- Medien: eingehend/ausgehend, begrenzt durch `mediaMaxMb`.
- Reaktionen, Threads, Umfragen, native Befehle: werden vom Plugin nicht unterstützt.
- Streaming: Das Plugin deklariert Unterstützung für Block-Streaming, Zalo verfügt jedoch über keine speziellen Einstellmöglichkeiten für die ausgehende Warteschlange oder die Zusammenführung von Texten (anders als einige andere regionale Kanäle); überprüfen Sie das aktuelle Verhalten in Ihrer Umgebung, falls dies für Ihren Anwendungsfall relevant ist.

## Funktionen

| Funktion                 | Status                            |
| ------------------------ | --------------------------------- |
| Direktnachrichten        | Unterstützt                       |
| Gruppen                  | Unterstützt (Erwähnung erforderlich) |
| Medien (eingehend/ausgehend) | Unterstützt, begrenzt durch `mediaMaxMb` |
| Reaktionen               | Nicht unterstützt                 |
| Threads                  | Nicht unterstützt                 |
| Umfragen                 | Nicht unterstützt                 |
| Native Befehle           | Nicht unterstützt                 |
| Antwort auf / Zitat      | Nicht verwendet (fest deaktiviert) |

## Zustellziele (CLI/Cron)

Verwenden Sie eine Chat-ID als Ziel:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Fehlerbehebung

**Bot antwortet nicht:**

- Prüfen Sie das Token: `openclaw channels status --probe`
- Überprüfen Sie, ob der Absender bestätigt ist (Kopplung oder `allowFrom`)
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`

**Webhook empfängt keine Ereignisse:**

- Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet
- Stellen Sie sicher, dass das Secret 8-256 Zeichen lang ist
- Stellen Sie sicher, dass der Gateway-HTTP-Endpunkt unter dem konfigurierten Pfad erreichbar ist
- Stellen Sie sicher, dass nicht gleichzeitig getUpdates-Polling ausgeführt wird (beide schließen sich gegenseitig aus)
- Eine Anfragespitze kann HTTP 429 zurückgeben (120 Anfragen / 60s pro Pfad+IP); warten Sie und versuchen Sie es erneut

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

| Einstellung                                  | Beschreibung                                      | Standard              |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | Kanalstart aktivieren/deaktivieren                | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Bot-Token von der Zalo Bot Platform               | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | Token aus einer Datei lesen (Symlinks werden abgelehnt) | -                |
| `channels.zalo.accounts.<id>.name`           | Anzeigename                                       | -                     |
| `channels.zalo.accounts.<id>.enabled`        | Dieses Konto aktivieren/deaktivieren              | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | Kontospezifische Richtlinie für Direktnachrichten | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | Zulassungsliste für Direktnachrichten (Benutzer-IDs) | -                  |
| `channels.zalo.accounts.<id>.groupPolicy`    | Kontospezifische Gruppenrichtlinie                | siehe [Gruppen](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Zulassungsliste für Gruppenabsender; greift auf `allowFrom` zurück | - |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Mediengrenze für eingehende/ausgehende Daten (MB) | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Webhook-Modus aktivieren (HTTPS erforderlich)     | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Webhook-Secret (8-256 Zeichen)                    | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Webhook-Pfad auf dem Gateway-HTTP-Server          | Pfad der Webhook-URL  |
| `channels.zalo.accounts.<id>.proxy`          | Proxy-URL für API-Anfragen                        | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | Überschreibung des Präfixes für ausgehende Antworten | -                  |
| `channels.zalo.defaultAccount`               | Standardkonto, wenn mehrere konfiguriert sind     | `default`             |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` und andere flache Schlüssel auf oberster Ebene sind die veraltete Kurzform für ein einzelnes Konto für die oben aufgeführten Felder; beide Formen werden unterstützt.

Umgebungsoption: `ZALO_BOT_TOKEN=...` löst nur das Token des Standardkontos auf.

## Verwandte Themen

- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) – Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) – Verhalten von Gruppenchats und Auslösung durch Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) – Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Härtung
