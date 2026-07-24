---
read_when:
    - Diagnose der Kanalverbindung oder des Gateway-Zustands
    - Grundlegendes zu CLI-Befehlen und Optionen für Integritätsprüfungen
summary: Befehle für Zustandsprüfungen und Überwachung des Gateway-Zustands
title: Systemprüfungen
x-i18n:
    generated_at: "2026-07-24T04:25:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a7fbfb7fb86be7dbd3a03f96c7328c2bc8cc851230c0bdd1b1b750b3014be4
    source_path: gateway/health.md
    workflow: 16
---

Kurzanleitung zur Überprüfung der Channel-Konnektivität ohne Mutmaßungen.

## Schnellprüfungen

- `openclaw status` – lokale Zusammenfassung: Erreichbarkeit/Modus des Gateways, Aktualisierungshinweis, Alter der verknüpften Channel-Authentifizierung, Sitzungen und letzte Aktivität.
- `openclaw status --all` – vollständige lokale Diagnose (schreibgeschützt, farbig, kann sicher zur Fehlerbehebung eingefügt werden).
- `openclaw status --deep` – fordert vom laufenden Gateway eine Live-Prüfung an (`health` mit `probe:true`), einschließlich Channel-Prüfungen pro Konto, sofern unterstützt.
- `openclaw status --usage` – zeigt Momentaufnahmen zur Nutzung und zum Kontingent des Modell-Providers.
- `openclaw health` – fordert vom laufenden Gateway dessen Systemzustands-Momentaufnahme an (nur WS; keine direkten Channel-Sockets von der CLI).
- `openclaw health --verbose` (Alias `--debug`) – erzwingt eine Live-Systemzustandsprüfung und gibt Details zur Gateway-Verbindung aus.
- `openclaw health --json` – maschinenlesbare Ausgabe der Systemzustands-Momentaufnahme.
- Senden Sie `/status` als eigenständigen Chat-Befehl in einem beliebigen Channel, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Protokolle: Führen Sie `openclaw logs --follow` (oder `openclaw --profile <profile> logs --follow`) aus und filtern Sie nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Bei Discord und anderen Chat-Providern geben Sitzungszeilen keinen Aufschluss über die Socket-Verfügbarkeit.
`openclaw sessions`, Gateway `sessions.list` und das Agenten-Tool `sessions_list`
lesen den gespeicherten Konversationszustand. Ein Provider kann die Verbindung wiederherstellen und einen fehlerfreien Channel-
Status anzeigen, bevor eine neue Sitzungszeile angelegt wurde. Verwenden Sie die oben genannten Befehle für Channel-Status und
Systemzustand, um die Live-Konnektivität zu prüfen.

## Detaillierte Diagnose

- Anmeldedaten auf dem Datenträger: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (die Änderungszeit sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Anzahl und letzte Empfänger werden über `status` angezeigt.
- Erneute Verknüpfung: `openclaw channels logout && openclaw channels login --verbose`, wenn die Statuscodes 409-515 oder `loggedOut` in den Protokollen erscheinen. Der QR-Anmeldevorgang wird nach der Kopplung bei Status 515 einmal automatisch neu gestartet.
- Diagnosen sind standardmäßig aktiviert (`diagnostics.enabled: false` deaktiviert sie). Speicherereignisse erfassen RSS-/Heap-Bytezahlen sowie Schwellenwert- und Wachstumsdruck. Verfügbarkeitswarnungen erfassen Ereignisschleifenverzögerung/-auslastung, CPU-Kern-Verhältnis und die Anzahl aktiver/wartender/in der Warteschlange befindlicher Sitzungen, wenn der Prozess läuft, aber überlastet ist. Ereignisse für übergroße Nutzlasten erfassen, was abgelehnt/gekürzt/in Blöcke aufgeteilt wurde, sowie Größen und Grenzwerte, jedoch niemals Nachrichtentext, Anhangsinhalte, Webhook-Inhalte, unformatierte Anfrage-/Antwortinhalte, Tokens, Cookies oder geheime Werte.
- Derselbe Heartbeat steuert den begrenzten Stabilitätsrekorder: `openclaw gateway stability` (oder den Gateway-RPC `diagnostics.stability`). Schwerwiegende Gateway-Beendigungen, Zeitüberschreitungen beim Herunterfahren und Startfehler bei Neustarts speichern die neueste Momentaufnahme unter `~/.openclaw/logs/stability/`. Prüfen Sie das neueste Paket mit `openclaw gateway stability --bundle latest`.
- Führen Sie für Fehlerberichte `openclaw gateway diagnostics export` aus und hängen Sie die erzeugte ZIP-Datei an: eine Markdown-Zusammenfassung, das neueste Stabilitätspaket, bereinigte Protokollmetadaten, bereinigte Gateway-Status-/Systemzustands-Momentaufnahmen und die Konfigurationsstruktur. Chattext, Webhook-Inhalte, Tool-Ausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen und geheime Werte werden ausgelassen oder unkenntlich gemacht. Siehe [Diagnoseexport](/de/gateway/diagnostics).

## Konfiguration der Systemzustandsüberwachung

- `channels.<provider>.healthMonitor.enabled`: deaktiviert Neustarts durch die Systemzustandsüberwachung für einen bestimmten Channel, während die globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Überschreibung für mehrere Konten, die Vorrang vor der Einstellung auf Channel-Ebene hat.
- Diese Channel-spezifischen Überschreibungen gelten für die integrierten Channels, die sie derzeit bereitstellen: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Verfügbarkeitsüberwachung

Externe Dienste zur Verfügbarkeitsüberwachung sollten den dedizierten Endpunkt `/health` verwenden, nicht `/v1/chat/completions`.

- **VERWENDEN:** `GET /health` – sofortige Antwort, keine Sitzung wird erstellt, kein LLM-Aufruf, gibt `{"ok":true,"status":"live"}` zurück
- **NICHT VERWENDEN:** `/v1/chat/completions` für Systemzustandsprüfungen – jede Anfrage erstellt eine vollständige Agentensitzung mit Skills-Momentaufnahme, Kontextzusammenstellung und LLM-Aufrufen

Wenn weder der Header `x-openclaw-session-key` noch das Feld `user` angegeben ist, erzeugt `/v1/chat/completions` für jede Anfrage eine neue zufällige Sitzung. Überwachungsdienste, die alle 15 Minuten eine Anfrage senden, erstellen etwa 96 Sitzungen/Tag, die jeweils 4-22KB belegen. Mit der Zeit bläht dies den Sitzungsspeicher auf und kann zu einem Überlauf des Kontextfensters führen.

### Einrichtungsbeispiele für Überwachungsdienste

- **BetterStack:** Legen Sie die URL für die Systemzustandsprüfung auf `https://<your-gateway-host>:<port>/health` fest
- **UptimeRobot:** Fügen Sie einen neuen HTTP-Monitor mit der URL `https://<your-gateway-host>:<port>/health` hinzu
- **Generisch:** Jede HTTP-GET-Anfrage an `/health` gibt 200 mit `{"ok":true}` zurück, wenn das Gateway fehlerfrei arbeitet

## Wenn ein Fehler auftritt

- `logged out` oder Status 409-515 → mit `openclaw channels logout` und anschließend `openclaw channels login` erneut verknüpfen.
- Gateway nicht erreichbar → starten Sie es: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → bestätigen Sie, dass das verknüpfte Telefon online ist und der Absender zugelassen ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Zulassungsliste und Erwähnungsregeln übereinstimmen (`channels.whatsapp.groups`, `agents.entries.*.groupChat.mentionPatterns`).

## Dedizierter „health“-Befehl

`openclaw health` fordert vom laufenden Gateway dessen Systemzustands-Momentaufnahme an (keine direkten Channel-
Sockets von der CLI). Standardmäßig wird eine aktuelle zwischengespeicherte Gateway-Momentaufnahme zurückgegeben, und das
Gateway aktualisiert diesen Cache im Hintergrund; `--verbose` erzwingt stattdessen eine Live-Prüfung.
Der Befehl meldet, sofern verfügbar, das Alter verknüpfter Anmeldedaten/Authentifizierungen, Zusammenfassungen der Channel-Prüfungen,
eine Zusammenfassung des Sitzungsspeichers und die Prüfungsdauer. Er wird mit einem von null verschiedenen Status beendet, wenn das Gateway
nicht erreichbar ist oder die Prüfung fehlschlägt/eine Zeitüberschreitung auftritt.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: überschreibt die standardmäßige Zeitüberschreitung der Prüfung von 10s
- `--verbose`: erzwingt eine Live-Prüfung und gibt Details zur Gateway-Verbindung aus
- `--debug`: Alias für `--verbose`

Die Systemzustands-Momentaufnahme enthält: `ok` (boolescher Wert), `ts` (Zeitstempel), `durationMs` (Prüfzeit), Status pro Channel, Agentenverfügbarkeit und eine Zusammenfassung des Sitzungsspeichers.

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
