---
read_when:
    - Kanaltransport meldet verbunden, aber Antworten schlagen fehl
    - Vor der tiefergehenden Provider-Dokumentation benötigen Sie kanalspezifische Prüfungen.
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlersignaturen und Korrekturen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-05-05T08:25:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, das Verhalten aber falsch ist.

## Befehlsleiter

Führen Sie diese zuerst der Reihe nach aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Gesunde Basis:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` oder `admin-capable`
- Kanalprüfung zeigt, dass der Transport verbunden ist, und, sofern unterstützt, `works` oder `audit ok`

## WhatsApp

### WhatsApp-Fehlersignaturen

| Symptom                             | Schnellste Prüfung                                 | Behebung                                                                                                                                |
| ----------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Verbunden, aber keine DM-Antworten  | `openclaw pairing list whatsapp`                   | Sender genehmigen oder DM-Richtlinie/Allowlist ändern.                                                                                  |
| Gruppennachrichten werden ignoriert | `requireMention` + Erwähnungsmuster in der Konfiguration prüfen | Bot erwähnen oder Erwähnungsrichtlinie für diese Gruppe lockern.                                                                        |
| QR-Anmeldung läuft mit 408 ab       | Gateway-Env `HTTPS_PROXY` / `HTTP_PROXY` prüfen    | Erreichbaren Proxy festlegen; `NO_PROXY` nur für Umgehungen verwenden.                                                                  |
| Zufällige Trenn-/Neuanmeldeschleifen | `openclaw channels status --probe` + Logs          | Kürzliche Neuverbindungen werden markiert, auch wenn aktuell verbunden; Logs beobachten, Gateway neu starten und dann erneut verknüpfen, wenn das Flattern anhält. |
| Antworten treffen Sekunden/Minuten verspätet ein | `openclaw doctor --fix`                            | Doctor stoppt verifiziert veraltete lokale TUI-Clients, wenn sie die Gateway-Ereignisschleife beeinträchtigen.                         |

Ausführliche Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersignaturen

| Symptom                              | Schnellste Prüfung                              | Behebung                                                                                                                         |
| ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`                | Pairing genehmigen oder DM-Richtlinie ändern.                                                                                   |
| Bot online, aber Gruppe bleibt stumm | Erwähnungsanforderung und Bot-Privatsphärenmodus prüfen | Privatsphärenmodus für Gruppensichtbarkeit deaktivieren oder Bot erwähnen.                                                       |
| Sendefehler mit Netzwerkfehlern      | Logs auf Fehler bei Telegram-API-Aufrufen prüfen | DNS-/IPv6-/Proxy-Routing zu `api.telegram.org` korrigieren.                                                                     |
| Start meldet `getMe returned 401`    | Konfigurierte Token-Quelle prüfen               | BotFather-Token erneut kopieren oder neu generieren und `botToken`, `tokenFile` oder das Standardkonto `TELEGRAM_BOT_TOKEN` aktualisieren. |
| Polling bleibt stehen oder verbindet sich langsam neu | `openclaw logs --follow` für Polling-Diagnosen | Aktualisieren; wenn Neustarts falsch positive Ergebnisse sind, `pollingStallThresholdMs` anpassen. Dauerhafte Stillstände deuten weiterhin auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` beim Start abgelehnt | Logs auf `BOT_COMMANDS_TOO_MUCH` prüfen         | Plugin-/Skill-/benutzerdefinierte Telegram-Befehle reduzieren oder native Menüs deaktivieren.                                   |
| Aktualisiert und Allowlist blockiert Sie | `openclaw security audit` und Konfigurations-Allowlists | `openclaw doctor --fix` ausführen oder `@username` durch numerische Sender-IDs ersetzen.                                        |

Ausführliche Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersignaturen

| Symptom                                   | Schnellste Prüfung                                                    | Behebung                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, aber keine Guild-Antworten    | `openclaw channels status --probe`                                    | Guild/Kanal erlauben und Message-Content-Intent prüfen.                                                                                                              |
| Gruppennachrichten werden ignoriert       | Logs auf verworfene Nachrichten durch Erwähnungs-Gating prüfen        | Bot erwähnen oder für Guild/Kanal `requireMention: false` festlegen.                                                                                                 |
| Tippen/Token-Nutzung, aber keine Discord-Nachricht | Sitzungslog zeigt Assistententext mit `didSendViaMessagingTool: false` | Das Modell hat privat geantwortet, statt das Nachrichten-Tool aufzurufen. Verwenden Sie ein Modell, das Tool-Aufrufe zuverlässig ausführt, oder setzen Sie `messages.groupChat.visibleReplies: "automatic"`, um automatisch zu posten. |
| DM-Antworten fehlen                       | `openclaw pairing list discord`                                       | DM-Pairing genehmigen oder DM-Richtlinie anpassen.                                                                                                                   |

Ausführliche Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersignaturen

| Symptom                                | Schnellste Prüfung                         | Behebung                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode verbunden, aber keine Antworten | `openclaw channels status --probe`         | App-Token + Bot-Token und erforderliche Scopes prüfen; bei SecretRef-gestützten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| DMs blockiert                          | `openclaw pairing list slack`              | Pairing genehmigen oder DM-Richtlinie lockern.                                                                                                           |
| Kanalnachricht ignoriert               | `groupPolicy` und Kanal-Allowlist prüfen   | Kanal erlauben oder Richtlinie auf `open` umstellen.                                                                                                     |

Ausführliche Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage und BlueBubbles

### iMessage- und BlueBubbles-Fehlersignaturen

| Symptom                          | Schnellste Prüfung                                                   | Behebung                                                   |
| -------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Keine eingehenden Ereignisse     | Erreichbarkeit von Webhook/Server und App-Berechtigungen prüfen      | Webhook-URL oder BlueBubbles-Serverstatus korrigieren.     |
| Senden möglich, aber kein Empfang unter macOS | macOS-Datenschutzberechtigungen für Messages-Automatisierung prüfen | TCC-Berechtigungen erneut gewähren und Kanalprozess neu starten. |
| DM-Sender blockiert              | `openclaw pairing list imessage` oder `openclaw pairing list bluebubbles` | Pairing genehmigen oder Allowlist aktualisieren.           |

Ausführliche Fehlerbehebung:

- [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)
- [BlueBubbles-Fehlerbehebung](/de/channels/bluebubbles#troubleshooting)

## Signal

### Signal-Fehlersignaturen

| Symptom                         | Schnellste Prüfung                            | Behebung                                                     |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| Daemon erreichbar, aber Bot stumm | `openclaw channels status --probe`            | `signal-cli`-Daemon-URL/Konto und Empfangsmodus prüfen.      |
| DM blockiert                    | `openclaw pairing list signal`                | Sender genehmigen oder DM-Richtlinie anpassen.               |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Allowlist und Erwähnungsmuster prüfen | Sender/Gruppe hinzufügen oder Gating lockern.                |

Ausführliche Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-Fehlersignaturen

| Symptom                         | Schnellste Prüfung                             | Behebung                                                         |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Bot antwortet „zum Mars verschwunden“ | `appId` und `clientSecret` in der Konfiguration prüfen | Anmeldedaten festlegen oder Gateway neu starten.                 |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`             | Anmeldedaten auf der QQ Open Platform prüfen.                    |
| Sprache wird nicht transkribiert | STT-Provider-Konfiguration prüfen              | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.     |
| Proaktive Nachrichten kommen nicht an | Interaktionsanforderungen der QQ-Plattform prüfen | QQ kann vom Bot initiierte Nachrichten ohne kürzliche Interaktion blockieren. |

Ausführliche Fehlerbehebung: [QQ Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersignaturen

| Symptom                             | Schnellste Prüfung                        | Behebung                                                                    |
| ----------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Angemeldet, aber Raumnachrichten werden ignoriert | `openclaw channels status --probe`        | `groupPolicy`, Raum-Allowlist und Erwähnungs-Gating prüfen.                  |
| DMs werden nicht verarbeitet        | `openclaw pairing list matrix`            | Sender genehmigen oder DM-Richtlinie anpassen.                               |
| Verschlüsselte Räume schlagen fehl  | `openclaw matrix verify status`           | Gerät erneut verifizieren, dann `openclaw matrix verify backup status` prüfen. |
| Backup-Wiederherstellung steht aus/ist defekt | `openclaw matrix verify backup status`    | `openclaw matrix verify backup restore` ausführen oder mit einem Wiederherstellungsschlüssel erneut ausführen. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap`        | Secret Storage, Cross-Signing und Backup-Status in einem Durchlauf reparieren. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandt

- [Pairing](/de/channels/pairing)
- [Kanalrouting](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
