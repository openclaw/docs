---
read_when:
    - Vorbereiten eines Fehlerberichts oder einer Supportanfrage
    - Fehlerbehebung bei Gateway-Abstürzen, Neustarts, Speicherdruck oder übergroßen Nutzdaten
    - Überprüfen, welche Diagnosedaten aufgezeichnet oder unkenntlich gemacht werden
summary: Erstellen Sie teilbare Gateway-Diagnosepakete für Fehlerberichte
title: Diagnosedatenexport
x-i18n:
    generated_at: "2026-07-12T01:37:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann für Fehlerberichte eine lokale Diagnose-`.zip` erstellen: bereinigter Gateway-
Status, Zustandsprüfung, Protokolle, Konfigurationsstruktur und aktuelle, nutzlastfreie Stabilitätsereignisse.

Behandeln Sie Diagnosepakete bis zur Überprüfung wie Geheimnisse. Nutzlasten und Zugangsdaten
werden standardmäßig geschwärzt, das Paket fasst jedoch weiterhin lokale Gateway-Protokolle und
den Laufzeitstatus auf Hostebene zusammen.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Gibt den Pfad der erstellten ZIP-Datei aus. So wählen Sie einen Ausgabepfad:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für die Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Chat-Befehl

Besitzer können in jeder Unterhaltung `/diagnostics [note]` ausführen, um einen lokalen
Gateway-Export als einzelnen, kopierbaren Supportbericht anzufordern:

1. Senden Sie `/diagnostics`, optional mit einem kurzen Hinweis (`/diagnostics bad tool choice`).
2. OpenClaw sendet eine Vorbemerkung und fordert eine einmalige ausdrückliche Ausführungsgenehmigung an, durch die
   `openclaw gateway diagnostics export --json` ausgeführt wird. Genehmigen Sie Diagnosen nicht über
   eine Regel, die alles erlaubt.
3. Nach der Genehmigung antwortet OpenClaw mit dem lokalen Paketpfad, einer Zusammenfassung
   des Manifests, Datenschutzhinweisen und relevanten Sitzungs-IDs.

In Gruppenchats kann ein Besitzer weiterhin `/diagnostics` ausführen, OpenClaw sendet das
Exportergebnis, Genehmigungsaufforderungen und die Aufschlüsselung der Codex-Sitzungen/-Threads jedoch
privat an den Besitzer. Die Gruppe sieht nur einen kurzen Hinweis, dass die Diagnosen
privat gesendet wurden. Wenn kein privater Kommunikationsweg zum Besitzer vorhanden ist, schlägt der Befehl sicher fehl und fordert
den Besitzer auf, ihn in einer Direktnachricht auszuführen.

Wenn die aktive Sitzung das native OpenAI-Codex-System verwendet, deckt dieselbe
Ausführungsgenehmigung auch das Hochladen von OpenAI-Feedback für die OpenClaw bekannten Codex-Threads
ab. Dieser Upload erfolgt getrennt von der lokalen Gateway-ZIP-Datei und
nur bei Sitzungen mit dem Codex-System. Die Genehmigungsaufforderung weist darauf hin, dass eine Genehmigung
auch Codex-Feedback sendet, ohne Codex-Sitzungs- oder Thread-IDs aufzuführen. Nach
der Genehmigung listet die Antwort Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und
lokale Fortsetzungsbefehle für die an OpenAI gesendeten Threads auf. Wird die Genehmigung abgelehnt oder
ignoriert, werden der Export, das Hochladen des Codex-Feedbacks und die
Liste der Codex-IDs übersprungen.

Dadurch bleibt die Codex-Fehlersuchschleife kurz: Stellen Sie fehlerhaftes Verhalten in einem Kanal fest,
führen Sie `/diagnostics` aus, genehmigen Sie einmalig, teilen Sie den Bericht und führen Sie anschließend den ausgegebenen
Befehl `codex resume <thread-id>` lokal aus, wenn Sie den Thread
selbst untersuchen möchten. Siehe [Codex-System](/de/plugins/codex-harness#inspect-codex-threads-locally).

## Inhalt des Exports

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Protokollen, Status, Zustandsprüfung
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Protokollzusammenfassungen und aktuelle geschwärzte Protokollzeilen.
- Nach bestem Bemühen erstellte Momentaufnahmen von Gateway-Status und -Zustand.
- `stability/latest.json`: neuestes gespeichertes Stabilitätspaket, sofern verfügbar.

Der Export ist auch dann nützlich, wenn der Gateway fehlerhaft ist: Wenn Status-/Zustandsabfragen
fehlschlagen, werden lokale Protokolle, die Konfigurationsstruktur und das neueste Stabilitätspaket
weiterhin erfasst, sofern verfügbar.

## Datenschutzmodell

Beibehalten werden: Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs, konfigurierte
Modi, Statuscodes, Zeitspannen, Byte-Anzahlen, Warteschlangenstatus, Speicherwerte,
bereinigte Protokollmetadaten, geschwärzte Betriebsmeldungen, Konfigurationsstruktur und
nicht geheime Funktionseinstellungen.

Ausgelassen oder geschwärzt werden: Chattext, Prompts, Anweisungen, Webhook-Inhalte, Werkzeugausgaben,
Zugangsdaten, API-Schlüssel, Token, Cookies, geheime Werte, unverarbeitete
Anfrage-/Antwortinhalte, Konto-IDs, Nachrichten-IDs, unverarbeitete Sitzungs-IDs,
Hostnamen und lokale Benutzernamen.

Wenn eine Protokollmeldung wie Text aus Benutzer-, Chat-, Prompt- oder Werkzeugnutzlasten aussieht, hält der
Export lediglich fest, dass eine Meldung ausgelassen wurde, sowie deren Byte-Anzahl.

## Stabilitätsaufzeichnung

Der Gateway zeichnet standardmäßig einen begrenzten, nutzlastfreien Stabilitätsdatenstrom auf, wenn
Diagnosen aktiviert sind. Er erfasst betriebliche Fakten, keine Inhalte.

Derselbe Heartbeat prüft außerdem die Aktivität, wenn die Ereignisschleife oder CPU
ausgelastet zu sein scheint, und gibt `diagnostic.liveness.warning`-Ereignisse mit der Verzögerung der Ereignisschleife,
der Auslastung der Ereignisschleife, dem CPU-Kern-Verhältnis, der Anzahl aktiver/wartender/in der Warteschlange befindlicher Sitzungen,
der aktuellen Start-/Laufzeitphase (sofern bekannt), aktuellen Phasenzeitspannen und
begrenzten Arbeitsbezeichnungen aus. Diese werden nur dann zu Gateway-Protokollzeilen der Stufe `warn`,
wenn Arbeit wartet oder sich in der Warteschlange befindet oder wenn aktive Arbeit mit einer anhaltenden Verzögerung der Ereignisschleife
zusammenfällt; andernfalls werden sie mit `debug` protokolliert. Aktivitätsmessungen im Leerlauf werden weiterhin
als Diagnoseereignisse aufgezeichnet, führen für sich allein jedoch niemals zu einer Warnung.

Startphasen geben `diagnostic.phase.completed`-Ereignisse mit Echtzeit- und
CPU-Zeitmessungen aus. Diagnosen blockierter eingebetteter Läufe setzen `terminalProgressStale=true`,
wenn der letzte Fortschritt der Schnittstelle einen Abschluss erkennen ließ (beispielsweise ein unverarbeitetes Antwortelement
oder ein Antwortabschlussereignis), der Gateway den
eingebetteten Lauf jedoch weiterhin als aktiv betrachtet.

So prüfen Sie die aktive Aufzeichnung:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

So prüfen Sie das neueste gespeicherte Paket nach einem schwerwiegenden Abbruch, einer Zeitüberschreitung beim
Herunterfahren oder einem Startfehler beim Neustart:

```bash
openclaw gateway stability --bundle latest
```

So erstellen Sie aus dem neuesten gespeicherten Paket eine Diagnose-ZIP-Datei:

```bash
openclaw gateway stability --bundle latest --export
```

Gespeicherte Pakete befinden sich unter `~/.openclaw/logs/stability/`, sofern Ereignisse vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flag                    | Standardwert                                                                  | Beschreibung                                                |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | In einen bestimmten ZIP-Pfad (oder ein Verzeichnis) schreiben. |
| `--log-lines <count>`   | `5000`                                                                        | Maximale Anzahl aufzunehmender bereinigter Protokollzeilen. |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Maximale Anzahl zu untersuchender Protokollbytes.            |
| `--url <url>`           | -                                                                             | Gateway-WebSocket-URL für Status-/Zustandsmomentaufnahmen.   |
| `--token <token>`       | -                                                                             | Gateway-Token für Status-/Zustandsmomentaufnahmen.           |
| `--password <password>` | -                                                                             | Gateway-Passwort für Status-/Zustandsmomentaufnahmen.        |
| `--timeout <ms>`        | `3000`                                                                        | Zeitüberschreitung für Status-/Zustandsmomentaufnahmen.      |
| `--no-stability-bundle` | deaktiviert                                                                   | Suche nach einem gespeicherten Stabilitätspaket überspringen. |
| `--json`                | deaktiviert                                                                   | Maschinenlesbare Exportmetadaten ausgeben.                   |

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

Das Deaktivieren der Diagnosen verringert den Detailgrad von Fehlerberichten; die normale
Gateway-Protokollierung wird dadurch nicht beeinträchtigt.

Momentaufnahmen bei kritischem Speicherdruck sind standardmäßig deaktiviert. So erfassen Sie zusätzlich zu normalen
Diagnoseereignissen die Stabilitätsmomentaufnahme vor einem Speichermangel:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Verwenden Sie dies nur auf Hosts, die den zusätzlichen Dateisystemscan und das
Schreiben der Momentaufnahme bei kritischem Speicherdruck verkraften können. Normale Speicherdruckereignisse
zeichnen weiterhin RSS-, Heap-, Schwellenwert- und Wachstumsdaten (`rss_threshold`,
`heap_threshold`, `rss_growth`) auf, wenn die Momentaufnahme deaktiviert ist.

## Verwandte Themen

- [Zustandsprüfungen](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#rpc-method-families)
- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) – separater Ablauf zum Streamen von Diagnosen an einen Collector
