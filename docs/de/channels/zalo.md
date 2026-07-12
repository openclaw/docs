---
read_when:
    - Arbeiten an Zalo-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Zalo-Bot-Unterstützung
title: Zalo
x-i18n:
    generated_at: "2026-07-12T15:03:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimentell. Direktnachrichten und Gruppenchats sind beide implementiert; die nachstehende Tabelle [Funktionen](#capabilities) gibt das verifizierte Verhalten für Zalo Bot Creator-/Marketplace-Bots wieder.

## Mitgeliefertes Plugin

Zalo wird in aktuellen OpenClaw-Versionen als mitgeliefertes Plugin ausgeliefert, daher benötigen paketierte Builds keine separate Installation.

Installieren Sie bei einem älteren Build oder einer benutzerdefinierten Installation, die Zalo ausschließt, das npm-Paket direkt:

- Installation: `openclaw plugins install @openclaw/zalo`
- Angeheftete Version: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Aus einem lokalen Checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

1. Erstellen Sie unter [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) ein Bot-Token (anmelden, einen Bot erstellen, Einstellungen konfigurieren). Das Token hat das Format `numeric_id:secret`; bei Marketplace-Bots kann das verwendbare Laufzeit-Token in der Begrüßungsnachricht des Bots erscheinen.
2. Legen Sie das Token entweder als Umgebungsvariable `ZALO_BOT_TOKEN=...` (nur Standardkonto) oder in der Konfiguration fest.
3. Starten Sie das Gateway neu.
4. Genehmigen Sie beim ersten Kontakt per Direktnachricht den Kopplungscode (die standardmäßige Direktnachrichtenrichtlinie ist Kopplung).

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

Mehrere Konten: Fügen Sie unter `channels.zalo.accounts.<id>` weitere Einträge hinzu, jeweils mit eigenem `botToken`/`name`. `channels.zalo.botToken` (flach, ohne `accounts`) ist eine veraltete Kurzform für ein einzelnes Konto; bevorzugen Sie für neue Konfigurationen `accounts.<id>.*`.

## Was es ist

Zalo ist eine auf Vietnam ausgerichtete Messaging-App. Über ihre Bot API kann das Gateway einen Bot sowohl für 1:1-Unterhaltungen als auch für Gruppenchats ausführen, wobei die Antworten deterministisch an Zalo zurückgeleitet werden (das Modell wählt niemals Kanäle aus).

Diese Seite behandelt **Zalo Bot Creator-/Marketplace-Bots**. **Zalo Official Account (OA)-Bots** bilden eine andere Produktoberfläche und können sich anders verhalten; sie werden auf dieser Seite nicht behandelt.

## Funktionsweise

- Eingehende Nachrichten werden mit Medienplatzhaltern in den gemeinsamen Kanal-Umschlag normalisiert.
- Antworten werden immer an denselben Zalo-Chat zurückgeleitet; Antworten mit Zitat werden nicht verwendet (`replyToMode` ist fest deaktiviert).
- Standardmäßig Long-Polling (`getUpdates`); der Webhook-Modus ist über `channels.zalo.webhookUrl` verfügbar.
- In Gruppen ist eine @Erwähnung erforderlich, um den Bot auszulösen; dies ist nicht pro Kanal konfigurierbar.

## Grenzwerte

| Grenzwert                      | Wert                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Segmentgröße ausgehender Texte | 2000 Zeichen (Grenzwert der Zalo API)                                         |
| Mediengröße (ein-/ausgehend)   | `channels.zalo.mediaMaxMb`, Standardwert `5` MB                               |
| Webhook-Anfragetext            | 1 MB, 30s Zeitüberschreitung beim Lesen                                       |
| Webhook-Ratenlimit             | 120 Anfragen / 60s pro Pfad+Client-IP, danach HTTP 429                        |
| Webhook-Duplikatereignisfenster | 5 Minuten (Schlüssel aus Pfad + Konto + Ereignisname + Chat + Absender + Nachrichten-ID) |

## Zugriffskontrolle

### Direktnachrichten

- `channels.zalo.dmPolicy`: `pairing` (Standard) | `allowlist` | `open` | `disabled`.
- Kopplung: Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden bis zur Genehmigung ignoriert. Codes laufen nach 1 Stunde ab.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Details: [Kopplung](/de/channels/pairing)
- `channels.zalo.allowFrom` akzeptiert numerische Zalo-Benutzer-IDs (keine Suche nach Benutzernamen). `open` erfordert `"*"`.

### Gruppen

Gruppenchats werden vom Plugin unterstützt (`chatTypes: ["direct", "group"]`) und durch Erwähnung sowie Gruppenrichtlinie beschränkt:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` beschränkt, welche Absender-IDs den Bot in Gruppen auslösen können; wenn nicht festgelegt, wird auf `allowFrom` zurückgegriffen.
- Standardauflösung: Wenn `channels.zalo` konfiguriert ist, wird ein nicht festgelegtes `groupPolicy` als `open` aufgelöst. Wenn `channels.zalo` vollständig fehlt, schließt die Laufzeit den Zugriff standardmäßig mit `allowlist`.
- Aus der Praxis gemeldete Einschränkung: Bei einigen Marketplace-Bot-Konfigurationen konnte der Bot überhaupt keiner Gruppe hinzugefügt werden. Falls dies bei Ihnen auftritt, überprüfen Sie die Zalo Bot Platform-Einstellungen Ihres Bots; es handelt sich um eine plattformseitige Einschränkung, nicht um eine OpenClaw-Richtlinie.

## Long-Polling oder Webhook

- Standard: Long-Polling (keine öffentliche URL erforderlich).
- Webhook-Modus: Legen Sie `channels.zalo.webhookUrl` und `channels.zalo.webhookSecret` fest.
  - Die Webhook-URL muss HTTPS verwenden.
  - Das Webhook-Geheimnis muss 8-256 Zeichen lang sein.
  - Zalo sendet Ereignisse mit einem `X-Bot-Api-Secret-Token`-Header, der mit einem Vergleich in konstanter Zeit geprüft wird.
  - Gateway HTTP verarbeitet Webhook-Anfragen unter `channels.zalo.webhookPath` (standardmäßig der Pfad der Webhook-URL).
  - Anfragen müssen `Content-Type: application/json` (oder einen `+json`-Medientyp) verwenden.
  - getUpdates-Polling und Webhook schließen sich gemäß der Zalo API-Dokumentation gegenseitig aus.

## Unterstützte Nachrichtentypen

- Text: vollständig unterstützt, in Segmente von 2000 Zeichen aufgeteilt.
- Medien: ein- und ausgehend, durch `mediaMaxMb` begrenzt.
- Reaktionen, Threads, Umfragen, native Befehle: vom Plugin nicht unterstützt.
- Streaming: Das Plugin deklariert die Fähigkeit zum Block-Streaming, Zalo verfügt jedoch über keine speziellen Einstellmöglichkeiten für ausgehende Warteschlangen oder die Zusammenführung von Text (anders als einige andere regionale Kanäle). Überprüfen Sie das aktuelle Verhalten in Ihrer Umgebung, falls dies für Ihren Anwendungsfall wichtig ist.

## Funktionen

| Funktion                 | Status                                  |
| ------------------------ | --------------------------------------- |
| Direktnachrichten        | Unterstützt                             |
| Gruppen                  | Unterstützt (Erwähnung erforderlich)    |
| Medien (ein-/ausgehend)  | Unterstützt, durch `mediaMaxMb` begrenzt |
| Reaktionen               | Nicht unterstützt                       |
| Threads                  | Nicht unterstützt                       |
| Umfragen                 | Nicht unterstützt                       |
| Native Befehle           | Nicht unterstützt                       |
| Antwort auf / Zitat      | Nicht verwendet (fest deaktiviert)      |

## Zustellziele (CLI/Cron)

Verwenden Sie eine Chat-ID als Ziel:

```bash
openclaw message send --channel zalo --target 123456789 --message "Hallo"
```

## Fehlerbehebung

**Bot antwortet nicht:**

- Prüfen Sie das Token: `openclaw channels status --probe`
- Vergewissern Sie sich, dass der Absender genehmigt ist (Kopplung oder `allowFrom`)
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`

**Webhook empfängt keine Ereignisse:**

- Vergewissern Sie sich, dass die Webhook-URL HTTPS verwendet
- Vergewissern Sie sich, dass das Geheimnis 8-256 Zeichen lang ist
- Vergewissern Sie sich, dass der Gateway-HTTP-Endpunkt unter dem konfigurierten Pfad erreichbar ist
- Vergewissern Sie sich, dass getUpdates-Polling nicht ebenfalls ausgeführt wird (beide schließen sich gegenseitig aus)
- Eine Anfragespitze kann HTTP 429 zurückgeben (120 Anfragen / 60s pro Pfad+IP); warten Sie und versuchen Sie es erneut

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

| Einstellung                                    | Beschreibung                                              | Standardwert               |
| ---------------------------------------------- | --------------------------------------------------------- | -------------------------- |
| `channels.zalo.enabled`                        | Kanalstart aktivieren/deaktivieren                        | `true`                     |
| `channels.zalo.accounts.<id>.botToken`         | Bot-Token von Zalo Bot Platform                           | -                          |
| `channels.zalo.accounts.<id>.tokenFile`        | Token aus einer Datei lesen (Symlinks werden abgelehnt)   | -                          |
| `channels.zalo.accounts.<id>.name`             | Anzeigename                                               | -                          |
| `channels.zalo.accounts.<id>.enabled`          | Dieses Konto aktivieren/deaktivieren                      | `true`                     |
| `channels.zalo.accounts.<id>.dmPolicy`         | Direktnachrichtenrichtlinie pro Konto                     | `pairing`                  |
| `channels.zalo.accounts.<id>.allowFrom`        | Direktnachrichten-Zulassungsliste (Benutzer-IDs)          | -                          |
| `channels.zalo.accounts.<id>.groupPolicy`      | Gruppenrichtlinie pro Konto                               | siehe [Gruppen](#groups)   |
| `channels.zalo.accounts.<id>.groupAllowFrom`   | Zulassungsliste für Gruppenabsender; greift auf `allowFrom` zurück | -                 |
| `channels.zalo.accounts.<id>.mediaMaxMb`       | Obergrenze für ein-/ausgehende Medien (MB)                | `5`                        |
| `channels.zalo.accounts.<id>.webhookUrl`       | Webhook-Modus aktivieren (HTTPS erforderlich)             | -                          |
| `channels.zalo.accounts.<id>.webhookSecret`    | Webhook-Geheimnis (8-256 Zeichen)                         | -                          |
| `channels.zalo.accounts.<id>.webhookPath`      | Webhook-Pfad auf dem Gateway-HTTP-Server                  | Pfad der Webhook-URL       |
| `channels.zalo.accounts.<id>.proxy`            | Proxy-URL für API-Anfragen                                | -                          |
| `channels.zalo.accounts.<id>.responsePrefix`   | Überschreibung des Präfixes ausgehender Antworten         | -                          |
| `channels.zalo.defaultAccount`                 | Standardkonto, wenn mehrere konfiguriert sind             | `default`                  |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` und andere flache Schlüssel auf oberster Ebene sind die veraltete Kurzform für ein einzelnes Konto für die oben genannten Felder; beide Formen werden unterstützt.

Umgebungsoption: `ZALO_BOT_TOKEN=...` wird nur als Token des Standardkontos aufgelöst.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - Direktnachrichtenauthentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Auslösung durch Erwähnung
- [Kanalrouting](/de/channels/channel-routing) - Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Absicherung
