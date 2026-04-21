---
read_when:
    - Einrichten des BlueBubbles-Kanals
    - Fehlerbehebung bei der Webhook-Kopplung
    - Konfigurieren von iMessage unter macOS
summary: iMessage über den BlueBubbles-macOS-Server (REST-Senden/-Empfangen, Tippen, Reaktionen, Kopplung, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T13:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Status: gebündeltes Plugin, das über HTTP mit dem BlueBubbles-macOS-Server kommuniziert. **Empfohlen für die iMessage-Integration** aufgrund der umfangreicheren API und der einfacheren Einrichtung im Vergleich zum veralteten imsg-Kanal.

## Gebündeltes Plugin

Aktuelle OpenClaw-Releases enthalten BlueBubbles bereits gebündelt, daher ist bei normalen paketierten Builds kein separater Schritt `openclaw plugins install` erforderlich.

## Überblick

- Läuft auf macOS über die BlueBubbles-Hilfs-App ([bluebubbles.app](https://bluebubbles.app)).
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist auf Tahoe derzeit defekt, und Aktualisierungen von Gruppensymbolen können Erfolg melden, aber nicht synchronisiert werden.
- OpenClaw kommuniziert damit über die REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten kommen über Webhooks an; ausgehende Antworten, Tippindikatoren, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen (und dem Agenten nach Möglichkeit bereitgestellt).
- Kopplung/Allowlist funktioniert genauso wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Kopplungscodes.
- Reaktionen werden genau wie bei Slack/Telegram als Systemereignisse dargestellt, sodass Agenten sie vor dem Antworten „erwähnen“ können.
- Erweiterte Funktionen: Bearbeiten, Zurückziehen, Antwort-Threading, Nachrichteneffekte, Gruppenverwaltung.

## Schnellstart

1. Installieren Sie den BlueBubbles-Server auf Ihrem Mac (folgen Sie den Anweisungen unter [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Aktivieren Sie in der BlueBubbles-Konfiguration die Web-API und legen Sie ein Passwort fest.
3. Führen Sie `openclaw onboard` aus und wählen Sie BlueBubbles aus, oder konfigurieren Sie es manuell:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Leiten Sie BlueBubbles-Webhooks an Ihr Gateway weiter (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Starten Sie das Gateway; es registriert den Webhook-Handler und beginnt mit der Kopplung.

Sicherheitshinweis:

- Legen Sie immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw weist BlueBubbles-Webhook-Anfragen zurück, sofern sie kein Passwort/GUID enthalten, das mit `channels.bluebubbles.password` übereinstimmt (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von local loopback-/Proxy-Topologie.
- Die Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodies gelesen/geparst werden.

## Messages.app aktiv halten (VM-/headless-Setups)

Bei einigen macOS-VM-/Always-on-Setups kann Messages.app in einen „Leerlauf“-Zustand geraten (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund gebracht wird). Eine einfache Behelfslösung ist, **Messages alle 5 Minuten anzustoßen** – mit einem AppleScript + LaunchAgent.

### 1) AppleScript speichern

Speichern Sie dies als:

- `~/Scripts/poke-messages.scpt`

Beispielskript (nicht interaktiv; stiehlt nicht den Fokus):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Einen LaunchAgent installieren

Speichern Sie dies als:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Hinweise:

- Dies wird **alle 300 Sekunden** und **bei der Anmeldung** ausgeführt.
- Beim ersten Ausführen können macOS-Aufforderungen für **Automation** erscheinen (`osascript` → Messages). Bestätigen Sie diese in derselben Benutzersitzung, in der der LaunchAgent läuft.

Laden Sie ihn:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles ist im interaktiven Onboarding verfügbar:

```
openclaw onboard
```

Der Assistent fragt nach:

- **Server-URL** (erforderlich): BlueBubbles-Serveradresse (z. B. `http://192.168.1.100:1234`)
- **Passwort** (erforderlich): API-Passwort aus den BlueBubbles-Servereinstellungen
- **Webhook-Pfad** (optional): Standard ist `/bluebubbles-webhook`
- **DM-Richtlinie**: pairing, allowlist, open oder disabled
- **Allowlist**: Telefonnummern, E-Mail-Adressen oder Chat-Ziele

Sie können BlueBubbles auch über die CLI hinzufügen:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.bluebubbles.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden ignoriert, bis sie genehmigt werden (Codes laufen nach 1 Stunde ab).
- Genehmigen über:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Kopplung ist der Standard-Tokenaustausch. Details: [Pairing](/de/channels/pairing)

Gruppen:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen Auslöser sein darf, wenn `allowlist` gesetzt ist.

### Anreicherung von Kontaktnamen (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten oft nur rohe Teilnehmeradressen. Wenn der Kontext `GroupMembers` stattdessen lokale Kontaktnamen anzeigen soll, können Sie unter macOS die lokale Contacts-Anreicherung aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Nachschlagefunktion. Standard: `false`.
- Nachschlagen erfolgt nur, nachdem Gruppenzugriff, Befehlsautorisierung und Mention-Gating die Nachricht durchgelassen haben.
- Nur unbenannte Telefonteilnehmer werden angereichert.
- Rohe Telefonnummern bleiben die Rückfalloption, wenn keine lokale Übereinstimmung gefunden wird.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention-Gating (Gruppen)

BlueBubbles unterstützt Mention-Gating für Gruppenchats, entsprechend dem Verhalten von iMessage/WhatsApp:

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`) zur Erkennung von Erwähnungen.
- Wenn `requireMention` für eine Gruppe aktiviert ist, antwortet der Agent nur, wenn er erwähnt wird.
- Steuerbefehle von autorisierten Absendern umgehen das Mention-Gating.

Konfiguration pro Gruppe:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // Standard für alle Gruppen
        "iMessage;-;chat123": { requireMention: false }, // Überschreibung für eine bestimmte Gruppe
      },
    },
  },
}
```

### Befehls-Gating

- Steuerbefehle (z. B. `/config`, `/model`) erfordern Autorisierung.
- Verwendet `allowFrom` und `groupAllowFrom`, um die Befehlsautorisierung zu bestimmen.
- Autorisierte Absender können Steuerbefehle auch ohne Erwähnung in Gruppen ausführen.

### System-Prompt pro Gruppe

Jeder Eintrag unter `channels.bluebubbles.groups.*` akzeptiert eine optionale Zeichenfolge `systemPrompt`. Der Wert wird bei jeder Verarbeitung einer Nachricht in dieser Gruppe in den System-Prompt des Agenten eingefügt, sodass Sie pro Gruppe Persona- oder Verhaltensregeln festlegen können, ohne Agent-Prompts zu bearbeiten:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Halte Antworten unter 3 Sätzen. Spiegele den lockeren Ton der Gruppe.",
        },
      },
    },
  },
}
```

Der Schlüssel entspricht dem, was BlueBubbles für die Gruppe als `chatGuid` / `chatIdentifier` / numerische `chatId` meldet, und ein Platzhaltereintrag `"*"` stellt einen Standard für jede Gruppe ohne exakte Übereinstimmung bereit (dasselbe Muster wird von `requireMention` und gruppenspezifischen Tool-Richtlinien verwendet). Exakte Übereinstimmungen haben immer Vorrang vor dem Platzhalter. DMs ignorieren dieses Feld; verwenden Sie stattdessen Prompt-Anpassungen auf Agenten- oder Kontoebene.

#### Ausgearbeitetes Beispiel: Thread-Antworten und Tapback-Reaktionen (Private API)

Mit aktivierter BlueBubbles Private API kommen eingehende Nachrichten mit kurzen Nachrichten-IDs an (zum Beispiel `[[reply_to:5]]`), und der Agent kann `action=reply` aufrufen, um in eine bestimmte Nachricht zu threaden, oder `action=react`, um ein Tapback zu setzen. Ein `systemPrompt` pro Gruppe ist eine zuverlässige Möglichkeit, damit der Agent das richtige Tool auswählt:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Wenn du in dieser Gruppe antwortest, rufe immer action=reply mit der",
            "[[reply_to:N]] messageId aus dem Kontext auf, damit deine Antwort",
            "unter der auslösenden Nachricht gethreadet wird. Sende niemals eine neue, nicht verknüpfte Nachricht.",
            "",
            "Verwende für kurze Bestätigungen ('ok', 'verstanden', 'bin dran')",
            "action=react mit einem passenden Tapback-Emoji (❤️, 👍, 😂, ‼️, ❓)",
            "anstelle einer Textantwort.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback-Reaktionen und Thread-Antworten erfordern beide die BlueBubbles Private API; die zugrunde liegenden Mechanismen finden Sie unter [Erweiterte Aktionen](#advanced-actions) und [Nachrichten-IDs](#message-ids-short-vs-full).

## ACP-Gesprächsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Transportebene zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb des DM- oder erlaubten Gruppenchats aus.
- Künftige Nachrichten in derselben BlueBubbles-Konversation werden an die erzeugte ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden auch über Top-Level-Einträge `bindings[]` mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

`match.peer.id` kann jede unterstützte BlueBubbles-Zielform verwenden:

- normalisierter DM-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Für stabile Gruppenbindungen bevorzugen Sie `chat_id:*` oder `chat_identifier:*`.

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Siehe [ACP Agents](/de/tools/acp-agents) für das gemeinsame Verhalten von ACP-Bindungen.

## Tippindikatoren + Lesebestätigungen

- **Tippindikatoren**: Werden automatisch vor und während der Antwortgenerierung gesendet.
- **Lesebestätigungen**: Gesteuert durch `channels.bluebubbles.sendReadReceipts` (Standard: `true`).
- **Tippindikatoren**: OpenClaw sendet Tippstart-Ereignisse; BlueBubbles entfernt den Tippstatus beim Senden oder per Timeout automatisch (manuelles Stoppen per DELETE ist unzuverlässig).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // Lesebestätigungen deaktivieren
    },
  },
}
```

## Erweiterte Aktionen

BlueBubbles unterstützt erweiterte Nachrichtenaktionen, wenn sie in der Konfiguration aktiviert sind:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // Tapbacks (Standard: true)
        edit: true, // gesendete Nachrichten bearbeiten (macOS 13+, defekt unter macOS 26 Tahoe)
        unsend: true, // Nachrichten zurückziehen (macOS 13+)
        reply: true, // Antwort-Threading per Nachrichten-GUID
        sendWithEffect: true, // Nachrichteneffekte (slam, loud usw.)
        renameGroup: true, // Gruppenchats umbenennen
        setGroupIcon: true, // Gruppenchatsymbol/-foto festlegen (unzuverlässig unter macOS 26 Tahoe)
        addParticipant: true, // Teilnehmer zu Gruppen hinzufügen
        removeParticipant: true, // Teilnehmer aus Gruppen entfernen
        leaveGroup: true, // Gruppenchats verlassen
        sendAttachment: true, // Anhänge/Medien senden
      },
    },
  },
}
```

Verfügbare Aktionen:

- **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`)
- **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`)
- **unsend**: Eine Nachricht zurückziehen (`messageId`)
- **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`)
- **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`)
- **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`)
- **setGroupIcon**: Das Symbol/Foto eines Gruppenchats festlegen (`chatGuid`, `media`) — unzuverlässig unter macOS 26 Tahoe (die API kann Erfolg zurückgeben, aber das Symbol wird nicht synchronisiert).
- **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`)
- **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`)
- **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`)
- **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`)
  - Sprachnachrichten: Setzen Sie `asVoice: true` mit **MP3**- oder **CAF**-Audio, um als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert beim Senden von Sprachnotizen MP3 → CAF.
- Veralteter Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) bereitstellen, um Tokens zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen IDs des Providers.
- Kurze IDs sind im Speicher; sie können bei einem Neustart oder bei Cache-Verdrängung verfallen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs führen zu Fehlern, wenn sie nicht mehr verfügbar sind.

Verwenden Sie vollständige IDs für dauerhafte Automatisierungen und Speicherung:

- Vorlagen: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Konfiguration](/de/gateway/configuration) für Vorlagenvariablen.

## Zusammenführen von Split-Send-DMs (Befehl + URL in einer Eingabe)

Wenn ein Benutzer in iMessage einen Befehl und eine URL zusammen eingibt – z. B. `Dump https://example.com/article` – teilt Apple das Senden in **zwei separate Webhook-Zustellungen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Bubble (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Die beiden Webhooks treffen bei OpenClaw auf den meisten Setups mit etwa 0,8–2,0 s Abstand ein. Ohne Zusammenführung erhält der Agent in Turn 1 nur den Befehl, antwortet (oft mit „schick mir die URL“), und sieht die URL erst in Turn 2 – zu diesem Zeitpunkt ist der Befehlskontext bereits verloren.

`channels.bluebubbles.coalesceSameSenderDms` aktiviert für DMs das Zusammenführen aufeinanderfolgender Webhooks desselben Absenders in einen einzigen Agent-Turn. Gruppenchats bleiben weiter nach Nachricht getrennt, damit die Turn-Struktur mit mehreren Benutzern erhalten bleibt.

### Wann aktivieren

Aktivieren Sie dies, wenn:

- Sie Skills bereitstellen, die `Befehl + Payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
- Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
- Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

Lassen Sie es deaktiviert, wenn:

- Sie minimale Befehlslatenz für einwortige DM-Trigger benötigen.
- Alle Ihre Abläufe One-Shot-Befehle ohne nachfolgende Payloads sind.

### Aktivierung

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // aktivieren (Standard: false)
    },
  },
}
```

Mit aktiviertem Flag und ohne explizites `messages.inbound.byChannel.bluebubbles` erweitert sich das Debounce-Fenster auf **2500 ms** (der Standard ohne Zusammenführung beträgt 500 ms). Das breitere Fenster ist erforderlich – Apples Split-Send-Takt von 0,8–2,0 s passt nicht in das engere Standardfenster.

So passen Sie das Fenster selbst an:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms funktionieren für die meisten Setups; erhöhen Sie auf 4000 ms,
        // wenn Ihr Mac langsam ist oder unter Speicherdruck steht
        // (die beobachtete Lücke kann dann über 2 s hinausgehen).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Abwägungen

- **Zusätzliche Latenz für DM-Steuerbefehle.** Mit aktiviertem Flag warten DM-Steuerbefehle (wie `Dump`, `Save` usw.) nun bis zur Länge des Debounce-Fensters vor dem Versand, falls ein Payload-Webhook folgt. Befehle in Gruppenchats werden weiterhin sofort versendet.
- **Zusammengeführte Ausgabe ist begrenzt** – zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleneinträge sind auf 10 begrenzt (darüber hinaus bleiben erster und neuester erhalten). Jede Quell-`messageId` erreicht weiterhin die Inbound-Deduplizierung, sodass ein späteres MessagePoller-Replay eines einzelnen Ereignisses als Duplikat erkannt wird.
- **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen.

### Szenarien und was der Agent sieht

| Benutzer gibt ein                                                   | Apple liefert             | Flag aus (Standard)                     | Flag an + 2500-ms-Fenster                                              |
| ------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (einmal senden)                          | 2 Webhooks mit ~1 s Abstand | Zwei Agent-Turns: nur „Dump“, dann URL  | Ein Turn: zusammengeführter Text `Dump https://example.com`            |
| `Save this 📎image.jpg caption` (Anhang + Text)                     | 2 Webhooks                | Zwei Turns                              | Ein Turn: Text + Bild                                                  |
| `/status` (eigenständiger Befehl)                                   | 1 Webhook                 | Sofortiger Versand                      | **Wartet bis zum Fensterende, dann Versand**                           |
| Nur URL eingefügt                                                   | 1 Webhook                 | Sofortiger Versand                      | Sofortiger Versand (nur ein Eintrag im Bucket)                         |
| Text + URL als zwei bewusst getrennte Nachrichten, Minuten auseinander gesendet | 2 Webhooks außerhalb des Fensters | Zwei Turns                              | Zwei Turns (Fenster läuft dazwischen ab)                               |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)               | N Webhooks                | N Turns                                 | Ein Turn, begrenzte Ausgabe (erster + neuester, Text-/Anhang-Limits angewendet) |

### Fehlerbehebung für das Zusammenführen von Split-Sends

Wenn das Flag aktiviert ist und Split-Sends trotzdem als zwei Turns ankommen, prüfen Sie jede Ebene:

1. **Konfiguration tatsächlich geladen.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Dann `openclaw gateway restart` – das Flag wird bei der Erstellung der Debouncer-Registry eingelesen.

2. **Debounce-Fenster breit genug für Ihr Setup.** Sehen Sie sich das BlueBubbles-Serverlog unter `~/Library/Logs/bluebubbles-server/main.log` an:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Messen Sie die Lücke zwischen dem Versand des Textes im Stil von `"Dump"` und dem nachfolgenden Versand `"https://..."; Attachments:`. Erhöhen Sie `messages.inbound.byChannel.bluebubbles`, sodass diese Lücke sicher abgedeckt ist.

3. **JSONL-Zeitstempel der Sitzung ≠ Webhook-Ankunft.** Zeitstempel von Sitzungsereignissen (`~/.openclaw/agents/<id>/sessions/*.jsonl`) zeigen den Zeitpunkt, zu dem das Gateway eine Nachricht an den Agenten übergibt, **nicht** den Zeitpunkt, zu dem der Webhook eingetroffen ist. Eine in die Warteschlange gestellte zweite Nachricht mit dem Tag `[Queued messages while agent was busy]` bedeutet, dass der erste Turn noch lief, als der zweite Webhook eintraf – der Coalesce-Bucket war bereits geleert. Stimmen Sie das Fenster auf das BB-Serverlog ab, nicht auf das Sitzungslog.

4. **Speicherdruck verlangsamt den Antwortversand.** Auf kleineren Maschinen (8 GB) können Agent-Turns so lange dauern, dass der Coalesce-Bucket geleert wird, bevor die Antwort fertig ist, und die URL als zweiter Turn in der Warteschlange landet. Prüfen Sie `memory_pressure` und `ps -o rss -p $(pgrep openclaw-gateway)`; wenn das Gateway über ~500 MB RSS liegt und der Compressor aktiv ist, schließen Sie andere schwere Prozesse oder wechseln Sie auf einen größeren Host.

5. **Senden mit Antwortzitat ist ein anderer Pfad.** Wenn der Benutzer `Dump` als **Antwort** auf eine vorhandene URL-Bubble getippt hat (iMessage zeigt auf der Dump-Bubble ein Abzeichen „1 Reply“), befindet sich die URL in `replyToBody`, nicht in einem zweiten Webhook. Zusammenführung greift hier nicht – das ist ein Thema für Skill/Prompt, nicht für den Debouncer.

## Block-Streaming

Steuern Sie, ob Antworten als einzelne Nachricht gesendet oder in Blöcken gestreamt werden:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // Block-Streaming aktivieren (standardmäßig aus)
    },
  },
}
```

## Medien + Limits

- Eingehende Anhänge werden heruntergeladen und im Medien-Cache gespeichert.
- Medienlimit über `channels.bluebubbles.mediaMaxMb` für eingehende und ausgehende Medien (Standard: 8 MB).
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` segmentiert (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.bluebubbles.enabled`: Kanal aktivieren/deaktivieren.
- `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles-REST-API.
- `channels.bluebubbles.password`: API-Passwort.
- `channels.bluebubbles.webhookPath`: Pfad des Webhook-Endpunkts (Standard: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
- `channels.bluebubbles.allowFrom`: DM-Allowlist (Handles, E-Mails, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Allowlist für Gruppenabsender.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Unter macOS unbenannte Gruppenteilnehmer nach erfolgreichem Gating optional mit lokalen Kontakten anreichern. Standard: `false`.
- `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).
- `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
- `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; erforderlich für Streaming-Antworten).
- `channels.bluebubbles.textChunkLimit`: Größe ausgehender Blöcke in Zeichen (Standard: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Timeout pro Anfrage in ms für ausgehende Textsendungen über `/api/v1/message/text` (Standard: 30000). Erhöhen Sie dies auf macOS-26-Setups, bei denen Private-API-iMessage-Sendungen im iMessage-Framework 60+ Sekunden hängen können, z. B. auf `45000` oder `60000`. Probes, Chat-Lookups, Reaktionen, Bearbeitungen und Health Checks behalten derzeit den kürzeren Standard von 10 s; eine Ausweitung auf Reaktionen und Bearbeitungen ist als Follow-up geplant. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur, wenn `textChunkLimit` überschritten wird; `newline` teilt an Leerzeilen (Absatzgrenzen) vor der Längensegmentierung.
- `channels.bluebubbles.mediaMaxMb`: Medienlimit für ein- und ausgehende Medien in MB (Standard: 8).
- `channels.bluebubbles.mediaLocalRoots`: Explizite Allowlist absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade erlaubt sind. Das Senden lokaler Pfade wird standardmäßig verweigert, sofern dies nicht konfiguriert ist. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Führt aufeinanderfolgende DM-Webhooks desselben Absenders zu einem Agent-Turn zusammen, sodass Apples Split-Send von Text+URL als eine einzelne Nachricht ankommt (Standard: `false`). Siehe [Zusammenführen von Split-Send-DMs](#coalescing-split-send-dms-command--url-in-one-composition) für Szenarien, Fenstertuning und Abwägungen. Erweitert das Standard-Debounce-Fenster für eingehende Nachrichten von 500 ms auf 2500 ms, wenn aktiviert, ohne ein explizites `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: Maximale Anzahl an Gruppennachrichten für den Kontext (0 deaktiviert).
- `channels.bluebubbles.dmHistoryLimit`: Verlaufslimit für DMs.
- `channels.bluebubbles.actions`: Bestimmte Aktionen aktivieren/deaktivieren.
- `channels.bluebubbles.accounts`: Multi-Account-Konfiguration.

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressierung / Zustellziele

Bevorzugen Sie `chat_guid` für stabiles Routing:

- `chat_guid:iMessage;-;+15555550123` (bevorzugt für Gruppen)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn ein direkter Handle keinen bestehenden DM-Chat hat, erstellt OpenClaw einen über `POST /api/v1/chat/new`. Dafür muss die BlueBubbles Private API aktiviert sein.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem `guid`-/`password`-Query-Parameter oder Header mit `channels.bluebubbles.password` verglichen werden.
- Halten Sie das API-Passwort und den Webhook-Endpunkt geheim (behandeln Sie sie wie Zugangsdaten).
- Es gibt keine localhost-Umgehung für die BlueBubbles-Webhook-Authentifizierung. Wenn Sie Webhook-Traffic per Proxy weiterleiten, behalten Sie das BlueBubbles-Passwort Ende-zu-Ende in der Anfrage bei. `gateway.trustedProxies` ersetzt `channels.bluebubbles.password` hier nicht. Siehe [Gateway-Sicherheit](/de/gateway/security#reverse-proxy-configuration).
- Aktivieren Sie HTTPS + Firewall-Regeln auf dem BlueBubbles-Server, wenn Sie ihn außerhalb Ihres LAN bereitstellen.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfen Sie die BlueBubbles-Webhook-Logs und vergewissern Sie sich, dass der Gateway-Pfad mit `channels.bluebubbles.webhookPath` übereinstimmt.
- Kopplungscodes verfallen nach einer Stunde; verwenden Sie `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die BlueBubbles Private API (`POST /api/v1/message/react`); stellen Sie sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückziehen erfordern macOS 13+ und eine kompatible BlueBubbles-Serverversion. Unter macOS 26 (Tahoe) ist Bearbeiten derzeit aufgrund von Änderungen an der Private API defekt.
- Aktualisierungen von Gruppensymbolen können unter macOS 26 (Tahoe) unzuverlässig sein: Die API kann Erfolg melden, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekannte defekte Aktionen anhand der macOS-Version des BlueBubbles-Servers automatisch aus. Wenn Bearbeiten unter macOS 26 (Tahoe) weiterhin angezeigt wird, deaktivieren Sie es manuell mit `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ist aktiviert, aber Split-Sends (z. B. `Dump` + URL) kommen weiterhin als zwei Turns an: siehe die Checkliste zur [Fehlerbehebung für das Zusammenführen von Split-Sends](#split-send-coalescing-troubleshooting) — häufige Ursachen sind ein zu enges Debounce-Fenster, Sitzungslog-Zeitstempel, die fälschlich als Webhook-Ankunft interpretiert werden, oder ein Senden mit Antwortzitat (das `replyToBody` verwendet, nicht einen zweiten Webhook).
- Für Status-/Health-Informationen: `openclaw status --all` oder `openclaw status --deep`.

Eine allgemeine Referenz zum Kanal-Workflow finden Sie unter [Kanäle](/de/channels) und im Leitfaden [Plugins](/de/tools/plugin).

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
