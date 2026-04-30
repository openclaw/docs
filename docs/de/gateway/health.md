---
read_when:
    - Diagnose der Kanalkonnektivität oder des Gateway-Zustands
    - CLI-Befehle und Optionen für Health Checks verstehen
summary: Befehle zur Zustandsprüfung und Überwachung des Gateway-Zustands
title: Integritätsprüfungen
x-i18n:
    generated_at: "2026-04-30T06:54:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Kurze Anleitung, um die Kanalkonnektivität zu verifizieren, ohne zu raten.

## Schnellprüfungen

- `openclaw status` — lokale Zusammenfassung: Gateway-Erreichbarkeit/-Modus, Update-Hinweis, Alter der Authentifizierung verknüpfter Kanäle, Sitzungen + letzte Aktivität.
- `openclaw status --all` — vollständige lokale Diagnose (schreibgeschützt, farbig, sicher zum Einfügen beim Debugging).
- `openclaw status --deep` — fragt das laufende Gateway nach einer Live-Integritätsprüfung (`health` mit `probe:true`), einschließlich kanalbezogener Prüfungen pro Konto, wenn unterstützt.
- `openclaw health` — fragt das laufende Gateway nach seinem Integritäts-Snapshot (nur WS; keine direkten Kanal-Sockets von der CLI).
- `openclaw health --verbose` — erzwingt eine Live-Integritätsprüfung und gibt Gateway-Verbindungsdetails aus.
- `openclaw health --json` — maschinenlesbare Ausgabe des Integritäts-Snapshots.
- Senden Sie `/status` als eigenständige Nachricht in WhatsApp/WebChat, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Protokolle: `tail` für `/tmp/openclaw/openclaw-*.log` ausführen und nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` filtern.

## Tiefendiagnose

- Anmeldedaten auf dem Datenträger: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (Pfad kann in der Konfiguration überschrieben werden). Anzahl und aktuelle Empfänger werden über `status` angezeigt.
- Neu verknüpfen: `openclaw channels logout && openclaw channels login --verbose`, wenn Statuscodes 409-515 oder `loggedOut` in Protokollen erscheinen. (Hinweis: Der QR-Anmeldefluss startet nach der Kopplung bei Status 515 einmal automatisch neu.)
- Diagnosen sind standardmäßig aktiviert. Das Gateway zeichnet operative Fakten auf, sofern nicht `diagnostics.enabled: false` gesetzt ist. Speicherereignisse zeichnen RSS-/Heap-Byte-Zahlen, Schwellenwertdruck und Wachstumsdruck auf. Liveness-Warnungen zeichnen Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und die Anzahl aktiver/wartender/eingereihter Sitzungen auf, wenn der Prozess läuft, aber ausgelastet ist. Ereignisse zu übergroßen Payloads zeichnen auf, was abgelehnt, gekürzt oder in Chunks aufgeteilt wurde, sowie Größen und Grenzwerte, wenn verfügbar. Sie zeichnen nicht den Nachrichtentext, Anhangsinhalte, Webhook-Body, rohen Request- oder Response-Body, Tokens, Cookies oder geheime Werte auf. Derselbe Heartbeat startet den begrenzten Stabilitätsrekorder, der über `openclaw gateway stability` oder den Gateway-RPC `diagnostics.stability` verfügbar ist. Schwerwiegende Gateway-Beendigungen, Shutdown-Timeouts und Neustart-Startfehler speichern den neuesten Rekorder-Snapshot unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind; prüfen Sie das neueste gespeicherte Bundle mit `openclaw gateway stability --bundle latest`.
- Führen Sie für Fehlerberichte `openclaw gateway diagnostics export` aus und hängen Sie die erzeugte ZIP-Datei an. Der Export kombiniert eine Markdown-Zusammenfassung, das neueste Stabilitäts-Bundle, bereinigte Protokollmetadaten, bereinigte Gateway-Status-/Integritäts-Snapshots und die Konfigurationsstruktur. Er ist zum Teilen gedacht: Chattext, Webhook-Bodys, Tool-Ausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen und geheime Werte werden ausgelassen oder redigiert. Siehe [Diagnoseexport](/de/gateway/diagnostics).

## Konfiguration des Integritätsmonitors

- `gateway.channelHealthCheckMinutes`: wie oft das Gateway die Kanalintegrität prüft. Standard: `5`. Setzen Sie `0`, um Neustarts des Integritätsmonitors global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: wie lange ein verbundener Kanal inaktiv bleiben darf, bevor der Integritätsmonitor ihn als veraltet behandelt und neu startet. Standard: `30`. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: rollierende Obergrenze pro Stunde für Neustarts des Integritätsmonitors pro Kanal/Konto. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Neustarts des Integritätsmonitors für einen bestimmten Kanal deaktivieren, während die globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Mehrkonto-Überschreibung, die Vorrang vor der Einstellung auf Kanalebene hat.
- Diese kanalspezifischen Überschreibungen gelten für die integrierten Kanalmonitore, die sie heute bereitstellen: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Wenn etwas fehlschlägt

- `logged out` oder Status 409-515 → mit `openclaw channels logout` und anschließend `openclaw channels login` neu verknüpfen.
- Gateway nicht erreichbar → starten Sie es: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → bestätigen Sie, dass das verknüpfte Telefon online ist und der Absender erlaubt ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Allowlist- und Erwähnungsregeln passen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Spezieller Befehl „health“

`openclaw health` fragt das laufende Gateway nach seinem Integritäts-Snapshot (keine direkten Kanal-
Sockets von der CLI). Standardmäßig kann er einen frischen zwischengespeicherten Gateway-Snapshot zurückgeben; das
Gateway aktualisiert diesen Cache dann im Hintergrund. `openclaw health --verbose` erzwingt
stattdessen eine Live-Prüfung. Der Befehl meldet verknüpfte Anmeldedaten/das Authentifizierungsalter, wenn verfügbar,
Prüfzusammenfassungen pro Kanal, eine Sitzungsspeicher-Zusammenfassung und eine Prüfdauer. Er beendet
mit einem von null verschiedenen Code, wenn das Gateway nicht erreichbar ist oder die Prüfung fehlschlägt/einen Timeout hat.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: Standard-Timeout von 10 s für die Prüfung überschreiben
- `--verbose`: eine Live-Prüfung erzwingen und Gateway-Verbindungsdetails ausgeben
- `--debug`: Alias für `--verbose`

Der Integritäts-Snapshot enthält: `ok` (boolesch), `ts` (Zeitstempel), `durationMs` (Prüfzeit), Status pro Kanal, Agentenverfügbarkeit und Sitzungsspeicher-Zusammenfassung.

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
