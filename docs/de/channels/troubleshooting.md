---
read_when:
    - Channel-Transport meldet verbunden, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen vor ausführlicher Provider-Dokumentation
summary: Schnelle Fehlersuche auf Kanalebene mit kanalspezifischen Fehlersignaturen und Korrekturen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-06-27T17:13:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Kanal verbunden ist, das Verhalten aber falsch ist.

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
- Die Kanalprüfung zeigt, dass der Transport verbunden ist und, sofern unterstützt, `works` oder `audit ok`

## Nach einem Update

Verwenden Sie dies, wenn Telegram, iMessage, Konfigurationen aus der BlueBubbles-Ära oder ein anderer Plugin-Kanal nach dem Update verschwindet.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Suchen Sie nach `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` in `openclaw status --all`. Das bedeutet, dass der Kanal konfiguriert ist, aber der Einrichtungs-/Ladepfad des Plugins auf einen beschädigten Abhängigkeitsbaum gestoßen ist, statt den Kanal zu registrieren. `openclaw doctor --fix` entfernt veraltete Plugin-Abhängigkeits-Staging-Verzeichnisse und veraltete Authentifizierungsschatten; anschließend lädt `openclaw gateway restart` den bereinigten Zustand neu.

## WhatsApp

### WhatsApp-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                                  | Behebung                                                                                                                                |
| -------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Verbunden, aber keine DM-Antworten           | `openclaw pairing list whatsapp`                    | Genehmigen Sie den Absender oder ändern Sie die DM-Richtlinie/Zulassungsliste.                                                          |
| Gruppennachrichten werden ignoriert          | `requireMention` + Erwähnungsmuster in der Konfiguration prüfen | Erwähnen Sie den Bot oder lockern Sie die Erwähnungsrichtlinie für diese Gruppe.                                                         |
| QR-Anmeldung läuft mit 408 ab                | Gateway-Umgebung `HTTPS_PROXY` / `HTTP_PROXY` prüfen | Legen Sie einen erreichbaren Proxy fest; verwenden Sie `NO_PROXY` nur für Umgehungen.                                                    |
| Zufällige Trennungs-/Neuanmeldeschleifen     | `openclaw channels status --probe` + Logs           | Kürzliche Neuverbindungen werden markiert, auch wenn aktuell eine Verbindung besteht; beobachten Sie die Logs, starten Sie das Gateway neu und verknüpfen Sie erneut, wenn das Flattern anhält. |
| `status=408 Request Time-out`-Schleife       | Prüfung, Logs, Doctor, dann Gateway-Status          | Beheben Sie zuerst Host-Konnektivität/Timing; sichern Sie die Authentifizierung und verknüpfen Sie das Konto erneut, wenn die Schleife bestehen bleibt. |
| Antworten kommen Sekunden/Minuten verspätet an | `openclaw doctor --fix`                             | Doctor stoppt verifizierte veraltete lokale TUI-Clients, wenn sie die Gateway-Ereignisschleife beeinträchtigen.                         |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                               | Behebung                                                                                                                    |
| -------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortfluss   | `openclaw pairing list telegram`                | Genehmigen Sie die Kopplung oder ändern Sie die DM-Richtlinie.                                                              |
| Bot online, aber Gruppe bleibt stumm         | Erwähnungsanforderung und Bot-Privatsphärenmodus prüfen | Deaktivieren Sie den Privatsphärenmodus für Gruppensichtbarkeit oder erwähnen Sie den Bot.                                  |
| Sendefehler mit Netzwerkfehlern              | Logs auf Fehler bei Telegram-API-Aufrufen prüfen | Beheben Sie DNS-/IPv6-/Proxy-Routing zu `api.telegram.org`.                                                                 |
| Start meldet `getMe returned 401`            | Konfigurierte Token-Quelle prüfen               | Kopieren oder erzeugen Sie das BotFather-Token erneut und aktualisieren Sie `botToken`, `tokenFile` oder das Standardkonto `TELEGRAM_BOT_TOKEN`. |
| Polling stockt oder verbindet langsam neu    | `openclaw logs --follow` für Polling-Diagnosen  | Aktualisieren Sie; wenn Neustarts Fehlalarme sind, passen Sie `pollingStallThresholdMs` an. Dauerhafte Stockungen deuten weiterhin auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` wird beim Start abgelehnt    | Logs auf `BOT_COMMANDS_TOO_MUCH` prüfen         | Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Telegram-Befehle oder deaktivieren Sie native Menüs.                       |
| Nach Upgrade blockiert Sie die Zulassungsliste | `openclaw security audit` und Konfigurations-Zulassungslisten | Führen Sie `openclaw doctor --fix` aus oder ersetzen Sie `@username` durch numerische Absender-IDs.                         |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                                                                                                           | Behebung                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, aber keine Guild-Antworten       | `openclaw channels status --probe`                                                                                           | Erlauben Sie Guild/Kanal und verifizieren Sie die Message-Content-Intent.                                                                                                                                                                                              |
| Gruppennachrichten werden ignoriert          | Logs auf verworfene Nachrichten durch Erwähnungs-Gating prüfen                                                                | Erwähnen Sie den Bot oder setzen Sie für Guild/Kanal `requireMention: false`.                                                                                                                                                                                          |
| Tipp-/Token-Nutzung, aber keine Discord-Nachricht | Prüfen Sie, ob dies ein Ambient-Room-Ereignis oder ein abonnierter `message_tool`-Raum ist, in dem das Modell `message(action=send)` verpasst hat | Prüfen Sie das ausführliche Gateway-Log auf unterdrückte finale Payload-Metadaten, verifizieren Sie `messages.groupChat.unmentionedInbound`, lesen Sie [Ambient-Room-Ereignisse](/de/channels/ambient-room-events) oder behalten Sie `messages.groupChat.visibleReplies: "automatic"` für normale Gruppenanfragen bei. |
| DM-Antworten fehlen                          | `openclaw pairing list discord`                                                                                              | Genehmigen Sie die DM-Kopplung oder passen Sie die DM-Richtlinie an.                                                                                                                                                                                                   |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                         | Behebung                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket-Modus verbunden, aber keine Antworten | `openclaw channels status --probe`         | Verifizieren Sie App-Token + Bot-Token und erforderliche Scopes; achten Sie bei SecretRef-gestützten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable`. |
| DMs blockiert                                | `openclaw pairing list slack`              | Genehmigen Sie die Kopplung oder lockern Sie die DM-Richtlinie.                                                                                       |
| Kanalnachricht ignoriert                     | `groupPolicy` und Kanal-Zulassungsliste prüfen | Erlauben Sie den Kanal oder ändern Sie die Richtlinie zu `open`.                                                                                      |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage

### iMessage-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                                      | Behebung                                                                  |
| -------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `imsg` fehlt oder schlägt auf Nicht-macOS fehl | `openclaw channels status --probe --channel imessage`   | Führen Sie OpenClaw auf dem Messages-Mac aus oder verwenden Sie einen SSH-Wrapper für `cliPath`. |
| Senden möglich, aber kein Empfang unter macOS | macOS-Datenschutzberechtigungen für Messages-Automation prüfen | Gewähren Sie TCC-Berechtigungen erneut und starten Sie den Kanalprozess neu. |
| DM-Absender blockiert                        | `openclaw pairing list imessage`                        | Genehmigen Sie die Kopplung oder aktualisieren Sie die Zulassungsliste.    |

Vollständige Fehlerbehebung:

- [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)

## Signal

### Signal-Fehlersignaturen

| Symptom                             | Schnellste Prüfung                          | Behebung                                                      |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Daemon erreichbar, aber Bot stumm   | `openclaw channels status --probe`          | Verifizieren Sie `signal-cli`-Daemon-URL/Konto und Empfangsmodus. |
| DM blockiert                        | `openclaw pairing list signal`              | Genehmigen Sie den Absender oder passen Sie die DM-Richtlinie an. |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Zulassungsliste und Erwähnungsmuster prüfen | Fügen Sie Absender/Gruppe hinzu oder lockern Sie das Gating.  |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-Fehlersignaturen

| Symptom                                | Schnellste Prüfung                              | Behebung                                                             |
| -------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| Bot antwortet „zum Mars verschwunden“  | `appId` und `clientSecret` in der Konfiguration verifizieren | Legen Sie Anmeldedaten fest oder starten Sie das Gateway neu.        |
| Keine eingehenden Nachrichten          | `openclaw channels status --probe`              | Verifizieren Sie die Anmeldedaten auf der QQ Open Platform.          |
| Sprache wird nicht transkribiert       | STT-Provider-Konfiguration prüfen               | Konfigurieren Sie `channels.qqbot.stt` oder `tools.media.audio`.     |
| Proaktive Nachrichten kommen nicht an  | Interaktionsanforderungen der QQ-Plattform prüfen | QQ kann vom Bot initiierte Nachrichten ohne kürzliche Interaktion blockieren. |

Vollständige Fehlerbehebung: [QQ Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                     | Behebung                                                                        |
| -------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| Angemeldet, ignoriert aber Raumnachrichten   | `openclaw channels status --probe`     | Prüfen Sie `groupPolicy`, Raum-Allowlist und Mention-Gating.                    |
| DMs werden nicht verarbeitet                 | `openclaw pairing list matrix`         | Genehmigen Sie den Absender oder passen Sie die DM-Richtlinie an.               |
| Verschlüsselte Räume schlagen fehl           | `openclaw matrix verify status`        | Verifizieren Sie das Gerät erneut, und prüfen Sie dann `openclaw matrix verify backup status`. |
| Backup-Wiederherstellung wartet/ist defekt   | `openclaw matrix verify backup status` | Führen Sie `openclaw matrix verify backup restore` aus oder starten Sie erneut mit einem Wiederherstellungsschlüssel. |
| Cross-Signing/Bootstrap sieht falsch aus     | `openclaw matrix verify bootstrap`     | Reparieren Sie Secret Storage, Cross-Signing und Backup-Status in einem Durchlauf. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandte Themen

- [Pairing](/de/channels/pairing)
- [Channel-Routing](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
