---
read_when:
    - Diagnose der Kanalkonnektivität oder des Gateway-Zustands
    - Grundlegendes zu CLI-Befehlen und Optionen für Integritätsprüfungen
summary: Befehle für Zustandsprüfungen und Überwachung des Gateway-Zustands
title: Integritätsprüfungen
x-i18n:
    generated_at: "2026-07-12T15:24:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Kurzanleitung zum Überprüfen der Kanalkonnektivität ohne Mutmaßungen.

## Schnellprüfungen

- `openclaw status` – lokale Zusammenfassung: Erreichbarkeit/Modus des Gateways, Aktualisierungshinweis, Alter der verknüpften Kanalauthentifizierung, Sitzungen und letzte Aktivität.
- `openclaw status --all` – vollständige lokale Diagnose (schreibgeschützt, farbig, kann zur Fehlerbehebung sicher eingefügt werden).
- `openclaw status --deep` – fordert das laufende Gateway zu einer Live-Prüfung auf (`health` mit `probe:true`), einschließlich kanalbezogener Prüfungen pro Konto, sofern unterstützt.
- `openclaw status --usage` – zeigt Momentaufnahmen der Nutzung/Kontingente von Modell-Providern.
- `openclaw health` – fordert vom laufenden Gateway dessen Zustandsmomentaufnahme an (nur WS; keine direkten Kanalsockets von der CLI).
- `openclaw health --verbose` (Alias `--debug`) – erzwingt eine Live-Zustandsprüfung und gibt Details zur Gateway-Verbindung aus.
- `openclaw health --json` – maschinenlesbare Ausgabe der Zustandsmomentaufnahme.
- Senden Sie `/status` als eigenständigen Chatbefehl in einem beliebigen Kanal, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Protokolle: Verfolgen Sie `/tmp/openclaw/openclaw-*.log` und filtern Sie nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Bei Discord und anderen Chat-Providern geben Sitzungszeilen nicht an, ob ein Socket aktiv ist.
`openclaw sessions`, Gateway-`sessions.list` und das Agentenwerkzeug `sessions_list`
lesen den gespeicherten Unterhaltungszustand. Ein Provider kann die Verbindung wiederherstellen und einen fehlerfreien
Kanalstatus anzeigen, bevor eine neue Sitzungszeile angelegt wird. Verwenden Sie für Live-Konnektivitätsprüfungen
die oben genannten Befehle für Kanalstatus und Zustand.

## Tiefgehende Diagnose

- Anmeldedaten auf dem Datenträger: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (die Änderungszeit sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Anzahl und letzte Empfänger werden über `status` angezeigt.
- Erneute Verknüpfung: `openclaw channels logout && openclaw channels login --verbose`, wenn in den Protokollen die Statuscodes 409-515 oder `loggedOut` erscheinen. Der QR-Anmeldevorgang wird nach der Kopplung bei Status 515 einmal automatisch neu gestartet.
- Diagnosen sind standardmäßig aktiviert (`diagnostics.enabled: false` deaktiviert sie). Speicherereignisse zeichnen RSS-/Heap-Bytezahlen sowie Schwellenwert-/Wachstumsdruck auf; kritischer Speicherdruck wird über den Gateway-Logger protokolliert und schreibt, wenn `diagnostics.memoryPressureSnapshot: true` festgelegt ist, zusätzlich ein Stabilitätspaket vor einem OOM (V8-Heap-Statistiken, Linux-cgroup-Zähler, sofern verfügbar, Anzahl aktiver Ressourcen sowie die größten Sitzungs-/Transkriptdateien nach geschwärztem relativen Pfad). Liveness-Warnungen zeichnen die Verzögerung/Auslastung der Ereignisschleife, das CPU-Kern-Verhältnis und die Anzahl aktiver/wartender/eingereihter Sitzungen auf, wenn der Prozess läuft, aber ausgelastet ist. Ereignisse für übergroße Nutzdaten zeichnen auf, was abgelehnt/gekürzt/aufgeteilt wurde, einschließlich Größen und Grenzwerten, jedoch niemals Nachrichtentext, Anhangsinhalte, Webhook-Inhalte, unformatierte Anfrage-/Antwortinhalte, Token, Cookies oder geheime Werte.
- Derselbe Heartbeat steuert die begrenzte Stabilitätsaufzeichnung: `openclaw gateway stability` (oder der Gateway-RPC `diagnostics.stability`). Schwerwiegende Gateway-Beendigungen, Zeitüberschreitungen beim Herunterfahren, Startfehler bei Neustarts und (wenn `diagnostics.memoryPressureSnapshot: true`) kritischer Speicherdruck speichern die neueste Momentaufnahme unter `~/.openclaw/logs/stability/`. Untersuchen Sie das neueste Paket mit `openclaw gateway stability --bundle latest`.
- Führen Sie für Fehlerberichte `openclaw gateway diagnostics export` aus und hängen Sie die erzeugte ZIP-Datei an: eine Markdown-Zusammenfassung, das neueste Stabilitätspaket, bereinigte Protokollmetadaten, bereinigte Momentaufnahmen von Gateway-Status und -Zustand sowie die Konfigurationsstruktur. Chattext, Webhook-Inhalte, Werkzeugausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen und geheime Werte werden ausgelassen oder geschwärzt. Siehe [Diagnoseexport](/de/gateway/diagnostics).

## Konfiguration der Zustandsüberwachung

- `gateway.channelHealthCheckMinutes`: wie häufig das Gateway den Kanalzustand prüft. Standard: `5`. Legen Sie `0` fest, um Neustarts durch die Zustandsüberwachung global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: wie lange ein verbundener Kanal inaktiv bleiben darf, bevor die Zustandsüberwachung ihn als veraltet behandelt und neu startet. Standard: `30`. Dieser Wert muss größer oder gleich `gateway.channelHealthCheckMinutes` sein.
- `gateway.channelMaxRestartsPerHour`: gleitende Obergrenze pro Stunde für Neustarts durch die Zustandsüberwachung je Kanal/Konto. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: deaktiviert Neustarts durch die Zustandsüberwachung für einen bestimmten Kanal, während die globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Mehrkontenüberschreibung, die Vorrang vor der Einstellung auf Kanalebene hat.
- Diese kanalbezogenen Überschreibungen gelten für die integrierten Kanäle, die sie derzeit bereitstellen: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Verfügbarkeitsüberwachung

Externe Dienste zur Verfügbarkeitsüberwachung sollten den dedizierten Endpunkt `/health` verwenden, nicht `/v1/chat/completions`.

- **VERWENDEN:** `GET /health` – sofortige Antwort, keine Sitzung wird erstellt, kein LLM-Aufruf, gibt `{"ok":true,"status":"live"}` zurück
- **NICHT VERWENDEN:** `/v1/chat/completions` für Zustandsprüfungen – jede Anfrage erstellt eine vollständige Agentensitzung mit Skills-Momentaufnahme, Kontextzusammenstellung und LLM-Aufrufen

Wenn weder der Header `x-openclaw-session-key` noch das Feld `user` angegeben wird, erzeugt `/v1/chat/completions` für jede Anfrage eine neue zufällige Sitzung. Überwachungsdienste, die alle 15 Minuten eine Anfrage senden, erstellen ~96 Sitzungen/Tag, von denen jede 4-22KB belegt. Mit der Zeit führt dies zu einem aufgeblähten Sitzungsspeicher und kann einen Überlauf des Kontextfensters verursachen.

### Beispiele zur Einrichtung von Überwachungsdiensten

- **BetterStack:** Legen Sie die URL der Zustandsprüfung auf `https://<your-gateway-host>:<port>/health` fest
- **UptimeRobot:** Fügen Sie einen neuen HTTP-Monitor mit der URL `https://<your-gateway-host>:<port>/health` hinzu
- **Allgemein:** Jede HTTP-GET-Anfrage an `/health` gibt bei fehlerfreiem Gateway den Status 200 mit `{"ok":true}` zurück

## Wenn etwas fehlschlägt

- `logged out` oder Status 409-515 → Verknüpfen Sie mit `openclaw channels logout` und anschließend `openclaw channels login` erneut.
- Gateway nicht erreichbar → Starten Sie es: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → Vergewissern Sie sich, dass das verknüpfte Telefon online und der Absender zugelassen ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Zulassungsliste und Erwähnungsregeln übereinstimmen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedizierter Befehl „health“

`openclaw health` fordert vom laufenden Gateway dessen Zustandsmomentaufnahme an (keine direkten
Kanalsockets von der CLI). Standardmäßig gibt der Befehl eine aktuelle zwischengespeicherte Gateway-Momentaufnahme zurück, und das
Gateway aktualisiert diesen Cache im Hintergrund; `--verbose` erzwingt stattdessen eine Live-Prüfung.
Der Befehl meldet, sofern verfügbar, verknüpfte Anmeldedaten/das Alter der Authentifizierung, Prüfungszusammenfassungen je Kanal,
eine Zusammenfassung des Sitzungsspeichers und die Prüfungsdauer. Er wird mit einem Exitcode ungleich null beendet, wenn das Gateway
nicht erreichbar ist oder die Prüfung fehlschlägt/eine Zeitüberschreitung auftritt.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: überschreibt die standardmäßige Prüfungszeitüberschreitung von 10s
- `--verbose`: erzwingt eine Live-Prüfung und gibt Details zur Gateway-Verbindung aus
- `--debug`: Alias für `--verbose`

Die Zustandsmomentaufnahme umfasst: `ok` (boolescher Wert), `ts` (Zeitstempel), `durationMs` (Prüfungsdauer), den Status je Kanal, die Verfügbarkeit des Agenten und eine Zusammenfassung des Sitzungsspeichers.

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
