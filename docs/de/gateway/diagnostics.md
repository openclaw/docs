---
read_when:
    - Einen Fehlerbericht oder eine Supportanfrage vorbereiten
    - Fehlerbehebung bei Gateway-Abstürzen, Neustarts, Speicherdruck oder zu großen Payloads
    - Prüfen, welche Diagnosedaten aufgezeichnet oder geschwärzt werden
summary: Teilbare Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnoseexport
x-i18n:
    generated_at: "2026-05-02T06:33:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann für Fehlerberichte eine lokale Diagnose-ZIP-Datei erstellen. Sie kombiniert
bereinigten Gateway-Status, Health-Daten, Logs, Konfigurationsstruktur und aktuelle payload-freie
Stabilitätsereignisse.

Behandeln Sie Diagnosepakete wie Geheimnisse, bis Sie sie geprüft haben. Sie sind
darauf ausgelegt, Payloads und Anmeldedaten auszulassen oder zu schwärzen, fassen aber dennoch
lokale Gateway-Logs und den Laufzeitstatus auf Host-Ebene zusammen.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Der Befehl gibt den Pfad der geschriebenen ZIP-Datei aus. So wählen Sie einen Pfad:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Chat-Befehl

Besitzer können `/diagnostics [note]` im Chat verwenden, um einen lokalen Gateway-Export anzufordern.
Verwenden Sie dies, wenn der Fehler in einer echten Unterhaltung aufgetreten ist und Sie einen
kopierbaren Bericht für den Support möchten:

1. Senden Sie `/diagnostics` in der Unterhaltung, in der Sie das Problem bemerkt haben. Fügen Sie
   bei Bedarf eine kurze Notiz hinzu, zum Beispiel `/diagnostics bad tool choice`.
2. OpenClaw sendet die Diagnose-Einleitung und fordert eine ausdrückliche Exec-Genehmigung an.
   Die Genehmigung führt `openclaw gateway diagnostics export --json` aus.
   Genehmigen Sie Diagnosen nicht über eine Alles-erlauben-Regel.
3. Nach der Genehmigung antwortet OpenClaw mit einem einfügbaren Bericht, der den lokalen
   Paketpfad, die Manifest-Zusammenfassung, Datenschutzhinweise und relevante Sitzungs-IDs enthält.

In Gruppenchats kann ein Besitzer weiterhin `/diagnostics` ausführen, aber OpenClaw
postet die Diagnosedetails nicht zurück in den gemeinsamen Chat. Es sendet die Einleitung,
Genehmigungsaufforderungen, das Gateway-Exportergebnis und die Aufschlüsselung der Codex-Sitzung/des Threads
über die private Genehmigungsroute an den Besitzer. Die Gruppe erhält nur eine kurze Mitteilung,
dass der Diagnoseablauf privat gesendet wurde. Wenn OpenClaw keine private
Besitzerroute finden kann, schlägt der Befehl geschlossen fehl und fordert den Besitzer auf, ihn aus einer DM auszuführen.

Wenn die aktive OpenClaw-Sitzung den nativen OpenAI Codex-Harness verwendet,
deckt dieselbe Exec-Genehmigung auch einen OpenAI-Feedback-Upload für die Codex-
Laufzeit-Threads ab, die OpenClaw kennt. Dieser Upload ist vom lokalen
Gateway-ZIP getrennt und erscheint nur für Codex-Harness-Sitzungen. Vor der Genehmigung erklärt die
Aufforderung, dass die Genehmigung von Diagnosen auch Codex-Feedback sendet, listet aber
keine Codex-Sitzungs- oder Thread-IDs auf. Nach der Genehmigung listet die Chat-Antwort
die Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen Fortsetzungsbefehle
für die Threads auf, die an OpenAI-Server gesendet wurden. Wenn Sie die
Genehmigung ablehnen oder ignorieren, führt OpenClaw den Export nicht aus, sendet kein Codex-Feedback und
gibt die Codex-IDs nicht aus.

Dadurch wird der übliche Codex-Debugging-Ablauf kurz: problematisches Verhalten in
Telegram, Discord oder einem anderen Kanal bemerken, `/diagnostics` ausführen, einmal genehmigen, den
Bericht mit dem Support teilen und dann lokal den ausgegebenen Befehl `codex resume <thread-id>`
ausführen, wenn Sie den nativen Codex-Thread selbst prüfen möchten. Siehe
[Codex-Harness](/de/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) für
diesen Prüfablauf.

## Inhalt des Exports

Die ZIP-Datei enthält:

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Logs, Status, Health-
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Log-Zusammenfassungen und aktuelle geschwärzte Log-Zeilen.
- Bestmögliche Gateway-Status- und Health-Snapshots.
- `stability/latest.json`: neuestes persistiertes Stabilitätspaket, sofern verfügbar.

Der Export ist auch nützlich, wenn der Gateway nicht fehlerfrei ist. Wenn der Gateway
Status- oder Health-Anfragen nicht beantworten kann, werden lokale Logs, Konfigurationsstruktur und das neueste
Stabilitätspaket dennoch gesammelt, sofern verfügbar.

## Datenschutzmodell

Diagnosen sind darauf ausgelegt, teilbar zu sein. Der Export behält Betriebsdaten,
die beim Debugging helfen, zum Beispiel:

- Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauern, Byte-Zahlen, Warteschlangenstatus und Speichermesswerte
- bereinigte Log-Metadaten und geschwärzte Betriebsmeldungen
- Konfigurationsstruktur und nicht geheime Funktionseinstellungen

Der Export lässt Folgendes aus oder schwärzt es:

- Chat-Text, Prompts, Anweisungen, Webhook-Bodys und Tool-Ausgaben
- Anmeldedaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- rohe Anfrage- oder Antwort-Bodys
- Konto-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Log-Meldung wie Benutzer-, Chat-, Prompt- oder Tool-Payload-Text aussieht, behält der
Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die Byte-Zahl.

## Stabilitätsrecorder

Der Gateway zeichnet standardmäßig einen begrenzten, payload-freien Stabilitätsstream auf, wenn
Diagnosen aktiviert sind. Er ist für Betriebsfakten gedacht, nicht für Inhalte.

Derselbe Diagnose-Heartbeat zeichnet Liveness-Samples auf, wenn der Gateway weiterläuft,
aber der Node.js-Event Loop oder die CPU ausgelastet wirkt. Diese
`diagnostic.liveness.warning`-Ereignisse enthalten Event-Loop-Verzögerung, Event-Loop-
Auslastung, CPU-Core-Verhältnis und Anzahlen aktiver/wartender/eingereihter Sitzungen. Idle-
Samples bleiben in der Telemetrie auf `info`-Ebene; sie werden nur als Gateway-
Warnungen protokolliert, wenn Diagnosearbeit aktiv ist, wartet oder eingereiht ist. Sie
starten den Gateway nicht selbst neu.

Prüfen Sie den Live-Recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Prüfen Sie das neueste persistierte Stabilitätspaket nach einem schwerwiegenden Exit, Shutdown-
Timeout oder Neustart-Startfehler:

```bash
openclaw gateway stability --bundle latest
```

Erstellen Sie eine Diagnose-ZIP-Datei aus dem neuesten persistierten Paket:

```bash
openclaw gateway stability --bundle latest --export
```

Persistierte Pakete liegen unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: in einen bestimmten ZIP-Pfad schreiben.
- `--log-lines <count>`: maximale Anzahl bereinigter Log-Zeilen, die einbezogen werden.
- `--log-bytes <bytes>`: maximale Anzahl von Log-Bytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Health-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Health-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Health-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Health-Snapshots.
- `--no-stability-bundle`: Suche nach persistiertem Stabilitätspaket überspringen.
- `--json`: maschinenlesbare Exportmetadaten ausgeben.

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. So deaktivieren Sie den Stabilitätsrecorder und
die Erfassung von Diagnoseereignissen:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen reduziert die Details in Fehlerberichten. Es wirkt sich nicht auf die normale
Gateway-Protokollierung aus.

## Verwandt

- [Health-Checks](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#system-and-identity)
- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — separater Ablauf zum Streamen von Diagnosen an einen Collector
