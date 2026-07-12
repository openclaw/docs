---
read_when:
    - Kanaltransport meldet eine bestehende Verbindung, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen, bevor Sie die ausführliche Provider-Dokumentation lesen.
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlermustern und Lösungen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-07-12T01:24:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, sich aber nicht wie erwartet verhält.

## Befehlsabfolge

Führen Sie zunächst diese Befehle der Reihe nach aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Fehlerfreier Ausgangszustand:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` oder `admin-capable`
- Die Kanalprüfung zeigt, dass der Transport verbunden ist und, sofern unterstützt, `works` oder `audit ok`

## Nach einer Aktualisierung

Verwenden Sie diese Schritte, wenn Telegram, iMessage, Konfigurationen aus der BlueBubbles-Ära oder ein anderer Plugin-Kanal nach einer Aktualisierung nicht mehr verfügbar ist.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Suchen Sie in `openclaw status --all` nach `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`. Dies bedeutet, dass der Kanal konfiguriert ist, die Einrichtung oder das Laden des Plugins jedoch aufgrund eines beschädigten Abhängigkeitsbaums fehlgeschlagen ist, statt den Kanal zu registrieren. `openclaw doctor --fix` entfernt veraltete symbolische Abhängigkeitsverknüpfungen der Plugin-Laufzeit und veraltete Authentifizierungsschatten. Anschließend lädt `openclaw gateway restart` einen bereinigten Zustand neu.

## WhatsApp

### WhatsApp-Fehlersymptome

| Symptom                             | Schnellste Prüfung                                    | Behebung                                                                                                                                                       |
| ----------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verbunden, aber keine Antworten auf Direktnachrichten | `openclaw pairing list whatsapp`                    | Genehmigen Sie den Absender oder ändern Sie die Richtlinie beziehungsweise Zulassungsliste für Direktnachrichten.                                             |
| Gruppennachrichten werden ignoriert | Prüfen Sie `requireMention` und Erwähnungsmuster in der Konfiguration | Erwähnen Sie den Bot oder lockern Sie die Erwähnungsrichtlinie für diese Gruppe.                                                                                |
| QR-Anmeldung läuft mit 408 ab       | Prüfen Sie die Gateway-Umgebungsvariablen `HTTPS_PROXY` / `HTTP_PROXY` | Legen Sie einen erreichbaren Proxy fest; verwenden Sie `NO_PROXY` nur für Umgehungen.                                                                           |
| Zufällige Trennungs-/Neuanmeldeschleifen | `openclaw channels status --probe` und Protokolle | Kürzliche Neuverbindungen werden auch bei aktuell bestehender Verbindung gekennzeichnet; beobachten Sie die Protokolle, starten Sie das Gateway neu und verknüpfen Sie das Konto erneut, falls die Verbindung weiterhin instabil ist. |
| Schleife mit `status=408 Request Time-out` | Prüfung, Protokolle, Doctor und anschließend Gateway-Status | Beheben Sie zuerst Verbindungs- oder Zeitsteuerungsprobleme des Hosts; sichern Sie die Authentifizierungsdaten und verknüpfen Sie das Konto erneut, falls die Schleife bestehen bleibt. |
| Antworten treffen Sekunden oder Minuten verspätet ein | `openclaw doctor --fix` | Doctor beendet nachweislich veraltete lokale TUI-Clients, wenn diese die Gateway-Ereignisschleife beeinträchtigen.                                               |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersymptome

| Symptom                              | Schnellste Prüfung                                    | Behebung                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortablauf | `openclaw pairing list telegram`                | Genehmigen Sie die Kopplung oder ändern Sie die Richtlinie für Direktnachrichten.                                                      |
| Bot ist online, aber die Gruppe bleibt stumm | Prüfen Sie die Anforderung einer Erwähnung und den Datenschutzmodus des Bots | Deaktivieren Sie den Datenschutzmodus, damit Gruppennachrichten sichtbar sind, oder erwähnen Sie den Bot.                              |
| Sendefehler mit Netzwerkfehlern      | Prüfen Sie die Protokolle auf fehlgeschlagene Telegram-API-Aufrufe | Korrigieren Sie die DNS-/IPv6-/Proxy-Weiterleitung zu `api.telegram.org`.                                                             |
| Beim Start wird `getMe returned 401` gemeldet | Prüfen Sie die konfigurierte Token-Quelle     | Kopieren oder erzeugen Sie das BotFather-Token erneut und aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` des Standardkontos. |
| Polling bleibt hängen oder stellt die Verbindung nur langsam wieder her | Prüfen Sie `openclaw logs --follow` auf Polling-Diagnosen | Aktualisieren Sie OpenClaw; falls Neustarts fälschlich erkannt werden, passen Sie `pollingStallThresholdMs` an. Anhaltende Aussetzer weisen weiterhin auf Proxy-, DNS- oder IPv6-Probleme hin. |
| `setMyCommands` wird beim Start abgelehnt | Prüfen Sie die Protokolle auf `BOT_COMMANDS_TOO_MUCH` | Reduzieren Sie Plugin-, Skill- oder benutzerdefinierte Telegram-Befehle oder deaktivieren Sie native Menüs.                            |
| Nach der Aktualisierung werden Sie von der Zulassungsliste blockiert | `openclaw security audit` und Zulassungslisten der Konfiguration | Führen Sie `openclaw doctor --fix` aus oder ersetzen Sie `@username` durch numerische Absender-IDs.                                    |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersymptome

| Symptom                                   | Schnellste Prüfung                                                                                                                | Behebung                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot ist online, antwortet aber nicht in der Community | `openclaw channels status --probe`                                                                                  | Lassen Sie die Community beziehungsweise den Kanal zu und prüfen Sie den Intent für Nachrichteninhalte.                                                                                                                                                                    |
| Gruppennachrichten werden ignoriert       | Prüfen Sie die Protokolle auf aufgrund der Erwähnungsbeschränkung verworfene Nachrichten                                          | Erwähnen Sie den Bot oder setzen Sie für die Community beziehungsweise den Kanal `requireMention: false`.                                                                                                                                                                   |
| Eingabe-/Token-Nutzung, aber keine Discord-Nachricht | Prüfen Sie, ob es sich um ein Ereignis eines Umgebungskanals oder einen ausdrücklich aktivierten `message_tool`-Kanal handelt, in dem das Modell `message(action=send)` ausgelassen hat | Prüfen Sie das ausführliche Gateway-Protokoll auf Metadaten unterdrückter endgültiger Nutzlasten, überprüfen Sie `messages.groupChat.unmentionedInbound`, lesen Sie [Ereignisse in Umgebungskanälen](/de/channels/ambient-room-events) oder behalten Sie für normale Gruppenanfragen `messages.groupChat.visibleReplies: "automatic"` bei. |
| Antworten auf Direktnachrichten fehlen    | `openclaw pairing list discord`                                                                                                   | Genehmigen Sie die Kopplung für Direktnachrichten oder passen Sie die Richtlinie für Direktnachrichten an.                                                                                                                                                                  |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersymptome

| Symptom                                | Schnellste Prüfung                             | Behebung                                                                                                                                                           |
| -------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket-Modus verbunden, aber keine Antworten | `openclaw channels status --probe`       | Prüfen Sie App-Token, Bot-Token und erforderliche Berechtigungsbereiche; achten Sie bei SecretRef-basierten Einrichtungen auf `botTokenStatus` / `appTokenStatus = configured_unavailable`. |
| Direktnachrichten werden blockiert     | `openclaw pairing list slack`                  | Genehmigen Sie die Kopplung oder lockern Sie die Richtlinie für Direktnachrichten.                                                                                 |
| Kanalnachricht wird ignoriert          | Prüfen Sie `groupPolicy` und die Kanal-Zulassungsliste | Lassen Sie den Kanal zu oder ändern Sie die Richtlinie in `open`.                                                                                                  |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage

### iMessage-Fehlersymptome

| Symptom                              | Schnellste Prüfung                                           | Behebung                                                                                     |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `imsg` fehlt oder schlägt außerhalb von macOS fehl | `openclaw channels status --probe --channel imessage` | Führen Sie OpenClaw auf dem Mac mit Messages aus oder verwenden Sie einen SSH-Wrapper für `cliPath`. |
| Senden funktioniert, Empfangen unter macOS jedoch nicht | Prüfen Sie die macOS-Datenschutzberechtigungen für die Messages-Automatisierung | Erteilen Sie die TCC-Berechtigungen erneut und starten Sie den Kanalprozess neu.             |
| Absender einer Direktnachricht wird blockiert | `openclaw pairing list imessage`                | Genehmigen Sie die Kopplung oder aktualisieren Sie die Zulassungsliste.                      |

Vollständige Fehlerbehebung: [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)

## Signal

### Signal-Fehlersymptome

| Symptom                         | Schnellste Prüfung                              | Behebung                                                                       |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Daemon erreichbar, aber Bot stumm | `openclaw channels status --probe`           | Prüfen Sie die Daemon-URL beziehungsweise das Konto von `signal-cli` und den Empfangsmodus. |
| Direktnachricht blockiert       | `openclaw pairing list signal`                  | Genehmigen Sie den Absender oder passen Sie die Richtlinie für Direktnachrichten an. |
| Gruppenantworten werden nicht ausgelöst | Prüfen Sie die Gruppen-Zulassungsliste und Erwähnungsmuster | Fügen Sie den Absender beziehungsweise die Gruppe hinzu oder lockern Sie die Beschränkung. |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ-Bot-Fehlersymptome

| Symptom                         | Schnellste Prüfung                               | Behebung                                                               |
| ------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Bot antwortet mit „zum Mars geflogen“ | Prüfen Sie `appId` und `clientSecret` in der Konfiguration | Legen Sie die Anmeldedaten fest oder starten Sie das Gateway neu.       |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`               | Prüfen Sie die Anmeldedaten auf der QQ Open Platform.                   |
| Sprache wird nicht transkribiert | Prüfen Sie die Konfiguration des STT-Providers  | Konfigurieren Sie `channels.qqbot.stt` oder `tools.media.audio`.        |
| Proaktive Nachrichten kommen nicht an | Prüfen Sie die Interaktionsanforderungen der QQ-Plattform | QQ blockiert möglicherweise vom Bot initiierte Nachrichten, wenn kürzlich keine Interaktion stattgefunden hat. |

Vollständige Fehlerbehebung: [QQ-Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersignaturen

| Symptom                                          | Schnellste Prüfung                       | Behebung                                                                                         |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Angemeldet, aber Raumnachrichten werden ignoriert | `openclaw channels status --probe`        | Prüfen Sie `groupPolicy`, die Raum-Zulassungsliste und die Erwähnungssteuerung.                  |
| Direktnachrichten werden nicht verarbeitet       | `openclaw pairing list matrix`            | Genehmigen Sie den Absender oder passen Sie die Richtlinie für Direktnachrichten an.             |
| Verschlüsselte Räume funktionieren nicht         | `openclaw matrix verify status`           | Verifizieren Sie das Gerät erneut und prüfen Sie dann `openclaw matrix verify backup status`.    |
| Backup-Wiederherstellung steht aus oder ist defekt | `openclaw matrix verify backup status`    | Führen Sie `openclaw matrix verify backup restore` aus oder wiederholen Sie den Vorgang mit einem Wiederherstellungsschlüssel. |
| Cross-Signing/Bootstrap sieht fehlerhaft aus      | `openclaw matrix verify bootstrap`        | Reparieren Sie Secret Storage, Cross-Signing und den Backup-Status in einem Durchlauf.            |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
