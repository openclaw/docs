---
read_when:
    - Einen Fehlerbericht oder eine Supportanfrage vorbereiten
    - Fehlerbehebung bei Gateway-Abstürzen, Neustarts, Speicherdruck oder übergroßen Payloads
    - Überprüfen, welche Diagnosedaten aufgezeichnet oder geschwärzt werden
summary: Teilbare Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnose-Export
x-i18n:
    generated_at: "2026-04-30T06:52:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann eine lokale Diagnose-ZIP-Datei für Fehlerberichte erstellen. Sie kombiniert
bereinigten Gateway-Status, Zustand, Logs, Konfigurationsstruktur und aktuelle nutzlastfreie
Stabilitätsereignisse.

Behandeln Sie Diagnosepakete wie Geheimnisse, bis Sie sie geprüft haben. Sie sind
so konzipiert, dass Nutzlasten und Anmeldedaten ausgelassen oder redigiert werden,
fassen aber dennoch lokale Gateway-Logs und den Laufzeitstatus auf Host-Ebene zusammen.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Der Befehl gibt den Pfad der geschriebenen ZIP-Datei aus. So wählen Sie einen Pfad aus:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Chatbefehl

Besitzer können `/diagnostics [note]` im Chat verwenden, um einen lokalen Gateway-Export anzufordern.
Verwenden Sie dies, wenn der Fehler in einer echten Unterhaltung aufgetreten ist und Sie einen
kopierbaren Bericht für den Support möchten:

1. Senden Sie `/diagnostics` in der Unterhaltung, in der Sie das Problem bemerkt haben. Fügen Sie eine
   kurze Notiz hinzu, wenn sie hilft, zum Beispiel `/diagnostics bad tool choice`.
2. OpenClaw sendet die Diagnose-Präambel und bittet um eine ausdrückliche Exec-Genehmigung.
   Die Genehmigung führt `openclaw gateway diagnostics export --json` aus.
   Genehmigen Sie Diagnosen nicht über eine Allow-all-Regel.
3. Nach der Genehmigung antwortet OpenClaw mit einem einfügbaren Bericht, der den lokalen
   Paketpfad, die Manifest-Zusammenfassung, Datenschutzhinweise und relevante Sitzungs-IDs enthält.

In Gruppenchats kann ein Besitzer weiterhin `/diagnostics` ausführen, aber OpenClaw
veröffentlicht die Diagnosedetails nicht zurück in den gemeinsamen Chat. Es sendet die Präambel,
Genehmigungsaufforderungen, das Gateway-Exportergebnis und die Aufschlüsselung der Codex-Sitzung/des Threads
über die private Genehmigungsroute an den Besitzer. Die Gruppe erhält nur einen kurzen Hinweis,
dass der Diagnoseablauf privat gesendet wurde. Wenn OpenClaw keine private
Besitzerroute finden kann, schlägt der Befehl geschlossen fehl und fordert den Besitzer auf, ihn aus einer Direktnachricht auszuführen.

Wenn die aktive OpenClaw-Sitzung das native OpenAI Codex-Harness verwendet,
deckt dieselbe Exec-Genehmigung auch einen OpenAI-Feedback-Upload für die Codex-Laufzeitthreads ab,
die OpenClaw kennt. Dieser Upload ist vom lokalen
Gateway-ZIP getrennt und erscheint nur bei Codex-Harness-Sitzungen. Vor der Genehmigung erklärt die
Aufforderung, dass das Genehmigen von Diagnosen auch Codex-Feedback sendet, listet aber
keine Codex-Sitzungs- oder Thread-IDs auf. Nach der Genehmigung listet die Chatantwort
die Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen Fortsetzungsbefehle
für die Threads auf, die an OpenAI-Server gesendet wurden. Wenn Sie die
Genehmigung verweigern oder ignorieren, führt OpenClaw den Export nicht aus, sendet kein Codex-Feedback und
gibt die Codex-IDs nicht aus.

Das macht den üblichen Codex-Debugging-Ablauf kurz: Bemerken Sie das fehlerhafte Verhalten in
Telegram, Discord oder einem anderen Kanal, führen Sie `/diagnostics` aus, genehmigen Sie einmal, teilen Sie
den Bericht mit dem Support und führen Sie anschließend lokal den ausgegebenen Befehl `codex resume <thread-id>` aus,
wenn Sie den nativen Codex-Thread selbst prüfen möchten. Siehe
[Codex-Harness](/de/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) für
diesen Prüfablauf.

## Inhalt des Exports

Die ZIP-Datei enthält:

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Logs, Status, Zustand
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Log-Zusammenfassungen und aktuelle redigierte Log-Zeilen.
- Bestmögliche Gateway-Status- und Zustands-Snapshots.
- `stability/latest.json`: neuestes persistiertes Stabilitätspaket, sofern verfügbar.

Der Export ist auch dann nützlich, wenn der Gateway nicht fehlerfrei arbeitet. Wenn der Gateway
Status- oder Zustandsanfragen nicht beantworten kann, werden die lokalen Logs, die Konfigurationsstruktur und das neueste
Stabilitätspaket dennoch erfasst, sofern sie verfügbar sind.

## Datenschutzmodell

Diagnosen sind so konzipiert, dass sie geteilt werden können. Der Export behält Betriebsdaten,
die beim Debugging helfen, zum Beispiel:

- Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauern, Bytezahlen, Warteschlangenzustand und Speichermesswerte
- bereinigte Log-Metadaten und redigierte Betriebsmeldungen
- Konfigurationsstruktur und nicht geheime Funktionseinstellungen

Der Export lässt Folgendes aus oder redigiert es:

- Chattext, Prompts, Anweisungen, Webhook-Bodies und Tool-Ausgaben
- Anmeldedaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- rohe Anfrage- oder Antwort-Bodies
- Konto-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Logmeldung wie Benutzer-, Chat-, Prompt- oder Tool-Nutzlasttext aussieht, behält der
Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die Bytezahl.

## Stabilitätsrekorder

Der Gateway zeichnet standardmäßig einen begrenzten, nutzlastfreien Stabilitätsstream auf, wenn
Diagnosen aktiviert sind. Er ist für betriebliche Fakten gedacht, nicht für Inhalte.

Derselbe Diagnose-Heartbeat zeichnet Lebendigkeitswarnungen auf, wenn der Gateway weiterläuft,
aber die Node.js-Ereignisschleife oder CPU gesättigt wirkt. Diese
`diagnostic.liveness.warning`-Ereignisse enthalten Ereignisschleifenverzögerung, Ereignisschleifenauslastung,
CPU-Kern-Verhältnis und die Anzahl aktiver/wartender/eingereihter Sitzungen. Sie
starten den Gateway nicht selbst neu.

Live-Rekorder prüfen:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Neuestes persistiertes Stabilitätspaket nach einem fatalen Beenden, einem Shutdown-Timeout
oder einem Neustart-Startfehler prüfen:

```bash
openclaw gateway stability --bundle latest
```

Eine Diagnose-ZIP-Datei aus dem neuesten persistierten Paket erstellen:

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
- `--log-lines <count>`: maximale Anzahl bereinigter Log-Zeilen, die aufgenommen werden.
- `--log-bytes <bytes>`: maximale Anzahl von Log-Bytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Zustands-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Zustands-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Zustands-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Zustands-Snapshots.
- `--no-stability-bundle`: Suche nach persistiertem Stabilitätspaket überspringen.
- `--json`: maschinenlesbare Exportmetadaten ausgeben.

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. So deaktivieren Sie den Stabilitätsrekorder und
die Sammlung von Diagnoseereignissen:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen reduziert die Detailtiefe von Fehlerberichten. Es wirkt sich nicht auf das normale
Gateway-Logging aus.

## Verwandte Themen

- [Zustandsprüfungen](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#system-and-identity)
- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — separater Ablauf zum Streamen von Diagnosen an einen Collector
