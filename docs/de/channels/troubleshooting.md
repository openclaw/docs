---
read_when:
    - Kanaltransport meldet eine bestehende Verbindung, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen, bevor Sie sich mit ausführlicher Provider-Dokumentation befassen.
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlermustern und Lösungen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-07-12T15:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, das Verhalten jedoch fehlerhaft ist.

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

Verwenden Sie dies, wenn Telegram, iMessage, Konfigurationen aus der BlueBubbles-Ära oder ein anderer Plugin-Kanal
nach der Aktualisierung nicht mehr angezeigt werden.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Suchen Sie in `openclaw
status --all` nach `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`. Dies bedeutet, dass der Kanal konfiguriert ist, beim Einrichten/Laden des Plugins jedoch ein beschädigter
Abhängigkeitsbaum aufgetreten ist, anstatt den Kanal zu registrieren. `openclaw doctor --fix` entfernt veraltete
Abhängigkeitssymlinks der Plugin-Laufzeit und veraltete Authentifizierungs-Schatten; anschließend lädt `openclaw gateway restart`
einen bereinigten Zustand neu.

## WhatsApp

### WhatsApp-Fehlersignaturen

| Symptom                             | Schnellste Prüfung                                       | Behebung                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Verbunden, aber keine Antworten auf Direktnachrichten         | `openclaw pairing list whatsapp`                    | Genehmigen Sie den Absender oder ändern Sie die Richtlinie bzw. Zulassungsliste für Direktnachrichten.                                                                                    |
| Gruppennachrichten werden ignoriert              | Prüfen Sie `requireMention` und Erwähnungsmuster in der Konfiguration | Erwähnen Sie den Bot oder lockern Sie die Erwähnungsrichtlinie für diese Gruppe.                                                                          |
| QR-Anmeldung läuft mit 408 ab         | Prüfen Sie die Gateway-Umgebungsvariablen `HTTPS_PROXY` / `HTTP_PROXY`      | Legen Sie einen erreichbaren Proxy fest; verwenden Sie `NO_PROXY` nur für Umgehungen.                                                                         |
| Zufällige Trennungs-/Neuanmeldungsschleifen     | `openclaw channels status --probe` und Protokolle           | Kürzliche Neuverbindungen werden auch bei aktuell bestehender Verbindung gekennzeichnet; beobachten Sie die Protokolle, starten Sie den Gateway neu und verknüpfen Sie das Konto erneut, wenn die instabile Verbindung weiterhin besteht. |
| Schleife mit `status=408 Request Time-out`  | Prüfen, Protokolle, Doctor, dann Gateway-Status            | Beheben Sie zuerst Verbindungs- und Zeitsteuerungsprobleme des Hosts; sichern Sie die Authentifizierungsdaten und verknüpfen Sie das Konto erneut, wenn die Schleife weiterhin besteht.                                   |
| Antworten treffen Sekunden/Minuten verspätet ein | `openclaw doctor --fix`                             | Doctor beendet nachweislich veraltete lokale TUI-Clients, wenn diese die Gateway-Ereignisschleife beeinträchtigen.                                    |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-Fehlersignaturen

| Symptom                              | Schnellste Prüfung                                    | Behebung                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortablauf    | `openclaw pairing list telegram`                 | Genehmigen Sie die Kopplung oder ändern Sie die Richtlinie für Direktnachrichten.                                                                                       |
| Bot ist online, aber die Gruppe bleibt stumm    | Prüfen Sie die Erwähnungsanforderung und den Datenschutzmodus des Bots  | Deaktivieren Sie den Datenschutzmodus für die Sichtbarkeit in Gruppen oder erwähnen Sie den Bot.                                                                  |
| Sendefehler mit Netzwerkfehlern    | Prüfen Sie die Protokolle auf Fehler bei Telegram-API-Aufrufen      | Beheben Sie das DNS-/IPv6-/Proxy-Routing zu `api.telegram.org`.                                                                          |
| Beim Start wird `getMe returned 401` gemeldet | Prüfen Sie die konfigurierte Token-Quelle                    | Kopieren Sie das BotFather-Token erneut oder generieren Sie es neu und aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` des Standardkontos.     |
| Polling bleibt hängen oder stellt die Verbindung langsam wieder her  | `openclaw logs --follow` für Polling-Diagnosen | Führen Sie ein Upgrade durch; wenn Neustarts Fehlalarme sind, passen Sie `pollingStallThresholdMs` an. Anhaltende Blockierungen weisen weiterhin auf Proxy-/DNS-/IPv6-Probleme hin. |
| `setMyCommands` wird beim Start abgelehnt  | Prüfen Sie die Protokolle auf `BOT_COMMANDS_TOO_MUCH`         | Reduzieren Sie Plugin-, Skill- oder benutzerdefinierte Telegram-Befehle oder deaktivieren Sie native Menüs.                                                      |
| Nach dem Upgrade werden Sie durch die Zulassungsliste blockiert    | `openclaw security audit` und Konfigurations-Zulassungslisten  | Führen Sie `openclaw doctor --fix` aus oder ersetzen Sie `@username` durch numerische Absender-IDs.                                                |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Discord-Fehlersignaturen

| Symptom                                   | Schnellste Prüfung                                                                                                                    | Behebung                                                                                                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot ist online, antwortet aber nicht in der Guild | `openclaw channels status --probe`                                                                                                    | Guild/Kanal zulassen und Message Content Intent überprüfen.                                                                                                                                                                                                                                         |
| Gruppennachrichten werden ignoriert       | Protokolle auf durch die Erwähnungsprüfung verworfene Nachrichten prüfen                                                              | Bot erwähnen oder für die Guild/den Kanal `requireMention: false` festlegen.                                                                                                                                                                                                                         |
| Eingabe-/Token-Nutzung, aber keine Discord-Nachricht | Prüfen, ob es sich um ein Umgebungsraum-Ereignis oder einen aktivierten `message_tool`-Raum handelt, in dem das Modell `message(action=send)` ausgelassen hat | Das ausführliche Gateway-Protokoll auf Metadaten unterdrückter finaler Payloads prüfen, `messages.groupChat.unmentionedInbound` überprüfen, [Umgebungsraum-Ereignisse](/de/channels/ambient-room-events) lesen oder für normale Gruppenanfragen `messages.groupChat.visibleReplies: "automatic"` beibehalten. |
| DM-Antworten fehlen                       | `openclaw pairing list discord`                                                                                                       | DM-Kopplung genehmigen oder DM-Richtlinie anpassen.                                                                                                                                                                                                                                                  |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Slack-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                               | Behebung                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket-Modus verbunden, aber keine Antworten | `openclaw channels status --probe`               | App-Token, Bot-Token und erforderliche Berechtigungsbereiche überprüfen; bei SecretRef-basierten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| DMs blockiert                                | `openclaw pairing list slack`                    | Kopplung genehmigen oder DM-Richtlinie lockern.                                                                                                                                |
| Kanalnachricht wird ignoriert                | `groupPolicy` und Kanal-Zulassungsliste prüfen   | Kanal zulassen oder Richtlinie auf `open` umstellen.                                                                                                                           |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage

### iMessage-Fehlersignaturen

| Symptom                                    | Schnellste Prüfung                                         | Behebung                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `imsg` fehlt oder schlägt auf Nicht-macOS-Systemen fehl | `openclaw channels status --probe --channel imessage`      | OpenClaw auf dem Mac mit Messages ausführen oder einen SSH-Wrapper für `cliPath` verwenden.   |
| Senden möglich, aber kein Empfang unter macOS | macOS-Datenschutzberechtigungen für die Messages-Automatisierung prüfen | TCC-Berechtigungen erneut erteilen und den Kanalprozess neu starten.                          |
| DM-Absender blockiert                      | `openclaw pairing list imessage`                           | Kopplung genehmigen oder Zulassungsliste aktualisieren.                                       |

Vollständige Fehlerbehebung: [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)

## Signal

### Signal-Fehlersignaturen

| Symptom                            | Schnellste Prüfung                                | Behebung                                                                  |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| Daemon erreichbar, aber Bot stumm  | `openclaw channels status --probe`                | URL/Konto des `signal-cli`-Daemons und Empfangsmodus überprüfen.          |
| DM blockiert                       | `openclaw pairing list signal`                    | Absender genehmigen oder DM-Richtlinie anpassen.                          |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Zulassungsliste und Erwähnungsmuster prüfen | Absender/Gruppe hinzufügen oder Zugriffsprüfung lockern.                  |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### QQ-Bot-Fehlersignaturen

| Symptom                                  | Schnellste Prüfung                                  | Behebung                                                                     |
| ---------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Bot antwortet „zum Mars verschwunden“    | `appId` und `clientSecret` in der Konfiguration prüfen | Anmeldedaten festlegen oder den Gateway neu starten.                         |
| Keine eingehenden Nachrichten            | `openclaw channels status --probe`                  | Anmeldedaten auf der QQ Open Platform überprüfen.                            |
| Sprache wird nicht transkribiert         | STT-Provider-Konfiguration prüfen                   | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.                 |
| Proaktive Nachrichten kommen nicht an    | Interaktionsanforderungen der QQ-Plattform prüfen   | QQ kann vom Bot initiierte Nachrichten ohne kürzlich erfolgte Interaktion blockieren. |

Vollständige Fehlerbehebung: [QQ-Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Matrix-Fehlersignaturen

| Symptom                                      | Schnellste Prüfung                      | Behebung                                                                                           |
| -------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Angemeldet, aber Raumnachrichten werden ignoriert | `openclaw channels status --probe`     | Prüfen Sie `groupPolicy`, die Raum-Zulassungsliste und die Erwähnungssteuerung.                    |
| Direktnachrichten werden nicht verarbeitet   | `openclaw pairing list matrix`          | Genehmigen Sie den Absender oder passen Sie die Richtlinie für Direktnachrichten an.               |
| Verschlüsselte Räume funktionieren nicht     | `openclaw matrix verify status`         | Verifizieren Sie das Gerät erneut und prüfen Sie anschließend `openclaw matrix verify backup status`. |
| Backup-Wiederherstellung steht aus/ist fehlerhaft | `openclaw matrix verify backup status` | Führen Sie `openclaw matrix verify backup restore` aus oder wiederholen Sie den Vorgang mit einem Wiederherstellungsschlüssel. |
| Cross-Signing/Bootstrap scheint fehlerhaft    | `openclaw matrix verify bootstrap`      | Reparieren Sie Secret Storage, Cross-Signing und den Backup-Status in einem Durchgang.             |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Channel-Routing](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
