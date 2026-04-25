---
read_when:
    - Channel-Konnektivität oder Gateway-Gesundheit diagnostizieren
    - CLI-Befehle und Optionen für Integritätsprüfungen verstehen
summary: Integritätsprüfungsbefehle und Überwachung der Gateway-Gesundheit
title: Integritätsprüfungen
x-i18n:
    generated_at: "2026-04-25T13:46:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Kurze Anleitung, um die Channel-Konnektivität zu prüfen, ohne zu raten.

## Schnelle Prüfungen

- `openclaw status` — lokale Zusammenfassung: Erreichbarkeit/Modus des Gateway, Update-Hinweis, Alter der verknüpften Channel-Authentifizierung, Sessions + letzte Aktivität.
- `openclaw status --all` — vollständige lokale Diagnose (schreibgeschützt, farbig, sicher zum Einfügen für Debugging).
- `openclaw status --deep` — fragt das laufende Gateway nach einer Live-Integritätsprüfung (`health` mit `probe:true`), einschließlich Channel-Prüfungen pro Konto, wenn unterstützt.
- `openclaw health` — fragt das laufende Gateway nach seinem Integritäts-Snapshot (nur WS; keine direkten Channel-Sockets aus der CLI).
- `openclaw health --verbose` — erzwingt eine Live-Integritätsprüfung und gibt Gateway-Verbindungsdetails aus.
- `openclaw health --json` — maschinenlesbare Ausgabe des Integritäts-Snapshots.
- Senden Sie `/status` als eigenständige Nachricht in WhatsApp/WebChat, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Logs: `/tmp/openclaw/openclaw-*.log` per Tail verfolgen und nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` filtern.

## Tiefergehende Diagnose

- Zugangsdaten auf der Festplatte: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime sollte aktuell sein).
- Session-Speicher: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (Pfad kann in der Konfiguration überschrieben werden). Anzahl und letzte Empfänger werden über `status` angezeigt.
- Relink-Ablauf: `openclaw channels logout && openclaw channels login --verbose`, wenn Statuscodes 409–515 oder `loggedOut` in Logs erscheinen. (Hinweis: Der QR-Login-Ablauf startet nach Status 515 nach dem Pairing einmal automatisch neu.)
- Diagnosen sind standardmäßig aktiviert. Das Gateway zeichnet Betriebsfakten auf, sofern nicht `diagnostics.enabled: false` gesetzt ist. Memory-Ereignisse erfassen RSS-/Heap-Byte-Zahlen, Schwellenwertdruck und Wachstumsdruck. Ereignisse zu übergroßen Payloads erfassen, was abgelehnt, gekürzt oder in Blöcke aufgeteilt wurde, sowie Größen und Limits, sofern verfügbar. Sie erfassen weder Nachrichtentext, Anhangsinhalte, Webhook-Body, rohe Request- oder Response-Bodies, Tokens, Cookies noch Secret-Werte. Derselbe Heartbeat startet den begrenzten Stability-Recorder, der über `openclaw gateway stability` oder die Gateway-RPC `diagnostics.stability` verfügbar ist. Fatale Gateway-Beendigungen, Shutdown-Timeouts und Startfehler bei Neustarts speichern den neuesten Snapshot des Recorders unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind; prüfen Sie das neueste gespeicherte Bundle mit `openclaw gateway stability --bundle latest`.
- Für Fehlerberichte führen Sie `openclaw gateway diagnostics export` aus und hängen Sie die erzeugte ZIP-Datei an. Der Export kombiniert eine Markdown-Zusammenfassung, das neueste Stability-Bundle, bereinigte Log-Metadaten, bereinigte Gateway-Status-/Integritäts-Snapshots und die Konfigurationsstruktur. Er ist zum Teilen gedacht: Chat-Text, Webhook-Bodies, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen und Secret-Werte werden ausgelassen oder geschwärzt. Siehe [Diagnostics Export](/de/gateway/diagnostics).

## Konfiguration des Integritätsmonitors

- `gateway.channelHealthCheckMinutes`: Wie oft das Gateway den Zustand der Channels prüft. Standard: `5`. Setzen Sie `0`, um Neustarts durch den Integritätsmonitor global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: Wie lange ein verbundener Channel inaktiv bleiben darf, bevor der Integritätsmonitor ihn als veraltet behandelt und neu startet. Standard: `30`. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: Gleitende Obergrenze pro Stunde für Neustarts durch den Integritätsmonitor pro Channel/Konto. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Neustarts durch den Integritätsmonitor für einen bestimmten Channel deaktivieren, während die globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Überschreibung für mehrere Konten, die Vorrang vor der Einstellung auf Channel-Ebene hat.
- Diese Überschreibungen pro Channel gelten für die integrierten Channel-Monitore, die sie derzeit bereitstellen: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Wenn etwas fehlschlägt

- `logged out` oder Status 409–515 → neu verknüpfen mit `openclaw channels logout`, dann `openclaw channels login`.
- Gateway nicht erreichbar → starten Sie es: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → prüfen Sie, ob das verknüpfte Telefon online ist und der Absender erlaubt ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Allowlist- + Mention-Regeln passen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedizierter Befehl „health“

`openclaw health` fragt das laufende Gateway nach seinem Integritäts-Snapshot (keine direkten Channel-
Sockets aus der CLI). Standardmäßig kann ein frischer gecachter Gateway-Snapshot zurückgegeben werden; das
Gateway aktualisiert diesen Cache dann im Hintergrund. `openclaw health --verbose` erzwingt
stattdessen eine Live-Prüfung. Der Befehl meldet das Alter verknüpfter Zugangsdaten/Auth, wenn verfügbar,
Zusammenfassungen der Prüfungen pro Channel, eine Zusammenfassung des Session-Speichers und die Dauer der Prüfung. Er beendet sich
mit einem Fehlercode ungleich null, wenn das Gateway nicht erreichbar ist oder die Prüfung fehlschlägt/Timeouts auftreten.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: den Standard-Timeout der Prüfung von 10 s überschreiben
- `--verbose`: eine Live-Prüfung erzwingen und Gateway-Verbindungsdetails ausgeben
- `--debug`: Alias für `--verbose`

Der Integritäts-Snapshot enthält: `ok` (boolean), `ts` (Zeitstempel), `durationMs` (Prüfzeit), Status pro Channel, Verfügbarkeit der Agenten und eine Zusammenfassung des Session-Speichers.

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Diagnostics export](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
