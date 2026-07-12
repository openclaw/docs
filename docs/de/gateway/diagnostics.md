---
read_when:
    - Vorbereiten eines Fehlerberichts oder einer Supportanfrage
    - Fehlerbehebung bei Gateway-Abstürzen, Neustarts, Speicherdruck oder übergroßen Nutzdaten
    - Überprüfen, welche Diagnosedaten erfasst oder geschwärzt werden
summary: Erstellen Sie teilbare Gateway-Diagnosepakete für Fehlerberichte
title: Diagnoseexport
x-i18n:
    generated_at: "2026-07-12T15:23:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kann für Fehlerberichte eine lokale Diagnose-`.zip` erstellen: bereinigter Gateway-
Status, Zustand, Protokolle, Konfigurationsstruktur und aktuelle stabilitätsbezogene Ereignisse ohne Nutzdaten.

Behandeln Sie Diagnosepakete bis zur Überprüfung wie Geheimnisse. Nutzdaten und Zugangsdaten
werden standardmäßig geschwärzt, das Paket fasst jedoch weiterhin lokale Gateway-Protokolle und
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
2. OpenClaw sendet eine Vorbemerkung und fordert eine einmalige ausdrückliche Ausführungsgenehmigung an, die
   `openclaw gateway diagnostics export --json` ausführt. Genehmigen Sie Diagnosen nicht über
   eine Regel, die alles erlaubt.
3. Nach der Genehmigung antwortet OpenClaw mit dem lokalen Paketpfad, einer Manifest-
   Zusammenfassung, Datenschutzhinweisen und relevanten Sitzungs-IDs.

In Gruppenchats kann ein Eigentümer weiterhin `/diagnostics` ausführen, OpenClaw sendet das
Exportergebnis, Genehmigungsaufforderungen und die Aufschlüsselung der Codex-Sitzungen/-Threads jedoch
privat an den Eigentümer. Die Gruppe sieht nur einen kurzen Hinweis, dass die Diagnosen
privat gesendet wurden. Wenn keine private Route zum Eigentümer vorhanden ist, schlägt der Befehl sicher
fehl und fordert den Eigentümer auf, ihn in einer Direktnachricht auszuführen.

Wenn die aktive Sitzung das native OpenAI-Codex-Harness verwendet, deckt dieselbe
Ausführungsgenehmigung auch das Hochladen von OpenAI-Feedback für die OpenClaw bekannten Codex-Threads
ab. Dieser Upload ist vom lokalen Gateway-ZIP getrennt und erfolgt nur
bei Codex-Harness-Sitzungen. Die Genehmigungsaufforderung weist darauf hin, dass die Genehmigung
auch Codex-Feedback sendet, ohne Codex-Sitzungs- oder Thread-IDs aufzulisten. Nach
der Genehmigung enthält die Antwort Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und
lokale Fortsetzungsbefehle für die an OpenAI gesendeten Threads. Wird die
Genehmigung abgelehnt oder ignoriert, werden der Export, das Hochladen des Codex-Feedbacks und die
Liste der Codex-IDs übersprungen.

Dadurch bleibt die Codex-Debugging-Schleife kurz: Stellen Sie fehlerhaftes Verhalten in einem Kanal fest,
führen Sie `/diagnostics` aus, genehmigen Sie einmalig, teilen Sie den Bericht und führen Sie anschließend den ausgegebenen
Befehl `codex resume <thread-id>` lokal aus, wenn Sie den Thread selbst untersuchen
möchten. Siehe [Codex-Harness](/de/plugins/codex-harness#inspect-codex-threads-locally).

## Inhalt des Exports

- `summary.md`: menschenlesbare Übersicht für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Protokollen, Status, Zustand
  und Stabilitätsdaten.
- `manifest.json`: Exportmetadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Protokollzusammenfassungen und aktuelle geschwärzte Protokollzeilen.
- Nach bestem Bemühen erstellte Momentaufnahmen von Gateway-Status und -Zustand.
- `stability/latest.json`: neuestes persistiertes Stabilitätspaket, sofern verfügbar.

Der Export ist auch dann nützlich, wenn der Gateway nicht fehlerfrei funktioniert: Wenn Status-/Zustands-
anfragen fehlschlagen, werden lokale Protokolle, die Konfigurationsstruktur und das neueste Stabilitätspaket
weiterhin erfasst, sofern sie verfügbar sind.

## Datenschutzmodell

Beibehalten werden: Subsystemnamen, Plugin-IDs, Provider-IDs, Kanal-IDs, konfigurierte
Modi, Statuscodes, Zeitspannen, Byte-Anzahlen, Warteschlangenstatus, Speicherwerte,
bereinigte Protokollmetadaten, geschwärzte Betriebsmeldungen, Konfigurationsstruktur und
nicht geheime Funktionseinstellungen.

Ausgelassen oder geschwärzt werden: Chattext, Prompts, Anweisungen, Webhook-Inhalte, Werkzeug-
ausgaben, Zugangsdaten, API-Schlüssel, Token, Cookies, geheime Werte, unformatierte
Anfrage-/Antwortinhalte, Konto-IDs, Nachrichten-IDs, unformatierte Sitzungs-IDs,
Hostnamen und lokale Benutzernamen.

Wenn eine Protokollmeldung wie Text aus Nutzdaten eines Benutzers, Chats, Prompts oder Werkzeugs aussieht,
vermerkt der Export nur, dass eine Nachricht ausgelassen wurde, sowie deren Byte-Anzahl.

## Stabilitätsaufzeichnung

Der Gateway zeichnet standardmäßig einen begrenzten, von Nutzdaten freien Stabilitätsdatenstrom auf, wenn
Diagnosen aktiviert sind. Er erfasst Betriebsfakten, keine Inhalte.

Derselbe Heartbeat prüft auch die Betriebsbereitschaft, wenn die Ereignisschleife oder CPU
ausgelastet erscheint, und gibt `diagnostic.liveness.warning`-Ereignisse mit Ereignisschleifenverzögerung,
Ereignisschleifenauslastung, CPU-Kern-Verhältnis, der Anzahl aktiver/wartender/eingereihter Sitzungen,
der aktuellen Start-/Laufzeitphase (sofern bekannt), aktuellen Phasenzeitspannen und
begrenzten Arbeitsbezeichnungen aus. Diese werden nur dann zu Gateway-Protokollzeilen der Stufe `warn`,
wenn Arbeit wartet oder eingereiht ist oder wenn sich aktive Arbeit mit einer anhaltenden Ereignisschleifen-
verzögerung überschneidet; andernfalls werden sie mit `debug` protokolliert. Betriebsbereitschaftsmessungen im Leerlauf werden weiterhin
als Diagnoseereignisse aufgezeichnet, aber für sich genommen niemals zu einer Warnung hochgestuft.

Startphasen geben `diagnostic.phase.completed`-Ereignisse mit Wanduhr- und
CPU-Zeitmessung aus. Diagnosen festgefahrener eingebetteter Ausführungen setzen `terminalProgressStale=true`,
wenn der letzte Bridge-Fortschritt terminal erschien (beispielsweise ein unformatiertes Antwort-
element oder ein Antwortabschlussereignis), der Gateway die eingebettete Ausführung jedoch weiterhin
als aktiv betrachtet.

So prüfen Sie die laufende Aufzeichnung:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

So prüfen Sie das neueste persistierte Paket nach einem schwerwiegenden Abbruch, einer Zeitüberschreitung beim
Herunterfahren oder einem Fehler beim Neustart:

```bash
openclaw gateway stability --bundle latest
```

So erstellen Sie aus dem neuesten persistierten Paket eine Diagnose-ZIP-Datei:

```bash
openclaw gateway stability --bundle latest --export
```

Persistierte Pakete befinden sich unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flag                    | Standardwert                                                                  | Beschreibung                                                 |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | In einen bestimmten ZIP-Pfad (oder ein Verzeichnis) schreiben. |
| `--log-lines <count>`   | `5000`                                                                        | Maximale Anzahl einzubeziehender bereinigter Protokollzeilen. |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Maximale Anzahl zu prüfender Protokollbytes.                  |
| `--url <url>`           | -                                                                             | Gateway-WebSocket-URL für Status-/Zustandsmomentaufnahmen.    |
| `--token <token>`       | -                                                                             | Gateway-Token für Status-/Zustandsmomentaufnahmen.            |
| `--password <password>` | -                                                                             | Gateway-Passwort für Status-/Zustandsmomentaufnahmen.         |
| `--timeout <ms>`        | `3000`                                                                        | Zeitüberschreitung für Status-/Zustandsmomentaufnahmen.       |
| `--no-stability-bundle` | off                                                                           | Suche nach persistiertem Stabilitätspaket überspringen.       |
| `--json`                | off                                                                           | Maschinenlesbare Exportmetadaten ausgeben.                    |

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

Das Deaktivieren von Diagnosen verringert den Detailgrad von Fehlerberichten; die normale
Gateway-Protokollierung wird dadurch nicht beeinträchtigt.

Momentaufnahmen bei kritischer Speicherauslastung sind standardmäßig deaktiviert. So erfassen Sie zusätzlich
zu normalen Diagnoseereignissen die Stabilitätsmomentaufnahme vor einem OOM-Fehler:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Verwenden Sie dies nur auf Hosts, die den zusätzlichen Dateisystemscan und
das Schreiben der Momentaufnahme während kritischer Speicherauslastung verkraften können. Normale Speicherauslastungsereignisse
zeichnen weiterhin RSS-, Heap-, Schwellenwert- und Wachstumsfakten (`rss_threshold`,
`heap_threshold`, `rss_growth`) auf, wenn die Momentaufnahme deaktiviert ist.

## Verwandte Themen

- [Zustandsprüfungen](/de/gateway/health)
- [Gateway-CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway-Protokoll](/de/gateway/protocol#rpc-method-families)
- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry) – separater Ablauf zum Streamen von Diagnosen an einen Collector
