---
read_when:
    - BlueBubbles-Kanal einrichten
    - Fehlerbehebung bei der Webhook-Kopplung
    - iMessage unter macOS konfigurieren
sidebarTitle: BlueBubbles
summary: iMessage über den BlueBubbles-macOS-Server (REST-Senden/-Empfangen, Tippanzeige, Reaktionen, Kopplung, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T06:40:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: gebündeltes Plugin, das über HTTP mit dem BlueBubbles-macOS-Server kommuniziert. **Empfohlen für die iMessage-Integration** wegen der umfangreicheren API und der einfacheren Einrichtung im Vergleich zum älteren imsg-Kanal.

<Note>
Aktuelle OpenClaw-Versionen enthalten BlueBubbles, sodass normale paketierte Builds keinen separaten Schritt `openclaw plugins install` benötigen.
</Note>

## Überblick

- Läuft unter macOS über die BlueBubbles-Hilfs-App ([bluebubbles.app](https://bluebubbles.app)).
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist auf Tahoe derzeit defekt, und Aktualisierungen von Gruppensymbolen können Erfolg melden, aber nicht synchronisiert werden.
- OpenClaw kommuniziert damit über seine REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten kommen über Webhooks an; ausgehende Antworten, Tippanzeigen, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen (und dem Agenten nach Möglichkeit bereitgestellt).
- Auto-TTS-Antworten, die MP3- oder CAF-Audio synthetisieren, werden als iMessage-Sprachmemos statt als einfache Dateianhänge zugestellt.
- Pairing/Allowlist funktioniert wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Pairing-Codes.
- Reaktionen werden wie bei Slack/Telegram als Systemereignisse bereitgestellt, sodass Agenten sie vor dem Antworten „erwähnen“ können.
- Erweiterte Funktionen: Bearbeiten, Zurückziehen, Antwort-Threads, Nachrichteneffekte, Gruppenverwaltung.

## Schnellstart

<Steps>
  <Step title="BlueBubbles installieren">
    Installieren Sie den BlueBubbles-Server auf Ihrem Mac (folgen Sie den Anweisungen unter [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Web-API aktivieren">
    Aktivieren Sie in der BlueBubbles-Konfiguration die Web-API und legen Sie ein Passwort fest.
  </Step>
  <Step title="OpenClaw konfigurieren">
    Führen Sie `openclaw onboard` aus und wählen Sie BlueBubbles aus, oder konfigurieren Sie es manuell:

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

  </Step>
  <Step title="Webhooks auf das Gateway richten">
    Richten Sie BlueBubbles-Webhooks auf Ihr Gateway aus (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Gateway starten">
    Starten Sie das Gateway; es registriert den Webhook-Handler und startet das Pairing.
  </Step>
</Steps>

<Warning>
**Sicherheit**

- Legen Sie immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw lehnt BlueBubbles-Webhook-Anfragen ab, sofern sie kein Passwort/guid enthalten, das mit `channels.bluebubbles.password` übereinstimmt (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von local loopback-/Proxy-Topologie.
- Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodys gelesen/geparst werden.

</Warning>

## Messages.app am Leben halten (VM-/Headless-Setups)

Einige macOS-VM-/Always-on-Setups können dazu führen, dass Messages.app „inaktiv“ wird (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund geholt wird). Eine einfache Umgehung besteht darin, **Messages alle 5 Minuten anzustoßen**, mit einem AppleScript + LaunchAgent.

<Steps>
  <Step title="AppleScript speichern">
    Speichern Sie dies als `~/Scripts/poke-messages.scpt`:

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

  </Step>
  <Step title="LaunchAgent installieren">
    Speichern Sie dies als `~/Library/LaunchAgents/com.user.poke-messages.plist`:

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

    Dies läuft **alle 300 Sekunden** und **beim Anmelden**. Der erste Lauf kann macOS-**Automation**-Abfragen auslösen (`osascript` → Messages). Genehmigen Sie diese in derselben Benutzersitzung, die den LaunchAgent ausführt.

  </Step>
  <Step title="Laden">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Einrichtung

BlueBubbles ist in der interaktiven Einrichtung verfügbar:

```
openclaw onboard
```

Der Assistent fragt nach:

<ParamField path="Server URL" type="string" required>
  BlueBubbles-Serveradresse (z. B. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  API-Passwort aus den BlueBubbles-Servereinstellungen.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook-Endpunktpfad.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` oder `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Telefonnummern, E-Mail-Adressen oder Chat-Ziele.
</ParamField>

Sie können BlueBubbles auch per CLI hinzufügen:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Zugriffskontrolle (DMs + Gruppen)

<Tabs>
  <Tab title="DMs">
    - Standard: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt wurden (Codes laufen nach 1 Stunde ab).
    - Genehmigen über:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Pairing ist der standardmäßige Token-Austausch. Details: [Pairing](/de/channels/pairing)

  </Tab>
  <Tab title="Gruppen">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen auslösen kann, wenn `allowlist` gesetzt ist.

  </Tab>
</Tabs>

### Anreicherung von Kontaktnamen (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten oft nur rohe Teilnehmeradressen. Wenn der `GroupMembers`-Kontext stattdessen lokale Kontaktnamen anzeigen soll, können Sie unter macOS die lokale Kontakte-Anreicherung aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Suche. Standard: `false`.
- Suchvorgänge laufen erst, nachdem Gruppenzugriff, Befehlsautorisierung und Erwähnungs-Gating die Nachricht zugelassen haben.
- Nur unbenannte Telefon-Teilnehmer werden angereichert.
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

### Erwähnungs-Gating (Gruppen)

BlueBubbles unterstützt Erwähnungs-Gating für Gruppenchats, passend zum Verhalten von iMessage/WhatsApp:

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`), um Erwähnungen zu erkennen.
- Wenn `requireMention` für eine Gruppe aktiviert ist, antwortet der Agent nur, wenn er erwähnt wird.
- Steuerbefehle von autorisierten Absendern umgehen das Erwähnungs-Gating.

Konfiguration pro Gruppe:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
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

Jeder Eintrag unter `channels.bluebubbles.groups.*` akzeptiert eine optionale `systemPrompt`-Zeichenkette. Der Wert wird bei jeder Runde, die eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt, sodass Sie pro Gruppe Persona- oder Verhaltensregeln festlegen können, ohne Agent-Prompts zu bearbeiten:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

Der Schlüssel entspricht dem, was BlueBubbles für die Gruppe als `chatGuid` / `chatIdentifier` / numerische `chatId` meldet, und ein `"*"`-Wildcard-Eintrag stellt einen Standard für jede Gruppe ohne exakte Übereinstimmung bereit (dasselbe Muster wie bei `requireMention` und Tool-Richtlinien pro Gruppe). Exakte Übereinstimmungen haben immer Vorrang vor der Wildcard. DMs ignorieren dieses Feld; verwenden Sie stattdessen Prompt-Anpassung auf Agent- oder Kontoebene.

#### Durchgearbeitetes Beispiel: Thread-Antworten und Tapback-Reaktionen (Private API)

Wenn die BlueBubbles Private API aktiviert ist, kommen eingehende Nachrichten mit kurzen Nachrichten-IDs an (zum Beispiel `[[reply_to:5]]`), und der Agent kann `action=reply` aufrufen, um in einen Thread zu einer bestimmten Nachricht zu antworten, oder `action=react`, um ein Tapback zu setzen. Ein `systemPrompt` pro Gruppe ist ein zuverlässiger Weg, damit der Agent das richtige Tool auswählt:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback-Reaktionen und Thread-Antworten erfordern beide die BlueBubbles Private API; siehe [Erweiterte Aktionen](#advanced-actions) und [Nachrichten-IDs](#message-ids-short-vs-full) für die zugrunde liegende Funktionsweise.

## ACP-Konversationsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Transportschicht zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des zugelassenen Gruppenchats aus.
- Zukünftige Nachrichten in derselben BlueBubbles-Konversation werden an die erzeugte ACP-Sitzung geleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden ebenfalls über `bindings[]`-Einträge auf oberster Ebene mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

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

Siehe [ACP-Agenten](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Tippen + Lesebestätigungen

- **Eingabeindikatoren**: Werden automatisch vor und während der Antwortgenerierung gesendet.
- **Lesebestätigungen**: Gesteuert über `channels.bluebubbles.sendReadReceipts` (Standard: `true`).
- **Eingabeindikatoren**: OpenClaw sendet Ereignisse für den Beginn der Eingabe; BlueBubbles löscht die Eingabe automatisch beim Senden oder nach Timeout (manuelles Stoppen per DELETE ist unzuverlässig).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
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
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Das native Tapback-Set von iMessage ist `love`, `like`, `dislike`, `laugh`, `emphasize` und `question`. Wenn ein Agent ein Emoji außerhalb dieses Sets auswählt (zum Beispiel `👀`), fällt das Reaktionstool auf `love` zurück, damit der Tapback weiterhin dargestellt wird, statt die gesamte Anfrage fehlschlagen zu lassen. Konfigurierte Ack-Reaktionen werden weiterhin strikt validiert und lösen bei unbekannten Werten einen Fehler aus.
    - **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`).
    - **unsend**: Eine Nachricht zurückrufen (`messageId`).
    - **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`).
    - **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`).
    - **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`).
    - **setGroupIcon**: Icon/Foto eines Gruppenchats festlegen (`chatGuid`, `media`) — unter macOS 26 Tahoe unzuverlässig (die API kann Erfolg zurückgeben, aber das Icon wird nicht synchronisiert).
    - **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`).
    - **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`).
    - **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`).
    - **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`).
      - Sprachnotizen: Setzen Sie `asVoice: true` mit **MP3**- oder **CAF**-Audio, um als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert MP3 → CAF beim Senden von Sprachnotizen.
    - Legacy-Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.

  </Accordion>
</AccordionGroup>

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) anzeigen, um Tokens zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen Provider-IDs.
- Kurze IDs liegen im Arbeitsspeicher; sie können bei Neustart oder Cache-Eviction ablaufen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs verursachen einen Fehler, wenn sie nicht mehr verfügbar sind.

Verwenden Sie vollständige IDs für dauerhafte Automatisierungen und Speicherung:

- Vorlagen: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Konfiguration](/de/gateway/configuration) für Vorlagenvariablen.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Zusammenführen von Split-Send-DMs (Befehl + URL in einer Komposition)

Wenn ein Benutzer in iMessage einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apple den Versand in **zwei separate Webhook-Zustellungen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Sprechblase (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Die beiden Webhooks treffen bei den meisten Setups etwa 0,8-2,0 s auseinander bei OpenClaw ein. Ohne Zusammenführung erhält der Agent in Runde 1 nur den Befehl, antwortet (oft „senden Sie mir die URL“) und sieht die URL erst in Runde 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren.

`channels.bluebubbles.coalesceSameSenderDms` aktiviert für eine DM das Zusammenführen aufeinanderfolgender Webhooks desselben Absenders in eine einzige Agent-Runde. Gruppenchats werden weiterhin pro Nachricht geschlüsselt, damit die Rundenstruktur mit mehreren Benutzern erhalten bleibt.

<Tabs>
  <Tab title="When to enable">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Rundenlatenz akzeptieren können (siehe unten).

    Deaktiviert lassen, wenn:

    - Sie minimale Befehlslatenz für Ein-Wort-DM-Trigger benötigen.
    - Alle Ihre Abläufe einmalige Befehle ohne nachfolgende Payloads sind.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Wenn das Flag aktiv ist und kein explizites `messages.inbound.byChannel.bluebubbles` gesetzt ist, erweitert sich das Debounce-Fenster auf **2500 ms** (der Standard ohne Zusammenführung ist 500 ms). Das breitere Fenster ist erforderlich — Apples Split-Send-Takt von 0,8-2,0 s passt nicht in den engeren Standard.

    So passen Sie das Fenster selbst an:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Zusätzliche Latenz für DM-Steuerbefehle.** Wenn das Flag aktiv ist, warten DM-Steuerbefehlsnachrichten (wie `Dump`, `Save` usw.) nun bis zum Debounce-Fenster, bevor sie weitergeleitet werden, falls ein Payload-Webhook eintrifft. Gruppenchat-Befehle werden weiterhin sofort weitergeleitet.
    - **Die zusammengeführte Ausgabe ist begrenzt** — zusammengeführter Text ist auf 4000 Zeichen mit einer expliziten Markierung `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge auf 10 (darüber hinaus bleiben der erste und der neueste erhalten). Jede Quell-`messageId` erreicht weiterhin die eingehende Deduplizierung, sodass eine spätere MessagePoller-Wiedergabe eines einzelnen Ereignisses als Duplikat erkannt wird.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Benutzer verfasst                                                  | Apple liefert             | Flag aus (Standard)                     | Flag an + 2500-ms-Fenster                                               |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ein Versand)                           | 2 Webhooks ~1 s Abstand   | Zwei Agent-Runden: nur „Dump“, dann URL | Eine Runde: zusammengeführter Text `Dump https://example.com`           |
| `Save this 📎image.jpg caption` (Anhang + Text)                    | 2 Webhooks                | Zwei Runden                             | Eine Runde: Text + Bild                                                 |
| `/status` (eigenständiger Befehl)                                  | 1 Webhook                 | Sofortige Weiterleitung                 | **Bis zum Fenster warten, dann weiterleiten**                           |
| URL allein eingefügt                                               | 1 Webhook                 | Sofortige Weiterleitung                 | Sofortige Weiterleitung (nur ein Eintrag im Bucket)                     |
| Text + URL als zwei absichtliche separate Nachrichten, Minuten auseinander | 2 Webhooks außerhalb des Fensters | Zwei Runden                             | Zwei Runden (Fenster läuft zwischen ihnen ab)                           |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Webhooks                | N Runden                                | Eine Runde, begrenzte Ausgabe (erster + neuester, Text-/Anhangsgrenzen angewendet) |

### Fehlerbehebung für Split-Send-Zusammenführung

Wenn das Flag aktiv ist und Split-Sends weiterhin als zwei Runden eintreffen, prüfen Sie jede Ebene:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Dann `openclaw gateway restart` — das Flag wird beim Erstellen der Debouncer-Registry gelesen.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    Sehen Sie im BlueBubbles-Serverlog unter `~/Library/Logs/bluebubbles-server/main.log` nach:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Messen Sie die Lücke zwischen der Textweiterleitung im Stil von `"Dump"` und der darauf folgenden Weiterleitung `"https://..."; Attachments:`. Erhöhen Sie `messages.inbound.byChannel.bluebubbles`, sodass diese Lücke bequem abgedeckt ist.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    Zeitstempel von Sitzungsereignissen (`~/.openclaw/agents/<id>/sessions/*.jsonl`) spiegeln wider, wann das Gateway eine Nachricht an den Agent übergibt, **nicht**, wann der Webhook eingetroffen ist. Eine als `[Queued messages while agent was busy]` markierte zweite Nachricht in der Warteschlange bedeutet, dass die erste Runde noch lief, als der zweite Webhook eintraf — der Zusammenführungs-Bucket war bereits geleert. Stimmen Sie das Fenster anhand des BB-Serverlogs ab, nicht anhand des Sitzungslogs.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    Auf kleineren Maschinen (8 GB) können Agent-Runden lange genug dauern, dass der Zusammenführungs-Bucket geleert wird, bevor die Antwort abgeschlossen ist, und die URL als zweite Runde in der Warteschlange landet. Prüfen Sie `memory_pressure` und `ps -o rss -p $(pgrep openclaw-gateway)`; wenn das Gateway über ~500 MB RSS liegt und der Kompressor aktiv ist, schließen Sie andere schwere Prozesse oder wechseln Sie auf einen größeren Host.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    Wenn der Benutzer `Dump` als **Antwort** auf eine vorhandene URL-Sprechblase angetippt hat (iMessage zeigt ein „1 Reply“-Badge auf der Dump-Sprechblase), befindet sich die URL in `replyToBody`, nicht in einem zweiten Webhook. Zusammenführung greift hier nicht — das ist eine Skill-/Prompt-Angelegenheit, keine Debouncer-Angelegenheit.
  </Accordion>
</AccordionGroup>

## Block-Streaming

Steuern Sie, ob Antworten als einzelne Nachricht oder in Blöcken gestreamt gesendet werden:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Medien + Grenzwerte

- Eingehende Anhänge werden heruntergeladen und im Medien-Cache gespeichert.
- Medienlimit über `channels.bluebubbles.mediaMaxMb` für eingehende und ausgehende Medien (Standard: 8 MB).
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` aufgeteilt (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: Den Kanal aktivieren/deaktivieren.
    - `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles-REST-API.
    - `channels.bluebubbles.password`: API-Passwort.
    - `channels.bluebubbles.webhookPath`: Pfad des Webhook-Endpunkts (Standard: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM-Allowlist (Handles, E-Mails, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist für Gruppenabsender.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Unter macOS optional unbenannte Gruppenteilnehmer aus lokalen Kontakten anreichern, nachdem die Zugriffskontrolle bestanden wurde. Standard: `false`.
    - `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).

  </Accordion>
  <Accordion title="Zustellung und Chunking">
    - `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
    - `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; für Streaming-Antworten erforderlich).
    - `channels.bluebubbles.textChunkLimit`: Ausgehende Chunk-Größe in Zeichen (Standard: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Zeitlimit pro Anfrage in ms für ausgehende Textsendungen über `/api/v1/message/text` (Standard: 30000). Erhöhen Sie den Wert bei macOS-26-Setups, bei denen Private-API-iMessage-Sendungen innerhalb des iMessage-Frameworks für mehr als 60 Sekunden hängen bleiben können; zum Beispiel `45000` oder `60000`. Probes, Chat-Lookups, Reaktionen, Bearbeitungen und Health Checks behalten derzeit den kürzeren 10-s-Standard bei; eine Ausweitung auf Reaktionen und Bearbeitungen ist als Folgearbeit geplant. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur auf, wenn `textChunkLimit` überschritten wird; `newline` teilt vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen).

  </Accordion>
  <Accordion title="Medien und Verlauf">
    - `channels.bluebubbles.mediaMaxMb`: Obergrenze für eingehende/ausgehende Medien in MB (Standard: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Explizite Allowlist absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade zulässig sind. Sendungen über lokale Pfade werden standardmäßig verweigert, sofern dies nicht konfiguriert ist. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Aufeinanderfolgende DM-Webhooks desselben Absenders zu einer Agent-Runde zusammenführen, sodass Apples getrennte Text+URL-Sendung als eine einzelne Nachricht ankommt (Standard: `false`). Siehe [Zusammenführen geteilter DM-Sendungen](#coalescing-split-send-dms-command--url-in-one-composition) für Szenarien, Fensterabstimmung und Abwägungen. Erweitert bei Aktivierung ohne explizites `messages.inbound.byChannel.bluebubbles` das standardmäßige eingehende Debounce-Fenster von 500 ms auf 2500 ms.
    - `channels.bluebubbles.historyLimit`: Maximale Anzahl an Gruppennachrichten für den Kontext (0 deaktiviert).
    - `channels.bluebubbles.dmHistoryLimit`: DM-Verlaufslimit.
    - `channels.bluebubbles.replyContextApiFallback`: Wenn eine eingehende Antwort ohne `replyToBody`/`replyToSender` eintrifft und der In-Memory-Antwortkontext-Cache einen Miss hat, die ursprüngliche Nachricht als Best-Effort-Fallback aus der BlueBubbles-HTTP-API abrufen (Standard: `false`). Nützlich für Multi-Instanz-Bereitstellungen, die ein BlueBubbles-Konto gemeinsam verwenden, nach Prozessneustarts oder nach Verdrängung aus einem langlebigen TTL/LRU-Cache. Der Abruf ist durch dieselbe Richtlinie SSRF-geschützt wie jede andere BlueBubbles-Client-Anfrage, wirft nie eine Ausnahme und befüllt den Cache, sodass nachfolgende Antworten amortisiert werden. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Eine Einstellung auf Kanalebene wird an Konten weitergegeben, die das Flag weglassen.

  </Accordion>
  <Accordion title="Aktionen und Konten">
    - `channels.bluebubbles.actions`: Bestimmte Aktionen aktivieren/deaktivieren.
    - `channels.bluebubbles.accounts`: Multi-Konto-Konfiguration.

  </Accordion>
</AccordionGroup>

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressierung / Zustellungsziele

Bevorzugen Sie `chat_guid` für stabiles Routing:

- `chat_guid:iMessage;-;+15555550123` (für Gruppen bevorzugt)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn ein direkter Handle keinen vorhandenen DM-Chat hat, erstellt OpenClaw einen über `POST /api/v1/chat/new`. Dafür muss die BlueBubbles Private API aktiviert sein.

### iMessage- vs. SMS-Routing

Wenn derselbe Handle auf dem Mac sowohl einen iMessage- als auch einen SMS-Chat hat (zum Beispiel eine Telefonnummer, die für iMessage registriert ist, aber auch Green-Bubble-Fallbacks empfangen hat), bevorzugt OpenClaw den iMessage-Chat und stuft nie stillschweigend auf SMS herab. Um den SMS-Chat zu erzwingen, verwenden Sie ein explizites Zielpräfix `sms:` (zum Beispiel `sms:+15555550123`). Handles ohne passenden iMessage-Chat senden weiterhin über den Chat, den BlueBubbles meldet.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem `guid`/`password`-Query-Parameter oder -Header mit `channels.bluebubbles.password` verglichen werden.
- Halten Sie das API-Passwort und den Webhook-Endpunkt geheim (behandeln Sie sie wie Zugangsdaten).
- Für die BlueBubbles-Webhook-Authentifizierung gibt es keinen localhost-Bypass. Wenn Sie Webhook-Traffic proxyn, behalten Sie das BlueBubbles-Passwort durchgehend auf der Anfrage bei. `gateway.trustedProxies` ersetzt hier nicht `channels.bluebubbles.password`. Siehe [Gateway-Sicherheit](/de/gateway/security#reverse-proxy-configuration).
- Aktivieren Sie HTTPS und Firewall-Regeln auf dem BlueBubbles-Server, wenn Sie ihn außerhalb Ihres LAN verfügbar machen.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfen Sie die BlueBubbles-Webhook-Logs und verifizieren Sie, dass der Gateway-Pfad mit `channels.bluebubbles.webhookPath` übereinstimmt.
- Kopplungscodes laufen nach einer Stunde ab; verwenden Sie `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die private BlueBubbles-API (`POST /api/v1/message/react`); stellen Sie sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückziehen erfordern macOS 13+ und eine kompatible BlueBubbles-Serverversion. Unter macOS 26 (Tahoe) ist Bearbeiten aufgrund von Änderungen an der privaten API derzeit defekt.
- Aktualisierungen von Gruppensymbolen können unter macOS 26 (Tahoe) unzuverlässig sein: Die API kann Erfolg zurückgeben, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekannte defekte Aktionen basierend auf der macOS-Version des BlueBubbles-Servers automatisch aus. Wenn Bearbeiten unter macOS 26 (Tahoe) weiterhin angezeigt wird, deaktivieren Sie es manuell mit `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ist aktiviert, aber geteilte Sendungen (z. B. `Dump` + URL) kommen weiterhin als zwei Runden an: siehe die Checkliste zur [Fehlerbehebung beim Zusammenführen geteilter Sendungen](#split-send-coalescing-troubleshooting) — häufige Ursachen sind ein zu enges Debounce-Fenster, Sitzungsprotokoll-Zeitstempel, die fälschlich als Webhook-Eingang interpretiert werden, oder eine Antwortzitat-Sendung (die `replyToBody` verwendet, nicht einen zweiten Webhook).
- Für Status-/Integritätsinformationen: `openclaw status --all` oder `openclaw status --deep`.

Eine allgemeine Referenz zum Kanal-Workflow finden Sie unter [Kanäle](/de/channels) und im Leitfaden [Plugins](/de/tools/plugin).

## Verwandt

- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
