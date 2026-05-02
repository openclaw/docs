---
read_when:
    - Kanalverbindungen oder Gateway-Zustand diagnostizieren
    - CLI-Befehle und -Optionen für Integritätsprüfungen verstehen
summary: Health-Check-Befehle und Gateway-Zustandsüberwachung
title: Zustandsprüfungen
x-i18n:
    generated_at: "2026-05-02T20:46:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Kurzanleitung zur Überprüfung der Kanalverbindung ohne Raten.

## Schnellprüfungen

- `openclaw status` — lokale Zusammenfassung: Gateway-Erreichbarkeit/-Modus, Aktualisierungshinweis, Alter der verknüpften Kanalauthentifizierung, Sitzungen + aktuelle Aktivität.
- `openclaw status --all` — vollständige lokale Diagnose (schreibgeschützt, farbig, sicher zum Einfügen für Debugging).
- `openclaw status --deep` — fragt das laufende Gateway nach einer Live-Zustandsprüfung (`health` mit `probe:true`), einschließlich kanalbezogener Prüfungen pro Konto, sofern unterstützt.
- `openclaw health` — fragt das laufende Gateway nach seinem Zustands-Snapshot (nur WS; keine direkten Kanal-Sockets von der CLI).
- `openclaw health --verbose` — erzwingt eine Live-Zustandsprüfung und gibt Gateway-Verbindungsdetails aus.
- `openclaw health --json` — maschinenlesbare Ausgabe des Zustands-Snapshots.
- Senden Sie `/status` als eigenständige Nachricht in WhatsApp/WebChat, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Protokolle: verfolgen Sie `/tmp/openclaw/openclaw-*.log` und filtern Sie nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Für Discord und andere Chat-Provider sind Sitzungszeilen keine Socket-Verfügbarkeit.
`openclaw sessions`, Gateway `sessions.list` und das Agent-Tool `sessions_list`
lesen gespeicherten Unterhaltungszustand. Ein Provider kann sich erneut verbinden und einen fehlerfreien Kanalstatus anzeigen,
bevor ein neuer Sitzungseintrag materialisiert wird. Verwenden Sie die oben genannten Kanalstatus- und
Zustandsbefehle für Live-Verbindungsprüfungen.

## Ausführliche Diagnosen

- Zugangsdaten auf dem Datenträger: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (Pfad kann in der Konfiguration überschrieben werden). Anzahl und aktuelle Empfänger werden über `status` angezeigt.
- Erneutes Verknüpfen: `openclaw channels logout && openclaw channels login --verbose`, wenn Statuscodes 409–515 oder `loggedOut` in Protokollen erscheinen. (Hinweis: Der QR-Anmeldefluss startet nach der Kopplung bei Status 515 einmal automatisch neu.)
- Diagnosen sind standardmäßig aktiviert. Das Gateway zeichnet betriebliche Fakten auf, sofern nicht `diagnostics.enabled: false` gesetzt ist. Speicherereignisse zeichnen RSS-/Heap-Byte-Zahlen, Schwellwertdruck und Wachstumsdruck auf. Verfügbarkeitswarnungen zeichnen Ereignisschleifenverzögerung, Ereignisschleifenauslastung, CPU-Kern-Verhältnis sowie Anzahl aktiver/wartender/eingereihter Sitzungen auf, wenn der Prozess läuft, aber ausgelastet ist. Ereignisse zu übergroßen Nutzlasten zeichnen auf, was abgelehnt, gekürzt oder in Blöcke aufgeteilt wurde, außerdem Größen und Grenzwerte, sofern verfügbar. Sie zeichnen keinen Nachrichtentext, keine Anhangsinhalte, keinen Webhook-Body, keinen rohen Anfrage- oder Antwort-Body, keine Token, Cookies oder geheimen Werte auf. Derselbe Heartbeat startet den begrenzten Stabilitätsrekorder, der über `openclaw gateway stability` oder den Gateway-RPC `diagnostics.stability` verfügbar ist. Fatale Gateway-Beendigungen, Zeitüberschreitungen beim Herunterfahren und Startfehler beim Neustart speichern den neuesten Rekorder-Snapshot unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind; prüfen Sie das neueste gespeicherte Bundle mit `openclaw gateway stability --bundle latest`.
- Führen Sie für Fehlerberichte `openclaw gateway diagnostics export` aus und hängen Sie die generierte ZIP-Datei an. Der Export kombiniert eine Markdown-Zusammenfassung, das neueste Stabilitäts-Bundle, bereinigte Protokollmetadaten, bereinigte Gateway-Status-/Zustands-Snapshots und die Konfigurationsstruktur. Er ist zum Teilen gedacht: Chattext, Webhook-Bodys, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen und geheime Werte werden ausgelassen oder geschwärzt. Siehe [Diagnoseexport](/de/gateway/diagnostics).

## Konfiguration des Zustandsmonitors

- `gateway.channelHealthCheckMinutes`: wie oft das Gateway den Kanalzustand prüft. Standard: `5`. Setzen Sie `0`, um Neustarts durch den Zustandsmonitor global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: wie lange ein verbundener Kanal inaktiv bleiben kann, bevor der Zustandsmonitor ihn als veraltet behandelt und neu startet. Standard: `30`. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: gleitende Ein-Stunden-Obergrenze für Neustarts durch den Zustandsmonitor pro Kanal/Konto. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: deaktiviert Neustarts durch den Zustandsmonitor für einen bestimmten Kanal, während die globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Mehrkonto-Überschreibung, die Vorrang vor der Einstellung auf Kanalebene hat.
- Diese kanalbezogenen Überschreibungen gelten für die integrierten Kanalmonitore, die sie heute bereitstellen: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Wenn etwas fehlschlägt

- `logged out` oder Status 409–515 → erneut verknüpfen mit `openclaw channels logout` und danach `openclaw channels login`.
- Gateway nicht erreichbar → starten Sie es: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → bestätigen Sie, dass das verknüpfte Telefon online ist und der Absender erlaubt ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Zulassungsliste + Erwähnungsregeln übereinstimmen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Eigener `health`-Befehl

`openclaw health` fragt das laufende Gateway nach seinem Zustands-Snapshot (keine direkten Kanal-
Sockets von der CLI). Standardmäßig kann er einen aktuellen zwischengespeicherten Gateway-Snapshot zurückgeben; das
Gateway aktualisiert diesen Cache anschließend im Hintergrund. `openclaw health --verbose` erzwingt
stattdessen eine Live-Prüfung. Der Befehl meldet verknüpfte Zugangsdaten/das Authentifizierungsalter, sofern verfügbar,
Prüfzusammenfassungen pro Kanal, eine Zusammenfassung des Sitzungsspeichers und eine Prüfdauer. Er beendet sich
mit einem von null verschiedenen Code, wenn das Gateway nicht erreichbar ist oder die Prüfung fehlschlägt/eine Zeitüberschreitung erreicht.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: überschreibt das standardmäßige Prüfzeitlimit von 10 s
- `--verbose`: erzwingt eine Live-Prüfung und gibt Gateway-Verbindungsdetails aus
- `--debug`: Alias für `--verbose`

Der Zustands-Snapshot enthält: `ok` (boolesch), `ts` (Zeitstempel), `durationMs` (Prüfzeit), Status pro Kanal, Agent-Verfügbarkeit und Zusammenfassung des Sitzungsspeichers.

## Verwandte Themen

- [Gateway-Runbook](/de/gateway)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
