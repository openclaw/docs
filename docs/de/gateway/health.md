---
read_when:
    - Channel-Konnektivität oder Gateway-Zustand diagnostizieren
    - CLI-Befehle und Optionen für Integritätsprüfungen verstehen
summary: Integritätsprüfungsbefehle und Gateway-Zustandsüberwachung
title: Integritätsprüfungen
x-i18n:
    generated_at: "2026-04-23T06:28:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Integritätsprüfungen (CLI)

Kurzanleitung, um die Channel-Konnektivität ohne Rätselraten zu überprüfen.

## Schnelle Prüfungen

- `openclaw status` — lokale Zusammenfassung: Gateway-Erreichbarkeit/-Modus, Update-Hinweis, Alter der verknüpften Channel-Authentifizierung, Sitzungen + aktuelle Aktivität.
- `openclaw status --all` — vollständige lokale Diagnose (schreibgeschützt, farbig, sicher zum Einfügen für Debugging).
- `openclaw status --deep` — fragt das laufende Gateway nach einer Live-Integritätsprüfung (`health` mit `probe:true`), einschließlich Channel-Prüfungen pro Account, wenn unterstützt.
- `openclaw health` — fragt das laufende Gateway nach seinem Integritäts-Snapshot (nur WS; keine direkten Channel-Sockets von der CLI).
- `openclaw health --verbose` — erzwingt eine Live-Integritätsprüfung und gibt Gateway-Verbindungsdetails aus.
- `openclaw health --json` — maschinenlesbare Ausgabe des Integritäts-Snapshots.
- Senden Sie `/status` als eigenständige Nachricht in WhatsApp/WebChat, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Logs: `/tmp/openclaw/openclaw-*.log` mit `tail` verfolgen und nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` filtern.

## Detaillierte Diagnose

- Zugangsdaten auf dem Datenträger: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (Pfad kann in der Konfiguration überschrieben werden). Anzahl und aktuelle Empfänger werden über `status` angezeigt.
- Neuverknüpfungsablauf: `openclaw channels logout && openclaw channels login --verbose`, wenn Statuscodes 409–515 oder `loggedOut` in Logs erscheinen. (Hinweis: Der QR-Login-Ablauf startet bei Status 515 nach dem Pairing einmal automatisch neu.)
- Diagnose ist standardmäßig aktiviert. Das Gateway zeichnet Betriebsfakten auf, sofern nicht `diagnostics.enabled: false` gesetzt ist. Speicherereignisse zeichnen RSS-/Heap-Bytezahlen, Schwellenwertdruck und Wachstumsdruck auf. Ereignisse für übergroße Payloads zeichnen auf, was abgelehnt, gekürzt oder in Blöcke aufgeteilt wurde, plus Größen und Grenzen, wenn verfügbar. Sie zeichnen nicht den Nachrichtentext, Anhangsinhalte, Webhook-Body, rohen Request- oder Response-Body, Tokens, Cookies oder geheime Werte auf. Derselbe Heartbeat startet den begrenzten Stabilitätsrekorder, der über `openclaw gateway stability` oder das Gateway-RPC `diagnostics.stability` verfügbar ist. Fatale Gateway-Beendigungen, Shutdown-Timeouts und Startfehler bei Neustarts speichern den neuesten Rekorder-Snapshot unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind; prüfen Sie das neueste gespeicherte Bundle mit `openclaw gateway stability --bundle latest`.
- Für Fehlerberichte führen Sie `openclaw gateway diagnostics export` aus und hängen die erzeugte Zip-Datei an. Der Export kombiniert eine Markdown-Zusammenfassung, das neueste Stabilitäts-Bundle, bereinigte Log-Metadaten, bereinigte Gateway-Status-/Integritäts-Snapshots und die Konfigurationsform. Er ist zum Teilen gedacht: Chat-Text, Webhook-Bodies, Tool-Ausgaben, Zugangsdaten, Cookies, Account-/Nachrichtenkennungen und geheime Werte werden ausgelassen oder geschwärzt.

## Konfiguration der Integritätsüberwachung

- `gateway.channelHealthCheckMinutes`: wie oft das Gateway die Channel-Integrität prüft. Standard: `5`. Setzen Sie `0`, um durch die Integritätsüberwachung ausgelöste Neustarts global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: wie lange ein verbundener Channel inaktiv bleiben darf, bevor die Integritätsüberwachung ihn als veraltet behandelt und neu startet. Standard: `30`. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: gleitende Obergrenze von Neustarts pro Channel/Account innerhalb einer Stunde, die durch die Integritätsüberwachung ausgelöst werden. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: durch Integritätsüberwachung ausgelöste Neustarts für einen bestimmten Channel deaktivieren, während die globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Multi-Account-Überschreibung, die Vorrang vor der Einstellung auf Channel-Ebene hat.
- Diese Überschreibungen pro Channel gelten für die integrierten Channel-Monitore, die sie derzeit bereitstellen: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Wenn etwas fehlschlägt

- `logged out` oder Status 409–515 → mit `openclaw channels logout` und danach `openclaw channels login` neu verknüpfen.
- Gateway nicht erreichbar → starten: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → prüfen Sie, ob das verknüpfte Telefon online ist und ob der Absender erlaubt ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Allowlist- und Erwähnungsregeln übereinstimmen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Spezieller Befehl „health“

`openclaw health` fragt das laufende Gateway nach seinem Integritäts-Snapshot (keine direkten Channel-
Sockets von der CLI). Standardmäßig kann es einen aktuellen gecachten Gateway-Snapshot zurückgeben; das
Gateway aktualisiert diesen Cache dann im Hintergrund. `openclaw health --verbose` erzwingt stattdessen
eine Live-Prüfung. Der Befehl meldet verknüpfte Zugangsdaten/das Alter der Authentifizierung, wenn verfügbar,
Zusammenfassungen der Channel-Prüfungen, eine Zusammenfassung des Sitzungsspeichers und eine Prüfungsdauer. Er beendet sich
mit einem Fehlercode ungleich null, wenn das Gateway nicht erreichbar ist oder die Prüfung fehlschlägt/ein Timeout auftritt.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: das Standard-Timeout der Prüfung von 10 s überschreiben
- `--verbose`: eine Live-Prüfung erzwingen und Gateway-Verbindungsdetails ausgeben
- `--debug`: Alias für `--verbose`

Der Integritäts-Snapshot enthält: `ok` (boolean), `ts` (Zeitstempel), `durationMs` (Prüfungsdauer), Status pro Channel, Verfügbarkeit des Agenten und eine Zusammenfassung des Sitzungsspeichers.
