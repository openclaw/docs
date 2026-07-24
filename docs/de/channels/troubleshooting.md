---
read_when:
    - Der Kanaltransport meldet eine bestehende Verbindung, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen, bevor Sie die ausführliche Provider-Dokumentation lesen.
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlermustern und Lösungen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-07-24T04:54:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3891595e4b5aca9de7997a6e908fa1c9246579032bfdfa1656a6992d644c3ecc
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, sich aber nicht korrekt verhält.

## Befehlsabfolge

Führen Sie zuerst diese Befehle der Reihe nach aus:

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

## Nach einem Update

Verwenden Sie dies, wenn Telegram, iMessage, Konfigurationen aus der BlueBubbles-Ära oder ein anderer Plugin-Kanal
nach einem Update nicht mehr vorhanden ist.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Suchen Sie nach `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` in `openclaw
status --all`. Dies bedeutet, dass der Kanal konfiguriert ist, beim Einrichten/Laden des Plugins jedoch eine beschädigte
Abhängigkeitsstruktur aufgetreten ist, statt den Kanal zu registrieren. `openclaw doctor --fix` entfernt veraltete
Abhängigkeitssymlinks der Plugin-Laufzeit und veraltete Authentifizierungsschatten; anschließend lädt `openclaw gateway restart`
den bereinigten Zustand neu.

## WhatsApp

### WhatsApp-Fehlersymptome

| Symptom                             | Schnellste Prüfung                                       | Behebung                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Verbunden, aber keine Antworten auf Direktnachrichten         | `openclaw pairing list whatsapp`                    | Absender genehmigen oder Richtlinie/Positivliste für Direktnachrichten ändern.                                                                                    |
| Gruppennachrichten werden ignoriert              | `requireMention` und Erwähnungsmuster in der Konfiguration prüfen | Den Bot erwähnen oder die Erwähnungsrichtlinie für diese Gruppe lockern.                                                                          |
| QR-Anmeldung läuft mit 408 ab         | Gateway-Umgebungsvariablen `HTTPS_PROXY` / `HTTP_PROXY` prüfen      | Einen erreichbaren Proxy festlegen; `NO_PROXY` nur zur Umgehung verwenden.                                                                         |
| Zufällige Trennungs-/Neuanmeldeschleifen     | `openclaw channels status --probe` und Protokolle           | Kürzliche Neuverbindungen werden auch bei aktuell bestehender Verbindung gekennzeichnet; Protokolle beobachten, Gateway neu starten und anschließend erneut verknüpfen, falls die Instabilität anhält. |
| `status=408 Request Time-out`-Schleife  | Prüfung, Protokolle, Doctor und anschließend Gateway-Status            | Zuerst Konnektivitäts-/Zeitsteuerungsprobleme des Hosts beheben; Authentifizierungsdaten sichern und das Konto erneut verknüpfen, falls die Schleife fortbesteht.                                   |
| Antworten treffen Sekunden/Minuten verspätet ein | `openclaw doctor --fix`                             | Doctor beendet nachweislich veraltete lokale TUI-Clients, wenn diese die Gateway-Ereignisschleife beeinträchtigen.                                    |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersymptome

| Symptom                              | Schnellste Prüfung                                    | Behebung                                                                                                                    |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortablauf    | `openclaw pairing list telegram`                 | Kopplung genehmigen oder Richtlinie für Direktnachrichten ändern.                                                                                   |
| Bot ist online, aber die Gruppe bleibt stumm    | Erwähnungsanforderung und Datenschutzmodus des Bots überprüfen  | Datenschutzmodus deaktivieren, damit Gruppennachrichten sichtbar sind, oder den Bot erwähnen.                                                              |
| Sendefehler mit Netzwerkfehlern    | Protokolle auf fehlgeschlagene Telegram-API-Aufrufe prüfen      | DNS-/IPv6-/Proxy-Routing zu `api.telegram.org` korrigieren.                                                                      |
| Beim Start wird `getMe returned 401` gemeldet | Konfigurierte Tokenquelle prüfen                    | BotFather-Token erneut kopieren oder generieren und `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` des Standardkontos aktualisieren. |
| Polling stockt oder stellt die Verbindung nur langsam wieder her  | `openclaw logs --follow` für Polling-Diagnosen | Aktualisieren; anhaltende Stockungen weisen üblicherweise auf Proxy-/DNS-/IPv6-Probleme hin.                                                            |
| `setMyCommands` wird beim Start abgelehnt  | Protokolle auf `BOT_COMMANDS_TOO_MUCH` prüfen         | Telegram-Befehle von Plugins, Skills oder benutzerdefinierte Befehle reduzieren oder native Menüs deaktivieren.                                                  |
| Nach dem Upgrade werden Sie von der Positivliste blockiert    | `openclaw security audit` und Positivlisten der Konfiguration  | `openclaw doctor --fix` ausführen oder `@username` durch numerische Absender-IDs ersetzen.                                            |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersymptome

| Symptom                                   | Schnellste Prüfung                                                                                                                | Behebung                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot ist online, antwortet aber nicht in der Guild           | `openclaw channels status --probe`                                                                                           | Guild/Kanal zulassen und Message Content Intent überprüfen.                                                                                                                                                                                                                |
| Gruppennachrichten werden ignoriert                    | Protokolle auf durch Erwähnungssperren verworfene Nachrichten prüfen                                                                                          | Bot erwähnen oder `requireMention: false` für Guild/Kanal festlegen.                                                                                                                                                                                                             |
| Eingabe-/Token-Nutzung, aber keine Discord-Nachricht | Prüfen, ob es sich um ein Ereignis eines Umgebungsraums oder um einen aktivierten `message_tool`-Raum handelt, in dem das Modell `message(action=send)` ausgelassen hat | Ausführliches Gateway-Protokoll auf Metadaten unterdrückter endgültiger Nutzdaten prüfen, `messages.groupChat.unmentionedInbound` überprüfen, [Ereignisse in Umgebungsräumen](/de/channels/ambient-room-events) lesen oder `messages.groupChat.visibleReplies: "automatic"` für normale Gruppenanfragen beibehalten. |
| Antworten auf Direktnachrichten fehlen                        | `openclaw pairing list discord`                                                                                              | Kopplung für Direktnachrichten genehmigen oder Richtlinie für Direktnachrichten anpassen.                                                                                                                                                                                                                               |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersymptome

| Symptom                                | Schnellste Prüfung                             | Behebung                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode ist verbunden, aber keine Antworten | `openclaw channels status --probe`        | App-Token, Bot-Token und erforderliche Berechtigungsbereiche überprüfen; bei SecretRef-basierten Einrichtungen auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| Direktnachrichten werden blockiert                            | `openclaw pairing list slack`             | Kopplung genehmigen oder Richtlinie für Direktnachrichten lockern.                                                                                                                  |
| Kanalnachricht wird ignoriert                | `groupPolicy` und Kanal-Positivliste prüfen | Den Kanal zulassen oder die Richtlinie auf `open` umstellen.                                                                                                        |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage

### iMessage-Fehlersymptome

| Symptom                              | Schnellste Prüfung                                           | Behebung                                                                   |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` fehlt oder schlägt unter anderen Systemen als macOS fehl | `openclaw channels status --probe --channel imessage`   | OpenClaw auf dem Messages-Mac ausführen oder einen SSH-Wrapper für `cliPath` verwenden. |
| Senden möglich, aber kein Empfang unter macOS     | macOS-Datenschutzberechtigungen für die Messages-Automatisierung prüfen | TCC-Berechtigungen erneut erteilen und Kanalprozess neu starten.                 |
| Absender von Direktnachrichten blockiert                    | `openclaw pairing list imessage`                        | Kopplung genehmigen oder Positivliste aktualisieren.                                  |

Vollständige Fehlerbehebung: [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)

## Signal

### Signal-Fehlersymptome

| Symptom                         | Schnellste Prüfung                              | Behebung                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon erreichbar, aber Bot bleibt stumm | `openclaw channels status --probe`         | Daemon-URL/Konto und Empfangsmodus für `signal-cli` überprüfen. |
| Direktnachricht blockiert                      | `openclaw pairing list signal`             | Absender genehmigen oder Richtlinie für Direktnachrichten anpassen.                      |
| Gruppenantworten werden nicht ausgelöst    | Gruppen-Positivliste und Erwähnungsmuster prüfen | Absender/Gruppe hinzufügen oder Zugriffsbeschränkung lockern.                       |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ-Bot-Fehlersymptome

| Symptom                         | Schnellste Prüfung                               | Behebung                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot antwortet „zum Mars geflogen“      | `appId` und `clientSecret` in der Konfiguration überprüfen | Anmeldedaten festlegen oder Gateway neu starten.                         |
| Keine eingehenden Nachrichten             | `openclaw channels status --probe`          | Anmeldedaten auf der QQ Open Platform überprüfen.                     |
| Sprache wird nicht transkribiert           | Konfiguration des STT-Providers prüfen                   | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.          |
| Proaktive Nachrichten treffen nicht ein | Interaktionsanforderungen der QQ-Plattform prüfen  | QQ blockiert möglicherweise vom Bot initiierte Nachrichten, wenn kürzlich keine Interaktion stattgefunden hat. |

Vollständige Fehlerbehebung: [QQ-Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersymptome

| Symptom                             | Schnellste Prüfung                          | Lösung                                                                       |
| ----------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Angemeldet, aber Raumnachrichten werden ignoriert | `openclaw channels status --probe`     | Prüfen Sie `groupPolicy`, die Raum-Zulassungsliste und die Erwähnungsbeschränkung.                  |
| Direktnachrichten werden nicht verarbeitet                  | `openclaw pairing list matrix`         | Genehmigen Sie den Absender oder passen Sie die Richtlinie für Direktnachrichten an.                                       |
| Verschlüsselte Räume funktionieren nicht                | `openclaw matrix verify status`        | Verifizieren Sie das Gerät erneut und prüfen Sie anschließend `openclaw matrix verify backup status`.  |
| Die Wiederherstellung der Sicherung steht aus oder ist fehlerhaft    | `openclaw matrix verify backup status` | Führen Sie `openclaw matrix verify backup restore` aus oder wiederholen Sie den Vorgang mit einem Wiederherstellungsschlüssel. |
| Cross-Signing/Bootstrap scheint fehlerhaft zu sein | `openclaw matrix verify bootstrap`     | Reparieren Sie den geheimen Speicher, das Cross-Signing und den Sicherungsstatus in einem Durchgang.       |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Channel-Routing](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
