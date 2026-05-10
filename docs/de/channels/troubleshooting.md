---
read_when:
    - Channel-Transport meldet „verbunden“, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen, bevor Sie tiefergehende Provider-Dokumentation lesen.
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlersignaturen und Korrekturen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-05-10T19:24:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, das Verhalten aber falsch ist.

## Befehlskette

Führen Sie diese zuerst der Reihe nach aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Fehlerfreie Ausgangsbasis:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` oder `admin-capable`
- Die Kanalprüfung zeigt, dass der Transport verbunden ist und, sofern unterstützt, `works` oder `audit ok`

## WhatsApp

### WhatsApp-Fehlersignaturen

| Symptom                             | Schnellste Prüfung                                  | Behebung                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Verbunden, aber keine DM-Antworten  | `openclaw pairing list whatsapp`                    | Genehmigen Sie den Absender oder ändern Sie die DM-Richtlinie/Allowlist.                                                                         |
| Gruppennachrichten werden ignoriert | Prüfen Sie `requireMention` + Erwähnungsmuster in der Konfiguration | Erwähnen Sie den Bot oder lockern Sie die Erwähnungsrichtlinie für diese Gruppe.                                                                 |
| QR-Anmeldung läuft mit 408 ab       | Prüfen Sie die Gateway-Umgebung `HTTPS_PROXY` / `HTTP_PROXY` | Legen Sie einen erreichbaren Proxy fest; verwenden Sie `NO_PROXY` nur für Umgehungen.                                                            |
| Zufällige Trennungs-/Neuanmeldeschleifen | `openclaw channels status --probe` + Logs           | Kürzliche Wiederverbindungen werden auch dann markiert, wenn aktuell eine Verbindung besteht; beobachten Sie die Logs, starten Sie den Gateway neu und verknüpfen Sie erneut, wenn das Flapping anhält. |
| Antworten kommen Sekunden/Minuten verspätet an | `openclaw doctor --fix`                             | Doctor stoppt verifiziert veraltete lokale TUI-Clients, wenn sie die Gateway-Ereignisschleife beeinträchtigen.                                  |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersignaturen

| Symptom                              | Schnellste Prüfung                                 | Behebung                                                                                                                                   |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`                   | Genehmigen Sie das Pairing oder ändern Sie die DM-Richtlinie.                                                                               |
| Bot online, aber Gruppe bleibt still | Prüfen Sie die Erwähnungsanforderung und den Datenschutzmodus des Bots | Deaktivieren Sie den Datenschutzmodus für Gruppensichtbarkeit oder erwähnen Sie den Bot.                                                     |
| Sendefehler mit Netzwerkfehlern      | Prüfen Sie Logs auf Fehler bei Telegram-API-Aufrufen | Beheben Sie DNS-/IPv6-/Proxy-Routing zu `api.telegram.org`.                                                                                |
| Start meldet `getMe returned 401`    | Prüfen Sie die konfigurierte Token-Quelle           | Kopieren oder erzeugen Sie das BotFather-Token erneut und aktualisieren Sie `botToken`, `tokenFile` oder das Standardkonto `TELEGRAM_BOT_TOKEN`. |
| Polling bleibt hängen oder verbindet sich langsam neu | `openclaw logs --follow` für Polling-Diagnosen      | Aktualisieren Sie; wenn Neustarts False Positives sind, passen Sie `pollingStallThresholdMs` an. Dauerhafte Hänger deuten weiterhin auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` wird beim Start abgelehnt | Prüfen Sie Logs auf `BOT_COMMANDS_TOO_MUCH`         | Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Telegram-Befehle oder deaktivieren Sie native Menüs.                                      |
| Nach Upgrade blockiert Sie die Allowlist | `openclaw security audit` und Konfigurations-Allowlists | Führen Sie `openclaw doctor --fix` aus oder ersetzen Sie `@username` durch numerische Absender-IDs.                                         |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersignaturen

| Symptom                                   | Schnellste Prüfung                                                      | Behebung                                                                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, aber keine Guild-Antworten    | `openclaw channels status --probe`                                      | Erlauben Sie Guild/Kanal und prüfen Sie den Message-Content-Intent.                                                                                                           |
| Gruppennachrichten werden ignoriert       | Prüfen Sie Logs auf verworfene Nachrichten durch Erwähnungs-Gating       | Erwähnen Sie den Bot oder setzen Sie `requireMention: false` für Guild/Kanal.                                                                                                 |
| Tipp-/Token-Nutzung, aber keine Discord-Nachricht | Sitzungslog zeigt Assistententext mit `didSendViaMessagingTool: false` | Das Modell hat privat geantwortet, statt das Nachrichtentool aufzurufen. Verwenden Sie ein Modell mit zuverlässigen Tool-Aufrufen oder setzen Sie `messages.groupChat.visibleReplies: "automatic"` für automatisches Posten. |
| DM-Antworten fehlen                       | `openclaw pairing list discord`                                         | Genehmigen Sie das DM-Pairing oder passen Sie die DM-Richtlinie an.                                                                                                           |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersignaturen

| Symptom                                | Schnellste Prüfung                          | Behebung                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket-Modus verbunden, aber keine Antworten | `openclaw channels status --probe`          | Prüfen Sie App-Token + Bot-Token und erforderliche Scopes; achten Sie bei SecretRef-gestützten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable`. |
| DMs blockiert                          | `openclaw pairing list slack`               | Genehmigen Sie das Pairing oder lockern Sie die DM-Richtlinie.                                                                                              |
| Kanalnachricht wird ignoriert          | Prüfen Sie `groupPolicy` und Kanal-Allowlist | Erlauben Sie den Kanal oder ändern Sie die Richtlinie auf `open`.                                                                                           |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage

### iMessage-Fehlersignaturen

| Symptom                              | Schnellste Prüfung                                      | Behebung                                                                  |
| ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `imsg` fehlt oder schlägt auf Nicht-macOS fehl | `openclaw channels status --probe --channel imessage`   | Führen Sie OpenClaw auf dem Messages-Mac aus oder verwenden Sie einen SSH-Wrapper für `cliPath`. |
| Senden möglich, aber kein Empfang auf macOS | Prüfen Sie macOS-Datenschutzberechtigungen für Messages-Automatisierung | Erteilen Sie TCC-Berechtigungen erneut und starten Sie den Kanalprozess neu. |
| DM-Absender blockiert                | `openclaw pairing list imessage`                        | Genehmigen Sie das Pairing oder aktualisieren Sie die Allowlist.           |

Vollständige Fehlerbehebung:

- [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)

## Signal

### Signal-Fehlersignaturen

| Symptom                         | Schnellste Prüfung                         | Behebung                                                     |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Daemon erreichbar, aber Bot still | `openclaw channels status --probe`         | Prüfen Sie `signal-cli`-Daemon-URL/Konto und Empfangsmodus.  |
| DM blockiert                    | `openclaw pairing list signal`             | Genehmigen Sie den Absender oder passen Sie die DM-Richtlinie an. |
| Gruppenantworten werden nicht ausgelöst | Prüfen Sie Gruppen-Allowlist und Erwähnungsmuster | Fügen Sie Absender/Gruppe hinzu oder lockern Sie das Gating. |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-Fehlersignaturen

| Symptom                         | Schnellste Prüfung                              | Behebung                                                         |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| Bot antwortet „gone to Mars“    | Prüfen Sie `appId` und `clientSecret` in der Konfiguration | Legen Sie Zugangsdaten fest oder starten Sie den Gateway neu.    |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`              | Prüfen Sie die Zugangsdaten auf der QQ Open Platform.            |
| Sprache wird nicht transkribiert | Prüfen Sie die STT-Provider-Konfiguration        | Konfigurieren Sie `channels.qqbot.stt` oder `tools.media.audio`. |
| Proaktive Nachrichten kommen nicht an | Prüfen Sie die Interaktionsanforderungen der QQ-Plattform | QQ kann vom Bot initiierte Nachrichten ohne kürzliche Interaktion blockieren. |

Vollständige Fehlerbehebung: [QQ Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersignaturen

| Symptom                             | Schnellste Prüfung                       | Behebung                                                                     |
| ----------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Angemeldet, aber ignoriert Raumnachrichten | `openclaw channels status --probe`       | Prüfen Sie `groupPolicy`, Raum-Allowlist und Erwähnungs-Gating.               |
| DMs werden nicht verarbeitet        | `openclaw pairing list matrix`           | Genehmigen Sie den Absender oder passen Sie die DM-Richtlinie an.             |
| Verschlüsselte Räume schlagen fehl  | `openclaw matrix verify status`          | Verifizieren Sie das Gerät erneut und prüfen Sie anschließend `openclaw matrix verify backup status`. |
| Backup-Wiederherstellung ist ausstehend/defekt | `openclaw matrix verify backup status`   | Führen Sie `openclaw matrix verify backup restore` aus oder starten Sie erneut mit einem Wiederherstellungsschlüssel. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap`       | Reparieren Sie Secret Storage, Cross-Signing und Backup-Status in einem Durchlauf. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandte Themen

- [Pairing](/de/channels/pairing)
- [Kanalrouting](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
