---
read_when:
    - Vorbereiten eines Fehlerberichts oder einer Supportanfrage
    - Fehlerbehebung bei Gateway-Abstürzen, Neustarts, Speicherdruck oder übergroßen Payloads
    - Prüfen, welche Diagnosedaten aufgezeichnet oder geschwärzt werden
summary: Teilbare Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnoseexport
x-i18n:
    generated_at: "2026-05-10T19:35:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann eine lokale Diagnose-ZIP für Fehlerberichte erstellen. Sie kombiniert
bereinigten Gateway-Status, Integrität, Protokolle, Konfigurationsform und aktuelle
Stabilitätsereignisse ohne Payloads.

Behandeln Sie Diagnose-Bundles wie Geheimnisse, bis Sie sie geprüft haben. Sie sind
so konzipiert, dass Payloads und Anmeldedaten ausgelassen oder redigiert werden, aber
sie fassen dennoch lokale Gateway-Protokolle und den Laufzeitstatus auf Host-Ebene
zusammen.

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

Besitzer können `/diagnostics [note]` im Chat verwenden, um einen lokalen Gateway-Export anzufordern.
Verwenden Sie dies, wenn der Fehler in einer echten Unterhaltung aufgetreten ist und Sie einen
kopierbaren Bericht für den Support wünschen:

1. Senden Sie `/diagnostics` in der Unterhaltung, in der Sie das Problem bemerkt haben. Fügen Sie eine
   kurze Notiz hinzu, wenn sie hilfreich ist, zum Beispiel `/diagnostics bad tool choice`.
2. OpenClaw sendet die Diagnose-Präambel und fragt nach einer ausdrücklichen exec-
   Genehmigung. Die Genehmigung führt `openclaw gateway diagnostics export --json` aus.
   Genehmigen Sie Diagnosen nicht über eine Regel, die alles erlaubt.
3. Nach der Genehmigung antwortet OpenClaw mit einem einfügbaren Bericht, der den lokalen
   Bundle-Pfad, die Manifest-Zusammenfassung, Datenschutzhinweise und relevante Sitzungs-IDs enthält.

In Gruppenchats kann ein Besitzer weiterhin `/diagnostics` ausführen, aber OpenClaw
postet die Diagnosedetails nicht zurück in den gemeinsamen Chat. Es sendet die Präambel,
Genehmigungsaufforderungen, das Gateway-Exportergebnis und die Aufschlüsselung der Codex-Sitzungen/-Threads
über die private Genehmigungsroute an den Besitzer. Die Gruppe erhält nur einen kurzen Hinweis,
dass der Diagnoseablauf privat gesendet wurde. Wenn OpenClaw keine private
Besitzerroute finden kann, schlägt der Befehl sicher fehl und fordert den Besitzer auf, ihn aus einer DM auszuführen.

Wenn die aktive OpenClaw-Sitzung den nativen OpenAI-Codex-Harness verwendet,
deckt dieselbe exec-Genehmigung auch einen OpenAI-Feedback-Upload für die Codex-
Laufzeit-Threads ab, die OpenClaw kennt. Dieser Upload ist vom lokalen
Gateway-ZIP getrennt und erscheint nur für Codex-Harness-Sitzungen. Vor der Genehmigung erklärt die
Aufforderung, dass die Genehmigung von Diagnosen auch Codex-Feedback sendet, aber sie
listet keine Codex-Sitzungs- oder Thread-IDs auf. Nach der Genehmigung listet die Chat-Antwort
die Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen Fortsetzungsbefehle
für die Threads auf, die an OpenAI-Server gesendet wurden. Wenn Sie die
Genehmigung ablehnen oder ignorieren, führt OpenClaw den Export nicht aus, sendet kein Codex-Feedback und
gibt die Codex-IDs nicht aus.

Dadurch wird die übliche Codex-Debugging-Schleife kurz: problematisches Verhalten in
Telegram, Discord oder einem anderen Kanal bemerken, `/diagnostics` ausführen, einmal genehmigen, den
Bericht mit dem Support teilen und dann den ausgegebenen Befehl `codex resume <thread-id>`
lokal ausführen, wenn Sie den nativen Codex-Thread selbst prüfen möchten. Siehe
[Codex-Harness](/de/plugins/codex-harness#inspect-codex-threads-locally) für
diesen Prüfablauf.

## Inhalt des Exports

Die ZIP enthält:

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Protokollen, Status, Integrität
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsform und nicht geheime Konfigurationsdetails.
- Bereinigte Protokollzusammenfassungen und aktuelle redigierte Protokollzeilen.
- Bestmögliche Gateway-Status- und Integritäts-Snapshots.
- `stability/latest.json`: neuestes persistiertes Stabilitäts-Bundle, sofern verfügbar.

Der Export ist auch nützlich, wenn der Gateway fehlerhaft ist. Wenn der Gateway
Status- oder Integritätsanfragen nicht beantworten kann, werden die lokalen Protokolle, die Konfigurationsform und das neueste
Stabilitäts-Bundle dennoch erfasst, sofern verfügbar.

## Datenschutzmodell

Diagnosen sind so konzipiert, dass sie geteilt werden können. Der Export behält Betriebsdaten bei,
die beim Debugging helfen, wie etwa:

- Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauern, Byte-Anzahlen, Warteschlangenstatus und Speichermesswerte
- bereinigte Protokollmetadaten und redigierte Betriebsmeldungen
- Konfigurationsform und nicht geheime Funktionseinstellungen

Der Export lässt Folgendes aus oder redigiert es:

- Chattext, Prompts, Anweisungen, Webhook-Bodys und Tool-Ausgaben
- Anmeldedaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- rohe Anfrage- oder Antwortbodys
- Konto-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Protokollmeldung wie Benutzer-, Chat-, Prompt- oder Tool-Payload-Text aussieht, behält der
Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die Byte-Anzahl.

## Stabilitätsrekorder

Der Gateway zeichnet standardmäßig einen begrenzten Stabilitätsstream ohne Payloads auf, wenn
Diagnosen aktiviert sind. Er ist für Betriebsdaten gedacht, nicht für Inhalte.

Derselbe Diagnose-Heartbeat zeichnet Liveness-Samples auf, wenn der Gateway weiter
läuft, aber die Node.js-Event-Loop oder CPU gesättigt wirkt. Diese
`diagnostic.liveness.warning`-Ereignisse enthalten Event-Loop-Verzögerung, Event-Loop-
Auslastung, CPU-Kern-Verhältnis, aktive/wartende/eingereihte Sitzungszahlen, die aktuelle
Start-/Laufzeitphase, sofern bekannt, aktuelle Phasenspannen und begrenzte Labels für aktive/eingereihte
Arbeit. Leerlauf-Samples bleiben in der Telemetrie auf `info`-Ebene. Liveness-Samples
werden nur dann zu Gateway-Warnungen, wenn Arbeit wartet oder eingereiht ist oder wenn sich aktive Arbeit
mit anhaltender Event-Loop-Verzögerung überschneidet. Vorübergehende Maximalverzögerungs-Spitzen während
ansonsten gesunder Hintergrundarbeit bleiben in Debug-Protokollen. Sie starten den
Gateway nicht von selbst neu.

Startphasen geben auch `diagnostic.phase.completed`-Ereignisse mit Wanduhr- und
CPU-Zeitmessung aus. Blockierte Diagnosen eingebetteter Ausführungen markieren `terminalProgressStale=true`,
wenn der letzte Bridge-Fortschritt terminal wirkte, etwa ein rohes Antwortelement oder
Antwortabschlussereignis, der Gateway die eingebettete Ausführung aber weiterhin als
aktiv betrachtet.

Live-Rekorder prüfen:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Neuestes persistiertes Stabilitäts-Bundle nach einem schwerwiegenden Beenden, Shutdown-
Timeout oder Fehler beim Neustart prüfen:

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
- `--log-lines <count>`: maximale Anzahl bereinigter Protokollzeilen, die eingeschlossen werden.
- `--log-bytes <bytes>`: maximale Anzahl von Protokollbytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Integritäts-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Integritäts-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Integritäts-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Integritäts-Snapshots.
- `--no-stability-bundle`: Suche nach persistiertem Stabilitäts-Bundle überspringen.
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

Das Deaktivieren von Diagnosen reduziert die Detailtiefe von Fehlerberichten. Es wirkt sich nicht auf die normale
Gateway-Protokollierung aus.

## Verwandte Themen

- [Integritätsprüfungen](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#system-and-identity)
- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — separater Ablauf zum Streamen von Diagnosen an einen Collector
