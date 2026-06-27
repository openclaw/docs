---
read_when:
    - Diagnose der Kanalkonnektivität oder Gateway-Gesundheit
    - CLI-Befehle und -Optionen für Health Checks verstehen
summary: Health-Check-Befehle und Gateway-Zustandsüberwachung
title: Integritätsprüfungen
x-i18n:
    generated_at: "2026-06-27T17:30:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Kurzanleitung zur Überprüfung der Kanalkonnektivität ohne Raten.

## Schnellprüfungen

- `openclaw status` — lokale Zusammenfassung: Gateway-Erreichbarkeit/-Modus, Update-Hinweis, Alter der verknüpften Kanalauthentifizierung, Sitzungen + aktuelle Aktivität.
- `openclaw status --all` — vollständige lokale Diagnose (schreibgeschützt, farbig, sicher zum Einfügen beim Debugging).
- `openclaw status --deep` — fragt das laufende Gateway nach einer Live-Zustandsprüfung (`health` mit `probe:true`), einschließlich kanalbezogener Prüfungen pro Konto, sofern unterstützt.
- `openclaw health` — fragt das laufende Gateway nach seinem Zustands-Snapshot (nur WS; keine direkten Kanal-Sockets aus der CLI).
- `openclaw health --verbose` — erzwingt eine Live-Zustandsprüfung und gibt Details zur Gateway-Verbindung aus.
- `openclaw health --json` — maschinenlesbare Ausgabe des Zustands-Snapshots.
- Senden Sie `/status` als eigenständige Nachricht in WhatsApp/WebChat, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Logs: Verfolgen Sie `/tmp/openclaw/openclaw-*.log` und filtern Sie nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Für Discord und andere Chat-Provider sind Sitzungszeilen kein Nachweis für Socket-Liveness.
`openclaw sessions`, Gateway `sessions.list` und das Agent-Tool `sessions_list`
lesen gespeicherten Konversationszustand. Ein Provider kann sich erneut verbinden und einen fehlerfreien Kanalstatus
anzeigen, bevor eine neue Sitzungszeile materialisiert wurde. Verwenden Sie die oben genannten Kanalstatus- und
Health-Befehle für Live-Konnektivitätsprüfungen.

## Tiefe Diagnose

- Zugangsdaten auf dem Datenträger: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (Pfad kann in der Konfiguration überschrieben werden). Anzahl und aktuelle Empfänger werden über `status` angezeigt.
- Neuverknüpfungsablauf: `openclaw channels logout && openclaw channels login --verbose`, wenn Statuscodes 409–515 oder `loggedOut` in den Logs erscheinen. (Hinweis: Der QR-Anmeldeablauf startet sich bei Status 515 nach dem Pairing einmal automatisch neu.)
- Diagnose ist standardmäßig aktiviert. Das Gateway zeichnet Betriebsdaten auf, sofern nicht `diagnostics.enabled: false` gesetzt ist. Speicherereignisse erfassen RSS-/Heap-Byte-Zähler, Schwellenwertdruck und Wachstumsdruck. Kritischer Speicherdruck wird über den Gateway-Logger protokolliert. Wenn `diagnostics.memoryPressureSnapshot: true` gesetzt ist, schreibt kritischer Speicherdruck außerdem ein Pre-OOM-Stabilitätsbundle mit V8-Heap-Statistiken, Linux-cgroup-Zählern, sofern verfügbar, aktiven Ressourcenanzahlen sowie den größten Sitzungs-/Transkriptdateien nach geschwärztem relativem Pfad. Liveness-Warnungen erfassen Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und die Anzahl aktiver/wartender/eingereihter Sitzungen, wenn der Prozess läuft, aber ausgelastet ist. Ereignisse zu übergroßen Payloads erfassen, was abgelehnt, gekürzt oder in Chunks aufgeteilt wurde, sowie Größen und Limits, sofern verfügbar. Sie erfassen nicht den Nachrichtentext, Anhangsinhalte, Webhook-Body, rohe Request- oder Response-Bodies, Tokens, Cookies oder geheime Werte. Derselbe Heartbeat startet den begrenzten Stabilitätsrekorder, der über `openclaw gateway stability` oder den Gateway-RPC `diagnostics.stability` verfügbar ist. Fatale Gateway-Exits, Shutdown-Timeouts und Neustart-Startfehler speichern den neuesten Rekorder-Snapshot unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind; kritischer Speicherdruck tut dies ebenfalls, aber nur, wenn `diagnostics.memoryPressureSnapshot: true` gesetzt ist. Prüfen Sie das neueste gespeicherte Bundle mit `openclaw gateway stability --bundle latest`.
- Führen Sie für Fehlerberichte `openclaw gateway diagnostics export` aus und hängen Sie die erzeugte ZIP-Datei an. Der Export kombiniert eine Markdown-Zusammenfassung, das neueste Stabilitätsbundle, bereinigte Log-Metadaten, bereinigte Gateway-Status-/Health-Snapshots und die Konfigurationsform. Er ist zum Teilen gedacht: Chat-Text, Webhook-Bodies, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen und geheime Werte werden ausgelassen oder geschwärzt. Siehe [Diagnoseexport](/de/gateway/diagnostics).

## Konfiguration des Health-Monitors

- `gateway.channelHealthCheckMinutes`: wie oft das Gateway den Kanalzustand prüft. Standard: `5`. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: wie lange ein verbundener Kanal inaktiv bleiben kann, bevor der Health-Monitor ihn als veraltet behandelt und neu startet. Standard: `30`. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: rollierendes Ein-Stunden-Limit für Neustarts durch den Health-Monitor pro Kanal/Konto. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: deaktiviert Neustarts durch den Health-Monitor für einen bestimmten Kanal, während die globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Multi-Konto-Override, der Vorrang vor der Einstellung auf Kanalebene hat.
- Diese kanalbezogenen Overrides gelten für die integrierten Kanalmonitore, die sie heute bereitstellen: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Uptime-Monitoring

Externe Uptime-Monitoring-Dienste sollten den dedizierten `/health`-Endpunkt verwenden, nicht `/v1/chat/completions`.

- **VERWENDEN:** `GET /health` — sofortige Antwort, keine Sitzung erstellt, kein LLM-Aufruf, gibt `{"ok":true,"status":"live"}` zurück
- **NICHT verwenden:** `/v1/chat/completions` für Health-Checks — jeder Request erstellt eine vollständige Agent-Sitzung mit Skill-Snapshot, Kontextaufbau und LLM-Aufrufen

Wenn kein `x-openclaw-session-key`-Header und kein `user`-Feld bereitgestellt wird, erzeugt `/v1/chat/completions` für jeden Request eine neue zufällige Sitzung. Monitoring-Dienste, die alle 15 Minuten pingen, erzeugen etwa 96 Sitzungen/Tag, die jeweils 4–22 KB verbrauchen. Mit der Zeit führt dies zu aufgeblähtem Sitzungsspeicher und kann zu einem Überlauf des Kontextfensters führen.

### Einrichtungsbeispiele für Monitoring-Dienste

- **BetterStack:** Setzen Sie die Health-Check-URL auf `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Fügen Sie einen neuen HTTP-Monitor mit der URL `https://<your-gateway-host>:<port>/health` hinzu
- **Allgemein:** Jeder HTTP-GET an `/health` gibt 200 mit `{"ok":true}` zurück, wenn das Gateway fehlerfrei ist

## Wenn etwas fehlschlägt

- `logged out` oder Status 409–515 → neu verknüpfen mit `openclaw channels logout`, dann `openclaw channels login`.
- Gateway nicht erreichbar → starten Sie es: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → bestätigen Sie, dass das verknüpfte Telefon online ist und der Absender zugelassen ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Allowlist- und Erwähnungsregeln übereinstimmen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedizierter „health“-Befehl

`openclaw health` fragt das laufende Gateway nach seinem Zustands-Snapshot (keine direkten Kanal-
Sockets aus der CLI). Standardmäßig kann er einen frischen zwischengespeicherten Gateway-Snapshot zurückgeben; das
Gateway aktualisiert diesen Cache anschließend im Hintergrund. `openclaw health --verbose` erzwingt
stattdessen eine Live-Prüfung. Der Befehl meldet, sofern verfügbar, verknüpfte Zugangsdaten/das Authentifizierungsalter,
Zusammenfassungen der Prüfungen pro Kanal, eine Zusammenfassung des Sitzungsspeichers und eine Prüfdauer. Er beendet sich
mit einem Nicht-Null-Code, wenn das Gateway nicht erreichbar ist oder die Prüfung fehlschlägt/einen Timeout erreicht.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: überschreibt den standardmäßigen Prüf-Timeout von 10 s
- `--verbose`: erzwingt eine Live-Prüfung und gibt Details zur Gateway-Verbindung aus
- `--debug`: Alias für `--verbose`

Der Zustands-Snapshot enthält: `ok` (boolesch), `ts` (Zeitstempel), `durationMs` (Prüfdauer), Status pro Kanal, Agent-Verfügbarkeit und Zusammenfassung des Sitzungsspeichers.

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
