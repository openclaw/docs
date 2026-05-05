---
read_when:
    - Einen Fehlerbericht oder eine Supportanfrage vorbereiten
    - Fehlerbehebung bei Gateway-Abstürzen, Neustarts, Speicherdruck oder übermäßig großen Nutzlasten
    - Überprüfen, welche Diagnosedaten aufgezeichnet oder geschwärzt werden
summary: Teilbare Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnoseexport
x-i18n:
    generated_at: "2026-05-05T01:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann eine lokale Diagnose-ZIP-Datei für Fehlerberichte erstellen. Sie kombiniert
bereinigten Gateway-Status, Zustand, Logs, Konfigurationsform und aktuelle Stabilitätsereignisse
ohne Payloads.

Behandeln Sie Diagnose-Bundles wie Geheimnisse, bis Sie sie geprüft haben. Sie sind
dafür ausgelegt, Payloads und Zugangsdaten auszulassen oder zu schwärzen, fassen aber
dennoch lokale Gateway-Logs und den Laufzeitzustand auf Host-Ebene zusammen.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Der Befehl gibt den geschriebenen ZIP-Pfad aus. So wählen Sie einen Pfad:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Chat-Befehl

Besitzer können im Chat `/diagnostics [note]` verwenden, um einen lokalen Gateway-Export
anzufordern. Verwenden Sie dies, wenn der Fehler in einer echten Unterhaltung aufgetreten ist
und Sie einen Bericht für den Support benötigen, den Sie direkt kopieren und einfügen können:

1. Senden Sie `/diagnostics` in der Unterhaltung, in der Sie das Problem bemerkt haben. Fügen Sie
   eine kurze Notiz hinzu, wenn sie hilfreich ist, zum Beispiel `/diagnostics bad tool choice`.
2. OpenClaw sendet die Diagnose-Präambel und fordert eine explizite Exec-Genehmigung an.
   Die Genehmigung führt `openclaw gateway diagnostics export --json` aus.
   Genehmigen Sie Diagnosen nicht über eine Allow-all-Regel.
3. Nach der Genehmigung antwortet OpenClaw mit einem einfügbaren Bericht, der den lokalen
   Bundle-Pfad, eine Manifest-Zusammenfassung, Datenschutzhinweise und relevante Sitzungs-IDs enthält.

In Gruppenchats kann ein Besitzer weiterhin `/diagnostics` ausführen, aber OpenClaw veröffentlicht
die Diagnosedetails nicht im gemeinsamen Chat. Es sendet die Präambel,
Genehmigungsaufforderungen, das Gateway-Exportergebnis und die Codex-Sitzungs-/Thread-Aufschlüsselung
über die private Genehmigungsroute an den Besitzer. Die Gruppe erhält nur einen kurzen Hinweis,
dass der Diagnoseablauf privat gesendet wurde. Wenn OpenClaw keine private Route zum Besitzer
finden kann, schlägt der Befehl geschlossen fehl und fordert den Besitzer auf, ihn aus einer DM
auszuführen.

Wenn die aktive OpenClaw-Sitzung das native OpenAI-Codex-Harness verwendet,
deckt dieselbe Exec-Genehmigung auch einen OpenAI-Feedback-Upload für die Codex-Laufzeit-Threads ab,
die OpenClaw kennt. Dieser Upload ist vom lokalen Gateway-ZIP getrennt und erscheint nur
für Codex-Harness-Sitzungen. Vor der Genehmigung erklärt die Aufforderung, dass die Genehmigung
der Diagnosen auch Codex-Feedback sendet, listet aber keine Codex-Sitzungs- oder Thread-IDs auf.
Nach der Genehmigung listet die Chat-Antwort die Kanäle, OpenClaw-Sitzungs-IDs,
Codex-Thread-IDs und lokalen Resume-Befehle für die Threads auf, die an OpenAI-Server gesendet wurden.
Wenn Sie die Genehmigung ablehnen oder ignorieren, führt OpenClaw den Export nicht aus,
sendet kein Codex-Feedback und gibt die Codex-IDs nicht aus.

Damit ist die übliche Codex-Debugging-Schleife kurz: Bemerken Sie das fehlerhafte Verhalten in
Telegram, Discord oder einem anderen Kanal, führen Sie `/diagnostics` aus, genehmigen Sie einmal,
teilen Sie den Bericht mit dem Support und führen Sie dann lokal den ausgegebenen Befehl
`codex resume <thread-id>` aus, wenn Sie den nativen Codex-Thread selbst prüfen möchten. Siehe
[Codex-Harness](/de/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) für
diesen Prüfablauf.

## Inhalt des Exports

Die ZIP-Datei enthält:

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Logs, Status, Zustand
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsform und nicht geheime Konfigurationsdetails.
- Bereinigte Log-Zusammenfassungen und aktuelle geschwärzte Log-Zeilen.
- Bestmögliche Gateway-Status- und Zustand-Snapshots.
- `stability/latest.json`: neuestes persistiertes Stabilitäts-Bundle, sofern verfügbar.

Der Export ist auch nützlich, wenn der Gateway fehlerhaft ist. Wenn der Gateway
Status- oder Zustandsanfragen nicht beantworten kann, werden lokale Logs, Konfigurationsform
und das neueste Stabilitäts-Bundle dennoch erfasst, sofern verfügbar.

## Datenschutzmodell

Diagnosen sind so ausgelegt, dass sie geteilt werden können. Der Export behält Betriebsdaten bei,
die beim Debugging helfen, zum Beispiel:

- Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauerwerte, Byte-Zähler, Warteschlangenzustand und Speichermesswerte
- bereinigte Log-Metadaten und geschwärzte Betriebsmeldungen
- Konfigurationsform und nicht geheime Funktionseinstellungen

Der Export lässt aus oder schwärzt:

- Chat-Text, Prompts, Anweisungen, Webhook-Bodies und Tool-Ausgaben
- Zugangsdaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- Rohdaten von Anfrage- oder Antwort-Bodies
- Konto-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Log-Nachricht wie Benutzer-, Chat-, Prompt- oder Tool-Payload-Text aussieht, behält der
Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die Byte-Anzahl.

## Stabilitätsaufzeichnung

Der Gateway zeichnet standardmäßig einen begrenzten, payloadfreien Stabilitätsstream auf, wenn
Diagnosen aktiviert sind. Er ist für betriebliche Fakten gedacht, nicht für Inhalte.

Derselbe Diagnose-Heartbeat zeichnet Liveness-Samples auf, wenn der Gateway weiterläuft,
aber die Node.js-Event-Loop oder CPU ausgelastet wirkt. Diese
`diagnostic.liveness.warning`-Ereignisse enthalten Event-Loop-Verzögerung, Event-Loop-Auslastung,
CPU-Core-Verhältnis, Anzahlen aktiver/wartender/eingereihter Sitzungen, die aktuelle
Start-/Laufzeitphase, sofern bekannt, aktuelle Phasenspannen und begrenzte aktive/eingereihte
Arbeitslabels. Leerlauf-Samples bleiben in der Telemetrie auf `info`-Ebene. Liveness-Samples
werden nur dann zu Gateway-Warnungen, wenn Arbeit wartet oder eingereiht ist oder wenn aktive Arbeit
mit anhaltender Event-Loop-Verzögerung überlappt. Vorübergehende Max-Delay-Spitzen während
ansonsten gesunder Hintergrundarbeit bleiben in Debug-Logs. Sie starten den Gateway nicht
eigenständig neu.

Startphasen geben außerdem `diagnostic.phase.completed`-Ereignisse mit Wall-Clock- und
CPU-Timing aus. Diagnosen zu blockierten eingebetteten Läufen setzen `terminalProgressStale=true`,
wenn der letzte Bridge-Fortschritt terminal aussah, etwa ein rohes Response-Item oder
ein Response-Completion-Ereignis, der Gateway den eingebetteten Lauf aber weiterhin als
aktiv betrachtet.

Live-Aufzeichnung prüfen:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Neuestes persistiertes Stabilitäts-Bundle nach einem fatalen Exit, Shutdown-Timeout
oder Fehler beim Neustart prüfen:

```bash
openclaw gateway stability --bundle latest
```

Eine Diagnose-ZIP aus dem neuesten persistierten Bundle erstellen:

```bash
openclaw gateway stability --bundle latest --export
```

Persistierte Bundles liegen unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: in einen bestimmten ZIP-Pfad schreiben.
- `--log-lines <count>`: maximale Anzahl bereinigter Log-Zeilen, die aufgenommen werden.
- `--log-bytes <bytes>`: maximale Anzahl von Log-Bytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Zustand-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Zustand-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Zustand-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Zustand-Snapshots.
- `--no-stability-bundle`: Suche nach persistiertem Stabilitäts-Bundle überspringen.
- `--json`: maschinenlesbare Exportmetadaten ausgeben.

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. So deaktivieren Sie die Stabilitätsaufzeichnung und
die Sammlung von Diagnoseereignissen:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen reduziert die Details in Fehlerberichten. Es wirkt sich nicht
auf das normale Gateway-Logging aus.

## Verwandte Themen

- [Health Checks](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#system-and-identity)
- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — separater Ablauf zum Streamen von Diagnosen an einen Collector
