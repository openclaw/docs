---
read_when:
    - Der Channel-Transport zeigt „verbunden“ an, aber Antworten schlagen fehl
    - Sie benötigen channel-spezifische Prüfungen, bevor Sie in tiefere Provider-Dokumentation einsteigen
summary: Schnelle Fehlerbehebung auf Channel-Ebene mit channel-spezifischen Fehlersignaturen und Lösungen
title: Fehlerbehebung für Channels
x-i18n:
    generated_at: "2026-04-22T04:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung für Channels

Verwenden Sie diese Seite, wenn ein Channel verbunden ist, aber das Verhalten fehlerhaft ist.

## Befehlsleiter

Führen Sie diese Befehle zuerst in dieser Reihenfolge aus:

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
- Die Channel-Prüfung zeigt, dass der Transport verbunden ist und, wo unterstützt, `works` oder `audit ok`

## WhatsApp

### Fehlersignaturen für WhatsApp

| Symptom                         | Schnellste Prüfung                                  | Lösung                                                      |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Verbunden, aber keine DM-Antworten | `openclaw pairing list whatsapp`                 | Absender genehmigen oder DM-Richtlinie/Allowlist ändern.    |
| Gruppennachrichten werden ignoriert | `requireMention` + Erwähnungsmuster in der Konfiguration prüfen | Bot erwähnen oder Erwähnungsrichtlinie für diese Gruppe lockern. |
| Zufällige Trennungen/Re-Login-Schleifen | `openclaw channels status --probe` + Logs    | Erneut einloggen und prüfen, ob das Anmeldedatenverzeichnis intakt ist. |

Vollständige Fehlerbehebung: [WhatsApp troubleshooting](/de/channels/whatsapp#troubleshooting)

## Telegram

### Fehlersignaturen für Telegram

| Symptom                             | Schnellste Prüfung                               | Lösung                                                                                                                        |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`           | Pairing genehmigen oder DM-Richtlinie ändern.                                                                                  |
| Bot online, aber Gruppe bleibt still | Erwähnungspflicht und Datenschutzmodus des Bots prüfen | Datenschutzmodus für Gruppensichtbarkeit deaktivieren oder Bot erwähnen.                                                       |
| Sendefehler mit Netzwerkfehlern     | Logs auf Fehler bei Telegram-API-Aufrufen prüfen | DNS-/IPv6-/Proxy-Routing zu `api.telegram.org` korrigieren.                                                                    |
| Polling hängt oder verbindet sich langsam neu | `openclaw logs --follow` für Polling-Diagnosen | Upgrade durchführen; wenn Neustarts False Positives sind, `pollingStallThresholdMs` anpassen. Anhaltende Hänger deuten weiterhin auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` wird beim Start abgelehnt | Logs auf `BOT_COMMANDS_TOO_MUCH` prüfen     | Plugin-/Skills-/benutzerdefinierte Telegram-Befehle reduzieren oder native Menüs deaktivieren.                                |
| Upgrade durchgeführt und Allowlist blockiert Sie | `openclaw security audit` und Konfigurations-Allowlists | `openclaw doctor --fix` ausführen oder `@username` durch numerische Absender-IDs ersetzen.                                    |

Vollständige Fehlerbehebung: [Telegram troubleshooting](/de/channels/telegram#troubleshooting)

## Discord

### Fehlersignaturen für Discord

| Symptom                         | Schnellste Prüfung                      | Lösung                                                         |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| Bot online, aber keine Guild-Antworten | `openclaw channels status --probe` | Guild/Channel erlauben und Intent für Nachrichteninhalt prüfen. |
| Gruppennachrichten werden ignoriert | Logs auf durch Erwähnungsgating verworfene Nachrichten prüfen | Bot erwähnen oder `requireMention: false` für Guild/Channel setzen. |
| DM-Antworten fehlen             | `openclaw pairing list discord`         | DM-Pairing genehmigen oder DM-Richtlinie anpassen.              |

Vollständige Fehlerbehebung: [Discord troubleshooting](/de/channels/discord#troubleshooting)

## Slack

### Fehlersignaturen für Slack

| Symptom                                | Schnellste Prüfung                      | Lösung                                                                                                                                                  |
| -------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode verbunden, aber keine Antworten | `openclaw channels status --probe`  | App-Token + Bot-Token und erforderliche Scopes prüfen; bei SecretRef-basierten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| DMs blockiert                          | `openclaw pairing list slack`           | Pairing genehmigen oder DM-Richtlinie lockern.                                                                                                          |
| Channel-Nachricht wird ignoriert       | `groupPolicy` und Channel-Allowlist prüfen | Channel erlauben oder Richtlinie auf `open` setzen.                                                                                                   |

Vollständige Fehlerbehebung: [Slack troubleshooting](/de/channels/slack#troubleshooting)

## iMessage und BlueBubbles

### Fehlersignaturen für iMessage und BlueBubbles

| Symptom                          | Schnellste Prüfung                                                        | Lösung                                                  |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| Keine eingehenden Ereignisse     | Erreichbarkeit von Webhook/Server und App-Berechtigungen prüfen           | Webhook-URL oder Zustand des BlueBubbles-Servers korrigieren. |
| Senden funktioniert, aber kein Empfang auf macOS | macOS-Datenschutzberechtigungen für Messages-Automatisierung prüfen | TCC-Berechtigungen erneut gewähren und den Channel-Prozess neu starten. |
| DM-Absender blockiert            | `openclaw pairing list imessage` oder `openclaw pairing list bluebubbles` | Pairing genehmigen oder Allowlist aktualisieren.        |

Vollständige Fehlerbehebung:

- [iMessage troubleshooting](/de/channels/imessage#troubleshooting)
- [BlueBubbles troubleshooting](/de/channels/bluebubbles#troubleshooting)

## Signal

### Fehlersignaturen für Signal

| Symptom                         | Schnellste Prüfung                     | Lösung                                                        |
| ------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| Daemon erreichbar, aber Bot bleibt still | `openclaw channels status --probe` | URL/Konto des `signal-cli`-Daemons und Empfangsmodus prüfen.   |
| DM blockiert                    | `openclaw pairing list signal`         | Absender genehmigen oder DM-Richtlinie anpassen.               |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Allowlist und Erwähnungsmuster prüfen | Absender/Gruppe hinzufügen oder Gating lockern.                |

Vollständige Fehlerbehebung: [Signal troubleshooting](/de/channels/signal#troubleshooting)

## QQ Bot

### Fehlersignaturen für QQ Bot

| Symptom                         | Schnellste Prüfung                              | Lösung                                                               |
| ------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Bot antwortet „gone to Mars“    | `appId` und `clientSecret` in der Konfiguration prüfen | Anmeldedaten setzen oder das Gateway neu starten.                     |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`              | Anmeldedaten auf der QQ Open Platform prüfen.                         |
| Sprache wird nicht transkribiert | STT-Provider-Konfiguration prüfen               | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.          |
| Proaktive Nachrichten kommen nicht an | Interaktionsanforderungen der QQ-Plattform prüfen | QQ blockiert möglicherweise vom Bot initiierte Nachrichten ohne kürzliche Interaktion. |

Vollständige Fehlerbehebung: [QQ Bot troubleshooting](/de/channels/qqbot#troubleshooting)

## Matrix

### Fehlersignaturen für Matrix

| Symptom                             | Schnellste Prüfung                     | Lösung                                                                      |
| ----------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| Eingeloggt, aber Raumnachrichten werden ignoriert | `openclaw channels status --probe` | `groupPolicy`, Raum-Allowlist und Erwähnungsgating prüfen.                   |
| DMs werden nicht verarbeitet        | `openclaw pairing list matrix`         | Absender genehmigen oder DM-Richtlinie anpassen.                             |
| Verschlüsselte Räume schlagen fehl  | `openclaw matrix verify status`        | Gerät erneut verifizieren, dann `openclaw matrix verify backup status` prüfen. |
| Backup-Wiederherstellung ausstehend/fehlerhaft | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` ausführen oder mit einem Recovery Key erneut ausführen. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap` | Secret Storage, Cross-Signing und Backup-Status in einem Durchgang reparieren. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)
