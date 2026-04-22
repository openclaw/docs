---
read_when:
    - BlueBubbles-Kanal einrichten
    - Fehlerbehebung bei der Webhook-Kopplung
    - iMessage auf macOS konfigurieren
summary: iMessage über den BlueBubbles-macOS-Server (REST-Senden/Empfangen, Tippen, Reaktionen, Kopplung, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Status: gebündeltes Plugin, das über HTTP mit dem BlueBubbles-macOS-Server kommuniziert. **Empfohlen für die iMessage-Integration** aufgrund der umfangreicheren API und der einfacheren Einrichtung im Vergleich zum alten imsg-Kanal.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen bündeln BlueBubbles, daher benötigen normale paketierte Builds keinen separaten Schritt `openclaw plugins install`.

## Überblick

- Läuft auf macOS über die BlueBubbles-Helfer-App ([bluebubbles.app](https://bluebubbles.app)).
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist auf Tahoe derzeit kaputt, und Aktualisierungen von Gruppensymbolen können Erfolg melden, aber nicht synchronisiert werden.
- OpenClaw kommuniziert damit über seine REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten kommen über Webhooks an; ausgehende Antworten, Tippindikatoren, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen (und nach Möglichkeit dem Agenten bereitgestellt).
- Kopplung/Allowlist funktioniert genauso wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Kopplungscodes.
- Reaktionen werden genau wie bei Slack/Telegram als Systemereignisse bereitgestellt, sodass Agenten sie vor dem Antworten „erwähnen“ können.
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
5. Starten Sie das Gateway; es registriert den Webhook-Handler und startet die Kopplung.

Sicherheitshinweis:

- Legen Sie immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw lehnt BlueBubbles-Webhook-Anfragen ab, sofern sie kein Passwort/GUID enthalten, das `channels.bluebubbles.password` entspricht (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von der local loopback-/Proxy-Topologie.
- Die Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodies gelesen/geparst werden.

## Messages.app aktiv halten (VM-/Headless-Setups)

Bei einigen macOS-VM-/Always-on-Setups kann es vorkommen, dass Messages.app in einen „Leerlauf“-Zustand gerät (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund gebracht wird). Ein einfacher Workaround ist, **Messages alle 5 Minuten anzustoßen** mit einem AppleScript + LaunchAgent.

### 1) Das AppleScript speichern

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

- Dies läuft **alle 300 Sekunden** und **bei der Anmeldung**.
- Beim ersten Lauf können macOS-**Automation**-Eingabeaufforderungen erscheinen (`osascript` → Messages). Bestätigen Sie sie in derselben Benutzersitzung, in der der LaunchAgent läuft.

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

Sie können BlueBubbles auch per CLI hinzufügen:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.bluebubbles.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden ignoriert, bis sie genehmigt werden (Codes laufen nach 1 Stunde ab).
- Genehmigung über:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Kopplung ist der Standard-Tokenaustausch. Details: [Kopplung](/de/channels/pairing)

Gruppen:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen auslösen kann, wenn `allowlist` gesetzt ist.

### Anreicherung mit Kontaktnamen (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten oft nur rohe Teilnehmeradressen. Wenn Sie möchten, dass der Kontext `GroupMembers` stattdessen lokale Kontaktnamen anzeigt, können Sie unter macOS die lokale Kontakte-Anreicherung aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Nachschlagung. Standard: `false`.
- Nachschlagungen werden nur ausgeführt, nachdem Gruppenzugriff, Befehlsautorisierung und Mention-Gating die Nachricht durchgelassen haben.
- Nur unbenannte Telefonteilnehmer werden angereichert.
- Rohe Telefonnummern bleiben der Fallback, wenn keine lokale Übereinstimmung gefunden wird.

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

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`), um Erwähnungen zu erkennen.
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
        "iMessage;-;chat123": { requireMention: false }, // Überschreibung für bestimmte Gruppe
      },
    },
  },
}
```

### Befehls-Gating

- Steuerbefehle (z. B. `/config`, `/model`) erfordern Autorisierung.
- Verwendet `allowFrom` und `groupAllowFrom`, um die Befehlsautorisierung zu bestimmen.
- Autorisierte Absender können Steuerbefehle auch in Gruppen ohne Erwähnung ausführen.

### System-Prompt pro Gruppe

Jeder Eintrag unter `channels.bluebubbles.groups.*` akzeptiert eine optionale Zeichenfolge `systemPrompt`. Der Wert wird bei jeder Runde, die eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt, sodass Sie gruppenspezifische Persona- oder Verhaltensregeln festlegen können, ohne Agent-Prompts zu bearbeiten:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Halte Antworten unter 3 Sätzen. Spiegele den lockeren Ton der Gruppe wider.",
        },
      },
    },
  },
}
```

Der Schlüssel entspricht dem, was BlueBubbles als `chatGuid` / `chatIdentifier` / numerische `chatId` für die Gruppe meldet, und ein Platzhalter-Eintrag `"*"` stellt einen Standardwert für jede Gruppe ohne exakte Übereinstimmung bereit (dasselbe Muster wird von `requireMention` und gruppenspezifischen Tool-Richtlinien verwendet). Exakte Übereinstimmungen haben immer Vorrang vor dem Platzhalter. DMs ignorieren dieses Feld; verwenden Sie stattdessen Anpassungen des Prompt auf Agenten- oder Kontoebene.

#### Ausgearbeitetes Beispiel: Thread-Antworten und Tapback-Reaktionen (Private API)

Wenn die BlueBubbles Private API aktiviert ist, treffen eingehende Nachrichten mit kurzen Nachrichten-IDs ein (zum Beispiel `[[reply_to:5]]`), und der Agent kann `action=reply` aufrufen, um in einen bestimmten Nachrichten-Thread zu antworten, oder `action=react`, um ein Tapback zu setzen. Ein `systemPrompt` pro Gruppe ist ein verlässlicher Weg, damit der Agent das richtige Tool wählt:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Wenn du in dieser Gruppe antwortest, rufe immer action=reply mit der",
            "[[reply_to:N]]-messageId aus dem Kontext auf, damit deine Antwort",
            "unter der auslösenden Nachricht als Thread erscheint. Sende niemals eine neue, nicht verknüpfte Nachricht.",
            "",
            "Für kurze Bestätigungen ('ok', 'verstanden', 'bin dran') verwende",
            "action=react mit einem passenden Tapback-Emoji (❤️, 👍, 😂, ‼️, ❓)",
            "anstatt eine Textantwort zu senden.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback-Reaktionen und Thread-Antworten erfordern beide die BlueBubbles Private API; siehe [Erweiterte Aktionen](#advanced-actions) und [Nachrichten-IDs](#message-ids-short-vs-full) für die zugrunde liegende Funktionsweise.

## ACP-Gesprächsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Transportebene zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb des DM- oder erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben BlueBubbles-Unterhaltung werden an die erzeugte ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte dauerhafte Bindungen werden ebenfalls über oberste `bindings[]`-Einträge mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

`match.peer.id` kann jede unterstützte BlueBubbles-Zielform verwenden:

- normalisierter DM-Identifier wie `+15555550123` oder `user@example.com`
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

## Tippen + Lesebestätigungen

- **Tippindikatoren**: Werden automatisch vor und während der Antwortgenerierung gesendet.
- **Lesebestätigungen**: Gesteuert durch `channels.bluebubbles.sendReadReceipts` (Standard: `true`).
- **Tippindikatoren**: OpenClaw sendet Ereignisse zum Start des Tippens; BlueBubbles beendet das Tippen automatisch beim Senden oder per Timeout (manuelles Stoppen per DELETE ist unzuverlässig).

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
        edit: true, // gesendete Nachrichten bearbeiten (macOS 13+, auf macOS 26 Tahoe kaputt)
        unsend: true, // Nachrichten zurückziehen (macOS 13+)
        reply: true, // Antwort-Threading nach Nachrichten-GUID
        sendWithEffect: true, // Nachrichteneffekte (slam, loud usw.)
        renameGroup: true, // Gruppenchats umbenennen
        setGroupIcon: true, // Gruppenchatsymbol/-foto setzen (instabil auf macOS 26 Tahoe)
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

- **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Die native Tapback-Auswahl von iMessage ist `love`, `like`, `dislike`, `laugh`, `emphasize` und `question`. Wenn ein Agent ein Emoji außerhalb dieser Auswahl wählt (zum Beispiel `👀`), greift das Reaktionstool auf `love` zurück, sodass das Tapback trotzdem gerendert wird, anstatt die gesamte Anfrage fehlschlagen zu lassen. Konfigurierte Bestätigungsreaktionen werden weiterhin strikt validiert und erzeugen bei unbekannten Werten einen Fehler.
- **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`)
- **unsend**: Eine Nachricht zurückziehen (`messageId`)
- **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`)
- **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`)
- **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`)
- **setGroupIcon**: Das Symbol/Foto eines Gruppenchats setzen (`chatGuid`, `media`) — instabil auf macOS 26 Tahoe (API kann Erfolg zurückgeben, aber das Symbol wird nicht synchronisiert).
- **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`)
- **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`)
- **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`)
- **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`)
  - Sprachnotizen: Setzen Sie `asVoice: true` mit **MP3**- oder **CAF**-Audio, um als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert beim Senden von Sprachnotizen MP3 → CAF.
- Alter Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) bereitstellen, um Tokens zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen IDs des Providers.
- Kurze IDs liegen im Arbeitsspeicher; sie können nach einem Neustart oder einer Cache-Bereinigung verfallen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs erzeugen einen Fehler, wenn sie nicht mehr verfügbar sind.

Verwenden Sie für dauerhafte Automatisierungen und Speicherung vollständige IDs:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Configuration](/de/gateway/configuration) für Template-Variablen.

## Aufspalten in DMs zusammenführen (Befehl + URL in einer Eingabe)

Wenn ein Benutzer einen Befehl und eine URL zusammen in iMessage eingibt — z. B. `Dump https://example.com/article` — teilt Apple das Senden in **zwei separate Webhook-Zustellungen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Bubble (`"https://..."`) mit OG-Vorschaubildern als Anhängen.

Die beiden Webhooks treffen bei OpenClaw in den meisten Setups mit ~0,8–2,0 s Abstand ein. Ohne Zusammenführung erhält der Agent in Turn 1 nur den Befehl, antwortet darauf (oft mit „schick mir die URL“), und sieht die URL erst in Turn 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren.

`channels.bluebubbles.coalesceSameSenderDms` aktiviert für einen DM das Zusammenführen aufeinanderfolgender Webhooks desselben Absenders zu einem einzelnen Agenten-Turn. Gruppenchats verwenden weiterhin den Schlüssel pro Nachricht, sodass die Turn-Struktur mit mehreren Benutzern erhalten bleibt.

### Wann aktivieren

Aktivieren Sie dies, wenn:

- Sie Skills bereitstellen, die `Befehl + Payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
- Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
- Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

Lassen Sie es deaktiviert, wenn:

- Sie die minimale Befehlslatenz für DM-Trigger aus einem einzelnen Wort benötigen.
- Alle Ihre Abläufe Einmalbefehle ohne nachfolgende Payloads sind.

### Aktivieren

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // aktivieren (Standard: false)
    },
  },
}
```

Wenn das Flag aktiviert ist und kein explizites `messages.inbound.byChannel.bluebubbles` gesetzt ist, erweitert sich das Debounce-Fenster auf **2500 ms** (der Standard für nicht zusammengeführte Fälle ist 500 ms). Das breitere Fenster ist erforderlich — Apples Split-Send-Taktung von 0,8–2,0 s passt nicht in den engeren Standardwert.

So stimmen Sie das Fenster selbst ab:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms funktioniert für die meisten Setups; erhöhen Sie auf 4000 ms,
        // wenn Ihr Mac langsam ist oder unter Speicherdruck steht
        // (beobachtete Lücke kann dann über 2 s hinausgehen).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Abwägungen

- **Zusätzliche Latenz für DM-Steuerbefehle.** Wenn das Flag aktiviert ist, warten DM-Steuerbefehlsnachrichten (wie `Dump`, `Save` usw.) jetzt bis zu dem Debounce-Fenster, bevor sie gesendet werden, falls ein Payload-Webhook folgt. Gruppenchat-Befehle werden weiterhin sofort gesendet.
- **Zusammengeführte Ausgabe ist begrenzt** — zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge sind auf 10 begrenzt (über diesen Wert hinaus bleiben der erste und der neueste erhalten). Jede `messageId` der Quelle erreicht weiterhin die Eingangs-Deduplizierung, sodass ein späteres MessagePoller-Replay eines einzelnen Ereignisses als Duplikat erkannt wird.
- **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen.

### Szenarien und was der Agent sieht

| Benutzer gibt ein                                                   | Apple liefert              | Flag aus (Standard)                    | Flag an + 2500-ms-Fenster                                             |
| ------------------------------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| `Dump https://example.com` (ein Sendevorgang)                       | 2 Webhooks ~1 s auseinander | Zwei Agenten-Turns: „Dump“ allein, dann URL | Ein Turn: zusammengeführter Text `Dump https://example.com`           |
| `Save this 📎image.jpg caption` (Anhang + Text)                     | 2 Webhooks                 | Zwei Turns                             | Ein Turn: Text + Bild                                                 |
| `/status` (eigenständiger Befehl)                                   | 1 Webhook                  | Sofortige Zustellung                   | **Warten bis zum Fenster, dann zustellen**                            |
| Nur eine URL eingefügt                                              | 1 Webhook                  | Sofortige Zustellung                   | Sofortige Zustellung (nur ein Eintrag im Bucket)                      |
| Text + URL als zwei bewusst getrennte Nachrichten, Minuten auseinander | 2 Webhooks außerhalb des Fensters | Zwei Turns                             | Zwei Turns (Fenster läuft zwischen ihnen ab)                          |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)               | N Webhooks                 | N Turns                                | Ein Turn, begrenzte Ausgabe (erster + neuester, Text-/Anhanggrenzen angewendet) |

### Fehlerbehebung bei der Split-Send-Zusammenführung

Wenn das Flag aktiviert ist und Split-Sends trotzdem als zwei Turns ankommen, prüfen Sie jede Ebene:

1. **Konfiguration tatsächlich geladen.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Dann `openclaw gateway restart` — das Flag wird bei der Erstellung der Debouncer-Registry gelesen.

2. **Debounce-Fenster breit genug für Ihr Setup.** Schauen Sie in das BlueBubbles-Server-Log unter `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Messen Sie die Lücke zwischen der Zustellung des Texts im Stil `"Dump"` und der nachfolgenden Zustellung `"https://..."; Attachments:`. Erhöhen Sie `messages.inbound.byChannel.bluebubbles`, damit dieser Abstand bequem abgedeckt wird.

3. **JSONL-Zeitstempel der Sitzung ≠ Webhook-Ankunft.** Zeitstempel von Sitzungsereignissen (`~/.openclaw/agents/<id>/sessions/*.jsonl`) zeigen an, wann das Gateway eine Nachricht an den Agenten übergibt, **nicht**, wann der Webhook angekommen ist. Eine eingereihte zweite Nachricht mit dem Tag `[Queued messages while agent was busy]` bedeutet, dass der erste Turn noch lief, als der zweite Webhook ankam — der Zusammenführungs-Bucket war bereits geleert. Stimmen Sie das Fenster gegen das BB-Server-Log ab, nicht gegen das Sitzungslog.

4. **Speicherdruck verlangsamt die Antwortzustellung.** Auf kleineren Maschinen (8 GB) können Agenten-Turns so lange dauern, dass der Zusammenführungs-Bucket geleert wird, bevor die Antwort abgeschlossen ist, und die URL als eingereihter zweiter Turn landet. Prüfen Sie `memory_pressure` und `ps -o rss -p $(pgrep openclaw-gateway)`; wenn das Gateway über ~500 MB RSS liegt und der Kompressor aktiv ist, schließen Sie andere speicherintensive Prozesse oder wechseln Sie zu einem größeren Host.

5. **Antwort-Zitat-Sendungen sind ein anderer Pfad.** Wenn der Benutzer `Dump` als **Antwort** auf eine vorhandene URL-Bubble getippt hat (iMessage zeigt auf der Dump-Bubble ein Badge „1 Reply“), befindet sich die URL in `replyToBody`, nicht in einem zweiten Webhook. Zusammenführung ist hier nicht relevant — das ist eine Frage von Skill/Prompt, nicht vom Debouncer.

## Block-Streaming

Steuern Sie, ob Antworten als einzelne Nachricht oder gestreamt in Blöcken gesendet werden:

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
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` aufgeteilt (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Configuration](/de/gateway/configuration)

Provider-Optionen:

- `channels.bluebubbles.enabled`: Den Kanal aktivieren/deaktivieren.
- `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles-REST-API.
- `channels.bluebubbles.password`: API-Passwort.
- `channels.bluebubbles.webhookPath`: Pfad des Webhook-Endpunkts (Standard: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
- `channels.bluebubbles.allowFrom`: DM-Allowlist (Handles, E-Mails, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Allowlist für Absender in Gruppen.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Unter macOS optional unbenannte Gruppenteilnehmer nach erfolgreichem Gating aus lokalen Kontakten anreichern. Standard: `false`.
- `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).
- `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
- `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; erforderlich für Streaming-Antworten).
- `channels.bluebubbles.textChunkLimit`: Größe ausgehender Blöcke in Zeichen (Standard: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Timeout pro Anfrage in ms für ausgehende Textsendungen über `/api/v1/message/text` (Standard: 30000). Auf macOS-26-Setups erhöhen, bei denen iMessage-Sendungen über die Private API im iMessage-Framework 60+ Sekunden hängen können; zum Beispiel `45000` oder `60000`. Sondierungen, Chat-Nachschlagungen, Reaktionen, Bearbeitungen und Health-Checks behalten derzeit den kürzeren Standardwert von 10 s; eine Ausweitung auf Reaktionen und Bearbeitungen ist als Folgearbeit geplant. Override pro Konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur, wenn `textChunkLimit` überschritten wird; `newline` teilt an Leerzeilen (Absatzgrenzen) vor dem Chunking nach Länge.
- `channels.bluebubbles.mediaMaxMb`: Limit für eingehende/ausgehende Medien in MB (Standard: 8).
- `channels.bluebubbles.mediaLocalRoots`: Explizite Allowlist absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade erlaubt sind. Das Senden lokaler Pfade wird standardmäßig verweigert, sofern dies nicht konfiguriert ist. Override pro Konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Aufeinanderfolgende DM-Webhooks desselben Absenders zu einem Agenten-Turn zusammenführen, damit Apples Aufteilung von Text+URL als einzelne Nachricht ankommt (Standard: `false`). Siehe [Aufspalten in DMs zusammenführen](#coalescing-split-send-dms-command--url-in-one-composition) für Szenarien, Fensterabstimmung und Abwägungen. Erweitert das Standard-Debounce-Fenster für eingehende Nachrichten von 500 ms auf 2500 ms, wenn aktiviert und ohne explizites `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: Maximale Anzahl von Gruppennachrichten für den Kontext (0 deaktiviert).
- `channels.bluebubbles.dmHistoryLimit`: Verlaufslimit für DMs.
- `channels.bluebubbles.actions`: Bestimmte Aktionen aktivieren/deaktivieren.
- `channels.bluebubbles.accounts`: Konfiguration für mehrere Konten.

Verwandte globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressierung / Zustellungsziele

Bevorzugen Sie `chat_guid` für stabiles Routing:

- `chat_guid:iMessage;-;+15555550123` (bevorzugt für Gruppen)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn für ein direktes Handle kein bestehender DM-Chat vorhanden ist, erstellt OpenClaw einen über `POST /api/v1/chat/new`. Dafür muss die BlueBubbles Private API aktiviert sein.

### iMessage- vs. SMS-Routing

Wenn dasselbe Handle auf dem Mac sowohl einen iMessage- als auch einen SMS-Chat hat (zum Beispiel eine Telefonnummer, die für iMessage registriert ist, aber auch Green-Bubble-Fallbacks erhalten hat), bevorzugt OpenClaw den iMessage-Chat und stuft nie stillschweigend auf SMS herab. Um den SMS-Chat zu erzwingen, verwenden Sie ein explizites `sms:`-Zielpräfix (zum Beispiel `sms:+15555550123`). Handles ohne passenden iMessage-Chat werden weiterhin über den Chat gesendet, den BlueBubbles meldet.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem Query-Parameter oder Header `guid`/`password` mit `channels.bluebubbles.password` verglichen werden.
- Halten Sie das API-Passwort und den Webhook-Endpunkt geheim (behandeln Sie sie wie Zugangsdaten).
- Es gibt keinen localhost-Bypass für die BlueBubbles-Webhook-Authentifizierung. Wenn Sie Webhook-Datenverkehr per Proxy weiterleiten, behalten Sie das BlueBubbles-Passwort Ende-zu-Ende in der Anfrage bei. `gateway.trustedProxies` ersetzt hier nicht `channels.bluebubbles.password`. Siehe [Gateway-Sicherheit](/de/gateway/security#reverse-proxy-configuration).
- Aktivieren Sie HTTPS + Firewall-Regeln auf dem BlueBubbles-Server, wenn Sie ihn außerhalb Ihres LAN verfügbar machen.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfen Sie die BlueBubbles-Webhook-Logs und verifizieren Sie, dass der Gateway-Pfad mit `channels.bluebubbles.webhookPath` übereinstimmt.
- Kopplungscodes laufen nach einer Stunde ab; verwenden Sie `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die BlueBubbles Private API (`POST /api/v1/message/react`); stellen Sie sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückziehen erfordern macOS 13+ und eine kompatible BlueBubbles-Serverversion. Auf macOS 26 (Tahoe) ist das Bearbeiten derzeit aufgrund von Änderungen an der Private API kaputt.
- Aktualisierungen von Gruppensymbolen können auf macOS 26 (Tahoe) instabil sein: Die API kann Erfolg zurückgeben, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekannte kaputte Aktionen basierend auf der macOS-Version des BlueBubbles-Servers automatisch aus. Wenn Bearbeiten auf macOS 26 (Tahoe) trotzdem erscheint, deaktivieren Sie es manuell mit `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ist aktiviert, aber Split-Sends (z. B. `Dump` + URL) kommen weiterhin als zwei Turns an: siehe die Checkliste [Fehlerbehebung bei der Split-Send-Zusammenführung](#split-send-coalescing-troubleshooting) — häufige Ursachen sind ein zu enges Debounce-Fenster, als Webhook-Ankunft fehlgelesene Zeitstempel aus Sitzungslogs oder eine Antwort-Zitat-Sendung (die `replyToBody` verwendet, nicht einen zweiten Webhook).
- Für Status-/Health-Informationen: `openclaw status --all` oder `openclaw status --deep`.

Eine allgemeine Referenz zum Kanal-Workflow finden Sie unter [Kanäle](/de/channels) und im Leitfaden [Plugins](/de/tools/plugin).

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
