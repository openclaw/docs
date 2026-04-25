---
read_when:
    - BlueBubbles-Kanal einrichten
    - Fehlerbehebung beim Webhook-Pairing
    - iMessage auf macOS konfigurieren
summary: iMessage über den BlueBubbles-macOS-Server (REST-Senden/-Empfangen, Tippen, Reaktionen, Pairing, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status: gebündeltes Plugin, das über HTTP mit dem BlueBubbles-macOS-Server kommuniziert. **Empfohlen für die iMessage-Integration** aufgrund seiner umfangreicheren API und der einfacheren Einrichtung im Vergleich zum älteren imsg-Kanal.

## Gebündeltes Plugin

Aktuelle OpenClaw-Releases bündeln BlueBubbles, daher benötigen normale paketierte Builds keinen separaten Schritt `openclaw plugins install`.

## Überblick

- Läuft auf macOS über die BlueBubbles-Helfer-App ([bluebubbles.app](https://bluebubbles.app)).
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist auf Tahoe derzeit defekt, und Aktualisierungen von Gruppensymbolen können Erfolg melden, aber nicht synchronisiert werden.
- OpenClaw kommuniziert darüber über seine REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten kommen über Webhooks an; ausgehende Antworten, Tippindikatoren, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen (und nach Möglichkeit dem Agenten bereitgestellt).
- Pairing/Allowlist funktioniert genauso wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Pairing-Codes.
- Reaktionen werden genau wie bei Slack/Telegram als Systemereignisse bereitgestellt, sodass Agenten sie vor einer Antwort „erwähnen“ können.
- Erweiterte Funktionen: Bearbeiten, Zurückziehen, Antwort-Threading, Nachrichteneffekte, Gruppenverwaltung.

## Schnellstart

1. Installiere den BlueBubbles-Server auf deinem Mac (folge den Anweisungen unter [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Aktiviere in der BlueBubbles-Konfiguration die Web-API und lege ein Passwort fest.
3. Führe `openclaw onboard` aus und wähle BlueBubbles aus, oder konfiguriere es manuell:

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

4. Richte die BlueBubbles-Webhooks auf dein Gateway aus (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Starte das Gateway; es registriert den Webhook-Handler und beginnt mit dem Pairing.

Sicherheitshinweis:

- Lege immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw lehnt BlueBubbles-Webhook-Anfragen ab, sofern sie kein Passwort/GUID enthalten, das mit `channels.bluebubbles.password` übereinstimmt (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von der local loopback-/Proxy-Topologie.
- Die Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodys gelesen/geparst werden.

## Messages.app aktiv halten (VM-/Headless-Setups)

In einigen macOS-VM-/Always-on-Setups kann Messages.app in einen „Leerlauf“-Zustand geraten (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund gebracht wird). Eine einfache Umgehung besteht darin, **Messages alle 5 Minuten anzustupsen**, indem ein AppleScript + LaunchAgent verwendet wird.

### 1) Das AppleScript speichern

Speichere dies als:

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

Speichere dies als:

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
- Der erste Lauf kann macOS-**Automation**-Aufforderungen auslösen (`osascript` → Messages). Bestätige sie in derselben Benutzersitzung, in der der LaunchAgent läuft.

Lade es:

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

- **Server-URL** (erforderlich): Adresse des BlueBubbles-Servers (z. B. `http://192.168.1.100:1234`)
- **Passwort** (erforderlich): API-Passwort aus den BlueBubbles-Server-Einstellungen
- **Webhook-Pfad** (optional): Standard ist `/bluebubbles-webhook`
- **DM-Richtlinie**: pairing, allowlist, open oder disabled
- **Allowlist**: Telefonnummern, E-Mail-Adressen oder Chat-Ziele

Du kannst BlueBubbles auch über die CLI hinzufügen:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.bluebubbles.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt sind (Codes laufen nach 1 Stunde ab).
- Genehmigung über:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing ist der Standard-Tokenaustausch. Details: [Pairing](/de/channels/pairing)

Gruppen:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen Auslöser sein kann, wenn `allowlist` gesetzt ist.

### Anreicherung mit Kontaktnamen (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten oft nur rohe Teilnehmeradressen. Wenn du möchtest, dass der `GroupMembers`-Kontext stattdessen lokale Kontaktnamen anzeigt, kannst du unter macOS die Anreicherung aus lokalen Kontakten aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Suche. Standard: `false`.
- Nachschlagevorgänge werden erst ausgeführt, nachdem Gruppenzugriff, Befehlsautorisierung und Mention-Gating die Nachricht zugelassen haben.
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

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`) zur Erkennung von Erwähnungen.
- Wenn `requireMention` für eine Gruppe aktiviert ist, antwortet der Agent nur, wenn er erwähnt wird.
- Steuerbefehle autorisierter Absender umgehen das Mention-Gating.

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
- Autorisierte Absender können Steuerbefehle auch ohne Erwähnung in Gruppen ausführen.

### System-Prompt pro Gruppe

Jeder Eintrag unter `channels.bluebubbles.groups.*` akzeptiert einen optionalen String `systemPrompt`. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt, sodass du Persona oder Verhaltensregeln pro Gruppe festlegen kannst, ohne Agent-Prompts zu bearbeiten:

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

Der Schlüssel entspricht dem, was BlueBubbles als `chatGuid` / `chatIdentifier` / numerische `chatId` für die Gruppe meldet, und ein Wildcard-Eintrag `"*"` liefert einen Standard für jede Gruppe ohne exakte Übereinstimmung (dasselbe Muster wie bei `requireMention` und Tool-Richtlinien pro Gruppe). Exakte Übereinstimmungen haben immer Vorrang vor dem Wildcard-Eintrag. DMs ignorieren dieses Feld; verwende stattdessen Anpassungen auf Agent- oder Kontoebene.

#### Ausgearbeitetes Beispiel: Threaded Replies und Tapback-Reaktionen (Private API)

Wenn die BlueBubbles Private API aktiviert ist, kommen eingehende Nachrichten mit kurzen Nachrichten-IDs an (zum Beispiel `[[reply_to:5]]`), und der Agent kann `action=reply` aufrufen, um in einen bestimmten Thread zu antworten, oder `action=react`, um ein Tapback hinzuzufügen. Ein `systemPrompt` pro Gruppe ist eine zuverlässige Möglichkeit, dafür zu sorgen, dass der Agent das richtige Tool auswählt:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Wenn du in dieser Gruppe antwortest, rufe immer action=reply mit der",
            "[[reply_to:N]]-messageId aus dem Kontext auf, damit deine Antwort",
            "unter der auslösenden Nachricht eingeordnet wird. Sende niemals eine neue nicht verknüpfte Nachricht.",
            "",
            "Verwende für kurze Bestätigungen ('ok', 'verstanden', 'mache ich')",
            "action=react mit einem passenden Tapback-Emoji (❤️, 👍, 😂, ‼️, ❓)",
            "anstatt eine Textantwort zu senden.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback-Reaktionen und Threaded Replies erfordern beide die BlueBubbles Private API; siehe [Erweiterte Aktionen](#advanced-actions) und [Nachrichten-IDs](#message-ids-short-vs-full) für die zugrunde liegende Mechanik.

## ACP-Konversationsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Transportebene zu ändern.

Schneller Operator-Ablauf:

- Führe `/acp spawn codex --bind here` innerhalb des DM- oder zugelassenen Gruppenchats aus.
- Künftige Nachrichten in derselben BlueBubbles-Konversation werden an die gestartete ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte dauerhafte Bindungen werden ebenfalls über übergeordnete `bindings[]`-Einträge mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

`match.peer.id` kann jede unterstützte BlueBubbles-Zielform verwenden:

- normalisierter DM-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Für stabile Gruppenbindungen verwende vorzugsweise `chat_id:*` oder `chat_identifier:*`.

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
- **Tippindikatoren**: OpenClaw sendet Tipp-Start-Ereignisse; BlueBubbles beendet das Tippen automatisch beim Senden oder nach einem Timeout (manuelles Stoppen per DELETE ist unzuverlässig).

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
        edit: true, // gesendete Nachrichten bearbeiten (macOS 13+, defekt auf macOS 26 Tahoe)
        unsend: true, // Nachrichten zurückziehen (macOS 13+)
        reply: true, // Antwort-Threading per Nachrichten-GUID
        sendWithEffect: true, // Nachrichteneffekte (slam, loud usw.)
        renameGroup: true, // Gruppenchats umbenennen
        setGroupIcon: true, // Gruppenchatsymbol/-foto setzen (unzuverlässig auf macOS 26 Tahoe)
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

- **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Die native Tapback-Auswahl von iMessage ist `love`, `like`, `dislike`, `laugh`, `emphasize` und `question`. Wenn ein Agent ein Emoji außerhalb dieser Auswahl wählt (zum Beispiel `👀`), greift das Reaktionstool auf `love` zurück, damit der Tapback trotzdem gerendert wird, anstatt die gesamte Anfrage fehlschlagen zu lassen. Konfigurierte Bestätigungsreaktionen werden weiterhin strikt validiert und geben bei unbekannten Werten einen Fehler aus.
- **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`)
- **unsend**: Eine Nachricht zurückziehen (`messageId`)
- **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`)
- **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`)
- **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`)
- **setGroupIcon**: Das Symbol/Foto eines Gruppenchats setzen (`chatGuid`, `media`) — unzuverlässig auf macOS 26 Tahoe (die API kann Erfolg zurückgeben, aber das Symbol wird nicht synchronisiert).
- **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`)
- **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`)
- **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`)
- **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`)
  - Sprachmemos: Setze `asVoice: true` mit **MP3**- oder **CAF**-Audio, um als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert MP3 → CAF beim Senden von Sprachmemos.
- Älterer Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) anzeigen, um Tokens zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen Anbieter-IDs.
- Kurze IDs liegen im Speicher; sie können nach einem Neustart oder bei Cache-Eviction ablaufen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs führen zu einem Fehler, wenn sie nicht mehr verfügbar sind.

Verwende vollständige IDs für dauerhafte Automatisierungen und Speicherung:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Konfiguration](/de/gateway/configuration) für Template-Variablen.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Split-Send-DMs zusammenführen (Befehl + URL in einer Komposition)

Wenn ein Benutzer in iMessage einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apple das Senden in **zwei separate Webhook-Zustellungen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Einen URL-Vorschau-Ballon (`"https://..."`) mit OG-Vorschaubildern als Anhängen.

Die beiden Webhooks treffen bei OpenClaw auf den meisten Setups mit etwa 0,8–2,0 s Abstand ein. Ohne Zusammenführung erhält der Agent den Befehl allein in Turn 1, antwortet (oft mit „sende mir die URL“) und sieht die URL erst in Turn 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren.

`channels.bluebubbles.coalesceSameSenderDms` aktiviert für eine DM das Zusammenführen aufeinanderfolgender Webhooks desselben Absenders zu einem einzigen Agent-Turn. Gruppenchats bleiben weiterhin nach Nachrichtenschlüssel getrennt, sodass die Turn-Struktur bei mehreren Benutzern erhalten bleibt.

### Wann aktivieren

Aktiviere dies, wenn:

- du Skills auslieferst, die `Befehl + Payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
- deine Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
- du die zusätzliche DM-Turn-Latenz akzeptieren kannst (siehe unten).

Lass es deaktiviert, wenn:

- du minimale Befehlslatenz für einwortige DM-Trigger benötigst.
- alle deine Abläufe One-Shot-Befehle ohne nachfolgende Payloads sind.

### Aktivieren

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // Opt-in (Standard: false)
    },
  },
}
```

Wenn das Flag aktiviert ist und kein explizites `messages.inbound.byChannel.bluebubbles` gesetzt ist, erweitert sich das Debounce-Fenster auf **2500 ms** (der Standard ohne Zusammenführung beträgt 500 ms). Das größere Fenster ist erforderlich — Apples Split-Send-Takt von 0,8–2,0 s passt nicht in den engeren Standardwert.

So passt du das Fenster selbst an:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms funktionieren für die meisten Setups; erhöhe auf 4000 ms,
        // wenn dein Mac langsam ist oder unter Speicherdruck steht
        // (die beobachtete Lücke kann dann über 2 s hinausgehen).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Abwägungen

- **Zusätzliche Latenz für DM-Steuerbefehle.** Wenn das Flag aktiviert ist, warten DM-Steuerbefehle (wie `Dump`, `Save` usw.) nun bis zur Debounce-Dauer, falls ein Payload-Webhook folgt. Befehle in Gruppenchats werden weiterhin sofort gesendet.
- **Zusammengeführte Ausgabe ist begrenzt** — zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge auf 10 (darüber hinaus werden erster und letzter beibehalten). Jede `messageId` der Quelle erreicht weiterhin die Inbound-Deduplizierung, sodass ein späteres MessagePoller-Replay eines einzelnen Ereignisses als Duplikat erkannt wird.
- **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) bleiben unberührt.

### Szenarien und was der Agent sieht

| Benutzer verfasst                                                  | Apple liefert            | Flag aus (Standard)                     | Flag an + 2500-ms-Fenster                                              |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (ein Sendevorgang)                      | 2 Webhooks mit ~1 s Abstand | Zwei Agent-Turns: „Dump“ allein, dann URL | Ein Turn: zusammengeführter Text `Dump https://example.com`            |
| `Save this 📎image.jpg caption` (Anhang + Text)                    | 2 Webhooks               | Zwei Turns                              | Ein Turn: Text + Bild                                                  |
| `/status` (eigenständiger Befehl)                                  | 1 Webhook                | Sofortige Zustellung                    | **Wartet bis zum Fensterende, dann Zustellung**                        |
| URL allein eingefügt                                               | 1 Webhook                | Sofortige Zustellung                    | Sofortige Zustellung (nur ein Eintrag im Bucket)                       |
| Text + URL als zwei absichtlich getrennte Nachrichten, Minuten auseinander gesendet | 2 Webhooks außerhalb des Fensters | Zwei Turns                              | Zwei Turns (Fenster läuft dazwischen ab)                               |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Webhooks               | N Turns                                 | Ein Turn, begrenzte Ausgabe (erster + letzter, Text-/Anhangsgrenzen angewendet) |

### Fehlerbehebung bei der Split-Send-Zusammenführung

Wenn das Flag aktiviert ist und Split-Sends trotzdem als zwei Turns ankommen, prüfe jede Ebene:

1. **Konfiguration tatsächlich geladen.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Dann `openclaw gateway restart` — das Flag wird beim Erstellen der Debouncer-Registry gelesen.

2. **Debounce-Fenster breit genug für dein Setup.** Sieh dir das BlueBubbles-Server-Log unter `~/Library/Logs/bluebubbles-server/main.log` an:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Miss die Lücke zwischen der Text-Zustellung im Stil von `"Dump"` und der darauf folgenden Zustellung `"https://..."; Attachments:`. Erhöhe `messages.inbound.byChannel.bluebubbles`, sodass diese Lücke sicher abgedeckt ist.

3. **Session-JSONL-Zeitstempel ≠ Webhook-Ankunft.** Zeitstempel von Session-Ereignissen (`~/.openclaw/agents/<id>/sessions/*.jsonl`) geben wieder, wann das Gateway eine Nachricht an den Agenten übergibt, **nicht**, wann der Webhook angekommen ist. Eine in der Warteschlange stehende zweite Nachricht mit dem Tag `[Queued messages while agent was busy]` bedeutet, dass Turn 1 noch lief, als der zweite Webhook ankam — der Coalesce-Bucket war bereits geleert. Passe das Fenster anhand des BB-Server-Logs an, nicht anhand des Session-Logs.

4. **Speicherdruck verlangsamt die Antwortzustellung.** Auf kleineren Maschinen (8 GB) können Agent-Turns lange genug dauern, dass der Coalesce-Bucket geleert wird, bevor die Antwort abgeschlossen ist, und die URL als zweiter Turn in der Warteschlange landet. Prüfe `memory_pressure` und `ps -o rss -p $(pgrep openclaw-gateway)`; wenn das Gateway über etwa 500 MB RSS liegt und der Komprimierer aktiv ist, schließe andere speicherintensive Prozesse oder wechsle zu einem größeren Host.

5. **Reply-Quote-Sendungen sind ein anderer Pfad.** Wenn der Benutzer `Dump` als **Antwort** auf einen bestehenden URL-Ballon getippt hat (iMessage zeigt auf der Dump-Blase ein Abzeichen „1 Reply“), steht die URL in `replyToBody`, nicht in einem zweiten Webhook. Zusammenführung gilt hier nicht — das ist ein Thema für Skill/Prompt, nicht für Debouncer.

## Block-Streaming

Steuere, ob Antworten als einzelne Nachricht gesendet oder in Blöcken gestreamt werden:

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
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` gestückelt (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.bluebubbles.enabled`: Den Kanal aktivieren/deaktivieren.
- `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles-REST-API.
- `channels.bluebubbles.password`: API-Passwort.
- `channels.bluebubbles.webhookPath`: Pfad des Webhook-Endpunkts (Standard: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
- `channels.bluebubbles.allowFrom`: DM-Allowlist (Handles, E-Mails, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Allowlist für Gruppenabsender.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Unter macOS unbenannte Gruppenteilnehmer nach erfolgreichem Gating optional aus lokalen Kontakten anreichern. Standard: `false`.
- `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).
- `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
- `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; erforderlich für Streaming-Antworten).
- `channels.bluebubbles.textChunkLimit`: Größe ausgehender Blöcke in Zeichen (Standard: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Timeout pro Anfrage in ms für ausgehende Textsendungen über `/api/v1/message/text` (Standard: 30000). Auf macOS-26-Setups erhöhen, bei denen iMessage-Sendungen über die Private API im iMessage-Framework für 60+ Sekunden hängen können; zum Beispiel `45000` oder `60000`. Probes, Chat-Lookups, Reaktionen, Bearbeitungen und Health-Checks verwenden derzeit weiterhin den kürzeren 10-Sekunden-Standard; eine Ausweitung auf Reaktionen und Bearbeitungen ist als Follow-up geplant. Override pro Konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur bei Überschreitung von `textChunkLimit`; `newline` teilt an Leerzeilen (Absatzgrenzen) vor der Längenteilung.
- `channels.bluebubbles.mediaMaxMb`: Medienlimit für eingehende/ausgehende Medien in MB (Standard: 8).
- `channels.bluebubbles.mediaLocalRoots`: Explizite Allowlist absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade erlaubt sind. Das Senden lokaler Pfade ist standardmäßig verweigert, sofern dies nicht konfiguriert ist. Override pro Konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Führt aufeinanderfolgende DM-Webhooks desselben Absenders zu einem Agent-Turn zusammen, sodass Apples Split-Send von Text+URL als einzelne Nachricht ankommt (Standard: `false`). Siehe [Split-Send-DMs zusammenführen](#coalescing-split-send-dms-command--url-in-one-composition) für Szenarien, Fenstertuning und Abwägungen. Erweitert das Standard-Inbound-Debounce-Fenster von 500 ms auf 2500 ms, wenn es ohne explizites `messages.inbound.byChannel.bluebubbles` aktiviert wird.
- `channels.bluebubbles.historyLimit`: Maximale Anzahl an Gruppennachrichten für den Kontext (0 deaktiviert).
- `channels.bluebubbles.dmHistoryLimit`: DM-Verlaufslimit.
- `channels.bluebubbles.actions`: Bestimmte Aktionen aktivieren/deaktivieren.
- `channels.bluebubbles.accounts`: Multi-Account-Konfiguration.

Verwandte globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressierung / Zustellziele

Bevorzuge `chat_guid` für stabiles Routing:

- `chat_guid:iMessage;-;+15555550123` (bevorzugt für Gruppen)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn ein direktes Handle keinen bestehenden DM-Chat hat, erstellt OpenClaw einen über `POST /api/v1/chat/new`. Dafür muss die BlueBubbles Private API aktiviert sein.

### iMessage- vs. SMS-Routing

Wenn dasselbe Handle auf dem Mac sowohl einen iMessage- als auch einen SMS-Chat hat (zum Beispiel eine Telefonnummer, die für iMessage registriert ist, aber auch Green-Bubble-Fallbacks erhalten hat), bevorzugt OpenClaw den iMessage-Chat und stuft niemals stillschweigend auf SMS herab. Um den SMS-Chat zu erzwingen, verwende einen expliziten Zielpräfix `sms:` (zum Beispiel `sms:+15555550123`). Handles ohne passenden iMessage-Chat senden weiterhin über den Chat, den BlueBubbles meldet.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem Query-Parameter oder Header `guid`/`password` mit `channels.bluebubbles.password` verglichen werden.
- Halte das API-Passwort und den Webhook-Endpunkt geheim (behandle sie wie Zugangsdaten).
- Es gibt keinen localhost-Bypass für die BlueBubbles-Webhook-Authentifizierung. Wenn du Webhook-Traffic per Proxy weiterleitest, muss das BlueBubbles-Passwort Ende-zu-Ende in der Anfrage erhalten bleiben. `gateway.trustedProxies` ersetzt hier nicht `channels.bluebubbles.password`. Siehe [Gateway-Sicherheit](/de/gateway/security#reverse-proxy-configuration).
- Aktiviere HTTPS + Firewall-Regeln auf dem BlueBubbles-Server, wenn du ihn außerhalb deines LAN zugänglich machst.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfe die BlueBubbles-Webhook-Logs und verifiziere, dass der Gateway-Pfad mit `channels.bluebubbles.webhookPath` übereinstimmt.
- Pairing-Codes laufen nach einer Stunde ab; verwende `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die BlueBubbles Private API (`POST /api/v1/message/react`); stelle sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückziehen erfordern macOS 13+ und eine kompatible BlueBubbles-Serverversion. Unter macOS 26 (Tahoe) ist Bearbeiten derzeit aufgrund von Änderungen an der Private API defekt.
- Aktualisierungen von Gruppensymbolen können unter macOS 26 (Tahoe) unzuverlässig sein: Die API kann Erfolg melden, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekannte defekte Aktionen automatisch anhand der macOS-Version des BlueBubbles-Servers aus. Wenn Bearbeiten unter macOS 26 (Tahoe) weiterhin angezeigt wird, deaktiviere es manuell mit `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ist aktiviert, aber Split-Sends (z. B. `Dump` + URL) kommen weiterhin als zwei Turns an: Siehe die Checkliste zur [Fehlerbehebung bei der Split-Send-Zusammenführung](#split-send-coalescing-troubleshooting) — häufige Ursachen sind ein zu enges Debounce-Fenster, als Webhook-Ankunft missverstandene Session-Log-Zeitstempel oder eine Reply-Quote-Sendung (die `replyToBody` statt eines zweiten Webhooks verwendet).
- Für Status-/Health-Informationen: `openclaw status --all` oder `openclaw status --deep`.

Für allgemeine Referenzen zum Kanal-Workflow siehe [Channels](/de/channels) und den Leitfaden [Plugins](/de/tools/plugin).

## Verwandt

- [Channels-Überblick](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
