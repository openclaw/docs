---
read_when:
    - Vorbereiten eines Fehlerberichts oder einer Supportanfrage
    - Debugging von Gateway-Abstürzen, Neustarts, Speicherdruck oder übergroßen Nutzdaten
    - Überprüfen, welche Diagnosedaten aufgezeichnet oder unkenntlich gemacht werden
summary: Freigabefähige Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnosedatenexport
x-i18n:
    generated_at: "2026-07-24T04:34:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 97a805fed8d51de2e63e5c6a12ce03e91701d69654882cca7795c9f3553b1c55
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann für Fehlerberichte ein lokales Diagnose-`.zip` erstellen: bereinigter Gateway-
Status, Integritätszustand, Protokolle, Konfigurationsstruktur und aktuelle stabilitätsbezogene Ereignisse ohne Nutzdaten.

Behandeln Sie Diagnosepakete bis zur Überprüfung wie Geheimnisse. Nutzdaten und Anmeldedaten
werden grundsätzlich unkenntlich gemacht, das Paket fasst jedoch weiterhin lokale Gateway-Protokolle und
den Laufzeitstatus auf Hostebene zusammen.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Gibt den Pfad der geschriebenen ZIP-Datei aus. So wählen Sie einen Ausgabepfad:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für die Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Chat-Befehl

Eigentümer können in jeder Unterhaltung `/diagnostics [note]` ausführen, um einen lokalen
Gateway-Export als einzelnen kopierbaren Supportbericht anzufordern:

1. Senden Sie `/diagnostics`, optional mit einer kurzen Notiz (`/diagnostics bad tool choice`).
2. OpenClaw sendet eine Präambel und fordert eine einmalige ausdrückliche Ausführungsgenehmigung an, die
   `openclaw gateway diagnostics export --json` ausführt. Genehmigen Sie Diagnosen nicht über
   eine Regel, die alles zulässt.
3. Nach der Genehmigung antwortet OpenClaw mit dem lokalen Paketpfad, einer Manifest-
   Zusammenfassung, Datenschutzhinweisen und relevanten Sitzungs-IDs.

In Gruppenchats kann ein Eigentümer weiterhin `/diagnostics` ausführen, OpenClaw sendet das
Exportergebnis, Genehmigungsaufforderungen und die Aufschlüsselung der Codex-Sitzungen/-Threads jedoch
privat an den Eigentümer. Die Gruppe sieht nur einen kurzen Hinweis, dass die Diagnosen
privat gesendet wurden. Wenn kein privater Übermittlungsweg zum Eigentümer vorhanden ist, schlägt der Befehl sicher fehl und fordert
den Eigentümer auf, ihn aus einer Direktnachricht auszuführen.

Wenn die aktive Sitzung die native OpenAI-Codex-Umgebung verwendet, deckt dieselbe Ausführungs-
genehmigung auch das Hochladen von OpenAI-Feedback für die OpenClaw bekannten Codex-Threads
ab. Dieser Upload ist vom lokalen Gateway-ZIP getrennt und erfolgt nur
bei Sitzungen in der Codex-Umgebung. Die Genehmigungsaufforderung weist darauf hin, dass die Genehmigung
auch Codex-Feedback sendet, ohne Codex-Sitzungs- oder Thread-IDs aufzulisten. Nach
der Genehmigung enthält die Antwort Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und
lokale Fortsetzungsbefehle für die an OpenAI gesendeten Threads. Wenn die Genehmigung
abgelehnt oder ignoriert wird, werden der Export, das Hochladen des Codex-Feedbacks und die
Codex-ID-Liste übersprungen.

Dadurch bleibt die Codex-Debugging-Schleife kurz: Stellen Sie fehlerhaftes Verhalten in einem Kanal fest,
führen Sie `/diagnostics` aus, genehmigen Sie einmalig, teilen Sie den Bericht und führen Sie anschließend den ausgegebenen
Befehl `codex resume <thread-id>` lokal aus, wenn Sie den Thread selbst
untersuchen möchten. Siehe [Codex-Umgebung](/de/plugins/codex-harness#inspect-codex-threads-locally).

## Inhalt des Exports

- `summary.md`: für Menschen lesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Protokollen, Status, Integrität
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Protokollzusammenfassungen und aktuelle unkenntlich gemachte Protokollzeilen.
- Nach bestem Bemühen erstellte Momentaufnahmen von Gateway-Status und -Integrität.
- `stability/latest.json`: neuestes gespeichertes Stabilitätspaket, sofern verfügbar.

Der Export ist auch dann nützlich, wenn der Gateway fehlerhaft ist: Wenn Status-/Integritäts-
anfragen fehlschlagen, werden lokale Protokolle, die Konfigurationsstruktur und das neueste Stabilitätspaket
weiterhin erfasst, sofern verfügbar.

## Datenschutzmodell

Beibehalten werden: Namen von Subsystemen, Plugin-IDs, Provider-IDs, Kanal-IDs, konfigurierte
Modi, Statuscodes, Zeitspannen, Byteanzahlen, Warteschlangenstatus, Speicherwerte,
bereinigte Protokollmetadaten, unkenntlich gemachte Betriebsmeldungen, Konfigurationsstruktur und
nicht geheime Funktionseinstellungen.

Ausgelassen oder unkenntlich gemacht werden: Chattext, Prompts, Anweisungen, Webhook-Inhalte, Werkzeug-
ausgaben, Anmeldedaten, API-Schlüssel, Token, Cookies, geheime Werte, unformatierte
Anfrage-/Antwortinhalte, Konto-IDs, Nachrichten-IDs, unformatierte Sitzungs-IDs,
Hostnamen und lokale Benutzernamen.

Wenn eine Protokollmeldung wie Text aus Benutzer-, Chat-, Prompt- oder Werkzeugnutzdaten aussieht,
vermerkt der Export lediglich, dass eine Nachricht ausgelassen wurde, sowie deren Byteanzahl.

## Stabilitätsaufzeichnung

Der Gateway zeichnet standardmäßig einen begrenzten, von Nutzdaten freien Stabilitätsdatenstrom auf, wenn
Diagnosen aktiviert sind. Er erfasst betriebliche Fakten, keine Inhalte.

Derselbe Heartbeat erfasst außerdem die Funktionsfähigkeit, wenn die Ereignisschleife oder CPU
ausgelastet erscheint, und gibt `diagnostic.liveness.warning`-Ereignisse mit Ereignisschleifenverzögerung,
Ereignisschleifenauslastung, CPU-Kern-Verhältnis, Anzahl aktiver/wartender/eingereihter Sitzungen,
der aktuellen Start-/Laufzeitphase (sofern bekannt), aktuellen Phasenzeitspannen und
begrenzten Arbeitsbezeichnungen aus. Diese werden nur dann zu Gateway-Protokollzeilen der Ebene `warn`,
wenn Arbeit wartet oder eingereiht ist oder wenn sich aktive Arbeit mit anhaltender Ereignisschleifen-
verzögerung überschneidet; andernfalls werden sie mit `debug` protokolliert. Funktionsfähigkeitsmessungen im Leerlauf werden weiterhin
als Diagnoseereignisse aufgezeichnet, lösen für sich genommen jedoch niemals eine Warnung aus.

Startphasen geben `diagnostic.phase.completed`-Ereignisse mit Echtzeit- und
CPU-Zeitmessung aus. Die Diagnose festgefahrener eingebetteter Ausführungen markiert `terminalProgressStale=true`,
wenn der letzte Fortschritt der Bridge terminal erschien (beispielsweise ein unverarbeitetes Antwort-
element oder ein Antwortabschlussereignis), der Gateway die
eingebettete Ausführung jedoch weiterhin als aktiv betrachtet.

So prüfen Sie die Live-Aufzeichnung:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

So prüfen Sie das neueste gespeicherte Paket nach einem schwerwiegenden Abbruch, einer Zeitüberschreitung beim Herunterfahren oder
einem Fehler beim Start nach einem Neustart:

```bash
openclaw gateway stability --bundle latest
```

So erstellen Sie aus dem neuesten gespeicherten Paket eine Diagnose-ZIP-Datei:

```bash
openclaw gateway stability --bundle latest --export
```

Gespeicherte Pakete befinden sich unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flag                    | Standardwert                                                                  | Beschreibung                                            |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | In einen bestimmten ZIP-Pfad (oder ein Verzeichnis) schreiben. |
| `--log-lines <count>`   | `5000`                                                                        | Maximale Anzahl aufzunehmender bereinigter Protokollzeilen. |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Maximale Anzahl zu prüfender Protokollbytes.            |
| `--url <url>`           | -                                                                             | Gateway-WebSocket-URL für Status-/Integritätsmomentaufnahmen. |
| `--token <token>`       | -                                                                             | Gateway-Token für Status-/Integritätsmomentaufnahmen.   |
| `--password <password>` | -                                                                             | Gateway-Passwort für Status-/Integritätsmomentaufnahmen. |
| `--timeout <ms>`        | `3000`                                                                        | Zeitüberschreitung für Status-/Integritätsmomentaufnahmen. |
| `--no-stability-bundle` | aus                                                                           | Suche nach einem gespeicherten Stabilitätspaket überspringen. |
| `--json`                | aus                                                                           | Maschinenlesbare Exportmetadaten ausgeben.              |

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. So deaktivieren Sie die Stabilitätsaufzeichnung und
die Erfassung von Diagnoseereignissen:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen verringert den Detailgrad von Fehlerberichten; es wirkt sich nicht auf die normale
Gateway-Protokollierung aus.

Ereignisse bei Speicherdruck zeichnen RSS-, Heap-, Schwellenwert- und Wachstumsdaten
(`rss_threshold`, `heap_threshold`, `rss_growth`) auf, ohne einen
Dateisystemscan durchzuführen oder eine Momentaufnahme vor einem Speichermangel zu schreiben.

## Verwandte Themen

- [Integritätsprüfungen](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#rpc-method-families)
- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) – separater Ablauf zum Streamen von Diagnosen an einen Collector
