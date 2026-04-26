---
read_when:
    - Einen Fehlerbericht oder eine Support-Anfrage vorbereiten
    - Gateway-Abstürze, Neustarts, Speicherdruck oder übergroße Payloads debuggen
    - Prüfen, welche Diagnosedaten erfasst oder geschwärzt werden
summary: Freigabefähige Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnoseexport
x-i18n:
    generated_at: "2026-04-26T11:28:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw kann ein lokales Diagnose-Zip erstellen, das sich sicher an Fehlerberichte
anhängen lässt. Es kombiniert bereinigten Gateway-Status, Health, Protokolle, Konfigurationsstruktur und
aktuelle payload-freie Stabilitätsereignisse.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Der Befehl gibt den geschriebenen Zip-Pfad aus. Um einen Pfad auszuwählen:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Was der Export enthält

Das Zip enthält:

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Protokollen, Status, Health
  und Stabilitätsdaten.
- `manifest.json`: Export-Metadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Protokollzusammenfassungen und aktuelle geschwärzte Protokollzeilen.
- Best-Effort-Snapshots von Gateway-Status und Health.
- `stability/latest.json`: neuestes persistiertes Stabilitätsbündel, falls verfügbar.

Der Export ist auch dann nützlich, wenn das Gateway ungesund ist. Wenn das Gateway
Status- oder Health-Anfragen nicht beantworten kann, werden lokale Protokolle, Konfigurationsstruktur und das neueste
Stabilitätsbündel weiterhin gesammelt, sofern verfügbar.

## Datenschutzmodell

Diagnosen sind so gestaltet, dass sie geteilt werden können. Der Export behält Betriebsdaten
bei, die beim Debuggen helfen, etwa:

- Namen von Subsystemen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauern, Byte-Anzahlen, Warteschlangenstatus und Speicherwerte
- bereinigte Protokollmetadaten und geschwärzte Betriebsnachrichten
- Konfigurationsstruktur und nicht geheime Feature-Einstellungen

Der Export lässt Folgendes weg oder schwärzt es:

- Chat-Text, Prompts, Anweisungen, Webhook-Bodies und Tool-Ausgaben
- Anmeldedaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- rohe Anfrage- oder Antwort-Bodies
- Konto-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Protokollnachricht wie Benutzer-, Chat-, Prompt- oder Tool-Payload-Text aussieht,
behält der Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die Byte-Anzahl.

## Stabilitätsrekorder

Das Gateway zeichnet standardmäßig einen begrenzten, payload-freien Stabilitätsstrom auf, wenn
Diagnosen aktiviert sind. Er ist für betriebliche Fakten gedacht, nicht für Inhalte.

Den Live-Rekorder prüfen:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Das neueste persistierte Stabilitätsbündel nach einem fatalen Beenden, Shutdown-
Timeout oder Startfehler nach einem Neustart prüfen:

```bash
openclaw gateway stability --bundle latest
```

Ein Diagnose-Zip aus dem neuesten persistierten Bündel erstellen:

```bash
openclaw gateway stability --bundle latest --export
```

Persistierte Bündel liegen unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: In einen bestimmten Zip-Pfad schreiben.
- `--log-lines <count>`: Maximale Anzahl bereinigter Protokollzeilen, die eingeschlossen werden.
- `--log-bytes <bytes>`: Maximale Anzahl an Protokoll-Bytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Health-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Health-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Health-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Health-Snapshots.
- `--no-stability-bundle`: Nachschlagen persistierter Stabilitätsbündel überspringen.
- `--json`: Maschinenlesbare Export-Metadaten ausgeben.

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. Um den Stabilitätsrekorder und die
Sammlung diagnostischer Ereignisse zu deaktivieren:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen reduziert die Details in Fehlerberichten. Es beeinflusst nicht das normale
Gateway-Logging.

## Verwandt

- [Health checks](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#system-and-identity)
- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — separater Ablauf für das Streamen von Diagnosen an einen Collector
