---
read_when:
    - Channel-Transport meldet „verbunden“, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen vor ausführlichen Provider-Dokumenten
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlersignaturen und Lösungen
title: Fehlerbehebung bei Kanälen
x-i18n:
    generated_at: "2026-04-30T06:42:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Channel verbunden ist, das Verhalten aber falsch ist.

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
- Channel-Probe zeigt, dass der Transport verbunden ist und, wo unterstützt, `works` oder `audit ok`

## WhatsApp

### WhatsApp-Fehlersignaturen

| Symptom                         | Schnellster Check                                  | Behebung                                                                                                                            |
| ------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Verbunden, aber keine Antworten auf Direktnachrichten | `openclaw pairing list whatsapp`                   | Genehmigen Sie den Absender oder wechseln Sie die DM-Richtlinie/Allowlist.                                                          |
| Gruppennachrichten werden ignoriert | Prüfen Sie `requireMention` + Erwähnungsmuster in der Konfiguration | Erwähnen Sie den Bot oder lockern Sie die Erwähnungsrichtlinie für diese Gruppe.                                                     |
| QR-Anmeldung läuft mit 408 ab   | Prüfen Sie die Gateway-Env `HTTPS_PROXY` / `HTTP_PROXY` | Legen Sie einen erreichbaren Proxy fest; verwenden Sie `NO_PROXY` nur für Umgehungen.                                                |
| Zufällige Trennungen/erneute Anmeldeschleifen | `openclaw channels status --probe` + Logs          | Kürzliche Neuverbindungen werden markiert, auch wenn aktuell verbunden; beobachten Sie die Logs, starten Sie den Gateway neu und verknüpfen Sie danach erneut, wenn das Flapping anhält. |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersignaturen

| Symptom                              | Schnellster Check                               | Behebung                                                                                                                     |
| ------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`                | Genehmigen Sie das Pairing oder ändern Sie die DM-Richtlinie.                                                                |
| Bot ist online, aber Gruppe bleibt stumm | Prüfen Sie Erwähnungsanforderung und Bot-Privatsphärenmodus | Deaktivieren Sie den Privatsphärenmodus für Gruppensichtbarkeit oder erwähnen Sie den Bot.                                   |
| Sendefehler mit Netzwerkfehlern      | Prüfen Sie Logs auf Telegram-API-Aufruffehler    | Beheben Sie DNS-/IPv6-/Proxy-Routing zu `api.telegram.org`.                                                                  |
| Start meldet `getMe returned 401`    | Prüfen Sie die konfigurierte Token-Quelle        | Kopieren oder generieren Sie das BotFather-Token erneut und aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` des Standardkontos. |
| Polling stockt oder verbindet sich langsam neu | `openclaw logs --follow` für Polling-Diagnosen  | Führen Sie ein Upgrade durch; wenn Neustarts Fehlalarme sind, passen Sie `pollingStallThresholdMs` an. Dauerhafte Hänger deuten weiter auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` wird beim Start abgelehnt | Prüfen Sie Logs auf `BOT_COMMANDS_TOO_MUCH`      | Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Telegram-Befehle oder deaktivieren Sie native Menüs.                        |
| Nach Upgrade blockiert Sie die Allowlist | `openclaw security audit` und Konfigurations-Allowlists | Führen Sie `openclaw doctor --fix` aus oder ersetzen Sie `@username` durch numerische Absender-IDs.                          |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersignaturen

| Symptom                         | Schnellster Check                      | Behebung                                                   |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Bot ist online, aber keine Guild-Antworten | `openclaw channels status --probe`     | Erlauben Sie Guild/Channel und prüfen Sie den Message Content Intent. |
| Gruppennachrichten werden ignoriert | Prüfen Sie Logs auf durch Erwähnungs-Gating verworfene Nachrichten | Erwähnen Sie den Bot oder setzen Sie `requireMention: false` für Guild/Channel. |
| Antworten auf Direktnachrichten fehlen | `openclaw pairing list discord`        | Genehmigen Sie DM-Pairing oder passen Sie die DM-Richtlinie an. |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersignaturen

| Symptom                                | Schnellster Check                            | Behebung                                                                                                                                             |
| -------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode verbunden, aber keine Antworten | `openclaw channels status --probe`           | Prüfen Sie App-Token + Bot-Token und erforderliche Scopes; achten Sie auf `botTokenStatus` / `appTokenStatus = configured_unavailable` bei SecretRef-gestützten Setups. |
| Direktnachrichten blockiert            | `openclaw pairing list slack`                | Genehmigen Sie das Pairing oder lockern Sie die DM-Richtlinie.                                                                                       |
| Channel-Nachricht ignoriert            | Prüfen Sie `groupPolicy` und Channel-Allowlist | Erlauben Sie den Channel oder stellen Sie die Richtlinie auf `open` um.                                                                               |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage und BlueBubbles

### iMessage- und BlueBubbles-Fehlersignaturen

| Symptom                          | Schnellster Check                                                          | Behebung                                              |
| -------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| Keine eingehenden Ereignisse     | Prüfen Sie Webhook-/Server-Erreichbarkeit und App-Berechtigungen           | Korrigieren Sie die Webhook-URL oder den BlueBubbles-Serverstatus. |
| Senden möglich, aber kein Empfangen unter macOS | Prüfen Sie macOS-Datenschutzberechtigungen für Messages-Automatisierung | Erteilen Sie TCC-Berechtigungen erneut und starten Sie den Channel-Prozess neu. |
| DM-Absender blockiert            | `openclaw pairing list imessage` oder `openclaw pairing list bluebubbles` | Genehmigen Sie das Pairing oder aktualisieren Sie die Allowlist. |

Vollständige Fehlerbehebung:

- [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)
- [BlueBubbles-Fehlerbehebung](/de/channels/bluebubbles#troubleshooting)

## Signal

### Signal-Fehlersignaturen

| Symptom                         | Schnellster Check                             | Behebung                                                  |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Daemon erreichbar, aber Bot stumm | `openclaw channels status --probe`            | Prüfen Sie `signal-cli`-Daemon-URL/-Konto und Empfangsmodus. |
| DM blockiert                    | `openclaw pairing list signal`                | Genehmigen Sie den Absender oder passen Sie die DM-Richtlinie an. |
| Gruppenantworten werden nicht ausgelöst | Prüfen Sie Gruppen-Allowlist und Erwähnungsmuster | Fügen Sie Absender/Gruppe hinzu oder lockern Sie das Gating. |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-Fehlersignaturen

| Symptom                         | Schnellster Check                              | Behebung                                                        |
| ------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Bot antwortet "zum Mars verschwunden" | Prüfen Sie `appId` und `clientSecret` in der Konfiguration | Legen Sie Anmeldedaten fest oder starten Sie den Gateway neu.    |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`             | Prüfen Sie die Anmeldedaten auf der QQ Open Platform.           |
| Sprache wird nicht transkribiert | Prüfen Sie die STT-Provider-Konfiguration      | Konfigurieren Sie `channels.qqbot.stt` oder `tools.media.audio`. |
| Proaktive Nachrichten kommen nicht an | Prüfen Sie die Interaktionsanforderungen der QQ-Plattform | QQ kann vom Bot initiierte Nachrichten ohne kürzliche Interaktion blockieren. |

Vollständige Fehlerbehebung: [QQ Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersignaturen

| Symptom                             | Schnellster Check                         | Behebung                                                                  |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Angemeldet, ignoriert aber Raumnachrichten | `openclaw channels status --probe`        | Prüfen Sie `groupPolicy`, Raum-Allowlist und Erwähnungs-Gating.           |
| Direktnachrichten werden nicht verarbeitet | `openclaw pairing list matrix`            | Genehmigen Sie den Absender oder passen Sie die DM-Richtlinie an.         |
| Verschlüsselte Räume schlagen fehl | `openclaw matrix verify status`           | Verifizieren Sie das Gerät erneut und prüfen Sie danach `openclaw matrix verify backup status`. |
| Backup-Wiederherstellung ist ausstehend/defekt | `openclaw matrix verify backup status`    | Führen Sie `openclaw matrix verify backup restore` aus oder wiederholen Sie es mit einem Wiederherstellungsschlüssel. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap`        | Reparieren Sie Secret Storage, Cross-Signing und Backup-Status in einem Durchlauf. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandt

- [Pairing](/de/channels/pairing)
- [Channel-Routing](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
