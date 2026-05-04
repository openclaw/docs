---
read_when:
    - Kanaltransport meldet „verbunden“, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen vor tiefergehender Provider-Dokumentation
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlersignaturen und Korrekturen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-05-04T02:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Channel verbunden ist, sich aber falsch verhält.

## Befehlsabfolge

Führen Sie zuerst diese Befehle der Reihe nach aus:

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
- Channel-Prüfung zeigt, dass der Transport verbunden ist und, sofern unterstützt, `works` oder `audit ok`

## WhatsApp

### WhatsApp-Fehlersignaturen

| Symptom                         | Schnellste Prüfung                                 | Behebung                                                                                                                       |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Verbunden, aber keine DM-Antworten | `openclaw pairing list whatsapp`                   | Absender genehmigen oder DM-Richtlinie/Allowlist ändern.                                                                       |
| Gruppennachrichten werden ignoriert | `requireMention` + Erwähnungsmuster in der Konfiguration prüfen | Bot erwähnen oder Erwähnungsrichtlinie für diese Gruppe lockern.                                                               |
| QR-Anmeldung läuft mit 408 ab   | Gateway-Env `HTTPS_PROXY` / `HTTP_PROXY` prüfen    | Erreichbaren Proxy festlegen; `NO_PROXY` nur für Umgehungen verwenden.                                                         |
| Zufällige Trennungen/erneute Anmeldeschleifen | `openclaw channels status --probe` + Logs          | Kürzliche Neuverbindungen werden auch dann markiert, wenn aktuell verbunden; Logs beobachten, Gateway neu starten, dann erneut verknüpfen, wenn das Flapping anhält. |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersignaturen

| Symptom                              | Schnellste Prüfung                               | Behebung                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`                 | Pairing genehmigen oder DM-Richtlinie ändern.                                                                                   |
| Bot online, aber Gruppe bleibt stumm | Erwähnungspflicht und Datenschutzmodus des Bots prüfen | Datenschutzmodus für Gruppensichtbarkeit deaktivieren oder Bot erwähnen.                                                        |
| Sendefehler mit Netzwerkfehlern      | Logs auf Fehler bei Telegram-API-Aufrufen prüfen | DNS/IPv6/Proxy-Routing zu `api.telegram.org` beheben.                                                                           |
| Start meldet `getMe returned 401`    | Konfigurierte Token-Quelle prüfen                | BotFather-Token erneut kopieren oder neu generieren und `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` des Standardkontos aktualisieren. |
| Polling stockt oder verbindet langsam neu | `openclaw logs --follow` für Polling-Diagnosen   | Upgrade durchführen; wenn Neustarts falsch-positive Meldungen sind, `pollingStallThresholdMs` anpassen. Anhaltende Stockungen deuten weiterhin auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` beim Start abgelehnt | Logs auf `BOT_COMMANDS_TOO_MUCH` prüfen          | Plugin-/Skill-/benutzerdefinierte Telegram-Befehle reduzieren oder native Menüs deaktivieren.                                  |
| Nach Upgrade blockiert Allowlist Sie | `openclaw security audit` und Konfigurations-Allowlists | `openclaw doctor --fix` ausführen oder `@username` durch numerische Absender-IDs ersetzen.                                      |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersignaturen

| Symptom                                   | Schnellste Prüfung                                                     | Behebung                                                                                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, aber keine Guild-Antworten    | `openclaw channels status --probe`                                     | Guild/Channel erlauben und Message-Content-Intent prüfen.                                                                                                             |
| Gruppennachrichten werden ignoriert       | Logs auf Verwerfungen durch Erwähnungs-Gating prüfen                   | Bot erwähnen oder `requireMention: false` für Guild/Channel setzen.                                                                                                    |
| Tippen/Token-Nutzung, aber keine Discord-Nachricht | Sitzungslog zeigt Assistententext mit `didSendViaMessagingTool: false` | Das Modell hat privat geantwortet, statt das Nachrichten-Tool aufzurufen. Verwenden Sie ein Modell mit zuverlässigen Tool-Aufrufen oder setzen Sie `messages.groupChat.visibleReplies: "automatic"` für automatisches Posten. |
| DM-Antworten fehlen                       | `openclaw pairing list discord`                                        | DM-Pairing genehmigen oder DM-Richtlinie anpassen.                                                                                                                    |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersignaturen

| Symptom                                | Schnellste Prüfung                         | Behebung                                                                                                                                              |
| -------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode verbunden, aber keine Antworten | `openclaw channels status --probe`         | App-Token + Bot-Token und erforderliche Scopes prüfen; bei SecretRef-gestützten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| DMs blockiert                          | `openclaw pairing list slack`              | Pairing genehmigen oder DM-Richtlinie lockern.                                                                                                        |
| Channel-Nachricht ignoriert            | `groupPolicy` und Channel-Allowlist prüfen | Channel erlauben oder Richtlinie auf `open` umstellen.                                                                                                |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage und BlueBubbles

### iMessage- und BlueBubbles-Fehlersignaturen

| Symptom                          | Schnellste Prüfung                                                      | Behebung                                              |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Keine eingehenden Events         | Webhook-/Server-Erreichbarkeit und App-Berechtigungen prüfen             | Webhook-URL oder BlueBubbles-Serverstatus beheben.    |
| Senden möglich, aber kein Empfang auf macOS | macOS-Datenschutzberechtigungen für Messages-Automatisierung prüfen | TCC-Berechtigungen erneut erteilen und Channel-Prozess neu starten. |
| DM-Absender blockiert            | `openclaw pairing list imessage` oder `openclaw pairing list bluebubbles` | Pairing genehmigen oder Allowlist aktualisieren.      |

Vollständige Fehlerbehebung:

- [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)
- [BlueBubbles-Fehlerbehebung](/de/channels/bluebubbles#troubleshooting)

## Signal

### Signal-Fehlersignaturen

| Symptom                         | Schnellste Prüfung                         | Behebung                                                 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon erreichbar, aber Bot stumm | `openclaw channels status --probe`         | `signal-cli`-Daemon-URL/Konto und Empfangsmodus prüfen.  |
| DM blockiert                    | `openclaw pairing list signal`             | Absender genehmigen oder DM-Richtlinie anpassen.         |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Allowlist und Erwähnungsmuster prüfen | Absender/Gruppe hinzufügen oder Gating lockern.          |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-Fehlersignaturen

| Symptom                         | Schnellste Prüfung                            | Behebung                                                           |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Bot antwortet „gone to Mars“    | `appId` und `clientSecret` in der Konfiguration prüfen | Zugangsdaten festlegen oder Gateway neu starten.                   |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`            | Zugangsdaten auf der QQ Open Platform prüfen.                      |
| Sprache wird nicht transkribiert | STT-Provider-Konfiguration prüfen             | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.       |
| Proaktive Nachrichten kommen nicht an | Interaktionsanforderungen der QQ-Plattform prüfen | QQ kann vom Bot initiierte Nachrichten ohne kürzliche Interaktion blockieren. |

Vollständige Fehlerbehebung: [QQ Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersignaturen

| Symptom                             | Schnellste Prüfung                         | Behebung                                                                  |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| Angemeldet, aber Raumnachrichten werden ignoriert | `openclaw channels status --probe`     | `groupPolicy`, Raum-Allowlist und Erwähnungs-Gating prüfen.               |
| DMs werden nicht verarbeitet        | `openclaw pairing list matrix`             | Absender genehmigen oder DM-Richtlinie anpassen.                          |
| Verschlüsselte Räume schlagen fehl  | `openclaw matrix verify status`            | Gerät erneut verifizieren, dann `openclaw matrix verify backup status` prüfen. |
| Backup-Wiederherstellung steht aus/ist defekt | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` ausführen oder mit einem Wiederherstellungsschlüssel erneut ausführen. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap`         | Geheimnisspeicher, Cross-Signing und Backup-Status in einem Durchlauf reparieren. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandt

- [Pairing](/de/channels/pairing)
- [Channel-Routing](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
