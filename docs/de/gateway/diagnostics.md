---
read_when:
    - Einen Fehlerbericht oder eine Supportanfrage vorbereiten
    - Debugging von Gateway-Abstürzen, Neustarts, Speicherdruck oder übergroßen Nutzlasten
    - Überprüfen, welche Diagnosedaten aufgezeichnet oder geschwärzt werden
summary: Teilbare Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnoseexport
x-i18n:
    generated_at: "2026-06-27T17:29:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann ein lokales Diagnose-Zip für Fehlerberichte erstellen. Es kombiniert
bereinigten Gateway-Status, Health-Daten, Logs, Konfigurationsform und aktuelle stabilitätsbezogene
Ereignisse ohne Payloads.

Behandeln Sie Diagnose-Bundles wie Geheimnisse, bis Sie sie geprüft haben. Sie sind
darauf ausgelegt, Payloads und Zugangsdaten auszulassen oder zu schwärzen, fassen aber weiterhin
lokale Gateway-Logs und hostbezogenen Laufzeitstatus zusammen.

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

## Chat-Befehl

Owner können `/diagnostics [note]` im Chat verwenden, um einen lokalen Gateway-Export anzufordern.
Verwenden Sie dies, wenn der Fehler in einer echten Konversation aufgetreten ist und Sie einen
kopierbaren Bericht für den Support möchten:

1. Senden Sie `/diagnostics` in der Konversation, in der Sie das Problem bemerkt haben. Fügen Sie
   bei Bedarf eine kurze Notiz hinzu, zum Beispiel `/diagnostics bad tool choice`.
2. OpenClaw sendet die Diagnose-Präambel und fordert eine explizite Exec-Genehmigung an.
   Die Genehmigung führt `openclaw gateway diagnostics export --json` aus.
   Genehmigen Sie Diagnosen nicht über eine Allow-All-Regel.
3. Nach der Genehmigung antwortet OpenClaw mit einem einfügbaren Bericht, der den lokalen
   Bundle-Pfad, eine Manifest-Zusammenfassung, Datenschutzhinweise und relevante Sitzungs-IDs enthält.

In Gruppenchats kann ein Owner weiterhin `/diagnostics` ausführen, aber OpenClaw postet die
Diagnosedetails nicht zurück in den gemeinsamen Chat. Es sendet die Präambel,
Genehmigungsaufforderungen, das Gateway-Exportergebnis und die Aufschlüsselung der Codex-Sitzungen/-Threads
über die private Genehmigungsroute an den Owner. Die Gruppe erhält nur einen kurzen Hinweis,
dass der Diagnoseablauf privat gesendet wurde. Wenn OpenClaw keine private
Owner-Route finden kann, bricht der Befehl sicher ab und fordert den Owner auf, ihn aus einer Direktnachricht auszuführen.

Wenn die aktive OpenClaw-Sitzung den nativen OpenAI Codex-Harness verwendet,
deckt dieselbe Exec-Genehmigung auch einen OpenAI-Feedback-Upload für die Codex-
Laufzeit-Threads ab, die OpenClaw kennt. Dieser Upload ist vom lokalen
Gateway-Zip getrennt und erscheint nur für Codex-Harness-Sitzungen. Vor der Genehmigung erklärt die
Aufforderung, dass durch das Genehmigen der Diagnose auch Codex-Feedback gesendet wird, listet aber
keine Codex-Sitzungs- oder Thread-IDs auf. Nach der Genehmigung listet die Chat-Antwort
die Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen Resume-Befehle
für die Threads auf, die an OpenAI-Server gesendet wurden. Wenn Sie die
Genehmigung ablehnen oder ignorieren, führt OpenClaw den Export nicht aus, sendet kein Codex-Feedback und
gibt die Codex-IDs nicht aus.

Dadurch wird der übliche Codex-Debugging-Ablauf kurz: bemerken Sie das Fehlverhalten in
Telegram, Discord oder einem anderen Kanal, führen Sie `/diagnostics` aus, genehmigen Sie einmal, teilen Sie
den Bericht mit dem Support und führen Sie dann lokal den ausgegebenen Befehl `codex resume <thread-id>` aus,
wenn Sie den nativen Codex-Thread selbst prüfen möchten. Siehe
[Codex-Harness](/de/plugins/codex-harness#inspect-codex-threads-locally) für
diesen Prüfablauf.

## Was der Export enthält

Das Zip enthält:

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Logs, Status, Health-Daten
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsform und nicht geheime Konfigurationsdetails.
- Bereinigte Log-Zusammenfassungen und aktuelle geschwärzte Log-Zeilen.
- Bestmögliche Gateway-Status- und Health-Snapshots.
- `stability/latest.json`: neuestes persistiertes Stabilitäts-Bundle, sofern verfügbar.

Der Export ist auch nützlich, wenn der Gateway fehlerhaft ist. Wenn der Gateway
Status- oder Health-Anfragen nicht beantworten kann, werden die lokalen Logs, die Konfigurationsform und das neueste
Stabilitäts-Bundle trotzdem gesammelt, sofern sie verfügbar sind.

## Datenschutzmodell

Diagnosen sind darauf ausgelegt, teilbar zu sein. Der Export behält Betriebsdaten,
die beim Debugging helfen, zum Beispiel:

- Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauern, Byte-Zähler, Queue-Zustand und Speichermesswerte
- bereinigte Log-Metadaten und geschwärzte betriebliche Meldungen
- Konfigurationsform und nicht geheime Feature-Einstellungen

Der Export lässt aus oder schwärzt:

- Chat-Text, Prompts, Anweisungen, Webhook-Bodys und Tool-Ausgaben
- Zugangsdaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- rohe Request- oder Response-Bodys
- Konto-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Log-Meldung wie Benutzer-, Chat-, Prompt- oder Tool-Payload-Text aussieht, behält der
Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die Byte-Anzahl.

## Stabilitätsrekorder

Der Gateway zeichnet standardmäßig einen begrenzten Stabilitätsstream ohne Payloads auf, wenn
Diagnosen aktiviert sind. Er ist für betriebliche Fakten gedacht, nicht für Inhalte.

Derselbe Diagnose-Heartbeat zeichnet Liveness-Samples auf, wenn der Gateway weiterläuft,
aber die Node.js-Ereignisschleife oder CPU ausgelastet wirkt. Diese
`diagnostic.liveness.warning`-Ereignisse enthalten Ereignisschleifenverzögerung, Ereignisschleifen-
Auslastung, CPU-Kern-Verhältnis, Anzahl aktiver/wartender/eingereihter Sitzungen, die aktuelle
Start-/Laufzeitphase, sofern bekannt, aktuelle Phasenabschnitte und begrenzte Labels für aktive/eingereihte
Arbeit. Idle-Samples verbleiben in der Telemetrie auf `info`-Ebene. Liveness-Samples
werden nur dann zu Gateway-Warnungen, wenn Arbeit wartet oder eingereiht ist, oder wenn aktive Arbeit
mit anhaltender Ereignisschleifenverzögerung überlappt. Vorübergehende Max-Delay-Spitzen während
ansonsten gesunder Hintergrundarbeit bleiben in Debug-Logs. Sie starten den
Gateway nicht von selbst neu.

Startphasen geben außerdem `diagnostic.phase.completed`-Ereignisse mit Wall-Clock- und
CPU-Timing aus. Diagnoseereignisse für blockierte eingebettete Läufe setzen `terminalProgressStale=true`,
wenn der letzte Bridge-Fortschritt terminal aussah, etwa ein rohes Response-Item oder
Response-Completion-Ereignis, der Gateway den eingebetteten Lauf aber weiterhin als
aktiv betrachtet.

Den Live-Rekorder prüfen:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Das neueste persistierte Stabilitäts-Bundle nach einem fatalen Exit, Shutdown-
Timeout oder Neustartfehler prüfen:

```bash
openclaw gateway stability --bundle latest
```

Ein Diagnose-Zip aus dem neuesten persistierten Bundle erstellen:

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

- `--output <path>`: in einen bestimmten Zip-Pfad schreiben.
- `--log-lines <count>`: maximale Anzahl bereinigter Log-Zeilen, die einbezogen werden.
- `--log-bytes <bytes>`: maximale Log-Bytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Health-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Health-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Health-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Health-Snapshots.
- `--no-stability-bundle`: Suche nach persistiertem Stabilitäts-Bundle überspringen.
- `--json`: maschinenlesbare Exportmetadaten ausgeben.

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. Um den Stabilitätsrekorder und die
Sammlung von Diagnoseereignissen zu deaktivieren:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen reduziert die Detailtiefe von Fehlerberichten. Es wirkt sich nicht auf normales
Gateway-Logging aus.

Snapshots bei kritischem Speicherdruck sind standardmäßig deaktiviert. Um Diagnose-
Ereignisse beizubehalten und zusätzlich den Stabilitäts-Snapshot vor dem OOM zu erfassen:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Verwenden Sie dies nur auf Hosts, die den zusätzlichen Dateisystem-Scan und Snapshot-
Schreibvorgang während kritischen Speicherdrucks tolerieren können. Normale Speicherdruckereignisse zeichnen weiterhin
RSS, Heap, Schwellenwert und Wachstumsfakten auf, wenn der Snapshot deaktiviert ist.

## Verwandt

- [Health-Checks](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#system-and-identity)
- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — separater Ablauf zum Streamen von Diagnosen an einen Collector
