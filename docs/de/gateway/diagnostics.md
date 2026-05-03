---
read_when:
    - Fehlerbericht oder Supportanfrage vorbereiten
    - Debugging von Gateway-Abstürzen, Neustarts, Speicherdruck oder übergroßen Payloads
    - Überprüfen, welche Diagnosedaten aufgezeichnet oder geschwärzt werden
summary: Teilbare Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnoseexport
x-i18n:
    generated_at: "2026-05-03T21:32:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann eine lokale Diagnose-ZIP für Fehlerberichte erstellen. Sie kombiniert
bereinigten Gateway-Status, Health-Informationen, Logs, Konfigurationsstruktur
und aktuelle stabilitätsbezogene Ereignisse ohne Payloads.

Behandeln Sie Diagnosepakete wie Geheimnisse, bis Sie sie geprüft haben. Sie sind
darauf ausgelegt, Payloads und Zugangsdaten auszulassen oder zu schwärzen, aber
sie fassen dennoch lokale Gateway-Logs und den Laufzeitstatus auf Host-Ebene
zusammen.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Der Befehl gibt den Pfad der geschriebenen ZIP-Datei aus. Um einen Pfad
auszuwählen:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Chat-Befehl

Owner können `/diagnostics [note]` im Chat verwenden, um einen lokalen
Gateway-Export anzufordern. Verwenden Sie dies, wenn der Fehler in einer echten
Unterhaltung aufgetreten ist und Sie einen kopierbaren Bericht für den Support
möchten:

1. Senden Sie `/diagnostics` in der Unterhaltung, in der Ihnen das Problem
   aufgefallen ist. Fügen Sie eine kurze Notiz hinzu, wenn sie hilft, zum
   Beispiel `/diagnostics bad tool choice`.
2. OpenClaw sendet die Diagnose-Einleitung und fordert eine explizite
   Exec-Freigabe an. Die Freigabe führt `openclaw gateway diagnostics export --json`
   aus. Genehmigen Sie Diagnosen nicht über eine Allow-all-Regel.
3. Nach der Freigabe antwortet OpenClaw mit einem einfügbaren Bericht, der den
   lokalen Paketpfad, eine Manifest-Zusammenfassung, Datenschutzhinweise und
   relevante Sitzungs-IDs enthält.

In Gruppenchats kann ein Owner weiterhin `/diagnostics` ausführen, aber OpenClaw
postet die Diagnosedetails nicht zurück in den gemeinsamen Chat. Es sendet die
Einleitung, Freigabeaufforderungen, das Gateway-Exportergebnis und die
Aufschlüsselung der Codex-Sitzung/des Threads über die private Freigaberoute an
den Owner. Die Gruppe erhält nur einen kurzen Hinweis, dass der Diagnoseablauf
privat gesendet wurde. Wenn OpenClaw keine private Owner-Route finden kann,
schlägt der Befehl geschlossen fehl und fordert den Owner auf, ihn aus einer DM
auszuführen.

Wenn die aktive OpenClaw-Sitzung das native OpenAI Codex-Harness verwendet,
deckt dieselbe Exec-Freigabe auch einen OpenAI-Feedback-Upload für die
Codex-Laufzeit-Threads ab, die OpenClaw kennt. Dieser Upload ist vom lokalen
Gateway-ZIP getrennt und erscheint nur für Codex-Harness-Sitzungen. Vor der
Freigabe erklärt die Aufforderung, dass die Genehmigung von Diagnosen auch
Codex-Feedback sendet, listet aber keine Codex-Sitzungs- oder Thread-IDs auf.
Nach der Freigabe listet die Chat-Antwort die Kanäle, OpenClaw-Sitzungs-IDs,
Codex-Thread-IDs und lokalen Resume-Befehle für die Threads auf, die an
OpenAI-Server gesendet wurden. Wenn Sie die Freigabe ablehnen oder ignorieren,
führt OpenClaw den Export nicht aus, sendet kein Codex-Feedback und gibt die
Codex-IDs nicht aus.

Dadurch wird der übliche Codex-Debugging-Ablauf kurz: Auffälliges Verhalten in
Telegram, Discord oder einem anderen Kanal bemerken, `/diagnostics` ausführen,
einmal freigeben, den Bericht mit dem Support teilen und anschließend den
ausgegebenen Befehl `codex resume <thread-id>` lokal ausführen, wenn Sie den
nativen Codex-Thread selbst prüfen möchten. Siehe
[Codex-Harness](/de/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) für
diesen Prüfablauf.

## Inhalt des Exports

Die ZIP-Datei enthält:

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Logs,
  Status, Health-Informationen und Stabilitätsdaten.
- `manifest.json`: Export-Metadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Log-Zusammenfassungen und aktuelle geschwärzte Log-Zeilen.
- Best-Effort-Snapshots von Gateway-Status und Health-Informationen.
- `stability/latest.json`: neuestes persistiertes Stabilitätspaket, sofern verfügbar.

Der Export ist auch dann nützlich, wenn der Gateway fehlerhaft ist. Wenn der
Gateway keine Status- oder Health-Anfragen beantworten kann, werden die lokalen
Logs, die Konfigurationsstruktur und das neueste Stabilitätspaket dennoch
gesammelt, sofern verfügbar.

## Datenschutzmodell

Diagnosen sind so gestaltet, dass sie geteilt werden können. Der Export behält
Betriebsdaten, die beim Debugging helfen, zum Beispiel:

- Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauern, Byte-Zähler, Warteschlangenstatus und Speichermesswerte
- bereinigte Log-Metadaten und geschwärzte betriebliche Meldungen
- Konfigurationsstruktur und nicht geheime Funktionseinstellungen

Der Export lässt Folgendes aus oder schwärzt es:

- Chattext, Prompts, Anweisungen, Webhook-Bodys und Tool-Ausgaben
- Zugangsdaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- rohe Request- oder Response-Bodys
- Konto-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Log-Meldung wie Benutzer-, Chat-, Prompt- oder Tool-Payload-Text wirkt,
behält der Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die
Byte-Anzahl.

## Stabilitätsrecorder

Der Gateway zeichnet standardmäßig einen begrenzten Stabilitätsstrom ohne
Payloads auf, wenn Diagnosen aktiviert sind. Er ist für betriebliche Fakten
gedacht, nicht für Inhalte.

Derselbe Diagnose-Heartbeat zeichnet Liveness-Beispiele auf, wenn der Gateway
weiterläuft, aber die Node.js-Event-Loop oder CPU gesättigt wirkt. Diese
`diagnostic.liveness.warning`-Ereignisse enthalten Event-Loop-Verzögerung,
Event-Loop-Auslastung, CPU-Core-Verhältnis und die Anzahl aktiver/wartender/
eingereihter Sitzungen. Idle-Beispiele bleiben in der Telemetrie auf `info`-
Ebene. Liveness-Beispiele werden nur dann zu Gateway-Warnungen, wenn Arbeit
wartet oder eingereiht ist oder wenn aktive Arbeit mit anhaltender
Event-Loop-Verzögerung überlappt. Vorübergehende Max-Delay-Spitzen während
ansonsten gesunder Hintergrundarbeit bleiben in Debug-Logs. Sie starten den
Gateway nicht von selbst neu.

Den Live-Recorder prüfen:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Das neueste persistierte Stabilitätspaket nach einem fatalen Beenden, einem
Shutdown-Timeout oder einem Fehler beim Neustart prüfen:

```bash
openclaw gateway stability --bundle latest
```

Eine Diagnose-ZIP aus dem neuesten persistierten Paket erstellen:

```bash
openclaw gateway stability --bundle latest --export
```

Persistierte Pakete liegen unter `~/.openclaw/logs/stability/`, wenn Ereignisse
vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: in einen bestimmten ZIP-Pfad schreiben.
- `--log-lines <count>`: maximale Anzahl bereinigter Log-Zeilen, die eingeschlossen werden.
- `--log-bytes <bytes>`: maximale Anzahl Log-Bytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Health-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Health-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Health-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Health-Snapshots.
- `--no-stability-bundle`: Suche nach persistiertem Stabilitätspaket überspringen.
- `--json`: maschinenlesbare Export-Metadaten ausgeben.

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. Um den Stabilitätsrecorder und die
Erfassung von Diagnoseereignissen zu deaktivieren:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen reduziert die Detailtiefe von Fehlerberichten. Es
wirkt sich nicht auf das normale Gateway-Logging aus.

## Verwandte Themen

- [Health Checks](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#system-and-identity)
- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — separater Ablauf zum Streamen von Diagnosedaten an einen Collector
